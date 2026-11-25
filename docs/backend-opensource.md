# Backend open source para Games Hub (Postgres + Neon Auth)

Estado: fase 1 terminada (código y pruebas). **Nada cambia en producción**: Games Hub sigue usando Firebase hasta que el titular cambie un valor de configuración (sección 8). Este documento es el registro de la decisión, el mapeo de datos y la lista de pasos para el titular.

## 1. Decisión

**Requisito del titular:** el stack debe ser siempre open source.

**Elegido:** la misma base de datos y el mismo inicio de sesión que ya usa PolyGo, con un esquema propio.

| Pieza | Qué es | Licencia | Quién la aloja |
|---|---|---|---|
| Postgres | base de datos | PostgreSQL License (permisiva) | Neon |
| Neon (motor de almacenamiento y proxy) | Postgres serverless | Apache-2.0 | Neon (plan gratuito) |
| Neon Auth | inicio de sesión sobre Better Auth, con los usuarios en nuestra propia base | Better Auth: MIT | Neon |
| Data API | API REST sobre Postgres, compatible con PostgREST | PostgREST: MIT | Neon |
| Row Level Security | aislamiento por fila, dentro de Postgres | parte de Postgres | Neon |
| PGlite (solo pruebas) | Postgres compilado a WebAssembly, sin binario nativo | Apache-2.0 | el portátil |

Las licencias son las que publica cada proyecto a fecha de hoy; conviene confirmarlas una vez antes de decirlas en público.

**Por qué esto y no otra cosa**

- **Es lo que ya funciona en PolyGo.** Misma forma de obtener el JWT, misma Data API, mismas políticas RLS, mismos errores ya descubiertos (`docs/13-migracion-neon.md` de PolyGo). No hay tecnología nueva que aprender ni que mantener.
- **Una sola cuenta de Google para las dos apps.** El adulto entra una vez y es el mismo usuario en PolyGo y en Games Hub (`docs/14-vocabulario-por-curso-y-puente-games-hub.md` de PolyGo ya lo plantea como puente).
- **Sin lock-in real.** Todo el modelo es SQL estándar. Si Neon dejara de convenir, el mismo esquema y las mismas políticas funcionan en cualquier Postgres 15 o superior con PostgREST y Better Auth autoalojados. Lo único propio de Neon es dónde corre.
- **Las reglas de seguridad se pueden probar de verdad.** Las políticas RLS se prueban en un Postgres real (PGlite), con las mismas pruebas que ya existían para `firestore.rules`.
- **El alojamiento sigue siendo estático.** Games Hub no gana servidor: el navegador habla directamente con la Data API y con Neon Auth, y la seguridad la imponen el JWT y RLS. No hay claves de servidor que guardar.

**Descartado:** Supabase (la cuota gratuita está ocupada, ver PolyGo), PocketBase o Appwrite autoalojados (obligan a mantener un servidor y copias), seguir con Firebase (no es open source).

**Alojamiento estático.** Las páginas se siguen sirviendo desde Firebase Hosting. Es solo una CDN de ficheros: ningún dato ni ninguna cuenta depende de ello. Si el titular quiere que *todo* sea open source o fuera de Google, los ficheros se pueden mover a cualquier hosting estático (GitHub Pages, Cloudflare Pages, Netlify, un nginx) cambiando solo el dominio, que habría que añadir a los orígenes de confianza (sección 8). **Decisión para el titular** (sección 11).

**Región.** El proyecto de Neon de PolyGo está en Frankfurt (UE). Games Hub vive en el mismo proyecto, así que sus datos también.

### 1.1 RGPD con datos de menores

