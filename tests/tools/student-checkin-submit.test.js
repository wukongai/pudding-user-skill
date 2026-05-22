/**
 * student_checkin_submit tool 测试(写动作)
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/student-checkin-submit.js'

describe('student_checkin_submit', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 checkin_id + new_streak_days + note', async () => {
    const mockEnv = {
      data: {
        success: true,
        checkin_id: 'ck1',
        stage_title: '关 1 倾听',
        new_streak_days: 8,
        note: 'v1 MCP 简化版打卡:已记录笔记 + 更新连续天数;积分/勋章/能量将在下次浏览器内打卡时一并刷新',
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: { self_web: 'https://aixiaoai.cloud/checkin/ck1?ref=skill' },
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler({
      stage_id: 'st1',
      difficulty: 'basic',
      completed_task_ids: ['t1', 't2'],
      reflection: '今天学到了倾听',
      question: '暂无',
    })
    expect(result.data.success).toBe(true)
    expect(result.data.new_streak_days).toBe(8)
    expect(result.data.note).toContain('v1 MCP 简化版打卡')
  })

  it('网关收到 snake_case 字段(api_name + 所有 params)', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({
        data: { success: true, checkin_id: 'ck1', stage_title: 't', new_streak_days: 1, note: '' },
        meta: {}, links: {}, errcode: 0, errmsg: '',
      })
    })
    await tool.handler({
      stage_id: 'st1',
      difficulty: 'intermediate',
      completed_task_ids: ['t1'],
      reflection: 'r',
      question: '暂无',
      focus_rating: 4,
      free_note: '给老师',
    })
    expect(called.name).toBe('student.checkin.submit')
    expect(called.params.stage_id).toBe('st1')
    expect(called.params.completed_task_ids).toEqual(['t1'])
    expect(called.params.focus_rating).toBe(4)
    expect(called.params.free_note).toBe('给老师')
    expect(called.params.harvest_rating).toBeUndefined()  // 没传不出现
  })

  it('部分 task_id 不属于该关卡时抛错', async () => {
    vi.spyOn(apiClient, 'callGateway').mockRejectedValue(
      new Error('部分 task_id 不属于该关卡或已删除,请重新调 student.stage.content 拿最新 task 列表')
    )
    await expect(tool.handler({
      stage_id: 'st1',
      difficulty: 'basic',
      completed_task_ids: ['fake_task'],
      reflection: 'r',
      question: '暂无',
    })).rejects.toThrow(/不属于该关卡.*重新调.*stage\.content/)
  })
})
