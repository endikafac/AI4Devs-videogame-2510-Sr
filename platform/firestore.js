/**
 * Games Hub - Firestore Data Module
 * Handles all cloud data: user profiles, game stats, achievements, leaderboard.
 * Falls back to localStorage when Firebase is unavailable (guest / offline).
 */

const PlatformFirestore = {

    // ── XP / Level constants ─────────────────────────────────────────────────

    XP_THRESHOLDS: [0, 100, 300, 600, 1000, 1500, 2200, 3100, 4200, 5500, 7000],

    levelFromXP(xp) {
        const thresholds = this.XP_THRESHOLDS;
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (xp >= thresholds[i]) return i;
        }
        return 0;
    },

    xpToNextLevel(xp) {
        const level = this.levelFromXP(xp);
        const next = this.XP_THRESHOLDS[level + 1];
        return next ? next - xp : 0;
    },

    // ── Points calculation ───────────────────────────────────────────────────

    /**
     * Calculate points and XP earned from a game result.
     * @param {Object} result - { correctAnswers, totalQuestions, totalAttempts, bestStreak, elapsedSeconds, level }
     * @returns {{ points: number, xp: number }}
     */
    calculatePoints(result) {
        const { correctAnswers, totalQuestions, totalAttempts, bestStreak, elapsedSeconds, level = 1 } = result;

        // Base: 10 pts per correct answer
        const base = correctAnswers * 10;

        // Time bonus: target is 10 seconds per question; faster = more points
        const targetSeconds = totalQuestions * 10;
        const timeBonus = Math.max(0, targetSeconds - elapsedSeconds) * level;

        // Streak bonus: 5 pts per streak point
        const streakBonus = bestStreak * 5;

        // Accuracy bonus
        const accuracy = correctAnswers / Math.max(1, totalAttempts);
        const accuracyBonus = accuracy >= 1 ? 100 : accuracy >= 0.9 ? 50 : accuracy >= 0.75 ? 20 : 0;

        // Level multiplier: level 1 = ×1.0, level 10 = ×2.35
        const levelMult = 1 + (level - 1) * 0.15;

        const points = Math.round((base + timeBonus + streakBonus + accuracyBonus) * levelMult);
        const xp     = Math.round(points / 5);

        return { points, xp };
    },

    // ── Game ids ─────────────────────────────────────────────────────────────
    // Games and pages used different spellings (tableMaster / tablemaster).
    // Stored data uses the lowercase form for these two, so every entry point
    // goes through _gid() and both spellings reach the same document.
    _ID_ALIASES: { mathMaster: 'mathmaster', tableMaster: 'tablemaster', vocabMaster: 'vocabmaster' },
    _gid(id) { return this._ID_ALIASES[id] || id; },

    // ── Players (children under a guardian account) ──────────────────────────
    // users/{uid} is the account holder (adult, consent). Children are
    // users/{uid}/players/{pid}, each with their own nickname and statistics.
    // All stat functions go through _ref(uid), which follows the active player.

    _pid(uid) {
        try {
            const v = localStorage.getItem('games_hub_player_' + uid);
            return /^[a-z0-9]{6,20}$/.test(v || '') ? v : '';
        } catch (e) { return ''; }
    },
    setActivePlayer(uid, pid) {
        try { pid ? localStorage.setItem('games_hub_player_' + uid, pid) : localStorage.removeItem('games_hub_player_' + uid); } catch (e) {}
        if (!pid) this._setOwnerKey(uid, '');
    },

    // ── Family accounts (docs/cuenta-familiar.md) ────────────────────────────
    // Other adults can play with the children of an owner. The children stay
    // under users/{ownerUid}/players/{pid}; this device remembers which family
    // is active in games_hub_owner_{authUid}. The value is only trusted when it
    // is also a validated membership (cached in games_hub_mem_{authUid}) AND a
    // child is selected; otherwise everything silently falls back to the
    // user's own account. Security is enforced by the Firestore rules anyway.

    MAX_GUARDIANS: 6,
    INVITE_DAYS: 30,
    ROLES: ['edit', 'view'],

    /** Pure: which account holds the data? Orphan or missing membership => the user's own uid. */
    resolveOwner(uid, storedOwner, pid, memberships) {
        if (!uid || !pid || !storedOwner || storedOwner === uid) return uid;
        if (!/^[A-Za-z0-9]{6,128}$/.test(storedOwner)) return uid;
        const ok = Array.isArray(memberships) && memberships.some(m => m && m.ownerUid === storedOwner);
        return ok ? storedOwner : uid;
    },
    /** Pure: lowercase and trim an e-mail. */
    normEmail(e) { return typeof e === 'string' ? e.trim().toLowerCase() : ''; },
    /** Pure: same shape the Firestore rules accept for invitations. */
    isValidEmail(e) {
        const v = this.normEmail(e);
        return v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    },
    isRole(r) { return this.ROLES.includes(r); },
    /** Pure: is an invitation still usable? `expires` may be a Date, a millisecond number or a Firestore Timestamp. */
    isInviteActive(inv, now) {
        if (!inv || !this.isRole(inv.role) || !inv.ownerUid) return false;
        const e = inv.expires;
        const ms = e && typeof e.toMillis === 'function' ? e.toMillis() : (e instanceof Date ? e.getTime() : Number(e));
        return Number.isFinite(ms) && ms > (now == null ? Date.now() : now);
    },

    _ownerKey(uid) { return 'games_hub_owner_' + uid; },
    _setOwnerKey(uid, owner) {
        try { owner && owner !== uid ? localStorage.setItem(this._ownerKey(uid), owner) : localStorage.removeItem(this._ownerKey(uid)); } catch (e) {}
    },
    _storedOwner(uid) {
        try { return localStorage.getItem(this._ownerKey(uid)) || ''; } catch (e) { return ''; }
    },
    _memCache(uid) {
        try {
            const v = JSON.parse(localStorage.getItem('games_hub_mem_' + uid) || '[]');
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    },
    _setMemCache(uid, list) {
        try { localStorage.setItem('games_hub_mem_' + uid, JSON.stringify(list.map(m => ({ ownerUid: m.ownerUid, ownerName: m.ownerName || '', role: m.role })))); } catch (e) {}
    },
    /** Account that holds the active child's data: the family owner, or uid itself. */
    _owner(uid) {
        return this.resolveOwner(uid, this._storedOwner(uid), this._pid(uid), this._memCache(uid));
    },
    /** True when the active child belongs to a family where this user may only look. */
    _viewOnly(uid) {
        const o = this._owner(uid);
        if (o === uid) return false;
        const m = this._memCache(uid).find(x => x.ownerUid === o);
        return !m || m.role !== 'edit';
    },
    _ref(uid) {
        const u = GamesHubDB.collection('users').doc(this._owner(uid));
        const pid = this._pid(uid);
        return pid ? u.collection('players').doc(pid) : u;
    },
    _lbId(uid) { const pid = this._pid(uid); return pid ? this._owner(uid) + '_' + pid : uid; },
    async listPlayers(uid, ownerUid) {
        if (!window.GamesHubDB) return [];
        const snap = await GamesHubDB.collection('users').doc(ownerUid || uid).collection('players').get();
        return snap.docs.map(d => ({ pid: d.id, ...d.data() }));
    },
    /** Profile of the active child, or null when the adult plays. */
    async getActivePlayer(uid) {
        const pid = this._pid(uid);
        if (!pid || !window.GamesHubDB) return null;
        if (this._storedOwner(uid)) await this._validateOwner(uid);
        const owner = this._owner(uid);
        const snap = await GamesHubDB.collection('users').doc(owner).collection('players').doc(pid).get();
        if (!snap.exists) { this.setActivePlayer(uid, ''); return null; }
        const out = { pid, ...snap.data() };
        if (owner !== uid) { out.ownerUid = owner; out.familyRole = (this._memCache(uid).find(m => m.ownerUid === owner) || {}).role; }
        return out;
    },

    _authUser() {
        return window.GamesHubAuth && GamesHubAuth.currentUser ? GamesHubAuth.currentUser : null;
    },
    _needDB() {
        if (!window.GamesHubDB || typeof firebase === 'undefined') throw new Error('offline');
    },
    /** Checks the stored active family against the owner's guardians doc; cleans an orphan silently. */
    async _validateOwner(uid) {
        const owner = this._storedOwner(uid);
        if (!owner || owner === uid) return;
        try {
            const g = await GamesHubDB.collection('users').doc(owner).collection('guardians').doc(uid).get();
            if (g.exists) {
                const cache = this._memCache(uid).filter(m => m.ownerUid !== owner);
                const old = this._memCache(uid).find(m => m.ownerUid === owner);
                cache.push({ ownerUid: owner, ownerName: old ? old.ownerName : '', role: g.data().role });
                this._setMemCache(uid, cache);
            } else {
                await this._dropMembership(uid, owner);
            }
        } catch (e) {
            // Network or permission error: do not trust the stored family.
            this._setOwnerKey(uid, '');
            try { localStorage.removeItem('games_hub_player_' + uid); } catch (e2) {}
        }
    },
    async _dropMembership(uid, owner) {
        this._setMemCache(uid, this._memCache(uid).filter(m => m.ownerUid !== owner));
        if (this._storedOwner(uid) === owner) {
            this._setOwnerKey(uid, '');
            try { localStorage.removeItem('games_hub_player_' + uid); } catch (e) {}
        }
        try { await GamesHubDB.collection('users').doc(uid).collection('memberships').doc(owner).delete(); } catch (e) {}
    },

    /** Families this user belongs to (orphans are removed). [] offline. */
    async listMemberships(uid) {
        if (!window.GamesHubDB || !uid) return [];
        const snap = await GamesHubDB.collection('users').doc(uid).collection('memberships').get();
        const valid = [];
        for (const d of snap.docs) {
            const m = d.data();
            if (!m || m.ownerUid !== d.id || !this.isRole(m.role)) continue;
            let g = null;
            try { g = await GamesHubDB.collection('users').doc(d.id).collection('guardians').doc(uid).get(); } catch (e) { continue; }
            if (g.exists) valid.push({ ownerUid: d.id, ownerName: String(m.ownerName || ''), role: g.data().role });
            else await this._dropMembership(uid, d.id);
        }
        this._setMemCache(uid, valid);
        return valid;
    },
    /** Choose whose children play on this device ('' or own uid = own account). Throws 'not-member' if not a member. */
    async setActiveFamily(uid, ownerUid) {
        if (!ownerUid || ownerUid === uid) { this._setOwnerKey(uid, ''); return; }
        if (!/^[A-Za-z0-9]{6,128}$/.test(ownerUid)) throw new Error('not-member');
        this._needDB();
        const mem = await this.listMemberships(uid);
        if (!mem.some(m => m.ownerUid === ownerUid)) throw new Error('not-member');
        this._setOwnerKey(uid, ownerUid);
    },

    /** Owner: create an invitation. Nothing is e-mailed; the owner shares the site link by hand. Returns the invite id. */
    async createInvite(ownerUid, email, role, ownerName) {
        this._needDB();
        const mail = this.normEmail(email);
        if (!this.isValidEmail(mail) || !this.isRole(role) || !ownerUid) throw new Error('invalid');
        const me = this._authUser();
        if (me && me.email && this.normEmail(me.email) === mail) throw new Error('self');
        const [guardians, sent] = await Promise.all([this.listGuardians(ownerUid), this.listSentInvites(ownerUid)]);
        if (guardians.some(g => this.normEmail(g.email) === mail)) throw new Error('duplicate');
        if (guardians.length + sent.length >= this.MAX_GUARDIANS) throw new Error('max');
        const TS = firebase.firestore.Timestamp;
        const ref = await GamesHubDB.collection('invites').add({
            ownerUid,
            ownerName: String(ownerName || '').slice(0, 40),
            email: mail,
            role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires: TS.fromMillis(Date.now() + this.INVITE_DAYS * 86400000)
        });
        return ref.id;
    },
    /** Owner: invitations still pending. */
    async listSentInvites(ownerUid) {
        if (!window.GamesHubDB || !ownerUid) return [];
        const snap = await GamesHubDB.collection('invites').where('ownerUid', '==', ownerUid).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => this.isInviteActive(i));
    },
    /** Invitations addressed to the verified e-mail of the signed in user. [] offline or unverified. */
    async listMyInvites() {
        const me = this._authUser();
        if (!window.GamesHubDB || !me || !me.email || !me.emailVerified) return [];
        const snap = await GamesHubDB.collection('invites').where('email', '==', this.normEmail(me.email)).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.ownerUid !== me.uid && this.isInviteActive(i));
    },
    /** Guest: accept an invitation (guardian doc + membership + delete the invitation, atomically). */
    async acceptInvite(invite, myName) {
        this._needDB();
        const me = this._authUser();
        if (!me || !invite || !invite.id || !this.isInviteActive(invite) || invite.ownerUid === me.uid) throw new Error('invalid');
        const SV = firebase.firestore.FieldValue.serverTimestamp();
        const db = GamesHubDB;
        const b = db.batch();
        b.set(db.collection('users').doc(invite.ownerUid).collection('guardians').doc(me.uid), {
            uid: me.uid, email: this.normEmail(me.email), name: String(myName || '').slice(0, 40),
            role: invite.role, since: SV, inviteId: invite.id
        });
        b.set(db.collection('users').doc(me.uid).collection('memberships').doc(invite.ownerUid), {
            ownerUid: invite.ownerUid, ownerName: String(invite.ownerName || '').slice(0, 40), role: invite.role, since: SV
        });
        b.delete(db.collection('invites').doc(invite.id));
        await b.commit();
        this._setMemCache(me.uid, this._memCache(me.uid).filter(m => m.ownerUid !== invite.ownerUid)
            .concat([{ ownerUid: invite.ownerUid, ownerName: invite.ownerName || '', role: invite.role }]));
    },
    /** Delete an invitation (guest declines, or owner cancels). */
    async declineInvite(id) {
        this._needDB();
        if (!id) throw new Error('invalid');
        await GamesHubDB.collection('invites').doc(id).delete();
    },
    async listGuardians(ownerUid) {
        if (!window.GamesHubDB || !ownerUid) return [];
        const snap = await GamesHubDB.collection('users').doc(ownerUid).collection('guardians').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    /** Owner: revoke access. The guest's membership is cleaned by their app when it notices. */
    async removeGuardian(ownerUid, guardianUid) {
        this._needDB();
        if (!ownerUid || !guardianUid) throw new Error('invalid');
        await GamesHubDB.collection('users').doc(ownerUid).collection('guardians').doc(guardianUid).delete();
    },
    /** Guest: leave a family. */
    async leaveFamily(ownerUid) {
        this._needDB();
        const me = this._authUser();
        if (!me || !ownerUid) throw new Error('invalid');
        const db = GamesHubDB;
        const b = db.batch();
        b.delete(db.collection('users').doc(ownerUid).collection('guardians').doc(me.uid));
        b.delete(db.collection('users').doc(me.uid).collection('memberships').doc(ownerUid));
        await b.commit();
        this._setMemCache(me.uid, this._memCache(me.uid).filter(m => m.ownerUid !== ownerUid));
        if (this._storedOwner(me.uid) === ownerUid) this.setActivePlayer(me.uid, '');
    },

    // ── Profile PIN (convenience lock between profiles) ─────────────────────
    // A child profile can have an optional 4-digit PIN. It only asks "is this the
    // right person at this device?" when switching profile. It is NOT account
    // security: 4 digits can be brute forced offline by anyone who can read the
    // player document, so the UI says so. Only a salted PBKDF2 hash is stored in
    // users/{owner}/players/{pid}.pin, never the PIN itself.

    PIN_ITER: 100000,
    PIN_MAX_FAILS: 5,
    PIN_LOCK_MS: 30000,

    /** Pure: exactly four digits. */
    isValidPin(p) { return typeof p === 'string' && /^[0-9]{4}$/.test(p); },
    /** Pure: does this player document carry a well formed PIN record? */
    hasPin(kid) {
        const r = kid && kid.pin;
        return !!(r && typeof r === 'object' && typeof r.salt === 'string' && typeof r.hash === 'string' && r.salt && r.hash);
    },
    _b64(bytes) { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); },
    _unb64(str) { const s = atob(str); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
    async _derive(pin, salt, iter) {
        const subtle = (typeof crypto !== 'undefined' && crypto.subtle) || null;
        if (!subtle) throw new Error('no-crypto');
        const key = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
        return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
    },
    /** Salted hash record for a PIN (random 16 byte salt). Throws 'invalid' for a bad PIN. */
    async hashPin(pin) {
        if (!this.isValidPin(pin)) throw new Error('invalid');
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const hash = await this._derive(pin, salt, this.PIN_ITER);
        return { v: 1, alg: 'PBKDF2-SHA256', iter: this.PIN_ITER, salt: this._b64(salt), hash: this._b64(hash) };
    },
    /** True when pin matches the record. Malformed records and bad input never match. */
    async verifyPin(pin, rec) {
        if (!this.isValidPin(pin) || !this.hasPin({ pin: rec })) return false;
        const iter = Number(rec.iter);
        if (!Number.isInteger(iter) || iter < 1000 || iter > 1000000) return false;
        try {
            const got = await this._derive(pin, this._unb64(rec.salt), iter);
            const want = this._unb64(rec.hash);
            if (got.length !== want.length) return false;
            let diff = 0;
            for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
            return diff === 0;
        } catch (e) { return false; }
    },

    /** Pure: normalise a stored lock state. */
    _lockNorm(s) {
        const fails = s && Number.isFinite(Number(s.fails)) ? Math.max(0, Math.min(this.PIN_MAX_FAILS, Math.floor(Number(s.fails)))) : 0;
        const until = s && Number.isFinite(Number(s.until)) ? Math.max(0, Number(s.until)) : 0;
        return { fails, until };
    },
    /** Pure: is the profile locked right now? waitSec is rounded up. */
    pinLockStatus(state, now) {
        const s = this._lockNorm(state);
        const t = now == null ? Date.now() : now;
        const locked = s.until > t;
        return { locked, waitSec: locked ? Math.ceil((s.until - t) / 1000) : 0, left: this.PIN_MAX_FAILS - s.fails };
    },
    /** Pure: next state after an attempt. The 5th wrong try locks for PIN_LOCK_MS and starts a fresh count. */
    pinLockNext(state, ok, now) {
        if (ok) return { fails: 0, until: 0 };
        const s = this._lockNorm(state);
        const t = now == null ? Date.now() : now;
        if (s.until > t) return s;
        const fails = s.fails + 1;
        return fails >= this.PIN_MAX_FAILS ? { fails: 0, until: t + this.PIN_LOCK_MS } : { fails, until: 0 };
    },
    _lockKey(uid, owner, pid) { return 'games_hub_pinlock_' + [uid, owner || uid, pid].join('_'); },
    _lockLoad(key) { try { return this._lockNorm(JSON.parse(localStorage.getItem(key) || 'null')); } catch (e) { return this._lockNorm(null); } },
    _lockSave(key, st) { try { st.fails || st.until ? localStorage.setItem(key, JSON.stringify(st)) : localStorage.removeItem(key); } catch (e) {} },
    /** Current lock status for a profile on this device. */
    pinStatus(uid, owner, pid, now) { return this.pinLockStatus(this._lockLoad(this._lockKey(uid, owner, pid)), now); },
    /**
     * Check a PIN with the rate limit (5 wrong tries, then 30 s wait, kept on this device).
     * Returns { ok, locked, waitSec, left }.
     */
    async tryPin(uid, owner, pid, pin, rec, now) {
        const key = this._lockKey(uid, owner, pid);
        const t = now == null ? Date.now() : now;
        const before = this._lockLoad(key);
        const st0 = this.pinLockStatus(before, t);
        if (st0.locked) return { ok: false, locked: true, waitSec: st0.waitSec, left: 0 };
        const ok = await this.verifyPin(pin, rec);
        const next = this.pinLockNext(before, ok, t);
        this._lockSave(key, next);
        const st = this.pinLockStatus(next, t);
        return { ok, locked: st.locked, waitSec: st.waitSec, left: st.locked ? 0 : st.left };
    },
    /** Owner or edit guardian: set or change the PIN of a child. Rules refuse it for view guardians. */
    async setChildPin(ownerUid, pid, pin) {
        this._needDB();
        if (!ownerUid || !/^[a-z0-9]{6,20}$/.test(pid || '')) throw new Error('invalid');
        const rec = await this.hashPin(pin);
        await GamesHubDB.collection('users').doc(ownerUid).collection('players').doc(pid).update({ pin: rec });
    },
    /** Owner or edit guardian: remove (reset) the PIN of a child. */
    async clearChildPin(ownerUid, pid) {
        this._needDB();
        if (!ownerUid || !/^[a-z0-9]{6,20}$/.test(pid || '')) throw new Error('invalid');
        await GamesHubDB.collection('users').doc(ownerUid).collection('players').doc(pid).update({ pin: firebase.firestore.FieldValue.delete() });
    },

    // ── Interests of a child ("Que te gusta?", platform/interests.js) ───────
    // players/{pid}.interests: array of up to 5 ids of a fixed list (checked by firestore.rules validInterests).
    // A local copy (games_hub_interests_*) serves guests and offline use. Owner and edit guardians can write.

    /** Pure: the valid ids of a list (unknown ids dropped, no repeats, at most 5). Same list as platform/interests.js. */
    cleanInterests(list) {
        return (typeof PlatformInterests !== 'undefined') ? PlatformInterests.sanitize(list) : [];
    },
    /** Owner or edit guardian: saves the interests of a child. An empty list removes the field. Rules refuse view guardians. */
    async setChildInterests(ownerUid, pid, list) {
        this._needDB();
        if (!ownerUid || !/^[a-z0-9]{6,20}$/.test(pid || '')) throw new Error('invalid');
        const clean = this.cleanInterests(list);
        await GamesHubDB.collection('users').doc(ownerUid).collection('players').doc(pid)
            .update({ interests: clean.length ? clean : firebase.firestore.FieldValue.delete() });
        return clean;
    },

    // ── User profile ─────────────────────────────────────────────────────────

    async getOrCreateProfile(uid, authUser, opts) {
        if (!window.GamesHubDB) return this._localProfile(authUser);
        if (!(opts && opts.account)) {
            const kid = await this.getActivePlayer(uid).catch(() => null);
            if (kid) return { ...kid, uid };
        }
        const ref = GamesHubDB.collection('users').doc(uid);
        const snap = await ref.get();
        if (snap.exists) {
            await ref.update({ lastLogin: new Date().toISOString() });
            return snap.data();
        }
        const profile = {
            uid,
            username:    '',      // nickname is chosen by the guardian (see identity.js)
            photoURL:    null,    // never store the Google photo
            createdAt:   new Date().toISOString(),
            lastLogin:   new Date().toISOString(),
            xp:          0,
            totalPoints: 0,
            level:       0,
            settings: {
                soundEnabled:  true,
                sfxVolume:     0.8,
                ttsEnabled:    false,
                highContrast:  false,
                language:      localStorage.getItem('games_hub_language') || 'es-ES'
            }
        };
        await ref.set(profile);
        return profile;
    },

    async updateSettings(uid, settings) {
        if (!window.GamesHubDB) {
            this._localSave('profile', { ...this._localLoad('profile'), settings });
            return;
        }
        await GamesHubDB.collection('users').doc(uid).update({ settings });
    },

    // ── Game statistics (per game namespace) ─────────────────────────────────

    async getGameStats(uid, gameId) {
        gameId = this._gid(gameId);
        if (!window.GamesHubDB) return this._localLoad(`stats_${gameId}`) || this._defaultStats();
        const snap = await this._ref(uid).collection('games').doc(gameId).get();
        return snap.exists ? snap.data() : this._defaultStats();
    },

    async updateGameStats(uid, gameId, gameResult) {
        gameId = this._gid(gameId);
        const points = this.calculatePoints(gameResult);
        gameResult.points = points.points;
        gameResult.xp     = points.xp;

        if (!window.GamesHubDB) {
            const stats = this._localLoad(`stats_${gameId}`) || this._defaultStats();
            this._mergeStats(stats, gameResult);
            this._localSave(`stats_${gameId}`, stats);
            return { stats, points };
        }

        const me = this._ref(uid);
        const ref = me.collection('games').doc(gameId);
        const snap = await ref.get();
        const stats = snap.exists ? snap.data() : this._defaultStats();
        this._mergeStats(stats, gameResult);
        // Family role 'view': look but do not save (the rules would refuse anyway).
        if (this._viewOnly(uid)) return { stats, points };
        await ref.set(stats);

        // Update global XP and points on user profile
        await me.update({
            xp:          firebase.firestore.FieldValue.increment(points.xp),
            totalPoints: firebase.firestore.FieldValue.increment(points.points),
            level:       this.levelFromXP((await me.get()).data().xp + points.xp)
        });

        // Update leaderboard
        await this._updateLeaderboard(uid, gameId, points.points).catch(() => {});

        return { stats, points };
    },

    // ── Achievements ─────────────────────────────────────────────────────────

    async getAchievements(uid, gameId) {
        gameId = this._gid(gameId);
        if (!window.GamesHubDB) {
            return this._localLoad(`achievements_${gameId}`) || { unlockedAchievements: [] };
        }
        const snap = await this._ref(uid).collection('games').doc(gameId).get();
        return { unlockedAchievements: snap.data()?.unlockedAchievements || [] };
    },

    async unlockAchievement(uid, gameId, achievementId) {
        gameId = this._gid(gameId);
        if (!window.GamesHubDB) {
            const data = this._localLoad(`achievements_${gameId}`) || { unlockedAchievements: [] };
            if (!data.unlockedAchievements.includes(achievementId)) {
                data.unlockedAchievements.push(achievementId);
                this._localSave(`achievements_${gameId}`, data);
            }
            return true;
        }
        if (this._viewOnly(uid)) return true;
        const ref = this._ref(uid).collection('games').doc(gameId);
        await ref.set({
            unlockedAchievements: firebase.firestore.FieldValue.arrayUnion(achievementId)
        }, { merge: true });
        return true;
    },

    // ── Leaderboard ───────────────────────────────────────────────────────────

    async getLeaderboard(gameId, limit = 10) {
        gameId = this._gid(gameId);
        if (!window.GamesHubDB) return [];
        const snap = await GamesHubDB.collection('leaderboard').doc(gameId)
            .collection('scores')
            .orderBy('totalPoints', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map(d => d.data());
    },

    async _updateLeaderboard(uid, gameId, newPoints) {
        const userSnap = await this._ref(uid).get();
        const user     = userSnap.data();
        await GamesHubDB.collection('leaderboard').doc(gameId)
            .collection('scores').doc(this._lbId(uid)).set({
                uid: this._owner(uid), // the account that owns the child (a guardian writes under the owner uid)
                username:    user.username,
                avatar:      user.avatar || null,
                photoURL:    null,
                totalPoints: user.totalPoints, // already includes newPoints (profile was incremented before)
                xp:          user.xp,
                level:       user.level,
                updatedAt:   new Date().toISOString()
            });
    },

    // ── Helpers ───────────────────────────────────────────────────────────────

    _defaultStats() {
        return {
            totalGames:    0,
            totalCorrect:  0,
            totalAttempts: 0,
            bestStreak:    0,
            totalTime:     0,
            unlockedAchievements: [],
            byOperation: {
                suma:           { games: 0, correct: 0 },
                resta:          { games: 0, correct: 0 },
                multiplicacion: { games: 0, correct: 0 },
                division:       { games: 0, correct: 0 },
                tablas:         { games: 0, correct: 0 }
            },
            byLevel: {}
        };
    },

    // ── Daily summary (progress panel, platform/progress-panel.js) ───────────
    // stats.daily maps a local day 'YYYY-MM-DD' to { games, items, minutes, ok }:
    // sessions played, answers given, minutes played and correct answers that day.
    // It lets an adult see how often a child plays without reading anything else.
    // Only the last DAILY_KEEP days are kept (firestore.rules caps the map at 62).

    DAILY_KEEP: 60,

    /** Pure: local calendar day 'YYYY-MM-DD' of a timestamp (default: now). */
    dayKey(ms) {
        const d = new Date(ms == null ? Date.now() : ms);
        const p = n => (n < 10 ? '0' : '') + n;
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    },
    /** Pure: adds one finished game to stats.daily (creates it when missing) and prunes old days. Never throws. */
    _addDaily(stats, gameResult, now) {
        const num = (v, max) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0; };
        if (!stats.daily || typeof stats.daily !== 'object' || Array.isArray(stats.daily)) stats.daily = {};
        const k = this.dayKey(now);
        const e = stats.daily[k] && typeof stats.daily[k] === 'object' ? stats.daily[k] : {};
        const items = num(gameResult.totalAttempts, 10000) || num(gameResult.totalQuestions, 10000);
        stats.daily[k] = {
            games:   (Number(e.games) || 0) + 1,
            items:   (Number(e.items) || 0) + Math.round(items),
            minutes: Math.round(((Number(e.minutes) || 0) + num(gameResult.elapsedSeconds, 14400) / 60) * 10) / 10,
            ok:      (Number(e.ok) || 0) + Math.round(Math.min(num(gameResult.correctAnswers, 10000), items))
        };
        const days = Object.keys(stats.daily).sort();
        while (days.length > this.DAILY_KEEP) delete stats.daily[days.shift()];
    },

    _mergeStats(stats, gameResult) {
        this._addDaily(stats, gameResult);
        // Typing games report words per minute: keep the best and the last one (progress panel).
        const wpm = Number(gameResult.wpm);
        if (Number.isFinite(wpm) && wpm >= 0 && wpm <= 400) { stats.lastWpm = Math.round(wpm); stats.bestWpm = Math.max(Number(stats.bestWpm) || 0, Math.round(wpm)); }
        stats.totalGames++;
        stats.totalCorrect  += gameResult.correctAnswers;
        stats.totalAttempts += gameResult.totalAttempts;
        stats.totalTime     += gameResult.elapsedSeconds;
        if (gameResult.bestStreak > stats.bestStreak) stats.bestStreak = gameResult.bestStreak;

        const op = gameResult.operation;
        if (!stats.byOperation[op]) stats.byOperation[op] = { games: 0, correct: 0 };
        stats.byOperation[op].games++;
        stats.byOperation[op].correct += gameResult.correctAnswers;

        const lk = `level_${gameResult.level}`;
        if (!stats.byLevel[lk]) stats.byLevel[lk] = { games: 0, bestTime: Infinity };
        stats.byLevel[lk].games++;
        if (gameResult.elapsedSeconds < stats.byLevel[lk].bestTime) {
            stats.byLevel[lk].bestTime = gameResult.elapsedSeconds;
        }

        if (gameResult.unlockedAchievements?.length) {
            stats.unlockedAchievements = [
                ...new Set([...stats.unlockedAchievements, ...gameResult.unlockedAchievements])
            ];
        }
    },

    _localProfile(authUser) {
        return {
            uid:         'guest',
            username:    authUser?.username || PlatformI18n.t('guest'),
            photoURL:    null,
            createdAt:   new Date().toISOString(),
            lastLogin:   new Date().toISOString(),
            xp:          0,
            totalPoints: 0,
            level:       0,
            settings:    { soundEnabled: true, sfxVolume: 0.8, ttsEnabled: false, highContrast: false }
        };
    },

    _localLoad(key) {
        try {
            const raw = localStorage.getItem(`games_hub_${key}`);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },

    _localSave(key, data) {
        try { localStorage.setItem(`games_hub_${key}`, JSON.stringify(data)); } catch {}
    }
};

// Optional open source backend (docs/backend-opensource.md). With GamesHubBackend.backend 'firebase' (the default) or when
// backend-pg.js is not loaded, this does nothing and the Firestore code above is what runs.
if (typeof PlatformBackendPg !== 'undefined' && PlatformBackendPg.isActive()) PlatformBackendPg.installFirestore(PlatformFirestore);
