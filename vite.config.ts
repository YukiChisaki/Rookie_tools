import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 核心库
          'vue-core': ['vue', '@vue/runtime-core'],
          // 状态管理
          'state': ['pinia'],
        },
        // 优化 chunk 命名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.names || [])[0] || ''
          if (info.endsWith('.css')) return 'assets/css/[name]-[hash][extname]'
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  // CSS 优化
  css: {
    devSourcemap: true,
  },
  // 依赖预构建优化
  optimizeDeps: {
    include: ['vue', 'pinia', '@vue/runtime-core'],
  },
}))
