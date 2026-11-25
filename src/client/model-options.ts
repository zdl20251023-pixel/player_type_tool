import { record } from '../analysis/strategy'
import type { ModelImage, ModelSettings, Provider } from '../contracts/workbench'

import { modelPresets } from './model-presets'
export { modelPresets } from './model-presets'

export function modelVision(provider: Provider, id: string): boolean | null {
  return modelPresets[provider].find((model) => model.id === id)?.vision ?? null
}

export function validImages(
  value: unknown,
  settings?: ModelSettings,
  visionOverride?: boolean | null
): ModelImage[] {
  if (value === undefined) {
    return []
  }
  if (!Array.isArray(value) || value.length > 4) {
    throw new Error('最多上传 4 张图片')
  }
  if (
    value.length &&
    settings &&
    (visionOverride ?? modelVision(settings.provider, settings.model)) === false
  ) {
    throw new Error('所选模型不支持图片，请选择视觉模型，例如 DeepSeek Flash 或 Gemini 多模态模型')
  }
  let total = 0
  return (value as unknown[]).map((item) => {
    const obj = record(item)
    if (
      typeof obj.name !== 'string' ||
      obj.name.length > 200 ||
      typeof obj.data !== 'string' ||
      obj.data.length > 2800000 ||
      obj.data.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(obj.data)
    ) {
      throw new Error('图片名称或 Base64 编码无效')
    }
    const bytes = Buffer.from(obj.data, 'base64')
    if (bytes.toString('base64') !== obj.data) {
      throw new Error('图片 Base64 编码无效')
    }
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
      throw new Error('每张图片必须为 1 字节至 2 MiB')
    }
    total += bytes.length
    if (total > 6 * 1024 * 1024) {
      throw new Error('图片总大小不能超过 6 MiB')
    }
    const detected = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'image/jpeg'
        : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
          ? 'image/webp'
          : null
    if (!detected || detected !== obj.mimeType) {
      throw new Error('仅接受内容与格式一致的 PNG、JPEG、WebP 图片')
    }
    return { name: obj.name || 'image', mimeType: detected, data: obj.data }
  })
}
