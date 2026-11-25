import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { requestTimeoutMs } from './config'

/**
 * 在代理模式下将上游地址协议强制改为 HTTP。
 * 这样客户端发给代理的是普通 HTTP 请求（绝对 URL），避免触发 CONNECT 隧道。
 * @param rawBaseUrl AI 服务原始地址
 * @returns 规范化后的上游地址；解析失败时返回原值
 */
function normalizeUpstreamBaseUrlForProxy(rawBaseUrl: string): string {
  if (!rawBaseUrl) {
    return rawBaseUrl
  }

  try {
    const upstreamUrl = new URL(rawBaseUrl)
    upstreamUrl.protocol = 'http:'
    return upstreamUrl.toString()
  } catch (error) {
    console.error(`AI Service: Invalid AI_SERVICE_URL, keep original value; error=${String(error)}`)
    return rawBaseUrl
  }
}

/**
 * 构建 HTTP 代理配置。
 * 代理协议固定为 http，确保请求走“HTTP 请求 + 代理侧转发”链路。
 * @param proxyUrl 代理地址
 * @returns Axios 代理配置；解析失败时返回 undefined
 */
function buildHttpProxyConfig(proxyUrl: string): AxiosRequestConfig['proxy'] {
  try {
    const proxyUrlObj = new URL(proxyUrl)
    return {
      protocol: 'http',
      host: proxyUrlObj.hostname,
      port: parseInt(proxyUrlObj.port, 10) || 80,
      auth:
        proxyUrlObj.username && proxyUrlObj.password
          ? {
              username: proxyUrlObj.username,
              password: proxyUrlObj.password,
            }
          : undefined,
    }
  } catch (error) {
    console.warn(`AI Service: Invalid AI_PROXY_URL, disable proxy mode; error=${String(error)}`)
    return undefined
  }
}

/** AI 三方接口标识 */
type AIEndpoint = 'lookup'

/**
 * AI 服务客户端基础类。
 * 负责 axios 实例创建、代理配置，以及统一的请求/响应日志与错误处理。
 */
export class AIServiceClient {
  private readonly axiosInstance: AxiosInstance
  private readonly baseUrl: string
  private readonly defaultTimeoutMs: number
  private readonly lookupTimeoutMs: number

  /**
   * @param option 代理与上游地址；未传字段使用默认值（直连、空 URL）
   */
  constructor(
    option: { proxyUrl: string; useProxy: boolean; rawBaseUrl: string } = {
      proxyUrl: process.env.AI_PROXY_URL || '',
      useProxy: process.env.AI_USE_PROXY === 'true',
      rawBaseUrl: process.env.AI_SERVICE_URL || '',
    }
  ) {
    const { proxyUrl, useProxy, rawBaseUrl } = option

    // 代理模式下强制将上游 URL 规范为 http://，避免走 CONNECT
    this.baseUrl = useProxy ? normalizeUpstreamBaseUrlForProxy(rawBaseUrl) : rawBaseUrl

    // 独立工具通过环境配置超时，不依赖后端配置表。
    this.defaultTimeoutMs = requestTimeoutMs()

    // /lookup接口超时时长（毫秒）
    this.lookupTimeoutMs = this.defaultTimeoutMs

    console.debug(
      'AI Service: Request timeout config',
      JSON.stringify({
        defaultTimeoutMs: this.defaultTimeoutMs,
        lookupTimeoutMs: this.lookupTimeoutMs,
      })
    )

    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.baseUrl,
      timeout: this.defaultTimeoutMs,
      proxy: false,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }

    if (useProxy && proxyUrl) {
      const proxyConfig = buildHttpProxyConfig(proxyUrl)
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig
        console.debug(
          'AI Service: Route-aware proxy mode enabled',
          JSON.stringify({
            proxyHost: proxyConfig.host,
            proxyPort: proxyConfig.port,
          })
        )
      } else {
        console.warn('AI Service: Proxy config invalid, fallback to direct connection')
      }
    } else if (useProxy && !proxyUrl) {
      console.warn('AI Service: AI_USE_PROXY=true but AI_PROXY_URL is empty, fallback to direct')
    } else {
      console.debug('AI Service: Direct connection (no proxy)')
    }

    this.axiosInstance = axios.create(axiosConfig)

    // 用 WeakMap 存储请求发出时刻，避免将时间戳附在 config 对象上导致 unsafe member access
    const requestStartTimes = new WeakMap<object, number>()

    // 统一请求日志，便于排查代理行为与路由命中情况
    this.axiosInstance.interceptors.request.use(
      (config) => {
        requestStartTimes.set(config, Date.now())
        console.debug(`AI Service Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error: unknown) => {
        console.error(`AI Service Request Error: ${String(error)}`)
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(error)
      }
    )

    // 统一响应日志与错误日志，便于定位上游或代理问题
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const elapsed = Date.now() - (requestStartTimes.get(response.config) ?? Date.now())
        console.debug(
          `AI Service Response: ${response.status} ${response.statusText} elapsed=${elapsed}ms`
        )
        return response
      },
      (error: unknown) => {
        if (axios.isAxiosError(error) && error.response) {
          const configObj = error.config
          const elapsed =
            Date.now() - (configObj ? (requestStartTimes.get(configObj) ?? Date.now()) : Date.now())
          console.error(
            `AI Service Response Error: status=${error.response.status}; code=${error.code}; method=${configObj?.method}; url=${configObj?.url}; elapsed=${elapsed}ms; error=${error.message}`
          )
          console.debug('AI Service error response:', JSON.stringify(error.response.data))
        } else if (axios.isAxiosError(error) && error.request) {
          console.error(
            `AI Service Network Error: code=${error.code}; url=${error.config?.url}; error=${error.message}`
          )
        } else {
          console.error(`AI Service Request Setup Error: ${String(error)}`)
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(error)
      }
    )
  }

  /** 上游地址是否配置过。空地址会让 axios 发成相对路径，必须在调用前拦住。 */
  isConfigured(): boolean {
    return this.baseUrl.length > 0
  }

  /**
   * 获取 axios 实例，供具体 API 模块复用。
   * @returns axios 实例
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }

  /**
   * 获取指定接口的请求超时时长（毫秒）
   * @param endpoint AI 接口标识
   * @returns 接口级超时时长（毫秒）
   */
  getRequestTimeoutMs(endpoint: AIEndpoint): number {
    if (endpoint !== 'lookup') {
      throw new Error('本客户端仅支持 lookup')
    }
    return this.lookupTimeoutMs
  }
}

/** AI 服务客户端单例 */
export const aiServiceClient = new AIServiceClient()
