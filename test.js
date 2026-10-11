/* Headless check for Vanished — runs app.js against a minimal DOM stub.
   Verifies: seed validity, render, filters, search, add/edit/delete, storage.
   Run:  node test.js                                              */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
let pass = 0, fail = 0;

function ok(name, cond, extra){
  if (cond){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}

/* ---------------- minimal DOM ---------------- */

function makeEl(tag){
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    _text: '', _html: '', value: '', hidden: false,
    style: new Proxy({}, { set:(t,k,v)=>{ t[k]=v; return true; }, get:(t,k)=>t[k] }),
    dataset: {}, attributes: {}, children: [],
    classList: {
      _s: new Set(),
      add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); },
      contains(c){ return this._s.has(c); },
      toggle(c,on){ on ? this._s.add(c) : this._s.delete(c); }
    },
    get textContent(){ return this._text; },
    set textContent(v){ this._text = String(v); this._html = ''; },
    get innerHTML(){ return this._html; },
    set innerHTML(v){ this._html = String(v); },
    appendChild(c){ this.children.push(c); return c; },
    removeChild(c){ this.children = this.children.filter(x => x !== c); },
    remove(){},
    focus(){},
    reset(){ this.value = ''; },
    addEventListener(ev, fn){ (this._ev = this._ev || {})[ev] = fn; },
    removeEventListener(){},
    dispatch(ev, arg){ if (this._ev && this._ev[ev]) this._ev[ev](arg || {}); },
    setAttribute(k,v){ this.attributes[k] = String(v); },
    getAttribute(k){ return this.attributes[k]; },
    querySelectorAll(){ return []; },
    querySelector(){ return makeEl('div'); },
    closest(){ return null; },
    click(){}
  };
  return el;
}

const els = {};
['count-label','panel','panel-body','drawer','scrim','modal','modal-title','form-error',
 'btn-delete','stat-seed','stat-yours','storage-hint','search','year-from','year-to',
 'cat-filters','f-category','f-id','f-name','f-address','f-lat','f-lng','f-closed',
 'f-description','f-photo','f-source','place-form','file-import','map','pick-note'
].forEach(id => { els[id] = makeEl(); });

// f-category is a <select>; options get appended into it
const storage = {};
const sandbox = {
  console,
  setTimeout: (fn) => { try { fn(); } catch(e){} },
  clearTimeout,
  alert: () => {},
  confirm: () => true,
  Blob: function(){ return {}; },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} },
  FileReader: function(){},
  Date, Math, JSON, parseInt, parseFloat, isFinite, isNaN,
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k,v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; }
  },
  document: {
    readyState: 'complete',
    body: makeEl('body'),
    documentElement: makeEl('html'),
    getElementById: id => els[id] || (els[id] = makeEl()),
    querySelectorAll: () => [],
    querySelector: () => makeEl('div'),
    addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') fn(); },
    createElement: tag => makeEl(tag)
  },
  navigator: {},
  window: null
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = () => {};

/* ---------------- Leaflet stub ---------------- */

const layers = new Set();

function stubLayer(){
  const layer = {
    _html: '',
    setIcon(icon){ layer._icon = icon; return layer; },
    bindPopup(){ return layer; },
    on(){ return layer; },
    addTo(){ layers.add(layer); return layer; },
    remove(){ layers.delete(layer); return layer; },
    getLayers(){ return []; }
  };
  return layer;
}

sandbox.L = {
  map: () => ({
    setView(){ return this; },
    setZoom(){ return this; },
    getZoom(){ return 13; },
    getCenter(){ return { lat: 27.67, lng: 85.34 }; },
    on(){ return this; },
    hasLayer(l){ return layers.has(l); },
    removeLayer(l){ layers.delete(l); return this; }
  }),
  tileLayer: () => ({ addTo(){ return this; } }),
  marker: (latlng, opts) => Object.assign(stubLayer(), { _latlng: latlng, _opts: opts }),
  divIcon: opts => opts,
  featureGroup: () => ({ addLayer(){}, removeLayer(){}, getLayers(){ return []; } })
};

