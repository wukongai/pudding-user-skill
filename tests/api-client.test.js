/**
 * api-client.js v2.0.0 测试 — 网关单一调用 + Envelope 解析 + upgrade_info 升级 + errcode 中文化
 */

import { callGateway, createApiClient, getApiClient } from '../src/api-client.js'

// 用一个新 client 覆盖 setup.js 的 mock client,让我们能 spy 它的 post
const client = createApiClient({
  apiUrl: 'http://x.local',
  token: 'tok',
  gatewayPath: '/api/skill/gateway',
  skillVersion: '2.0.0',
})

describe('callGateway envelope 解析', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:envelope errcode=0 返回完整 envelope', async () => {
    const envelope = {
      data: { camps: [] },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'req_xxx' },
      links: { self_web: 'https://aixiaoai.cloud/my-camps?ref=skill', self_wechat: null, self_app: null },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(client, 'post').mockResolvedValue({ status: 200, data: envelope })
    const result = await callGateway('student.camps.list', {})
    expect(result).toEqual(envelope)
    expect(result.data).toBeDefined()
    expect(result.links.self_web).toContain('?ref=skill')
  })

  it('errcode 40102:抛 MCP token 失效引导', async () => {
    const envelope = {
      data: null,
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'req_xxx' },
      links: null,
      errcode: 40102,
      errmsg: 'MCP token 无效,请去 https://aixiaoai.cloud/profile/ai-access 重新生成',
    }
    vi.spyOn(client, 'post').mockResolvedValue({ status: 200, data: envelope })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/MCP token 无效.*ai-access/)
  })

  it('errcode 40301:抛未报营提示', async () => {
    const envelope = {
      data: null,
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'req_xxx' },
      links: null,
      errcode: 40301,
      errmsg: '你尚未报名该训练营,请先去 https://aixiaoai.cloud 报名',
    }
    vi.spyOn(client, 'post').mockResolvedValue({ status: 200, data: envelope })
    await expect(callGateway('student.camp.growth_path', { camp_id: 'c1' })).rejects.toThrow(/尚未报名/)
  })

  it('upgrade_info.required:抛升级强制提示(优先于 errcode 检查)', async () => {
    const envelope = {
      data: null,
      meta: {
        skill_version: '2.1.0',
        tier: 'free',
        request_id: 'req_xxx',
        upgrade_info: {
          required: true,
          min_version: '2.1.0',
          message: '客户端版本过低',
          install_hint: 'npx -y pudding-user-skill@latest',
        },
      },
      links: null,
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(client, 'post').mockResolvedValue({ status: 200, data: envelope })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/客户端版本过低.*npx.*@latest/s)
  })

  it('HTTP 401:抛布丁认证失败', async () => {
    vi.spyOn(client, 'post').mockResolvedValue({ status: 401, data: null, statusText: 'Unauthorized' })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/认证失败.*HTTP 401/)
  })

  it('HTTP 500:抛服务器内部错误', async () => {
    vi.spyOn(client, 'post').mockResolvedValue({ status: 500, data: null, statusText: 'Internal Server Error' })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/服务器内部错误.*HTTP 500/)
  })

  it('ECONNREFUSED:抛无法连接提示', async () => {
    vi.spyOn(client, 'post').mockRejectedValue({ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/无法连接.*PUDDING_API_URL/)
  })

  it('ECONNABORTED:抛响应超时', async () => {
    vi.spyOn(client, 'post').mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' })
    await expect(callGateway('student.camps.list', {})).rejects.toThrow(/响应超时/)
  })

  it('请求 body 包含 api_name + skill_version + params', async () => {
    let receivedBody = null
    vi.spyOn(client, 'post').mockImplementation((path, body) => {
      receivedBody = body
      return Promise.resolve({
        status: 200,
        data: {
          data: {},
          meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
          links: null,
          errcode: 0,
          errmsg: '',
        },
      })
    })
    await callGateway('student.stage.summary', { stage_id: 's1' })
    expect(receivedBody.api_name).toBe('student.stage.summary')
    expect(receivedBody.skill_version).toBe('2.0.0')
    expect(receivedBody.stage_id).toBe('s1')
  })
})
