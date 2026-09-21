/**
 * trail-migration.js - One-time: the sector name lists -> trail records
 * ======================================================================
 * TEMPORARY. Before trail records, the infraction and signalisation forms listed the trails of a
 * sector from a plain list of names (sectors/{id}.trails). This turns those names into `trails`
 * records, each in its sector, so the forms and the Sentiers page share one source.
 * Remove this file (and its panel in Administration > Sentiers) once the migration is done.
 *
 *   TrailMigration.plan({ sectors, trails, kinds })  what would be done, nothing is written
 *   TrailMigration.apply(plan, db, userId)           writes it (batches)
 *
 * For every name of a sector list, of the kind chosen for that sector:
 *   - a trail of that kind already in that sector with the same name -> nothing (already done);
 *   - else a trail of that kind with NO sector and the same name (accents, case, and a leading
 *     "le / la / les / l'" ignored) -> it is linked to the sector (this is how the existing
 *     uphill trails, listed under "Randonnée alpine", are matched, not duplicated);
 *     if several trails match, nothing is done and it is reported ("à vérifier");
 *   - else a new trail is created (no number and no position yet: they are set in the
 *     Sentiers page).
 * Running it twice does nothing the second time.
 *
 * Requires trail-service.js, sector-service.js (SectorService.norm), config.js, network.js.
 */
const TrailMigration = (function () {
  'use strict';

  /** Name without accents / case / a leading article, for matching. */
  function key(name) {
    return SectorService.norm(name).replace(/^(?:les|le|la|l')\s*/, '');
  }

  /** The kind a sector's names probably are (the admin can change it in the preview). */
  function guessKind(sector) {
    const network = APP_CONFIG.networks[sector.network];
    const kinds = network ? network.trailKinds : [];
    const text = SectorService.norm(`${sector.id} ${sector.name}`);
    if (kinds.length === 1) return kinds[0];
    // lifts first: "remontées" contains "montée"
    if (/remont|lift/.test(text) && kinds.includes('lift')) return 'lift';
    if (/randonn|\bmontee\b|uphill/.test(text) && kinds.includes('uphill')) return 'uphill';
    return kinds.includes('downhill') ? 'downhill' : kinds[0];
  }

  const inSector = (trail, sector) => trail.sector && (trail.sector === sector.id || sector.aliases.includes(trail.sector));

  /**
   * @param sectors  [{ id, name, network, aliases, trails: [names] }]
   * @param trails   [{ id, name, kind?, network?, sector?, archived? }]  every trail record
   * @param kinds    { sectorId: kind }  the kind chosen per sector (default: guessKind)
   * @returns { rows: [{ sector, kind, name, action: 'create'|'link'|'skip'|'check', trail?, reason? }],
   *            counts: { create, link, skip, check }, unmatched: [trail] }
   */
  function plan({ sectors, trails, kinds }) {
    const rows = [];
    const claimed = new Set(); // trails already linked by this plan
    sectors.forEach(sector => {
      const kind = (kinds && kinds[sector.id]) || guessKind(sector);
      const seen = new Set();
      (sector.trails || []).forEach(rawName => {
        const name = String(rawName).trim();
        if (!name) return;
        const row = { sector, kind, name };
        rows.push(row);
        const k = key(name);
        if (seen.has(k)) { Object.assign(row, { action: 'skip', reason: 'nom en double dans la liste' }); return; }
        seen.add(k);

        const sameKind = trails.filter(t => t.archived !== true && Network.of(t) === sector.network && TrailService.kindOf(t) === kind);
        const done = sameKind.find(t => inSector(t, sector) && key(t.name) === k);
        if (done) { Object.assign(row, { action: 'skip', trail: done, reason: 'déjà dans ce secteur' }); return; }

        const candidates = sameKind.filter(t => !t.sector && !claimed.has(t.id) && key(t.name) === k);
        if (candidates.length === 1) {
          claimed.add(candidates[0].id);
          Object.assign(row, { action: 'link', trail: candidates[0] });
        } else if (candidates.length > 1) {
          Object.assign(row, { action: 'check', reason: `${candidates.length} sentiers portent ce nom sans secteur` });
        } else {
          Object.assign(row, { action: 'create' });
        }
      });
    });

    const counts = { create: 0, link: 0, skip: 0, check: 0 };
    rows.forEach(r => { counts[r.action]++; });
    // Trails of the sectors' activities that no list name matched and still have no sector
    const unmatched = trails.filter(t => t.archived !== true && !t.sector && !claimed.has(t.id) &&
      sectors.some(s => s.network === Network.of(t)));
    return { rows, counts, unmatched };
  }

  /** Writes a plan: creates the missing trails, links the matched ones. Returns the counts written. */
  async function apply(thePlan, db, userId, existingIds) {
    const stamp = firebase.firestore.FieldValue.serverTimestamp();
    const ids = existingIds.slice();
    const operations = [];
    let created = 0, linked = 0;

    thePlan.rows.forEach(row => {
      if (row.action === 'create') {
        const id = TrailService.nextId(row.kind, ids);
        ids.push(id);
        operations.push({ ref: db.collection('trails').doc(id), type: 'set', data: {
          name: row.name, kind: row.kind, network: row.sector.network, sector: row.sector.id, createdAt: stamp, createdBy: userId
        } });
        created++;
      } else if (row.action === 'link') {
        operations.push({ ref: db.collection('trails').doc(row.trail.id), type: 'update', data: {
          sector: row.sector.id, kind: row.kind, network: row.sector.network, modifiedAt: stamp, modifiedBy: userId
        } });
        linked++;
      }
    });

    for (let i = 0; i < operations.length; i += 400) {   // a batch holds at most 500 writes
      const batch = db.batch();
      operations.slice(i, i + 400).forEach(op => (op.type === 'set' ? batch.set(op.ref, op.data) : batch.update(op.ref, op.data)));
      await batch.commit();
    }
    return { created, linked };
  }

  return { key, guessKind, plan, apply };
})();
window.TrailMigration = TrailMigration;
