/**
 * TableMaster – Educational Game Logic
 * Herramienta educativa de multiplicación y división para niños de 9 años.
 * Dos fases: APRENDER (teoría visual) y PRACTICAR (algoritmo paso a paso).
 *
 * Works without Firebase (guest mode).
 */

const TableMasterGame = {

    // ── Estado global ─────────────────────────────────────────────────────────

    state: {
        currentUser:   null,
        currentScreen: 'screen-home',
        practice: {
            operation:  'multiply',  // 'multiply' | 'divide'
            level:      1,           // 1-5
            exercises:  [],
            exIndex:    0,
            score:      0,
            totalSteps: 0,
            okSteps:    0,
        },
    },

    // ── Ejemplos para las demos de teoría ─────────────────────────────────────

    _multExamples: [
        { a: 34, b: 7 },
        { a: 52, b: 6 },
        { a: 123, b: 4 },
        { a: 46, b: 8 },
        { a: 75, b: 9 },
    ],
    _multExIdx: 0,

    _divExamples: [
        { dividend: 238, divisor: 7 },
        { dividend: 168, divisor: 6 },
        { dividend: 195, divisor: 5 },
        { dividend: 252, divisor: 4 },
        { dividend: 312, divisor: 8 },
    ],
    _divExIdx: 0,

    // ── Slide state ───────────────────────────────────────────────────────────

    _learnMultSlide: 0,
    _learnDivSlide: 0,

    // ── Init ──────────────────────────────────────────────────────────────────

    init() {
        this._bindHomeEvents();
        this._bindLearnEvents();
        this._bindPracticeSelectEvents();
        this._bindPracticeEvents();
        this._bindResultEvents();
        this._bindTableScreenEvents();
        this._bindDivisibilityChecker();
        this._bindDrillEvents();
        this.applyI18n();

        // Auth listener
        if (typeof PlatformAuth !== 'undefined') {
            PlatformAuth.onAuthStateChanged(user => {
                this.state.currentUser = user;
                document.getElementById('guest-notice')
                    ?.classList.toggle('hidden', !!user);
            });
        } else {
            document.getElementById('guest-notice')?.classList.remove('hidden');
        }

        document.addEventListener('platformLanguageChanged', () => this.applyI18n());

        // Render initial demos
        this._renderMultDemo();
        this._renderDivDemo();
    },

    // ── i18n ──────────────────────────────────────────────────────────────────

    applyI18n() {
        const t = key => TableMasterI18n.t(key);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-rich]').forEach(el => this._setRich(el, t(el.dataset.i18nRich)));
        document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
        document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', t(el.dataset.i18nTitle)));
        this._refreshDrillTexts();
        this._renderMultDemo();
        this._renderDivDemo();
    },

    /**
     * Rebuilds an element from a translated "rich" string (a tiny whitelisted HTML subset:
     * strong, em, code, br and span with tm-* classes). Nodes are created one by one, never
     * inserted as raw HTML, so a bad string cannot inject anything.
     */
    _setRich(el, str) {
        el.textContent = '';
        const doc = new DOMParser().parseFromString('<body>' + String(str) + '</body>', 'text/html');
        const copy = (from, into) => {
            from.childNodes.forEach(n => {
                if (n.nodeType === 3) { into.appendChild(document.createTextNode(n.nodeValue)); return; }
                if (n.nodeType !== 1) return;
                const tag = n.tagName.toLowerCase();
                if (!TableMasterLearn.ALLOWED[tag.toUpperCase()]) { copy(n, into); return; }
                const e = document.createElement(tag);
                if (tag === 'span') {
                    const cls = (n.getAttribute('class') || '').split(/\s+/).filter(c => TableMasterLearn.CLASS_OK.test(c));
                    if (cls.length) e.className = cls.join(' ');
                }
                copy(n, e);
                into.appendChild(e);
            });
        };
        copy(doc.body, el);
    },

    // ── Pantalla Inicio ───────────────────────────────────────────────────────

    _bindHomeEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const op     = btn.dataset.op;

                if (action === 'learn') {
                    this._openLearn(op === 'multiply' ? 'screen-learn-multiply' : 'screen-learn-divide', null, 'screen-home');
                } else if (action === 'practice') {
                    this.state.practice.operation = op;
                    this._buildLevelGrid(op);
                    this._showScreen('screen-practice-select');
                } else if (action === 'table') {
                    this._renderMultGrid();
                    this._showScreen('screen-table');
                }
            });
        });
    },

    // ── Pantalla Aprender ─────────────────────────────────────────────────────

    // Where the "back" and "start practice" buttons of a learn screen lead (home, or the practice/drill menu it was opened from)
    _learnBack: 'screen-home',

    /** Opens a learn screen, optionally on a given card, and remembers where "back" goes. */
    _openLearn(screenId, slide, backTo) {
        this._learnBack = backTo || 'screen-home';
        document.querySelectorAll(`#${screenId} [data-back]`).forEach(b => { b.dataset.back = this._learnBack; });
        this._showScreen(screenId);
        if (slide !== null && slide !== undefined) {
            const tab = document.querySelector(`#${screenId} .tm-slide-tab[data-slide="${slide}"]`);
            if (tab) tab.click();
        }
    },

    _bindLearnEvents() {
        // Multiplicación (ahora 6 fichas)
        this._bindSlideNav('screen-learn-multiply', 'lm', 6,
            () => this._learnMultSlide,
            v  => { this._learnMultSlide = v; });

        document.getElementById('btn-mult-example')?.addEventListener('click', () => {
            this._multExIdx = (this._multExIdx + 1) % this._multExamples.length;
            this._renderMultDemo();
        });

        document.getElementById('btn-start-practice-multiply')?.addEventListener('click', () => {
            if (this._learnBack === 'screen-drill-select') { this._showScreen('screen-drill-select'); return; }
            this.state.practice.operation = 'multiply';
            this._buildLevelGrid('multiply');
            this._showScreen('screen-practice-select');
        });

        // División
        this._bindSlideNav('screen-learn-divide', 'ld', 5,
            () => this._learnDivSlide,
            v  => { this._learnDivSlide = v; });

        document.getElementById('btn-div-example')?.addEventListener('click', () => {
            this._divExIdx = (this._divExIdx + 1) % this._divExamples.length;
            this._renderDivDemo();
        });

        document.getElementById('btn-start-practice-divide')?.addEventListener('click', () => {
            if (this._learnBack === 'screen-drill-select') { this._showScreen('screen-drill-select'); return; }
            this.state.practice.operation = 'divide';
            this._buildLevelGrid('divide');
            this._showScreen('screen-practice-select');
        });

        // Botones "volver"
        document.querySelectorAll('[data-back]').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentScreen = this.state.currentScreen;
                const isPractice = (currentScreen === 'screen-practice' &&
                    this.state.practice.exercises.length > 0 &&
                    this.state.practice.exIndex < this.state.practice.exercises.length) ||
                    (currentScreen === 'screen-drill' && this._drill && !this._drill.ended);
                if (isPractice) {
                    this._showQuitConfirm(btn.dataset.back);
                } else {
                    this._showScreen(btn.dataset.back);
                }
            });
        });
    },

    _showQuitConfirm(targetScreen) {
        const modal = document.getElementById('tm-quit-modal');
        if (!modal) { this._showScreen(targetScreen); return; }
        const trigger = document.activeElement;
        modal.classList.remove('hidden');
        const cancelBtn = document.getElementById('tm-quit-cancel');
        const okBtn     = document.getElementById('tm-quit-ok');
        setTimeout(() => cancelBtn?.focus(), 0);
        const trapFn = e => {
            if (e.key !== 'Tab') return;
            const nodes = [cancelBtn, okBtn].filter(Boolean);
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
            else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
        };
        modal.addEventListener('keydown', trapFn);
        const close = () => {
            modal.classList.add('hidden');
            modal.removeEventListener('keydown', trapFn);
            trigger?.focus();
        };
        const onCancel = () => { close(); okBtn?.removeEventListener('click', onOk); };
        const onOk = () => { close(); cancelBtn?.removeEventListener('click', onCancel); this._showScreen(targetScreen); };
        cancelBtn?.addEventListener('click', onCancel, { once: true });
        okBtn?.addEventListener('click', onOk, { once: true });
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') { onCancel(); } }, { once: true });
    },

    _bindSlideNav(screenId, prefix, total, getSlide, setSlide) {
        const screen  = document.getElementById(screenId);
        if (!screen) return;

        const prevBtn   = screen.querySelector(`#${prefix}-prev`);
        const nextBtn   = screen.querySelector(`#${prefix}-next`);
        const counter   = screen.querySelector(`#${prefix}-counter`);
        const tabs      = screen.querySelectorAll('.tm-slide-tab');

        const updateSlide = idx => {
            setSlide(idx);
            // Ocultar/mostrar slides
            screen.querySelectorAll('.tm-slide').forEach((s, i) => {
                const isActive = i === idx;
                s.classList.toggle('active', isActive);
                s.hidden = !isActive;
            });
            // Actualizar tabs
            tabs.forEach((t, i) => {
                t.classList.toggle('active', i === idx);
                t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
            });
            // Botones prev/next
            if (prevBtn) prevBtn.disabled = idx === 0;
            if (nextBtn) nextBtn.disabled = idx === total - 1;
            if (counter) counter.textContent = `${idx + 1} / ${total}`;
        };

        prevBtn?.addEventListener('click', () => {
            const cur = getSlide();
            if (cur > 0) updateSlide(cur - 1);
        });

        nextBtn?.addEventListener('click', () => {
            const cur = getSlide();
            if (cur < total - 1) updateSlide(cur + 1);
        });

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => updateSlide(i));
        });
    },

    // ── Demo de multiplicación ────────────────────────────────────────────────

    _renderMultDemo() {
        const container = document.getElementById('mult-demo');
        if (!container) return;
        const { a, b } = this._multExamples[this._multExIdx];
        container.innerHTML = '';

        // Encabezado del algoritmo
        container.appendChild(this._demoStep('?', 'demoCalc', { m: `${a} × ${b}` }, 0));

        // Generar pasos del algoritmo escrito por 1 cifra
        const steps = this._buildMultSteps(a, b);
        steps.forEach((step, i) => {
            container.appendChild(this._demoStep(String(i + 1), null, null, (i + 1) * 0.15, step.html));
        });

        // Resultado
        const result = document.createElement('div');
        result.className = 'tm-demo-result';
        result.textContent = `${a} × ${b} = ${a * b}`;
        container.appendChild(result);
    },

    /** One step row of a worked demo. Text comes from i18n (key + params) or from an already-built rich string. */
    _demoStep(num, key, params, delay, richStr) {
        const row = document.createElement('div');
        row.className = 'tm-demo-step';
        if (delay) row.style.animationDelay = `${delay}s`;
        const n = document.createElement('div');
        n.className = 'tm-step-num'; n.setAttribute('aria-hidden', 'true'); n.textContent = num;
        const txt = document.createElement('div');
        txt.className = 'tm-step-text';
        this._setRich(txt, key ? TableMasterI18n.t(key, params) : richStr);
        row.append(n, txt);
        return row;
    },

    _buildMultSteps(a, b) {
        // Algoritmo columna para a × b donde b es 1 cifra
        const aStr   = String(a);
        const digits = aStr.split('').reverse(); // LSB primero
        const steps  = [];
        let carry    = 0;
        const partials = [];

        digits.forEach((dStr, pos) => {
            const d       = parseInt(dStr, 10);
            const product = b * d + carry;
            const digit   = product % 10;
            const newCarry = Math.floor(product / 10);
            partials.unshift(digit);

            const tt = (k, p) => TableMasterI18n.t(k, p);
            let html = `<span class="tm-step-math">${b} × ${d}</span>`;
            if (carry > 0) {
                html += ` + <span class="tm-step-carry">${tt('demoCarryIn', { c: carry })}</span>`;
            }
            html += ` = <span class="tm-step-math">${product}</span>`;
            html += newCarry > 0
                ? tt('demoWriteCarry', { d: digit, c: newCarry })
                : tt('demoWrite', { p: product });
            steps.push({ html });
            carry = newCarry;
        });

        if (carry > 0) {
            steps.push({
                html: TableMasterI18n.t('demoFinalCarry', { c: carry })
            });
        }

        return steps;
    },

    // ── Demo de división ──────────────────────────────────────────────────────

    _renderDivDemo() {
        const container = document.getElementById('div-demo');
        if (!container) return;
        const { dividend, divisor } = this._divExamples[this._divExIdx];
        container.innerHTML = '';

        container.appendChild(this._demoStep('?', 'demoCalc', { m: `${dividend} ÷ ${divisor}` }, 0));

        const steps = this._buildDivSteps(dividend, divisor);
        steps.forEach((step, i) => {
            container.appendChild(this._demoStep(String(i + 1), null, null, (i + 1) * 0.18, step.html));
        });

        const quotient  = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        const resText   = TableMasterI18n.t(remainder === 0 ? 'demoDivRes' : 'demoDivResRem',
            { a: dividend, b: divisor, q: quotient, r: remainder });

        const result = document.createElement('div');
        result.className = 'tm-demo-result';
        result.textContent = resText;
        container.appendChild(result);
    },

    _buildDivSteps(dividend, divisor) {
        const dividendStr = String(dividend);
        const steps = [];
        let current = 0;
        let quotientStr = '';

        for (let i = 0; i < dividendStr.length; i++) {
            current = current * 10 + parseInt(dividendStr[i], 10);

            if (current < divisor && quotientStr.length === 0) {
                // No cabe aún: cojo siguiente cifra
                steps.push({
                    html: TableMasterI18n.t('demoNoFit', { d: divisor, c: current })
                });
                continue;
            }

            const q = Math.floor(current / divisor);
            const rem = current % divisor;

            steps.push({
                html: TableMasterI18n.t('demoFit', { d: divisor, c: current, q, m: q * divisor, r: rem })
            });

            quotientStr += String(q);
            current = rem;
        }

        return steps;
    },

    // ── Pantalla Selección Nivel ──────────────────────────────────────────────

    _bindPracticeSelectEvents() {
        document.getElementById('btn-practice-learn')?.addEventListener('click', () => {
            const mul = this.state.practice.operation !== 'divide';
            this._openLearn(mul ? 'screen-learn-multiply' : 'screen-learn-divide', null, 'screen-practice-select');
        });
        document.getElementById('btn-review')?.addEventListener('click', () => this._startReview());
        document.getElementById('level-grid')?.addEventListener('click', e => {
            const btn = e.target.closest('.tm-level-btn');
            if (!btn) return;
            const level = parseInt(btn.dataset.level, 10);
            this.state.practice.level = level;
            this._startPractice();
        });
    },

    _buildLevelGrid(op) {
        const grid  = document.getElementById('level-grid');
        const title = document.getElementById('practice-select-title');
        if (!grid) return;

        const t = key => TableMasterI18n.t(key);

        if (title) {
            title.textContent = op === 'multiply'
                ? t('practiceMultiply')
                : t('practiceDivide');
        }

        const levels = op === 'multiply'
            ? [
                { level: 1,  name: t('level1Name'),  example: t('level1Example') },
                { level: 2,  name: t('level2Name'),  example: t('level2Example') },
                { level: 3,  name: t('level3Name'),  example: t('level3Example') },
                { level: 31, name: t('level3bName'), example: t('level3bExample') },
            ]
            : [
                { level: 4, name: t('level4Name'), example: t('level4Example') },
                { level: 5, name: t('level5Name'), example: t('level5Example') },
                { level: 6, name: t('level6Name'), example: t('level6Example') },
            ];

        this._updateReviewBox();

        grid.innerHTML = levels.map(l => `
            <button class="tm-level-btn" data-level="${l.level}" aria-label="${l.name}: ${l.example}">
                <div class="tm-level-badge">${l.level === 31 ? '3B' : l.level}</div>
                <div class="tm-level-info">
                    <div class="tm-level-name">${l.name}</div>
                    <div class="tm-level-example">${l.example}</div>
                </div>
            </button>
        `).join('');
    },

    // ── Práctica ──────────────────────────────────────────────────────────────

    // ── Repaso de errores (guardado solo en este dispositivo) ──────────────────

    _MISTAKES_KEY: 'games_hub_tablemaster_mistakes',
    _MISTAKES_MAX: 20,

    _loadMistakes() {
        try {
            const raw = localStorage.getItem(this._MISTAKES_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) { return []; }
    },

    _saveMistakes(list) {
        try { localStorage.setItem(this._MISTAKES_KEY, JSON.stringify(list.slice(-this._MISTAKES_MAX))); } catch (e) { /* storage unavailable */ }
    },

    _exKey(ex) {
        return ex.op === 'multiply' ? `m${ex.a}x${ex.b}` : `d${ex.dividend}/${ex.divisor}`;
    },

    /** Called when an exercise ends: store it if there was any wrong step, drop it if solved clean. */
    _recordExerciseResult(ex, hadMistake) {
        const key = this._exKey(ex);
        const list = this._loadMistakes().filter(e => this._exKey(e) !== key);
        if (hadMistake) list.push(ex);
        this._saveMistakes(list);
    },

    _updateReviewBox() {
        const box = document.getElementById('review-box');
        if (!box) return;
        const t = key => TableMasterI18n.t(key);
        const n = this._loadMistakes().length;
        document.getElementById('review-title').textContent = t('reviewMistakes');
        document.getElementById('review-count').textContent = n > 0 ? `${n} ${t('reviewCount')}` : t('reviewNone');
        document.getElementById('btn-review').disabled = n === 0;
    },

    _startReview() {
        const list = this._loadMistakes();
        if (!list.length) return;
        const picked = list.slice().sort(() => Math.random() - 0.5).slice(0, 5);
        const ps = this.state.practice;
        ps.exercises = picked.map(e => ({ ...e }));
        ps.operation = picked[0].op;
        ps.level = picked[0].level;
        ps.exIndex = 0; ps.score = 0; ps.totalSteps = 0; ps.okSteps = 0;
        document.getElementById('hud-score').textContent = '0';
        document.getElementById('hud-progress').textContent = `1/${picked.length}`;
        this._showScreen('screen-practice');
        this._renderExercise();
    },

    /** Suggest the next level according to accuracy. */
    _levelTip(accuracy) {
        const t = key => TableMasterI18n.t(key);
        const order = this.state.practice.operation === 'multiply' ? [1, 2, 3, 31] : [4, 5, 6];
        const i = order.indexOf(this.state.practice.level);
        if (accuracy >= 90 && i >= 0 && i < order.length - 1) return t('tipNext');
        if (accuracy >= 70) return t('tipSame');
        return t('tipEasier');
    },

    _startPractice() {
        const ps = this.state.practice;
        ps.exercises = this._generateExercises(ps.operation, ps.level, 5);
        ps.exIndex  = 0;
        ps.score    = 0;
        ps.totalSteps = 0;
        ps.okSteps    = 0;

        document.getElementById('hud-score').textContent = '0';
        document.getElementById('hud-progress').textContent = `1/5`;

        this._showScreen('screen-practice');
        this._renderExercise();
    },

    _generateExercises(op, level, count) {
        const exercises = [];
        for (let i = 0; i < count; i++) {
            exercises.push(this._makeExercise(op, level));
        }
        return exercises;
    },

    _makeExercise(op, level) {
        if (op === 'multiply') {
            return this._makeMulExercise(level);
        } else {
            return this._makeDivExercise(level);
        }
    },

    // Level 3B: multiplicación por 2 cifras con productos parciales
    _makeMul2DigitExercise() {
        const a = 10 + Math.floor(Math.random() * 89);   // 10-98
        const b = 11 + Math.floor(Math.random() * 29);   // 11-39
        const b1 = b % 10;   // unidades de b
        const b10 = Math.floor(b / 10) * 10;  // decenas de b
        const partial1 = a * b1;
        const partial2 = a * b10;
        return {
            op: 'multiply',
            level: 31,
            a, b,
            answer: a * b,
            partial1,
            partial2,
            steps: this._buildMulStepData(a, b),
        };
    },

    _makeMulExercise(level) {
        if (level === 31) {
            return this._makeMul2DigitExercise();
        }
        let a, b;

        if (level === 1) {
            // Sin llevadas: cada dígito de a × b < 10
            do {
                a = 10 + Math.floor(Math.random() * 79);  // 10-88
                b = 2 + Math.floor(Math.random() * 5);     // 2-6
            } while (!this._hasNoCarry(a, b));
        } else if (level === 2) {
            // Con llevadas, × 1 cifra
            a = 20 + Math.floor(Math.random() * 60);  // 20-79
            b = 4 + Math.floor(Math.random() * 6);    // 4-9
            // Aseguramos al menos una llevada
            while (!this._hasCarry(a, b)) {
                a = 20 + Math.floor(Math.random() * 60);
                b = 4 + Math.floor(Math.random() * 6);
            }
        } else {
            // Nivel 3: × 2 cifras
            a = 10 + Math.floor(Math.random() * 89);  // 10-98
            b = 11 + Math.floor(Math.random() * 29);  // 11-39
        }

        return {
            op: 'multiply',
            level,
            a, b,
            answer: a * b,
            steps: this._buildMulStepData(a, b),
        };
    },

    _hasNoCarry(a, b) {
        return String(a).split('').every(d => parseInt(d, 10) * b < 10);
    },

    _hasCarry(a, b) {
        return String(a).split('').some(d => parseInt(d, 10) * b >= 10);
    },

    _buildMulStepData(a, b) {
        // Generamos los pasos del algoritmo para práctica × 1 cifra
        const aStr   = String(a);
        const digits = aStr.split('').reverse();
        const steps  = [];
        let carry    = 0;
        const resultDigits = [];

        digits.forEach((dStr, pos) => {
            const d        = parseInt(dStr, 10);
            const product  = b * d + carry;
            const digit    = product % 10;
            const newCarry = Math.floor(product / 10);
            resultDigits.unshift(digit);

            steps.push({
                pos,          // posición (0 = unidades)
                digit: d,
                multiplier: b,
                carry,
                product,
                writeDigit: digit,
                newCarry,
            });
            carry = newCarry;
        });

        if (carry > 0) {
            resultDigits.unshift(carry);
            steps.push({
                pos: digits.length,
                isFinalCarry: true,
                carry,
                writeDigit: carry,
                newCarry: 0,
            });
        }

        return { steps, result: a * b, resultDigits };
    },

    _makeDivExercise(level) {
        let dividend, divisor, quotient, remainder;

        if (level === 4) {
            // División exacta
            divisor  = 2 + Math.floor(Math.random() * 8);  // 2-9
            quotient = 10 + Math.floor(Math.random() * 90); // 10-99 (2 cifras)
            dividend = divisor * quotient;
            remainder = 0;
        } else if (level === 6) {
            // División con cero en el cociente
            // Generar cociente con un 0 en el medio: X0Y
            divisor = 2 + Math.floor(Math.random() * 7);  // 2-8
            const hundreds = 1 + Math.floor(Math.random() * 8); // 1-8
            const units    = 1 + Math.floor(Math.random() * 9); // 1-9
            quotient = hundreds * 100 + units; // ej: 102, 203, 305...
            dividend = divisor * quotient;
            remainder = 0;
        } else {
            // División con resto (nivel 5)
            divisor   = 3 + Math.floor(Math.random() * 7);  // 3-9
            quotient  = 10 + Math.floor(Math.random() * 40); // 10-49
            remainder = 1 + Math.floor(Math.random() * (divisor - 1));
            dividend  = divisor * quotient + remainder;
        }

        return {
            op: 'divide',
            level,
            dividend, divisor, quotient, remainder,
            answer: quotient,
            steps: this._buildDivStepData(dividend, divisor),
        };
    },

    _buildDivStepData(dividend, divisor) {
        const dStr   = String(dividend);
        const steps  = [];
        let current  = 0;
        let qStr     = '';

        for (let i = 0; i < dStr.length; i++) {
            current = current * 10 + parseInt(dStr[i], 10);
            if (current < divisor && qStr.length === 0) {
                continue;
            }
            const q   = Math.floor(current / divisor);
            const rem = current % divisor;
            qStr     += String(q);
            steps.push({
                partial: current,
                divisor,
                q,
                sub: q * divisor,
                rem,
            });
            current = rem;
        }

        const quotient  = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        return { steps, quotient, remainder };
    },

    // ── Renderizar ejercicio ──────────────────────────────────────────────────

    _currentStep: 0,
    _stepAnswers: [],
    _exerciseDone: false,

    _renderExercise() {
        const ps = this.state.practice;
        const ex = ps.exercises[ps.exIndex];
        this._currentStep  = 0;
        this._stepAnswers  = [];
        this._exerciseDone = false;
        this._exStart = { total: ps.totalSteps, ok: ps.okSteps };

        document.getElementById('hud-progress').textContent =
            `${ps.exIndex + 1}/${ps.exercises.length}`;
        if (typeof TMDyn !== 'undefined') TMDyn.onExercise(ps.exIndex + 1, ps.exercises.length);

        document.getElementById('practice-feedback')?.classList.add('hidden');
        document.getElementById('practice-controls')?.classList.add('hidden');

        const area = document.getElementById('practice-exercise-area');
        if (!area) return;

        if (ex.op === 'multiply' && ex.level === 31) {
            this._renderMul2DigitExercise(area, ex);
        } else if (ex.op === 'multiply') {
            this._renderMulExercise(area, ex);
        } else {
            this._renderDivExercise(area, ex);
        }
    },

    // Ejercicio de multiplicación: un área con inputs paso a paso
    _renderMulExercise(area, ex) {
        const t = key => TableMasterI18n.t(key);
        const { a, b, steps: { steps, result, resultDigits } } = ex;

        area.innerHTML = `
            <div class="tm-ex-title">Calcula: <strong>${a} × ${b}</strong></div>
            <div class="tm-mul-workspace" id="mul-workspace"></div>
        `;

        const ws = area.querySelector('#mul-workspace');

        // Vista de la operación vertical
        ws.innerHTML = `
            <div class="tm-written-op" id="mul-written-op">
                <div class="tm-wo-row tm-wo-multiplicando" id="wo-a">
                    ${String(a).split('').map(d =>
                        `<span class="tm-digit-static">${d}</span>`
                    ).join('')}
                </div>
                <div class="tm-wo-row tm-wo-multiplicador">
                    <span class="tm-digit-static" style="color:var(--hub-brand-color)">×</span>
                    ${String(b).split('').map(d =>
                        `<span class="tm-digit-static">${d}</span>`
                    ).join('')}
                </div>
                <div class="tm-wo-line"></div>
                <div class="tm-wo-row tm-wo-resultado" id="wo-result">
                    ${resultDigits.map((_, i) =>
                        `<input type="text" inputmode="numeric" pattern="[0-9]"
                            class="tm-digit-input" id="res-digit-${i}"
                            maxlength="1" aria-label="dígito ${i+1} del resultado"
                            disabled>`
                    ).join('')}
                </div>
            </div>
        `;

        // Panel de guía de pasos
        const guideEl = document.createElement('div');
        guideEl.id = 'mul-guide';
        ws.appendChild(guideEl);

        this._renderMulStep(ex, 0, ws);
    },

    _renderMulStep(ex, stepIdx, ws) {
        const t = key => TableMasterI18n.t(key);
        const { a, b, steps: { steps, resultDigits } } = ex;
        const totalSteps = steps.length;

        if (stepIdx >= totalSteps) {
            // Todos los pasos de cifras done: pedir resultado final
            this._renderMulResultStep(ex, ws);
            return;
        }

        const step = steps[stepIdx];
        const guideEl = document.getElementById('mul-guide');
        if (!guideEl) return;

        let prompt = '';
        if (step.isFinalCarry) {
            prompt = `Queda una llevada de <span class="tm-step-carry">${step.carry}</span> → ¿qué escribes?`;
        } else {
            prompt = `<span class="tm-step-math">${step.multiplier} × ${step.digit}</span>`;
            if (step.carry > 0) {
                prompt += ` + <span class="tm-step-carry">${step.carry} que llevas</span>`;
            }
            prompt += ` = ?`;
        }

        // Posición del dígito resultado que el alumno debe rellenar
        const digitPos = resultDigits.length - 1 - stepIdx;

        guideEl.innerHTML = `
            <div class="tm-step-highlight">
                <span class="tm-step-arrow" aria-hidden="true">▶</span>
                <span class="tm-step-prompt">${prompt}</span>
            </div>
            <div id="mul-step-input-area" style="display:flex; align-items:center; gap:12px; justify-content:center; margin:12px 0;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="mul-step-input"
                    class="tm-digit-input" maxlength="${step.newCarry > 0 || step.isFinalCarry ? 1 : 2}"
                    style="width:${step.newCarry > 0 || step.isFinalCarry ? 'var(--digit-size)' : 'calc(var(--digit-size)*1.8)'}"
                    aria-label="${t('writeResult')}" placeholder="?">
                <button class="tm-btn-primary" id="mul-step-check" style="padding:10px 20px; font-size:0.9rem;">
                    Comprobar
                </button>
            </div>
            ${step.newCarry > 0 && !step.isFinalCarry
                ? `<div style="font-size:0.82rem; color:var(--text-muted); text-align:center;">(Escribe solo el dígito de unidades: <strong>${step.writeDigit}</strong>. La llevada es ${step.newCarry}.)</div>`
                : ''}
        `;

        const inputEl  = document.getElementById('mul-step-input');
        const checkBtn = document.getElementById('mul-step-check');

        inputEl?.focus();
        this.state.practice.totalSteps++;

        const validate = () => {
            const raw    = (inputEl.value || '').trim();
            const answer = parseInt(raw, 10);

            if (isNaN(answer)) return;

            // El alumno debe escribir el dígito que va a la posición resultado
            // Para pasos con carry: escribe solo el dígito de unidades
            const expected = step.isFinalCarry ? step.carry : step.writeDigit;

            const resInput = document.getElementById(`res-digit-${digitPos}`);

            if (answer === expected) {
                this.state.practice.okSteps++;
                this.state.practice.score += 10;
                document.getElementById('hud-score').textContent =
                    this.state.practice.score;

                if (resInput) {
                    resInput.value = String(expected);
                    resInput.classList.add('correct');
                    resInput.disabled = true;
                }

                // Mostrar carry info si lo hay
                let msg = 'Correcto.';
                if (step.newCarry > 0) {
                    msg += ` Te llevas <span class="tm-step-carry">${step.newCarry}</span>.`;
                }
                this._showInlineFeedback(guideEl, 'correct', msg, () => {
                    this._renderMulStep(ex, stepIdx + 1, ws);
                });
            } else {
                inputEl.classList.add('wrong');
                const hint = step.isFinalCarry
                    ? `La llevada era ${step.carry}`
                    : `${step.multiplier} × ${step.digit}${step.carry > 0 ? ' + ' + step.carry : ''} = ${step.product}`;
                this._showInlineFeedback(guideEl, 'wrong',
                    `Incorrecto. ${hint}. Escribe <strong>${expected}</strong>.`,
                    () => {
                        if (resInput) {
                            resInput.value = String(expected);
                            resInput.classList.add('wrong');
                            resInput.disabled = true;
                        }
                        this._renderMulStep(ex, stepIdx + 1, ws);
                    });
            }
        };

        checkBtn?.addEventListener('click', validate);
        inputEl?.addEventListener('keydown', e => {
            if (e.key === 'Enter') validate();
        });
    },

    _renderMulResultStep(ex, ws) {
        const t = key => TableMasterI18n.t(key);
        const { a, b, answer } = ex;
        const guideEl = document.getElementById('mul-guide');
        if (!guideEl) return;

        guideEl.innerHTML = `
            <div class="tm-step-highlight">
                <span class="tm-step-arrow" aria-hidden="true">▶</span>
                <span class="tm-step-prompt">¿Cuál es el resultado de <strong>${a} × ${b}</strong>?</span>
            </div>
            <div id="mul-step-input-area" style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="mul-final-input"
                    class="tm-digit-input" maxlength="6"
                    style="width: calc(var(--digit-size) * ${String(answer).length})"
                    aria-label="${t('writeResult')}" placeholder="?">
                <button class="tm-btn-primary" id="mul-final-check" style="padding:10px 20px;font-size:0.9rem;">
                    Comprobar
                </button>
            </div>
        `;

        this.state.practice.totalSteps++;
        const inputEl  = document.getElementById('mul-final-input');
        const checkBtn = document.getElementById('mul-final-check');
        inputEl?.focus();

        const validate = () => {
            const userAns = parseInt((inputEl.value || '').trim(), 10);
            if (isNaN(userAns)) return;

            if (userAns === answer) {
                this.state.practice.okSteps++;
                this.state.practice.score += 20;
                document.getElementById('hud-score').textContent =
                    this.state.practice.score;
                this._showInlineFeedback(guideEl, 'correct',
                    `¡Correcto! ${a} × ${b} = ${answer}`,
                    () => this._exerciseComplete());
            } else {
                this._showInlineFeedback(guideEl, 'wrong',
                    `La respuesta correcta es <strong>${answer}</strong>.`,
                    () => this._exerciseComplete());
            }
        };

        checkBtn?.addEventListener('click', validate);
        inputEl?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    },

    // Ejercicio de división
    _renderDivExercise(area, ex) {
        const t = key => TableMasterI18n.t(key);
        const { dividend, divisor, quotient, remainder, steps: { steps } } = ex;

        area.innerHTML = `
            <div class="tm-ex-title">Calcula: <strong>${dividend} ÷ ${divisor}</strong></div>
            <div class="tm-div-workspace" id="div-workspace"></div>
        `;

        const ws = area.querySelector('#div-workspace');

        // Visualización de la caja española
        const quotientDigits = String(quotient).split('');
        ws.innerHTML = `
            <div style="display:flex; justify-content:center; margin: 16px 0;">
                <div class="tm-div-practice">
                    <div class="tm-div-practice-left" id="div-left-area">
                        <div style="display:flex;gap:4px;">
                            ${String(dividend).split('').map(d =>
                                `<span class="tm-digit-static">${d}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="tm-div-practice-bar"></div>
                    <div class="tm-div-practice-right">
                        <div style="display:flex;gap:4px; margin-bottom:4px;">
                            ${String(divisor).split('').map(d =>
                                `<span class="tm-digit-static" style="color:var(--hub-brand-color)">${d}</span>`
                            ).join('')}
                        </div>
                        <div class="tm-wo-line" style="width:100%;"></div>
                        <div style="display:flex;gap:4px;margin-top:4px;" id="quotient-area">
                            ${quotientDigits.map((_, i) =>
                                `<input type="text" inputmode="numeric" pattern="[0-9]"
                                    class="tm-digit-input" id="q-digit-${i}"
                                    maxlength="1" aria-label="dígito ${i+1} del cociente"
                                    disabled placeholder="?">`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div id="div-guide"></div>
        `;

        this._renderDivStep(ex, 0, ws);
    },

    _renderDivStep(ex, stepIdx, ws) {
        const t = key => TableMasterI18n.t(key);
        const { dividend, divisor, quotient, remainder,
                steps: { steps } } = ex;
        const guideEl = document.getElementById('div-guide');
        if (!guideEl) return;

        if (stepIdx >= steps.length) {
            this._renderDivResultStep(ex, ws);
            return;
        }

        const step = steps[stepIdx];
        this.state.practice.totalSteps++;

        guideEl.innerHTML = `
            <div class="tm-step-highlight">
                <span class="tm-step-arrow" aria-hidden="true">▶</span>
                <span class="tm-step-prompt">
                    ¿Cuántas veces cabe <span class="tm-step-math">${divisor}</span>
                    en <strong>${step.partial}</strong>?
                </span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="div-step-input"
                    class="tm-digit-input" maxlength="2"
                    style="width:calc(var(--digit-size)*1.5)"
                    aria-label="cuántas veces cabe" placeholder="?">
                <button class="tm-btn-primary" id="div-step-check" style="padding:10px 20px;font-size:0.9rem;">
                    Comprobar
                </button>
            </div>
        `;

        const inputEl  = document.getElementById('div-step-input');
        const checkBtn = document.getElementById('div-step-check');
        inputEl?.focus();

        const validate = () => {
            const userAns = parseInt((inputEl.value || '').trim(), 10);
            if (isNaN(userAns)) return;

            const qInput = document.getElementById(`q-digit-${stepIdx}`);

            if (userAns === step.q) {
                this.state.practice.okSteps++;
                this.state.practice.score += 10;
                document.getElementById('hud-score').textContent =
                    this.state.practice.score;
                if (qInput) {
                    qInput.value = String(step.q);
                    qInput.classList.add('correct');
                    qInput.disabled = true;
                }
                const msg = `Correcto. ${step.q}×${step.divisor}=${step.sub}. Resto: <strong>${step.rem}</strong>.`;
                this._showInlineFeedback(guideEl, 'correct', msg,
                    () => this._renderDivStep(ex, stepIdx + 1, ws));
            } else {
                if (qInput) qInput.classList.add('wrong');
                const msg = `${divisor} cabe <strong>${step.q}</strong> veces en ${step.partial} (${step.q}×${divisor}=${step.sub}). Resto: ${step.rem}.`;
                this._showInlineFeedback(guideEl, 'wrong', msg, () => {
                    if (qInput) {
                        qInput.value = String(step.q);
                        qInput.classList.remove('wrong');
                        qInput.classList.add('correct');
                        qInput.disabled = true;
                    }
                    this._renderDivStep(ex, stepIdx + 1, ws);
                });
            }
        };

        checkBtn?.addEventListener('click', validate);
        inputEl?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    },

    _renderDivResultStep(ex, ws) {
        const { dividend, divisor, quotient, remainder } = ex;
        const guideEl = document.getElementById('div-guide');
        if (!guideEl) return;

        this.state.practice.totalSteps++;

        const prompt = remainder > 0
            ? `¿Cuál es el cociente? (y el resto es ${remainder})`
            : `¿Cuál es el cociente de ${dividend} ÷ ${divisor}?`;

        guideEl.innerHTML = `
            <div class="tm-step-highlight">
                <span class="tm-step-arrow" aria-hidden="true">▶</span>
                <span class="tm-step-prompt">${prompt}</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="div-final-input"
                    class="tm-digit-input" maxlength="4"
                    style="width:calc(var(--digit-size)*${String(quotient).length})"
                    aria-label="cociente" placeholder="?">
                <button class="tm-btn-primary" id="div-final-check" style="padding:10px 20px;font-size:0.9rem;">
                    Comprobar
                </button>
            </div>
        `;

        const inputEl  = document.getElementById('div-final-input');
        const checkBtn = document.getElementById('div-final-check');
        inputEl?.focus();

        const validate = () => {
            const userAns = parseInt((inputEl.value || '').trim(), 10);
            if (isNaN(userAns)) return;

            if (userAns === quotient) {
                this.state.practice.okSteps++;
                this.state.practice.score += 20;
                document.getElementById('hud-score').textContent =
                    this.state.practice.score;
                const res = remainder > 0
                    ? `${dividend} ÷ ${divisor} = ${quotient} (resto ${remainder})`
                    : `${dividend} ÷ ${divisor} = ${quotient}`;
                this._showInlineFeedback(guideEl, 'correct',
                    `¡Correcto! ${res}`,
                    () => this._exerciseComplete());
            } else {
                const res = remainder > 0
                    ? `${quotient} (resto ${remainder})`
                    : String(quotient);
                this._showInlineFeedback(guideEl, 'wrong',
                    `La respuesta correcta es <strong>${res}</strong>.`,
                    () => this._exerciseComplete());
            }
        };

        checkBtn?.addEventListener('click', validate);
        inputEl?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    },

    // ── Feedback inline ───────────────────────────────────────────────────────

    _showInlineFeedback(container, type, html, onContinue) {
        if (typeof TMDyn !== 'undefined') TMDyn.onInline(type, container);
        const fb = document.createElement('div');
        fb.className = `tm-practice-feedback ${type === 'correct' ? 'correct-fb' : 'wrong-fb'}`;
        fb.style.marginTop = '8px';
        fb.innerHTML = (type === 'correct' ? '✓ ' : '✗ ') + html;
        container.appendChild(fb);

        setTimeout(() => {
            fb.remove();
            if (onContinue) onContinue();
        }, type === 'correct' ? 1400 : 2200);
    },

    // ── Ejercicio completo ────────────────────────────────────────────────────

    _exerciseComplete() {
        if (this._exerciseDone) return;
        this._exerciseDone = true;

        const ps  = this.state.practice;
        const ex  = ps.exercises[ps.exIndex];
        const t   = key => TableMasterI18n.t(key);

        const st = this._exStart || { total: 0, ok: 0 };
        this._recordExerciseResult(ex, (ps.totalSteps - st.total) !== (ps.okSteps - st.ok));

        const fb = document.getElementById('practice-feedback');
        if (fb) {
            fb.className = 'tm-practice-feedback correct-fb';
            fb.innerHTML = `Ejercicio completado. Puntos: <strong>${ps.score}</strong>`;
            fb.classList.remove('hidden');
        }

        const controls = document.getElementById('practice-controls');
        controls?.classList.remove('hidden');

        const nextBtn = document.getElementById('btn-practice-next');
        if (nextBtn) {
            nextBtn.textContent = ps.exIndex < ps.exercises.length - 1
                ? t('nextExercise')
                : 'Ver resultados';
            nextBtn.focus();
        }
    },

    _bindPracticeEvents() {
        document.getElementById('btn-practice-next')?.addEventListener('click', () => {
            const ps = this.state.practice;
            ps.exIndex++;
            if (ps.exIndex >= ps.exercises.length) {
                this._endPractice();
            } else {
                this._renderExercise();
            }
        });

        document.getElementById('btn-practice-hint')?.addEventListener('click', () => {
            const ps = this.state.practice;
            const ex = ps.exercises[ps.exIndex];
            const fb = document.getElementById('practice-feedback');
            if (!fb) return;
            fb.className = 'tm-practice-feedback hint-fb';
            const hint = ex.op === 'multiply'
                ? `Recuerda: multiplica de derecha a izquierda cifra a cifra.`
                : `Recuerda: ¿cuántas veces cabe el divisor en la parte que estás mirando?`;
            fb.innerHTML = `<strong>Pista:</strong> ${hint}`;
            fb.classList.remove('hidden');
        });
    },

    // ── Fin de práctica ───────────────────────────────────────────────────────

    async _endPractice() {
        const ps = this.state.practice;
        const t  = key => TableMasterI18n.t(key);
        const op = ps.operation;

        const totalEx  = ps.exercises.length;
        const allOk    = ps.exercises.filter((_, i) => true).length; // simplificado

        const accuracy = ps.totalSteps > 0
            ? Math.round((ps.okSteps / ps.totalSteps) * 100)
            : 0;

        const gameResult = {
            correctAnswers: ps.okSteps,
            totalQuestions: ps.totalSteps,
            totalAttempts:  ps.totalSteps,
            bestStreak:     0,
            elapsedSeconds: 0,
            level:          ps.level,
            operation:      op === 'multiply' ? 'multiplicacion' : 'division',
        };

        let pts = { points: 0, xp: 0 };
        if (typeof PlatformFirestore !== 'undefined') {
            pts = PlatformFirestore.calculatePoints(gameResult);
        }

        if (this.state.currentUser && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(
                    this.state.currentUser.uid, 'tablemaster', gameResult);
            } catch (err) {
                console.warn('[TableMaster] Could not save stats:', err);
            }
        }

        // Poblar pantalla de resultado
        const trophy = document.getElementById('result-trophy');
        if (trophy) {
            trophy.textContent = accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : '💪';
        }

        const msg = document.getElementById('result-message');
        if (msg) {
            msg.textContent = accuracy >= 90
                ? t('resultPerfect')
                : accuracy >= 60
                ? t('resultGood')
                : t('resultKeepTrying');
        }

        const tipEl = document.getElementById('result-tip');
        if (tipEl) tipEl.textContent = this._levelTip(accuracy);

        document.getElementById('result-correct').textContent =
            `${ps.okSteps}/${ps.totalSteps}`;
        document.getElementById('result-score').textContent = ps.score;
        document.getElementById('result-points').textContent = `+${pts.points} pts`;
        document.getElementById('result-xp').textContent    = `+${pts.xp} XP`;

        if (accuracy >= 70) this._launchConfetti();

        this._showScreen('screen-result');
    },

    // ── Pantalla resultado ────────────────────────────────────────────────────

    _bindResultEvents() {
        document.getElementById('btn-again')?.addEventListener('click', () => {
            this._startPractice();
        });

        document.getElementById('btn-home')?.addEventListener('click', () => {
            this._showScreen('screen-home');
        });
    },

    // ── Confeti ───────────────────────────────────────────────────────────────

    _launchConfetti() {
        const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#818cf8','#fbbf24'];
        const wrapper = document.createElement('div');
        wrapper.className = 'tm-confetti';
        document.body.appendChild(wrapper);

        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'tm-confetti-piece';
            piece.style.cssText = `
                left: ${Math.random() * 100}%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                width: ${6 + Math.random() * 8}px;
                height: ${6 + Math.random() * 8}px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                animation-duration: ${1.5 + Math.random() * 2}s;
                animation-delay: ${Math.random() * 0.8}s;
            `;
            wrapper.appendChild(piece);
        }

        setTimeout(() => wrapper.remove(), 4000);
    },

    // ── Ejercicio nivel 3B: multiplicación por 2 cifras ──────────────────────

    _renderMul2DigitExercise(area, ex) {
        const { a, b, partial1, partial2, answer } = ex;
        const b1  = b % 10;
        const b10 = Math.floor(b / 10) * 10;

        area.innerHTML = `
            <div class="tm-ex-title">Calcula: <strong>${a} × ${b}</strong> (productos parciales)</div>
            <div class="tm-mul-workspace" id="mul2-workspace">
                <div class="tm-mult-partial" style="margin:16px auto; max-width:360px;">
                    <div class="tm-mp-line">
                        <span class="tm-mp-space"></span>
                        <span class="tm-mp-num">${String(a).split('').join(' ')}</span>
                    </div>
                    <div class="tm-mp-line">
                        <span class="tm-mp-op">×</span>
                        <span class="tm-mp-num">${String(b).split('').join(' ')}</span>
                    </div>
                    <div class="tm-mp-separator"></div>
                    <div class="tm-mp-line tm-mp-partial1" id="mp-partial1-row" style="opacity:0.4;">
                        <span class="tm-mp-label">← ${a} × ${b1}</span>
                        <span class="tm-mp-num" id="mp-p1-display">?</span>
                    </div>
                    <div class="tm-mp-line tm-mp-partial2" id="mp-partial2-row" style="opacity:0.4;">
                        <span class="tm-mp-label">← ${a} × ${b10}</span>
                        <span class="tm-mp-num" id="mp-p2-display">?</span>
                    </div>
                    <div class="tm-mp-separator"></div>
                    <div class="tm-mp-line tm-mp-total" id="mp-total-row" style="opacity:0.4;">
                        <span class="tm-mp-label">← suma</span>
                        <span class="tm-mp-num" id="mp-total-display">?</span>
                    </div>
                </div>
                <div id="mul2-guide"></div>
            </div>
        `;

        this._renderMul2Step(ex, 0);
    },

    _renderMul2Step(ex, stepIdx) {
        const { a, b, partial1, partial2, answer } = ex;
        const b1  = b % 10;
        const b10 = Math.floor(b / 10) * 10;
        const guideEl = document.getElementById('mul2-guide');
        if (!guideEl) return;

        this.state.practice.totalSteps++;

        if (stepIdx === 0) {
            guideEl.innerHTML = `
                <div class="tm-step-highlight">
                    <span class="tm-step-arrow">▶</span>
                    <span class="tm-step-prompt"><strong>${a} × ${b1}</strong> = ?</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" id="mul2-input"
                        class="tm-digit-input" maxlength="5"
                        style="width:calc(var(--digit-size)*2.2)" placeholder="?" aria-label="primer producto parcial">
                    <button class="tm-btn-primary" id="mul2-check" style="padding:10px 20px;font-size:0.9rem;">Comprobar</button>
                </div>`;

            const inp = document.getElementById('mul2-input');
            const btn = document.getElementById('mul2-check');
            inp?.focus();
            const validate = () => {
                const val = parseInt((inp.value || '').trim(), 10);
                if (isNaN(val)) return;
                const row = document.getElementById('mp-partial1-row');
                const disp = document.getElementById('mp-p1-display');
                if (val === partial1) {
                    this.state.practice.okSteps++;
                    this.state.practice.score += 10;
                    document.getElementById('hud-score').textContent = this.state.practice.score;
                    if (row) row.style.opacity = '1';
                    if (disp) disp.textContent = partial1;
                    this._showInlineFeedback(guideEl, 'correct', `Correcto. ${a} × ${b1} = ${partial1}`,
                        () => this._renderMul2Step(ex, 1));
                } else {
                    this._showInlineFeedback(guideEl, 'wrong',
                        `${a} × ${b1} = <strong>${partial1}</strong>.`,
                        () => {
                            if (row) row.style.opacity = '1';
                            if (disp) disp.textContent = partial1;
                            this._renderMul2Step(ex, 1);
                        });
                }
            };
            btn?.addEventListener('click', validate);
            inp?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });

        } else if (stepIdx === 1) {
            guideEl.innerHTML = `
                <div class="tm-step-highlight">
                    <span class="tm-step-arrow">▶</span>
                    <span class="tm-step-prompt"><strong>${a} × ${b10}</strong> = ? (desplaza un lugar)</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" id="mul2-input"
                        class="tm-digit-input" maxlength="6"
                        style="width:calc(var(--digit-size)*2.5)" placeholder="?" aria-label="segundo producto parcial">
                    <button class="tm-btn-primary" id="mul2-check" style="padding:10px 20px;font-size:0.9rem;">Comprobar</button>
                </div>`;

            const inp = document.getElementById('mul2-input');
            const btn = document.getElementById('mul2-check');
            inp?.focus();
            const validate = () => {
                const val = parseInt((inp.value || '').trim(), 10);
                if (isNaN(val)) return;
                const row = document.getElementById('mp-partial2-row');
                const disp = document.getElementById('mp-p2-display');
                if (val === partial2) {
                    this.state.practice.okSteps++;
                    this.state.practice.score += 10;
                    document.getElementById('hud-score').textContent = this.state.practice.score;
                    if (row) row.style.opacity = '1';
                    if (disp) disp.textContent = partial2;
                    this._showInlineFeedback(guideEl, 'correct', `Correcto. ${a} × ${b10} = ${partial2}`,
                        () => this._renderMul2Step(ex, 2));
                } else {
                    this._showInlineFeedback(guideEl, 'wrong',
                        `${a} × ${b10} = <strong>${partial2}</strong>.`,
                        () => {
                            if (row) row.style.opacity = '1';
                            if (disp) disp.textContent = partial2;
                            this._renderMul2Step(ex, 2);
                        });
                }
            };
            btn?.addEventListener('click', validate);
            inp?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });

        } else {
            // Paso final: sumar parciales
            guideEl.innerHTML = `
                <div class="tm-step-highlight">
                    <span class="tm-step-arrow">▶</span>
                    <span class="tm-step-prompt">${partial1} + ${partial2} = ? (resultado total)</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0;">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" id="mul2-input"
                        class="tm-digit-input" maxlength="6"
                        style="width:calc(var(--digit-size)*${String(answer).length})" placeholder="?" aria-label="resultado final">
                    <button class="tm-btn-primary" id="mul2-check" style="padding:10px 20px;font-size:0.9rem;">Comprobar</button>
                </div>`;

            const inp = document.getElementById('mul2-input');
            const btn = document.getElementById('mul2-check');
            inp?.focus();
            const validate = () => {
                const val = parseInt((inp.value || '').trim(), 10);
                if (isNaN(val)) return;
                const row = document.getElementById('mp-total-row');
                const disp = document.getElementById('mp-total-display');
                if (row) row.style.opacity = '1';
                if (disp) disp.textContent = answer;
                if (val === answer) {
                    this.state.practice.okSteps++;
                    this.state.practice.score += 20;
                    document.getElementById('hud-score').textContent = this.state.practice.score;
                    this._showInlineFeedback(guideEl, 'correct',
                        `¡Correcto! ${ex.a} × ${ex.b} = ${answer}`,
                        () => this._exerciseComplete());
                } else {
                    this._showInlineFeedback(guideEl, 'wrong',
                        `La respuesta correcta es <strong>${answer}</strong>.`,
                        () => this._exerciseComplete());
                }
            };
            btn?.addEventListener('click', validate);
            inp?.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
        }
    },

    // ── Pantalla Tabla 10×10 ──────────────────────────────────────────────────

    _bindTableScreenEvents() {
        // El botón "Tablas completas" ya está gestionado en _bindHomeEvents con data-action="table"
        // Aquí gestionamos los back-btn dentro de screen-table
    },

    _renderMultGrid() {
        const grid = document.getElementById('mult-grid-10x10');
        if (!grid) return;
        grid.innerHTML = '';

        // Fila de cabecera
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-mg-row tm-mg-header-row';
        headerRow.setAttribute('role', 'row');

        const cornerCell = document.createElement('div');
        cornerCell.className = 'tm-mg-cell tm-mg-corner';
        cornerCell.setAttribute('role', 'columnheader');
        cornerCell.textContent = '×';
        headerRow.appendChild(cornerCell);

        for (let j = 1; j <= 10; j++) {
            const th = document.createElement('div');
            th.className = 'tm-mg-cell tm-mg-header';
            th.setAttribute('role', 'columnheader');
            th.textContent = j;
            headerRow.appendChild(th);
        }
        grid.appendChild(headerRow);

        // Filas de datos
        for (let i = 1; i <= 10; i++) {
            const row = document.createElement('div');
            row.className = 'tm-mg-row';
            row.setAttribute('role', 'row');
            row.dataset.row = i;

            const rowHeader = document.createElement('div');
            rowHeader.className = 'tm-mg-cell tm-mg-header';
            rowHeader.setAttribute('role', 'rowheader');
            rowHeader.textContent = i;
            row.appendChild(rowHeader);

            for (let j = 1; j <= 10; j++) {
                const cell = document.createElement('div');
                cell.className = 'tm-mg-cell tm-mg-data';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `${i} × ${j} = ${i * j}`);
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.textContent = i * j;

                const val = i * j;
                if (i === j) {
                    cell.classList.add('tm-mg-square');
                }
                if (val > 50) {
                    cell.classList.add('tm-mg-large');
                }

                cell.addEventListener('mouseenter', () => this._highlightGridRowCol(i, j, true));
                cell.addEventListener('mouseleave', () => this._highlightGridRowCol(i, j, false));
                cell.addEventListener('click', () => this._selectGridCell(i, j));
                cell.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this._selectGridCell(i, j);
                    }
                });

                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
    },

    _highlightGridRowCol(row, col, on) {
        const grid = document.getElementById('mult-grid-10x10');
        if (!grid) return;
        grid.querySelectorAll('.tm-mg-data').forEach(cell => {
            const r = parseInt(cell.dataset.row, 10);
            const c = parseInt(cell.dataset.col, 10);
            cell.classList.toggle('tm-mg-hl-row', on && r === row);
            cell.classList.toggle('tm-mg-hl-col', on && c === col);
        });
    },

    _selectGridCell(row, col) {
        const grid = document.getElementById('mult-grid-10x10');
        if (!grid) return;
        // Quitar selección previa
        grid.querySelectorAll('.tm-mg-selected').forEach(c => c.classList.remove('tm-mg-selected'));
        const cell = grid.querySelector(`.tm-mg-data[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('tm-mg-selected');

        const info = document.getElementById('table-cell-info');
        if (info) {
            info.classList.remove('hidden');
            info.innerHTML = `
                <span class="tm-table-info-eq">
                    <strong>${row}</strong> × <strong>${col}</strong> = <span class="tm-table-info-result">${row * col}</span>
                </span>
            `;
        }
    },

    // ── Comprobador interactivo de divisibilidad ──────────────────────────────

    _bindDivisibilityChecker() {
        const btn   = document.getElementById('div-checker-btn');
        const input = document.getElementById('div-checker-input');
        const result= document.getElementById('div-checker-result');
        if (!btn || !input || !result) return;

        const tt = (k, p) => TableMasterI18n.t(k, p);
        const check = () => {
            const raw = (input.value || '').trim().replace(/\./g, '');
            const n   = parseInt(raw, 10);
            if (isNaN(n) || n <= 0) {
                result.textContent = '';
                const bad = document.createElement('span');
                bad.className = 'tm-danger-text';
                bad.textContent = TableMasterI18n.t('dcInvalid');
                result.appendChild(bad);
                return;
            }

            const tests = [
                { d: 2,  fn: x => x % 2 === 0,
                  why: () => tt('dcEndsIn', { n: n % 10 }) },
                { d: 3,  fn: x => { const s = String(x).split('').reduce((a,c) => a + parseInt(c,10), 0); return s % 3 === 0; },
                  why: () => { const s = String(n).split('').reduce((a,c) => a + parseInt(c,10), 0); return tt('dcDigitSum', { n: s }); } },
                { d: 4,  fn: x => (x % 100) % 4 === 0,
                  why: () => tt('dcLast2', { n: n % 100 }) },
                { d: 5,  fn: x => x % 5 === 0,
                  why: () => tt('dcEndsIn', { n: n % 10 }) },
                { d: 6,  fn: x => x % 2 === 0 && (String(x).split('').reduce((a,c) => a + parseInt(c,10), 0)) % 3 === 0,
                  why: () => tt('dcBy2and3') },
                { d: 9,  fn: x => { const s = String(x).split('').reduce((a,c) => a + parseInt(c,10), 0); return s % 9 === 0; },
                  why: () => { const s = String(n).split('').reduce((a,c) => a + parseInt(c,10), 0); return tt('dcDigitSum', { n: s }); } },
                { d: 10, fn: x => x % 10 === 0,
                  why: () => tt('dcEndsIn', { n: n % 10 }) },
            ];

            const grid = document.createElement('div');
            grid.className = 'tm-dc-grid';
            const num = document.createElement('div');
            num.className = 'tm-dc-number'; num.textContent = String(n);
            grid.appendChild(num);
            tests.forEach(t => {
                const ok  = t.fn(n);
                const row = document.createElement('div');
                row.className = 'tm-dc-row ' + (ok ? 'tm-dc-yes' : 'tm-dc-no');
                [['tm-dc-icon', ok ? '✓' : '✗'], ['tm-dc-label', '÷ ' + t.d], ['tm-dc-why', t.why()],
                 ['tm-dc-verdict', tt(ok ? 'dcYes' : 'dcNo')]].forEach(([c, txt]) => {
                    const s = document.createElement('span'); s.className = c; s.textContent = txt; row.appendChild(s);
                });
                grid.appendChild(row);
            });
            result.textContent = '';
            result.appendChild(grid);
        };

        btn.addEventListener('click', check);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    },

    // ── Retos rápidos (modos de tablas) ───────────────────────────────────────
    // Modes: table, mixed, divide, missing, timed, problems.
    // Progress (stars per mode/table, timed records, weak facts) lives in
    // localStorage on this device. Round results go to PlatformFirestore.

    _PROGRESS_KEY: 'games_hub_tablemaster_progress',
    _RANKS: [0, 5, 15, 35, 60],
    _DRILL_META: {
        table:    { op: 'multiplicacion', level: 1, total: 10, chips: true  },
        mixed:    { op: 'multiplicacion', level: 2, total: 10, chips: false },
        divide:   { op: 'division',       level: 2, total: 10, chips: true  },
        missing:  { op: 'multiplicacion', level: 2, total: 10, chips: true  },
        timed:    { op: 'mezcla',         level: 3, total: 0,  chips: true  },
        problems: { op: 'problemas',      level: 3, total: 10, chips: true  },
    },
    _TIMED_SECONDS: 60,
    _drillSel: { mode: 'table', table: 'all' },
    _drill: null,

    _loadProgress() {
        const empty = { stars: {}, best: {}, facts: {} };
        try {
            const p = JSON.parse(localStorage.getItem(this._PROGRESS_KEY) || 'null');
            if (!p || typeof p !== 'object') return empty;
            return { stars: p.stars || {}, best: p.best || {}, facts: p.facts || {} };
        } catch (e) { return empty; }
    },

    _saveProgress(p) {
        try { localStorage.setItem(this._PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* storage unavailable */ }
    },

    _totalStars(p) {
        return Object.values(p.stars).reduce((s, n) => s + (Number(n) || 0), 0);
    },

    _renderRankBar() {
        const t = (k, o) => TableMasterI18n.t(k, o);
        const total = this._totalStars(this._loadProgress());
        let rank = 0;
        this._RANKS.forEach((min, i) => { if (total >= min) rank = i; });
        const next = this._RANKS[rank + 1];
        const prev = this._RANKS[rank];
        const pct = next ? Math.round(((total - prev) / (next - prev)) * 100) : 100;
        const name = document.getElementById('tm-rank-name');
        const stars = document.getElementById('tm-rank-stars');
        const fill = document.getElementById('tm-rank-fill');
        if (name) name.textContent = t('rank' + rank);
        if (stars) stars.textContent = t('starsTotal', { n: total });
        if (fill) fill.style.width = pct + '%';
    },

    _bindDrillEvents() {
        document.querySelectorAll('[data-drill]').forEach(btn => {
            btn.addEventListener('click', () => this._openDrillSelect(btn.dataset.drill));
        });

        document.getElementById('btn-drill-start')?.addEventListener('click', () => this._startDrill(false));
        const openDrillLearn = () => {
            const target = TableMasterLearn.learnTarget(this._drillSel.mode, this._drillSel.table);
            this._openLearn(target.screen, target.slide, 'screen-drill-select');
        };
        document.getElementById('btn-drill-learn')?.addEventListener('click', openDrillLearn);
        document.getElementById('drill-learn')?.addEventListener('click', openDrillLearn);
        document.getElementById('btn-drill-retry')?.addEventListener('click', () => this._startDrill(false));
        document.getElementById('btn-drill-review')?.addEventListener('click', () => this._startDrill(true));
        document.getElementById('btn-drill-home')?.addEventListener('click', () => this._showScreen('screen-home'));
        document.getElementById('drill-next')?.addEventListener('click', () => this._drillNext());

        document.getElementById('drill-table-chips')?.addEventListener('click', e => {
            const chip = e.target.closest('.tm-chip');
            if (!chip) return;
            this._drillSel.table = chip.dataset.table;
            this._renderDrillSelect();
        });

        document.getElementById('drill-numpad')?.addEventListener('click', e => {
            const key = e.target.closest('.tm-key');
            if (key) this._drillKey(key.dataset.key);
        });

        // Physical keyboard (desktop)
        document.addEventListener('keydown', e => {
            if (this.state.currentScreen !== 'screen-drill' || !this._drill) return;
            if (document.getElementById('tm-quit-modal') && !document.getElementById('tm-quit-modal').classList.contains('hidden')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            let key = null;
            if (/^[0-9]$/.test(e.key)) key = e.key;
            else if (e.key === 'Backspace' || e.key === 'Delete') key = 'del';
            else if (e.key === 'Enter' || e.key === ' ') key = 'ok';
            if (key === null) return;
            e.preventDefault();
            this._drillKey(key);
        });
    },

    _openDrillSelect(mode) {
        this._drillSel.mode = mode;
        if (!this._DRILL_META[mode].chips) this._drillSel.table = 'all';
        this._renderDrillSelect();
        this._showScreen('screen-drill-select');
    },

    _renderDrillSelect() {
        const t = (k, o) => TableMasterI18n.t(k, o);
        const { mode, table } = this._drillSel;
        const meta = this._DRILL_META[mode];
        const cap = mode.charAt(0).toUpperCase() + mode.slice(1);
        document.getElementById('drill-select-title').textContent = t('mode' + cap + 'Name');
        document.getElementById('drill-select-desc').textContent =
            t('mode' + cap + 'Desc') + '. ' + (mode === 'timed' ? t('drillRoundTimed') : t('drillRound10'));

        const progress = this._loadProgress();
        const chips = document.getElementById('drill-table-chips');
        const heading = document.getElementById('drill-choose-heading');
        chips.classList.toggle('hidden', !meta.chips);
        heading.classList.toggle('hidden', !meta.chips);
        if (meta.chips) {
            const items = ['all', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            chips.innerHTML = items.map(n => {
                const key = `${mode}:${n}`;
                const s = Math.min(3, Number(progress.stars[key]) || 0);
                const label = n === 'all' ? t('drillAllTables') : String(n);
                const aria = n === 'all' ? t('drillAllTables') : t('drillTableLabel', { n });
                return `<button type="button" class="tm-chip${String(n) === String(table) ? ' selected' : ''}" data-table="${n}" aria-pressed="${String(n) === String(table)}" aria-label="${aria}">
                    <span class="tm-chip-n">${label}</span>
                    <span class="tm-chip-stars" aria-hidden="true">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>
                </button>`;
            }).join('');
        }

        const learnBtn = document.getElementById('btn-drill-learn');
        const learnHint = document.getElementById('drill-learn-hint');
        if (learnBtn && learnHint) {
            const specific = meta.chips && table !== 'all';
            learnBtn.textContent = mode === 'divide' ? t('learnBtnDivide') : specific ? t('learnBtnTable', { n: table }) : t('learnBtnAll');
            const isNew = specific && TableMasterLearn.isNewTable(progress.stars, mode, table);
            learnBtn.classList.toggle('tm-learn-link--new', isNew);
            learnHint.textContent = isNew ? t('learnNewTable') : '';
            learnHint.classList.toggle('hidden', !isNew);
        }

        const bestEl = document.getElementById('drill-best');
        if (mode === 'timed') {
            const best = Number(progress.best[`timed:${table}`]) || 0;
            bestEl.textContent = best > 0 ? '🏅 ' + t('drillBestTimed', { n: best }) : '';
        } else {
            bestEl.textContent = '';
        }
    },

    // Weighted pick of a (a,b) fact: facts you got wrong come up more often.
    _pickFact(table, avoidKey) {
        const progress = this._loadProgress();
        const pool = [];
        const aList = table === 'all' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [parseInt(table, 10)];
        aList.forEach(a => {
            for (let b = (table === 'all' ? 2 : 1); b <= 10; b++) {
                const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
                if (key === avoidKey && (aList.length > 1 || b !== a)) continue;
                const w = 1 + Math.min(Number(progress.facts[key]) || 0, 5) * 2;
                for (let i = 0; i < w; i++) pool.push({ a, b, key });
            }
        });
        const f = pool[Math.floor(Math.random() * pool.length)] || { a: 2, b: 2, key: '2x2' };
        // Randomise factor order (commutative)
        return Math.random() < 0.5 ? f : { a: f.b, b: f.a, key: f.key };
    },

    _makeDrillQuestion(mode, table, avoidKey) {
        const { a, b, key } = this._pickFact(table, avoidKey);
        const p = a * b;
        let type = mode;
        if (mode === 'mixed') type = 'table';
        if (mode === 'timed') type = ['table', 'divide', 'missing'][Math.floor(Math.random() * 3)];

        const tbl = table === 'all' ? a : parseInt(table, 10);
        if (type === 'table') return { text: `${a} × ${b} = ?`, answer: p, key, kind: 'mul', a, b, tbl };
        if (type === 'divide') return { text: `${p} ÷ ${a} = ?`, answer: b, key, kind: 'div', a, b, tbl };
        if (type === 'missing') {
            return Math.random() < 0.5
                ? { text: `${a} × ? = ${p}`, answer: b, key, kind: 'missing', k: a, x: b, tbl }
                : { text: `? × ${b} = ${p}`, answer: a, key, kind: 'missing', k: b, x: a, tbl };
        }
        // problems: a and b >= 2 so stories make sense
        const pa = Math.max(2, a === 1 ? 2 : a);
        const pb = Math.max(2, b === 1 ? 2 : b);
        const pp = pa * pb;
        const id = 1 + Math.floor(Math.random() * 6);
        const isMult = id === 1 || id === 2 || id === 5;
        return {
            text: TableMasterI18n.t('wp' + id, { a: pa, b: pb, p: pp }),
            answer: isMult ? pp : pa,
            key,
            story: true,
            // multiplication story: pa x pb = pp; sharing story: pp / pb = pa
            kind: isMult ? 'mul' : 'div', a: isMult ? pa : pb, b: isMult ? pb : pa, tbl,
        };
    },

    _startDrill(reviewOnly) {
        const mode = this._drillSel.mode;
        const meta = this._DRILL_META[mode];
        const table = this._drillSel.table;
        const prev = this._drill;
        const review = reviewOnly && prev && prev.wrong.length > 0;
        const queue = review ? prev.wrong.slice(0, 10).map(w => ({ ...w })) : null;

        this._drill = {
            mode, table, review,
            queue,
            total: review ? queue.length : meta.total,
            timed: mode === 'timed' && !review,
            idx: 0, correct: 0, asked: 0,
            streak: 0, bestStreak: 0, score: 0,
            wrong: [], wrongByTable: {},
            answer: '', locked: false, current: null, lastKey: null,
            startTs: Date.now(), timeLeft: this._TIMED_SECONDS,
            timerId: null, nextTimer: null, ended: false,
        };
        const d = this._drill;
        if (d.timed) {
            d.timerId = setInterval(() => {
                const qm = document.getElementById('tm-quit-modal');
                if (qm && !qm.classList.contains('hidden')) return; // paused while the quit dialog is open
                d.timeLeft--;
                this._renderDrillHud();
                if (d.timeLeft <= 0) this._endDrill();
            }, 1000);
        }
        this._showScreen('screen-drill');
        this._drillAskNext();
    },

    _drillAskNext() {
        const d = this._drill;
        if (!d || d.ended) return;
        d.answer = '';
        d.locked = false;
        d.current = d.review ? d.queue[d.idx] : this._makeDrillQuestion(d.mode, d.table, d.lastKey);
        d.lastKey = d.current.key;

        const q = document.getElementById('drill-question');
        const card = document.getElementById('drill-qcard');
        q.classList.toggle('tm-drill-q--story', !!d.current.story);
        q.innerHTML = '';
        if (d.current.story) {
            q.textContent = d.current.text;
        } else {
            d.current.text.split('?').forEach((part, i, arr) => {
                q.appendChild(document.createTextNode(part));
                if (i < arr.length - 1) {
                    const mark = document.createElement('span');
                    mark.className = 'tm-q-mark';
                    mark.textContent = '?';
                    q.appendChild(mark);
                }
            });
        }
        card.classList.remove('ok', 'bad');
        document.getElementById('drill-feedback').textContent = '';
        document.getElementById('drill-feedback').className = 'tm-drill-feedback';
        document.getElementById('drill-numpad').classList.remove('hidden');
        document.getElementById('drill-next').classList.add('hidden');
        document.getElementById('drill-learn')?.classList.add('hidden');
        this._renderDrillAnswer();
        this._renderDrillHud();
        if (typeof TMDyn !== 'undefined') TMDyn.onQuestion(this);
    },

    _renderDrillAnswer() {
        const el = document.getElementById('drill-answer');
        if (!el) return;
        el.textContent = this._drill && this._drill.answer ? this._drill.answer : ' ';
    },

    _renderDrillHud() {
        const d = this._drill;
        if (!d) return;
        const t = k => TableMasterI18n.t(k);
        const label = document.getElementById('drill-hud-label');
        const prog = document.getElementById('drill-hud-progress');
        const bar = document.getElementById('drill-bar-fill');
        if (d.timed) {
            label.textContent = t('drillTime');
            prog.textContent = `${Math.max(0, d.timeLeft)}${t('seconds')}`;
            prog.classList.toggle('tm-low-time', d.timeLeft <= 10);
            bar.style.width = `${Math.max(0, (d.timeLeft / this._TIMED_SECONDS) * 100)}%`;
        } else {
            label.textContent = t('drillProgress');
            prog.textContent = `${Math.min(d.idx + 1, d.total)}/${d.total}`;
            prog.classList.remove('tm-low-time');
            bar.style.width = `${(d.idx / d.total) * 100}%`;
        }
        document.getElementById('drill-hud-streak').textContent = `🔥 ${d.streak}`;
        document.getElementById('drill-hud-score').textContent = d.score;
        if (typeof TMDyn !== 'undefined') TMDyn.refresh();
    },

    _drillKey(key) {
        const d = this._drill;
        if (!d || d.ended) return;
        if (d.locked) {
            // After a wrong answer (non-timed) Enter / OK moves on
            if (key === 'ok' && !document.getElementById('drill-next').classList.contains('hidden')) this._drillNext();
            return;
        }
        if (key === 'del') {
            d.answer = d.answer.slice(0, -1);
        } else if (key === 'ok') {
            if (d.answer !== '') this._drillSubmit();
            return;
        } else if (d.answer.length < 3) {
            d.answer = (d.answer + key).replace(/^0+(?=\d)/, '');
        }
        this._renderDrillAnswer();
    },

    _drillSubmit() {
        const d = this._drill;
        const t = (k, o) => TableMasterI18n.t(k, o);
        const card = document.getElementById('drill-qcard');
        const fb = document.getElementById('drill-feedback');
        const progress = this._loadProgress();
        const cur = d.current;
        const isRight = parseInt(d.answer, 10) === cur.answer;
        d.locked = true;
        d.asked++;

        if (isRight) {
            d.correct++;
            d.streak++;
            d.bestStreak = Math.max(d.bestStreak, d.streak);
            d.score += 10 + Math.min(d.streak - 1, 5) * 2;
            progress.facts[cur.key] = Math.max(0, (Number(progress.facts[cur.key]) || 0) - 1);
            if (!progress.facts[cur.key]) delete progress.facts[cur.key];
            card.classList.add('ok');
            if (typeof TMDyn !== 'undefined') TMDyn.onResult(true);
            fb.className = 'tm-drill-feedback ok';
            fb.textContent = '✓ ' + (d.streak > 0 && d.streak % 5 === 0
                ? t('drillStreakMsg', { n: d.streak })
                : t('praise' + (1 + Math.floor(Math.random() * 4))));
            this._saveProgress(progress);
            this._renderDrillHud();
            d.nextTimer = setTimeout(() => this._drillNext(), 700);
        } else {
            d.streak = 0;
            d.wrong.push({ text: cur.text, answer: cur.answer, key: cur.key, story: !!cur.story,
                kind: cur.kind, a: cur.a, b: cur.b, k: cur.k, x: cur.x, tbl: cur.tbl });
            if (cur.tbl) d.wrongByTable[cur.tbl] = (d.wrongByTable[cur.tbl] || 0) + 1;
            progress.facts[cur.key] = (Number(progress.facts[cur.key]) || 0) + 1;
            this._saveProgress(progress);
            card.classList.add('bad');
            fb.className = 'tm-drill-feedback bad';
            // Explain WHY: the worked step (7 × 6 = 7 × 5 + 7 = 35 + 7 = 42) and, for ÷ and ?, the matching multiplication
            const ex = TableMasterLearn.explainWrong(cur);
            const line = (cls, txt) => { const s = document.createElement('div'); s.className = cls; s.textContent = txt; fb.appendChild(s); };
            fb.textContent = '';
            line('tm-fb-line', '✗ ' + t('drillAnswerWas', { n: cur.answer }) + '. ' + t('oops' + (1 + Math.floor(Math.random() * 3))));
            if (ex.key) line('tm-fb-line tm-fb-why', t(ex.key, ex.params));
            if (ex.worked) line('tm-fb-line tm-fb-worked', t('drillWhy') + ' ' + ex.worked);
            const suggest = !d.timed && cur.tbl && TableMasterLearn.shouldSuggestLearn(d.wrongByTable, cur.tbl);
            if (suggest) {
                line('tm-fb-line tm-fb-learn', t('learnStruggle', { n: cur.tbl }));
                const lb = document.getElementById('drill-learn');
                if (lb) { lb.textContent = t('learnBtnTable', { n: cur.tbl }); lb.classList.remove('hidden'); }
            }
            if (typeof TMDyn !== 'undefined') TMDyn.onResult(false);
            this._renderDrillHud();
            if (d.timed) {
                d.nextTimer = setTimeout(() => this._drillNext(), 2800);
            } else {
                document.getElementById('drill-numpad').classList.add('hidden');
                const nextBtn = document.getElementById('drill-next');
                nextBtn.classList.remove('hidden');
                nextBtn.focus();
            }
        }
    },

    _drillNext() {
        const d = this._drill;
        if (!d || d.ended) return;
        if (d.nextTimer) { clearTimeout(d.nextTimer); d.nextTimer = null; }
        d.idx++;
        if (!d.timed && d.idx >= d.total) {
            this._endDrill();
            return;
        }
        this._drillAskNext();
    },

    _stopDrillTimers() {
        const d = this._drill;
        if (!d) return;
        if (d.timerId) { clearInterval(d.timerId); d.timerId = null; }
        if (d.nextTimer) { clearTimeout(d.nextTimer); d.nextTimer = null; }
    },

    async _endDrill() {
        const d = this._drill;
        if (!d || d.ended) return;
        d.ended = true;
        this._stopDrillTimers();
        const t = (k, o) => TableMasterI18n.t(k, o);
        const meta = this._DRILL_META[d.mode];
        const elapsed = d.timed
            ? this._TIMED_SECONDS
            : Math.max(1, Math.round((Date.now() - d.startTs) / 1000));
        const asked = d.asked;
        const accuracy = asked > 0 ? Math.round((d.correct / asked) * 100) : 0;

        // Stars
        let stars;
        if (d.timed) stars = d.correct >= 15 ? 3 : d.correct >= 10 ? 2 : d.correct >= 5 ? 1 : 0;
        else stars = accuracy >= 100 ? 3 : accuracy >= 80 ? 2 : accuracy >= 60 ? 1 : 0;

        // Progress: stars + timed record (not for review rounds)
        const progress = this._loadProgress();
        let newStar = false;
        let newRecord = false;
        if (!d.review) {
            const key = `${d.mode}:${d.table}`;
            if (stars > (Number(progress.stars[key]) || 0)) {
                progress.stars[key] = stars;
                newStar = true;
            }
            if (d.timed && d.correct > (Number(progress.best[key]) || 0)) {
                progress.best[key] = d.correct;
                newRecord = d.correct > 0;
            }
            this._saveProgress(progress);
        }

        // Stats (same call shape as the step-by-step practice)
        const gameResult = {
            correctAnswers: d.correct,
            totalQuestions: asked,
            totalAttempts:  asked,
            bestStreak:     d.bestStreak,
            elapsedSeconds: elapsed,
            level:          meta.level,
            operation:      meta.op,
        };
        let pts = { points: 0, xp: 0 };
        if (typeof PlatformFirestore !== 'undefined' && asked > 0) {
            pts = PlatformFirestore.calculatePoints(gameResult);
        }
        const uid = this.state.currentUser && this.state.currentUser.uid;

        // Result screen
        const starsEl = document.getElementById('drill-stars');
        starsEl.innerHTML = [1, 2, 3].map(i =>
            `<span class="tm-big-star${i <= stars ? ' on' : ''}" style="animation-delay:${i * 0.18}s">★</span>`).join('');
        if (typeof TMDyn !== 'undefined') TMDyn.onEnd(stars);
        document.getElementById('drill-result-title').textContent = d.timed ? t('drillTimeUp') : t('drillResultTitle');
        const msg = [];
        if (d.timed) msg.push(t('drillTimedSolved', { n: d.correct }));
        else if (d.wrong.length === 0 && asked > 0) msg.push(t('drillPerfect'));
        else msg.push(accuracy >= 60 ? t('resultGood') : t('resultKeepTrying'));
        if (newRecord) msg.push(t('drillNewRecord'));
        else if (newStar) msg.push(t('drillNewStar'));
        document.getElementById('drill-result-msg').textContent = msg.join(' ');
        document.getElementById('drill-res-correct').textContent = `${d.correct}/${asked}`;
        document.getElementById('drill-res-score').textContent = d.score;
        document.getElementById('drill-res-streak').textContent = d.bestStreak;
        document.getElementById('drill-res-time').textContent = `${elapsed}${t('seconds')}`;
        document.getElementById('drill-res-points').textContent = `+${pts.points} pts`;
        document.getElementById('drill-res-xp').textContent = `+${pts.xp} XP`;

        const list = document.getElementById('drill-review-list');
        list.innerHTML = '';
        d.wrong.forEach(w => {
            const li = document.createElement('li');
            li.className = 'tm-drill-review-item';
            const q = document.createElement('span');
            q.className = 'tm-review-q';
            q.textContent = w.story ? '📚 ' + w.text : w.text.replace('?', String(w.answer));
            li.appendChild(q);
            if (w.story) {
                const a = document.createElement('strong');
                a.textContent = '= ' + w.answer;
                li.appendChild(a);
            }
            list.appendChild(li);
        });
        document.getElementById('drill-review').classList.toggle('hidden', d.wrong.length === 0);
        document.getElementById('btn-drill-review').classList.toggle('hidden', d.wrong.length === 0);

        if (accuracy >= 70 && asked > 0) this._launchConfetti();
        this._showScreen('screen-drill-result');

        if (uid && typeof PlatformFirestore !== 'undefined' && asked > 0) {
            try {
                await PlatformFirestore.updateGameStats(uid, 'tablemaster', gameResult);
            } catch (err) {
                console.warn('[TableMaster] Could not save stats:', err);
            }
        }
    },

    _refreshDrillTexts() {
        this._renderRankBar();
        if (this.state.currentScreen === 'screen-drill-select') this._renderDrillSelect();
        if (this._drill && this.state.currentScreen === 'screen-drill') this._renderDrillHud();
    },

    // ── Navegación de pantallas ───────────────────────────────────────────────

    _showScreen(id) {
        if (this.state.currentScreen === 'screen-drill' && id !== 'screen-drill' && this._drill && !this._drill.ended) {
            this._stopDrillTimers();
            this._drill.ended = true;
        }
        document.querySelectorAll('.tm-screen').forEach(s => {
            s.classList.remove('active');
            s.setAttribute('aria-hidden', 'true');
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active');
            target.removeAttribute('aria-hidden');
            // Focus management
            const first = target.querySelector(
                'button:not(:disabled), input:not(:disabled), [tabindex="0"]');
            if (id === 'screen-drill') {
                if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            } else if (first) {
                first.focus();
            }
        }
        this.state.currentScreen = id;
        if (id === 'screen-home') this._renderRankBar();
    },
};
