import https from 'https';
import http from 'http';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const targetUrl = query.url ? String(query.url) : null;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parámetro URL inválido o ausente.'
    });
  }

  // Prevenir buffering innecesario en Nitro y enviar headers de audio
  setHeaders(event, {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*'
  });

  return new Promise((resolve, reject) => {
    const fetchStream = (currentUrl: string, redirects = 0) => {
      if (redirects > 5) {
        return reject(createError({ statusCode: 508, statusMessage: 'Demasiadas redirecciones.' }));
      }

      const client = currentUrl.startsWith('https') ? https : http;
      const req = client.get(
        currentUrl,
        {
          rejectUnauthorized: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': new URL(currentUrl).origin
          }
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const nextUrl = new URL(res.headers.location, currentUrl).toString();
            return fetchStream(nextUrl, redirects + 1);
          }

          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            return reject(createError({ statusCode: res.statusCode, statusMessage: 'Error remoto al obtener audio.' }));
          }

          if (res.headers['content-length']) {
            setHeader(event, 'Content-Length', res.headers['content-length']);
          }

          // Pipe directo a la respuesta de H3 / Nitro
          res.pipe(event.node.res);

          res.on('end', () => resolve(undefined));
          res.on('error', (err) => reject(err));
        }
      );

      req.on('error', (err) => reject(err));
    };

    fetchStream(targetUrl);
  });
});
