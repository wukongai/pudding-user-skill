/**
 * vitest 测试环境配置(v2.0.0)
 *
 * 给 createApiClient 初始化一个伪 client + config,让单测里 import 的 tool 不会抛
 * "API client 未初始化"。真正 callGateway 行为由各测试用 vi.spyOn 拦截。
 */

import { createApiClient } from '../src/api-client.js'

createApiClient({
  apiUrl: 'http://mock.local',
  token: 'mock-token',
  gatewayPath: '/api/skill/gateway',
  skillVersion: '2.0.0',
})
