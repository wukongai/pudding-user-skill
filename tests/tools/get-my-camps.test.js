/**
 * get_my_camps tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import getMyCamps from '../../src/tools/get-my-camps.js'

describe('get_my_camps', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：返回 camps 列表', async () => {
    const mockData = {
      camps: [
        {
          enrollmentId: 'e1',
          campId: 'c1',
          campName: '沟通心理营',
          systemId: 's1',
          currentStage: 5,
          totalStages: 10,
          progressPct: 50,
          streakDays: 3,
          totalPoints: 120,
          lastCheckinDate: '2026-05-17',
          status: 'ongoing',
        },
      ],
    }
    vi.spyOn(apiClient, 'callApi').mockResolvedValue(mockData)

    const result = await getMyCamps.handler({})
    expect(result.camps).toHaveLength(1)
    expect(result.camps[0].campName).toBe('沟通心理营')
    expect(result.camps[0].progressPct).toBe(50)
  })

  it('空列表：返回提示让学员去主站报名', async () => {
    vi.spyOn(apiClient, 'callApi').mockResolvedValue({ camps: [] })

    const result = await getMyCamps.handler({})
    expect(result.camps).toHaveLength(0)
    expect(result.hint).toMatch(/还没报名/)
    expect(result.hint).toMatch(/aixiaoai/)
  })

  it('API 错误（401）：错误向上抛', async () => {
    vi.spyOn(apiClient, 'callApi').mockRejectedValue(
      new Error('布丁认证失败（MCP 认证字符串无效）'),
    )

    await expect(getMyCamps.handler({})).rejects.toThrow(/认证失败/)
  })

  it('name 和 description 都不为空', () => {
    expect(getMyCamps.name).toBe('get_my_camps')
    expect(getMyCamps.description.length).toBeGreaterThan(50)
  })
})
