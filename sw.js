/**
 * Games Hub — Service Worker
 * Strategy: stale-while-revalidate for pages, code and data (instant opens, refreshed in the background),
 * cache-first for fonts and images. A new CACHE_VERSION drops every old copy
 * Version: bump CACHE_VERSION to force cache refresh after deploys
 */

const CACHE_VERSION = 'v1.26.0';
const STATIC_CACHE  = `games-hub-static-${CACHE_VERSION}`;
const PAGE_CACHE    = `games-hub-pages-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/platform/platform.css',
    '/fonts/fonts.css',
    '/platform/i18n-platform.js',
    '/platform/platform-header.js',
    '/platform/nav.js',
    '/platform/profiles.js',
    '/platform/interests.js',
    '/platform/juice.js',
    '/platform/identity.js',
    '/platform/pwa.js',
    '/offline.html',
];

// HTML pages to cache on first visit (not pre-cached to keep install fast)
const PAGE_ORIGINS = self.location.origin;

// ── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== STATIC_CACHE && k !== PAGE_CACHE)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests; skip Firebase / Google APIs
    if (url.origin !== PAGE_ORIGINS) return;
    // Skip non-GET
    if (request.method !== 'GET') return;
    // Never cache the worker itself or live endpoints
    if (url.pathname === '/sw.js' || url.pathname.startsWith('/__/')) return;

    const isHTML = request.destination === 'document' ||
                   url.pathname.endsWith('.html') ||
                   url.pathname === '/' ||
                   url.pathname.endsWith('/');

    if (isHTML) event.respondWith(staleWhileRevalidate(event, PAGE_CACHE, true));
    else if (/.(js|css|json)$/.test(url.pathname)) event.respondWith(staleWhileRevalidate(event, STATIC_CACHE, false));
    else event.respondWith(cacheFirstStatic(request));
});

// ── Strategies ─────────────────────────────────────────────────

// Answer from cache at once, refresh the copy in the background (conditional request, so cheap).
// First visit after a deploy: the new worker starts with empty caches, so it goes to the network.
async function staleWhileRevalidate(event, cacheName, isPage) {
    const request = event.request;
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const refresh = fetch(isPage ? request.url : request, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => { if (res && res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => null);
    if (cached) { event.waitUntil(refresh); return cached; }
    const res = await refresh;
    if (res) return res;
    if (isPage) {
        const off = await caches.match('/offline.html'); if (off && request.mode === 'navigate') return off;
        const fallback = await caches.match('/index.html');
        return fallback || new Response('<h1>Offline</h1><p>Conéctate a Internet para jugar.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response('', { status: 503 });
}

async function cacheFirstStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('', { status: 503 });
    }
}
