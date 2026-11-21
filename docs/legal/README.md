# Legal and GDPR documents: Games Hub

Source texts that back `platform/privacy.html`. Same structure as Linkalde (`docs/legal/`), adapted to a free, no-ads kids' games app.
Controller and contact: `TU_EMAIL_DE_CONTACTO` (dedicated Gmail, pending). Version 1.0, 2026-11-21.

## 1. Record of processing activities (RAT, art. 30 GDPR)

| Item | Value |
|---|---|
| Activity | Saving progress, points, achievements and friendly rankings for logged-in users |
| Data subjects | Adults (account owners) and child players created by them (nickname + emoji only) |
| Data | Firebase UID, nickname, emoji avatar, points, level, per-game stats, achievements, preferences, consent date/version |
| NOT stored | Google name, photo, email, real name of children, location, IP (beyond what Google infra logs) |
| Legal basis | Consent of the adult or guardian (art. 6.1.a, art. 8 GDPR, art. 7 LOPDGDD) |
| Recipients | Google LLC (Firebase Auth, Firestore, Hosting) as processor. Nickname + avatar visible to other logged-in users in rankings |
| Transfers | Possible to the US, covered by Google SCCs and the EU-US Data Privacy Framework |
| Retention | Until the adult deletes the account. Proposed: auto-delete after 24 months of inactivity (to implement) |
| Security | Firestore rules per uid, CSP, no third-party scripts, fonts self-hosted, HTTPS only |
| Guest mode | Everything stays in the browser (localStorage). Nothing reaches the server |
| Local storage | Technical and preference keys only (language, player, streak, favourites, vocabulary progress). No tracking |

## 2. Data protection impact assessment (DPIA, art. 35), short form

- Is it required? It processes data of minors but **does not profile** them, has **no advertising** and no large-scale monitoring. Not strictly mandatory under the AEPD list, but documented for accountability.
- Risks and measures:
  1. Child identified through nickname: nickname is invented, real names are discouraged in the UI, uniqueness is enforced without any link to a real identity. Residual risk: low.
  2. Contact between strangers: there is no chat, no free text and no messages. Rankings show only nickname + emoji. Residual risk: low.
  3. Account of the adult compromised: sign-in is delegated to Google (2FA available). Rules isolate data per uid. Residual risk: low.
  4. Unauthorised data access: Firestore rules deny by default. Players can only be read or written by the owning uid. Residual risk: low.
  5. International transfer: Google SCCs and DPF. Residual risk: acceptable.
- Conclusion: processing is proportionate and low risk. Review whenever a chat, free-text field, analytics or ads are added (any of them would require a new DPIA).

## 3. Breach response (arts. 33 and 34 GDPR)

1. Detect: Firebase alerts, user report to the contact email, or own monitoring.
2. Contain within hours: revoke access, tighten Firestore rules, redeploy, rotate keys if any leaked.
3. Assess: what data (see RAT), how many people, any child nickname exposed, risk level.
4. Notify the AEPD within **72 hours** if there is risk to people (sede.aepd.es). Notify affected adults without delay if the risk is high.
5. Record every incident (date, cause, data, measures) in an internal log kept outside the app.

## 4. Rights requests

- Access, portability and erasure are self-service on `platform/privacy.html` (export JSON, delete everything including child players and nicknames).
- Rectification: change nickname or avatar from the profile.
- Anything else: contact email, answer within 30 days.

## 5. Open items

- [ ] Create the dedicated Gmail and replace `TU_EMAIL_DE_CONTACTO` in `platform/privacy.html` (ES, EN, EU) and here.
- [ ] Deploy the Firestore rules for child players (`npx firebase deploy --only firestore:rules`).
- [ ] Automatic deletion after 24 months of inactivity (Cloud Function or scheduled job).
- [ ] Short child-friendly version of the privacy page (done in `privacy.html`, section "Para peques").
- [ ] Lawyer review before public launch.
- [ ] Terms of use page (short): free service, adult responsibility, no warranties.
- [ ] Sign the Google Cloud data processing terms in the Firebase console (usually accepted by default, verify).