- **Qué se guarda de un niño:** apodo, avatar (un emoji de una lista), estadísticas de juego, un resumen diario (partidas, tiempo, aciertos), hasta 5 gustos de una lista fija, y opcionalmente un hash de PIN. **No** se guarda foto (la de Google no se migra nunca), ni apellidos, ni correo del niño, ni texto libre.
- **Quién decide:** el titular (adulto) crea los perfiles de niño, declara la patria potestad y es quien invita a otros adultos. El invitado acepta. Todo se puede revocar.
- **Minimización entre adultos:** un tutor ve solo a los niños de esa familia, nunca los datos del adulto titular ni los de otro tutor (lo garantizan las políticas y lo prueban los tests).
- **Supresión:** `gameshub.delete_my_data()` borra el adulto, sus niños, estadísticas, ranking, apodos, invitaciones y tutorías, y quita al adulto de las familias de otros. Después hay que borrar la cuenta de acceso (ver advertencia).
- **Portabilidad:** exportación de todo lo del adulto y sus niños en un JSON (`exportData` del adaptador).
- **Analítica:** eventos anónimos, sin identificador ni dato personal, con la hora puesta por el servidor.
- **Encargado del tratamiento:** Neon actúa como encargado; hay que tener firmado su acuerdo de tratamiento de datos (DPA). Google sigue siendo el proveedor de identidad al iniciar sesión (solo identidad, no se le envían datos de juego).
- **Transferencias:** región UE, sin transferencias a Google Firebase una vez cambiado el backend.
- **Texto legal:** `platform/privacy.html` hoy nombra a Firebase. Hay que actualizarlo en el momento del cambio (fase 2).

**Advertencia importante, cuenta compartida.** Como PolyGo y Games Hub comparten Neon Auth, el usuario es **el mismo**. Borrar la cuenta de acceso desde Games Hub también quitaría el acceso a PolyGo. Por eso `delete_my_data()` solo borra datos de Games Hub, y el borrado de la cuenta de acceso (`deleteAuthAccount`) se ofrece aparte y avisando. **Decisión para el titular** (sección 11).

## 2. Mapeo Firestore a Postgres

Esquema `gameshub`, sin tocar `public`. Los identificadores de adulto son los `uuid` de Neon Auth (`auth.uid()`), no los uid de Firebase.

| Firestore | Postgres (`gameshub.`) | Clave | Notas |
|---|---|---|---|
| `users/{uid}` | `adults` | `id` uuid = `auth.uid()` | `username` (40), `avatar`, `nickname_key`, `xp`, `total_points`, `level`, `settings` jsonb, `consent` jsonb. **Sin foto.** |
| `users/{uid}/games/{game}` | `adult_game_stats` | `(owner_id, game)` | `stats` jsonb + `daily` jsonb (tope 62 días) |
| `users/{owner}/players/{pid}` | `players` | `pid` (`[a-z0-9]{6,20}`), `owner_id` | `pin` jsonb con la misma validación que `validPin`; `interests text[]` con la misma que `validInterests` |
| `users/{owner}/players/{pid}/games/{game}` | `player_game_stats` | `(pid, game)` + `owner_id` | `daily` jsonb con tope 62 (`validDaily`) |
| `users/{owner}/guardians/{gid}` | `guardians` | `(owner_id, guardian_id)` | rol `edit` o `view`, `email`, `name`, `owner_name`, `since` |
| `users/{me}/memberships/{owner}` | vista `memberships` | (sobre `guardians`) | `security_invoker`: solo devuelve mis filas. Una sola fila hace de tutor y de membresía, así que **no puede quedar huérfana ni falsificarse** |
| `invites/{id}` | `invites` | `id` uuid | `created_at` lo pone el servidor; caduca como máximo a 31 días; correo en minúsculas |
| `nicknames/{key}` | `nicknames` | `key` | único (clave primaria); no se puede listar |
| `leaderboard/{game}/scores/{uid}` y `{uid_pid}` | `leaderboard` | `(game, owner_id, pid)` | `pid` vacío = adulto |
| `analytics_events` | `analytics_events` | `id` identity | la hora es siempre la del servidor |
| `admins/{uid}` | `admins` | `user_id` | solo se rellena a mano con la conexión de propietario |
| `challenges/{id}` | `challenges` | `id` | solo lectura |

Diferencias deliberadas respecto a Firestore:

