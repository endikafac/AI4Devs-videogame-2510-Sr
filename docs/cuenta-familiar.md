# Cuenta familiar (varios adultos, mismos niños)

Estado: diseño aprobado para implementar en Games Hub. El mismo modelo se pasa a PolyGo con `docs/prompt-polygo-familia.md`.

## 1. Qué se quiere

- Madre, padre, abuelos u otros adultos de confianza pueden entrar con **su propia cuenta de Google** y jugar con los **mismos perfiles de niño**, con el mismo progreso, sin compartir contraseñas.
- Un adulto es el **titular** (quien creó los perfiles de niño). Los demás son **tutores invitados**.
- Debe funcionar en el móvil de un abuelo: entra, acepta la invitación una vez, elige al niño y juega.
- Cumplir RGPD: el titular decide a quién da acceso, el invitado acepta, todo se puede revocar, y los datos de los niños no se copian a la cuenta del invitado.

## 2. Roles

| Rol | Quién | Puede |
|---|---|---|
| `owner` | titular (ya existe) | todo: crear/borrar niños, invitar, revocar, exportar y borrar la cuenta |
| `edit` | madre, padre, abuelos | ver y jugar con los niños (leer y guardar estadísticas y progreso), crear niños; no puede borrar niños ni invitar a otros ni tocar el perfil del titular |
| `view` | tutor, profesor, familiar que solo mira | solo leer el progreso de los niños |

Un titular puede tener como máximo 6 tutores (límite en la app, no en las reglas).

## 3. Modelo de datos (Firestore)

Se mantiene todo lo existente: `users/{ownerUid}/players/{pid}/...` y `users/{uid}/games/...`. Se añade:

```
invites/{inviteId}                       (id automático)
  ownerUid   string   uid del titular
  ownerName  string   nombre visible del titular (username, nunca su email)
  email      string   email del invitado, en minúsculas
  role       'edit' | 'view'
  createdAt  timestamp
  expires    timestamp   (createdAt + 30 días)

users/{ownerUid}/guardians/{guardianUid}
  uid, email, name, role ('edit'|'view'), since (timestamp), inviteId

users/{guardianUid}/memberships/{ownerUid}
  ownerUid, ownerName, role, since
```

Por qué así:

- Los niños siguen colgando del titular: no hay migración ni duplicados.
- `memberships` vive en el documento del propio invitado, así su app sabe a qué familias pertenece sin consultas de grupo de colecciones.
- El invitado nunca ve el email del titular, solo el nombre visible.

## 4. Flujos

**Invitar (titular).** Pantalla Familia, escribe el email y elige rol. Se crea `invites/{id}` con `expires` a 30 días. El titular comparte el enlace de la web por el medio que quiera (WhatsApp); el invitado no recibe un email automático, para no necesitar servidor.

**Aceptar (invitado).** Inicia sesión con Google con ese email. La app consulta `invites` con `email == mi email` (las reglas lo permiten solo si `email_verified`). Muestra un aviso: "Familia de {ownerName} te invita como {rol}. Podrás ver y jugar con sus niños. Qué se comparte: nombres de niño y progreso. No se comparte tu cuenta." Al aceptar, escribe `users/{owner}/guardians/{miUid}` y `users/{miUid}/memberships/{owner}` y borra la invitación.

**Jugar (invitado).** En el selector "quién juega" aparecen: él mismo, y por cada familia a la que pertenece, los niños de esa familia. Al elegir un niño de otra familia la app guarda en este dispositivo `games_hub_owner_{miUid} = ownerUid` y `games_hub_player_{miUid} = pid`; todas las lecturas y escrituras de estadísticas van a `users/{ownerUid}/players/{pid}/...`. Si no hay niño elegido, juega con su propia cuenta de siempre.

**Revocar.** El titular borra `guardians/{uid}` (y el invitado pierde el acceso al instante). El invitado puede salir él mismo borrando su `memberships/{owner}` y el `guardians/{miUid}` de esa familia. La app limpia `memberships` huérfanas al detectar que ya no existe el `guardians` correspondiente.

**Borrado de cuenta del titular.** Además de lo actual, borrar `guardians`, las `invites` con su `ownerUid` y avisar a los invitados al abrir (la `membership` huérfana se limpia sola).

## 5. Reglas de seguridad (Firestore)

Funciones auxiliares:

```
function guardianRole(ownerId) {
  return get(/databases/$(database)/documents/users/$(ownerId)/guardians/$(request.auth.uid)).data.role;
}
function isGuardian(ownerId) { return signedIn() && exists(/databases/$(database)/documents/users/$(ownerId)/guardians/$(request.auth.uid)); }
function canEditKids(ownerId) { return isOwner(ownerId) || (isGuardian(ownerId) && guardianRole(ownerId) == 'edit'); }
function canReadKids(ownerId) { return isOwner(ownerId) || isGuardian(ownerId); }
```

