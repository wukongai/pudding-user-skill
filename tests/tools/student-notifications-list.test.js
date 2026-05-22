/**
 * student_notifications_list tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-notifications-list.js'

describe('student_notifications_list', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 unread_count + recent 数组(含 Unix 秒 created_at)', async () => {
    const mockEnv = {
      data: {
        unread_count: 3,
        recent: [
          {
            notification_id: 'n1',
            type: 'teacher_reply',
            title: '老师回复',
            content: '继续加油',
            link: '/notifications/n1',
            is_read: false,
            created_at: 1716278400,
          },
        ],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/notifications?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({})
    expect(result.data.unread_count).toBe(3)
    expect(result.data.recent[0].notification_id).toBe('n1')
    expect(typeof result.data.recent[0].created_at).toBe('number')
  })

  it('传 limit 时透传', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { unread_count: 0, recent: [] }, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({ limit: 10 })
    expect(called.params.limit).toBe(10)
  })

  it('不传 limit 时不在 params 里出现', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { unread_count: 0, recent: [] }, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({})
    expect(called.params.limit).toBeUndefined()
  })
})
