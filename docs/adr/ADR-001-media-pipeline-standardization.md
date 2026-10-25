# ADR-001: Estandarización de Pipelines Multimedia y Gestión de Transcodificación

- **Estado**: Aceptado
- **Fecha**: 2026-10-24
- **Autores**: Equipo de Arquitectura & Media Automation Toolkit

---

## Contexto y Problema

El proyecto procesa conjuntos arbitrarios de clips de vídeo e imágenes de diversas fuentes (cámaras de teléfonos inteligentes, grabaciones de WhatsApp, descargas web). Estos archivos presentan:
1. Resoluciones dispares (vertical 1080x1920, horizontal 1920x1080, formatos 4:3, etc.).
2. Variabilidad en framerates (24fps, 29.97fps, 30fps, 60fps) y timebases.
3. Codecs de audio incompatibles o clips sin pistas de audio.
4. Presencia de imágenes idénticas o duplicadas.

Intentar concatenar vídeos directamente mediante el demuxer de concatenación rápida (`-c copy`) sin transcodificación previa produce desfases de sincronización A/V, fallos de renderizado y artefactos visuales.

---

## Alternativas Evaluadas

### Alternativa 1: Concatenación en un solo paso mediante Filter Complex (`-filter_complex concat`)
- **Pros**:
  - Un único comando FFmpeg sin necesidad de archivos temporales intermedios.
- **Contras**:
  - Alta demanda de memoria RAM si la lista de vídeos es extensa (decodificación simultánea en grafo).
  - Complejidad en la depuración y alta probabilidad de caída total si un clip está corrupto.

### Alternativa 2: Transcodificación Normalizada Intermedia en 2 Fases (Enfoque Adoptado)
- Fase 1: Reencodear individualmente cada clip a un estándar común (H.264, 30fps, 1080p, AAC 44.1kHz estéreo).
- Fase 2: Concatenar mediante `concat demuxer` con `-c copy`.
- **Pros**:
  - Resiliente: procesamiento secuencial o por lotes con bajo consumo de memoria.
  - Facilidad para aislar clips con errores.
  - La fase final de unión es casi instantánea (stream copy).
- **Contras**:
  - Requiere almacenamiento en disco temporal (`tmp/`).
  - Doble paso de I/O en disco.

### Alternativa 3: Edición y Composición Exclusiva por Canvas WebGL (`ffmpeg-concat`)
- **Pros**:
  - Permite transiciones gráficas avanzadas (gl-transitions, wipes, dissolves).
- **Contras**:
  - Requiere dependencias nativas complejas (`headless-gl`, contexto OpenGL funcional).
  - Puede fallar en entornos de servidor o contenedores sin aceleración por GPU.

---

## Decisión Final

Se adopta la **Alternativa 2 (Transcodificación Normalizada Intermedia en 2 Fases)** como el flujo de trabajo estándar para `video.maker.js`.
Para el pipeline de imágenes (`collage.maker.js`), se adopta la **deduplicación perceptual por Sharp** (redimensionado a 256px y hash MD5 de mapa de bits sin canal alfa) previa al armado del archivo descriptor de FFmpeg.

---

## Consecuencias y Trade-offs

- **Positivas**:
  - Garantía de estabilidad en montajes con vídeos heterogéneos.
  - Reproducción garantizada en cualquier reproductor H.264 / AAC.
  - No requiere aceleración gráfica específica de hardware para funcionar de forma confiable.
- **Negativas**:
  - Tiempo de procesamiento proporcional a la suma de duraciones de los clips.
  - Dependencia de un directorio temporal (`tmp/`) que debe ser purgado limpiamente tras la ejecución.
