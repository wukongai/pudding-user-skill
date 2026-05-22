/**
 * _list tool 测试(元接口)
 */

import * as apiClient from '../../src/api-client.js'
import tool from '../../src/tools/_list.js'

describe('_list', () => {
  afterEach(() => vi.restoreAllMocks())

  it('成功:返回 apis 数组(含 api_name / summary / type / tier_required)', async () => {
    const mockEnv = {
      data: {
        apis: [
          {
            api_name: 'student.camps.list',
            summary: '列出当前学员报名的所有训练营 + 进度 + 状态',
            type: 'metric',
            tier_required: 'free',
            params: [],
            response_schema: { fields: [] },
          },
          {
            api_name: 'student.camp.growth_path',
            summary: '营毕业路径详情 + 教练建议',
            type: 'content',
            tier_required: 'free',
            params: [{ name: 'camp_id', type: 'string', required: true }],
            response_schema: { fields: [] },
          },
        ],
      },
      meta: { skill_version: '2.0.0', tier: 'free', request_id: 'r' },
      links: null,
      errcode: 0,
      errmsg: '',
    }
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue(mockEnv)
    const result = await tool.handler()
    expect(result.data.apis).toHaveLength(2)
    expect(result.data.apis[0].api_name).toBe('student.camps.list')
    expect(result.data.apis[1].tier_required).toBe('free')
  })

  it('api_name = _list 且 params = {}', async () => {
    let called = null
    vi.spyOn(apiClient, 'callGateway').mockImplementation((name, params) => {
      called = { name, params }
      return Promise.resolve({ data: { apis: [] }, meta: {}, links: null, errcode: 0, errmsg: '' })
    })
    await tool.handler()
    expect(called.name).toBe('_list')
    expect(called.params).toEqual({})
  })

  it('返回不含 links(元接口)', async () => {
    vi.spyOn(apiClient, 'callGateway').mockResolvedValue({
      data: { apis: [] },
      meta: {},
      links: null,
      errcode: 0,
      errmsg: '',
    })
    const result = await tool.handler()
    expect(result.links).toBeUndefined()  // tool handler 故意不返回 links
  })
})
