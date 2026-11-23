/**
 * TypeMaster - Game Logic
 * Character-by-character typing game with WPM measurement,
 * accuracy tracking, virtual keyboard, and Firebase stats.
 */

/* ── i18n ─────────────────────────────────────────────────── */
const I18N = {
    'es-ES': {
        gameTitle: 'TypeMaster',
        gameSubtitle: 'Aprende a escribir rápido',
        selectLevel: 'Elige el nivel',
        start: 'Empezar',
        wpm: 'PPM',
        accuracy: 'Precisión',
        time: 'Tiempo',
        progress: 'Progreso',
        restart: 'Reintentar',
        next: 'Siguiente nivel',
        results: '¡Resultado!',
        stars1: 'Bien hecho',
        stars2: '¡Muy bien!',
        stars3: '¡Perfecto!',
        errors: 'Errores',
        score: 'Puntos',
        newRecord: '🏆 ¡Nuevo récord!',
        menu: 'Menú',
        startTyping: 'Comienza a escribir...',
        quit: 'Salir',
        level: 'Nivel',
        stats: '📊 Estadísticas',
        achievements: '🏆 Logros',
        levelNames: [
            'Fila central', 'Palabras simples', 'Frases cortas', 'Mayúsculas',
            'Números', 'Acentos', 'Frases completas', 'Velocidad I', 'Velocidad II', 'Velocidad máxima'
        ],
        levelDescriptions: [
            'Teclado español. Fila central: A S D F G H J K L Ñ. Índice izquierdo en F, índice derecho en J.',
            'Escribe palabras simples con todas las letras (sin mayúsculas ni acentos)',
            'Practica frases cortas con signos de puntuación básicos',
            'Introduce el uso de mayúsculas con la tecla Shift',
            'Practica números y signos de puntuación (1-9, ., !, ?)',
            'Domina los acentos y la ñ (á, é, í, ó, ú, ñ)',
            'Frases completas con todos los caracteres',
            'Textos cortos — objetivo: 20 PPM',
            'Párrafos medianos — objetivo: 35 PPM',
            'Textos largos — objetivo: 50 PPM o más'
        ],
        keyboardHint: 'Teclado español: mano izquierda en A S D F — mano derecha en J K L Ñ. Los colores indican qué dedo usar.'
    },
    'en-US': {
        gameTitle: 'TypeMaster',
        gameSubtitle: 'Learn to type fast',
        selectLevel: 'Choose your level',
        start: 'Start',
        wpm: 'WPM',
        accuracy: 'Accuracy',
        time: 'Time',
        progress: 'Progress',
        restart: 'Try again',
        next: 'Next level',
        results: 'Results!',
        stars1: 'Good job',
        stars2: 'Very good!',
        stars3: 'Perfect!',
        errors: 'Errors',
        score: 'Score',
        newRecord: '🏆 New record!',
        menu: 'Menu',
        startTyping: 'Start typing...',
        quit: 'Quit',
        level: 'Level',
        stats: '📊 Stats',
        achievements: '🏆 Achievements',
        levelNames: [
            'Home row', 'Simple words', 'Short sentences', 'Capitals',
            'Numbers', 'Accents', 'Full sentences', 'Speed I', 'Speed II', 'Max speed'
        ],
        levelDescriptions: [
            'Spanish keyboard. Home row: A S D F G H J K L Ñ. Left index on F, right index on J.',
            'Type simple words using all letters (no capitals or accents)',
            'Practice short sentences with basic punctuation',
            'Introduce the use of capitals with the Shift key',
            'Practice numbers and punctuation (1-9, ., !, ?)',
            'Master accented letters and punctuation',
            'Complete sentences with all characters',
            'Short texts — target: 20 WPM',
            'Medium paragraphs — target: 35 WPM',
            'Long texts — target: 50+ WPM'
        ],
        keyboardHint: 'Spanish keyboard: left hand on A S D F — right hand on J K L Ñ. Colors show which finger to use.'
    },
    'eu-ES': {
        gameTitle: 'TypeMaster',
        gameSubtitle: 'Ikasi azkar idazten',
        selectLevel: 'Aukeratu maila',
        start: 'Hasi',
        wpm: 'KPM',
        accuracy: 'Zehaztasuna',
        time: 'Denbora',
        progress: 'Aurrerapena',
        restart: 'Berriz saiatu',
        next: 'Hurrengo maila',
        results: 'Emaitza!',
        stars1: 'Ondo egina',
        stars2: 'Oso ondo!',
        stars3: 'Perfektua!',
        errors: 'Akatsak',
        score: 'Puntuak',
        newRecord: '🏆 Errekor berria!',
        menu: 'Menua',
        startTyping: 'Hasi idazten...',
        quit: 'Irten',
        level: 'Maila',
        stats: '📊 Estatistikak',
        achievements: '🏆 Lorpenak',
        levelNames: [
            'Erdiko ilara', 'Hitz errazak', 'Esaldi laburrak', 'Letra larriak',
            'Zenbakiak', 'Azentoak', 'Esaldi osoak', 'Abiadura I', 'Abiadura II', 'Gehieneko abiadura'
        ],
        levelDescriptions: [
            'Gaztelaniako teklatua. Erdiko ilara: A S D F G H J K L Ñ. Ezkerreko erakuslea F-n, eskuinekoa J-n.',
            'Idatzi hitz errazak letra guztiekin (letra larririk edo azenturik gabe)',
            'Praktikatu esaldi laburrak oinarrizko puntuazioarekin',
            'Sartu letra larriak Shift teklarekin erabiliz',
            'Praktikatu zenbakiak eta puntuazioa (1-9, ., !, ?)',
            'Menperatu azentodun letrak eta bereizgarriak',
            'Esaldi osoak karaktere guztiekin',
            'Testu laburrak — helburua: 20 KPM',
            'Paragrafo ertainak — helburua: 35 KPM',
            'Testu luzeak — helburua: 50+ KPM'
        ],
        keyboardHint: 'Gaztelaniako teklatua: ezkerreko eskua A S D F-n — eskuinekoa J K L Ñ-n. Koloreen arabera zein hatz erabili.'
    }
};

