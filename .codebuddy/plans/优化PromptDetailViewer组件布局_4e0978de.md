---
name: 优化PromptDetailViewer组件布局
overview: 优化PromptDetailViewer.vue组件，解决核心参数区域布局太紧凑的问题，确保在有/无图片的场景下都能正常展示。
design:
  architecture:
    framework: vue
  styleKeywords:
    - 呼吸感
    - 清晰层次
    - 舒适间距
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#3498db"
      - "#f368e0"
    background:
      - rgba(52, 152, 219, 0.05)
      - rgba(52, 152, 219, 0.1)
    text:
      - "#1e293b"
      - "#64748b"
    functional:
      - "#22c55e"
      - "#ef4444"
todos:
  - id: optimize-layout
    content: 优化 PromptDetailViewer.vue 布局：增加参数网格间距、重构模型区域、适配无图片场景
    status: completed
  - id: verify-responsive
    content: 验证响应式布局在不同场景下的展示效果
    status: completed
    dependencies:
      - optimize-layout
---

## 需求概述

优化 PromptDetailViewer.vue 组件的布局样式，解决信息展示过于紧凑的问题，并确保组件在有/无图片的场景下都能正常展示。

## 核心问题

1. **布局太紧凑**：核心参数区域使用 `grid-cols-3 gap-2`，间距过小
2. **模型名称溢出**：长模型名与"查找模型"链接挤在一起
3. **参数卡片间距不足**：内部 `p-3` 导致内容拥挤
4. **无图片场景适配**：需要确保 `showImage=false` 时布局依然美观

## 使用场景

- **魔法解析模块**：显示图片 + 参数 + 提示词
- **提示词管理模块**：显示图片 + 参数 + 提示词（可切换为仅参数+提示词）

## 技术栈

- Vue 3.5 + TypeScript + `<script setup>`
- Tailwind CSS 3.4
- Lucide Vue 图标库

## 优化方案

### 布局优化策略

1. **参数网格**：将 `grid-cols-3 gap-2` 改为响应式 `grid-cols-2 md:grid-cols-3 gap-3`，增加间距
2. **模型区域**：改为垂直布局，模型名称独占一行，链接另起一行右对齐
3. **卡片内边距**：从 `p-3` 增加到 `p-4`
4. **无图片布局**：当 `showImage=false` 时，参数和提示词区域占据全宽

### 视觉优化

1. 添加参数标签的图标与文字间距
2. 优化提示词区域的滚动条样式
3. 增加整体区域的垂直间距

## 关键改动点

- `src/components/PromptDetailViewer.vue`：主要布局重构

## 设计理念

采用"呼吸感"设计，通过增加间距、优化留白、改善视觉层次来提升信息可读性。

### 布局调整

- 参数网格：增加 gap 从 2 到 3，卡片内边距从 3 到 4
- 模型名称区域：改为垂直堆叠布局，避免文字挤压
- 提示词区域：增加标题与内容的间距

### 响应式适配

- 小屏幕：参数网格 2 列，确保可读性
- 大屏幕：参数网格 3 列，充分利用空间
- 无图片时：提示词区域全宽展示