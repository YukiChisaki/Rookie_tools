# Rookie Tools - ComfyUI/SD WebUI 提示词工具箱

一款面向 Stable Diffusion WebUI 和 ComfyUI 用户的本地离线 Prompt 工具箱。

## 三大核心功能

### 1. 标签形式的提示词选择器
- 七类标签分类：画师、风格、质量、构图、光影、角色、环境
- 搜索功能支持名称和别名匹配
- 点击标签自动添加到选择，支持权重调整 (0.1-2.0)
- 一键复制已选标签为提示词格式

### 2. 提示词管理
- 保存、编辑、删除提示词
- 正向/负向提示词分开管理
- 复制、导出为文本

### 3. 画师与画师串管理
- 画师数据展示和收藏
- 画师风格快速复制
- 画师串（组合多个画师风格）创建和管理
- 点击画师/画师串插入到提示词

## 技术栈

- **框架**: Vue 3.5 + TypeScript
- **构建**: Vite 6
- **状态管理**: Pinia 2
- **样式**: Tailwind CSS 3.4
- **存储**: IndexedDB (本地离线存储)
- **图标**: Lucide Vue Next

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构

```
rookie_tools/
├── src/
│   ├── modules/              # 三大功能模块
│   │   ├── tag-selector/       # 标签选择器
│   │   ├── prompt-manager/     # 提示词管理
│   │   └── artist-manager/     # 画师管理
│   ├── components/          # 通用组件
│   ├── services/            # 服务层 (IndexedDB, PNG解析等)
│   ├── stores/              # Pinia 状态管理
│   ├── composables/         # Vue 组合式函数
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── data/lists/              # 标签数据文件
└── public/                  # 静态资源
```

## 数据存储

所有数据存储在浏览器 IndexedDB 中，支持离线访问：
- `tags`: 标签数据
- `prompts`: 提示词记录
- `artists`: 画师数据
- `artistChains`: 画师串数据

## 标签数据

标签数据从 `data/lists/` 目录下的 txt 文件加载：
- `artists.txt` - 画师标签
- `style.txt` - 风格标签
- `quality.txt` - 质量标签
- `composition.txt` - 构图标签
- `lighting.txt` - 光影标签
- `character.txt` - 角色标签
- `environment.txt` - 环境标签

## 许可证

MIT