/* ── Spanish keyboard layout QWERTY ES ────────────────────── *
 *  Row 2 (QWERTY): q w e r t y u i o p
 *  Row 3 (home):   a s d f g h j k l ñ
 *  Row 4 (bottom): < z x c v b n m , . -
 *
 *  Finger assignments (home row):
 *    Left  pinky  → a   Left  ring → s   Left  mid → d
 *    Left  index  → f g
 *    Right index  → j h
 *    Right mid    → k   Right ring → l   Right pinky → ñ
 * ──────────────────────────────────────────────────────────── */
const KEYBOARD_ROWS = TypingLesson.KEYBOARD_ROWS;

/* 0=left-pinky  1=left-ring  2=left-mid  3=left-idx
   4=right-idx   5=right-mid  6=right-ring  7=right-pinky  8=thumb */
const FINGER_MAP = TypingLesson.FINGER_MAP;

const FINGER_CLASSES = [
    'ty-finger-left-pinky','ty-finger-left-ring','ty-finger-left-mid','ty-finger-left-idx',
    'ty-finger-right-idx','ty-finger-right-mid','ty-finger-right-ring','ty-finger-right-pinky',
    'ty-finger-thumb'
];

/* ── Non-printable keys to ignore ─────────────────────────── */
const IGNORED_KEYS = new Set([
    'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
    'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Backspace', 'Delete', 'Enter', 'Home', 'End', 'PageUp', 'PageDown',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'Dead', 'Unidentified', 'ContextMenu', 'NumLock', 'ScrollLock',
    'PrintScreen', 'Pause', 'Insert'
]);

/* ── Main game object ─────────────────────────────────────── */
const MAX_LEVEL = 12;
const TY_LANGS = ['es-ES', 'en-US', 'eu-ES', 'gl-ES', 'ca-ES', 'fr-FR'];
const TY_LANG_LABELS = { 'es-ES': 'Español', 'en-US': 'English', 'eu-ES': 'Euskara', 'gl-ES': 'Galego', 'ca-ES': 'Català', 'fr-FR': 'Français' };

/* Merge the extra dictionaries (gl/ca/fr and the new levels) into I18N */
(function mergeExtraI18n() {
    if (typeof TYPING_I18N_EXTRA === 'undefined') return;
    Object.entries(TYPING_I18N_EXTRA).forEach(([code, ex]) => {
        const base = I18N[code] || (I18N[code] = {});
        Object.entries(ex).forEach(([k, v]) => {
            if (k === 'levelNamesExtra') base.levelNames = (base.levelNames || []).concat(v);
            else if (k === 'levelDescriptionsExtra') base.levelDescriptions = (base.levelDescriptions || []).concat(v);
            else base[k] = v;
        });
    });
})();

