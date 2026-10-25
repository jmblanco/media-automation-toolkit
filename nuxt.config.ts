// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-10-24',
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },
  modules: ['@nuxt/ui'],
  colorMode: {
    preference: 'dark'
  },
  app: {
    head: {
      title: 'Kroma Studio — Creación y Montaje Audiovisual Automatizado',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kroma Studio: Tu estudio inteligente para la creación y montaje automatizado de vídeos, collages y bandas sonoras.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  nitro: {
    // Exponer directorio de salida para previsualización directa de vídeo
    publicAssets: [
      {
        baseURL: '/media-output',
        dir: 'output',
        maxAge: 0
      }
    ]
  }
});
