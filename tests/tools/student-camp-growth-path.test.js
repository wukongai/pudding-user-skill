/**
 * student_camp_growth_path tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-camp-growth-path.js'

describe('student_camp_growth_path', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回毕业路径 + links', async () => {
    const mockEnv = {
      data: {
        camp_id: 'c1',
        camp_name: '沟通心理营',
        system_id: 's1',
        graduation_steps: [
          { stage_id: 'st1', stage_number: 1, title: '关 1', is_completed: true },
          { stage_id: 'st2', stage_number: 2, title: '关 2', is_completed: false },
        ],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/camp/c1/growth?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({ camp_id: 'c1' })
    expect(result.data.graduation_steps).toHaveLength(2)
    expect(result.data.graduation_steps[0].is_completed).toBe(true)
  })

  it('调网关时 camp_id 透传', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: {}, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({ camp_id: 'cX' })
    expect(called.name).toBe('student.camp.growth_path')
    expect(called.params.camp_id).toBe('cX')
  })

  it('未报营时抛错', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('你尚未报名该训练营,请先去 https://aixiaoai.cloud 报名'))
    await expect(tool.handler({ camp_id: 'cX' })).rejects.toThrow(/尚未报名/)
  })
})
