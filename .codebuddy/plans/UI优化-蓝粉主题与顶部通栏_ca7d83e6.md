---
name: UI优化-蓝粉主题与顶部通栏
overview: 优化界面设计：将主题色从紫色改为蓝色主色+粉色次要色，重构布局添加顶部通栏并将Logo移至顶部。
design:
  architecture:
    framework: vue
  styleKeywords:
    - 深色模式
    - 蓝粉渐变
    - 玻璃拟态
    - 极简导航
    - 科技感
    - AI 工具风格
  fontSystem:
    fontFamily: system-ui
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3B82F6"
      - "#60A5FA"
      - "#2563EB"
    background:
      - "#0F0F0F"
      - "#1A1A1A"
      - "#262626"
    text:
      - "#FAFAFA"
      - "#A3A3A3"
      - "#737373"
    functional:
      - "#EC4899"
      - "#F472B6"
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: update-tailwind-config
    content: 使用 [skill:frontend-design] 更新 tailwind.config.js，将主色改为蓝色，添加粉色次要色
    status: completed
  - id: update-css-variables
    content: 使用 [skill:ui-ux-pro-max] 更新 src/styles/index.css 中的 CSS 变量和组件样式
    status: completed
    dependencies:
      - update-tailwind-config
  - id: restructure-layout
    content: 重构 src/App.vue 布局，添加顶部通栏并将 Logo 移至顶部
    status: completed
    dependencies:
      - update-css-variables
---

## 需求概述

优化 Rookie Tools 界面，主要改进包括：

1. 配色方案更新：主色调从紫色改为蓝色，添加粉色作为次要强调色
2. 布局重构：添加顶部通栏，将 Logo 从侧边栏移至顶部

## 视觉目标

- 采用深蓝灰底色配合明快的蓝粉渐变配色
- 现代清爽的 AI 工具风格
- 顶部通栏设计使 Logo 更加醒目
- 保持整体深色主题的专业感

## 技术栈

- Vue 3.5 + TypeScript
- Tailwind CSS 3.4
- 保持现有组件结构

## 修改范围

需要修改以下 3 个核心文件：

| 文件 | 修改内容 |
| --- | --- |
| `tailwind.config.js` | 更新主色为蓝色 (#3B82F6)，添加粉色次要色 (#EC4899) |
| `src/styles/index.css` | 更新 CSS 变量，调整组件样式配色 |
| `src/App.vue` | 重构布局结构，添加顶部通栏，调整侧边栏 |


## 颜色规范

- **主色蓝色**: #3B82F6 (Tailwind blue-500)
- **主色亮蓝**: #60A5FA (blue-400) 用于 hover
- **主色深蓝**: #2563EB (blue-600) 用于按下
- **次要粉色**: #EC4899 (pink-500) 用于强调
- **粉色亮**: #F472B6 (pink-400) 用于 hover
- **成功绿**: #22C55E 保持不变
- **错误红**: #EF4444 保持不变
- **警告黄**: #F59E0B 保持不变

## 布局规范

- **顶部通栏**: 高度 60px，深色背景配合渐变 Logo
- **侧边栏**: 宽度保持 72px，去除 Logo 后纯导航功能
- **主内容区**: 保持自适应，增加 padding 避让顶部

## 设计风格

### 整体风格

采用现代 AI 工具常用的 **深蓝紫暗色主题** 配合 **蓝粉渐变** 强调色，营造科技感与创造力并存的视觉氛围。

### 配色系统

- 主色调：鲜明的蓝色 (#3B82F6) 作为品牌主色，用于导航激活状态、主要按钮
- 次要色：活泼的粉色 (#EC4899) 作为强调色，用于特殊标签、收藏、高亮
- 渐变应用：蓝粉渐变用于 Logo 区域和特殊强调元素
- 深色背景：接近黑色的深灰 (#0F0F0F) 作为底色，减少眼部疲劳

### 布局设计

- **顶部通栏**: 左侧放置品牌 Logo (R 字母) + 应用名称，采用蓝粉渐变背景
- **左侧边栏**: 保持图标导航，激活状态使用蓝色高亮，悬浮状态显示粉色微光
- **内容区域**: 保持现有四大模块布局，整体视觉更加整洁统一

### 交互细节

- 导航切换：蓝色背景 + 白色图标高亮
- 按钮悬停：蓝色加深或粉色浮现
- 标签选择：蓝色选中，粉色作为权重调整的强调
- 玻璃拟态面板：保留现有 glass-panel 效果，边框使用蓝粉半透明色

## 使用的 Skills

### skill:frontend-design

- **用途**: 提供专业的前端界面设计指导和最佳实践
- **预期成果**: 确保配色方案和布局重构符合现代设计趋势，避免通用 AI 风格

### skill:ui-ux-pro-max

- **用途**: 提供 UI/UX 设计智能，包括颜色、间距、动画效果优化
- **预期成果**: 确保蓝粉配色协调，交互体验流畅