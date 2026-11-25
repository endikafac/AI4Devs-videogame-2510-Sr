/**
 * Games Hub - Identity & consent module
 *
 * Privacy by design for a platform used by children:
 *  - The account holder is always an ADULT (or a guardian). Children play
 *    under that account and are never asked for their real name, email or photo.
 *  - The public identity is only a unique nickname + an emoji avatar.
 *    Google display name and photo are NOT stored in Firestore.
 *  - Consent (version + date) is stored with the profile.
 *  - The adult can export and erase all data (GDPR arts. 15, 17, 20).
 *
 * Requires: firebase-config.js, i18n-platform.js, firestore.js
 */

const PlatformIdentity = {
    CONSENT_VERSION: '2026-11',
    AVATARS: ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐙', '🦄', '🐢', '🦉', '🐬', '🦋',
              '🚀', '⚽', '🎨', '🎸', '🌈', '⭐', '🍀', '🔭', '🧩', '🏆', '🐧', '🐝'],

    _L: {
        es: {
            title: 'Crea tu identidad de jugador',
            guardian: 'Soy una persona adulta (mayor de 14 años) o el padre, madre o tutor del menor que va a jugar, y acepto el <a href="{p}platform/privacy.html" target="_blank" rel="noopener">aviso de privacidad</a>.',
            nick: 'Apodo (3 a 16 letras o números, sin espacios)',
            nickHelp: 'Usa un apodo inventado. No pongas nombres reales, apellidos ni datos personales.',
            avatar: 'Elige un avatar',
            save: 'Guardar y jugar',
            cancel: 'Ahora no (cerrar sesión)',
            taken: 'Ese apodo ya está en uso. Prueba con otro.',
            invalid: 'El apodo debe tener entre 3 y 16 letras o números (también vale _ y -).',
            consentNeeded: 'Marca la casilla para continuar.',
            error: 'No se pudo guardar. Inténtalo de nuevo.',
            players: 'Quién juega', me: 'Yo (persona adulta)', addKid: '+ Añadir jugador infantil', kidTitle: 'Nuevo jugador infantil',
            kidNote: 'Cada niño o niña tiene su apodo y su progreso. La cuenta sigue siendo de la persona adulta responsable.',
            create: 'Crear', back: 'Volver', remove: 'Borrar', removeAsk: '¿Borrar este jugador y todo su progreso? No se puede deshacer.',
            max: 'Has llegado al máximo de 6 jugadores infantiles.'
        },
        en: {
            title: 'Create your player identity',
            guardian: 'I am an adult (over 14) or the parent or guardian of the child who will play, and I accept the <a href="{p}platform/privacy.html" target="_blank" rel="noopener">privacy notice</a>.',
            nick: 'Nickname (3 to 16 letters or numbers, no spaces)',
            nickHelp: 'Use a made-up nickname. Do not use real names, surnames or personal data.',
            avatar: 'Pick an avatar',
            save: 'Save and play',
            cancel: 'Not now (sign out)',
            taken: 'That nickname is already taken. Try another one.',
            invalid: 'The nickname must be 3 to 16 letters or numbers (_ and - are fine too).',
            consentNeeded: 'Tick the box to continue.',
            error: 'Could not save. Please try again.',
            players: 'Who is playing', me: 'Me (adult)', addKid: '+ Add a child player', kidTitle: 'New child player',
            kidNote: 'Each child has their own nickname and progress. The account still belongs to the responsible adult.',
            create: 'Create', back: 'Back', remove: 'Delete', removeAsk: 'Delete this player and all their progress? This cannot be undone.',
            max: 'You have reached the maximum of 6 child players.'
        },
        eu: {
            title: 'Sortu zure jokalari identitatea',
            guardian: 'Pertsona heldua (14 urtetik gorakoa) naiz, edo jokatuko duen adingabearen guraso edo tutorea, eta <a href="{p}platform/privacy.html" target="_blank" rel="noopener">pribatutasun oharra</a> onartzen dut.',
            nick: 'Ezizena (3 eta 16 letra edo zenbaki artean, zuriunerik gabe)',
            nickHelp: 'Erabili asmatutako ezizen bat. Ez jarri benetako izenik, abizenik edo datu pertsonalik.',
            avatar: 'Aukeratu avatar bat',
            save: 'Gorde eta jokatu',
            cancel: 'Orain ez (saioa itxi)',
            taken: 'Ezizen hori hartuta dago. Probatu beste bat.',
            invalid: 'Ezizenak 3 eta 16 letra edo zenbaki artean izan behar ditu (_ eta - ere balio dute).',
            consentNeeded: 'Markatu laukia jarraitzeko.',
            error: 'Ezin izan da gorde. Saiatu berriro.',
            players: 'Nork jokatzen du', me: 'Ni (pertsona heldua)', addKid: '+ Gehitu haur jokalaria', kidTitle: 'Haur jokalari berria',
            kidNote: 'Haur bakoitzak bere ezizena eta aurrerapena ditu. Kontua pertsona heldu arduradunarena da.',
            create: 'Sortu', back: 'Atzera', remove: 'Ezabatu', removeAsk: 'Jokalari hau eta haren aurrerapen guztia ezabatu? Ezin da desegin.',
            max: 'Gehienezko 6 haur jokalarietara iritsi zara.'
        }
    },

    _t(key) {
        const lang = (typeof PlatformI18n !== 'undefined' ? PlatformI18n.currentLanguage : 'es-ES').slice(0, 2);
        return (this._L[lang] || this._L.es)[key];
    },

    // ── Nickname rules ───────────────────────────────────────────────────────

    isValidNickname(n) {
        return typeof n === 'string' && /^[\p{L}\p{N}_-]{3,16}$/u.test(n.trim());
    },

    /** Case- and accent-insensitive key, so "Álex" and "alex" collide. */
    nicknameKey(n) {
        return n.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    },

    needsSetup(profile) {
        return !!window.GamesHubDB && (!profile || !profile.nicknameKey ||
            !profile.consent || profile.consent.version !== this.CONSENT_VERSION);
    },

    /**
     * Reserve the nickname (unique across all users) and save identity + consent.
     * Runs in a transaction so two people cannot claim the same nickname.
     */
    async claim(uid, nickname, avatar, previousKey) {
        const nick = nickname.trim();
        if (!this.isValidNickname(nick)) throw new Error('invalid');
        if (!this.AVATARS.includes(avatar)) throw new Error('invalid');
        const key = this.nicknameKey(nick);
        const db = GamesHubDB;
        const nRef = db.collection('nicknames').doc(key);
        const uRef = db.collection('users').doc(uid);
        await db.runTransaction(async tx => {
            const snap = await tx.get(nRef);
            if (snap.exists && snap.data().uid !== uid) throw new Error('taken');
            if (!snap.exists) tx.set(nRef, { uid, createdAt: new Date().toISOString() });
            if (previousKey && previousKey !== key) tx.delete(db.collection('nicknames').doc(previousKey));
            tx.set(uRef, {
                username: nick,
                nicknameKey: key,
                avatar,
                photoURL: null,
                consent: { version: this.CONSENT_VERSION, at: new Date().toISOString(), guardian: true }
            }, { merge: true });
        });
        return { username: nick, nicknameKey: key, avatar };
    },

    // ── Setup modal ──────────────────────────────────────────────────────────

    /** @returns {Promise<Object|null>} saved identity, or null if the adult cancelled */
    showSetup(profile, rootPath = '../') {
        return new Promise(resolve => {
            const t = k => this._t(k);
            const esc = v => String(v ?? '').replace(/[&<>"']/g,
                c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const wrap = document.createElement('div');
            wrap.className = 'pid-overlay';
            wrap.innerHTML = `
              <div class="pid-modal" role="dialog" aria-modal="true" aria-labelledby="pid-title">
                <h2 id="pid-title">${t('title')}</h2>
                <label class="pid-check"><input type="checkbox" id="pid-consent">
                  <span>${t('guardian').replace('{p}', rootPath)}</span></label>
                <label for="pid-nick">${t('nick')}</label>
                <input id="pid-nick" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false"
                       value="${esc(profile && profile.nicknameKey ? profile.username : '')}">
                <p class="pid-help">${t('nickHelp')}</p>
                <div class="pid-label">${t('avatar')}</div>
                <div class="pid-avatars" role="radiogroup">
                  ${this.AVATARS.map((a, i) => `<button type="button" role="radio" class="pid-av${i === 0 ? ' sel' : ''}" aria-checked="${i === 0}" data-a="${a}">${a}</button>`).join('')}
                </div>
                <p class="pid-error" id="pid-error" role="alert"></p>
                <div class="pid-actions">
                  <button type="button" class="pid-btn ghost" id="pid-cancel">${t('cancel')}</button>
                  <button type="button" class="pid-btn" id="pid-save">${t('save')}</button>
                </div>
              </div>`;
            document.body.appendChild(wrap);
            let avatar = (profile && this.AVATARS.includes(profile.avatar)) ? profile.avatar : this.AVATARS[0];
            const select = a => wrap.querySelectorAll('.pid-av').forEach(b => {
                const on = b.dataset.a === a;
                b.classList.toggle('sel', on);
                b.setAttribute('aria-checked', String(on));
            });
            select(avatar);
            wrap.querySelector('.pid-avatars').addEventListener('click', e => {
                const b = e.target.closest('.pid-av');
                if (b) { avatar = b.dataset.a; select(avatar); }
            });
            const err = m => { wrap.querySelector('#pid-error').textContent = m || ''; };
            const close = v => { wrap.remove(); resolve(v); };
            wrap.querySelector('#pid-cancel').addEventListener('click', () => close(null));
            wrap.querySelector('#pid-save').addEventListener('click', async () => {
                err('');
                if (!wrap.querySelector('#pid-consent').checked) return err(t('consentNeeded'));
                const nick = wrap.querySelector('#pid-nick').value;
                if (!this.isValidNickname(nick)) return err(t('invalid'));
                try {
                    const user = (typeof PlatformAuth !== 'undefined') && PlatformAuth.currentUser;
                    close(await this.claim(user.uid, nick, avatar, profile && profile.nicknameKey));
                } catch (e) {
                    err(e.message === 'taken' ? t('taken') : e.message === 'invalid' ? t('invalid') : t('error'));
                }
            });
            wrap.querySelector('#pid-nick').focus();
        });
    },

    // ── Child players ────────────────────────────────────────────────────────

    MAX_PLAYERS: 6,

    async createPlayer(uid, nickname, avatar) {
        const nick = nickname.trim();
        if (!this.isValidNickname(nick) || !this.AVATARS.includes(avatar)) throw new Error('invalid');
        const key = this.nicknameKey(nick);
        const db = GamesHubDB;
        const players = db.collection('users').doc(uid).collection('players');
        if ((await players.get()).size >= this.MAX_PLAYERS) throw new Error('max');
        const pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        const nRef = db.collection('nicknames').doc(key);
        await db.runTransaction(async tx => {
            const snap = await tx.get(nRef);
            if (snap.exists) throw new Error('taken');
            tx.set(nRef, { uid, createdAt: new Date().toISOString() });
            tx.set(players.doc(pid), {
                username: nick, nicknameKey: key, avatar, photoURL: null, kind: 'child',
                createdAt: new Date().toISOString(), xp: 0, totalPoints: 0, level: 0
            });
        });
        return pid;
    },

    async deletePlayer(uid, pid) {
        const db = GamesHubDB;
        const ref = db.collection('users').doc(uid).collection('players').doc(pid);
        const snap = await ref.get();
        const games = await ref.collection('games').get();
        for (const d of games.docs) {
            await db.collection('leaderboard').doc(d.id).collection('scores').doc(uid + '_' + pid).delete().catch(() => {});
            await d.ref.delete();
        }
        const key = snap.exists && snap.data().nicknameKey;
        if (key) await db.collection('nicknames').doc(key).delete().catch(() => {});
        await ref.delete();
        if (PlatformFirestore._pid(uid) === pid && PlatformFirestore._owner(uid) === uid) PlatformFirestore.setActivePlayer(uid, '');
    },

    // ── Family accounts (docs/cuenta-familiar.md) ────────────────────────────
    // Other adults play with the children of an account holder. Strings live in
    // PlatformI18n (six languages). Everything that comes from Firestore is set
    // with textContent, never innerHTML.

    _F(key, vars) {
        let s = PlatformI18n.t(key);
        Object.keys(vars || {}).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k] == null ? '' : vars[k])); });
        return s;
    },
    _roleLabel(role) { return PlatformI18n.t(role === 'view' ? 'famRoleView' : 'famRoleEdit'); },
    _siteUrl() {
        try {
            const sc = Array.prototype.find.call(document.scripts, x => /platform\/identity\.js/.test(x.src));
            return new URL('../', sc ? sc.src : location.href).href;
        } catch (e) { return location.origin + '/'; }
    },
    _mk(tag, cls, text, attrs) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
        return n;
    },
    /** Text the owner pastes into WhatsApp. No e-mail is sent by the app. */
    inviteMessage(ownerName, role, email) {
        return this._F('famMsg', { name: ownerName, role: this._roleLabel(role), url: this._siteUrl(), email });
    },
    async _copyText(text) {
        try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back below */ }
        try {
            const ta = this._mk('textarea', null, text, { readonly: '', 'aria-hidden': 'true' });
            ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            return ok;
        } catch (e) { return false; }
    },
    _famError(e) {
        const m = e && e.message;
        return m === 'invalid' ? PlatformI18n.t('famInvalidEmail') : m === 'self' ? PlatformI18n.t('famSelf')
            : m === 'duplicate' ? PlatformI18n.t('famDup') : m === 'max' ? PlatformI18n.t('famMax')
            : m === 'offline' ? PlatformI18n.t('famOffline') : PlatformI18n.t('famError');
    },

    /** One invitation card with the explanation of what is shared and what is not. */
    _inviteCard(inv, uid, profile, onChange, onError) {
        const t = k => PlatformI18n.t(k);
        const card = this._mk('div', 'pid-fam-card', null, { role: 'group' });
        card.appendChild(this._mk('p', null, this._F('famInviteText', { name: inv.ownerName || '?', role: this._roleLabel(inv.role) })));
        const act = this._mk('div', 'pid-actions');
        const no = this._mk('button', 'pid-btn ghost', t('famDecline'), { type: 'button' });
        const yes = this._mk('button', 'pid-btn', t('famAccept'), { type: 'button' });
        const run = fn => async () => {
            no.disabled = yes.disabled = true;
            try { await fn(); await onChange(); } catch (e) { no.disabled = yes.disabled = false; onError(this._famError(e)); }
        };
        no.onclick = run(() => PlatformFirestore.declineInvite(inv.id));
        yes.onclick = run(() => PlatformFirestore.acceptInvite(inv, profile && profile.username));
        act.append(no, yes);
        card.appendChild(act);
        return card;
    },

    /** Family screen: invite and manage guardians (owner), answer invitations and leave families (guest). */
    async _renderFamily(wrap, uid, profile, st, back) {
        const t = k => PlatformI18n.t(k);
        const P = PlatformFirestore;
        const modal = this._mk('div', 'pid-modal', null, { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pid-title' });
        const title = this._mk('h2', null, t('famTitle'), { id: 'pid-title', tabindex: '-1' });
        modal.appendChild(title);
        wrap.replaceChildren(modal);
        title.focus();
        const render = () => this._renderFamily(wrap, uid, profile, st, back);
        // Progress of the little ones (adults only; the page reads children, never the adult's own data)
        modal.appendChild(this._mk('a', 'pid-btn ghost pid-fam-wide', '📈 ' + t('progBtn'), { id: 'pid-fam-progress', href: new URL('progreso.html', this._siteUrl()).href }));

        const safe = p => p.catch(() => null);
        const [guardians, sent, invites, mems] = await Promise.all([
            safe(P.listGuardians(uid)), safe(P.listSentInvites(uid)), safe(P.listMyInvites()), safe(P.listMemberships(uid))]);
        const errNode = this._mk('p', 'pid-error', '', { id: 'pid-error', role: 'alert' });
        const err = m => { errNode.textContent = m || ''; };
        if ([guardians, sent, invites, mems].some(x => x === null)) err(t('famError'));

        // Invitations received
        if (invites && invites.length) {
            modal.appendChild(this._mk('h3', 'pid-fam-h', t('famInvitesTitle')));
            invites.forEach(inv => modal.appendChild(this._inviteCard(inv, uid, profile, render, err)));
        }

        // Families I belong to
        if (mems && mems.length) {
            modal.appendChild(this._mk('h3', 'pid-fam-h', t('famMine')));
            mems.forEach(m => {
                const row = this._mk('div', 'pid-fam-row');
                const txt = this._mk('div', 'pid-fam-who');
                txt.appendChild(this._mk('span', null, this._F('famOf', { name: m.ownerName || '?' })));
                txt.appendChild(this._mk('small', null, this._roleLabel(m.role)));
                const btn = this._mk('button', 'pid-btn ghost pid-fam-btn', t('famLeave'),
                    { type: 'button', 'aria-label': t('famLeave') + ' ' + this._F('famOf', { name: m.ownerName || '?' }) });
                btn.onclick = async () => {
                    if (!confirm(this._F('famLeaveAsk', { name: m.ownerName || '?' }))) return;
                    btn.disabled = true;
                    try { await P.leaveFamily(m.ownerUid); await render(); } catch (e) { btn.disabled = false; err(this._famError(e)); }
                };
                row.append(txt, btn);
                modal.appendChild(row);
            });
        }

        // Owner: invite
        modal.appendChild(this._mk('h3', 'pid-fam-h', t('famGuardians')));
        modal.appendChild(this._mk('p', 'pid-help', t('famIntro')));
        modal.appendChild(this._mk('label', null, t('famEmail'), { for: 'pid-fam-email' }));
        const email = this._mk('input', 'pid-fam-input', null, { id: 'pid-fam-email', type: 'email', inputmode: 'email',
            maxlength: '254', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
        modal.appendChild(email);
        modal.appendChild(this._mk('label', null, t('famRole'), { for: 'pid-fam-role' }));
        const role = this._mk('select', 'pid-fam-input', null, { id: 'pid-fam-role' });
        [['edit', 'famRoleEdit'], ['view', 'famRoleView']].forEach(([v, k]) => role.appendChild(this._mk('option', null, t(k), { value: v })));
        modal.appendChild(role);
        const inviteBtn = this._mk('button', 'pid-btn pid-fam-wide', t('famInvite'), { type: 'button', id: 'pid-fam-invite' });
        inviteBtn.onclick = async () => {
            err('');
            if (!P.isValidEmail(email.value)) { err(t('famInvalidEmail')); email.focus(); return; }
            inviteBtn.disabled = true;
            try {
                await P.createInvite(uid, email.value, role.value, profile && profile.username);
                st.msg = this.inviteMessage((profile && profile.username) || '', role.value, P.normEmail(email.value));
                await render();
            } catch (e) { inviteBtn.disabled = false; err(this._famError(e)); }
        };
        modal.appendChild(inviteBtn);

        // Message to copy and paste (WhatsApp...)
        if (st.msg) {
            const box = this._mk('div', 'pid-fam-card');
            box.appendChild(this._mk('p', 'pid-fam-msg', st.msg));
            const status = this._mk('p', 'pid-help', '', { role: 'status' });
            const copy = this._mk('button', 'pid-btn pid-fam-wide', t('famShare'), { type: 'button', id: 'pid-fam-copy' });
            copy.onclick = async () => { status.textContent = t((await this._copyText(st.msg)) ? 'famCopied' : 'famCopyFail'); };
            box.append(copy, status);
            modal.appendChild(box);
        }

        // Owner: people with access and pending invitations
        if (guardians && guardians.length) {
            guardians.forEach(g => {
                const row = this._mk('div', 'pid-fam-row');
                const txt = this._mk('div', 'pid-fam-who');
                txt.appendChild(this._mk('span', null, g.name || g.email || '?'));
                txt.appendChild(this._mk('small', null, (g.email || '') + ' · ' + this._roleLabel(g.role)));
                const btn = this._mk('button', 'pid-btn ghost pid-fam-btn', t('famRemove'),
                    { type: 'button', 'aria-label': t('famRemove') + ' ' + (g.name || g.email || '') });
                btn.onclick = async () => {
                    if (!confirm(t('famRemoveAsk'))) return;
                    btn.disabled = true;
                    try { await P.removeGuardian(uid, g.id || g.uid); await render(); } catch (e) { btn.disabled = false; err(this._famError(e)); }
                };
                row.append(txt, btn);
                modal.appendChild(row);
            });
        } else if (guardians && !(sent && sent.length)) {
            modal.appendChild(this._mk('p', 'pid-help', t('famNone')));
        }
        if (sent && sent.length) {
            modal.appendChild(this._mk('h3', 'pid-fam-h', t('famPending')));
            sent.forEach(inv => {
                const row = this._mk('div', 'pid-fam-row');
                const txt = this._mk('div', 'pid-fam-who');
                txt.appendChild(this._mk('span', null, inv.email || '?'));
                txt.appendChild(this._mk('small', null, this._roleLabel(inv.role)));
                const btn = this._mk('button', 'pid-btn ghost pid-fam-btn', t('famCancelInvite'),
                    { type: 'button', 'aria-label': t('famCancelInvite') + ' ' + (inv.email || '') });
                btn.onclick = async () => {
                    btn.disabled = true;
                    try { await P.declineInvite(inv.id); await render(); } catch (e) { btn.disabled = false; err(this._famError(e)); }
                };
                row.append(txt, btn);
                modal.appendChild(row);
            });
        }

        await this._pinSection(modal, uid, mems || [], st, err, render);
        await this._interestsSection(modal, uid, mems || [], st, err, render);

        modal.appendChild(errNode);
        const actions = this._mk('div', 'pid-actions');
        const backBtn = this._mk('button', 'pid-btn ghost', t('famBack'), { type: 'button', id: 'pid-fam-back' });
        backBtn.onclick = back;
        actions.appendChild(backBtn);
        modal.appendChild(actions);
    },

    /** platform/interests.js is loaded on demand on pages that do not include it (the Familia screen is reachable from every game). */
    _loadInterests() {
        if (typeof PlatformInterests !== 'undefined') return Promise.resolve(true);
        return new Promise(res => {
            const me = document.querySelector('script[src*="identity.js"]');
            if (!me) return res(false);
            const s = document.createElement('script');
            s.src = me.src.replace('identity.js', 'interests.js');
            s.onload = () => res(true); s.onerror = () => res(false);
            document.head.appendChild(s);
        });
    },
    /**
     * "Mis gustos": the interests of each child (platform/interests.js), editable by the owner and by guardians with
     * role edit (rules: validInterests + canEditKids). Role view only sees them.
     */
    async _interestsSection(modal, uid, mems, st, err, render) {
        if (!(await this._loadInterests())) return;
        const PI = PlatformInterests, P = PlatformFirestore, L = PI.lang();
        modal.appendChild(this._mk('h3', 'pid-fam-h', PI.t('mine', L)));
        modal.appendChild(this._mk('p', 'pid-help', PI.t('famHelp', L)));
        if (st.likeMsg) { modal.appendChild(this._mk('p', 'pid-help', st.likeMsg, { role: 'status', id: 'pid-like-status' })); st.likeMsg = ''; }
        const groups = [{ owner: uid, role: 'owner', name: '' }]
            .concat(mems.map(m => ({ owner: m.ownerUid, role: m.role, name: m.ownerName || '?' })));
        const lists = await Promise.all(groups.map(g => P.listPlayers(uid, g.owner).catch(() => [])));
        groups.forEach((g, i) => {
            if (!lists[i].length) return;
            if (g.owner !== uid) modal.appendChild(this._mk('div', 'pid-fam-head', this._F('famOf', { name: g.name }) + (g.role === 'view' ? ' · ' + PlatformI18n.t('famRoleView') : '')));
            lists[i].forEach(kid => {
                const ints = PI.sanitize(kid.interests);
                const row = this._mk('div', 'pid-fam-row pid-like-row', null, { 'data-pid': kid.pid });
                const who = this._mk('div', 'pid-fam-who');
                who.appendChild(this._mk('span', null, (kid.avatar || '🙂') + ' ' + (kid.username || '')));
                who.appendChild(this._mk('small', 'pid-like-list', ints.length ? ints.map(id => PI.emoji(id) + ' ' + PI.label(id, L)).join(', ') : PI.t('none', L)));
                row.appendChild(who);
                if (g.role === 'owner' || g.role === 'edit') {
                    const name = kid.username || '';
                    const b = this._mk('button', 'pid-btn ghost pid-fam-btn', PI.t('change', L), { type: 'button', 'data-act': 'interests', 'aria-label': PI.t('change', L) + ' ' + name });
                    b.onclick = () => {
                        err('');
                        row.replaceChildren(PI.buildPicker({ selected: ints, lang: L, headingTag: 'h4', canSkip: true,
                            onSave: async list => {
                                try { await P.setChildInterests(g.owner, kid.pid, list); PI.saveLocal(PI.localKey(uid, kid.pid), list); st.likeMsg = PI.t('saved', L); await render(); }
                                catch (e) { err(this._famError(e)); }
                            },
                            onSkip: () => render() }));
                    };
                    row.appendChild(b);
                }
                modal.appendChild(row);
            });
        });
    },

    /**
     * "Clave para entrar como ellos": optional 4-digit PIN per child (convenience lock between
     * profiles on a shared device, NOT account security; the text says so). The owner and
     * guardians with role edit can set, change or remove it; role view only sees the state.
     * Only a salted PBKDF2 hash is stored (PlatformFirestore.setChildPin), never the PIN.
     */
    async _pinSection(modal, uid, mems, st, err, render) {
        const t = k => PlatformI18n.t(k);
        const P = PlatformFirestore;
        modal.appendChild(this._mk('h3', 'pid-fam-h', t('pinSection')));
        modal.appendChild(this._mk('p', 'pid-help', t('pinIntro')));
        if (st.pinMsg) { modal.appendChild(this._mk('p', 'pid-help', st.pinMsg, { role: 'status', id: 'pid-pin-status' })); st.pinMsg = ''; }
        const groups = [{ owner: uid, role: 'owner', name: '' }]
            .concat(mems.map(m => ({ owner: m.ownerUid, role: m.role, name: m.ownerName || '?' })));
        const lists = await Promise.all(groups.map(g => P.listPlayers(uid, g.owner).catch(() => [])));
        let any = false;
        groups.forEach((g, i) => {
            if (!lists[i].length) return;
            any = true;
            if (g.owner !== uid) {
                modal.appendChild(this._mk('div', 'pid-fam-head', this._F('famOf', { name: g.name }) + (g.role === 'view' ? ' · ' + t('famRoleView') : '')));
                if (g.role === 'view') modal.appendChild(this._mk('p', 'pid-help', t('pinViewOnly')));
            }
            lists[i].forEach(k => modal.appendChild(this._pinRow(g, k, st, err, render)));
        });
        if (!any) modal.appendChild(this._mk('p', 'pid-help', t('pinNoKids')));
    },
    _pinRow(g, kid, st, err, render) {
        const t = k => PlatformI18n.t(k);
        const P = PlatformFirestore;
        const canEdit = g.role === 'owner' || g.role === 'edit';
        const has = P.hasPin(kid);
        const row = this._mk('div', 'pid-fam-row pid-pin-row', null, { 'data-pid': kid.pid });
        const who = this._mk('div', 'pid-fam-who');
        who.appendChild(this._mk('span', null, (kid.avatar || '🙂') + ' ' + (kid.username || '')));
        who.appendChild(this._mk('small', null, (has ? '🔒 ' : '') + t(has ? 'pinOn' : 'pinOff')));
        row.appendChild(who);
        if (!canEdit) return row;
        const acts = this._mk('div', 'pid-pin-actions');
        const name = kid.username || '';
        const setBtn = this._mk('button', 'pid-btn ghost pid-fam-btn', t(has ? 'pinChange' : 'pinSet'),
            { type: 'button', 'aria-label': t(has ? 'pinChange' : 'pinSet') + ' ' + name, 'data-act': 'set' });
        acts.appendChild(setBtn);
        if (has) {
            const rm = this._mk('button', 'pid-btn ghost pid-fam-btn', t('pinRemove'),
                { type: 'button', 'aria-label': t('pinRemove') + ' ' + name, 'data-act': 'remove' });
            rm.onclick = async () => {
                if (!confirm(t('pinRemoveAsk'))) return;
                rm.disabled = true;
                try { await P.clearChildPin(g.owner, kid.pid); st.pinMsg = t('pinRemoved'); await render(); }
                catch (e) { rm.disabled = false; err(this._famError(e)); }
            };
            acts.appendChild(rm);
        }
        setBtn.onclick = () => {
            const form = this._mk('div', 'pid-pin-form');
            const input = this._mk('input', 'pid-fam-input', null, { type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4',
                autocomplete: 'off', 'aria-label': t('pinNew') + ' ' + name, placeholder: t('pinNew'), 'data-pin-input': '1' });
            const save = this._mk('button', 'pid-btn pid-fam-btn', t('pinSave'), { type: 'button', 'data-act': 'save' });
            const cancel = this._mk('button', 'pid-btn ghost pid-fam-btn', t('pinCancel'), { type: 'button' });
            input.addEventListener('input', () => { input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4); });
            cancel.onclick = () => render();
            save.onclick = async () => {
                err('');
                if (!P.isValidPin(input.value)) { err(t('pinInvalid')); input.focus(); return; }
                save.disabled = true;
                try { await P.setChildPin(g.owner, kid.pid, input.value); st.pinMsg = t('pinSaved'); await render(); }
                catch (e) { save.disabled = false; err(this._famError(e)); }
            };
            form.append(input, save, cancel);
            acts.replaceChildren(form);
            input.focus();
        };
        row.appendChild(acts);
        return row;
    },

    /** Who is playing? Lists the adult, the children and the children of the families this user belongs to. Reloads the page on change. */
    async showPlayers(uid, profile) {
        const t = k => this._t(k);
        const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const P = PlatformFirestore;
        const wrap = document.createElement('div');
        wrap.className = 'pid-overlay';
        document.body.appendChild(wrap);
        const done = () => { wrap.remove(); };
        wrap.addEventListener('keydown', e => { if (e.key === 'Escape') done(); });
        const active = P._pid(uid);
        const activeOwner = P._owner(uid);
        const st = { msg: '' };
        const fail = () => { const n = wrap.querySelector('#pid-error'); if (n) n.textContent = PlatformI18n.t('famError'); };
        // owner = '' (or own uid): own account. Otherwise a family the user belongs to.
        const switchTo = async (pid, owner) => {
            try {
                await P.setActiveFamily(uid, owner || '');
                P.setActivePlayer(uid, pid);
                location.reload();
            } catch (e) { fail(); }
        };

        const list = async () => {
            const quiet = p => p.catch(() => []);
            const [kids, mems, invites] = await Promise.all([quiet(P.listPlayers(uid)), quiet(P.listMemberships(uid)), quiet(P.listMyInvites())]);
            const famKids = await Promise.all(mems.map(async m => ({ m, ks: await quiet(P.listPlayers(uid, m.ownerUid)) })));
            wrap.innerHTML = `<div class="pid-modal" role="dialog" aria-modal="true" aria-labelledby="pid-title">
                <h2 id="pid-title">${t('players')}</h2>
                <div id="pid-fam-top"></div>
                <div class="pid-players">
                  <button type="button" class="pid-player${active ? '' : ' sel'}" data-pid="">
                    <span class="pid-pav">${esc(profile.avatar || '🙂')}</span><span>${esc(profile.username)}<small>${t('me')}</small></span></button>
                  ${kids.map(k => `<div class="pid-prow"><button type="button" class="pid-player${k.pid === active && activeOwner === uid ? ' sel' : ''}" data-pid="${esc(k.pid)}">
                    <span class="pid-pav">${esc(k.avatar)}</span><span>${esc(k.username)}<small>⭐ ${Number(k.totalPoints) || 0}</small></span></button>
                    <button type="button" class="pid-btn ghost pid-del" data-del="${esc(k.pid)}" aria-label="${t('remove')} ${esc(k.username)}">🗑</button></div>`).join('')}
                </div>
                <p class="pid-error" id="pid-error" role="alert"></p>
                <div class="pid-actions">
                  <button type="button" class="pid-btn ghost" id="pid-close">${t('back')}</button>
                  <button type="button" class="pid-btn ghost" id="pid-family">👪 ${esc(PlatformI18n.t('famTitle'))}</button>
                  <button type="button" class="pid-btn" id="pid-add">${t('addKid')}</button>
                </div></div>`;
            wrap.querySelector('#pid-close').onclick = done;
            wrap.querySelector('#pid-family').onclick = () => this._renderFamily(wrap, uid, profile, st, list);
            wrap.querySelector('#pid-add').onclick = () => kids.length >= this.MAX_PLAYERS
                ? (wrap.querySelector('#pid-error').textContent = t('max')) : form();
            wrap.querySelectorAll('.pid-player').forEach(b => b.onclick = () => switchTo(b.dataset.pid, ''));
            wrap.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
                if (!confirm(t('removeAsk'))) return;
                try { await this.deletePlayer(uid, b.dataset.del); } catch (e) { wrap.querySelector('#pid-error').textContent = t('error'); return; }
                if (b.dataset.del === active && activeOwner === uid) location.reload(); else list();
            });

            // Pending invitations (banner) and the children of the families I belong to
            const err = m => { wrap.querySelector('#pid-error').textContent = m || ''; };
            const top = wrap.querySelector('#pid-fam-top');
            if (invites.length) {
                top.appendChild(this._mk('h3', 'pid-fam-h', PlatformI18n.t('famInvitesTitle')));
                invites.forEach(inv => top.appendChild(this._inviteCard(inv, uid, profile, list, err)));
            }
            const box = wrap.querySelector('.pid-players');
            famKids.forEach(({ m, ks }) => {
                if (!ks.length) return;
                const head = this._F('famOf', { name: m.ownerName || '?' }) + (m.role === 'view' ? ' · ' + PlatformI18n.t('famRoleView') : '');
                box.appendChild(this._mk('div', 'pid-fam-head', head));
                ks.forEach(k => {
                    const b = this._mk('button', 'pid-player' + (k.pid === active && activeOwner === m.ownerUid ? ' sel' : ''), null,
                        { type: 'button', 'data-owner': m.ownerUid, 'data-pid': k.pid });
                    b.appendChild(this._mk('span', 'pid-pav', k.avatar || '🙂'));
                    const info = this._mk('span', null, k.username || '');
                    info.appendChild(this._mk('small', null, '⭐ ' + (Number(k.totalPoints) || 0)));
                    b.appendChild(info);
                    b.onclick = () => switchTo(k.pid, m.ownerUid);
                    box.appendChild(b);
                });
            });
        };

        const form = () => {
            let avatar = this.AVATARS[1];
            wrap.innerHTML = `<div class="pid-modal" role="dialog" aria-modal="true" aria-labelledby="pid-title">
                <h2 id="pid-title">${t('kidTitle')}</h2>
                <p class="pid-help">${t('kidNote')}</p>
                <label for="pid-nick">${t('nick')}</label>
                <input id="pid-nick" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false">
                <p class="pid-help">${t('nickHelp')}</p>
                <div class="pid-label">${t('avatar')}</div>
                <div class="pid-avatars" role="radiogroup">${this.AVATARS.map(a => `<button type="button" role="radio" class="pid-av" aria-checked="false" data-a="${a}">${a}</button>`).join('')}</div>
                <p class="pid-error" id="pid-error" role="alert"></p>
                <div class="pid-actions">
                  <button type="button" class="pid-btn ghost" id="pid-back">${t('back')}</button>
                  <button type="button" class="pid-btn" id="pid-create">${t('create')}</button>
                </div></div>`;
            const sel = () => wrap.querySelectorAll('.pid-av').forEach(b => {
                b.classList.toggle('sel', b.dataset.a === avatar); b.setAttribute('aria-checked', String(b.dataset.a === avatar)); });
            sel();
            wrap.querySelector('.pid-avatars').onclick = e => { const b = e.target.closest('.pid-av'); if (b) { avatar = b.dataset.a; sel(); } };
            wrap.querySelector('#pid-back').onclick = list;
            wrap.querySelector('#pid-create').onclick = async () => {
                const err = m => { wrap.querySelector('#pid-error').textContent = m; };
                const nick = wrap.querySelector('#pid-nick').value;
                if (!this.isValidNickname(nick)) return err(t('invalid'));
                try { switchTo(await this.createPlayer(uid, nick, avatar), ''); }
                catch (e) { err(e.message === 'taken' ? t('taken') : e.message === 'invalid' ? t('invalid') : e.message === 'max' ? t('max') : t('error')); }
            };
            wrap.querySelector('#pid-nick').focus();
        };
        list();
    },

    // ── GDPR: access / portability ───────────────────────────────────────────

    async exportData(uid) {
        const db = GamesHubDB;
        const out = { exportedAt: new Date().toISOString(), uid };
        const u = await db.collection('users').doc(uid).get();
        out.profile = u.exists ? u.data() : null;
        out.games = {};
        const games = await db.collection('users').doc(uid).collection('games').get();
        games.forEach(d => { out.games[d.id] = d.data(); });
        out.players = [];
        const players = await db.collection('users').doc(uid).collection('players').get();
        for (const p of players.docs) {
            const pg = {};
            (await p.ref.collection('games').get()).forEach(d => { pg[d.id] = d.data(); });
            out.players.push({ id: p.id, profile: p.data(), games: pg });
        }
        return out;
    },

    // ── GDPR: erasure ────────────────────────────────────────────────────────

    /**
     * Deletes game data, leaderboard entries, nickname reservation, profile and
     * finally the authentication account. May ask to sign in again (Firebase
     * requires a recent login to delete an account).
     */
    async deleteAccount(uid) {
        const db = GamesHubDB;
        const userRef = db.collection('users').doc(uid);
        const prof = await userRef.get();
        for (const p of (await userRef.collection('players').get()).docs) await this.deletePlayer(uid, p.id);
        const games = await userRef.collection('games').get();
        for (const d of games.docs) {
            await db.collection('leaderboard').doc(d.id).collection('scores').doc(uid).delete().catch(() => {});
            await d.ref.delete();
        }
        const key = prof.exists && prof.data().nicknameKey;
        if (key) await db.collection('nicknames').doc(key).delete().catch(() => {});
        await userRef.delete();
        try { Object.keys(localStorage).filter(k => k.startsWith('games_hub_')).forEach(k => localStorage.removeItem(k)); } catch {}
        const cu = GamesHubAuth.currentUser;
        try {
            await cu.delete();
        } catch (e) {
            if (e.code === 'auth/requires-recent-login') {
                await cu.reauthenticateWithPopup(GoogleProvider);
                await cu.delete();
            } else { throw e; }
        }
    }
};
