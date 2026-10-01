import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    // Hanya aktifkan Vue DevTools saat menjalankan `npm run dev`
    command === 'serve' ? vueDevTools() : null,
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vendor-vue'
            }
            if (id.includes('@remixicon') || id.includes('remixicon')) {
              return 'vendor-icons'
            }
            if (id.includes('axios')) {
              return 'vendor-utils'
            }
            if (id.includes('editor') || id.includes('tiptap') || id.includes('quill')) {
              return 'vendor-editor'
            }
            return 'vendor-others'
          }
        },
      },
    },
  },
}))
