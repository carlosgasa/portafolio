# Portafolio

App web (PWA) de uso **estrictamente personal** para llevar mi portafolio de
inversiones y finanzas: cripto, bolsa, Finsus, YoTePresto, AFORE, Infonavit,
gastos de casa y cuentas por cobrar/pagar (tarjetas, personas, liquidez).
Un solo usuario autorizado, sin registro público.

## Stack técnico

- **React 19 + TypeScript**, bundler **Vite** (usa el motor rolldown-vite).
- **Tailwind CSS v4** (config vía `@theme`/`@custom-variant` en `src/index.css`,
  no `tailwind.config.js`) + **shadcn/ui** sobre el paquete unificado `radix-ui`.
- **TanStack Query** para todo el data-fetching/cache; cada hook de dominio
  sigue el patrón `useQuery` + `useMutation` con `invalidate()` en `onSuccess`.
- **react-router-dom v7** para el ruteo, con `React.lazy` + `Suspense` por página.
- **Recharts** para todas las gráficas (área con degradado, barras, pastel).
- **next-themes** para tema claro/oscuro (oscuro es el default histórico).
- **jsPDF** para exportar estados de cuenta como PDF (además de imagen vía
  `<canvas>` a mano y texto plano vía Web Share API).
- **vite-plugin-pwa** — la app es instalable (manifest + service worker,
  `registerType: "autoUpdate"` con recarga automática cuando hay versión nueva).
- **Firebase**: Auth (email/password) + Firestore (con persistencia offline
  vía `persistentLocalCache`). **No hay Cloud Functions en producción** — el
  código en `functions/` existe pero no está desplegado, para no requerir el
  plan de pago (Blaze) de Firebase.
- **App Android nativa** en `android/` (Kotlin + Jetpack Compose + MVVM +
  Clean Architecture + Hilt): vive en este mismo repo pero es un proyecto
  Gradle aparte, gitignorado, que se abre y maneja desde Android Studio. Solo
  tiene portado el módulo de Tarjetas + una notificación local (WorkManager)
  de pagos próximos; ver `android/README.md`.

## Arquitectura (Clean Architecture)

```
src/
  domain/
    entities/        # Tipos puros de cada módulo (Cripto, Bolsa, Finsus,
                      # YoTePresto, Afore, Infonavit, Casa, Cuentas, Dashboard)
    repositories/     # Interfaces (I*Repository) — el dominio no sabe que existe Firestore
  application/
    use-cases/        # Lógica que combina/deriva datos (ej. getCuentasOverview,
                      # getPortfolioHistory), agrupada por módulo
  infrastructure/
    firebase/
      config.ts               # Init de Firebase App/Auth/Firestore
      crud.ts                 # Helpers genéricos (listAll/addItem/updateItem/deleteItem)
      backupCollections.ts    # Lista de TODAS las colecciones (para export/restore)
      repositories/           # Implementaciones Firestore*Repository de cada interfaz
      auth/                   # signIn/signOut/subscribeToAuthState
  presentation/
    hooks/            # use*Portfolio — wrappers de TanStack Query por módulo,
                      # más hooks de preferencias locales (useHiddenBalances,
                      # useZoomLevel, useStartPage, useSectionColors) con el
                      # patrón useSyncExternalStore + localStorage (nunca
                      # useState local para esto: si cada instancia tuviera su
                      # propio estado, un cambio en un lado no se reflejaría
                      # en otro hasta recargar)
    pages/            # Una página por módulo + AppLayout/nav
    components/       # Compartidos (StatCard, Money, ValueHistoryCard,
                      # MovementsList, SnapshotHistory, BackupDialog, etc.)
    providers/        # AuthProvider (contexto de sesión)
  shared/
    utils/            # format.ts, dates.ts, evalAmountExpression.ts (parser
                      # propio de fórmulas tipo hoja de cálculo, sin eval/Function)
```

Cada módulo de inversión (Cripto, Bolsa, Finsus, YoTePresto) sigue el mismo
patrón: holdings/cuentas + movimientos, con precio actualizable y cálculo de
`valorTotal`/`aporteTotal`/`rendimiento`. AFORE e Infonavit son más simples
(solo una serie de puntos fecha+saldo, registrados manualmente cada mes vía
`ValueHistoryCard`, que además soporta proyectar el saldo a futuro con una
recta de tendencia por mínimos cuadrados sobre el histórico).

## Modelo de datos (Firestore)

Todo vive bajo `users/{uid}/{coleccion}` (un solo `uid`, el del único usuario
autorizado). Ver `src/infrastructure/firebase/backupCollections.ts` para la
lista completa y actualizada; a la fecha:

| Módulo | Colecciones |
|---|---|
| Cripto | `criptoHoldings`, `criptoMovimientos`, `criptoPrecios` |
| Bolsa | `bolsaHoldings`, `bolsaMovimientos`, `bolsaPrecios` |
| Finsus | `finsusCuentas`, `finsusMovimientos` |
| YoTePresto | `yotePrestoValores`, `yotePrestoMovimientos` |
| AFORE | `aforeValores` |
| Infonavit | `infonavitSaldos` |
| Casa | `casaGastos` |
| Cuentas — Tarjetas | `tarjetas`, `tarjetaPagos` |
| Cuentas — Personas | `personas`, `deudas`, `cuotas` |
| Cuentas — Liquidez | `liquidez`, `liquidezHistorial` (historial automático por edición) |
| Cuentas — snapshots | `cuentasSnapshots` (foto manual del total de una pestaña en una fecha) |
| Dashboard | `snapshots` (foto semanal automática del portafolio completo) |

