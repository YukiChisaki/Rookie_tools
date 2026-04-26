/**
 * PWA 状态管理组合函数
 * 封装应用安装提示和 Service Worker 更新检测逻辑
 *
 * 安装检测策略（双重判断）：
 *   1. matchMedia(display-mode) — 当前是否在 PWA 独立窗口运行
 *   2. localStorage 标记 — appinstalled 事件触发后持久化记录
 *
 * @author Chisaki / 68142319
 * @since 2026-04-26 14:35:00
 */

import { ref, onMounted, onUnmounted } from 'vue'

/** beforeinstallprompt 事件类型（浏览器尚未标准化） */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** localStorage 中 PWA 安装状态的持久化 key */
const PWA_INSTALLED_KEY = 'rookie_tools_pwa_installed'

// ==================== 模块级单例状态 ====================
const canInstall = ref(false)
const isInstalled = ref(false)
const needUpdate = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null
let swRegistration: ServiceWorkerRegistration | null = null

// ==================== 安装状态检测 ====================

/**
 * 通过 matchMedia 检测当前是否在 PWA 独立窗口中运行
 * 覆盖所有主流浏览器的 PWA 显示模式
 */
const isInStandaloneMode = (): boolean => {
  const pwaDisplayModes = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
  return pwaDisplayModes.some((mode) =>
    window.matchMedia(`(display-mode: ${mode})`).matches,
  )
}

/**
 * 双重检测：display-mode 运行模式 + localStorage 持久化标记
 * 解决"浏览器标签页访问时无法识别已安装状态"的问题
 */
const checkInstalledStatus = (): boolean => {
  // 条件1：当前在 PWA 独立窗口运行
  if (isInStandaloneMode()) return true

  // 条件2：之前触发了 appinstalled 事件并持久化记录
  const savedFlag = localStorage.getItem(PWA_INSTALLED_KEY)
  if (savedFlag === 'true') return true

  return false
}

/** 将安装状态持久化到 localStorage */
const persistInstalledFlag = (installed: boolean) => {
  if (installed) {
    localStorage.setItem(PWA_INSTALLED_KEY, 'true')
  } else {
    localStorage.removeItem(PWA_INSTALLED_KEY)
  }
}

// ==================== 事件处理函数 ====================

/** 处理 beforeinstallprompt 事件 — 浏览器认为可以安装时触发 */
const handleBeforeInstallPrompt = (e: Event) => {
  console.log('[PWA] beforeinstallprompt 事件触发')
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
  canInstall.value = true
  console.log('[PWA] canInstall 已设置为 true')
}

/** 处理 appinstalled 事件 — 用户接受安装后触发 */
const handleAppInstalled = () => {
  console.log('[PWA] appinstalled 事件 — 用户接受了安装')
  isInstalled.value = true
  canInstall.value = false
  deferredPrompt = null
  // 持久化记录，下次打开标签页也能识别为已安装
  persistInstalledFlag(true)
}

/** 处理 SW 更新发现事件 */
const handleSWUpdate = (registration: ServiceWorkerRegistration) => {
  swRegistration = registration
  needUpdate.value = true
}

// ==================== 组合函数主体 ====================

/**
 * PWA 安装与更新管理组合函数
 * @returns PWA 响应式状态和操作方法
 */
export const usePwa = () => {
  let updateInterval: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    console.log('[PWA] usePwa composable 已挂载')

    // 初始化安装状态（双重检测）
    isInstalled.value = checkInstalledStatus()
    console.log(`[PWA] 初始化安装状态: isInstalled=${isInstalled.value}, standaloneMode=${isInStandaloneMode()}`)

    // 监听 PWA 生命周期事件
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 定期检查 SW 更新（每 60 分钟）
    if ('serviceWorker' in navigator) {
      updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration()?.then((reg) => {
          reg?.update()
        })
      }, 60 * 60 * 1000)

      // 监听 SW 控制器变更
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // 新 SW 已接管页面，刷新后生效
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })

  /**
   * 触发 PWA 安装或启动已安装的应用
   *
   * 分支逻辑（按优先级排序）：
   * - 有 deferredPrompt → 触发原生安装弹窗（最高优先）
   * - 已安装 + 在 PWA 窗口运行 → focus
   * - 已安装 + 在浏览器标签页 → 提示用户从桌面启动
   * - 无事件 → 引导用户手动操作或说明不可用原因
   *
   * @returns 操作结果字符串
   */
  const installApp = async (): Promise<string> => {
    console.log('[PWA] installApp 调用', {
      isInstalled: isInstalled.value,
      hasDeferredPrompt: !!deferredPrompt,
      standaloneMode: isInStandaloneMode(),
    })

    // ★ 分支1（最高优先级）：浏览器认为可安装 → 直接触发弹窗
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        deferredPrompt = null
        canInstall.value = false
        if (outcome === 'accepted') {
          isInstalled.value = true
          persistInstalledFlag(true)
          return 'installed'
        }
        return 'dismissed'
      } catch (error) {
        console.error('[PWA] 安装弹窗失败:', error)
        return 'error'
      }
    }

    // 分支2：已安装且在 PWA 窗口中运行 → focus
    if (isInstalled.value && isInStandaloneMode()) {
      window.focus()
      console.log('[PWA] 已在 PWA 模式运行，执行 focus')
      return 'focused'
    }

    // 分支3：已安装但在普通浏览器标签页 → 提示用户从桌面启动
    if (isInstalled.value) {
      console.log('[PWA] 应用已安装（非 PWA 窗口），提示用户从桌面启动')
      return 'installed'
    }

    // 分支4：无法触发安装（localhost 限制、已被拒绝、或不满足 PWA 安装条件）
    console.warn('[PWA] 无法触发安装：未捕获 beforeinstallprompt 事件')
    return 'unavailable'
  }

  /**
   * 刷新页面以加载新版本 Service Worker
   */
  const updateApp = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  /**
   * 注册 SW 更新回调（由 main.ts 调用）
   */
  const onSWUpdate = (registration: ServiceWorkerRegistration) => {
    handleSWUpdate(registration)
  }

  return {
    canInstall,
    isInstalled,
    needUpdate,
    installApp,
    updateApp,
    onSWUpdate,
  }
}
