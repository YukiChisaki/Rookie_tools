# Rookie Tools 变更日志

> 记录项目所有功能变更、优化和修复

---

## 2026-04-24

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

- 使用 Naive UI 内置的 `n-scrollbar` 组件替换原生 `overflow-y-auto`
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
