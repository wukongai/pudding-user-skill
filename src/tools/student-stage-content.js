/**
 * tool: student_stage_content
 * 调网关 student.stage.content
 *
 * v2.0.0:从 v1.x 的 get_stage 拆出来的"内容"部分(对应 brainstorming §4 决策 4)
 * 含 harvest_items / cognitive_goals / application_goals / tasks 详细
 * tier 限制:v1 全开,v2 free 只看前 3 tasks + paid 看完整 + expanded_blocks
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_stage_content',
  description:
    '查询某个关卡的详细学习内容:收获项 / 认知目标 / 应用目标 / 任务清单(含 task_id 和 description)。' +
    '当学员问"这一关有哪些任务 / 学习目标 / 收获项 / 我要做什么练习" 时使用。' +
    '⚠️ **submit_checkin 前必调本工具**:用本工具返回的 tasks[].task_id 让学员勾选,**不要凭空捏造 task_id**。' +
    '【调用前置】必须先有 stage_id(来自 student_camps_list 或 student_stage_summary)。' +
    '【返回字段语义】stage_id=关卡 ID(技术);title=关卡标题;' +
    'harvest_items[]=收获项数组(学员完成本关将获得的具体能力或洞察,字符串数组);' +
    'cognitive_goals[]=认知目标数组(关卡培养的思维与认知);' +
    'application_goals[]=应用目标数组(关卡培养的实际场景应用能力);' +
    'tasks[]=任务详情数组,每项含 task_id(技术 ID,提交时用) / type / title(展示) / description / difficulty(basic|intermediate|full)。' +
    '【展示规范】末尾附 links.self_web。展示 tasks 时用编号 + title + difficulty 中文化(基础/进阶/完整)。' +
    '【何时别用】只想看关卡名 / 难度档位 / tasks_count → 用 student_stage_summary。' +
    '【tier 限制】v1 全开 — v2 免费用户可能只看到前 3 个 task。',
  inputSchema: z.object({
    stage_id: z.string().min(1).describe('关卡 ID,来自 camps / growth_path / stage.summary'),
  }),
  async handler(args) {
    const envelope = await callGateway('student.stage.content', {
      stage_id: args.stage_id,
    })
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
