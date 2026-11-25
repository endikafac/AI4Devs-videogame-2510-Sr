import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const P = require(path.join(root, 'platform/progress-panel.js'));
const R = require(path.join(root, 'readingCoach-EFC/game.js'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const NOW = new Date(2026, 10, 25, 12).getTime();           // 25 Nov 2026, local noon
const day = n => P.dayKey(new Date(2026, 10, 25 - n, 12).getTime());
const ph = s => [...new Set([...String(s).matchAll(/\{([a-z]+)(?:\?[^{}]*)?\}/g)].map(m => m[1]))].sort().join(',');

function loadFirestore() {
  const ctx = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, PlatformI18n: { t: k => k }, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('platform/firestore.js') + ';this.PF = PlatformFirestore;', ctx);
  return ctx.PF;
}

test('U-PROG-I18N: every text exists in the six languages, keeps its placeholders and has no dashes', () => {
  assert.deepEqual(P.LANGS, ['es', 'en', 'eu', 'gl', 'ca', 'fr']);
  const tables = { ROWS: P.ROWS, GAME_NAMES: P.GAME_NAMES, MAP_NAMES: P.MAP_NAMES };
  for (const [tn, table] of Object.entries(tables)) {
    for (const [k, row] of Object.entries(table)) {
      assert.equal(row.length, 6, tn + '.' + k);
      row.forEach((s, i) => {
        assert.ok(typeof s === 'string' && s.trim(), tn + '.' + k + '[' + i + '] empty');
        assert.ok(!/[—–]/.test(s), tn + '.' + k + '[' + i + '] has a dash');
        assert.equal(ph(s), ph(row[0]), tn + '.' + k + '[' + i + '] placeholders');
      });
    }
  }
  assert.equal(P.dict('xx').title, P.dict('es').title, 'unknown language falls back to Spanish');
  assert.equal(P.fmt('{a} y {a} {b}', { a: 1, b: null }), '1 y 1 ');
  assert.equal(P.fmt('{n} {n?día|días}', { n: 1 }), '1 día');
  assert.equal(P.fmt('{n} {n?día|días}', { n: 5 }), '5 días');
});

test('U-PROG-TABLES: zones, unit totals, map stores and game folders match the games', () => {
  R.BANDS.forEach(b => assert.deepEqual(P.READ_ZONES[b.id], b.zone, 'zone of ' + b.id));
  assert.equal(Object.keys(P.READ_ZONES).length, R.BANDS.length);
  for (const [gid, dir] of [['calcpath', 'calcPath-EFC'], ['clock', 'clock-EFC'], ['fractions', 'fractions-EFC']]) {
    const src = read(dir + '/game.js');
    const from = src.indexOf('const UNITS = [');
    const block = src.slice(from, src.indexOf('\n    ];', from));
    assert.equal((block.match(/\bid:/g) || []).length, P.UNIT_TOTALS[gid], gid + ' units');
  }
  const maps = read('mapas-EFC/game.js');
  const stores = [...new Set([...maps.matchAll(/store: '([a-z]+)'/g)].map(m => m[1]))];
  assert.deepEqual(P.MAP_STORES.slice().sort(), stores.sort());
  for (const [gid, g] of Object.entries(P.GAMES)) assert.ok(fs.existsSync(path.join(root, g.dir, 'index.html')), gid + ' folder');
  // every id the games write is known to the panel
  const written = new Set();
  for (const d of fs.readdirSync(root).filter(x => /-(EFC|EHS)$/.test(x))) {
    for (const f of fs.readdirSync(path.join(root, d), { recursive: true }).filter(x => /\.(js|html)$/.test(x))) {
      const s = read(d + '/' + f.replace(/\\/g, '/'));
      for (const m of s.matchAll(/updateGameStats\([^,]+,\s*'([A-Za-z]+)'/g)) written.add(m[1]);
    }
  }
  assert.ok(written.size >= 10, 'found the game ids');
  for (const id of written) assert.ok(P.GAMES[id], 'game id written by a game but unknown to the panel: ' + id);
});

test('U-PROG-DAILY: updateGameStats keeps a per day summary, capped at 60 days, safe with junk', () => {
  const PF = loadFirestore();
  assert.equal(PF.dayKey(NOW), '2026-11-25');
  const s = { totalGames: 0, totalCorrect: 0, totalAttempts: 0, totalTime: 0, bestStreak: 0, byOperation: {}, byLevel: {}, unlockedAchievements: [] };
  PF._mergeStats(s, { correctAnswers: 8, totalQuestions: 10, totalAttempts: 10, bestStreak: 4, elapsedSeconds: 90, level: 1, operation: 'suma' });
  PF._mergeStats(s, { correctAnswers: 5, totalQuestions: 10, totalAttempts: 10, bestStreak: 2, elapsedSeconds: 30, level: 1, operation: 'suma' });
  const k = PF.dayKey();
  assert.deepEqual(JSON.parse(JSON.stringify(s.daily[k])), { games: 2, items: 20, minutes: 2, ok: 13 });
  assert.equal(s.totalGames, 2, 'existing counters untouched');
  // junk never throws nor writes NaN
  const j = { daily: 'x' };
  PF._addDaily(j, { correctAnswers: 'a', totalAttempts: -3, elapsedSeconds: NaN }, NOW);
  assert.deepEqual(JSON.parse(JSON.stringify(j.daily[PF.dayKey(NOW)])), { games: 1, items: 0, minutes: 0, ok: 0 });
  // pruning
  const big = { daily: {} };
  for (let i = 0; i < 90; i++) big.daily[PF.dayKey(new Date(2026, 5, 1 + i, 12).getTime())] = { games: 1, items: 1, minutes: 1, ok: 1 };
  PF._addDaily(big, { totalAttempts: 1, correctAnswers: 1, elapsedSeconds: 60 }, NOW);
  assert.equal(Object.keys(big.daily).length, PF.DAILY_KEEP);
  assert.ok(big.daily[PF.dayKey(NOW)], 'today is kept');
  assert.ok(PF.DAILY_KEEP <= 62 && /d\.daily\.size\(\) <= 62/.test(read('firestore.rules')), 'rule cap matches the client cap');
  // typing speed
  const ty = { totalGames: 0, totalCorrect: 0, totalAttempts: 0, totalTime: 0, bestStreak: 0, byOperation: {}, byLevel: {}, unlockedAchievements: [] };
  PF._mergeStats(ty, { wpm: 31.6, correctAnswers: 1, totalAttempts: 1, elapsedSeconds: 10, level: 1, operation: 'typing' });
  PF._mergeStats(ty, { wpm: 20, correctAnswers: 1, totalAttempts: 1, elapsedSeconds: 10, level: 1, operation: 'typing' });
  assert.equal(ty.bestWpm, 32); assert.equal(ty.lastWpm, 20);
});

test('U-PROG-WINDOW: the 7 and 30 day windows count the right days', () => {
  assert.deepEqual(P.lastDays(3, NOW), [day(0), day(1), day(2)]);
  const e = games => ({ games, items: games * 10, minutes: games * 2.5 });
  const stats = {
    reading: { daily: { [day(0)]: e(2), [day(6)]: e(1), [day(7)]: e(4), [day(29)]: e(1), [day(30)]: e(9), basura: e(5) } },
    mapas: { daily: { [day(0)]: e(1), [day(3)]: { games: -4, items: 'x', minutes: null } } }
  };
  const a = P.activity(stats, [], NOW);
  assert.deepEqual([a.d7.days, a.d7.games, a.d7.minutes, a.d7.kinds], [2, 4, 10, 2], '7 days: today and 6 days ago, not 7 days ago');
  assert.deepEqual([a.d30.days, a.d30.games, a.d30.kinds], [4, 9, 2], '30 days: includes day 29, not day 30');
  assert.equal(a.series.length, 14);
  assert.equal(a.series[13].day, day(0));
  assert.equal(a.series[13].games, 3);
  assert.equal(a.series[0].day, day(13));
  // hint days from the device add days but no games
  const h = P.activity({}, [day(1), day(40), 'zz'], NOW);
  assert.deepEqual([h.d7.days, h.d7.games, h.d30.days], [1, 0, 1]);
  assert.deepEqual(P.activity(null, null, NOW).d7, { days: 0, games: 0, items: 0, minutes: 0, kinds: 0 });
});

test('U-PROG-ZONES: reading zone wording follows the band and never shows a grade', () => {
  assert.equal(P.zoneStatus(50, 'b78'), 'below'); assert.equal(P.zoneStatus(60, 'b78'), 'in');
  assert.equal(P.zoneStatus(95, 'b78'), 'in'); assert.equal(P.zoneStatus(96, 'b78'), 'above');
  const t = P.dict('es');
  const mk = (ppm, c, n) => ({ hist: [{ d: day(0), ppm, id: 'a', b: 'b78' }], qlog: [{ d: day(0), id: 'a', b: 'b78', c, n }], texts: {} });
  let r = P.analyseReading(mk(80, 5, 5), t);
  assert.ok(r.lines.includes(t.rdIn)); assert.ok(r.strong.includes(t.sRdZone)); assert.ok(r.strong.includes(t.sRdComp));
  assert.ok(r.lines.includes('Mejor lectura: 80 palabras por minuto'));
  assert.ok(r.lines.includes('Comprensión: muy buena'));
  r = P.analyseReading(mk(40, 2, 5), t);
  assert.ok(r.lines.includes(t.rdBelow)); assert.ok(r.weak.includes(t.wRdPace)); assert.ok(r.weak.includes(t.wRdComp));
  assert.ok(r.lines.includes('Comprensión: en camino'));
  r = P.analyseReading(mk(130, 4, 5), t);
  assert.ok(r.lines.includes(t.rdAbove)); assert.deepEqual(r.weak, [], 'faster than the zone is not a weakness');
  assert.ok(r.lines.includes('Comprensión: buena'));
  const prog = { texts: { 'es-rob-1': { stars: 3, quiz: 1 }, 'es-rob-2': { stars: 2, quiz: 1 }, 'es-rob-3': { stars: 1 }, 'es-x-1': { stars: 2, quiz: 1 }, plain: { quiz: 1 } } };
  assert.ok(P.analyseReading(prog, t).lines.includes('Libros: 3 capítulos terminados, 7 estrellas'));
  assert.deepEqual(P.analyseReading(null, t).lines, []);
  assert.equal(P.accuracyWord(9, 10, 10), 'high'); assert.equal(P.accuracyWord(7, 10, 10), 'mid');
  assert.equal(P.accuracyWord(3, 10, 10), 'low'); assert.equal(P.accuracyWord(3, 5, 10), '');
  assert.equal(P.accuracyWord(50, 10, 10), 'high', 'correct never exceeds attempts');
  for (const l of P.LANGS) {
    const tl = P.dict(l);
    const all = P.analyseStats('mathmaster', { totalGames: 4, totalCorrect: 90, totalAttempts: 100, totalTime: 600, byLevel: { level_3: {}, level_5: {} } }, l, tl).lines.join('|');
    assert.ok(!/%/.test(all), 'no percentages: ' + all);
  }
});

test('U-PROG-LOCAL: device progress is read only with a child id and the right account uid', () => {
  const OWN = 'adultUid01', OWNER = 'ownerUid99', PID = 'kid123abc', OTHER = 'kid999zzz';
  const data = {
    ['reading_' + OWN + '_' + PID]: { hist: [{ d: day(1), ppm: 70, id: 'a', b: 'b78' }] },
    ['reading_' + OWN]: { hist: [{ d: day(0), ppm: 999, id: 'adult', b: 'adult' }] },                       // adult's own progress: never read
    ['reading_' + OWN + '_' + OTHER]: { hist: [{ d: day(0), ppm: 888, id: 'other', b: 'b78' }] },           // another child
    ['mapas_world_' + OWNER + '_' + PID]: { PE: { o: 1, f: 3, s: 0, t: NOW } },
    ['calc_prog_stranger1_' + PID]: { units: { a10: { stars: 3 } } },                                          // uid we were not told about
    mapas_totals: JSON.stringify({ world: 195 })
  };
  const store = { getItem: k => (k in data ? (typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k])) : null) };
  const l = P.readLocal(store, [OWN, OWNER, OWN], PID);
  assert.equal(l.found, true);
  assert.equal(l.reading.hist[0].ppm, 70);
  assert.ok(l.mapas.world && l.mapas.world.PE);
  assert.equal(l.calcpath, null);
  assert.deepEqual(l.totals, { world: 195 });
  assert.equal(JSON.stringify(l).includes('999'), false); assert.equal(JSON.stringify(l).includes('888'), false);
  for (const bad of ['', 'x', null, undefined, '../etc', 'UPPERCASE1', 'a'.repeat(30)]) assert.equal(P.readLocal(store, [OWN], bad).found, false, 'pid ' + bad);
  assert.equal(P.readLocal(store, ['bad uid', '', null, 5], PID).found, false);
  assert.equal(P.readLocal(null, [OWN], PID).found, false);
  assert.equal(P.readLocal({ getItem: () => { throw new Error('blocked'); } }, [OWN], PID).found, false);
  assert.deepEqual(P.localDays(l).sort(), [day(1), P.dayKey(NOW)].sort());
});

