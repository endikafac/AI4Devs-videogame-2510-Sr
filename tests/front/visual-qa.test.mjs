import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

// Visual / usability QA of the child-facing games on a phone (390x844) and a laptop (1280x800), dark and light theme.
// Checks on the menu and on a question screen: no horizontal scroll, tap targets >= 48px, text >= 14px,
// nothing hidden under the sticky platform header, game screens start at the top of the page.
// QA_SHOTS=<dir> also saves a screenshot per game / viewport / theme.
const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const SHOTS = process.env.QA_SHOTS || '';
let server, base, browser;

before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, r));
  base = 'http://localhost:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); server?.close(); });

// ── in-page audit ──────────────────────────────────────────────────────────
// The platform header (platform/) is shared and out of scope here; grid cells (wordsearch / crossword letters) and the
// on-screen keyboard keys are not buttons a child taps one by one, so they are not held to the 48px rule.
function audit({ minTap = 48, minFont = 14 }) {
  const hdr = document.getElementById('platform-header');
  const hb = hdr ? hdr.getBoundingClientRect().bottom : 0;
  const out = { hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, scrollY: window.scrollY, hb, small: [], tap: [], hidden: [] };
  const visible = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const isGrid = e => e.closest('.ws-cell, .cw-cell, .ty-key, .ty-keyboard, .ty-lesson-kb, #ws-grid, #cw-grid');
  const seen = new Set();
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? '' : e.className).trim().split(/\s+/).slice(0, 2).join('.'));
  document.querySelectorAll('body *').forEach(e => {
    if (e.closest('#platform-header, #platform-settings-panel, [id^=platform-], script, style, svg, [hidden], [aria-hidden="true"], .jx-confetti')) return;
    if (!visible(e)) return;
    const r = e.getBoundingClientRect();
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (own && !isGrid(e) && !e.matches('.cw-num')) {
      const fs = parseFloat(getComputedStyle(e).fontSize);
      if (fs < minFont - 0.01) { const k = name(e) + fs; if (!seen.has(k)) { seen.add(k); out.small.push(`${name(e)} ${fs}px "${e.textContent.trim().slice(0, 18)}"`); } }
    }
    if (e.matches('button, a[href], [role=button], select, input:not([type=hidden]):not([type=checkbox]):not([type=radio])') && !isGrid(e)) {
      if (r.width < minTap - 0.5 || r.height < minTap - 0.5) { const k = 't' + name(e); if (!seen.has(k)) { seen.add(k); out.tap.push(`${name(e)} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.value || '').trim().slice(0, 14)}"`); } }
      // content tucked under the sticky header (only meaningful while the page is at the top)
      if (window.scrollY === 0 && r.top < hb - 1 && r.bottom > 1 && !e.closest('[style*="position: fixed"], [style*="position:fixed"]')) out.hidden.push(`${name(e)} top=${Math.round(r.top)} header=${Math.round(hb)}`);
    }
  });
  return out;
}

// ── helpers to reach a question screen ─────────────────────────────────────
const C = s => async p => { await p.waitForSelector(s, { timeout: 8000 }); await p.click(s); };
const W = s => async p => { await p.waitForSelector(s, { timeout: 8000 }); };
const E = f => async p => { await p.evaluate(f); };
const stepsOf = (...fs) => async p => { for (const f of fs) await f(p); await p.waitForTimeout(300); };

