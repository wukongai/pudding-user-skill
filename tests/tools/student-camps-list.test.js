/**
 * student_camps_list tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-camps-list.js'

describe('student_camps_list', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 envelope.data + links', async () => {
    const mockEnv = {
      data: { camps: [{ camp_id: 'c1', camp_name: '沟通心理营', current_stage: 5, total_stages: 10, progress_pct: 50, streak_days: 3, status: 'ongoing' }] },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/my-camps?ref=skill', self_wechat: null, self_app: null },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler()
    expect(result.data.camps).toHaveLength(1)
    expect(result.links.self_web).toContain('my-camps')
  })

  it('调网关时 api_name = student.camps.list 且无参数', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { camps: [] }, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler()
    expect(called.name).toBe('student.camps.list')
    expect(called.params).toEqual({})
  })

  it('网关错误透传(callGateway 抛错时 tool 也抛)', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('MCP token 无效'))
    await expect(tool.handler()).rejects.toThrow(/MCP token 无效/)
  })
})
