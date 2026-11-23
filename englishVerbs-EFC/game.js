/**
 * englishVerbs-EFC/game.js
 * EnglishVerbsGame — Irregular Verbs exercises
 * Level types: matching (L1) | fill-blank (L2) | audio-quiz (L3)
 * Also supports: group-practice (MCQ from ENGLISH_GROUP_EXERCISES)
 */
const EnglishVerbsGame = (() => {

    // ── State ──────────────────────────────────────────────────────────
    const state = {
        level: 1,
        score: 0,
        correct: 0,
        totalAnswered: 0,
        streak: 0,
        bestStreak: 0,
        startTime: 0,
        answered: false,
        // Level 1 - Matching
        roundIndex: 0,
        matchLeft: null,
        matchedPairs: 0,
        totalRoundPairs: 5,
        // Level 2 - Fill-blank
        exerciseIndex: 0,
        // Level 3 - Audio quiz
        storyIndex: 0,
        questionIndex: 0,
        // Group practice
        groupPracticeMode: false,
        groupPracticeGroup: null,
        groupPracticeExercises: [],
        groupPracticeIndex: 0,
        genMode: null,
        genGroup: 'all',
    };

    // ── i18n ───────────────────────────────────────────────────
    let lang = 'es';
    function detectLang() {
        let pl = 'es';
        try {
            pl = (typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) ||
                 localStorage.getItem('games_hub_language') || navigator.language || 'es';
        } catch (e) { /* ignore */ }
        const c = String(pl).slice(0, 2).toLowerCase();
        lang = (typeof EV_I18N !== 'undefined' && EV_I18N[c]) ? c : 'es';
        document.documentElement.lang = lang;
    }
    function t(key, vars) {
        let str = (EV_I18N[lang] && EV_I18N[lang][key]) ?? EV_I18N.es[key] ?? key;
        if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.split('{' + k + '}').join(v); });
        return str;
    }
    // Meaning of a verb in the UI language ('' for English: no translation needed)
    function meaningOf(v) {
        if (lang === 'es') return v.meaning_es;
        if (lang === 'en') return '';
        const m = (typeof VERB_MEANINGS !== 'undefined') ? VERB_MEANINGS[v.infinitive] : null;
        const idx = { eu: 0, gl: 1, ca: 2, fr: 3 }[lang];
        return (m && m[idx]) || v.meaning_es;
    }
    const GROUP_COLORS = { 'A-A-A': '#22c55e', 'A-B-A': '#3b82f6', 'A-B-B': '#f59e0b', 'A-B-C': '#ef4444' };
    function applyStatic() {
        document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
        const cnt = $('ev-verb-count'); if (cnt) cnt.textContent = IRREGULAR_VERBS.length;
    }

    const $ = id => document.getElementById(id);
    const show = el => { if (el) el.classList.remove('hidden'); };
    const hide = el => { if (el) el.classList.add('hidden'); };

    // ── Screen management ──────────────────────────────────────────────
    function showScreen(name) {
        document.querySelectorAll('.ev-screen').forEach(s => s.classList.remove('active'));
        const el = $('ev-screen-' + name);
        if (el) {
            el.classList.add('active');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: true });
        }
    }

    // ── Tab switching ──────────────────────────────────────────────────
    function showTab(tabName) {
        document.querySelectorAll('.ev-tab-content').forEach(tc => tc.classList.remove('active'));
        document.querySelectorAll('.ev-tab-btn').forEach(tb => tb.classList.remove('active'));
        const content = $('ev-tab-' + tabName);
        if (content) content.classList.add('active');
        const btn = $('ev-tabBtn-' + tabName);
        if (btn) btn.classList.add('active');
    }

    // ── TTS ───────────────────────────────────────────────────────────
    function speak(text) {
        if (!window.speechSynthesis) return null;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en-GB')) ||
                        voices.find(v => v.lang.startsWith('en'));
        utt.voice = enVoice || null;
        utt.lang = 'en-GB';
        utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
        return utt;
    }

    function speakVerb(audioText) {
        speak(audioText);
    }

    // ── Search verbs ───────────────────────────────────────────────────
    function searchVerbs(query) {
        const q = query.toLowerCase().trim();
        const rows = document.querySelectorAll('#ev-verb-table-container tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = (!q || text.includes(q)) ? '' : 'none';
        });
    }

    // ── Toggle group verb list ─────────────────────────────────────────
    function toggleGroupVerbs(group) {
        const listEl = $('ev-group-verbs-' + group.replace(/-/g, ''));
        const btnEl  = $('ev-group-verbs-btn-' + group.replace(/-/g, ''));
        if (!listEl) return;
        const isHidden = listEl.hidden;
        listEl.hidden = !isHidden;
        if (btnEl) btnEl.textContent = isHidden ? t('hideVerbs') : t('viewVerbs');
    }

    // ── Home ───────────────────────────────────────────────────────────
    function renderHome() {
        renderVerbTable();
        renderGroupCards();
        renderLevelGrid();
        renderModes();
        showScreen('home');
        showTab('tabla');
    }

    function ttsBtn(v) {
        const label = t('listen') + ': ' + v.infinitive;
        return `<button class="ev-tts-row-btn" onclick="EnglishVerbsGame.speakVerb('${v.audio_text.replace(/'/g, "\\'")}')" title="${label}" aria-label="${label}">🔊</button>`;
    }

    function renderVerbTable() {
        const el = $('ev-verb-table-container');
        if (!el) return;
        const showMeaning = lang !== 'en';
        const rows = IRREGULAR_VERBS.map(v => `
            <tr>
                <td><strong>${v.infinitive}</strong></td>
                <td>${v.past_simple}</td>
                <td>${v.past_participle}</td>
                ${showMeaning ? `<td>${meaningOf(v)}</td>` : ''}
                <td><span class="ev-group-badge" style="background:${GROUP_COLORS[v.group]}20;color:${GROUP_COLORS[v.group]};border:1px solid ${GROUP_COLORS[v.group]}">${v.group}</span></td>
                <td>${ttsBtn(v)}</td>
            </tr>`).join('');

        el.innerHTML = `
            <div class="ev-group-legend">
                ${Object.entries(GROUP_COLORS).map(([g, c]) => `<span class="ev-group-badge" style="background:${c}20;color:${c};border:1px solid ${c}">${g}: ${t('g_' + g + '_label')}</span>`).join('')}
            </div>
            <div class="ev-table-scroll">
                <table class="ev-verb-table">
                    <thead>
                        <tr>
                            <th>${t('thInf')}</th>
                            <th>${t('thPast')}</th>
                            <th>${t('thPart')}</th>
                            ${showMeaning ? `<th>${t('thMeaning')}</th>` : ''}
                            <th>${t('thGroup')}</th>
                            <th aria-label="${t('listen')}"></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        searchVerbs(($('ev-verb-search') || {}).value || '');
    }

    function renderGroupCards() {
        const el = $('ev-group-cards-container');
        if (!el) return;
        const showMeaning = lang !== 'en';

        const cards = Object.entries(GROUP_INFO).map(([group, info]) => {
            const verbsInGroup = IRREGULAR_VERBS.filter(v => v.group === group);
            const count = verbsInGroup.length;
            const groupId = group.replace(/-/g, '');

            const verbListRows = verbsInGroup.map(v =>
                `<tr>
                    <td><strong>${v.infinitive}</strong></td>
                    <td>${v.past_simple}</td>
                    <td>${v.past_participle}</td>
                    ${showMeaning ? `<td>${meaningOf(v)}</td>` : ''}
                    <td>${ttsBtn(v)}</td>
                </tr>`
            ).join('');

            return `
            <div class="ev-group-card" style="--group-color:${info.color}">
                <div class="ev-group-card-header">
                    <span class="ev-group-badge" style="background:${info.color}20;color:${info.color};border:1px solid ${info.color}">${group}</span>
                    <span class="ev-group-count">${count} ${t('verbs')}</span>
                </div>
                <div class="ev-group-card-label">${t('g_' + group + '_label')}</div>
                <div class="ev-group-card-desc">${t('g_' + group + '_desc')}</div>
                <div class="ev-group-card-example"><code>${info.example}</code></div>
                <div class="ev-group-card-actions">
                    <button class="ev-btn ev-btn-secondary ev-btn-sm"
                        id="ev-group-verbs-btn-${groupId}"
                        onclick="EnglishVerbsGame.toggleGroupVerbs('${group}')">${t('viewVerbs')}</button>
                    <button class="ev-btn ev-btn-primary ev-btn-sm"
                        onclick="EnglishVerbsGame.startGroupPractice('${group}')">${t('practice')}</button>
                </div>
                <div class="ev-group-verb-list" id="ev-group-verbs-${groupId}" hidden>
                    <div class="ev-table-scroll">
                        <table class="ev-verb-table">
                            <thead>
                                <tr>
                                    <th>${t('thInf')}</th>
                                    <th>${t('thPast')}</th>
                                    <th>${t('thPart')}</th>
                                    ${showMeaning ? `<th>${t('thMeaning')}</th>` : ''}
                                    <th aria-label="${t('listen')}"></th>
                                </tr>
                            </thead>
                            <tbody>${verbListRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        }).join('');

        el.innerHTML = `<div class="ev-group-cards">${cards}</div>`;
    }

    function getLevelProgress() {
        try { return JSON.parse(localStorage.getItem('ev_irr_progress') || '{}'); } catch { return {}; }
    }

    function saveLevelProgress(levelId, stars) {
        const p = getLevelProgress();
        if ((p[levelId]?.stars || 0) < stars) p[levelId] = { stars };
        localStorage.setItem('ev_irr_progress', JSON.stringify(p));
    }

    function renderLevelGrid() {
        const el = $('ev-level-grid');
        if (!el) return;
        const progress = getLevelProgress();
        const typeLabels = {
            matching:    t('lv_matching'),
            'fill-blank': t('lv_fill'),
            'audio-quiz': t('lv_audio')
        };
        const typeIcons = {
            matching:    '🔗',
            'fill-blank': '✍️',
            'audio-quiz': '🎧'
        };

        el.innerHTML = ENGLISH_LEVELS.map((lvl, i) => {
            const isUnlocked = i === 0 || progress[i]?.stars >= 1;
            const stars = progress[lvl.id]?.stars || 0;
            const starsHtml = [1, 2, 3].map(n =>
                `<span style="opacity:${stars >= n ? 1 : 0.25}">⭐</span>`
            ).join('');
            return `<div role="listitem">
                <button class="ev-level-btn${isUnlocked ? ' unlocked' : ''}"
                    ${isUnlocked
                        ? `onclick="EnglishVerbsGame.startLevel(${lvl.id})"`
                        : 'disabled aria-disabled="true"'}
                    aria-label="${t('levelWord')} ${lvl.id}: ${typeLabels[lvl.type]}${!isUnlocked ? '. ' + t('locked') : ''}">
                    <div class="ev-level-icon">${typeIcons[lvl.type]}</div>
                    <div class="ev-level-num">${lvl.id}</div>
                    <div class="ev-level-type">${typeLabels[lvl.type]}</div>
                    <div class="ev-level-stars">${isUnlocked ? starsHtml : '🔒'}</div>
                </button>
            </div>`;
        }).join('');
    }

    // ── Game start ─────────────────────────────────────────────────────
    function startLevel(levelId, skipLesson) {
        const lvl = ENGLISH_LEVELS.find(l => l.id === levelId);
        if (!lvl) return;
        // First time on level 1: the "regular vs irregular" card comes first
        if (levelId === 1 && !skipLesson && !lessonSeen()) { openLesson(); return; }
        state.groupPracticeMode = false;
        state.groupPracticeGroup = null;
        state.level = levelId;
        state.score = 0;
        state.correct = 0;
        state.totalAnswered = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.startTime = Date.now();
        state.answered = false;
        state.roundIndex = 0;
        state.matchLeft = null;
        state.matchedPairs = 0;
        state.exerciseIndex = 0;
        state.storyIndex = 0;
        state.questionIndex = 0;

        state.genMode = null;
        const typeBadges = { matching: t('badge1'), 'fill-blank': t('badge2'), 'audio-quiz': t('badge3') };
        $('ev-level-badge').textContent = typeBadges[lvl.type] || `${t('levelWord')} ${levelId}`;

        updateHUD();
        renderQuestion();
        showScreen('game');
    }

    // ── Lesson: regular vs irregular past (before level 1) ─────────────
    const LESSON_KEY = 'ev_lesson_seen';
    function lessonSeen() { try { return localStorage.getItem(LESSON_KEY) === '1'; } catch (e) { return false; } }
    function markLessonSeen() { try { localStorage.setItem(LESSON_KEY, '1'); } catch (e) { /* ignore */ } }
    const lessonState = { step: 'cards', q: 0 };
    function mk(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    function openLesson() {
        lessonState.step = 'cards'; lessonState.q = 0;
        renderLesson();
        showScreen('lesson');
    }
    function finishLesson() {
        markLessonSeen();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        startLevel(1, true);
    }

    function renderLesson() {
        const root = $('ev-lesson-body');
        if (!root) return;
        root.textContent = '';
        $('ev-lesson-title').textContent = t('lrn_title');
        $('ev-lesson-skip').textContent = t('lrn_skip');
        if (lessonState.step === 'cards') renderLessonCards(root);
        else if (lessonState.step === 'try') renderLessonTry(root);
        else renderLessonDone(root);
    }

    /** Three worked examples; every form is a button that reveals the word and a sentence. */
    function renderLessonCards(root) {
        root.appendChild(mk('p', 'ev-lesson-intro', t('lrn_intro')));
        const titles = [['lrn_regular_title', 'lrn_regular_text'], ['lrn_irregular_title', 'lrn_irregular_text'], ['lrn_forms_title', 'lrn_forms_text']];
        const forms = [['base', 'lrn_form_base'], ['past', 'lrn_form_past'], ['part', 'lrn_form_part']];
        EnglishVerbsLearn.EXAMPLES.forEach((ex, i) => {
            const card = mk('div', 'ev-lcard ' + (ex.regular ? 'regular' : 'irregular'));
            card.appendChild(mk('h3', 'ev-lcard-title', t(titles[i][0])));
            card.appendChild(mk('p', 'ev-lcard-text', t(titles[i][1])));
            const row = mk('div', 'ev-ltiles');
            forms.forEach(([f, labelKey]) => {
                const word = f === 'base' ? ex.v : ex[f];
                const b = mk('button', 'ev-ltile');
                b.type = 'button';
                b.setAttribute('aria-pressed', 'false');
                b.dataset.form = f; b.dataset.verb = ex.v;
                const label = mk('span', 'ev-ltile-label', t(labelKey));
                const val = mk('span', 'ev-ltile-val', '?');
                const sent = mk('span', 'ev-ltile-sent', '');
                b.append(label, val, sent);
                b.addEventListener('click', () => {
                    if (b.getAttribute('aria-pressed') === 'true') { speak(word); return; }
                    b.setAttribute('aria-pressed', 'true'); b.classList.add('revealed');
                    val.textContent = word; sent.textContent = ex.uses[f];
                    speak(ex.uses[f]);
                });
                row.appendChild(b);
            });
            card.appendChild(row);
            card.appendChild(mk('p', 'ev-ltag', ex.v + ' → ' + t(ex.regular ? 'lrn_tag_regular' : 'lrn_tag_irregular')));
            root.appendChild(card);
        });
        const hint = mk('p', 'ev-ltap', t('lrn_tap'));
        const go = mk('button', 'ev-btn ev-btn-primary', t('lrn_try'));
        go.type = 'button'; go.id = 'ev-lesson-try';
        go.addEventListener('click', () => { lessonState.step = 'try'; lessonState.q = 0; renderLesson(); });
        root.append(hint, go);
    }

    /** Three guided questions: wrong answers are explained and can be retried. */
    function renderLessonTry(root) {
        const qs = EnglishVerbsLearn.TRY_QUESTIONS, q = qs[lessonState.q];
        root.appendChild(mk('h3', 'ev-lcard-title', t('lrn_try_title')));
        root.appendChild(mk('p', 'ev-lesson-intro', t('lrn_try_hint')));
        const card = mk('div', 'ev-question-card');
        card.appendChild(mk('p', 'ev-question-counter', t('lrn_try_count', { n: lessonState.q + 1, m: qs.length })));
        card.appendChild(mk('p', 'ev-question-text', t(q.kind === 'past' ? 'q_past' : 'q_part', { v: q.v })));
        root.appendChild(card);
        const opts = mk('div', 'ev-options');
        const fb = mk('p', 'ev-lesson-fb', ''); fb.id = 'ev-lesson-fb'; fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite');
        const next = mk('button', 'ev-btn ev-btn-primary hidden', t(lessonState.q + 1 < qs.length ? 'lrn_next' : 'lrn_start'));
        next.type = 'button'; next.id = 'ev-lesson-next';
        EnglishVerbsLearn.shuffledOptions(q).forEach(opt => {
            const b = mk('button', 'ev-option-btn');
            b.type = 'button';
            b.appendChild(mk('span', null, opt));
            b.addEventListener('click', () => {
                if (opt === EnglishVerbsLearn.answerOf(q)) {
                    opts.querySelectorAll('button').forEach(x => { x.disabled = true; });
                    b.classList.add('correct');
                    fb.className = 'ev-lesson-fb ok';
                    fb.textContent = '\u2713 ' + t('lrn_try_ok', { v: q.v, p: q.past, pp: q.part });
                    next.classList.remove('hidden'); next.focus();
                } else {
                    b.disabled = true; b.classList.add('wrong');
                    const why = EnglishVerbsLearn.whyWrong(q, opt);
                    fb.className = 'ev-lesson-fb bad';
                    fb.textContent = '\u2717 ' + t(why.key, why.vars) + ' ' + t('lrn_try_again');
                }
            });
            opts.appendChild(b);
        });
        next.addEventListener('click', () => {
            if (lessonState.q + 1 < qs.length) { lessonState.q++; renderLesson(); }
            else { lessonState.step = 'done'; renderLesson(); }
        });
        root.append(opts, fb, next);
    }

    function renderLessonDone(root) {
        root.appendChild(mk('p', 'ev-lesson-intro ev-lesson-done', t('lrn_done')));
        const go = mk('button', 'ev-btn ev-btn-primary', t('lrn_start'));
        go.type = 'button'; go.id = 'ev-lesson-start';
        go.addEventListener('click', finishLesson);
        root.appendChild(go);
        go.focus();
    }

    // ── Group practice start ───────────────────────────────────────────
    function startGroupPractice(group) {
        const exercises = ENGLISH_GROUP_EXERCISES[group];
        if (!exercises || exercises.length === 0) return;

        state.genMode = null;
        state.groupPracticeMode = true;
        state.groupPracticeGroup = group;
        state.groupPracticeExercises = exercises;
        state.groupPracticeIndex = 0;
        state.score = 0;
        state.correct = 0;
        state.totalAnswered = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.startTime = Date.now();
        state.answered = false;
        state.level = 0; // special marker for group practice

        const info = GROUP_INFO[group];
        $('ev-level-badge').textContent = `${t('groupBadge')}: ${group} ${t('g_' + group + '_label')}`;

        updateHUD();
        renderGroupPracticeQuestion();
        showScreen('game');
    }

    function renderGroupPracticeQuestion() {
        const ex = state.groupPracticeExercises[state.groupPracticeIndex];
        if (!ex) { showResults(); return; }

        state.answered = false;
        $('ev-feedback').style.display = 'none';
        hide($('ev-next-btn'));

        const total = state.groupPracticeExercises.length;
        const current = state.groupPracticeIndex;
        $('ev-progress-val').textContent = `${current + 1}/${total}`;
        const pct = Math.round((current / total) * 100);
        $('ev-progress-fill').style.width = pct + '%';
        $('ev-progress-bar-wrap').setAttribute('aria-valuenow', pct);
        $('ev-score-val').textContent = state.score;
        $('ev-streak-val').textContent = state.streak;

        if (ex.type === 'type') { renderTypeQuestion(ex, current, total); return; }
        if (ex.type === 'order' && typeof EVDyn !== 'undefined') { EVDyn.renderOrder(ex, current, total); return; }

        const optionsHtml = ex.options.map((opt, i) =>
            `<button class="ev-option-btn" onclick="EnglishVerbsGame.handleGroupPracticeQ('${encodeURIComponent(opt)}')"><kbd class="ev-key" aria-hidden="true">${i + 1}</kbd><span>${opt}</span></button>`
        ).join('');
        const audioBtn = ex.audio
            ? `<button class="ev-tts-btn ev-tts-big" id="ev-tts-q-btn" onclick="EnglishVerbsGame.speakVerb('${ex.audio}')">${t('listenBtn')}</button>`
            : '';

        $('ev-question-area').innerHTML = `
            <div class="ev-question-card">
                <p class="ev-question-counter">${t('question')} ${current + 1} / ${total}</p>
                <p class="ev-question-text">${ex.sentence}</p>
                ${audioBtn}
            </div>
            <div class="ev-options">${optionsHtml}</div>`;
        if (ex.audio) speak(ex.audio);
    }

    function markOptions(answer, chosen, isCorrect) {
        document.querySelectorAll('.ev-option-btn').forEach(btn => {
            const txt = (btn.querySelector('span') || btn).textContent;
            btn.disabled = true;
            if (txt === answer) btn.classList.add('correct');
            if (txt === chosen && !isCorrect) btn.classList.add('wrong');
        });
    }

    function handleGroupPracticeQ(encodedOpt) {
        if (state.answered) return;
        state.answered = true;

        const opt = decodeURIComponent(encodedOpt);
        const ex = state.groupPracticeExercises[state.groupPracticeIndex];
        const isCorrect = opt === ex.answer;

        state.totalAnswered++;
        if (isCorrect) {
            state.correct++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.score += 10;
        } else {
            state.streak = 0;
        }

        markOptions(ex.answer, opt, isCorrect);

        showFeedback(isCorrect, ex.explanation);
        show($('ev-next-btn'));

        $('ev-score-val').textContent = state.score;
        $('ev-streak-val').textContent = state.streak;
    }

    /** "Put the three forms in order": same scoring as a multiple choice answer (10 points, streak). */
    function handleOrder(values) {
        if (state.answered) return false;
        state.answered = true;
        const ex = state.groupPracticeExercises[state.groupPracticeIndex];
        const isCorrect = !!ex && Array.isArray(values) && values.length === ex.answer.length && values.every((v, i) => v === ex.answer[i]);
        state.totalAnswered++;
        if (isCorrect) {
            state.correct++; state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.score += 10;
        } else {
            state.streak = 0;
        }
        showFeedback(isCorrect, ex ? ex.explanation : '');
        show($('ev-next-btn'));
        $('ev-score-val').textContent = state.score;
        $('ev-streak-val').textContent = state.streak;
        return isCorrect;
    }

    // ── HUD ────────────────────────────────────────────────────────────
    function updateHUD() {
        if (state.groupPracticeMode) return; // handled separately in renderGroupPracticeQuestion

        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;
        $('ev-score-val').textContent = state.score;
        $('ev-streak-val').textContent = state.streak;

        let total = 0, current = 0;
        if (lvl.type === 'matching') {
            total = lvl.rounds.length * 5;
            current = state.roundIndex * 5 + state.matchedPairs;
        } else if (lvl.type === 'fill-blank') {
            total = lvl.exercises.length;
            current = state.exerciseIndex;
        } else if (lvl.type === 'audio-quiz') {
            total = lvl.stories.reduce((s, st) => s + st.questions.length, 0);
            current = state.totalAnswered;
        }

        $('ev-progress-val').textContent = `${Math.min(current + 1, total)}/${total}`;
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        $('ev-progress-fill').style.width = pct + '%';
        $('ev-progress-bar-wrap').setAttribute('aria-valuenow', pct);
    }

    // ── Question rendering dispatch ─────────────────────────────────────
    function renderQuestion() {
        if (state.groupPracticeMode) {
            renderGroupPracticeQuestion();
            return;
        }
        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;
        state.answered = false;
        $('ev-feedback').style.display = 'none';
        hide($('ev-next-btn'));

        if (lvl.type === 'matching')         renderMatching(lvl);
        else if (lvl.type === 'fill-blank')  renderFillBlank(lvl);
        else if (lvl.type === 'audio-quiz')  renderAudioQuiz(lvl);

        updateHUD();
    }

    // ── Level 1: Matching ──────────────────────────────────────────────
    function renderMatching(lvl) {
        const round = lvl.rounds[state.roundIndex];
        if (!round) { showResults(); return; }

        const rightShuffled = [...round.right].sort(() => Math.random() - 0.5);

        const leftHtml = round.left.map(w =>
            `<button class="ev-match-item" id="ev-left-${w}" onclick="EnglishVerbsGame.selectLeft('${w}')">${w}</button>`
        ).join('');
        const rightHtml = rightShuffled.map(w =>
            `<button class="ev-match-item" id="ev-right-${w}" onclick="EnglishVerbsGame.selectRight('${w}')">${w}</button>`
        ).join('');

        $('ev-question-area').innerHTML = `
            <div class="ev-match-round">
                ${t('round')} ${state.roundIndex + 1} / ${lvl.rounds.length}
                <span class="ev-match-hint">${t('connectHint')}</span>
            </div>
            <div class="ev-matching-area">
                <div class="ev-match-col ev-match-col-left">${leftHtml}</div>
                <div class="ev-match-col ev-match-col-right">${rightHtml}</div>
            </div>`;

        state.matchLeft = null;
        state.matchedPairs = 0;
    }

    function selectLeft(word) {
        document.querySelectorAll('.ev-match-item.selected').forEach(b => b.classList.remove('selected'));
        state.matchLeft = word;
        const btn = $('ev-left-' + word);
        if (btn) btn.classList.add('selected');
    }

    function selectRight(rightWord) {
        if (!state.matchLeft) return;
        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        const round = lvl.rounds[state.roundIndex];
        const expected = round.answers[state.matchLeft];
        const isCorrect = rightWord === expected;

        const leftBtn  = $('ev-left-'  + state.matchLeft);
        const rightBtn = $('ev-right-' + rightWord);

        if (isCorrect) {
            state.score += 10;
            state.correct++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.totalAnswered++;
            state.matchedPairs++;
            if (typeof EVDyn !== 'undefined') EVDyn.onPair(true, rightBtn);

            if (leftBtn) {
                leftBtn.classList.add('matched');
                leftBtn.disabled = true;
                leftBtn.classList.remove('selected');
            }
            if (rightBtn) {
                rightBtn.classList.add('matched');
                rightBtn.disabled = true;
            }
            state.matchLeft = null;

            if (state.matchedPairs >= round.left.length) {
                setTimeout(() => {
                    state.roundIndex++;
                    if (state.roundIndex >= lvl.rounds.length) {
                        showResults();
                    } else {
                        renderQuestion();
                    }
                }, 600);
            }
        } else {
            state.streak = 0;
            state.score = Math.max(0, state.score - 2);
            state.totalAnswered++;
            if (typeof EVDyn !== 'undefined') EVDyn.onPair(false, rightBtn);

            if (leftBtn) {
                leftBtn.classList.add('wrong-shake');
                setTimeout(() => leftBtn.classList.remove('wrong-shake'), 600);
                leftBtn.classList.remove('selected');
            }
            if (rightBtn) {
                rightBtn.classList.add('wrong-shake');
                setTimeout(() => rightBtn.classList.remove('wrong-shake'), 600);
            }
            state.matchLeft = null;
        }
        updateHUD();
    }

    // ── Level 2: Fill-blank ────────────────────────────────────────────
    function renderFillBlank(lvl) {
        const ex = lvl.exercises[state.exerciseIndex];
        if (!ex) { showResults(); return; }

        $('ev-question-area').innerHTML = `
            <div class="ev-question-card">
                <p class="ev-question-label">${t('fillLabel')}: <em>${ex.tense}</em></p>
                <div class="ev-fill-sentence">
                    <span>${ex.before} </span>
                    <input class="ev-fill-input" id="ev-fill-input" type="text"
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        placeholder="___" aria-label="${t('writeForm')}">
                    <span> ${ex.after}</span>
                </div>
                <p class="ev-translation">${ex.translation}</p>
            </div>
            <button class="ev-btn ev-btn-primary" id="ev-submit-btn" onclick="EnglishVerbsGame.handleFillBlank()">${t('check')}</button>`;

        const inp = $('ev-fill-input');
        if (inp) {
            inp.focus();
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') handleFillBlank();
            });
        }
    }

    function handleFillBlank() {
        if (state.answered) return;
        const inp = $('ev-fill-input');
        if (!inp) return;
        const given = inp.value.trim().toLowerCase();
        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        const ex = lvl.exercises[state.exerciseIndex];
        const isCorrect = given === ex.answer.toLowerCase();

        state.answered = true;
        state.totalAnswered++;

        if (isCorrect) {
            state.correct++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.score += lvl.scoring.correctPoints ?? 15;
        } else {
            state.streak = 0;
        }

        inp.classList.add(isCorrect ? 'correct' : 'wrong');
        inp.disabled = true;

        const submitBtn = $('ev-submit-btn');
        if (submitBtn) submitBtn.disabled = true;

        if (!isCorrect) inp.value = ex.answer;

        showFeedback(isCorrect, ex.explanation);
        show($('ev-next-btn'));
        updateHUD();
    }

    // ── Level 3: Audio Quiz ────────────────────────────────────────────
    function renderAudioQuiz(lvl) {
        const story = lvl.stories[state.storyIndex];
        if (!story) { showResults(); return; }
        const q = story.questions[state.questionIndex];
        if (!q) {
            state.storyIndex++;
            state.questionIndex = 0;
            renderAudioQuiz(lvl);
            return;
        }

        const isFirstQ = state.questionIndex === 0;
        const optionsHtml = q.options.map((opt, i) =>
            `<button class="ev-option-btn" onclick="EnglishVerbsGame.handleAudioQ('${encodeURIComponent(opt)}')"><kbd class="ev-key" aria-hidden="true">${i + 1}</kbd><span>${opt}</span></button>`
        ).join('');

        $('ev-question-area').innerHTML = `
            ${isFirstQ ? `
            <div class="ev-story-card">
                <div class="ev-story-header">
                    <h3>${story.title}</h3>
                    <button class="ev-tts-btn" id="ev-tts-story-btn" onclick="EnglishVerbsGame.listenStory()">
                        ${t('listenBtn')}
                    </button>
                </div>
                <p id="ev-story-text">${story.audio_text}</p>
            </div>` : ''}
            <div class="ev-question-card">
                <p class="ev-question-counter">${t('question')} ${state.questionIndex + 1} / ${story.questions.length}</p>
                <p class="ev-question-text">${q.question}</p>
            </div>
            <div class="ev-options">${optionsHtml}</div>`;
    }

    function listenStory() {
        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        const story = lvl?.stories[state.storyIndex];
        if (!story) return;

        const btn = $('ev-tts-story-btn');
        if (btn) { btn.classList.add('speaking'); btn.textContent = t('stopBtn'); }

        const utt = speak(story.audio_text);
        if (utt) {
            utt.onend = () => {
                if (btn) { btn.classList.remove('speaking'); btn.textContent = t('listenBtn'); }
            };
        }
    }

    function handleAudioQ(encodedOpt) {
        if (state.answered) return;
        state.answered = true;

        const opt = decodeURIComponent(encodedOpt);
        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        const story = lvl.stories[state.storyIndex];
        const q = story.questions[state.questionIndex];
        const isCorrect = opt === q.answer;

        state.totalAnswered++;
        if (isCorrect) {
            state.correct++;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            state.score += lvl.scoring.correctPoints ?? 20;
        } else {
            state.streak = 0;
            state.score = Math.max(0, state.score + (lvl.scoring.incorrectPoints ?? -5));
        }

        markOptions(q.answer, opt, isCorrect);

        showFeedback(isCorrect, q.explanation);
        show($('ev-next-btn'));
        updateHUD();
    }

    // ── Practice modes generated from the verb table ──────────────────
    const MODE_KINDS = ['past', 'part', 'meaning', 'type', 'listen', 'order', 'odd'];
    const MODE_ICONS = { past: '⏪', part: '✅', meaning: '🔤', type: '⌨️', listen: '🎧', order: '🔀', odd: '🕵️' };
    const REGULAR_VERBS = ['walk', 'play', 'jump', 'work', 'clean', 'open', 'watch', 'help', 'talk', 'cook', 'want', 'listen', 'dance', 'paint', 'visit', 'start', 'like', 'love', 'call', 'wash', 'learn', 'climb'];
    const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

    function regularForm(inf) { return inf.endsWith('e') ? inf + 'd' : inf + 'ed'; }

    function buildModeQuestions(kind, group) {
        const all = IRREGULAR_VERBS;
        const pool = shuffle(all.filter(v => (group === 'all' || v.group === group) && (kind !== 'order' || new Set([v.infinitive, v.past_simple, v.past_participle]).size > 1))).slice(0, 10);
        return pool.map(v => {
            const explanation = t('ex_form', { v: v.infinitive, p: v.past_simple, pp: v.past_participle }) + ' ' + t('ex_group', { g: v.group });
            if (kind === 'past' || kind === 'part') {
                const field = kind === 'past' ? 'past_simple' : 'past_participle';
                const answer = v[field];
                const wrong = new Set();
                const trap = regularForm(v.infinitive);
                if (trap !== answer) wrong.add(trap);
                shuffle(all).forEach(o => { if (wrong.size < 3 && o[field] !== answer) wrong.add(o[field]); });
                return {
                    sentence: t(kind === 'past' ? 'q_past' : 'q_part', { v: v.infinitive }),
                    options: shuffle([answer, ...Array.from(wrong).slice(0, 3)]), answer, explanation,
                };
            }
            if (kind === 'meaning' || kind === 'listen') {
                const wrong = shuffle(all.filter(o => o.infinitive !== v.infinitive)).slice(0, 3).map(o => o.infinitive);
                const ex = { options: shuffle([v.infinitive, ...wrong]), answer: v.infinitive, explanation };
                if (kind === 'meaning') {
                    ex.sentence = t('q_meaning', { m: meaningOf(v) || v.meaning_es });
                } else {
                    ex.sentence = t('q_listen');
                    ex.audio = Math.random() < 0.5 ? v.past_simple : v.past_participle;
                }
                return ex;
            }
            if (kind === 'order') {
                return {
                    type: 'order', sentence: t('q_order', { v: v.infinitive, m: meaningOf(v) || v.meaning_es }),
                    forms: shuffle([v.infinitive, v.past_simple, v.past_participle]), answer: [v.infinitive, v.past_simple, v.past_participle], explanation,
                };
            }
            if (kind === 'odd') {
                const reg = shuffle(REGULAR_VERBS).slice(0, 3);
                return { sentence: t('q_odd'), options: shuffle([v.infinitive, ...reg]), answer: v.infinitive, explanation: explanation + ' ' + t('ex_odd') };
            }
            // type
            return {
                type: 'type', sentence: t('q_type', { v: v.infinitive, m: meaningOf(v) || v.meaning_es }),
                answers: [v.past_simple, v.past_participle], explanation,
            };
        });
    }

    function startMode(kind) {
        const sel = $('ev-mode-group');
        const group = sel ? sel.value : 'all';
        const exercises = buildModeQuestions(kind, group);
        if (!exercises.length) return;
        state.genMode = kind;
        state.genGroup = group;
        state.groupPracticeMode = true;
        state.groupPracticeGroup = group === 'all' ? t('filterAll') : group;
        state.groupPracticeExercises = exercises;
        state.groupPracticeIndex = 0;
        state.score = 0; state.correct = 0; state.totalAnswered = 0;
        state.streak = 0; state.bestStreak = 0;
        state.startTime = Date.now();
        state.answered = false;
        state.level = 0;
        $('ev-level-badge').textContent = `${MODE_ICONS[kind]} ${t('mode_' + kind)}: ${state.groupPracticeGroup}`;
        updateHUD();
        renderGroupPracticeQuestion();
        showScreen('game');
    }

    function renderModes() {
        const grid = $('ev-mode-grid');
        if (!grid) return;
        const sel = $('ev-mode-group');
        if (sel) {
            const prev = sel.value || 'all';
            sel.innerHTML = [['all', t('filterAll')]].concat(Object.keys(GROUP_INFO).map(g => [g, g + ': ' + t('g_' + g + '_label')]))
                .map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
            sel.value = prev;
        }
        grid.innerHTML = MODE_KINDS.map(k => `<button class="ev-mode-card" onclick="EnglishVerbsGame.startMode('${k}')">
            <span class="ev-mode-ico">${MODE_ICONS[k]}</span><span class="ev-mode-name">${t('mode_' + k)}</span><span class="ev-mode-desc">${t('mode_' + k + '_d')}</span></button>`).join('');
    }

    function renderTypeQuestion(ex, current, total) {
        $('ev-question-area').innerHTML = `
            <div class="ev-question-card">
                <p class="ev-question-counter">${t('question')} ${current + 1} / ${total}</p>
                <p class="ev-question-text">${ex.sentence}</p>
                <div class="ev-type-grid">
                    <label for="ev-type-1">${t('typePast')}</label>
                    <input class="ev-fill-input" id="ev-type-1" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="___">
                    <label for="ev-type-2">${t('typePart')}</label>
                    <input class="ev-fill-input" id="ev-type-2" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="___">
                </div>
            </div>
            <button class="ev-btn ev-btn-primary" id="ev-submit-btn" onclick="EnglishVerbsGame.handleGenType()">${t('check')}</button>`;
        const i1 = $('ev-type-1'), i2 = $('ev-type-2');
        if (i1) i1.focus();
        i1?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); i2?.focus(); } });
        i2?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleGenType(); } });
    }

    function handleGenType() {
        if (state.answered) return;
        const ex = state.groupPracticeExercises[state.groupPracticeIndex];
        const i1 = $('ev-type-1'), i2 = $('ev-type-2');
        if (!ex || !i1 || !i2) return;
        state.answered = true;
        state.totalAnswered++;
        const ok1 = i1.value.trim().toLowerCase() === ex.answers[0];
        const ok2 = i2.value.trim().toLowerCase() === ex.answers[1];
        const both = ok1 && ok2;
        if (both) {
            state.correct++; state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
        } else {
            state.streak = 0;
        }
        state.score += (ok1 ? 5 : 0) + (ok2 ? 5 : 0);
        [[i1, ok1, ex.answers[0]], [i2, ok2, ex.answers[1]]].forEach(([inp, ok, ans]) => {
            inp.classList.add(ok ? 'correct' : 'wrong');
            inp.disabled = true;
            if (!ok) inp.value = ans;
        });
        const sb = $('ev-submit-btn'); if (sb) sb.disabled = true;
        showFeedback(both, ex.explanation);
        show($('ev-next-btn'));
        $('ev-score-val').textContent = state.score;
        $('ev-streak-val').textContent = state.streak;
    }

    // ── Feedback ───────────────────────────────────────────────────────
    function showFeedback(isCorrect, explanation) {
        const el = $('ev-feedback');
        if (!el) return;
        el.className = 'ev-feedback ' + (isCorrect ? 'correct' : 'wrong');
        el.textContent = isCorrect
            ? `\u2713 ${t('correctFb')}. ${explanation}`
            : `\u2717 ${t('wrongFb')}. ${explanation}`;
        el.style.display = 'block';
        if (typeof EVDyn !== 'undefined') EVDyn.onFeedback(isCorrect);
    }

    // ── Next question ──────────────────────────────────────────────────
    function nextQuestion() {
        if (state.groupPracticeMode) {
            state.groupPracticeIndex++;
            if (state.groupPracticeIndex >= state.groupPracticeExercises.length) {
                showResults();
            } else {
                renderGroupPracticeQuestion();
            }
            return;
        }

        const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
        if (!lvl) return;

        if (lvl.type === 'fill-blank') {
            state.exerciseIndex++;
            if (state.exerciseIndex >= lvl.exercises.length) { showResults(); return; }
        } else if (lvl.type === 'audio-quiz') {
            const story = lvl.stories[state.storyIndex];
            if (!story) { showResults(); return; }
            state.questionIndex++;
            if (state.questionIndex >= story.questions.length) {
                state.storyIndex++;
                state.questionIndex = 0;
                if (state.storyIndex >= lvl.stories.length) { showResults(); return; }
            }
        }
        renderQuestion();
    }

    // ── Results ────────────────────────────────────────────────────────
    function showResults() {
        const elapsed = Math.round((Date.now() - state.startTime) / 1000);
        const total = state.totalAnswered;
        const pct = total > 0 ? (state.correct / total) * 100 : 0;

        let passingScore = 60;
        if (!state.groupPracticeMode) {
            const lvl = ENGLISH_LEVELS.find(l => l.id === state.level);
            passingScore = lvl?.passingScore ?? 60;
        }
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= passingScore ? 1 : 0;

        $('ev-result-score').textContent = state.score;
        $('ev-result-correct').textContent = `${state.correct}/${total}`;
        $('ev-result-time').textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
        $('ev-result-level').textContent = state.genMode
            ? t('mode_' + state.genMode)
            : state.groupPracticeMode
                ? (state.groupPracticeGroup || 'Group')
                : state.level;
        $('ev-result-stars').innerHTML = [1, 2, 3].map(n =>
            `<span style="opacity:${stars >= n ? 1 : 0.25}">⭐</span>`
        ).join('');
        if (typeof EVDyn !== 'undefined') EVDyn.onResults(stars);

        const nextLvlBtn = $('ev-next-level-btn');
        if (state.groupPracticeMode || state.level >= ENGLISH_LEVELS.length) {
            hide(nextLvlBtn);
        } else {
            show(nextLvlBtn);
        }

        if (!state.groupPracticeMode) {
            saveLevelProgress(state.level, stars);
        }

        if (typeof PlatformFirestore !== 'undefined' &&
            typeof PlatformAuth !== 'undefined' &&
            PlatformAuth.currentUser) {
            PlatformFirestore.updateGameStats(PlatformAuth.currentUser.uid, 'englishVerbs', {
                correctAnswers: state.correct,
                totalQuestions: total,
                totalAttempts: total,
                bestStreak: state.bestStreak,
                elapsedSeconds: elapsed,
                level: state.groupPracticeMode ? 0 : state.level
            }).catch(() => {});
        }

        showScreen('results');
    }

    // ── Quit modal ─────────────────────────────────────────────────────
    function showQuitModal() {
        const modal = $('ev-quit-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.focus();
    }

    function hideQuitModal() {
        $('ev-quit-modal')?.classList.add('hidden');
    }

    // ── Init ───────────────────────────────────────────────────────────
    function init() {
        detectLang();
        applyStatic();
        renderHome();

        document.addEventListener('platformLanguageChanged', () => {
            detectLang();
            applyStatic();
            if ($('ev-screen-lesson')?.classList.contains('active')) renderLesson();
            renderVerbTable();
            renderGroupCards();
            renderLevelGrid();
            renderModes();
        });

        $('ev-table-toggle')?.addEventListener('click', () => {
            const body   = $('ev-table-body');
            const toggle = $('ev-table-toggle');
            const isOpen = !body.hidden;
            body.hidden  = isOpen;
            toggle.setAttribute('aria-expanded', String(!isOpen));
            toggle.querySelector('.ev-toggle-icon').textContent = isOpen ? '▼' : '▲';
        });

        // Tab buttons
        ['tabla', 'grupos', 'niveles'].forEach(tab => {
            $('ev-tabBtn-' + tab)?.addEventListener('click', () => showTab(tab));
        });

        // Verb search
        $('ev-verb-search')?.addEventListener('input', e => searchVerbs(e.target.value));

        $('ev-next-btn')?.addEventListener('click', nextQuestion);
        $('ev-lesson-skip')?.addEventListener('click', finishLesson);
        $('ev-lesson-open')?.addEventListener('click', openLesson);
        $('ev-quit-btn')?.addEventListener('click', showQuitModal);
        $('ev-quit-cancel')?.addEventListener('click', hideQuitModal);
        $('ev-quit-ok')?.addEventListener('click', () => { hideQuitModal(); renderHome(); });
        $('ev-retry-btn')?.addEventListener('click', () => {
            if (state.genMode) {
                startMode(state.genMode);
            } else if (state.groupPracticeMode) {
                startGroupPractice(state.groupPracticeGroup);
            } else {
                startLevel(state.level);
            }
        });
        $('ev-next-level-btn')?.addEventListener('click', () => {
            const next = state.level + 1;
            if (next <= ENGLISH_LEVELS.length) startLevel(next);
        });
        $('ev-menu-btn')?.addEventListener('click', renderHome);

        // Keyboard: Escape (quit), 1-4 (answers), Enter (next)
        document.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const modal = $('ev-quit-modal');
            const modalOpen = modal && !modal.classList.contains('hidden');
            const inGame = $('ev-screen-game')?.classList.contains('active');
            if (e.key === 'Escape' && $('ev-screen-lesson')?.classList.contains('active')) { renderHome(); return; }
            if (e.key === 'Escape') {
                if (modalOpen) hideQuitModal();
                else if (inGame) showQuitModal();
                return;
            }
            if (!inGame || modalOpen) return;
            const typing = e.target && e.target.tagName === 'INPUT';
            if (/^[1-4]$/.test(e.key) && !typing) {
                const btn = document.querySelectorAll('.ev-option-btn')[Number(e.key) - 1];
                if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
            } else if (e.key === 'Enter') {
                const next = $('ev-next-btn');
                if (next && !next.classList.contains('hidden') && e.target.tagName !== 'BUTTON') { e.preventDefault(); next.click(); }
            }
        });
    }

    return {
        init,
        startLevel,
        startGroupPractice,
        selectLeft,
        selectRight,
        handleFillBlank,
        handleAudioQ,
        handleGroupPracticeQ,
        handleGenType,
        handleOrder,
        _state: state,
        startMode,
        listenStory,
        speakVerb,
        searchVerbs,
        showTab,
        toggleGroupVerbs,
        openLesson
    };
})();
