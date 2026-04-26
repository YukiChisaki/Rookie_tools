# Rookie Tools 变更日志

> 记录项目所有功能变更、优化和修复

---

## 2026-04-26

### [PWA-001] PWA 离线支持 — 应用可安装与离线访问

**类型**: 新功能 (New Feature)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **依赖** | `package.json` | 新增 `vite-plugin-pwa` 开发依赖 (v1.2.0) |
| **构建配置** | `vite.config.ts` | 集成 VitePWA 插件，配置 manifest / workbox / autoUpdate |
| **静态资源** | `public/pwa-192x192.png` | 新增 PWA 图标 192×192（蓝紫渐变 R Logo） |
| **静态资源** | `public/pwa-512x512.png` | 新增 PWA 图标 512×512（蓝紫渐变 R Logo） |
| **HTML** | `index.html` | 添加 manifest 链接、apple-mobile-web-app 系列 meta 标签，修正 theme-color 为 #3498db |
| **类型声明** | `src/vite-env.d.ts` | 添加 `virtual:pwa-register` 模块类型声明 |
| **组合函数** | `src/composables/usePwa.ts` | 新增 PWA 状态管理组合函数（canInstall / needUpdate / installApp / updateApp） |
| **根组件** | `src/App.vue` | 集成 PWA 安装按钮（Download 图标）+ 更新通知条；移除已废弃的 useTagLoader 引用 |
| **应用入口** | `src/main.ts` | 注册 Service Worker（仅生产环境），定期检查 SW 更新 |

**技术实现**:

- 使用 `vite-plugin-pwa` + Workbox `GenerateSW` 策略，自动生成 Service Worker 并预缓存全部静态资源
- manifest 配置 `display: standalone`，安装后以独立窗口运行（无浏览器地址栏）
- `scope` / `start_url` 适配 GitHub Pages base 路径 `/Rookie_tools/`
- 开发模式禁用 PWA（`devOptions.enabled: false`），避免 SW 缓存干扰 HMR
- 安装按钮：监听 `beforeinstallprompt` 事件，触发浏览器原生安装弹窗
- 更新通知：header 下方滑入式提示条，点击"立即刷新"加载新版本
- SW 注册仅在 `import.meta.env.PROD` 下执行

**影响范围**:

- 生产构建后，应用可通过浏览器"添加到桌面/主屏幕"安装为独立应用
- 安装后断网仍可完整使用所有功能（预缓存全部静态资源）
- 构建产物新增 `manifest.webmanifest`、`sw.js`、`workbox-*.js`

---

### [REFACTOR-001] UUID 生成方式迁移 — 原生 crypto.randomUUID() 替换为 cuid2

**类型**: 重构 (Refactoring)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **依赖** | `package.json` | 新增 `@paralleldrive/cuid2` 依赖 |
| **工具函数** | `utils/id.ts` | 使用 `cuid2` 的 `createId()` 替代 `crypto.randomUUID()`，添加完整 JSDoc 注释 |
| **状态管理** | `stores/tag.ts` | 导入 `generateId`，替换 2 处 `crypto.randomUUID()` 调用 |
| **状态管理** | `stores/prompt.ts` | 导入 `generateId`，替换 2 处 `crypto.randomUUID()` 调用 |
| **状态管理** | `stores/artist.ts` | 导入 `generateId`，替换 1 处 `crypto.randomUUID()` 调用，更新作者信息 |
| **服务** | `services/spellParser.ts` | 导入 `generateId`，替换 1 处 `crypto.randomUUID()` 调用 |
| **开发规范** | `.codebuddy/rules/前端项目开发规范.mdc` | 4.4 节新增 UUID 生成规范：强制使用 `cuid2`，严禁使用原生 `crypto.randomUUID()` |

**技术实现**:

- 安装 `@paralleldrive/cuid2` 库（v2.x），提供更安全、更短的唯一标识符
- 统一通过 `utils/id.ts` 的 `generateId()` 函数生成 ID，便于后续维护和替换
- cuid2 优势：
  - 比 UUID 更短（25 字符 vs 36 字符）
  - 字典序排序友好
  - 更安全（无时间戳信息泄露）
  - 支持现代浏览器的 CSP 安全策略

**影响范围**:

- 所有新创建的标签、提示词记录、画师串、解析图片数据均使用新 ID 格式
- 旧数据不受影响（ID 格式只是生成方式改变，字符串均可正常存储）

---

## 2026-04-25

### [DOC-001] 文档对齐更新

**类型**: 文档 (Documentation)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **文档** | `.codebuddy/项目说明文档.md` | 全面对齐最新代码状态：2.4节从「画师与串[未开发]」重写为「蜜汁配方[已完成]」；移除 useArtistLoader 引用；更新 store/模块描述；刷新功能进度表和下一步建议 |
| **文档** | `README.md` | 更新最后更新时间戳至 2026-04-25 |

**对齐详情**:
- 模块四：画师与串 → 蜜汁配方（画师串管理），状态 ❌→✅
- Store 描述：artist.ts 从「Artist CRUD + 收藏 + 导入」精简为「画师串 CRUD + 搜索过滤 + 旧数据迁移」
- Composables：移除不存在的 `useArtistLoader.ts`
- 项目结构：artist-manager 从 `[❌ 仅Demo]` 更新为 `[✅ 已激活]`
- 导航栏标签：「画师与串」→「蜜汁配方」，「私人画廊」→「瀑布画廊」
- 功能进度表：蜜汁配方 ~0% → ~95%，瀑布画廊 85% → 90%
- 下一步建议：移除已完成的「开发画师与串模块」条目

---

## 2026-04-24

### [ARTIST-002] 蜜汁配方 — 画师配方与卡片标签改为动态标签输入

