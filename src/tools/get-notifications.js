/**
 * tool: get_notifications
 * 调 GET /api/skill-public/notifications
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_notifications',
  description:
    '查询学员的布丁通知（未读数 + 最近 N 条通知详情：标题/内容/类型/链接/创建时间）。' +
    '当学员说"我有什么新消息"/"看下通知"/"有人评论我了吗"/"有没有公告"/"我的消息"/"看下布丁通知"/"未读消息"/"有人@我吗" 时使用。' +
    '返回 unreadCount（未读总数）+ recent 数组（最近 N 条详情，按 createdAt 倒序）。recent[].type 常见值：comment（评论）/ announcement（公告）/ system（系统通知）。' +
    '可选 limit 参数控制最近条数（默认 5，最大 20，学员明说"看所有"才用 20）。' +
    '🔗 **跨工具编舞**：本工具独立，不依赖其他 tool。是学员开会话的常见首问之一（与 get_my_camps 并列）。' +
    '📋 **展示给学员时**：用编号列表 + 时间转人话（"今天上午 08:30" 而非 ISO 字符串），附原文链接（url 字段）让学员点回去查看。**不要展示通知 id（cuid）**——学员视角无意义。' +
    '🚫 unreadCount = 0 + recent 为空时，告知学员"暂无新消息"即可，**不要凭空捏造**通知内容。',
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe('最近几条（默认 5，最大 20）'),
  }),
  async handler(args) {
    const params = {}
    if (args.limit) params.limit = args.limit
    return await callApi('GET', '/api/skill-public/notifications', { params })
  },
}
