/**
 * network.js - The current activity (network) for the portal
 * ===========================================================
 * Which activity (ski, bike, ...) the user is working in, and what that
 * activity has (map, shelters, ...). Settings live in APP_CONFIG.networks.
 *
 * Load it right after config.js (before layout.js). auth.js calls
 * Network.setUser(userData) once the user is known, so pages can rely on
 * Network.current() inside checkAuthStatus' onAuthenticated callback.
 *
 * Which activity is current, in order:
 *   1. the user's own choice (header switcher), if it is one of their
 *      activities AND was made during the current season. A choice made last
 *      season is ignored, so nobody opens the ski app in July because of
 *      what they picked last winter;
 *   2. the season's activity (APP_CONFIG.networks[id].seasonMonths), if allowed;
 *   3. the first activity the user has.
 * A user's activities are inspectors/{uid}.networks (a system_admin has all).
 */
const Network = (function () {
  'use strict';

  const STORAGE_KEY = 'orford-network';
  const ids = Object.keys(APP_CONFIG.networks);
  let allowed = [];
  let currentId = null;

  // ---- Season -----------------------------------------------------------------
  // The network whose seasonMonths include the date's month; otherwise the default one
  function ofSeason(date) {
    const month = (date || api.now()).getMonth() + 1;
    const inSeason = ids.find(id => (APP_CONFIG.networks[id].seasonMonths || []).includes(month));
    return inSeason || APP_CONFIG.defaultNetworks[0];
  }

  // ---- The user's own choice ----------------------------------------------------
  function readChoice() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }

  function saveChoice(id) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, season: ofSeason() })); } catch (e) { /* private mode */ }
  }

  function allowedFor(userData) {
    if (!userData) return [];
    if (userData.role === 'system_admin') return ids.slice();
    return (Array.isArray(userData.networks) ? userData.networks : []).filter(id => ids.includes(id));
  }

  // ---- Public API -----------------------------------------------------------------

  /** Called by auth.js once the user is known. Returns the current network id (or null). */
  function setUser(userData) {
    allowed = allowedFor(userData);
    const season = ofSeason();
    const choice = readChoice();

    if (choice && choice.season === season && allowed.includes(choice.id)) currentId = choice.id;
    else if (allowed.includes(season)) currentId = season;
    else currentId = allowed[0] || null;

    if (currentId) document.body.dataset.network = currentId;
    document.dispatchEvent(new CustomEvent('networkReady', { detail: { current: currentId, allowed: allowed.slice() } }));
    return currentId;
  }

  /** Public pages (no login): the season's network, or ?network=bike to look at another one. */
  function usePublic() {
    const asked = new URLSearchParams(window.location.search).get('network');
    currentId = ids.includes(asked) ? asked : ofSeason();
    allowed = [currentId];
    document.body.dataset.network = currentId;
    return currentId;
  }

  /** Switches activity (header switcher) and reloads so every page reloads its data. */
  function set(id) {
    if (!allowed.includes(id) || id === currentId) return;
    saveChoice(id);
    api.reload();
  }

  const current = () => currentId;
  const config = () => APP_CONFIG.networks[currentId] || null;

  /** Does the current network have a feature (shelters, snowCondition, ...)? */
  function feature(name) {
    const c = config();
    return !!(c && c.features && c.features[name]);
  }

  /** The network of a record. */
  const of = doc => doc && doc.network;
  const matches = doc => of(doc) === currentId;
  const filter = docs => docs.filter(matches);

  /**
   * Start of the current season of the current activity: the latest occurrence of its
   * `statsSince` (config.js: ski 1 September, bike 1 May) that has already been reached.
   * The same rule for every activity. Pages that would otherwise read a whole collection
   * (dashboard, history) only read from here on; the statistics page navigates by season.
   */
  function seasonStart() {
    const since = (config() && config().statsSince) || { month: 1, day: 1 };
    const now = api.now();
    const thisYear = new Date(now.getFullYear(), since.month - 1, since.day);
    return thisYear <= now ? thisYear : new Date(now.getFullYear() - 1, since.month - 1, since.day);
  }

  /** A path from the site root ("assets/map/Ski-Touring_Map.png") as a URL valid from the current page. */
  function url(path) {
    return siteUrl(path); // config.js: independent of where the site is hosted
  }

  const api = {
    ids, ofSeason, setUser, usePublic, set,
    current, config, feature,
    of, matches, filter, url, seasonStart,
    // Replaceable in tests
    now: () => new Date(),
    reload: () => window.location.reload()
  };
  return api;
})();
window.Network = Network;
