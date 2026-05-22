/**
 * student_ability_insights tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-ability-insights.js'

describe('student_ability_insights', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回最弱维度 + insight_brief', async () => {
    const mockEnv = {
      data: {
        system_id: 's1',
        weakest_category: { category_id: 'c1', name: '清晰表达', energy: 20 },
        insight_brief: '你目前在「清晰表达」维度积累较少',
        insight_full: '详细诊断...',
        improvement_paths: ['优先学完...', '重读复盘...'],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/ability?systemId=s1&ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({ system_id: 's1' })
    expect(result.data.weakest_category.name).toBe('清晰表达')
    expect(result.data.improvement_paths).toHaveLength(2)
  })

  it('不传 system_id 时 params 不含该字段', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: {}, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({})
    expect(called.name).toBe('student.ability.insights')
    expect(called.params.system_id).toBeUndefined()
  })

  it('未报营时抛错', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('你尚未报名任何训练营'))
    await expect(tool.handler({})).rejects.toThrow(/尚未报名/)
  })
})
