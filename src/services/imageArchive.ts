/**
 * 原图归档服务 — 基于 File System Access API
 * 将剪贴板粘贴等非本地来源的图片按模块分类保存到用户指定的本地目录
 *
 * @author Chisaki (ID: 68142319)
 * @since 2026-05-12 18:40:00
 */
import { db } from './db'
import { STORES } from '../types'
import { generateId } from '../utils/id'

/** IndexedDB appState 中存储归档目录句柄的 key */
const ARCHIVE_DIR_KEY = 'imageArchiveDirHandle'

/** 支持的模块名列表，对应归档子目录名 */
export const ARCHIVE_MODULES = ['spell-parser', 'artist-manager', 'prompt-manager'] as const
export type ArchiveModuleName = typeof ARCHIVE_MODULES[number]

/** 归档目录句柄在 IndexedDB 中的存储结构 */
interface ArchiveDirRecord {
  key: string
  /** FileSystemDirectoryHandle 对象（支持 structured clone） */
  handle: FileSystemDirectoryHandle
  /** 目录名称缓存，避免频繁请求权限仅为了读取名称 */
  name: string
}

/**
 * 检测浏览器是否支持 File System Access API
 */
export const isFileSystemAccessSupported = (): boolean =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window

class ImageArchiveService {
  /** 内存中的目录句柄缓存 */
  private dirHandle: FileSystemDirectoryHandle | null = null
  /** 缓存的目录名称 */
  private dirName: string | null = null
  /** 初始化标志 */
  private initialized = false

  /**
   * 初始化归档服务 — 从 IndexedDB 恢复目录句柄
   * 应在应用启动时调用
   */
  initialize = async (): Promise<void> => {
    if (this.initialized) return

    if (!isFileSystemAccessSupported()) {
      this.initialized = true
      return
    }

    const record = await db.get<ArchiveDirRecord>(STORES.APP_STATE, ARCHIVE_DIR_KEY)
    if (record?.handle) {
      // 恢复句柄引用（不立即请求权限，等实际使用时再验证）
      this.dirHandle = record.handle
      this.dirName = record.name
    }

    this.initialized = true
  }

  /**
   * 检测浏览器是否支持归档功能
   */
  isSupported = (): boolean => isFileSystemAccessSupported()

  /**
   * 检测是否已配置归档目录
   */
  isConfigured = (): boolean => !!this.dirHandle

  /**
   * 获取当前归档目录名称
   */
  getDirectoryName = (): string | null => this.dirName

  /**
   * 验证目录句柄的读写权限，无权限时尝试请求
   * @returns 是否拥有读写权限
   */
  verifyPermission = async (): Promise<boolean> => {
    if (!this.dirHandle) return false

    try {
      // 先查询当前权限状态
      const currentMode = await this.dirHandle.queryPermission({ mode: 'readwrite' })
      if (currentMode === 'granted') return true

      // 权限不足则发起请求（会弹出浏览器授权弹窗）
      const requestedMode = await this.dirHandle.requestPermission({ mode: 'readwrite' })
      return requestedMode === 'granted'
    } catch (e) {
      console.error('[ImageArchive] 权限验证失败:', e)
      return false
    }
  }

  /**
   * 弹出目录选择器，让用户选择归档目录
   * @returns 是否成功选择并保存
   */
  selectDirectory = async (): Promise<boolean> => {
    if (!isFileSystemAccessSupported()) return false

    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      this.dirHandle = handle
      this.dirName = handle.name

      // 持久化到 IndexedDB
      const record: ArchiveDirRecord = {
        key: ARCHIVE_DIR_KEY,
        handle,
        name: handle.name,
      }
      await db.put(STORES.APP_STATE, record)

      return true
    } catch (e) {
      // 用户取消选择或浏览器拒绝
      console.error('[ImageArchive] 选择目录失败:', e)
      return false
    }
  }

  /**
   * 保存图片到归档目录
   * 自动按模块名创建子目录，文件名避免冲突
   *
   * @param file 原图 File 对象
   * @param moduleName 模块名（用于创建子目录）
   * @returns 是否保存成功
   */
  saveImage = async (file: File, moduleName: ArchiveModuleName): Promise<boolean> => {
    if (!this.dirHandle) {
      console.warn('[ImageArchive] 未配置归档目录，跳过保存')
      return false
    }

    // 验证权限
    const hasPermission = await this.verifyPermission()
    if (!hasPermission) {
      console.warn('[ImageArchive] 归档目录权限不足，跳过保存')
      return false
    }

    try {
      // 获取或创建模块子目录
      const moduleDir = await this.dirHandle.getDirectoryHandle(moduleName, { create: true })

      // 生成不冲突的文件名：原名去扩展名_短ID.扩展名
      const fileName = this.generateArchiveFilename(file.name)

      // 创建文件并写入
      const fileHandle = await moduleDir.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(file)
      await writable.close()

      console.log(`[ImageArchive] 原图已保存: ${moduleName}/${fileName}`)
      return true
    } catch (e) {
      console.error('[ImageArchive] 保存原图失败:', e)
      return false
    }
  }

  /**
   * 断开归档目录连接
   * 清除内存缓存和 IndexedDB 中的持久化数据
   */
  disconnect = async (): Promise<void> => {
    this.dirHandle = null
    this.dirName = null

    try {
      await db.delete(STORES.APP_STATE, ARCHIVE_DIR_KEY)
    } catch (e) {
      console.error('[ImageArchive] 清除归档配置失败:', e)
    }
  }

  /**
   * 生成归档文件名
   * 剪贴板粘贴的文件名通常是无意义的（如 image.png），
   * 使用 {原名去扩展名}_{短ID}.{扩展名} 格式避免冲突
   */
  private generateArchiveFilename = (originalName: string): string => {
    const lastDotIndex = originalName.lastIndexOf('.')
    const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : ''
    const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName
    const shortId = generateId().substring(0, 8)

    return `${nameWithoutExt}_${shortId}${ext}`
  }
}

/** 全局单例 */
export const imageArchiveService = new ImageArchiveService()
