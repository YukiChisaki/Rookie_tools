/**
 * Markdown 文档加载工具
 * 统一管理项目中所有 Markdown 文档的导入和加载
 * @author Chisaki / 68142319
 * @since 2026-04-26 20:57:00
 */
import type { DefineComponent } from 'vue'
import tutorialDoc from '@/modules/tutorial/tutorial.md'

/** Markdown 文档类型定义 */
export type MarkdownDoc = DefineComponent<{}, {}, any>

/** 已注册的文档映射表 */
const markdownDocs: Record<string, MarkdownDoc> = {
  tutorial: tutorialDoc,
}

/**
 * 获取指定名称的 Markdown 文档组件
 *
 * @param docName - 文档名称（如 'tutorial'）
 * @returns Vue 组件，可用于模板渲染
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMarkdown } from '@/utils/useMarkdown'
 * const TutorialContent = useMarkdown('tutorial')
 * </script>
 *
 * <template>
 *   <TutorialContent />
 * </template>
 * ```
 */
const useMarkdown = (docName: string): MarkdownDoc => {
  const doc = markdownDocs[docName]
  if (!doc) {
    console.warn(`[useMarkdown] 未找到文档: "${docName}"，可用文档: ${Object.keys(markdownDocs).join(', ')}`)
  }
  return doc
}

export { useMarkdown, getAvailableDocs }

/**
 * 获取所有已注册的文档名称列表
 */
const getAvailableDocs = (): string[] => Object.keys(markdownDocs)

export default useMarkdown
