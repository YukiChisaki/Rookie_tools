# Rookie Tools 变更日志

> 记录项目所有功能变更、优化和修复

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
- 双格式复制：详情弹窗中支持「正常格式」（`画师1, 画师2`）和「Anima 格式」（`@画师1, @画师2`）一键复制
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

_最后更新: 2026-04-24_
