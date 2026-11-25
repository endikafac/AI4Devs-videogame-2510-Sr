/**
 * Games Hub - "Progress of the little ones" panel (adults only).
 *
 * Shows an adult what the children of their family are doing and learning:
 * days played, games played, minutes, per game progress in plain words, what
 * goes well, what to reinforce, and a friendly weekly sentence with a suggestion.
 *
 * Privacy (see docs/cuenta-familiar.md, "Panel de progreso"):
 *  - Only CHILDREN are read: the players the adult owns (users/{uid}/players)
 *    and the players of the families the adult belongs to as guardian
 *    (users/{owner}/players). The adult's own games, profile or other adults'
 *    data are never read, and local progress is only read with a child id.
 *  - Only data the games already store is used:
 *      cloud  players/{pid}/games/{game}: totals, byOperation, byLevel and the
 *             `daily` map (day -> { games, items, minutes, ok }) written by
 *             PlatformFirestore.updateGameStats.
 *      device localStorage progress of reading, maps, vocabulary, calcPath,
 *             clock, fractions, repaso (keys <name>_<authUid>_<pid>). It only
 *             exists on the device where the child plays and the panel says so.
 *  - No grades and no rankings: zones, stars, counts and encouraging words.
 *
 * Pure functions (aggregation, wording) are exported for tests with
 * module.exports; the DOM part only uses textContent for stored text.
 * Requires (browser): i18n-platform.js, firestore.js.
 */
