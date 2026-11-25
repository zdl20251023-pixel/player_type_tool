import { AIServiceClient } from './client'

/** 复用原 requestRaw 的路径、超时和原样响应语义，不执行业务玩家钩子。 */
export function createLookupService(client = new AIServiceClient()) {
  return {
    async requestRaw(body: unknown): Promise<unknown> {
      const response = await client.getAxiosInstance().post('/lookup?services=RL', body, {
        timeout: client.getRequestTimeoutMs('lookup'),
      })
      return response.data as unknown
    },
  }
}
