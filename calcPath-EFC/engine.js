/**
 * CalcEngine - pure question generator, anti-repeat store, adaptive level and placement test
 * for CalcPath. No DOM access. Every random decision goes through an injectable rnd() in [0,1).
 *
 * Levels 1..12 map to Spanish primary grades 1..6 (two sub-levels per grade):
 *   level 2g-1 = start of grade g, level 2g = end of grade g.
 *
 * Question object:
 *   { key, skill, level, text, a, b, op, c?, hole?, answer, kind: 'int'|'dec'|'choice',
 *     choices?, label?:{es,en}, hint:{es,en}, explain:{es,en}, items? }
 * Conventions to recompute the answer from the fields:
 *   op + - * /        no hole: answer = a op b
 *                     hole 'a' (a is null): answer op b = c ; hole 'b' (b is null): a op answer = c
 *   op 'round'        answer = a rounded to the nearest multiple of b (half up)
 *   op '%'            answer = a percent of b
 *   op 'fmax'         items = fractions as 'n/d'; answer = the greatest one
 *   op 'fof'          a = 'n/d', b = quantity; answer = n/d of b
 *   op 'feq'          a = 'n/d', b = factor k; answer = n*k (numerator of the equivalent n*k/(d*k))
 *   op 'f+' 'f-' 'f*f' a, b = 'n/d'; answer = 'n/d' (lowest terms for the different denominators cases)
 *   op 'fx'           a = 'n/d', b = integer; answer = n*b/d
 * Fractions with a string answer are always kind 'choice'.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.CalcEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ---------- random helpers ----------
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const ri = (a, b, r) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
    const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const digits = (d, r) => ri(d === 1 ? 1 : Math.pow(10, d - 1), Math.pow(10, d) - 1, r);
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const r2 = x => Math.round(x * 100) / 100;
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

    // ---------- grades / levels ----------
    const GRADES = [1, 2, 3, 4, 5, 6];
    const gradeOfLevel = l => clamp(Math.ceil(clamp(Math.round(l), 1, 12) / 2), 1, 6);
    /** half: 1 = start of the grade (default), 2 = end. */
    const levelOfGrade = (g, half) => 2 * clamp(g, 1, 6) - (half === 2 || half === 'end' ? 0 : 1);

    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    const calc = (a, op, b) => op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
    const bi = (es, en) => ({ es, en });

    // ---------- number choices (distractors) ----------
    /** 4 distinct options containing `answer`; distractors are plausible, never equal, never negative. */
    function numChoices(answer, r, dec) {
        const u = dec ? 0.1 : 1;
        const big = Math.abs(answer) >= 20;
        const mags = big ? [1, 2, 3, 5, 10] : [1, 2, 3];
        const set = new Map();
        const put = v => { v = r2(v); if (v >= 0 && v !== r2(answer) && Number.isFinite(v)) set.set(v, true); };
        mags.forEach(m => { put(answer + m * u); put(answer - m * u); });
        if (Math.abs(answer) >= 100) { put(answer + 100); put(answer - 100); }
        const list = shuffle([...set.keys()], r);
        let k = 4;
        while (list.length < 3) { const v = r2(answer + k * u); if (v !== r2(answer) && !list.includes(v)) list.push(v); k++; }
        return shuffle([answer, ...list.slice(0, 3)], r);
    }

    // ---------- fraction helpers ----------
    const fr = (n, d) => n + '/' + d;
    const parseFr = s => { const p = String(s).split('/'); return { n: Number(p[0]), d: Number(p[1]) }; };
    const redFr = (n, d) => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
    const sameFr = (x, y) => { const a = parseFr(x), b = parseFr(y); return a.n * b.d === b.n * a.d; };
    function fracChoices(answer, cands, r) {
        const out = [answer];
        const ok = c => /^\d+\/\d+$/.test(c) && parseFr(c).d > 0 && parseFr(c).n > 0 && !out.some(o => sameFr(o, c));
        shuffle(cands, r).forEach(c => { if (out.length < 4 && ok(c)) out.push(c); });
        const a = parseFr(answer);
        for (let k = 1; out.length < 4 && k < 30; k++) {
            [fr(a.n + k, a.d), fr(Math.max(1, a.n - k), a.d), fr(a.n, a.d + k)].forEach(c => { if (out.length < 4 && ok(c)) out.push(c); });
        }
        return shuffle(out, r);
    }

    // ---------- hints / explanations for plain arithmetic ----------
    function hintArith(op, a, b) {
        if (op === '+') return (a >= 10 && b >= 10)
            ? bi(`Suma primero las unidades (${a % 10} + ${b % 10}) y luego lo demás. Si pasa de 9, te llevas 1.`, `Add the ones first (${a % 10} + ${b % 10}), then the rest. If it goes over 9, carry 1.`)
            : bi(`Cuenta ${Math.min(a, b)} pasos hacia delante desde ${Math.max(a, b)}.`, `Count ${Math.min(a, b)} steps forward from ${Math.max(a, b)}.`);
        if (op === '-') return (a >= 20)
            ? bi('Resta de derecha a izquierda. Si no puedes restar, pide prestado a la cifra de al lado.', 'Subtract from right to left. If you cannot, borrow from the next digit.')
            : bi(`Piensa: ¿cuánto le falta a ${b} para llegar a ${a}?`, `Think: how much is missing from ${b} to reach ${a}?`);
        if (op === '*') {
            const big = Math.max(a, b), small = Math.min(a, b);
            if (big <= 10) return bi(`Piensa en la tabla del ${small}: ${big} veces ${small}.`, `Think of the ${small} times table: ${big} times ${small}.`);
            if (small < 10) { const p = Math.pow(10, String(big).length - 1), hi = Math.floor(big / p) * p, lo = big - hi; return bi(`Separa ${big} en ${hi} + ${lo}, multiplica cada parte por ${small} y suma.`, `Split ${big} into ${hi} + ${lo}, multiply each part by ${small} and add.`); }
            const lo = small % 10, hi = small - lo;
            return bi(`Multiplica por ${lo} y por ${hi}, y suma los dos resultados.`, `Multiply by ${lo} and by ${hi}, then add both results.`);
        }
        return bi(`¿Qué número multiplicado por ${b} da ${a}? Usa la tabla del ${b}.`, `Which number times ${b} gives ${a}? Use the ${b} times table.`);
    }
    function explainArith(q) {
        const s = SYM[q.op], line = `${q.a} ${s} ${q.b} = ${q.answer}`;
        if (q.op === '+' && q.a >= 10 && q.b >= 10) return bi(`Unidades: ${q.a % 10} + ${q.b % 10} = ${q.a % 10 + q.b % 10}. Total: ${line}`, `Ones: ${q.a % 10} + ${q.b % 10} = ${q.a % 10 + q.b % 10}. Total: ${line}`);
        if (q.op === '/') return bi(`${q.b} × ${q.answer} = ${q.a}, así que ${line}`, `${q.b} × ${q.answer} = ${q.a}, so ${line}`);
        return bi(line, line);
    }

    // ---------- question builders ----------
    function eqText(a, op, b, hole, c) {
        const s = SYM[op];
        return hole === 'a' ? `? ${s} ${b} = ${c}` : hole === 'b' ? `${a} ${s} ? = ${c}` : `${a} ${s} ${b} = ?`;
    }
    /** Plain operation question. */
    function arith(skill, level, a, op, b, keyPrefix) {
        const answer = calc(a, op, b);
        const k = (op === '+' || op === '*') ? Math.min(a, b) + (op === '+' ? '+' : 'x') + Math.max(a, b) : a + (op === '-' ? '-' : '/') + b;
        return { key: keyPrefix + ':' + k, skill, level, text: eqText(a, op, b), a, b, op, answer, kind: 'int', hint: hintArith(op, a, b), explain: null };
    }
    function finish(q) {
        if (!q.explain) q.explain = explainArith(q);
        return q;
    }
    function holeOf(q, hole, keyPrefix) {
        const c = q.answer, a = hole === 'a' ? null : q.a, b = hole === 'b' ? null : q.b, ans = hole === 'a' ? q.a : q.b;
        const text = eqText(q.a, q.op, q.b, hole, c);
        const other = hole === 'a' ? q.b : q.a;
        const inv = q.op === '+' ? bi(`Resta: ${c} − ${other}`, `Subtract: ${c} − ${other}`)
            : q.op === '-' ? (hole === 'b' ? bi(`Resta: ${other} − ${c}`, `Subtract: ${other} − ${c}`) : bi(`Suma: ${c} + ${other}`, `Add: ${c} + ${other}`))
            : q.op === '*' ? bi(`Divide: ${c} ÷ ${other}`, `Divide: ${c} ÷ ${other}`)
            : (hole === 'b' ? bi(`Divide: ${other} ÷ ${c}`, `Divide: ${other} ÷ ${c}`) : bi(`Multiplica: ${c} × ${other}`, `Multiply: ${c} × ${other}`));
        const full = `${q.a} ${SYM[q.op]} ${q.b} = ${c}`;
        return { key: keyPrefix + ':' + text, skill: 'huecos', level: q.level, text, a, b, op: q.op, c, hole, answer: ans, kind: 'int',
            hint: bi('Usa la operación contraria. ' + inv.es, 'Use the opposite operation. ' + inv.en), explain: bi(`Falta ${ans}: ${full}`, `Missing ${ans}: ${full}`) };
    }

    // ---------- skill generators ----------
    const ADD_DIG = { 5: [3, 3], 6: [4, 4], 7: [4, 5], 8: [5, 5], 9: [5, 6], 10: [6, 6], 11: [6, 7], 12: [7, 7] };
    const mixPart = r => pick([ri(10, 99, r), ri(1, 9, r) * 100, ri(10, 50, r) * 10], r);

    function genSuma(L, r) {
        let a, b;
        if (L === 1) { a = ri(1, 19, r); b = ri(1, 20 - a, r); }
        else if (L === 2) { const ta = ri(1, 8, r), tb = ri(1, 9 - ta, r), ua = ri(0, 9, r), ub = ri(0, 9 - ua, r); a = 10 * ta + ua; b = 10 * tb + ub; }
        else if (L === 3) { const ua = ri(1, 9, r), ub = ri(10 - ua, 9, r), ta = ri(1, 7, r), tb = ri(1, 8 - ta, r); a = 10 * ta + ua; b = 10 * tb + ub; }
        else if (L === 4) { a = ri(100, 800, r); b = mixPart(r); if (a + b > 999) b = 999 - a; if (b < 1) b = 1; }
        else { const d = ADD_DIG[L]; a = digits(d[0], r); b = digits(d[1], r); }
        if (r() < .5) [a, b] = [b, a];
        return finish(arith('suma', L, a, '+', b, 'add'));
    }
    function genResta(L, r) {
        let a, b;
        if (L === 1) { a = r() < .7 ? ri(10, 20, r) : ri(3, 9, r); b = ri(1, Math.min(9, a - 1), r); }
        else if (L === 2) { const ta = ri(2, 9, r), tb = ri(1, ta, r), ua = ri(0, 9, r), ub = ri(0, ua, r); a = 10 * ta + ua; b = 10 * tb + ub; if (a === b) a += 1; if (a > 99) { a = 99; b = Math.min(b, 98); } }
        else if (L === 3) { const ua = ri(0, 8, r), ub = ri(ua + 1, 9, r), ta = ri(2, 9, r), tb = ri(1, ta - 1, r); a = 10 * ta + ua; b = 10 * tb + ub; }
        else if (L === 4) { a = ri(200, 999, r); b = mixPart(r); if (b >= a) b = ri(10, a - 1, r); }
        else {
            const d = ADD_DIG[L]; let g = 0;
            do { a = digits(d[1], r); b = digits(d[0], r); g++; } while (a <= b && g < 50);
            if (a <= b) { const t = a; a = b + 1; b = t === a ? b : Math.min(t, a - 1); }
        }
        return finish(arith('resta', L, a, '-', b, 'sub'));
    }
    function genMul(L, r) {
        let a, b;
        if (L === 1) { a = 2; b = ri(1, 5, r); }
        else if (L === 2) { a = pick([2, 5, 10], r); b = ri(1, 10, r); }
        else if (L === 3) { a = pick([2, 3, 5, 10], r); b = ri(1, 10, r); }
        else if (L === 4) { a = pick([2, 3, 4, 5, 10], r); b = ri(1, 10, r); }
        else if (L === 5) { a = ri(2, 10, r); b = ri(2, 10, r); }
        else if (L === 6) { a = ri(11, 99, r); b = ri(2, 9, r); }
        else if (L === 7) { a = ri(100, 999, r); b = ri(2, 9, r); }
        else if (L === 8) { if (r() < .75) { a = ri(11, 99, r); b = ri(11, 99, r); } else { a = ri(100, 999, r); b = ri(2, 9, r); } }
        else if (L === 9) { a = ri(100, 999, r); b = ri(11, 99, r); }
        else if (L === 10) { if (r() < .5) { a = ri(100, 999, r); b = ri(11, 99, r); } else { a = ri(1000, 9999, r); b = ri(2, 9, r); } }
        else if (L === 11) { if (r() < .6) { a = ri(100, 999, r); b = ri(21, 99, r); } else { a = ri(1000, 9999, r); b = ri(3, 9, r); } }
        else { if (r() < .5) { a = ri(1000, 9999, r); b = ri(11, 99, r); } else { a = ri(100, 999, r); b = ri(100, 999, r); } }
        if (r() < .5) [a, b] = [b, a];
        return finish(arith('multiplicar', L, a, '*', b, 'mul'));
    }
    function genDiv(L, r) {
        let d, q;
        if (L <= 3) { d = pick([2, 5, 10], r); q = ri(1, 10, r); }
        else if (L === 4) { d = pick([2, 3, 4, 5, 10], r); q = ri(1, 10, r); }
        else if (L === 5) { d = ri(2, 10, r); q = ri(2, 10, r); }
        else if (L === 6) { d = ri(2, 9, r); q = ri(Math.ceil(10 / d), Math.floor(99 / d), r); }
        else if (L === 7) { d = ri(2, 9, r); q = ri(Math.ceil(100 / d), Math.floor(999 / d), r); }
        else if (L === 8) { d = ri(6, 9, r); q = ri(Math.ceil(100 / d) + 20, Math.floor(999 / d), r); }
        else if (L === 9) { d = ri(2, 9, r); q = ri(Math.ceil(1000 / d), Math.floor(9999 / d), r); }
        else if (L === 10) { d = ri(11, 25, r); q = ri(Math.ceil(100 / d), Math.floor(9999 / d), r); }
        else if (L === 11) { d = ri(11, 99, r); q = ri(10, Math.min(999, Math.floor(99999 / d)), r); }
        else { d = ri(12, 99, r); q = ri(100, 999, r); }
        return finish(arith('dividir', L, d * q, '/', d, 'div'));
    }

    function genMental(L, r) {
        const dbl = max => { const a = ri(2, max, r); return { a, op: '*', b: 2, es: 'El doble es sumar el número consigo mismo.', en: 'Doubling means adding the number to itself.', ex: `${a} + ${a} = ${a * 2}` }; };
        const half = max => { const q = ri(1, max / 2, r); return { a: 2 * q, op: '/', b: 2, es: 'La mitad: reparte en dos grupos iguales.', en: 'Half: share into two equal groups.', ex: `${q} + ${q} = ${2 * q}` }; };
        const compl = (t, step) => { const x = ri(1, Math.max(1, Math.floor(t / step) - 1), r) * step; return { a: x, op: '+', b: null, hole: 'b', c: t, answer: t - x, es: `¿Cuánto falta para llegar a ${t}?`, en: `How much is missing to reach ${t}?`, ex: `${x} + ${t - x} = ${t}` }; };
        const pm = (delta, max) => {
            const add = r() < .5, a = add ? ri(11, max, r) : ri(delta + 1, max, r);
            const near = delta === 9 || delta === 99, step = delta + 1;
            return { a, op: add ? '+' : '-', b: delta, es: near ? `Más ${delta} es más ${step} y menos 1 (y al revés al restar).` : `Solo cambia la cifra de las ${delta === 10 ? 'decenas' : 'centenas'}.`,
                en: near ? `Plus ${delta} is plus ${step} then minus 1 (and the other way round when subtracting).` : `Only the ${delta === 10 ? 'tens' : 'hundreds'} digit changes.`, ex: `${a} ${SYM[add ? '+' : '-']} ${delta} = ${calc(a, add ? '+' : '-', delta)}` };
        };
        const tp = (p, max) => { const a = ri(2, max, r); const z = String(p).length - 1; return { a, op: '*', b: p, es: `Multiplicar por ${p}: añade ${z} ${z === 1 ? 'cero' : 'ceros'}.`, en: `Times ${p}: add ${z} ${z === 1 ? 'zero' : 'zeros'}.`, ex: `${a} × ${p} = ${a * p}` }; };
        const dp = (p, maxq) => { const q = ri(2, maxq, r); const z = String(p).length - 1; return { a: q * p, op: '/', b: p, es: `Dividir entre ${p}: quita ${z} ${z === 1 ? 'cero' : 'ceros'}.`, en: `Divide by ${p}: remove ${z} ${z === 1 ? 'zero' : 'zeros'}.`, ex: `${q * p} ÷ ${p} = ${q}` }; };
        const rd = (nd, unit) => { const a = digits(nd, r); const ans = Math.round(a / unit) * unit; return { a, op: 'round', b: unit, answer: ans, es: `Mira la cifra de la derecha: de 5 en adelante, sube.`, en: 'Look at the digit to the right: 5 or more, round up.', ex: `${a} ≈ ${ans}`, label: bi(`Redondea ${a} al múltiplo de ${unit} más cercano`, `Round ${a} to the nearest ${unit}`) }; };
        const V = {
            1: [() => dbl(5), () => half(10), () => compl(10, 1)],
            2: [() => dbl(10), () => half(20), () => compl(20, 1), () => compl(10, 1)],
            3: [() => compl(100, 10), () => pm(10, 100), () => dbl(50), () => half(100)],
            4: [() => compl(100, 1), () => pm(9, 100), () => tp(10, 99), () => rd(2, 10)],
            5: [() => compl(1000, 100), () => compl(1000, 10), () => pm(100, 999), () => tp(10, 99), () => tp(100, 9), () => rd(3, 10), () => pm(9, 500)],
            6: [() => compl(1000, 10), () => pm(99, 900), () => tp(100, 99), () => dbl(500), () => half(1000), () => rd(4, 100)],
            7: [() => tp(1000, 9), () => tp(100, 999), () => dp(10, 500), () => rd(5, 1000), () => compl(1000, 1), () => pm(99, 5000)],
            8: [() => tp(1000, 99), () => dp(100, 999), () => half(5000), () => dbl(5000), () => rd(5, 100), () => compl(10000, 100)],
            9: [() => tp(1000, 999), () => dp(1000, 999), () => dp(100, 5000), () => rd(6, 10000), () => dbl(50000), () => half(20000)],
            10: [() => tp(1000, 999), () => dp(1000, 999), () => rd(6, 1000), () => compl(10000, 10), () => dbl(50000), () => half(90000)],
            11: [() => tp(1000, 9999), () => dp(1000, 9999), () => rd(7, 100000), () => compl(100000, 1000), () => dbl(500000), () => half(900000)],
            12: [() => tp(1000, 9999), () => dp(1000, 9999), () => rd(7, 10000), () => compl(100000, 100), () => dbl(500000), () => half(999998)]
        };
        const v = pick(V[L], r)();
        const answer = v.answer != null ? v.answer : calc(v.a, v.op, v.b);
        const text = v.op === 'round' ? `${v.a} ≈ ?` : v.hole === 'b' ? eqText(v.a, '+', null, 'b', v.c) : eqText(v.a, v.op, v.b);
        const q = { key: 'men:' + text, skill: 'mental', level: L, text, a: v.a, b: v.b, op: v.op, answer, kind: 'int', hint: bi(v.es, v.en), explain: bi(v.ex, v.ex) };
        if (v.hole) { q.hole = v.hole; q.c = v.c; }
        if (v.label) q.label = v.label;
        return q;
    }

    function genHuecos(L, r) {
        const base = Math.max(1, L - 1);
        const kinds = L >= 5 ? ['suma', 'resta', 'mul', 'div'] : L >= 3 ? ['suma', 'resta', 'mul'] : ['suma', 'resta'];
        const k = pick(kinds, r);
        let q;
        if (k === 'suma') q = genSuma(Math.min(base, 8), r);
        else if (k === 'resta') q = genResta(Math.min(base, 8), r);
        else if (k === 'mul') q = genMul(Math.max(2, Math.min(base, 7)), r);
        else q = genDiv(Math.max(3, Math.min(base, 7)), r);
        const hole = k === 'div' ? pick(['a', 'b'], r) : pick(['a', 'b'], r);
        return holeOf(q, hole, 'hue');
    }

    function genFracciones(L, r) {
        const level = L;
        const variants = [];
        const fmax = () => {
            let items;
            if (L === 5 && r() < .5) { items = shuffle([2, 3, 4, 5, 6, 8, 10], r).slice(0, 4).map(d => fr(1, d)); }
            else { const d = ri(5, L <= 6 ? 8 : 12, r), ns = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1), r).slice(0, 4); items = ns.map(n => fr(n, d)); }
            const ans = items.reduce((m, x) => { const p = parseFr(x), q = parseFr(m); return p.n * q.d > q.n * p.d ? x : m; });
            return { op: 'fmax', a: null, b: null, items, text: items.join('  ·  '), answer: ans, choices: shuffle(items, r), key: 'fra:max:' + items.slice().sort().join(','),
                label: bi('¿Cuál es la fracción mayor?', 'Which fraction is the greatest?'),
                hint: bi('Con el mismo denominador, gana el numerador mayor. Con numerador 1, gana el denominador menor.', 'Same denominator: the bigger numerator wins. Numerator 1: the smaller denominator wins.'),
                explain: bi(`La mayor es ${ans}.`, `The greatest is ${ans}.`) };
        };
        const fof = () => {
            const d = L === 5 ? pick([2, 3, 4], r) : ri(2, 10, r), n = L <= 6 ? 1 : ri(1, d - 1, r), q = d * ri(1, L <= 6 ? 6 : 10, r);
            const ans = q / d * n, text = `${fr(n, d)} de ${q} = ?`;
            return { op: 'fof', a: fr(n, d), b: q, answer: ans, text, choices: numChoices(ans, r), key: 'fra:of:' + n + '/' + d + '*' + q,
                label: bi('Calcula la fracción de la cantidad', 'Work out the fraction of the amount'),
                hint: bi(`Divide ${q} entre ${d} y multiplica por ${n}.`, `Divide ${q} by ${d} and multiply by ${n}.`), explain: bi(`${q} ÷ ${d} = ${q / d}; × ${n} = ${ans}`, `${q} ÷ ${d} = ${q / d}; × ${n} = ${ans}`) };
        };
        const feq = () => {
            const d = pick([2, 3, 4, 5], r), n = ri(1, d - 1, r), k = ri(2, 5, r), ans = n * k;
            return { op: 'feq', a: fr(n, d), b: k, answer: ans, text: `${fr(n, d)} = ?/${d * k}`, choices: numChoices(ans, r), key: 'fra:eq:' + n + '/' + d + '*' + k,
                label: bi('Fracciones equivalentes', 'Equivalent fractions'),
                hint: bi(`Multiplica arriba y abajo por el mismo número (${d} × ${k} = ${d * k}).`, `Multiply top and bottom by the same number (${d} × ${k} = ${d * k}).`), explain: bi(`${n} × ${k} = ${ans}, así ${fr(n, d)} = ${fr(ans, d * k)}`, `${n} × ${k} = ${ans}, so ${fr(n, d)} = ${fr(ans, d * k)}`) };
        };
        const addSame = sub => {
            const d = ri(4, 10, r); let n1, n2;
            if (sub) { n1 = ri(2, d - 1, r); n2 = ri(1, n1 - 1, r); } else { n1 = ri(1, d - 2, r); n2 = ri(1, d - 1 - n1, r); }
            const n = sub ? n1 - n2 : n1 + n2, ans = fr(n, d), a = fr(n1, d), b = fr(n2, d), s = sub ? '−' : '+';
            return { op: sub ? 'f-' : 'f+', a, b, answer: ans, text: `${a} ${s} ${b} = ?`, key: 'fra:' + (sub ? 's' : 'a') + ':' + a + s + b,
                choices: fracChoices(ans, [fr(n1 + n2, d * 2), fr(Math.abs(n1 - n2) || 1, d * 2), fr(n, d + 1), fr(n + 1, d)], r),
                label: bi(sub ? 'Resta de fracciones' : 'Suma de fracciones', sub ? 'Subtract fractions' : 'Add fractions'),
                hint: bi('Con el mismo denominador, el denominador no cambia: opera solo los numeradores.', 'Same denominator: it stays the same, only work with the numerators.'), explain: bi(`${n1} ${s} ${n2} = ${n}, el denominador sigue siendo ${d}: ${ans}`, `${n1} ${s} ${n2} = ${n}, the denominator stays ${d}: ${ans}`) };
        };
        const addDiff = (sub, general) => {
            let d1, d2;
            if (general) { [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [3, 2], [5, 2]], r); }
            else { d1 = pick([2, 3, 4, 5], r); d2 = d1 * pick([2, 2, 3], r); if (r() < .5) [d1, d2] = [d2, d1]; }
            let n1 = ri(1, d1 - 1, r), n2 = ri(1, d2 - 1, r);
            let N1 = n1 * d2, N2 = n2 * d1; const D = d1 * d2;
            if (sub && N1 <= N2) { [n1, n2, d1, d2] = [n2, n1, d2, d1]; N1 = n1 * d2; N2 = n2 * d1; if (N1 <= N2) { n1 = d1 - 1 || 1; N1 = n1 * d2; } }
            if (sub && N1 <= N2) return addSame(true);
            const num = sub ? N1 - N2 : N1 + N2, red = redFr(num, D), ans = fr(red.n, red.d), a = fr(n1, d1), b = fr(n2, d2), s = sub ? '−' : '+';
            return { op: sub ? 'f-' : 'f+', a, b, answer: ans, text: `${a} ${s} ${b} = ?`, key: 'fra:' + (sub ? 's' : 'a') + ':' + a + s + b,
                choices: fracChoices(ans, [fr(n1 + n2, d1 + d2), fr(Math.abs(n1 - n2) || 1, Math.abs(d1 - d2) || d1), fr(num, D + 1), fr(num + 1, D)], r),
                label: bi(sub ? 'Resta de fracciones' : 'Suma de fracciones', sub ? 'Subtract fractions' : 'Add fractions'),
                hint: bi(`Pasa las dos fracciones al denominador común ${D}.`, `Turn both fractions into the common denominator ${D}.`),
                explain: bi(`${fr(N1, D)} ${s} ${fr(N2, D)} = ${fr(num, D)}${red.n !== num ? ' = ' + ans : ''}`, `${fr(N1, D)} ${s} ${fr(N2, D)} = ${fr(num, D)}${red.n !== num ? ' = ' + ans : ''}`) };
        };
        const fx = () => {
            const d = ri(2, 6, r), n = ri(1, d - 1, r), b = d * ri(2, 8, r), ans = n * b / d;
            return { op: 'fx', a: fr(n, d), b, answer: ans, text: `${fr(n, d)} × ${b} = ?`, choices: numChoices(ans, r), key: 'fra:x:' + n + '/' + d + '*' + b,
                label: bi('Fracción por un número', 'Fraction times a number'),
                hint: bi(`Divide ${b} entre ${d} y multiplica por ${n}.`, `Divide ${b} by ${d} and multiply by ${n}.`), explain: bi(`${b} ÷ ${d} × ${n} = ${ans}`, `${b} ÷ ${d} × ${n} = ${ans}`) };
        };
        const ff = () => {
            const d1 = ri(2, 6, r), d2 = ri(2, 6, r), n1 = ri(1, d1 - 1, r), n2 = ri(1, d2 - 1, r), red = redFr(n1 * n2, d1 * d2), ans = fr(red.n, red.d);
            return { op: 'f*f', a: fr(n1, d1), b: fr(n2, d2), answer: ans, text: `${fr(n1, d1)} × ${fr(n2, d2)} = ?`, key: 'fra:xx:' + fr(n1, d1) + '*' + fr(n2, d2),
                choices: fracChoices(ans, [fr(n1 + n2, d1 + d2), fr(n1 * n2, d1 + d2), fr(n1 + n2, d1 * d2), fr(n1 * n2 + 1, d1 * d2)], r),
                label: bi('Producto de fracciones', 'Product of fractions'),
                hint: bi('Multiplica numeradores entre si y denominadores entre si. Luego simplifica.', 'Multiply numerators together and denominators together. Then simplify.'), explain: bi(`${n1 * n2}/${d1 * d2}${red.n !== n1 * n2 ? ' = ' + ans : ''}`, `${n1 * n2}/${d1 * d2}${red.n !== n1 * n2 ? ' = ' + ans : ''}`) };
        };
        if (L <= 5) variants.push(fmax, fof);
        else if (L === 6) variants.push(fmax, fof, feq);
        else if (L === 7) variants.push(feq, fmax, () => addSame(false));
        else if (L === 8) variants.push(() => addSame(false), () => addSame(true), fof, feq);
        else if (L === 9) variants.push(() => addDiff(false, false), () => addSame(true), fof, fmax);
        else if (L === 10) variants.push(() => addDiff(false, false), () => addDiff(true, false), fof, feq);
        else if (L === 11) variants.push(() => addDiff(false, true), () => addDiff(true, false), fx, fof);
        else variants.push(() => addDiff(false, true), () => addDiff(true, true), fx, ff);
        const v = pick(variants, r)();
        return { skill: 'fracciones', level, kind: 'choice', ...v };
    }

    function genDecimales(L, r) {
        const fmt = n => String(r2(n));
        const dec = (lo, hi, scale, nonInt) => { let v; let g = 0; do { v = ri(lo, hi, r) / scale; g++; } while (nonInt && Number.isInteger(v) && g < 20); return v; };
        const add = (a, b) => ({ a, b, op: '+' });
        const sub = (a, b) => { if (a < b) [a, b] = [b, a]; if (a === b) a = r2(a + 0.1); return { a, b, op: '-' }; };
        const divD = () => { const b = ri(2, 9, r), q = ri(11, 999, r); return { a: r2(q * b / 100), b, op: '/' }; };
        const mulP = p => ({ a: dec(11, 9999, 100, true), b: p, op: '*' });
        let v;
        if (L === 7) v = r() < .5 ? add(dec(11, 99, 10, true), dec(11, 99, 10, true)) : sub(dec(11, 99, 10, true), dec(11, 99, 10, true));
        else if (L === 8) { const t = ri(0, 3, r); v = t === 0 ? add(dec(101, 1999, 100, true), dec(101, 1999, 100, true)) : t === 1 ? sub(dec(101, 1999, 100, true), dec(101, 1999, 100, true)) : t === 2 ? { a: dec(11, 9999, 100, true), b: 10, op: '*' } : { a: dec(11, 999, 10, true), b: 100, op: '*' }; }
        else if (L === 9) { const t = ri(0, 4, r); v = t === 0 ? add(dec(101, 9999, 100, true), dec(11, 999, 10, true)) : t === 1 ? sub(dec(1001, 9999, 100, true), dec(11, 999, 10, true)) : t === 2 ? mulP(pick([10, 100, 1000], r)) : t === 3 ? { a: ri(11, 999, r) / 10, b: 10, op: '/' } : { a: ri(2, 9999, r), b: 100, op: '/' }; }
        else if (L === 10) { const t = ri(0, 3, r); v = t === 0 ? { a: dec(12, 99, 10, true), b: ri(2, 9, r), op: '*' } : t === 1 ? { a: dec(101, 999, 100, true), b: ri(2, 9, r), op: '*' } : t === 2 ? add(dec(101, 9999, 100, true), dec(101, 9999, 100, true)) : sub(dec(1001, 9999, 100, true), dec(101, 999, 100, true)); }
        else if (L === 11) { const t = ri(0, 3, r); v = t === 0 ? { a: dec(12, 99, 10, true), b: ri(11, 25, r), op: '*' } : t === 1 ? { a: dec(101, 999, 100, true), b: ri(11, 20, r), op: '*' } : t === 2 ? mulP(pick([10, 100, 1000], r)) : divD(); }
        else { const t = ri(0, 3, r); v = t === 0 ? { a: dec(11, 99, 10, true), b: dec(11, 99, 10, true), op: '*' } : t === 1 ? { a: dec(101, 999, 100, true), b: ri(11, 99, r), op: '*' } : t === 2 ? sub(dec(1001, 99999, 100, true), dec(1001, 9999, 100, true)) : divD(); }
        const answer = r2(calc(v.a, v.op, v.b));
        const text = `${fmt(v.a)} ${SYM[v.op]} ${fmt(v.b)} = ?`;
        const shift = v.b === 10 || v.b === 100 || v.b === 1000;
        const hint = v.op === '+' || v.op === '-'
            ? bi('Alinea las comas: unidades debajo de unidades, décimas debajo de décimas.', 'Line up the decimal points: ones under ones, tenths under tenths.')
            : shift ? bi(`Por ${v.b} (o entre ${v.b}) la coma se mueve ${String(v.b).length - 1} ${String(v.b).length === 2 ? 'lugar' : 'lugares'}.`, `Times (or divided by) ${v.b}: the point moves ${String(v.b).length - 1} place${String(v.b).length === 2 ? '' : 's'}.`)
            : v.op === '*' ? bi('Multiplica como si no hubiera coma y luego coloca la coma: tantos decimales como tengan los factores.', 'Multiply as if there was no point, then put the point back: as many decimals as the factors have.')
            : bi('Divide como si no hubiera coma y coloca la coma en el resultado.', 'Divide as if there was no point and put the point in the result.');
        return { key: 'dec:' + text, skill: 'decimales', level: L, text, a: v.a, b: v.b, op: v.op, answer, kind: Number.isInteger(answer) ? 'int' : 'dec', hint, explain: bi(text.replace('?', answer), text.replace('?', answer)) };
    }

    function genPorcentajes(L, r) {
        let p, base;
        if (L === 9) { p = pick([10, 50], r); base = ri(1, 10, r) * 20; }
        else if (L === 10) { p = pick([10, 25, 50, 20], r); base = ri(1, 10, r) * 20; }
        else if (L === 11) { p = pick([10, 20, 25, 50, 5, 15, 30, 40, 75], r); base = ri(1, 20, r) * 20; }
        else { p = ri(1, 19, r) * 5; base = ri(1, 50, r) * 20; }
        const answer = p * base / 100;
        const choice = L <= 10;
        const label = bi(`¿Cuánto es el ${p} % de ${base}?`, `What is ${p}% of ${base}?`);
        const tip = p === 10 ? bi('El 10 % es dividir entre 10.', '10% means divide by 10.') : p === 50 ? bi('El 50 % es la mitad.', '50% is half.') : p === 25 ? bi('El 25 % es la cuarta parte: divide entre 4.', '25% is a quarter: divide by 4.')
            : p === 20 ? bi('El 20 % es el doble del 10 %: divide entre 10 y multiplica por 2.', '20% is double 10%: divide by 10 and multiply by 2.') : bi(`Calcula el 10 % (${base / 10}) y construye ${p} % con trozos de 10 % y 5 %.`, `Find 10% (${base / 10}) and build ${p}% from pieces of 10% and 5%.`);
        const q = { key: 'pct:' + p + '%' + base, skill: 'porcentajes', level: L, text: `${p} % × ${base} = ?`, a: p, b: base, op: '%', answer, kind: choice ? 'choice' : (Number.isInteger(answer) ? 'int' : 'dec'),
            label, hint: tip, explain: bi(`${p} % de ${base} = ${base} × ${p} ÷ 100 = ${answer}`, `${p}% of ${base} = ${base} × ${p} ÷ 100 = ${answer}`) };
        if (choice) q.choices = numChoices(answer, r, !Number.isInteger(answer));
        return q;
    }

    const SKILLS = [
        { id: 'suma', minGrade: 1, gen: genSuma },
        { id: 'resta', minGrade: 1, gen: genResta },
        { id: 'multiplicar', minGrade: 1, gen: genMul },
        { id: 'dividir', minGrade: 2, gen: genDiv },
        { id: 'mental', minGrade: 1, gen: genMental },
        { id: 'huecos', minGrade: 1, gen: genHuecos },
        { id: 'fracciones', minGrade: 3, gen: genFracciones },
        { id: 'decimales', minGrade: 4, gen: genDecimales },
        { id: 'porcentajes', minGrade: 5, gen: genPorcentajes }
    ];
    const SKILL_BY_ID = {}; SKILLS.forEach(s => { SKILL_BY_ID[s.id] = s; });
    const minLevel = id => levelOfGrade(SKILL_BY_ID[id].minGrade, 1);
    const skillsForGrade = g => SKILLS.filter(s => s.minGrade <= g).map(s => s.id);

    /** One question of a skill at a level (level is clamped to [skill minimum, 12]). */
    function gen(skillId, level, rnd) {
        const s = SKILL_BY_ID[skillId]; if (!s) throw new Error('unknown skill ' + skillId);
        const L = clamp(Math.round(level), minLevel(skillId), 12);
        const q = s.gen(L, rnd || Math.random);
        if (q.kind === 'choice' && !q.choices) q.choices = numChoices(q.answer, rnd || Math.random);
        return q;
    }

    // ---------- anti-repeat ----------
    function makeUniqueQuestion(skillId, level, rnd, seen, tries) {
        tries = tries || 60; rnd = rnd || Math.random;
        const has = k => !!seen && seen.has(k);
        let q;
        for (let i = 0; i < tries; i++) { q = gen(skillId, level, rnd); if (!has(q.key)) return q; }
        const lo = minLevel(skillId);
        for (const l of shuffle([level - 1, level + 1], rnd)) {
            if (l < lo || l > 12) continue;
            for (let i = 0; i < Math.ceil(tries / 2); i++) { q = gen(skillId, l, rnd); if (!has(q.key)) return q; }
        }
        return Object.assign({}, gen(skillId, level, rnd), { repeat: true });
    }

    /** Ring buffer of recent question keys per player, persisted through a getItem/setItem storage. */
    function SeenStore(storage, owner, cap) {
        cap = cap || 600;
        const sk = 'calc_seen_' + owner;
        let arr = [];
        try { const v = JSON.parse(storage.getItem(sk)); if (Array.isArray(v)) arr = v.filter(x => typeof x === 'string').slice(-cap); } catch (e) { arr = []; }
        const set = new Set(arr);
        const save = () => { try { storage.setItem(sk, JSON.stringify(arr)); } catch (e) { /* storage full or blocked */ } };
        return {
            storageKey: sk,
            has: k => set.has(k),
            add(k) {
                if (set.has(k)) arr.splice(arr.indexOf(k), 1);
                arr.push(k); set.add(k);
                while (arr.length > cap) set.delete(arr.shift());
                save();
            },
            clear() { arr = []; set.clear(); save(); },
            size: () => arr.length,
            keys: () => arr.slice()
        };
    }

    // ---------- answers ----------
    /** Accepts '.' and ',' as decimal separator. Returns NaN when not a number. */
    function parseAnswer(v) {
        if (typeof v === 'number') return v;
        const s = String(v == null ? '' : v).trim().replace(',', '.');
        return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
    }
    function check(q, v) {
        if (q.kind === 'choice') {
            if (typeof q.answer === 'string') return String(v) === q.answer;
            return r2(parseAnswer(v)) === r2(q.answer);
        }
        const n = parseAnswer(v);
        return Number.isFinite(n) && r2(n) === r2(q.answer);
    }

    // ---------- adaptive engine ----------
    function targetSeconds(level, skill) {
        const L = clamp(Math.round(level), 1, 12), g = gradeOfLevel(L);
        let t = [14, 16, 18, 20, 22, 25][g - 1], m = 1;
        if (skill === 'multiplicar') m = L >= 11 ? 2.6 : L >= 9 ? 2 : L === 8 ? 1.5 : L >= 6 ? 1.3 : 1;
        else if (skill === 'dividir') m = L >= 9 ? 1.6 : L >= 6 ? 1.3 : 1;
        else if (skill === 'suma' || skill === 'resta') m = L >= 7 ? 1.3 : L >= 5 ? 1.1 : 1;
        else if (skill === 'fracciones') m = 1.4;
        else if (skill === 'decimales') m = 1.3;
        else if (skill === 'porcentajes') m = 1.2;
        else if (skill === 'huecos') m = 1.2;
        else if (skill === 'mental') m = .9;
        return Math.round(t * m);
    }
    /** Default window: start of the grade -2 .. +2 levels. */
    function windowForGrade(grade) { const c = levelOfGrade(grade, 1); return { floor: Math.max(1, c - 2), ceil: Math.min(12, c + 2) }; }
    function newSkillState(grade, skillId) {
        const w = windowForGrade(grade), lo = skillId ? minLevel(skillId) : 1;
        return { lvl: clamp(Math.max(levelOfGrade(grade, 1), lo), w.floor, w.ceil), n: 0, right: 0, ema: 0.5, wrong: 0, floor: w.floor, ceil: w.ceil };
    }
    /** Starting state at a known level (placement result): window recentred on it. */
    function stateFromLevel(level, extra) {
        const l = clamp(Math.round(level), 1, 12);
        return Object.assign({ lvl: l, n: 0, right: 0, ema: 0.5, wrong: 0, floor: Math.max(1, l - 2), ceil: Math.min(12, l + 2) }, extra || {});
    }
    /** Returns a new state; never mutates. ev = { correct, seconds, hintUsed, level, skill } */
    function update(state, ev) {
        const s = Object.assign({ n: 0, right: 0, ema: 0.5, wrong: 0, floor: 1, ceil: 12 }, state);
        const lo = Math.max(1, s.floor), hi = Math.min(12, s.ceil);
        const target = targetSeconds(ev.level != null ? ev.level : s.lvl, ev.skill);
        const ratio = (ev.seconds == null ? target : ev.seconds) / target;
        let d;
        if (ev.correct) {
            d = ratio <= 0.6 ? 0.5 : ratio <= 1 ? 0.35 : ratio > 1.5 ? 0.15 : 0.25;
            if (ev.hintUsed) d = Math.min(d, 0.1);
            s.wrong = 0;
        } else {
            d = s.wrong >= 1 ? -0.9 : -0.6;
            s.wrong = (s.wrong || 0) + 1;
        }
        s.lvl = clamp(s.lvl + d, lo, hi);
        s.n += 1; if (ev.correct) s.right += 1;
        s.ema = s.ema * 0.8 + (ev.correct ? 1 : 0) * 0.2;
        return s;
    }
    /** Level for the next question: 70% current, 15% one below, 15% one above, inside the window. */
    function nextLevel(state, rnd) {
        const r = (rnd || Math.random)(), base = Math.round(state.lvl);
        const l = r < 0.70 ? base : r < 0.85 ? base - 1 : base + 1;
        return clamp(l, Math.max(1, state.floor || 1), Math.min(12, state.ceil || 12));
    }
    function pickSkill(selected, stats, rnd) {
        rnd = rnd || Math.random;
        if (selected.length === 1) return selected[0];
        if (rnd() < 0.6) {
            const emaOf = id => (stats && stats[id] && typeof stats[id].ema === 'number') ? stats[id].ema : 0.5;
            const min = Math.min(...selected.map(emaOf));
            return pick(selected.filter(id => emaOf(id) === min), rnd);
        }
        return pick(selected, rnd);
    }

    // ---------- placement test ----------
    const Placement = {
        start(opts) {
            const grade = clamp(opts.grade || 3, 1, 6), rnd = opts.rnd || Math.random, store = opts.seen || null;
            let pool = (opts.skills && opts.skills.length ? opts.skills : skillsForGrade(grade)).filter(id => SKILL_BY_ID[id] && SKILL_BY_ID[id].minGrade <= grade);
            pool = shuffle(pool, rnd).slice(0, grade < 3 ? 6 : 8);
            const local = new Set();
            const seen = { has: k => local.has(k) || (store && store.has(k)) };
            const est = {}, wrong = {}, tally = {};
            pool.forEach(id => { est[id] = Math.max(levelOfGrade(grade, 1), minLevel(id)); wrong[id] = 0; tally[id] = { answered: 0, correct: 0 }; });
            const order = []; for (let k = 0; k < 3; k++) pool.forEach(id => order.push(id));
            let idx = 0, cur = null;
            const api = {
                get done() { return idx >= order.length; },
                get index() { return idx; },
                get total() { return order.length; },
                next() {
                    if (idx >= order.length) return null;
                    if (!cur) {
                        const id = order[idx], lvl = clamp(Math.round(est[id]), minLevel(id), 12);
                        cur = makeUniqueQuestion(id, lvl, rnd, seen);
                        local.add(cur.key); if (store) store.add(cur.key);
                    }
                    return cur;
                },
                answer(res) {
                    if (!cur) return;
                    const id = cur.skill, ql = cur.level, t = tally[id];
                    t.answered++;
                    if (res.correct) {
                        t.correct++; wrong[id] = 0;
                        const ratio = (res.seconds == null ? 1 : res.seconds) / targetSeconds(ql, id);
                        est[id] = Math.max(est[id], ql + (ratio <= 0.6 ? 1 : ratio <= 1.5 ? 0.5 : 0));
                    } else {
                        est[id] = Math.min(est[id], ql - 1 - (wrong[id] >= 1 ? 0.5 : 0)); wrong[id]++;
                    }
                    cur = null; idx++;
                },
                result() {
                    const skills = {}, summary = [];
                    pool.forEach(id => {
                        const level = clamp(Math.round(est[id]), minLevel(id), 12);
                        skills[id] = { level, grade: gradeOfLevel(level), answered: tally[id].answered, correct: tally[id].correct };
                        summary.push({ skill: id, level, grade: gradeOfLevel(level) });
                    });
                    const avg = summary.reduce((s, x) => s + x.level, 0) / Math.max(1, summary.length);
                    return { startGrade: grade, startLevel: levelOfGrade(grade, 1), skills, summary, avgLevel: avg, avgGrade: gradeOfLevel(avg) };
                }
            };
            return api;
        }
    };

    return { GRADES, SKILLS, SKILL_IDS: SKILLS.map(s => s.id), mulberry32, gradeOfLevel, levelOfGrade, minLevel, skillsForGrade, gen, makeUniqueQuestion, SeenStore,
        parseAnswer, check, targetSeconds, windowForGrade, newSkillState, stateFromLevel, update, nextLevel, pickSkill, Placement, numChoices, SYM };
}));
