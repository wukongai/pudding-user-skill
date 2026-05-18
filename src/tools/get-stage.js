/**
 * tool: get_stage
 * 调 GET /api/skill-public/stage/:id
 *
 * 关键作用：submit_checkin 必须先调本工具，拿真实的 task ID（不要让 AI 凭空编造）。
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_stage',
  description:
    '查询布丁某个关卡（stage）的详细信息：标题 / 副标题 / 收获清单 / 认知目标 / 应用目标 / 任务列表（含 task ID / 类型 / 标题 / 难度）。' +
    '当学员说"第 N 关讲什么"/"打开关卡 X"/"看一下任务"时使用。' +
    '⚠️ **submit_checkin 的前置**：要帮学员打卡前，必须先调本工具拿到 tasks 数组里的真实 task.id，' +
    '让学员选完成了哪些任务后，把 ID 数组传给 submit_checkin 的 completedTaskIds 参数。' +
    '**禁止凭空编造 task ID**——会被后端 400 拒绝。',
  inputSchema: z.object({
    stageId: z
      .string()
      .min(1)
      .describe(
        '关卡 ID（cuid 格式）。从 get_my_camps 进入营 → 主站浏览器 URL 里取，或者从其他工具返回的 stageId 字段。',
      ),
  }),
  async handler(args) {
    return await callApi('GET', `/api/skill-public/stage/${encodeURIComponent(args.stageId)}`)
  },
}
