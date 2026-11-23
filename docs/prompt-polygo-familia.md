# Prompt para PolyGo: cuenta familiar con varios adultos

Copia todo lo que hay bajo la línea y pégalo en una sesión nueva dentro del repo de PolyGo.

---

Trabajas en PolyGo (Next.js 16 + React 19, Neon Postgres con Neon Auth y Data API, RLS en `db/permissions`, migraciones en `db/migrations`). Lee primero `CLAUDE.md`, `AGENTS.md`, `LAST_SESSION.md` si existe, `docs/02-especificacion-funcional.md` (sección 2.2 y 2.3, modelo de cuenta familiar), `docs/04-modelo-datos.md` (sección 2.3 cuentas y perfiles), `docs/05-contenido-legal.md` y `docs/14-vocabulario-por-curso-y-puente-games-hub.md`. No cambies nada hasta haber leído el esquema real (`db/migrations`, `db/permissions`) y las pantallas actuales de selector de perfil y panel de familia.

## Objetivo

Hoy una cuenta (`account`, un adulto titular) tiene N perfiles (`profile`), adultos o niños sin credenciales. Quiero que **otros adultos de confianza** (madre, padre, abuelos, un tutor) entren con **su propia cuenta** y puedan usar los **mismos perfiles de niño**, con el mismo progreso, sin compartir contraseñas. Es el mismo modelo que acabamos de diseñar para Games Hub (otra app mía, Firestore). Debe quedar coherente entre las dos: mismo vocabulario, mismos roles, mismo texto legal.

## Roles

- `owner`: el titular de la cuenta (ya existe). Todo: crear y borrar perfiles, invitar, revocar, exportar y borrar la cuenta.
- `editor`: puede ver y practicar con los perfiles de niño (leer y guardar progreso, sesiones, SRS), crear perfiles; no puede borrar perfiles, ni invitar, ni tocar los ajustes de adulto del titular (PIN, recordatorios, límites diarios).
- `viewer`: solo lee el progreso (profesor, familiar que solo mira).
Máximo 6 miembros invitados por cuenta (límite en la app).

## Datos (adapta nombres a nuestro esquema real)

- Tabla `account_member`: `account_id` (titular), `member_account_id` (la cuenta del invitado, que ya existe en `account`), `role` (`editor`|`viewer`), `created_at`, `invite_id`. Clave primaria `(account_id, member_account_id)`.
- Tabla `account_invite`: `id`, `account_id`, `owner_name` (nombre visible, nunca el email del titular), `email` (minúsculas), `role`, `created_at`, `expires_at` (30 días). Se consume al aceptar.
- Los perfiles y todo su progreso siguen colgando del titular: **no hay migración de datos ni duplicados**.
- Políticas RLS: el titular y los miembros leen los perfiles de niño y su progreso (`profile_lexeme_status`, `profile_item_state`, sesiones, etc.); escribe el titular y los `editor`; solo el titular borra perfiles. Un miembro **no** lee ni escribe los ajustes del titular ni su perfil adulto. `account_member`: lo lee el titular y el propio miembro; lo crea solo quien acepta una invitación válida (email verificado igual al de la invitación, no caducada) mediante una función `SECURITY DEFINER` con comprobaciones estrictas, nunca con una política abierta; lo borran el titular o el propio miembro. `account_invite`: la crea el titular; la leen el titular y el invitado (por email verificado); no se actualiza.
- Revisa cada tabla que se consulte por `account_id` o `profile_id` y deja el helper de RLS en un único sitio (por ejemplo `can_read_profile(profile_id)` y `can_edit_profile(profile_id)`) para no repetir la lógica.

## Flujos

1. **Invitar**: en el panel de familia, el titular escribe el email y elige rol; se crea la invitación y la app le da un texto listo para compartir por WhatsApp con el enlace de PolyGo. No enviamos email automático desde el servidor.
2. **Aceptar**: el invitado inicia sesión (Google u otro método de Neon Auth) con ese email; la app muestra una tarjeta "Familia de {nombre} te invita como {rol}. Podrás ver y practicar con sus niños. Se comparte: nombres de perfil, avatar y progreso. No se comparte tu cuenta." con Aceptar o Rechazar.
3. **Practicar**: en el selector de perfil (estilo Netflix) aparecen su propio perfil y, por cada familia a la que pertenece, los perfiles de niño de esa familia, etiquetados con el nombre de la familia. Al elegir uno, todo el progreso se lee y escribe en el perfil del niño (el del titular).
4. **Revocar**: el titular quita a un miembro y pierde el acceso al instante. El miembro puede salir cuando quiera.
5. **Borrado de la cuenta del titular**: además de lo actual, borra miembros e invitaciones. Exportación de datos del titular: incluir la lista de miembros.

## RGPD y seguridad infantil

Solo se comparte con adultos que el titular nombra y que aceptan con email verificado. El invitado ve apodo, avatar y progreso del niño, no el email del titular. El titular declara tener la patria potestad o autorización al crear perfiles de niño y al invitar. Todo es revocable. Actualiza `docs/05-contenido-legal.md` y la política de privacidad con un apartado de cuentas familiares (qué se comparte, base legal: consentimiento del titular y aceptación del invitado, revocación, que no se envía email automático).

## Interfaz

Pantalla "Familia" en ajustes del adulto (solo titular): invitar, lista de miembros con quitar. Tarjeta de invitaciones pendientes en la pantalla de inicio de cualquier cuenta. Lista "Familias a las que pertenezco" con botón Salir. Móvil primero, objetivos táctiles de 48 px, textos en los idiomas que ya soportamos (todas las claves en todos los idiomas), sin dependencias nuevas, texto de usuario siempre escapado.

## Puente con Games Hub

El inicio de sesión con Google por el mismo email ya identifica a la persona en ambas apps. No compartas datos entre las dos apps: cada una mantiene su propia familia. Si ya existe el selector "quién juega" enlazado desde Games Hub, que respete los perfiles de las familias a las que pertenece.

## Pruebas y entrega

- Migración nueva `00NN_family_members.sql` con las tablas, funciones y políticas; pruebas en `db/tests` que cubran: invitado con otro email no acepta, email sin verificar no acepta, invitación caducada no se acepta, `editor` lee y escribe progreso pero no borra perfiles ni toca ajustes del titular, `viewer` solo lee, un miembro de otra familia no accede, tras quitar al miembro pierde el acceso.
- Pruebas de interfaz (vitest o lo que use el repo) para la pantalla Familia y el selector con familias.
- Todo lo existente debe seguir pasando (`npm test` o el comando del repo). No toques ficheros ajenos a esta función. No hagas commit ni despliegue sin que yo lo pida. Al terminar, resume: migración, políticas, pantallas, pruebas, y lo que no hayas podido verificar.
