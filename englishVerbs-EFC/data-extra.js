/**
 * englishVerbs-EFC/data-extra.js
 *  - 42 extra irregular verbs (merged into IRREGULAR_VERBS).
 *  - VERB_MEANINGS: translations of every verb into eu / gl / ca / fr (es lives in meaning_es).
 */
(function () {
    // [infinitive, past, participle, group, meaning_es]
    const extra = [
        ['bid', 'bid', 'bid', 'A-A-A', 'pujar (subasta)'], ['rid', 'rid', 'rid', 'A-A-A', 'librar'],
        ['shed', 'shed', 'shed', 'A-A-A', 'desprender'], ['forecast', 'forecast', 'forecast', 'A-A-A', 'pronosticar'],
        ['broadcast', 'broadcast', 'broadcast', 'A-A-A', 'retransmitir'], ['upset', 'upset', 'upset', 'A-A-A', 'disgustar'],
        ['overcome', 'overcame', 'overcome', 'A-B-A', 'superar'], ['outrun', 'outran', 'outrun', 'A-B-A', 'dejar atrás corriendo'],
        ['bend', 'bent', 'bent', 'A-B-B', 'doblar'], ['bleed', 'bled', 'bled', 'A-B-B', 'sangrar'],
        ['feed', 'fed', 'fed', 'A-B-B', 'alimentar'], ['flee', 'fled', 'fled', 'A-B-B', 'huir'],
        ['hang', 'hung', 'hung', 'A-B-B', 'colgar'], ['kneel', 'knelt', 'knelt', 'A-B-B', 'arrodillarse'],
        ['light', 'lit', 'lit', 'A-B-B', 'encender'], ['seek', 'sought', 'sought', 'A-B-B', 'buscar'],
        ['shine', 'shone', 'shone', 'A-B-B', 'brillar'], ['shoot', 'shot', 'shot', 'A-B-B', 'disparar'],
        ['slide', 'slid', 'slid', 'A-B-B', 'deslizar'], ['sweep', 'swept', 'swept', 'A-B-B', 'barrer'],
        ['swing', 'swung', 'swung', 'A-B-B', 'balancear'], ['dig', 'dug', 'dug', 'A-B-B', 'cavar'],
        ['stick', 'stuck', 'stuck', 'A-B-B', 'pegar'], ['sting', 'stung', 'stung', 'A-B-B', 'picar'],
        ['strike', 'struck', 'struck', 'A-B-B', 'golpear'], ['spin', 'spun', 'spun', 'A-B-B', 'girar'],
        ['spit', 'spat', 'spat', 'A-B-B', 'escupir'],
        ['bite', 'bit', 'bitten', 'A-B-C', 'morder'], ['blow', 'blew', 'blown', 'A-B-C', 'soplar'],
        ['freeze', 'froze', 'frozen', 'A-B-C', 'congelar'], ['hide', 'hid', 'hidden', 'A-B-C', 'esconder'],
        ['rise', 'rose', 'risen', 'A-B-C', 'subir'], ['shake', 'shook', 'shaken', 'A-B-C', 'sacudir'],
        ['sink', 'sank', 'sunk', 'A-B-C', 'hundir'], ['swear', 'swore', 'sworn', 'A-B-C', 'jurar'],
        ['tear', 'tore', 'torn', 'A-B-C', 'rasgar'], ['forgive', 'forgave', 'forgiven', 'A-B-C', 'perdonar'],
        ['lie', 'lay', 'lain', 'A-B-C', 'tumbarse'], ['shrink', 'shrank', 'shrunk', 'A-B-C', 'encoger'],
        ['undo', 'undid', 'undone', 'A-B-C', 'deshacer'], ['withdraw', 'withdrew', 'withdrawn', 'A-B-C', 'retirar'],
    ];
    const have = new Set(IRREGULAR_VERBS.map(v => v.infinitive));
    extra.forEach(([inf, ps, pp, group, es]) => {
        if (have.has(inf)) return;
        IRREGULAR_VERBS.push({
            infinitive: inf, past_simple: ps, past_participle: pp, meaning_es: es,
            audio_text: inf + ', ' + ps + ', ' + pp, group,
        });
    });
})();

