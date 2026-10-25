# 🐳 Guía de Despliegue con Docker

Esta guía detalla cómo desplegar **Kroma Studio** de forma 100% autocontenida en cualquier servidor, NAS o equipo secundario utilizando **Docker Compose** o gestores como **Portainer**.

---

## 🏗️ Arquitectura del Contenedor

El contenedor de Kroma Studio está optimizado siguiendo principios de **12-Factor App** y **Mínimo Privilegio (PoLP)**:
- **Base Multi-Stage**: Basado en `node:20-bookworm-slim` con FFmpeg completo (soporte x264, mp3lame, fuentes TTF/OTF y libass para subtítulos).
- **Ejecución no-root**: El proceso corre bajo el usuario sin privilegios `node:node`.
- **Salud del contenedor**: Healthcheck nativo consultando el endpoint `/api/assets` cada 30 segundos.
- **Persistencia**: Volúmenes aislados para entradas (`/app/assets`) y resultados (`/app/output`).

---

## 🚀 Despliegue Rápido con Docker Compose

### 1. Clonar o descargar el repositorio
```bash
git clone https://github.com/tu-usuario/media-automation-toolkit.git
cd media-automation-toolkit
```

### 2. Configurar variables de entorno (opcional)
Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto expuesto en el host | `3000` |
| `JAMENDO_CLIENT_ID` | API Key opcional de Jamendo para explorar pistas musicales | *(Opcional)* |

### 3. Levantar la aplicación
```bash
docker compose up -d --build
```

Una vez levantado, accede a:
👉 **`http://<IP-DE-TU-SERVIDOR>:3000`**

---

## 🎛️ Despliegue en Portainer (Stack Web)

Si gestionas tus contenedores desde una interfaz gráfica como **Portainer**:

1. En Portainer, ve a la sección **Stacks** -> **Create Stack**.
2. Asigna un nombre al stack: `kroma-studio`.
3. Pega el siguiente contenido en el editor web:

```yaml
version: '3.8'

services:
  kroma-studio:
    container_name: kroma-studio
    build:
      context: https://github.com/tu-usuario/media-automation-toolkit.git#main
      dockerfile: Dockerfile
    image: kroma-studio:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
      - PORT=3000
      - APP_ROOT=/app
    volumes:
      - kroma_assets:/app/assets
      - kroma_output:/app/output
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/assets || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 512M

volumes:
  kroma_assets:
  kroma_output:
```

4. Pulsa en **Deploy Stack** (o **Save & Deploy**).
5. ¡Listo! El orquestador clonará la rama, construirá la imagen optimizada y mantendrá el servicio activo con auto-reinicio.

---

## 📂 Gestión de Archivos y Volúmenes

- **Subida vía Web**: Puedes arrastrar y soltar imágenes, vídeos o audios directamente desde la interfaz gráfica de Kroma Studio.
- **Acceso Directo al Host**: Si usas volúmenes locales (`./assets` y `./output`):
  - Puedes copiar archivos directamente a `assets/images/`, `assets/audios/` o `assets/videos/` en el host; la interfaz los detectará inmediatamente.
  - Los vídeos renderizados estarán disponibles en `output/` listos para ser consumidos o distribuidos.
