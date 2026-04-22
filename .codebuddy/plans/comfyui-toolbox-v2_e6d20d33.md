---
name: comfyui-toolbox-v2
overview: 开发ComfyUI/SD WebUI辅助工具箱，四大核心模块：图片Meta解析、标签式提示词选择器、提示词管理、画师与画师串管理。
design:
  architecture:
    framework: vue
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
      - "#8B5CF6"
      - "#A78BFA"
      - "#7C3AED"
    background:
      - "#0F0F0F"
      - "#1A1A1A"
      - "#262626"
    text:
      - "#FAFAFA"
      - "#A3A3A3"
      - "#737373"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
      - "#3B82F6"
todos:
  - id: setup-project
    content: 使用 [skill:vite] 初始化项目基础结构和 IndexedDB 服务
    status: completed
  - id: module-image-parser
    content: 使用 [skill:vue] 实现图片Meta解析模块（PNG/JPEG解析、批量上传、参数提取）
    status: completed
    dependencies:
      - setup-project
  - id: module-tag-selector
    content: 使用 [skill:ui-ux-pro-max] 实现标签选择器模块（七类标签、搜索、权重调整）
    status: completed
    dependencies:
      - setup-project
  - id: module-prompt-manager
    content: 使用 [skill:vue] 实现提示词管理模块（编辑、存储、从解析导入）
    status: completed
    dependencies:
      - module-tag-selector
  - id: module-artist-manager
    content: 使用 [skill:vue] 实现画师与画师串管理模块（artist数据、画师串组合）
    status: completed
    dependencies:
      - setup-project
  - id: integrate-layout
    content: 使用 [skill:ui-ux-pro-max] 集成整体布局和导航，统一视觉风格
    status: completed
    dependencies:
      - module-image-parser
      - module-prompt-manager
      - module-artist-manager
  - id: optimize-build
    content: 使用 [skill:vite] 优化构建配置，完善错误处理和性能
    status: completed
    dependencies:
      - integrate-layout
---

## 产品概述

一款面向 SD WebUI 和 ComfyUI 用户的本地离线 Prompt 工具箱，帮助用户高效管理生图工作流和提示词。

## 核心功能模块

### 模块一：解析图片Meta数据

- 解析 PNG/JPEG 图片的 metadata
- 提取 ComfyUI workflow、Stable Diffusion WebUI 参数
- 正向 prompt、负向 prompt、模型、采样器、seed 等参数提取
- 支持批量解析和单张解析
- 解析结果可导出或导入提示词管理

### 模块二：标签形式的提示词选择器

- 按分类展示标签：artist(画师)、style(风格)、quality(质量)、composition(构图)、lighting(光影)、character(角色)、environment(环境)
- 标签支持点击选择，自动组装到提示词
- 搜索功能支持名称和别名匹配
- 权重调整支持（如 (word:1.2)）
- 已选标签可视化展示

### 模块三：提示词管理

- 保存、编辑、删除提示词
- 正向/负向提示词分开管理
- 从图片解析结果导入
- 提示词分类和标签关联
- 复制、导出为文本

### 模块四：画师与画师串管理

- 画师数据展示（从现有 data/lists/artists.txt 导入）
- 画师风格预览图展示
- 画师串（组合多个画师风格）创建和管理
- 点击画师/画师串插入到提示词
- 画师收藏和常用管理

## 技术栈

基于现有项目扩展：

- **框架**：Vue 3.5 + TypeScript + Vite 6
- **状态管理**：Pinia 2.2
- **样式**：Tailwind CSS 3.4
- **工具库**：VueUse 11.3
- **存储**：IndexedDB（原生 API）
- **图标**：Lucide Vue Next

## 架构设计

### 模块解耦架构

```
┌─────────────────────────────────────────────────────────┐
│                      App.vue (SPA Shell)                 │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ Sidebar Nav │  │         Content Area              │   │
│  │  四大模块   │  │    (根据选中模块显示不同内容)      │   │
│  │  切换入口   │  │                                 │   │
│  └─────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  stores/      │    │  composables/ │    │  services/    │
│  - tagStore   │    │  - useIndexedDB│   │  - pngMetadata│
│  - promptStore│    │  - useImageParse│  │  - tagLoader  │
│  - artistStore│    │  - useThumbnail │  │  - artistParser│
└───────────────┘    └───────────────┘    └───────────────┘
```

