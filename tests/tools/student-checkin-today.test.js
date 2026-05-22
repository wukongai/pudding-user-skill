/**
 * student_checkin_today tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-checkin-today.js'

describe('student_checkin_today', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回今日打卡状态(snake_case 字段)', async () => {
    const mockEnv = {
      data: {
        today: '2026-05-21',
        is_checked_today: true,
        today_checkin_count: 2,
        total_points: 320,
        max_streak_days: 7,
        latest_checkin_at: '2026-05-21',
        camp_id: null,
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/my-camps?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({})
    expect(result.data.is_checked_today).toBe(true)
    expect(result.data.max_streak_days).toBe(7)
  })

  it('传 camp_id 时透传', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: {}, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({ camp_id: 'cX' })
    expect(called.params.camp_id).toBe('cX')
  })

  it('网关错误透传', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('服务暂时不可用'))
    await expect(tool.handler({})).rejects.toThrow(/不可用/)
  })
})
