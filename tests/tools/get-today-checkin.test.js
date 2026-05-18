import * as apiClient from '../../src/api-client.js'
import getTodayCheckin from '../../src/tools/get-today-checkin.js'

describe('get_today_checkin', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：返回今日状态（不带 campId）', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({
      today: '2026-05-18',
      checkedToday: true,
      todayCheckinCount: 1,
      totalPoints: 320,
      maxStreakDays: 5,
      latestCheckinDate: '2026-05-18',
      campId: null,
    })

    const result = await getTodayCheckin.handler({})
    expect(spy).toHaveBeenCalledWith('GET', '/api/skill-public/today-checkin', { params: {} })
    expect(result.checkedToday).toBe(true)
    expect(result.maxStreakDays).toBe(5)
  })

  it('带 campId 过滤', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({})
    await getTodayCheckin.handler({ campId: 'c1' })
    expect(spy).toHaveBeenCalledWith('GET', '/api/skill-public/today-checkin', {
      params: { campId: 'c1' },
    })
  })

  it('API 错误向上抛', async () => {
    vi.spyOn(apiClient, 'callApi').mockRejectedValue(new Error('网络错误'))
    await expect(getTodayCheckin.handler({})).rejects.toThrow('网络错误')
  })
})
