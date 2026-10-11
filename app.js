/* ==================================================================
   VANISHED — application logic
   No framework, no build step. Leaflet + OpenStreetMap tiles via CDN.
   ================================================================== */

'use strict';

/* ============================ CONFIG ============================ */

var CATEGORIES = [
  { key: 'cinema',  label: 'Cinema' },
  { key: 'arcade',  label: 'Arcade' },
  { key: 'mall',    label: 'Mall' },
  { key: 'cafe',    label: 'Cafe / bakery' },
  { key: 'shop',    label: 'Shop' },
  { key: 'park',    label: 'Park' },
  { key: 'sport',   label: 'Stadium' },
  { key: 'transit', label: 'Station / transport' },
  { key: 'landmark',label: 'Landmark' },
  { key: 'zoo',     label: 'Zoo' },
  { key: 'factory', label: 'Factory' },
  { key: 'airport', label: 'Airport' },
  { key: 'hotel',   label: 'Hotel' },
  { key: 'school',  label: 'School' },
  { key: 'other',   label: 'Other' }
];

var CATEGORY_COLORS = {
  cinema:   '#e0705c',
  arcade:   '#c99bf0',
  mall:     '#7ec8e3',
  cafe:     '#e3b46f',
  shop:     '#8fd694',
  park:     '#7fd1b9',
  sport:    '#f2c94c',
  transit:  '#9aa8bd',
  landmark: '#d8a24a',
  zoo:      '#b6d17a',
  factory:  '#b0a89c',
  airport:  '#8fb8e8',
  hotel:    '#e79ab8',
  school:   '#c9b6e0',
  other:    '#a49a8b'
};

// How much weight a claim carries. Shown in the UI, never hidden.
var CONFIDENCE = {
  verified:    { label: 'Verified',      note: 'Name, year and story checked.' },
  approximate: { label: 'Area level',    note: 'True of this area, but no specific building is named.' },
  recalled:    { label: 'Unconfirmed',   note: 'From memory. Check it before you trust it.' }
};

var STORE_KEY = 'vanished.places.v1';   // user's own additions/edits
var FILTER_KEY = 'vanished.filter.v1';  // last used filters

// Approximate centres — only used to pick a starting view.
var DEFAULT_VIEW = { lat: 27.6710, lng: 85.3400, zoom: 12 };

/* ============================ STATE ============================ */

var state = {
  all: [],            // seed + user places, merged
  userPlaces: [],     // loaded from localStorage
  markers: {},        // id -> L.Marker
  activeId: null,
  pickedLatLng: null, // set while "add a place" is armed
  filters: { q: '', cats: {}, yearFrom: null, yearTo: null }
};

var map, drawerOpen = false, editingId = null;

/* ============================ BOOT ============================ */

document.addEventListener('DOMContentLoaded', init);

function init(){
  state.userPlaces = loadUserPlaces();
  state.all = (window.SEED_PLACES || []).concat(state.userPlaces);

  initMap();
  buildCategoryControls();
  bindEvents();
  renderFilters();
  renderAll();
  restoreView();
  updateStats();
  updateStorageHint();
  registerServiceWorker();
}

function initMap(){
  map = L.map('map', { zoomControl: true, worldCopyJump: true })
       .setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // clicking the map while armed sets the new pin's coordinates
  map.on('click', function(e){
    if (!state.pickedLatLng) return;
    state.pickedLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
    document.getElementById('f-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('f-lng').value = e.latlng.lng.toFixed(6);
    armPick(false);
  });
}

/* ============================ PERSISTENCE ============================ */

function loadUserPlaces(){
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e){
    console.warn('vanished: could not read saved places', e);
    return [];
  }
}

function saveUserPlaces(){
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.userPlaces));
    return true;
  } catch (e){
    // most likely QuotaExceededError — tell the user instead of losing data silently
    console.warn('vanished: could not save', e);
    return false;
  }
}

function restoreView(){
  try {
    var raw = localStorage.getItem('vanished.view.v1');
    if (!raw) return;
    var v = JSON.parse(raw);
    if (typeof v.lat === 'number' && typeof v.lng === 'number') {
      map.setView([v.lat, v.lng], v.zoom || DEFAULT_VIEW.zoom);
    }
  } catch (e){ /* no stored view, keep the default */ }
}