- **Aceptar una invitación es una sola función atómica** (`accept_invite`): crea al tutor y consume la invitación en la misma transacción. En Firestore eran un lote con `existsAfter`. Reintentar tras una revocación falla porque la invitación ya no existe.
- **El rol del tutor viene siempre de la invitación**, nunca del cliente.
- **Una lectura denegada devuelve vacío, no error.** Es como funciona RLS. Una escritura denegada falla si viola una política de inserción y afecta a 0 filas si es un `update` o `delete` filtrado. El adaptador convierte el caso de "0 filas" en un error `permission-denied` donde importa (PIN, gustos, ajustes).
- **Los apodos no se pueden listar**: la tabla solo muestra al llamante sus propias filas; saber si un apodo está libre se hace con `nickname_available(key)`.
- **Claves inmutables:** un tutor no puede mover un niño a su cuenta (`pid` y `owner_id` no cambian nunca, lo impone un trigger).
- **Borrar un niño** limpia su apodo, su ranking y sus estadísticas en la misma operación.
- **Tipos:** Postgres convierte `'yes'` en `true` en una columna booleana, y Firestore no lo hacía. Solo se rechaza lo que Postgres no sabe leer. `Infinity` no viaja en JSON: se guarda como `null` y se restaura al leer.
- **XP y puntos:** el incremento es atómico en SQL (`bump_progress`), como `FieldValue.increment`.

### 2.1 Reglas de `firestore.rules` y su política

| Regla de Firestore | Dónde se cumple en Postgres |
|---|---|
| `users/{uid}`: solo el propio usuario lee, escribe y borra | política `adults_own` (`id = auth.uid()`) |
| `username` de 40 como máximo, `xp` y `totalPoints` no negativos | `check` de la tabla |
| `players`: lee titular o tutor; escribe titular o tutor `edit`; borra solo el titular | `players_read`, `players_insert`, `players_update`, `players_delete` con `can_read_kids` y `can_edit_kids` |
| `validPin` | función `valid_pin` en un `check` (claves fijas, `v=1`, `PBKDF2-SHA256`, `iter` 1000 a 1000000, sal 16 a 32, hash 32 a 64) |
| `validInterests` | función `valid_interests` en un `check` (14 ids fijos, máximo 5, sin repetidos, sin nulos) |
| `validDaily` | función `valid_daily` en un `check` (objeto, máximo 62 días) |
| `guardians`: create solo consumiendo una invitación válida a tu correo verificado | no hay política de inserción; solo `accept_invite` (security definer) |
| `guardians`: lee titular o el propio tutor; borra titular o el propio tutor; no hay update | `guardians_read`, `guardians_delete`; sin `update` |
| `memberships`: lee el propio usuario, nadie las falsifica | vista sobre `guardians`, sin permiso de escritura |
| `invites`: create con `ownerUid`, `ownerName` igual al `username`, caducidad máxima de 31 días, correo válido | `invites_create` + `check` de la tabla + permiso de inserción limitado a 5 columnas |
| `invites`: lee y borra el titular o el correo verificado destinatario | `invites_read`, `invites_delete` con `verified_email()` |
| `leaderboard`: escribe el titular (`uid` o `uid_pid`) o un tutor `edit` bajo el uid del titular; borra solo el titular | `leaderboard_insert`, `leaderboard_update`, `leaderboard_delete` |
| `nicknames`: get para cualquiera con sesión, sin list, sin overwrite | `nicknames_read_own`, `nicknames_create`, clave primaria, `nickname_available` |
| `analytics_events`: cualquiera crea un evento válido, solo admins leen, inmutables | `analytics_insert` (y `_anon`), `analytics_read`, sin permiso de `update` ni `delete` |
| `admins`: solo se lee el propio, nadie escribe | `admins_read_own`, sin permiso de escritura |
| lo demás, denegado | `revoke all` y se concede tabla a tabla en `permissions/0002_data_api.sql`; una tabla nueva queda cerrada |

## 3. Qué hay en el repositorio

| Fichero | Para qué |
|---|---|
| `db/gameshub/migrations/0001_schema.sql` | tablas, restricciones y validadores. No depende de Neon |
| `db/gameshub/migrations/0002_functions.sql` | ayudantes de las políticas, triggers y funciones RPC |
| `db/gameshub/permissions/0001_security.sql` | activa RLS en todas las tablas (se reaplica siempre) |
| `db/gameshub/permissions/0002_data_api.sql` | permisos y políticas del rol `authenticated`; se reaplica en cada ejecución; con guardas si la Data API aún no existe |
| `scripts/gameshub-db-migrate.mjs` | ejecuta migraciones (una vez, con checksum) y permisos (siempre) |
| `scripts/migrate-firestore-to-pg.mjs` | pasa una exportación de Firestore a Postgres (`--dry-run`, `--out`, `--apply`) |
| `platform/backend-config.js` | interruptor `backend: 'firebase'` o `'neon'` y las dos URL |
| `platform/backend-pg.js` | adaptador del navegador (fetch, sin SDK ni build) |
| `tests/back-pg/*.test.mjs` | pruebas de las políticas SQL, la migración y el ejecutor, con PGlite |
| `tests/unit/backend-pg.test.mjs` | pruebas del adaptador y del interruptor, con `fetch` simulado |

