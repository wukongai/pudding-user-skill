/**
 * student_ability_indicators tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-ability-indicators.js'

describe('student_ability_indicators', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 radar 数组', async () => {
    const mockEnv = {
      data: {
        radar: [
          {
            system_id: 's1',
            system_name: '沟通心理',
            categories: [
              { category_id: 'c1', name: '同理心', icon: '❤️', energy: 80 },
              { category_id: 'c2', name: '清晰表达', icon: '💬', energy: 60 },
            ],
          },
        ],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/ability?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler()
    expect(result.data.radar[0].categories).toHaveLength(2)
    expect(result.data.radar[0].categories[0].energy).toBe(80)
  })

  it('api_name = student.ability.indicators 且无参数', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { radar: [] }, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler()
    expect(called.name).toBe('student.ability.indicators')
    expect(called.params).toEqual({})
  })

  it('网关错误透传', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('服务暂时不可用'))
    await expect(tool.handler()).rejects.toThrow(/服务.*不可用/)
  })
})
