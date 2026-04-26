/**
 * Rookie Tools 应用入口
 * 初始化 IndexedDB、Pinia、Service Worker
 * @author Chisaki / 68142319
 * @since 2026-04-26
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/index.css'
import App from './App.vue'
import { db } from './services/db'

const init = async () => {
  // 初始化 IndexedDB
  await db.init()

  const app = createApp(App)

  // 使用 Pinia
  app.use(createPinia())

  app.mount('#app')

  // 注册 PWA Service Worker（仅生产环境）
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({
      onRegisteredSW(_swUrl, registration) {
        // 定期检查 SW 更新（每 60 分钟）
        if (registration) {
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        }
      },
      onRegisterError(error) {
        console.error('SW registration error:', error)
      },
    })
  }
}

init().catch(console.error)
