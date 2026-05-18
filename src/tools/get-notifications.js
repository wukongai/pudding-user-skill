/**
 * tool: get_notifications
 * 调 GET /api/skill-public/notifications
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_notifications',
  description:
    '查询学员的布丁通知（未读数 + 最近 N 条标题/内容/链接）。' +
    '当学员说"我有什么新消息"/"看下通知"/"有人评论我了吗"/"有没有公告"时使用。' +
    '返回 unreadCount（未读总数）+ recent 数组（最近 N 条详情）。' +
    '可选 limit 参数控制最近条数（默认 5，最大 20）。',
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
