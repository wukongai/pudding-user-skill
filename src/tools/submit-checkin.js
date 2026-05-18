/**
 * tool: submit_checkin
 * 调 POST /api/skill-public/checkin
 *
 * v1 极简版（布丁后端 v1.20.0 Phase 1）：
 *   - 仅创建打卡记录 + 更新连续天数
 *   - 不算积分 / 不发勋章 / 不算关卡解锁
 *   - 学员通过浏览器再打卡时会一并补算
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'submit_checkin',
  description:
    '帮学员提交布丁关卡打卡。当学员明确说"帮我打卡"/"提交打卡"/"今天的反思打到 X 关上"时使用。' +
    '⚠️ **严格前置流程**（违反会被 400 拒绝）：' +
    '\n  1. 必须先调 get_my_camps 拿到学员报名的训练营列表' +
    '\n  2. 必须先调 get_stage 拿到目标关卡的真实 task 列表（task.id + task.title）' +
    '\n  3. 让学员勾选完成了哪些任务（不要替学员选）' +
    '\n  4. 让学员选难度档（basic / intermediate / full）' +
    '\n  5. 让学员写今日反思（reflection）和疑问（question，可写"暂无"但不能空）' +
    '\n  6. 把以上信息组装后才调本工具' +
    '\n📝 **v1 限制**：本次提交只记录笔记 + 更新连续天数；积分 / 勋章 / 关卡解锁会在学员下次浏览器内打卡时一并刷新。' +
    '\n🚫 **禁止行为**：凭空捏造 task ID（必须从 get_stage 拿）；学员只是聊学习心得而没说"打卡"时不要主动调本工具。',
  inputSchema: z.object({
    stageId: z.string().min(1).describe('关卡 ID（cuid，从 get_my_camps / get_stage 拿）'),
    difficulty: z
      .enum(['basic', 'intermediate', 'full'])
      .describe('难度档：basic 基础 / intermediate 进阶 / full 完整。必须让学员明确选'),
    completedTaskIds: z
      .array(z.string())
      .min(1)
      .describe('已完成任务 ID 数组（至少 1 个）。必须从 get_stage 返回的 tasks[].id 中选，禁止编造'),
    reflection: z
      .string()
      .min(1)
      .describe('今日感想 / 反思（必填，学员对本关的真实思考；不能空字符串）'),
    question: z
      .string()
      .min(1)
      .describe('我的疑问（必填，学员有什么不懂的；如真无问题可写"暂无"但不能完全空）'),
    focusRating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe('投入度自评 1-5 分（可选）'),
    harvestRating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe('收获感自评 1-5 分（可选）'),
    freeNote: z.string().optional().describe('给老师的悄悄话（可选，默认仅老师可见）'),
  }),
  async handler(args) {
    const body = {
      stageId: args.stageId,
      difficulty: args.difficulty,
      completedTaskIds: args.completedTaskIds,
      reflection: args.reflection,
      question: args.question,
    }
    if (args.focusRating != null) body.focusRating = args.focusRating
    if (args.harvestRating != null) body.harvestRating = args.harvestRating
    if (args.freeNote) body.freeNote = args.freeNote

    return await callApi('POST', '/api/skill-public/checkin', { data: body })
  },
}
