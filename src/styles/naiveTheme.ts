import type { GlobalThemeOverrides } from 'naive-ui'

// 项目主题色配置 - 与 CSS 变量保持一致
const primaryColor = '#3498db'
const secondaryColor = '#f368e0'

// Naive UI 主题覆盖配置
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor,
    primaryColorHover: '#2980b9',
    primaryColorPressed: '#1f6dad',
    primaryColorSuppl: primaryColor,
    
    // 信息色使用主色
    infoColor: primaryColor,
    infoColorHover: '#2980b9',
    infoColorPressed: '#1f6dad',
    infoColorSuppl: primaryColor,
    
    // 成功色
    successColor: '#22C55E',
    successColorHover: '#16a34a',
    successColorPressed: '#15803d',
    successColorSuppl: '#22C55E',
    
    // 警告色
    warningColor: '#F59E0B',
    warningColorHover: '#d97706',
    warningColorPressed: '#b45309',
    warningColorSuppl: '#F59E0B',
    
    // 错误色
    errorColor: '#EF4444',
    errorColorHover: '#dc2626',
    errorColorPressed: '#b91c1c',
    errorColorSuppl: '#EF4444',
    
    // 边框和背景
    borderColor: '#e2e8f0',
    borderColorHover: '#cbd5e1',
    dividerColor: '#e2e8f0',
    
    // 文字颜色
    textColorBase: '#1e293b',
    textColor1: '#1e293b',
    textColor2: '#334155',
    textColor3: '#64748b',
    
    // 背景色
    baseColor: '#ffffff',
    bodyColor: '#ffffff',
    cardColor: '#f8fafc',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    
    // 圆角 - 与项目保持一致
    borderRadius: '12px',
    borderRadiusSmall: '8px',
  },
  
  // Button 按钮样式覆盖
  Button: {
    borderRadiusMedium: '12px',
    borderRadiusSmall: '8px',
    fontWeight: '500',
  },
  
  // Input 输入框样式覆盖
  Input: {
    borderRadius: '12px',
    heightMedium: '42px',
  },
  
  // Card 卡片样式覆盖
  Card: {
    borderRadius: '16px',
    color: '#f8fafc',
    colorModal: '#ffffff',
  },
  
  // Modal 弹窗样式覆盖
  Modal: {
    borderRadius: '16px',
  },
  
  // Tag 标签样式覆盖
  Tag: {
    borderRadius: '8px',
  },
  
  // Select 选择器样式覆盖
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '12px',
        heightMedium: '42px',
      },
    },
  },
}

// 暗色模式主题覆盖
export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor,
    primaryColorHover: '#4aa8e8',
    primaryColorPressed: '#5fb4ec',
    primaryColorSuppl: primaryColor,
    
    infoColor: primaryColor,
    infoColorHover: '#4aa8e8',
    infoColorPressed: '#5fb4ec',
    infoColorSuppl: primaryColor,
    
    // 边框和背景 - 暗色模式
    borderColor: '#334155',
    borderColorHover: '#475569',
    dividerColor: '#334155',
    
    // 文字颜色 - 暗色模式
    textColorBase: '#f8fafc',
    textColor1: '#f8fafc',
    textColor2: '#e2e8f0',
    textColor3: '#94a3b8',
    
    // 背景色 - 暗色模式
    baseColor: '#0f172a',
    bodyColor: '#0f172a',
    cardColor: '#1e293b',
    modalColor: '#1e293b',
    popoverColor: '#1e293b',
  },
  
  Card: {
    color: '#1e293b',
    colorModal: '#1e293b',
  },
}
