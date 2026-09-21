/**
 * trail-admin.js - Administration > Sentiers (admins)
 * ====================================================
 * Lists, creates and edits the trails of an activity (Firestore trails/{id}):
 * name, number (shown on the map markers), kind (uphill / downhill / bike), difficulty
 * (the scale of that kind), length (optional, information), and the position on the
 * map, pinpointed by clicking on it. The status (open / closed) is set by inspections,
 * not here.
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
    trails: [],        // every trail of every activity: { id, ...data }
    editing: null,     // { id: string|null, trail: object|null } while the editor is open
    placing: false,    // the next click on the map sets the position
    position: null     // { left, top } of the trail being edited
  };
  let userId = null;

  const map = () => APP_CONFIG.networks[state.network].map;
  const kindsOfNetwork = () => APP_CONFIG.networks[state.network].trailKinds;
  const inNetwork = () => state.trails.filter(t => Network.of(t) === state.network);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

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
      .sort((a, b) => TrailService.kindOf(a).localeCompare(TrailService.kindOf(b)) || TrailService.compare(a, b));

    $('trail-count').textContent = `(${rows.length})`;
    if (!rows.length) {
      const row = el('tr');
      const cell = el('td', '', 'Aucun sentier pour cette activité.');
      cell.colSpan = 8;
      cell.style.cssText = 'text-align:center; padding: 1.5rem; color: var(--theme-text-secondary);';
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    rows.forEach(t => {
      const row = el('tr', 'trail-row' + (state.editing && state.editing.id === t.id ? ' is-selected' : ''));
      const hasPosition = t.coordinates && t.coordinates.left != null && t.coordinates.top != null;
      const cells = [
        t.number != null && t.number !== '' ? String(t.number) : '-',
        t.name || t.id,
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
  function loadMap() {
    const image = $('trail-image');
    const config = map();
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
    image.src = MapService.imageUrl(state.network);
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
    if (!state.network) return;
    const editingId = state.editing && state.editing.id;

    inNetwork().forEach(t => {
      const c = t.coordinates;
      if (!c || c.left == null || c.top == null || t.id === editingId) return;
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
    const config = map();
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
      : (state.editing ? 'Cliquez sur « Placer sur la carte » pour positionner ou déplacer ce sentier.' : 'Cliquez sur un repère pour modifier ce sentier.');
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

  function startEdit(trail) {
    state.placing = false;
    const kind = trail ? TrailService.kindOf(trail) : kindsOfNetwork()[0];
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
    $('tr-status').textContent = trail
      ? `Statut actuel : ${TrailService.statusText(TrailService.statusOf(trail), true)} (modifié par les inspections)`
      : 'Le statut sera défini par la première inspection.';
    syncPosition();
    updatePlacing();
    renderList();
    drawMarkers();
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
    drawMarkers();
  }

  function parseLength(text) {
    const t = text.trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return isFinite(n) && n >= 0 ? n : NaN;
  }

  async function save() {
    const name = $('tr-name').value.trim();
    const number = $('tr-number').value.trim();
    const kind = $('tr-kind').value;
    const difficulty = $('tr-difficulty').value;
    const length = parseLength($('tr-length').value);
    const editingId = state.editing.id;

    if (!name) { showMessage('Le nom du sentier est requis.', 'warning'); return; }
    if (Number.isNaN(length)) { showMessage('La longueur doit être un nombre de km (ou vide).', 'warning'); return; }
    // A number identifies a trail on the map: not twice for the same kind of trail
    const duplicate = inNetwork().find(t => t.id !== editingId && number !== '' && String(t.number) === number && TrailService.kindOf(t) === kind);
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

  // ---- Start ----------------------------------------------------------------------------------------------
  function selectNetwork(id) {
    state.network = id;
    state.kindFilter = '';
    closeEditor();
    const kinds = kindsOfNetwork();
    $('trail-kind-filter').replaceChildren(new Option('Tous les types', ''), ...kinds.map(k => new Option(TrailService.kindLabel(k), k)));
    $('trail-kind-filter').hidden = kinds.length < 2;
    loadMap();
    renderList();
    drawMarkers();
  }

  /** @param networkIds the activities the current admin manages */
  function init(uid, networkIds) {
    userId = uid;
    $('trail-network').innerHTML = networkIds.map(id => `<option value="${id}">${APP_CONFIG.networks[id].icon} ${APP_CONFIG.networks[id].name}</option>`).join('');
    $('trail-network').addEventListener('change', event => selectNetwork(event.target.value));
    $('trail-kind-filter').addEventListener('change', event => { state.kindFilter = event.target.value; renderList(); });
    $('trail-new').addEventListener('click', () => startEdit(null));
    $('tr-kind').addEventListener('change', event => fillDifficulty(event.target.value, $('tr-difficulty').value));
    $('tr-number').addEventListener('input', drawMarkers);
    $('tr-place').addEventListener('click', () => { state.placing = !state.placing; updatePlacing(); });
    $('tr-clear').addEventListener('click', () => { state.position = null; state.placing = false; syncPosition(); updatePlacing(); drawMarkers(); });
    $('tr-cancel').addEventListener('click', closeEditor);
    $('tr-save').addEventListener('click', save);
    $('trail-map').addEventListener('click', onMapClick);
    selectNetwork(networkIds[0]);
    load();
  }

  return { init };
})();
window.TrailAdmin = TrailAdmin;
