/**
 * map-service.js - The map image and GPS positions of the current activity
 * ========================================================================
 * Each activity (APP_CONFIG.networks[id].map) has its own map image and,
 * optionally, 3 GPS calibration corners. From those this converts a GPS
 * position to a pixel on the image (an affine transform, solved once per
 * network). This replaces the calibration code that was copied into five pages.
 *
 * A network without calibration (no bike map yet) cannot place GPS positions:
 * gpsToPixel() returns null and canLocate() is false. Callers then fall back
 * to a Google Maps link.
 *
 * Requires config.js (APP_CONFIG) and network.js (Network).
 */
const MapService = (function () {
  'use strict';

  const transforms = {}; // network id -> { a..f } or null

  // Solves the 3x3 system with Cramer's rule (same maths as the old inline code)
  function solveSystem(m) {
    const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
              - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
              + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    if (Math.abs(det) < 1e-10) return [0, 0, 0];
    const detX = m[0][3] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
               - m[0][1] * (m[1][3] * m[2][2] - m[1][2] * m[2][3])
               + m[0][2] * (m[1][3] * m[2][1] - m[1][1] * m[2][3]);
    const detY = m[0][0] * (m[1][3] * m[2][2] - m[1][2] * m[2][3])
               - m[0][3] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
               + m[0][2] * (m[1][0] * m[2][3] - m[1][3] * m[2][0]);
    const detZ = m[0][0] * (m[1][1] * m[2][3] - m[1][3] * m[2][1])
               - m[0][1] * (m[1][0] * m[2][3] - m[1][3] * m[2][0])
               + m[0][3] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    return [detX / det, detY / det, detZ / det];
  }

  function mapOf(networkId) {
    const network = APP_CONFIG.networks[networkId || Network.current()];
    return network ? network.map : null;
  }

  function transformFor(networkId) {
    const id = networkId || Network.current();
    if (id in transforms) return transforms[id];

    const map = mapOf(id);
    const c = map && map.calibration;
    if (!c || !map.width || !map.height) return (transforms[id] = null);

    // The three calibration corners are the top-left, top-right and bottom-left pixels
    const p1 = { ...c.topLeft, x: 0, y: 0 };
    const p2 = { ...c.topRight, x: map.width, y: 0 };
    const p3 = { ...c.bottomLeft, x: 0, y: map.height };
    const cx = solveSystem([[p1.lat, p1.lon, 1, p1.x], [p2.lat, p2.lon, 1, p2.x], [p3.lat, p3.lon, 1, p3.x]]);
    const cy = solveSystem([[p1.lat, p1.lon, 1, p1.y], [p2.lat, p2.lon, 1, p2.y], [p3.lat, p3.lon, 1, p3.y]]);
    return (transforms[id] = { a: cx[0], b: cx[1], c: cx[2], d: cy[0], e: cy[1], f: cy[2] });
  }

  /** Can GPS positions be drawn on this network's map? */
  function canLocate(networkId) {
    return transformFor(networkId) !== null;
  }

  /** Pixel of a GPS position on the map, clamped to the image; null if the map has no calibration. */
  function gpsToPixel(lat, lon, networkId) {
    const t = transformFor(networkId);
    if (!t) return null;
    const map = mapOf(networkId);
    const x = Math.round(t.a * lat + t.b * lon + t.c);
    const y = Math.round(t.d * lat + t.e * lon + t.f);
    return { x: Math.max(0, Math.min(map.width, x)), y: Math.max(0, Math.min(map.height, y)) };
  }

  /** URL of the map image, valid from the current page. */
  function imageUrl(networkId) {
    const map = mapOf(networkId);
    return map && map.image ? Network.url(map.image) : '';
  }

  /**
   * Points a map <img> at the current network's map. If the image file is missing
   * (a network whose map has not been provided yet) the image is hidden and a notice
   * is shown; markers are hidden by the .map-wrapper.is-missing rule (helpers.css).
   * The image must sit inside its .map-wrapper.
   */
  function showImage(image) {
    const wrapper = image.parentElement;
    image.onerror = () => {
      image.style.display = 'none';
      wrapper.classList.add('is-missing');
      if (!wrapper.querySelector('.map-missing')) {
        const notice = document.createElement('p');
        notice.className = 'map-missing';
        notice.style.cssText = 'padding: 2rem; color: var(--theme-text-secondary);';
        notice.textContent = 'Carte non disponible pour cette activité.';
        wrapper.appendChild(notice);
      }
    };
    image.onload = () => {
      image.style.display = '';
      wrapper.classList.remove('is-missing');
      const notice = wrapper.querySelector('.map-missing');
      if (notice) notice.remove();
    };
    const network = APP_CONFIG.networks[Network.current()];
    image.alt = `Carte ${network ? network.name : ''}`.trim();
    image.src = imageUrl();
  }

  return { canLocate, gpsToPixel, imageUrl, showImage };
})();
window.MapService = MapService;
