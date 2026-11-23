/**
 * TableMaster - pure logic for the "learn first" flow (no DOM).
 *  - workedStep(a, b): language-neutral worked step for a x b, e.g. 7 x 6 = 7 x 5 + 7 = 35 + 7 = 42
 *  - explainWrong(q): which i18n key + params and which worked step to show after a wrong drill answer
 *  - learnTarget(mode, table): which learn screen / slide the "Aprender" button opens
 *  - shouldSuggestLearn(...): when to push the child to the learn screens
 *  - sanitizeRich(str): the tiny, whitelisted HTML subset allowed in translated "rich" strings
 */
const TableMasterLearn = (() => {
    'use strict';

    const simple = n => n === 1 || n === 2 || n === 5 || n === 9 || n === 10;

    /** Worked step for a x b (1..10). Always ends with "= a*b". */
    function workedStep(a, b) {
        a = Number(a); b = Number(b);
        if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return '';
        const oa = a, ob = b;
        let prefix = '';
        if (!simple(b) && simple(a) && a !== b) { [a, b] = [b, a]; prefix = `${oa} × ${ob} = `; }
        const p = a * b;
        let body;
        switch (b) {
            case 0: body = `${a} × 0 = 0`; break;
            case 1: body = `${a} × 1 = ${a}`; break;
            case 2: body = `${a} × 2 = ${a} + ${a} = ${p}`; break;
            case 3: body = `${a} × 3 = ${a} × 2 + ${a} = ${a * 2} + ${a} = ${p}`; break;
            case 4: body = `${a} × 4 = ${a} × 2 × 2 = ${a * 2} × 2 = ${p}`; break;
            case 5: body = `${a} × 5 = ${a} × 10 ÷ 2 = ${a * 10} ÷ 2 = ${p}`; break;
            case 6: body = `${a} × 6 = ${a} × 5 + ${a} = ${a * 5} + ${a} = ${p}`; break;
            case 7: body = `${a} × 7 = ${a} × 5 + ${a} × 2 = ${a * 5} + ${a * 2} = ${p}`; break;
            case 8: body = `${a} × 8 = ${a} × 5 + ${a} × 3 = ${a * 5} + ${a * 3} = ${p}`; break;
            case 9: body = `${a} × 9 = ${a} × 10 − ${a} = ${a * 10} − ${a} = ${p}`; break;
            case 10: body = `${a} × 10 = ${p}`; break;
            default: body = `${a} × ${b} = ${p}`;
        }
        return prefix + body;
    }

    /**
     * q: { kind: 'mul' | 'div' | 'missing', a, b, k?, x? }
     *  mul     a x b = ?          (answer a*b)
     *  div     (a*b) / a = b      (answer b)
     *  missing k x ? = k*x        (answer x)
     * Returns { key, params, worked }. key is null when the worked step says it all.
     */
    function explainWrong(q) {
        if (!q) return { key: null, params: {}, worked: '' };
        if (q.kind === 'div') {
            return { key: 'drillWhyDiv', params: { p: q.a * q.b, a: q.a, b: q.b }, worked: workedStep(q.a, q.b) };
        }
        if (q.kind === 'missing') {
            return { key: 'drillWhyMissing', params: { p: q.k * q.x, k: q.k, x: q.x }, worked: workedStep(q.k, q.x) };
        }
        return { key: null, params: {}, worked: workedStep(q.a, q.b) };
    }

    /** Which learn screen and slide an "Aprender" button opens for a drill mode and table. */
    function learnTarget(mode, table) {
        if (mode === 'divide') return { screen: 'screen-learn-divide', slide: 0 };
        // slide 5 of the multiplication cards = memory tricks per table, slide 4 = general tricks
        const n = parseInt(table, 10);
        return { screen: 'screen-learn-multiply', slide: Number.isFinite(n) ? 5 : 0 };
    }

    /** A table is "new" when the child has no stars yet for that mode and table. */
    function isNewTable(stars, mode, table) {
        return !(Number(stars && stars[`${mode}:${table}`]) > 0);
    }

    /** Push the child to the learn screens after two wrong answers on the same table. */
    function shouldSuggestLearn(wrongByTable, table) {
        return (Number(wrongByTable && wrongByTable[table]) || 0) >= 2;
    }

    const ALLOWED = { STRONG: 1, EM: 1, CODE: 1, BR: 1, SPAN: 1, B: 1, I: 1 };
    /** Class names allowed on <span> in translated strings. */
    const CLASS_OK = /^tm-[a-z0-9-]+$|^trick-card__[a-z0-9-]+$|^tf-[a-z0-9-]+$/;

    /** Returns true when a rich string only uses the whitelisted subset (checked by tests and at runtime). */
    function isSafeRich(str) {
        const tags = String(str).match(/<\/?[a-zA-Z][^>]*>/g) || [];
        return tags.every(t => {
            const m = /^<\/?([a-zA-Z0-9]+)([^>]*)>$/.exec(t);
            if (!m || !ALLOWED[m[1].toUpperCase()]) return false;
            const attrs = m[2].trim();
            if (!attrs || attrs === '/') return true;
            const cm = /^class="([^"]*)"$/.exec(attrs);
            return !!cm && cm[1].split(/\s+/).every(c => CLASS_OK.test(c));
        });
    }

    const api = { workedStep, explainWrong, learnTarget, isNewTable, shouldSuggestLearn, isSafeRich, ALLOWED, CLASS_OK };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