function rememberView(){
  try {
    var c = map.getCenter();
    localStorage.setItem('vanished.view.v1', JSON.stringify({
      lat: c.lat, lng: c.lng, zoom: map.getZoom()
    }));
  } catch (e){ /* non-fatal */ }
}

/* ============================ RENDER ============================ */

function categoryLabel(key){
  for (var i = 0; i < CATEGORIES.length; i++){
    if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
  }
  return 'Other';
}

function categoryColor(key){
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
}

function makeIcon(place, active){
  return L.divIcon({
    className: '',
    html: '<div class="v-marker' + (active ? ' is-active' : '') + '" ' +
          'style="background:' + categoryColor(place.category) + '"></div>',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5]
  });
}

function popupHtml(p){
  var h = '<p class="v-name">' + escapeHtml(p.name) + '</p>';
  h += '<p class="v-meta">' + escapeHtml(categoryLabel(p.category)) +
       (p.closed ? ' · closed ' + p.closed : '') + '</p>';
  var c = confidenceOf(p);
  if (c && c !== 'verified'){
    h += '<p class="v-flag" title="' + escapeHtml(CONFIDENCE[c].note) + '">' +
         escapeHtml(CONFIDENCE[c].label) + '</p>';
  }
  if (p.description){
    h += '<p class="v-desc">' + escapeHtml(p.description).slice(0, 220) +
         (p.description.length > 220 ? '&hellip;' : '') + '</p>';
  }
  h += '<button type="button" class="btn btn-small" data-open="' +
       escapeHtml(p.id) + '">Open</button>';
  return h;
}

function confidenceOf(p){
  if (p.seed !== true) return 'verified';  // your own entries are your claims
  return CONFIDENCE[p.confidence] ? p.confidence : 'recalled';
}

function renderAll(){
  Object.keys(state.markers).forEach(function(id){
    map.removeLayer(state.markers[id]);
  });
  state.markers = {};

  state.all.forEach(function(place){
    var marker = L.marker([place.lat, place.lng], {
      icon: makeIcon(place, place.id === state.activeId),
      title: place.name,
      riseOnHover: true
    }).addTo(map);

    marker.bindPopup(popupHtml(place), { maxWidth: 280, autoPanPadding: [30, 30] });
    marker.on('click', function(){ setActive(place.id, false); });
    state.markers[place.id] = marker;
  });

  applyFilters();
  updateCount();
}

function applyFilters(){
  var f = state.filters;
  var shown = 0;

  state.all.forEach(function(place){
    var marker = state.markers[place.id];
    if (!marker) return;

    var okCat = !f.cats || Object.keys(f.cats).length === 0 || f.cats[place.category];
    var okYear = true;
    if (f.yearFrom && place.closed && place.closed < f.yearFrom) okYear = false;
    if (f.yearTo   && place.closed && place.closed > f.yearTo)   okYear = false;
    if (f.yearFrom && !place.closed) okYear = false;
    if (f.yearTo   && !place.closed) okYear = false;
    var okText = matchesQuery(place, f.q);

    if (okCat && okYear && okText){
      if (!map.hasLayer(marker)) marker.addTo(map);
      shown++;
    } else if (map.hasLayer(marker)){
      map.removeLayer(marker);
    }
  });

  updateCount(shown);
}

function matchesQuery(place, q){
  if (!q) return true;
  var haystack = [place.name, place.address, place.description, place.closed]
    .join(' ').toLowerCase();
  return q.toLowerCase().indexOf(haystack) !== -1 || haystack.indexOf(q.toLowerCase()) !== -1;
}

function updateCount(shown){
  var label = document.getElementById('count-label');
  var total = state.all.length;
  label.textContent = (shown === undefined ? total : shown) + ' place' +
    ((shown === undefined ? total : shown) === 1 ? '' : 's');
}

