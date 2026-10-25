# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-10-25

### Added
- **Despliegue 100% Autocontenido con Docker Compose & Portainer**:
  - `Dockerfile` multi-stage optimizado (`node:20-bookworm-slim`):
    - Stage de compilación Nuxt 3 / Nitro y empaquetado de assets.
    - Stage de ejecución con FFmpeg nativo completo, tipografías TTF/OTF del sistema, `fontconfig` y `ca-certificates`.
    - Cumplimiento de Principio de Mínimo Privilegio (PoLP): ejecución como usuario sin privilegios `node:node`.
    - Healthcheck nativo verificando `/api/assets` periódicamente.
  - `docker-compose.yml` para despliegue en un solo clic compatible con Docker Compose v2 y Portainer.
  - Volúmenes persistentes (`./assets` y `./output`) para gestionar fotos, vídeos, audios y montajes finales desde el host o el navegador.
  - Archivo de entorno modelo [`.env.example`](.env.example).
  - Guía completa de despliegue en servidor / NAS: [`docs/DOCKER_DEPLOYMENT.md`](docs/DOCKER_DEPLOYMENT.md).

---

## [1.4.0] - 2026-10-25

### Added
- **Identidad de Marca y Rebranding a "Kroma Studio"**:
  - Nuevo nombre de marca: **Kroma Studio** (*Automated Media Studio*).
  - Isotipo vectorial SVG original de alta resolución ([`public/logo.svg`](public/logo.svg)) que fusiona la "K" geométrica con fotogramas de celuloide y el símbolo de avance/reproducción sobre un degradado cinematográfico índigo-violeta-magenta.
  - Favicon vectorial renovado ([`public/favicon.svg`](public/favicon.svg)).
  - Componente Vue reutilizable [`components/AppLogo.vue`](components/AppLogo.vue) con variantes de tamaño (`sm`, `md`, `lg`), badge de estudio y tagline.
  - Actualización completa de la interfaz web en [`app.vue`](app.vue) (Navbar con logo, footer) y [`pages/index.vue`](pages/index.vue) (Banner de bienvenida renovado con marca de agua y paleta Kroma).
  - Títulos y metadatos SEO actualizados en [`nuxt.config.ts`](nuxt.config.ts) y [`package.json`](package.json).

---

## [1.3.1] - 2026-10-24

### Fixed
- **Streaming de Vídeo y Audio en Navegadores y Móviles**:
  - Implementado endpoint nativo de streaming `server/api/media/[file].ts` con soporte completo para peticiones `Range` y respuestas `206 Partial Content`.
  - Resuelto error 404 al reproducir vídeos de `output/` en navegadores móviles (Chrome Android / iOS Safari).
- **Preescucha de Canciones sin Bloqueos de CORS**:
  - Implementado endpoint proxy local `server/api/music/proxy.ts` para transmitir el audio de las pistas de estudio sin sufrir bloqueos `403 Forbidden` ni restricciones de hotlinking de CDNs externas.
  - Actualizado `components/MusicHubModal.vue` para reproducir a través del proxy local.

---

## [1.3.0] - 2026-10-24

### Added
- **Centro Musical (Music Hub Modal)**:
  - Integrada biblioteca de música real producida en estudio (100% libre de derechos y gratuita) mediante Jamendo y colección curada de alta fidelidad.
  - Reproductor de preescucha interactiva antes de elegir la canción.
  - Botón **"Usar en Vídeo"**: descarga en streaming el MP3 de estudio a `assets/audios/` y lo auto-selecciona en el montaje.
  - **Flujo Guiado de Suno AI sin coste**: Enlace a Suno.com para crear canciones personalizadas con los 50 créditos diarios gratuitos y uploader drag-and-drop integrado para soltar el archivo resultante.
- **Servicio y Endpoints de Exploración Musical**:
  - `server/services/music/jamendo.service.ts` con soporte para `JAMENDO_CLIENT_ID` y fallback automático a colección de estudio.
  - `GET /api/music/explore`: Búsqueda y filtrado por estilos (*Lofi*, *Acoustic*, *Pop*, *Cinematic*, *Piano*).
  - `POST /api/music/download`: Descarga en disco gestionando certificados y redirecciones.

---

## [1.2.0] - 2026-10-24