/* ---------------- reload the app with L present ---------------- */

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'places.js'), 'utf8'), sandbox, { filename:'places.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), sandbox, { filename:'app.js' });

const seed = sandbox.SEED_PLACES;

/* ---------------- tests ---------------- */

console.log('\nseed data');
ok('8 seed entries', seed.length === 8, 'got ' + seed.length);
ok('every entry has a unique id', new Set(seed.map(p => p.id)).size === seed.length);
ok('every entry has a name', seed.every(p => typeof p.name === 'string' && p.name.length));
ok('every lat/lng is a finite number', seed.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)));
ok('every lat within -90..90', seed.every(p => p.lat >= -90 && p.lat <= 90));
ok('every lng within -180..180', seed.every(p => p.lng >= -180 && p.lng <= 180));
ok('every category exists in CATEGORIES',
   seed.every(p => sandbox.CATEGORIES.some(c => c.key === p.category)),
   seed.filter(p => !sandbox.CATEGORIES.some(c => c.key === p.category)).map(p => p.id + ':' + p.category).join(', '));
ok('closed years are 0 or 1800..2100', seed.every(p => p.closed === 0 || (p.closed >= 1800 && p.closed <= 2100)));

console.log('\nstate after boot');
ok('all = seed (no saved user places yet)', sandbox.state.all.length === 8, 'got ' + sandbox.state.all.length);
ok('a marker exists for every place', Object.keys(sandbox.state.markers).length === 8,
   'got ' + Object.keys(sandbox.state.markers).length);
ok('count label shows 8', els['count-label'].textContent.indexOf('8') === 0,
   els['count-label'].textContent);

console.log('\nsearch');
sandbox.state.filters.q = 'wembley';
sandbox.applyFilters();
ok('search "wembley" matches 1 place', els['count-label'].textContent.indexOf('1 place') === 0,
   els['count-label'].textContent);
sandbox.state.filters.q = 'kathmandu';
sandbox.applyFilters();
ok('search "kathmandu" matches the placeholder', els['count-label'].textContent.indexOf('1 place') === 0,
   els['count-label'].textContent);
sandbox.state.filters.q = '';
sandbox.applyFilters();
ok('clearing search restores 8', els['count-label'].textContent.indexOf('8') === 0,
   els['count-label'].textContent);

console.log('\ncategory filter');
sandbox.state.filters.cats = { cinema: true };
sandbox.applyFilters();
ok('cinema filter matches 0 (no seed is a cinema)', els['count-label'].textContent.indexOf('0 ') === 0,
   els['count-label'].textContent);
sandbox.state.filters.cats = { landmark: true };
sandbox.applyFilters();
ok('landmark filter matches 2 (wall + crystal palace)', els['count-label'].textContent.indexOf('2 ') === 0,
   els['count-label'].textContent);
sandbox.state.filters.cats = {};
sandbox.applyFilters();

console.log('\nyear filter');
sandbox.state.filters.yearFrom = 1995;
sandbox.applyFilters();
// seed closed years: 1989, 2003, 1998, 1991, 1977, 2004, 1936, 0 -> >=1995: 2003, 1998, 2004 = 3
ok('yearFrom 1995 keeps 3 places', els['count-label'].textContent.indexOf('3 ') === 0,
   els['count-label'].textContent);
sandbox.state.filters.yearFrom = null;
sandbox.state.filters.yearTo = 1989;
sandbox.applyFilters();
// <=1989: 1989, 1977, 1936 = 3 (closed 0 is unknown, kept visible)
ok('yearTo 1989 keeps 3 places', els['count-label'].textContent.indexOf('3 ') === 0,
   els['count-label'].textContent);
sandbox.state.filters.yearTo = null;
sandbox.applyFilters();

