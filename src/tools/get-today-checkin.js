/**
 * tool: get_today_checkin
 * 调 GET /api/skill-public/today-checkin
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_today_checkin',
  description:
    '查询学员"今天"的打卡状态：今天有没有打卡 / 今日打卡条数 / 总积分 / 最长连续天数 / 最后一次打卡时间 / 各营分项打卡明细。' +
    '当学员说"我今天打卡了吗"/"今天还有什么任务"/"我连续多少天了"/"今天该学什么"/"今天还差啥"/"我的连续天数"/"打卡进度怎么样" 时使用。' +
    '可选参数 campId 过滤单个训练营（不传则跨所有营聚合），campId 通常从 get_my_camps 返回的 camps[].id 拿。' +
    '🔗 **跨工具编舞**：和 get_my_camps 形成"营 × 今日"两个维度的状态二联画——学员问"今天该学什么"通常需要两者一起调。' +
    '🚫 **关键防误调**：学员只是问"今天该学什么"/"今天还有任务吗"时，先用本工具看状态——**不要直接调 submit_checkin**。学员只是想了解情况，没说要提交。只有学员明确说"帮我打卡"/"提交"时才走 submit_checkin 严格前置流程。' +
    '⚠️ 当天状态短时间不会变，**不要频繁调本工具**——缓存上次结果即可。',
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
