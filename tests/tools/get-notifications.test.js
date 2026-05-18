import * as apiClient from '../../src/api-client.js'
import getNotifications from '../../src/tools/get-notifications.js'

describe('get_notifications', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：默认 limit 不传，返回 unreadCount + recent', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({
      unreadCount: 3,
      recent: [
        {
          id: 'n1',
          type: 'checkin',
          title: '今日提醒',
          content: '别忘了打卡',
          link: '/stage/x',
          read: false,
          createdAt: '2026-05-18T00:00:00Z',
        },
      ],
    })
    const result = await getNotifications.handler({})
    expect(spy).toHaveBeenCalledWith('GET', '/api/skill-public/notifications', { params: {} })
    expect(result.unreadCount).toBe(3)
  })

  it('带 limit 参数', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({ unreadCount: 0, recent: [] })
    await getNotifications.handler({ limit: 10 })
    expect(spy).toHaveBeenCalledWith('GET', '/api/skill-public/notifications', {
      params: { limit: 10 },
    })
  })

  it('zod 校验：limit 范围 1-20', () => {
    expect(() => getNotifications.inputSchema.parse({ limit: 0 })).toThrow()
    expect(() => getNotifications.inputSchema.parse({ limit: 21 })).toThrow()
    expect(() => getNotifications.inputSchema.parse({ limit: 5 })).not.toThrow()
  })
})