Los ficheros `auth.js` y `firestore.js` solo ganan una línea cada uno, al final: `if (typeof PlatformBackendPg !== 'undefined' && PlatformBackendPg.isActive()) ...`. Con `backend: 'firebase'` (o sin cargar `backend-pg.js`) no hacen nada y el comportamiento es el de siempre, lo comprueba `U-BE-DISPATCH`.

## 4. Qué verifica PGlite y qué no

PGlite es Postgres real (WASM, sin binario nativo, sin servidor), y se comprueba que RLS funciona de verdad en él (`set role`, `auth.uid()`, políticas, `security definer`, triggers, `check`, vistas `security_invoker`).

**Verificado con PGlite** (39 casos en `rules.pg`, 7 de migraciones, 10 de la migración de datos, 4 del ejecutor):

- las 34 pruebas de `rules.test.mjs` portadas una a una con los mismos nombres (`B-EVENT*`, `B-USERS`, `B-NICK`, `B-LEADER`, `B-CLAIM`, `B-FAM-*`, `B-PRIV-*` incluida la del PIN, `B-INTERESTS`, `B-DAILY*`), más 5 propias del diseño SQL (incremento atómico, alta de niño, borrado de cuenta, `whoami`);
- atomicidad de `accept_invite` (si falla la creación del tutor, la invitación **no** se consume), repetición tras revocación;
- solo el titular borra niños; un tutor no puede mover niños; el rol `view` no escribe nada, ni el PIN;
- los apodos no se listan; los ranking de niños los escribe un tutor `edit` solo bajo el id del titular;
- la matriz de permisos: nada para `PUBLIC`, nada para `anonymous` salvo insertar analítica, una tabla o función nueva queda cerrada tras reaplicar permisos;
- las migraciones y los permisos se pueden aplicar dos veces con el mismo resultado, y antes de habilitar la Data API no rompen nada (guardas);
- la migración de datos sobre el esquema real, incluida la idempotencia y que lo migrado solo se lee a través de las políticas;
- una "mutación" rápida (abrir `players_read` a `true`) hace fallar 9 pruebas: las pruebas tienen dientes.

**Lo que PGlite no puede verificar** (y cómo se cubre):

| Qué | Por qué no | Cómo se cubre |
|---|---|---|
| Los roles y atributos reales de Neon (`authenticated`, `anonymous`, `neondb_owner`) | PGlite no los trae; la prueba crea unos con el mismo nombre y sin login | Prueba de `set role` + `auth.uid()` simulado; el paso 6 de la lista comprueba `whoami()` contra Neon de verdad |
| Que la Data API ponga el JWT en `request.jwt.claims` y exponga `auth.uid()` | es del servicio de Neon | La función `claims()` lee `request.jwt.claims` y tiene respaldo en `auth.session()`; `verified_email()` tiene un tercer respaldo (la tabla `neon_auth."user"`). Paso 6 de la lista |
| El nombre exacto del claim de correo verificado (`email_verified` o `emailVerified`) | depende de Neon Auth | `verified_email()` acepta los dos y, si el JWT no trae correo, consulta `neon_auth."user"`; probado con los tres casos |
| La traducción HTTP de PostgREST (filtros `eq.`, `on_conflict`, `Prefer`, perfiles de esquema) | no hay PostgREST | Las pruebas del adaptador comprueban las URL y cabeceras exactas que se enviarían; el paso 7 de la lista las prueba contra Neon |
| La validación de la firma del JWT | es de la Data API | Se confía en ella, igual que PolyGo |
| Que Neon exponga el esquema `gameshub` y permita CORS desde `https://gameshub-efc.web.app` | configuración de la consola | Pasos 3 y 7 de la lista |
| Cookies de terceros entre `web.app` y el dominio de Neon Auth | son del navegador | Ver riesgos (sección 10) |
| Rendimiento, arranque en frío, límites del plan gratuito | no es una prueba funcional | Ver riesgos |

