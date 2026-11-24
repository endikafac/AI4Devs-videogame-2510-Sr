/**
 * Games Hub - Interests of a child ("Que te gusta?").
 *
 *  - A FIXED list of 14 kid-friendly interests (generic, no trademarks). The ids are the only values stored
 *    (players/{pid}.interests, an array of up to 5 ids) and the only values Firestore rules accept.
 *  - Pure helpers (sanitize, validation, ranking of games) are testable in Node (tests/unit/interests.test.mjs).
 *  - A picker (big colourful tiles, 1 to 5, skippable) reused by the reading game and by the Familia screen.
 *  - A mapping table interest -> hub games, used by the "Segun tus gustos" row of the hub.
 *
 * Privacy: interests are not personal data in themselves, but they stay with the child profile: Firestore
 * (when signed in, owner or edit guardian) plus a local copy for guests and offline use. Never sent anywhere else.
 */
const PlatformInterests = (() => {
    'use strict';

    const MAX = 5;
    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

    // id, emoji, tile colour and the label in the six platform languages.
    const LIST = [
        { id: 'dinosaurs', emoji: '🦖', color: '#16a34a', l: { es: 'Dinosaurios', en: 'Dinosaurs', eu: 'Dinosauroak', gl: 'Dinosauros', ca: 'Dinosaures', fr: 'Dinosaures' } },
        { id: 'space', emoji: '🚀', color: '#6366f1', l: { es: 'El espacio', en: 'Space', eu: 'Espazioa', gl: 'O espazo', ca: "L'espai", fr: "L'espace" } },
        { id: 'sports', emoji: '⚽', color: '#f97316', l: { es: 'Fútbol y deportes', en: 'Football and sports', eu: 'Futbola eta kirolak', gl: 'Fútbol e deportes', ca: 'Futbol i esports', fr: 'Football et sports' } },
        { id: 'animals', emoji: '🐶', color: '#d97706', l: { es: 'Animales', en: 'Animals', eu: 'Animaliak', gl: 'Animais', ca: 'Animals', fr: 'Animaux' } },
        { id: 'videogames', emoji: '🎮', color: '#8b5cf6', l: { es: 'Videojuegos', en: 'Video games', eu: 'Bideojokoak', gl: 'Videoxogos', ca: 'Videojocs', fr: 'Jeux vidéo' } },
        { id: 'pirates', emoji: '🏴‍☠️', color: '#0f766e', l: { es: 'Piratas y tesoros', en: 'Pirates and treasure', eu: 'Piratak eta altxorrak', gl: 'Piratas e tesouros', ca: 'Pirates i tresors', fr: 'Pirates et trésors' } },
        { id: 'robots', emoji: '🤖', color: '#0ea5e9', l: { es: 'Robots y tecnología', en: 'Robots and technology', eu: 'Robotak eta teknologia', gl: 'Robots e tecnoloxía', ca: 'Robots i tecnologia', fr: 'Robots et technologie' } },
        { id: 'magic', emoji: '🐉', color: '#c026d3', l: { es: 'Magia y dragones', en: 'Magic and dragons', eu: 'Magia eta herensugeak', gl: 'Maxia e dragóns', ca: 'Màgia i dracs', fr: 'Magie et dragons' } },
        { id: 'music', emoji: '🎵', color: '#ec4899', l: { es: 'Música', en: 'Music', eu: 'Musika', gl: 'Música', ca: 'Música', fr: 'Musique' } },
        { id: 'cooking', emoji: '🍳', color: '#ef4444', l: { es: 'Cocina', en: 'Cooking', eu: 'Sukaldaritza', gl: 'Cociña', ca: 'Cuina', fr: 'Cuisine' } },
        { id: 'vehicles', emoji: '🚗', color: '#2563eb', l: { es: 'Vehículos y coches', en: 'Vehicles and cars', eu: 'Ibilgailuak eta autoak', gl: 'Vehículos e coches', ca: 'Vehicles i cotxes', fr: 'Véhicules et voitures' } },
        { id: 'nature', emoji: '🌊', color: '#0891b2', l: { es: 'Mar y naturaleza', en: 'Sea and nature', eu: 'Itsasoa eta natura', gl: 'Mar e natureza', ca: 'Mar i natura', fr: 'Mer et nature' } },
        { id: 'mystery', emoji: '🔍', color: '#475569', l: { es: 'Misterios y detectives', en: 'Mysteries and detectives', eu: 'Misterioak eta detektibeak', gl: 'Misterios e detectives', ca: 'Misteris i detectius', fr: 'Mystères et détectives' } },
        { id: 'superheroes', emoji: '🦸', color: '#dc2626', l: { es: 'Superhéroes', en: 'Superheroes', eu: 'Superheroiak', gl: 'Superheroes', ca: 'Superherois', fr: 'Super-héros' } }
    ];
    const IDS = LIST.map(i => i.id);
    const byId = id => LIST.find(i => i.id === id) || null;

    // Texts and books also carry 'general' when they match no interest in particular.
    const TOPIC_IDS = IDS.concat(['general']);

    /**
     * Interest -> hub games (ids of the hub catalogue), most fitting first. Only games that kids can play.
     * The hub row ("Segun tus gustos") ranks the games by how many of the chosen interests point to them.
     */
    const GAME_MAP = {
        dinosaurs: ['mapas', 'vocab', 'memory', 'wordsearch'],
        space: ['mapas', 'vocab', 'reading', 'memory'],
        sports: ['mathmaster', 'reading', 'tablemaster', 'snake'],
        animals: ['memory', 'vocab', 'wordsearch', 'reading'],
        videogames: ['snake', 'typemaster', 'memory', 'calcpath'],
        pirates: ['mapas', 'reading', 'wordsearch', 'calcpath'],
        robots: ['mathmaster', 'calcpath', 'typemaster', 'tablemaster'],
        magic: ['reading', 'memory', 'wordsearch', 'vocab'],
        music: ['memory', 'typemaster', 'reading', 'clock'],
        cooking: ['fractions', 'mathmaster', 'clock', 'vocab'],
        vehicles: ['calcpath', 'mapas', 'clock', 'snake'],
        nature: ['mapas', 'vocab', 'wordsearch', 'reading'],
        mystery: ['wordsearch', 'reading', 'memory', 'repaso'],
        superheroes: ['mathmaster', 'snake', 'reading', 'tablemaster']
    };

    // ---------------------------------------------------------------- pure helpers
    /** Pure: the valid, unique ids of a list, in order, at most MAX. Anything else is dropped. */
    function sanitize(list) {
        if (!Array.isArray(list)) return [];
        const out = [];
        list.forEach(v => { if (typeof v === 'string' && IDS.indexOf(v) >= 0 && out.indexOf(v) < 0 && out.length < MAX) out.push(v); });
        return out;
    }
    /** Pure: same rule as firestore.rules validInterests: array of strings, from the list, no repeats, at most MAX. */
    function isValid(list) {
        if (!Array.isArray(list) || list.length > MAX) return false;
        return list.every((v, i) => typeof v === 'string' && IDS.indexOf(v) >= 0 && list.indexOf(v) === i);
    }
    const emoji = id => (byId(id) || {}).emoji || '';
    function label(id, lang) { const i = byId(id); return i ? (i.l[lang] || i.l.es) : ''; }

    /**
     * Pure: games for the hub row. games = hub catalogue entries ({id, href, lab, ...}); allow = optional predicate
     * (audience filter). Returns [{ game, via: [interest ids] }], best first, at most max. Ties keep the order of
     * the chosen interests, then the order of the table.
     */
    function gamesFor(interests, games, max, allow) {
        const picked = sanitize(interests);
        const byGame = {};
        (games || []).forEach(g => { if (g && g.id && g.href && !g.lab && (!allow || allow(g))) byGame[g.id] = g; });
        const rows = {};
        picked.forEach((iid, pi) => {
            (GAME_MAP[iid] || []).forEach((gid, gi) => {
                if (!byGame[gid]) return;
                const r = rows[gid] || (rows[gid] = { game: byGame[gid], via: [], score: 0, first: pi * 10 + gi });
                r.via.push(iid); r.score += 4 - Math.min(gi, 3);
            });
        });
        return Object.keys(rows).map(k => rows[k]).sort((a, b) => b.via.length - a.via.length || b.score - a.score || a.first - b.first)
            .slice(0, max || 6).map(r => ({ game: r.game, via: r.via }));
    }

    // ---------------------------------------------------------------- storage (local copy)
    const localKey = (uid, pid) => 'games_hub_interests_' + (uid ? uid + (pid ? '_' + pid : '') : 'guest');
    function loadLocal(key, storage) {
        try { const s = storage || localStorage; return sanitize(JSON.parse(s.getItem(key))); } catch (e) { return []; }
    }
    function saveLocal(key, list, storage) {
        try { const s = storage || localStorage; const v = sanitize(list); v.length ? s.setItem(key, JSON.stringify(v)) : s.removeItem(key); } catch (e) { /* storage blocked */ }
    }

    // ---------------------------------------------------------------- texts of the interface (six languages)
    const TX = {
        es: { title: '¿Qué te gusta?', sub: 'Elige de 1 a 5 cosas. Te proponemos textos y juegos que te van a gustar.', count: '{n} de 5 elegidas', save: 'Guardar mis gustos', skip: 'Ahora no',
            max: 'Ya tienes 5. Quita una para elegir otra.', need: 'Elige al menos una o pulsa Ahora no.', row: 'Según tus gustos', change: 'Cambiar mis gustos', ask: 'Cuéntanos qué te gusta', mine: 'Mis gustos', none: 'Sin elegir', viewOnly: 'Solo ver', saved: 'Gustos guardados', famHelp: 'Lo que le gusta a cada peque. Sirve para proponerle textos y juegos.', why: 'Porque te gusta' },
        en: { title: 'What do you like?', sub: 'Pick 1 to 5 things. We will suggest texts and games you will enjoy.', count: '{n} of 5 picked', save: 'Save my likes', skip: 'Not now',
            max: 'You already have 5. Remove one to pick another.', need: 'Pick at least one or press Not now.', row: 'Based on what you like', change: 'Change my likes', ask: 'Tell us what you like', mine: 'My likes', none: 'Not picked', viewOnly: 'View only', saved: 'Likes saved', famHelp: 'What each child likes. It is used to suggest texts and games.', why: 'Because you like' },
        eu: { title: 'Zer gustatzen zaizu?', sub: 'Aukeratu 1etik 5era. Gustatuko zaizkizun testuak eta jokoak proposatuko dizkizugu.', count: '{n} / 5 aukeratuta', save: 'Gorde nire gustuak', skip: 'Orain ez',
            max: 'Dagoeneko 5 dituzu. Kendu bat beste bat aukeratzeko.', need: 'Aukeratu bat gutxienez edo sakatu Orain ez.', row: 'Zure gustuen arabera', change: 'Aldatu nire gustuak', ask: 'Esan zer gustatzen zaizun', mine: 'Nire gustuak', none: 'Aukeratu gabe', viewOnly: 'Ikusteko bakarrik', saved: 'Gustuak gordeta', famHelp: 'Haur bakoitzari zer gustatzen zaion. Testuak eta jokoak proposatzeko erabiltzen da.', why: 'Gustatzen zaizulako' },
        gl: { title: 'Que che gusta?', sub: 'Elixe de 1 a 5 cousas. Propoñémosche textos e xogos que che van gustar.', count: '{n} de 5 elixidas', save: 'Gardar os meus gustos', skip: 'Agora non',
            max: 'Xa tes 5. Quita unha para elixir outra.', need: 'Elixe polo menos unha ou preme Agora non.', row: 'Segundo os teus gustos', change: 'Cambiar os meus gustos', ask: 'Cóntanos que che gusta', mine: 'Os meus gustos', none: 'Sen elixir', viewOnly: 'Só ver', saved: 'Gustos gardados', famHelp: 'O que lle gusta a cada cativo. Serve para propoñerlle textos e xogos.', why: 'Porque che gusta' },
        ca: { title: 'Què t\'agrada?', sub: 'Tria d\'1 a 5 coses. Et proposem textos i jocs que t\'agradaran.', count: '{n} de 5 triades', save: 'Desar els meus gustos', skip: 'Ara no',
            max: 'Ja en tens 5. Treu-ne una per triar-ne una altra.', need: 'Tria\'n almenys una o prem Ara no.', row: 'Segons els teus gustos', change: 'Canviar els meus gustos', ask: 'Explica\'ns què t\'agrada', mine: 'Els meus gustos', none: 'Sense triar', viewOnly: 'Només veure', saved: 'Gustos desats', famHelp: 'Què li agrada a cada petit. Serveix per proposar-li textos i jocs.', why: 'Perquè t\'agrada' },
        fr: { title: 'Qu\'est-ce que tu aimes ?', sub: 'Choisis de 1 à 5 choses. Nous te proposons des textes et des jeux qui te plairont.', count: '{n} sur 5 choisies', save: 'Enregistrer mes goûts', skip: 'Pas maintenant',
            max: 'Tu en as déjà 5. Retires-en une pour en choisir une autre.', need: 'Choisis-en au moins une ou appuie sur Pas maintenant.', row: 'Selon tes goûts', change: 'Changer mes goûts', ask: 'Dis-nous ce que tu aimes', mine: 'Mes goûts', none: 'Pas choisi', viewOnly: 'Lecture seule', saved: 'Goûts enregistrés', famHelp: 'Ce qu\'aime chaque enfant. Cela sert à lui proposer des textes et des jeux.', why: 'Parce que tu aimes' }
    };
    function lang() {
        let l = 'es';
        try { l = String((typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) || localStorage.getItem('games_hub_language') || 'es').slice(0, 2); } catch (e) { /* default */ }
        return TX[l] ? l : 'es';
    }
    function t(key, l, o) {
        const s = (TX[l || lang()] || TX.es)[key] || TX.es[key] || key;
        return o ? s.replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m)) : s;
    }

    // ---------------------------------------------------------------- picker (browser only)
    function css() {
        if (typeof document === 'undefined' || document.getElementById('pi-css')) return;
        const s = document.createElement('style'); s.id = 'pi-css';
        s.textContent = [
            '.pi-picker{display:flex;flex-direction:column;gap:12px}',
            '.pi-title{margin:0;font-size:clamp(1.5rem,6vw,2.1rem);font-family:var(--font-display,inherit)}',
            '.pi-sub{margin:0;color:var(--text-secondary,#475569)}',
            '.pi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
            '@media (min-width:640px){.pi-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}',
            '.pi-tile{position:relative;min-height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 8px;border-radius:20px;cursor:pointer;',
            'font:inherit;font-weight:800;text-align:center;color:var(--text-primary,#1e293b);border:3px solid transparent;',
            'background:color-mix(in srgb,var(--c) 18%,var(--bg-surface,#fff));box-shadow:0 2px 0 color-mix(in srgb,var(--c) 45%,transparent);transition:transform .12s ease,border-color .12s ease}',
            '.pi-tile:active{transform:scale(.96)}',
            '.pi-tile[aria-pressed="true"]{border-color:var(--c);background:color-mix(in srgb,var(--c) 34%,var(--bg-surface,#fff))}',
            '.pi-tile:focus-visible,.pi-btn:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}',
            '.pi-emoji{font-size:2.3rem;line-height:1}',
            '.pi-name{font-size:.98rem;line-height:1.15;overflow-wrap:anywhere}',
            '.pi-check{position:absolute;top:6px;right:8px;font-size:1.1rem;display:none}',
            '.pi-tile[aria-pressed="true"] .pi-check{display:block}',
            '.pi-count{margin:0;font-weight:800}',
            '.pi-msg{margin:0;min-height:1.2em;color:#b45309;font-weight:700}',
            '.pi-actions{display:flex;gap:10px;flex-wrap:wrap}',
            '.pi-btn{min-height:52px;padding:10px 20px;border-radius:14px;border:2px solid #0ea5e9;background:#0ea5e9;color:#fff;font:inherit;font-weight:800;cursor:pointer}',
            '.pi-btn.ghost{background:transparent;color:var(--text-primary,#1e293b);border-color:rgba(148,163,184,.6)}',
            '.pi-btn:disabled{opacity:.5;cursor:not-allowed}',
            '@media (prefers-reduced-motion:reduce){.pi-tile{transition:none}}'
        ].join('');
        document.head.appendChild(s);
    }
    const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

    /**
     * Builds the picker. opts: selected (ids), lang, canSkip (default true), headingTag ('h1' by default),
     * onSave(list), onSkip(). Returns the root element (id prefix "pi-"). Text always goes in with textContent.
     */
    function buildPicker(opts) {
        css();
        const o = opts || {}, L = o.lang || lang();
        let sel = sanitize(o.selected);
        const root = mk('div', 'pi-picker'); root.id = 'pi-picker';
        root.appendChild(mk(o.headingTag || 'h1', 'pi-title', t('title', L))).id = 'pi-title';
        root.appendChild(mk('p', 'pi-sub', t('sub', L)));
        const grid = mk('div', 'pi-grid'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-labelledby', 'pi-title');
        const count = mk('p', 'pi-count'); count.id = 'pi-count'; count.setAttribute('aria-live', 'polite');
        const msg = mk('p', 'pi-msg'); msg.id = 'pi-msg'; msg.setAttribute('role', 'status');
        const save = mk('button', 'pi-btn', t('save', L)); save.type = 'button'; save.id = 'pi-save';
        const tiles = {};
        const paint = () => {
            IDS.forEach(id => { const on = sel.indexOf(id) >= 0; tiles[id].setAttribute('aria-pressed', String(on)); });
            count.textContent = t('count', L, { n: sel.length });
            save.disabled = sel.length === 0;
        };
        LIST.forEach(i => {
            const b = mk('button', 'pi-tile'); b.type = 'button'; b.dataset.id = i.id; b.style.setProperty('--c', i.color);
            b.setAttribute('aria-pressed', 'false');
            const e = mk('span', 'pi-emoji', i.emoji); e.setAttribute('aria-hidden', 'true');
            b.appendChild(e); b.appendChild(mk('span', 'pi-name', i.l[L] || i.l.es));
            const ck = mk('span', 'pi-check', '✔'); ck.setAttribute('aria-hidden', 'true'); b.appendChild(ck);
            b.onclick = () => {
                const at = sel.indexOf(i.id);
                if (at >= 0) { sel.splice(at, 1); msg.textContent = ''; }
                else if (sel.length >= MAX) { msg.textContent = t('max', L); return; }
                else { sel.push(i.id); msg.textContent = ''; }
                paint();
            };
            tiles[i.id] = b; grid.appendChild(b);
        });
        root.appendChild(grid); root.appendChild(count); root.appendChild(msg);
        const act = mk('div', 'pi-actions');
        save.onclick = () => { if (!sel.length) { msg.textContent = t('need', L); return; } if (o.onSave) o.onSave(sel.slice()); };
        act.appendChild(save);
        if (o.canSkip !== false) {
            const skip = mk('button', 'pi-btn ghost', t('skip', L)); skip.type = 'button'; skip.id = 'pi-skip';
            skip.onclick = () => { if (o.onSkip) o.onSkip(); };
            act.appendChild(skip);
        }
        root.appendChild(act);
        paint();
        root.getSelected = () => sel.slice();
        return root;
    }

    const api = { MAX, LANGS, LIST, IDS, TOPIC_IDS, GAME_MAP, byId, sanitize, isValid, emoji, label, gamesFor, localKey, loadLocal, saveLocal, TX, lang, t, buildPicker };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
if (typeof window !== 'undefined') window.PlatformInterests = PlatformInterests;
