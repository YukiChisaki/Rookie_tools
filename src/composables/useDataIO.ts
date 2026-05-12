/**
 * 数据导入导出核心逻辑 Composable
 * 封装文件下载触发、文件读取解析、格式校验、重复检测过滤逻辑
 * 采用泛型设计，通过参数注入 Store 的数据获取方法和批量导入方法
 *
 * @author Chisaki
 * @since 2026-05-12 16:37:00
 */

import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { ExportFile, DataIOConfig, ImportResult, DataIOModuleType } from '../types/data-io'
import { MODULE_LABELS } from '../types/data-io'

/** 当前导出文件格式版本 */
const EXPORT_VERSION = '1.0'

/** 应用前缀，用于导出文件命名 */
const APP_PREFIX = 'rookie-tools'

/**
 * 数据导入导出组合函数
 * @param config 模块配置（模块名、数据获取、批量导入、已有ID集合）
 */
export const useDataIO = <T extends { id: string }>(config: DataIOConfig<T>) => {
  const message = useMessage()
  const dialog = useDialog()

  /** 导出进行中状态 */
  const isExporting = ref(false)
  /** 导入进行中状态 */
  const isImporting = ref(false)

  /**
   * 生成导出文件名
   * 格式：rookie-tools-{module}-{YYYYMMDD}.json
   */
  const generateFileName = (moduleName: DataIOModuleType): string => {
    const now = new Date()
    const dateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('')
    return `${APP_PREFIX}-${moduleName}-${dateStr}.json`
  }

  /**
   * 触发浏览器文件下载
   * 使用 Blob + URL.createObjectURL + 动态 <a> 标签方式
   */
  const triggerDownload = (content: string, fileName: string): void => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    // 及时释放内存
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 导出当前模块全量数据
   * 流程：获取数据 → 构造 ExportFile → JSON 序列化 → 触发下载
   */
  const exportData = async (): Promise<void> => {
    if (isExporting.value) return

    isExporting.value = true
    try {
      const allData = config.getAllData()

      if (allData.length === 0) {
        message.warning('当前没有数据可以导出')
        return
      }

      const exportFile: ExportFile<T> = {
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        module: config.moduleName,
        count: allData.length,
        data: allData,
      }

      // 深拷贝去除 Vue 响应式代理，避免序列化问题
      const cleanData = JSON.parse(JSON.stringify(exportFile))
      const jsonStr = JSON.stringify(cleanData, null, 2)
      const fileName = generateFileName(config.moduleName)

      triggerDownload(jsonStr, fileName)
      message.success(`已导出 ${allData.length} 条${MODULE_LABELS[config.moduleName]}数据`)
    } catch (err) {
      console.error('[useDataIO] 导出失败:', err)
      message.error('导出失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 读取文件内容为文本
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  /**
   * 校验导出文件格式
   * 必须包含 version、module、data 字段，且 module 与当前模块匹配
   */
  const validateExportFile = (parsed: unknown, moduleName: DataIOModuleType): ExportFile<T> => {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('文件内容不是有效的 JSON 对象')
    }

    const obj = parsed as Record<string, unknown>

    if (!obj.version || typeof obj.version !== 'string') {
      throw new Error('缺少版本号字段（version）')
    }

    if (!obj.module || typeof obj.module !== 'string') {
      throw new Error('缺少模块标识字段（module）')
    }

    if (obj.module !== moduleName) {
      throw new Error(
        `文件模块不匹配：当前模块为「${MODULE_LABELS[moduleName]}」，文件模块为「${obj.module}」`
      )
    }

    if (!Array.isArray(obj.data)) {
      throw new Error('数据字段（data）不是数组')
    }

    return obj as unknown as ExportFile<T>
  }

  /**
   * 导入数据
   * 流程：选择文件 → 读取 → 解析 → 校验 → 去重 → 批量写入 → 显示结果
   */
  const importData = async (file: File): Promise<ImportResult | null> => {
    if (isImporting.value) return null

    isImporting.value = true
    try {
      // 1. 读取文件内容
      const text = await readFileAsText(file)

      // 2. JSON 解析
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('文件不是有效的 JSON 格式')
      }

      // 3. 格式校验
      const exportFile = validateExportFile(parsed, config.moduleName)

      if (exportFile.data.length === 0) {
        message.info('文件中没有数据')
        return { succeeded: 0, skipped: 0, failed: 0 }
      }

      // 4. 调用 Store 的批量导入方法（内含去重逻辑）
      const result = await config.bulkImport(exportFile.data)

      // 5. 显示导入结果
      const parts: string[] = []
      if (result.succeeded > 0) parts.push(`成功 ${result.succeeded} 条`)
      if (result.skipped > 0) parts.push(`跳过 ${result.skipped} 条（ID重复）`)
      if (result.failed > 0) parts.push(`失败 ${result.failed} 条`)

      if (result.succeeded > 0) {
        message.success(`导入完成：${parts.join('，')}`)
      } else if (result.skipped > 0 && result.succeeded === 0) {
        message.info(`导入完成：所有 ${result.skipped} 条数据均已存在，无新增`)
      } else {
        message.warning(`导入完成：${parts.join('，')}`)
      }

      return result
    } catch (err) {
      console.error('[useDataIO] 导入失败:', err)
      message.error('导入失败：' + (err instanceof Error ? err.message : '未知错误'))
      return null
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 确认导入操作（带弹窗确认）
   */
  const confirmAndImport = (file: File): void => {
    dialog.info({
      title: '确认导入',
      content: `即将从文件导入${MODULE_LABELS[config.moduleName]}数据，重复数据（按 ID 判断）将自动跳过。是否继续？`,
      positiveText: '导入',
      negativeText: '取消',
      onPositiveClick: () => {
        importData(file)
      },
    })
  }

  return {
    isExporting,
    isImporting,
    exportData,
    importData,
    confirmAndImport,
  }
}