### 数据模型

**Tag 标签模型**

```typescript
interface Tag {
  id: string;
  name: string;
  aliases: string[];
  category: TagCategory;
  weight: number; // 默认权重
}

type TagCategory = 
  | 'artist' 
  | 'style' 
  | 'quality' 
  | 'composition' 
  | 'lighting' 
  | 'character' 
  | 'environment';
```

**Prompt 提示词模型**

```typescript
interface PromptRecord {
  id: string;
  name: string;
  positive: string;
  negative: string;
  tags: TagRef[]; // 关联的标签
  source: 'manual' | 'parsed';
  createdAt: number;
  updatedAt: number;
}

interface TagRef {
  tagId: string;
  weight: number;
}
```

**Artist 画师模型**

```typescript
interface Artist {
  id: string;
  name: string;
  previewImage?: string; // 预览图路径或 base64
  isFavorite: boolean;
  useCount: number;
}

interface ArtistChain {
  id: string;
  name: string;
  artists: string[]; // artist id 列表
  previewImage?: string;
}
```

**ParsedImage 解析结果模型**

```typescript
interface ParsedImage {
  id: string;
  fileName: string;
  blob: Blob;
  thumbnail: Blob;
  metadata: {
    positive: string;
    negative: string;
    model?: string;
    sampler?: string;
    steps?: number;
    cfg?: number;
    seed?: number;
    width?: number;
    height?: number;
    workflow?: object; // ComfyUI workflow JSON
  };
  parsedAt: number;
}
```

### IndexedDB Schema

**数据库**：`ComfyUIToolboxDB` (version 1)

**对象存储**：

1. `tags` - 标签数据（从 txt 文件初始化）
2. `prompts` - 提示词记录
3. `artists` - 画师数据
4. `artistChains` - 画师串数据
5. `parsedImages` - 解析的图片数据

### 目录结构

```
sdxl_artist_study/
├── src/
│   ├── modules/                 # 四大功能模块
│   │   ├── image-meta-parser/   # 模块一：图片Meta解析
│   │   │   ├── index.vue
│   │   │   ├── ImageDropZone.vue
│   │   │   ├── MetaDisplay.vue
│   │   │   └── composables/useImageParser.ts
│   │   ├── tag-selector/        # 模块二：标签选择器
│   │   │   ├── index.vue
│   │   │   ├── TagCategory.vue
│   │   │   ├── TagChip.vue
│   │   │   ├── WeightAdjuster.vue
│   │   │   └── composables/useTagSelector.ts
│   │   ├── prompt-manager/      # 模块三：提示词管理
│   │   │   ├── index.vue
│   │   │   ├── PromptEditor.vue
│   │   │   ├── PromptList.vue
│   │   │   └── composables/usePromptManager.ts
│   │   └── artist-manager/      # 模块四：画师管理
│   │       ├── index.vue
│   │       ├── ArtistCard.vue
│   │       ├── ArtistChainBuilder.vue
│   │       └── composables/useArtistManager.ts
│   ├── components/              # 通用组件
│   │   ├── ui/                  # 基础 UI
│   │   └── layout/              # 布局组件
│   ├── services/                # 服务层
│   │   ├── db.ts                # IndexedDB 封装
│   │   ├── pngMetadata.ts       # PNG metadata 解析
│   │   └── tagLoader.ts         # 标签数据加载
│   ├── stores/                  # Pinia stores
│   │   ├── tag.ts
│   │   ├── prompt.ts
│   │   ├── artist.ts
│   │   └── image.ts
│   ├── types/                   # 类型定义
│   │   └── index.ts
│   ├── composables/             # 通用组合式函数
│   │   ├── useIndexedDB.ts
│   │   └── useThumbnail.ts
│   ├── App.vue                  # [MODIFY] 应用根组件
│   ├── main.ts                  # [MODIFY] 入口
│   └── styles/
│       └── theme.css            # [MODIFY] 主题样式
├── data/
│   └── lists/                   # 现有标签数据
│       ├── artists.txt
│       ├── style.txt
│       └── ...
└── package.json                 # [MODIFY] 添加依赖
```

