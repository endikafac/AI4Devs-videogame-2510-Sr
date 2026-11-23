/**
 * Builds mapas-EFC/data/world.js and spain.js (pre-projected SVG paths, capitals, rivers, facts).
 * Not part of the site: run it by hand when the map data must change.
 *
 *   mkdir /tmp/mapbuild && cd /tmp/mapbuild && npm init -y && npm pkg set type=module
 *   npm i world-atlas es-atlas topojson-client topojson-simplify d3-geo d3-path d3-composite-projections i18n-iso-countries polylabel world-countries
 *   cp node_modules/d3-composite-projections/d3-composite-projections.js dcp.cjs
 *   curl -L -o r50.json https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson
 *   curl -L -o pp.json https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_populated_places_simple.geojson
 *   curl -L -o lakes.json https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson
 *   node build-maps.mjs /path/to/games-hub/
 *
 * Sources: Natural Earth (public domain), world-atlas, world-countries (ODbL), es-atlas from IGN Espana
 * (CC BY 4.0, (c) Instituto Geografico Nacional). The eight Spanish rivers are hand-placed waypoints.
 */
const REPO0 = (process.argv[2] || '../').split(String.fromCharCode(92)).join('/'), REPO = REPO0.endsWith('/') ? REPO0 : REPO0 + '/';
import fs from 'fs';
import {feature} from 'topojson-client';
import {presimplify, simplify, quantile} from 'topojson-simplify';
import * as d3 from 'd3-geo';
import iso from 'i18n-iso-countries';
import {createRequire} from 'module'; const {geoConicConformalSpain} = createRequire(import.meta.url)('./dcp.cjs');
const R = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const OUT = REPO + 'mapas-EFC/data/';
const CONTENT = REPO + 'scripts/mapas-content/';
const CT = f => fs.existsSync(CONTENT + f) ? R(CONTENT + f) : null;
fs.mkdirSync(OUT, {recursive: true});
const W = 1000, H = 500;
import polylabel from 'polylabel';
function mainPoly(f, pr, gpath) {
  const g = f.geometry; const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null;
  if (!polys) return null; let best = null, ba = -1;
  for (const p of polys) { const a = gpath.area({type: 'Polygon', coordinates: p}); if (a > ba) { ba = a; best = p; } }
  if (ba >= 0.5 || polys.length === 1) return best;
  // micro-states / archipelagos with zero-area shapes: take the island closest to the middle of all of them
  const pts = polys.map(p => pr(p[0][0])).filter(Boolean); if (!pts.length) return best;
  const mx = pts.reduce((t, q) => t + q[0], 0) / pts.length, my = pts.reduce((t, q) => t + q[1], 0) / pts.length;
  let bi = 0, bd = Infinity; polys.forEach((p, i) => { const q = pr(p[0][0]); if (!q) return; const d = Math.hypot(q[0] - mx, q[1] - my); if (d < bd) { bd = d; bi = i; } });
  return polys[bi];
}
function mainBounds(f, pr, gpath) { const p = mainPoly(f, pr, gpath); return p && gpath.bounds({type: 'Polygon', coordinates: p}).flat().map(v => Math.round(v)); }
function labelPoint(f, pr, gpath) {
  const best = mainPoly(f, pr, gpath); if (!best) return null;
  const rings = best.map(r => r.map(c => pr(c)).filter(Boolean));
  if (!rings[0] || !rings[0].length) return null;
  if (rings[0].length < 3 || gpath.area({type: 'Polygon', coordinates: best}) < 0.5) { const r0 = rings[0]; return [r0.reduce((t, q) => t + q[0], 0) / r0.length, r0.reduce((t, q) => t + q[1], 0) / r0.length]; }
  try { const q = polylabel(rings, 0.2); return [q[0], q[1]]; } catch (e) { return null; }
}
const n3 = id => iso.numericToAlpha2(String(id).padStart(3, '0'));

function simp(topo, q) { const p = presimplify(topo); return simplify(p, quantile(p, q)); }

