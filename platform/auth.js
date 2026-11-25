/**
 * Games Hub - Authentication Module
 * Handles Google Sign-In, sign-out, and auth state management.
 * Falls back gracefully when Firebase is not configured.
 */

const PlatformAuth = {
    currentUser: null,
    _listeners: [],

    /**
     * Initialize auth module and start listening for state changes.
     */
    init() {
        if (!window.GamesHubAuth) {
            console.warn('[Auth] Firebase not configured. Running in local mode.');
            return;
        }
        GamesHubAuth.getRedirectResult().catch(err => console.warn('[Auth] redirect result:', err && err.code));
        GamesHubAuth.onAuthStateChanged(firebaseUser => {
            this._handleAuthChange(firebaseUser);
        });
    },

    /**
     * Sign in with Google popup.
     * @returns {Promise<Object>} Normalized user object
     */
    async signInWithGoogle() {
        if (!window.GamesHubAuth || !window.GoogleProvider) {
            throw new Error('Firebase not configured');
        }
        try {
            const result = await GamesHubAuth.signInWithPopup(GoogleProvider);
            return this._normalize(result.user);
        } catch (err) {
            // Phones and in-app browsers often block popups: use the redirect flow instead.
            if (err && (err.code === 'auth/popup-blocked' ||
                        err.code === 'auth/operation-not-supported-in-this-environment')) {
                await GamesHubAuth.signInWithRedirect(GoogleProvider);
                return null;
            }
            console.error('[Auth] Google sign-in error:', err);
            throw err;
        }
    },

    /**
     * Sign out from Firebase.
     */
    async signOut() {
        if (window.GamesHubAuth) {
            await GamesHubAuth.signOut();
        }
        this.currentUser = null;
        this._notifyListeners(null);
    },

    /**
     * Register a callback for auth state changes.
     * @param {Function} cb - Called with (user | null)
     */
    onAuthStateChanged(cb) {
        this._listeners.push(cb);
        // Fire immediately with current state
        cb(this.currentUser);
    },

    // ─── Private ─────────────────────────────────────────────────────────────

    _handleAuthChange(firebaseUser) {
        this.currentUser = firebaseUser ? this._normalize(firebaseUser) : null;
        this._notifyListeners(this.currentUser);
    },

    _notifyListeners(user) {
        this._listeners.forEach(fn => {
            try { fn(user); } catch (e) { console.error('[Auth] Listener error:', e); }
        });
    },

    /**
     * Normalize a Firebase user object to our internal format.
     */
    _normalize(firebaseUser) {
        return {
            odId:        firebaseUser.uid,
            uid:         firebaseUser.uid,
            username:    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player',
            email:       firebaseUser.email || '',
            photoURL:    firebaseUser.photoURL || null,
            createdAt:   firebaseUser.metadata?.creationTime || new Date().toISOString(),
            lastLogin:   firebaseUser.metadata?.lastSignInTime || new Date().toISOString()
        };
    }
};

// A top-level const is not a window property: expose it so games can hook the session (window.PlatformAuth).
if (typeof window !== 'undefined') window.PlatformAuth = PlatformAuth;

// Optional open source backend (docs/backend-opensource.md). With GamesHubBackend.backend 'firebase' (the default) or when
// backend-pg.js is not loaded, this does nothing and the Firebase code above is what runs.
if (typeof PlatformBackendPg !== 'undefined' && PlatformBackendPg.isActive()) PlatformBackendPg.installAuth(PlatformAuth);

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => PlatformAuth.init());
