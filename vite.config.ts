import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'
import { writeFileSync } from 'node:fs'

const isCloudflare = !!process.env.CF_PAGES
const base = isCloudflare ? '/' : '/goal-tree-planner/'

// метка текущей сборки - используется для явной проверки версии на клиенте,
// в обход капризного жизненного цикла service worker (особенно на iOS)
const buildId = String(Date.now())

// пишем ту же метку в dist/version.txt при каждой сборке -
// клиент периодически сверяет её со своей вшитой версией
function writeVersionFile(): Plugin {
  return {
    name: 'write-version-file',
    apply: 'build',
    closeBundle() {
      writeFileSync('dist/version.txt', buildId)
    },
  }
}

export default defineConfig({
  base,
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    vue(),
    tailwindcss(),
    writeVersionFile(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Goal Tree Planner',
        short_name: 'Goal Tree',
        description: 'Декомпозиция целей на шаги и чек-листы в виде дерева',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F2F3EE',
        theme_color: '#3F7859',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})