### Added
- **Módulo de Composición Musical con Inteligencia Artificial**:
  - Arquitectura desacoplada mediante interfaz `IMusicProvider` (`server/services/ai/music/`).
  - Proveedor **Suno AI** (`suno.provider.ts`) para canciones completas con instrumentación de estudio o voces temáticas.
  - Proveedor **Meta MusicGen** (`musicgen.provider.ts`) vía Replicate API oficial para generación rápida de pistas instrumentales de fondo.
  - Endpoint `POST /api/ai/generate-music` para solicitar composiciones y guardarlas directamente en `assets/audios/`.
  - Endpoint `GET /api/ai/providers` para consultar el estado de activación de cada proveedor.
- **Componente Visual `components/AiMusicModal.vue`**:
  - Selector interactivo de motor (Suno vs MusicGen) con indicador de estado.
  - Presets rápidos de estilos con un clic (*Chill Lofi*, *Pop Verano*, *Épico Cine*, *Acústico*, *Cumpleaños*).
  - Opción de alternar entre instrumental y pista cantada.
  - Auto-selección de la pista generada en el asistente de Collage Maker.
- Archivo de configuración modelo [`.env.example`](.env.example) con variables para `SUNO_API_KEY`, `SUNO_API_URL` y `REPLICATE_API_TOKEN`.

### Changed
- Eliminadas alertas amarillas intrusivas de "carpeta vacía" en las vistas web (`pages/video-maker.vue` y `pages/collage.vue`), sustituyéndolas por estados vacíos interactivos centrados en la subida Drag & Drop.

---

## [1.1.0] - 2026-10-24

### Added
- **Aplicación Web Nuxt 3 Full-Stack** integrada en la raíz del repositorio (`npm run dev`).
- **Dashboard Reactivo (`pages/index.vue`)**: Métricas de catálogo en tiempo real, accesos a asistentes y reproductor HTML5 de vídeos generados.
- **Asistente Visual Video Maker (`pages/video-maker.vue`)**: Configuración con selección visual de Intro, Outro y mezcla de clips.
- **Asistente Visual Collage Maker (`pages/collage.vue`)**: Configuración de pistas de audio, selección de relación de aspecto (16:9 vs 9:16 vertical), subtítulos y fuentes.
- **Canal de Progreso en Tiempo Real (Server-Sent Events)**: Endpoint `/api/render/progress` con modal reactivo (`components/RenderProgressModal.vue`) que muestra el porcentaje exacto y la etapa de renderizado de FFmpeg.
- **Subida Drag & Drop (`components/MediaUploader.vue`)**: Endpoint `/api/upload` con clasificación automática de archivos multimedia por extensión.
- **Capa de Servicios Multimedia (`server/services/media.service.ts`)**: Orquestación asíncrona de renderizados en segundo plano con emisión de eventos.
- **Soporte Multiformato**: Añadida capacidad para renderizar montajes en formato vertical 9:16 (TikTok, Reels, Shorts) u horizontal 16:9.

### Changed
- Refactorización completa de `scripts/tools/media.tools.js` hacia **Promesas y `async/await`** con soporte para hooks de progreso (`onProgress`).
- Actualización de los scripts CLI `scripts/video.maker.js` y `scripts/collage.maker.js` para usar la nueva API asíncrona con gestión de errores `try/catch/finally`.

---

## [1.0.1] - 2026-10-24

### Fixed
- Corregida la duplicación y sobreescritura de `getImageFile` en `scripts/config/assets.config.js`, renombrando la segunda función a `getVideoFile`.
- Corregidas las rutas de los scripts `lint` y `format` en `package.json` para apuntar a `scripts` en lugar de una carpeta inexistente `tools`.
- Añadida regla en `.gitignore` para ignorar los streams de zona `*:Zone.Identifier` en entornos Windows NTFS.
- Desacoplada y clarificada la compatibilidad con Node.js (`>=18.0.0`) en `package.json` para garantizar soporte con `Array.prototype.at()`.

---

## [1.0.0] - 2025-09-20

### Added
- Estructura inicial del proyecto con soporte para montajes audiovisuales en Node.js.
- Script generador de collage de imágenes con música y subtítulos (`scripts/collage.maker.js`).
- Script generador de vídeo concatenado con transcodificación uniforme (`scripts/video.maker.js`).
- Módulo de utilidades de sistema de archivos (`scripts/tools/fs.tools.js`).
- Módulo de herramientas multimedia con Sharp, FFmpeg y FFprobe (`scripts/tools/media.tools.js`).
- Deduplicación perceptual de imágenes mediante hash de mapa de bits raw a 256px.
- Configuración de formateo y estilo con ESLint, Prettier, Husky y lint-staged.