## 实现要点

### 1. PNG Metadata 解析

- 使用 Canvas API 读取 PNG chunks
- 解析 `tEXt` chunk 中的 `workflow` 字段（ComfyUI）
- 解析 `parameters` 字段（Stable Diffusion WebUI 格式）

### 2. 标签数据加载

- 从 `/data/lists/artists.txt`、`style.txt` 等文件读取
- 解析为 Tag 对象并写入 IndexedDB
- 七类分类映射到对应的 txt 文件

### 3. 缩略图生成

- Canvas `drawImage` + `toBlob` 压缩
- 目标尺寸：最大边 400px，JPEG 格式

### 4. 画师串功能

- 支持多选画师组成串
- 实时预览组合效果描述
- 保存常用画师串配置

采用深色主题的现代化工具型界面，灵感来源于 ComfyUI 的节点编辑器和专业创意软件。

## 整体布局

- **侧边栏导航**：左侧 80px 垂直导航，四大模块图标入口
- **内容区域**：右侧主内容区，根据选中模块切换
- **模块切换**：平滑过渡动画

## 模块设计

### 模块一：图片Meta解析

- **拖拽上传区**：虚线边框，高亮提示，支持批量
- **解析结果列表**：缩略图 + 关键参数卡片
- **操作按钮**：导入到提示词管理、复制参数

### 模块二：标签选择器

- **分类 Tab**：七类标签横向切换
- **标签云/网格**：chip 形式展示，点击选中
- **搜索栏**：顶部搜索框，实时过滤
- **已选区**：底部展示已选标签，支持权重调整
- **权重调节**：滑块或数字输入 (0.1-2.0)

### 模块三：提示词管理

- **双栏编辑器**：正向/负向提示词分开编辑
- **提示词列表**：卡片式历史记录
- **标签插入浮层**：从标签选择器快速插入
- **操作栏**：保存、复制、导出按钮

### 模块四：画师管理

- **画师网格**：卡片展示，显示名称和预览图
- **收藏功能**：星标标记常用画师
- **画师串构建器**：拖拽多选，组合预览
- **快捷插入**：点击画师/串插入到提示词

## 交互细节

- 模块切换：淡入淡出 200ms
- 标签点击：涟漪效果，飞入动画
- 卡片 hover：轻微上浮 + 阴影
- 拖拽上传：边框高亮 + 背景变色

## 推荐扩展

### Skill

- **ui-ux-pro-max**
- Purpose: 为四大模块设计现代化深色主题 UI，优化布局和交互体验
- Expected outcome: 生成专业的界面设计方案和组件样式代码

- **vue**
- Purpose: 提供 Vue 3 Composition API 最佳实践指导
- Expected outcome: 确保组件代码符合 Vue 3 标准和性能优化

- **vite**
- Purpose: 优化 Vite 配置和构建流程
- Expected outcome: 合理的 vite.config.ts 配置

- **frontend-design**
- Purpose: 创建高品质的前端界面实现
- Expected outcome: 精美的组件实现代码

## 开发规范

### 版本管理与变更记录

1. **每次完成或修复 bug 后必须进行版本管理**：
   - 更新版本号（遵循 Semantic Versioning: `主版本.次版本.修订号`）
   - 在 `CHANGELOG.md` 文件中记录变更内容

2. **CHANGELOG.md 格式要求**：
   - 按版本号分组，从新到旧排列
   - 每个版本包含：
     - 版本号与日期
     - 新增功能（Added）
     - 修复内容（Fixed）
     - 优化改进（Improved）
   - 示例：
   ```markdown
   ## [1.2.0] - 2025-01-15
   ### Added
   - 新增画师串导出功能
   - 支持批量删除提示词

   ### Fixed
   - 修复 PNG 解析失败的问题

   ### Improved
   - 优化标签搜索性能
   ```

3. **变更记录文件位置**：`d:\comfyui_dev\rookie_tools\CHANGELOG.md`