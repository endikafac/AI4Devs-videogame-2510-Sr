/**
 * Games Hub - Backend selection
 *
 * Which backend stores accounts and data:
 *   'firebase'  Firebase Auth + Firestore (default, what runs in production today)
 *   'neon'      open source stack: Neon Postgres + Neon Auth (Better Auth) + Neon
 *               Data API with Row Level Security (db/gameshub, docs/backend-opensource.md)
 *
 * HOW TO SWITCH (full procedure and rollback in docs/backend-opensource.md):
 *   1. Run the migrations in db/gameshub and enable the Data API and Neon Auth.
 *   2. Fill in `neon.authBaseUrl` and `neon.dataApiUrl` below. Both are public
 *      URLs, not secrets: what protects the data is the user's JWT and RLS.
 *      NEVER put a database connection string or any password here.
 *   3. Change `backend` to 'neon'.
 *   4. Load platform/backend-config.js and platform/backend-pg.js BEFORE
 *      platform/auth.js in the pages, and add the two Neon hosts to
 *      connect-src in firebase.json (see the doc).
 * To go back, set `backend` to 'firebase'. Nothing else is needed.
 *
 * If 'neon' is chosen but a URL is missing, the app logs an error and keeps
 * using Firebase, so a half done switch never leaves the site without a backend.
 *
 * For development only: on localhost, localStorage.games_hub_backend = 'neon'
 * (or 'firebase') overrides `backend` without editing this file.
 */
(function (root) {
    'use strict';
    var config = {
        backend: 'firebase',
        neon: {
            // Base URL of Neon Auth (Better Auth), e.g. https://ep-xxx.neonauth.eu-central-1.aws.neon.tech/neondb/auth
            authBaseUrl: '',
            // Base URL of the Neon Data API (PostgREST), e.g. https://ep-xxx.apirest.eu-central-1.aws.neon.tech/neondb/rest/v1
            dataApiUrl: '',
            // Postgres schema of Games Hub (PolyGo lives in `public`)
            schema: 'gameshub'
        }
    };
    try {
        var host = root.location && root.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            var o = root.localStorage.getItem('games_hub_backend');
            if (o === 'neon' || o === 'firebase') config.backend = o;
        }
    } catch (e) { /* storage blocked: keep the default */ }
    root.GamesHubBackend = config;
    if (typeof module === 'object' && module.exports) module.exports = config;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