test('U-PROG-GAMES: maps, vocabulary and units are told in plain words', () => {
  const t = P.dict('es');
  const maps = { world: { PE: { o: 0, f: 4, s: 0, t: NOW }, TD: { o: 1, f: 2, s: 0 }, FR: { o: 5, f: 0, s: 5 }, ES: { o: 5, f: 0, s: 3 }, IT: { o: 4, f: 0, s: 2 }, DE: { o: 3, f: 0, s: 2 }, PT: { o: 3, f: 0, s: 4 } },
    rives: { a: { o: 0, f: 2, s: 0 }, b: { o: 0, f: 1, s: 0 } } };
  const m = P.analyseMaps(maps, { world: 193 }, 'es', t);
  assert.ok(m.lines.includes('Mundo: 5 de 193 dominados'));
  assert.ok(m.lines.includes('Ríos de España: 0 de 30 dominados'));
  assert.equal(m.weak.length, 2);
  assert.match(m.weak[0], /^Mapas, países: .*Perú.*Chad/s, 'most failed first, with real names');
  assert.match(m.weak[1], /Ríos de España: 2 por repasar/);
  assert.deepEqual(m.strong, ['Mapas: Mundo']);
  assert.equal(P.analyseMaps({}, null, 'es', t).lines.length, 0);

  const v = P.analyseVocab({ animales: { gato: { b: 4 }, perro: { b: 3 }, vaca: { b: 1 }, pez: { b: 0 }, loro: { b: 0 }, x: 'junk' } }, t);
  assert.deepEqual(v.lines, ['Palabras aprendidas: 2', 'Palabras en práctica: 1']);
  assert.deepEqual(v.weak, ['Vocabulario: pez, loro']);
  assert.deepEqual(P.analyseVocab({}, t).lines, []);

  const u = P.analyseUnits('clock', { units: { a: { stars: 3 }, b: { stars: 3 }, c: { stars: 3 }, d: { stars: 1 } }, last: day(2) }, 'es', t);
  assert.deepEqual(u.lines, ['Unidad alcanzada: 4 de 10', 'Estrellas: 10 de 30']);
  assert.deepEqual(u.strong, ['Relojes: 3 unidades con tres estrellas']); assert.deepEqual(u.weak, ['Relojes: 1 unidad para repasar con calma']);
  assert.equal(u.last, day(2));
  const ty = P.analyseStats('typingMaster', { totalGames: 3, totalTime: 300, bestWpm: 28 }, 'es', t);
  assert.ok(ty.lines.includes('Mejor velocidad: 28 palabras por minuto'));
  const mm = P.analyseStats('mathmaster', { totalGames: 3, totalCorrect: 28, totalAttempts: 30, byLevel: { level_2: {}, level_4: {} } }, 'es', t);
  assert.ok(mm.lines.includes('Nivel alcanzado: 4') && mm.lines.includes('Aciertos: casi todo bien'));
  assert.deepEqual(P.analyseStats('snake', { totalGames: 3, totalCorrect: 90, totalAttempts: 90 }, 'es', t).lines, ['Partidas jugadas: 3'], 'luck or score games say nothing about accuracy');
});

