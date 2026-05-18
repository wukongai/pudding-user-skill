import * as apiClient from '../../src/api-client.js'
import getStage from '../../src/tools/get-stage.js'

describe('get_stage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：返回关卡详情含 tasks', async () => {
    const mockStage = {
      stage: {
        id: 'st1',
        title: '第 1 关：自我觉察',
        subtitle: 'TA 沟通入门',
        kind: 'main',
        stageNumber: 1,
        systemId: 's1',
        systemName: '沟通心理营',
        difficultyTiers: ['basic', 'intermediate', 'full'],
        harvestTitle: '通关收获',
        harvestItems: ['学会识别情绪', '掌握自我觉察 3 步法'],
        cognitiveGoals: [],
        applicationGoals: [],
        tasks: [
          { id: 't1', type: 'reading', title: '阅读', description: '...', difficulty: 'basic' },
          { id: 't2', type: 'application', title: '应用', description: '...', difficulty: 'basic' },
        ],
      },
    }
    vi.spyOn(apiClient, 'callApi').mockResolvedValue(mockStage)

    const result = await getStage.handler({ stageId: 'st1' })
    expect(result.stage.title).toBe('第 1 关：自我觉察')
    expect(result.stage.tasks).toHaveLength(2)
  })

  it('zod 校验：stageId 必填且非空', () => {
    expect(() => getStage.inputSchema.parse({})).toThrow()
    expect(() => getStage.inputSchema.parse({ stageId: '' })).toThrow()
  })

  it('URL 含特殊字符自动 encodeURIComponent', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({})
    await getStage.handler({ stageId: 'st/1?x' })
    expect(spy).toHaveBeenCalledWith('GET', '/api/skill-public/stage/st%2F1%3Fx')
  })

  it('API 错误向上抛（403 未报名）', async () => {
    vi.spyOn(apiClient, 'callApi').mockRejectedValue(
      new Error('权限不足（你尚未报名该训练营关卡，请先在布丁主站报名）'),
    )
    await expect(getStage.handler({ stageId: 'st1' })).rejects.toThrow(/权限不足/)
  })
})
