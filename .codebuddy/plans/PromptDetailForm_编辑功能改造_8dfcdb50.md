---
name: PromptDetailForm 编辑功能改造
overview: 将 PromptDetailForm.vue 从纯展示组件改造为可编辑/保存功能的表单弹窗，核心参数和提示词改为表单组件，保持原有样式布局
todos:
  - id: modify-prompt-detail-form
    content: 使用 [skill:vue] 和 [skill:naive-ui] 修改 PromptDetailForm.vue 为可编辑表单，添加 v-model 双向绑定和保存/取消事件
    status: completed
  - id: update-parent-component
    content: 在 index.vue 中更新 PromptDetailForm 使用方式，绑定表单数据和处理保存事件
    status: completed
    dependencies:
      - modify-prompt-detail-form
  - id: verify-styles
    content: 验证表单样式与原有展示样式一致，确保布局无变化
    status: completed
    dependencies:
      - modify-prompt-detail-form
---

## 需求分析

### 用户原始需求

将 `PromptDetailForm.vue` 组件从纯展示功能改为可编辑/保存功能的表单弹窗。

### 功能要求

1. **核心参数编辑**：将模型、采样器、调度器、步数、CFG、种子、尺寸等参数改为可编辑表单组件
2. **提示词编辑**：正向提示词和负向提示词改为可编辑的 textarea 组件
3. **保存功能**：添加保存/取消按钮，支持表单数据提交
4. **样式保持**：完全保持原有样式布局和展示内容不变
5. **代码保护**：不改动任何未授权的代码、注释、错误提示等

### 涉及的参数

- **模型** (model)：文本输入
- **采样器** (sampler)：文本输入
- **调度器** (schedule/scheduler)：文本输入
- **步数** (steps)：数字输入
- **CFG** (cfg)：数字输入
- **种子** (seed)：数字输入
- **尺寸** (width × height)：数字输入（两个字段）
- **正向提示词** (positive)：多行文本 textarea
- **负向提示词** (negative)：多行文本 textarea

## 技术方案

### 技术栈

- **框架**：Vue 3.5 + TypeScript
- **API 风格**：Composition API + `<script setup>`
- **UI 组件库**：naive-ui
- **状态管理**：defineModel 实现双向绑定

### 实现策略

#### 1. 组件接口设计

使用 `defineModel` 实现双向绑定，保持父组件调用方式简洁：

- `modelValue`：绑定表单数据对象，包含所有可编辑字段
- 保留原有 props（用于初始值和配置展示）
- 新增 emit：`save` 保存事件、`cancel` 取消事件

#### 2. 表单数据结构

```typescript
interface FormData {
  name: string;
  positive: string;
  negative: string;
  parameters: {
    model?: string;
    sampler?: string;
    scheduler?: string;
    steps?: number;
    cfg?: number;
    seed?: number;
    width?: number;
    height?: number;
  };
}
```

#### 3. 样式保持策略

- 所有原有 CSS 类名保持不变
- 输入框样式继承原有设计系统
- 布局结构完全保持一致
- 仅将展示文本替换为 n-input 或原生 input/textarea

#### 4. 实现步骤

1. 修改 script 部分：添加表单数据模型、保存/取消事件
2. 修改模板部分：将展示文本替换为表单输入组件
3. 添加操作按钮区域（保存/取消）
4. 保持原有图片预览和布局逻辑不变

### 代码设计原则

- **DRY**：复用现有的样式类和布局结构
- **单一职责**：组件只负责表单编辑，不处理业务保存逻辑
- **向后兼容**：保留所有原有 props，父组件可选择使用 v-model 或保持只读模式

## 扩展使用

### Skill

- **vue**：用于 Vue 3 Composition API 开发，包括 defineModel、defineProps、defineEmits 等宏的正确使用
- **naive-ui**：用于使用 n-input、n-button 等表单组件