test('U-PROG-KIDS: only children enter the list, never the adult or foreign adults', () => {
  const ME = 'adultUid01';
  const kids = P.selectKids(ME,
    [{ pid: 'kid123abc', username: 'Pipo', avatar: '🐼' }, { pid: 'BAD id', username: 'x' }, { pid: 'kid123abc', username: 'duplicado' }, null],
    [{ m: { ownerUid: 'ownerUid99', ownerName: 'Marta', role: 'view' }, ks: [{ pid: 'kid777abc', username: 'Nora' }] },
     { m: { ownerUid: ME, ownerName: 'yo' }, ks: [{ pid: 'selfkid123', username: 'no' }] },
     { m: { ownerUid: 'bad uid!', ownerName: 'x' }, ks: [{ pid: 'kidxxx123', username: 'no' }] },
     { m: null, ks: [{ pid: 'kidyyy123', username: 'no' }] }]);
  assert.deepEqual(kids.map(k => [k.owner, k.pid, k.name, k.family, k.role]),
    [[ME, 'kid123abc', 'Pipo', '', 'owner'], ['ownerUid99', 'kid777abc', 'Nora', 'Marta', 'view']]);
  assert.deepEqual(P.selectKids('', [{ pid: 'kid123abc' }], []), []);
  assert.deepEqual(P.selectKids(ME, null, null), []);
});