// ---------- WORLD ----------
const wt = simp(R('node_modules/world-atlas/countries-50m.json'), 0.25);
const wf = feature(wt, wt.objects.countries).features.filter(f => f.id !== '010');
const proj = d3.geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], {type: 'FeatureCollection', features: wf});
const gp = d3.geoPath(proj).digits(1);
const FIX = {Kosovo: 'XK'};
const countries = [];
for (const f of wf) {
  const i = f.id ? n3(f.id) : FIX[f.properties.name] || null;
  const d = gp(f); if (!d) continue;
  const b = mainBounds(f, proj, gp) || gp.bounds(f).flat(), area = gp.area(f), c = labelPoint(f, proj, gp) || gp.centroid(f);
  countries.push({i, n: f.properties.name, d, x: +c[0].toFixed(1), y: +c[1].toFixed(1), a: Math.round(area), b: b});
}
{ const seen = {}; countries.slice().sort((a, b) => b.a - a.a).forEach(c => { if (!c.i) return; if (seen[c.i]) c.i = null; else seen[c.i] = 1; }); }
const lk = R('lakes.json');
const lakes = lk.features.filter(f => f.properties.scalerank <= 1).map(f => gp(f)).filter(Boolean);
const pp = R('pp.json');
const caps = [];
for (const f of pp.features) {
  const p = f.properties; if (p.featurecla !== 'Admin-0 capital') continue;
  let i = p.iso_a2; if (!i || i === '-99') i = iso.alpha3ToAlpha2(p.adm0_a3) || (p.adm0_a3 === 'KOS' ? 'XK' : null);
  if (!i) continue;
  const xy = proj([p.longitude, p.latitude]); if (!xy) continue;
  caps.push({i, n: p.nameascii || p.name, x: +xy[0].toFixed(1), y: +xy[1].toFixed(1)});
}
const RIV = [
 ['amazon','Amazonas','Amazon',['Amazonas','Marañón','Ucayali']],
 ['nile','Nilo','Nile',['Nile','El Bahr el Abyad','Bahr el Jebel','Victoria Nile','Albert Nile','El Bahr el Azraq']],
 ['mississippi','Misisipi','Mississippi',['Mississippi']],
 ['missouri','Misuri','Missouri',['Missouri']],
 ['yangtze','Yangtsé','Yangtze',['Chang Jiang','Yangtze','Jinsha','Tongtian','Tuotuo']],
 ['yellow','Río Amarillo','Yellow River',['Huang']],
 ['ganges','Ganges','Ganges',['Ganges']],
 ['brahmaputra','Brahmaputra','Brahmaputra',['Brahmaputra','Yarlung','Dihang']],
 ['indus','Indo','Indus',['Indus']],
 ['mekong','Mekong','Mekong',['Mekong','Lancang']],
 ['irrawaddy','Irrawaddy','Irrawaddy',['Ayeyarwady']],
 ['danube','Danubio','Danube',['Danube','Donau']],
 ['rhine','Rin','Rhine',['Rhine','Rhin','Rhein','Waal','Nederrijn','Lek']],
 ['elbe','Elba','Elbe',['Elbe']],
 ['vistula','Vístula','Vistula',['Vistula']],
 ['oder','Óder','Oder',['Oder']],
 ['volga','Volga','Volga',['Volga']],
 ['dnieper','Dniéper','Dnieper',['Dnipro','Dnepre']],
 ['don','Don','Don',['Don']],
 ['seine','Sena','Seine',['Seine']],
 ['loire','Loira','Loire',['Loire']],
 ['garonne','Garona','Garonne',['Garonne']],
 ['rhone','Ródano','Rhône',['Rhône']],
 ['po','Po','Po',['Po']],
 ['thames','Támesis','Thames',['Thames']],
 ['tagus','Tajo','Tagus',['Tajo','Tejo']],
 ['douro','Duero','Douro',['Duero']],
 ['ebro','Ebro','Ebro',['Ebro']],
 ['congo','Congo','Congo',['Congo','Lualaba']],
 ['niger','Níger','Niger',['Niger']],
 ['zambezi','Zambeze','Zambezi',['Zambezi']],
 ['orange','Orange','Orange',['Orange']],
 ['limpopo','Limpopo','Limpopo',['Limpopo']],
 ['senegal','Senegal','Senegal',['Sénégal']],
 ['parana','Paraná','Paraná',['Paraná']],
 ['orinoco','Orinoco','Orinoco',['Orinoco']],
 ['saofrancisco','São Francisco','São Francisco',['São  Francisco']],
 ['magdalena','Magdalena','Magdalena',['Magdalena']],
 ['yukon','Yukón','Yukon',['Yukon']],
 ['mackenzie','Mackenzie','Mackenzie',['Mackenzie']],
 ['stlawrence','San Lorenzo','St. Lawrence',['St. Lawrence']],
 ['ob','Obi','Ob',['Ob']],
 ['yenisei','Yeniséi','Yenisei',['Yenisey','Verkhniy Yenisey','Malyy Yenisey']],
 ['lena','Lena','Lena',['Lena']],
 ['amur','Amur','Amur',['Amur','Heilong Jiang']],
 ['euphrates','Éufrates','Euphrates',['Euphrates','Firat','Al Furat']],
 ['tigris','Tigris','Tigris',['Tigris','Dicle']],
 ['murray','Murray','Murray',['Murray']],
 ['darling','Darling','Darling',['Darling']],
];
const rv = R('r50.json').features;
function crossed(pts, feats, key) {
  const out = []; const seen = new Set();
  for (const pt of pts) for (const f of feats) {
    const k = key(f); if (!k || seen.has(k)) continue;
    if (d3.geoContains(f, pt)) { seen.add(k); out.push(k); }
  }
  return out;
}
const rivers = [];
for (const [id, es, en, names] of RIV) {
  const set = new Set(names.map(s => s.toLowerCase()));
  const hit = rv.filter(f => set.has(String(f.properties.name).toLowerCase()) || set.has(String(f.properties.name_en).toLowerCase()));
  if (!hit.length) { console.warn('NO RIVER', id); continue; }
  const lines = []; const pts = [];
  for (const f of hit) {
    const g = f.geometry; const ls = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
    for (const l of ls) { lines.push(l); l.forEach((p, k) => { if (k % 3 === 0) pts.push(p); }); }
  }
  const d = gp({type: 'MultiLineString', coordinates: lines});
  const cs = crossed(pts, wf, f => f.id ? n3(f.id) : null);
  const lg = lines.slice().sort((a, b) => b.length - a.length)[0]; const mid = proj(lg[Math.floor(lg.length / 2)]);
  const bb = gp.bounds({type: 'MultiLineString', coordinates: lines}).flat().map(v => Math.round(v));
  rivers.push({id, es, en, d, c: cs, b: bb, x: +mid[0].toFixed(1), y: +mid[1].toFixed(1)});
}
const oceans = [
 ['Océano Atlántico','Atlantic Ocean',-35,15],['Océano Pacífico','Pacific Ocean',-150,5],['Océano Pacífico','Pacific Ocean',160,-5],
 ['Océano Índico','Indian Ocean',78,-20],['Océano Ártico','Arctic Ocean',0,80],['Mar Mediterráneo','Mediterranean Sea',16,35],
 ['Océano Atlántico','Atlantic Ocean',-25,-30],
].map(([es, en, lo, la]) => { const p = proj([lo, la]); return {es, en, x: +p[0].toFixed(1), y: +p[1].toFixed(1)}; });
import vm from 'vm';
const G = vm.runInNewContext(fs.readFileSync(REPO + 'geoQuiz-EFC/data.js','utf8').replace('const GQ_DATA','var GQ_DATA') + ';' + fs.readFileSync(REPO + 'geoQuiz-EFC/data-extra.js','utf8').replace(/GQ_DATA/g,'GQ_DATA') + ';GQ_DATA', {});
const CONT = {'Europa':'EU','Asia':'AS','África':'AF','América del Norte':'NA','América del Sur':'SA','Oceanía':'OC'};
const facts = {};
const wc = JSON.parse(fs.readFileSync('node_modules/world-countries/countries.json','utf8'));
const RG = {Europe:'EU',Asia:'AS',Africa:'AF',Oceania:'OC'};
for (const c of wc) {
  const cont = c.region === 'Americas' ? (c.subregion === 'South America' ? 'SA' : 'NA') : RG[c.region];
  if (!cont) continue;
  facts[c.cca2] = [(c.capital && c.capital[0]) || '', cont, 3, (c.independent || ['XK','PS','TW'].includes(c.cca2)) ? 1 : 0];
}
for (const c of G.countries) if (c.iso) { const f = facts[c.iso] || ['', CONT[c.continent] || '', c.level]; f[0] = c.capital; f[2] = c.level; f[3] = 1; if (CONT[c.continent]) f[1] = CONT[c.continent]; facts[c.iso] = f; }
console.log('facts', Object.keys(facts).length, 'missing:', countries.filter(c => c.i && !facts[c.i]).map(c => c.i + ':' + c.n).join(', '));
const box = (l0, la0, l1, la1) => { const a = proj([l0, la1]), b = proj([l1, la0]); return [Math.round(a[0]), Math.round(a[1]), Math.round(b[0] - a[0]), Math.round(b[1] - a[1])]; };
const views = {EU: box(-25, 34, 45, 72), AS: box(26, -11, 150, 78), AF: box(-20, -36, 52, 38), NA: box(-170, 6, -50, 84), SA: box(-84, -57, -33, 14), OC: box(110, -48, 180, -2)};
const cc = CT('countries.json') || {}, rc = CT('rivers.json') || {}, mc = CT('mountains.json') || {};
{ // extra Spanish rivers and mountains (second batch), ids must be unique
  const r2 = CT('rivers-spain2.json') || {}, m2 = CT('mountains-spain2.json') || {};
  const ids = new Set((rc.spain || []).map(x => x.id).concat(Object.keys(rc.spainExisting || {})));
  rc.spain = (rc.spain || []).concat((r2.spain || []).filter(x => !ids.has(x.id)));
  const r3 = CT('rivers-spain3.json') || {}, ids3 = new Set(rc.spain.map(x => x.id).concat(Object.keys(rc.spainExisting || {})));
  rc.spain = rc.spain.concat((r3.spain || []).filter(x => !ids3.has(x.id)));
  const mi = new Set((mc.spain || []).map(x => x.id));
  mc.spain = (mc.spain || []).concat((m2.spain || []).filter(x => !mi.has(x.id)));
}
const a3 = {}; wc.forEach(c => { a3[c.cca3] = c.cca2; });
const info = {};
wc.forEach(c => {
  if (!facts[c.cca2] || !facts[c.cca2][3]) return;
  const x = cc[c.cca2] || {};
  info[c.cca2] = {km2: Math.round(c.area || 0), langs: Object.keys(c.languages || {}), cur: Object.keys(c.currencies || {}), nb: (c.borders || []).map(b => a3[b]).filter(Boolean), pop: x.pop, fact: x.fact, known: x.known};
});
rivers.forEach(r => { const x = (rc.world || {})[r.id]; if (x) { r.km = x.km; r.src = x.source; r.mouth = x.mouth; r.fact = x.fact; } });
const mount = ((mc.world) || []).map(m => { const p = proj([m.lon, m.lat]); return p && {id: m.id, es: m.es, en: m.en, m: m.m, kind: m.kind, where: m.where, fact: m.fact, x: +p[0].toFixed(1), y: +p[1].toFixed(1)}; }).filter(Boolean);
const world = {w: W, h: H, countries, lakes, caps, rivers, oceans, facts, views, info, mount};
fs.writeFileSync(OUT + 'world.js', 'window.MapData=window.MapData||{};MapData.world=' + JSON.stringify(world) + ';\n');
console.log('world', fs.statSync(OUT + 'world.js').size, 'countries', countries.length, 'caps', caps.length, 'rivers', rivers.length);
const have = new Set(countries.map(c => c.i));
console.log('caps without country', caps.filter(c => !have.has(c.i)).map(c => c.i + ':' + c.n).join(', '));
console.log('countries without iso', countries.filter(c => !c.i).map(c => c.n).join(', '));

