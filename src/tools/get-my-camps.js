/**
 * tool: get_my_camps
 * 调 GET /api/skill-public/my-camps
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_my_camps',
  description:
    '查询当前学员（你正在帮的这个人）在布丁报名的所有训练营列表 + 进度（当前第几关 / 总关数 / 进度% / 连续天数）。' +
    '当学员说"我报了哪些营"/"我的训练营"/"我的进度"/"我现在到哪了"时使用。' +
    '返回 status 字段：ongoing（进行中）/ graduated（已毕业）/ markedForRevisit（标记复盘）。' +
    '本工具是其他 tool 的前置：很多 tool 需要 campId / systemId，应先调本工具拿到。',
  inputSchema: z.object({}),
  async handler() {
    const data = await callApi('GET', '/api/skill-public/my-camps')
    if (!data.camps || data.camps.length === 0) {
      return {
        camps: [],
        hint: '该学员还没报名任何训练营。请提醒学员先去布丁主站 https://aixiaoai.cloud 浏览并报名训练营。',
      }
    }
    return data
  },
}
