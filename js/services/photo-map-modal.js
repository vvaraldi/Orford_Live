/**
 * photo-map-modal.js - "Localisation de la photo" pop-up (infractions and signalisations)
 * ======================================================================================
 * Shows where a photo was taken on a map, with a switch between the activity's maps
 * (APP_CONFIG.networks[id].reportMaps: for ski the downhill map and the touring map).
 *
 *   PhotoMapModal.open(lat, lon)   opens it (or opens Google Maps when no map of the
 *                                  activity can place that position)
 *   PhotoMapModal.close()
 *
 * The map shown first is the default one (the first calibrated map of reportMaps); the map
 * picked with the switch is kept while the page stays open. A map that has no GPS
 * calibration (Administration > Cartes) cannot be picked.
 *
 * Uses the .detail-modal markup of the infraction-admin, signalisation-admin and
 * signalisation-resume pages. Requires config.js, network.js and map-service.js.
 */
const PhotoMapModal = (function () {
  'use strict';

  let chosen = null;      // map id being shown
  let pinned = null;      // map id the user picked with the switch (kept while the page stays open)
  let position = null;    // { lat, lon } being shown

  const $ = id => document.getElementById(id);

  function build() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="detail-modal" id="photo-map-modal">
        <div class="detail-modal__content" style="max-width:900px;">
          <div class="detail-modal__header"><h3 class="detail-modal__title">📍 Localisation de la photo</h3><button class="detail-modal__close" onclick="PhotoMapModal.close()">×</button></div>
          <div class="detail-modal__body" style="padding:0;">
            <div id="photo-map-switch" style="display:none;gap:0.5rem;padding:0.75rem 1rem;border-bottom:1px solid var(--theme-border);flex-wrap:wrap;"></div>
            <div style="overflow:auto;max-height:60vh;"><div id="photo-map-wrap" style="position:relative;display:inline-block;"><img id="photo-map-img" alt="" style="display:block;width:auto;height:auto;max-width:none;"><div id="photo-marker" style="position:absolute;width:20px;height:20px;background:red;border:3px solid white;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div></div></div>
            <div id="photo-coords" style="padding:1rem;background:var(--theme-surface-alt);border-top:1px solid var(--theme-border);"></div>
          </div>
          <div class="detail-modal__footer"><a id="photo-google-link" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🗺️ Google Maps</a><button class="btn btn-secondary" onclick="PhotoMapModal.close()">Fermer</button></div>
        </div>
      </div>`);
    $('photo-map-modal').addEventListener('click', e => { if (e.target.id === 'photo-map-modal') close(); });
  }

  // Draws the chosen map, the marker and the switch
  function render() {
    const { all } = MapService.reportMaps();
    const { lat, lon } = position;

    const box = $('photo-map-switch');
    box.replaceChildren();
    box.style.display = all.length > 1 ? 'flex' : 'none';
    all.forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      const placeable = !!MapService.gpsToPixel(lat, lon, id);
      button.className = 'btn btn-sm ' + (id === chosen ? 'btn-primary' : 'btn-secondary');
      button.textContent = `${APP_CONFIG.maps[id].icon} ${APP_CONFIG.maps[id].name}`;
      button.disabled = !placeable;
      if (!placeable) button.title = 'Cette carte n\'est pas calibrée (Administration > Cartes) ou la position est hors carte';
      button.addEventListener('click', () => { chosen = pinned = id; render(); });
      box.appendChild(button);
    });

    const pixel = MapService.gpsToPixel(lat, lon, chosen);
    const image = $('photo-map-img');
    const wrap = $('photo-map-wrap').parentElement;
    const center = () => {
      wrap.scrollLeft = Math.max(0, pixel.x - wrap.clientWidth / 2);
      wrap.scrollTop = Math.max(0, pixel.y - wrap.clientHeight / 2);
    };
    image.onload = center;
    const url = MapService.imageUrl(chosen);
    if (image.getAttribute('src') !== url) image.src = url; else center();
    image.alt = `Carte ${APP_CONFIG.maps[chosen].name}`;
    $('photo-marker').style.left = pixel.x + 'px';
    $('photo-marker').style.top = pixel.y + 'px';
    $('photo-coords').innerHTML = `<strong>GPS:</strong> ${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
    $('photo-google-link').href = `https://www.google.com/maps?q=${lat},${lon}`;
  }

  function open(lat, lon) {
    const { all, default: def } = MapService.reportMaps();
    const usable = all.filter(id => MapService.gpsToPixel(lat, lon, id));
    // No map of this activity can place the position (not calibrated): Google Maps instead
    if (!usable.length) { window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank', 'noopener'); return; }

    chosen = pinned && usable.includes(pinned) ? pinned : (usable.includes(def) ? def : usable[0]);
    position = { lat, lon };
    if (!$('photo-map-modal')) build();
    render();
    $('photo-map-modal').classList.add('show');
  }

  function close() {
    const modal = $('photo-map-modal');
    if (modal) modal.classList.remove('show');
  }

  return { open, close };
})();
window.PhotoMapModal = PhotoMapModal;
window.openPhotoLocationModal = PhotoMapModal.open;