## 5. Lista de pasos para el titular

Orden recomendado. Los pasos 1 a 6 no afectan a producción.

### Paso 1. Entrar en la consola de Neon

Abre https://console.neon.tech con la cuenta que tiene el proyecto de PolyGo y entra en **ese mismo proyecto** (el que PolyGo usa, recurso `neon-coquelicot-engine` en Vercel). Comprueba en *Settings* que la región es Frankfurt (`aws-eu-central-1`).

### Paso 2. Neon Auth con Google

PolyGo ya lo tiene activado, así que probablemente solo tengas que comprobarlo.

1. Menú del proyecto, **Auth**. Debe poner que está activado.
2. En proveedores, **Google** debe estar activado. Si usas las credenciales compartidas de Neon (`isShared`) funcionará, con la pantalla de consentimiento de Neon; para producción conviene tus propias credenciales de Google (PolyGo lo deja como pendiente).
3. **No hay que registrar ninguna URI nueva en Google Cloud**: la URI de redirección de Google es la de Neon Auth, que no cambia.

### Paso 3. Orígenes de confianza (dominios permitidos)

Neon Auth solo redirige a dominios registrados; un dominio sin registrar da `invalid domain` o un 403 seco. En **Auth**, sección de dominios o *trusted origins* (o con la CLI, como en PolyGo: `neon neon-auth domain add <origen>`), añade:

- `https://gameshub-efc.web.app`
- `http://localhost:5000` (o el puerto con el que sirvas la web en local)
- `http://127.0.0.1:5000` (**es distinto de `localhost`**, hay que registrar los dos)
- si algún día usas un canal de vista previa de Firebase Hosting, su dirección

Comprobación: lista los dominios (`neon neon-auth domain list`) y confirma que aparecen.

### Paso 4. Data API y el esquema `gameshub`

1. Menú del proyecto, **Data API**. PolyGo ya la habilitó con acceso a `public`.
2. En sus ajustes, añade `gameshub` a los esquemas expuestos. Si la consola solo permite `public`, avísame antes de seguir: hay un plan B (mover las tablas a `public` con prefijo `gh_`), que es una migración pequeña pero cambia las pruebas.
3. Copia la **URL de la Data API** (termina en algo como `/rest/v1`). Es la misma que en PolyGo: variable `NEON_DATA_API_URL` de PolyGo.
4. Si la consola tiene un apartado de **CORS** o de orígenes permitidos para la Data API, añade `https://gameshub-efc.web.app` y los de localhost. Si no lo tiene, el paso 7 dirá si hace falta.

### Paso 5. Dónde van los valores (nunca en la línea de comandos, nunca en git)

| Valor | Qué es | Dónde va | ¿Secreto? |
|---|---|---|---|
| URL base de Neon Auth | la `NEON_AUTH_BASE_URL` de PolyGo | `platform/backend-config.js`, campo `neon.authBaseUrl` | no, es pública |
| URL de la Data API | la `NEON_DATA_API_URL` de PolyGo | `platform/backend-config.js`, campo `neon.dataApiUrl` | no, es pública: lo que protege los datos es el JWT y RLS |
| Cadena de conexión de propietario (`neondb_owner`) | para ejecutar migraciones y la migración de datos | variable de entorno `DATABASE_URL`, **o** un fichero fuera de git cuyo camino va en `DATABASE_URL_FILE` | **sí, es secreta** |

Los dos primeros se ven con `vercel env pull` en la carpeta de PolyGo o en la consola de Neon (botón *Connect*). La cadena de conexión sale de *Connect* en la consola de Neon, rol propietario, conexión **directa** (no la del *pooler*) para las migraciones.

Para la cadena de conexión, crea un fichero de una sola línea, por ejemplo `C:\AI4Devs\AI4Devs-videogame-2510-Sr\.neon-db-url` (ya está ignorado por git) y, en PowerShell, solo para esa ventana:

```powershell
$env:DATABASE_URL_FILE = "C:\AI4Devs\AI4Devs-videogame-2510-Sr\.neon-db-url"
```

Los scripts rechazan la cadena si se la pasas como argumento, porque el EDR del portátil registra la línea de comandos completa. Cierra la ventana al terminar y borra el fichero cuando no lo necesites.

