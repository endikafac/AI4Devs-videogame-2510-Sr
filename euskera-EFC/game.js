/**
 * euskera-EFC/game.js
 * EuskeraGame — Nor-Nori-Nork interactive exercises + Vocabulary mode
 * Level types: mcq (L1,L2) | fill-blank (L3) | listening (L4)
 * Modes: grammar | vocabulary
 */
const EuskeraGame = (() => {

    // ── State ──────────────────────────────────────────────────────────
    const state = {
        level: 1,
        exerciseIndex: 0,
        score: 0,
        correct: 0,
        totalAnswered: 0,
        streak: 0,
        bestStreak: 0,
        startTime: 0,
        answered: false,
        currentExercises: [],
        passageQIndex: 0,
        passageIndex: 0,
        // vocabulary quiz state
        vocabMode: false,
        vocabTopicId: null,
        vocabQuestions: [],
        vocabQIndex: 0,
        vocabScore: 0,
        vocabCorrect: 0,
    };

    // ── DOM helpers ────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);
    const show = el => { if (el) el.classList.remove('hidden'); };
    const hide = el => { if (el) el.classList.add('hidden'); };

    // ── Screen management ──────────────────────────────────────────────
    function showScreen(name) {
        document.querySelectorAll('.eu-screen').forEach(s => s.classList.remove('active'));
        const el = $('eu-screen-' + name);
        if (el) {
            el.classList.add('active');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: true });
        }
    }

    // ── TTS ────────────────────────────────────────────────────────────
    function speak(text) {
        if (!window.speechSynthesis) return null;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const euVoice = voices.find(v => v.lang.startsWith('eu'));
            const esVoice = voices.find(v => v.lang.startsWith('es'));
            utt.voice = euVoice || esVoice || null;
            utt.lang = euVoice ? 'eu' : 'es-ES';
        };
        loadVoices();
        utt.rate = 0.85;
        window.speechSynthesis.speak(utt);
        return utt;
    }

    // ── Mode switching ─────────────────────────────────────────────────
    function showMode(mode) {
        const grammarSection = $('eu-mode-grammar');
        const vocabSection   = $('eu-mode-vocabulary');
        if (!grammarSection || !vocabSection) return;

        if (mode === 'grammar') {
            grammarSection.classList.remove('hidden');
            vocabSection.classList.add('hidden');
        } else {
            grammarSection.classList.add('hidden');
            vocabSection.classList.remove('hidden');
            renderVocabularyHome();
        }

        // Update button active state
        document.querySelectorAll('.eu-mode-card').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    // ── Home screen ────────────────────────────────────────────────────
    function renderHome() {
        renderTheory();
        renderLevelGrid();
        showScreen('home');
        // Default: show grammar mode
        showMode('grammar');
    }

    // ── Theory rendering (new child-friendly structure) ────────────────
    function renderTheory() {
        const t = EUSKERA_MODULE.theory;
        const el = $('eu-theory-content');
        if (!el) return;

        // Analogy pieces
        const piecesHtml = t.analogy.pieces.map(p => `
            <div class="eu-analogy-piece">
                <div class="eu-analogy-color">${p.color}</div>
                <div class="eu-analogy-name">${p.name}</div>
                <div class="eu-analogy-question">${p.question}</div>
                <div class="eu-analogy-simple">${p.simple}</div>
                <ul class="eu-analogy-examples">
                    ${p.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
            </div>`).join('');

        // Visual examples
        const visualHtml = t.visual_examples.map(ex => `
            <div class="eu-visual-example">
                <div class="eu-visual-title">${ex.title}</div>
                <div class="eu-visual-spanish">${ex.spanish}</div>
                <div class="eu-visual-basque">${ex.basque}</div>
                <div class="eu-visual-breakdown">
                    <span class="eu-vb-tag nork">${ex.breakdown.nork}</span>
                    <span class="eu-vb-tag nori">${ex.breakdown.nori}</span>
                    <span class="eu-vb-tag nor">${ex.breakdown.nor}</span>
                </div>
                <div class="eu-visual-result">→ <strong>${ex.result}</strong></div>
                <div class="eu-visual-mnemonic">${ex.mnemonic}</div>
            </div>`).join('');

        // Conjugation table
        const tableHeads = t.conjugation_table.headers.map(h => `<th>${h}</th>`).join('');
        const tableRows  = t.conjugation_table.rows.map(r => `
            <tr>
                <td class="eu-nork">${r.nork}</td>
                ${r.cells.map(c => `<td>${c === '—' ? '<span style="opacity:0.3">—</span>' : `<strong>${c}</strong>`}</td>`).join('')}
            </tr>`).join('');

        // Plural examples
        const pluralHtml = t.plurals.examples.map(ex => `
            <div class="eu-plural-example">
                <div class="eu-plural-singular">1 cosa: ${ex.singular}</div>
                <div class="eu-plural-plural">Varias: ${ex.plural}</div>
            </div>`).join('');

        // Memory tricks
        const tricksHtml = t.memory_tricks.map(tr => `<li>${tr}</li>`).join('');

        el.innerHTML = `
            <p class="eu-theory-intro">${t.intro}</p>

            <div class="eu-analogy-block">
                <p class="eu-section-label">${t.analogy.title}</p>
                <p class="eu-analogy-desc">${t.analogy.description}</p>
                <div class="eu-analogy-pieces">${piecesHtml}</div>
            </div>

            <div class="eu-visual-block">
                <p class="eu-section-label">Ejemplos paso a paso</p>
                <div class="eu-visual-examples">${visualHtml}</div>
            </div>

            <p class="eu-section-label">${t.conjugation_table.title}</p>
            <div class="eu-table-scroll">
                <table class="eu-conj-table">
                    <thead><tr>${tableHeads}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <p class="eu-table-note">${t.conjugation_table.note}</p>

            <div class="eu-plurals-block">
                <p class="eu-section-label">${t.plurals.title}</p>
                <p class="eu-plurals-explanation">${t.plurals.explanation}</p>
                <div class="eu-plural-examples">${pluralHtml}</div>
                <div class="eu-plural-rule">${t.plurals.rule}</div>
            </div>

            <p class="eu-section-label" style="margin-top:1rem">Trucos para recordar</p>
            <ul class="eu-tricks-list">${tricksHtml}</ul>`;
    }

    function speakWord(audioText) {
        speak(audioText);
    }

    // ── Level progress (localStorage) ─────────────────────────────────
    function getLevelProgress() {
        try { return JSON.parse(localStorage.getItem('eu_nnk_progress') || '{}'); } catch { return {}; }
    }
    function saveLevelProgress(levelId, stars) {
        const p = getLevelProgress();
        if ((p[levelId]?.stars || 0) < stars) p[levelId] = { stars };
        localStorage.setItem('eu_nnk_progress', JSON.stringify(p));
    }

    function renderLevelGrid() {
        const el = $('eu-level-grid');
        if (!el) return;
        const progress = getLevelProgress();

        const typeBadges = {
            mcq:          (id) => id === 1 ? 'Nivel 1 — Más fácil (auxiliares básicos)' : 'Nivel 2 — Selección múltiple',
            'fill-blank': ()   => 'Nivel 3 — Completar frases',
            listening:    ()   => 'Nivel 4 — Comprensión auditiva',
        };
        const typeLabels = {
            mcq:          (id) => id === 1 ? 'Principiante' : 'Selección múltiple',
            'fill-blank': ()   => 'Completar',
            listening:    ()   => 'Comprensión',
        };

        el.innerHTML = EUSKERA_LEVELS.map((lvl, i) => {
            const isUnlocked = i === 0 || progress[i]?.stars >= 1;
            const stars = progress[lvl.id]?.stars || 0;
            const starsHtml = [1, 2, 3].map(n => `<span style="opacity:${stars >= n ? 1 : 0.25}">⭐</span>`).join('');
            const label = typeLabels[lvl.type] ? typeLabels[lvl.type](lvl.id) : `Nivel ${lvl.id}`;
            return `<div role="listitem">
                <button class="eu-level-btn${isUnlocked ? ' unlocked' : ''}"
                    ${isUnlocked ? `onclick="EuskeraGame.startLevel(${lvl.id})"` : 'disabled aria-disabled="true"'}
                    aria-label="Nivel ${lvl.id}: ${label}${!isUnlocked ? '. Bloqueado' : ''}">
                    <div class="eu-level-num">${lvl.id}</div>
                    <div class="eu-level-type">${label}</div>
                    <div class="eu-level-stars">${isUnlocked ? starsHtml : '🔒'}</div>
                </button>
            </div>`;
        }).join('');
    }

    // ── VOCABULARY MODE ────────────────────────────────────────────────

    function renderVocabularyHome() {
        const container = $('eu-vocab-topics-container');
        if (!container) return;

        const topicsHtml = EUSKERA_MODULE.vocabulary_topics.map(topic => `
            <div class="eu-topic-card">
                <button class="eu-topic-card-btn" onclick="EuskeraGame.showTopicWords('${topic.id}')"
                    aria-label="Ver palabras de ${topic.label}">
                    <span class="eu-topic-label">${topic.label}</span>
                    <span class="eu-topic-count">${topic.words.length} palabras</span>
                </button>
                <button class="eu-topic-quiz-btn eu-btn eu-btn-primary"
                    onclick="EuskeraGame.startVocabQuiz('${topic.id}')"
                    aria-label="Quiz de ${topic.label}">
                    Quiz
                </button>
            </div>`).join('');

        container.innerHTML = `<div class="eu-vocab-topics-grid">${topicsHtml}</div>`;

        // Hide topic words panel if open
        const wordsPanel = $('eu-topic-words-panel');
        if (wordsPanel) wordsPanel.classList.add('hidden');
    }

    function showTopicWords(topicId) {
        const topic = EUSKERA_MODULE.vocabulary_topics.find(t => t.id === topicId);
        if (!topic) return;

        const wordsPanel = $('eu-topic-words-panel');
        if (!wordsPanel) return;

        const chipsHtml = topic.words.map(w => `
            <button class="eu-vocab-chip" onclick="EuskeraGame.speakWord('${w.audio_text}')"
                title="${w.es}" aria-label="${w.eu}: ${w.es}">
                <span class="eu-tts-icon">🔊</span>
                <span class="eu-vocab-eu">${w.eu}</span>
                <span class="eu-vocab-es">${w.es}</span>
            </button>`).join('');

        wordsPanel.innerHTML = `
            <div class="eu-topic-words-header">
                <span class="eu-topic-words-title">${topic.label}</span>
                <button class="eu-btn eu-btn-primary eu-topic-practice-btn"
                    onclick="EuskeraGame.startVocabQuiz('${topic.id}')">
                    Practicar
                </button>
            </div>
            <div class="eu-vocab-grid">${chipsHtml}</div>`;

        wordsPanel.classList.remove('hidden');
        wordsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function startVocabQuiz(topicId) {
        const questions = EUSKERA_VOCAB_QUIZZES[topicId];
        if (!questions || questions.length === 0) return;

        const topic = EUSKERA_MODULE.vocabulary_topics.find(t => t.id === topicId);

        state.caseMode       = false;
        state.vocabMode      = true;
        state.vocabTopicId   = topicId;
        state.vocabQuestions = questions;
        state.vocabQIndex    = 0;
        state.vocabScore     = 0;
        state.vocabCorrect   = 0;
        state.score          = 0;
        state.correct        = 0;
        state.totalAnswered  = 0;
        state.streak         = 0;
        state.bestStreak     = 0;
        state.startTime      = Date.now();
        state.answered       = false;

        $('eu-level-badge').textContent = `Vocabulario — ${topic ? topic.label : topicId}`;
        updateVocabHUD();
        renderVocabQuestion();
        showScreen('game');
    }

    function updateVocabHUD() {
        $('eu-score-val').textContent    = state.vocabScore;
        $('eu-streak-val').textContent   = streakText();
        const total   = state.vocabQuestions.length;
        const current = state.vocabQIndex;
        $('eu-progress-val').textContent = `${Math.min(current + 1, total)}/${total}`;
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        $('eu-progress-fill').style.width = pct + '%';
        $('eu-progress-bar-wrap').setAttribute('aria-valuenow', pct);
    }

    function renderVocabQuestion() {
        const q = state.vocabQuestions[state.vocabQIndex];
        if (!q) { showVocabResults(); return; }

        state.answered = false;
        const feedbackEl = $('eu-feedback');
        if (feedbackEl) { feedbackEl.style.display = 'none'; feedbackEl.className = 'eu-feedback'; }
        hide($('eu-next-btn'));

        const optionsHtml = q.options.map(opt =>
            `<button class="eu-option-btn" onclick="EuskeraGame.handleVocabMCQ('${encodeURIComponent(opt)}')">${opt}</button>`
        ).join('');

        $('eu-question-area').innerHTML = `
            <div class="eu-question-card">
                <p class="eu-question-label">¿Qué significa en español?</p>
                <p class="eu-sentence eu-vocab-word-big">${q.eu}</p>
                <button class="eu-tts-btn eu-vocab-tts" onclick="EuskeraGame.speakWord('${q.eu}')" style="margin-top:0.5rem">
                    🔊 Escuchar
                </button>
            </div>
            <div class="eu-options">${optionsHtml}</div>`;
        updateVocabHUD();
        decorate('vocab');
    }

    function handleVocabMCQ(encodedOpt) {
        if (state.answered) return;
        state.answered = true;
        const chosen = decodeURIComponent(encodedOpt);
        const q = state.vocabQuestions[state.vocabQIndex];
        const isCorrect = chosen === q.answer;

        state.totalAnswered++;
        if (isCorrect) {
            state.correct++;
            state.vocabCorrect++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.vocabScore += 10;
            state.score += 10;
        } else {
            state.streak = 0;
        }

        document.querySelectorAll('.eu-option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === q.answer)             btn.classList.add('correct');
            if (btn.textContent === chosen && !isCorrect) btn.classList.add('wrong');
        });

        fxAnswer(isCorrect, chosen);
        showFeedback(isCorrect, `${q.eu} = ${q.answer}`);
        show($('eu-next-btn'));
    }

    function nextVocabQuestion() {
        state.vocabQIndex++;
        if (state.vocabQIndex >= state.vocabQuestions.length) {
            showVocabResults();
        } else {
            renderVocabQuestion();
        }
    }

    function showVocabResults() {
        const elapsed = Math.round((Date.now() - state.startTime) / 1000);
        const total   = state.vocabQuestions.length;
        const pct     = total > 0 ? (state.vocabCorrect / total) * 100 : 0;
        const stars   = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;

        $('eu-result-score').textContent   = state.vocabScore;
        $('eu-result-correct').textContent = `${state.vocabCorrect}/${total}`;
        $('eu-result-time').textContent    = formatTime(elapsed);
        $('eu-result-level').textContent   = 'Vocab';
        Dyn.stars($('eu-result-stars'), stars, 3, '⭐'); if (stars >= 2) Dyn.big($('eu-result-stars'));

        hide($('eu-next-level-btn'));
        showScreen('results');
    }

    // ── Game start (grammar levels) ────────────────────────────────────
    function startLevel(levelId) {
        state.vocabMode = false; state.caseMode = false;
        const lvl = EUSKERA_LEVELS.find(l => l.id === levelId);
        if (!lvl) return;
        state.level = levelId;
        state.exerciseIndex = 0;
        state.passageIndex  = 0;
        state.passageQIndex = 0;
        state.score         = 0;
        state.correct       = 0;
        state.totalAnswered = 0;
        state.streak        = 0;
        state.bestStreak    = 0;
        state.startTime     = Date.now();
        state.answered      = false;

        if (lvl.type === 'listening') {
            state.currentExercises = lvl.passages;
        } else {
            state.currentExercises = lvl.exercises;
        }

        const typeBadges = {
            mcq:          (id) => id === 1 ? 'Nivel 1 — Más fácil (auxiliares básicos)' : 'Nivel 2 — Selección múltiple',
            'fill-blank': ()   => 'Nivel 3 — Completar frase',
            listening:    ()   => 'Nivel 4 — Comprensión auditiva',
        };
        const badgeFn = typeBadges[lvl.type];
        $('eu-level-badge').textContent = badgeFn ? badgeFn(levelId) : `Nivel ${levelId}`;
        updateHUD();
        renderQuestion();
        showScreen('game');
    }

    // ── HUD ────────────────────────────────────────────────────────────
    function updateHUD() {
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;
        $('eu-score-val').textContent  = state.score;
        $('eu-streak-val').textContent = streakText();

        let total, current;
        if (lvl.type === 'listening') {
            total   = lvl.passages.reduce((s, p) => s + p.questions.length, 0);
            current = state.totalAnswered;
        } else {
            total   = lvl.exercises.length;
            current = state.exerciseIndex;
        }
        $('eu-progress-val').textContent = `${Math.min(current + 1, total)}/${total}`;
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        $('eu-progress-fill').style.width = pct + '%';
        $('eu-progress-bar-wrap').setAttribute('aria-valuenow', pct);
    }

    // ── Question rendering ─────────────────────────────────────────────
    // ── Dynamic layer: zone labels, coloured answers, drag into the blank, help, case round ──
    const streakText = () => (state.streak >= 3 ? '🔥 ' : '') + state.streak;
    function progressNumbers() {
        if (state.caseMode) return { n: Math.min(state.caseIdx + 1, state.caseQs.length), m: state.caseQs.length };
        if (state.vocabMode) return { n: Math.min(state.vocabQIndex + 1, state.vocabQuestions.length), m: state.vocabQuestions.length };
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level); if (!lvl) return { n: 1, m: 1 };
        if (lvl.type === 'listening') { const m = lvl.passages.reduce((s, p) => s + p.questions.length, 0); return { n: Math.min(state.totalAnswered + 1, m), m }; }
        return { n: Math.min(state.exerciseIndex + 1, lvl.exercises.length), m: lvl.exercises.length };
    }
    function decorate(kind) {
        const area = $('eu-question-area'); if (!area || !area.firstChild) return;
        area.classList.remove('dy-done'); Dyn.slide(area);
        const pn = progressNumbers();
        area.insertBefore(Dyn.zone(Dyn.t('q', { n: pn.n, m: pn.m }), 'q'), area.firstChild);
        const opts = area.querySelector('.eu-options');
        if (opts) { opts.parentNode.insertBefore(Dyn.zone(kind === 'mcq' ? 'dragFill' : 'choose'), opts); Dyn.style(opts, { sel: '.eu-option-btn' }); }
        const row = area.querySelector('.eu-fill-row'); if (row) row.parentNode.insertBefore(Dyn.zone('write'), row);
        if (kind === 'mcq') {
            area.querySelectorAll('.eu-option-btn').forEach(btn => Dyn.drag(btn, { targets: '.eu-blank, .eu-sentence', onDrop: (tg, node) => {
                const bl = area.querySelector('.eu-blank'); if (bl) bl.textContent = node.textContent; handleMCQ(encodeURIComponent(node.textContent));
            } }));
        }
    }
    function fillBlank(ans, ok) {
        const bl = document.querySelector('#eu-question-area .eu-blank'); if (!bl) return;
        bl.textContent = ans; bl.classList.add(ok ? 'filled-ok' : 'filled-bad');
    }
    function fxAnswer(ok, chosen) {
        const btns = Array.from(document.querySelectorAll('.eu-option-btn'));
        const node = (chosen != null && btns.find(b => b.textContent === chosen)) || $('eu-fill-input') || $('eu-question-area');
        $('eu-question-area').classList.add('dy-done');
        if (ok) Dyn.good(node, state.streak); else Dyn.bad(node);
        if (state.vocabMode) updateVocabHUD(); else if (state.caseMode) updateCaseHUD(); else updateHUD();
    }
    function helpSheet() {
        let body = null;
        if (state.caseMode) body = Dyn.t('caseHelp');
        else if (state.vocabMode) { const q = state.vocabQuestions[state.vocabQIndex]; if (q) { speakWord(q.eu); body = Dyn.t('hintStarts', { c: q.answer.charAt(0).toUpperCase(), n: q.answer.length }); } }
        else {
            const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
            if (lvl && lvl.type === 'mcq') { const ex = lvl.exercises[state.exerciseIndex]; if (ex) body = Dyn.t('euHelp') + ' NORK = ' + ex.analysis.nork + ', NORI = ' + ex.analysis.nori + ', NOR = ' + ex.analysis.nor + '.'; }
            else if (lvl && lvl.type === 'fill-blank') { const ex = lvl.exercises[state.exerciseIndex]; if (ex) body = ex.hint; }
            else if (lvl) body = Dyn.t('euListen');
        }
        Dyn.sheet(Dyn.t('help'), body || Dyn.t('caseHelp'));
    }

    // Case round: tap the piece that answers "who / to whom / what" (not saved, not scored in the levels)
    const CASE_ROLES = [['nork', 'NORK'], ['nori', 'NORI'], ['nor', 'NOR']], CASE_ROUNDS = 6;
    const shuffleArr = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function startCaseRound() {
        const pool = [].concat(EUSKERA_LEVELS[0].exercises, EUSKERA_LEVELS[1] ? EUSKERA_LEVELS[1].exercises : []).filter(e => e.analysis && e.analysis.nork && e.analysis.nori && e.analysis.nor);
        const picked = shuffleArr(pool.slice()).slice(0, CASE_ROUNDS), roles = shuffleArr(CASE_ROLES.concat(CASE_ROLES).slice());
        Object.assign(state, { vocabMode: false, caseMode: true, caseQs: picked.map((ex, i) => ({ ex, role: roles[i % roles.length] })), caseIdx: 0, score: 0, correct: 0, totalAnswered: 0, streak: 0, bestStreak: 0, startTime: Date.now(), answered: false });
        $('eu-level-badge').textContent = '🎯 ' + Dyn.t('caseTitle');
        renderCase(); showScreen('game');
    }
    function updateCaseHUD() {
        const total = state.caseQs.length, cur = state.caseIdx;
        $('eu-score-val').textContent = state.score; $('eu-streak-val').textContent = streakText();
        $('eu-progress-val').textContent = Math.min(cur + 1, total) + '/' + total;
        const pct = Math.round(cur / total * 100); $('eu-progress-fill').style.width = pct + '%'; $('eu-progress-bar-wrap').setAttribute('aria-valuenow', pct);
    }
    function renderCase() {
        const q = state.caseQs[state.caseIdx]; if (!q) { showCaseResults(); return; }
        state.answered = false;
        const fb = $('eu-feedback'); if (fb) { fb.style.display = 'none'; fb.className = 'eu-feedback'; }
        hide($('eu-next-btn'));
        const ex = q.ex, piece = (EUSKERA_MODULE.theory.analogy.pieces || []).find(p => p.name === q.role[1]) || { question: q.role[1], color: '' };
        const area = $('eu-question-area'); area.textContent = '';
        const card = document.createElement('div'); card.className = 'eu-question-card';
        const lab = document.createElement('p'); lab.className = 'eu-question-label'; lab.textContent = piece.color + ' ' + q.role[1] + ': ' + piece.question;
        const sen = document.createElement('p'); sen.className = 'eu-sentence'; sen.textContent = ex.sentence.replace('___', ex.answer);
        const tr = document.createElement('p'); tr.className = 'eu-translation'; tr.textContent = ex.translation;
        card.append(lab, sen, tr);
        const opts = document.createElement('div'); opts.className = 'eu-options'; opts.id = 'eu-case-options';
        shuffleArr(CASE_ROLES.map(r => ex.analysis[r[0]])).forEach(val => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'eu-option-btn'; b.textContent = val; b.onclick = () => handleCase(val); opts.appendChild(b);
        });
        area.append(card, opts);
        updateCaseHUD(); decorate('case');
    }
    function handleCase(val) {
        if (state.answered) return; state.answered = true;
        const q = state.caseQs[state.caseIdx], right = q.ex.analysis[q.role[0]], ok = val === right;
        state.totalAnswered++;
        if (ok) { state.correct++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); state.score += 10; } else state.streak = 0;
        document.querySelectorAll('.eu-option-btn').forEach(btn => { btn.disabled = true; if (btn.textContent === right) btn.classList.add('correct'); if (btn.textContent === val && !ok) btn.classList.add('wrong'); });
        fxAnswer(ok, val); showFeedback(ok, q.role[1] + ' = ' + right + '  ·  ' + q.ex.explanation); show($('eu-next-btn'));
    }
    function showCaseResults() {
        const elapsed = Math.round((Date.now() - state.startTime) / 1000), total = state.caseQs.length, pct = total ? state.correct / total * 100 : 0;
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
        $('eu-result-score').textContent = state.score; $('eu-result-correct').textContent = state.correct + '/' + total;
        $('eu-result-time').textContent = formatTime(elapsed); $('eu-result-level').textContent = '🎯';
        Dyn.stars($('eu-result-stars'), stars, 3, '⭐'); if (stars >= 2) Dyn.big($('eu-result-stars'));
        hide($('eu-next-level-btn')); showScreen('results');
    }

    function renderQuestion() {
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;
        state.answered = false;

        const feedbackEl = $('eu-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
            feedbackEl.className = 'eu-feedback';
        }
        hide($('eu-next-btn'));

        if (lvl.type === 'mcq')             renderMCQ(lvl);
        else if (lvl.type === 'fill-blank') renderFillBlank(lvl);
        else if (lvl.type === 'listening')  renderListening(lvl);

        updateHUD();
        decorate(lvl.type === 'mcq' ? 'mcq' : lvl.type === 'fill-blank' ? 'fill' : 'listen');
    }

    // ── MCQ (Level 1 & 2) ──────────────────────────────────────────────
    function renderMCQ(lvl) {
        const ex = lvl.exercises[state.exerciseIndex];
        if (!ex) { showResults(); return; }
        const sentenceHtml = ex.sentence.replace('___', '<span class="eu-blank">___</span>');
        const analysisHtml = `
            <span class="eu-analysis-tag">NOR: ${ex.analysis.nor}</span>
            <span class="eu-analysis-tag">NORI: ${ex.analysis.nori}</span>
            <span class="eu-analysis-tag">NORK: ${ex.analysis.nork}</span>`;
        const optionsHtml = ex.options.map(opt =>
            `<button class="eu-option-btn" onclick="EuskeraGame.handleMCQ('${encodeURIComponent(opt)}')">${opt}</button>`
        ).join('');
        $('eu-question-area').innerHTML = `
            <div class="eu-question-card">
                <p class="eu-question-label">Elige el auxiliar correcto</p>
                <p class="eu-sentence">${sentenceHtml}</p>
                <p class="eu-translation">${ex.translation}</p>
                <div class="eu-analysis">${analysisHtml}</div>
            </div>
            <div class="eu-options">${optionsHtml}</div>`;
    }

    function handleMCQ(encodedOpt) {
        if (state.answered) return;
        state.answered = true;
        const chosen = decodeURIComponent(encodedOpt);
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        const ex  = lvl.exercises[state.exerciseIndex];
        const isCorrect = chosen.toLowerCase() === ex.answer.toLowerCase();
        scoreAnswer(isCorrect, lvl.scoring);
        document.querySelectorAll('.eu-option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.toLowerCase() === ex.answer.toLowerCase()) btn.classList.add('correct');
            if (btn.textContent === chosen && !isCorrect)                   btn.classList.add('wrong');
        });
        fillBlank(ex.answer, isCorrect); fxAnswer(isCorrect, chosen);
        showFeedback(isCorrect, ex.explanation);
        show($('eu-next-btn'));
    }

    // ── Fill-blank (Level 3) ───────────────────────────────────────────
    function renderFillBlank(lvl) {
        const ex = lvl.exercises[state.exerciseIndex];
        if (!ex) { showResults(); return; }
        $('eu-question-area').innerHTML = `
            <div class="eu-question-card">
                <p class="eu-question-label">Escribe el auxiliar correcto</p>
                <div class="eu-fill-row">
                    <span>${ex.before}</span>
                    <input class="eu-fill-input" id="eu-fill-input" type="text"
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        placeholder="___" aria-label="Escribe el auxiliar">
                    <span>${ex.after}</span>
                </div>
                <p class="eu-hint">💡 ${ex.hint}</p>
                <p class="eu-translation">${ex.translation}</p>
            </div>
            <button class="eu-btn eu-btn-primary" id="eu-submit-btn" onclick="EuskeraGame.handleFillBlank()">Comprobar</button>`;
        const inp = $('eu-fill-input');
        if (inp) {
            inp.focus();
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') handleFillBlank(); });
        }
    }

    function handleFillBlank() {
        if (state.answered) return;
        const inp = $('eu-fill-input');
        if (!inp) return;
        const given = inp.value.trim().toLowerCase();
        if (!given) return;
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        const ex  = lvl.exercises[state.exerciseIndex];
        const isCorrect = given === ex.answer.toLowerCase();
        state.answered = true;
        scoreAnswer(isCorrect, lvl.scoring);
        inp.classList.add(isCorrect ? 'correct' : 'wrong');
        inp.disabled = true;
        const submitBtn = $('eu-submit-btn');
        if (submitBtn) submitBtn.disabled = true;
        if (!isCorrect) inp.value = ex.answer;
        fxAnswer(isCorrect, null);
        showFeedback(isCorrect, `Respuesta correcta: ${ex.answer}`);
        show($('eu-next-btn'));
    }

    // ── Listening (Level 4) ────────────────────────────────────────────
    function renderListening(lvl) {
        const passage = lvl.passages[state.passageIndex];
        if (!passage) { showResults(); return; }
        const q = passage.questions[state.passageQIndex];
        if (!q) {
            state.passageIndex++;
            state.passageQIndex = 0;
            renderListening(lvl);
            return;
        }
        const isFirstQ = state.passageQIndex === 0;
        const optionsHtml = q.options.map(opt =>
            `<button class="eu-option-btn" onclick="EuskeraGame.handleListening('${encodeURIComponent(opt)}')">${opt}</button>`
        ).join('');

        $('eu-question-area').innerHTML = `
            ${isFirstQ ? `
            <div class="eu-passage-card">
                <button class="eu-tts-btn" id="eu-tts-passage-btn" onclick="EuskeraGame.listenPassage()">
                    🔊 Escuchar texto
                </button>
                <p id="eu-passage-text">${passage.audio_text}</p>
                <p class="eu-passage-es">${passage.text_es}</p>
            </div>` : ''}
            <div class="eu-question-card">
                <p class="eu-question-counter">Pregunta ${state.passageQIndex + 1} / ${passage.questions.length}</p>
                <p class="eu-question-text">${q.question}</p>
            </div>
            <div class="eu-options">${optionsHtml}</div>`;
    }

    function listenPassage() {
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        if (!lvl || lvl.type !== 'listening') return;
        const passage = lvl.passages[state.passageIndex];
        if (!passage) return;
        const btn = $('eu-tts-passage-btn');
        if (btn) btn.classList.add('speaking');
        const utt = speak(passage.audio_text);
        if (utt && btn) utt.onend = () => btn.classList.remove('speaking');
    }

    function handleListening(encodedOpt) {
        if (state.answered) return;
        state.answered = true;
        const opt     = decodeURIComponent(encodedOpt);
        const lvl     = EUSKERA_LEVELS.find(l => l.id === state.level);
        const passage = lvl.passages[state.passageIndex];
        const q       = passage.questions[state.passageQIndex];
        const isCorrect = opt === q.answer;
        scoreAnswer(isCorrect, lvl.scoring);
        document.querySelectorAll('.eu-option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === q.answer)            btn.classList.add('correct');
            if (btn.textContent === opt && !isCorrect)   btn.classList.add('wrong');
        });
        fxAnswer(isCorrect, opt);
        showFeedback(isCorrect, q.explanation);
        show($('eu-next-btn'));
    }

    // ── Scoring ────────────────────────────────────────────────────────
    function scoreAnswer(isCorrect, scoringCfg) {
        state.totalAnswered++;
        if (isCorrect) {
            state.correct++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.score += scoringCfg.correctPoints ?? 10;
        } else {
            state.streak = 0;
            if (scoringCfg.incorrectPoints) state.score = Math.max(0, state.score + scoringCfg.incorrectPoints);
        }
    }

    // ── Feedback ───────────────────────────────────────────────────────
    function showFeedback(isCorrect, explanation) {
        const el = $('eu-feedback');
        if (!el) return;
        el.className   = 'eu-feedback ' + (isCorrect ? 'correct' : 'wrong');
        el.textContent = '';
        const lead = document.createElement('strong'); lead.textContent = isCorrect ? 'Correcto! ' : 'Incorrecto. ';
        const why = document.createElement('small'); why.className = 'eu-whylbl'; why.textContent = '💡 ' + Dyn.t('why');
        const body = document.createElement('span'); body.className = 'eu-whytx'; body.textContent = explanation;
        el.append(lead, why, body);
        el.style.display = 'block';
    }

    // ── Next question ──────────────────────────────────────────────────
    function nextQuestion() {
        if (state.caseMode) { state.caseIdx++; renderCase(); return; }
        if (state.vocabMode) {
            nextVocabQuestion();
            return;
        }
        const lvl = EUSKERA_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;
        if (lvl.type === 'listening') {
            const passage = lvl.passages[state.passageIndex];
            if (!passage) { showResults(); return; }
            state.passageQIndex++;
            if (state.passageQIndex >= passage.questions.length) {
                state.passageIndex++;
                state.passageQIndex = 0;
                if (state.passageIndex >= lvl.passages.length) { showResults(); return; }
            }
        } else {
            state.exerciseIndex++;
            if (state.exerciseIndex >= lvl.exercises.length) { showResults(); return; }
        }
        renderQuestion();
    }

    // ── Results (grammar levels) ───────────────────────────────────────
    function showResults() {
        const lvl     = EUSKERA_LEVELS.find(l => l.id === state.level);
        const elapsed = Math.round((Date.now() - state.startTime) / 1000);
        const total   = state.totalAnswered;
        const pct     = total > 0 ? (state.correct / total) * 100 : 0;
        const stars   = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= (lvl?.passingScore ?? 60) ? 1 : 0;

        $('eu-result-score').textContent   = state.score;
        $('eu-result-correct').textContent = `${state.correct}/${total}`;
        $('eu-result-time').textContent    = formatTime(elapsed);
        $('eu-result-level').textContent   = state.level;
        Dyn.stars($('eu-result-stars'), stars, 3, '⭐'); if (stars >= 2) Dyn.big($('eu-result-stars'));

        const nextLvlBtn = $('eu-next-level-btn');
        if (state.level >= EUSKERA_LEVELS.length) hide(nextLvlBtn);
        else show(nextLvlBtn);

        saveLevelProgress(state.level, stars);

        if (typeof PlatformFirestore !== 'undefined' && typeof PlatformAuth !== 'undefined' && PlatformAuth.currentUser) {
            PlatformFirestore.updateGameStats(PlatformAuth.currentUser.uid, 'euskera', {
                correctAnswers: state.correct,
                totalQuestions: total,
                totalAttempts:  total,
                bestStreak:     state.bestStreak,
                elapsedSeconds: elapsed,
                level:          state.level
            }).catch(() => {});
        }

        showScreen('results');
    }

    function formatTime(s) {
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    // ── Quit modal ─────────────────────────────────────────────────────
    function showQuitModal() {
        const modal = $('eu-quit-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.focus();
    }
    function hideQuitModal() {
        $('eu-quit-modal')?.classList.add('hidden');
    }

    // ── Init ───────────────────────────────────────────────────────────
    function init() {
        renderHome();
        // tools row under the HUD: help (always visible) and sound
        const hud = document.querySelector('.eu-hud');
        if (hud) {
            const tools = Dyn.el('div', 'dy-tools'), hb = Dyn.el('button', 'dy-help', '💡'); hb.type = 'button'; hb.id = 'eu-help'; hb.onclick = helpSheet;
            tools.appendChild(hb); Dyn.sound(tools); hud.parentNode.insertBefore(tools, hud.nextSibling);
            const labels = () => { hb.textContent = '💡 ' + Dyn.t('help'); hb.setAttribute('aria-label', Dyn.t('help')); const cb = $('eu-case-btn'); if (cb) cb.textContent = '🎯 ' + Dyn.t('caseTitle'); };
            labels(); document.addEventListener('platformLanguageChanged', labels);
        }
        $('eu-case-btn')?.addEventListener('click', startCaseRound);

        // Theory toggle
        $('eu-theory-toggle')?.addEventListener('click', () => {
            const body   = $('eu-theory-body');
            const toggle = $('eu-theory-toggle');
            const isOpen = !body.hidden;
            body.hidden = isOpen;
            toggle.setAttribute('aria-expanded', String(!isOpen));
            toggle.querySelector('.eu-toggle-icon').textContent = isOpen ? '▼' : '▲';
        });

        // Next button
        $('eu-next-btn')?.addEventListener('click', nextQuestion);

        // Quit buttons
        $('eu-quit-btn')?.addEventListener('click', showQuitModal);
        $('eu-quit-cancel')?.addEventListener('click', hideQuitModal);
        $('eu-quit-ok')?.addEventListener('click', () => { hideQuitModal(); renderHome(); });

        // Results buttons
        $('eu-retry-btn')?.addEventListener('click', () => {
            if (state.caseMode) startCaseRound();
            else if (state.vocabMode) startVocabQuiz(state.vocabTopicId);
            else startLevel(state.level);
        });
        $('eu-next-level-btn')?.addEventListener('click', () => {
            const next = state.level + 1;
            if (next <= EUSKERA_LEVELS.length) startLevel(next);
        });
        $('eu-menu-btn')?.addEventListener('click', renderHome);

        // Close modal on backdrop click
        $('eu-quit-modal')?.addEventListener('click', e => {
            if (e.target === $('eu-quit-modal')) hideQuitModal();
        });

        // Keyboard: Escape closes modal
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !$('eu-quit-modal')?.classList.contains('hidden')) {
                hideQuitModal();
            }
        });
    }

    return {
        init,
        showMode,
        startLevel,
        handleMCQ,
        handleFillBlank,
        handleListening,
        listenPassage,
        speakWord,
        showTopicWords,
        startVocabQuiz,
        handleVocabMCQ,
        startCaseRound,
        _state: state,
    };
})();
