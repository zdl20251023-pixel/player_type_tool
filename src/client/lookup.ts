import { aiServiceClient } from './client'

/** 复用原 requestRaw 的路径、超时和原样响应语义，不执行业务玩家钩子。 */
export const lookupService = {
  async requestRaw(body: unknown): Promise<unknown> {
    const response = await aiServiceClient.getAxiosInstance().post('/lookup?services=RL', body, {
      timeout: aiServiceClient.getRequestTimeoutMs('lookup'),
    })
    return response.data as unknown
  },
}
