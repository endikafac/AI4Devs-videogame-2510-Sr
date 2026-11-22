(function () {
  var D = (window.RepasoDecks = window.RepasoDecks || []);
  var L = function (es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; };

  // ---------- 1. Spanish orthography and grammar (cards in Spanish) ----------
  var es = [];
  function c(id, q, a, tag, opts) { var o = { id: id, q: q, a: a, tag: tag }; if (opts) o.opts = opts; es.push(o); }
  [['lápiz', 'lápices'], ['luz', 'luces'], ['pez', 'peces'], ['vez', 'veces'], ['nariz', 'narices'], ['feliz', 'felices'], ['canción', 'canciones'],
    ['joven', 'jóvenes'], ['examen', 'exámenes'], ['carácter', 'caracteres'], ['régimen', 'regímenes'], ['país', 'países'], ['jersey', 'jerséis'], ['ley', 'leyes']
  ].forEach(function (p) { c('pl_' + p[0], 'Plural de ' + p[0], p[1], 'plurales'); });
  [['alto', 'bajo'], ['grande', 'pequeño'], ['día', 'noche'], ['lleno', 'vacío'], ['rápido', 'lento'], ['caliente', 'frío'], ['fuerte', 'débil'],
    ['nuevo', 'viejo'], ['duro', 'blando'], ['abrir', 'cerrar'], ['subir', 'bajar'], ['ganar', 'perder'], ['feliz', 'triste'], ['limpio', 'sucio']
  ].forEach(function (p) { c('an_' + p[0], 'Antónimo de ' + p[0], p[1], 'antónimos'); });
  [['rápido', 'veloz'], ['hermoso', 'bello'], ['contento', 'alegre'], ['comenzar', 'empezar'], ['enfadado', 'enojado'], ['casa', 'hogar'], ['coche', 'automóvil'], ['miedo', 'temor'], ['valiente', 'audaz']
  ].forEach(function (p) { c('sn_' + p[0], 'Sinónimo de ' + p[0], p[1], 'sinónimos'); });
  var ACC = ['aguda', 'llana', 'esdrújula'];
  [['canción', 'aguda'], ['árbol', 'llana'], ['teléfono', 'esdrújula'], ['sofá', 'aguda'], ['lápiz', 'llana'], ['murciélago', 'esdrújula'], ['reloj', 'aguda'],
    ['mesa', 'llana'], ['bolígrafo', 'esdrújula'], ['camión', 'aguda'], ['fácil', 'llana'], ['cárcel', 'llana']
  ].forEach(function (p) {
    c('ac_' + p[0], '¿Aguda, llana o esdrújula? ' + p[0], p[1], 'acentos', ACC.filter(function (x) { return x !== p[1]; }));
  });
  c('ac_esd', 'Las palabras esdrújulas, ¿cuándo llevan tilde?', 'siempre', 'acentos', ['nunca', 'a veces']);
  c('dt_tu1', 'Completa: "___ eres mi amigo" (tu / tú)', 'tú', 'tilde diacrítica', ['tu']);
  c('dt_tu2', 'Completa: "___ casa es grande" (tu / tú)', 'tu', 'tilde diacrítica', ['tú']);
  c('dt_el', 'Completa: "___ libro es rojo" (el / él)', 'el', 'tilde diacrítica', ['él']);
  c('dt_mas', 'Completa: "Quiero ___ agua" (mas / más)', 'más', 'tilde diacrítica', ['mas']);
  c('dt_si1', 'Completa: "___, quiero ir" (Si / Sí)', 'Sí', 'tilde diacrítica', ['Si']);
  c('dt_si2', 'Completa: "___ llueve, no salgo" (Si / Sí)', 'Si', 'tilde diacrítica', ['Sí']);
  c('dt_mi', 'Completa: "Este regalo es para ___" (mi / mí)', 'mí', 'tilde diacrítica', ['mi']);
  [['abejas', 'enjambre'], ['lobos', 'manada'], ['árboles', 'bosque'], ['ovejas', 'rebaño'], ['peces', 'banco'], ['barcos', 'flota']
  ].forEach(function (p) { c('co_' + p[0], 'Nombre colectivo de ' + p[0], p[1], 'colectivos'); });
  [['romper', 'roto'], ['abrir', 'abierto'], ['escribir', 'escrito'], ['ver', 'visto'], ['hacer', 'hecho'], ['decir', 'dicho'], ['volver', 'vuelto']
  ].forEach(function (p) { c('pp_' + p[0], 'Participio de ' + p[0], p[1], 'participios'); });
  [['España', 'español'], ['Francia', 'francés'], ['Portugal', 'portugués'], ['Italia', 'italiano']
  ].forEach(function (p) { c('ge_' + p[0], 'Gentilicio de ' + p[0], p[1], 'gentilicios'); });
  [['actor', 'actriz'], ['poeta', 'poetisa'], ['rey', 'reina'], ['caballo', 'yegua'], ['gallo', 'gallina'], ['yerno', 'nuera']
  ].forEach(function (p) { c('fe_' + p[0], 'Femenino de ' + p[0], p[1], 'género'); });
  c('gr_agua', 'El agua, ¿es masculino o femenino?', 'femenino', 'gramática', ['masculino']);
  c('gr_dim', 'Diminutivo de casa', 'casita', 'gramática');
  c('gr_rojo', '¿Qué clase de palabra es "rojo"?', 'adjetivo', 'gramática', ['verbo', 'sustantivo']);
  c('gr_correr', '¿Qué clase de palabra es "correr"?', 'verbo', 'gramática', ['adjetivo', 'sustantivo']);
  c('gr_syl', 'Número de sílabas de "murciélago"', '4', 'gramática');
  c('gr_syl2', 'Número de sílabas de "mariposa"', '4', 'gramática');
  D.push({
    id: 'lang-spanish', icon: '📚',
    title: L('Lengua española: ortografía y gramática', 'Spanish language: spelling and grammar', 'Gaztelania: ortografia eta gramatika', 'Lingua española: ortografía e gramática', 'Llengua espanyola: ortografia i gramàtica', 'Langue espagnole : orthographe et grammaire'),
    desc: L('Plurales, antónimos, sinónimos, acentos y más (tarjetas en español)', 'Plurals, antonyms, synonyms, accents and more (cards in Spanish)', 'Plurala, antonimoak, sinonimoak, azentuak eta gehiago (txartelak gaztelaniaz)', 'Plurais, antónimos, sinónimos, acentos e máis (tarxetas en español)', 'Plurals, antònims, sinònims, accents i més (targetes en espanyol)', 'Pluriels, antonymes, synonymes, accents et plus (cartes en espagnol)'),
    age: '7+', cards: es
  });

  // ---------- 2. English grammar basics ----------
  var en = [];
  function e(id, q, a, tag, opts) { var o = { id: id, q: q, a: a, tag: tag }; if (opts) o.opts = opts; en.push(o); }
  [['child', 'children'], ['man', 'men'], ['woman', 'women'], ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice'], ['person', 'people'], ['goose', 'geese'],
    ['sheep', 'sheep'], ['leaf', 'leaves'], ['knife', 'knives'], ['city', 'cities'], ['bus', 'buses'], ['baby', 'babies']
  ].forEach(function (p) { e('epl_' + p[0], 'Plural of "' + p[0] + '"', p[1], 'plurals'); });
  [['I', 'am', 'is', 'are'], ['She', 'is', 'am', 'are'], ['They', 'are', 'is', 'am'], ['We', 'are', 'is', 'am']].forEach(function (p) {
    e('be_' + p[0], 'To be (present): ' + p[0] + ' ___', p[1], 'to be', [p[2], p[3]]);
  });
  [['I', 'was', 'were'], ['You', 'were', 'was'], ['He', 'was', 'were'], ['They', 'were', 'was']].forEach(function (p) {
    e('bep_' + p[0], 'To be (past): ' + p[0] + ' ___', p[1], 'to be', [p[2]]);
  });
  e('have_she', 'To have (present): She ___', 'has', 'to have', ['have']);
  e('do_she', '"___ she like pizza?" (Do / Does)', 'Does', 'auxiliaries', ['Do']);
  e('did_neg', 'Negative past: "I ___ go" (short form)', "didn't", 'auxiliaries', ["don't", "doesn't"]);
  e('can_past', 'Past of "can"', 'could', 'auxiliaries');
  [['good', 'better'], ['bad', 'worse'], ['big', 'bigger'], ['happy', 'happier'], ['small', 'smaller'], ['beautiful', 'more beautiful']
  ].forEach(function (p) { e('cmp_' + p[0], 'Comparative of "' + p[0] + '"', p[1], 'comparatives'); });
  [['good', 'best'], ['bad', 'worst'], ['tall', 'tallest']].forEach(function (p) { e('sup_' + p[0], 'Superlative of "' + p[0] + '"', p[1], 'comparatives'); });
  e('wh_place', 'Question word for a place', 'where', 'questions', ['when', 'who', 'why']);
  e('wh_time', 'Question word for time', 'when', 'questions', ['where', 'who', 'why']);
  e('wh_person', 'Question word for a person', 'who', 'questions', ['where', 'when', 'why']);
  e('wh_reason', 'Question word for a reason', 'why', 'questions', ['where', 'when', 'who']);
  e('art_an', 'Article: ___ apple (a / an)', 'an', 'articles', ['a']);
  e('art_a', 'Article: ___ book (a / an)', 'a', 'articles', ['an']);
  e('its', 'The dog wagged ___ tail (its / it\'s)', 'its', 'possessives', ["it's"]);
  e('there', 'There ___ two cats on the sofa (is / are)', 'are', 'there is/are', ['is']);
  e('opp_always', 'Opposite of "always"', 'never', 'vocabulary');
  D.push({
    id: 'lang-english-grammar', icon: '🇬🇧',
    title: L('Gramática básica de inglés', 'Basic English grammar', 'Ingeleseko oinarrizko gramatika', 'Gramática básica de inglés', 'Gramàtica bàsica d\'anglès', 'Grammaire anglaise de base'),
    desc: L('To be, plurales irregulares, comparativos y más', 'To be, irregular plurals, comparatives and more', 'To be, plural irregularrak, konparatiboak eta gehiago', 'To be, plurais irregulares, comparativos e máis', 'To be, plurals irregulars, comparatius i més', 'To be, pluriels irréguliers, comparatifs et plus'),
    age: '8+', cards: en
  });

  // ---------- 3. The 10 most common mistakes (Spanish) ----------
  var m = [];
  function x(id, q, a, opts) { m.push({ id: id, q: q, a: a, opts: opts }); }
  x('err1', '¿Cuál es correcta? "___ si vienes" (a ver / haber)', 'A ver', ['Haber']);
  x('err2', '¿Cuál es correcta? "Te ___ de menos" (echo / hecho)', 'echo', ['hecho']);
  x('err3', '¿Cuál es correcta? "___ vienes, me enfado" (Si no / Sino)', 'Si no', ['Sino']);
  x('err4', '¿Cuál es correcta? "Vosotros ___ ganado" (habéis / habeís)', 'habéis', ['habeís']);
  x('err5', '¿Cuál es correcta? "Entre tú y ___" (yo / mí)', 'yo', ['mí']);
  x('err6', '¿Cuál es correcta? "Estoy de ___" (pie / pié)', 'pie', ['pié']);
  x('err7', '¿Cuál es correcta? "___ dos años que vivo aquí" (Hace / Hacen)', 'Hace', ['Hacen']);
  x('err8', '¿Cuál es correcta? "___ muchas personas" (Había / Habían)', 'Había', ['Habían']);
  x('err9', '¿Cuál es correcta? "Me gusta, ___ el chocolate" (sobre todo / sobretodo)', 'sobre todo', ['sobretodo']);
  x('err10', '¿Cuál es correcta? "___ muchas flores en el jardín" (Hay / Ahí)', 'Hay', ['Ahí']);
  D.push({
    id: 'lang-top-mistakes', icon: '⚠️',
    title: L('Los 10 errores más comunes', 'The 10 most common mistakes', 'Akats ohikoenak (10)', 'Os 10 erros máis comúns', 'Els 10 errors més comuns', 'Les 10 erreurs les plus courantes'),
    desc: L('Errores frecuentes en español (tarjetas en español)', 'Frequent mistakes in Spanish (cards in Spanish)', 'Gaztelaniazko akats ohikoak (txartelak gaztelaniaz)', 'Erros frecuentes en español (tarxetas en español)', 'Errors freqüents en espanyol (targetes en espanyol)', 'Erreurs fréquentes en espagnol (cartes en espagnol)'),
    age: '8+', cards: m
  });
})();