function updateStats(){
  document.getElementById('stat-seed').textContent =
    (window.SEED_PLACES || []).length + ' seed';
  document.getElementById('stat-yours').textContent =
    state.userPlaces.length + ' yours';
}

function updateStorageHint(){
  var el = document.getElementById('storage-hint');
  try {
    localStorage.setItem('vanished.probe', '1');
    localStorage.removeItem('vanished.probe');
    el.textContent = 'Your additions are saved in this browser only. Export JSON to keep a copy.';
  } catch (e){
    el.textContent = 'This browser is blocking local storage, so your additions will NOT be saved. Export JSON before you close the tab.';
  }
}

/* ============================ PANEL ============================ */

function setActive(id, openPanel){
  state.activeId = id;

  Object.keys(state.markers).forEach(function(mid){
    var place = findPlace(mid);
    if (!place) return;
    state.markers[mid].setIcon(makeIcon(place, mid === id));
  });

  var place = findPlace(id);
  var panel = document.getElementById('panel');
  var body = document.getElementById('panel-body');

  if (!place){
    body.innerHTML = emptyPanelHtml();
    panel.classList.remove('is-open');
    return;
  }

  body.innerHTML = detailHtml(place);
  if (openPanel !== false) panel.classList.add('is-open');

  body.querySelectorAll('[data-edit]').forEach(function(btn){
    btn.addEventListener('click', function(){ openForm(place.id); });
  });
}

function emptyPanelHtml(){
  return '<div class="panel-empty">' +
    '<p class="panel-empty-title">Nothing here yet.</p>' +
    '<p>Pick a marker, or add somewhere that used to be. Most maps remember the ' +
    'buildings that are still standing.</p></div>';
}

function detailHtml(p){
  var h = '';

  h += '<span class="detail-cat">' + escapeHtml(categoryLabel(p.category)) + '</span>';
  h += '<h2 class="detail-name">' + escapeHtml(p.name) + '</h2>';
  if (p.address) h += '<p class="detail-addr">' + escapeHtml(p.address) + '</p>';

  var conf = confidenceOf(p);
  h += '<p class="detail-conf conf-' + conf + '">' +
       '<b>' + escapeHtml(CONFIDENCE[conf].label) + '</b> ' +
       escapeHtml(CONFIDENCE[conf].note) + '</p>';

  if (p.closed){
    h += '<p class="detail-when">Closed <b>' + p.closed + '</b></p>';
  }

  if (p.description){
    h += '<p class="detail-desc">' + escapeHtml(p.description) + '</p>';
  }

  if (p.photo){
    h += '<img class="detail-img" src="' + escapeHtml(p.photo) + '" alt="" ' +
         'onerror="this.style.display=\'none\'">';
  }

  var links = [];
  if (p.source){
    links.push('<a href="' + escapeHtml(p.source) + '" target="_blank" ' +
               'rel="noopener noreferrer">Source link &rarr;</a>');
  }
  if (links.length){
    h += '<div class="detail-links">' + links.join('') + '</div>';
  }

  h += '<div class="detail-actions">' +
       '<button class="btn btn-small" data-edit="' + escapeHtml(p.id) + '">Edit</button>' +
       '</div>';

  return h;
}

function findPlace(id){
  for (var i = 0; i < state.all.length; i++){
    if (state.all[i].id === id) return state.all[i];
  }
  return null;
}

/* ============================ FILTERS ============================ */

function buildCategoryControls(){
  var grid = document.getElementById('cat-filters');
  var select = document.getElementById('f-category');

  CATEGORIES.forEach(function(cat){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = cat.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.cat = cat.key;
    btn.addEventListener('click', function(){
      var on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      if (on) delete state.filters.cats[cat.key];
      else state.filters.cats[cat.key] = true;
      persistFilters();
      applyFilters();
    });
    grid.appendChild(btn);

    var opt = document.createElement('option');
    opt.value = cat.key;
    opt.textContent = cat.label;
    select.appendChild(opt);
  });
}

function persistFilters(){
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(state.filters));
  } catch (e){ /* non-fatal */ }
}

