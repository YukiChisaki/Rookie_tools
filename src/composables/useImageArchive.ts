/**
 * 原图归档 Composable — 提供响应式状态和操作方法
 * 封装 ImageArchiveService，供组件使用
 *
 * @author Chisaki (ID: 68142319)
 * @since 2026-05-12 18:42:00
 */
import { ref, computed } from 'vue'
import { imageArchiveService } from '../services/imageArchive'
import type { ArchiveModuleName } from '../services/imageArchive'

/** 图片来源类型 — 仅剪贴板粘贴触发归档 */
export type ImageSource = 'local' | 'clipboard'

export const useImageArchive = () => {
  /** 是否支持 File System Access API */
  const isSupported = computed(() => imageArchiveService.isSupported())

  /** 是否已配置归档目录 */
  const isConfigured = ref(imageArchiveService.isConfigured())

  /** 当前归档目录名称 */
  const directoryName = ref(imageArchiveService.getDirectoryName())

  /**
   * 选择归档目录
   * 弹出系统目录选择器
   * @returns 是否成功选择
   */
  const selectDirectory = async (): Promise<boolean> => {
    const success = await imageArchiveService.selectDirectory()
    // 同步响应式状态
    isConfigured.value = imageArchiveService.isConfigured()
    directoryName.value = imageArchiveService.getDirectoryName()
    return success
  }

  /**
   * 保存原图到归档目录
   * 仅在 source='clipboard' 时触发保存
   *
   * @param file 原图 File 对象
   * @param moduleName 模块名
   * @param source 图片来源
   */
  const saveImage = async (file: File, moduleName: ArchiveModuleName, source: ImageSource): Promise<void> => {
    // 仅剪贴板来源触发归档
    if (source !== 'clipboard') return

    // 未配置归档目录时不保存（由调用方引导用户选择）
    if (!imageArchiveService.isConfigured()) return

    // 不阻塞业务流程，fire-and-forget
    imageArchiveService.saveImage(file, moduleName).then((success) => {
      if (!success) {
        console.warn('[useImageArchive] 原图归档失败，不影响业务流程')
      }
    })
  }

  /**
   * 断开归档目录
   */
  const disconnect = async (): Promise<void> => {
    await imageArchiveService.disconnect()
    isConfigured.value = false
    directoryName.value = null
  }

  /**
   * 初始化归档服务（恢复持久化的目录句柄）
   */
  const initialize = async (): Promise<void> => {
    await imageArchiveService.initialize()
    isConfigured.value = imageArchiveService.isConfigured()
    directoryName.value = imageArchiveService.getDirectoryName()
  }

  return {
    isSupported,
    isConfigured,
    directoryName,
    selectDirectory,
    saveImage,
    disconnect,
    initialize,
  }
}
