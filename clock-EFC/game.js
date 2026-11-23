/**
 * Aprende la Hora - learn to tell the time with an analogue clock.
 * 6 lessons: full hours -> half hours -> quarters -> 5 minutes. Question kinds: read the clock,
 * pick the clock that shows a digital time, set the hands. Pure logic is exported for unit tests.
 */
const ClockLab = (() => {
    'use strict';

    const UI = {
        es: { title: 'Aprende la Hora', sub: 'Lee el reloj y coloca las agujas. Completa una lección para abrir la siguiente.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', check: 'Comprobar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La hora es', quit: 'Salir',
              qRead: '¿Qué hora marca el reloj?', qPick: n => `¿Qué reloj marca las ${n}?`, qSet: n => `Pon el reloj a las ${n}`,
              hour: 'Hora', minute: 'Minutos', plus: 'más', minus: 'menos', done: '¡Lección completada!', fail: 'Necesitas acertar más. ¡Inténtalo otra vez!',
              again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino', locked: 'Completa la anterior', right: 'aciertos',
              score: (c, t) => `${c} de ${t} aciertos.`, clockLabel: (h, m) => `Reloj: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Horas en punto', hoursSet: 'Pon las horas', half: 'Y media', quarter: 'Cuartos', five: 'De 5 en 5 minutos', five2: 'Reto de relojero' } },
        en: { title: 'Learn the Time', sub: 'Read the clock and set the hands. Finish a lesson to unlock the next.', lesson: 'Lesson', xp: 'XP',
              next: 'Continue', check: 'Check', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The time is', quit: 'Quit',
              qRead: 'What time does the clock show?', qPick: n => `Which clock shows ${n}?`, qSet: n => `Set the clock to ${n}`,
              hour: 'Hour', minute: 'Minutes', plus: 'more', minus: 'less', done: 'Lesson complete!', fail: 'You need more right answers. Try again!',
              again: 'Try again', nextL: 'Next lesson', back: 'Back to the path', locked: 'Finish the previous one', right: 'correct',
              score: (c, t) => `${c} out of ${t} correct.`, clockLabel: (h, m) => `Clock: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: "O'clock", hoursSet: 'Set the hours', half: 'Half past', quarter: 'Quarters', five: 'Every 5 minutes', five2: 'Watchmaker challenge' } },
        eu: { title: 'Ikasi ordua', sub: 'Irakurri erlojua eta jarri orratzak. Bukatu ikasgai bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP',
              next: 'Jarraitu', check: 'Egiaztatu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Ordua hau da:', quit: 'Irten',
              qRead: 'Zer ordu markatzen du erlojuak?', qPick: n => `Zein erlojuk markatzen ditu ${n}?`, qSet: n => `Jarri erlojua ordu honetan: ${n}`,
              hour: 'Ordua', minute: 'Minutuak', plus: 'gehiago', minus: 'gutxiago', done: 'Ikasgaia osatuta!', fail: 'Erantzun zuzen gehiago behar dituzu. Saiatu berriro!',
              again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera', locked: 'Bukatu aurrekoa', right: 'zuzen',
              score: (c, t) => `${t}tik ${c} zuzen.`, clockLabel: (h, m) => `Erlojua: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Ordu zehatzak', hoursSet: 'Jarri orduak', half: 'Eta erdia', quarter: 'Laurdenak', five: '5 minuturo', five2: 'Erlojugilearen erronka' } },
        gl: { title: 'Aprende a hora', sub: 'Le o reloxo e pon as agullas. Remata unha lección para abrir a seguinte.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', check: 'Comprobar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A hora é', quit: 'Saír',
              qRead: 'Que hora marca o reloxo?', qPick: n => `Que reloxo marca as ${n}?`, qSet: n => `Pon o reloxo ás ${n}`,
              hour: 'Hora', minute: 'Minutos', plus: 'máis', minus: 'menos', done: 'Lección completada!', fail: 'Necesitas acertar máis. Inténtao outra vez!',
              again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño', locked: 'Completa a anterior', right: 'acertos',
              score: (c, t) => `${c} de ${t} acertos.`, clockLabel: (h, m) => `Reloxo: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Horas en punto', hoursSet: 'Pon as horas', half: 'E media', quarter: 'Cuartos', five: 'De 5 en 5 minutos', five2: 'Reto de reloxeiro' } },
        ca: { title: 'Aprèn l\'hora', sub: 'Llegeix el rellotge i posa les busques. Acaba una lliçó per obrir la següent.', lesson: 'Lliçó', xp: 'XP',
              next: 'Continua', check: 'Comprova', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. L\'hora és', quit: 'Surt',
              qRead: 'Quina hora marca el rellotge?', qPick: n => `Quin rellotge marca les ${n}?`, qSet: n => `Posa el rellotge a les ${n}`,
              hour: 'Hora', minute: 'Minuts', plus: 'més', minus: 'menys', done: 'Lliçó completada!', fail: 'Necessites encertar més. Torna-ho a provar!',
              again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí', locked: 'Acaba l\'anterior', right: 'encerts',
              score: (c, t) => `${c} de ${t} encerts.`, clockLabel: (h, m) => `Rellotge: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Hores en punt', hoursSet: 'Posa les hores', half: 'I mitja', quarter: 'Quarts', five: 'De 5 en 5 minuts', five2: 'Repte de rellotger' } },
        fr: { title: 'Apprends l\'heure', sub: 'Lis l\'horloge et place les aiguilles. Termine une leçon pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP',
              next: 'Continuer', check: 'Vérifier', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continue !'], bad: 'Presque. L\'heure est', quit: 'Quitter',
              qRead: 'Quelle heure indique l\'horloge ?', qPick: n => `Quelle horloge indique ${n} ?`, qSet: n => `Mets l'horloge à ${n}`,
              hour: 'Heure', minute: 'Minutes', plus: 'plus', minus: 'moins', done: 'Leçon terminée !', fail: 'Il faut plus de bonnes réponses. Réessaie !',
              again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin', locked: 'Termine la précédente', right: 'bonnes réponses',
              score: (c, t) => `${c} sur ${t} bonnes réponses.`, clockLabel: (h, m) => `Horloge : ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Heures pile', hoursSet: 'Place les heures', half: 'Et demie', quarter: 'Quarts', five: 'De 5 en 5 minutes', five2: 'Défi d\'horloger' } }
    };

    // ---- learn-first strings, merged into UI (same keys in the six languages) ----
    const H12 = {
        es: ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'],
        gl: ['', 'unha', 'dúas', 'tres', 'catro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'once', 'doce'],
        ca: ['', 'una', 'dues', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze'],
        en: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
        eu: ['', 'bata', 'biak', 'hirurak', 'laurak', 'bostak', 'seiak', 'zazpiak', 'zortziak', 'bederatziak', 'hamarrak', 'hamaikak', 'hamabiak'],
        fr: ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze']
    };
    const nx = h => (h % 12) + 1;
    const UX = {
        es: {
            learnBtn: 'Aprender', skip: 'Saltar', legendH: 'Aguja corta = horas', legendM: 'Aguja larga = minutos', showNums: 'Mostrar los minutos', hideNums: 'Ocultar los minutos',
            dragHint: 'Arrastra la aguja larga', digital: 'Hora digital', exLabel: (i, n) => `Ejemplo ${i} de ${n}`, exNext: 'Siguiente ejemplo', goPractice: '¡A practicar!',
            look: 'Mira:', guided: (i, n) => `Práctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Probar otra vez', retryT: 'Casi, fíjate en las agujas.', youSet: s => `Pusiste ${s}.`,
            badA: 'Casi. La respuesta es', why: 'Mira por qué',
            qType: 'Escribe la hora que marca el reloj', qMatch: 'Une cada reloj con su hora', qSay: '¿Cómo se dice esta hora?', qHear: p => `¿Qué hora digital es «${p}»?`,
            qSetW: p => `Pon el reloj: ${p}`, setHands: 'Pon las agujas.',
            qAdd: (s, dt, past) => `Ahora son las ${s}. ¿Qué hora ${past ? 'era' : 'será'} ${dt}?`,
            qDur: (a, b) => `Empieza a las ${a} y termina a las ${b}. ¿Cuánto dura?`, qDurEnd: (a, d) => `Empieza a las ${a} y dura ${d}. ¿A qué hora termina?`,
            qH24r: p => `El reloj marca esta hora ${p}. ¿Cómo se escribe en 24 horas?`, qH24t: s => `Son las ${s} (24 horas). ¿Qué hora es en el reloj de 12 horas?`,
            qSetH24: s => `Son las ${s} en el reloj de 24 horas. Pon el reloj de 12 horas.`,
            pOf: { am: 'de la mañana', pm: 'de la tarde', night: 'de la noche' }, pIn: { am: 'por la mañana', pm: 'por la tarde', night: 'por la noche' }, at12: (s, p) => `${s} ${p}`,
            dur: { h1: 'hora', hN: 'horas', min: 'minutos', half: 'media hora' }, inD: x => `dentro de ${x}`, agoD: x => `hace ${x}`,
            exAdd: (f, fwd) => (fwd ? `Sumamos el tiempo: ${f}.` : `Restamos el tiempo: ${f}.`), exDur: (a, b, ds) => `Contamos primero las horas enteras y luego los minutos: de ${a} a ${b} = ${ds}.`,
            exMatch: 'Mira cada reloj: la aguja corta dice la hora y la larga los minutos.', exSay: p => `Se dice «${p}».`,
            ex24pm: (h24, h12, mm, p) => `Después de las 12 se sigue contando: ${h24} − 12 = ${h12}. Son las ${h12}:${mm} ${p}.`,
            ex24am: (h24, h12, mm, p) => `Antes de las 12 la hora se escribe igual: son las ${h12}:${mm} ${p}.`,
            hourExact: h => `La aguja corta apunta justo al ${h}.`, hourBetween: (h, n) => `La aguja corta está entre el ${h} y el ${n}, así que son las ${h} y algo.`,
            minZero: 'La larga apunta al 12: en punto.', minFive: (k, m, sp) => `La larga apunta al ${k}: son ${m} minutos${sp ? `, o sea «${sp}»` : ''}.`,
            minAny: m => `La larga marca ${m} minutos (cada rayita es un minuto).`, so: (h, m) => `${h === 1 ? 'Es la' : 'Son las'} ${h}:${pad2(m)}.`,
            sp: { 15: 'y cuarto', 30: 'y media', 45: 'menos cuarto' },
            say: (h, m) => {
                const art = x => (x === 1 ? 'la' : 'las'), M = { 5: 'cinco', 10: 'diez', 20: 'veinte', 25: 'veinticinco' };
                if (m === 0) return `${art(h)} ${H12.es[h]} en punto`;
                if (m === 15) return `${art(h)} ${H12.es[h]} y cuarto`;
                if (m === 30) return `${art(h)} ${H12.es[h]} y media`;
                if (m === 45) return `${art(nx(h))} ${H12.es[nx(h)]} menos cuarto`;
                return m < 30 ? `${art(h)} ${H12.es[h]} y ${M[m]}` : `${art(nx(h))} ${H12.es[nx(h)]} menos ${M[60 - m]}`;
            },
            learn: {
                hours: 'La aguja corta (roja) dice la hora. Cuando la larga (azul) está arriba, en el 12, es una hora en punto. Arrastra la aguja larga y mira cómo se mueve la corta.',
                hoursSet: 'Para poner una hora en punto, deja la aguja larga en el 12 y mueve la corta hasta el número de la hora.',
                half: 'Cuando la aguja larga llega al 6 ha pasado media hora (30 minutos). Se dice «y media». La corta queda entre dos números.',
                quarter: 'La larga en el 3 son 15 minutos: «y cuarto». En el 9 son 45 minutos: «menos cuarto», porque falta un cuarto para la hora siguiente.',
                five: 'Cada número vale 5 minutos: el 1 son 5, el 2 son 10, el 3 son 15... Pulsa «Mostrar los minutos» para verlo.',
                five2: 'Entre dos números hay 5 rayitas: cada rayita es un minuto. Cuenta de 5 en 5 hasta el número y luego rayita a rayita.',
                words: 'Para decir la hora: hasta la media se dice «y» (las tres y diez). Después de la media se dice «menos» los minutos que faltan para la hora siguiente (las cuatro menos veinte).',
                plus: 'Para saber la hora de más tarde, suma: una hora es una vuelta entera de la aguja larga y media hora es media vuelta. Para «hace», resta.',
                h24: 'El reloj de 24 horas sigue contando después de las 12: 13:00 es la 1 de la tarde. Resta 12 y ya lo tienes: 15:00 son las 3.',
                dur: 'Para saber cuánto dura algo, cuenta desde la hora de inicio hasta la de fin: primero las horas enteras y luego los minutos que sobran.'
            },
            k: { five2: 'Minuto a minuto', words: 'Cómo se dice', plus: 'Dentro de un rato', h24: 'Reloj de 24 horas', dur: 'Cuánto dura' }
        },
        en: {
            learnBtn: 'Learn', skip: 'Skip', legendH: 'Short hand = hours', legendM: 'Long hand = minutes', showNums: 'Show the minutes', hideNums: 'Hide the minutes',
            dragHint: 'Drag the long hand', digital: 'Digital time', exLabel: (i, n) => `Example ${i} of ${n}`, exNext: 'Next example', goPractice: 'Let\'s practise!',
            look: 'Look:', guided: (i, n) => `Guided practice ${i} of ${n}`, hintL: 'Hint:', retry: 'Try again', retryT: 'Almost, look at the hands.', youSet: s => `You set ${s}.`,
            badA: 'Almost. The answer is', why: 'See why',
            qType: 'Type the time the clock shows', qMatch: 'Match each clock with its time', qSay: 'How do we say this time?', qHear: p => `Which digital time is “${p}”?`,
            qSetW: p => `Set the clock: ${p}`, setHands: 'Set the hands.',
            qAdd: (s, dt, past) => `It is ${s} now. What time ${past ? 'was it' : 'will it be'} ${dt}?`,
            qDur: (a, b) => `It starts at ${a} and ends at ${b}. How long does it last?`, qDurEnd: (a, d) => `It starts at ${a} and lasts ${d}. What time does it end?`,
            qH24r: p => `The clock shows this time ${p}. How do you write it in 24-hour time?`, qH24t: s => `It is ${s} (24-hour). What time is it on a 12-hour clock?`,
            qSetH24: s => `It is ${s} on the 24-hour clock. Set the 12-hour clock.`,
            pOf: { am: 'in the morning', pm: 'in the afternoon', night: 'at night' }, pIn: { am: 'in the morning', pm: 'in the afternoon', night: 'at night' }, at12: (s, p) => `${s} ${p}`,
            dur: { h1: 'hour', hN: 'hours', min: 'minutes', half: 'half an hour' }, inD: x => `in ${x}`, agoD: x => `${x} ago`,
            exAdd: (f, fwd) => (fwd ? `Add the time: ${f}.` : `Subtract the time: ${f}.`), exDur: (a, b, ds) => `Count the whole hours first, then the minutes: from ${a} to ${b} = ${ds}.`,
            exMatch: 'Look at each clock: the short hand tells the hour and the long hand the minutes.', exSay: p => `We say “${p}”.`,
            ex24pm: (h24, h12, mm, p) => `After 12 the count goes on: ${h24} − 12 = ${h12}. It is ${h12}:${mm} ${p}.`,
            ex24am: (h24, h12, mm, p) => `Before 12 the time is written the same: it is ${h12}:${mm} ${p}.`,
            hourExact: h => `The short hand points exactly at ${h}.`, hourBetween: (h, n) => `The short hand is between ${h} and ${n}, so it is ${h} and a bit.`,
            minZero: 'The long hand points at 12: o\'clock.', minFive: (k, m, sp) => `The long hand points at ${k}: that is ${m} minutes${sp ? `, so “${sp}”` : ''}.`,
            minAny: m => `The long hand shows ${m} minutes (each little mark is one minute).`, so: (h, m) => `It is ${h}:${pad2(m)}.`,
            sp: { 15: 'quarter past', 30: 'half past', 45: 'quarter to' },
            say: (h, m) => {
                const w = H12.en, M = { 5: 'five', 10: 'ten', 20: 'twenty', 25: 'twenty-five' };
                if (m === 0) return `${w[h]} o'clock`;
                if (m === 15) return `quarter past ${w[h]}`;
                if (m === 30) return `half past ${w[h]}`;
                if (m === 45) return `quarter to ${w[nx(h)]}`;
                return m < 30 ? `${M[m]} past ${w[h]}` : `${M[60 - m]} to ${w[nx(h)]}`;
            },
            learn: {
                hours: 'The short red hand shows the hour. When the long blue hand points up at 12, it is exactly o\'clock. Drag the long hand and watch the short one move.',
                hoursSet: 'To show an o\'clock time, keep the long hand on 12 and move the short hand to the number of the hour.',
                half: 'When the long hand reaches 6, half an hour (30 minutes) has passed. We say “half past”. The short hand sits between two numbers.',
                quarter: 'The long hand on 3 is 15 minutes: “quarter past”. On 9 it is 45 minutes: “quarter to”, because a quarter of an hour is missing to the next hour.',
                five: 'Each number is worth 5 minutes: 1 is 5, 2 is 10, 3 is 15... Press “Show the minutes” to see it.',
                five2: 'Between two numbers there are 5 little marks: each mark is one minute. Count by 5s up to the number, then mark by mark.',
                words: 'To say the time: up to half past we say “past” (ten past three). After half past we say “to”, the minutes missing for the next hour (twenty to four).',
                plus: 'To find a later time, add: one hour is a full turn of the long hand and half an hour is half a turn. For “ago”, subtract.',
                h24: 'The 24-hour clock keeps counting after 12: 13:00 is 1 in the afternoon. Subtract 12 and you have it: 15:00 is 3 o\'clock.',
                dur: 'To know how long something lasts, count from the start to the end: first the whole hours, then the minutes left over.'
            },
            k: { five2: 'Minute by minute', words: 'Saying the time', plus: 'In a while', h24: '24-hour clock', dur: 'How long does it last' }
        },
        eu: {
            learnBtn: 'Ikasi', skip: 'Saltatu', legendH: 'Orratz laburra = orduak', legendM: 'Orratz luzea = minutuak', showNums: 'Erakutsi minutuak', hideNums: 'Ezkutatu minutuak',
            dragHint: 'Arrastatu orratz luzea', digital: 'Ordu digitala', exLabel: (i, n) => `${i}. adibidea, ${n}tik`, exNext: 'Hurrengo adibidea', goPractice: 'Praktikatzera!',
            look: 'Begira:', guided: (i, n) => `Praktika gidatua ${i}/${n}`, hintL: 'Pista:', retry: 'Saiatu berriro', retryT: 'Ia, begiratu orratzei.', youSet: s => `${s} jarri duzu.`,
            badA: 'Ia. Erantzuna hau da:', why: 'Ikusi zergatik',
            qType: 'Idatzi erlojuak markatzen duen ordua', qMatch: 'Lotu erloju bakoitza bere orduarekin', qSay: 'Nola esaten da ordu hau?', qHear: p => `Zein da «${p}» ordu digitala?`,
            qSetW: p => `Jarri erlojua: ${p}`, setHands: 'Jarri orratzak.',
            qAdd: (s, dt, past) => `Orain ${s} dira. Zer ordu ${past ? 'zen' : 'izango da'} ${dt}?`,
            qDur: (a, b) => `${a}etan hasten da eta ${b}etan amaitzen da. Zenbat irauten du?`, qDurEnd: (a, d) => `${a}etan hasten da eta ${d} irauten du. Zer ordutan amaitzen da?`,
            qH24r: p => `Erlojuak ordu hau markatzen du (${p}). Nola idazten da 24 ordutan?`, qH24t: s => `${s} dira (24 ordu). Zer ordu da 12 orduko erlojuan?`,
            qSetH24: s => `${s} dira 24 orduko erlojuan. Jarri 12 orduko erlojua.`,
            pOf: { am: 'goizeko', pm: 'arratsaldeko', night: 'gaueko' }, pIn: { am: 'goizean', pm: 'arratsaldean', night: 'gauean' }, at12: (s, p) => `${p} ${s}`,
            dur: { h1: 'ordu', hN: 'ordu', min: 'minutu', half: 'ordu erdi' }, inD: x => `${x} barru`, agoD: x => `duela ${x}`,
            exAdd: (f, fwd) => (fwd ? `Denbora gehitu: ${f}.` : `Denbora kendu: ${f}.`), exDur: (a, b, ds) => `Lehenengo ordu osoak zenbatu, gero minutuak: ${a} → ${b} = ${ds}.`,
            exMatch: 'Begiratu erloju bakoitzari: orratz laburrak ordua esaten du eta luzeak minutuak.', exSay: p => `Honela esaten da: «${p}».`,
            ex24pm: (h24, h12, mm, p) => `12tik aurrera zenbatzen jarraitzen da: ${h24} − 12 = ${h12}. ${p} ${h12}:${mm} dira.`,
            ex24am: (h24, h12, mm, p) => `12 baino lehen ordua berdin idazten da: ${p} ${h12}:${mm} dira.`,
            hourExact: h => `Orratz laburra ${h} zenbakian dago, zehatz-zehatz.`, hourBetween: (h, n) => `Orratz laburra ${h} eta ${n} artean dago, beraz ${h} eta zerbait dira.`,
            minZero: 'Orratz luzea 12an dago: ordu zehatza.', minFive: (k, m, sp) => `Orratz luzea ${k} zenbakian dago: ${m} minutu${sp ? `, hau da, «${sp}»` : ''}.`,
            minAny: m => `Orratz luzeak ${m} minutu markatzen ditu (marra txiki bakoitza minutu bat da).`, so: (h, m) => `${h}:${pad2(m)} dira.`,
            sp: { 15: 'eta laurden', 30: 'eta erdi', 45: 'laurden gutxi' },
            say: (h, m) => {
                const w = H12.eu, nm = x => (x === 1 ? 'ordu bata' : w[x]), M = { 5: 'bost', 10: 'hamar', 20: 'hogei', 25: 'hogeita bost' };
                if (m === 0) return h === 1 ? 'ordu bata da' : `${w[h]} dira`;
                if (m === 15) return `${nm(h)} eta laurden`;
                if (m === 30) return `${nm(h)} eta erdi`;
                if (m === 45) return `${nm(nx(h))} laurden gutxi`;
                return m < 30 ? `${nm(h)} eta ${M[m]}` : `${nm(nx(h))} ${M[60 - m]} gutxi`;
            },
            learn: {
                hours: 'Orratz laburrak (gorria) ordua esaten du. Orratz luzea (urdina) goian dagoenean, 12an, ordu zehatza da. Arrastatu orratz luzea eta ikusi laburra nola mugitzen den.',
                hoursSet: 'Ordu zehatz bat jartzeko, utzi orratz luzea 12an eta mugitu laburra orduaren zenbakira.',
                half: 'Orratz luzeak 6ra iristen denean ordu erdi bat (30 minutu) pasa da. «Eta erdi» esaten da. Orratz laburra bi zenbakiren artean geratzen da.',
                quarter: 'Orratz luzea 3an: 15 minutu, «eta laurden». 9an: 45 minutu, «laurden gutxi», hurrengo ordura laurden bat falta delako.',
                five: 'Zenbaki bakoitzak 5 minutu balio du: 1ek 5, 2k 10, 3k 15... Sakatu «Erakutsi minutuak» ikusteko.',
                five2: 'Bi zenbakiren artean 5 marra txiki daude: marra bakoitza minutu bat da. Zenbatu 5naka zenbakira arte eta gero marraz marra.',
                words: 'Ordua esateko: ordu erdira arte «eta» esaten da (hirurak eta hamar). Ordu erdiaren ondoren, hurrengo ordura falta diren minutuak esaten dira «gutxi» erantsita (laurak hogei gutxi).',
                plus: 'Geroagoko ordua jakiteko, gehitu: ordu bat orratz luzearen bira oso bat da, eta ordu erdi bat, erdi bira. «Duela» esateko, kendu.',
                h24: '24 orduko erlojuak 12tik aurrera jarraitzen du zenbatzen: 13:00 arratsaldeko 1ak dira. Kendu 12 eta kitto: 15:00 arratsaldeko 3ak dira.',
                dur: 'Zerbaitek zenbat irauten duen jakiteko, zenbatu hasieratik amaierara: lehenengo ordu osoak, gero geratzen diren minutuak.'
            },
            k: { five2: 'Minutuz minutu', words: 'Nola esaten da', plus: 'Pixka bat geroago', h24: '24 orduko erlojua', dur: 'Zenbat irauten du' }
        },
        gl: {
            learnBtn: 'Aprender', skip: 'Saltar', legendH: 'Agulla curta = horas', legendM: 'Agulla longa = minutos', showNums: 'Mostrar os minutos', hideNums: 'Agochar os minutos',
            dragHint: 'Arrastra a agulla longa', digital: 'Hora dixital', exLabel: (i, n) => `Exemplo ${i} de ${n}`, exNext: 'Seguinte exemplo', goPractice: 'A practicar!',
            look: 'Mira:', guided: (i, n) => `Práctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Probar outra vez', retryT: 'Case, fíxate nas agullas.', youSet: s => `Puxeches ${s}.`,
            badA: 'Case. A resposta é', why: 'Mira por que',
            qType: 'Escribe a hora que marca o reloxo', qMatch: 'Une cada reloxo coa súa hora', qSay: 'Como se di esta hora?', qHear: p => `Que hora dixital é «${p}»?`,
            qSetW: p => `Pon o reloxo: ${p}`, setHands: 'Pon as agullas.',
            qAdd: (s, dt, past) => `Agora son as ${s}. Que hora ${past ? 'era' : 'será'} ${dt}?`,
            qDur: (a, b) => `Empeza ás ${a} e remata ás ${b}. Canto dura?`, qDurEnd: (a, d) => `Empeza ás ${a} e dura ${d}. A que hora remata?`,
            qH24r: p => `O reloxo marca esta hora ${p}. Como se escribe en 24 horas?`, qH24t: s => `Son as ${s} (24 horas). Que hora é no reloxo de 12 horas?`,
            qSetH24: s => `Son as ${s} no reloxo de 24 horas. Pon o reloxo de 12 horas.`,
            pOf: { am: 'da mañá', pm: 'da tarde', night: 'da noite' }, pIn: { am: 'pola mañá', pm: 'pola tarde', night: 'pola noite' }, at12: (s, p) => `${s} ${p}`,
            dur: { h1: 'hora', hN: 'horas', min: 'minutos', half: 'media hora' }, inD: x => `dentro de ${x}`, agoD: x => `hai ${x}`,
            exAdd: (f, fwd) => (fwd ? `Sumamos o tempo: ${f}.` : `Restamos o tempo: ${f}.`), exDur: (a, b, ds) => `Contamos primeiro as horas enteiras e despois os minutos: de ${a} a ${b} = ${ds}.`,
            exMatch: 'Mira cada reloxo: a agulla curta di a hora e a longa os minutos.', exSay: p => `Dise «${p}».`,
            ex24pm: (h24, h12, mm, p) => `Despois das 12 segue a conta: ${h24} − 12 = ${h12}. Son as ${h12}:${mm} ${p}.`,
            ex24am: (h24, h12, mm, p) => `Antes das 12 a hora escríbese igual: son as ${h12}:${mm} ${p}.`,
            hourExact: h => `A agulla curta apunta xusto ao ${h}.`, hourBetween: (h, n) => `A agulla curta está entre o ${h} e o ${n}, así que son as ${h} e algo.`,
            minZero: 'A longa apunta ao 12: en punto.', minFive: (k, m, sp) => `A longa apunta ao ${k}: son ${m} minutos${sp ? `, ou sexa «${sp}»` : ''}.`,
            minAny: m => `A longa marca ${m} minutos (cada raiciña é un minuto).`, so: (h, m) => `${h === 1 ? 'É a' : 'Son as'} ${h}:${pad2(m)}.`,
            sp: { 15: 'e cuarto', 30: 'e media', 45: 'menos cuarto' },
            say: (h, m) => {
                const w = H12.gl, art = x => (x === 1 ? 'a' : 'as'), M = { 5: 'cinco', 10: 'dez', 20: 'vinte', 25: 'vinte e cinco' };
                if (m === 0) return `${art(h)} ${w[h]} en punto`;
                if (m === 15) return `${art(h)} ${w[h]} e cuarto`;
                if (m === 30) return `${art(h)} ${w[h]} e media`;
                if (m === 45) return `${art(nx(h))} ${w[nx(h)]} menos cuarto`;
                return m < 30 ? `${art(h)} ${w[h]} e ${M[m]}` : `${art(nx(h))} ${w[nx(h)]} menos ${M[60 - m]}`;
            },
            learn: {
                hours: 'A agulla curta (vermella) di a hora. Cando a longa (azul) está arriba, no 12, é unha hora en punto. Arrastra a agulla longa e mira como se move a curta.',
                hoursSet: 'Para poñer unha hora en punto, deixa a agulla longa no 12 e move a curta ata o número da hora.',
                half: 'Cando a agulla longa chega ao 6 pasou media hora (30 minutos). Dise «e media». A curta queda entre dous números.',
                quarter: 'A longa no 3 son 15 minutos: «e cuarto». No 9 son 45 minutos: «menos cuarto», porque falta un cuarto para a hora seguinte.',
                five: 'Cada número vale 5 minutos: o 1 son 5, o 2 son 10, o 3 son 15... Preme «Mostrar os minutos» para velo.',
                five2: 'Entre dous números hai 5 raiciñas: cada raiciña é un minuto. Conta de 5 en 5 ata o número e despois raiciña a raiciña.',
                words: 'Para dicir a hora: ata a media dise «e» (as tres e dez). Despois da media dise «menos» os minutos que faltan para a hora seguinte (as catro menos vinte).',
                plus: 'Para saber a hora de máis tarde, suma: unha hora é unha volta enteira da agulla longa e media hora é media volta. Para «hai», resta.',
                h24: 'O reloxo de 24 horas segue contando despois das 12: 13:00 é a 1 da tarde. Resta 12 e xa o tes: 15:00 son as 3.',
                dur: 'Para saber canto dura algo, conta desde a hora de inicio ata a do fin: primeiro as horas enteiras e despois os minutos que sobran.'
            },
            k: { five2: 'Minuto a minuto', words: 'Como se di', plus: 'Dentro dun rato', h24: 'Reloxo de 24 horas', dur: 'Canto dura' }
        },
        ca: {
            learnBtn: 'Aprèn', skip: 'Salta', legendH: 'Busca curta = hores', legendM: 'Busca llarga = minuts', showNums: 'Mostra els minuts', hideNums: 'Amaga els minuts',
            dragHint: 'Arrossega la busca llarga', digital: 'Hora digital', exLabel: (i, n) => `Exemple ${i} de ${n}`, exNext: 'Següent exemple', goPractice: 'A practicar!',
            look: 'Mira:', guided: (i, n) => `Pràctica guiada ${i} de ${n}`, hintL: 'Pista:', retry: 'Prova-ho un altre cop', retryT: 'Gairebé, fixa\'t en les busques.', youSet: s => `Has posat ${s}.`,
            badA: 'Gairebé. La resposta és', why: 'Mira per què',
            qType: 'Escriu l\'hora que marca el rellotge', qMatch: 'Uneix cada rellotge amb la seva hora', qSay: 'Com es diu aquesta hora?', qHear: p => `Quina hora digital és «${p}»?`,
            qSetW: p => `Posa el rellotge: ${p}`, setHands: 'Posa les busques.',
            qAdd: (s, dt, past) => `Ara són les ${s}. Quina hora ${past ? 'era' : 'serà'} ${dt}?`,
            qDur: (a, b) => `Comença a les ${a} i acaba a les ${b}. Quant dura?`, qDurEnd: (a, d) => `Comença a les ${a} i dura ${d}. A quina hora acaba?`,
            qH24r: p => `El rellotge marca aquesta hora ${p}. Com s'escriu en 24 hores?`, qH24t: s => `Són les ${s} (24 hores). Quina hora és al rellotge de 12 hores?`,
            qSetH24: s => `Són les ${s} al rellotge de 24 hores. Posa el rellotge de 12 hores.`,
            pOf: { am: 'del matí', pm: 'de la tarda', night: 'de la nit' }, pIn: { am: 'al matí', pm: 'a la tarda', night: 'a la nit' }, at12: (s, p) => `${s} ${p}`,
            dur: { h1: 'hora', hN: 'hores', min: 'minuts', half: 'mitja hora' }, inD: x => `d'aquí a ${x}`, agoD: x => `fa ${x}`,
            exAdd: (f, fwd) => (fwd ? `Sumem el temps: ${f}.` : `Restem el temps: ${f}.`), exDur: (a, b, ds) => `Comptem primer les hores senceres i després els minuts: de ${a} a ${b} = ${ds}.`,
            exMatch: 'Mira cada rellotge: la busca curta diu l\'hora i la llarga els minuts.', exSay: p => `Es diu «${p}».`,
            ex24pm: (h24, h12, mm, p) => `Després de les 12 se segueix comptant: ${h24} − 12 = ${h12}. Són les ${h12}:${mm} ${p}.`,
            ex24am: (h24, h12, mm, p) => `Abans de les 12 l'hora s'escriu igual: són les ${h12}:${mm} ${p}.`,
            hourExact: h => `La busca curta apunta just al ${h}.`, hourBetween: (h, n) => `La busca curta és entre el ${h} i el ${n}, així que són les ${h} i alguna cosa.`,
            minZero: 'La llarga apunta al 12: en punt.', minFive: (k, m, sp) => `La llarga apunta al ${k}: són ${m} minuts${sp ? `, és a dir «${sp}»` : ''}.`,
            minAny: m => `La llarga marca ${m} minuts (cada ratlleta és un minut).`, so: (h, m) => `${h === 1 ? 'És la' : 'Són les'} ${h}:${pad2(m)}.`,
            sp: { 15: 'i quart', 30: 'i mitja', 45: 'menys quart' },
            say: (h, m) => {
                const w = H12.ca, art = x => (x === 1 ? 'la' : 'les'), M = { 5: 'cinc', 10: 'deu', 20: 'vint', 25: 'vint-i-cinc' };
                if (m === 0) return `${art(h)} ${w[h]} en punt`;
                if (m === 15) return `${art(h)} ${w[h]} i quart`;
                if (m === 30) return `${art(h)} ${w[h]} i mitja`;
                if (m === 45) return `${art(nx(h))} ${w[nx(h)]} menys quart`;
                return m < 30 ? `${art(h)} ${w[h]} i ${M[m]}` : `${art(nx(h))} ${w[nx(h)]} menys ${M[60 - m]}`;
            },
            learn: {
                hours: 'La busca curta (vermella) diu l\'hora. Quan la llarga (blava) és a dalt, al 12, és una hora en punt. Arrossega la busca llarga i mira com es mou la curta.',
                hoursSet: 'Per posar una hora en punt, deixa la busca llarga al 12 i mou la curta fins al número de l\'hora.',
                half: 'Quan la busca llarga arriba al 6 ha passat mitja hora (30 minuts). Es diu «i mitja». La curta queda entre dos números.',
                quarter: 'La llarga al 3 són 15 minuts: «i quart». Al 9 són 45 minuts: «menys quart», perquè falta un quart per a l\'hora següent.',
                five: 'Cada número val 5 minuts: l\'1 són 5, el 2 són 10, el 3 són 15... Prem «Mostra els minuts» per veure-ho.',
                five2: 'Entre dos números hi ha 5 ratlletes: cada ratlleta és un minut. Compta de 5 en 5 fins al número i després ratlleta a ratlleta.',
                words: 'Per dir l\'hora: fins a la mitja es diu «i» (les tres i deu). Després de la mitja es diu «menys» els minuts que falten per a l\'hora següent (les quatre menys vint).',
                plus: 'Per saber l\'hora de més tard, suma: una hora és una volta sencera de la busca llarga i mitja hora és mitja volta. Per a «fa», resta.',
                h24: 'El rellotge de 24 hores segueix comptant després de les 12: 13:00 és l\'1 de la tarda. Resta 12 i ja ho tens: 15:00 són les 3.',
                dur: 'Per saber quant dura alguna cosa, compta des de l\'hora d\'inici fins a la de final: primer les hores senceres i després els minuts que sobren.'
            },
            k: { five2: 'Minut a minut', words: 'Com es diu', plus: 'D\'aquí a una estona', h24: 'Rellotge de 24 hores', dur: 'Quant dura' }
        },
        fr: {
            learnBtn: 'Apprendre', skip: 'Passer', legendH: 'Petite aiguille = heures', legendM: 'Grande aiguille = minutes', showNums: 'Montrer les minutes', hideNums: 'Cacher les minutes',
            dragHint: 'Fais glisser la grande aiguille', digital: 'Heure numérique', exLabel: (i, n) => `Exemple ${i} sur ${n}`, exNext: 'Exemple suivant', goPractice: 'On s\'entraîne !',
            look: 'Regarde :', guided: (i, n) => `Entraînement guidé ${i} sur ${n}`, hintL: 'Indice :', retry: 'Réessayer', retryT: 'Presque, regarde les aiguilles.', youSet: s => `Tu as mis ${s}.`,
            badA: 'Presque. La réponse est', why: 'Vois pourquoi',
            qType: 'Écris l\'heure que montre l\'horloge', qMatch: 'Associe chaque horloge à son heure', qSay: 'Comment dit-on cette heure ?', qHear: p => `Quelle heure numérique est « ${p} » ?`,
            qSetW: p => `Mets l'horloge : ${p}`, setHands: 'Place les aiguilles.',
            qAdd: (s, dt, past) => `Il est ${s}. Quelle heure ${past ? 'était-il' : 'sera-t-il'} ${dt} ?`,
            qDur: (a, b) => `Ça commence à ${a} et ça finit à ${b}. Combien de temps ça dure ?`, qDurEnd: (a, d) => `Ça commence à ${a} et ça dure ${d}. À quelle heure ça finit ?`,
            qH24r: p => `L'horloge indique cette heure ${p}. Comment l'écrire en 24 heures ?`, qH24t: s => `Il est ${s} (24 heures). Quelle heure est-ce sur l'horloge de 12 heures ?`,
            qSetH24: s => `Il est ${s} sur l'horloge de 24 heures. Mets l'horloge de 12 heures.`,
            pOf: { am: 'du matin', pm: 'de l\'après-midi', night: 'du soir' }, pIn: { am: 'le matin', pm: 'l\'après-midi', night: 'le soir' }, at12: (s, p) => `${s} ${p}`,
            dur: { h1: 'heure', hN: 'heures', min: 'minutes', half: 'une demi-heure' }, inD: x => `dans ${x}`, agoD: x => `il y a ${x}`,
            exAdd: (f, fwd) => (fwd ? `On ajoute le temps : ${f}.` : `On enlève le temps : ${f}.`), exDur: (a, b, ds) => `On compte d'abord les heures entières, puis les minutes : de ${a} à ${b} = ${ds}.`,
            exMatch: 'Regarde chaque horloge : la petite aiguille donne l\'heure et la grande les minutes.', exSay: p => `On dit « ${p} ».`,
            ex24pm: (h24, h12, mm, p) => `Après 12 on continue de compter : ${h24} − 12 = ${h12}. Il est ${h12}:${mm} ${p}.`,
            ex24am: (h24, h12, mm, p) => `Avant 12 l'heure s'écrit pareil : il est ${h12}:${mm} ${p}.`,
            hourExact: h => `La petite aiguille est pile sur le ${h}.`, hourBetween: (h, n) => `La petite aiguille est entre le ${h} et le ${n}, donc il est ${h} heures et quelque chose.`,
            minZero: 'La grande est sur le 12 : pile.', minFive: (k, m, sp) => `La grande est sur le ${k} : ça fait ${m} minutes${sp ? `, donc « ${sp} »` : ''}.`,
            minAny: m => `La grande aiguille indique ${m} minutes (chaque petit trait est une minute).`, so: (h, m) => `Il est ${h}:${pad2(m)}.`,
            sp: { 15: 'et quart', 30: 'et demie', 45: 'moins le quart' },
            say: (h, m) => {
                const w = H12.fr, hw = x => `${w[x]} ${x === 1 ? 'heure' : 'heures'}`, M = { 5: 'cinq', 10: 'dix', 20: 'vingt', 25: 'vingt-cinq' };
                if (m === 0) return `${hw(h)} pile`;
                if (m === 15) return `${hw(h)} et quart`;
                if (m === 30) return `${hw(h)} et demie`;
                if (m === 45) return `${hw(nx(h))} moins le quart`;
                return m < 30 ? `${hw(h)} ${M[m]}` : `${hw(nx(h))} moins ${M[60 - m]}`;
            },
            learn: {
                hours: 'La petite aiguille (rouge) donne l\'heure. Quand la grande (bleue) est en haut, sur le 12, il est pile l\'heure. Fais glisser la grande aiguille et regarde la petite bouger.',
                hoursSet: 'Pour afficher une heure pile, laisse la grande aiguille sur le 12 et déplace la petite sur le chiffre de l\'heure.',
                half: 'Quand la grande aiguille arrive sur le 6, une demi-heure (30 minutes) est passée. On dit « et demie ». La petite se place entre deux chiffres.',
                quarter: 'La grande sur le 3, ce sont 15 minutes : « et quart ». Sur le 9, 45 minutes : « moins le quart », car il manque un quart d\'heure pour l\'heure suivante.',
                five: 'Chaque chiffre vaut 5 minutes : le 1 c\'est 5, le 2 c\'est 10, le 3 c\'est 15... Appuie sur « Montrer les minutes » pour le voir.',
                five2: 'Entre deux chiffres il y a 5 petits traits : chaque trait est une minute. Compte de 5 en 5 jusqu\'au chiffre, puis trait par trait.',
                words: 'Pour dire l\'heure : jusqu\'à la demie on ajoute les minutes (trois heures dix). Après la demie on dit « moins » les minutes qui manquent pour l\'heure suivante (quatre heures moins vingt).',
                plus: 'Pour trouver une heure plus tard, ajoute : une heure est un tour complet de la grande aiguille et une demi-heure un demi-tour. Pour « il y a », enlève.',
                h24: 'L\'horloge de 24 heures continue de compter après 12 : 13:00 c\'est 1 heure de l\'après-midi. Enlève 12 et c\'est bon : 15:00 c\'est 3 heures.',
                dur: 'Pour savoir combien de temps dure quelque chose, compte du début à la fin : d\'abord les heures entières, puis les minutes en plus.'
            },
            k: { five2: 'Minute par minute', words: 'Comment le dire', plus: 'Dans un moment', h24: 'Horloge de 24 heures', dur: 'Combien de temps ça dure' }
        }
    };
    for (const l in UX) { const { k, ...rest } = UX[l]; Object.assign(UI[l], rest); Object.assign(UI[l].k, k); }

    // ===================== PURE LOGIC (no DOM) =====================
    // step = minute granularity; types = question kinds; setKind = how "set the clock" questions are phrased;
    // ex = 3 worked examples shown in the learn step.
    const UNITS = [
        { id: 'hours',    icon: '🕐', step: 60, types: ['read', 'pick', 'match', 'type'],         len: 8,  setKind: 'time',
          ex: [{ k: 't', h: 3, m: 0 }, { k: 't', h: 7, m: 0 }, { k: 't', h: 12, m: 0 }] },
        { id: 'hoursSet', icon: '🕓', step: 60, types: ['set', 'read', 'match'],                  len: 8,  setKind: 'time',
          ex: [{ k: 't', h: 5, m: 0 }, { k: 't', h: 9, m: 0 }, { k: 't', h: 2, m: 0 }] },
        { id: 'half',     icon: '🕧', step: 30, types: ['read', 'pick', 'set', 'type'],           len: 8,  setKind: 'time',
          ex: [{ k: 't', h: 4, m: 30 }, { k: 't', h: 8, m: 30 }, { k: 't', h: 11, m: 30 }] },
        { id: 'quarter',  icon: '🕞', step: 15, types: ['read', 'pick', 'set', 'match', 'type'],  len: 8,  setKind: 'time',
          ex: [{ k: 't', h: 2, m: 15 }, { k: 't', h: 6, m: 45 }, { k: 't', h: 10, m: 15 }] },
        { id: 'five',     icon: '🕗', step: 5,  types: ['read', 'pick', 'set', 'type', 'match'],  len: 8,  setKind: 'time',
          ex: [{ k: 't', h: 3, m: 20 }, { k: 't', h: 7, m: 35 }, { k: 't', h: 10, m: 50 }] },
        { id: 'five2',    icon: '🏆', step: 1,  types: ['read', 'type', 'set', 'pick', 'match'],  len: 10, setKind: 'time',
          ex: [{ k: 't', h: 4, m: 7 }, { k: 't', h: 9, m: 43 }, { k: 't', h: 12, m: 28 }] },
        { id: 'words',    icon: '💬', step: 5,  types: ['say', 'hear', 'set', 'say'],             len: 8,  setKind: 'words',
          ex: [{ k: 'say', h: 3, m: 40 }, { k: 'say', h: 8, m: 15 }, { k: 'say', h: 6, m: 45 }] },
        { id: 'plus',     icon: '⏩', step: 15, types: ['add', 'set', 'add'],                     len: 8,  setKind: 'after',
          deltas: [15, 30, 45, 60, 90, 120, -15, -30, -45, -60],
          ex: [{ k: 'add', h: 3, m: 0, d: 60 }, { k: 'add', h: 5, m: 30, d: -30 }, { k: 'add', h: 8, m: 15, d: 45 }] },
        { id: 'h24',      icon: '🌙', step: 15, types: ['h24read', 'h24to12', 'set'],             len: 8,  setKind: 'h24',
          ex: [{ k: 'h24', h24: 15, m: 0 }, { k: 'h24', h24: 9, m: 30 }, { k: 'h24', h24: 21, m: 45 }] },
        { id: 'dur',      icon: '⏳', step: 5,  types: ['dur', 'durend', 'dur', 'set'],           len: 8,  setKind: 'after', startStep: 15,
          durs: [15, 30, 45, 60, 75, 90, 120, 135, 150, 180],
          ex: [{ k: 'dur', h: 4, m: 0, d: 90 }, { k: 'dur', h: 2, m: 30, d: 45 }, { k: 'dur', h: 11, m: 15, d: 120 }] }
    ];
    const PASS_RATIO = 0.6;
    const SEEN_CAP = 200;

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    /** Hour is 1..12, minute 0..59. */
    const formatTime = (h, m) => `${h}:${pad2(m)}`;
    const fmt = t => formatTime(norm12(t.h), t.m);
    const time24 = (h24, m) => `${pad2(h24)}:${pad2(m)}`;
    const norm12 = h => ((h - 1 + 12) % 12) + 1;
    const same = (a, b) => norm12(a.h) === norm12(b.h) && a.m === b.m;
    /** Hand angles in degrees clockwise from 12: minute hand 6 deg per minute, hour hand 30 deg per hour + 0.5 deg per minute. */
    const handAngles = (h, m) => ({ hour: (h % 12) * 30 + m * 0.5, minute: m * 6 });
    /** Inverse of handAngles: the hour hand gives the hour only once the minutes are subtracted. */
    const anglesToTime = (hourDeg, minDeg) => {
        const m = Math.round(minDeg / 6) % 60;
        return { h: norm12(Math.round((hourDeg - m * 0.5) / 30)), m };
    };
    const toMin = t => (t.h % 12) * 60 + t.m;
    const fromMin = tot => { tot = ((tot % 720) + 720) % 720; return { h: Math.floor(tot / 60) || 12, m: tot % 60 }; };
    const addMinutes = (t, d) => fromMin(toMin(t) + d);
    const minutesBetween = (a, b) => (toMin(b) - toMin(a) + 720) % 720;
    /** Angle (deg clockwise from 12) of a vector dx,dy given in screen coordinates (y grows downwards). */
    const pointAngle = (dx, dy) => (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const minuteFromAngle = (a, snap = 1) => { const m = Math.round(a / 6 / snap) * snap; return ((m % 60) + 60) % 60; };
    const hourFromAngle = (a, m = 0) => norm12(Math.round((a - m * 0.5) / 30));
    /** The hour follows the minute hand when it crosses 12 (clockwise +1, anticlockwise -1). */
    const advanceHour = (h, prevM, newM) => (prevM > 45 && newM < 15 ? norm12(h + 1) : prevM < 15 && newM > 45 ? norm12(h - 1) : h);
    const to12 = h24 => (h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24);
    const periodOf = h24 => (h24 >= 6 && h24 <= 11 ? 'am' : h24 >= 12 && h24 <= 19 ? 'pm' : 'night');
    const durShort = d => (d % 60 === 0 ? `${d / 60} h` : d < 60 ? `${d} min` : `${Math.floor(d / 60)} h ${d % 60} min`);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    function makeTime(step, r = Math.random) {
        const h = ri(1, 12, r), m = step >= 60 ? 0 : ri(0, Math.floor(59 / step), r) * step;
        return { h, m };
    }

    /** Wrong but plausible times, all distinct from t and each other. Typical mistakes: hands swapped, +/-1 hour, +/-step minutes. */
    function distractors(t, step, n = 3, r = Math.random) {
        const out = [], seen = new Set([t.h % 12 * 60 + t.m]);
        const add = (h, m) => {
            h = norm12(h); m = ((m % 60) + 60) % 60;
            const k = h % 12 * 60 + m;
            if (!seen.has(k) && out.length < n) { seen.add(k); out.push({ h, m }); }
        };
        if (step < 60 && t.m % 5 === 0 && t.m !== 0) add(t.m / 5, t.h * 5); // hands swapped
        const ds = step < 5 ? 5 : step;
        const cands = step >= 60
            ? [[t.h + 1, 0], [t.h - 1, 0], [t.h + 2, 0], [t.h - 2, 0], [t.h + 3, 0]]
            : [[t.h + 1, t.m], [t.h - 1, t.m], [t.h, t.m + ds], [t.h, t.m - ds], [t.h + 1, t.m + ds], [t.h, t.m + 2 * ds]];
        if (step < 5) cands.push([t.h, t.m + 1], [t.h, t.m - 1]);
        shuffle(cands, r).forEach(c => add(c[0], c[1]));
        let g = 0; while (out.length < n && g++ < 80) add(ri(1, 12, r), step >= 60 ? 0 : ri(0, Math.floor(59 / step), r) * step);
        return out;
    }

    /** n distinct time strings: the answer plus plausible wrong results (+/-1 h, +/-30, +/-15 min, wrong direction). */
    function timeOptions(res, extra, r) {
        const seen = new Set([fmt(res)]), out = [fmt(res)];
        const push = t => { const s = fmt(t); if (!seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } };
        extra.forEach(push);
        shuffle([60, -60, 30, -30, 15, -15, 120, -120], r).forEach(d => push(addMinutes(res, d)));
        return shuffle(out, r);
    }

    function makeQuestion(u, type, r = Math.random) {
        const step = u.step, q = { type, unit: u.id, step };
        const timeKey = t => `t|${norm12(t.h)}:${t.m}`;
        const finishTarget = t => { q.h = norm12(t.h); q.m = t.m; q.answer = formatTime(q.h, q.m); };
        if (type === 'match') {
            const times = [], seen = new Set();
            let g = 0;
            while (times.length < 3 && g++ < 200) { const t = makeTime(step, r), s = fmt(t); if (!seen.has(s)) { seen.add(s); times.push(t); } }
            q.times = times; q.order = shuffle([0, 1, 2], r); finishTarget(times[0]);
            q.key = 'match|' + times.map(fmt).sort().join(',');
            return q;
        }
        if (type === 'add' || type === 'durend') {
            const s = makeTime(u.startStep || step, r), d = type === 'durend' ? pick(u.durs || [30, 60, 90], r) : pick(u.deltas || [30, 60, -30], r);
            const res = addMinutes(s, d);
            q.ask = { s, d, dur: type === 'durend' }; finishTarget(res);
            q.options = timeOptions(res, [addMinutes(s, -d)], r);
            q.key = `add|${fmt(s)}|${d}`;
            return q;
        }
        if (type === 'dur') {
            const a = makeTime(u.startStep || step, r), d = pick(u.durs || [30, 60, 90], r), b = addMinutes(a, d);
            q.a = a; q.b = b; q.d = d; finishTarget(b); q.answer = String(d);
            const seen = new Set([d]), out = [String(d)];
            shuffle([15, -15, 30, -30, 60, -60, 45, -45, 90], r).forEach(x => { const v = d + x; if (v > 0 && v < 600 && !seen.has(v) && out.length < 4) { seen.add(v); out.push(String(v)); } });
            q.options = shuffle(out, r); q.key = `dur|${fmt(a)}|${fmt(b)}`;
            return q;
        }
        if (type === 'h24read' || type === 'h24to12') {
            const h24 = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], r), m = makeTime(step, r).m, p = periodOf(h24);
            q.h24 = h24; q.period = p; finishTarget({ h: to12(h24), m }); q.key = `h24|${h24}:${m}`;
            if (type === 'h24read') {
                const ans = time24(h24, m), seen = new Set([ans]), out = [ans];
                const alts = [[h24 + 12, m], [h24 - 12, m], [h24 + 1, m], [h24 - 1, m], [h24, (m + 30) % 60], [h24 + 2, m]];
                shuffle(alts, r).forEach(([hh, mm]) => { if (hh >= 1 && hh <= 23 && hh !== 12) { const s = time24(hh, mm); if (!seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } } });
                q.answer = ans; q.options = shuffle(out, r);
            } else {
                const h12 = to12(h24), ans = `${formatTime(h12, m)}|${p}`, seen = new Set([ans]), out = [ans];
                const others = ['am', 'pm', 'night'].filter(x => x !== p);
                [[h12, others[0]], [h12, others[1]], [norm12(h12 + 1), p], [norm12(h12 - 1), p], [norm12(h12 + 3), others[0]]].forEach(([hh, pp]) => { const s = `${formatTime(hh, m)}|${pp}`; if (!seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } });
                q.answer = ans; q.options = shuffle(out, r);
            }
            return q;
        }
        // time-target kinds: read, type, pick, set, say, hear
        let t;
        if (type === 'say' || type === 'hear') t = makeTime(5, r);
        else if (type === 'set' && u.setKind === 'words') t = makeTime(5, r);
        else t = makeTime(step, r);
        q.key = timeKey(t);
        if (type === 'set' && u.setKind === 'after') {
            const s = makeTime(u.startStep || step, r), d = pick(u.durs || u.deltas || [30, 60], r);
            t = addMinutes(s, d); q.ask = { kind: 'after', s, d, dur: !!u.durs }; q.key = `add|${fmt(s)}|${d}`;
        } else if (type === 'set' && u.setKind === 'h24') {
            const h24 = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], r), m = makeTime(step, r).m;
            t = { h: to12(h24), m }; q.h24 = h24; q.period = periodOf(h24); q.ask = { kind: 'h24' }; q.key = `h24|${h24}:${m}`;
        } else if (type === 'set') q.ask = { kind: u.setKind === 'words' ? 'words' : 'time' };
        finishTarget(t);
        if (type === 'read' || type === 'say' || type === 'hear') {
            q.options = shuffle([formatTime(q.h, q.m), ...distractors(t, type === 'read' ? step : 5, 3, r).map(d => formatTime(d.h, d.m))], r);
        }
        if (type === 'pick') q.clocks = shuffle([{ h: q.h, m: q.m, ok: true }, ...distractors(t, step, 3, r).map(d => ({ h: d.h, m: d.m, ok: false }))], r);
        if (type === 'set') q.start = { h: norm12(q.h + pick([3, 4, 5, 6], r)), m: 0 };
        return q;
    }

    /** Picks a question whose key is not in this lesson (local) nor in the recent ring buffer (seen); when that is impossible the least recently seen one is used. */
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
            let t, g = 0; do { t = pick(u.types, r); } while (t === last && g++ < 6);
            let q = makeUnique(u, t, r, seen, local);
            if (q.repeat) for (const t2 of shuffle([...new Set(u.types)], r)) { const q2 = makeUnique(u, t2, r, seen, local); if (!q2.repeat) { q = q2; t = t2; break; } }
            last = t; local.add(q.key); out.push(q);
        }
        return out;
    }

    /** Two guided exercises: the child sets the hands with a hint on screen. */
    function makeGuided(u, r = Math.random, seen = null) {
        const out = [], local = new Set();
        for (let i = 0; i < 2; i++) { const q = makeUnique(u, 'set', r, seen, local); q.guided = true; local.add(q.key); out.push(q); }
        return out;
    }

    /** v: formatted string (read, say, hear, add...), index (pick), {h,m} (set, type), number of mistakes (match). */
    function isCorrect(q, v) {
        if (q.type === 'pick') return !!(q.clocks[v] && q.clocks[v].ok);
        if (q.type === 'set' || q.type === 'type') return !!v && Number.isFinite(v.m) && Number.isFinite(v.h) && same(v, q);
        if (q.type === 'match') return v === 0;
        return v === q.answer;
    }
    const stars = (correct, total) => { const miss = total - correct; return miss <= 0 ? 3 : miss <= 2 ? 2 : 1; };
    const passed = (correct, total) => total > 0 && correct / total >= PASS_RATIO;

    /** Ring buffer of recent question keys per player ('clock_seen_' + owner), persisted through a getItem/setItem storage. */
    function SeenStore(storage, owner, cap) {
        cap = cap || SEEN_CAP;
        const sk = 'clock_seen_' + owner;
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

    // ---- texts built from templates (pure, tested for the six languages) ----
    const langOf = l => (UI[l] ? UI[l] : UI.es);
    function durText(d, L) {
        if (d === 30) return L.dur.half;
        if (d % 60 === 0) return `${d / 60} ${d === 60 ? L.dur.h1 : L.dur.hN}`;
        if (d < 60) return `${d} ${L.dur.min}`;
        return durShort(d);
    }
    const deltaText = (d, L) => (d >= 0 ? L.inD(durText(d, L)) : L.agoD(durText(-d, L)));
    function explainRead(h, m, L) {
        const n = nx(h);
        return [m === 0 ? L.hourExact(h) : L.hourBetween(h, n),
            m === 0 ? L.minZero : m % 5 === 0 ? L.minFive(m / 5, m, L.sp[m] || '') : L.minAny(m), L.so(h, m)].join(' ');
    }
    function exampleText(ex, lang) {
        const L = langOf(lang);
        if (ex.k === 'say') return `${L.look} ${formatTime(ex.h, ex.m)}: ${L.say(ex.h, ex.m)}.`;
        if (ex.k === 'add') { const s = { h: ex.h, m: ex.m }, res = addMinutes(s, ex.d); return `${L.look} ${L.exAdd(`${fmt(s)} ${ex.d >= 0 ? '+' : '−'} ${durShort(Math.abs(ex.d))} = ${fmt(res)}`, ex.d >= 0)}`; }
        if (ex.k === 'h24') { const h12 = to12(ex.h24), mm = pad2(ex.m), p = L.pOf[periodOf(ex.h24)]; return `${L.look} ${time24(ex.h24, ex.m)} → ${ex.h24 > 12 ? L.ex24pm(ex.h24, h12, mm, p) : L.ex24am(ex.h24, h12, mm, p)}`; }
        if (ex.k === 'dur') { const a = { h: ex.h, m: ex.m }, b = addMinutes(a, ex.d); return `${L.look} ${L.exDur(fmt(a), fmt(b), durShort(ex.d))}`; }
        return `${L.look} ${explainRead(ex.h, ex.m, L)}`;
    }
    /** The clock to draw for a worked example. */
    function exampleClock(ex) {
        if (ex.k === 'add') return addMinutes({ h: ex.h, m: ex.m }, ex.d);
        if (ex.k === 'h24') return { h: to12(ex.h24), m: ex.m };
        if (ex.k === 'dur') return addMinutes({ h: ex.h, m: ex.m }, ex.d);
        return { h: norm12(ex.h), m: ex.m };
    }
    /** What a wrong answer should be shown with: a sentence explaining WHY and the clocks to redraw highlighted. */
    function explain(q, lang, given) {
        const L = langOf(lang), t = { h: q.h, m: q.m };
        let text, clocks = [{ h: q.h, m: q.m }];
        if (q.type === 'match') { text = L.exMatch; clocks = q.times.map(x => ({ h: norm12(x.h), m: x.m, label: fmt(x) })); }
        else if (q.type === 'add' || q.type === 'durend' || (q.type === 'set' && q.ask && q.ask.kind === 'after')) {
            const { s, d } = q.ask, res = addMinutes(s, d);
            text = L.exAdd(`${fmt(s)} ${d >= 0 ? '+' : '−'} ${durShort(Math.abs(d))} = ${fmt(res)}`, d >= 0);
            clocks = [{ h: norm12(s.h), m: s.m, label: fmt(s) }, { h: res.h, m: res.m, label: fmt(res) }];
        } else if (q.type === 'dur') {
            text = L.exDur(fmt(q.a), fmt(q.b), durShort(q.d));
            clocks = [{ h: norm12(q.a.h), m: q.a.m, label: fmt(q.a) }, { h: q.b.h, m: q.b.m, label: fmt(q.b) }];
        } else if (q.type === 'h24read' || q.type === 'h24to12' || (q.type === 'set' && q.ask && q.ask.kind === 'h24')) {
            const mm = pad2(q.m), p = L.pOf[q.period];
            text = q.h24 > 12 ? L.ex24pm(q.h24, q.h, mm, p) : L.ex24am(q.h24, q.h, mm, p);
            clocks[0].label = time24(q.h24, q.m);
        } else {
            text = explainRead(t.h, t.m, L);
            if (q.type === 'say' || q.type === 'hear' || (q.type === 'set' && q.ask && q.ask.kind === 'words')) text += ' ' + L.exSay(L.say(t.h, t.m));
            if (given && Number.isFinite(given.h) && (q.type === 'set' || q.type === 'type')) text = L.youSet(fmt(given)) + ' ' + text;
        }
        return { text, clocks };
    }
    /** Short label for the right answer shown after a mistake. */
    function answerLabel(q, lang) {
        const L = langOf(lang);
        if (q.type === 'dur') return durShort(q.d);
        if (q.type === 'h24read') return q.answer;
        if (q.type === 'h24to12') { const [s, p] = q.answer.split('|'); return L.at12(s, L.pOf[p]); }
        if (q.type === 'match') return '';
        if (q.type === 'say' || (q.type === 'set' && q.ask && q.ask.kind === 'words')) return L.say(q.h, q.m);
        return formatTime(q.h, q.m);
    }
    /** The sentence that asks a "set the clock" question, in the given language. */
    function setPrompt(q, lang) {
        const L = langOf(lang), k = q.ask && q.ask.kind;
        if (k === 'words') return L.qSetW(L.say(q.h, q.m));
        if (k === 'after') return q.ask.dur ? `${L.qDurEnd(fmt(q.ask.s), durText(q.ask.d, L))} ${L.setHands}` : `${L.qAdd(fmt(q.ask.s), deltaText(q.ask.d, L), q.ask.d < 0)} ${L.setHands}`;
        if (k === 'h24') return L.qSetH24(time24(q.h24, q.m));
        return L.qSet(formatTime(q.h, q.m));
    }

    // ===================== DOM =====================
    const S = { user: null, prog: { units: {}, learned: {}, xp: 0, streak: 0, last: '' }, idx: 0, u: null, queue: [], qi: 0, total: 0, correct: 0, run: 0, bestRun: 0, q: null, set: null, locked: false, t0: 0,
        phase: 'practice', guidedQ: [], gi: 0, seen: null, learn: null, widget: null };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'clock_prog_' + owner();
    const blank = () => ({ units: {}, learned: {}, xp: 0, streak: 0, last: '' });
    const safeStore = () => { try { return window.localStorage; } catch (e) { return null; } };
    function load() { try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); } if (!S.prog.learned || typeof S.prog.learned !== 'object') S.prog.learned = {}; }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];
    const unitName = u => T().k[u.id];
    const parseFmt = s => { const [h, m] = s.split(':'); return { h: Number(h), m: Number(m) }; };

    // ---- clock drawing (SVG) ----
    const NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    /**
     * Builds an analogue clock. o: {h, m, mini, hl (highlight hands), minNums (minute values outside the face),
     * mode: null | 'minute' | 'hour' | 'both' (draggable hands), snap (minutes), onChange(h, m)}.
     * Short red hand = hours, long blue hand = minutes. Returns {svg, set, get, showNums}.
     */
    function makeClock(o) {
        const R = o.minNums ? 80 : 94, st = { h: norm12(o.h), m: o.m };
        const svg = svgEl('svg', { viewBox: o.minNums ? '-8 -8 216 216' : '0 0 200 200', class: 'ck-face' + (o.mini ? ' mini' : '') + (o.mode ? ' drag' : '') + (o.hl ? ' hl' : '') });
        svgEl('circle', { cx: 100, cy: 100, r: R, fill: '#fffaf0', stroke: '#c2410c', 'stroke-width': 7 }, svg);
        for (let i = 0; i < 60; i++) {
            const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? R - 16 : R - 9;
            svgEl('line', { x1: 100 + (R - 4) * Math.sin(a), y1: 100 - (R - 4) * Math.cos(a), x2: 100 + r1 * Math.sin(a), y2: 100 - r1 * Math.cos(a), stroke: '#7c2d12', 'stroke-width': big ? 3.5 : 1.5, 'stroke-linecap': 'round' }, svg);
        }
        for (let n = 1; n <= 12; n++) {
            if (o.mini && n % 3) continue;
            const a = n * 30 * Math.PI / 180, tx = svgEl('text', { x: 100 + (R - 30) * Math.sin(a), y: 100 - (R - 30) * Math.cos(a) + (o.minNums ? 7 : o.mini ? 7 : 8), 'text-anchor': 'middle', 'font-size': o.minNums ? 17 : o.mini ? 22 : 20, 'font-weight': 800, fill: '#431407', 'font-family': 'sans-serif' }, svg);
            tx.textContent = n;
        }
        let nums = null;
        if (o.minNums) {
            nums = svgEl('g', { class: 'ck-minnums' }, svg);
            for (let n = 1; n <= 12; n++) {
                const a = n * 30 * Math.PI / 180, tx = svgEl('text', { x: 100 + (R + 15) * Math.sin(a), y: 100 - (R + 15) * Math.cos(a) + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: '#1d4ed8', 'font-family': 'sans-serif' }, nums);
                tx.textContent = n * 5;
            }
        }
        const hourHand = svgEl('line', { x1: 100, y1: 100, x2: 100, y2: 100 - R * 0.47, stroke: '#dc2626', 'stroke-width': 9, 'stroke-linecap': 'round', class: 'ck-hand-h' }, svg);
        const minHand = svgEl('line', { x1: 100, y1: 108, x2: 100, y2: 100 - R * 0.8, stroke: '#2563eb', 'stroke-width': 5, 'stroke-linecap': 'round', class: 'ck-hand-m' }, svg);
        svgEl('circle', { cx: 100, cy: 100, r: 7, fill: '#1f2937' }, svg);
        const label = () => T().clockLabel(st.h, st.m);
        function set(h, m) {
            st.h = norm12(h); st.m = m;
            const a = handAngles(st.h, st.m);
            hourHand.setAttribute('transform', `rotate(${a.hour} 100 100)`); minHand.setAttribute('transform', `rotate(${a.minute} 100 100)`);
            svg.setAttribute('aria-label', label());
            if (o.mode) { svg.setAttribute('aria-valuenow', toMin(st)); svg.setAttribute('aria-valuetext', label()); }
        }
        svg.setAttribute('role', o.mode ? 'slider' : 'img');
        set(st.h, st.m);
        if (o.hl) {
            const a = handAngles(st.h, st.m);
            [[a.hour, R * 0.47, '#dc2626'], [a.minute, R * 0.8, '#2563eb']].forEach(([deg, len, col]) => {
                const rad = deg * Math.PI / 180;
                svgEl('circle', { cx: 100 + len * Math.sin(rad), cy: 100 - len * Math.cos(rad), r: 7, fill: col, stroke: '#fbbf24', 'stroke-width': 3 }, svg);
            });
        }
        if (o.mode) {
            svg.setAttribute('tabindex', '0'); svg.setAttribute('aria-valuemin', 0); svg.setAttribute('aria-valuemax', 719);
            let drag = null;
            const pt = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return { a: pointAngle(q.x - 100, q.y - 100), r: Math.hypot(q.x - 100, q.y - 100) }; };
            const change = () => { if (o.onChange) o.onChange(st.h, st.m); };
            const apply = a => {
                if (drag === 'm') { const nm = minuteFromAngle(a, o.snap || 1); set(advanceHour(st.h, st.m, nm), nm); }
                else set(hourFromAngle(a, st.m), st.m);
                change();
            };
            svg.addEventListener('pointerdown', ev => {
                ev.preventDefault(); const p = pt(ev);
                drag = o.mode === 'both' ? (p.r < R * 0.55 ? 'h' : 'm') : o.mode === 'hour' ? 'h' : 'm';
                try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
                apply(p.a);
            });
            svg.addEventListener('pointermove', ev => { if (drag) apply(pt(ev).a); });
            const end = () => { drag = null; };
            svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
            svg.addEventListener('keydown', ev => {
                const d = { ArrowRight: 1, ArrowUp: 5, ArrowLeft: -1, ArrowDown: -5 }[ev.key]; if (!d) return;
                ev.preventDefault();
                if (o.mode === 'hour') { set(norm12(st.h + (d > 0 ? 1 : -1)), st.m); } else { const nm = ((st.m + d * (o.snap || 1)) % 60 + 60) % 60; set(advanceHour(st.h, st.m, nm), nm); }
                change();
            });
        }
        return { svg, set, get: () => ({ h: st.h, m: st.m }), showNums: on => { if (nums) nums.classList.toggle('on', !!on); } };
    }
    /** Static clock; hl highlights the hands (used when explaining a mistake). */
    const drawClock = (h, m, mini, hl) => makeClock({ h, m, mini, hl }).svg;

    // ---- home ----
    function show(id) { ['ck-home', 'ck-learn', 'ck-play', 'ck-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('ck-h1').textContent = t.title; $('ck-sub').textContent = t.sub;
        const st = $('ck-stats'); st.textContent = '';
        st.appendChild(el('span', 'ck-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'ck-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('ck-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'ck-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'ck-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${unitName(u)}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'ck-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, unitName(u)));
            if (done) info.appendChild(el('div', 'ck-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info);
            if (open) { const lb = el('button', 'ck-lbtn', '📖'); lb.type = 'button'; lb.dataset.learn = u.id; lb.setAttribute('aria-label', `${t.learnBtn}: ${unitName(u)}`); lb.onclick = () => { prepare(i); openLearn('start'); }; li.appendChild(lb); }
            path.appendChild(li);
        });
        let sb = $('ck-speedbtn');
        if (!sb) { sb = el('button', 'ck-btn ck-speedbtn'); sb.type = 'button'; sb.id = 'ck-speedbtn'; sb.onclick = startSpeed; $('ck-home').appendChild(sb); }
        let best = 0; try { best = Number(localStorage.getItem(speedKey())) || 0; } catch (e) {}
        sb.textContent = '⚡ ' + Dyn.t('speed') + (best ? ' · ' + Dyn.t('best') + ': ' + best : '');
    }

    // ---- learn step ----
    function updateDigital(h, m) { $('ck-digital').textContent = formatTime(h, m); }
    function openLearn(from) { S.learn = { from, ex: 0, nums: false }; show('ck-learn'); buildLearn(); }
    function buildLearn() {
        const t = T(), u = S.u, L = S.learn, c0 = exampleClock(u.ex[L.ex]);
        $('ck-l-title').textContent = `${t.lesson} ${S.idx + 1}: ${unitName(u)}`;
        $('ck-l-intro').textContent = t.learn[u.id];
        $('ck-skip').textContent = t.skip; $('ck-l-drag').textContent = t.dragHint; $('ck-diglabel').textContent = t.digital;
        $('ck-leg-h').textContent = t.legendH; $('ck-leg-m').textContent = t.legendM;
        $('ck-ex-next').textContent = t.exNext; $('ck-learn-done').textContent = t.goPractice; $('ck-l-quit').setAttribute('aria-label', t.quit);
        const holder = $('ck-learn-clock'); holder.textContent = '';
        S.widget = makeClock({ h: c0.h, m: c0.m, minNums: true, mode: 'minute', snap: 1, onChange: updateDigital });
        holder.appendChild(S.widget.svg);
        S.widget.showNums(L.nums); $('ck-nums').textContent = L.nums ? t.hideNums : t.showNums;
        renderExample();
    }
    function renderExample() {
        const t = T(), u = S.u, L = S.learn, ex = u.ex[L.ex], c = exampleClock(ex), last = L.ex >= u.ex.length - 1;
        S.widget.set(c.h, c.m); updateDigital(c.h, c.m);
        $('ck-ex-label').textContent = t.exLabel(L.ex + 1, u.ex.length);
        $('ck-ex-text').textContent = exampleText(ex, lang());
        $('ck-ex-next').hidden = last; $('ck-learn-done').hidden = !last;
    }
    function finishLearn(didAll) {
        S.prog.learned[S.u.id] = true; save();
        if (S.learn && S.learn.from === 'play') { show('ck-play'); return; }
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
    function beginPlay() { show('ck-play'); next(); }
    function bar() {
        const g = S.phase === 'guided', p = g ? 0 : Math.round(S.qi / S.total * 100);
        if (!S.speed) { $('ck-barfill').style.width = p + '%'; $('ck-barfill').parentNode.setAttribute('aria-valuenow', p); }
        $('ck-count').textContent = S.speed ? `⏱ ${Math.max(0, Math.ceil((S.speed.end - Date.now()) / 1000))}s` : g ? T().guided(S.gi + 1, S.guidedQ.length) : `${Math.min(S.qi + 1, S.total)} / ${S.total}`;
        $('ck-learnbtn').textContent = '💡 ' + Dyn.t('help'); $('ck-learnbtn').setAttribute('aria-label', Dyn.t('help') + ': ' + T().learnBtn);
        $('ck-learnbtn').hidden = !!S.speed;
        if (S.hud) { S.hud.setStreak(S.run); S.hud.setPoints(S.correct); }
    }

    function next() {
        if (S.speed) return nextSpeed();
        $('ck-feedback').hidden = true; S.locked = false;
        if (S.phase === 'guided' && S.gi >= S.guidedQ.length) { S.phase = 'practice'; S.qi = 0; }
        if (S.phase === 'practice' && S.qi >= S.total) return finish();
        S.q = S.phase === 'guided' ? S.guidedQ[S.gi] : S.queue[S.qi]; bar();
        if (S.phase === 'practice' && S.seen) S.seen.add(S.q.key);
        renderQuestion();
    }
    function clockWrap(h, m) { const w = el('div', 'ck-clockwrap'); w.appendChild(drawClock(h, m)); return w; }
    function renderQuestion() {
        const t = T(), q = S.q, card = $('ck-card'), L = lang(); card.textContent = ''; card.classList.remove('ck-shake');
        const ts = formatTime(q.h, q.m), tp = q.type;
        Dyn.slide(card);
        card.appendChild(Dyn.zone(S.speed ? '⚡ ' + Dyn.t('speed') : S.phase === 'guided' ? t.guided(S.gi + 1, S.guidedQ.length) : Dyn.t('q', { n: Math.min(S.qi + 1, S.total), m: S.total }), 'q'));
        if (tp === 'read') {
            card.appendChild(el('p', 'ck-prompt', t.qRead)); card.appendChild(clockWrap(q.h, q.m));
            options(card, q.options.map(v => ({ label: v, v })));
        } else if (tp === 'type') {
            card.appendChild(el('p', 'ck-prompt', t.qType)); card.appendChild(clockWrap(q.h, q.m));
            card.appendChild(Dyn.zone('write'));
            const row = el('div', 'ck-typed');
            const mkIn = (id, aria) => { const i = el('input', 'ck-input'); i.id = id; i.type = 'text'; i.inputMode = 'numeric'; i.maxLength = 2; i.autocomplete = 'off'; i.setAttribute('aria-label', aria); return i; };
            row.appendChild(mkIn('ck-th', t.hour)); row.appendChild(el('span', 'ck-colon', ':')); row.appendChild(mkIn('ck-tm', t.minute));
            card.appendChild(row);
            const ok = el('button', 'ck-btn', t.check); ok.type = 'button'; ok.id = 'ck-check'; ok.onclick = submitTyped; card.appendChild(ok);
        } else if (tp === 'pick') {
            card.appendChild(el('p', 'ck-prompt', t.qPick(ts))); card.appendChild(el('div', 'ck-big', ts));
            const box = el('div', 'ck-opts ck-clocks'); box.setAttribute('role', 'group');
            q.clocks.forEach((c, i) => { const b = el('button', 'ck-opt ck-clockbtn'); b.type = 'button'; b.setAttribute('aria-label', Dyn.t('tapClock') + ' ' + (i + 1)); b.appendChild(drawClock(c.h, c.m, true)); b.onclick = () => answer(i, b); box.appendChild(b); });
            card.appendChild(Dyn.zone('tapClock')); card.appendChild(box); Dyn.style(box, { sel: '.ck-clockbtn', fill: false });
        } else if (tp === 'set') {
            card.appendChild(el('p', 'ck-prompt', setPrompt(q, L)));
            if (q.ask.kind === 'time') card.appendChild(el('div', 'ck-big', ts));
            if (q.guided) card.appendChild(el('p', 'ck-hintbox', `${t.hintL} ${explain(q, L).text}`));
            S.set = { h: q.start.h, m: q.start.m };
            card.appendChild(Dyn.zone('dragHands'));
            const w = el('div', 'ck-clockwrap'); w.id = 'ck-setclock';
            S.widget = makeClock({ h: q.start.h, m: q.start.m, mode: q.step >= 60 ? 'hour' : 'both', snap: Math.min(q.step, 30), onChange: (h, m) => { S.set.h = h; S.set.m = m; refreshVals(); } });
            w.appendChild(S.widget.svg); card.appendChild(w);
            const ctl = el('div', 'ck-ctl');
            ctl.appendChild(stepper(t.hour, 'h', 1));
            if (q.step < 60) ctl.appendChild(stepper(t.minute, 'm', q.step));
            card.appendChild(ctl);
            const ok = el('button', 'ck-btn', t.check); ok.type = 'button'; ok.id = 'ck-check'; ok.onclick = () => answer({ h: S.set.h, m: S.set.m }, ok); card.appendChild(ok);
            refreshVals();
        } else if (tp === 'match') {
            card.appendChild(el('p', 'ck-prompt', t.qMatch)); card.appendChild(Dyn.zone('matchPairs'));
            renderMatch(card, q);
        } else if (tp === 'say') {
            card.appendChild(el('p', 'ck-prompt', t.qSay)); card.appendChild(clockWrap(q.h, q.m));
            options(card, q.options.map(v => { const x = parseFmt(v); return { label: cap(t.say(x.h, x.m)), v }; }), true);
        } else if (tp === 'hear') {
            card.appendChild(el('p', 'ck-prompt', t.qHear(t.say(q.h, q.m))));
            options(card, q.options.map(v => ({ label: v, v })));
        } else if (tp === 'add' || tp === 'durend') {
            const s = q.ask.s;
            card.appendChild(el('p', 'ck-prompt', tp === 'add' ? t.qAdd(fmt(s), deltaText(q.ask.d, t), q.ask.d < 0) : t.qDurEnd(fmt(s), durText(q.ask.d, t))));
            card.appendChild(clockWrap(s.h, s.m));
            options(card, q.options.map(v => ({ label: v, v })));
        } else if (tp === 'dur') {
            card.appendChild(el('p', 'ck-prompt', t.qDur(fmt(q.a), fmt(q.b))));
            const row = el('div', 'ck-twoclocks'); [q.a, q.b].forEach(c => { const f = el('figure', 'ck-fig'); f.appendChild(drawClock(c.h, c.m, true)); f.appendChild(el('figcaption', null, fmt(c))); row.appendChild(f); });
            card.appendChild(row);
            options(card, q.options.map(v => ({ label: durShort(Number(v)), v })));
        } else if (tp === 'h24read') {
            card.appendChild(el('p', 'ck-prompt', t.qH24r(t.pIn[q.period]))); card.appendChild(clockWrap(q.h, q.m));
            options(card, q.options.map(v => ({ label: v, v })));
        } else if (tp === 'h24to12') {
            card.appendChild(el('p', 'ck-prompt', t.qH24t(time24(q.h24, q.m)))); card.appendChild(el('div', 'ck-big', time24(q.h24, q.m)));
            options(card, q.options.map(v => { const [s, p] = v.split('|'); return { label: t.at12(s, t.pOf[p]), v }; }), true);
        }
    }

    function options(card, list, wide) {
        const box = el('div', 'ck-opts' + (wide ? ' wide' : '')); box.setAttribute('role', 'group');
        list.forEach(o => { const b = el('button', 'ck-opt', o.label); b.type = 'button'; b.dataset.v = o.v; b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(Dyn.zone('choose')); card.appendChild(box); Dyn.style(box, { sel: '.ck-opt' });
    }

    function renderMatch(card, q) {
        const wrap = el('div', 'ck-match'), left = el('div', 'ck-matchcol'), right = el('div', 'ck-matchcol');
        let sel = null, matched = 0, mistakes = 0;
        const clocks = [], times = [];
        q.times.forEach((tm, i) => { const b = el('button', 'ck-opt ck-mclock'); b.type = 'button'; b.dataset.i = i; b.appendChild(drawClock(norm12(tm.h), tm.m, true)); b.onclick = () => { if (S.locked || b.disabled) return; sel = i; clocks.forEach(c => c.classList.toggle('sel', c === b)); }; clocks.push(b); left.appendChild(b); });
        q.order.forEach(i => {
            const b = el('button', 'ck-opt ck-mtime', fmt(q.times[i])); b.type = 'button'; b.dataset.i = i; times.push(b);
            b.onclick = () => {
                if (S.locked || b.disabled) return;
                if (sel === null) { clocks[0].focus(); return; }
                if (sel === i) { b.classList.add('ok'); b.disabled = true; clocks[i].classList.remove('sel'); clocks[i].classList.add('ok'); clocks[i].disabled = true; sel = null; if (++matched === q.times.length) answer(mistakes, null); }
                else { mistakes++; b.classList.add('bad'); answer(mistakes, null); }
            };
            right.appendChild(b);
        });
        wrap.appendChild(left); wrap.appendChild(right); card.appendChild(wrap);
    }

    function submitTyped() {
        const h = parseInt($('ck-th').value, 10), m = parseInt($('ck-tm').value || '0', 10);
        if (!Number.isFinite(h) || h < 1 || h > 24 || !Number.isFinite(m) || m < 0 || m > 59) { $('ck-th').focus(); return; }
        answer({ h, m }, $('ck-check'));
    }

    function stepper(label, what, step) {
        const t = T(), w = el('div', 'ck-step'); w.appendChild(el('span', 'ck-steplabel', label));
        const row = el('div', 'ck-steprow');
        const mk = (sym, dir, aria) => { const b = el('button', 'ck-key', sym); b.type = 'button'; b.setAttribute('aria-label', `${label} ${aria}`); b.onclick = () => adjust(what, dir * step); return b; };
        row.appendChild(mk('−', -1, t.minus));
        const val = el('span', 'ck-stepval'); val.id = 'ck-val-' + what; val.setAttribute('aria-live', 'polite'); row.appendChild(val);
        row.appendChild(mk('+', 1, t.plus));
        w.appendChild(row); return w;
    }
    function adjust(what, d) {
        if (S.locked || !S.set) return;
        if (what === 'h') S.set.h = norm12(S.set.h + d); else S.set.m = ((S.set.m + d) % 60 + 60) % 60;
        if (S.widget) S.widget.set(S.set.h, S.set.m);
        refreshVals();
    }
    function refreshVals() {
        if (!S.set) return;
        const vh = $('ck-val-h'), vm = $('ck-val-m');
        if (vh) vh.textContent = S.set.h; if (vm) vm.textContent = pad2(S.set.m);
    }

    const TIME_ANSWERS = new Set(['read', 'type', 'pick', 'say', 'hear', 'add', 'durend']);
    function showFeedback(ok, q, v, o = {}) {
        const t = T(), fb = $('ck-feedback'), L = lang();
        fb.hidden = false; fb.textContent = ''; fb.className = 'ck-feedback ' + (ok ? 'good' : 'bad');
        const col = el('div', 'ck-fbcol');
        if (ok) col.appendChild(el('b', null, pick(t.good)));
        else if (o.retry) col.appendChild(el('b', null, t.retryT));
        else {
            const lbl = answerLabel(q, L);
            col.appendChild(el('b', null, TIME_ANSWERS.has(q.type) || (q.type === 'set' && q.ask.kind !== 'h24') ? t.bad : t.badA));
            if (lbl) col.appendChild(el('span', 'ck-ans', lbl));
        }
        if (!ok) {
            const ex = explain(q, L, v && typeof v === 'object' ? v : null);
            col.appendChild(el('b', 'ck-whylbl', '💡 ' + Dyn.t('why')));
            const why = el('p', 'ck-why', ex.text); why.id = 'ck-why'; col.appendChild(why);
            if (!o.retry) {
                const row = el('div', 'ck-figs');
                ex.clocks.forEach(c => { const f = el('figure', 'ck-fig'); f.appendChild(drawClock(c.h, c.m, true, true)); if (c.label) f.appendChild(el('figcaption', null, c.label)); row.appendChild(f); });
                col.appendChild(row);
            }
        }
        const go = el('button', 'ck-btn', o.retry ? t.retry : t.next); go.type = 'button'; go.id = o.retry ? 'ck-retry' : 'ck-continue';
        go.onclick = o.retry ? () => { fb.hidden = true; } : () => { if (S.speed) return nextSpeed(); if (S.phase === 'guided') S.gi++; else S.qi++; next(); };
        fb.appendChild(col); fb.appendChild(go); go.focus();
        try { fb.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }

    function answer(v, btn) {
        if (S.locked) return;
        const q = S.q, ok = isCorrect(q, v), guided = S.phase === 'guided';
        if (guided && !ok && !q.tried) { q.tried = true; Dyn.bad(btn || $('ck-card')); showFeedback(false, q, v, { retry: true }); return; }
        S.locked = true; $('ck-card').classList.add('dy-done');
        document.querySelectorAll('#ck-card .ck-opt, #ck-card .ck-key, #ck-check, #ck-card .ck-input').forEach(b => { b.disabled = true; });
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (q.type === 'pick') { const rightIdx = q.clocks.findIndex(c => c.ok), bs = document.querySelectorAll('.ck-clockbtn'); if (bs[rightIdx]) bs[rightIdx].classList.add('ok'); }
        else if (q.options && !ok) document.querySelectorAll('#ck-card .ck-opt').forEach(b => { if (b.dataset.v === q.answer) b.classList.add('ok'); });
        if (!guided) { if (ok) { S.correct++; S.run++; S.bestRun = Math.max(S.bestRun, S.run); } else S.run = 0; }
        if (ok) Dyn.good(btn || $('ck-card'), S.run); else Dyn.bad(btn || $('ck-card'));
        if (S.hud) { S.hud.setStreak(S.run); S.hud.setPoints(S.correct); }
        if (S.speed && ok) setTimeout(() => { if (S.speed) nextSpeed(); }, 650); else showFeedback(ok, q, v);
        if (!ok) { $('ck-card').classList.add('ck-shake'); if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} } }
    }

    async function finish() {
        const t = T(), won = passed(S.correct, S.total), st = stars(S.correct, S.total);
        $('ck-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '🔄';
        $('ck-endtitle').textContent = won ? t.done : t.fail;
        $('ck-endtext').textContent = t.score(S.correct, S.total);
        if (won) Dyn.stars($('ck-endstars'), st, 3); else $('ck-endstars').textContent = '';
        $('ck-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('ck-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('ck-home'); } else { prepare(S.idx); beginPlay(); } };
        $('ck-back').textContent = t.back; $('ck-back').onclick = () => { renderHome(); show('ck-home'); };
        show('ck-end');
        if (won && st >= 2) Dyn.big($('ck-trophy'));
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        S.prog.xp = (S.prog.xp || 0) + 10 + st * 5;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'clock', {
                    correctAnswers: S.correct, totalQuestions: S.total, totalAttempts: S.total, bestStreak: S.bestRun,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.id });
            } catch (e) { console.warn('[ClockLab] stats not saved', e); }
        }
    }

    // ---- lightning round: alternates "tap the clock" and "set the hands", gentle 60 s timer, never a game over ----
    const SPEED_SECS = 60;
    const speedKey = () => 'clock_speed_best_' + owner();
    function startSpeed() {
        const pool = UNITS.filter((u, i) => unlocked(i) && u.setKind === 'time'), u = pool[pool.length - 1] || UNITS[0];
        S.u = u; S.idx = UNITS.indexOf(u); S.phase = 'speed'; S.run = 0; S.correct = 0; S.bestRun = 0; S.t0 = Date.now();
        S.speed = { n: 0, end: Date.now() + SPEED_SECS * 1000, u };
        clearInterval(S.speedTimer); S.speedTimer = setInterval(speedTick, 250);
        show('ck-play'); nextSpeed();
    }
    function speedTick() {
        if (!S.speed) { clearInterval(S.speedTimer); return; }
        const left = S.speed.end - Date.now();
        $('ck-barfill').style.width = Math.max(0, left / (SPEED_SECS * 10)) + '%';
        $('ck-count').textContent = '⏱ ' + Math.max(0, Math.ceil(left / 1000)) + 's';
        if (left <= 0) finishSpeed();
    }
    function nextSpeed() {
        if (!S.speed) return;
        $('ck-feedback').hidden = true; S.locked = false;
        const type = S.speed.n % 2 === 0 ? 'pick' : 'set'; S.speed.n++;
        S.q = makeQuestion(S.speed.u, type); bar(); renderQuestion();
    }
    function finishSpeed() {
        clearInterval(S.speedTimer); const n = S.correct, st = n >= 8 ? 3 : n >= 4 ? 2 : 1;
        S.speed = null; S.phase = 'practice'; $('ck-feedback').hidden = true;
        let best = 0; try { best = Number(localStorage.getItem(speedKey())) || 0; if (n > best) { best = n; localStorage.setItem(speedKey(), String(n)); } } catch (e) {}
        $('ck-trophy').textContent = '⚡'; $('ck-endtitle').textContent = Dyn.t('speed');
        $('ck-endtext').textContent = `${Dyn.t('score')}: ${n} · ${Dyn.t('best')}: ${best}`;
        Dyn.stars($('ck-endstars'), st, 3);
        $('ck-next').textContent = Dyn.t('again'); $('ck-next').onclick = startSpeed;
        $('ck-back').textContent = T().back; $('ck-back').onclick = goHome;
        show('ck-end'); if (n >= 4) Dyn.big($('ck-trophy'));
    }
    function goHome() { clearInterval(S.speedTimer); S.speed = null; S.phase = 'practice'; renderHome(); show('ck-home'); }
    function init() {
        $('ck-quit').onclick = goHome; $('ck-l-quit').onclick = goHome;
        const topBar = document.querySelector('#ck-play .ck-top'); Dyn.sound(topBar); S.hud = Dyn.hud(topBar);
        $('ck-skip').onclick = () => finishLearn(false);
        $('ck-learn-done').onclick = () => finishLearn(true);
        $('ck-ex-next').onclick = () => { S.learn.ex = Math.min(S.learn.ex + 1, S.u.ex.length - 1); renderExample(); };
        $('ck-nums').onclick = () => { S.learn.nums = !S.learn.nums; S.widget.showNums(S.learn.nums); $('ck-nums').textContent = S.learn.nums ? T().hideNums : T().showNums; };
        $('ck-learnbtn').onclick = () => openLearn('play');
        document.addEventListener('keydown', e => {
            if ($('ck-play').hidden) return;
            const c = $('ck-continue') || $('ck-retry'), fbOpen = !$('ck-feedback').hidden;
            if (e.key === 'Enter') {
                if (fbOpen && c) { e.preventDefault(); c.click(); }
                else if (S.q && S.q.type === 'set') { e.preventDefault(); answer({ h: S.set.h, m: S.set.m }, $('ck-check')); }
                else if (S.q && S.q.type === 'type') { e.preventDefault(); submitTyped(); }
                return;
            }
            if (fbOpen || !S.q || (e.target && e.target.tagName === 'INPUT')) return;
            if (S.q.type === 'set') {
                const m = { ArrowUp: ['h', 1], ArrowDown: ['h', -1], ArrowRight: ['m', S.q.step], ArrowLeft: ['m', -S.q.step] }[e.key];
                if (m && !(m[0] === 'm' && S.q.step >= 60) && !(e.target && e.target.tagName === 'svg')) { e.preventDefault(); adjust(m[0], m[1]); }
            } else if (/^[1-4]$/.test(e.key)) {
                const bs = document.querySelectorAll('#ck-card .ck-opt'), b = bs[Number(e.key) - 1]; if (b && S.q.type !== 'match') b.click();
            }
        });
        load(); renderHome(); show('ck-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        document.addEventListener('platformLanguageChanged', () => { if (!$('ck-home').hidden) renderHome(); else if (!$('ck-learn').hidden) buildLearn(); });
    }

    const api = { init, state: S, UNITS, UI, formatTime, handAngles, anglesToTime, norm12, toMin, fromMin, addMinutes, minutesBetween, pointAngle, minuteFromAngle, hourFromAngle, advanceHour,
        to12, periodOf, durShort, makeTime, distractors, makeQuestion, makeUnique, makeLesson, makeGuided, isCorrect, stars, passed, SeenStore, explain, explainRead, exampleText, exampleClock,
        answerLabel, setPrompt, durText, deltaText };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