function renderFilters(){
  document.querySelectorAll('#cat-filters .chip').forEach(function(btn){
    btn.setAttribute('aria-pressed', state.filters.cats[btn.dataset.cat] ? 'true' : 'false');
  });
  document.getElementById('year-from').value = state.filters.yearFrom || '';
  document.getElementById('year-to').value   = state.filters.yearTo   || '';
}

/* ============================ FORM ============================ */

function openForm(id, latLng){
  editingId = id || null;
  var form = document.getElementById('place-form');
  var errEl = document.getElementById('form-error');

  errEl.hidden = true;
  form.reset();
  document.getElementById('f-id').value = '';
  document.getElementById('btn-delete').hidden = true;

  if (id){
    var p = findPlace(id);
    if (!p) return;
    document.getElementById('modal-title').textContent = 'Edit place';
    document.getElementById('f-id').value     = p.id;
    document.getElementById('f-name').value    = p.name;
    document.getElementById('f-address').value = p.address || '';
    document.getElementById('f-lat').value     = p.lat;
    document.getElementById('f-lng').value     = p.lng;
    document.getElementById('f-closed').value  = p.closed || '';
    document.getElementById('f-category').value= p.category || 'other';
    document.getElementById('f-description').value = p.description || '';
    document.getElementById('f-photo').value   = p.photo || '';
    document.getElementById('f-source').value  = p.source || '';

    // only let the user delete their own additions
    document.getElementById('btn-delete').hidden = !isUserPlace(p.id);
  } else {
    document.getElementById('modal-title').textContent = 'Add a place';
    if (latLng){
      document.getElementById('f-lat').value = latLng.lat.toFixed(6);
      document.getElementById('f-lng').value = latLng.lng.toFixed(6);
    }
  }

  document.getElementById('modal').hidden = false;
  setTimeout(function(){ document.getElementById('f-name').focus(); }, 30);
}

function closeForm(){
  document.getElementById('modal').hidden = true;
  editingId = null;
  state.pickedLatLng = null;
}

function armPick(on){
  document.body.classList.toggle('is-picking', on);
  var note = document.getElementById('pick-note');
  if (on){
    if (!note){
      note = document.createElement('div');
      note.id = 'pick-note';
      note.className = 'pick-note';
      document.body.appendChild(note);
    }
    note.textContent = 'Click the map to drop the pin';
  } else if (note){
    note.remove();
  }
}

function validateForm(place){
  if (!place.name.trim()) return 'Give it a name.';
  if (!isFinite(place.lat) || place.lat < -90  || place.lat > 90)  return 'Latitude must be a number between -90 and 90.';
  if (!isFinite(place.lng) || place.lng < -180 || place.lng > 180) return 'Longitude must be a number between -180 and 180.';
  if (place.closed && (place.closed < 1800 || place.closed > 2100)) return 'Year should be between 1800 and 2100.';
  return null;
}

function readForm(){
  var closedRaw = document.getElementById('f-closed').value.trim();
  return {
    id: document.getElementById('f-id').value || null,
    name: document.getElementById('f-name').value.trim(),
    address: document.getElementById('f-address').value.trim(),
    lat: parseFloat(document.getElementById('f-lat').value),
    lng: parseFloat(document.getElementById('f-lng').value),
    closed: closedRaw ? parseInt(closedRaw, 10) : 0,
    category: document.getElementById('f-category').value,
    description: document.getElementById('f-description').value.trim(),
    photo: document.getElementById('f-photo').value.trim(),
    source: document.getElementById('f-source').value.trim()
  };
}

function saveFromForm(){
  var place = readForm();
  var problem = validateForm(place);
  var errEl = document.getElementById('form-error');

  if (problem){
    errEl.textContent = problem;
    errEl.hidden = false;
    return;
  }

  if (editingId){
    var existing = findPlace(editingId);
    if (existing){
      for (var k in place){
        if (place[k] !== null && place[k] !== '') existing[k] = place[k];
      }
      // if the user only meant to move the pin, keep the lat/lng they typed
      existing.lat = place.lat;
      existing.lng = place.lng;
      if (isUserPlace(existing.id)) upsertUserPlace(existing);
    }
  } else {
    place.id = 'u-' + Date.now().toString(36);
    place.seed = false;
    state.userPlaces.push(place);
    saveUserPlaces();
    state.all.push(place);
  }

  closeForm();
  renderAll();
  updateStats();
  setActive(place.id, true);

  var marker = state.markers[place.id];
  if (marker) map.setView([place.lat, place.lng], Math.max(map.getZoom(), 15));
}

