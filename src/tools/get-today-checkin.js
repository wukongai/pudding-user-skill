/**
 * tool: get_today_checkin
 * 调 GET /api/skill-public/today-checkin
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_today_checkin',
  description:
    '查询学员"今天"的打卡状态：今天有没有打卡 / 今日打卡条数 / 总积分 / 最长连续天数 / 最后一次打卡日期。' +
    '当学员说"我今天打卡了吗"/"今天还有什么任务"/"我连续多少天了"时使用。' +
    '可选参数 campId 过滤单个训练营（不传则跨所有营聚合）。' +
    '当学员只是问"今天该学什么"还没明确说要打卡，先用这个看状态，**不要直接调 submit_checkin**。',
  inputSchema: z.object({
    campId: z
      .string()
      .optional()
      .describe('可选：训练营 ID（从 get_my_camps 返回的 campId 字段拿）。不传则跨所有营聚合'),
  }),
  async handler(args) {
    const params = {}
    if (args.campId) params.campId = args.campId
    return await callApi('GET', '/api/skill-public/today-checkin', { params })
  },
}
