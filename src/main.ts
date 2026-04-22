import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/index.css'
import App from './App.vue'
import { db } from './services/db'

async function init() {
  // Initialize IndexedDB
  await db.init()
  
  const app = createApp(App)
  app.use(createPinia())
  app.mount('#app')
}

init().catch(console.error)