const TypeMasterGame = {

    state: {
        level: 1,
        lang: 'es-ES',
        text: '',
        chars: [],          // [{char, state}]  state: 'pending'|'correct'|'wrong'|'current'
        pos: 0,
        errors: 0,
        totalKeys: 0,
        correctKeys: 0,
        startTime: null,
        elapsed: 0,
        timerInterval: null,
        wpm: 0,
        accuracy: 100,
        gameStarted: false,
        gameOver: false,
        selectedLevel: null,
        age: 'child',       // kid (6-8) | child (9-12) | teen (13+)
        bestWpm: {}         // { 'level_1': 45, ... }
    },

    /* ── Init ────────────────────────────────────────────── */

    init() {
        this._loadSaved();
        this._detectLanguage();
        this._buildLevelGrid();
        this._bindEvents();
        this._updateStaticUI();
    },

    _loadSaved() {
        try {
            const age = localStorage.getItem('typemaster_age');
            if (['kid', 'child', 'teen'].includes(age)) this.state.age = age;
        } catch (e) { /* ignore */ }
        for (let i = 1; i <= MAX_LEVEL; i++) {
            const val = parseInt(localStorage.getItem(`typemaster_best_level_${i}`), 10);
            if (!isNaN(val) && val > 0) {
                this.state.bestWpm[`level_${i}`] = val;
            }
        }
    },

    _detectLanguage() {
        const candidates = [
            localStorage.getItem('games_hub_language'),
            typeof PlatformI18n !== 'undefined' ? PlatformI18n.currentLanguage : null,
            navigator.language
        ];
        for (const c of candidates) {
            if (!c) continue;
            if (TY_LANGS.includes(c)) { this.state.lang = c; return; }
            const hit = TY_LANGS.find(l => c.toLowerCase().startsWith(l.slice(0, 2)));
            if (hit) { this.state.lang = hit; return; }
        }
        this.state.lang = 'es-ES';
    },

    _t(key) {
        const dict = I18N[this.state.lang] || I18N['es-ES'];
        return dict[key] !== undefined ? dict[key] : (I18N['es-ES'][key] || key);
    },

    /* ── Static UI text ─────────────────────────────────── */

    _updateStaticUI() {
        this._setText('ty-game-title',    this._t('gameTitle'));
        this._setText('ty-game-subtitle', this._t('gameSubtitle'));
        this._setText('ty-section-title', this._t('selectLevel'));
        this._setText('ty-start-btn',     this._t('start'));
        this._setText('ty-stats-btn',     this._t('stats'));
        this._setText('ty-achievements-btn', this._t('achievements'));
        this._setText('ty-wpm-lbl',  this._t('wpm'));
        this._setText('ty-acc-lbl',  this._t('accuracy'));
        this._setText('ty-time-lbl', this._t('time'));
        this._setText('ty-quit-btn', this._t('quit'));
        this._setText('ty-input-hint', this._t('startTyping'));

        this._setText('ty-lang-info', TY_LANG_LABELS[this.state.lang] || this.state.lang);
        this._setText('ty-quit-title', this._t('quitTitle'));
        this._setText('ty-quit-msg', this._t('quitMsg'));
        this._setText('ty-quit-cancel', this._t('cancel'));
        this._setText('ty-quit-ok', this._t('quit'));
        this._setText('ty-kb-tip', this._t('kbTip'));
        this._setText('ty-lesson-btn', TypingLesson.text(this.state.lang, 'lessonReplay'));
        if (!this.state.selectedLevel) this._setText('ty-level-desc', this._t('levelPrompt'));
        this._buildAgeRow();

        this._buildLevelGrid();
    },

    _setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    /* ── Age profile ────────────────────────────────────── */

    _buildAgeRow() {
        const row = document.getElementById('ty-age-row');
        if (!row) return;
        const opts = [['kid', 'ageKid', 'ageHintKid'], ['child', 'ageChild', 'ageHintChild'], ['teen', 'ageTeen', 'ageHintTeen']];
        row.innerHTML = '<span class="ty-age-label" id="ty-age-label">' + this._t('ageLabel') + '</span>' +
            opts.map(([key, label]) =>
                '<button type="button" class="ty-age-btn' + (this.state.age === key ? ' selected' : '') + '" role="radio" aria-checked="' +
                (this.state.age === key) + '" data-age="' + key + '">' + this._t(label) + '</button>').join('');
        row.querySelectorAll('.ty-age-btn').forEach(btn => btn.addEventListener('click', () => {
            this.state.age = btn.dataset.age;
            try { localStorage.setItem('typemaster_age', this.state.age); } catch (e) { /* ignore */ }
            this._buildAgeRow();
        }));
        const hint = opts.find(o => o[0] === this.state.age);
        this._setText('ty-age-hint', hint ? this._t(hint[2]) : '');
    },

    /* ── Level grid ─────────────────────────────────────── */

    _buildLevelGrid() {
        const grid = document.getElementById('ty-level-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const names = this._t('levelNames');

        for (let i = 1; i <= MAX_LEVEL; i++) {
            const btn = document.createElement('button');
            btn.className = 'ty-level-btn';
            btn.textContent = String(i);
            btn.setAttribute('aria-label', `${this._t('level')} ${i}: ${names[i - 1]}`);
            btn.dataset.level = i;

            if (this.state.bestWpm[`level_${i}`]) btn.classList.add('completed');

            const isLocked = i > 1 && !this.state.bestWpm[`level_${i - 1}`];
            if (isLocked) {
                btn.classList.add('locked');
                btn.setAttribute('aria-disabled', 'true');
                btn.setAttribute('title', this._t('locked'));
            }

            btn.addEventListener('click', () => {
                if (!btn.classList.contains('locked')) this._selectLevel(i);
            });
            grid.appendChild(btn);
        }
    },

    _selectLevel(level) {
        this.state.selectedLevel = level;

        document.querySelectorAll('.ty-level-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.level, 10) === level) btn.classList.add('selected');
        });

        // Description
        const descEl = document.getElementById('ty-level-desc');
        if (descEl) {
            const names = this._t('levelNames');
            const descs = this._t('levelDescriptions');
            descEl.innerHTML =
                `<div class="ty-level-name">${names[level - 1]}</div>` +
                `<div>${descs[level - 1]}</div>`;
        }

        // Keyboard hint only for level 1
        const hintEl = document.getElementById('ty-home-kb-hint');
        if (hintEl) {
            if (level === 1) {
                hintEl.textContent = this._t('keyboardHint');
                hintEl.classList.remove('hidden');
            } else {
                hintEl.classList.add('hidden');
            }
        }

        // Best WPM
        const bestEl = document.getElementById('ty-best-wpm');
        if (bestEl) {
            const best = this.state.bestWpm[`level_${level}`];
            if (best) {
                bestEl.innerHTML = `${this._t('best')}: <span>${best} ${this._t('wpm')}</span>`;
                bestEl.style.display = 'block';
            } else {
                bestEl.style.display = 'none';
            }
        }

        const startBtn = document.getElementById('ty-start-btn');
        if (startBtn) startBtn.disabled = false;
    },

    /* ── Event binding ──────────────────────────────────── */

    _boundKeydown: null,

    _bindEvents() {
        const on = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn.bind(this));
        };

        on('ty-start-btn', () => {
            if (this.state.selectedLevel) this._startLevel(this.state.selectedLevel);
        });
        on('ty-quit-btn',   () => this._quitGame());
        on('ty-lesson-btn', () => {
            const lvl = this.state.selectedLevel || 1;
            this._openLesson(TypingLesson.groupForLevel(lvl), lvl);
        });
        on('ty-lesson-skip',  () => this._lessonFinish());
        on('ty-lesson-start', () => this._lessonFinish());
        on('ty-lesson-try',   () => this._lessonStartDrill());
        on('ty-retry-btn',  () => this._startLevel(this.state.level));
        on('ty-next-btn',   () => {
            const next = Math.min(this.state.level + 1, MAX_LEVEL);
            this._startLevel(next);
        });
        on('ty-menu-btn',   () => this._showHome());
        on('ty-stats-btn',  () => { window.location.href = '../platform/achievements.html'; });
        on('ty-achievements-btn', () => { window.location.href = '../platform/achievements.html'; });

        document.addEventListener('platformLanguageChanged', () => {
            this._detectLanguage();
            this._updateStaticUI();
            const ls = document.getElementById('ty-lesson');
            if (this._lesson && ls && ls.classList.contains('active')) this._renderLesson();
        });
    },

    _attachKeydown() {
        this._detachKeydown();
        this._boundKeydown = (e) => {
            if (e.key === 'Escape') {
                const qm = document.getElementById('ty-quit-modal');
                if (!qm || qm.classList.contains('hidden')) this._quitGame();
                return;
            }
            this._handleKeypress(e);
        };
        document.addEventListener('keydown', this._boundKeydown);

        // Mobile keyboard support via hidden input
        const mobileInput = document.getElementById('ty-mobile-input');
        if (mobileInput) {
            mobileInput.value = '';
            setTimeout(() => mobileInput.focus(), 100);
            this._mobileInputBound = () => {
                const val = mobileInput.value;
                if (!val) return;
                const key = val[val.length - 1];
                mobileInput.value = '';
                this._handleKeypress({ key, preventDefault: () => {} });
            };
            mobileInput.addEventListener('input', this._mobileInputBound);

            this._mobileKeydownBound = (e) => {
                if (e.key === 'Backspace') {
                    this._handleKeypress({ key: 'Backspace', preventDefault: () => {} });
                }
            };
            mobileInput.addEventListener('keydown', this._mobileKeydownBound);
        }
    },

    _detachKeydown() {
        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown);
            this._boundKeydown = null;
        }
        const mobileInput = document.getElementById('ty-mobile-input');
        if (mobileInput) {
            if (this._mobileInputBound) {
                mobileInput.removeEventListener('input', this._mobileInputBound);
                this._mobileInputBound = null;
            }
            if (this._mobileKeydownBound) {
                mobileInput.removeEventListener('keydown', this._mobileKeydownBound);
                this._mobileKeydownBound = null;
            }
        }
    },

    /* ── Keyboard lesson (before a new key group) ───────── */

    _lesson: null,   // { group, level, seq, step, drilling, done }

    _lessonSeen(id) {
        try { return localStorage.getItem('typemaster_lesson_' + id) === '1'; } catch (e) { return false; }
    },
    _markLessonSeen(id) {
        try { localStorage.setItem('typemaster_lesson_' + id, '1'); } catch (e) { /* ignore */ }
    },
    _lt(key, vars) { return TypingLesson.text(this.state.lang, key, vars); },

    _openLesson(group, level) {
        this._stopTimer();
        this._detachKeydown();
        this._detachLessonKeys();
        this._lesson = { group, level, seq: [], step: 0, drilling: false, done: false };
        this._renderLesson();
        this._showScreen('ty-lesson');
    },

    _el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    },

    /** Builds the lesson: coloured keyboard, hands diagram, drill panel. All text through textContent. */
    _renderLesson() {
        const L = this._lesson; if (!L) return;
        const lang = this.state.lang, group = L.group;
        const groupKey = { home: 'groupHome', letters: 'groupLetters', numbers: 'groupNumbers' }[group.id];
        const descKey = { home: 'descHome', letters: 'descLetters', numbers: 'descNumbers' }[group.id];
        this._setText('ty-lesson-title', this._lt('lessonTitle') + ': ' + this._lt(groupKey));
        this._setText('ty-lesson-desc', this._lt(descKey));
        this._setText('ty-lesson-keys-title', this._lt('lessonKeysTitle'));
        this._setText('ty-lesson-hands-title', this._lt('lessonHandsTitle'));
        this._setText('ty-lesson-tap', this._lt('lessonTap'));
        this._setText('ty-lesson-skip', this._lt('lessonSkip'));
        this._setText('ty-lesson-try', this._lt('lessonTry'));
        this._setText('ty-lesson-start', this._lt('lessonStart'));
        this._setText('ty-drill-title', this._lt('lessonDrillTitle'));
        this._setText('ty-drill-intro', this._lt('lessonDrillIntro'));

        // On-screen keyboard: each key has its finger colour; keys of this group are bright
        const kb = document.getElementById('ty-lesson-kb');
        kb.textContent = '';
        KEYBOARD_ROWS.forEach(row => {
            const r = this._el('div', 'ty-kb-row');
            row.forEach(key => {
                const k = this._el('div', 'ty-key ' + FINGER_CLASSES[FINGER_MAP[key]] + (group.keys.includes(key) || key === ' ' ? '' : ' dim') + (key === ' ' ? ' space' : ''), TypingLesson.keyLabel(key));
                k.dataset.key = key;
                r.appendChild(k);
            });
            kb.appendChild(r);
        });

        // Hands: one row per hand, one tappable bar per finger
        const hands = document.getElementById('ty-lesson-hands');
        hands.textContent = '';
        [['leftHand', [0, 1, 2, 3]], ['rightHand', [4, 5, 6, 7]]].forEach(([labelKey, fingers]) => {
            const hand = this._el('div', 'ty-hand');
            hand.appendChild(this._el('div', 'ty-hand-label', this._lt(labelKey)));
            const bars = this._el('div', 'ty-hand-bars');
            fingers.forEach(fi => {
                const b = this._el('button', 'ty-fbar');
                b.type = 'button';
                b.dataset.finger = fi;
                b.style.setProperty('--fc', TypingLesson.FINGER_COLORS[fi]);
                b.appendChild(this._el('span', 'ty-fbar-keys', TypingLesson.keysOfFinger(group, fi).map(k => k.toUpperCase()).join(' ') || '·'));
                b.appendChild(this._el('span', 'ty-fbar-name', TypingLesson.fingerName(lang, fi)));
                b.addEventListener('click', () => this._lessonSelectFinger(fi));
                bars.appendChild(b);
            });
            hand.appendChild(bars);
            hands.appendChild(hand);
        });
        const th = this._el('button', 'ty-fbar ty-fbar-thumb');
        th.type = 'button'; th.dataset.finger = 8;
        th.style.setProperty('--fc', TypingLesson.FINGER_COLORS[8]);
        th.appendChild(this._el('span', 'ty-fbar-name', this._lt('thumbLabel')));
        th.addEventListener('click', () => this._lessonSelectFinger(8));
        hands.appendChild(th);

        // Drill panel / buttons depending on the step
        document.getElementById('ty-drill').classList.toggle('hidden', !L.drilling && !L.done);
        document.getElementById('ty-lesson-try').classList.toggle('hidden', L.drilling || L.done);
        document.getElementById('ty-lesson-start').classList.toggle('hidden', !L.done);
        this._setText('ty-lesson-info', '');
        if (L.drilling && !L.done) this._lessonShowTarget();
        if (L.done) this._setText('ty-drill-msg', this._lt('lessonDone'));
    },

    _lessonSelectFinger(fi) {
        const group = this._lesson.group;
        document.querySelectorAll('#ty-lesson-hands .ty-fbar').forEach(b => b.classList.toggle('selected', Number(b.dataset.finger) === fi));
        const keys = fi === 8 ? ['ESP'] : TypingLesson.keysOfFinger(group, fi).map(k => k.toUpperCase());
        document.querySelectorAll('#ty-lesson-kb .ty-key').forEach(k => {
            k.classList.toggle('current-key', FINGER_MAP[k.dataset.key] === fi);
        });
        this._setText('ty-lesson-info', this._lt('fingerKeys', { finger: TypingLesson.fingerName(this.state.lang, fi), keys: keys.join(' ') || '·' }));
    },

    _lessonStartDrill() {
        const L = this._lesson; if (!L) return;
        L.seq = TypingLesson.drillSequence(L.group);
        L.step = 0; L.drilling = true; L.done = false;
        this._renderLesson();
        this._attachLessonKeys();
    },

    _lessonShowTarget() {
        const L = this._lesson, key = L.seq[L.step], fi = FINGER_MAP[key];
        this._setText('ty-drill-key', TypingLesson.keyLabel(key));
        document.getElementById('ty-drill-key').style.setProperty('--fc', TypingLesson.FINGER_COLORS[fi]);
        this._setText('ty-drill-progress', this._lt('lessonDrillProgress', { n: L.step + 1, m: L.seq.length }));
        this._setText('ty-drill-msg', this._lt('lessonDrillNow', { k: TypingLesson.keyLabel(key), finger: TypingLesson.fingerName(this.state.lang, fi) }));
        document.querySelectorAll('#ty-lesson-kb .ty-key').forEach(k => k.classList.toggle('current-key', k.dataset.key === key));
        document.querySelectorAll('#ty-lesson-hands .ty-fbar').forEach(b => b.classList.toggle('selected', Number(b.dataset.finger) === fi));
    },

    /** A key pressed during the guided drill: no timer, no errors counted, always explained. */
    _lessonKey(ch) {
        const L = this._lesson;
        if (!L || !L.drilling || L.done) return;
        const expected = L.seq[L.step];
        if (String(ch).toLowerCase() === expected) {
            L.step++;
            if (L.step >= L.seq.length) {
                L.drilling = false; L.done = true;
                this._detachLessonKeys();
                this._renderLesson();
                const st = document.getElementById('ty-lesson-start'); if (st) st.focus();
            } else {
                this._lessonShowTarget();
            }
        } else {
            this._setText('ty-drill-msg', TypingLesson.explainWrong(this.state.lang, expected, ch));
            const kEl = document.getElementById('ty-drill-key');
            if (kEl) { kEl.classList.remove('ty-shake'); void kEl.offsetWidth; kEl.classList.add('ty-shake'); }
        }
    },

    _attachLessonKeys() {
        this._detachLessonKeys();
        this._lessonKeydown = (e) => {
            if (e.key === 'Escape') { this._showHome(); return; }
            if (e.ctrlKey || e.metaKey || e.altKey || IGNORED_KEYS.has(e.key) || e.key.length !== 1) return;
            if (e.key === ' ') e.preventDefault();
            this._lessonKey(e.key);
        };
        document.addEventListener('keydown', this._lessonKeydown);
        const mi = document.getElementById('ty-mobile-input');
        if (mi) {
            mi.value = '';
            this._lessonInput = () => { const v = mi.value; mi.value = ''; if (v) this._lessonKey(v[v.length - 1]); };
            mi.addEventListener('input', this._lessonInput);
            setTimeout(() => { try { mi.focus(); } catch (e) { /* ignore */ } }, 100);
        }
    },

    _detachLessonKeys() {
        if (this._lessonKeydown) { document.removeEventListener('keydown', this._lessonKeydown); this._lessonKeydown = null; }
        const mi = document.getElementById('ty-mobile-input');
        if (mi && this._lessonInput) { mi.removeEventListener('input', this._lessonInput); this._lessonInput = null; }
    },

    /** Lesson done or skipped: remember it and start the timed level. */
    _lessonFinish() {
        const L = this._lesson; if (!L) return;
        this._markLessonSeen(L.group.id);
        const level = L.level;
        this._detachLessonKeys();
        this._lesson = null;
        this._beginLevel(level);
    },

    /* ── Screen navigation ──────────────────────────────── */

    _showScreen(id) {
        document.querySelectorAll('.ty-screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('active');
            window.scrollTo(0, 0); // top of the page, not under the sticky header
            // Move focus to the new screen for screen reader announcement
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: true });
        }
    },

    _showHome() {
        this._stopTimer();
        this._detachKeydown();
        this._detachLessonKeys();
        this._lesson = null;
        this.state.gameStarted = false;
        this.state.gameOver    = false;
        this._buildLevelGrid();
        this._showScreen('ty-home');
    },

    /* ── Start level ─────────────────────────────────────── */

    /** Entry point for every level start: a new key group gets its keyboard lesson first. */
    _startLevel(level) {
        const group = TypingLesson.lessonForLevel(level, id => this._lessonSeen(id));
        if (group) { this._openLesson(group, level); return; }
        this._beginLevel(level);
    },

    _beginLevel(level) {
        this._stopTimer();
        this._detachLessonKeys();
        this._lesson = null;

        Object.assign(this.state, {
            level,
            pos: 0, errors: 0, totalKeys: 0, correctKeys: 0,
            startTime: null, elapsed: 0, wpm: 0, accuracy: 100,
            gameStarted: false, gameOver: false
        });

        const text = this._pickText(level);
        this.state.text  = text;
        this.state.chars = Array.from(text).map(ch => ({ char: ch, state: 'pending' }));
        if (this.state.chars.length > 0) this.state.chars[0].state = 'current';

        this._setText('ty-level-badge',
            `${this._t('level')} ${level} — ${this._t('levelNames')[level - 1]}`);
        this._setText('ty-wpm-val',  '0');
        this._setText('ty-acc-val',  '100%');
        this._setText('ty-time-val', '0:00');
        this._setText('ty-input-hint', this._t('startTyping'));
        this._setText('ty-finger-tip', '');

        const bar = document.getElementById('ty-progress');
        if (bar) bar.style.width = '0%';

        // Virtual keyboard: levels 1-3 only
        const kbWrap = document.getElementById('ty-keyboard-wrap');
        if (kbWrap) {
            if (level <= 3) {
                kbWrap.classList.remove('hidden');
                this._buildKeyboard();
            } else {
                kbWrap.classList.add('hidden');
            }
        }

        this._renderText();
        this._showScreen('ty-game');
        this._attachKeydown();

        if (level <= 3 && this.state.chars.length > 0) {
            this._renderKeyboard(this.state.chars[0].char);
        }
        if (typeof TyDyn !== 'undefined') TyDyn.onBegin();
    },

    _pickText(level) {
        const data = TYPING_TEXTS[level];
        const extra = (typeof TYPING_EXTRA !== 'undefined' && TYPING_EXTRA[level]) || {};
        const kid = (typeof TYPING_KID !== 'undefined' && TYPING_KID[level]) || {};
        const lang = this.state.lang;
        if (!data && !extra.all && !extra[lang]) return 'Error: nivel no encontrado.';

        let pool;
        if (level === 1) {
            pool = (data && data.all) || [];
        } else if (extra.all) {
            pool = extra.all.slice();
        } else {
            const base = data ? (data[lang] || (extra[lang] ? [] : data['es-ES'])) : [];
            pool = (base || []).concat(extra[lang] || []);
        }

        // Age profile: 6-8 favours short texts, 13+ favours long ones
        if (level > 1 && level < 11) {
            const age = this.state.age;
            if (age === 'kid') {
                const short = pool.filter(t => t.length <= 46);
                pool = (kid[lang] || []).concat(short);
            } else if (age === 'teen') {
                const long = pool.filter(t => t.length >= 55);
                if (long.length) pool = long;
            }
        }
        if (!pool || !pool.length) pool = (data && (data[lang] || data['es-ES'])) || (extra[lang] || []);
        if (!pool || !pool.length) return 'Error: sin textos.';
        return pool[Math.floor(Math.random() * pool.length)];
    },

    /* ── Keypress handler ───────────────────────────────── */

    _handleKeypress(e) {
        if (this.state.gameOver) return;
        if (IGNORED_KEYS.has(e.key)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const current = this.state.chars[this.state.pos];
        if (!current) return;

        // Prevent spacebar scroll
        if (e.key === ' ') e.preventDefault();

        // Start timer on first keypress
        if (!this.state.gameStarted) {
            this.state.gameStarted = true;
            this.state.startTime   = Date.now();
            this._startTimer();
            this._setText('ty-input-hint', '');
        }

        this.state.totalKeys++;

        if (e.key === current.char) {
            current.state = 'correct';
            this.state.correctKeys++;
            this._setText('ty-finger-tip', '');
        } else {
            current.state = 'wrong';
            this.state.errors++;
            // Explain the right finger for the key that was expected
            this._setText('ty-finger-tip', TypingLesson.explainWrong(this.state.lang, current.char, e.key));
        }

        this.state.pos++;
        if (this.state.pos < this.state.chars.length) {
            this.state.chars[this.state.pos].state = 'current';
        }

        // Accuracy
        this.state.accuracy = Math.round((this.state.correctKeys / this.state.totalKeys) * 100);

        // Live WPM
        if (this.state.startTime) {
            const sec = (Date.now() - this.state.startTime) / 1000;
            if (sec >= 2) this.state.wpm = this._calcWpm(this.state.correctKeys, sec);
        }

        this._renderText();
        this._updateHud();

        const pct = Math.round((this.state.pos / this.state.chars.length) * 100);
        const bar = document.getElementById('ty-progress');
        if (bar) bar.style.width = `${pct}%`;
        if (typeof TyDyn !== 'undefined') TyDyn.onKey(current.state === 'correct', current.char);

        if (this.state.level <= 3 && this.state.pos < this.state.chars.length) {
            this._renderKeyboard(this.state.chars[this.state.pos].char);
        }

        if (this.state.pos >= this.state.chars.length) this._finishGame();
    },

    /* ── WPM ─────────────────────────────────────────────── */

    _calcWpm(correctChars, elapsedSeconds) {
        if (elapsedSeconds < 0.5) return 0;
        return Math.round((correctChars / 5) / (elapsedSeconds / 60));
    },

    /* ── Timer ───────────────────────────────────────────── */

    _startTimer() {
        this._stopTimer();
        this.state.timerInterval = setInterval(() => {
            if (!this.state.startTime || this.state.gameOver) return;
            this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
            this._renderTimer();
        }, 300);
    },

    _stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    _renderTimer() {
        const s  = this.state.elapsed;
        const mm = String(Math.floor(s / 60));
        const ss = String(s % 60).padStart(2, '0');
        this._setText('ty-time-val', `${mm}:${ss}`);
    },

    /* ── HUD ─────────────────────────────────────────────── */

    _updateHud() {
        this._setText('ty-wpm-val', String(this.state.wpm));
        this._setText('ty-acc-val', `${this.state.accuracy}%`);
        this._renderTimer();
    },

    /* ── Text rendering ──────────────────────────────────── */

    _renderText() {
        const area = document.getElementById('ty-text-display');
        if (!area) return;

        const frag = document.createDocumentFragment();
        this.state.chars.forEach((ch, idx) => {
            const span = document.createElement('span');
            span.className = `ty-char ${ch.state}`;
            if (ch.char === ' ') {
                span.textContent = '\u00A0';
                span.classList.add('ty-space');
            } else {
                span.textContent = ch.char;
            }
            span.dataset.idx = idx;
            frag.appendChild(span);
        });

        area.innerHTML = '';
        area.appendChild(frag);

        const curSpan = area.querySelector('.ty-char.current');
        if (curSpan) {
            const aRect = area.getBoundingClientRect();
            const sRect = curSpan.getBoundingClientRect();
            if (sRect.bottom > aRect.bottom - 8 || sRect.top < aRect.top + 8) {
                curSpan.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    },

    /* ── Virtual keyboard ────────────────────────────────── */

    _buildKeyboard() {
        const wrap = document.getElementById('ty-keyboard-wrap');
        if (!wrap) return;
        wrap.innerHTML = '';

        // Spanish keyboard labels
        const KEY_LABELS = { 'ñ': 'Ñ', '<': '<>', ',': ',', '.': '.', '-': '-', ' ': 'ESP' };

        KEYBOARD_ROWS.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'ty-kb-row';
            row.forEach(key => {
                const keyEl = document.createElement('div');
                keyEl.className = 'ty-key';
                const fi = FINGER_MAP[key];
                if (fi !== undefined) keyEl.classList.add(FINGER_CLASSES[fi]);
                if (key === ' ') keyEl.classList.add('space');
                keyEl.textContent = KEY_LABELS[key] || key.toUpperCase();
                keyEl.dataset.key = key;
                rowEl.appendChild(keyEl);
            });
            wrap.appendChild(rowEl);
        });
    },

    _renderKeyboard(targetChar) {
        const wrap = document.getElementById('ty-keyboard-wrap');
        if (!wrap || wrap.classList.contains('hidden')) return;
        wrap.querySelectorAll('.ty-key').forEach(k => k.classList.remove('current-key'));
        if (!targetChar) return;
        const lower = targetChar.toLowerCase();
        wrap.querySelectorAll('.ty-key').forEach(k => {
            if (k.dataset.key === lower) k.classList.add('current-key');
        });
    },

    /* ── Score ───────────────────────────────────────────── */

    _calculateScore(wpm, accuracy, level) {
        const base      = wpm * 5;
        const accBonus  = accuracy >= 98 ? 100 : accuracy >= 95 ? 70 : accuracy >= 90 ? 40 : 0;
        const levelMult = 1 + (level - 1) * 0.2;
        return Math.round((base + accBonus) * levelMult);
    },

    _calcStars(wpm, accuracy, level) {
        const targetWpm = Math.min(level * 5 + 10, 60);
        if (accuracy >= 95 && wpm >= targetWpm) return 3;
        if (accuracy >= 85) return 2;
        return 1;
    },

    /* ── Finish ──────────────────────────────────────────── */

    _finishGame() {
        this.state.gameOver = true;
        this._stopTimer();
        this._detachKeydown();

        const elapsed = this.state.startTime
            ? (Date.now() - this.state.startTime) / 1000 : 1;
        this.state.elapsed = Math.round(elapsed);

        const finalWpm = this._calcWpm(this.state.correctKeys, elapsed);
        const finalAcc = this.state.accuracy;
        const stars    = this._calcStars(finalWpm, finalAcc, this.state.level);
        const score    = this._calculateScore(finalWpm, finalAcc, this.state.level);

        const bestKey  = `level_${this.state.level}`;
        const prevBest = this.state.bestWpm[bestKey] || 0;
        const isNewRecord = finalWpm > prevBest;
        if (isNewRecord && finalWpm > 0) {
            this.state.bestWpm[bestKey] = finalWpm;
            localStorage.setItem(`typemaster_best_level_${this.state.level}`, String(finalWpm));
        }

        const unlocked   = this._checkAchievements(finalWpm, finalAcc, this.state.level);
        const gameResult = {
            level:           this.state.level,
            wpm:             finalWpm,
            accuracy:        finalAcc,
            elapsedSeconds:  this.state.elapsed,
            errors:          this.state.errors,
            totalKeys:       this.state.totalKeys,
            correctKeys:     this.state.correctKeys,
            stars,
            score,
            correctAnswers:  this.state.correctKeys,
            totalQuestions:  Math.max(1, this.state.totalKeys),
            totalAttempts:   Math.max(1, this.state.totalKeys),
            bestStreak:      0,
            operation:       'typing',
            unlockedAchievements: unlocked
        };

        this._saveStats(gameResult);
        this._showResults({ finalWpm, finalAcc, stars, score, elapsed: this.state.elapsed, isNewRecord, unlocked });
    },

    /* ── Achievements ────────────────────────────────────── */

    _checkAchievements(wpm, accuracy, level) {
        const newly = [];
        const check = (id) => {
            if (!localStorage.getItem(`typemaster_ach_${id}`)) {
                localStorage.setItem(`typemaster_ach_${id}`, '1');
                newly.push(id);
                if (typeof PlatformFirestore !== 'undefined' &&
                    typeof PlatformAuth      !== 'undefined' && PlatformAuth.currentUser) {
                    PlatformFirestore.unlockAchievement(
                        PlatformAuth.currentUser.uid, 'typingMaster', id
                    ).catch(() => {});
                }
            }
        };
        check('ty_first');
        if (wpm      >= 20)  check('ty_wpm20');
        if (wpm      >= 40)  check('ty_wpm40');
        if (wpm      >= 60)  check('ty_wpm60');
        if (accuracy === 100) check('ty_perfect');
        if (level    >= 10)  check('ty_level10');
        return newly;
    },

    /* ── Firebase save ───────────────────────────────────── */

    async _saveStats(gameResult) {
        try {
            if (typeof PlatformAuth      !== 'undefined' &&
                typeof PlatformFirestore !== 'undefined') {
                const user = PlatformAuth.currentUser;
                if (user) {
                    await PlatformFirestore.updateGameStats(user.uid, 'typingMaster', gameResult);
                }
            }
        } catch (err) {
            console.warn('TypeMaster: could not save stats', err);
        }
    },

    /* ── Results screen ──────────────────────────────────── */

    _showResults({ finalWpm, finalAcc, stars, score, elapsed, isNewRecord, unlocked }) {
        this._setText('ty-result-title', this._t('results'));
        this._setText('ty-stars', '⭐'.repeat(stars) + '☆'.repeat(3 - stars));
        if (typeof TyDyn !== 'undefined') TyDyn.onResults(stars);
        this._setText('ty-final-wpm', String(finalWpm));
        this._setText('ty-final-wpm-lbl', this._t('wpm'));
        this._setText('ty-final-acc', `${finalAcc}%`);

        const mm = Math.floor(elapsed / 60);
        const ss = String(elapsed % 60).padStart(2, '0');
        this._setText('ty-final-time', `${mm}:${ss}`);
        this._setText('ty-final-score', String(score));
        this._setText('ty-final-errors', String(this.state.errors));

        this._setText('ty-result-acc-lbl',   this._t('accuracy'));
        this._setText('ty-result-time-lbl',  this._t('time'));
        this._setText('ty-result-score-lbl', this._t('score'));
        this._setText('ty-result-err-lbl',   this._t('errors'));

        const recEl = document.getElementById('ty-new-record');
        if (recEl) {
            if (isNewRecord && finalWpm > 0) {
                recEl.textContent = this._t('newRecord');
                recEl.classList.remove('hidden');
            } else {
                recEl.classList.add('hidden');
            }
        }

        const achEl = document.getElementById('ty-achievements-unlocked');
        if (achEl) {
            if (unlocked.length > 0) {
                const LABELS = {
                    ty_first:   `⌨️ ${this._t('achFirst')}`,
                    ty_wpm20:   `🚀 20 ${this._t('wpm')}`,
                    ty_wpm40:   `⚡ 40 ${this._t('wpm')}`,
                    ty_wpm60:   `🔥 60 ${this._t('wpm')}`,
                    ty_perfect: `✨ 100% ${this._t('accuracy')}`,
                    ty_level10: `👑 ${this._t('level')} 10`
                };
                achEl.innerHTML = unlocked.map(id =>
                    `<span class="ty-achievement-badge">${LABELS[id] || id}</span>`
                ).join('');
                achEl.classList.remove('hidden');
            } else {
                achEl.classList.add('hidden');
            }
        }

        this._setText('ty-retry-btn', this._t('restart'));
        this._setText('ty-menu-btn',  this._t('menu'));

        const nextBtn = document.getElementById('ty-next-btn');
        if (nextBtn) {
            nextBtn.textContent   = this._t('next');
            nextBtn.style.display = this.state.level < MAX_LEVEL ? '' : 'none';
        }

        this._showScreen('ty-result');
    },

    /* ── Quit ─────────────────────────────────────────────── */

    _quitGame() {
        const gameIsActive = this.state.gameStarted && !this.state.gameOver && this.state.startTime;
        if (gameIsActive) {
            this._showQuitConfirm();
        } else {
            this._doQuit();
        }
    },

    _showQuitConfirm() {
        const modal = document.getElementById('ty-quit-modal');
        if (!modal) { this._doQuit(); return; }
        const trigger = document.activeElement;
        modal.classList.remove('hidden');
        const cancelBtn = document.getElementById('ty-quit-cancel');
        const okBtn     = document.getElementById('ty-quit-ok');
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
        cancelBtn?.addEventListener('click', close, { once: true });
        okBtn?.addEventListener('click', () => { close(); this._doQuit(); }, { once: true });
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });
    },

    _doQuit() {
        this._stopTimer();
        this._detachKeydown();
        this.state.gameOver = true;
        this._showHome();
    }
};
