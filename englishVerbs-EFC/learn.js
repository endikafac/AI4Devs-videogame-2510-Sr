/**
 * Irregular Verbs - "learn first" card: regular vs irregular past, three forms, 3 guided questions.
 * Pure data and logic (no DOM). Strings are merged into EV_I18N (loaded before this file).
 */
const EnglishVerbsLearn = (() => {
    'use strict';

    /** Three worked examples. Sentences are English on purpose (the language being learned). */
    const EXAMPLES = [
        { v: 'play', past: 'played', part: 'played', regular: true,
          uses: { base: 'I play football.', past: 'I played football yesterday.', part: 'I have played football.' } },
        { v: 'go', past: 'went', part: 'gone', regular: false,
          uses: { base: 'I go to school.', past: 'I went to school yesterday.', part: 'I have gone to school.' } },
        { v: 'see', past: 'saw', part: 'seen', regular: false,
          uses: { base: 'I see a bird.', past: 'I saw a bird yesterday.', part: 'I have seen a bird.' } }
    ];

    /** Three guided questions: a regular past, an irregular past and an irregular participle. */
    const TRY_QUESTIONS = [
        { v: 'walk', kind: 'past', regular: true, past: 'walked', part: 'walked', options: ['walked', 'walk', 'walking'] },
        { v: 'eat', kind: 'past', regular: false, past: 'ate', part: 'eaten', options: ['ate', 'eated', 'eat'] },
        { v: 'take', kind: 'part', regular: false, past: 'took', part: 'taken', options: ['taken', 'took', 'taked'] }
    ];

    const T = (o, lang) => o[lang] || o.es;
    const I18N = {
        es: {
            lrn_open: '📖 Lección: pasado regular o irregular', lrn_title: 'Antes de empezar: pasado regular o irregular',
            lrn_intro: 'Los verbos cuentan el pasado de dos maneras. Toca cada casilla para descubrir la forma.',
            lrn_regular_title: 'Regular: añade -ed', lrn_regular_text: 'Los verbos regulares forman el pasado añadiendo -ed: play → played.',
            lrn_irregular_title: 'Irregular: cambia', lrn_irregular_text: 'Los irregulares cambian y hay que aprenderlos: go → went.',
            lrn_forms_title: 'Las tres formas', lrn_forms_text: 'Cada verbo tiene tres formas: base, pasado y participio. Ejemplo: see → saw → seen.',
            lrn_tap: 'Toca para descubrir', lrn_form_base: 'Base', lrn_form_past: 'Pasado', lrn_form_part: 'Participio',
            lrn_tag_regular: 'regular', lrn_tag_irregular: 'irregular',
            lrn_try: 'Probar con 3 preguntas', lrn_try_title: 'Ahora tú: 3 preguntas con ayuda', lrn_try_hint: 'Si te equivocas, te explico por qué y lo intentas otra vez.',
            lrn_try_ok: '¡Correcto! {v} → {p} → {pp}', lrn_try_again: 'Inténtalo otra vez.', lrn_try_count: 'Pregunta {n} de {m}',
            lrn_next: 'Siguiente', lrn_skip: 'Saltar lección', lrn_start: 'Empezar el nivel 1', lrn_done: '¡Listo! Ya sabes la diferencia entre regular e irregular.',
            lrn_why_base: '"{chosen}" es la forma base. Para el pasado hay que cambiarla: {v} → {p} → {pp}.',
            lrn_why_form: '"{chosen}" es el pasado simple. Aquí hace falta el participio (con "have"): {v} → {p} → {pp}.',
            lrn_why_form2: '"{chosen}" es el participio. Para el pasado simple se usa otra forma: {v} → {p} → {pp}.',
            lrn_why_ed: '"{v}" es irregular: no lleva -ed. Hay que aprender sus formas: {v} → {p} → {pp}.',
            lrn_why_regular: '"{v}" es regular: el pasado se forma añadiendo -ed: {v} → {p}.',
            lrn_why_generic: 'Las formas correctas son: {v} → {p} → {pp}.'
        },
        en: {
            lrn_open: '📖 Lesson: regular or irregular past', lrn_title: 'Before you start: regular or irregular past',
            lrn_intro: 'Verbs talk about the past in two ways. Tap each box to discover the form.',
            lrn_regular_title: 'Regular: add -ed', lrn_regular_text: 'Regular verbs make the past by adding -ed: play → played.',
            lrn_irregular_title: 'Irregular: it changes', lrn_irregular_text: 'Irregular verbs change and you have to learn them: go → went.',
            lrn_forms_title: 'The three forms', lrn_forms_text: 'Every verb has three forms: base, past and past participle. Example: see → saw → seen.',
            lrn_tap: 'Tap to reveal', lrn_form_base: 'Base', lrn_form_past: 'Past', lrn_form_part: 'Past participle',
            lrn_tag_regular: 'regular', lrn_tag_irregular: 'irregular',
            lrn_try: 'Try 3 questions', lrn_try_title: 'Your turn: 3 guided questions', lrn_try_hint: 'If you get one wrong, I explain why and you try again.',
            lrn_try_ok: 'Correct! {v} → {p} → {pp}', lrn_try_again: 'Try again.', lrn_try_count: 'Question {n} of {m}',
            lrn_next: 'Next', lrn_skip: 'Skip lesson', lrn_start: 'Start level 1', lrn_done: 'Well done! You know the difference between regular and irregular.',
            lrn_why_base: '"{chosen}" is the base form. The past changes it: {v} → {p} → {pp}.',
            lrn_why_form: '"{chosen}" is the past simple. Here you need the past participle (after "have"): {v} → {p} → {pp}.',
            lrn_why_form2: '"{chosen}" is the past participle. The past simple uses another form: {v} → {p} → {pp}.',
            lrn_why_ed: '"{v}" is irregular: it does not take -ed. You have to learn its forms: {v} → {p} → {pp}.',
            lrn_why_regular: '"{v}" is regular: the past is made by adding -ed: {v} → {p}.',
            lrn_why_generic: 'The correct forms are: {v} → {p} → {pp}.'
        },
        eu: {
            lrn_open: '📖 Ikasgaia: iraganaldi erregularra edo irregularra', lrn_title: 'Hasi baino lehen: iraganaldi erregularra edo irregularra',
            lrn_intro: 'Aditzek iragana bi eratan kontatzen dute. Ukitu koadro bakoitza forma ezagutzeko.',
            lrn_regular_title: 'Erregularra: -ed gehitzen du', lrn_regular_text: 'Aditz erregularrek iragana -ed gehituz osatzen dute: play → played.',
            lrn_irregular_title: 'Irregularra: aldatu egiten da', lrn_irregular_text: 'Irregularrak aldatu egiten dira eta buruz ikasi behar dira: go → went.',
            lrn_forms_title: 'Hiru formak', lrn_forms_text: 'Aditz bakoitzak hiru forma ditu: oinarria, iragana eta partizipioa. Adibidea: see → saw → seen.',
            lrn_tap: 'Ukitu ikusteko', lrn_form_base: 'Oinarria', lrn_form_past: 'Iragana', lrn_form_part: 'Partizipioa',
            lrn_tag_regular: 'erregularra', lrn_tag_irregular: 'irregularra',
            lrn_try: 'Probatu 3 galderarekin', lrn_try_title: 'Zure txanda: 3 galdera laguntzarekin', lrn_try_hint: 'Huts egiten baduzu, zergatia azalduko dizut eta berriro saiatuko zara.',
            lrn_try_ok: 'Zuzena! {v} → {p} → {pp}', lrn_try_again: 'Saiatu berriro.', lrn_try_count: '{n}. galdera ({m}tik)',
            lrn_next: 'Hurrengoa', lrn_skip: 'Saltatu ikasgaia', lrn_start: 'Hasi 1. maila', lrn_done: 'Oso ongi! Erregularraren eta irregularraren aldea ezagutzen duzu.',
            lrn_why_base: '"{chosen}" oinarrizko forma da. Iraganerako aldatu egin behar da: {v} → {p} → {pp}.',
            lrn_why_form: '"{chosen}" iraganaldi sinplea da. Hemen partizipioa behar da ("have"-ren ondoren): {v} → {p} → {pp}.',
            lrn_why_form2: '"{chosen}" partizipioa da. Iraganaldi sinplean beste forma bat erabiltzen da: {v} → {p} → {pp}.',
            lrn_why_ed: '"{v}" irregularra da: ez du -ed hartzen. Bere formak ikasi behar dira: {v} → {p} → {pp}.',
            lrn_why_regular: '"{v}" erregularra da: iragana -ed gehituz egiten da: {v} → {p}.',
            lrn_why_generic: 'Forma zuzenak hauek dira: {v} → {p} → {pp}.'
        },
        gl: {
            lrn_open: '📖 Lección: pasado regular ou irregular', lrn_title: 'Antes de comezar: pasado regular ou irregular',
            lrn_intro: 'Os verbos contan o pasado de dúas maneiras. Toca cada caixa para descubrir a forma.',
            lrn_regular_title: 'Regular: engade -ed', lrn_regular_text: 'Os verbos regulares forman o pasado engadindo -ed: play → played.',
            lrn_irregular_title: 'Irregular: cambia', lrn_irregular_text: 'Os irregulares cambian e hai que aprendelos: go → went.',
            lrn_forms_title: 'As tres formas', lrn_forms_text: 'Cada verbo ten tres formas: base, pasado e participio. Exemplo: see → saw → seen.',
            lrn_tap: 'Toca para descubrir', lrn_form_base: 'Base', lrn_form_past: 'Pasado', lrn_form_part: 'Participio',
            lrn_tag_regular: 'regular', lrn_tag_irregular: 'irregular',
            lrn_try: 'Probar con 3 preguntas', lrn_try_title: 'Agora ti: 3 preguntas con axuda', lrn_try_hint: 'Se te equivocas, explícoche por que e tentas outra vez.',
            lrn_try_ok: 'Correcto! {v} → {p} → {pp}', lrn_try_again: 'Tenta outra vez.', lrn_try_count: 'Pregunta {n} de {m}',
            lrn_next: 'Seguinte', lrn_skip: 'Saltar lección', lrn_start: 'Comezar o nivel 1', lrn_done: 'Listo! Xa sabes a diferenza entre regular e irregular.',
            lrn_why_base: '"{chosen}" é a forma base. Para o pasado hai que cambiala: {v} → {p} → {pp}.',
            lrn_why_form: '"{chosen}" é o pasado simple. Aquí fai falta o participio (con "have"): {v} → {p} → {pp}.',
            lrn_why_form2: '"{chosen}" é o participio. Para o pasado simple úsase outra forma: {v} → {p} → {pp}.',
            lrn_why_ed: '"{v}" é irregular: non leva -ed. Hai que aprender as súas formas: {v} → {p} → {pp}.',
            lrn_why_regular: '"{v}" é regular: o pasado fórmase engadindo -ed: {v} → {p}.',
            lrn_why_generic: 'As formas correctas son: {v} → {p} → {pp}.'
        },
        ca: {
            lrn_open: '📖 Lliçó: passat regular o irregular', lrn_title: 'Abans de començar: passat regular o irregular',
            lrn_intro: 'Els verbs expliquen el passat de dues maneres. Toca cada casella per descobrir la forma.',
            lrn_regular_title: 'Regular: afegeix -ed', lrn_regular_text: 'Els verbs regulars formen el passat afegint -ed: play → played.',
            lrn_irregular_title: 'Irregular: canvia', lrn_irregular_text: 'Els irregulars canvien i cal aprendre\'ls: go → went.',
            lrn_forms_title: 'Les tres formes', lrn_forms_text: 'Cada verb té tres formes: base, passat i participi. Exemple: see → saw → seen.',
            lrn_tap: 'Toca per descobrir', lrn_form_base: 'Base', lrn_form_past: 'Passat', lrn_form_part: 'Participi',
            lrn_tag_regular: 'regular', lrn_tag_irregular: 'irregular',
            lrn_try: 'Prova amb 3 preguntes', lrn_try_title: 'Ara tu: 3 preguntes amb ajuda', lrn_try_hint: 'Si t\'equivoques, t\'explico per què i ho tornes a provar.',
            lrn_try_ok: 'Correcte! {v} → {p} → {pp}', lrn_try_again: 'Torna-ho a provar.', lrn_try_count: 'Pregunta {n} de {m}',
            lrn_next: 'Següent', lrn_skip: 'Salta la lliçó', lrn_start: 'Comença el nivell 1', lrn_done: 'Molt bé! Ja saps la diferència entre regular i irregular.',
            lrn_why_base: '"{chosen}" és la forma base. Per al passat cal canviar-la: {v} → {p} → {pp}.',
            lrn_why_form: '"{chosen}" és el passat simple. Aquí cal el participi (amb "have"): {v} → {p} → {pp}.',
            lrn_why_form2: '"{chosen}" és el participi. Per al passat simple s\'usa una altra forma: {v} → {p} → {pp}.',
            lrn_why_ed: '"{v}" és irregular: no porta -ed. Cal aprendre\'n les formes: {v} → {p} → {pp}.',
            lrn_why_regular: '"{v}" és regular: el passat es forma afegint -ed: {v} → {p}.',
            lrn_why_generic: 'Les formes correctes són: {v} → {p} → {pp}.'
        },
        fr: {
            lrn_open: '📖 Leçon : passé régulier ou irrégulier', lrn_title: 'Avant de commencer : passé régulier ou irrégulier',
            lrn_intro: 'Les verbes racontent le passé de deux façons. Touche chaque case pour découvrir la forme.',
            lrn_regular_title: 'Régulier : on ajoute -ed', lrn_regular_text: 'Les verbes réguliers forment le passé en ajoutant -ed : play → played.',
            lrn_irregular_title: 'Irrégulier : il change', lrn_irregular_text: 'Les irréguliers changent et il faut les apprendre : go → went.',
            lrn_forms_title: 'Les trois formes', lrn_forms_text: 'Chaque verbe a trois formes : base, passé et participe passé. Exemple : see → saw → seen.',
            lrn_tap: 'Touche pour découvrir', lrn_form_base: 'Base', lrn_form_past: 'Passé', lrn_form_part: 'Participe passé',
            lrn_tag_regular: 'régulier', lrn_tag_irregular: 'irrégulier',
            lrn_try: 'Essayer 3 questions', lrn_try_title: 'À toi : 3 questions guidées', lrn_try_hint: 'Si tu te trompes, je t\'explique pourquoi et tu réessaies.',
            lrn_try_ok: 'Correct ! {v} → {p} → {pp}', lrn_try_again: 'Réessaie.', lrn_try_count: 'Question {n} sur {m}',
            lrn_next: 'Suivant', lrn_skip: 'Passer la leçon', lrn_start: 'Commencer le niveau 1', lrn_done: 'Bravo ! Tu connais la différence entre régulier et irrégulier.',
            lrn_why_base: '« {chosen} » est la forme de base. Pour le passé, elle change : {v} → {p} → {pp}.',
            lrn_why_form: '« {chosen} » est le prétérit. Ici il faut le participe passé (après « have ») : {v} → {p} → {pp}.',
            lrn_why_form2: '« {chosen} » est le participe passé. Le prétérit utilise une autre forme : {v} → {p} → {pp}.',
            lrn_why_ed: '« {v} » est irrégulier : il ne prend pas -ed. Il faut apprendre ses formes : {v} → {p} → {pp}.',
            lrn_why_regular: '« {v} » est régulier : le passé se forme en ajoutant -ed : {v} → {p}.',
            lrn_why_generic: 'Les formes correctes sont : {v} → {p} → {pp}.'
        }
    };

    const fill = (s, vars) => Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(String(vars[k])), s);

    /** Why `chosen` is not the answer of question q. Returns { key, vars } (the caller translates). Pure. */
    function whyWrong(q, chosen) {
        const vars = { v: q.v, p: q.past, pp: q.part, chosen };
        if (chosen === q.v) return { key: 'lrn_why_base', vars };
        if (q.kind === 'part' && chosen === q.past && q.past !== q.part) return { key: 'lrn_why_form', vars };
        if (q.kind === 'past' && chosen === q.part && q.past !== q.part) return { key: 'lrn_why_form2', vars };
        if (!q.regular && /ed$/.test(chosen)) return { key: 'lrn_why_ed', vars };
        if (q.regular) return { key: 'lrn_why_regular', vars };
        return { key: 'lrn_why_generic', vars };
    }

    const answerOf = q => q.kind === 'past' ? q.past : q.part;
    /** Options of a question in a shuffled order (Fisher-Yates with the given rng). */
    function shuffledOptions(q, r = Math.random) {
        const a = q.options.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }

    // merge into the game dictionary when it is loaded
    if (typeof EV_I18N !== 'undefined') Object.keys(I18N).forEach(l => { if (EV_I18N[l]) Object.assign(EV_I18N[l], I18N[l]); });

    const api = { EXAMPLES, TRY_QUESTIONS, I18N, whyWrong, answerOf, shuffledOptions, fill };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
