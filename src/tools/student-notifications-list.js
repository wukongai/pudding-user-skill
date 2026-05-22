/**
 * tool: student_notifications_list
 * 调网关 student.notifications.list
 *
 * v2.0.0:从 v1.x 的 get_notifications 重命名 + 字段名 snake_case + 时间戳 Unix 化
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_notifications_list',
  description:
    '查询学员通知列表 + 未读数。' +
    '当学员问"我有什么通知 / 老师有没有回复 / 最近有什么动态" 时使用。' +
    '【返回字段语义】unread_count=未读数(整数);' +
    'recent[]=最近通知数组,每项含 notification_id(技术 ID) / type(通知类型) / title(展示) / content(展示) / link(URL 可能 null) / is_read(bool) / created_at(Unix 秒,展示时**必须**转 YYYY-MM-DD)。' +
    '【展示规范】末尾附 links.self_web。created_at 是 Unix 时间戳(秒),展示时转 YYYY-MM-DD,**禁止输出原始数字**。' +
    '【何时别用】学员问其他业务问题(不是通知/动态/老师回复)。',
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe('默认 5,上限 20'),
  }),
  async handler(args) {
    const params = {}
    if (args.limit) params.limit = args.limit
    const envelope = await callGateway('student.notifications.list', params)
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
