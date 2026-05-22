/**
 * tool: student_checkin_submit(写动作)
 * 调网关 student.checkin.submit
 *
 * v2.0.0:从 v1.x 的 submit_checkin 重命名 + 字段名 snake_case + errcode 化错误
 * v1 极简版打卡:不算积分/勋章,reflection 前缀加 [via AI · {label}]
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_checkin_submit',
  description:
    '提交布丁关卡打卡(v1 极简版:仅记录笔记 + 更新连续天数;积分/勋章/关卡解锁在浏览器内打卡时一并刷新)。' +
    '当学员**明确**说"帮我打卡 / 提交打卡 / 今天的反思打到第 X 关 / 把今天的感想提交了 / submit checkin" 时使用。' +
    '⚠️ **严格前置流程**(违反任一步后端会 errcode 40004 / 40402 拒绝):' +
    '\n  1. 必须先调 student_camps_list 拿学员当前在哪个营,current_stage 是多少' +
    '\n  2. 必须先调 student_stage_content(stage_id) 拿真实 tasks 数组(含 task_id)' +
    '\n  3. 让学员**自己**勾选完成了哪些 task(从 tasks[].task_id 中选,**不要凭空捏造**)' +
    '\n  4. 让学员**自己**选难度档(basic / intermediate / full,必须明确说出来)' +
    '\n  5. 让学员**自己**写 reflection(今日感想,必填) 和 question(疑问,必填,真无问题写"暂无")' +
    '\n  6. 把以上信息组装好才调本工具' +
    '\n【返回字段语义】success=bool;checkin_id=新建打卡记录 ID(技术);' +
    'stage_title=关卡标题(展示);new_streak_days=当前连续打卡天数(整数);' +
    'note=⚠️ 必须透传给学员的服务端提示(v1 极简版打卡积分/勋章不立即结算的说明)。' +
    '\n【展示规范】打卡成功必须告诉学员 note 字段内容(v1 限制);末尾附 links.self_web 让学员去主站看。' +
    '\n【禁止行为】凭空捏造 task_id / 替学员选难度或写反思 / 重复硬撞 400 错误。' +
    '\n【tier 限制】全开(任何学员都可提交打卡)。',
  inputSchema: z.object({
    stage_id: z.string().min(1).describe('关卡 ID(从 student_stage_content 拿)'),
    difficulty: z
      .enum(['basic', 'intermediate', 'full'])
      .describe('难度档:basic 基础 / intermediate 进阶 / full 完整'),
    completed_task_ids: z
      .array(z.string())
      .min(1)
      .describe('已完成 task_id 数组(从 student_stage_content 返回的 tasks[].task_id 中选,至少 1 个)'),
    reflection: z.string().min(1).describe('今日感想(必填,学员真实思考)'),
    question: z.string().min(1).describe('疑问(必填,真无问题写"暂无"但不能空字符串)'),
    focus_rating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe('投入度自评 1-5(可选)'),
    harvest_rating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe('收获感自评 1-5(可选)'),
    free_note: z
      .string()
      .optional()
      .describe('给老师的悄悄话(可选,默认仅老师可见)'),
  }),
  async handler(args) {
    const params = {
      stage_id: args.stage_id,
      difficulty: args.difficulty,
      completed_task_ids: args.completed_task_ids,
      reflection: args.reflection,
      question: args.question,
    }
    if (args.focus_rating != null) params.focus_rating = args.focus_rating
    if (args.harvest_rating != null) params.harvest_rating = args.harvest_rating
    if (args.free_note) params.free_note = args.free_note

    const envelope = await callGateway('student.checkin.submit', params)
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
