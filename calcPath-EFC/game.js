/**
 * Camino del Cálculo - progressive arithmetic path (add, subtract, multiply).
 * 14 lessons of 10 exercises, 3 hearts, mistakes come back at the end (like Duolingo).
 * The generators are pure functions so they can be unit tested.
 */
const CalcPath = (() => {
    'use strict';

    // question engine (pure): window.CalcEngine in the browser, engine.js under Node
    const E = (typeof CalcEngine !== 'undefined') ? CalcEngine : (typeof require === 'function' ? require('./engine.js') : null);

    // ---- texts ----
    const UI = {
        es: { title: 'Camino del Cálculo', sub: 'Una lección corta cada día. Completa una para abrir la siguiente.', lesson: 'Lección', xp: 'XP', day: 'días',
              check: 'Comprobar', next: 'Continuar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La respuesta es', quit: 'Salir',
              qType: 'Escribe el resultado', qChoice: 'Elige el resultado', qMissing: 'Encuentra el número que falta', qCompare: 'Elige <, = o >', qTf: '¿Es verdadero?',
              qVisual: '¿Cuántos hay?', qBuild: n => `Elige la cuenta que da ${n}`, tTrue: 'Verdadero', tFalse: 'Falso',
              done: '¡Lección completada!', fail: 'Sin vidas. ¡Inténtalo otra vez!', again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino',
              score: (m) => m === 0 ? 'Sin ningún fallo. ¡Increíble!' : `${m} ${m === 1 ? 'fallo' : 'fallos'}. Cada error enseña algo.`, locked: 'Completa la anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar y restar', miss: 'Huecos', mul: 'Multiplicar' }, upto: 'hasta', carry: 'llevando', tables: 'tablas' },
        en: { title: 'Calculation Path', sub: 'One short lesson a day. Finish one to unlock the next.', lesson: 'Lesson', xp: 'XP', day: 'days',
              check: 'Check', next: 'Continue', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The answer is', quit: 'Quit',
              qType: 'Type the result', qChoice: 'Pick the result', qMissing: 'Find the missing number', qCompare: 'Pick <, = or >', qTf: 'Is it true?',
              qVisual: 'How many are there?', qBuild: n => `Pick the sum that makes ${n}`, tTrue: 'True', tFalse: 'False',
              done: 'Lesson complete!', fail: 'Out of hearts. Try again!', again: 'Try again', nextL: 'Next lesson', back: 'Back to the path',
              score: (m) => m === 0 ? 'No mistakes at all. Amazing!' : `${m} ${m === 1 ? 'mistake' : 'mistakes'}. Every error teaches something.`, locked: 'Finish the previous one',
              k: { add: 'Add', sub: 'Subtract', mix: 'Add and subtract', miss: 'Missing numbers', mul: 'Multiply' }, upto: 'up to', carry: 'with carrying', tables: 'tables' },
        eu: { title: 'Kalkulu bidea', sub: 'Egunero ikasgai labur bat. Bukatu bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP', day: 'egun',
              check: 'Egiaztatu', next: 'Jarraitu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Erantzuna hau da:', quit: 'Irten',
              qType: 'Idatzi emaitza', qChoice: 'Aukeratu emaitza', qMissing: 'Aurkitu falta den zenbakia', qCompare: 'Aukeratu <, = edo >', qTf: 'Egia al da?',
              qVisual: 'Zenbat daude?', qBuild: n => `Aukeratu ${n} ematen duen eragiketa`, tTrue: 'Egia', tFalse: 'Gezurra',
              done: 'Ikasgaia osatuta!', fail: 'Bizirik gabe. Saiatu berriro!', again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera',
              score: (m) => m === 0 ? 'Akatsik gabe. Harrigarria!' : `${m} akats. Akats bakoitzak zerbait irakasten du.`, locked: 'Bukatu aurrekoa',
              k: { add: 'Batu', sub: 'Kendu', mix: 'Batu eta kendu', miss: 'Hutsuneak', mul: 'Biderkatu' }, upto: 'arte', carry: 'eramanez', tables: 'taulak' },
        gl: { title: 'Camiño do Cálculo', sub: 'Unha lección curta cada día. Remata unha para abrir a seguinte.', lesson: 'Lección', xp: 'XP', day: 'días',
              check: 'Comprobar', next: 'Continuar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A resposta é', quit: 'Saír',
              qType: 'Escribe o resultado', qChoice: 'Elixe o resultado', qMissing: 'Atopa o número que falta', qCompare: 'Elixe <, = ou >', qTf: 'É verdade?',
              qVisual: 'Cantos hai?', qBuild: n => `Elixe a conta que dá ${n}`, tTrue: 'Verdade', tFalse: 'Falso',
              done: 'Lección completada!', fail: 'Sen vidas. Inténtao outra vez!', again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño',
              score: (m) => m === 0 ? 'Sen ningún fallo. Incrible!' : `${m} ${m === 1 ? 'fallo' : 'fallos'}. Cada erro ensina algo.`, locked: 'Completa a anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar e restar', miss: 'Ocos', mul: 'Multiplicar' }, upto: 'ata', carry: 'levando', tables: 'táboas' },
        ca: { title: 'Camí del Càlcul', sub: 'Una lliçó curta cada dia. Acaba\'n una per obrir la següent.', lesson: 'Lliçó', xp: 'XP', day: 'dies',
              check: 'Comprova', next: 'Continua', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. La resposta és', quit: 'Surt',
              qType: 'Escriu el resultat', qChoice: 'Tria el resultat', qMissing: 'Troba el número que falta', qCompare: 'Tria <, = o >', qTf: 'És veritat?',
              qVisual: 'Quants n\'hi ha?', qBuild: n => `Tria el compte que dona ${n}`, tTrue: 'Veritat', tFalse: 'Fals',
              done: 'Lliçó completada!', fail: 'Sense vides. Torna-ho a provar!', again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí',
              score: (m) => m === 0 ? 'Cap error. Increïble!' : `${m} ${m === 1 ? 'error' : 'errors'}. Cada error ensenya alguna cosa.`, locked: 'Acaba l\'anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar i restar', miss: 'Buits', mul: 'Multiplicar' }, upto: 'fins a', carry: 'amb llevades', tables: 'taules' },
        fr: { title: 'Le chemin du calcul', sub: 'Une courte leçon par jour. Terminez-en une pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP', day: 'jours',
              check: 'Vérifier', next: 'Continuer', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continuez !'], bad: 'Presque. La réponse est', quit: 'Quitter',
              qType: 'Écris le résultat', qChoice: 'Choisis le résultat', qMissing: 'Trouve le nombre manquant', qCompare: 'Choisis <, = ou >', qTf: 'Est-ce vrai ?',
              qVisual: 'Combien y en a-t-il ?', qBuild: n => `Choisis le calcul qui donne ${n}`, tTrue: 'Vrai', tFalse: 'Faux',
              done: 'Leçon terminée !', fail: 'Plus de vies. Réessaie !', again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin',
              score: (m) => m === 0 ? 'Aucune erreur. Incroyable !' : `${m} ${m === 1 ? 'erreur' : 'erreurs'}. Chaque erreur apprend quelque chose.`, locked: 'Termine la précédente',
              k: { add: 'Additionner', sub: 'Soustraire', mix: 'Additionner et soustraire', miss: 'Trous', mul: 'Multiplier' }, upto: 'jusqu\'à', carry: 'avec retenue', tables: 'tables' }
    };

    // ---- texts for free practice and the placement test (merged into UI, same keys in every language) ----
    const UI_PRACTICE = {
        es: { askGrade: '¿En qué curso estás?', dontKnow: 'No lo sé', gradeShort: n => `${n}º`, gradeLong: n => `${n}º de primaria`, yourGrade: 'Curso', change: 'Cambiar',
              mPractice: 'Practicar', mPracticeSub: 'Elige qué practicar. Los ejercicios salen al azar y no se repiten.', mPlace: 'Examen de nivel', mPlaceSub: 'Opcional, unos 3 minutos. Decide por dónde empezar en cada tema.',
              mPath: 'Camino de lecciones', setupTitle: 'Practicar', setGrade: 'Curso', setSkills: 'Qué quieres practicar', setAll: 'Todo', setLen: 'Cuántos ejercicios', lenInf: 'Sin fin',
              helpT: 'Ayuda extra', helpS: 'Pistas y números más fáciles', start: 'Empezar', hint: 'Pista', finish: 'Terminar', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Así se hace',
              psTitle: 'Sesión terminada', psRight: (r, n) => `${r} de ${n} correctas`, psAvg: s => `Tiempo medio: ${s} s`, psLevel: 'Nivel por tema', psMore: s => `Practica más: ${s}`, psGreat: '¡Todo muy bien! Prueba a subir de curso.',
              psAgain: 'Practicar otra vez', home: 'Inicio', plTitle: 'Examen de nivel', plIntro: 'Son unas 15 a 20 preguntas, unos 3 minutos. Es opcional: sirve para decidir por dónde empezar en cada tema. No hay pistas y no pasa nada si fallas.',
              plStart: 'Empezar examen', plCancel: 'Ahora no', plResult: 'Tu nivel', plStartAt: 'Empezar a practicar ahí', plLine: (s, g) => `Empieza en ${g}º de ${s}`, cancel: 'Cancelar',
              sk: { suma: 'Sumar', resta: 'Restar', multiplicar: 'Multiplicar', dividir: 'Dividir', mental: 'Cálculo mental', huecos: 'Huecos', fracciones: 'Fracciones', decimales: 'Decimales', porcentajes: 'Porcentajes' } },
        en: { askGrade: 'Which school year are you in?', dontKnow: 'I do not know', gradeShort: n => `Y${n}`, gradeLong: n => `Primary year ${n}`, yourGrade: 'Year', change: 'Change',
              mPractice: 'Practise', mPracticeSub: 'Pick what to practise. Exercises are random and never repeat.', mPlace: 'Level test', mPlaceSub: 'Optional, about 3 minutes. Decides where to start in each topic.',
              mPath: 'Lesson path', setupTitle: 'Practise', setGrade: 'Year', setSkills: 'What do you want to practise', setAll: 'All', setLen: 'How many exercises', lenInf: 'Endless',
              helpT: 'Extra help', helpS: 'Hints and easier numbers', start: 'Start', hint: 'Hint', finish: 'Finish', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Here is how',
              psTitle: 'Session finished', psRight: (r, n) => `${r} of ${n} correct`, psAvg: s => `Average time: ${s} s`, psLevel: 'Level by topic', psMore: s => `Practise more: ${s}`, psGreat: 'All great! Try moving up a year.',
              psAgain: 'Practise again', home: 'Home', plTitle: 'Level test', plIntro: 'About 15 to 20 questions, around 3 minutes. It is optional: it decides where to start in each topic. No hints, and it is fine to get things wrong.',
              plStart: 'Start the test', plCancel: 'Not now', plResult: 'Your level', plStartAt: 'Start practising there', plLine: (s, g) => `Starts at year ${g} of ${s}`, cancel: 'Cancel',
              sk: { suma: 'Add', resta: 'Subtract', multiplicar: 'Multiply', dividir: 'Divide', mental: 'Mental maths', huecos: 'Missing numbers', fracciones: 'Fractions', decimales: 'Decimals', porcentajes: 'Percentages' } },
        eu: { askGrade: 'Zein mailatan zaude?', dontKnow: 'Ez dakit', gradeShort: n => `${n}.`, gradeLong: n => `Lehen Hezkuntzako ${n}. maila`, yourGrade: 'Maila', change: 'Aldatu',
              mPractice: 'Praktikatu', mPracticeSub: 'Aukeratu zer praktikatu. Ariketak ausaz ateratzen dira eta ez dira errepikatzen.', mPlace: 'Maila proba', mPlaceSub: 'Aukerakoa, 3 minutu inguru. Gai bakoitzean nondik hasi erabakitzen du.',
              mPath: 'Ikasgaien bidea', setupTitle: 'Praktikatu', setGrade: 'Maila', setSkills: 'Zer praktikatu nahi duzu', setAll: 'Dena', setLen: 'Zenbat ariketa', lenInf: 'Amaigabea',
              helpT: 'Laguntza gehigarria', helpS: 'Pistak eta zenbaki errazagoak', start: 'Hasi', hint: 'Pista', finish: 'Amaitu', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Horrela egiten da',
              psTitle: 'Saioa amaituta', psRight: (r, n) => `${n}tik ${r} zuzen`, psAvg: s => `Batez besteko denbora: ${s} s`, psLevel: 'Maila gaika', psMore: s => `Praktikatu gehiago: ${s}`, psGreat: 'Oso ondo! Saiatu maila igotzen.',
              psAgain: 'Berriro praktikatu', home: 'Hasiera', plTitle: 'Maila proba', plIntro: '15-20 galdera inguru, 3 minutu gutxi gorabehera. Aukerakoa da: gai bakoitzean nondik hasi erabakitzeko balio du. Pistarik ez, eta ez da ezer gertatzen huts eginez gero.',
              plStart: 'Hasi proba', plCancel: 'Orain ez', plResult: 'Zure maila', plStartAt: 'Hortik hasi praktikatzen', plLine: (s, g) => `${s}: ${g}. mailatik hasten da`, cancel: 'Utzi',
              sk: { suma: 'Batu', resta: 'Kendu', multiplicar: 'Biderkatu', dividir: 'Zatitu', mental: 'Buruz kalkulatu', huecos: 'Hutsuneak', fracciones: 'Zatikiak', decimales: 'Hamartarrak', porcentajes: 'Ehunekoak' } },
        gl: { askGrade: 'En que curso estás?', dontKnow: 'Non o sei', gradeShort: n => `${n}º`, gradeLong: n => `${n}º de primaria`, yourGrade: 'Curso', change: 'Cambiar',
              mPractice: 'Practicar', mPracticeSub: 'Elixe que practicar. Os exercicios saen ao chou e non se repiten.', mPlace: 'Exame de nivel', mPlaceSub: 'Opcional, uns 3 minutos. Decide por onde empezar en cada tema.',
              mPath: 'Camiño de leccións', setupTitle: 'Practicar', setGrade: 'Curso', setSkills: 'Que queres practicar', setAll: 'Todo', setLen: 'Cantos exercicios', lenInf: 'Sen fin',
              helpT: 'Axuda extra', helpS: 'Pistas e números máis fáciles', start: 'Comezar', hint: 'Pista', finish: 'Rematar', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Así se fai',
              psTitle: 'Sesión rematada', psRight: (r, n) => `${r} de ${n} correctas`, psAvg: s => `Tempo medio: ${s} s`, psLevel: 'Nivel por tema', psMore: s => `Practica máis: ${s}`, psGreat: 'Todo moi ben! Proba a subir de curso.',
              psAgain: 'Practicar outra vez', home: 'Inicio', plTitle: 'Exame de nivel', plIntro: 'Son unhas 15 a 20 preguntas, uns 3 minutos. É opcional: serve para decidir por onde empezar en cada tema. Non hai pistas e non pasa nada se fallas.',
              plStart: 'Comezar o exame', plCancel: 'Agora non', plResult: 'O teu nivel', plStartAt: 'Comezar a practicar aí', plLine: (s, g) => `Empeza en ${g}º de ${s}`, cancel: 'Cancelar',
              sk: { suma: 'Sumar', resta: 'Restar', multiplicar: 'Multiplicar', dividir: 'Dividir', mental: 'Cálculo mental', huecos: 'Ocos', fracciones: 'Fraccións', decimales: 'Decimais', porcentajes: 'Porcentaxes' } },
        ca: { askGrade: 'En quin curs estàs?', dontKnow: 'No ho sé', gradeShort: n => `${n}r`, gradeLong: n => `${n}r de primària`, yourGrade: 'Curs', change: 'Canvia',
              mPractice: 'Practicar', mPracticeSub: 'Tria què practicar. Els exercicis surten a l\'atzar i no es repeteixen.', mPlace: 'Examen de nivell', mPlaceSub: 'Opcional, uns 3 minuts. Decideix per on començar en cada tema.',
              mPath: 'Camí de lliçons', setupTitle: 'Practicar', setGrade: 'Curs', setSkills: 'Què vols practicar', setAll: 'Tot', setLen: 'Quants exercicis', lenInf: 'Sense fi',
              helpT: 'Ajuda extra', helpS: 'Pistes i nombres més fàcils', start: 'Comença', hint: 'Pista', finish: 'Acaba', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Així es fa',
              psTitle: 'Sessió acabada', psRight: (r, n) => `${r} de ${n} correctes`, psAvg: s => `Temps mitjà: ${s} s`, psLevel: 'Nivell per tema', psMore: s => `Practica més: ${s}`, psGreat: 'Tot molt bé! Prova de pujar de curs.',
              psAgain: 'Practicar un altre cop', home: 'Inici', plTitle: 'Examen de nivell', plIntro: 'Són unes 15 a 20 preguntes, uns 3 minuts. És opcional: serveix per decidir per on començar en cada tema. No hi ha pistes i no passa res si falles.',
              plStart: 'Comença l\'examen', plCancel: 'Ara no', plResult: 'El teu nivell', plStartAt: 'Comença a practicar allà', plLine: (s, g) => `Comença en ${g}r de ${s}`, cancel: 'Cancel·la',
              sk: { suma: 'Sumar', resta: 'Restar', multiplicar: 'Multiplicar', dividir: 'Dividir', mental: 'Càlcul mental', huecos: 'Buits', fracciones: 'Fraccions', decimales: 'Decimals', porcentajes: 'Percentatges' } },
        fr: { askGrade: 'Dans quelle classe es-tu ?', dontKnow: 'Je ne sais pas', gradeShort: n => `${n}º`, gradeLong: n => `${n}º de primaria`, yourGrade: 'Classe', change: 'Changer',
              mPractice: 'S\'entraîner', mPracticeSub: 'Choisis quoi travailler. Les exercices sont au hasard et ne se répètent pas.', mPlace: 'Test de niveau', mPlaceSub: 'Facultatif, environ 3 minutes. Décide par où commencer dans chaque thème.',
              mPath: 'Chemin des leçons', setupTitle: 'S\'entraîner', setGrade: 'Classe', setSkills: 'Que veux-tu travailler', setAll: 'Tout', setLen: 'Combien d\'exercices', lenInf: 'Sans fin',
              helpT: 'Aide en plus', helpS: 'Indices et nombres plus faciles', start: 'Commencer', hint: 'Indice', finish: 'Terminer', qOf: (i, n) => n ? `${i} / ${n}` : `${i}`, how: 'Voici comment',
              psTitle: 'Séance terminée', psRight: (r, n) => `${r} sur ${n} correctes`, psAvg: s => `Temps moyen : ${s} s`, psLevel: 'Niveau par thème', psMore: s => `Travaille plus : ${s}`, psGreat: 'Très bien ! Essaie de monter d\'une classe.',
              psAgain: 'Recommencer', home: 'Accueil', plTitle: 'Test de niveau', plIntro: 'Environ 15 à 20 questions, 3 minutes. C\'est facultatif : cela décide par où commencer dans chaque thème. Pas d\'indices, et ce n\'est pas grave de se tromper.',
              plStart: 'Commencer le test', plCancel: 'Pas maintenant', plResult: 'Ton niveau', plStartAt: 'Commencer à s\'entraîner là', plLine: (s, g) => `Commence en ${g}º : ${s}`, cancel: 'Annuler',
              sk: { suma: 'Additionner', resta: 'Soustraire', multiplicar: 'Multiplier', dividir: 'Diviser', mental: 'Calcul mental', huecos: 'Trous', fracciones: 'Fractions', decimales: 'Décimaux', porcentajes: 'Pourcentages' } }
    };
    Object.keys(UI_PRACTICE).forEach(l => Object.assign(UI[l], UI_PRACTICE[l]));
    const SK_ICON = { suma: '➕', resta: '➖', multiplicar: '✖️', dividir: '➗', mental: '🧠', huecos: '🧩', fracciones: '🍕', decimales: '🔢', porcentajes: '💯' };

    // ---- lessons (progressive) ----
    // kind: add | sub | mix | miss | mul ; max: numeric ceiling ; carry: tens with carrying ; step: 100s
    const UNITS = [
        { id: 'a10',  icon: '🍎', kind: 'add',  max: 10 },
        { id: 's10',  icon: '🍌', kind: 'sub',  max: 10 },
        { id: 'm10',  icon: '🍇', kind: 'mix',  max: 10 },
        { id: 'a20',  icon: '🐣', kind: 'add',  max: 20 },
        { id: 's20',  icon: '🐟', kind: 'sub',  max: 20 },
        { id: 'm20',  icon: '🚀', kind: 'mix',  max: 20 },
        { id: 'h20',  icon: '🧩', kind: 'miss', max: 20 },
        { id: 'a100', icon: '🏠', kind: 'add',  max: 100, carry: false },
        { id: 'a100c', icon: '🎒', kind: 'add', max: 100, carry: true },
        { id: 's100c', icon: '⚓', kind: 'sub', max: 100, carry: true },
        { id: 'm100', icon: '🏔️', kind: 'mix',  max: 100, carry: true },
        { id: 'm1000', icon: '🌋', kind: 'mix', max: 1000 },
        { id: 'x25',  icon: '✖️', kind: 'mul',  max: 10, small: true },
        { id: 'x10',  icon: '🏆', kind: 'mul',  max: 10 }
    ];
    const LESSON_LEN = 10, HEARTS = 3;

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const calc = (a, op, b) => op === '+' ? a + b : op === '-' ? a - b : a * b;
    const OPSYM = { '+': '+', '-': '−', '*': '×' };

    /** Generate one operation for a lesson. Returns { a, op, b, res }. Pure. */
    function gen(u, r = Math.random) {
        let kind = u.kind === 'mix' || u.kind === 'miss' ? pick(['add', 'sub'], r) : u.kind;
        let a, b, op;
        if (kind === 'mul') {
            op = '*';
            if (u.small) { a = ri(1, 10, r); b = pick([2, 5, 10], r); if (r() < .5) [a, b] = [b, a]; }
            else { a = ri(2, 10, r); b = ri(2, 10, r); }
        } else if (u.max <= 20) {
            if (kind === 'add') { op = '+'; a = ri(1, u.max - 1, r); b = ri(1, u.max - a, r); }
            else { op = '-'; a = ri(2, u.max, r); b = ri(1, a, r); }
            if (u.max === 20 && Math.max(a, b) <= 9 && r() < .8) return gen(u, r); // 20: prefer teen numbers
        } else if (u.max === 100) {
            const carry = u.carry === undefined ? false : u.carry;
            if (kind === 'add') {
                op = '+';
                for (let i = 0; i < 80; i++) {
                    a = ri(11, 89, r); b = ri(11, 89, r);
                    const c = (a % 10) + (b % 10) >= 10;
                    if (a + b <= 99 && c === !!carry) break;
                }
            } else {
                op = '-';
                for (let i = 0; i < 80; i++) {
                    a = ri(21, 99, r); b = ri(11, a - 1, r);
                    if (((a % 10) < (b % 10)) === !!carry) break;
                }
            }
        } else {
            if (kind === 'add') { op = '+'; a = ri(100, 800, r); b = pick([ri(10, 99, r), ri(1, 9, r) * 100, ri(10, 50, r) * 10], r); if (a + b > 999) b = 999 - a; }
            else { op = '-'; a = ri(200, 999, r); b = pick([ri(10, 99, r), ri(1, 9, r) * 100, ri(10, 50, r) * 10], r); if (b >= a) b = ri(10, a - 1, r); }
        }
        return { a, op, b, res: calc(a, op, b) };
    }

    function distractors(res, r = Math.random, n = 3) {
        const set = new Set(), span = res > 100 ? [1, 2, 10, 100] : [1, 2, 3, 10];
        let guard = 0;
        while (set.size < n && guard++ < 60) {
            const d = pick(span, r) * (r() < .5 ? -1 : 1), v = res + d;
            if (v >= 0 && v !== res) set.add(v);
        }
        let k = 1; while (set.size < n) { if (res + k !== res) set.add(res + k); k++; }
        return [...set];
    }

    /** Question kinds allowed per lesson kind. */
    function typesFor(u) {
        if (u.kind === 'miss') return ['missing', 'missing', 'type', 'tf', 'compare'];
        if (u.kind === 'mul') return ['type', 'choice', 'missing', 'tf', 'build', u.small ? 'choice' : 'compare'];
        if (u.max <= 10) return ['visual', 'type', 'choice', 'tf', 'compare', 'build', 'missing'];
        if (u.max <= 20) return ['type', 'choice', 'missing', 'compare', 'tf', 'build', 'visual'];
        return ['type', 'choice', 'missing', 'compare', 'tf', 'build'];
    }

    /** Build a full question object (pure, no DOM). */
    function makeQuestion(u, type, r = Math.random) {
        const o = gen(u, r);
        const q = { type, a: o.a, op: o.op, b: o.b, res: o.res, unit: u.id };
        if (type === 'visual' && !(o.op !== '*' && o.a <= 10 && o.b <= 10 && o.res <= 20)) q.type = type = pick(['choice', 'type'], r);
        if (type === 'choice') q.options = shuffle([o.res, ...distractors(o.res, r)], r);
        if (type === 'visual') q.options = shuffle([o.res, ...distractors(o.res, r)], r);
        if (type === 'missing') { q.hole = o.op === '*' || r() < .5 ? 'b' : 'a'; q.answer = q.hole === 'b' ? o.b : o.a; }
        if (type === 'compare') {
            const delta = pick([-2, -1, 0, 0, 1, 2], r); q.other = Math.max(0, o.res + delta);
            q.answer = o.res < q.other ? '<' : o.res > q.other ? '>' : '=';
        }
        if (type === 'tf') {
            const truth = r() < .5; q.shown = truth ? o.res : Math.max(0, o.res + pick([-3, -2, -1, 1, 2, 3, 10, -10], r));
            if (q.shown === o.res) q.shown = o.res + (truth ? 0 : 1);
            q.answer = q.shown === o.res;
        }
        if (type === 'build') {
            const opts = [o]; let g = 0;
            while (opts.length < 4 && g++ < 80) { const x = gen(u, r); if (x.res !== o.res && !opts.some(y => y.a === x.a && y.b === x.b && y.op === x.op)) opts.push(x); }
            q.exprs = shuffle(opts, r).map(x => ({ a: x.a, op: x.op, b: x.b, ok: x.res === o.res }));
        }
        return q;
    }

    function makeLesson(u, r = Math.random) {
        const types = typesFor(u), out = []; let last = '';
        for (let i = 0; i < LESSON_LEN; i++) {
            let t, g = 0; do { t = pick(types, r); } while (t === last && g++ < 8);
            last = t; out.push(makeQuestion(u, t, r));
        }
        return out;
    }

    /** Is the typed/selected answer right? Pure. */
    function isCorrect(q, v) {
        switch (q.type) {
            case 'type': case 'choice': case 'visual': return Number(v) === q.res;
            case 'missing': return Number(v) === q.answer;
            case 'compare': return v === q.answer;
            case 'tf': return v === q.answer;
            case 'build': return !!(q.exprs[v] && q.exprs[v].ok);
        }
        return false;
    }
    const stars = misses => misses === 0 ? 3 : misses <= 2 ? 2 : 1;

    // ---- state / storage ----
    const S = { user: null, prog: { units: {}, xp: 0, streak: 0, last: '' }, u: null, queue: [], total: 0, hearts: HEARTS, misses: 0, q: null, typed: '', locked: false, t0: 0, practice: null };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'calc_prog_' + owner();
    function load() { try { S.prog = Object.assign({ units: {}, xp: 0, streak: 0, last: '' }, JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = { units: {}, xp: 0, streak: 0, last: '' }; } }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

    function unitName(u) {
        const t = T(), k = t.k[u.kind];
        if (u.kind === 'mul') return u.small ? `${k}: ×2, ×5, ×10` : `${k} (${t.tables})`;
        if (u.kind === 'miss') return `${k} ${t.upto} ${u.max}`;
        if (u.max === 100) return u.carry ? `${k} ${t.upto} 100 (${t.carry})` : `${k} ${t.upto} 100`;
        return `${k} ${t.upto} ${u.max}`;
    }
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];

    // ---- home ----
    function show(id) { ['cp-home', 'cp-play', 'cp-end', 'cp-setup', 'cp-pintro', 'cp-pplay', 'cp-psum', 'cp-pres'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('cp-h1').textContent = t.title; $('cp-sub').textContent = t.sub; renderModes();
        const st = $('cp-stats'); st.textContent = '';
        st.appendChild(el('span', 'cp-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'cp-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('cp-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'cp-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'cp-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${unitName(u)}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'cp-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, unitName(u)));
            if (done) info.appendChild(el('div', 'cp-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info); path.appendChild(li);
        });
    }

    // ---- lesson ----
    function start(i) {
        S.idx = i; S.u = UNITS[i]; S.queue = makeLesson(S.u); S.total = S.queue.length; S.hearts = HEARTS; S.misses = 0; S.done = 0; S.streak = 0; S.t0 = Date.now();
        show('cp-play'); next();
    }
    function hearts() { $('cp-hearts').textContent = '❤️'.repeat(S.hearts) + '🖤'.repeat(HEARTS - S.hearts); $('cp-hearts').setAttribute('aria-label', S.hearts + ' / ' + HEARTS); }
    function bar() { const p = Math.round(S.done / S.total * 100); $('cp-barfill').style.width = p + '%'; $('cp-barfill').parentNode.setAttribute('aria-valuenow', p); }
    const sym = o => OPSYM[o];
    function eqHTML(q, hole) {
        const w = el('div', 'cp-eq'); w.setAttribute('dir', 'ltr');
        [hole === 'a' ? null : q.a, sym(q.op), hole === 'b' ? null : q.b, '=', hole ? q.res : null].forEach(p => {
            if (p === null) w.appendChild(el('em', null, '?')); else w.appendChild(document.createTextNode(p));
            w.appendChild(document.createTextNode(' '));
        });
        return w;
    }

    // ---- presentation: labelled zones, coloured answers, new formats (see dyn.js) ----
    const D = () => (typeof CalcDyn !== 'undefined' ? CalcDyn : null);
    const JX = () => (typeof Juice !== 'undefined' ? Juice : null);
    const OPICON = { '+': '➕', '-': '➖', '*': '✖️' };
    function lessonHow(q, full) {
        const f = full ? ` ${q.a} ${sym(q.op)} ${q.b} = ${q.res}` : '';
        if (q.op === '+') return { es: `Empieza en ${q.a} y avanza ${q.b}.${f}`, en: `Start at ${q.a} and move ${q.b} forward.${f}` };
        if (q.op === '-') return { es: `Empieza en ${q.a} y retrocede ${q.b}.${f}`, en: `Start at ${q.a} and go back ${q.b}.${f}` };
        return { es: `${q.a} × ${q.b} es sumar ${q.a}, ${q.b} veces.${f}`, en: `${q.a} × ${q.b} means adding ${q.a}, ${q.b} times.${f}` };
    }

    function next() {
        $('cp-feedback').hidden = true; S.locked = false; S.typed = '';
        if (!S.queue.length) return finish(true);
        S.q = S.queue[0]; bar(); hearts();
        const t = T(), q = S.q, card = $('cp-card'), d = D(), dt = d.T(); card.textContent = '';
        card.classList.remove('cp-shake');
        $('cp-qn').textContent = dt.qn(Math.min(S.done + 1, S.total), S.total);
        d.setStreak($('cp-streak'), S.streak || 0); d.setHelp($('cp-help'));
        $('cp-help').onclick = () => {
            if (S.locked || $('cp-hint')) return;
            const h = el('p', 'cp-hint', txt(lessonHow(q, false))); h.id = 'cp-hint';
            const z = card.querySelector('.cp-zone.a'); card.insertBefore(h, z || null);
        };
        d.zone(card, OPICON[q.op] || '❓', dt.zQ, 'q');
        const prompt = { type: t.qType, choice: t.qChoice, missing: t.qMissing, compare: t.qCompare, tf: t.qTf, visual: t.qVisual }[q.type] || t.qBuild(q.res);
        card.appendChild(el('p', 'cp-prompt', q.type === 'build' ? t.qBuild(q.res) : prompt));
        const alt = S.done % 2 === 1, balloonOn = S.fmt ? S.fmt === 'balloon' : alt, dragOn = S.fmt ? S.fmt === 'drag' : !alt;
        const listOf = vals => vals.map(v => ({ label: String(v), v }));
        if (q.type === 'type') { card.appendChild(eqHTML(q)); d.zone(card, '✍️', dt.zType, 'a'); answerPad(card); }
        else if (q.type === 'choice') { card.appendChild(eqHTML(q)); choose(card, listOf(q.options), balloonOn); }
        else if (q.type === 'missing') {
            const eq = eqHTML(q, q.hole); card.appendChild(eq);
            if (dragOn) { const vals = shuffle([q.answer, ...distractors(q.answer)]); d.zone(card, '🧲', dt.zDrag, 'a'); d.dragFill(card, eq.querySelector('em'), listOf(vals), answer); }
            else { d.zone(card, '✍️', dt.zType, 'a'); answerPad(card); }
        }
        else if (q.type === 'visual') {
            const vis = el('div', 'cp-vis'), em = ['🍎', '🍌', '🍇', '🐟', '⭐', '🚗', '🐥'][(q.a + q.b) % 7];
            vis.appendChild(el('span', null, em.repeat(q.a)));
            vis.appendChild(el('i', null, q.op === '+' ? '+' : '−'));
            vis.appendChild(el('span', null, q.op === '+' ? em.repeat(q.b) : '❌'.repeat(q.b)));
            vis.setAttribute('role', 'img'); vis.setAttribute('aria-label', `${q.a} ${sym(q.op)} ${q.b}`);
            card.appendChild(vis); card.appendChild(eqHTML(q)); choose(card, listOf(q.options), balloonOn);
        }
        else if (q.type === 'compare') {
            const e = el('div', 'cp-eq'); e.textContent = `${q.a} ${sym(q.op)} ${q.b}   ?   ${q.other}`; card.appendChild(e);
            d.zone(card, '👆', dt.zChoose, 'a'); options(card, ['<', '=', '>'].map(v => ({ label: v, v })));
        }
        else if (q.type === 'tf') {
            const e = el('div', 'cp-eq'); e.textContent = `${q.a} ${sym(q.op)} ${q.b} = ${q.shown}`; card.appendChild(e);
            d.zone(card, '👆', dt.zChoose, 'a'); options(card, [{ label: t.tTrue, v: true }, { label: t.tFalse, v: false }], true);
        }
        else if (q.type === 'build') { d.zone(card, '👆', dt.zChoose, 'a'); options(card, q.exprs.map((x, i) => ({ label: `${x.a} ${sym(x.op)} ${x.b}`, v: i })), true); }
        d.enter(card);
    }

    /** choice-like question: coloured buttons or floating balloons (same options, same scoring). */
    function choose(card, list, balloon) {
        const d = D(), dt = d.T();
        if (balloon) { d.zone(card, '🎈', dt.zPop, 'a'); d.balloons(card, list, answer); }
        else { d.zone(card, '👆', dt.zChoose, 'a'); options(card, list); }
    }

    function options(card, list, wide) {
        const box = el('div', 'cp-opts' + (wide ? ' wide' : '')); box.setAttribute('role', 'group');
        list.forEach((o, i) => { const b = D().optButton(o.label, o.v, i); b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(box);
    }

    function answerPad(card) {
        const disp = el('div', 'cp-ans'); disp.id = 'cp-ans'; disp.setAttribute('aria-live', 'polite'); card.appendChild(disp);
        const pad = el('div', 'cp-pad');
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(k => {
            const b = el('button', 'cp-key' + (k === '✓' ? ' go' : ''), k); b.type = 'button';
            b.setAttribute('aria-label', k === '⌫' ? 'Borrar' : k === '✓' ? T().check : k);
            b.onclick = () => key_(k); pad.appendChild(b);
        });
        card.appendChild(pad);
    }
    function key_(k) {
        if (S.locked) return;
        if (k === '⌫') S.typed = S.typed.slice(0, -1);
        else if (k === '✓') { if (S.typed !== '') answer(Number(S.typed)); return; }
        else if (S.typed.length < 4) S.typed += k;
        const d = $('cp-ans'); if (d) d.textContent = S.typed;
    }

    function correctText(q) {
        if (q.type === 'missing') return String(q.answer);
        if (q.type === 'compare') return `${q.a} ${sym(q.op)} ${q.b} ${q.answer} ${q.other}`;
        if (q.type === 'tf') return `${q.a} ${sym(q.op)} ${q.b} = ${q.res}`;
        if (q.type === 'build') { const x = q.exprs.find(e => e.ok); return `${x.a} ${sym(x.op)} ${x.b} = ${q.res}`; }
        return String(q.res);
    }

    /** Find the option button that holds the right answer (lesson cards). */
    function correctButton(q, card) {
        const want = q.type === 'build' ? String(q.exprs.findIndex(e => e.ok)) : q.type === 'missing' ? String(q.answer) : q.type === 'compare' || q.type === 'tf' ? String(q.answer) : String(q.res);
        return Array.prototype.find.call(card.querySelectorAll('button.cp-opt'), b => b.dataset.v === want) || null;
    }

    function answer(v, btn) {
        if (S.locked) return; S.locked = true;
        const q = S.q, ok = isCorrect(q, v), t = T(), fb = $('cp-feedback'), d = D(), j = JX(), card = $('cp-card'), dt = d.T();
        card.querySelectorAll('.cp-opt').forEach(b => { b.disabled = true; });
        card.querySelectorAll('.cp-sky').forEach(s => s.classList.add('done'));
        const hole = card.querySelector('.cp-hole'); if (hole) hole.classList.add(ok ? 'ok' : 'bad');
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (!ok) { const c = correctButton(q, card); if (c) c.classList.add('ok'); }
        S.streak = ok ? (S.streak || 0) + 1 : 0; d.setStreak($('cp-streak'), S.streak);
        fb.hidden = false; fb.textContent = ''; fb.className = 'cp-feedback ' + (ok ? 'good' : 'bad');
        fb.appendChild(el('span', 'cp-fbi', ok ? '✅' : '💡'));
        const box = el('div', 'cp-fbt'); box.appendChild(el('b', null, ok ? pick(t.good) : t.bad));
        if (!ok) { box.appendChild(el('span', 'cp-fbans', correctText(q))); box.appendChild(el('span', 'cp-explain', `${dt.why}: ${txt(lessonHow(q, true))}`)); }
        else if (S.streak >= 3) box.appendChild(el('span', 'cp-explain', `🔥 ${dt.streak}: ${S.streak}`));
        const go = el('button', 'cp-btn', t.next); go.type = 'button'; go.id = 'cp-continue'; go.onclick = () => { advance(ok); };
        fb.appendChild(box); fb.appendChild(go); go.focus();
        if (j) { if (ok) j.correct(btn || card, { streak: S.streak }); else j.wrong(btn || card); }
        if (!ok) card.classList.add('cp-shake');
        S.lastOk = ok;
    }
    function advance(ok) {
        const q = S.queue.shift();
        if (ok) S.done++;
        else {
            S.misses++; S.hearts--; hearts();
            if (S.hearts <= 0) return finish(false);
            S.queue.push(makeQuestion(S.u, pick(typesFor(S.u)))); // a fresh one of the same lesson comes back at the end
        }
        next();
    }

    async function finish(won) {
        const t = T(), st = stars(S.misses);
        $('cp-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '💔';
        $('cp-endtitle').textContent = won ? t.done : t.fail;
        $('cp-endtext').textContent = won ? t.score(S.misses) : '';
        if (won && D()) D().stars($('cp-endstars'), st, 3, () => { if (JX()) JX().levelUp($('cp-trophy')); }); else $('cp-endstars').textContent = '';
        $('cp-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('cp-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('cp-home'); } else start(S.idx); };
        $('cp-back').textContent = t.back; $('cp-back').onclick = () => { renderHome(); show('cp-home'); };
        show('cp-end');
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        const gained = 10 + st * 5; S.prog.xp = (S.prog.xp || 0) + gained;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'calcpath', {
                    correctAnswers: S.total, totalQuestions: S.total + S.misses, totalAttempts: S.total + S.misses, bestStreak: S.total - S.misses > 0 ? S.total : 0,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.kind });
            } catch (e) { console.warn('[CalcPath] stats not saved', e); }
        }
    }

    // =====================================================================
    // Free practice, adaptive level and placement test (uses CalcEngine)
    // =====================================================================
    const P = { cfg: {}, states: {}, seen: null, run: null };
    const cfgKey = () => 'calc_cfg_' + owner();
    const skKey = () => 'calc_skills_' + owner();
    const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
    const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
    function loadPractice() {
        P.cfg = readJSON(cfgKey(), {}); P.states = readJSON(skKey(), {});
        P.seen = E ? E.SeenStore(localStorage, owner()) : null;
    }
    const saveCfg = () => writeJSON(cfgKey(), P.cfg);
    const saveSkills = () => writeJSON(skKey(), P.states);
    const gradeOk = g => Number.isInteger(g) && g >= 1 && g <= 6;
    const txt = o => { if (!o) return ''; const l = lang(); return (l === 'en' || l === 'fr') ? o.en : o.es; };
    /** Numbers for people: decimal comma (except English), thin spaces in long integers. */
    function fmtTxt(s) {
        const comma = lang() !== 'en';
        return String(s).replace(/\d+(?:\.\d+)?/g, tok => {
            if (tok.indexOf('.') >= 0) return comma ? tok.replace('.', ',') : tok;
            return tok.length >= 5 ? tok.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : tok;
        });
    }
    function effectiveCfg() {
        const c = P.cfg, grade = gradeOk(c.grade) ? c.grade : 3, avail = E.skillsForGrade(grade);
        let skills = (c.skills || []).filter(id => avail.includes(id));
        if (!skills.length) skills = avail.slice();
        return { grade, skills, length: c.length === 0 || c.length === 10 || c.length === 20 ? c.length : 10, help: c.helpSet ? !!c.help : grade <= 2 };
    }

    // ---- grade question (inline card on the home screen, never a blocking modal) ----
    function gradeChips(box, onPick, current) {
        box.textContent = '';
        const t = T();
        for (let g = 1; g <= 6; g++) {
            const b = el('button', 'cp-chip' + (current === g ? ' on' : ''), t.gradeShort(g)); b.type = 'button'; b.dataset.grade = g;
            b.setAttribute('aria-pressed', current === g ? 'true' : 'false'); b.setAttribute('aria-label', t.gradeLong(g));
            b.onclick = () => onPick(g); box.appendChild(b);
        }
    }
    function setGrade(g, guessed) {
        P.cfg.grade = g; if (guessed) P.cfg.guessed = true; else delete P.cfg.guessed;
        saveCfg(); renderHome();
    }
    async function guessGrade() {
        let age = Number(P.cfg.age) || 0;
        try {
            if (!age && S.user && PlatformFirestore.getActivePlayer) {
                const p = await PlatformFirestore.getActivePlayer(S.user.uid);
                if (p) age = Number(p.age) || (p.birthYear ? new Date().getFullYear() - Number(p.birthYear) : 0);
            }
        } catch (e) { /* no profile data: fall back */ }
        setGrade(age >= 6 && age <= 12 ? Math.min(6, Math.max(1, age - 5)) : 3, true);
    }
    function renderModes() {
        const t = T(), ok = gradeOk(P.cfg.grade);
        $('cp-ask').hidden = ok;
        if (!ok) { $('cp-ask-t').textContent = t.askGrade; gradeChips($('cp-ask-chips'), g => setGrade(g)); const dk = el('button', 'cp-chip dk', t.dontKnow); dk.type = 'button'; dk.id = 'cp-ask-dk'; dk.onclick = guessGrade; $('cp-ask-chips').appendChild(dk); }
        $('cp-m-practice-t').textContent = t.mPractice; $('cp-m-practice-s').textContent = t.mPracticeSub;
        $('cp-m-place-t').textContent = t.mPlace; $('cp-m-place-s').textContent = t.mPlaceSub;
        $('cp-path-h').textContent = t.mPath;
        const line = $('cp-grade-line'); line.hidden = !ok; line.textContent = '';
        if (ok) { line.appendChild(el('span', null, `${t.yourGrade}: ${t.gradeLong(P.cfg.grade)}`)); const ch = el('button', 'cp-link', t.change); ch.type = 'button'; ch.id = 'cp-grade-change'; ch.onclick = openSetup; line.appendChild(ch); }
    }
    function needGrade() {
        if (gradeOk(P.cfg.grade)) return false;
        const a = $('cp-ask'); a.scrollIntoView({ block: 'center' }); a.classList.remove('cp-shake'); void a.offsetWidth; a.classList.add('cp-shake'); return true;
    }

    // ---- practice setup ----
    function openSetup() { if (needGrade()) return; renderSetup(); show('cp-setup'); }
    function renderSetup() {
        const t = T(), c = effectiveCfg();
        $('cp-setup-h').textContent = t.setupTitle; $('cp-set-gh').textContent = t.setGrade; $('cp-set-sh').textContent = t.setSkills; $('cp-set-lh').textContent = t.setLen;
        $('cp-help-t').textContent = t.helpT; $('cp-help-s').textContent = t.helpS; $('cp-set-go').textContent = t.start;
        gradeChips($('cp-set-grade'), g => {
            P.cfg.grade = g; delete P.cfg.guessed; P.cfg.skills = E.skillsForGrade(g); saveCfg(); renderSetup();
        }, c.grade);
        const sk = $('cp-set-skills'); sk.textContent = '';
        const avail = E.skillsForGrade(c.grade);
        const all = el('button', 'cp-chip all' + (c.skills.length === avail.length ? ' on' : ''), t.setAll); all.type = 'button'; all.id = 'cp-set-all'; all.setAttribute('aria-pressed', c.skills.length === avail.length ? 'true' : 'false');
        all.onclick = () => { P.cfg.grade = c.grade; P.cfg.skills = avail.slice(); saveCfg(); renderSetup(); };
        sk.appendChild(all);
        avail.forEach(id => {
            const on = c.skills.includes(id), b = el('button', 'cp-chip skill' + (on ? ' on' : ''), `${SK_ICON[id]} ${t.sk[id]}`); b.type = 'button'; b.dataset.skill = id; b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.onclick = () => {
                const cur = c.skills.slice(), i = cur.indexOf(id);
                if (i >= 0) { if (cur.length === 1) return; cur.splice(i, 1); } else cur.push(id);
                P.cfg.grade = c.grade; P.cfg.skills = cur; saveCfg(); renderSetup();
            };
            sk.appendChild(b);
        });
        const ln = $('cp-set-len'); ln.textContent = '';
        [[10, '10'], [20, '20'], [0, t.lenInf]].forEach(([v, label]) => {
            const b = el('button', 'cp-chip' + (c.length === v ? ' on' : ''), label); b.type = 'button'; b.dataset.len = v; b.setAttribute('aria-pressed', c.length === v ? 'true' : 'false');
            b.onclick = () => { P.cfg.length = v; saveCfg(); renderSetup(); }; ln.appendChild(b);
        });
        const hp = $('cp-set-help'); hp.checked = c.help;
        hp.onchange = () => { P.cfg.help = hp.checked; P.cfg.helpSet = true; saveCfg(); };
        $('cp-set-go').onclick = () => { const e = effectiveCfg(); Object.assign(P.cfg, { grade: e.grade, skills: e.skills, length: e.length, help: e.help }); saveCfg(); startPractice(); };
        $('cp-setup-back').setAttribute('aria-label', t.home);
    }

    // ---- shared play view ----
    const newRun = mode => ({ mode, n: 0, right: 0, wrong: 0, streak: 0, best: 0, q: null, typed: '', locked: true, qt0: 0, t0: Date.now(), hint: false, per: {}, secs: 0, len: 0 });
    function startPractice() {
        const c = effectiveCfg(), run = newRun('practice');
        run.sel = c.skills; run.len = c.length; run.help = c.help; run.grade = c.grade;
        c.skills.forEach(id => { const st = P.states[id]; if (!st || st.grade !== c.grade) P.states[id] = Object.assign(E.newSkillState(c.grade, id), { grade: c.grade }); });
        P.run = S.practice = run; show('cp-pplay'); nextPractice();
    }
    function startPlacement() {
        if (needGrade()) return;
        const c = effectiveCfg(), run = newRun('placement');
        run.grade = c.grade; run.pl = E.Placement.start({ grade: c.grade, rnd: Math.random, seen: P.seen }); run.len = run.pl.total; run.help = false;
        P.run = S.practice = run; show('cp-pplay'); nextPractice();
    }
    function nextPractice() {
        const run = P.run; $('pp-feedback').hidden = true;
        if (run.mode === 'placement') {
            if (run.pl.done) return endPlacement();
            run.q = run.pl.next();
        } else {
            if (run.len && run.n >= run.len) return endPractice();
            const id = E.pickSkill(run.sel, P.states, Math.random), st = P.states[id];
            let lvl = E.nextLevel(st, Math.random);
            if (run.help) lvl = Math.max(st.floor || 1, lvl - 1);
            run.q = E.makeUniqueQuestion(id, lvl, Math.random, P.seen); if (P.seen) P.seen.add(run.q.key);
        }
        run.typed = ''; run.hint = false; run.locked = false; run.qt0 = Date.now();
        renderQ();
    }
    function renderQ() {
        const run = P.run, q = run.q, t = T(), card = $('pp-card'); if (!q) return;
        card.textContent = ''; card.classList.remove('cp-shake');
        const d = D(), dt = d.T(), plc = run.mode === 'placement';
        $('pp-qn').textContent = dt.qn(Math.min(run.n + 1, run.len || run.n + 1), run.len);
        d.setStreak($('pp-streak'), run.streak || 0); $('pp-streak').hidden = plc; $('pp-help').hidden = plc;
        $('pp-help').onclick = showHint;
        $('pp-count').textContent = (run.mode === 'practice' && run.streak >= 3 ? '🔥 ' : '') + t.qOf(Math.min(run.n + 1, run.len || run.n + 1), run.len);
        const p = run.len ? Math.round(run.n / run.len * 100) : 0; $('pp-barfill').style.width = p + '%'; $('pp-barfill').parentNode.setAttribute('aria-valuenow', p);
        const prompt = q.label ? txt(q.label) : q.hole ? t.qMissing : q.kind === 'choice' ? t.qChoice : t.qType;
        d.zone(card, SK_ICON[q.skill] || '❓', dt.zQ, 'q');
        card.appendChild(el('p', 'cp-prompt', prompt));
        const eq = el('div', 'cp-eq' + (q.text.length > 24 ? ' xl' : q.text.length > 14 ? ' long' : '')); eq.setAttribute('dir', 'ltr'); eq.id = 'pp-eq';
        fmtTxt(q.text).split('?').forEach((part, i) => { if (i) eq.appendChild(el('em', null, '?')); eq.appendChild(document.createTextNode(part)); });
        card.appendChild(eq);
        if (run.help && run.mode === 'practice') {
            const hb = el('button', 'cp-hintbtn', '💡 ' + t.hint); hb.type = 'button'; hb.id = 'pp-hintbtn';
            hb.onclick = showHint;
            card.appendChild(hb);
        }
        if (q.kind === 'choice') {
            const list = q.choices.map(v => ({ label: fmtTxt(v), v })), holes = (q.text.match(/\?/g) || []).length;
            const mode = S.fmt || (plc ? 'plain' : run.n % 3 === 1 ? 'balloon' : run.n % 3 === 2 && holes === 1 ? 'drag' : 'plain');
            if (mode === 'balloon') { d.zone(card, '🎈', dt.zPop, 'a'); d.balloons(card, list, answerQ); }
            else if (mode === 'drag' && holes === 1) { d.zone(card, '🧲', dt.zDrag, 'a'); d.dragFill(card, eq.querySelector('em'), list, answerQ); }
            else {
                d.zone(card, '👆', dt.zChoose, 'a');
                const box = el('div', 'cp-opts'); box.setAttribute('role', 'group');
                list.forEach((o, i) => { const b = d.optButton(o.label, o.v, i); b.onclick = () => answerQ(o.v, b); box.appendChild(b); });
                card.appendChild(box);
            }
        } else { d.zone(card, '✍️', dt.zType, 'a'); practicePad(card, q.kind === 'dec'); }
        d.enter(card);
        const tm = $('pp-time'); tm.className = ''; void tm.offsetWidth; tm.style.animationDuration = (E.targetSeconds(q.level, q.skill) * 2) + 's'; tm.className = 'run';
    }
    function showHint() {
        const run = P.run; if (!run || run.mode !== 'practice' || run.locked || $('pp-hint')) return;
        run.hint = true; const hb = $('pp-hintbtn'); if (hb) hb.remove();
        const h = el('p', 'cp-hint', '💡 ' + txt(run.q.hint)); h.id = 'pp-hint'; const card = $('pp-card'); card.insertBefore(h, card.querySelector('.cp-zone.a'));
    }
    function practicePad(card, dec) {
        const disp = el('div', 'cp-ans'); disp.id = 'pp-ans'; disp.setAttribute('aria-live', 'polite'); card.appendChild(disp);
        const pad = el('div', 'cp-pad');
        const keys = dec ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
        keys.forEach(k => {
            const b = el('button', 'cp-key' + (k === '✓' ? ' go' : ''), k); b.type = 'button'; b.dataset.k = k;
            b.setAttribute('aria-label', k === '⌫' ? 'Borrar' : k === '✓' ? T().check : k === ',' ? 'Coma' : k); b.onclick = () => pKey(k); pad.appendChild(b);
        });
        card.appendChild(pad);
        if (dec) { const go = el('button', 'cp-key go cp-gowide', '✓'); go.type = 'button'; go.dataset.k = '✓'; go.setAttribute('aria-label', T().check); go.onclick = () => pKey('✓'); card.appendChild(go); }
    }
    function pKey(k) {
        const run = P.run; if (!run || run.locked) return;
        if (k === '⌫') run.typed = run.typed.slice(0, -1);
        else if (k === '✓') { if (run.typed !== '') answerQ(run.typed); return; }
        else if (k === ',' || k === '.') { if (run.q.kind === 'dec' && run.typed && run.typed.indexOf(',') < 0) run.typed += ','; }
        else if (run.typed.length < 10) run.typed += k;
        const d = $('pp-ans'); if (d) d.textContent = run.typed;
    }
    const shownAnswer = q => fmtTxt(q.answer);

    function answerQ(v, btn) {
        const run = P.run; if (!run || run.locked) return; run.locked = true;
        const q = run.q, secs = (Date.now() - run.qt0) / 1000, ok = E.check(q, v), t = T();
        $('pp-time').classList.add('stop');
        document.querySelectorAll('#pp-card .cp-opt').forEach(b => { b.disabled = true; });
        if (run.mode === 'placement') {
            run.pl.answer({ correct: ok, seconds: secs }); run.n++; if (ok) run.right++; run.secs += secs;
            return nextPractice();
        }
        P.states[q.skill] = Object.assign(E.update(P.states[q.skill], { correct: ok, seconds: secs, hintUsed: run.hint, level: q.level, skill: q.skill }), { grade: run.grade });
        run.n++; run.secs += secs;
        const per = run.per[q.skill] || (run.per[q.skill] = { n: 0, right: 0, secs: 0 }); per.n++; per.secs += secs;
        if (ok) { run.right++; per.right++; run.streak++; run.best = Math.max(run.best, run.streak); } else { run.wrong++; run.streak = 0; }
        document.querySelectorAll('#pp-card .cp-sky').forEach(x => x.classList.add('done'));
        const hole = document.querySelector('#pp-card .cp-hole'); if (hole) hole.classList.add(ok ? 'ok' : 'bad');
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (!ok && q.kind === 'choice') document.querySelectorAll('#pp-card .cp-opt').forEach(b => { if (String(b.dataset.v) === String(q.answer)) b.classList.add('ok'); });
        const fb = $('pp-feedback'); fb.hidden = false; fb.textContent = ''; fb.className = 'cp-feedback ' + (ok ? 'good' : 'bad');
        fb.appendChild(el('span', 'cp-fbi', ok ? '✅' : '💡'));
        const box = el('div', 'cp-fbt'); box.appendChild(el('b', null, ok ? pick(t.good) : `${t.bad} ${shownAnswer(q)}`));
        if (!ok) { box.appendChild(el('span', 'cp-explain', `${D().T().why}: ${fmtTxt(txt(q.explain))}`)); }
        else if (run.streak >= 3) box.appendChild(el('span', 'cp-explain', `🔥 ${D().T().streak}: ${run.streak}`));
        const go = el('button', 'cp-btn', t.next); go.type = 'button'; go.id = 'pp-continue'; go.onclick = nextPractice;
        fb.appendChild(box); fb.appendChild(go); go.focus();
        D().setStreak($('pp-streak'), run.streak);
        const jx = JX(), target = btn || $('pp-card');
        if (jx) { if (ok) jx.correct(target, { streak: run.streak }); else jx.wrong(target); }
        if (!ok) $('pp-card').classList.add('cp-shake');
        saveSkills();
    }
    function quitPractice() {
        const run = P.run;
        if (run && run.mode === 'practice' && run.n > 0) return endPractice();
        goHome();
    }
    function goHome() { P.run = S.practice = null; renderHome(); show('cp-home'); }

    // ---- practice summary ----
    function levelGrade(id) { const st = P.states[id]; return st ? E.gradeOfLevel(Math.round(st.lvl)) : 1; }
    async function endPractice() {
        const run = P.run, t = T(); saveSkills(); saveCfg();
        const box = $('cp-psum-body'); box.textContent = '';
        box.appendChild(el('div', 'cp-trophy', run.right >= run.n * 0.8 ? '🏆' : '⭐'));
        box.appendChild(el('h2', null, t.psTitle));
        const sb = el('div', 'cp-endstars'); const pct = run.n ? run.right / run.n : 0, sn = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1;
        D().stars(sb, sn, 3, () => { if (JX()) JX().levelUp(sb); }); box.appendChild(sb);
        box.appendChild(el('p', 'cp-big', t.psRight(run.right, run.n)));
        box.appendChild(el('p', 'cp-subtle', t.psAvg((run.secs / Math.max(1, run.n)).toFixed(1).replace('.', lang() === 'en' ? '.' : ','))));
        const rows = el('div', 'cp-rows'); rows.appendChild(el('h3', null, t.psLevel));
        const ids = Object.keys(run.per);
        ids.forEach(id => {
            const per = run.per[id], pct = Math.round(per.right / per.n * 100), row = el('div', 'cp-row');
            row.appendChild(el('span', 'cp-rn', `${SK_ICON[id]} ${t.sk[id]}`));
            const bar = el('div', 'cp-mini'); bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `${per.right}/${per.n}`); const f = el('i'); f.style.width = pct + '%'; bar.appendChild(f); row.appendChild(bar);
            row.appendChild(el('span', 'cp-rl', t.gradeShort(levelGrade(id)))); rows.appendChild(row);
        });
        box.appendChild(rows);
        const weak = ids.filter(id => run.per[id].n >= 2).map(id => ({ id, acc: run.per[id].right / run.per[id].n })).sort((a, b) => a.acc - b.acc)[0];
        box.appendChild(el('p', 'cp-reco', weak && weak.acc < 0.75 ? '💪 ' + t.psMore(t.sk[weak.id]) : '🌟 ' + t.psGreat));
        $('cp-p-again').textContent = t.psAgain; $('cp-p-home').textContent = t.home;
        show('cp-psum');
        // progress, streak and stats
        S.prog.xp = (S.prog.xp || 0) + run.right * 2;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (run.right > 0 && S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined' && run.n > 0) {
            const lv = ids.length ? Math.round(ids.reduce((s, id) => s + P.states[id].lvl, 0) / ids.length) : 1;
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'calcpath', { correctAnswers: run.right, totalQuestions: run.n, totalAttempts: run.n, bestStreak: run.best,
                    elapsedSeconds: Math.round((Date.now() - run.t0) / 1000), level: lv, operation: 'practice' });
            } catch (e) { console.warn('[CalcPath] stats not saved', e); }
        }
    }

    // ---- placement ----
    function openPlacementIntro() {
        if (needGrade()) return; const t = T();
        $('cp-pi-h').textContent = t.plTitle; $('cp-pi-p').textContent = t.plIntro; $('cp-pi-go').textContent = t.plStart; $('cp-pi-no').textContent = t.plCancel;
        show('cp-pintro');
    }
    function endPlacement() {
        const run = P.run, res = run.pl.result(), t = T(); run.result = res;
        $('cp-pr-h').textContent = t.plResult;
        const box = $('cp-pr-list'); box.textContent = '';
        res.summary.slice().sort((a, b) => E.SKILL_IDS.indexOf(a.skill) - E.SKILL_IDS.indexOf(b.skill)).forEach(x => {
            const row = el('div', 'cp-row res'); row.dataset.skill = x.skill;
            row.appendChild(el('span', 'cp-rn', `${SK_ICON[x.skill]} ${t.sk[x.skill]}`)); row.appendChild(el('span', 'cp-rl big', t.gradeShort(x.grade)));
            box.appendChild(row);
        });
        $('cp-pr-sum').textContent = res.summary.slice().sort((a, b) => a.level - b.level).slice(0, 2).map(x => t.plLine(t.sk[x.skill], x.grade)).join('. ');
        $('cp-pr-go').textContent = t.plStartAt; $('cp-pr-home').textContent = t.home;
        show('cp-pres');
    }
    function applyPlacement() {
        const res = P.run && P.run.result; if (!res) return goHome();
        const g = effectiveCfg().grade;
        res.summary.forEach(x => { P.states[x.skill] = E.stateFromLevel(x.level, { grade: g, placed: true }); });
        P.cfg.grade = g; P.cfg.skills = res.summary.map(x => x.skill); saveCfg(); saveSkills();
        P.run = S.practice = null; renderSetup(); show('cp-setup');
    }

    function initPractice() {
        $('cp-m-practice').onclick = openSetup; $('cp-m-place').onclick = openPlacementIntro;
        $('cp-setup-back').onclick = goHome; $('pp-quit').onclick = quitPractice;
        $('cp-pi-go').onclick = startPlacement; $('cp-pi-no').onclick = goHome;
        $('cp-pr-go').onclick = applyPlacement; $('cp-pr-home').onclick = goHome;
        $('cp-p-again').onclick = startPractice; $('cp-p-home').onclick = goHome;
    }
    function practiceKey(e) {
        const run = P.run; if (!run) return;
        const fb = $('pp-feedback');
        if (e.key === 'Enter') { const c = $('pp-continue'); if (!fb.hidden && c) c.click(); else pKey('✓'); }
        else if (/^[0-9]$/.test(e.key)) { if (!D().pickByDigit($('pp-card'), e.key)) pKey(e.key); }
        else if (e.key === 'Backspace') pKey('⌫');
        else if (e.key === ',' || e.key === '.') pKey(',');
    }

    function init() {
        $('cp-quit').onclick = () => { renderHome(); show('cp-home'); };
        document.addEventListener('keydown', e => {
            if (!$('cp-pplay').hidden) return practiceKey(e);
            if ($('cp-play').hidden) return;
            if (/^[0-9]$/.test(e.key)) { if (!D().pickByDigit($('cp-card'), e.key)) key_(e.key); }
            else if (e.key === 'Backspace') key_('⌫');
            else if (e.key === 'Enter') { const c = $('cp-continue'); if (!$('cp-feedback').hidden && c) c.click(); else key_('✓'); }
        });
        D().mountSound('cp-snd'); D().mountSound('pp-snd'); D().setHelp($('cp-help')); D().setHelp($('pp-help'));
        load(); loadPractice(); initPractice(); renderHome(); show('cp-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); loadPractice(); renderHome(); });
        window.addEventListener('platformLanguageChanged', () => { if (!$('cp-home').hidden) renderHome(); else if (!$('cp-setup').hidden) renderSetup(); else if (!$('cp-pplay').hidden) renderQ(); });
    }

    const api = { init, _next: next, _renderQ: renderQ, state: S, engine: E, practice: P, UNITS, gen, makeQuestion, makeLesson, isCorrect, stars, typesFor, distractors };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
