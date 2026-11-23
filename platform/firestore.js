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

    _mergeStats(stats, gameResult) {
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
