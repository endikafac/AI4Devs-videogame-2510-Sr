/**
 * Fracciones con Pizza - visual fractions with pizza and bar pieces.
 * 7 progressive lessons: identify, compare, equivalent, add with the same denominator.
 * Pure logic is exported for unit tests.
 */
const FractionsLab = (() => {
    'use strict';

    const UI = {
        es: { title: 'Fracciones con Pizza', sub: 'Trocea pizzas y barras. Completa una lección para abrir la siguiente.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La respuesta es', quit: 'Salir',
              qId: '¿Qué fracción está coloreada?', qCmp: '¿Cuál es mayor?', qEq: 'Busca la fracción equivalente', qAdd: 'Suma las fracciones', left: 'Izquierda', right: 'Derecha', equal: 'Iguales',
              done: '¡Lección completada!', fail: 'Necesitas acertar más. ¡Inténtalo otra vez!', again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino', locked: 'Completa la anterior',
              score: (c, t) => `${c} de ${t} aciertos.`, piece: (n, d) => `${n} de ${d} trozos`,
              k: { id1: 'Reconoce fracciones', id2: 'Más trozos', cmp1: 'Compara: mismo denominador', cmp2: 'Compara: distintos trozos', eq: 'Fracciones equivalentes', add: 'Suma: mismo denominador', mix: 'Gran reto' } },
        en: { title: 'Pizza Fractions', sub: 'Slice pizzas and bars. Finish a lesson to unlock the next.', lesson: 'Lesson', xp: 'XP',
              next: 'Continue', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The answer is', quit: 'Quit',
              qId: 'Which fraction is coloured?', qCmp: 'Which one is bigger?', qEq: 'Find the equivalent fraction', qAdd: 'Add the fractions', left: 'Left', right: 'Right', equal: 'Equal',
              done: 'Lesson complete!', fail: 'You need more right answers. Try again!', again: 'Try again', nextL: 'Next lesson', back: 'Back to the path', locked: 'Finish the previous one',
              score: (c, t) => `${c} out of ${t} correct.`, piece: (n, d) => `${n} of ${d} pieces`,
              k: { id1: 'Spot fractions', id2: 'More pieces', cmp1: 'Compare: same denominator', cmp2: 'Compare: different pieces', eq: 'Equivalent fractions', add: 'Add: same denominator', mix: 'Big challenge' } },
        eu: { title: 'Pizza zatikiak', sub: 'Zatitu pizzak eta barrak. Bukatu ikasgai bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP',
              next: 'Jarraitu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Erantzuna hau da:', quit: 'Irten',
              qId: 'Zein zatiki dago koloreztatuta?', qCmp: 'Zein da handiagoa?', qEq: 'Bilatu zatiki baliokidea', qAdd: 'Batu zatikiak', left: 'Ezkerra', right: 'Eskuina', equal: 'Berdinak',
              done: 'Ikasgaia osatuta!', fail: 'Erantzun zuzen gehiago behar dituzu. Saiatu berriro!', again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera', locked: 'Bukatu aurrekoa',
              score: (c, t) => `${t}tik ${c} zuzen.`, piece: (n, d) => `${d} zatitik ${n}`,
              k: { id1: 'Ezagutu zatikiak', id2: 'Zati gehiago', cmp1: 'Alderatu: izendatzaile bera', cmp2: 'Alderatu: zati desberdinak', eq: 'Zatiki baliokideak', add: 'Batu: izendatzaile bera', mix: 'Erronka handia' } },
        gl: { title: 'Fraccións con pizza', sub: 'Trocea pizzas e barras. Remata unha lección para abrir a seguinte.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A resposta é', quit: 'Saír',
              qId: 'Que fracción está coloreada?', qCmp: 'Cal é maior?', qEq: 'Atopa a fracción equivalente', qAdd: 'Suma as fraccións', left: 'Esquerda', right: 'Dereita', equal: 'Iguais',
              done: 'Lección completada!', fail: 'Necesitas acertar máis. Inténtao outra vez!', again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño', locked: 'Completa a anterior',
              score: (c, t) => `${c} de ${t} acertos.`, piece: (n, d) => `${n} de ${d} anacos`,
              k: { id1: 'Recoñece fraccións', id2: 'Máis anacos', cmp1: 'Compara: mesmo denominador', cmp2: 'Compara: distintos anacos', eq: 'Fraccións equivalentes', add: 'Suma: mesmo denominador', mix: 'Gran reto' } },
        ca: { title: 'Fraccions amb pizza', sub: 'Talla pizzes i barres. Acaba una lliçó per obrir la següent.', lesson: 'Lliçó', xp: 'XP',
              next: 'Continua', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. La resposta és', quit: 'Surt',
              qId: 'Quina fracció està acolorida?', qCmp: 'Quina és més gran?', qEq: 'Troba la fracció equivalent', qAdd: 'Suma les fraccions', left: 'Esquerra', right: 'Dreta', equal: 'Iguals',
              done: 'Lliçó completada!', fail: 'Necessites encertar més. Torna-ho a provar!', again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí', locked: 'Acaba l\'anterior',
              score: (c, t) => `${c} de ${t} encerts.`, piece: (n, d) => `${n} de ${d} trossos`,
              k: { id1: 'Reconeix fraccions', id2: 'Més trossos', cmp1: 'Compara: mateix denominador', cmp2: 'Compara: trossos diferents', eq: 'Fraccions equivalents', add: 'Suma: mateix denominador', mix: 'Gran repte' } },
        fr: { title: 'Fractions en pizza', sub: 'Découpe des pizzas et des barres. Termine une leçon pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP',
              next: 'Continuer', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continue !'], bad: 'Presque. La réponse est', quit: 'Quitter',
              qId: 'Quelle fraction est coloriée ?', qCmp: 'Laquelle est la plus grande ?', qEq: 'Trouve la fraction équivalente', qAdd: 'Additionne les fractions', left: 'Gauche', right: 'Droite', equal: 'Égales',
              done: 'Leçon terminée !', fail: 'Il faut plus de bonnes réponses. Réessaie !', again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin', locked: 'Termine la précédente',
              score: (c, t) => `${c} sur ${t} bonnes réponses.`, piece: (n, d) => `${n} parts sur ${d}`,
              k: { id1: 'Reconnaître les fractions', id2: 'Plus de parts', cmp1: 'Comparer : même dénominateur', cmp2: 'Comparer : parts différentes', eq: 'Fractions équivalentes', add: 'Additionner : même dénominateur', mix: 'Grand défi' } }
    };

    // ---- learn-first strings, merged into UI (same keys in the six languages) ----
    const fs_ = f => `${f.n}/${f.d}`;
    const UX = {
        es: {
            learnBtn: 'Aprender', skip: 'Saltar', exLabel: (i, n) => `Ejemplo ${i} de ${n}`, exNext: 'Siguiente ejemplo', goPractice: '¡A practicar!', look: 'Mira:',
            guided: (i, n) => `Práctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Probar otra vez', retryT: 'Casi, fíjate en el dibujo.', check: 'Comprobar',
            numLabel: 'Numerador = cuántas partes cogemos', denLabel: 'Denominador = en cuántas partes partimos', parts: 'Partes', less: 'menos', more: 'más', sep: ',',
            liveFrac: (n, d) => `${n} ${n === 1 ? 'parte' : 'partes'} de ${d} = ${n}/${d}`, tapHint: 'Toca los trozos para colorearlos',
            qBuild: f => `Colorea ${f}`, qPlace: f => `Marca ${f} en la recta`, qLine: '¿Qué fracción marca la flecha?', qQty: (f, T) => `¿Cuánto es ${f} de ${T}?`,
            qQtyF: (c, T) => `¿Qué fracción de ${T} son ${c}?`, qMixT: '¿Qué número mixto es igual a esta fracción?', qImpT: '¿Qué fracción es igual a este número mixto?',
            qDec: f => `¿Qué decimal es ${f}?`, qPct: f => `¿Qué porcentaje es ${f}?`, qD2F: x => `¿Qué fracción es ${x}?`,
            exFrac: (n, d) => `Partimos el todo en ${d} partes iguales (denominador) y cogemos ${n} (numerador): ${n}/${d}.`,
            exCmpSame: (a, b, s) => `Los trozos son del mismo tamaño, así que se comparan los numeradores: ${a.n} ${s} ${b.n}. Por tanto ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `Multiplicamos en cruz: ${a.n}×${b.d} = ${x} y ${b.n}×${a.d} = ${y}. Como ${x} ${s} ${y}, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `Multiplicamos arriba y abajo por ${k}: ${f.n}×${k} = ${t.n} y ${f.d}×${k} = ${t.d}. Así ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `Con el mismo denominador se suman los numeradores y el denominador no cambia: ${a.n} + ${b.n} = ${s.n}, así ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `La recta entre 0 y 1 está partida en ${d} partes iguales y la marca está en la parte ${n}: ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `Repartimos ${T} en ${d} grupos iguales: ${T} ÷ ${d} = ${g}. Cogemos ${n}: ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `Dividimos arriba y abajo entre ${g}: ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} y sobran ${r}: ${w === 1 ? 'es 1 entero' : `son ${w} enteros`} y ${r}/${d} más, es decir ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} ${w === 1 ? 'entero es' : 'enteros son'} ${w}×${d} = ${w * d} trozos; con ${r} más son ${n} trozos de ${d}: ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = ${pct} %. El porcentaje dice cuántos de cada 100.`,
            liveQty: (f, T, g, R) => `${f} de ${T} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'Una fracción dice cuántas partes cogemos de un todo partido en partes iguales. Toca los trozos de la pizza para colorearlos y mira cómo cambia la fracción.',
                id2: 'Cuantos más trozos tiene la pizza, más pequeños son. Cambia en cuántas partes partimos con + y − y colorea los que quieras.',
                cmp1: 'Si los trozos son iguales (mismo denominador), gana la fracción con más trozos coloreados. Colorea las dos barras y compara.',
                cmp2: 'Si los trozos son distintos, mira cuánta barra está coloreada: 1/2 es más que 1/4 aunque el 4 sea más grande que el 2.',
                eq: 'Las fracciones equivalentes ocupan el mismo trozo del muro. Toca un trozo y mira qué otras filas quedan igual de llenas.',
                add: 'Con el mismo denominador los trozos son iguales: se suman los numeradores y el denominador se queda igual.',
                mix: 'Repaso de todo: identifica, compara, busca equivalentes y suma. Mira primero el dibujo y luego piensa.',
                line: 'En la recta numérica, cuanto más a la derecha, mayor es la fracción. Toca una marca para colocar la fracción.',
                qty: 'Para hallar una fracción de una cantidad, reparte la cantidad en tantos grupos como dice el denominador y coge los grupos que dice el numerador.',
                mixed: 'Un número mixto es un entero más una fracción. Si la fracción es mayor que 1, saca las pizzas enteras: 7/4 = 1 y 3/4.',
                dec: 'Una fracción también se escribe como decimal y como porcentaje: 1/2 = 0,5 = 50 %. El porcentaje es «cuántos de cada 100».'
            },
            k: { line: 'En la recta', qty: 'Fracción de una cantidad', mixed: 'Números mixtos', dec: 'Decimales y porcentajes' }
        },
        en: {
            learnBtn: 'Learn', skip: 'Skip', exLabel: (i, n) => `Example ${i} of ${n}`, exNext: 'Next example', goPractice: 'Let\'s practise!', look: 'Look:',
            guided: (i, n) => `Guided practice ${i} of ${n}`, hintL: 'Hint:', retry: 'Try again', retryT: 'Almost, look at the picture.', check: 'Check',
            numLabel: 'Numerator = how many parts we take', denLabel: 'Denominator = how many parts we cut it into', parts: 'Parts', less: 'less', more: 'more', sep: '.',
            liveFrac: (n, d) => `${n} ${n === 1 ? 'part' : 'parts'} out of ${d} = ${n}/${d}`, tapHint: 'Tap the pieces to colour them',
            qBuild: f => `Colour ${f}`, qPlace: f => `Mark ${f} on the line`, qLine: 'Which fraction does the arrow show?', qQty: (f, T) => `What is ${f} of ${T}?`,
            qQtyF: (c, T) => `What fraction of ${T} is ${c}?`, qMixT: 'Which mixed number equals this fraction?', qImpT: 'Which fraction equals this mixed number?',
            qDec: f => `Which decimal is ${f}?`, qPct: f => `Which percentage is ${f}?`, qD2F: x => `Which fraction is ${x}?`,
            exFrac: (n, d) => `We cut the whole into ${d} equal parts (denominator) and take ${n} (numerator): ${n}/${d}.`,
            exCmpSame: (a, b, s) => `The pieces are the same size, so we compare the numerators: ${a.n} ${s} ${b.n}. So ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `Cross-multiply: ${a.n}×${b.d} = ${x} and ${b.n}×${a.d} = ${y}. Since ${x} ${s} ${y}, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `Multiply top and bottom by ${k}: ${f.n}×${k} = ${t.n} and ${f.d}×${k} = ${t.d}. So ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `With the same denominator we add the numerators and the denominator stays: ${a.n} + ${b.n} = ${s.n}, so ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `The line between 0 and 1 is cut into ${d} equal parts and the mark is on part ${n}: ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `Share ${T} into ${d} equal groups: ${T} ÷ ${d} = ${g}. Take ${n}: ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `Divide top and bottom by ${g}: ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} and ${r} left over: ${w} ${w === 1 ? 'whole' : 'wholes'} and ${r}/${d} more, that is ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} ${w === 1 ? 'whole is' : 'wholes are'} ${w}×${d} = ${w * d} pieces; ${r} more makes ${n} pieces of ${d}: ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = ${pct}%. A percentage says how many out of every 100.`,
            liveQty: (f, T, g, R) => `${f} of ${T} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'A fraction tells how many parts we take from a whole cut into equal parts. Tap the pizza slices to colour them and watch the fraction change.',
                id2: 'The more slices a pizza has, the smaller they are. Change how many parts with + and − and colour the ones you like.',
                cmp1: 'When the pieces are equal (same denominator), the fraction with more coloured pieces wins. Colour both bars and compare.',
                cmp2: 'When the pieces are different, look at how much of the bar is coloured: 1/2 is more than 1/4 even though 4 is bigger than 2.',
                eq: 'Equivalent fractions fill the same part of the wall. Tap a piece and see which other rows are filled the same.',
                add: 'With the same denominator the pieces are equal: add the numerators and keep the denominator.',
                mix: 'A review of everything: name, compare, find equivalents and add. Look at the picture first, then think.',
                line: 'On the number line, the further right, the bigger the fraction. Tap a mark to place the fraction.',
                qty: 'To find a fraction of an amount, share the amount into as many groups as the denominator says and take as many groups as the numerator says.',
                mixed: 'A mixed number is a whole number plus a fraction. If the fraction is bigger than 1, take out the whole pizzas: 7/4 = 1 and 3/4.',
                dec: 'A fraction can also be written as a decimal and as a percentage: 1/2 = 0.5 = 50%. A percentage means “out of every 100”.'
            },
            k: { line: 'On the number line', qty: 'Fraction of an amount', mixed: 'Mixed numbers', dec: 'Decimals and percentages' }
        },
        eu: {
            learnBtn: 'Ikasi', skip: 'Saltatu', exLabel: (i, n) => `${i}. adibidea, ${n}tik`, exNext: 'Hurrengo adibidea', goPractice: 'Praktikatzera!', look: 'Begira:',
            guided: (i, n) => `Praktika gidatua ${i}/${n}`, hintL: 'Pista:', retry: 'Saiatu berriro', retryT: 'Ia, begiratu marrazkiari.', check: 'Egiaztatu',
            numLabel: 'Zenbakitzailea = zenbat zati hartzen ditugun', denLabel: 'Izendatzailea = zenbat zatitan zatitzen dugun', parts: 'Zatiak', less: 'gutxiago', more: 'gehiago', sep: ',',
            liveFrac: (n, d) => `${d} zatitik ${n} = ${n}/${d}`, tapHint: 'Sakatu zatiak koloreztatzeko',
            qBuild: f => `Koloreztatu ${f}`, qPlace: f => `Markatu ${f} zuzenean`, qLine: 'Zein zatiki markatzen du geziak?', qQty: (f, T) => `Zenbat da ${T}ren ${f}?`,
            qQtyF: (c, T) => `Zein zatiki da ${c}, ${T}ren artean?`, qMixT: 'Zein zenbaki mistok da zatiki honen berdina?', qImpT: 'Zein zatiki da zenbaki misto honen berdina?',
            qDec: f => `Zein hamartar da ${f}?`, qPct: f => `Zer ehuneko da ${f}?`, qD2F: x => `Zein zatiki da ${x}?`,
            exFrac: (n, d) => `Osoa ${d} zati berdinetan zatitzen dugu (izendatzailea) eta ${n} hartzen ditugu (zenbakitzailea): ${n}/${d}.`,
            exCmpSame: (a, b, s) => `Zatiak tamaina berekoak dira, beraz zenbakitzaileak alderatzen dira: ${a.n} ${s} ${b.n}. Beraz ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `Gurutzean biderkatu: ${a.n}×${b.d} = ${x} eta ${b.n}×${a.d} = ${y}. ${x} ${s} ${y} denez, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `Goian eta behean ${k}z biderkatu: ${f.n}×${k} = ${t.n} eta ${f.d}×${k} = ${t.d}. Beraz ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `Izendatzaile berarekin zenbakitzaileak batzen dira eta izendatzailea berdin geratzen da: ${a.n} + ${b.n} = ${s.n}, beraz ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `0 eta 1 arteko zuzena ${d} zati berdinetan dago zatituta eta marka ${n}. zatian dago: ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `${T} ${d} talde berdinetan banatu: ${T} ÷ ${d} = ${g}. ${n} hartu: ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `Goian eta behean ${g}z zatitu: ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} eta ${r} soberan: ${w} oso eta ${r}/${d} gehiago, hau da ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} oso ${w}×${d} = ${w * d} zati dira; ${r} gehiagorekin ${d}ko ${n} zati dira: ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = % ${pct}. Ehunekoak 100etik zenbat diren esaten du.`,
            liveQty: (f, T, g, R) => `${T}ren ${f} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'Zatikiak esaten du zati berdinetan zatitutako osotik zenbat zati hartzen ditugun. Sakatu pizzaren zatiak koloreztatzeko eta ikusi zatikia nola aldatzen den.',
                id2: 'Pizzak zenbat eta zati gehiago izan, orduan eta txikiagoak dira. Aldatu zenbat zatitan zatitzen dugun + eta − botoiekin eta koloreztatu nahi dituzunak.',
                cmp1: 'Zatiak berdinak direnean (izendatzaile bera), kolorezko zati gehien dituen zatikiak irabazten du. Koloreztatu bi barrak eta alderatu.',
                cmp2: 'Zatiak desberdinak direnean, begiratu barraren zenbat dagoen koloreztatuta: 1/2 handiagoa da 1/4 baino, nahiz eta 4 handiagoa izan 2 baino.',
                eq: 'Zatiki baliokideek hormaren zati bera betetzen dute. Sakatu zati bat eta ikusi zein beste errenkada betetzen diren berdin.',
                add: 'Izendatzaile berarekin zatiak berdinak dira: zenbakitzaileak batu eta izendatzailea berdin utzi.',
                mix: 'Dena errepasatzen dugu: izendatu, alderatu, baliokideak bilatu eta batu. Begiratu lehenengo marrazkiari eta gero pentsatu.',
                line: 'Zenbaki-zuzenean, zenbat eta eskuinago, orduan eta handiagoa da zatikia. Sakatu marka bat zatikia kokatzeko.',
                qty: 'Kantitate baten zatikia aurkitzeko, banatu kantitatea izendatzaileak dioen adina taldetan eta hartu zenbakitzaileak dioen adina talde.',
                mixed: 'Zenbaki mistoa oso bat gehi zatiki bat da. Zatikia 1 baino handiagoa bada, atera pizza osoak: 7/4 = 1 eta 3/4.',
                dec: 'Zatiki bat hamartar gisa eta ehuneko gisa ere idazten da: 1/2 = 0,5 = % 50. Ehunekoak «100etik zenbat» esan nahi du.'
            },
            k: { line: 'Zuzenean', qty: 'Kantitate baten zatikia', mixed: 'Zenbaki mistoak', dec: 'Hamartarrak eta ehunekoak' }
        },
        gl: {
            learnBtn: 'Aprender', skip: 'Saltar', exLabel: (i, n) => `Exemplo ${i} de ${n}`, exNext: 'Seguinte exemplo', goPractice: 'A practicar!', look: 'Mira:',
            guided: (i, n) => `Práctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Probar outra vez', retryT: 'Case, fíxate no debuxo.', check: 'Comprobar',
            numLabel: 'Numerador = cantas partes collemos', denLabel: 'Denominador = en cantas partes partimos', parts: 'Partes', less: 'menos', more: 'máis', sep: ',',
            liveFrac: (n, d) => `${n} ${n === 1 ? 'parte' : 'partes'} de ${d} = ${n}/${d}`, tapHint: 'Toca os anacos para coloralos',
            qBuild: f => `Colorea ${f}`, qPlace: f => `Marca ${f} na recta`, qLine: 'Que fracción marca a frecha?', qQty: (f, T) => `Canto é ${f} de ${T}?`,
            qQtyF: (c, T) => `Que fracción de ${T} son ${c}?`, qMixT: 'Que número mixto é igual a esta fracción?', qImpT: 'Que fracción é igual a este número mixto?',
            qDec: f => `Que decimal é ${f}?`, qPct: f => `Que porcentaxe é ${f}?`, qD2F: x => `Que fracción é ${x}?`,
            exFrac: (n, d) => `Partimos o todo en ${d} partes iguais (denominador) e collemos ${n} (numerador): ${n}/${d}.`,
            exCmpSame: (a, b, s) => `Os anacos son do mesmo tamaño, así que se comparan os numeradores: ${a.n} ${s} ${b.n}. Polo tanto ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `Multiplicamos en cruz: ${a.n}×${b.d} = ${x} e ${b.n}×${a.d} = ${y}. Como ${x} ${s} ${y}, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `Multiplicamos arriba e abaixo por ${k}: ${f.n}×${k} = ${t.n} e ${f.d}×${k} = ${t.d}. Así ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `Co mesmo denominador súmanse os numeradores e o denominador non cambia: ${a.n} + ${b.n} = ${s.n}, así ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `A recta entre 0 e 1 está partida en ${d} partes iguais e a marca está na parte ${n}: ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `Repartimos ${T} en ${d} grupos iguais: ${T} ÷ ${d} = ${g}. Collemos ${n}: ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `Dividimos arriba e abaixo entre ${g}: ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} e sobran ${r}: ${w === 1 ? 'é 1 enteiro' : `son ${w} enteiros`} e ${r}/${d} máis, é dicir ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} ${w === 1 ? 'enteiro é' : 'enteiros son'} ${w}×${d} = ${w * d} anacos; con ${r} máis son ${n} anacos de ${d}: ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = ${pct} %. A porcentaxe di cantos de cada 100.`,
            liveQty: (f, T, g, R) => `${f} de ${T} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'Unha fracción di cantas partes collemos dun todo partido en partes iguais. Toca os anacos da pizza para coloralos e mira como cambia a fracción.',
                id2: 'Canto máis anacos ten a pizza, máis pequenos son. Cambia en cantas partes partimos con + e − e colorea os que queiras.',
                cmp1: 'Se os anacos son iguais (mesmo denominador), gaña a fracción con máis anacos coloreados. Colorea as dúas barras e compara.',
                cmp2: 'Se os anacos son distintos, mira canta barra está coloreada: 1/2 é máis ca 1/4 aínda que o 4 sexa máis grande ca o 2.',
                eq: 'As fraccións equivalentes ocupan o mesmo anaco do muro. Toca un anaco e mira que outras filas quedan igual de cheas.',
                add: 'Co mesmo denominador os anacos son iguais: súmanse os numeradores e o denominador queda igual.',
                mix: 'Repaso de todo: identifica, compara, busca equivalentes e suma. Mira primeiro o debuxo e despois pensa.',
                line: 'Na recta numérica, canto máis á dereita, maior é a fracción. Toca unha marca para colocar a fracción.',
                qty: 'Para atopar unha fracción dunha cantidade, reparte a cantidade en tantos grupos como di o denominador e colle os grupos que di o numerador.',
                mixed: 'Un número mixto é un enteiro máis unha fracción. Se a fracción é maior que 1, saca as pizzas enteiras: 7/4 = 1 e 3/4.',
                dec: 'Unha fracción tamén se escribe como decimal e como porcentaxe: 1/2 = 0,5 = 50 %. A porcentaxe é «cantos de cada 100».'
            },
            k: { line: 'Na recta', qty: 'Fracción dunha cantidade', mixed: 'Números mixtos', dec: 'Decimais e porcentaxes' }
        },
        ca: {
            learnBtn: 'Aprèn', skip: 'Salta', exLabel: (i, n) => `Exemple ${i} de ${n}`, exNext: 'Següent exemple', goPractice: 'A practicar!', look: 'Mira:',
            guided: (i, n) => `Pràctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Prova-ho un altre cop', retryT: 'Gairebé, fixa\'t en el dibuix.', check: 'Comprova',
            numLabel: 'Numerador = quantes parts agafem', denLabel: 'Denominador = en quantes parts partim', parts: 'Parts', less: 'menys', more: 'més', sep: ',',
            liveFrac: (n, d) => `${n} ${n === 1 ? 'part' : 'parts'} de ${d} = ${n}/${d}`, tapHint: 'Toca els trossos per acolorir-los',
            qBuild: f => `Acoloreix ${f}`, qPlace: f => `Marca ${f} a la recta`, qLine: 'Quina fracció marca la fletxa?', qQty: (f, T) => `Quant és ${f} de ${T}?`,
            qQtyF: (c, T) => `Quina fracció de ${T} són ${c}?`, qMixT: 'Quin nombre mixt és igual a aquesta fracció?', qImpT: 'Quina fracció és igual a aquest nombre mixt?',
            qDec: f => `Quin decimal és ${f}?`, qPct: f => `Quin percentatge és ${f}?`, qD2F: x => `Quina fracció és ${x}?`,
            exFrac: (n, d) => `Partim el tot en ${d} parts iguals (denominador) i agafem ${n} (numerador): ${n}/${d}.`,
            exCmpSame: (a, b, s) => `Els trossos són de la mateixa mida, així que es comparen els numeradors: ${a.n} ${s} ${b.n}. Per tant ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `Multipliquem en creu: ${a.n}×${b.d} = ${x} i ${b.n}×${a.d} = ${y}. Com que ${x} ${s} ${y}, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `Multipliquem a dalt i a baix per ${k}: ${f.n}×${k} = ${t.n} i ${f.d}×${k} = ${t.d}. Així ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `Amb el mateix denominador se sumen els numeradors i el denominador no canvia: ${a.n} + ${b.n} = ${s.n}, així ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `La recta entre 0 i 1 està partida en ${d} parts iguals i la marca és a la part ${n}: ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `Repartim ${T} en ${d} grups iguals: ${T} ÷ ${d} = ${g}. Agafem ${n}: ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `Dividim a dalt i a baix entre ${g}: ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} i sobren ${r}: ${w === 1 ? 'és 1 enter' : `són ${w} enters`} i ${r}/${d} més, és a dir ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} ${w === 1 ? 'enter és' : 'enters són'} ${w}×${d} = ${w * d} trossos; amb ${r} més són ${n} trossos de ${d}: ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = ${pct} %. El percentatge diu quants de cada 100.`,
            liveQty: (f, T, g, R) => `${f} de ${T} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'Una fracció diu quantes parts agafem d\'un tot partit en parts iguals. Toca els trossos de la pizza per acolorir-los i mira com canvia la fracció.',
                id2: 'Com més trossos té la pizza, més petits són. Canvia en quantes parts partim amb + i − i acoloreix els que vulguis.',
                cmp1: 'Si els trossos són iguals (mateix denominador), guanya la fracció amb més trossos acolorits. Acoloreix les dues barres i compara.',
                cmp2: 'Si els trossos són diferents, mira quanta barra està acolorida: 1/2 és més que 1/4 encara que el 4 sigui més gran que el 2.',
                eq: 'Les fraccions equivalents ocupen el mateix tros del mur. Toca un tros i mira quines altres files queden igual de plenes.',
                add: 'Amb el mateix denominador els trossos són iguals: se sumen els numeradors i el denominador es queda igual.',
                mix: 'Repàs de tot: identifica, compara, busca equivalents i suma. Mira primer el dibuix i després pensa.',
                line: 'A la recta numèrica, com més a la dreta, més gran és la fracció. Toca una marca per col·locar la fracció.',
                qty: 'Per trobar una fracció d\'una quantitat, reparteix la quantitat en tants grups com diu el denominador i agafa els grups que diu el numerador.',
                mixed: 'Un nombre mixt és un enter més una fracció. Si la fracció és més gran que 1, treu les pizzes senceres: 7/4 = 1 i 3/4.',
                dec: 'Una fracció també s\'escriu com a decimal i com a percentatge: 1/2 = 0,5 = 50 %. El percentatge és «quants de cada 100».'
            },
            k: { line: 'A la recta', qty: 'Fracció d\'una quantitat', mixed: 'Nombres mixtos', dec: 'Decimals i percentatges' }
        },
        fr: {
            learnBtn: 'Apprendre', skip: 'Passer', exLabel: (i, n) => `Exemple ${i} sur ${n}`, exNext: 'Exemple suivant', goPractice: 'On s\'entraîne !', look: 'Regarde :',
            guided: (i, n) => `Entraînement guidé ${i} sur ${n}`, hintL: 'Indice :', retry: 'Réessayer', retryT: 'Presque, regarde le dessin.', check: 'Vérifier',
            numLabel: 'Numérateur = combien de parts on prend', denLabel: 'Dénominateur = en combien de parts on coupe', parts: 'Parts', less: 'moins', more: 'plus', sep: ',',
            liveFrac: (n, d) => `${n} ${n === 1 ? 'part' : 'parts'} sur ${d} = ${n}/${d}`, tapHint: 'Touche les parts pour les colorier',
            qBuild: f => `Colorie ${f}`, qPlace: f => `Marque ${f} sur la droite`, qLine: 'Quelle fraction montre la flèche ?', qQty: (f, T) => `Combien font ${f} de ${T} ?`,
            qQtyF: (c, T) => `Quelle fraction de ${T} font ${c} ?`, qMixT: 'Quel nombre mixte est égal à cette fraction ?', qImpT: 'Quelle fraction est égale à ce nombre mixte ?',
            qDec: f => `Quel nombre décimal est ${f} ?`, qPct: f => `Quel pourcentage est ${f} ?`, qD2F: x => `Quelle fraction est ${x} ?`,
            exFrac: (n, d) => `On coupe le tout en ${d} parts égales (dénominateur) et on en prend ${n} (numérateur) : ${n}/${d}.`,
            exCmpSame: (a, b, s) => `Les parts ont la même taille, donc on compare les numérateurs : ${a.n} ${s} ${b.n}. Donc ${fs_(a)} ${s} ${fs_(b)}.`,
            exCmpDiff: (a, b, s, x, y) => `On multiplie en croix : ${a.n}×${b.d} = ${x} et ${b.n}×${a.d} = ${y}. Comme ${x} ${s} ${y}, ${fs_(a)} ${s} ${fs_(b)}.`,
            exEq: (f, t, k) => `On multiplie en haut et en bas par ${k} : ${f.n}×${k} = ${t.n} et ${f.d}×${k} = ${t.d}. Donc ${fs_(f)} = ${fs_(t)}.`,
            exAdd: (a, b, s) => `Avec le même dénominateur on additionne les numérateurs et le dénominateur ne change pas : ${a.n} + ${b.n} = ${s.n}, donc ${fs_(a)} + ${fs_(b)} = ${fs_(s)}.`,
            exLine: (n, d) => `La droite entre 0 et 1 est coupée en ${d} parts égales et le repère est sur la part ${n} : ${n}/${d}.`,
            exQty: (n, d, T, g, R) => `On partage ${T} en ${d} groupes égaux : ${T} ÷ ${d} = ${g}. On en prend ${n} : ${n} × ${g} = ${R}.`,
            exQtyF: (c, T, g, f) => `On divise en haut et en bas par ${g} : ${c}/${T} = ${fs_(f)}.`,
            exMixUp: (n, d, w, r) => `${n} ÷ ${d} = ${w} et il reste ${r} : ${w} ${w === 1 ? 'entier' : 'entiers'} et ${r}/${d} en plus, soit ${w} ${r}/${d}.`,
            exMixDown: (w, r, d, n) => `${w} ${w === 1 ? 'entier fait' : 'entiers font'} ${w}×${d} = ${w * d} parts ; avec ${r} de plus, ça fait ${n} parts de ${d} : ${n}/${d}.`,
            exDec: (f, c, dec, pct) => `${fs_(f)} = ${c}/100 = ${dec} = ${pct} %. Le pourcentage dit combien pour 100.`,
            liveQty: (f, T, g, R) => `${f} de ${T} = ${g} × ${f.split('/')[0]} = ${R}`,
            learn: {
                id1: 'Une fraction dit combien de parts on prend dans un tout coupé en parts égales. Touche les parts de la pizza pour les colorier et regarde la fraction changer.',
                id2: 'Plus la pizza a de parts, plus elles sont petites. Change en combien de parts on coupe avec + et − et colorie celles que tu veux.',
                cmp1: 'Quand les parts sont égales (même dénominateur), la fraction avec le plus de parts coloriées gagne. Colorie les deux barres et compare.',
                cmp2: 'Quand les parts sont différentes, regarde quelle quantité de barre est coloriée : 1/2 est plus grand que 1/4 même si 4 est plus grand que 2.',
                eq: 'Les fractions équivalentes occupent la même place dans le mur. Touche une part et regarde quelles autres lignes sont remplies pareil.',
                add: 'Avec le même dénominateur les parts sont égales : on additionne les numérateurs et le dénominateur reste le même.',
                mix: 'On révise tout : reconnaître, comparer, trouver des équivalentes et additionner. Regarde d\'abord le dessin, puis réfléchis.',
                line: 'Sur la droite graduée, plus on va à droite, plus la fraction est grande. Touche un repère pour placer la fraction.',
                qty: 'Pour trouver une fraction d\'une quantité, partage la quantité en autant de groupes que le dénominateur et prends autant de groupes que le numérateur.',
                mixed: 'Un nombre mixte est un entier plus une fraction. Si la fraction dépasse 1, sors les pizzas entières : 7/4 = 1 et 3/4.',
                dec: 'Une fraction s\'écrit aussi en nombre décimal et en pourcentage : 1/2 = 0,5 = 50 %. Le pourcentage veut dire « pour 100 ».'
            },
            k: { line: 'Sur la droite', qty: 'Fraction d\'une quantité', mixed: 'Nombres mixtes', dec: 'Décimaux et pourcentages' }
        }
    };
    for (const l in UX) { const { k, ...rest } = UX[l]; Object.assign(UI[l], rest); Object.assign(UI[l].k, k); }

    // ===================== PURE LOGIC (no DOM) =====================
    // maxD = largest denominator, types = question kinds, learn = interactive widget of the learn step,
    // guided = question kind of the two guided exercises, ex = three worked examples.
    const UNITS = [
        { id: 'id1',  icon: '🍕', types: ['id', 'build', 'id'],        maxD: 5,  shapes: ['pizza'], len: 8, learn: 'build', guided: 'build',
          ex: [{ n: 1, d: 2 }, { n: 3, d: 4 }, { n: 2, d: 3 }] },
        { id: 'id2',  icon: '🍫', types: ['id', 'build', 'id'],        maxD: 8,  shapes: ['pizza', 'bar'], len: 8, learn: 'build', guided: 'build', shape: 'bar',
          ex: [{ n: 3, d: 8 }, { n: 5, d: 6 }, { n: 4, d: 5 }] },
        { id: 'cmp1', icon: '⚖️', types: ['cmp', 'id'], cmpMode: 'sameD', maxD: 8, shapes: ['pizza', 'bar'], len: 8, learn: 'two', guided: 'cmp',
          ex: [{ a: { n: 2, d: 5 }, b: { n: 4, d: 5 } }, { a: { n: 5, d: 8 }, b: { n: 3, d: 8 } }, { a: { n: 3, d: 6 }, b: { n: 3, d: 6 } }] },
        { id: 'cmp2', icon: '🔍', types: ['cmp', 'id'], cmpMode: 'any',   maxD: 8, shapes: ['bar'], len: 8, learn: 'two', guided: 'cmp',
          ex: [{ a: { n: 1, d: 2 }, b: { n: 1, d: 4 } }, { a: { n: 2, d: 3 }, b: { n: 3, d: 5 } }, { a: { n: 3, d: 4 }, b: { n: 6, d: 8 } }] },
        { id: 'eq',   icon: '🟰', types: ['eq', 'eq', 'cmp'], cmpMode: 'any', maxD: 12, shapes: ['bar'], len: 8, learn: 'wall', guided: 'eq',
          ex: [{ n: 1, d: 2 }, { n: 2, d: 3 }, { n: 3, d: 4 }] },
        { id: 'add',  icon: '➕', types: ['add', 'id'],               maxD: 8,  shapes: ['bar', 'pizza'], len: 8, learn: 'add', guided: 'add',
          ex: [{ a: { n: 1, d: 4 }, b: { n: 2, d: 4 } }, { a: { n: 2, d: 6 }, b: { n: 3, d: 6 } }, { a: { n: 3, d: 8 }, b: { n: 4, d: 8 } }] },
        { id: 'mix',  icon: '🏆', types: ['id', 'cmp', 'eq', 'add'], cmpMode: 'any', maxD: 8, shapes: ['pizza', 'bar'], len: 10, learn: 'build', guided: 'id',
          ex: [{ n: 2, d: 6 }, { n: 5, d: 8 }, { n: 3, d: 4 }] },
        { id: 'line', icon: '📏', types: ['line', 'place', 'cmp'], cmpMode: 'any', maxD: 8, shapes: ['line'], len: 8, learn: 'line', guided: 'place',
          ex: [{ n: 1, d: 2 }, { n: 3, d: 4 }, { n: 2, d: 5, b: { n: 3, d: 5 } }] },
        { id: 'qty',  icon: '🎁', types: ['qty', 'qty', 'qtyf'],       maxD: 6,  shapes: ['bar'], len: 8, learn: 'qty', guided: 'qty',
          ex: [{ n: 1, d: 4, k: 3 }, { n: 2, d: 3, k: 4 }, { n: 3, d: 5, k: 2 }] },
        { id: 'mixed', icon: '🥧', types: ['mix', 'mix'],             maxD: 6,  shapes: ['pizza'], len: 8, learn: 'mixed', guided: 'mix',
          ex: [{ n: 7, d: 4 }, { n: 5, d: 3 }, { n: 11, d: 4 }] },
        { id: 'dec',  icon: '💯', types: ['dec', 'pct', 'd2f'],        maxD: 10, shapes: ['bar'], len: 8, learn: 'dec', guided: 'dec',
          ex: [{ n: 1, d: 2 }, { n: 3, d: 4 }, { n: 1, d: 5 }] }
    ];
    const PASS_RATIO = 0.6;
    const SEEN_CAP = 200;
    const DECS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    // ---- fraction maths (pure) ----
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
    const simplify = f => { const g = gcd(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
    /** -1 if a<b, 0 if equal, 1 if a>b (cross multiplication, no floats). */
    const compare = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
    const equivalent = (a, b) => compare(a, b) === 0;
    const add = (a, b) => a.d === b.d ? { n: a.n + b.n, d: a.d } : { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
    const fkey = f => f.n + '/' + f.d;
    const symOf = c => (c < 0 ? '<' : c > 0 ? '>' : '=');
    /** Improper fraction -> whole part and proper remainder. */
    const toMixed = f => ({ w: Math.floor(f.n / f.d), n: f.n % f.d, d: f.d });
    const fromMixed = m => ({ n: m.w * m.d + m.n, d: m.d });
    /** Decimal text of n/d with at most two decimals ('0.25'), percentage as integer. */
    const decStr = f => String(Math.round(f.n / f.d * 100) / 100);
    const pctOf = f => Math.round(f.n * 100 / f.d);
    const fmtDec = (s, L) => s.replace('.', L.sep);

    /** Distinct wrong fractions (same denominator, or same numerator) for options. */
    function fractionOptions(correct, r = Math.random, n = 4, maxN) {
        const out = [correct], seen = new Set([fkey(correct)]);
        const cap = maxN || correct.d;
        const tryAdd = f => { if (f.n >= 1 && f.n <= cap && f.d >= 2 && !equivalent(f, correct) && !seen.has(fkey(f)) && out.length < n) { seen.add(fkey(f)); out.push(f); } };
        shuffle([-2, -1, 1, 2, 3, -3], r).forEach(k => tryAdd({ n: correct.n + k, d: correct.d }));
        tryAdd({ n: correct.n, d: correct.d + 1 }); tryAdd({ n: correct.n, d: Math.max(2, correct.d - 1) });
        let g = 0; while (out.length < n && g++ < 60) tryAdd({ n: ri(1, cap, r), d: correct.d + ri(0, 2, r) });
        return shuffle(out, r);
    }
    /** n distinct values built from the answer and candidate wrong ones (filtered by ok). */
    function distinctOptions(answer, cands, ok, r, n = 4) {
        const seen = new Set([answer]), out = [answer];
        shuffle(cands.slice(), r).forEach(c => { if (ok(c) && !seen.has(c) && out.length < n) { seen.add(c); out.push(c); } });
        return out;
    }

    function makeQuestion(u, type, r = Math.random) {
        const shape = () => pick(u.shapes, r);
        const base = { type, unit: u.id };
        if (type === 'id' || type === 'build') {
            const d = ri(2, u.maxD, r), n = ri(1, d - 1, r), f = { n, d }, shp = type === 'build' ? pick(u.shapes.filter(s => s !== 'line').length ? u.shapes.filter(s => s !== 'line') : ['pizza'], r) : shape();
            const q = Object.assign(base, { shape: shp, f, key: `f|${n}/${d}` });
            if (type === 'id') { q.answer = f; q.options = fractionOptions(f, r); } else q.answer = n;
            return q;
        }
        if (type === 'cmp') {
            let a, b, g = 0;
            do {
                if (u.cmpMode === 'sameD') { const d = ri(3, u.maxD, r); a = { n: ri(1, d - 1, r), d }; b = { n: ri(1, d - 1, r), d }; if (r() < .15) b = { n: a.n, d }; }
                else { const d1 = ri(2, u.maxD, r), d2 = ri(2, u.maxD, r); a = { n: ri(1, d1 - 1, r), d: d1 }; b = { n: ri(1, d2 - 1, r), d: d2 }; if (r() < .2) { b = { n: a.n * 2, d: a.d * 2 }; if (b.d > 12) b = { n: a.n, d: a.d }; } }
            } while (a.d === b.d && a.n === b.n && r() < .85 && g++ < 20);
            const c = compare(a, b), ks = [fkey(a), fkey(b)].sort();
            return Object.assign(base, { shape: shape(), a, b, answer: c < 0 ? 'R' : c > 0 ? 'L' : 'E', key: `cmp|${ks[0]}|${ks[1]}` });
        }
        if (type === 'eq') {
            const d = ri(2, 6, r), n = ri(1, d - 1, r), k = ri(2, Math.max(2, Math.floor(u.maxD / d)), r), t = { n: n * k, d: d * k };
            const f = { n, d }, opts = fractionOptions({ n: t.n, d: t.d }, r, 4, t.d - 1).filter(x => x.d === t.d).map(x => x.n);
            for (let v = 1; opts.length < 4 && v < t.d; v++) if (!opts.includes(v)) opts.push(v);
            shuffle(opts, r);
            return Object.assign(base, { shape: 'bar', f, target: t, answer: t.n, options: opts, key: `eq|${n}/${d}|${k}` });
        }
        if (type === 'add') {
            const d = ri(3, u.maxD, r), a = ri(1, d - 2, r), b = ri(1, d - a - (r() < .5 ? 0 : 1) || 1, r), s = { n: a + b, d };
            return Object.assign(base, { shape: shape(), a: { n: a, d }, b: { n: b, d }, answer: s, options: fractionOptions(s, r, 4, d), key: `add|${[a + '/' + d, b + '/' + d].sort().join('|')}` });
        }
        if (type === 'line' || type === 'place') {
            const d = ri(2, u.maxD, r), n = ri(1, d - 1, r), f = { n, d };
            const q = Object.assign(base, { f, key: `line|${n}/${d}` });
            if (type === 'line') { q.answer = f; q.options = fractionOptions(f, r); } else q.answer = n;
            return q;
        }
        if (type === 'qty') {
            const d = ri(2, u.maxD, r), n = ri(1, d - 1, r), k = ri(2, 6, r), T = d * k, R = n * k;
            const opts = distinctOptions(R, [k, (d - n) * k, R + k, R - k, T - R + 1, R + 1, R - 1, T, n + k], c => c >= 1 && c !== R, r);
            for (let v = 1; opts.length < 4; v++) if (!opts.includes(R + v + 1)) opts.push(R + v + 1);
            return Object.assign(base, { f: { n, d }, T, g: k, answer: R, options: shuffle(opts, r), key: `qty|${n}/${d}|${T}` });
        }
        if (type === 'qtyf') {
            let n, d, g = 0; do { d = ri(2, u.maxD, r); n = ri(1, d - 1, r); } while (gcd(n, d) !== 1 && g++ < 50);
            const k = ri(2, 6, r), f = { n, d };
            return Object.assign(base, { f, c: n * k, T: d * k, k, answer: f, options: fractionOptions(f, r, 4, d), key: `qtyf|${n * k}|${d * k}` });
        }
        if (type === 'mix') {
            const d = ri(2, u.maxD, r), w = ri(1, 3, r), rem = ri(1, d - 1, r), m = { w, n: rem, d }, imp = fromMixed(m);
            if (r() < .5) {
                const out = distinctOptions(JSON.stringify(m), [{ w: w + 1, n: rem, d }, { w: w - 1, n: rem, d }, { w, n: rem + 1, d }, { w, n: rem - 1, d }, { w: rem, n: w, d }, { w: w + 1, n: rem - 1, d }].map(x => JSON.stringify(x)),
                    c => { const x = JSON.parse(c); return x.w >= 1 && x.n >= 1 && x.n < x.d; }, r).map(s => JSON.parse(s));
                for (let v = 1; out.length < 4; v++) { const x = { w: w + v + 1, n: rem, d }; out.push(x); }
                return Object.assign(base, { dir: 'up', f: imp, answer: m, options: shuffle(out, r), key: `mix|${imp.n}/${d}` });
            }
            return Object.assign(base, { dir: 'down', m, answer: imp, options: fractionOptions(imp, r, 4, 4 * d), key: `mix|${imp.n}/${d}` });
        }
        // dec, pct, d2f
        const f0 = pick(DECS, r), f = { n: f0[0], d: f0[1] }, v = f.n / f.d, p = pctOf(f);
        if (type === 'dec') {
            const out = distinctOptions(decStr(f), [v + .1, v - .1, v + .25, v - .25, v + .2, v - .2, v + .5, v - .5, Number(`0.${f.n}${f.d}`), f.d / 10].map(x => String(Math.round(x * 100) / 100)), c => Number(c) > 0 && Number(c) < 1, r);
            for (let i = 1; out.length < 4; i++) { const c = String(Math.round((v + i * .05) * 100) / 100); if (!out.includes(c) && Number(c) < 1) out.push(c); else if (i > 40) break; }
            return Object.assign(base, { f, answer: decStr(f), options: shuffle(out, r), key: `dec|d|${fkey(f)}` });
        }
        if (type === 'pct') {
            const out = distinctOptions(String(p), [p + 10, p - 10, p + 25, p - 25, p + 5, p - 5, 100 - p, p * 2].map(String), c => Number(c) > 0 && Number(c) < 100, r);
            for (let i = 1; out.length < 4; i++) { const c = String(p + i * 15); if (!out.includes(c) && Number(c) < 100) out.push(c); else if (i > 20) break; }
            return Object.assign(base, { f, answer: String(p), options: shuffle(out, r), key: `dec|p|${fkey(f)}` });
        }
        return Object.assign(base, { f, dec: decStr(f), answer: f, options: fractionOptions(f, r, 4, f.d), key: `dec|f|${fkey(f)}` });
    }

    /** A question whose key is not in this lesson (local) nor in the recent ring buffer (seen); when impossible, the least recently seen one. */
    function makeUnique(u, type, r, seen, local) {
        let best = null, bestScore = Infinity;
        for (let i = 0; i < 60; i++) {
            const q = makeQuestion(u, type, r);
            const sc = local && local.has(q.key) ? 1e6 : seen && seen.has(q.key) ? 1 + (seen.rank ? seen.rank(q.key) : 0) : 0;
            if (sc === 0) return q;
            if (sc < bestScore) { best = q; bestScore = sc; }
        }
        best.repeat = true; return best;
    }

    function makeLesson(u, r = Math.random, seen = null) {
        const out = [], local = new Set(); let last = '';
        for (let i = 0; i < u.len; i++) {
            let t, g = 0; do { t = pick(u.types, r); } while (u.types.length > 1 && t === last && g++ < 6);
            let q = makeUnique(u, t, r, seen, local);
            if (q.repeat) for (const t2 of shuffle([...new Set(u.types)], r)) { const q2 = makeUnique(u, t2, r, seen, local); if (!q2.repeat) { q = q2; t = t2; break; } }
            last = t; local.add(q.key); out.push(q);
        }
        return out;
    }
    /** Two guided exercises (interactive when the lesson allows it) with the method as a hint. */
    function makeGuided(u, r = Math.random, seen = null) {
        const out = [], local = new Set();
        for (let i = 0; i < 2; i++) { const q = makeUnique(u, u.guided, r, seen, local); q.guided = true; local.add(q.key); out.push(q); }
        return out;
    }

    /** v: fraction {n,d} (id, add, line, qtyf, d2f, mix down), 'L'|'R'|'E' (cmp), number (eq, qty, build, place), string (dec, pct), {w,n,d} (mix up). */
    function isCorrect(q, v) {
        switch (q.type) {
            case 'id': case 'add': case 'line': case 'qtyf': case 'd2f': return !!v && v.n === q.answer.n && v.d === q.answer.d;
            case 'cmp': return v === q.answer;
            case 'eq': case 'qty': case 'build': case 'place': return Number(v) === q.answer;
            case 'dec': case 'pct': return v === q.answer;
            case 'mix': return q.dir === 'up' ? !!v && v.w === q.answer.w && v.n === q.answer.n && v.d === q.answer.d : !!v && v.n === q.answer.n && v.d === q.answer.d;
            default: return false;
        }
    }
    const stars = (correct, total) => { const miss = total - correct; return miss <= 0 ? 3 : miss <= 2 ? 2 : 1; };
    const passed = (correct, total) => total > 0 && correct / total >= PASS_RATIO;

    /** Ring buffer of recent question keys per player ('fractions_seen_' + owner), persisted through a getItem/setItem storage. */
    function SeenStore(storage, owner, cap) {
        cap = cap || SEEN_CAP;
        const sk = 'fractions_seen_' + owner;
        let arr = [];
        try { const v = JSON.parse(storage.getItem(sk)); if (Array.isArray(v)) arr = v.filter(x => typeof x === 'string').slice(-cap); } catch (e) { arr = []; }
        const set = new Set(arr);
        const save = () => { try { storage.setItem(sk, JSON.stringify(arr)); } catch (e) { /* storage full or blocked */ } };
        return {
            storageKey: sk,
            has: k => set.has(k),
            rank: k => arr.indexOf(k),
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

    // ---- explanations (pure): a sentence that says WHY, plus what to draw highlighted ----
    const langOf = l => (UI[l] ? UI[l] : UI.es);
    function cmpText(a, b, L) {
        const c = compare(a, b), s = symOf(c);
        return a.d === b.d ? L.exCmpSame(a, b, s) : L.exCmpDiff(a, b, s, a.n * b.d, b.n * a.d);
    }
    /** Returns {text, visuals}. visuals: shape {shape,f}, line {f,f2?}, groups {d,g,n}, mixed {n,d}, grid {pct}. */
    function explain(q, lang) {
        const L = langOf(lang), sh = (shape, f) => ({ k: 'shape', shape, f });
        switch (q.type) {
            case 'id': case 'build': return { text: L.exFrac(q.f.n, q.f.d), visuals: [sh(q.shape, q.f)] };
            case 'cmp': return { text: cmpText(q.a, q.b, L), visuals: [sh(q.shape, q.a), sh(q.shape, q.b)] };
            case 'eq': return { text: L.exEq(q.f, q.target, q.target.d / q.f.d), visuals: [sh('bar', q.f), sh('bar', q.target)] };
            case 'add': return { text: L.exAdd(q.a, q.b, q.answer), visuals: [sh(q.shape, q.a), sh(q.shape, q.b), sh(q.shape, q.answer)] };
            case 'line': case 'place': return { text: L.exLine(q.f.n, q.f.d), visuals: [{ k: 'line', f: q.f }] };
            case 'qty': return { text: L.exQty(q.f.n, q.f.d, q.T, q.g, q.answer), visuals: [{ k: 'groups', d: q.f.d, g: q.g, n: q.f.n }] };
            case 'qtyf': return { text: L.exQtyF(q.c, q.T, gcd(q.c, q.T), q.answer), visuals: [{ k: 'groups', d: q.f.d, g: q.k, n: q.f.n }] };
            case 'mix': {
                if (q.dir === 'up') return { text: L.exMixUp(q.f.n, q.f.d, q.answer.w, q.answer.n), visuals: [{ k: 'mixed', n: q.f.n, d: q.f.d }] };
                return { text: L.exMixDown(q.m.w, q.m.n, q.m.d, q.answer.n), visuals: [{ k: 'mixed', n: q.answer.n, d: q.answer.d }] };
            }
            default: return { text: L.exDec(q.f, q.f.n * 100 / q.f.d, fmtDec(decStr(q.f), L), pctOf(q.f)), visuals: [{ k: 'grid', pct: pctOf(q.f) }] };
        }
    }
    /** Text of a worked example (learn step). */
    function exampleText(kind, ex, lang) {
        const L = langOf(lang), look = L.look + ' ';
        if (kind === 'two') return look + cmpText(ex.a, ex.b, L);
        if (kind === 'add') return look + L.exAdd(ex.a, ex.b, add(ex.a, ex.b));
        if (kind === 'wall') return look + L.exEq({ n: ex.n, d: ex.d }, { n: ex.n * 2, d: ex.d * 2 }, 2);
        if (kind === 'line') return look + (ex.b ? cmpText({ n: ex.n, d: ex.d }, ex.b, L) : L.exLine(ex.n, ex.d));
        if (kind === 'qty') return look + L.exQty(ex.n, ex.d, ex.d * ex.k, ex.k, ex.n * ex.k);
        if (kind === 'mixed') { const m = toMixed(ex); return look + L.exMixUp(ex.n, ex.d, m.w, m.n); }
        if (kind === 'dec') return look + L.exDec(ex, ex.n * 100 / ex.d, fmtDec(decStr(ex), L), pctOf(ex));
        return look + L.exFrac(ex.n, ex.d);
    }
    /** Short label for the right answer shown after a mistake (plain text). */
    function answerLabel(q, lang) {
        const L = langOf(lang);
        if (q.type === 'cmp') return q.answer === 'L' ? L.left : q.answer === 'R' ? L.right : L.equal;
        if (q.type === 'eq') return `${q.f.n}/${q.f.d} = ${q.target.n}/${q.target.d}`;
        if (q.type === 'build' || q.type === 'place') return `${q.f.n}/${q.f.d}`;
        if (q.type === 'qty') return String(q.answer);
        if (q.type === 'dec') return fmtDec(q.answer, L);
        if (q.type === 'pct') return q.answer + ' %';
        if (q.type === 'mix' && q.dir === 'up') return `${q.answer.w} ${q.answer.n}/${q.answer.d}`;
        return `${q.answer.n}/${q.answer.d}`;
    }
    /** The sentence that asks a question (text only; the picture is drawn by the UI). */
    function promptOf(q, lang) {
        const L = langOf(lang), f = q.f && `${q.f.n}/${q.f.d}`;
        switch (q.type) {
            case 'id': return L.qId;
            case 'build': return L.qBuild(f);
            case 'cmp': return L.qCmp;
            case 'eq': return L.qEq;
            case 'add': return L.qAdd;
            case 'line': return L.qLine;
            case 'place': return L.qPlace(f);
            case 'qty': return L.qQty(f, q.T);
            case 'qtyf': return L.qQtyF(q.c, q.T);
            case 'mix': return q.dir === 'up' ? L.qMixT : L.qImpT;
            case 'dec': return L.qDec(f);
            case 'pct': return L.qPct(f);
            default: return L.qD2F(fmtDec(q.dec, L));
        }
    }

    // ===================== DOM =====================
    const S = { user: null, prog: { units: {}, learned: {}, xp: 0, streak: 0, last: '' }, idx: 0, u: null, queue: [], qi: 0, total: 0, correct: 0, run: 0, bestRun: 0, q: null, locked: false, t0: 0,
        phase: 'practice', guidedQ: [], gi: 0, seen: null, learn: null, widget: null, shaded: [], place: null };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'fractions_prog_' + owner();
    const blank = () => ({ units: {}, learned: {}, xp: 0, streak: 0, last: '' });
    const safeStore = () => { try { return window.localStorage; } catch (e) { return null; } };
    function load() { try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); } if (!S.prog.learned || typeof S.prog.learned !== 'object') S.prog.learned = {}; }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const firstN = (n, d) => Array.from({ length: d }, (_, i) => i < n);
    const count = a => a.filter(Boolean).length;

    // ---- drawing ----
    const NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    const FILL = '#f59e0b', EMPTY = '#fff7ed', LINE = '#9a3412';
    function makeTappable(node, label, fn) {
        node.setAttribute('role', 'button'); node.setAttribute('tabindex', '0'); node.setAttribute('aria-label', label); node.classList.add('fr-tap');
        node.addEventListener('click', fn);
        node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
    }
    /**
     * Pizza or bar split in f.d equal pieces. Coloured pieces: o.shaded (array of booleans) or the first f.n.
     * o.tap(i) makes every piece a button; o.hl numbers the coloured pieces (used when explaining a mistake).
     */
    function drawShape(shape, f, small, o = {}) {
        const t = T(), on = o.shaded || firstN(f.n, f.d), n = count(on);
        const mk = (node, i) => { if (o.tap) makeTappable(node, `${i + 1}/${f.d}`, () => o.tap(i)); };
        let num = 0;
        if (shape === 'pizza') {
            const svg = svgEl('svg', { viewBox: '0 0 120 120', class: 'fr-shape' + (small ? ' small' : '') + (o.tap ? ' tappable' : ''), role: o.tap ? 'group' : 'img', 'aria-label': t.piece(n, f.d) });
            svgEl('circle', { cx: 60, cy: 60, r: 56, fill: '#d97706' }, svg);
            for (let i = 0; i < f.d; i++) {
                const a0 = i / f.d * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / f.d * 2 * Math.PI - Math.PI / 2, R = 50;
                const x0 = 60 + R * Math.cos(a0), y0 = 60 + R * Math.sin(a0), x1 = 60 + R * Math.cos(a1), y1 = 60 + R * Math.sin(a1);
                const path = `M60 60 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${1 / f.d > .5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
                const p = svgEl('path', { d: path, fill: on[i] ? '#ef4444' : EMPTY, stroke: LINE, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg); mk(p, i);
                const m = (a0 + a1) / 2;
                if (on[i]) {
                    if (o.hl) { num++; const tx = svgEl('text', { x: 60 + 30 * Math.cos(m), y: 60 + 30 * Math.sin(m) + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#fff', 'font-family': 'sans-serif', 'pointer-events': 'none' }, svg); tx.textContent = num; }
                    else svgEl('circle', { cx: 60 + 30 * Math.cos(m), cy: 60 + 30 * Math.sin(m), r: 4, fill: '#fde68a', 'pointer-events': 'none' }, svg);
                }
            }
            return svg;
        }
        const svg = svgEl('svg', { viewBox: '0 0 240 60', class: 'fr-shape bar' + (small ? ' small' : '') + (o.tap ? ' tappable' : ''), role: o.tap ? 'group' : 'img', 'aria-label': t.piece(n, f.d) });
        const w = 232 / f.d;
        for (let i = 0; i < f.d; i++) {
            const r = svgEl('rect', { x: 4 + i * w, y: 6, width: w, height: 48, rx: 4, fill: on[i] ? FILL : EMPTY, stroke: LINE, 'stroke-width': 2.5 }, svg); mk(r, i);
            if (o.hl && on[i]) { num++; const tx = svgEl('text', { x: 4 + i * w + w / 2, y: 36, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#7c2d12', 'font-family': 'sans-serif', 'pointer-events': 'none' }, svg); tx.textContent = num; }
        }
        return svg;
    }
    /** Number line 0..1 cut in f.d parts with an arrow on f.n (and optionally a second blue arrow). o.tap(n) makes the whole line tappable (nearest mark). */
    function drawLine(f, small, o = {}) {
        const svg = svgEl('svg', { viewBox: '0 0 300 74', class: 'fr-shape line' + (small ? ' small' : '') + (o.tap ? ' tappable' : ''), role: o.tap ? 'group' : 'img', 'aria-label': `${f ? f.n + '/' + f.d : ''}` });
        const X = i => 20 + 260 * i / f.d;
        svgEl('line', { x1: 20, y1: 40, x2: 280, y2: 40, stroke: LINE, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
        for (let i = 0; i <= f.d; i++) svgEl('line', { x1: X(i), y1: 30, x2: X(i), y2: 50, stroke: LINE, 'stroke-width': i === 0 || i === f.d ? 4 : 2.5 }, svg);
        [[0, 'start'], [f.d, 'end']].forEach(([i]) => { const tx = svgEl('text', { x: X(i), y: 70, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#7c2d12', 'font-family': 'sans-serif' }, svg); tx.textContent = i === 0 ? '0' : '1'; });
        const arrow = (n, col) => { const x = X(n); svgEl('path', { d: `M${x} 38 L${x - 9} 14 L${x + 9} 14 Z`, fill: col, stroke: '#fff', 'stroke-width': 1.5 }, svg); };
        if (o.mark != null) arrow(o.mark, '#ef4444');
        if (o.mark2 != null) arrow(o.mark2, '#2563eb');
        if (o.tap) {
            const hit = svgEl('rect', { x: 0, y: 0, width: 300, height: 74, fill: 'transparent' }, svg);
            hit.addEventListener('click', ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); o.tap(clamp(Math.round((q.x - 20) / 260 * f.d), 0, f.d)); });
            svg.setAttribute('tabindex', '0');
            svg.addEventListener('keydown', ev => { const dlt = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (dlt) { ev.preventDefault(); o.tap(clamp((o.mark || 0) + dlt, 0, f.d)); } });
        }
        return svg;
    }
    /** d groups of g dots; the first n groups (or tapped ones) are coloured. */
    function drawGroups(d, g, on, small, tap) {
        const cols = d <= 3 ? d : d <= 6 ? 3 : 4, rows = Math.ceil(d / cols), bw = 280 / cols - 8, bh = 52;
        const svg = svgEl('svg', { viewBox: `0 0 300 ${rows * (bh + 8) + 8}`, class: 'fr-shape groups' + (small ? ' small' : ''), role: tap ? 'group' : 'img', 'aria-label': `${d} x ${g}` });
        for (let i = 0; i < d; i++) {
            const x = 10 + (i % cols) * (bw + 8), y = 8 + Math.floor(i / cols) * (bh + 8);
            const r = svgEl('rect', { x, y, width: bw, height: bh, rx: 10, fill: on[i] ? '#fde68a' : EMPTY, stroke: on[i] ? '#d97706' : LINE, 'stroke-width': on[i] ? 4 : 2.5 }, svg);
            if (tap) makeTappable(r, `${i + 1}/${d}`, () => tap(i));
            const per = Math.min(g, 3);
            for (let j = 0; j < g; j++) svgEl('circle', { cx: x + bw / 2 + ((j % per) - (per - 1) / 2) * 16, cy: y + (g > 3 ? 18 + Math.floor(j / per) * 18 : bh / 2), r: 6, fill: on[i] ? '#ef4444' : '#9ca3af', 'pointer-events': 'none' }, svg);
        }
        return svg;
    }
    function drawGrid(pct, small) {
        const svg = svgEl('svg', { viewBox: '0 0 110 110', class: 'fr-shape grid' + (small ? ' small' : ''), role: 'img', 'aria-label': `${pct} %` });
        for (let i = 0; i < 100; i++) svgEl('rect', { x: 5 + (i % 10) * 10, y: 5 + Math.floor(i / 10) * 10, width: 9, height: 9, rx: 1.5, fill: i < pct ? '#ef4444' : EMPTY, stroke: LINE, 'stroke-width': .6 }, svg);
        return svg;
    }
    function drawMixed(n, d) {
        const w = el('div', 'fr-pizzas');
        for (let i = 0, left = n; left > 0; i++, left -= d) w.appendChild(drawShape('pizza', { n: Math.min(d, left), d }, true));
        return w;
    }
    function fracEl(f, big) {
        const w = el('span', 'fr-frac' + (big ? ' big' : '')); w.setAttribute('dir', 'ltr');
        w.appendChild(el('span', 'fr-num', f.n)); w.appendChild(el('span', 'fr-den', f.d));
        w.setAttribute('aria-label', `${f.n}/${f.d}`); return w;
    }
    function mixedEl(m, big) {
        const w = el('span', 'fr-mixed'); w.setAttribute('dir', 'ltr');
        w.appendChild(el('span', 'fr-whole' + (big ? ' big' : ''), m.w)); w.appendChild(fracEl(m, big)); w.setAttribute('aria-label', `${m.w} ${m.n}/${m.d}`); return w;
    }
    function drawVisual(v) {
        if (v.k === 'shape') return drawShape(v.shape, v.f, true, { hl: true });
        if (v.k === 'line') return drawLine(v.f, true, { mark: v.f.n });
        if (v.k === 'groups') return drawGroups(v.d, v.g, firstN(v.n, v.d), true);
        if (v.k === 'mixed') return drawMixed(v.n, v.d, true);
        return drawGrid(v.pct, true);
    }

    // ---- home ----
    function show(id) { ['fr-home', 'fr-learn', 'fr-play', 'fr-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('fr-h1').textContent = t.title; $('fr-sub').textContent = t.sub;
        const st = $('fr-stats'); st.textContent = '';
        st.appendChild(el('span', 'fr-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'fr-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('fr-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'fr-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'fr-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${t.k[u.id]}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'fr-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, t.k[u.id]));
            if (done) info.appendChild(el('div', 'fr-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info);
            if (open) { const lb = el('button', 'fr-lbtn', '📖'); lb.type = 'button'; lb.dataset.learn = u.id; lb.setAttribute('aria-label', `${t.learnBtn}: ${t.k[u.id]}`); lb.onclick = () => { prepare(i); openLearn('start'); }; li.appendChild(lb); }
            path.appendChild(li);
        });
    }

    // ---- learn step: interactive widgets ----
    function stepperUI(label, get, set, min, max) {
        const t = T(), w = el('div', 'fr-step'); w.appendChild(el('span', 'fr-steplabel', label));
        const row = el('div', 'fr-steprow'), val = el('span', 'fr-stepval');
        const mk = (sym, dir, aria) => { const b = el('button', 'fr-key', sym); b.type = 'button'; b.setAttribute('aria-label', `${label} ${aria}`); b.onclick = () => { set(clamp(get() + dir, min, max)); val.textContent = get(); }; return b; };
        row.appendChild(mk('−', -1, t.less)); row.appendChild(val); row.appendChild(mk('+', 1, t.more)); w.appendChild(row); val.textContent = get();
        w.refresh = () => { val.textContent = get(); };
        return w;
    }
    const liveBox = () => $('fr-live');
    function setLive(...nodes) { const b = liveBox(); b.textContent = ''; nodes.forEach(n => b.appendChild(typeof n === 'string' ? el('p', 'fr-livetext', n) : n)); }
    const labelsBlock = () => { const t = T(), w = el('div', 'fr-labels'); w.appendChild(el('div', 'fr-lab num', t.numLabel)); w.appendChild(el('div', 'fr-lab den', t.denLabel)); return w; };
    const coloured = f => { const x = fracEl(f, true); x.classList.add('coloured'); return x; };

    /** Every widget is {root, apply(ex)}; it draws its picture and keeps the live readout up to date. */
    function widgetFor(u) {
        const t = T(), root = el('div', 'fr-widget'), vis = el('div', 'fr-shapewrap'), ctl = el('div', 'fr-ctl');
        root.appendChild(vis); root.appendChild(ctl);
        const kind = u.learn, maxD = Math.min(u.maxD, 8), sameD = u.id === 'cmp1' || kind === 'add';
        let st, api;
        if (kind === 'build') {
            st = { d: 2, sh: firstN(1, 2) }; const shape = u.id === 'id1' || u.id === 'mix' ? 'pizza' : u.id === 'id2' ? 'pizza' : 'bar';
            const ds = stepperUI(t.parts, () => st.d, v => { const n = Math.min(count(st.sh), v); st.d = v; st.sh = firstN(n, v); update(); }, 2, maxD); ctl.appendChild(ds);
            const update = () => {
                vis.textContent = ''; vis.appendChild(drawShape(shape, { n: count(st.sh), d: st.d }, false, { shaded: st.sh, tap: i => { st.sh = st.sh.map((x, j) => (j === i ? !x : x)); update(); } }));
                ds.refresh(); const f = { n: count(st.sh), d: st.d };
                setLive(coloured(f), t.liveFrac(f.n, f.d), labelsBlock());
            };
            api = { apply: ex => { st.d = ex.d; st.sh = firstN(ex.n, ex.d); update(); } };
            vis.dataset.hint = t.tapHint;
        } else if (kind === 'two' || kind === 'add') {
            st = { a: firstN(1, 4), b: firstN(1, 4), da: 4, db: 4 };
            const sa = stepperUI('A', () => st.da, v => { st.a = firstN(Math.min(count(st.a), v), v); st.da = v; if (sameD) { st.b = firstN(Math.min(count(st.b), v), v); st.db = v; } update(); }, 2, maxD);
            ctl.appendChild(sa);
            let sb = null;
            if (!sameD) { sb = stepperUI('B', () => st.db, v => { st.b = firstN(Math.min(count(st.b), v), v); st.db = v; update(); }, 2, maxD); ctl.appendChild(sb); }
            const update = () => {
                vis.textContent = '';
                const mkBar = (key, dKey) => drawShape('bar', { n: count(st[key]), d: st[dKey] }, false, { shaded: st[key], tap: i => { st[key] = st[key].map((x, j) => (j === i ? !x : x)); update(); } });
                vis.appendChild(mkBar('a', 'da')); vis.appendChild(mkBar('b', 'db'));
                const fa = { n: count(st.a), d: st.da }, fb = { n: count(st.b), d: st.db }, row = el('div', 'fr-liverow');
                if (kind === 'add') {
                    const sum = { n: Math.min(fa.n + fb.n, fa.d), d: fa.d };
                    vis.appendChild(drawShape('bar', sum, false, { shaded: firstN(sum.n, sum.d) }));
                    row.appendChild(fracEl(fa, true)); row.appendChild(el('span', 'fr-sym', '+')); row.appendChild(fracEl(fb, true)); row.appendChild(el('span', 'fr-sym', '=')); row.appendChild(fracEl(sum, true));
                } else { row.appendChild(fracEl(fa, true)); row.appendChild(el('span', 'fr-sym', symOf(compare(fa, fb)))); row.appendChild(fracEl(fb, true)); }
                sa.refresh(); if (sb) sb.refresh(); setLive(row);
            };
            api = { apply: ex => { st.da = ex.a.d; st.db = ex.b.d; st.a = firstN(ex.a.n, ex.a.d); st.b = firstN(ex.b.n, ex.b.d); update(); } };
        } else if (kind === 'wall') {
            st = { n: 1, d: 2 }; const ROWS = [1, 2, 3, 4, 6, 8, 12];
            const update = () => {
                vis.textContent = '';
                const svg = svgEl('svg', { viewBox: `0 0 300 ${ROWS.length * 34 + 4}`, class: 'fr-shape wall', role: 'group', 'aria-label': `${st.n}/${st.d}` });
                ROWS.forEach((D, ri_) => {
                    const w = 280 / D, y = 4 + ri_ * 34, exact = (st.n * D) % st.d === 0;
                    for (let i = 0; i < D; i++) {
                        const cov = (i + 1) * st.d <= st.n * D, r = svgEl('rect', { x: 10 + i * w, y, width: w, height: 30, rx: 3, fill: cov ? (exact ? '#ef4444' : '#fecaca') : EMPTY, stroke: LINE, 'stroke-width': 1.8 }, svg);
                        makeTappable(r, `${i + 1}/${D}`, () => { st.n = i + 1; st.d = D; update(); });
                    }
                    const tx = svgEl('text', { x: 10 + w / 2, y: y + 21, 'text-anchor': 'middle', 'font-size': D > 8 ? 11 : 15, 'font-weight': 800, fill: '#7c2d12', 'font-family': 'sans-serif', 'pointer-events': 'none' }, svg); tx.textContent = `1/${D}`;
                });
                vis.appendChild(svg);
                const eqs = ROWS.filter(D => (st.n * D) % st.d === 0 && D > 1).map(D => `${st.n * D / st.d}/${D}`);
                setLive(el('div', 'fr-eqline', eqs.join(' = ')));
            };
            api = { apply: ex => { st.n = ex.n; st.d = ex.d; update(); } };
        } else if (kind === 'line') {
            st = { n: 1, d: 2, b: null };
            const ds = stepperUI(t.parts, () => st.d, v => { st.n = Math.min(st.n, v); st.d = v; st.b = null; update(); }, 2, maxD); ctl.appendChild(ds);
            const update = () => {
                vis.textContent = ''; const bm = st.b && st.b.d === st.d ? st.b.n : null;
                vis.appendChild(drawLine({ n: st.n, d: st.d }, false, { mark: st.n, mark2: bm, tap: n => { st.n = n; update(); } }));
                ds.refresh(); const row = el('div', 'fr-liverow'); row.appendChild(fracEl({ n: st.n, d: st.d }, true));
                if (bm !== null) { row.appendChild(el('span', 'fr-sym', symOf(compare({ n: st.n, d: st.d }, st.b)))); row.appendChild(fracEl(st.b, true)); }
                setLive(row);
            };
            api = { apply: ex => { st.d = ex.d; st.n = ex.n; st.b = ex.b || null; update(); } };
        } else if (kind === 'qty') {
            st = { n: 1, d: 4, k: 3 };
            const ds = stepperUI(t.parts, () => st.d, v => { st.n = Math.min(st.n, v); st.d = v; update(); }, 2, 6); ctl.appendChild(ds);
            const update = () => {
                vis.textContent = '';
                vis.appendChild(drawGroups(st.d, st.k, firstN(st.n, st.d), false, i => { st.n = st.n === i + 1 ? i : i + 1; update(); }));
                ds.refresh(); const f = `${st.n}/${st.d}`;
                setLive(t.liveQty(f, st.d * st.k, st.k, st.n * st.k));
            };
            api = { apply: ex => { st.n = ex.n; st.d = ex.d; st.k = ex.k; update(); } };
        } else if (kind === 'mixed') {
            st = { n: 7, d: 4 };
            const ns = stepperUI(t.numLabel.split(' = ')[0], () => st.n, v => { st.n = v; update(); }, 1, 14); ctl.appendChild(ns);
            const update = () => {
                vis.textContent = ''; vis.appendChild(drawMixed(st.n, st.d)); ns.refresh();
                const m = toMixed({ n: st.n, d: st.d }), row = el('div', 'fr-liverow'); row.appendChild(fracEl({ n: st.n, d: st.d }, true)); row.appendChild(el('span', 'fr-sym', '='));
                row.appendChild(m.n === 0 ? el('span', 'fr-whole big', m.w) : mixedEl(m, true)); setLive(row);
            };
            api = { apply: ex => { st.n = ex.n; st.d = ex.d; update(); } };
        } else { // dec
            st = { n: 1, d: 2 };
            const chips = el('div', 'fr-chips');
            DECS.forEach(([n, d]) => { const b = el('button', 'fr-chip', `${n}/${d}`); b.type = 'button'; b.onclick = () => { st.n = n; st.d = d; update(); }; chips.appendChild(b); });
            ctl.appendChild(chips);
            const update = () => {
                vis.textContent = ''; const f = { n: st.n, d: st.d }; vis.appendChild(drawGrid(pctOf(f)));
                chips.querySelectorAll('.fr-chip').forEach((b, i) => b.classList.toggle('sel', DECS[i][0] === st.n && DECS[i][1] === st.d));
                const row = el('div', 'fr-liverow'); row.appendChild(fracEl(f, true));
                row.appendChild(el('span', 'fr-eqtext', `= ${fmtDec(decStr(f), T())} = ${pctOf(f)} %`)); setLive(row);
            };
            api = { apply: ex => { st.n = ex.n; st.d = ex.d; update(); } };
        }
        api.root = root; return api;
    }

    function openLearn(from) { S.learn = { from, ex: 0 }; show('fr-learn'); buildLearn(); }
    function buildLearn() {
        const t = T(), u = S.u;
        $('fr-l-title').textContent = `${t.lesson} ${S.idx + 1}: ${t.k[u.id]}`;
        $('fr-l-intro').textContent = t.learn[u.id];
        $('fr-skip').textContent = t.skip; $('fr-ex-next').textContent = t.exNext; $('fr-learn-done').textContent = t.goPractice; $('fr-l-quit').setAttribute('aria-label', t.quit);
        const host = $('fr-widget'); host.textContent = '';
        S.widget = widgetFor(u); host.appendChild(S.widget.root);
        renderExample();
    }
    function renderExample() {
        const t = T(), u = S.u, L = S.learn, ex = u.ex[L.ex], last = L.ex >= u.ex.length - 1;
        S.widget.apply(ex);
        $('fr-ex-label').textContent = t.exLabel(L.ex + 1, u.ex.length);
        $('fr-ex-text').textContent = exampleText(u.learn, ex, lang());
        $('fr-ex-next').hidden = last; $('fr-learn-done').hidden = !last;
    }
    function finishLearn(didAll) {
        S.prog.learned[S.u.id] = true; save();
        if (S.learn && S.learn.from === 'play') { show('fr-play'); return; }
        if (didAll) { S.guidedQ = makeGuided(S.u, Math.random, S.seen); S.gi = 0; S.phase = 'guided'; }
        beginPlay();
    }

    // ---- lesson ----
    function prepare(i) {
        S.idx = i; S.u = UNITS[i]; S.seen = SeenStore(safeStore(), owner(), SEEN_CAP);
        S.queue = makeLesson(S.u, Math.random, S.seen); S.total = S.queue.length; S.qi = 0; S.correct = 0; S.run = 0; S.bestRun = 0; S.t0 = Date.now();
        S.phase = 'practice'; S.guidedQ = []; S.gi = 0;
    }
    function start(i) { prepare(i); if (!S.prog.learned[S.u.id]) openLearn('start'); else beginPlay(); }
    function beginPlay() { show('fr-play'); next(); }
    function bar() {
        const g = S.phase === 'guided', p = g ? 0 : Math.round(S.qi / S.total * 100);
        $('fr-barfill').style.width = p + '%'; $('fr-barfill').parentNode.setAttribute('aria-valuenow', p);
        $('fr-count').textContent = g ? T().guided(S.gi + 1, S.guidedQ.length) : `${Math.min(S.qi + 1, S.total)} / ${S.total}`;
        $('fr-learnbtn').textContent = '📖 ' + T().learnBtn;
    }

    function next() {
        $('fr-feedback').hidden = true; S.locked = false;
        if (S.phase === 'guided' && S.gi >= S.guidedQ.length) { S.phase = 'practice'; S.qi = 0; }
        if (S.phase === 'practice' && S.qi >= S.total) return finish();
        S.q = S.phase === 'guided' ? S.guidedQ[S.gi] : S.queue[S.qi]; bar();
        if (S.phase === 'practice' && S.seen) S.seen.add(S.q.key);
        renderQuestion();
    }
    function checkBtn(card, fn) { const ok = el('button', 'fr-btn', T().check); ok.type = 'button'; ok.id = 'fr-check'; ok.onclick = fn; card.appendChild(ok); return ok; }
    function renderQuestion() {
        const t = T(), q = S.q, card = $('fr-card'), L = lang(); card.textContent = ''; card.classList.remove('fr-shake');
        card.appendChild(el('p', 'fr-prompt', promptOf(q, L)));
        if (q.guided) card.appendChild(el('p', 'fr-hintbox', `${t.hintL} ${explain(q, L).text}`));
        const wrap = node => { const w = el('div', 'fr-shapewrap'); w.appendChild(node); card.appendChild(w); };
        switch (q.type) {
            case 'id': wrap(drawShape(q.shape, q.f)); fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f }))); break;
            case 'build': {
                S.shaded = Array(q.f.d).fill(false);
                const w = el('div', 'fr-shapewrap'); card.appendChild(w);
                const upd = () => { w.textContent = ''; w.appendChild(drawShape(q.shape, { n: 0, d: q.f.d }, false, { shaded: S.shaded, tap: i => { if (S.locked) return; S.shaded = S.shaded.map((x, j) => (j === i ? !x : x)); upd(); } })); };
                upd(); card.appendChild(el('p', 'fr-tiphint', t.tapHint));
                checkBtn(card, () => answer(count(S.shaded), $('fr-check'))); break;
            }
            case 'cmp': {
                const row = el('div', 'fr-pair' + (q.shape === 'line' ? ' stack' : ''));
                [q.a, q.b].forEach(f => { const c = el('div', 'fr-pairitem'); c.appendChild(q.shape === 'line' ? drawLine(f, true, { mark: f.n }) : drawShape(q.shape, f, true)); c.appendChild(fracEl(f)); row.appendChild(c); });
                card.appendChild(row);
                const box = el('div', 'fr-opts three'); box.setAttribute('role', 'group');
                [['L', t.left], ['E', t.equal], ['R', t.right]].forEach(([v, lbl]) => { const b = el('button', 'fr-opt small', lbl); b.type = 'button'; b.dataset.v = v; b.onclick = () => answer(v, b); box.appendChild(b); });
                card.appendChild(box); break;
            }
            case 'eq': {
                const rows = el('div', 'fr-eqrows');
                const r1 = el('div', 'fr-eqrow'); r1.appendChild(drawShape('bar', q.f, true)); r1.appendChild(fracEl(q.f, true));
                const r2 = el('div', 'fr-eqrow'); r2.appendChild(drawShape('bar', q.target, true));
                const unk = el('span', 'fr-frac big'); unk.setAttribute('dir', 'ltr'); unk.appendChild(el('span', 'fr-num unk', '?')); unk.appendChild(el('span', 'fr-den', q.target.d)); r2.appendChild(unk);
                rows.appendChild(r1); rows.appendChild(r2); card.appendChild(rows);
                const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
                q.options.forEach(n => { const b = el('button', 'fr-opt', n); b.type = 'button'; b.dataset.v = n; b.onclick = () => answer(n, b); box.appendChild(b); });
                card.appendChild(box); break;
            }
            case 'add': {
                const row = el('div', 'fr-pair');
                const c1 = el('div', 'fr-pairitem'); c1.appendChild(drawShape(q.shape, q.a, true)); c1.appendChild(fracEl(q.a));
                const c2 = el('div', 'fr-pairitem'); c2.appendChild(drawShape(q.shape, q.b, true)); c2.appendChild(fracEl(q.b));
                row.appendChild(c1); row.appendChild(el('span', 'fr-plus', '+')); row.appendChild(c2); card.appendChild(row);
                fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f }))); break;
            }
            case 'line': wrap(drawLine(q.f, false, { mark: q.f.n })); fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f }))); break;
            case 'place': {
                S.place = null; const w = el('div', 'fr-shapewrap'); card.appendChild(w);
                const upd = () => { w.textContent = ''; w.appendChild(drawLine({ n: q.f.n, d: q.f.d }, false, { mark: S.place, tap: n => { if (S.locked) return; S.place = n; upd(); } })); };
                upd(); card.appendChild(el('p', 'fr-tiphint', t.tapHint));
                checkBtn(card, () => { if (S.place !== null) answer(S.place, $('fr-check')); }); break;
            }
            case 'qty': wrap(drawGroups(q.f.d, q.g, Array(q.f.d).fill(false))); card.appendChild(el('div', 'fr-big', `${q.f.n}/${q.f.d} · ${q.T}`)); numOptions(card, q.options); break;
            case 'qtyf': card.appendChild(el('div', 'fr-shapewrap')).appendChild(fracEl({ n: q.c, d: q.T }, true)); fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f }))); break;
            case 'mix':
                if (q.dir === 'up') { card.appendChild(el('div', 'fr-shapewrap')).appendChild(fracEl(q.f, true)); wrap(drawMixed(q.f.n, q.f.d)); fracOptions(card, q.options.map(m => ({ node: mixedEl(m), v: m, id: `${m.w} ${m.n}/${m.d}` }))); }
                else { card.appendChild(el('div', 'fr-shapewrap')).appendChild(mixedEl(q.m, true)); fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f }))); }
                break;
            case 'dec': case 'pct': {
                card.appendChild(el('div', 'fr-shapewrap')).appendChild(fracEl(q.f, true)); wrap(drawGrid(pctOf(q.f)));
                const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
                q.options.forEach(v => { const b = el('button', 'fr-opt', q.type === 'dec' ? fmtDec(v, t) : v + ' %'); b.type = 'button'; b.dataset.v = v; b.onclick = () => answer(v, b); box.appendChild(b); });
                card.appendChild(box); break;
            }
            default: card.appendChild(el('div', 'fr-big', fmtDec(q.dec, t))); wrap(drawGrid(pctOf(q.f))); fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f })));
        }
    }
    function numOptions(card, list) {
        const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
        list.forEach(n => { const b = el('button', 'fr-opt', n); b.type = 'button'; b.dataset.v = n; b.onclick = () => answer(n, b); box.appendChild(b); });
        card.appendChild(box);
    }
    function fracOptions(card, list) {
        const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
        list.forEach(o => { const b = el('button', 'fr-opt'); b.type = 'button'; b.appendChild(o.node); b.dataset.v = o.id || fkey(o.v); b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(box);
    }

    const answerKey = q => (q.type === 'mix' && q.dir === 'up' ? `${q.answer.w} ${q.answer.n}/${q.answer.d}` : q.answer && q.answer.n !== undefined ? fkey(q.answer) : String(q.answer));
    function showFeedback(ok, q, v, o = {}) {
        const t = T(), fb = $('fr-feedback'), L = lang();
        fb.hidden = false; fb.textContent = ''; fb.className = 'fr-feedback ' + (ok ? 'good' : 'bad');
        const col = el('div', 'fr-fbcol');
        if (ok) col.appendChild(el('b', null, pick(t.good)));
        else if (o.retry) col.appendChild(el('b', null, t.retryT));
        else { col.appendChild(el('b', null, t.bad)); col.appendChild(el('span', 'fr-ans', answerLabel(q, L))); }
        if (!ok) {
            const ex = explain(q, L);
            const why = el('p', 'fr-why', ex.text); why.id = 'fr-why'; col.appendChild(why);
            if (!o.retry) { const row = el('div', 'fr-figs'); ex.visuals.forEach(v2 => { const f = el('figure', 'fr-fig'); f.appendChild(drawVisual(v2)); row.appendChild(f); }); col.appendChild(row); }
        }
        const go = el('button', 'fr-btn', o.retry ? t.retry : t.next); go.type = 'button'; go.id = o.retry ? 'fr-retry' : 'fr-continue';
        go.onclick = o.retry ? () => { fb.hidden = true; } : () => { if (S.phase === 'guided') S.gi++; else S.qi++; next(); };
        fb.appendChild(col); fb.appendChild(go); go.focus();
        try { fb.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }

    function answer(v, btn) {
        if (S.locked) return;
        const q = S.q, ok = isCorrect(q, v), guided = S.phase === 'guided';
        if (guided && !ok && !q.tried) { q.tried = true; showFeedback(false, q, v, { retry: true }); return; }
        S.locked = true;
        document.querySelectorAll('#fr-card .fr-opt, #fr-check').forEach(b => { b.disabled = true; });
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (!ok) { const k = answerKey(q); document.querySelectorAll('#fr-card .fr-opt').forEach(b => { if (b.dataset.v === k) b.classList.add('ok'); }); }
        if (!guided) { if (ok) { S.correct++; S.run++; S.bestRun = Math.max(S.bestRun, S.run); } else S.run = 0; }
        showFeedback(ok, q, v);
        if (!ok) { $('fr-card').classList.add('fr-shake'); if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} } }
    }

    async function finish() {
        const t = T(), won = passed(S.correct, S.total), st = stars(S.correct, S.total);
        $('fr-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '🔄';
        $('fr-endtitle').textContent = won ? t.done : t.fail;
        $('fr-endtext').textContent = t.score(S.correct, S.total);
        $('fr-endstars').textContent = won ? '★'.repeat(st) + '☆'.repeat(3 - st) : '';
        $('fr-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('fr-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('fr-home'); } else { prepare(S.idx); beginPlay(); } };
        $('fr-back').textContent = t.back; $('fr-back').onclick = () => { renderHome(); show('fr-home'); };
        show('fr-end');
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        S.prog.xp = (S.prog.xp || 0) + 10 + st * 5;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'fractions', {
                    correctAnswers: S.correct, totalQuestions: S.total, totalAttempts: S.total, bestStreak: S.bestRun,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.id });
            } catch (e) { console.warn('[FractionsLab] stats not saved', e); }
        }
    }

    function goHome() { renderHome(); show('fr-home'); }
    function init() {
        $('fr-quit').onclick = goHome; $('fr-l-quit').onclick = goHome;
        $('fr-skip').onclick = () => finishLearn(false);
        $('fr-learn-done').onclick = () => finishLearn(true);
        $('fr-ex-next').onclick = () => { S.learn.ex = Math.min(S.learn.ex + 1, S.u.ex.length - 1); renderExample(); };
        $('fr-learnbtn').onclick = () => openLearn('play');
        document.addEventListener('keydown', e => {
            if ($('fr-play').hidden) return;
            const c = $('fr-continue') || $('fr-retry'), fbOpen = !$('fr-feedback').hidden;
            if (e.key === 'Enter' && fbOpen && c) { e.preventDefault(); c.click(); return; }
            if (fbOpen) return;
            if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('#fr-card .fr-opt')[Number(e.key) - 1]; if (b) b.click(); }
        });
        load(); renderHome(); show('fr-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        document.addEventListener('platformLanguageChanged', () => { if (!$('fr-home').hidden) renderHome(); else if (!$('fr-learn').hidden) buildLearn(); });
    }

    const api = { init, state: S, UNITS, UI, DECS, gcd, simplify, compare, equivalent, add, fractionOptions, makeQuestion, makeUnique, makeLesson, makeGuided, isCorrect, stars, passed,
        SeenStore, explain, exampleText, answerLabel, promptOf, toMixed, fromMixed, decStr, pctOf, fmtDec, symOf };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