// ---------- SPAIN ----------
const sp = geoConicConformalSpain();
const ct = simp(R('node_modules/es-atlas/es/provinces.json'), 0.3);
const ccaa = feature(ct, ct.objects.autonomous_regions).features;
const prov = feature(ct, ct.objects.provinces).features;
sp.fitExtent([[6, 6], [W - 6, H - 6]], {type: 'FeatureCollection', features: ccaa});
const sg = d3.geoPath(sp).digits(1);
const pack = fs_ => fs_.map(f => { const c = labelPoint(f, sp, sg) || sg.centroid(f); return {n: f.properties.name, d: sg(f), x: +c[0].toFixed(1), y: +c[1].toFixed(1), a: Math.round(sg.area(f))}; });
const rsp = [
 ['minho','Miño','Miño',[[-7.18,43.19],[-7.55,42.7],[-7.86,42.34],[-8.4,42.1],[-8.75,41.95],[-8.87,41.88]]],
 ['duero','Duero','Duero',[[-2.85,41.98],[-2.47,41.76],[-3.69,41.67],[-4.72,41.65],[-5.0,41.52],[-5.75,41.5],[-6.4,41.3],[-6.9,41.2],[-7.4,41.15],[-8.0,41.1],[-8.67,41.14]]],
 ['tajo','Tajo','Tajo',[[-1.65,40.4],[-2.1,40.55],[-2.73,40.48],[-3.6,40.03],[-4.02,39.86],[-4.83,39.96],[-5.6,39.9],[-6.4,39.75],[-6.9,39.7],[-7.4,39.55],[-8.0,39.45],[-8.69,39.2],[-9.0,38.85],[-9.3,38.68]]],
 ['ebro','Ebro','Ebro',[[-4.2,43.0],[-3.7,42.75],[-3.2,42.7],[-2.95,42.68],[-2.45,42.47],[-1.6,42.1],[-0.88,41.65],[-0.04,41.23],[0.29,41.37],[0.55,41.23],[0.52,40.81],[0.87,40.72]]],
 ['guadalquivir','Guadalquivir','Guadalquivir',[[-2.95,37.95],[-3.4,38.1],[-4.05,38.04],[-4.78,37.88],[-5.3,37.65],[-5.99,37.39],[-6.2,37.0],[-6.35,36.78]]],
 ['guadiana','Guadiana','Guadiana',[[-2.85,38.95],[-3.7,39.0],[-4.5,38.98],[-5.4,38.9],[-6.34,38.92],[-7.0,38.88],[-7.3,38.5],[-7.5,38.0],[-7.66,37.64],[-7.5,37.3],[-7.4,37.18]]],
 ['jucar','Júcar','Júcar',[[-1.95,40.3],[-2.13,40.07],[-2.08,39.55],[-1.6,39.2],[-1.1,39.22],[-0.7,39.12],[-0.4,39.15],[-0.24,39.17]]],
 ['segura','Segura','Segura',[[-2.6,38.0],[-2.1,38.2],[-1.42,38.24],[-1.13,37.98],[-0.94,38.08],[-0.65,38.09]]],
];
const spc = CT('spain.json') || {};
const smooth = (id, es, en, ls, extra, feats) => {
  const pts = [];
  for (let k = 0; k < ls.length - 1; k++) for (let t = 0; t < 1; t += 0.2) pts.push([ls[k][0] + (ls[k + 1][0] - ls[k][0]) * t, ls[k][1] + (ls[k + 1][1] - ls[k][1]) * t]);
  const pr = ls.map(p => sp(p));
  const f1 = p => p[0].toFixed(1) + ',' + p[1].toFixed(1), mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
  let d = 'M' + f1(pr[0]) + 'L' + f1(mid(pr[0], pr[1]));
  for (let k = 1; k < pr.length - 1; k++) d += 'Q' + f1(pr[k]) + ' ' + f1(mid(pr[k], pr[k + 1]));
  d += 'L' + f1(pr[pr.length - 1]);
  const out = ls.slice(0, -1).filter(p => !ccaa.some(f => d3.geoContains(f, p)));
  if (out.length > 1) console.warn('RIVER POINTS OUTSIDE SPAIN', id, JSON.stringify(out));
  const m = pr[Math.floor(pr.length / 2)];
  const xs = pr.map(p => p[0]), ys = pr.map(p => p[1]);
  const o = {id, es, en, d, c: crossed(pts, feats || ccaa, f => f.properties.name), b: [Math.round(Math.min(...xs)), Math.round(Math.min(...ys)), Math.round(Math.max(...xs)), Math.round(Math.max(...ys))], x: +m[0].toFixed(1), y: +m[1].toFixed(1)};
  if (extra && extra.eu) o.eu = extra.eu;
  if (extra) { o.km = extra.km; o.kmNote = extra.kmNote; o.src = extra.source; o.mouth = extra.mouth; o.fact = extra.fact; }
  return o;
};
const sivers = rsp.map(([id, es, en, ls]) => smooth(id, es, en, ls, (rc.spainExisting || {})[id]));
(rc.spain || []).forEach(r => { if (r.pts && r.pts.length > 2) sivers.push(smooth(r.id, r.es, r.en, r.pts, r)); });
const smount = ((mc.spain) || []).map(m => { const p = sp([m.lon, m.lat]); return p && {id: m.id, es: m.es, en: m.en, m: m.m, kind: m.kind, where: m.where, fact: m.fact, x: +p[0].toFixed(1), y: +p[1].toFixed(1)}; }).filter(Boolean);
const addInf = (arr, tbl) => arr.map(r => { const x = (tbl || {})[r.n]; if (x) r.inf = x; if (eu && eu.territories && eu.territories[r.n]) r.inf = Object.assign({}, r.inf, eu.territories[r.n]); return r; });
const bb2 = sg.bounds({type: 'FeatureCollection', features: ccaa}), vbS = [Math.round(bb2[0][0]) - 12, Math.round(bb2[0][1]) - 12, Math.round(bb2[1][0] - bb2[0][0]) + 24, Math.round(bb2[1][1] - bb2[0][1]) + 24];
// neighbouring countries drawn with the Spain projection, for orientation (Portugal, France, Andorra, Morocco, Algeria)
const NBR = {'620': 'PT', '250': 'FR', '020': 'AD', '504': 'MA', '012': 'DZ'};
const neighbors = wf.filter(f => NBR[String(f.id).padStart(3, '0')]).map(f => {
  const iso2 = NBR[String(f.id).padStart(3, '0')], d = sg(f); if (!d) return null;
  const c = labelPoint(f, sp, sg), inside = c && c[0] > vbS[0] && c[0] < vbS[0] + vbS[2] && c[1] > vbS[1] && c[1] < vbS[1] + vbS[3];
  return {i: iso2, n: f.properties.name, d, x: inside ? +c[0].toFixed(1) : null, y: inside ? +c[1].toFixed(1) : null};
}).filter(Boolean);
const eu = CT('euskadi.json');
if (eu) { const e2 = CT('euskadi-rivers2.json'); if (e2) { const have = new Set((eu.rivers || []).map(x => x.id)); eu.rivers = (eu.rivers || []).concat((e2.rivers || []).filter(x => !have.has(x.id))); Object.entries(e2.kmFix || {}).forEach(([id, km]) => { const r = eu.rivers.find(x => x.id === id); if (r && !r.km) r.km = km; }); } }
let eus = null;
if (eu) {
  const EUP = ['Araba/Álava', 'Bizkaia', 'Gipuzkoa'], euFeats = prov.filter(f => EUP.includes(f.properties.name));
  const bb3 = sg.bounds({type: 'FeatureCollection', features: euFeats}), pw = (bb3[1][0] - bb3[0][0]) * 0.06, ph = (bb3[1][1] - bb3[0][1]) * 0.06;
  const pt = (lon, lat) => { const p = sp([lon, lat]); return [+p[0].toFixed(1), +p[1].toFixed(1)]; };
  eus = {
    vb: [Math.round(bb3[0][0] - pw), Math.round(bb3[0][1] - ph), Math.round(bb3[1][0] - bb3[0][0] + 2 * pw), Math.round(bb3[1][1] - bb3[0][1] + 2 * ph)],
    towns: (eu.towns || []).map(t => { const p = pt(t.lon, t.lat); return {id: t.id, es: t.es, en: t.es, eu: t.eu, territory: t.territory, pop: t.pop, known: t.known, fact: t.fact, x: p[0], y: p[1]}; }),
    mount: (eu.mountains || []).map(m => { const p = pt(m.lon, m.lat); return {id: m.id, es: m.es, en: m.en || m.es, eu: m.eu, m: m.m, kind: m.kind, where: m.where, fact: m.fact, x: p[0], y: p[1]}; }),
    rivers: (eu.rivers || []).filter(r => r.pts && r.pts.length > 2).map(r => smooth('eu-' + r.id, r.es, r.en || r.es, r.pts, Object.assign({eu: r.eu}, r), euFeats))
  };
}
const spain = {neighbors, eus, vb: vbS, w: W, h: H, ccaa: addInf(pack(ccaa), spc.ccaa), prov: addInf(pack(prov), spc.prov), rivers: sivers, mount: smount, border: sp.getCompositionBorders()};
fs.writeFileSync(OUT + 'spain.js', 'window.MapData=window.MapData||{};MapData.spain=' + JSON.stringify(spain) + ';\n');
console.log('spain', fs.statSync(OUT + 'spain.js').size, spain.ccaa.map(c => c.n).join('|'));
console.log(spain.prov.map(c => c.n).join('|'));