### Paso 6. Ejecutar las migraciones

```powershell
cd C:\AI4Devs\AI4Devs-videogame-2510-Sr\tests
npm i --no-save pg          # driver de Postgres en JavaScript puro, sin binarios
cd ..
node scripts\gameshub-db-migrate.mjs --dry-run     # lista lo que haría, no cambia nada
node scripts\gameshub-db-migrate.mjs               # aplica
```

Qué hace: crea el esquema `gameshub`, aplica `0001` y `0002` (una sola vez cada una, con checksum: si editas una ya aplicada se niega), y **reaplica siempre** los permisos y las políticas (así, un cambio hecho a mano en la consola no reabre un agujero sin que nadie se entere). Debe terminar con `gameshub: permissions and policies of the Data API applied.` Si aparece el aviso `Role authenticated does not exist`, la Data API no está habilitada (paso 4): habilítala y vuelve a ejecutar, es seguro repetirlo.

**Comprobación de que la base ve al usuario.** Cuando la fase 2 cargue el adaptador en las páginas (sección 8), abre la web en `localhost` con la sesión iniciada y, en la consola del navegador:

```js
await PlatformFirestore._neon.rpc('whoami')
// debe devolver { uid: "<tu uuid>", email: "<tu correo en minúsculas>", role: "authenticated" }
```

Si `email` sale vacío con tu sesión iniciada, la función `verified_email()` no encuentra el correo verificado ni en el JWT ni en `neon_auth."user"`: avísame, es lo único que rompería las invitaciones.

### Paso 7. Prueba en local, sin tocar producción

1. En `platform/backend-config.js` rellena las dos URL (siguen siendo `backend: 'firebase'`, así que producción no cambia aunque se despliegue).
2. Sirve la web en local (`npx firebase serve --only hosting` o cualquier servidor estático) en uno de los orígenes del paso 3.
3. En la consola del navegador: `localStorage.games_hub_backend = 'neon'` y recarga. Solo funciona en `localhost` y `127.0.0.1`.
4. Entra con Google, juega una partida, abre la pantalla Familia, invita a un correo de prueba, acéptala con otra cuenta de Google.
5. Si falla algo de CORS o de cookies, la consola del navegador lo dirá con claridad (ver riesgos).

### Paso 8. Migrar los datos actuales (cuando se decida el cambio)

1. **Que cada adulto haya entrado una vez con Google en el sistema de Neon** (si ya usan PolyGo con esa cuenta, ya existen). El script casa a las personas por correo con `neon_auth."user"`. Los que aún no existan se pueden saltar con `--skip-unmapped` y migrarse después, porque el script es repetible y no pisa nada.
2. Exporta Firestore a JSON. Con la herramienta que prefieras que genere JSON (por ejemplo el paquete open source `firestore-export-import`; `firebase firestore:export` genera un formato binario, no sirve). Hace falta una clave de cuenta de servicio de Firebase: guárdala en un fichero fuera de git y pásala por variable de entorno (`GOOGLE_APPLICATION_CREDENTIALS`), nunca por argumento. El script acepta la forma `__collection__` de esa herramienta y una forma simple documentada en su cabecera.
3. Exporta los usuarios: `firebase auth:export auth.json --format=json` (da el correo de cada uid).
4. Ensayo, sin escribir nada:
   ```powershell
   node scripts\migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --dry-run
   ```
   Lee los avisos: cada fila que no se puede migrar sale con su motivo (id de niño inválido, PIN mal formado, invitaciones caducadas, apodos huérfanos...).
5. Genera el SQL para revisarlo, o aplícalo directamente:
   ```powershell
   node scripts\migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --out migrate.sql
   node scripts\migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --apply     # usa DATABASE_URL o DATABASE_URL_FILE
   ```
   Es una sola transacción: o entra todo o no entra nada. Los ficheros `firestore.json`, `auth.json` y `migrate.sql` **contienen datos de niños**: déjalos fuera de git (ya están ignorados) y bórralos al terminar.

Lo que **no** se migra: la foto de Google, las invitaciones caducadas y los eventos de analítica (anónimos y agregados).

## 6. Cómo se activa el interruptor

`platform/backend-config.js`:

