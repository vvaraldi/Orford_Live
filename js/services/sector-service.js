/**
 * sector-service.js - Sectors and their trails, from Firestore
 * ============================================================
 * One source for the sector -> trail lists used by the infraction and
 * signalisation apps (they used to keep their own hardcoded copies).
 *
 * Firestore `sectors/{id}`:
 *   name     "Mont Giroux Nord"
 *   network  "ski"                       (an id of APP_CONFIG.networks)
 *   order    2                           (position in the dropdown, per network)
 *   trails   ["Magog", "Familiale", ...] (piste / trail names)
 *   aliases  ["giroux-nord"]             (older ids that records may still carry)
 *
 * Records store the sector id and the trail name. Look a sector up with find()
 * so an old alias still resolves to the current sector.
 *
 * Requires: firebase-loader.js + auth.js (window.db), config.js (APP_CONFIG).
 * Load it after auth.js.
 */
(function (global) {
  'use strict';

  var cache = null; // Promise<Sector[]>, one read per page

  function compare(a, b) {
    return (a.network || '').localeCompare(b.network || '') ||
      ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order)) ||
      (a.name || '').localeCompare(b.name || '', 'fr');
  }

  /**
   * Every sector of every network, sorted by network then order.
   * Pass force = true to bypass the per-page cache (after an edit).
   */
  function loadAll(force) {
    if (!cache || force) {
      cache = global.db.collection('sectors').get().then(function (snapshot) {
        var list = [];
        snapshot.forEach(function (doc) {
          var data = doc.data();
          list.push(Object.assign({}, data, {
            id: doc.id,
            trails: data.trails || [],
            aliases: data.aliases || []
          }));
        });
        return list.sort(compare);
      });
      // A failed read must not stick: let the next call try again
      cache.catch(function () { cache = null; });
    }
    return cache;
  }

  /**
   * The sectors of one network. Until the app has a "current activity"
   * (network switcher), this defaults to the default network (ski).
   */
  async function load(network) {
    // APP_CONFIG is a global const (config.js): visible as a bare name, not as window.APP_CONFIG
    var wanted = network || APP_CONFIG.defaultNetworks[0];
    var all = await loadAll();
    return all.filter(function (s) { return s.network === wanted; });
  }

  /** The sector for an id or one of its aliases, or null. */
  function find(sectors, idOrAlias) {
    if (!idOrAlias) return null;
    return sectors.find(function (s) { return s.id === idOrAlias; }) ||
      sectors.find(function (s) { return s.aliases.indexOf(idOrAlias) !== -1; }) ||
      null;
  }

  /** Display name for a sector id, falling back to what the record stored. */
  function nameOf(sectors, idOrAlias, fallback) {
    var sector = find(sectors, idOrAlias);
    return sector ? sector.name : (fallback || idOrAlias || '-');
  }

  /** Fills a <select> with the sectors (value = sector id). */
  function fillSectors(select, sectors, placeholder) {
    select.replaceChildren.apply(select, [new Option(placeholder, '')].concat(
      sectors.map(function (s) { return new Option(s.name, s.id); })
    ));
  }

  /** Fills a <select> with a sector's trails (value = trail name). */
  function fillTrails(select, sector, placeholder) {
    var names = sector ? sector.trails : [];
    select.replaceChildren.apply(select, [new Option(placeholder, '')].concat(
      names.map(function (name) { return new Option(name, name); })
    ));
  }

  /**
   * Selects a record's sector in a <select> filled by fillSectors(). An old
   * alias selects its current sector; an id that no longer exists is kept as
   * an extra option so editing the record does not silently drop it.
   * Returns the sector (or null).
   */
  function selectSector(select, sectors, idOrAlias) {
    var sector = find(sectors, idOrAlias);
    if (sector) {
      select.value = sector.id;
    } else if (idOrAlias) {
      select.appendChild(new Option(idOrAlias + ' (secteur inconnu)', idOrAlias));
      select.value = idOrAlias;
    } else {
      select.value = '';
    }
    return sector;
  }

  /** Same for a trail name in a <select> filled by fillTrails(). */
  function selectTrail(select, name) {
    if (name && !Array.prototype.some.call(select.options, function (o) { return o.value === name; })) {
      select.appendChild(new Option(name, name));
    }
    select.value = name || '';
  }

  global.SectorService = {
    loadAll: loadAll,
    load: load,
    find: find,
    nameOf: nameOf,
    fillSectors: fillSectors,
    fillTrails: fillTrails,
    selectSector: selectSector,
    selectTrail: selectTrail
  };

})(typeof window !== 'undefined' ? window : this);
