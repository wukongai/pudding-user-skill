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
    '查询布丁某个关卡（stage）的详细信息：标题 / 副标题 / 收获清单 / 认知目标 / 应用目标 / 任务列表（含真实 task.id / 类型 / 标题 / 难度档候选）。' +
    '当学员说"第 N 关讲什么"/"打开关卡 X"/"看下任务"/"这关有什么"/"任务清单"/"看一下要做什么"/"这关讲啥" 时使用。' +
    '⚠️ **submit_checkin 的硬前置**：要帮学员打卡前，必须先调本工具拿到 tasks 数组里的真实 task.id，让学员选完成了哪些任务后，把 ID 数组传给 submit_checkin 的 completedTaskIds 参数。**禁止凭空编造 task ID**——会被后端 HTTP 400 拒绝。' +
    '🔗 **跨工具编舞**：stageId 通常从两处来——① 学员在浏览器看到某关想问详情时直接告诉你 ② get_my_camps 返回的 camps[].currentStage（数字，需要业务上下文再解析成 stageId）。如果学员问"我当前关讲什么"但没给 stageId，先调 get_my_camps 看学员在哪个营第几关，再让学员确认或主动从主站浏览器复制 stageId。' +
    '📋 **展示给学员时**：按学员意图分流——问"讲什么"则输出收获+目标，要打卡则输出 tasks 清单让学员勾选编号（不要展示 cuid）。',
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
