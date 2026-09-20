/**
 * photo-service.js - Shared photo handling for Orford Live
 * =========================================================
 * Consolidates the photo pipelines currently duplicated across:
 *   pages/infraction-report.html      (uploadPhoto + compressImage)
 *   pages/signalisation-report.html   (uploadPhoto + compressImage - verbatim copy)
 *   pages/inspection-trail-report.html   (inline EXIF + Promise.all upload)
 *   pages/inspection-shelter-report.html (inline EXIF + Promise.all upload)
 *
 * COMPRESSION
 * -----------
 * All four modules now compress anything over 1MB to 1200px wide at q0.7.
 * EXIF is read from the ORIGINAL file before compression, so GPS and capture
 * time still reach Firestore. The stored JPEG itself carries no EXIF, since a
 * canvas re-encode drops it - this already applied to infraction and
 * signalisation and is why coordinates live in the document, not the file.
 *
 * PRESERVES EXISTING BEHAVIOUR ON PURPOSE
 * ---------------------------------------
 * Storage paths are kept per-module, byte-for-byte identical to what each page
 * writes today. Do not "tidy" these: pages/inspection-admin.html scans
 * storage.ref('inspections/trails') and storage.ref('inspections/shelters')
 * for orphan cleanup. Any new path scheme would place photos outside the
 * scanned tree and the cleanup tool would stop seeing them.
 *
 * Filenames are also passed through unsanitised, matching current behaviour.
 * Set sanitize:true per call only if you have verified nothing depends on the
 * raw name.
 *
 * BACKWARD COMPATIBILITY ON READ
 * ------------------------------
 * Four shapes exist in Firestore across seasons:
 *   photos: ["https://...", ...]                        legacy inspections
 *   photos: [{url, filename, coordinates, timestamp}]    current, all modules
 *   photoUrl: "https://..."                              legacy signalisation
 *   offenderImageUrl: "https://..."                      legacy infraction
 *
 * Legacy single-URL records kept their GPS in a sibling scalar field
 * (coordinates / offenderImageCoordinates). photosFrom() reattaches it so old
 * records still produce map pins.
 *
 * Nothing here rewrites stored documents.
 *
 * DEPENDENCIES
 *   firebase compat SDK (storage) via js/core/firebase-loader.js
 *   exif-js (optional) - degrades to null coordinates when absent
 *
 * USAGE
 *   <script src="../js/services/photo-service.js"></script>
 */

