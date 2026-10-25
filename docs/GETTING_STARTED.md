# 🚀 Guía de Inicio Rápido (Getting Started)

Guía completa para configurar el entorno local, añadir assets y ejecutar los generadores de vídeo.

---

## 1. Prerrequisitos

Antes de comenzar, asegúrate de contar con:
1. **Node.js** (versión 18 LTS o superior recomendada):
   ```bash
   node -v
   ```
2. **FFmpeg y FFprobe** instalados y accesibles en las variables de entorno (`PATH`):
   - **En Windows**:
     ```powershell
     # Con winget
     winget install Gyan.FFmpeg
     # O con Chocolatey
     choco install ffmpeg
     ```
   - **En macOS**:
     ```bash
     brew install ffmpeg
     ```
   - **En Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install -y ffmpeg
     ```
   - **Comprobación**:
     ```bash
     ffmpeg -version
     ffprobe -version
     ```

---

## 2. Instalación del Proyecto

1. Clona el repositorio e ingresa al directorio:
   ```bash
   git clone https://github.com/jmblanco/media-automation-toolkit.git
   cd media-automation-toolkit
   ```
2. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```

---

## 3. Estructura de Assets Requerida

El proyecto lee recursos desde la carpeta `assets/`. A continuación se detalla dónde situar cada archivo:

```
media-automation-toolkit/
├── assets/
│   ├── audios/        # Pistas de audio (.mp3, .wav) y subtítulos (.srt)
│   ├── fonts/         # Fuentes tipográficas TrueType (.ttf, .otf)
│   ├── images/        # Fotografías e imágenes (.jpg, .jpeg, .png)
│   └── videos/        # Clips de vídeo (.mp4, .mov, .mkv)
```

> [!NOTE]
> Los archivos multimedia pesados están ignorados en `.gitignore` para no saturar el repositorio de Git.

---

## 4. Modos de Uso

### 4.1 Generar Montaje de Vídeos (`video-maker`)
Combina varios vídeos cortos de `assets/videos/` en un único archivo normalizado:

1. Coloca tus archivos de vídeo en `assets/videos/`.
2. Configura los vídeos de inicio (`firstVideos`) o cierre (`lastVideos`) en `scripts/config/assets.config.js`:
   ```javascript
   firstVideos: ['intro.mp4'],
   lastVideos: ['outro.mp4']
   ```
3. Ejecuta el script:
   ```bash
   npm run video-maker
   ```
4. El resultado final se generará en:
   ```
   output/montaje_final.mp4
   ```

---

### 4.2 Generar Collage de Fotos con Música y Subtítulos (`collage-maker`)
Crea un vídeo sincronizado a partir de fotos distribuidas a lo largo de una pista de audio:

1. Coloca las imágenes en `assets/images/`.
2. Coloca la pista de audio en `assets/audios/` (por defecto busca `valentin_megamix.mp3`, configurable en `scripts/collage.maker.js`).
3. Coloca el archivo de subtítulos en `assets/audios/` (`valentin_megamix.srt`).
4. Coloca la fuente en `assets/fonts/` (`LuckiestGuy-Regular.ttf`).
5. Ejecuta el comando:
   ```bash
   npm run collage-maker
   ```
6. El resultado final se generará en:
   ```
   output/video_final.mp4
   ```

---

## 5. Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run video-maker` | Procesa y concatena los clips de vídeo de `assets/videos/`. |
| `npm run collage-maker` | Genera el vídeo de imágenes sincronizado con audio y subtítulos. |
| `npm run lint` | Ejecuta ESLint sobre todo el código fuente en `scripts/`. |
| `npm run format` | Aplica formato con Prettier sobre el directorio `scripts/`. |

---

## 6. Resolución de Problemas Frecuentes (Troubleshooting)

### Error: `ffprobe : El término 'ffprobe' no se reconoce...`
- **Causa**: FFmpeg no está instalado en el sistema operativo o no está registrado en la variable de entorno `PATH`.
- **Solución**: Instala FFmpeg según la sección 1 y reinicia tu terminal/IDE.

### Error: `No se encontraron videos para procesar en ...`
- **Causa**: La carpeta `assets/videos/` no contiene archivos `.mp4`, `.mov` o `.mkv`.
- **Solución**: Copia tus clips de vídeo en dicha carpeta antes de ejecutar el comando.

### Error de codificación en subtítulos
- **Causa**: Caracteres especiales o fuentes tipográficas incompatibles.
- **Solución**: Asegúrate de que el archivo `.srt` esté codificado en UTF-8 sin BOM y que la fuente `.ttf` esté presente en `assets/fonts/`.