Reglas:

- `users/{owner}/players/{pid}` y todo lo que cuelga (`games`, etc.): `read` si `canReadKids`, `write` si `canEditKids`; `delete` del documento `players/{pid}` solo el titular.
- `users/{owner}/guardians/{gid}`: `read` titular o el propio guardián (`gid == auth.uid`); `create` solo si el invitado acepta una invitación válida (ver abajo); `update` nadie; `delete` el titular o el propio guardián.
  - Crear: `request.auth.uid == gid`, existe `invites/{request.resource.data.inviteId}` con `ownerUid == owner`, `email == request.auth.token.email`, `request.auth.token.email_verified == true`, `request.time < invite.expires`, y el `role` del documento coincide con el de la invitación; solo claves `uid,email,name,role,since,inviteId`.
- `users/{me}/memberships/{owner}`: `read` el propio usuario; `write` el propio usuario solo si existe `users/{owner}/guardians/{me}` (crear) o para borrar siempre.
- `invites/{id}`:
  - `create`: `ownerUid == auth.uid`, `email` string en minúsculas de máximo 254, `role in ['edit','view']`, `expires` posterior a `request.time`, claves limitadas.
  - `get` y `list`: titular (`ownerUid == auth.uid`) o invitado (`resource.data.email == request.auth.token.email && request.auth.token.email_verified == true`).
  - `delete`: titular o invitado; `update`: nadie.
- Lo demás de `users/{userId}` (perfil del adulto, `games` del adulto) sigue siendo solo del propio usuario; un guardián **no** accede a eso.
- `leaderboard/{game}/scores/{id}`: sigue permitiendo `id == uid` o `uid_pid`; añadir el caso del guardián con rol `edit`: `id` empieza por `{owner}_`, existe `guardians/{auth.uid}` con rol `edit`, y `request.resource.data.uid == {owner}` (el uid del titular, no el del guardián).
- `nicknames/*`: sin cambios.

## 6. Cambios en la app (platform/)

- `firestore.js`: `_owner(uid)` (titular activo guardado en este dispositivo, validado), `_ref(uid)` y `_lbId(uid)` usan `_owner`; `listPlayers(uid)` y `getActivePlayer(uid)` aceptan el titular activo; nuevos: `createInvite`, `listMyInvites`, `acceptInvite`, `declineInvite`, `listGuardians(owner)`, `removeGuardian`, `leaveFamily`, `listMemberships`, `setActiveFamily`.
- `identity.js`: pantalla **Familia** (titular: invitar por email con rol, lista de tutores con botón quitar, enlace para compartir; invitado: aviso de invitaciones pendientes, familias a las que pertenece, botón salir). El selector "quién juega" muestra los niños de las familias a las que se pertenece, marcando de qué familia son.
- `i18n-platform.js`: textos en los seis idiomas.
- `platform/privacy.html` (es, en, eu): un apartado nuevo sobre cuentas familiares (qué se comparte, base legal: consentimiento del titular y aceptación del invitado, revocación en cualquier momento).

## 7. RGPD y seguridad infantil

- Solo se comparte con adultos que el titular nombra y que aceptan, con la sesión de Google verificada.
- Mínimo dato: el invitado ve apodo, avatar y progreso del niño; no el email del titular ni datos de otros adultos.
- El titular declara ser titular de la patria potestad o tener autorización al crear los niños (ya existe) y al invitar.
- Derecho de supresión: borrar la cuenta del titular borra niños, tutores e invitaciones. Un tutor puede salir en cualquier momento.
- Sin correos automáticos: no se envía nada a terceros desde el servidor.

## 8. Pruebas

- Reglas (emulador, `tests/back/rules.test.mjs`): titular crea invitación; un tercero no la ve ni la lee; invitado con otro email no puede aceptar; con `email_verified=false` no puede aceptar; invitación caducada no se acepta; aceptada, el guardián `edit` lee y escribe `players/**` y su `leaderboard`, no puede borrar el documento de un niño, ni leer ni escribir el perfil del titular, ni crear otros guardianes; `view` solo lee; tras `removeGuardian` pierde el acceso; un guardián de otra familia no accede.
- Unitarias: `_owner` ignora una membership huérfana y vuelve al propio usuario.
- Front: flujo completo con dos cuentas simuladas si es posible; como mínimo, que la pantalla Familia se abre y que no hay errores en consola.

## 9. Límites asumidos

- La invitación se comparte a mano (WhatsApp); no hay email automático.
- Un invitado necesita cuenta de Google con ese email.
- El rol `edit` puede crear niños nuevos en la familia pero no borrarlos.