function isUserPlace(id){
  for (var i = 0; i < state.userPlaces.length; i++){
    if (state.userPlaces[i].id === id) return true;
  }
  return false;
}

function upsertUserPlace(place){
  var copy = {};
  for (var k in place) copy[k] = place[k];
  copy.seed = false;

  for (var i = 0; i < state.userPlaces.length; i++){
    if (state.userPlaces[i].id === place.id){
      state.userPlaces[i] = copy;
      saveUserPlaces();
      return;
    }
  }
  state.userPlaces.push(copy);
  saveUserPlaces();
}

function deletePlace(id){
  if (!isUserPlace(id)) {
    alert('Seed entries live in places.js — edit that file to remove one.');
    return;
  }
  if (!confirm('Delete this place? This cannot be undone.')) return;

  state.userPlaces = state.userPlaces.filter(function(p){ return p.id !== id; });
  state.all = state.all.filter(function(p){ return p.id !== id; });
  saveUserPlaces();

  if (state.markers[id]){
    map.removeLayer(state.markers[id]);
    delete state.markers[id];
  }
  closeForm();
  state.activeId = null;
  renderAll();
  updateStats();
}

/* ============================ IMPORT / EXPORT ============================ */

function exportJSON(){
  var payload = {
    version: 1,
    exported: new Date().toISOString(),
    places: state.all
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vanished-places.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}

function importJSON(file){
  var reader = new FileReader();
  reader.onload = function(){
    var data;
    try {
      data = JSON.parse(reader.result);
    } catch (e){
      alert('That file is not valid JSON.');
      return;
    }

    var incoming = Array.isArray(data) ? data : (data && data.places);
    if (!Array.isArray(incoming)){
      alert('No "places" array found in that file.');
      return;
    }

    var added = 0, updated = 0;
    incoming.forEach(function(p){
      if (!p || typeof p.name !== 'string' || !isFinite(p.lat) || !isFinite(p.lng)) return;

      if (isUserPlace(p.id)){
        var i = state.userPlaces.findIndex(function(x){ return x.id === p.id; });
        if (i >= 0){ state.userPlaces[i] = p; updated++; }
      } else {
        p.id = p.id || ('u-' + Date.now().toString(36) + '-' + added);
        p.seed = false;
        state.userPlaces.push(p);
        added++;
      }
    });

    saveUserPlaces();
    state.all = (window.SEED_PLACES || []).concat(state.userPlaces);
    renderAll();
    updateStats();
    alert('Imported ' + added + ' new, updated ' + updated + '.');
  };
  reader.readAsText(file);
}

function resetMyEdits(){
  if (!state.userPlaces.length){
    alert('You have not added anything yet.');
    return;
  }
  if (!confirm('Remove all ' + state.userPlaces.length +
               ' place(s) you added? Your own edits to seed entries are kept.')) return;

  state.userPlaces = state.userPlaces.filter(function(p){ return false; });
  saveUserPlaces();
  state.all = (window.SEED_PLACES || []).concat(state.userPlaces);
  state.activeId = null;
  renderAll();
  updateStats();
  closeDrawer();
}

/* ============================ DRAWER ============================ */

function openDrawer(){
  document.getElementById('drawer').hidden = false;
  document.getElementById('scrim').hidden = false;
  drawerOpen = true;
}

function closeDrawer(){
  document.getElementById('drawer').hidden = true;
  document.getElementById('scrim').hidden = true;
  drawerOpen = false;
}

/* ============================ EVENTS ============================ */

function bindEvents(){
  document.getElementById('btn-add').addEventListener('click', function(){
    openForm(null);
  });

  document.getElementById('btn-menu').addEventListener('click', function(){
    drawerOpen ? closeDrawer() : openDrawer();
  });

  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  document.getElementById('scrim').addEventListener('click', closeDrawer);

  document.getElementById('search').addEventListener('input', function(e){
    state.filters.q = e.target.value.trim();
    persistFilters();
    applyFilters();
  });

  document.getElementById('year-from').addEventListener('input', function(e){
    var v = parseInt(e.target.value, 10);
    state.filters.yearFrom = isNaN(v) ? null : v;
    persistFilters();
    applyFilters();
  });

  document.getElementById('year-to').addEventListener('input', function(e){
    var v = parseInt(e.target.value, 10);
    state.filters.yearTo = isNaN(v) ? null : v;
    persistFilters();
    applyFilters();
  });

  document.getElementById('place-form').addEventListener('submit', function(e){
    e.preventDefault();
    saveFromForm();
  });

  document.getElementById('btn-cancel').addEventListener('click', closeForm);
  document.getElementById('modal-close').addEventListener('click', closeForm);
  document.getElementById('btn-delete').addEventListener('click', function(){
    deletePlace(document.getElementById('f-id').value);
  });

  document.getElementById('btn-use-point').addEventListener('click', function(){
    armPick(true);
    closeForm();
    setTimeout(function(){
      openForm(editingId || null, state.pickedLatLng);
    }, 60);
  });

  document.getElementById('btn-geocode').addEventListener('click', geocodeAddress);
  document.getElementById('f-geocode').addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); geocodeAddress(); }
  });

  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-import').addEventListener('click', function(){
    document.getElementById('file-import').click();
  });
  document.getElementById('file-import').addEventListener('change', function(e){
    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('btn-reset').addEventListener('click', resetMyEdits);

  // "Open" button inside a Leaflet popup
  document.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-open]') : null;
    if (!t) return;
    setActive(t.dataset.open, true);
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (!document.getElementById('modal').hidden) closeForm();
      else if (drawerOpen) closeDrawer();
      else armPick(false);
    }
  });

  // remember where the user was looking
  map.on('moveend zoomend', rememberView);
  window.addEventListener('beforeunload', rememberView);
}

