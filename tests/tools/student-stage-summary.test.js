/**
 * student_stage_summary tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-stage-summary.js'

describe('student_stage_summary', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 stage 概览 + tasks_count + links', async () => {
    const mockEnv = {
      data: {
        stage_id: 'st1',
        title: '关 1 — 倾听',
        subtitle: '同理与回应',
        stage_number: 1,
        system_id: 's1',
        system_name: '沟通心理',
        difficulty_tiers: 'basic|intermediate|full',
        harvest_title: '本关你将学会',
        tasks_count: 5,
        is_completed_today: false,
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/stages/st1?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({ stage_id: 'st1' })
    expect(result.data.tasks_count).toBe(5)
    expect(result.data.is_completed_today).toBe(false)
  })

  it('stage_id 透传给网关', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: {}, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({ stage_id: 'stX' })
    expect(called.name).toBe('student.stage.summary')
    expect(called.params.stage_id).toBe('stX')
  })

  it('stage 不存在时抛错', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('stage_id 不存在或未发布'))
    await expect(tool.handler({ stage_id: 'invalid' })).rejects.toThrow(/不存在/)
  })
})
