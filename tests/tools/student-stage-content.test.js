/**
 * student_stage_content tool 测试
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-stage-content.js'

describe('student_stage_content', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 harvest_items + tasks 详情', async () => {
    const mockEnv = {
      data: {
        stage_id: 'st1',
        title: '关 1',
        harvest_items: ['学会同理倾听', '识别 3 种反应'],
        cognitive_goals: ['区分倾听与等候说话'],
        application_goals: ['对话练习 3 次'],
        tasks: [
          { task_id: 't1', type: 'reflection', title: '反思练习', description: '...', difficulty: 'basic' },
          { task_id: 't2', type: 'practice', title: '应用练习', description: '...', difficulty: 'intermediate' },
        ],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/stages/st1?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({ stage_id: 'st1' })
    expect(result.data.tasks).toHaveLength(2)
    expect(result.data.tasks[0].task_id).toBe('t1')
    expect(result.data.harvest_items).toContain('学会同理倾听')
  })

  it('stage_id 透传 + api_name 正确', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { tasks: [] }, meta: {}, links: {}, errcode: 0, errmsg: '' })
    })
    await tool.handler({ stage_id: 'stX' })
    expect(called.name).toBe('student.stage.content')
    expect(called.params.stage_id).toBe('stX')
  })

  it('未报营时抛错', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(new Error('你尚未报名该训练营'))
    await expect(tool.handler({ stage_id: 'stX' })).rejects.toThrow(/尚未报名/)
  })
})