**类型**: 功能优化 (Feature Enhancement)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **核心模块** | `modules/artist-manager/index.vue` | 画师配方和卡片标签从逗号分隔文本输入改为 `n-dynamic-tags` 动态标签组件；标签类型基于索引哈希随机展示（success/info/warning/error/default） |

**技术实现**:

- 表单数据结构重构：`artistInputText`/`tagsInputText`（字符串）→ `artistNames`/`tags`（字符串数组）
- 使用 Naive UI `n-dynamic-tags` 组件替代原生 input + 预览标签的双区模式
- 采用官方推荐 `render-tag` 渲染函数 + `h()` 函数式 API，零嵌套 template，代码更简洁
- 两个独立渲染函数 `renderArtistTag` / `renderCardTag`，基于索引哈希随机分配 5 种颜色
- 移除冗余的 `parseArtistNames`/`parseTags` 解析函数和 `parsedNames`/`parsedTags`/`duplicateCount` computed
- 保存时自动去重 + 小写化处理
- 复制功能同步适配新的数组数据源

**用户体验提升**:

- 输入即标签：回车即可添加单个标签，无需手动输入逗号
- 可视化操作：每个标签独立显示、删除按钮直观
- 彩色标签：5 种颜色随机分配，视觉更丰富

---

### [ARTIST-001] 蜜汁配方模块 — 画师串管理功能开发

**类型**: 新功能 (New Feature)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **类型定义** | `types/index.ts` | 移除旧 `Artist` 接口，重构 `ArtistChain`：`artistIds→artistNames`，新增 `thumbnailData`/`previewData`/`updatedAt` 字段 |
| **状态管理** | `stores/artist.ts` | 大幅精简重写：移除 Artist CRUD / 收藏/导入等全部逻辑，仅保留 ArtistChain 的 `createChain/updateChain/deleteChain/loadArtists` + `sortedChains/filteredChains/getChainById` computed；新增防御性旧数据迁移（`artistIds→[]`） |
| **组合函数** | `composables/useArtistLoader.ts` | **完全移除**（不再需要从标签系统自动加载画师） |
| **根组件** | `App.vue` | 移除第 17 行 `useArtistLoader` 导入和第 69 行调用 |
| **核心模块** | `modules/artist-manager/index.vue` | **完整重写**：从空模板实现为完整的画师串管理界面 |
| **TS 声明** | `vite-env.d.ts` | 补充 `*.vue` 模块声明以消除 TS 7016 错误 |

**新模块功能清单**:

- 画师串 CRUD：新建、编辑、删除配方（全部手动操作）
- 图片关联：每个配方可上传/选择一张参考图片（原生 input + 拖拽），使用 `compressImage()` 压缩生成 thumbnail(120x120) + preview(短边≤900px)
- 逗号分隔输入：textarea 输入多个画师名（如：mofang, asoul, rafu）
- 自动去重：输入时实时预览已去重结果（基于小写比较），保存时双保险
- Tag 形式展示：卡片上使用 `n-tag round` 展示画师列表
- 瀑布流布局：复用 `@yeger/vue-masonry-wall` 实现自适应瀑布流图片卡片（column-width=220, gap=16）
- 双格式复制：详情弹窗中支持「SDXL 格式」（`(artist:name:1)`）和「Anima 格式」（`@name`）一键复制
- 搜索过滤：按配方名称或画师名模糊搜索
- Hover 交互：顶部遮罩显示日期+来源标签，底部遮罩显示名称+画师数量+删除按钮

**技术实现**:

- 对标 prompt-manager 的交互模式（图片卡片 + 原生拖拽上传 + 弹窗编辑）
- 左右分栏编辑弹窗（280px 图片区 + flex-1 表单区）
- 预览区 tag 可点击 X 逐个移除并同步回写 textarea
- 删除操作通过 `dialog.warning` 二次确认
- 复制按钮短暂变为 "已复制 ✓"（setTimeout 1.5s 恢复）

**影响范围**:

- IndexedDB `ARTIST_CHAINS` store 数据结构升级（向后兼容旧数据迁移）
- 导航栏「蜜汁配方」入口正式激活可用

---

### [SCROLLBAR-001] 美化滚动条样式

**类型**: 功能优化 (Feature Enhancement)

**变更内容**:

| 模块 | 变更项 | 详情 |
|------|--------|------|
| **魔法解析** | `HistoryList.vue` | 历史记录列表滚动区域替换为 `n-scrollbar`，统一滚动条样式 |
| **魔法解析** | `ParseResult.vue` | 解析结果内容区滚动替换为 `n-scrollbar` |
| **瀑布画廊** | `prompt-manager/index.vue` | 卡片网格、详情弹窗、编辑弹窗滚动区域替换为 `n-scrollbar` |
| **公共组件** | `PromptDetailViewer.vue` | 提示词文本框替换为 `n-scrollbar`，去除外层冗余滚动容器 |
| **公共组件** | `PromptDetailForm.vue` | 去除外层冗余滚动容器 |
| **主题配置** | `naiveTheme.ts` | 添加浅色/暗色主题 `Scrollbar` 样式覆盖，与项目配色保持一致 |
| **文档** | `README.md` | 更新功能完成度说明（瀑布画廊: 85% → 90%） |

**技术实现**:

- 使用 Naive UI 内置的 `n-scrollbar` 组件替换原生 `overflow-y:auto`
- 主题覆盖配置：
  - 浅色模式：`color: #cbd5e1`, `colorHover: #94a3b8`
  - 暗色模式：`color: #475569`, `colorHover: #64748b`

**影响范围**:

- 所有带有滚动区域的模块界面
- 滚动条外观与 Naive UI 主题系统保持一致
- 支持深色/浅色主题自适应

**相关提交**: `6af46d4`

---

_最后更新: 2026-04-26_
