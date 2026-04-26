import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import AutoImport from "unplugin-auto-import/vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 使用相对路径，确保本地测试和任意部署路径都能正常工作
  const base = "./";

  return {
    // GitHub Pages 部署需要设置仓库名作为 base 路径
    base,
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
      // PWA 离线支持插件
      VitePWA({
        registerType: "autoUpdate",
        // 关闭开发模式，避免 Workbox 干扰 Vite 开发服务器
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: "Rookie Tools - AI 绘画提示词工具箱",
          short_name: "Rookie Tools",
          description:
            "专为 AI 绘画爱好者打造的本地离线 Prompt 工具箱，支持 ComfyUI / SD WebUI / NovelAI 图片解析与提示词管理",
          theme_color: "#3498db",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          // 根据环境动态设置 scope 和 start_url
          scope: base,
          start_url: base,
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          // 预缓存所有构建产物
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "index.html",
          // 清理旧版本 SW 缓存
          cleanupOutdatedCaches: true,
        },
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
  };
});