test('U-PROG-SUMMARY: friendly weekly sentence and next suggestion', () => {
  const base = { name: 'Pipo', lang: 'es', now: NOW };
  const quiet = P.build({ ...base, stats: {}, local: null });
  assert.equal(quiet.suggestion.type, 'start');
  assert.equal(quiet.summary, 'Pipo no ha jugado esta semana. Para la próxima vez, os propongo empezar con Lectura, un buen primer paso.');
  assert.equal(quiet.suggestion.href, 'readingCoach-EFC/index.html');

  const e = g => ({ games: g, items: g * 10, minutes: g * 3 });
  const stats = { mathmaster: { totalGames: 6, totalCorrect: 95, totalAttempts: 100, totalTime: 900, daily: { [day(0)]: e(2), [day(2)]: e(1) } },
                  clock: { totalGames: 2, totalCorrect: 5, totalAttempts: 20, totalTime: 120, daily: { [day(1)]: e(1) } } };
  const m = P.build({ ...base, stats, local: null });
  assert.deepEqual([m.activity.d7.days, m.activity.d7.games, m.activity.d7.minutes], [3, 4, 12]);
  assert.equal(m.summary, 'Pipo ha jugado 3 días esta semana, con 4 partidas y unos 12 minutos. Lo que mejor se le da: MathMaster: muchos aciertos. Para la próxima vez, os propongo repasar Relojes, que tiene cosas por reforzar.');
  assert.equal(m.suggestion.type, 'weak'); assert.equal(m.suggestion.gid, 'clock');
  assert.ok(m.cards.find(c => c.gid === 'mathmaster'));
  assert.ok(!/[—–]/.test(m.summary));

  const old = { reading: { totalGames: 2, daily: { [day(10)]: e(1) } }, mapas: { totalGames: 1, daily: { [day(1)]: e(1) } } };
  const r = P.build({ ...base, stats: old, local: null });
  assert.equal(r.suggestion.type, 'rest'); assert.equal(r.suggestion.gid, 'reading');
  const fresh = P.build({ ...base, stats: { reading: { totalGames: 2, daily: { [day(0)]: e(1) } }, mapas: { totalGames: 1, daily: { [day(1)]: e(1) } } }, local: null });
  assert.equal(fresh.suggestion.type, 'new'); assert.equal(fresh.suggestion.gid, 'calcpath');
  for (const l of P.LANGS) {
    const s = P.build({ ...base, lang: l, stats, local: null }).summary;
    assert.ok(s.includes('Pipo') && !/\{|\}/.test(s) && !/[—–]/.test(s), l + ': ' + s);
  }
});