```js
backend: 'firebase',          // cambiar a 'neon' para usar Postgres
neon: { authBaseUrl: '...', dataApiUrl: '...', schema: 'gameshub' }
```

- Con `'firebase'` (por defecto) todo funciona como hoy.
- Con `'neon'` y las dos URL rellenas, `auth.js` y `firestore.js` sustituyen en sitio sus métodos de entrada y salida por los del adaptador; las funciones puras (puntos, niveles, PIN, caducidad de invitaciones...) siguen siendo las originales, así que juegos y ficheros de plataforma llaman exactamente a lo mismo.
- Con `'neon'` pero una URL vacía, escribe un error en la consola y **sigue usando Firebase**: un cambio a medias nunca deja la web sin backend.

## 7. Qué falta para que `'neon'` funcione de punta a punta (fase 2, código)

Esto lo hago yo en la fase 2, antes de que el titular cambie nada. Ahora mismo con `'neon'` el adaptador cubre todo lo que usan **los juegos** (`PlatformAuth` y `PlatformFirestore`), pero quedan estos usos directos de Firestore, que se cambian a llamadas del adaptador (ya existen: `claimIdentity`, `createPlayerRow`, `deletePlayerRow`, `listPlayerGames`, `exportData`, `deleteMyData`, `deleteAuthAccount`, `trackEvent`, `listAnalyticsEvents`, en `PlatformFirestore._neon`):

1. `platform/identity.js`: reservar apodo, crear y borrar niño, exportar y borrar cuenta.
2. `platform/analytics.js` y `platform/admin-stats.html`.
3. `platform/progress-panel.js` (`loadStats`) y las comprobaciones `window.GamesHubDB` de `profiles.js`, `platform-header.js` e `identity.js`, que pasan a preguntar "¿hay nube?" al adaptador.
4. Cargar `backend-config.js` y `backend-pg.js` antes de `auth.js` en las páginas.
5. `firebase.json`: añadir a `connect-src` de la política de seguridad los dos servidores de Neon (los de las dos URL), p. ej. `https://ep-xxx.neonauth.eu-central-1.aws.neon.tech` y `https://ep-xxx.apirest.eu-central-1.aws.neon.tech`. Sin esto el navegador bloquea las peticiones.
6. `sw.js`: subir la versión de caché y precachear los dos ficheros nuevos (hoy no se ha tocado).
7. `platform/privacy.html`: sustituir las referencias a Firebase.
8. Pruebas de interfaz con el adaptador activo.

## 8. Cambio y vuelta atrás

**Cambio** (cuando las secciones 5 y 7 estén hechas y probadas en local):

1. Elige un momento tranquilo y avisa a la familia: durante el cambio no se deben guardar partidas.
2. Migra los datos (paso 8) con `--apply`.
3. En `platform/backend-config.js` pon `backend: 'neon'`.
4. Despliega como siempre (`npx firebase deploy --only hosting`).
5. Entra, comprueba que aparecen los niños, las estadísticas y los tutores, juega una partida y mira que sube en el ranking.

**Vuelta atrás:**

1. En `platform/backend-config.js` pon `backend: 'firebase'` y despliega. Es todo.
2. Firestore no se toca durante el cambio, así que sigue con los datos del momento de la migración.
3. **Lo jugado entre el cambio y la vuelta atrás se queda solo en Postgres.** No hay camino automático de vuelta a Firestore. Por eso: cambio corto, probado en local, y no borrar nada de Firebase hasta pasadas unas semanas sin problemas.

**Retirar Firebase** (mucho más adelante): dar de baja el proyecto de Firebase, borrar `firestore.rules`, `firebase-config.js`, los `<script>` de gstatic y la política de seguridad que los menciona.

## 9. Seguridad: lo que se mantiene

- **Nada de claves de servidor en el navegador.** Las dos URL son públicas; la cadena de conexión del propietario solo vive en el portátil, en una variable de entorno o un fichero fuera de git.
- **El navegador nunca habla con Postgres como propietario**: la Data API ejecuta cada consulta como el rol `authenticated`, con el JWT de quien juega, y RLS decide.
- **El token de sesión no se guarda en `localStorage`.** Si la instalación de Neon lo devolviera como bearer (en lugar de cookie), vive solo en `sessionStorage` de la pestaña.
- **Revocar todo y conceder tabla a tabla.** Cada ejecución del ejecutor de migraciones restablece la matriz de permisos.

