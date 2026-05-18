import * as apiClient from '../../src/api-client.js'
import submitCheckin from '../../src/tools/submit-checkin.js'

const validArgs = {
  stageId: 'st1',
  difficulty: 'basic',
  completedTaskIds: ['t1', 't2'],
  reflection: '今天学了 TA 沟通的基础概念',
  question: '暂无',
}

describe('submit_checkin', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功：完整必填字段提交', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({
      success: true,
      checkinId: 'ck1',
      stageTitle: '第 1 关',
      newStreakDays: 4,
      note: 'v1 MCP 简化版打卡：...',
    })

    const result = await submitCheckin.handler(validArgs)
    expect(spy).toHaveBeenCalledWith('POST', '/api/skill-public/checkin', {
      data: {
        stageId: 'st1',
        difficulty: 'basic',
        completedTaskIds: ['t1', 't2'],
        reflection: '今天学了 TA 沟通的基础概念',
        question: '暂无',
      },
    })
    expect(result.success).toBe(true)
    expect(result.newStreakDays).toBe(4)
  })

  it('可选字段：focusRating + harvestRating + freeNote 会带上', async () => {
    const spy = vi.spyOn(apiClient, 'callApi').mockResolvedValue({ success: true })
    await submitCheckin.handler({
      ...validArgs,
      focusRating: 4,
      harvestRating: 5,
      freeNote: '老师能多讲点',
    })
    expect(spy).toHaveBeenCalledWith('POST', '/api/skill-public/checkin', {
      data: expect.objectContaining({
        focusRating: 4,
        harvestRating: 5,
        freeNote: '老师能多讲点',
      }),
    })
  })

  it('zod 校验：difficulty 必须是 3 档之一', () => {
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, difficulty: 'hard' })).toThrow()
  })

  it('zod 校验：completedTaskIds 至少 1 个', () => {
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, completedTaskIds: [] })).toThrow()
  })

  it('zod 校验：reflection 不能为空字符串', () => {
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, reflection: '' })).toThrow()
  })

  it('zod 校验：focusRating 必须 1-5 整数', () => {
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, focusRating: 0 })).toThrow()
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, focusRating: 6 })).toThrow()
    expect(() => submitCheckin.inputSchema.parse({ ...validArgs, focusRating: 3.5 })).toThrow()
  })

  it('API 错误向上抛（400 task 不属于 stage）', async () => {
    vi.spyOn(apiClient, 'callApi').mockRejectedValue(
      new Error('HTTP 400: 部分 taskId 不属于该关卡或已删除'),
    )
    await expect(submitCheckin.handler(validArgs)).rejects.toThrow(/部分 taskId/)
  })
})
