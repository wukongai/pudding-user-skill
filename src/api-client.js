/**
 * axios 包装 — 调布丁后端 /api/skill-public/* 端点
 *
 * 设计要点：
 *   - 单例 client（首次 createApiClient 时初始化，后续 tool 直接 import）
 *   - Bearer token 头（也支持 X-MCP-Token，看后端中间件 4 种方式哪种最稳）
 *   - 错误码 → 学员友好提示（401/403/429/5xx 各不同）
 *   - timeout 15s（避免 AI 客户端长时间等待）
 */

import axios from 'axios'

let _client = null

export function createApiClient({ apiUrl, token }) {
  _client = axios.create({
    baseURL: apiUrl,
    timeout: 15_000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'pudding-user-skill/0.1.0',
    },
  })
  return _client
}

export function getApiClient() {
  if (!_client) {
    throw new Error('API client 未初始化 — 请先调 createApiClient({ apiUrl, token })')
  }
  return _client
}

/**
 * 统一调用 + 错误翻译
 * 把 axios 报错翻译成对 AI 友好的中文提示，AI 看到后能直接转告学员
 */
export async function callApi(method, path, options = {}) {
  const client = getApiClient()
  try {
    const res = await client.request({ method, url: path, ...options })
    return res.data
  } catch (err) {
    if (err.response) {
      const status = err.response.status
      const serverMessage = err.response.data?.error || err.response.statusText
      if (status === 401) {
        throw new Error(
          `布丁认证失败（${serverMessage}）。请提醒学员去布丁 https://aixiaoai.cloud/profile/ai-access 重新生成 token，` +
          `然后更新 PUDDING_MCP_TOKEN 环境变量。`,
        )
      }
      if (status === 403) {
        throw new Error(
          `权限不足（${serverMessage}）。该操作可能需要学员先在布丁主站报名对应训练营。`,
        )
      }
      if (status === 404) {
        throw new Error(`资源不存在（${serverMessage}）。`)
      }
      if (status === 429) {
        throw new Error(`已到今日调用上限（${serverMessage}）。请明日 0 点（北京时间）后重试。`)
      }
      if (status >= 500) {
        throw new Error(`布丁服务器内部错误（HTTP ${status}: ${serverMessage}）。请稍后重试或告知运营。`)
      }
      throw new Error(`HTTP ${status}: ${serverMessage}`)
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error(`布丁服务器响应超时（>15s）。可能是网络问题或服务器繁忙，稍后重试。`)
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      throw new Error(
        `无法连接到布丁服务器 ${client.defaults.baseURL}。请检查 PUDDING_API_URL 是否正确（生产值：https://aixiaoai.cloud）`,
      )
    }
    throw new Error(`未知错误：${err.message}`)
  }
}