(function (global) {
  'use strict';

  // ─── Module profiles: existing conventions, do not change lightly ──────────

  var MODULES = {
    infraction: {
      path: function (o) {
        return 'infractions/' + o.userId + '/' + o.stamp + '_' + o.filename;
      },
      compress: { overBytes: 1024 * 1024, quality: 0.7, maxWidth: 1200 },
      parallel: false
    },
    signalisation: {
      path: function (o) {
        return 'signalisations/' + o.userId + '/' + o.stamp + '_' + o.filename;
      },
      compress: { overBytes: 1024 * 1024, quality: 0.7, maxWidth: 1200 },
      parallel: false
    },
    'inspection-trail': {
      path: function (o) {
        return 'inspections/trails/' + o.recordId + '/' + o.index + '-' + o.filename;
      },
      // Enabled deliberately (was full-size). Same rule as the other modules:
      // trail inspections are filed from the mountain over cell service, and
      // ten 10MB photos was the worst case.
      compress: { overBytes: 1024 * 1024, quality: 0.7, maxWidth: 1200 },
      parallel: true
    },
    'inspection-shelter': {
      path: function (o) {
        return 'inspections/shelters/' + o.recordId + '/' + o.index + '-' + o.filename;
      },
      compress: { overBytes: 1024 * 1024, quality: 0.7, maxWidth: 1200 },
      parallel: true
    }
  };

  var LEGACY_URL_FIELDS = [
    { url: 'photoUrl', coords: 'coordinates' },              // signalisation
    { url: 'offenderImageUrl', coords: 'offenderImageCoordinates' } // infraction
  ];

  // ─── Internal helpers ──────────────────────────────────────────────────────

  function getStorage() {
    if (global.storage) return global.storage;
    if (global.firebase && typeof global.firebase.storage === 'function') {
      return global.firebase.storage();
    }
    throw new Error('Firebase Storage non initialise');
  }

  function profileFor(moduleName) {
    var p = MODULES[moduleName];
    if (!p) throw new Error('Module photo inconnu: ' + moduleName);
    return p;
  }

  function filenameFromUrl(url) {
    if (!url || typeof url !== 'string') return 'photo.jpg';
    try {
      var path = url.split('?')[0];
      var last = decodeURIComponent(path.substring(path.lastIndexOf('/') + 1));
      var slash = last.lastIndexOf('/');
      if (slash !== -1) last = last.substring(slash + 1);
      return last || 'photo.jpg';
    } catch (e) {
      return 'photo.jpg';
    }
  }

  function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value.toDate === 'function') {
      try { return value.toDate(); } catch (e) { return null; }
    }
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // ─── EXIF ──────────────────────────────────────────────────────────────────

  function extractExifData(file) {
    return new Promise(function (resolve) {
      if (typeof global.EXIF === 'undefined') { resolve(null); return; }
      try {
        global.EXIF.getData(file, function () {
          var tags = global.EXIF.getAllTags(this);
          resolve(tags && Object.keys(tags).length > 0 ? tags : null);
        });
      } catch (e) { resolve(null); }
    });
  }

  function extractGpsFromExif(exifData) {
    if (!exifData) return null;
    var lat = exifData.GPSLatitude, latRef = exifData.GPSLatitudeRef;
    var lon = exifData.GPSLongitude, lonRef = exifData.GPSLongitudeRef;
    if (!lat || !lon || !latRef || !lonRef) return null;
    try {
      var toDecimal = function (dms, ref) {
        var part = function (v) {
          return (typeof v === 'object' && v !== null) ? v.numerator / v.denominator : v;
        };
        var dec = part(dms[0]) + part(dms[1]) / 60 + part(dms[2]) / 3600;
        if (ref === 'S' || ref === 'W') dec = -dec;
        return Math.round(dec * 1000000) / 1000000;
      };
      return { latitude: toDecimal(lat, latRef), longitude: toDecimal(lon, lonRef) };
    } catch (e) { return null; }
  }

  function extractTimestampFromExif(exifData) {
    if (!exifData) return null;
    var dateStr = exifData.DateTimeOriginal || exifData.DateTime;
    if (!dateStr) return null;
    try {
      var parts = dateStr.split(' ');
      var d = parts[0].split(':');
      var t = parts[1].split(':');
      var parsed = new Date(d[0], d[1] - 1, d[2], t[0], t[1], t[2]);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (e) { return null; }
  }

  async function readExif(file) {
    try {
      var exif = await extractExifData(file);
      return {
        coordinates: extractGpsFromExif(exif),
        timestamp: extractTimestampFromExif(exif)
      };
    } catch (e) {
      console.warn('EXIF extraction failed:', e);
      return { coordinates: null, timestamp: null };
    }
  }

  // ─── Compression ───────────────────────────────────────────────────────────

  /**
   * Same canvas resize used today by infraction and signalisation.
   * Resolves to the original file if the browser cannot produce a blob.
   */
  function compressImage(file, quality, maxWidth) {
    return new Promise(function (resolve) {
      var objectUrl = null;
      var finish = function (result) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(result);
      };
      try {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.onload = function () {
          try {
            var w = img.naturalWidth || img.width;
            var h = img.naturalHeight || img.height;
            if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(function (blob) {
              // Free the backing store immediately - iOS Safari counts total
              // live canvas area against a hard limit.
              canvas.width = 1;
              canvas.height = 1;
              finish(blob || file);
            }, 'image/jpeg', quality);
          } catch (e) {
            console.warn('Compression echouee, envoi de l\'original:', e);
            finish(file);
          }
        };
        img.onerror = function () { finish(file); };
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (e) {
        finish(file);
      }
    });
  }

  async function maybeCompress(file, rule) {
    if (!rule || file.size <= rule.overBytes) return file;
    return compressImage(file, rule.quality, rule.maxWidth);
  }

  // ─── Reading ───────────────────────────────────────────────────────────────

  /**
   * Normalises one stored photo value. `fallbackCoords` supplies GPS for
   * legacy single-URL records that kept it in a sibling scalar field.
   * `legacy:true` means "EXIF was never captured", not "photo had no GPS".
   */
  function normalizePhoto(raw, fallbackCoords) {
    if (!raw) return null;

    if (typeof raw === 'string') {
      return {
        url: raw,
        filename: filenameFromUrl(raw),
        coordinates: fallbackCoords || null,
        timestamp: null,
        legacy: true
      };
    }

    if (typeof raw === 'object' && raw.url) {
      return {
        url: raw.url,
        filename: raw.filename || filenameFromUrl(raw.url),
        coordinates: raw.coordinates || null,
        timestamp: toDate(raw.timestamp),
        legacy: false
      };
    }

    return null;
  }

  /**
   * Every photo on a document, whatever era wrote it.
   * Read paths should call this instead of touching doc.photos directly -
   * it replaces the `typeof p === 'string' ? p : p.url` checks scattered
   * across inspection-history, inspection-admin and inspection-dashboard.
   */
  function photosFrom(docData) {
    if (!docData) return [];

    var out = [];
    var seen = {};

    function push(photo) {
      if (photo && photo.url && !seen[photo.url]) {
        seen[photo.url] = true;
        out.push(photo);
      }
    }

    if (Array.isArray(docData.photos)) {
      docData.photos.forEach(function (p) {
        push(normalizePhoto(p, docData.coordinates || null));
      });
    }

    LEGACY_URL_FIELDS.forEach(function (field) {
      if (docData[field.url]) {
        push(normalizePhoto(docData[field.url], docData[field.coords] || null));
      }
    });

    return out;
  }

  function firstPhotoUrl(docData) {
    var photos = photosFrom(docData);
    return photos.length ? photos[0].url : null;
  }

  /**
   * The scalar GPS mirror that infraction and signalisation still write for
   * map-marker retrocompat. Keep writing it until the map reads photos[].
   */
  function primaryCoordinates(photos) {
    if (!photos || !photos.length) return null;
    return photos[0].coordinates || null;
  }

  /**
   * Converts service records into the exact shape the pages store today,
   * with Firestore Timestamps. Replaces the repeated .map() in every submit
   * and modify handler.
   */
  function toFirestore(photos) {
    var TS = global.firebase && global.firebase.firestore
      ? global.firebase.firestore.Timestamp
      : null;

    return (photos || []).map(function (p) {
      return {
        url: p.url,
        filename: p.filename,
        coordinates: p.coordinates || null,
        timestamp: (p.timestamp && TS) ? TS.fromDate(p.timestamp) : null
      };
    });
  }

  // ─── Writing ───────────────────────────────────────────────────────────────

  /**
   * Phase 1: read EXIF and compress. Always sequential - a canvas resize is
   * the memory-hungry part, and iOS Safari caps total live canvas area, so
   * four at once on a 12MP iPhone photo can fail (toBlob returns null and the
   * original gets uploaded instead).
   */
  async function prepareOne(file, moduleName, options) {
    var profile = profileFor(moduleName);
    var exif = await readExif(file);
    var rule = (options.compress === undefined) ? profile.compress : options.compress;
    var payload = await maybeCompress(file, rule);
    return { file: file, payload: payload, exif: exif };
  }

  /**
   * Phase 2: the network put. Safe to run in parallel - it is I/O, not memory.
   */
  async function putOne(prepared, moduleName, options, index) {
    var profile = profileFor(moduleName);
    var storageRef = getStorage();

    var path = profile.path({
      userId: options.userId,
      recordId: options.recordId,
      stamp: options.stamp,
      index: index,
      filename: prepared.file.name
    });

    var ref = storageRef.ref(path);
    await ref.put(prepared.payload);
    var url = await ref.getDownloadURL();

    return {
      url: url,
      filename: prepared.file.name,
      coordinates: prepared.exif.coordinates,
      timestamp: prepared.exif.timestamp,
      legacy: false
    };
  }

  /**
   * Uploads File objects for one module.
   *
   * @param {File[]} files
   * @param {string} moduleName  'infraction' | 'signalisation'
   *                             | 'inspection-trail' | 'inspection-shelter'
   * @param {Object} options
   *   userId     {string}   required for infraction / signalisation paths
   *   recordId   {string}   required for inspection paths
   *   stamp      {number}   optional - defaults to Date.now()
   *   compress   {Object|null} optional - overrides the module default
   *   parallel   {boolean}  optional - overrides the module default
   *   onProgress {Function} optional - (done, total)
   * @returns {Promise<Array>} photo records (not yet Firestore-shaped)
   */
  async function uploadFiles(files, moduleName, options) {
    options = options || {};
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return [];

    var profile = profileFor(moduleName);
    var opts = {
      userId: options.userId,
      recordId: options.recordId,
      stamp: options.stamp || Date.now(),
      compress: options.compress
    };

    var parallel = (options.parallel === undefined) ? profile.parallel : options.parallel;
    var done = 0;

    var tick = function () {
      done += 1;
      if (typeof options.onProgress === 'function') options.onProgress(done, list.length);
    };

    // Phase 1 - always sequential (canvas memory).
    var prepared = [];
    for (var p = 0; p < list.length; p++) {
      prepared.push(await prepareOne(list[p], moduleName, opts));
    }

    // Phase 2 - parallel where the module allows it (network only).
    if (parallel) {
      return Promise.all(prepared.map(async function (item, i) {
        var rec = await putOne(item, moduleName, opts, i);
        tick();
        return rec;
      }));
    }

    var out = [];
    for (var i = 0; i < prepared.length; i++) {
      out.push(await putOne(prepared[i], moduleName, opts, i));
      tick();
    }
    return out;
  }

  /**
   * Uploads a PhotoPicker's pending files, marks them uploaded, and returns
   * the complete set (previously uploaded + new). Replaces the identical
   * for-loop at the top of every submit and modify handler.
   */
  async function uploadFromPicker(picker, moduleName, options) {
    if (!picker) return [];

    var existing = picker.getUploadedPhotos ? picker.getUploadedPhotos() : [];
    var pending = picker.getPendingFiles ? picker.getPendingFiles() : [];

    if (!pending.length) {
      return existing.map(function (p) { return normalizePhoto(p); }).filter(Boolean);
    }

    var uploaded = await uploadFiles(
      pending.map(function (p) { return p.file; }),
      moduleName,
      options
    );

    uploaded.forEach(function (photo) {
      if (picker.markAsUploaded) picker.markAsUploaded(photo.filename, photo.url);
    });

    return (picker.getUploadedPhotos ? picker.getUploadedPhotos() : existing.concat(uploaded))
      .map(function (p) { return normalizePhoto(p); })
      .filter(Boolean);
  }

  // ─── Deleting ──────────────────────────────────────────────────────────────

  /**
   * Deletes photos from Storage. Accepts any stored shape, so it works on
   * legacy records. Failures are logged, never thrown - a missing file must
   * not block deleting the document that points at it.
   */
  async function deletePhotos(photos) {
    var list = (Array.isArray(photos) ? photos : [photos])
      .map(function (p) { return normalizePhoto(p); })
      .filter(Boolean);

    if (!list.length) return { deleted: 0, failed: 0 };

    var storageRef = getStorage();

    var outcomes = await Promise.allSettled(list.map(function (photo) {
      return storageRef.refFromURL(photo.url).delete().catch(function (e) {
        console.warn('Suppression de photo echouee: ' + photo.url, e);
        throw e;
      });
    }));

    var deleted = outcomes.filter(function (o) { return o.status === 'fulfilled'; }).length;
    return { deleted: deleted, failed: outcomes.length - deleted };
  }

  function deletePhotosFrom(docData) {
    return deletePhotos(photosFrom(docData));
  }

  /**
   * Every photo URL on a document - for inspection-admin's orphan scanner,
   * which currently repeats the string/object check twice.
   */
  function urlsFrom(docData) {
    return photosFrom(docData).map(function (p) { return p.url; });
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  global.PhotoService = {
    MODULES: MODULES,
    // reading
    normalizePhoto: normalizePhoto,
    photosFrom: photosFrom,
    firstPhotoUrl: firstPhotoUrl,
    urlsFrom: urlsFrom,
    primaryCoordinates: primaryCoordinates,
    toFirestore: toFirestore,
    // exif
    readExif: readExif,
    extractExifData: extractExifData,
    extractGpsFromExif: extractGpsFromExif,
    extractTimestampFromExif: extractTimestampFromExif,
    // writing
    compressImage: compressImage,
    uploadFiles: uploadFiles,
    uploadFromPicker: uploadFromPicker,
    // deleting
    deletePhotos: deletePhotos,
    deletePhotosFrom: deletePhotosFrom
  };

})(typeof window !== 'undefined' ? window : this);