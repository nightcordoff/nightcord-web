export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: 'https://nightcord-web-private.onrender.com',
      firebaseUrl: 'https://nightcord-174e9-default-rtdb.firebaseio.com',
    }
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701,900,901,1,2&f[]=jet-brains-mono@101,200,201,300,301,400,401,500,501,600,601,700,701,800,801,1,2&display=swap'
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/image.png'
        }
      ]
    }
  },
})