console.log('\nvalidation');
ok('blank name is rejected', sandbox.validateForm({ name:'', lat:0, lng:0, closed:0 }) === 'Give it a name.');
ok('bad lat is rejected', /Latitude/.test(sandbox.validateForm({ name:'x', lat:999, lng:0, closed:0 }) || ''));
ok('bad lng is rejected', /Longitude/.test(sandbox.validateForm({ name:'x', lat:0, lng:999, closed:0 }) || ''));
ok('NaN lat is rejected', /Latitude/.test(sandbox.validateForm({ name:'x', lat:NaN, lng:0, closed:0 }) || ''));
ok('bad year is rejected', /Year/.test(sandbox.validateForm({ name:'x', lat:0, lng:0, closed:1200 }) || ''));
ok('a valid place passes', sandbox.validateForm({ name:'x', lat:27.67, lng:85.34, closed:1999 }) === null);

console.log('\nhtml escaping');
ok('escapes < > &', sandbox.escapeHtml('<b>&"x"</b>') === '&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
ok('escapes null safely', sandbox.escapeHtml(null) === '');
const popup = sandbox.popupHtml({ id:'x', name:'<img src=x onerror=alert(1)>', lat:0, lng:0, category:'other' });
ok('popup escapes injected tags', popup.indexOf('<img') === -1);
ok('popup has no unescaped tag from user data', !/<(?!\/?(p|button)\b)[a-z]/i.test(popup.replace(/<\/?(p|button)\b[^>]*>/gi, '')));

console.log('\nadd / persist / delete');
els['f-name'].value = 'Test Bakery';
els['f-address'].value = 'Lakeside';
els['f-lat'].value = '27.67';
els['f-lng'].value = '85.34';
els['f-closed'].value = '2001';
els['f-category'].value = 'cafe';
els['f-description'].value = 'Open till 7am.';

const before = sandbox.state.all.length;
sandbox.saveFromForm();
ok('adding a place grows the list', sandbox.state.all.length === before + 1,
   before + ' -> ' + sandbox.state.all.length);
ok('a marker was created for it', Object.keys(sandbox.state.markers).length === before + 1);
ok('it was written to localStorage', !!storage['vanished.places.v1']);
ok('the stored entry has an id', (JSON.parse(storage['vanished.places.v1'])[0] || {}).id != null);
ok('the new place is flagged as user data',
   sandbox.state.userPlaces[0].seed === false);
ok('isUserPlace finds it', sandbox.isUserPlace(sandbox.state.userPlaces[0].id) === true);

const newId = sandbox.state.userPlaces[0].id;
sandbox.deletePlace(newId);
ok('deleting removes it from the list', sandbox.state.all.length === before,
   'got ' + sandbox.state.all.length);
ok('deleting removes its marker', Object.keys(sandbox.state.markers).length === before);
ok('deleting clears storage', JSON.parse(storage['vanished.places.v1']).length === 0);

console.log('\nseed entries are protected');
ok('seed cannot be deleted as a user place', sandbox.isUserPlace('wembley-old') === false);

console.log('\nimport');
sandbox.state.userPlaces.push({ id:'imp1', name:'Imported', lat:1, lng:2, seed:false, category:'cafe' });
sandbox.state.all.push(sandbox.state.userPlaces[sandbox.state.userPlaces.length-1]);
sandbox.renderAll();
sandbox.updateStats();
ok('stats count user places', els['stat-yours'].textContent.indexOf('1 yours') === 0,
   els['stat-yours'].textContent);
ok('stats count seed places', els['stat-seed'].textContent.indexOf('8 seed') === 0,
   els['stat-seed'].textContent);

console.log('\ncategories');
ok('every category has a color', sandbox.CATEGORIES.every(c => sandbox.CATEGORY_COLORS[c.key]));
ok('unknown category falls back to other', sandbox.categoryColor('nonsense') === '#a49a8b');
ok('category label falls back to Other', sandbox.categoryLabel('nonsense') === 'Other');

/* ---------------- result ---------------- */

console.log('\n' + '-'.repeat(46));
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);