/* ============================ ADDRESS LOOKUP ============================
   Free OpenStreetMap geocoding. Nominatim's usage policy caps this at
   one request per second and forbids autocomplete-as-you-type, so this
   fires on an explicit button press only, never on keystroke.
   ====================================================================== */

var geocodeBusy = false;

function geocodeAddress(){
  var query = document.getElementById('f-geocode').value.trim();
  var errEl = document.getElementById('form-error');
  var btn = document.getElementById('btn-geocode');

  if (geocodeBusy) return;
  if (!query){
    errEl.textContent = 'Type something to search for first.';
    errEl.hidden = false;
    return;
  }

  geocodeBusy = true;
  btn.disabled = true;
  btn.textContent = 'Searching…';

  var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=' +
            encodeURIComponent(query);

  fetch(url)
    .then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(results){
      errEl.hidden = true;
      if (!results.length){
        errEl.textContent = 'Nothing found for "' + query + '". Try adding a city or district.';
        errEl.hidden = false;
        return;
      }
      var hit = results[0];
      document.getElementById('f-lat').value = parseFloat(hit.lat).toFixed(6);
      document.getElementById('f-lng').value = parseFloat(hit.lon).toFixed(6);
      if (!document.getElementById('f-address').value.trim()){
        document.getElementById('f-address').value = hit.display_name;
      }
      map.setView([hit.lat, hit.lon], 16);
    })
    .catch(function(e){
      errEl.textContent = 'Lookup failed (' + e.message + '). You can type coordinates in by hand.';
      errEl.hidden = false;
    })
    .finally(function(){
      geocodeBusy = false;
      btn.disabled = false;
      btn.textContent = 'Find it';
    });
}

/* ============================ PWA ============================ */

function registerServiceWorker(){
  if (!('serviceWorker' in navigator)) return;
  // only over http(s) — a service worker on file:// is rejected silently
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  navigator.serviceWorker.register('sw.js').catch(function(e){
    console.warn('vanished: service worker not registered', e);
  });
}

/* ============================ HELPERS ============================ */

function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}