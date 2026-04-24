import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import AutoImport from "unplugin-auto-import/vite";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // 按需自动导入 naive-ui 组件
    Components({
      resolvers: [NaiveUiResolver()],
      dts: "src/components.d.ts",
    }),
    // 按需自动导入 naive-ui 相关 API
    AutoImport({
      imports: [
        "vue",
        {
          "naive-ui": [
            "useDialog",
            "useMessage",
            "useNotification",
            "useLoadingBar",
          ],
        },
      ],
      dts: "src/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      // @ 符号指向 src 目录
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 核心库
          "vue-core": ["vue", "@vue/runtime-core"],
          // 状态管理
          state: ["pinia"],
        },
        // 优化 chunk 命名
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.names || [])[0] || "";
          if (info.endsWith(".css")) return "assets/css/[name]-[hash][extname]";
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(info)) {
            return "assets/images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
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
    include: ["vue", "pinia", "@vue/runtime-core"],
  },
}));
