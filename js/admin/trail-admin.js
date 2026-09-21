/**
 * trail-admin.js - Administration > Sentiers (admins)
 * ====================================================
 * Lists, creates and edits the trails of an activity (Firestore trails/{id}):
 * name, number (shown on the map markers), kind (uphill / downhill / bike), difficulty
 * (the scale of that kind), length (optional, information), and the position on the
 * map, pinpointed by clicking on it. The status (open / closed) is set by inspections,
 * not here.
 *
 * Each kind of trail has its own map (APP_CONFIG.trailKinds.<kind>.map): the map shown
 * follows the type filter, or the type of the trail being edited.
 *
 * A trail that is no longer part of the network is hidden (archived: true), never
 * deleted: inspections and reports point to it by id and would lose their history. A hidden
 * trail leaves the map, the pickers and the public page, stays in the history, and can be
 * restored. Its number becomes free again.
 *
 * The vocabulary comes from TrailService / APP_CONFIG (trailKinds, difficulties,
 * difficultyScales). An admin manages the activities they hold (the Firestore rules
 * enforce it too).
 *
 * Needs the markup of the "trails" tab in pages/user-management.html.
 */
const TrailAdmin = (function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  const state = {
    network: null,
    kindFilter: '',
    view: 'active',    // 'active' | 'archived' | 'all'
    mapId: null,       // the map currently shown
    trails: [],        // every trail of every activity: { id, ...data }
    editing: null,     // { id: string|null, trail: object|null } while the editor is open
    placing: false,    // the next click on the map sets the position
    position: null     // { left, top } of the trail being edited
  };
  let userId = null;

  const kindsOfNetwork = () => APP_CONFIG.networks[state.network].trailKinds;
  const inNetwork = () => state.trails.filter(t => Network.of(t) === state.network);
  const mapConfig = () => APP_CONFIG.maps[state.mapId];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // The map to show: the one of the trail being edited, else of the type filter, else of the first type
  function wantedMapId() {
    const kind = state.editing ? $('tr-kind').value : (state.kindFilter || kindsOfNetwork()[0]);
    return TrailService.mapIdOf(kind);
  }

  // ---- Load and list -------------------------------------------------------------------------------
  async function load() {
    try {
      const snapshot = await window.db.collection('trails').get();
      state.trails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading trails:', error);
      showMessage('Erreur lors du chargement des sentiers.', 'error');
      state.trails = [];
    }
    renderList();
    drawMarkers();
  }

  function renderList() {
    const body = $('trail-rows');
    body.replaceChildren();
    const rows = inNetwork()
      .filter(t => !state.kindFilter || TrailService.kindOf(t) === state.kindFilter)
      .filter(t => state.view === 'all' || (state.view === 'archived') === TrailService.isArchived(t))
      .sort((a, b) => TrailService.kindOf(a).localeCompare(TrailService.kindOf(b)) || TrailService.compare(a, b));

    $('trail-count').textContent = `(${rows.length})`;
    if (!rows.length) {
      const row = el('tr');
      const cell = el('td', '', state.view === 'archived' ? 'Aucun sentier masqué.' : 'Aucun sentier pour cette activité.');
      cell.colSpan = 8;
      cell.style.cssText = 'text-align:center; padding: 1.5rem; color: var(--theme-text-secondary);';
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    rows.forEach(t => {
      const archived = TrailService.isArchived(t);
      const row = el('tr', 'trail-row' + (archived ? ' is-archived' : '') + (state.editing && state.editing.id === t.id ? ' is-selected' : ''));
      const hasPosition = t.coordinates && t.coordinates.left != null && t.coordinates.top != null;
      const cells = [
        t.number != null && t.number !== '' ? String(t.number) : '-',
        (t.name || t.id) + (archived ? ' (masqué)' : ''),
        TrailService.kindLabel(TrailService.kindOf(t)),
        TrailService.difficultyLabel(TrailService.difficultyOf(t), true) || '-',
        t.length != null && t.length !== '' ? `${t.length} km` : '-',
        TrailService.statusText(TrailService.statusOf(t), true),
        hasPosition ? '✓' : '-'
      ];
      cells.forEach(text => row.appendChild(el('td', '', text)));
      const action = el('td');
      const button = el('button', 'btn btn-secondary btn-sm', 'Modifier');
      button.type = 'button';
      button.addEventListener('click', () => startEdit(t));
      action.appendChild(button);
      row.appendChild(action);
      row.addEventListener('dblclick', () => startEdit(t));
      body.appendChild(row);
    });
  }

  // ---- The map ----------------------------------------------------------------------------------------
  // Shows the wanted map; loads the image only when the map changes
  function refreshMap() {
    const wanted = wantedMapId();
    if (wanted === state.mapId) { drawMarkers(); return; }
    state.mapId = wanted;
    const config = mapConfig();
    $('trail-map-title').textContent = `Carte : ${config.name}`;
    const image = $('trail-image');
    image.onload = () => {
      const overlay = $('trail-overlay');
      overlay.setAttribute('width', config.width);
      overlay.setAttribute('height', config.height);
      overlay.setAttribute('viewBox', `0 0 ${config.width} ${config.height}`);
      const wrong = image.naturalWidth !== config.width || image.naturalHeight !== config.height;
      $('trail-size-warning').hidden = !wrong;
      if (wrong) {
        $('trail-size-warning').textContent = `Attention : l'image fait ${image.naturalWidth} × ${image.naturalHeight} px mais la configuration indique ${config.width} × ${config.height} px. Les positions sont des pixels de l'image.`;
      }
      drawMarkers();
    };
    image.onerror = () => { $('trail-size-warning').hidden = false; $('trail-size-warning').textContent = 'Image de la carte introuvable.'; };
    $('trail-size-warning').hidden = true;
    image.src = MapService.imageUrl(state.mapId);
    drawMarkers();
  }

  function marker(svg, position, label, className, onClick) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${position.left} ${position.top})`);
    g.setAttribute('class', className);
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', 15);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('y', 5);
    text.setAttribute('text-anchor', 'middle');
    text.textContent = label;
    g.append(circle, text);
    if (onClick) g.addEventListener('click', onClick);
    svg.appendChild(g);
  }

  function drawMarkers() {
    const svg = $('trail-overlay');
    svg.replaceChildren();
    if (!state.network || !state.mapId) return;
    const editingId = state.editing && state.editing.id;

    // The trails placed on this map (hidden ones are not drawn)
    inNetwork().forEach(t => {
      const c = t.coordinates;
      if (!c || c.left == null || c.top == null || t.id === editingId) return;
      if (TrailService.isArchived(t) || TrailService.mapIdOf(t) !== state.mapId) return;
      marker(svg, c, TrailService.markerLabel(t), 'trail-marker', event => {
        if (state.placing) return;           // placing: the click goes to the map
        event.stopPropagation();
        startEdit(t);
      });
    });
    // The trail being edited: at its (possibly not yet saved) position
    if (state.editing && state.position) {
      const number = $('tr-number').value.trim();
      marker(svg, state.position, number || TrailService.markerLabel({ id: editingId || '', number: null }) || '•', 'trail-marker trail-marker--current');
    }
  }

  function onMapClick(event) {
    if (!state.placing) return;
    const config = mapConfig();
    const rect = $('trail-map').getBoundingClientRect();
    state.position = {
      left: Math.round((event.clientX - rect.left) * (config.width / rect.width)),
      top: Math.round((event.clientY - rect.top) * (config.height / rect.height))
    };
    state.placing = false;
    syncPosition();
    updatePlacing();
    drawMarkers();
  }

  function updatePlacing() {
    $('trail-map').classList.toggle('is-placing', state.placing);
    $('tr-place').textContent = state.placing ? '✖ Annuler' : '📍 Placer sur la carte';
    $('trail-hint').textContent = state.placing
      ? 'Cliquez sur la carte à l\'endroit du sentier.'
      : (state.editing ? 'Cliquez sur « Placer sur la carte » pour positionner ou déplacer ce sentier.' : 'La carte suit le type choisi. Cliquez sur un repère pour modifier ce sentier.');
  }

  function syncPosition() {
    $('tr-x').value = state.position ? state.position.left : '';
    $('tr-y').value = state.position ? state.position.top : '';
  }

  // ---- The editor -------------------------------------------------------------------------------------
  function fillDifficulty(kind, selected) {
    const select = $('tr-difficulty');
    select.replaceChildren(new Option('Non précisée', ''));
    TrailService.scaleOf(kind).forEach(id => select.appendChild(new Option(TrailService.difficultyLabel(id, true), id)));
    select.value = TrailService.scaleOf(kind).includes(selected) ? selected : '';
  }

  function statusLine(trail) {
    if (!trail) return 'Le statut sera défini par la première inspection.';
    if (TrailService.isArchived(trail)) {
      const when = trail.archivedAt && trail.archivedAt.toDate ? ` depuis le ${trail.archivedAt.toDate().toLocaleDateString('fr-CA')}` : '';
      return `Sentier masqué${when} : absent de la carte, des listes et de la page publique. L'historique est conservé.`;
    }
    return `Statut actuel : ${TrailService.statusText(TrailService.statusOf(trail), true)} (modifié par les inspections)`;
  }

  function startEdit(trail) {
    state.placing = false;
    const kind = trail ? TrailService.kindOf(trail) : (state.kindFilter || kindsOfNetwork()[0]);
    state.editing = { id: trail ? trail.id : null, trail: trail || null };
    state.position = trail && trail.coordinates && trail.coordinates.left != null && trail.coordinates.top != null
      ? { left: trail.coordinates.left, top: trail.coordinates.top } : null;

    $('trail-editor').hidden = false;
    $('trail-editor-title').textContent = trail ? `Modifier « ${trail.name || trail.id} »` : 'Nouveau sentier';
    $('tr-name').value = trail ? (trail.name || '') : '';
    $('tr-number').value = trail && trail.number != null ? trail.number : '';
    $('tr-kind').replaceChildren(...kindsOfNetwork().map(k => new Option(TrailService.kindLabel(k), k)));
    $('tr-kind').value = kind;
    fillDifficulty(kind, trail ? TrailService.difficultyOf(trail) : '');
    $('tr-length').value = trail && trail.length != null ? trail.length : '';
    $('tr-status').textContent = statusLine(trail);
    // Hide / restore only exist for a saved trail
    const archived = TrailService.isArchived(trail);
    $('tr-archive').hidden = !trail || archived;
    $('tr-restore').hidden = !trail || !archived;
    syncPosition();
    updatePlacing();
    renderList();
    refreshMap();
    $('trail-editor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('tr-name').focus();

    if (state.position) {
      const scroller = $('trail-scroll');
      scroller.scrollTo({ left: Math.max(0, state.position.left - scroller.clientWidth / 2), top: Math.max(0, state.position.top - scroller.clientHeight / 2), behavior: 'smooth' });
    }
  }

  function closeEditor() {
    state.editing = null;
    state.placing = false;
    state.position = null;
    $('trail-editor').hidden = true;
    updatePlacing();
    renderList();
    refreshMap();
  }

  // A position is a spot on ONE map: moving a trail to a kind on another map clears it
  function onKindChange(kind) {
    const previousMap = state.mapId;
    fillDifficulty(kind, $('tr-difficulty').value);
    state.placing = false;
    refreshMap();
    if (state.mapId !== previousMap && state.position) {
      state.position = null;
      syncPosition();
      drawMarkers();
      showMessage(`Ce type utilise une autre carte (${mapConfig().name}) : replacez le sentier sur cette carte.`, 'info');
    }
    updatePlacing();
  }

  function parseLength(text) {
    const t = text.trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return isFinite(n) && n >= 0 ? n : NaN;
  }

  // A number identifies a trail on the map: not twice for the same kind of (visible) trail
  function numberTaken(number, kind, exceptId) {
    return inNetwork().find(t => t.id !== exceptId && !TrailService.isArchived(t) &&
      number !== '' && t.number != null && String(t.number) === number && TrailService.kindOf(t) === kind);
  }

  async function save() {
    const name = $('tr-name').value.trim();
    const number = $('tr-number').value.trim();
    const kind = $('tr-kind').value;
    const difficulty = $('tr-difficulty').value;
    const length = parseLength($('tr-length').value);
    const editingId = state.editing.id;
    const archived = TrailService.isArchived(state.editing.trail);

    if (!name) { showMessage('Le nom du sentier est requis.', 'warning'); return; }
    if (Number.isNaN(length)) { showMessage('La longueur doit être un nombre de km (ou vide).', 'warning'); return; }
    const duplicate = !archived && numberTaken(number, kind, editingId);
    if (duplicate) { showMessage(`Le numéro ${number} est déjà utilisé par « ${duplicate.name} ».`, 'warning'); return; }

    const button = $('tr-save');
    setButtonLoading(button, true, 'Enregistrement...');
    try {
      const del = firebase.firestore.FieldValue.delete();
      const stamp = firebase.firestore.FieldValue.serverTimestamp();
      if (editingId) {
        // Cleared fields are removed; kind and difficulty are written in the current vocabulary
        await window.db.collection('trails').doc(editingId).update({
          name, kind, network: state.network,
          number: number === '' ? del : number,
          difficulty: difficulty === '' ? del : difficulty,
          length: length === null ? del : length,
          coordinates: state.position ? { left: state.position.left, top: state.position.top } : del,
          modifiedAt: stamp, modifiedBy: userId
        });
      } else {
        const id = TrailService.nextId(kind, state.trails.map(t => t.id));
        const data = { name, kind, network: state.network, createdAt: stamp, createdBy: userId };
        if (number !== '') data.number = number;
        if (difficulty !== '') data.difficulty = difficulty;
        if (length !== null) data.length = length;
        if (state.position) data.coordinates = { left: state.position.left, top: state.position.top };
        await window.db.collection('trails').doc(id).set(data);
      }
      showMessage(`Sentier « ${name} » enregistré.`, 'success');
      closeEditor();
      await load();
    } catch (error) {
      console.error('Error saving the trail:', error);
      showMessage(`Enregistrement impossible : ${error.message || 'erreur inconnue'}`, 'error');
    } finally {
      setButtonLoading(button, false);
    }
  }

  // ---- Hide / restore -------------------------------------------------------------------------------------
  async function archive() {
    const trail = state.editing && state.editing.trail;
    if (!trail) return;
    const message = `Masquer « ${trail.name || trail.id} » ?\n\nIl disparaîtra de la carte, des listes et de la page publique. ` +
      `Son historique (inspections, rapports) est conservé, et vous pourrez le restaurer.`;
    if (!window.confirm(message)) return;
    try {
      await window.db.collection('trails').doc(trail.id).update({
        archived: true,
        archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
        archivedBy: userId
      });
      showMessage(`Sentier « ${trail.name || trail.id} » masqué.`, 'success');
      closeEditor();
      await load();
    } catch (error) {
      console.error('Error hiding the trail:', error);
      showMessage(`Impossible de masquer le sentier : ${error.message || 'erreur inconnue'}`, 'error');
    }
  }

  async function restore() {
    const trail = state.editing && state.editing.trail;
    if (!trail) return;
    const number = trail.number != null ? String(trail.number) : '';
    const clash = numberTaken(number, TrailService.kindOf(trail), trail.id);
    if (clash) {
      showMessage(`Le numéro ${number} est maintenant utilisé par « ${clash.name} » : changez d'abord le numéro de ce sentier (enregistrez), puis restaurez-le.`, 'warning');
      return;
    }
    try {
      const del = firebase.firestore.FieldValue.delete();
      await window.db.collection('trails').doc(trail.id).update({ archived: del, archivedAt: del, archivedBy: del });
      showMessage(`Sentier « ${trail.name || trail.id} » restauré.`, 'success');
      closeEditor();
      await load();
    } catch (error) {
      console.error('Error restoring the trail:', error);
      showMessage(`Impossible de restaurer le sentier : ${error.message || 'erreur inconnue'}`, 'error');
    }
  }

  // ---- Start ----------------------------------------------------------------------------------------------
  function selectNetwork(id) {
    state.network = id;
    state.kindFilter = '';
    state.mapId = null;
    closeEditor();
    const kinds = kindsOfNetwork();
    $('trail-kind-filter').replaceChildren(new Option('Tous les types', ''), ...kinds.map(k => new Option(TrailService.kindLabel(k), k)));
    $('trail-kind-filter').parentElement.hidden = kinds.length < 2; // no filter needed with a single kind
    renderList();
    refreshMap();
  }

  /** @param networkIds the activities the current admin manages */
  function init(uid, networkIds) {
    userId = uid;
    $('trail-network').innerHTML = networkIds.map(id => `<option value="${id}">${APP_CONFIG.networks[id].icon} ${APP_CONFIG.networks[id].name}</option>`).join('');
    $('trail-network').addEventListener('change', event => selectNetwork(event.target.value));
    $('trail-kind-filter').addEventListener('change', event => { state.kindFilter = event.target.value; renderList(); refreshMap(); });
    $('trail-view').addEventListener('change', event => { state.view = event.target.value; renderList(); });
    $('trail-new').addEventListener('click', () => startEdit(null));
    $('tr-kind').addEventListener('change', event => onKindChange(event.target.value));
    $('tr-number').addEventListener('input', drawMarkers);
    $('tr-place').addEventListener('click', () => { state.placing = !state.placing; updatePlacing(); });
    $('tr-clear').addEventListener('click', () => { state.position = null; state.placing = false; syncPosition(); updatePlacing(); drawMarkers(); });
    $('tr-cancel').addEventListener('click', closeEditor);
    $('tr-save').addEventListener('click', save);
    $('tr-archive').addEventListener('click', archive);
    $('tr-restore').addEventListener('click', restore);
    $('trail-map').addEventListener('click', onMapClick);
    selectNetwork(networkIds[0]);
    load();
  }

  return { init };
})();
window.TrailAdmin = TrailAdmin;