El snapshot semanal (`snapshots`) lo dispara el cliente (`useAutoWeeklySnapshot`)
al abrir la app si ya pasó el domingo más reciente sin snapshot — **no** hay
cron/Cloud Function corriendo esto, por la misma razón de evitar el plan
Blaze. Solo cubre los instrumentos de **inversión** (Cripto, Bolsa, Finsus,
YoTePresto, AFORE); Infonavit es un pasivo y se resta aparte en "Patrimonio
neto" del Dashboard, sin mezclarse en las gráficas de activos.

## Autenticación y seguridad

- **Un solo usuario**, dado de alta a mano desde la consola de Firebase
  (Authentication → Users). **No existe pantalla de registro** en la app —
  `LoginPage` solo tiene inicio de sesión con email/contraseña.
- El correo autorizado vive en la variable de entorno `VITE_ALLOWED_EMAIL`
  (nunca hardcodeado ni en este archivo). `AuthProvider` compara
  `user.email === ALLOWED_EMAIL` para decidir si mostrar la app o `LoginPage`
  — esto es solo UX (feedback inmediato si alguien más inicia sesión).
- La seguridad real la hacen **las reglas de Firestore** (`firestore.rules`):
  ```
  match /users/{uid}/{document=**} {
    allow read, write: if request.auth != null
      && request.auth.token.email == '<correo autorizado>';
  }
  ```
  Esto es lo que de verdad bloquea a cualquiera que no sea el usuario
  autorizado, sin importar que la config pública de Firebase (`apiKey`, etc.)
  esté en el bundle del cliente — eso es normal y esperado en Firebase, la
  config del cliente nunca fue el mecanismo de seguridad.
- Variables de entorno (ver `.env.example`, sin valores): `VITE_FIREBASE_API_KEY`,
  `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
  `VITE_FIREBASE_APP_ID`, `VITE_ALLOWED_EMAIL`. Van en `.env` (gitignorado).

## Decisiones de diseño / UX ya tomadas

- **Tema**: oscuro "cyberpunk" con degradados neón cian→magenta como color
  de marca (fondo con glow radial, StatCards con degradados tipo dashboard
  AZORA); tema claro agregado después vía `next-themes`, con paleta propia en
  `index.css` (no solo invertir el oscuro). Toggle en el pie del menú.
- **Decimales**: siempre 2 decimales en toda la app (`formatCurrency` los
  fuerza internamente); no es opcional por pantalla.
- **Ocultar saldos**: botón global (`useHiddenBalances`) que enmascara todos
  los montos con `••••••` — útil para tomar captura sin exponer cifras reales.
  Compartir (WhatsApp/PDF/imagen) siempre muestra el monto real aunque esté
  oculto en pantalla: es una acción explícita de mostrarle algo a alguien más.
- **Montos con fórmula**: `AmountInput` acepta `=635+876-88` estilo hoja de
  cálculo (parser propio en `evalAmountExpression.ts`, sin `eval`/`Function`
  por seguridad). En Android, el teclado es decimal por default y cambia a
  texto completo automáticamente en cuanto se detecta el `=` inicial.
- **Colores por sección**: cada quien puede asignarle un color de acento a
  cada ítem del menú (`useSectionColors`, preferencia local, no en Firestore).
- **Zoom global**: control +/-/reset en el pie del menú (`useZoomLevel`, CSS
  `zoom` sobre `<html>`) — como PWA instalada, el pinch-to-zoom nativo no
  funciona en la mayoría de plataformas aunque el viewport lo permita.
- **Pantalla de inicio configurable**: en Configuración se elige a qué
  sección abre la app al entrar a "/" (`useStartPage`). El redirect solo
  ocurre la primera vez por sesión (`sessionStorage`), no en cada visita a
  "/" — si no, el propio link de "Dashboard" del menú quedaría inalcanzable
  en cuanto se elige otra pantalla de inicio.
- **Backup/restore manual**: exporta *todas* las colecciones a un `.json` con
  vista previa de conteos antes de descargar; restaurar muestra un diff
  (nuevos/actualizados/sin cambios) antes de confirmar, y nunca borra
  documentos que no estén en el backup (solo crea/sobrescribe por ID).
- **Patrimonio neto** (Dashboard) = activos de inversión + liquidez + lo que
  me deben − tarjetas pendientes − adeudo Infonavit. Se calcula en vivo a
  partir de los datos actuales de cada módulo, no del snapshot semanal (que
  puede estar desactualizado).
- **Gráficas**: paleta categórica fija por instrumento (nunca por posición en
  un arreglo que se reordena), verde/magenta para positivo/negativo en vez de
  rojo/verde (más accesible para daltonismo), relleno con degradado en vez de
  plano, gradiente de marca (cian→magenta) reservado para el ícono/branding.
- **Ícono de la app**: glifo propio (barras ascendentes con degradado
  cian→magenta), no un ícono genérico de librería — se usa igual en
  `public/favicon.svg`, los íconos de la PWA y `BrandMark.tsx` (el logo
  dentro de la app).
- **Deploy solo de hosting**: `firebase deploy --only hosting` — nunca se
  despliegan Cloud Functions salvo que se pida explícitamente cambiar de
  plan. Las reglas de Firestore se despliegan aparte solo cuando cambian.
- **Git**: el autor de los commits usa un correo configurado *solo local* a
  este repo (no global), y los commits/deploys solo se hacen cuando el
  usuario lo pide explícitamente.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build         # tsc -b && vite build
npm run lint           # oxlint
npx --yes firebase-tools@latest deploy --only hosting --project portafolio-85dd8
```
