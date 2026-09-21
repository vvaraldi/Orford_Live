/**
 * trail-service.js - What a trail is, and how it is labelled
 * ==========================================================
 * One place for the trail vocabulary the apps share: kind (uphill / downhill / bike),
 * difficulty (a scale per kind), status (open / closed), inspection condition, and
 * the text shown for a trail in lists and pickers. The values and labels themselves live
 * in APP_CONFIG (trailKinds, difficulties, difficultyScales, labels).
 *
 * Trails saved before these fields existed still work:
 *   - no `kind`    -> 'bike' in the bike network, else 'uphill'
 *   - difficulty   'easy' / 'medium' / 'hard' -> 'green' / 'blue' / 'black'
 *
 * Requires config.js (APP_CONFIG) and network.js (Network).
 */
const TrailService = (function () {
  'use strict';

  const LEGACY_DIFFICULTY = { easy: 'green', medium: 'blue', hard: 'black' };

  /** 'uphill' | 'downhill' | 'bike' */
  function kindOf(trail) {
    if (trail && APP_CONFIG.trailKinds[trail.kind]) return trail.kind;
    return trail && trail.network === 'bike' ? 'bike' : 'uphill';
  }

  function kindLabel(kind) {
    const k = APP_CONFIG.trailKinds[kind];
    return k ? k.label : String(kind || '');
  }

  /** The difficulty ids a kind of trail can have, easiest first. */
  function scaleOf(kind) {
    return (APP_CONFIG.difficultyScales[kind] || []).slice();
  }

  /** 'green' | 'blue' | 'black' | 'double-black', or null when not set or unknown. */
  function difficultyOf(trail) {
    const raw = trail && trail.difficulty;
    if (APP_CONFIG.difficulties[raw]) return raw;
    return LEGACY_DIFFICULTY[raw] || null;
  }

  function difficultyLabel(id, withIcon) {
    const d = APP_CONFIG.difficulties[id];
    if (!d) return '';
    return withIcon ? `${d.icon} ${d.label}` : d.label;
  }

  /** Is this trail inspected (and shown on the public status page) in the given activity? */
  function isInspected(trail, networkId) {
    const network = APP_CONFIG.networks[networkId || Network.current()];
    return !!network && network.inspectionKinds.includes(kindOf(trail));
  }

  /** 'open' | 'closed' | 'unknown' */
  function statusOf(trail) {
    return trail && (trail.status === 'open' || trail.status === 'closed') ? trail.status : 'unknown';
  }

  function statusText(status, withIcon) {
    const s = APP_CONFIG.labels.trailStatus[status] || APP_CONFIG.labels.trailStatus.unknown;
    return withIcon ? `${s.icon} ${s.label}` : s.label;
  }

  function conditionText(condition, withIcon) {
    const c = APP_CONFIG.labels.condition[condition] || APP_CONFIG.labels.condition.unknown;
    return withIcon ? `${c.icon} ${c.label}` : c.label;
  }

  function conditionIcon(condition) {
    return (APP_CONFIG.labels.condition[condition] || APP_CONFIG.labels.condition.unknown).icon;
  }

  /** Marker label: the trail's number if it has one, else its id without the prefix (trail_3, bike_3 -> 3). */
  function markerLabel(trail) {
    return trail.number != null && trail.number !== '' ? String(trail.number) : String(trail.id || '').replace(/^[a-z]+_/, '');
  }

  /** "Le Campagnol (Bleue · 1.1 km)": the name, then what is known (both are optional). */
  function describe(trail) {
    const extra = [difficultyLabel(difficultyOf(trail)), trail.length != null && trail.length !== '' ? `${trail.length} km` : '']
      .filter(Boolean).join(' · ');
    return extra ? `${trail.name} (${extra})` : `${trail.name}`;
  }

  /** Sort by number (numeric, numbered trails first), then by name. */
  function compare(a, b) {
    const na = a.number != null && a.number !== '' ? String(a.number) : null;
    const nb = b.number != null && b.number !== '' ? String(b.number) : null;
    if (na !== null && nb !== null) {
      const byNumber = na.localeCompare(nb, 'fr', { numeric: true });
      if (byNumber) return byNumber;
    } else if (na !== null || nb !== null) {
      return na !== null ? -1 : 1;
    }
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
  }

  /** The id for a new trail of a kind: trail_12, run_1, bike_3 (one more than the highest in use). */
  function nextId(kind, existingIds) {
    const prefix = (APP_CONFIG.trailKinds[kind] || {}).idPrefix || kind;
    const used = existingIds
      .filter(id => id.startsWith(prefix + '_'))
      .map(id => parseInt(id.slice(prefix.length + 1), 10))
      .filter(n => !isNaN(n));
    return `${prefix}_${Math.max(0, ...used) + 1}`;
  }

  return { kindOf, kindLabel, scaleOf, difficultyOf, difficultyLabel, isInspected, statusOf, statusText, conditionText, conditionIcon, markerLabel, describe, compare, nextId };
})();
window.TrailService = TrailService;
