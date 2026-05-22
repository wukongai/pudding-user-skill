/**
 * tool: student_checkin_today
 * 调网关 student.checkin.today
 *
 * v2.0.0:从 v1.x 的 get_today_checkin 重命名 + 字段名 snake_case
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_checkin_today',
  description:
    '查询学员今日打卡状态 + 连续天数 + 总积分。' +
    '当学员问"今天打卡了吗 / 我连续多少天了 / 上次打卡是什么时候 / 我攒了多少积分" 时使用。' +
    '【返回字段语义】today=今日日期 YYYY-MM-DD;is_checked_today=今天是否已打卡(bool,任意营都算);' +
    'today_checkin_count=今日打卡次数(跨营汇总,除非传 camp_id 过滤);' +
    'total_points=总积分(若传 camp_id 是单营;否则跨营汇总);' +
    'max_streak_days=最长连续打卡天数(单营值;跨营时取最大值,**不是历史最长**而是当前连续);' +
    'latest_checkin_at=最近一次打卡日期 YYYY-MM-DD(可能 null,可能不是今天);' +
    'camp_id=回显传参(string|null)。' +
    '【展示规范】末尾附 links.self_web。日期用 YYYY-MM-DD,不输出 Unix 数字。' +
    '【何时别用】要提交打卡 → student_checkin_submit;查所有营进度 → student_camps_list。',
  inputSchema: z.object({
    camp_id: z
      .string()
      .optional()
      .describe('可选 — 指定营聚合统计,不传则跨营汇总'),
  }),
  async handler(args) {
    const params = {}
    if (args.camp_id) params.camp_id = args.camp_id
    const envelope = await callGateway('student.checkin.today', params)
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
