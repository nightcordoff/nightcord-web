import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = string
declare module "/home/hiem/code-ubuntu/perso/nightcord-web/front-end/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}