const GAMES = {
  calcPath: { menu: W('.cp-dot[data-unit="a10"]'), play: stepsOf(C('.cp-dot[data-unit="a10"]'), W('#cp-play:not([hidden]) #cp-card .cp-zone')), init: () => localStorage.setItem('calc_cfg_guest', JSON.stringify({ grade: 2, skills: ['suma'], length: 10, help: false, helpSet: true })) },
  mathMaster: { menu: W('.operation-btn'), play: stepsOf(C('.operation-btn[data-operation="suma"]'), C('.level-btn[data-level="1"]'), C('#start-btn'), W('#game-screen.active .mm-balloon')) },
  tableMaster: { menu: W('[data-drill="table"]'), play: stepsOf(C('[data-drill="table"]'), C('.tm-chip[data-table="7"]'), C('#btn-drill-start'), W('#screen-drill.active #drill-numpad')) },
  typingMaster: { menu: W('.ty-level-btn[data-level="1"]'), play: stepsOf(C('.ty-level-btn[data-level="1"]'), C('#ty-start-btn'), C('#ty-lesson-skip'), W('#ty-game.active')) },
  englishVerbs: { menu: W('#ev-tabBtn-niveles'), play: stepsOf(C('#ev-tabBtn-niveles'), async p => { await p.locator('.ev-mode-card').first().click(); }, W('#ev-screen-game.active .ev-option-btn')) },
  clock: { menu: W('.ck-dot[data-unit="hours"]'), play: stepsOf(C('.ck-dot[data-unit="hours"]'), W('#ck-play:not([hidden]) #ck-card .dy-zone')), init: () => localStorage.setItem('clock_prog_guest', JSON.stringify({ units: { hours: { stars: 1 }, hoursSet: { stars: 1 } }, learned: { hours: true, hoursSet: true, half: true }, xp: 0, streak: 0, last: '' })) },
  fractions: { menu: W('.fr-dot[data-unit="id1"]'), play: stepsOf(C('.fr-dot[data-unit="id1"]'), W('#fr-play:not([hidden]) #fr-card .dy-zone')), init: () => localStorage.setItem('fractions_prog_guest', JSON.stringify({ units: { id1: { stars: 1 } }, learned: { id1: true, id2: true }, xp: 0, streak: 0, last: '' })) },
  memory: { menu: W('#mm-start'), play: stepsOf(C('#mm-start'), C('#mm-learn-skip'), W('#mm-play:not([hidden]) .mm-tile')) },
  euskera: { menu: W('#eu-case-btn'), play: stepsOf(E(() => EuskeraGame.startLevel(1)), W('#eu-screen-game.active .eu-option-btn')) },
  wordSearch: { menu: W('#ws-level-grid'), play: stepsOf(E(() => { WordSearchGame._level = 1; WordSearchGame.startGame(); }), W('#ws-screen-game.active .ws-cell')) },
  crossword: { menu: W('#cw-level-grid'), play: stepsOf(E(() => CrosswordGame._startGame(1, 'all')), W('#cw-screen-game.active .cw-cell')) },
  repaso: { menu: W('#rp-go'), play: stepsOf(C('#rp-go'), W('#rp-card .dy-zone.q')) },
  vocabMaster: { menu: W('.vm-pack[data-pack="en-animals"]'), play: stepsOf(C('.vm-pack[data-pack="en-animals"]'), W('#vm-flip'), E(() => VocabMaster._force('choice')), C('#vm-study-skip'), W('.vm-qnum')) },
  mapas: {
    menu: W('.mp-mapcard'), play: stepsOf(C('.mp-mapcard[data-map="es"]'), C('.mp-modecard[data-mode="cap"]'), async p => { await p.waitForFunction(() => Mapas._S.map && document.getElementById('mp-loading').hidden && document.querySelectorAll('#mp-svg path').length > 3, null, { timeout: 8000 }); await p.waitForTimeout(500); }),
    init: () => ['world', 'es', 'prov', 'rivw', 'rives', 'mont', 'montes', 'eus', 'eustown', 'eusriv', 'eusmont'].forEach(s => localStorage.setItem('mapas_skip_' + s, '1')),
  },
};

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|speechSynthesis/i;
const VIEWPORTS = [{ name: 'phone', width: 390, height: 844 }, { name: 'laptop', width: 1280, height: 800 }];

async function run(game, vp, theme) {
  const g = GAMES[game];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(t => { Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }); try { localStorage.setItem('gh_sound', '0'); localStorage.setItem('games_hub_theme', t); } catch (e) { /* ok */ } }, theme);
  if (g.init) await page.addInitScript(g.init);
  try {
    await page.goto(`${base}/${game}-EFC/index.html`, { waitUntil: 'load' });
    await g.menu(page); await page.waitForTimeout(500);
    const res = { menu: await page.evaluate(audit, {}) };
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${game}-${vp.name}-${theme}-menu.png`) });
    await g.play(page);
    res.play = await page.evaluate(audit, {});
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${game}-${vp.name}-${theme}-play.png`) });
    res.errors = errors;
    return res;
  } finally { await ctx.close(); }
}

function problems(where, a) {
  const msgs = [];
  if (a.hscroll > 1) msgs.push(`${where}: horizontal scroll (+${a.hscroll}px)`);
  if (a.small.length) msgs.push(`${where}: text under 14px: ` + a.small.join(' | '));
  if (a.tap.length) msgs.push(`${where}: tap target under 48px: ` + a.tap.join(' | '));
  if (a.hidden.length) msgs.push(`${where}: under the sticky header: ` + a.hidden.join(' | '));
  return msgs;
}

for (const game of Object.keys(GAMES)) {
  for (const vp of VIEWPORTS) {
    for (const theme of ['dark', 'light']) {
      test(`VQA-${game}-${vp.name}-${theme}: menu and question screen are readable, tappable and not hidden`, async () => {
        const r = await run(game, vp, theme);
        assert.deepEqual(r.errors, [], 'console errors');
        const msgs = [...problems('menu', r.menu), ...problems('play', r.play)];
        if (r.play.scrollY !== 0) msgs.push(`${game} ${vp.name}: the question screen must start at the top of the page`);
        assert.equal(msgs.length, 0, '\n' + msgs.join('\n'));
      });
    }
  }
}
