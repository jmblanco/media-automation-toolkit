# ===================================================
# Kroma Studio - Dockerfile Multi-Stage Autocontenido
# ===================================================

# --- 1. Stage de Compilación (Builder) ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar paquetes nativos si se requiere
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build de Nuxt)
RUN npm install

# Copiar el código fuente completo
COPY . .

# Compilar la aplicación Nuxt 3 / Nitro para producción
RUN npm run build

# --- 2. Stage de Ejecución en Producción (Runner) ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Instalar FFmpeg con códecs completos y fuentes del sistema para subtítulos y renderizado
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-freefont-ttf \
    fonts-dejavu-core \
    fontconfig \
    ca-certificates \
    curl \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

# Configurar variables de entorno de producción
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    APP_ROOT=/app

# Copiar el bundle de producción generado por Nitro y assets iniciales (fuentes, samples)
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/assets ./assets

# Crear estructura de carpetas de almacenamiento y temporales
RUN mkdir -p /app/assets/images \
             /app/assets/videos \
             /app/assets/audios \
             /app/assets/fonts \
             /app/output \
             /app/tmp \
    && chown -R node:node /app

# Cambiar a usuario no-root por principio de mínimo privilegio (PoLP)
USER node

# Volúmenes recomendados para persistencia de datos
VOLUME ["/app/assets", "/app/output"]

# Exponer el puerto de la aplicación web
EXPOSE 3000

# Healthcheck nativo para orquestadores (Dockhand, Portainer, Docker Compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/assets || exit 1

# Iniciar servidor Nitro optimizado
CMD ["node", ".output/server/index.mjs"]
