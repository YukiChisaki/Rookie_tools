/**
 * 数据导入导出类型定义
 * 定义导出文件格式、模块标识、导入结果等核心类型
 *
 * @author Chisaki
 * @since 2026-05-12 16:37:00
 */

// ==================== 模块标识 ====================

/** 支持导入导出的模块类型 */
export type DataIOModuleType = 'prompts' | 'artists' | 'spell'

/** 模块显示名称映射 */
export const MODULE_LABELS: Record<DataIOModuleType, string> = {
  prompts: '提示词管理',
  artists: '蜜汁配方',
  spell: '魔法解析',
}

// ==================== 导出文件格式 ====================

/** 导出文件的统一格式 */
export interface ExportFile<T> {
  /** 格式版本号 */
  version: string
  /** 导出时间戳（毫秒） */
  exportedAt: number
  /** 所属模块标识 */
  module: DataIOModuleType
  /** 数据条目数 */
  count: number
  /** 实际数据 */
  data: T[]
}

// ==================== 导入结果 ====================

/** 导入操作结果统计 */
export interface ImportResult {
  /** 成功导入条数 */
  succeeded: number
  /** 因 ID 重复跳过的条数 */
  skipped: number
  /** 导入失败条数 */
  failed: number
}

// ==================== Composable 配置 ====================

/** useDataIO Composable 的配置参数 */
export interface DataIOConfig<T> {
  /** 当前模块标识 */
  moduleName: DataIOModuleType
  /** 获取全量数据（用于导出） */
  getAllData: () => T[]
  /** 批量导入数据（用于导入） */
  bulkImport: (items: T[]) => Promise<ImportResult>
  /** 获取当前已有的 ID 集合（用于去重） */
  getExistingIds: () => Set<string>
}
