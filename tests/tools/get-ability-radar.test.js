import * as apiClient from '../../src/api-client.js'
import getAbilityRadar from '../../src/tools/get-ability-radar.js'

describe('get_ability_radar', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：返回 radar 数组', async () => {
    const mock = {
      radar: [
        {
          systemId: 's1',
          systemName: '沟通心理营',
          categories: [
            { id: 'c1', name: '自我觉察', icon: '🪞', energy: 8 },
            { id: 'c2', name: '换位思考', icon: '👥', energy: 5 },
          ],
        },
      ],
    }
    vi.spyOn(apiClient, 'callApi').mockResolvedValue(mock)

    const result = await getAbilityRadar.handler({})
    expect(result.radar).toHaveLength(1)
    expect(result.radar[0].categories).toHaveLength(2)
  })

  it('API 错误向上抛', async () => {
    vi.spyOn(apiClient, 'callApi').mockRejectedValue(new Error('5xx'))
    await expect(getAbilityRadar.handler({})).rejects.toThrow('5xx')
  })
})
