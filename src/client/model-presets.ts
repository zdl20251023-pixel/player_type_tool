import type { ModelOption, Provider } from '../contracts/workbench'

// 官方文档快照 2026-11-25；实际可用性由账号的 /models 返回和快速测试确认。
export const modelPresets: Record<Provider, ModelOption[]> = {
  deepseek: [
    {
      id: 'deepseek-flash',
      label: 'DeepSeek V4.1 Flash',
      vision: true,
      note: '当前 Flash，文本与图片输入',
      source: 'preset',
    },
    {
      id: 'deepseek-v4-pro',
      label: 'DeepSeek V4 Pro',
      vision: false,
      note: 'Pro 文本模型，当前不支持图片',
      source: 'preset',
    },
    {
      id: 'deepseek-v4-flash',
      label: 'V4 Flash（兼容别名）',
      vision: true,
      note: '原模型已退役，官方目前路由至最新 Flash',
      source: 'preset',
    },
    {
      id: 'deepseek-v4-flash-vision-exp',
      label: 'V4 Flash Vision Exp（兼容别名）',
      vision: true,
      note: '原模型已退役，官方目前路由至最新 Flash',
      source: 'preset',
    },
    {
      id: 'deepseek-chat',
      label: 'DeepSeek Chat（旧配置）',
      vision: false,
      note: '保留旧配置或兼容网关，是否可用请快速测试',
      source: 'preset',
    },
    {
      id: 'deepseek-reasoner',
      label: 'DeepSeek Reasoner（旧配置）',
      vision: false,
      note: '保留旧配置或兼容网关，是否可用请快速测试',
      source: 'preset',
    },
  ],
  gemini: [
    ...['carbon', 'neon', 'hydrogen', 'argon'].map((name): ModelOption => ({
      id: `gemini-4-${name}`,
      label: `Gemini 4 ${name[0].toUpperCase()}${name.slice(1)}`,
      vision: true,
      note: '文本与图片理解；账号可用性请刷新或测试',
      source: 'preset',
    })),
    {
      id: 'gemini-3.8-flash',
      label: 'Gemini 3.8 Flash',
      vision: true,
      note: '多模态 Flash，账号可用性请测试',
      source: 'preset',
    },
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro（旧配置）',
      vision: true,
      note: '保留旧配置，实际可用性请测试',
      source: 'preset',
    },
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash（旧配置）',
      vision: true,
      note: '保留旧配置，实际可用性请测试',
      source: 'preset',
    },
  ],
}