const PlatformProgress = (function () {
    'use strict';

    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

    // ── Texts (es en eu gl ca fr) ────────────────────────────────────────────
    const ROWS = {
        title: ['Progreso de los pequeños', 'Little ones\' progress', 'Txikien aurrerapena', 'Progreso dos máis pequenos', 'Progrés dels petits', 'Progrès des petits'],
        sub: ['Lo que van aprendiendo y cómo avanzan. Solo aparecen los niños de tu familia, nunca tus propios datos.',
            'What they are learning and how they are getting on. Only the children of your family appear, never your own data.',
            'Zer ikasten ari diren eta nola doazen. Zure familiako haurrak bakarrik agertzen dira, inoiz ez zure datuak.',
            'O que van aprendendo e como avanzan. Só aparecen os nenos da túa familia, nunca os teus propios datos.',
            'El que van aprenent i com avancen. Només hi apareixen els infants de la teva família, mai les teves dades.',
            'Ce qu\'ils apprennent et comment ils avancent. Seuls les enfants de ta famille apparaissent, jamais tes propres données.'],
        loading: ['Cargando el progreso...', 'Loading progress...', 'Aurrerapena kargatzen...', 'Cargando o progreso...', 'Carregant el progrés...', 'Chargement des progrès...'],
        needLogin: ['Entra con tu cuenta de adulto para ver el progreso de los pequeños.', 'Sign in with your adult account to see the little ones\' progress.',
            'Hasi saioa zure helduaren kontuarekin txikien aurrerapena ikusteko.', 'Entra coa túa conta de adulto para ver o progreso dos máis pequenos.',
            'Entra amb el teu compte d\'adult per veure el progrés dels petits.', 'Connecte-toi avec ton compte d\'adulte pour voir les progrès des petits.'],
        signIn: ['Entrar', 'Sign in', 'Sartu', 'Entrar', 'Entrar', 'Se connecter'],
        noKids: ['Todavía no hay niños en tu familia. Crea un perfil infantil desde "¿Quién juega?" o acepta una invitación.',
            'There are no children in your family yet. Create a child profile from "Who is playing?" or accept an invitation.',
            'Oraindik ez dago haurrik zure familian. Sortu haur profil bat "Nork jokatzen du?" atalean edo onartu gonbidapen bat.',
            'Aínda non hai nenos na túa familia. Crea un perfil infantil desde "Quen xoga?" ou acepta unha invitación.',
            'Encara no hi ha infants a la teva família. Crea un perfil infantil des de "Qui juga?" o accepta una invitació.',
            'Il n\'y a pas encore d\'enfants dans ta famille. Crée un profil enfant depuis "Qui joue ?" ou accepte une invitation.'],
        error: ['No se pudo cargar el progreso. Inténtalo de nuevo.', 'Could not load the progress. Please try again.', 'Ezin izan da aurrerapena kargatu. Saiatu berriro.',
            'Non se puido cargar o progreso. Téntao de novo.', 'No s\'ha pogut carregar el progrés. Torna-ho a provar.', 'Impossible de charger les progrès. Réessaie.'],
        back: ['Volver a jugar', 'Back to the games', 'Jokoetara itzuli', 'Volver a xogar', 'Tornar a jugar', 'Retour aux jeux'],
        familyOf: ['Familia de {name}', 'Family of {name}', '{name}-(r)en familia', 'Familia de {name}', 'Família de {name}', 'Famille de {name}'],
        d7: ['Últimos 7 días', 'Last 7 days', 'Azken 7 egunak', 'Últimos 7 días', 'Darrers 7 dies', '7 derniers jours'],
        d30: ['Últimos 30 días', 'Last 30 days', 'Azken 30 egunak', 'Últimos 30 días', 'Darrers 30 dies', '30 derniers jours'],
        daysPlayed: ['Días jugados', 'Days played', 'Jokatutako egunak', 'Días xogados', 'Dies jugats', 'Jours joués'],
        gamesPlayed: ['Partidas', 'Games played', 'Partidak', 'Partidas', 'Partides', 'Parties'],
        minutes: ['Minutos', 'Minutes', 'Minutuak', 'Minutos', 'Minuts', 'Minutes'],
        kinds: ['Juegos distintos', 'Different games', 'Joku desberdinak', 'Xogos distintos', 'Jocs diferents', 'Jeux différents'],
        chartCap: ['Actividad de los últimos 14 días', 'Activity in the last 14 days', 'Azken 14 egunetako jarduera', 'Actividade dos últimos 14 días', 'Activitat dels darrers 14 dies', 'Activité des 14 derniers jours'],
        chartAlt: ['{n} de los últimos 14 días con actividad', '{n} of the last 14 days with activity', 'Azken 14 egunetatik {n} jarduerarekin',
            '{n} dos últimos 14 días con actividade', '{n} dels darrers 14 dies amb activitat', '{n} des 14 derniers jours avec activité'],
        sumTitle: ['Resumen de la semana', 'Summary of the week', 'Asteko laburpena', 'Resumo da semana', 'Resum de la setmana', 'Résumé de la semaine'],
        sum0: ['{name} no ha jugado esta semana.', '{name} has not played this week.', '{name}(e)k ez du jokatu aste honetan.', '{name} non xogou esta semana.',
            '{name} no ha jugat aquesta setmana.', '{name} n\'a pas joué cette semaine.'],
        sum1: ['{name} ha jugado {days} {days?día|días} esta semana, con {games} {games?partida|partidas}{mins}.', '{name} played on {days} {days?day|days} this week, with {games} {games?game|games}{mins}.', '{name}: aste honetan {days} egun jokatu ditu, {games} partida{mins}.', '{name} xogou {days} {days?día|días} esta semana, con {games} {games?partida|partidas}{mins}.', '{name} ha jugat {days} {days?dia|dies} aquesta setmana, amb {games} {games?partida|partides}{mins}.', '{name} a joué {days} {days?jour|jours} cette semaine, avec {games} {games?partie|parties}{mins}.'],
        sumHint: ['{name} ha jugado {days} {days?día|días} esta semana.', '{name} played on {days} {days?day|days} this week.', '{name}: aste honetan {days} egun jokatu ditu.', '{name} xogou {days} {days?día|días} esta semana.', '{name} ha jugat {days} {days?dia|dies} aquesta setmana.', '{name} a joué {days} {days?jour|jours} cette semaine.'],
        sumMins: [' y unos {m} {m?minuto|minutos}', ' and about {m} {m?minute|minutes}', ' eta {m} minutu inguru', ' e uns {m} {m?minuto|minutos}', ' i uns {m} {m?minut|minuts}', ' et environ {m} {m?minute|minutes}'],
        sumStrong: ['Lo que mejor se le da: {x}.', 'What goes best: {x}.', 'Hobekien egiten duena: {x}.', 'O que mellor se lle dá: {x}.', 'El que li va millor: {x}.', 'Ce qui va le mieux : {x}.'],
        sumNext: ['Para la próxima vez, os propongo {x}.', 'For next time, we suggest {x}.', 'Hurrengorako, hau proposatzen dizuegu: {x}.', 'Para a próxima vez, propoñémosvos {x}.',
            'Per a la propera vegada, us proposem {x}.', 'Pour la prochaine fois, nous vous proposons de {x}.'],
        sugWeak: ['repasar {game}, que tiene cosas por reforzar', 'review {game}, which has things to reinforce', '{game} errepasatzea, indartzeko gauzak daudelako',
            'repasar {game}, que ten cousas por reforzar', 'repassar {game}, que té coses per reforçar', 'revoir {game}, qui a des choses à renforcer'],
        sugRest: ['volver a {game}, que hace unos días que no toca', 'go back to {game}, which has not been played for a few days', '{game}-ra itzultzea, egun batzuk daramatzalako jokatu gabe',
            'volver a {game}, que leva uns días sen tocar', 'tornar a {game}, que fa uns dies que no toca', 'retourner à {game}, qui n\'a pas été joué depuis quelques jours'],
        sugNew: ['probar {game}, que todavía no ha jugado', 'try {game}, which has not been played yet', '{game} probatzea, oraindik jokatu ez duelako',
            'probar {game}, que aínda non xogou', 'provar {game}, que encara no ha jugat', 'essayer {game}, qui n\'a pas encore été joué'],
        sugKeep: ['seguir con {game}', 'keep going with {game}', '{game}-rekin jarraitzea', 'seguir con {game}', 'continuar amb {game}', 'continuer avec {game}'],
        sugStart: ['empezar con {game}, un buen primer paso', 'start with {game}, a good first step', '{game}-rekin hastea, lehen urrats ona', 'comezar con {game}, un bo primeiro paso',
            'començar amb {game}, un bon primer pas', 'commencer par {game}, un bon premier pas'],
        goPlay: ['Ir a {game}', 'Go to {game}', 'Joan {game}-ra', 'Ir a {game}', 'Anar a {game}', 'Aller à {game}'],
        strongTitle: ['Se le da bien', 'Going well', 'Ondo doa', 'Dáselle ben', 'Se li dona bé', 'Ça va bien'],
        weakTitle: ['A reforzar', 'To reinforce', 'Indartzeko', 'A reforzar', 'A reforçar', 'À renforcer'],
        none: ['Todavía no hay datos suficientes.', 'Not enough data yet.', 'Oraindik ez dago datu nahikorik.', 'Aínda non hai datos suficientes.', 'Encara no hi ha prou dades.', 'Pas encore assez de données.'],
        gamesTitle: ['Por juego', 'By game', 'Jokoka', 'Por xogo', 'Per joc', 'Par jeu'],
        devNote: ['La actividad diaria viene de la cuenta. El detalle de lectura, mapas, vocabulario, cálculo, relojes y fracciones solo se guarda en el dispositivo donde juega el niño: aquí ves el de este dispositivo.',
            'Daily activity comes from the account. The detail of reading, maps, vocabulary, calculation, clocks and fractions is only kept on the device where the child plays: here you see this device.',
            'Eguneroko jarduera kontutik dator. Irakurmenaren, mapen, hiztegiaren, kalkuluaren, erlojuen eta zatikien xehetasunak haurra jokatzen den gailuan bakarrik gordetzen dira: hemen gailu hau ikusten duzu.',
            'A actividade diaria vén da conta. O detalle de lectura, mapas, vocabulario, cálculo, reloxos e fraccións só se garda no dispositivo onde xoga o neno: aquí ves o deste dispositivo.',
            'L\'activitat diària ve del compte. El detall de lectura, mapes, vocabulari, càlcul, rellotges i fraccions només es desa al dispositiu on juga l\'infant: aquí veus el d\'aquest dispositiu.',
            'L\'activité quotidienne vient du compte. Le détail de lecture, cartes, vocabulaire, calcul, horloges et fractions n\'est gardé que sur l\'appareil où l\'enfant joue : ici tu vois celui de cet appareil.'],
        devNone: ['Este dispositivo no tiene el detalle de {name}. Ábrelo desde el dispositivo donde juega.', 'This device has no detail for {name}. Open it from the device where they play.',
            'Gailu honek ez du {name}(r)en xehetasunik. Ireki jokatzen duen gailutik.', 'Este dispositivo non ten o detalle de {name}. Ábreo desde o dispositivo onde xoga.',
            'Aquest dispositiu no té el detall de {name}. Obre\'l des del dispositiu on juga.', 'Cet appareil n\'a pas le détail de {name}. Ouvre-le depuis l\'appareil où il joue.'],
        statsFail: ['No se pudo leer la actividad de {name}.', 'Could not read the activity of {name}.', 'Ezin izan da {name}(r)en jarduera irakurri.', 'Non se puido ler a actividade de {name}.',
            'No s\'ha pogut llegir l\'activitat de {name}.', 'Impossible de lire l\'activité de {name}.'],
        // reading
        rdBest: ['Mejor lectura: {n} palabras por minuto', 'Best reading: {n} words per minute', 'Irakurketarik onena: {n} hitz minutuko', 'Mellor lectura: {n} palabras por minuto',
            'Millor lectura: {n} paraules per minut', 'Meilleure lecture : {n} mots par minute'],
        rdRecent: ['Últimas lecturas: {l} palabras por minuto', 'Latest readings: {l} words per minute', 'Azken irakurketak: {l} hitz minutuko', 'Últimas lecturas: {l} palabras por minuto',
            'Darreres lectures: {l} paraules per minut', 'Dernières lectures : {l} mots par minute'],
        rdIn: ['Lee dentro de la zona recomendada para su edad.', 'Reads within the recommended zone for their age.', 'Bere adinerako gomendatutako eremuaren barruan irakurtzen du.',
            'Le dentro da zona recomendada para a súa idade.', 'Llegeix dins de la zona recomanada per a la seva edat.', 'Lit dans la zone recommandée pour son âge.'],
        rdBelow: ['Está cerca de la zona recomendada: con práctica llegará.', 'Close to the recommended zone: with practice it will get there.', 'Gomendatutako eremutik gertu dago: praktikarekin helduko da.',
            'Está preto da zona recomendada: coa práctica chegará.', 'És a prop de la zona recomanada: amb pràctica hi arribarà.', 'Proche de la zone recommandée : avec de la pratique il y arrivera.'],
        rdAbove: ['Lee más deprisa que la zona recomendada: conviene cuidar la comprensión.', 'Reads faster than the recommended zone: it is worth caring for understanding.',
            'Gomendatutako eremua baino azkarrago irakurtzen du: ulermenari erreparatzea komeni da.', 'Le máis rápido que a zona recomendada: convén coidar a comprensión.',
            'Llegeix més de pressa que la zona recomanada: convé cuidar la comprensió.', 'Lit plus vite que la zone recommandée : il vaut mieux soigner la compréhension.'],
        rdComp: ['Comprensión: {w}', 'Understanding: {w}', 'Ulermena: {w}', 'Comprensión: {w}', 'Comprensió: {w}', 'Compréhension : {w}'],
        compHigh: ['muy buena', 'very good', 'oso ona', 'moi boa', 'molt bona', 'très bonne'],
        compMid: ['buena', 'good', 'ona', 'boa', 'bona', 'bonne'],
        compLow: ['en camino', 'on its way', 'bidean', 'en camiño', 'en camí', 'en bonne voie'],
        rdBooks: ['Libros: {c} {c?capítulo terminado|capítulos terminados}, {s} {s?estrella|estrellas}', 'Books: {c} {c?chapter|chapters} finished, {s} {s?star|stars}', 'Liburuak: {c} kapitulu amaituta, {s} izar', 'Libros: {c} {c?capítulo rematado|capítulos rematados}, {s} {s?estrela|estrelas}', 'Llibres: {c} {c?capítol acabat|capítols acabats}, {s} {s?estrella|estrelles}', 'Livres : {c} {c?chapitre terminé|chapitres terminés}, {s} {s?étoile|étoiles}'],
        sRdZone: ['Lectura en voz alta dentro de su zona', 'Reading aloud within its zone', 'Ahots goranzko irakurketa bere eremuan', 'Lectura en voz alta dentro da súa zona',
            'Lectura en veu alta dins de la seva zona', 'Lecture à voix haute dans sa zone'],
        sRdComp: ['Comprensión lectora', 'Reading understanding', 'Irakurmenaren ulermena', 'Comprensión lectora', 'Comprensió lectora', 'Compréhension de lecture'],
        wRdPace: ['Lectura: ganar soltura leyendo en voz alta', 'Reading: gaining fluency reading aloud', 'Irakurmena: ahots goran irakurtzean trebetasuna irabaztea',
            'Lectura: gañar soltura lendo en voz alta', 'Lectura: guanyar fluïdesa llegint en veu alta', 'Lecture : gagner en aisance à voix haute'],
        wRdComp: ['Lectura: repasar la comprensión de los textos', 'Reading: review the understanding of the texts', 'Irakurmena: testuen ulermena errepasatzea',
            'Lectura: repasar a comprensión dos textos', 'Lectura: repassar la comprensió dels textos', 'Lecture : revoir la compréhension des textes'],
        // maps
        mapRow: ['{name}: {a} de {b} dominados', '{name}: {a} of {b} mastered', '{name}: {b}-tik {a} menperatuta', '{name}: {a} de {b} dominados', '{name}: {a} de {b} dominats', '{name} : {a} sur {b} maîtrisés'],
        mapRow0: ['{name}: {a} dominados', '{name}: {a} mastered', '{name}: {a} menperatuta', '{name}: {a} dominados', '{name}: {a} dominats', '{name} : {a} maîtrisés'],
        sMap: ['Mapas: {name}', 'Maps: {name}', 'Mapak: {name}', 'Mapas: {name}', 'Mapes: {name}', 'Cartes : {name}'],
        wMapC: ['Mapas, países: {l}', 'Maps, countries: {l}', 'Mapak, herrialdeak: {l}', 'Mapas, países: {l}', 'Mapes, països: {l}', 'Cartes, pays : {l}'],
        wMapN: ['Mapas, {name}: {n} por repasar', 'Maps, {name}: {n} to review', 'Mapak, {name}: {n} errepasatzeko', 'Mapas, {name}: {n} por repasar', 'Mapes, {name}: {n} per repassar', 'Cartes, {name} : {n} à revoir'],
        // vocabulary
        vcLearned: ['Palabras aprendidas: {n}', 'Words learned: {n}', 'Ikasitako hitzak: {n}', 'Palabras aprendidas: {n}', 'Paraules apreses: {n}', 'Mots appris : {n}'],
        vcPractice: ['Palabras en práctica: {n}', 'Words in practice: {n}', 'Praktikan ditugun hitzak: {n}', 'Palabras en práctica: {n}', 'Paraules en pràctica: {n}', 'Mots en cours de pratique : {n}'],
        sVoc: ['Vocabulario', 'Vocabulary', 'Hiztegia', 'Vocabulario', 'Vocabulari', 'Vocabulaire'],
        wVoc: ['Vocabulario: {l}', 'Vocabulary: {l}', 'Hiztegia: {l}', 'Vocabulario: {l}', 'Vocabulari: {l}', 'Vocabulaire : {l}'],
        // units (calcPath, clock, fractions)
        unitRow: ['Unidad alcanzada: {a} de {b}', 'Unit reached: {a} of {b}', 'Lortutako unitatea: {b}-tik {a}', 'Unidade alcanzada: {a} de {b}', 'Unitat assolida: {a} de {b}', 'Unité atteinte : {a} sur {b}'],
        unitStars: ['Estrellas: {n} de {m}', 'Stars: {n} of {m}', 'Izarrak: {m}-tik {n}', 'Estrelas: {n} de {m}', 'Estrelles: {n} de {m}', 'Étoiles : {n} sur {m}'],
        sUnits: ['{game}: {n} {n?unidad|unidades} con tres estrellas', '{game}: {n} {n?unit|units} with three stars', '{game}: hiru izarreko {n} unitate', '{game}: {n} {n?unidade|unidades} con tres estrelas', '{game}: {n} {n?unitat|unitats} amb tres estrelles', '{game} : {n} {n?unité|unités} avec trois étoiles'],
        wUnits: ['{game}: {n} {n?unidad|unidades} para repasar con calma', '{game}: {n} {n?unit|units} to review calmly', '{game}: {n} unitate lasai errepasatzeko', '{game}: {n} {n?unidade|unidades} para repasar con calma', '{game}: {n} {n?unitat|unitats} per repassar amb calma', '{game} : {n} {n?unité|unités} à revoir tranquillement'],
        // generic
        playsRow: ['Partidas jugadas: {n}', 'Games played: {n}', 'Jokatutako partidak: {n}', 'Partidas xogadas: {n}', 'Partides jugades: {n}', 'Parties jouées : {n}'],
        timeRow: ['Tiempo jugado: {m} {m?minuto|minutos}', 'Time played: {m} {m?minute|minutes}', 'Jokatutako denbora: {m} minutu', 'Tempo xogado: {m} {m?minuto|minutos}', 'Temps jugat: {m} {m?minut|minuts}', 'Temps de jeu : {m} {m?minute|minutes}'],
        accRow: ['Aciertos: {w}', 'Right answers: {w}', 'Asmatzeak: {w}', 'Acertos: {w}', 'Encerts: {w}', 'Bonnes réponses : {w}'],
        accHigh: ['casi todo bien', 'almost all right', 'ia dena ondo', 'case todo ben', 'quasi tot bé', 'presque tout juste'],
        accMid: ['la mayoría bien', 'most of them right', 'gehienak ondo', 'a maioría ben', 'la majoria bé', 'la plupart justes'],
        accLow: ['aún le cuesta, es normal al aprender', 'still hard, which is normal when learning', 'oraindik zaila egiten zaio, ikasten ari denean normala da',
            'aínda lle custa, é normal ao aprender', 'encara li costa, és normal quan s\'aprèn', 'c\'est encore difficile, c\'est normal quand on apprend'],
        sAcc: ['{game}: muchos aciertos', '{game}: many right answers', '{game}: asmatze asko', '{game}: moitos acertos', '{game}: molts encerts', '{game} : beaucoup de bonnes réponses'],
        wAcc: ['{game}: repasar con calma', '{game}: review calmly', '{game}: lasai errepasatu', '{game}: repasar con calma', '{game}: repassar amb calma', '{game} : revoir tranquillement'],
        lvRow: ['Nivel alcanzado: {n}', 'Level reached: {n}', 'Lortutako maila: {n}', 'Nivel alcanzado: {n}', 'Nivell assolit: {n}', 'Niveau atteint : {n}'],
        wpmRow: ['Mejor velocidad: {n} palabras por minuto', 'Best speed: {n} words per minute', 'Abiadurarik onena: {n} hitz minutuko', 'Mellor velocidade: {n} palabras por minuto',
            'Millor velocitat: {n} paraules per minut', 'Meilleure vitesse : {n} mots par minute'],
        repRow: ['Repasos completados: {n}', 'Reviews completed: {n}', 'Amaitutako errepasoak: {n}', 'Repasos completados: {n}', 'Repassos completats: {n}', 'Révisions terminées : {n}']
    };
    const GAME_NAMES = {
        reading: ['Lectura', 'Reading', 'Irakurmena', 'Lectura', 'Lectura', 'Lecture'],
        mapas: ['Mapas', 'Maps', 'Mapak', 'Mapas', 'Mapes', 'Cartes'],
        calcpath: ['Cálculo', 'Calculation', 'Kalkulua', 'Cálculo', 'Càlcul', 'Calcul'],
        vocabmaster: ['Vocabulario', 'Vocabulary', 'Hiztegia', 'Vocabulario', 'Vocabulari', 'Vocabulaire'],
        clock: ['Relojes', 'Clocks', 'Erlojuak', 'Reloxos', 'Rellotges', 'Horloges'],
        fractions: ['Fracciones', 'Fractions', 'Zatikiak', 'Fraccións', 'Fraccions', 'Fractions'],
        tablemaster: ['Tablas de multiplicar', 'Times tables', 'Biderketa taulak', 'Táboas de multiplicar', 'Taules de multiplicar', 'Tables de multiplication'],
        mathmaster: ['MathMaster', 'MathMaster', 'MathMaster', 'MathMaster', 'MathMaster', 'MathMaster'],
        typingMaster: ['Mecanografía', 'Typing', 'Mekanografia', 'Mecanografía', 'Mecanografia', 'Dactylographie'],
        memory: ['Memoria', 'Memory', 'Memoria', 'Memoria', 'Memòria', 'Mémoire'],
        repaso: ['Repaso', 'Review', 'Errepasoa', 'Repaso', 'Repàs', 'Révision'],
        englishVerbs: ['Verbos en inglés', 'English verbs', 'Ingeleseko aditzak', 'Verbos en inglés', 'Verbs en anglès', 'Verbes anglais'],
        euskera: ['Euskera', 'Basque', 'Euskara', 'Éuscaro', 'Basc', 'Basque'],
        geoQuiz: ['Geografía', 'Geography', 'Geografia', 'Xeografía', 'Geografia', 'Géographie'],
        wordSearch: ['Sopa de letras', 'Word search', 'Hitz-sopa', 'Sopa de letras', 'Sopa de lletres', 'Mots mêlés'],
        crossword: ['Crucigramas', 'Crosswords', 'Hitz gurutzatuak', 'Crucigramas', 'Mots encreuats', 'Mots croisés'],
        snake: ['Snake', 'Snake', 'Snake', 'Snake', 'Snake', 'Snake'],
        tablaPeriodica: ['Tabla periódica', 'Periodic table', 'Taula periodikoa', 'Táboa periódica', 'Taula periòdica', 'Tableau périodique']
    };
    const MAP_NAMES = {
        world: ['Mundo', 'World', 'Mundua', 'Mundo', 'Món', 'Monde'],
        es: ['España (comunidades)', 'Spain (regions)', 'Espainia (erkidegoak)', 'España (comunidades)', 'Espanya (comunitats)', 'Espagne (régions)'],
        prov: ['Provincias', 'Provinces', 'Probintziak', 'Provincias', 'Províncies', 'Provinces'],
        rivw: ['Ríos del mundo', 'World rivers', 'Munduko ibaiak', 'Ríos do mundo', 'Rius del món', 'Fleuves du monde'],
        rives: ['Ríos de España', 'Spanish rivers', 'Espainiako ibaiak', 'Ríos de España', 'Rius d\'Espanya', 'Fleuves d\'Espagne'],
        eus: ['Euskal Herria', 'Basque Country', 'Euskal Herria', 'Euskal Herria', 'Euskal Herria', 'Pays basque'],
        eustown: ['Localidades vascas', 'Basque towns', 'Euskal herriak', 'Localidades vascas', 'Localitats basques', 'Villes basques'],
        eusriv: ['Ríos vascos', 'Basque rivers', 'Euskal ibaiak', 'Ríos vascos', 'Rius bascos', 'Rivières basques'],
        eusmont: ['Montes vascos', 'Basque mountains', 'Euskal mendiak', 'Montes vascos', 'Muntanyes basques', 'Montagnes basques'],
        mont: ['Montañas del mundo', 'World mountains', 'Munduko mendiak', 'Montañas do mundo', 'Muntanyes del món', 'Montagnes du monde'],
        montes: ['Montes de España', 'Spanish mountains', 'Espainiako mendiak', 'Montes de España', 'Muntanyes d\'Espanya', 'Montagnes d\'Espagne']
    };

    const pick = (table, lang) => { const i = LANGS.indexOf(lang); return table[i < 0 ? 0 : i]; };
    /** Pure: the texts of a language ('es' when unknown). */
    function dict(lang) {
        const o = {};
        Object.keys(ROWS).forEach(k => { o[k] = pick(ROWS[k], lang); });
        return o;
    }
    const gameName = (gid, lang) => (GAME_NAMES[gid] ? pick(GAME_NAMES[gid], lang) : gid);
    const mapName = (store, lang) => (MAP_NAMES[store] ? pick(MAP_NAMES[store], lang) : store);
    /** Pure: replaces {key} with values; {key?one|many} picks the singular or plural word. */
    function fmt(s, vars) {
        // {n?singular|plural}: picks by the value of n (1 = singular)
        let out = String(s).replace(/\{([a-z]+)\?([^|{}]*)\|([^{}]*)\}/g, (m, k, one, many) => (vars && Number(vars[k]) === 1 ? one : many));
        Object.keys(vars || {}).forEach(k => { out = out.split('{' + k + '}').join(String(vars[k] == null ? '' : vars[k])); });
        return out;
    }

    // Games the panel knows: icon, folder and what to suggest. Ids are those stored in Firestore.
    const GAMES = {
        reading: { icon: '📖', dir: 'readingCoach-EFC' }, mapas: { icon: '🗺️', dir: 'mapas-EFC' }, calcpath: { icon: '🔢', dir: 'calcPath-EFC' },
        vocabmaster: { icon: '🔤', dir: 'vocabMaster-EFC' }, clock: { icon: '🕒', dir: 'clock-EFC' }, fractions: { icon: '🍕', dir: 'fractions-EFC' },
        tablemaster: { icon: '✖️', dir: 'tableMaster-EFC' }, mathmaster: { icon: '🧮', dir: 'mathMaster-EFC' }, typingMaster: { icon: '⌨️', dir: 'typingMaster-EFC' },
        memory: { icon: '🃏', dir: 'memory-EFC' }, repaso: { icon: '🔁', dir: 'repaso-EFC' }, englishVerbs: { icon: '🇬🇧', dir: 'englishVerbs-EFC' },
        euskera: { icon: '🌿', dir: 'euskera-EFC' }, geoQuiz: { icon: '🌍', dir: 'geoQuiz-EFC' }, wordSearch: { icon: '🔍', dir: 'wordSearch-EFC' },
        crossword: { icon: '✏️', dir: 'crossword-EFC' }, snake: { icon: '🐍', dir: 'snake-EHS' }, tablaPeriodica: { icon: '⚗️', dir: 'tablaPeriodica-EFC' }
    };
    const ORDER = Object.keys(GAMES);
    const SUGGEST = ['reading', 'mapas', 'calcpath', 'vocabmaster', 'tablemaster', 'clock', 'fractions', 'mathmaster', 'typingMaster'];
    // Games where "right answers" says something about learning (not score or luck based).
    const ACC_GAMES = ['mathmaster', 'tablemaster', 'calcpath', 'vocabmaster', 'englishVerbs', 'euskera', 'geoQuiz', 'tablaPeriodica', 'repaso', 'clock', 'fractions'];
    const UNIT_TOTALS = { calcpath: 14, clock: 10, fractions: 11 };
    const MAP_STORES = ['world', 'es', 'prov', 'rivw', 'rives', 'eus', 'eustown', 'eusriv', 'eusmont', 'mont', 'montes'];
    const MAP_TOTALS = { world: 193, es: 18, prov: 50, rivw: 49, rives: 30, mont: 36, montes: 30 };
    // Same table as readingCoach-EFC/game.js BANDS (checked by tests/unit/progress.test.mjs): words per minute zone by band.
    const READ_ZONES = { b56: [30, 60], b78: [60, 95], b910: [95, 125], b1112: [125, 150], b13: [150, 180], adult: [160, 200] };
    const ID_RE = /^[a-z0-9]{6,20}$/;
    const OWNER_RE = /^[A-Za-z0-9]{6,128}$/;
    const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

    // ── Dates and activity ───────────────────────────────────────────────────

    /** Pure: local calendar day 'YYYY-MM-DD' (same as PlatformFirestore.dayKey). */
    function dayKey(ms) {
        const d = new Date(ms == null ? Date.now() : ms);
        const p = n => (n < 10 ? '0' : '') + n;
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }
    /** Pure: the last n day keys, today first. */
    function lastDays(n, now) {
        const base = new Date(now == null ? Date.now() : now);
        const out = [];
        for (let i = 0; i < n; i++) out.push(dayKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() - i, 12).getTime()));
        return out;
    }
    const num = v => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
    const validDaily = d => (d && typeof d === 'object' && !Array.isArray(d) ? d : {});

    /**
     * Pure: activity of a child.
     * statsByGame: { gameId: statsDoc } (reads stats.daily); hintDays: extra days known from this device (days only).
     * Returns { d7, d30, series } with d7/d30 = { days, games, items, minutes, kinds } and series = last 14 days oldest first.
     */
    function activity(statsByGame, hintDays, now) {
        const keys30 = lastDays(30, now), keys7 = new Set(keys30.slice(0, 7)), keys14 = lastDays(14, now);
        const per = {};                 // day -> { games, items, minutes }
        const kinds7 = new Set(), kinds30 = new Set();
        Object.keys(statsByGame || {}).forEach(gid => {
            const daily = validDaily(statsByGame[gid] && statsByGame[gid].daily);
            keys30.forEach(k => {
                const e = daily[k];
                if (!e || typeof e !== 'object') return;
                const games = num(e.games), items = num(e.items), minutes = num(e.minutes);
                if (!games && !items && !minutes) return;
                const a = per[k] || (per[k] = { games: 0, items: 0, minutes: 0 });
                a.games += games; a.items += items; a.minutes += minutes;
                kinds30.add(gid); if (keys7.has(k)) kinds7.add(gid);
            });
        });
        const hint = new Set((hintDays || []).filter(d => DAY_RE.test(d)));
        const sum = (keys, kinds) => {
            const o = { days: 0, games: 0, items: 0, minutes: 0, kinds: kinds.size };
            keys.forEach(k => { if (per[k] || hint.has(k)) o.days++; if (per[k]) { o.games += per[k].games; o.items += per[k].items; o.minutes += per[k].minutes; } });
            o.minutes = Math.round(o.minutes);
            return o;
        };
        const series = keys14.slice().reverse().map(k => ({ day: k, games: per[k] ? per[k].games : 0, active: !!(per[k] || hint.has(k)) }));
        return { d7: sum(keys30.slice(0, 7), kinds7), d30: sum(keys30, kinds30), series };
    }

    /** Pure: last played day ('' when unknown) of a game from its daily map. */
    function lastDayOf(stats) {
        const days = Object.keys(validDaily(stats && stats.daily)).filter(d => DAY_RE.test(d)).sort();
        return days.length ? days[days.length - 1] : '';
    }

    // ── Wording ──────────────────────────────────────────────────────────────

    /** Pure: 'below' | 'in' | 'above' for words per minute against the zone of a reading band. */
    function zoneStatus(ppm, band) {
        const z = READ_ZONES[band] || READ_ZONES.b78;
        return ppm < z[0] ? 'below' : ppm > z[1] ? 'above' : 'in';
    }
    /** Pure: right answers as a word: 'high' | 'mid' | 'low' ('' when there is too little to say). Never a number. */
    function accuracyWord(correct, attempts, minAttempts) {
        const a = num(attempts), c = Math.min(num(correct), a);
        if (a < (minAttempts == null ? 10 : minAttempts)) return '';
        const r = c / a;
        return r >= 0.85 ? 'high' : r >= 0.6 ? 'mid' : 'low';
    }
    const accText = (w, t) => (w === 'high' ? t.accHigh : w === 'mid' ? t.accMid : w === 'low' ? t.accLow : '');

    // ── Local (device) progress ──────────────────────────────────────────────

    const parse = (store, key) => { try { const v = JSON.parse(store.getItem(key)); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };
    /**
     * Pure: progress the games keep in localStorage for ONE child id.
     * Keys are <name>_<authUid>_<pid>; authUid is the account signed in on the device that played
     * (the adult's own uid or the family owner's uid). Keys without a child id are never read.
     */
    function readLocal(store, uids, pid) {
        const out = { found: false, reading: null, mapas: {}, calcpath: null, vocab: null, clock: null, fractions: null, memory: null, repaso: null, totals: null };
        if (!store || !ID_RE.test(pid || '')) return out;
        const owners = (uids || []).filter((u, i, a) => typeof u === 'string' && OWNER_RE.test(u) && a.indexOf(u) === i);
        const one = name => { for (const u of owners) { const v = parse(store, name + '_' + u + '_' + pid); if (v) return v; } return null; };
        out.reading = one('reading');
        MAP_STORES.forEach(s => { const v = one('mapas_' + s); if (v) out.mapas[s] = v; });
        out.calcpath = one('calc_prog'); out.vocab = one('vocab_prog'); out.clock = one('clock_prog');
        out.fractions = one('fractions_prog'); out.memory = one('memory_prog'); out.repaso = one('repaso_meta');
        out.totals = parse(store, 'mapas_totals');   // sizes of the maps, the same for everybody on the device
        out.found = !!(out.reading || Object.keys(out.mapas).length || out.calcpath || out.vocab || out.clock || out.fractions || out.memory || out.repaso);
        return out;
    }
    /** Pure: days a child played according to this device (hints; they only count days, not games). */
    function localDays(local) {
        const set = new Set();
        const add = d => { if (typeof d === 'string' && DAY_RE.test(d)) set.add(d); };
        if (local.reading && Array.isArray(local.reading.hist)) local.reading.hist.forEach(h => h && add(h.d));
        ['calcpath', 'clock', 'fractions', 'memory'].forEach(g => local[g] && add(local[g].last));
        if (local.repaso) add(local.repaso.last);
        Object.keys(local.mapas || {}).forEach(s => Object.keys(local.mapas[s]).forEach(id => { const e = local.mapas[s][id]; if (e && num(e.t)) add(dayKey(e.t)); }));
        return Array.from(set);
    }

    // ── Per game analysis ────────────────────────────────────────────────────
    // Each returns { lines: [text], strong: [text], weak: [text], last: 'YYYY-MM-DD' | '' }.

    const empty = () => ({ lines: [], strong: [], weak: [], last: '' });

    function analyseReading(prog, t) {
        const r = empty();
        if (!prog) return r;
        const hist = (Array.isArray(prog.hist) ? prog.hist : []).filter(h => h && num(h.ppm) > 0);
        if (hist.length) {
            const best = Math.max.apply(null, hist.map(h => h.ppm));
            const recent = hist.slice(-5).map(h => Math.round(h.ppm));
            r.lines.push(fmt(t.rdBest, { n: Math.round(best) }), fmt(t.rdRecent, { l: recent.join(', ') }));
            const lastN = hist.slice(-3), avg = lastN.reduce((s, h) => s + h.ppm, 0) / lastN.length;
            const z = zoneStatus(avg, hist[hist.length - 1].b || prog.sel || prog.band);
            r.lines.push(z === 'in' ? t.rdIn : z === 'below' ? t.rdBelow : t.rdAbove);
            if (z === 'in') r.strong.push(t.sRdZone); else if (z === 'below') r.weak.push(t.wRdPace);
            r.last = hist.map(h => h.d).filter(d => DAY_RE.test(d)).sort().pop() || '';
        }
        const q = (Array.isArray(prog.qlog) ? prog.qlog : []).filter(x => x && num(x.n) > 0).slice(-10);
        if (q.length) {
            const n = q.reduce((s, x) => s + num(x.n), 0), c = q.reduce((s, x) => s + Math.min(num(x.c), num(x.n)), 0), ratio = c / n;
            const w = ratio >= 0.85 ? t.compHigh : ratio >= 0.6 ? t.compMid : t.compLow;
            r.lines.push(fmt(t.rdComp, { w }));
            if (ratio >= 0.85) r.strong.push(t.sRdComp); else if (ratio < 0.6) r.weak.push(t.wRdComp);
        }
        // Book chapters carry `stars` (see readingCoach-EFC/game.js): finished when the questions were passed.
        const texts = prog.texts && typeof prog.texts === 'object' ? prog.texts : {};
        const books = new Set(); let chapters = 0, stars = 0;
        Object.keys(texts).forEach(id => {
            const e = texts[id];
            if (!e || typeof e !== 'object' || e.stars == null) return;
            books.add(id.replace(/-\d+$/, ''));
            if (e.quiz) { chapters++; stars += Math.max(1, Math.min(3, Number(e.stars) || 1)); }
        });
        if (books.size && chapters) r.lines.push(fmt(t.rdBooks, { c: chapters, b: books.size, s: stars }));
        return r;
    }

    function analyseMaps(maps, totals, lang, t) {
        const r = empty();
        let best = null, regionNames = null;
        try { regionNames = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) { regionNames = null; }
        const country = id => { try { return (regionNames && regionNames.of(id)) || id; } catch (e) { return id; } };
        const weakN = [];
        MAP_STORES.forEach(store => {
            const prog = maps && maps[store];
            if (!prog) return;
            const ids = Object.keys(prog).filter(id => prog[id] && typeof prog[id] === 'object');
            if (!ids.length) return;
            const mastered = ids.filter(id => num(prog[id].s) >= 2).length;
            const total = num(totals && totals[store]) || MAP_TOTALS[store] || 0;
            const name = mapName(store, lang);
            r.lines.push(total >= mastered && total > 0 ? fmt(t.mapRow, { name, a: mastered, b: total }) : fmt(t.mapRow0, { name, a: mastered }));
            const ratio = total ? mastered / total : 0;
            if (mastered >= 5 && (!best || ratio > best.ratio)) best = { name, ratio };
            const weak = ids.filter(id => num(prog[id].f) > 0 && num(prog[id].s) < 2).sort((a, b) => num(prog[b].f) - num(prog[a].f));
            if (store === 'world') {
                const names = weak.filter(id => /^[A-Z]{2}$/.test(id)).slice(0, 3).map(country);
                if (names.length) r.weak.push(fmt(t.wMapC, { l: names.join(', ') }));
            } else if (weak.length) weakN.push({ name, n: weak.length });
            ids.forEach(id => { const d = num(prog[id].t) ? dayKey(prog[id].t) : ''; if (d > r.last) r.last = d; });
        });
        weakN.sort((a, b) => b.n - a.n).slice(0, 2).forEach(w => r.weak.push(fmt(t.wMapN, w)));
        if (best) r.strong.push(fmt(t.sMap, { name: best.name }));
        return r;
    }

    function analyseVocab(prog, t) {
        const r = empty();
        if (!prog) return r;
        let learned = 0, practice = 0; const weak = [];
        Object.keys(prog).forEach(pack => {
            const words = prog[pack];
            if (!words || typeof words !== 'object') return;
            Object.keys(words).forEach(w => {
                const e = words[w], b = e && Number(e.b);
                if (!Number.isFinite(b)) return;
                if (b >= 3) learned++; else if (b >= 1) practice++; else if (weak.length < 4 && w.length <= 30) weak.push(w);
            });
        });
        if (!learned && !practice && !weak.length) return r;
        r.lines.push(fmt(t.vcLearned, { n: learned }));
        if (practice) r.lines.push(fmt(t.vcPractice, { n: practice }));
        if (learned >= 10) r.strong.push(t.sVoc);
        if (weak.length) r.weak.push(fmt(t.wVoc, { l: weak.join(', ') }));
        return r;
    }

    function analyseUnits(gid, prog, lang, t) {
        const r = empty();
        const units = prog && prog.units && typeof prog.units === 'object' ? prog.units : null;
        if (!units) return r;
        const ids = Object.keys(units).filter(id => units[id] && typeof units[id] === 'object');
        if (!ids.length) return r;
        const total = UNIT_TOTALS[gid] || ids.length;
        const stars = ids.reduce((s, id) => s + Math.max(1, Math.min(3, Number(units[id].stars) || 1)), 0);
        const three = ids.filter(id => Number(units[id].stars) >= 3).length, one = ids.filter(id => Number(units[id].stars) === 1).length;
        const game = gameName(gid, lang);
        r.lines.push(fmt(t.unitRow, { a: ids.length, b: Math.max(total, ids.length) }), fmt(t.unitStars, { n: stars, m: Math.max(total, ids.length) * 3 }));
        if (three >= 3) r.strong.push(fmt(t.sUnits, { game, n: three }));
        if (one >= 1) r.weak.push(fmt(t.wUnits, { game, n: one }));
        if (typeof prog.last === 'string' && DAY_RE.test(prog.last)) r.last = prog.last;
        return r;
    }

    /** Pure: lines that come from the account stats of a game (totals, level, speed). */
    function analyseStats(gid, st, lang, t) {
        const r = empty();
        if (!st || typeof st !== 'object') return r;
        const plays = num(st.totalGames);
        if (!plays) return r;
        r.lines.push(fmt(t.playsRow, { n: plays }));
        const mins = Math.round(num(st.totalTime) / 60);
        if (mins >= 1) r.lines.push(fmt(t.timeRow, { m: mins }));
        const w = ACC_GAMES.indexOf(gid) >= 0 ? accuracyWord(st.totalCorrect, st.totalAttempts, 20) : '';
        if (w) {
            r.lines.push(fmt(t.accRow, { w: accText(w, t) }));
            const game = gameName(gid, lang);
            if (w === 'high') r.strong.push(fmt(t.sAcc, { game })); else if (w === 'low') r.weak.push(fmt(t.wAcc, { game }));
        }
        if (gid === 'mathmaster' && st.byLevel && typeof st.byLevel === 'object') {
            const lv = Math.max.apply(null, Object.keys(st.byLevel).map(k => Number(String(k).replace('level_', ''))).filter(Number.isFinite).concat([0]));
            if (lv > 0) r.lines.push(fmt(t.lvRow, { n: lv }));
        }
        if (gid === 'typingMaster' && num(st.bestWpm)) r.lines.push(fmt(t.wpmRow, { n: Math.round(st.bestWpm) }));
        r.last = lastDayOf(st);
        return r;
    }

    /**
     * Pure: everything the panel shows for one child.
     * input: { name, lang, now, stats: {gameId: doc} | null, local: readLocal() result }
     */
    function build(input) {
        const lang = LANGS.indexOf(input.lang) >= 0 ? input.lang : 'es';
        const t = dict(lang), now = input.now == null ? Date.now() : input.now;
        const stats = input.stats || {}, local = input.local || readLocal(null, [], '');
        const act = activity(stats, localDays(local), now);
        const cards = [], strong = [], weak = [];
        const lastBy = {};

        const addCard = (gid, parts) => {
            const lines = [];
            parts.forEach(p => p.lines.forEach(l => lines.push(l)));
            if (!lines.length) return;
            const st = stats[gid];
            const last = parts.map(p => p.last).concat([lastDayOf(st)]).filter(Boolean).sort().pop() || '';
            lastBy[gid] = last;
            cards.push({ gid, icon: GAMES[gid] ? GAMES[gid].icon : '🎮', title: gameName(gid, lang), lines, last });
            parts.forEach(p => {
                p.strong.forEach(text => strong.push({ gid, text }));
                p.weak.forEach(text => weak.push({ gid, text }));
            });
        };
        const local1 = {
            reading: analyseReading(local.reading, t),
            mapas: analyseMaps(local.mapas, local.totals, lang, t),
            vocabmaster: analyseVocab(local.vocab, t),
            calcpath: analyseUnits('calcpath', local.calcpath, lang, t),
            clock: analyseUnits('clock', local.clock, lang, t),
            fractions: analyseUnits('fractions', local.fractions, lang, t)
        };
        if (local.repaso && num(local.repaso.done)) local1.repaso = Object.assign(empty(), { lines: [fmt(t.repRow, { n: Math.round(local.repaso.done) })], last: DAY_RE.test(local.repaso.last) ? local.repaso.last : '' });
        const ids = ORDER.filter(g => stats[g] || local1[g]);
        Object.keys(stats).forEach(g => { if (ids.indexOf(g) < 0 && GAMES[g]) ids.push(g); });
        ids.forEach(gid => {
            const s = analyseStats(gid, stats[gid], lang, t);
            const parts = [];
            if (local1[gid]) {
                // The device holds the detail; the account adds totals and accuracy words that the device does not know.
                parts.push(local1[gid]); parts.push(s);
            } else parts.push(s);
            addCard(gid, parts);
        });

        const sug = suggest(cards, weak, now, t, lang);
        const summary = summaryOf(input.name || '', act, strong, sug, t, lang);
        return { name: input.name || '', activity: act, cards, strong, weak, suggestion: sug, summary, hasLocal: !!local.found, hasStats: Object.keys(stats).length > 0 };
    }

    // ── Suggestion and weekly sentence ───────────────────────────────────────

    /** Pure: what to play next. Returns { type, gid, text, href } with type weak | rest | new | keep | start. */
    function suggest(cards, weak, now, t, lang) {
        const last = {}; cards.forEach(c => { last[c.gid] = c.last || ''; });
        const mk = (type, gid) => ({ type, gid, text: fmt(t['sug' + type[0].toUpperCase() + type.slice(1)], { game: gameName(gid, lang) }), href: GAMES[gid].dir + '/index.html' });
        const w = weak.find(x => SUGGEST.indexOf(x.gid) >= 0);
        if (w) return mk('weak', w.gid);
        const played = SUGGEST.filter(g => last[g] !== undefined);
        if (!played.length) return mk('start', 'reading');
        const limit = lastDays(4, now)[3];
        const stale = played.filter(g => last[g] && last[g] < limit).sort((a, b) => (last[a] < last[b] ? -1 : 1));
        if (stale.length) return mk('rest', stale[0]);
        const fresh = SUGGEST.find(g => last[g] === undefined);
        if (fresh) return mk('new', fresh);
        const recent = played.slice().sort((a, b) => ((last[b] || '') > (last[a] || '') ? 1 : -1))[0];
        return mk('keep', recent);
    }

    /** Pure: the friendly weekly sentence. */
    function summaryOf(name, act, strong, sug, t, lang) {
        const a = act.d7, who = name || '';
        let s;
        if (!a.days) s = fmt(t.sum0, { name: who });
        else {
            const mins = a.minutes >= 1 ? fmt(t.sumMins, { m: a.minutes }) : '';
            // Days known only from this device carry no game count: do not invent one
            s = a.games ? fmt(t.sum1, { name: who, days: a.days, games: a.games, mins }) : fmt(t.sumHint, { name: who, days: a.days });
            if (strong.length) s += ' ' + fmt(t.sumStrong, { x: strong[0].text });
        }
        s += ' ' + fmt(t.sumNext, { x: sug.text });
        return s.replace(/\s+/g, ' ').trim();
    }

    // ── Which children ───────────────────────────────────────────────────────

    /**
     * Pure: the children the adult may look at. own: players the adult owns (users/{uid}/players);
     * families: [{ m: { ownerUid, ownerName, role }, ks: players of that family }].
     * Nothing else (not the adult, not other adults) can enter the list.
     */
    function selectKids(uid, own, families) {
        const out = [], seen = new Set();
        const add = (owner, k, family, role) => {
            if (!k || !ID_RE.test(String(k.pid || '')) || seen.has(owner + ':' + k.pid)) return;
            seen.add(owner + ':' + k.pid);
            out.push({ key: owner + ':' + k.pid, owner, pid: k.pid, name: String(k.username || '').slice(0, 40), avatar: String(k.avatar || '🙂').slice(0, 8), family, role });
        };
        if (uid && OWNER_RE.test(uid)) (own || []).forEach(k => add(uid, k, '', 'owner'));
        (families || []).forEach(f => {
            const m = f && f.m;
            if (!m || !OWNER_RE.test(String(m.ownerUid || '')) || m.ownerUid === uid) return;
            (f.ks || []).forEach(k => add(m.ownerUid, k, String(m.ownerName || '').slice(0, 40), m.role));
        });
        return out;
    }

    // ── Browser part: loading and drawing ────────────────────────────────────

    const el = (tag, cls, text, attrs) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
        return n;
    };
    const curLang = () => {
        const l = String((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2);
        return LANGS.indexOf(l) >= 0 ? l : 'es';
    };

    function css() {
        if (document.getElementById('pg-style')) return;
        const st = document.createElement('style');
        st.id = 'pg-style';
        st.textContent = [
            '.pg-wrap{max-width:1180px;margin:0 auto;padding:calc(var(--header-height,56px) + 20px) 16px 48px;color:var(--text-primary,#f8fafc)}',
            '.pg-wrap *{box-sizing:border-box}',
            '.pg-wrap h1{margin:0 0 6px;font-family:var(--font-display,inherit);font-size:clamp(1.4rem,5vw,2rem)}',
            '.pg-sub{margin:0 0 14px;color:var(--text-secondary,#a8b8cc);line-height:1.5;overflow-wrap:anywhere}',
            '.pg-note{margin:0 0 16px;padding:10px 12px;border-radius:12px;border:1px dashed var(--border-color,#334155);color:var(--text-secondary,#a8b8cc);font-size:.88rem;line-height:1.5;overflow-wrap:anywhere}',
            '.pg-kids{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}',
            '@media (min-width:900px){.pg-kids{grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr))}}',
            '.pg-kid{background:var(--bg-surface,#1e293b);border:1px solid var(--border-color,#334155);border-radius:var(--radius-lg,20px);padding:16px;display:flex;flex-direction:column;gap:14px;min-width:0}',
            '.pg-head{display:flex;align-items:center;gap:12px;min-width:0}',
            '.pg-av{flex:none;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.9rem;background:var(--bg-raised,#334155)}',
            '.pg-head h2{margin:0;font-size:1.25rem;overflow-wrap:anywhere}',
            '.pg-fam{display:block;font-size:.8rem;color:var(--text-secondary,#a8b8cc);font-weight:400}',
            '.pg-kid h3{margin:0 0 6px;font-size:1rem}',
            '.pg-sum{margin:0;padding:12px;border-radius:14px;background:var(--bg-raised,#334155);line-height:1.55;overflow-wrap:anywhere}',
            '.pg-go{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 18px;margin-top:10px;border-radius:12px;background:var(--hub-brand-color,#6366f1);color:#fff;font-weight:600;text-decoration:none}',
            '.pg-go:focus-visible,.pg-link:focus-visible{outline:3px solid var(--hub-brand-light,#818cf8);outline-offset:2px}',
            '.pg-win{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
            '.pg-card{padding:10px;border-radius:12px;border:1px solid var(--border-color,#334155)}',
            '.pg-card h4{margin:0 0 6px;font-size:.88rem;color:var(--text-secondary,#a8b8cc)}',
            '.pg-stats{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px}',
            '.pg-stats div{min-width:0}',
            '.pg-stats dt{font-size:.75rem;color:var(--text-secondary,#a8b8cc)}',
            '.pg-stats dd{margin:0;font-size:1.3rem;font-weight:700}',
            '.pg-chart{width:100%;max-width:420px;height:auto;color:var(--hub-brand-light,#818cf8)}',
            '.pg-cap{margin:4px 0 0;font-size:.78rem;color:var(--text-secondary,#a8b8cc)}',
            '.pg-two{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}',
            '@media (min-width:560px){.pg-two{grid-template-columns:repeat(2,minmax(0,1fr))}}',
            '.pg-list{margin:0;padding-left:20px;line-height:1.5;overflow-wrap:anywhere}',
            '.pg-list.ok li::marker{content:"\\2B50  "}.pg-list.help li::marker{content:"\\1F331  "}',
            '.pg-games{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}',
            '@media (min-width:560px){.pg-games{grid-template-columns:repeat(2,minmax(0,1fr))}}',
            '.pg-game h4{margin:0 0 6px;font-size:1rem}',
            '.pg-game ul{margin:0;padding-left:18px;line-height:1.5;font-size:.9rem;overflow-wrap:anywhere}',
            '.pg-msg{padding:16px;border-radius:14px;background:var(--bg-surface,#1e293b);border:1px solid var(--border-color,#334155);overflow-wrap:anywhere}',
            '.pg-link{display:inline-flex;align-items:center;min-height:48px;color:var(--hub-brand-light,#818cf8)}'
        ].join('');
        document.head.appendChild(st);
    }

    function chartSvg(series, t) {
        const NS = 'http://www.w3.org/2000/svg', w = 14, gap = 4, h = 44, max = Math.max(1, ...series.map(s => s.games));
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + (series.length * (w + gap) - gap) + ' ' + h);
        svg.setAttribute('class', 'pg-chart');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', fmt(t.chartAlt, { n: series.filter(s => s.active).length }));
        series.forEach((s, i) => {
            const bh = s.active ? Math.max(6, Math.round((s.games / max) * (h - 4))) : 3;
            const r = document.createElementNS(NS, 'rect');
            r.setAttribute('x', i * (w + gap)); r.setAttribute('y', h - bh); r.setAttribute('width', w); r.setAttribute('height', bh); r.setAttribute('rx', 3);
            r.setAttribute('fill', 'currentColor'); r.setAttribute('opacity', s.active ? '1' : '.25');
            svg.appendChild(r);
        });
        return svg;
    }

    function statBlock(title, a, t) {
        const box = el('div', 'pg-card');
        box.appendChild(el('h4', null, title));
        const dl = el('dl', 'pg-stats');
        [[t.daysPlayed, a.days], [t.gamesPlayed, a.games], [t.minutes, a.minutes], [t.kinds, a.kinds]].forEach(([k, v]) => {
            const d = el('div'); d.appendChild(el('dt', null, k)); d.appendChild(el('dd', null, String(v))); dl.appendChild(d);
        });
        box.appendChild(dl);
        return box;
    }
    function listBlock(title, cls, items, t) {
        const box = el('div');
        box.appendChild(el('h3', null, title));
        if (!items.length) { box.appendChild(el('p', 'pg-sub', t.none)); return box; }
        const ul = el('ul', 'pg-list ' + cls);
        items.slice(0, 8).forEach(i => ul.appendChild(el('li', null, i.text)));
        box.appendChild(ul);
        return box;
    }

    /** Draws one child. `m` is the result of build(). */
    function renderKid(kid, m, lang, t, rootPath) {
        const sec = el('section', 'pg-kid', null, { 'aria-labelledby': 'pg-h-' + kid.pid });
        const head = el('div', 'pg-head');
        head.appendChild(el('span', 'pg-av', kid.avatar, { 'aria-hidden': 'true' }));
        const h2 = el('h2', null, kid.name, { id: 'pg-h-' + kid.pid });
        if (kid.family) h2.appendChild(el('span', 'pg-fam', fmt(t.familyOf, { name: kid.family })));
        head.appendChild(h2);
        sec.appendChild(head);

        const sum = el('div');
        sum.appendChild(el('h3', null, t.sumTitle));
        sum.appendChild(el('p', 'pg-sum', m.summary));
        sum.appendChild(el('a', 'pg-go', fmt(t.goPlay, { game: gameName(m.suggestion.gid, lang) }), { href: rootPath + m.suggestion.href }));
        sec.appendChild(sum);

        const win = el('div', 'pg-win');
        win.appendChild(statBlock(t.d7, m.activity.d7, t));
        win.appendChild(statBlock(t.d30, m.activity.d30, t));
        sec.appendChild(win);
        const ch = el('div');
        ch.appendChild(chartSvg(m.activity.series, t));
        ch.appendChild(el('p', 'pg-cap', t.chartCap));
        sec.appendChild(ch);

        const two = el('div', 'pg-two');
        two.appendChild(listBlock(t.strongTitle, 'ok', m.strong, t));
        two.appendChild(listBlock(t.weakTitle, 'help', m.weak, t));
        sec.appendChild(two);

        const games = el('div');
        games.appendChild(el('h3', null, t.gamesTitle));
        if (!m.cards.length) games.appendChild(el('p', 'pg-sub', t.none));
        const grid = el('div', 'pg-games');
        m.cards.forEach(c => {
            const card = el('article', 'pg-card pg-game');
            card.appendChild(el('h4', null, c.icon + ' ' + c.title));
            const ul = el('ul');
            c.lines.forEach(l => ul.appendChild(el('li', null, l)));
            card.appendChild(ul);
            grid.appendChild(card);
        });
        games.appendChild(grid);
        sec.appendChild(games);
        if (!m.hasLocal) sec.appendChild(el('p', 'pg-note', fmt(t.devNone, { name: kid.name })));
        if (kid.statsFailed) sec.appendChild(el('p', 'pg-note', fmt(t.statsFail, { name: kid.name }), { role: 'alert' }));
        return sec;
    }

    /** Reads the account stats of one child: { gameId: doc }. Throws when the rules refuse. */
    async function loadStats(owner, pid) {
        const snap = await GamesHubDB.collection('users').doc(owner).collection('players').doc(pid).collection('games').get();
        const out = {};
        snap.docs.forEach(d => { out[d.id] = d.data(); });
        return out;
    }

    /** Children visible to this adult, from Firestore (own players and the families they belong to). */
    async function loadKids(uid) {
        const P = PlatformFirestore, quiet = p => p.catch(() => []);
        const [own, mems] = await Promise.all([quiet(P.listPlayers(uid)), quiet(P.listMemberships(uid))]);
        const fams = await Promise.all(mems.map(async m => ({ m, ks: await quiet(P.listPlayers(uid, m.ownerUid)) })));
        return selectKids(uid, own, fams);
    }

    /** Draws the whole panel into `root` for the signed in adult `uid`. Returns when finished. */
    async function render(root, uid, opts) {
        const lang = curLang(), t = dict(lang), rootPath = (opts && opts.rootPath) || '';
        css();
        root.replaceChildren(el('p', 'pg-msg', t.loading, { role: 'status' }));
        let kids;
        try { kids = await loadKids(uid); } catch (e) { root.replaceChildren(el('p', 'pg-msg', t.error, { role: 'alert' })); return; }
        if (!kids.length) { root.replaceChildren(el('p', 'pg-msg', t.noKids)); return; }
        const now = Date.now();
        const built = await Promise.all(kids.map(async k => {
            let stats = null;
            try { stats = await loadStats(k.owner, k.pid); } catch (e) { k.statsFailed = true; }
            let local = readLocal(null, [], '');
            try { local = readLocal(window.localStorage, [uid, k.owner], k.pid); } catch (e) { /* storage blocked */ }
            return { k, m: build({ name: k.name, lang, now, stats, local }) };
        }));
        const wrap = el('div');
        wrap.appendChild(el('p', 'pg-note', t.devNote));
        const grid = el('div', 'pg-kids');
        built.forEach(b => grid.appendChild(renderKid(b.k, b.m, lang, t, rootPath)));
        wrap.appendChild(grid);
        root.replaceChildren(wrap);
    }

    /**
     * Page entry point (progreso.html): title, sign in state, language changes.
     * Needs PlatformAuth and PlatformFirestore on the page.
     */
    function mountPage(root, opts) {
        css();
        const rootPath = (opts && opts.rootPath) || '';
        let user = null, token = 0;
        const draw = () => {
            const t = dict(curLang()), mine = ++token;
            document.title = t.title + ' · Games Hub';
            const head = el('div');
            head.appendChild(el('h1', null, t.title, { id: 'pg-title', tabindex: '-1' }));
            head.appendChild(el('p', 'pg-sub', t.sub));
            const body = el('div', null, null, { id: 'pg-body' });
            const back = el('a', 'pg-link', '← ' + t.back, { href: rootPath + 'index.html' });
            root.replaceChildren(head, body, back);
            if (!user) {
                const box = el('div', 'pg-msg');
                box.appendChild(el('p', null, t.needLogin));
                box.appendChild(el('a', 'pg-go', t.signIn, { href: rootPath + 'entrar.html?next=progreso.html' }));
                body.appendChild(box);
                return;
            }
            render(body, user.uid, { rootPath }).catch(() => { if (mine === token) body.replaceChildren(el('p', 'pg-msg', t.error, { role: 'alert' })); });
        };
        PlatformAuth.onAuthStateChanged(u => {
            const same = (u && u.uid) === (user && user.uid);
            user = u || null;
            if (!same || !root.firstChild) draw();
        });
        document.addEventListener('platformLanguageChanged', draw);
        draw();
    }

    const api = { LANGS, ROWS, GAME_NAMES, MAP_NAMES, GAMES, ORDER, UNIT_TOTALS, READ_ZONES, MAP_STORES, dict, fmt, dayKey, lastDays, activity, lastDayOf, zoneStatus, accuracyWord,
        readLocal, localDays, analyseReading, analyseMaps, analyseVocab, analyseUnits, analyseStats, build, suggest, summaryOf, selectKids, loadKids, render, mountPage };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.PlatformProgress = api;
    return api;
})();
