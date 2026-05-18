/**
 * api-client.js 测试 — 重点验证错误翻译（401/403/429/5xx/网络错误）
 */

import axios from 'axios'
import { callApi, createApiClient } from '../src/api-client.js'

// 用一个新 client 覆盖 setup.js 的 mock client，让我们能 spy 它的 request
const client = createApiClient({ apiUrl: 'http://x.local', token: 'tok' })

describe('callApi 错误翻译', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功响应直接返回 data', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({ data: { foo: 1 } })
    const result = await callApi('GET', '/api/x')
    expect(result).toEqual({ foo: 1 })
  })

  it('401 → 友好提示去 /profile/ai-access 重新生成', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({
      response: { status: 401, data: { error: 'token 无效' }, statusText: 'Unauthorized' },
    })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/认证失败.*ai-access.*PUDDING_MCP_TOKEN/s)
  })

  it('403 → 提示去主站报名', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({
      response: { status: 403, data: { error: '未报名' }, statusText: 'Forbidden' },
    })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/权限不足.*报名/)
  })

  it('429 → 提示明日重试', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({
      response: { status: 429, data: { error: 'rate limit' }, statusText: 'Too Many' },
    })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/今日调用上限.*明日/)
  })

  it('5xx → 提示服务器内部错误', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({
      response: { status: 503, data: { error: 'maintenance' }, statusText: 'Service Unavailable' },
    })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/布丁服务器内部错误.*503/)
  })

  it('超时 → 提示网络/服务器繁忙', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({ code: 'ECONNABORTED' })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/响应超时/)
  })

  it('DNS 失败 → 提示 PUDDING_API_URL 配置', async () => {
    vi.spyOn(client, 'request').mockRejectedValue({ code: 'ENOTFOUND' })
    await expect(callApi('GET', '/api/x')).rejects.toThrow(/无法连接.*PUDDING_API_URL/)
  })
})