// infinitive: [eu, gl, ca, fr]
const VERB_MEANINGS = {
    bet: ['apustu egin', 'apostar', 'apostar', 'parier'], burst: ['lehertu', 'estoupar', 'esclatar', 'éclater'],
    cast: ['bota', 'lanzar', 'llançar', 'lancer'], cost: ['kostatu', 'custar', 'costar', 'coûter'],
    cut: ['ebaki', 'cortar', 'tallar', 'couper'], hit: ['jo', 'golpear', 'copejar', 'frapper'],
    hurt: ['min eman', 'doer/ferir', 'fer mal/ferir', 'blesser/faire mal'], let: ['utzi', 'deixar', 'deixar', 'laisser'],
    put: ['jarri', 'pór', 'posar', 'mettre'], quit: ['utzi', 'deixar/render-se', 'deixar/rendir-se', 'arrêter/abandonner'],
    read: ['irakurri', 'ler', 'llegir', 'lire'], set: ['ezarri', 'establecer', 'establir', 'établir'],
    shut: ['itxi', 'pechar', 'tancar', 'fermer'], split: ['zatitu', 'dividir', 'dividir', 'diviser'],
    spread: ['zabaldu', 'estender', 'estendre', 'étendre'], become: ['bihurtu', 'chegar a ser', 'esdevenir', 'devenir'],
    come: ['etorri', 'vir', 'venir', 'venir'], run: ['korrika egin', 'correr', 'córrer', 'courir'],
    bring: ['ekarri', 'traer', 'portar', 'apporter'], build: ['eraiki', 'construír', 'construir', 'construire'],
    buy: ['erosi', 'comprar', 'comprar', 'acheter'], catch: ['harrapatu', 'atrapar', 'atrapar', 'attraper'],
    feel: ['sentitu', 'sentir', 'sentir', 'ressentir'], fight: ['borrokatu', 'loitar', 'lluitar', 'se battre'],
    find: ['aurkitu', 'atopar', 'trobar', 'trouver'], get: ['lortu', 'obter', 'obtenir', 'obtenir'],
    have: ['izan (edukitzea)', 'ter', 'tenir', 'avoir'], hear: ['entzun', 'oír', 'sentir (oir)', 'entendre'],
    hold: ['eutsi', 'suxeitar', 'sostenir', 'tenir'], keep: ['gorde', 'gardar', 'guardar', 'garder'],
    lay: ['jarri (arrautzak)', 'poñer (ovos)', 'pondre (ous)', 'pondre (des oeufs)'], lead: ['gidatu', 'liderar', 'liderar', 'diriger'],
    leave: ['utzi/joan', 'deixar/marchar', 'deixar/marxar', 'laisser/partir'], lend: ['maileguan eman', 'prestar', 'prestar', 'prêter'],
    lose: ['galdu', 'perder', 'perdre', 'perdre'], make: ['egin', 'facer', 'fer', 'faire'],
    mean: ['esan nahi izan', 'significar', 'significar', 'signifier'], meet: ['ezagutu/elkartu', 'coñecer', 'conèixer', 'rencontrer'],
    pay: ['ordaindu', 'pagar', 'pagar', 'payer'], say: ['esan', 'dicir', 'dir', 'dire'],
    sell: ['saldu', 'vender', 'vendre', 'vendre'], send: ['bidali', 'enviar', 'enviar', 'envoyer'],
    sit: ['eseri', 'sentar', 'seure', 's’asseoir'], sleep: ['lo egin', 'durmir', 'dormir', 'dormir'],
    spend: ['gastatu', 'gastar', 'gastar', 'dépenser'], stand: ['zutik egon', 'estar de pé', 'estar dret', 'se tenir debout'],
    teach: ['irakatsi', 'ensinar', 'ensenyar', 'enseigner'], tell: ['kontatu/esan', 'contar/dicir', 'explicar/dir', 'raconter/dire'],
    think: ['pentsatu', 'pensar', 'pensar', 'penser'], understand: ['ulertu', 'entender', 'entendre', 'comprendre'],
    win: ['irabazi', 'gañar', 'guanyar', 'gagner'], be: ['izan/egon', 'ser/estar', 'ser/estar', 'être'],
    begin: ['hasi', 'comezar', 'començar', 'commencer'], break: ['hautsi', 'romper', 'trencar', 'casser'],
    choose: ['aukeratu', 'elixir', 'triar', 'choisir'], do: ['egin', 'facer', 'fer', 'faire'],
    draw: ['marraztu', 'debuxar', 'dibuixar', 'dessiner'], drink: ['edan', 'beber', 'beure', 'boire'],
    drive: ['gidatu', 'conducir', 'conduir', 'conduire'], eat: ['jan', 'comer', 'menjar', 'manger'],
    fall: ['erori', 'caer', 'caure', 'tomber'], fly: ['hegan egin', 'voar', 'volar', 'voler'],
    forget: ['ahaztu', 'esquecer', 'oblidar', 'oublier'], give: ['eman', 'dar', 'donar', 'donner'],
    go: ['joan', 'ir', 'anar', 'aller'], grow: ['hazi', 'medrar', 'créixer', 'grandir'],
    know: ['jakin/ezagutu', 'saber/coñecer', 'saber/conèixer', 'savoir/connaître'], ride: ['ibili (zaldiz/bizikletaz)', 'montar', 'pujar/muntar', 'monter'],
    ring: ['jo (tinbrea)', 'soar', 'sonar', 'sonner'], see: ['ikusi', 'ver', 'veure', 'voir'],
    sing: ['abestu', 'cantar', 'cantar', 'chanter'], speak: ['hitz egin', 'falar', 'parlar', 'parler'],
    steal: ['lapurtu', 'roubar', 'robar', 'voler (dérober)'], swim: ['igeri egin', 'nadar', 'nedar', 'nager'],
    take: ['hartu', 'tomar/coller', 'prendre', 'prendre'], throw: ['bota', 'lanzar', 'llançar', 'lancer'],
    wake: ['esnatu', 'espertar', 'despertar', 'réveiller'], wear: ['jantzi', 'levar posto', 'portar (roba)', 'porter'],
    write: ['idatzi', 'escribir', 'escriure', 'écrire'],
    // extra verbs
    bid: ['eskaintza egin', 'poxar', 'licitar', 'enchérir'], rid: ['libratu', 'librar', 'desfer-se', 'débarrasser'],
    shed: ['bota (hostoak)', 'desprender', 'deixar caure', 'perdre (feuilles)'], forecast: ['iragarri', 'prever', 'pronosticar', 'prévoir'],
    broadcast: ['emititu', 'emitir', 'emetre', 'diffuser'], upset: ['disgustatu', 'molestar', 'disgustar', 'contrarier'],
    overcome: ['gainditu', 'superar', 'superar', 'surmonter'], outrun: ['korrika aurrea hartu', 'deixar atrás correndo', 'deixar enrere corrent', 'distancer'],
    bend: ['tolestu', 'dobrar', 'doblegar', 'plier'], bleed: ['odoletan egin', 'sangrar', 'sagnar', 'saigner'],
    feed: ['elikatu', 'alimentar', 'alimentar', 'nourrir'], flee: ['ihes egin', 'fuxir', 'fugir', 'fuir'],
    hang: ['esegi', 'colgar', 'penjar', 'accrocher'], kneel: ['belaunikatu', 'axeonllarse', 'agenollar-se', 's’agenouiller'],
    light: ['piztu', 'acender', 'encendre', 'allumer'], seek: ['bilatu', 'buscar', 'cercar', 'chercher'],
    shine: ['distiratu', 'brillar', 'brillar', 'briller'], shoot: ['tiro egin', 'disparar', 'disparar', 'tirer'],
    slide: ['irristatu', 'esvarar', 'lliscar', 'glisser'], sweep: ['miatu', 'varrer', 'escombrar', 'balayer'],
    swing: ['kulunkatu', 'balancear', 'gronxar', 'se balancer'], dig: ['zulatu', 'cavar', 'cavar', 'creuser'],
    stick: ['itsatsi', 'pegar', 'enganxar', 'coller'], sting: ['ziztatu', 'picar', 'picar', 'piquer'],
    strike: ['jo', 'golpear', 'colpejar', 'frapper'], spin: ['biratu', 'xirar', 'girar', 'tourner'],
    spit: ['listuarekin bota', 'cuspir', 'escopir', 'cracher'], bite: ['hozka egin', 'morder', 'mossegar', 'mordre'],
    blow: ['putz egin', 'soprar', 'bufar', 'souffler'], freeze: ['izoztu', 'conxelar', 'congelar', 'geler'],
    hide: ['ezkutatu', 'agochar', 'amagar', 'cacher'], rise: ['igo', 'subir', 'pujar', 'monter'],
    shake: ['astindu', 'axitar', 'sacsejar', 'secouer'], sink: ['hondoratu', 'afundir', 'enfonsar', 'couler'],
    swear: ['zin egin', 'xurar', 'jurar', 'jurer'], tear: ['urratu', 'rasgar', 'esquinçar', 'déchirer'],
    forgive: ['barkatu', 'perdoar', 'perdonar', 'pardonner'], lie: ['etzan', 'deitarse', 'estirar-se', 's’allonger'],
    shrink: ['txikitu', 'encoller', 'encongir', 'rétrécir'], undo: ['desegin', 'desfacer', 'desfer', 'défaire'],
    withdraw: ['erretiratu', 'retirar', 'retirar', 'retirer'],
};