## 10. Notas de implementación (desviaciones del diseño)

- Reglas: `guardians` y `memberships` se creaban en lote, así que la `membership` usa `existsAfter/getAfter` en lugar de `exists`. `guardians`: `get` para titular y guardián (aunque no exista el documento), `list` para titular o con `resource.data.uid == auth.uid`.
- Reglas, endurecido: el `delete` de cualquier documento bajo `players/{pid}` (también `games`) es solo del titular; la regla genérica `users/{u}/{sub}/**` excluye `players`, `guardians` y `memberships` (las reglas son aditivas: sin esa exclusión el titular podría falsificar guardians). La invitación exige `ownerName == users/{owner}.username` (no se puede suplantar el nombre), `createdAt == request.time`, caducidad máxima 31 días y formato de email; el guardian exige `since == request.time` y `email` igual al verificado.
- Reglas: el email de la invitación se compara con `request.auth.token.email.lower()` (la app consulta con el email en minúsculas).
- Un tutor `edit` puede crear niños en la regla, pero la pantalla solo ofrece crear niños en la cuenta propia. El apodo reservado en `nicknames` queda a nombre de quien lo crea.
- `view`: la app no guarda estadísticas ni logros (las reglas lo impedirían igualmente).
- El titular activo se valida con `users/{owner}/guardians/{uid}` al leer el niño activo; la caché de membresías (`games_hub_mem_{uid}`) es solo local y las reglas siguen mandando.
- Identificadores de usuario con `_` no son compatibles con el id de ranking de un tutor (`ownerUid_pid`); los uid de Firebase Auth no los llevan.

## 11. Selector de perfil, clave por niño y privacidad adulto/niño

**Selector "Quién juega?"** (`platform/profiles.js`). Pantalla completa con fichas grandes: "Yo" (el adulto que ha entrado), los niños propios y los niños de cada familia a la que se pertenece (roles `edit` y `view`). Se abre sola una vez por sesión del navegador tras iniciar sesión, solo si hay algo que elegir; el botón "Cambiar de perfil" de la cabecera la abre siempre. Elegir una ficha usa el mecanismo existente (`setActiveFamily` + `setActivePlayer`) y recarga la página. El último perfil se recuerda en el dispositivo porque el jugador activo ya se guarda en `localStorage`; la ficha activa sale marcada y con el foco. No añade lecturas a la navegación normal: los datos del selector solo se piden al abrirlo.

**Clave por niño.** Opcional, 4 cifras. Se pone, cambia o quita en Familia, apartado "Clave para entrar como ellos", por el titular y por los tutores con rol `edit` (el rol `view` solo ve si hay clave). En `users/{owner}/players/{pid}` se guarda el campo `pin`: `{ v: 1, alg: 'PBKDF2-SHA256', iter: 100000, salt, hash }` (sal aleatoria de 16 bytes, base64). Nunca la clave. Cambiar a un niño con clave pide el teclado numérico; tras 5 fallos hay que esperar 30 s (el contador vive en este dispositivo: `games_hub_pinlock_{uid}_{owner}_{pid}`). **Es un candado de comodidad entre perfiles de un mismo dispositivo, no seguridad de la cuenta**: 4 cifras se pueden sacar por fuerza bruta leyendo el documento, y quien tenga acceso a la cuenta puede quitarla. La interfaz lo dice.

**Reglas.** `players/{pid}` acepta `pin` solo con esa forma exacta (claves fijas, tamaños acotados), y solo escriben `owner` o `edit`. El rol `view` no puede escribir nada.

**Auditoría de privacidad adulto/niño.** Los tutores solo alcanzan `users/{owner}/players/**`. No leen `users/{owner}` ni sus `games`, `memberships`, `guardians` (solo el suyo) ni nada de otro tutor; el titular tampoco lee la cuenta de un tutor. En el cliente, el selector y el cambio de perfil leen solo `players`, la `membership` propia y el `guardians/{miUid}` propio; el nombre de la familia viene de la `membership`. Dos puntos públicos por diseño, ya existentes: `leaderboard` (cualquier usuario con sesión ve apodo y puntos, también los del adulto si juega) y `nicknames/{key}` (se puede consultar un apodo por su id y devuelve el uid del autor).

**Adultos y niños en el hub.** Perfil niño: solo juegos con `aud` que incluya `kids`, sin filtro de público ni fila "Para ti". Perfil adulto: filtro `adults` por defecto (se puede ampliar) y una fila "Para ti" con sopa de letras, crucigramas, lectura, memoria, MathMaster, TableMaster y mapas. MathMaster y TableMaster pasan a `aud: 'kids teens adults'`.
