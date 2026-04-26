    <script setup lang="ts">
    /**
     * 使用教程模块组件
     * 展示 Rookie Tools 的完整使用教程文档
     * @author Chisaki / 68142319
     * @since 2026-04-26 20:57:00
     */
    import { useMarkdown } from '@/utils/useMarkdown'

    const TutorialContent = useMarkdown('tutorial')
</script>

<template>
    <n-scrollbar class="h-full w-full bg-background">
        <!-- 教程内容容器 -->
        <div class="max-w-4xl mx-auto px-6 py-8 pb-20">
            <!-- Markdown 内容渲染区域 -->
            <article class="tutorial-content prose prose-sm dark:prose-invert max-w-none">
                <TutorialContent />
            </article>
        </div>
    </n-scrollbar>
</template>

<style scoped>
/* 教程文档样式优化 - 确保完整展示不截断 */
.tutorial-content {
    color: var(--color-foreground);
    line-height: 1.8;
}

/* 标题样式 - 层级分明 */
.tutorial-content :deep(h1) {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-foreground);
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--color-primary);
}

.tutorial-content :deep(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-foreground);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--color-primary);
}

.tutorial-content :deep(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
}

.tutorial-content :deep(h4) {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

/* 段落和列表 */
.tutorial-content :deep(p) {
    margin-bottom: 1rem;
    text-align: justify;
}

.tutorial-content :deep(ul),
.tutorial-content :deep(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
}

.tutorial-content :deep(li) {
    margin-bottom: 0.5rem;
}

.tutorial-content :deep(li > ul),
.tutorial-content :deep(li > ol) {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}

/* 引用块 - 重要提示样式 */
.tutorial-content :deep(blockquote) {
    background-color: var(--color-muted);
    border-left: 4px solid var(--color-primary);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    border-radius: 0 8px 8px 0;
}

.tutorial-content :deep(blockquote p:last-child) {
    margin-bottom: 0;
}

.tutorial-content :deep(blockquote > p:first-child:has(strong:first-child)) {
    border-left-color: #f59e0b;
    background: linear-gradient(135deg,
            rgba(245, 158, 11, 0.08),
            rgba(245, 158, 11, 0.03));
    padding: 1rem 1.25rem;
    margin: -1rem -1.25rem 1rem;
    border-radius: 0 8px 8px 0;
}

/* 表格样式 */
.tutorial-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    background-color: var(--color-card);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tutorial-content :deep(th) {
    background: linear-gradient(135deg,
            var(--color-primary),
            color-mix(in srgb, var(--color-primary), black 10%));
    color: white;
    font-weight: 600;
    padding: 0.75rem 1rem;
    text-align: left;
}

.tutorial-content :deep(td) {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
}

.tutorial-content :deep(tr:last-child td) {
    border-bottom: none;
}

.tutorial-content :deep(tr:hover td) {
    background-color: var(--color-muted);
}

/* 行内代码和代码块 */
.tutorial-content :deep(code) {
    background-color: var(--color-muted);
    color: var(--color-primary);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85em;
    font-family:
        "JetBrains Mono",
        Consolas,
        Monaco,
        "Courier New",
        monospace;
}

.tutorial-content :deep(pre) {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 1.15rem 1.35rem;
    border-radius: 10px;
    overflow-x: auto;
    margin: 1.5rem 0;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12);
    position: relative;
}

.tutorial-content :deep(pre code) {
    background-color: transparent;
    color: inherit;
    padding: 0;
    font-size: 0.9em;
}

/* 链接样式 */
.tutorial-content :deep(a) {
    color: var(--color-primary);
    text-decoration: none;
    text-underline-offset: 3px;
    transition: all 0.2s ease;
    position: relative;
}

.tutorial-content :deep(a::after) {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: currentColor;
    opacity: 0.4;
    transition: width 0.2s ease;
}

.tutorial-content :deep(a:hover::after) {
    width: 80%;
    left: 10%;
    opacity: 1;
}

/* 分隔线 */
.tutorial-content :deep(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(to right,
            transparent,
            var(--color-border),
            transparent);
    margin: 2.5rem 0;
}

/* 强调文本 */
.tutorial-content :deep(strong) {
    color: var(--color-foreground);
    font-weight: 600;
}

/* 图片响应式 */
.tutorial-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    margin: 1.25rem auto;
    display: block;
}

/* 状态标签样式（用于功能进度表） */
.tutorial-content :deep(td):has(span) {
    font-weight: 500;
}
</style>
