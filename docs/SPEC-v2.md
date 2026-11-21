# Games Hub v2: specification and test plan

Date: 2026-11-21. Scope: unify the shell across all games, 6 UI languages, privacy-first usage analytics, quality gates.
Out of scope (moves to PolyGo, see `PolyGo/docs/14-...`): language-learning content (vocabulary by course, Basque nor-nori-nork, irregular verbs). Games Hub keeps `euskera-EFC`, `englishVerbs-EFC` and VocabMaster until PolyGo replaces them, then they become link tiles.

## 1. Requirements

| ID | Requirement | Test |
|---|---|---|
| UI-1 | Every game page (incl. periodic table es/eu pages and arkanoid) shows the common top bar: who is playing (guest or user), profile access, language, theme | F-HEADER |
| UI-2 | Language selector offers ES, EN, EU, GL, CA, FR. The choice persists and changes the shell texts. Games without a translation fall back to Spanish, never show keys | F-LANG, U-I18N |
| UI-3 | No horizontal scroll at 360 px and 390 px on any page | F-OVERFLOW |
| UI-4 | No console errors when a page loads | F-CONSOLE |
| UI-5 | Touch targets of the bar are at least 44 px | F-TARGET |
| UI-6 | Periodic table: platform language EU opens `/eu/`, others open `/es/` | F-PT-LANG |
| AN-1 | Anonymous usage analytics: visits, unique visitors per day, hour, game opened, language, guest vs logged in | B-EVENT, F-EVENT |
| AN-2 | No identifier, cookie, IP or user id in analytics events. "Unique" is a per-device flag in localStorage that sends only `first: true` once per day | B-EVENT-FIELDS, U-ANALYTICS |
| AN-3 | Only an admin can read analytics. Anyone can create a valid event. Events cannot be updated or deleted | B-EVENT-READ, B-EVENT-IMMUTABLE |
| AN-4 | Admin page shows visitors per day, peak hours, top games, languages, guest vs logged in, last 30 days | F-ADMIN |
| AN-5 | Analytics never breaks a page: failures are swallowed, nothing is sent if Firestore is missing | U-ANALYTICS |
| SEC-1 | Users can only read and write their own data, including child players | B-USERS |
| SEC-2 | Nicknames are unique, cannot be listed or overwritten | B-NICK |
| SEC-3 | Leaderboard writes only by the owner (uid or uid_playerId) with valid fields | B-LEADER |
| QA-1 | Hub: search, favourites, daily challenge and streak keep working | F-HUB |

## 2. Data model: `analytics_events/{auto}`

`{ ts: serverTimestamp, type: 'visit'|'play', game: string<=24 (play only), lang: 'es'|'en'|'eu'|'gl'|'ca'|'fr', auth: bool, first: bool }`
`admins/{uid}` (created by hand in the console) marks admins. Retention: delete events older than 14 months (documented, manual for now).

## 3. Test layers

- Unit (node --test, no browser): `tests/unit/*.test.mjs` (i18n completeness for 6 languages, analytics payload building).
- Back (Firestore emulator + `@firebase/rules-unit-testing`): `tests/back/rules.test.mjs`.
- Front (Playwright against a local static server): `tests/front/*.spec.mjs`.
- Run all: `cd tests && npm test` (see `tests/README.md`).
