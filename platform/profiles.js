/**
 * Games Hub - Profile picker ("Quien juega?") and adult / child audience helpers.
 *
 *  - Full screen picker with big avatar tiles: "Yo" (the signed in adult), the
 *    children the adult owns and the children of the families they belong to
 *    (guardian roles edit / view). Tapping a tile switches the active player
 *    through the existing mechanism (PlatformFirestore.setActiveFamily /
 *    setActivePlayer) and reloads the page, exactly like the Players screen.
 *  - A child with a PIN asks for it on a big keypad (PlatformFirestore.tryPin:
 *    salted hash check, 5 wrong tries then 30 s wait). The PIN is a convenience
 *    lock between profiles on a shared device, not account security.
 *  - Pure helpers for the hub: which profile kind is playing and which games
 *    are "Para ti" for an adult.
 *
 * Requires: i18n-platform.js, firestore.js (identity.js for the manage button).
 * Loaded by the hub page and lazily by platform-header.js everywhere else.
 */
const PlatformProfiles = {
    // Games shown first for an adult profile (ids of the hub catalogue, in this order).
    FOR_YOU: ['wordsearch', 'crossword', 'reading', 'memory', 'mathmaster', 'tablemaster', 'mapas'],
    COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'],

    // ── Pure helpers ─────────────────────────────────────────────────────────

    /** Pure: 'child' when a child player is active, 'adult' for a signed in adult, 'guest' otherwise. */
    modeOf(profile) {
        if (!profile) return 'guest';
        if (profile.kind === 'child') return 'child';
        return profile.uid || profile.username ? 'adult' : 'guest';
    },
    /** Pure: stable colour for a profile key (no stored field needed). */
    colorFor(key) {
        let h = 0;
        const s = String(key || '');
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return this.COLORS[h % this.COLORS.length];
    },
    /** Pure: the catalogue games for the "Para ti" row, in FOR_YOU order (games without href are skipped). */
    forYou(games) {
        const byId = {};
        (games || []).forEach(g => { if (g && g.id && g.href && !g.lab) byId[g.id] = g; });
        return this.FOR_YOU.map(id => byId[id]).filter(Boolean);
    },
    /** Pure: games a profile mode may see ('kids' for a child; adults see 'adults'). Guests see everything. */
    audienceFor(mode) { return mode === 'child' ? 'kids' : mode === 'adult' ? 'adults' : 'all'; },
    /**
     * Pure: the tiles of the picker.
     * me: adult base profile; kids: own children; families: [{ m: membership, ks: children }]
     */
    buildList(uid, me, kids, families) {
        const list = [{ key: 'me', kind: 'me', owner: '', pid: '', name: (me && me.username) || '', avatar: (me && me.avatar) || '🙂', pin: null, role: 'owner' }];
        (kids || []).forEach(k => list.push({ key: uid + ':' + k.pid, kind: 'kid', owner: '', pid: k.pid, name: String(k.username || ''),
            avatar: k.avatar || '🙂', pin: k.pin || null, role: 'owner', points: Number(k.totalPoints) || 0 }));
        (families || []).forEach(f => (f.ks || []).forEach(k => list.push({ key: f.m.ownerUid + ':' + k.pid, kind: 'kid', owner: f.m.ownerUid,
            pid: k.pid, name: String(k.username || ''), avatar: k.avatar || '🙂', pin: k.pin || null, role: f.m.role,
            family: String(f.m.ownerName || ''), points: Number(k.totalPoints) || 0 })));
        return list;
    },

    // ── Small utilities ──────────────────────────────────────────────────────

    _t(key, vars) {
        let s = PlatformI18n.t(key);
        Object.keys(vars || {}).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k])); });
        return s;
    },
    _mk(tag, cls, text, attrs) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        Object.keys(attrs || {}).forEach(k => n.setAttribute(k, attrs[k]));
        return n;
    },
    _ss(key, val) {
        try { if (val === undefined) return sessionStorage.getItem(key); val === null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, val); } catch (e) {}
        return null;
    },
    _pickedKey(uid) { return 'games_hub_picked_' + uid; },
    /** Forget that the picker was shown this session (call on sign out). */
    forget(uid) { if (uid) this._ss(this._pickedKey(uid), null); },
    _rootPath() {
        const s = document.querySelector('script[src$="platform/profiles.js"]');
        return s ? s.getAttribute('src').replace(/platform\/profiles\.js.*$/, '') : '';
    },
    _juice() {
        if (window.Juice) return window.Juice;
        if (!document.getElementById('pp-juice')) {
            const j = document.createElement('script');
            j.id = 'pp-juice'; j.src = this._rootPath() + 'platform/juice.js'; j.async = true;
            document.head.appendChild(j);
        }
        return null;
    },
    _css() {
        if (document.getElementById('pp-style')) return;
        const st = document.createElement('style');
        st.id = 'pp-style';
        st.textContent = [
            '#pp-overlay{position:fixed;inset:0;z-index:10050;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:24px 16px 32px;',
            'display:flex;flex-direction:column;align-items:center;gap:18px;color:#f1f5f9;',
            'background:radial-gradient(circle at 50% 30%,#1e293b,#0b1220);font-family:var(--font-body,system-ui,-apple-system,Segoe UI,Roboto,sans-serif)}',
            '#pp-overlay *{box-sizing:border-box}',
            '#pp-overlay h1{margin:12px 0 0;font-size:clamp(1.6rem,6vw,2.4rem);text-align:center;font-family:var(--font-display,inherit)}',
            '#pp-overlay .pp-sub{margin:0;color:#cbd5e1;text-align:center}',
            '.pp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,170px));gap:14px;justify-content:center;width:100%;max-width:760px}',
            '.pp-tile{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:156px;min-width:56px;padding:14px 8px;border-radius:18px;',
            'border:3px solid transparent;background:rgba(255,255,255,.07);color:inherit;font:inherit;cursor:pointer;text-align:center;transition:transform .12s ease,background .12s ease}',
            '.pp-tile:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}',
            '.pp-tile:focus-visible,.pp-key:focus-visible,.pp-btn:focus-visible{outline:4px solid #38bdf8;outline-offset:2px}',
            '.pp-tile.active{border-color:var(--pp-c,#38bdf8)}',
            '.pp-av{width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;line-height:1;',
            'background:var(--pp-c,#3b82f6);box-shadow:0 6px 18px rgba(0,0,0,.4)}',
            '.pp-name{font-weight:700;font-size:1.15rem;overflow-wrap:anywhere;max-width:100%}',
            '.pp-meta{font-size:.82rem;color:#cbd5e1;overflow-wrap:anywhere}',
            '.pp-badge{font-size:.75rem;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.18)}',
            '.pp-add .pp-av{background:transparent;border:3px dashed #94a3b8;color:#cbd5e1;font-size:2.4rem}',
            '.pp-foot{display:flex;flex-direction:column;gap:10px;width:100%;max-width:420px}',
            '.pp-btn{min-height:56px;padding:12px 18px;border-radius:14px;border:2px solid #64748b;background:transparent;color:#f1f5f9;font:inherit;font-size:1.05rem;cursor:pointer}',
            '.pp-btn:hover{background:rgba(255,255,255,.1)}',
            'a.pp-btn{display:flex;align-items:center;justify-content:center;text-decoration:none;text-align:center}',
            '.pp-pin{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:340px}',
            '.pp-dots{display:flex;gap:14px;min-height:28px}',
            '.pp-dot{width:22px;height:22px;border-radius:50%;border:3px solid #94a3b8}',
            '.pp-dot.on{background:#38bdf8;border-color:#38bdf8}',
            '.pp-pad{display:grid;grid-template-columns:repeat(3,72px);gap:12px;justify-content:center}',
            '.pp-key{width:72px;height:72px;border-radius:50%;border:2px solid #64748b;background:rgba(255,255,255,.09);color:#f1f5f9;font:inherit;font-size:1.8rem;font-weight:700;cursor:pointer}',
            '.pp-key:hover:not(:disabled){background:rgba(255,255,255,.2)}',
            '.pp-key:disabled{opacity:.4;cursor:default}',
            '.pp-key.pp-fn{font-size:1rem;font-weight:500}',
            '.pp-msg{min-height:3em;margin:0;text-align:center;color:#fca5a5;font-weight:600}',
            '.pp-note{margin:0;text-align:center;font-size:.85rem;color:#cbd5e1}',
            '@media (prefers-reduced-motion:reduce){.pp-tile{transition:none}.pp-tile:hover{transform:none}}'
        ].join('');
        document.head.appendChild(st);
    },

    // ── Data ─────────────────────────────────────────────────────────────────

    async _load(uid, base) {
        const P = PlatformFirestore;
        const quiet = p => p.catch(() => []);
        const [kids, mems] = await Promise.all([quiet(P.listPlayers(uid)), quiet(P.listMemberships(uid))]);
        const families = await Promise.all(mems.map(async m => ({ m, ks: await quiet(P.listPlayers(uid, m.ownerUid)) })));
        return this.buildList(uid, base, kids, families);
    },

    // ── Public entry points ──────────────────────────────────────────────────

    /** Once per browser session after sign in: shows the picker only when there is something to choose. */
    async maybeAuto(opts) {
        const uid = opts && opts.uid;
        if (!uid || !window.GamesHubDB || window.top !== window) return false;
        if (this._ss(this._pickedKey(uid))) return false;
        this._ss(this._pickedKey(uid), '1');
        let list;
        try { list = await this._load(uid, opts.profile || {}); } catch (e) { return false; }
        if (list.length < 2 || document.getElementById('pp-overlay')) return false;
        this._render(uid, opts.profile || {}, list, opts.returnFocus);
        return true;
    },
    /** From the header button: always opens, with a loading state first. */
    async open(opts) {
        const uid = opts && opts.uid;
        if (!uid || document.getElementById('pp-overlay')) return;
        this._ss(this._pickedKey(uid), '1');
        const base = opts.profile || {};
        const ov = this._shell(opts.returnFocus);
        ov.appendChild(this._mk('p', 'pp-sub', this._t('pickLoading'), { role: 'status' }));
        let list;
        try { list = await this._load(uid, base); } catch (e) { list = this.buildList(uid, base, [], []); }
        if (!document.body.contains(ov)) return;
        this._fill(ov, uid, base, list);
    },

    // ── UI ───────────────────────────────────────────────────────────────────

    _shell(returnFocus) {
        this._css();
        const ov = this._mk('div', null, null, { id: 'pp-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pp-title' });
        ov.appendChild(this._mk('h1', null, this._t('pickTitle'), { id: 'pp-title', tabindex: '-1' }));
        ov._returnFocus = returnFocus || document.activeElement;
        ov.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !ov.querySelector('.pp-pin')) { this._close(ov); return; }
            if (e.key === 'Tab') {
                const f = Array.from(ov.querySelectorAll('button:not([disabled]),a[href]'));
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
        document.body.appendChild(ov);
        document.documentElement.style.overflow = 'hidden';
        ov.querySelector('#pp-title').focus();
        return ov;
    },
    _close(ov) {
        const back = ov._returnFocus;
        if (ov._timer) clearInterval(ov._timer);
        ov.remove();
        document.documentElement.style.overflow = '';
        if (back && back.focus && document.body.contains(back)) back.focus();
    },
    _render(uid, base, list, returnFocus) {
        const ov = this._shell(returnFocus);
        this._fill(ov, uid, base, list);
    },
    _fill(ov, uid, base, list) {
        const P = PlatformFirestore;
        const title = ov.querySelector('#pp-title');
        ov.replaceChildren(title);
        ov.appendChild(this._mk('p', 'pp-sub', this._t('pickSub')));
        const activePid = P._pid(uid), activeOwner = P._owner(uid);
        const isActive = p => p.kind === 'me' ? !activePid : (p.pid === activePid && (p.owner || uid) === activeOwner);
        const grid = this._mk('div', 'pp-grid');
        let focusEl = null;
        list.forEach(p => {
            const active = isActive(p);
            const hasPin = p.kind === 'kid' && P.hasPin(p);
            const label = p.kind === 'me' ? this._t('pickMe') : p.name;
            const tile = this._mk('button', 'pp-tile' + (active ? ' active' : ''), null, { type: 'button', 'data-key': p.key });
            tile.style.setProperty('--pp-c', this.colorFor(p.key));
            tile.setAttribute('aria-label', [label, p.kind === 'me' ? p.name : p.family, hasPin ? this._t('pickLocked') : '', active ? this._t('pickLast') : ''].filter(Boolean).join(', '));
            tile.appendChild(this._mk('span', 'pp-av', p.avatar, { 'aria-hidden': 'true' }));
            tile.appendChild(this._mk('span', 'pp-name', label));
            const meta = p.kind === 'me' ? p.name : (p.family ? this._t('famOf', { name: p.family }) : '');
            if (meta) tile.appendChild(this._mk('span', 'pp-meta', meta));
            if (hasPin) tile.appendChild(this._mk('span', 'pp-meta', '🔒 ' + this._t('pickLocked')));
            if (active) tile.appendChild(this._mk('span', 'pp-badge', this._t('pickLast')));
            tile.onclick = () => this._choose(ov, uid, base, list, p);
            grid.appendChild(tile);
            if (active || (!focusEl && p.kind === 'me')) focusEl = tile;
        });
        if (typeof PlatformIdentity !== 'undefined') {
            const add = this._mk('button', 'pp-tile pp-add', null, { type: 'button', id: 'pp-add' });
            add.appendChild(this._mk('span', 'pp-av', '+', { 'aria-hidden': 'true' }));
            add.appendChild(this._mk('span', 'pp-name', this._t('pickAdd').replace(/^\+\s*/, '')));
            add.onclick = () => this._manage(ov, uid, base);
            grid.appendChild(add);
        }
        ov.appendChild(grid);
        const foot = this._mk('div', 'pp-foot');
        if (typeof PlatformIdentity !== 'undefined') {
            const man = this._mk('button', 'pp-btn', this._t('pickManage'), { type: 'button', id: 'pp-manage' });
            man.onclick = () => this._manage(ov, uid, base);
            foot.appendChild(man);
        }
        // Only while an adult is playing: a child at the device does not walk into the family dashboard.
        if (!activePid && list.some(p => p.kind === 'kid')) foot.appendChild(this._mk('a', 'pp-btn', '📈 ' + this._t('progBtn'), { id: 'pp-progress', href: this._rootPath() + 'progreso.html' }));
        const keep = this._mk('button', 'pp-btn', this._t('pickClose'), { type: 'button', id: 'pp-close' });
        keep.onclick = () => this._close(ov);
        foot.appendChild(keep);
        ov.appendChild(foot);
        (focusEl || title).focus();
    },
    _manage(ov, uid, base) {
        this._close(ov);
        PlatformIdentity.showPlayers(uid, base);
    },
    _choose(ov, uid, base, list, p) {
        if (p.kind === 'kid' && PlatformFirestore.hasPin(p)) this._keypad(ov, uid, base, list, p);
        else this._switch(ov, uid, p);
    },
    async _switch(ov, uid, p) {
        const P = PlatformFirestore;
        const same = p.kind === 'me' ? !P._pid(uid) : (p.pid === P._pid(uid) && (p.owner || uid) === P._owner(uid));
        if (same) { this._close(ov); return; }
        try {
            await P.setActiveFamily(uid, p.owner || '');
            P.setActivePlayer(uid, p.kind === 'me' ? '' : p.pid);
        } catch (e) {
            const m = ov.querySelector('.pp-msg') || ov.appendChild(this._mk('p', 'pp-msg', '', { role: 'alert' }));
            m.textContent = PlatformI18n.t('famError');
            return;
        }
        if (window.GHNav) window.GHNav.show(false, 6000); // same splash as any navigation
        location.reload();
    },
    _keypad(ov, uid, base, list, p) {
        const P = PlatformFirestore;
        const owner = p.owner || uid;
        const title = ov.querySelector('#pp-title');
        title.textContent = this._t('pinTitle', { name: p.name });
        ov.replaceChildren(title);
        const box = this._mk('div', 'pp-pin');
        const av = this._mk('div', 'pp-av', p.avatar, { 'aria-hidden': 'true' });
        av.style.setProperty('--pp-c', this.colorFor(p.key));
        const help = this._mk('p', 'pp-sub', this._t('pinHelp'), { id: 'pp-help' });
        const dots = this._mk('div', 'pp-dots', null, { 'aria-hidden': 'true' });
        for (let i = 0; i < 4; i++) dots.appendChild(this._mk('span', 'pp-dot'));
        const msg = this._mk('p', 'pp-msg', '', { role: 'alert', id: 'pp-msg' });
        const pad = this._mk('div', 'pp-pad');
        let entered = '', busy = false;
        const keys = [];
        const paint = () => Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i < entered.length));
        const setLocked = locked => keys.forEach(k => { k.disabled = locked || busy; });
        const countdown = wait => {
            if (ov._timer) clearInterval(ov._timer);
            let left = wait;
            const tick = () => {
                if (left <= 0) { clearInterval(ov._timer); ov._timer = 0; msg.textContent = ''; setLocked(false); keys[0].focus(); return; }
                msg.textContent = this._t('pinLocked', { n: left });
                left--;
            };
            setLocked(true); tick();
            ov._timer = setInterval(tick, 1000);
        };
        const submit = async () => {
            busy = true; setLocked(true);
            const pin = entered;
            const r = await P.tryPin(uid, owner, p.pid, pin, p.pin);
            busy = false;
            if (r.ok) {
                const J = this._juice();
                if (J) { try { J.correct(av, { silent: true }); } catch (e) {} }
                setTimeout(() => this._switch(ov, uid, p), J ? 450 : 0);
                return;
            }
            entered = ''; paint();
            const J = this._juice();
            if (J) { try { J.wrong(dots, { silent: true }); } catch (e) {} }
            if (r.locked) countdown(r.waitSec);
            else { setLocked(false); keys[0].focus(); msg.textContent = this._t('pinWrong', { n: r.left }); }
        };
        const press = d => {
            if (busy || entered.length >= 4 || keys[0].disabled) return;
            entered += d; paint(); msg.textContent = '';
            if (entered.length === 4) submit();
        };
        const erase = () => { if (busy || keys[0].disabled) return; entered = entered.slice(0, -1); paint(); };
        const key = (txt, cls, fn, label) => {
            const b = this._mk('button', 'pp-key' + (cls ? ' ' + cls : ''), txt, { type: 'button' });
            if (label) b.setAttribute('aria-label', label);
            b.onclick = fn;
            pad.appendChild(b);
            return b;
        };
        const back = this._mk('button', 'pp-key pp-fn', this._t('pinBack'), { type: 'button', id: 'pp-pin-back' });
        back.onclick = () => { if (ov._timer) clearInterval(ov._timer); title.textContent = this._t('pickTitle'); this._fill(ov, uid, base, list); };
        for (let d = 1; d <= 9; d++) keys.push(key(String(d), '', () => press(String(d))));
        pad.appendChild(back);
        keys.push(key('0', '', () => press('0')));
        keys.push(key('⌫', 'pp-fn', erase, this._t('pinErase')));
        box.append(av, help, dots, msg, pad, this._mk('p', 'pp-note', this._t('pinNote')));
        ov.appendChild(box);
        ov.onkeydown = e => {
            if (!ov.querySelector('.pp-pin')) return;
            if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
            else if (e.key === 'Backspace') { e.preventDefault(); erase(); }
            else if (e.key === 'Escape') { e.preventDefault(); back.click(); }
        };
        const st = P.pinStatus(uid, owner, p.pid);
        if (st.locked) countdown(st.waitSec);
        keys[0].focus();
    }
};
if (typeof window !== 'undefined') window.PlatformProfiles = PlatformProfiles;
