/**
 * v2.0.0 网关单一调用 + Envelope 响应解构
 *
 * 设计要点:
 *   - 唯一调用入口:callGateway(apiName, params)
 *   - POST /api/skill/gateway with body { api_name, skill_version, ...params }
 *   - 解构 envelope:{ data, meta, links, errcode, errmsg }
 *   - upgrade_info 检测 → 抛升级引导(强制砍刀)
 *   - errcode 非 0 → 抛包含 errmsg 的友好错误
 *   - 返回完整 envelope 给 tool(让 tool 把 links 透传给 LLM)
 *
 * v1.x → v2.0.0 breaking changes:
 *   - 旧 callApi(method, path, options) 删除
 *   - 旧 6 个分散 endpoint 全部弃用
 *   - 所有 tool 都走 callGateway,api_name 在 body
 */

import axios from 'axios'

let _client = null
let _config = null

export function createApiClient(config) {
  _config = config
  _client = axios.create({
    baseURL: config.apiUrl,
    timeout: 15_000,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': `pudding-user-skill/${config.skillVersion}`,
    },
    // 所有 HTTP status 都拿到 res.data,自己判 envelope errcode
    validateStatus: () => true,
  })
  return _client
}

export function getApiClient() {
  if (!_client) {
    throw new Error('API client 未初始化 — 请先调 createApiClient(config)')
  }
  return _client
}

/**
 * 唯一网关调用函数
 * @param {string} apiName - 例 'student.camps.list'
 * @param {object} [params={}] - 业务参数(平铺,会与 api_name + skill_version 合并)
 * @returns {Promise<object>} envelope: { data, meta, links, errcode, errmsg }
 * @throws {Error} 网络错误 / 401 / envelope errcode 非 0 / upgrade_info 升级强制
 */
export async function callGateway(apiName, params = {}) {
  const client = getApiClient()
  const config = _config

  const body = {
    api_name: apiName,
    skill_version: config.skillVersion,
    ...params,
  }

  let res
  try {
    res = await client.post(config.gatewayPath, body)
  } catch (err) {
    // 网络层错误
    if (err.code === 'ECONNABORTED') {
      throw new Error('布丁服务器响应超时(>15s)。可能是网络问题或服务器繁忙,稍后重试。')
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      throw new Error(
        `无法连接到布丁服务器 ${client.defaults.baseURL}。` +
          '请检查 PUDDING_API_URL 是否正确(生产值:https://aixiaoai.cloud)',
      )
    }
    throw new Error(`网关请求失败:${err.message}`)
  }

  // HTTP 层错误(理论上 envelope 设计成所有错误都 200,但如果是 401 / 5xx 等服务器级错误仍走这里)
  if (res.status === 401) {
    throw new Error(
      '布丁认证失败(HTTP 401)。请提醒学员去 https://aixiaoai.cloud/profile/ai-access 重新生成 token,' +
        '然后更新 PUDDING_MCP_TOKEN 环境变量。',
    )
  }
  if (res.status >= 500) {
    throw new Error(
      `布丁服务器内部错误(HTTP ${res.status})。请稍后重试或告知运营。`,
    )
  }
  if (res.status !== 200) {
    throw new Error(`网关返回非 200 状态(HTTP ${res.status}):${res.statusText}`)
  }

  // 解 envelope
  const envelope = res.data
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('网关返回格式异常(非 envelope)')
  }

  // 1. 升级检测(强制砍刀,在 errcode 检查之前)
  if (envelope.meta?.upgrade_info?.required) {
    const info = envelope.meta.upgrade_info
    throw new Error(
      `客户端版本过低,需升级 pudding-user-skill 到 ${info.min_version} 或更高。\n` +
        `升级命令:${info.install_hint}\n` +
        `详情:${info.message}`,
    )
  }

  // 2. errcode 检查(0 = 成功)
  if (envelope.errcode !== 0) {
    throw new Error(envelope.errmsg || `未知错误(errcode=${envelope.errcode})`)
  }

  // 3. 返回完整 envelope(tool handler 决定要 data / links / meta 哪些字段)
  return envelope
}
