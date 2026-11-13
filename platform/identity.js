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
            error: 'No se pudo guardar. Inténtalo de nuevo.'
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
            error: 'Could not save. Please try again.'
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
            error: 'Ezin izan da gorde. Saiatu berriro.'
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

    // ── GDPR: access / portability ───────────────────────────────────────────

    async exportData(uid) {
        const db = GamesHubDB;
        const out = { exportedAt: new Date().toISOString(), uid };
        const u = await db.collection('users').doc(uid).get();
        out.profile = u.exists ? u.data() : null;
        out.games = {};
        const games = await db.collection('users').doc(uid).collection('games').get();
        games.forEach(d => { out.games[d.id] = d.data(); });
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
