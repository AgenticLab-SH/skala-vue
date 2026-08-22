import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  // dev는 루트에서, production preview와 GitHub Pages는 저장소 하위 경로에서 실행합니다.
  base: mode === 'development' ? '/' : '/skala-vue/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5176,
  },
}))