## 10. Riesgos

| Riesgo | Gravedad | Qué hacer |
|---|---|---|
| **Cookies de terceros.** La web (`gameshub-efc.web.app`) y Neon Auth están en dominios distintos. Safari y otros navegadores bloquean las cookies de terceros, y entonces la sesión no se mantiene. PolyGo no lo sufre porque pasa por una ruta propia en el mismo dominio (`/api/auth/...`). El adaptador usa `credentials: 'include'`, acepta el verificador de sesión de Neon Auth y un token bearer en `sessionStorage`, pero **no se ha podido probar contra Neon real** | alta | Paso 7 en Safari y en el móvil. Si falla, la salida limpia es poner delante un proxy mínimo del mismo dominio (reescritura de Firebase Hosting a una función, o mover el hosting a un servicio con reescrituras) |
| **El JWT por CORS.** El adaptador lo pide a `/token` y, si no, a la cabecera `set-auth-jwt` de `/get-session`. Si Neon Auth no permite leer esa cabecera desde otro origen, solo funciona `/token` | media | Paso 7; lo dirá la consola |
| **CORS de la Data API** desde `web.app` | media | Paso 4.4 y paso 7 |
| **Esquema `gameshub` no expuesto** | media | Paso 4.2, plan B con prefijo en `public` |
| **Visitantes sin sesión y analítica.** La inserción anónima exige un rol `anonymous` en la Data API; las guardas lo detectan, y si no existe la analítica solo cuenta a quien ha iniciado sesión | baja | Aceptar, o guardar los eventos y enviarlos tras el login |
| **Arranque en frío del plan gratuito** (la base se duerme) y **0,5 GB compartidos con PolyGo** (si se llena, Neon suspende y caen las dos apps) | media | Los datos de Games Hub son pequeños (estimado de megabytes, no de gigas). El guardarraíl de tamaño de PolyGo (`/api/health`) ya avisa al 70 % |
| **Cuenta compartida con PolyGo** | media | Ver 1.1: borrar la cuenta de acceso desde Games Hub afectaría a PolyGo. Cerrar el registro abierto de Neon Auth cuando estén creadas las cuentas de la familia (PolyGo lo deja pendiente) |
| **Más peticiones que Firestore** en una partida (leer, escribir, sumar, ranking) | baja | Se pueden agrupar en una función RPC más adelante |
| **Pérdida de datos entre el cambio y la vuelta atrás** | media | Sección 8 |
| **Licencias** | baja | Confirmar una vez las licencias de la sección 1 antes de afirmarlas en público |
| **Versión de Postgres.** La vista `memberships` usa `security_invoker`, que exige PostgreSQL 15 o superior | baja | Neon ofrece 15, 16 y 17 |

## 11. Decisiones para el titular

1. **¿Mover también el alojamiento estático fuera de Firebase Hosting?** Hoy el requisito se cumple para datos y cuentas, no para la CDN de ficheros. Mover a GitHub Pages o Cloudflare Pages es un cambio de dominio y de los orígenes de confianza; además daría la ocasión de poner el proxy de autenticación que quita el riesgo de cookies de terceros.
2. **¿Qué hacer con "borrar mi cuenta" con la cuenta compartida?** Opciones: (a) borrar solo los datos de Games Hub y dejar la cuenta de acceso (recomendada), (b) borrar también la cuenta y por tanto el acceso a PolyGo, con aviso.
3. **¿Credenciales propias de Google para producción?** Las compartidas de Neon sirven para desarrollo; una app con datos de niños debería enseñar su propia pantalla de consentimiento.
4. **¿Cerrar el registro abierto en Neon Auth** en cuanto la familia tenga cuenta? Hoy cualquiera con un Google podría crearse una cuenta (no vería nada ajeno, pero tendría fila propia).
5. **¿Firmado el acuerdo de tratamiento de datos (DPA) con Neon?** Necesario por los datos de menores.
6. **¿Cuándo se hace el cambio** y cuánto tiempo se conserva Firestore como copia de seguridad antes de darlo de baja?
7. **Plan B del esquema** si la Data API de Neon no deja exponer `gameshub`: prefijo `gh_` en `public`.
