/**
 * tool: student_ability_insights
 * 调网关 student.ability.insights
 *
 * v2.0.0 新增:能力洞察 + 教练建议(内容类)
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_ability_insights',
  description:
    '查询学员能力维度的教练洞察:找最弱维度 + 文字解读 + 提升路径建议。' +
    '当学员问"我哪个能力弱 / 教练怎么看我 / 怎么提升 / 给我个学习建议" 时使用。' +
    '【返回字段语义】system_id=体系 ID(可能 null,跨系统聚合时);' +
    'weakest_category={ category_id, name(展示), energy } 当前最弱的能力维度;' +
    'insight_brief=一句话教练评语(免费);' +
    'insight_full=详细诊断报告(付费,v1 暂返回基础内容);' +
    'improvement_paths[]=提升路径建议数组(付费,v1 暂返回基础内容)。' +
    '【展示规范】末尾附 links.self_web。把英文 category name 用 SKILL.md 字段语义表翻译为中文展示。' +
    '【何时别用】只想看分数 → student_ability_indicators 更轻量。',
  inputSchema: z.object({
    system_id: z
      .string()
      .optional()
      .describe('可选 — 指定体系 ID(不传则全系统聚合)'),
  }),
  async handler(args) {
    const params = {}
    if (args.system_id) params.system_id = args.system_id
    const envelope = await callGateway('student.ability.insights', params)
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
