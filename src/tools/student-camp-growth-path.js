/**
 * tool: student_camp_growth_path
 * 调网关 student.camp.growth_path
 *
 * v2.0.0 新增:营毕业路径详情 + 教练建议(付费扩展)
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_camp_growth_path',
  description:
    '查询指定训练营的完整毕业路径(关卡序列 + 学员每关是否已通关) + 教练建议(付费扩展)。' +
    '当学员问"这个营的完整路径 / 学完后我会变成什么样 / 教练对我有什么建议 / 同营优秀学员怎么做" 时使用。' +
    '【调用前置】必须先调 student_camps_list 拿到 camp_id,禁止凭空捏造 camp_id。' +
    '【返回字段语义】camp_id=营 ID(技术);camp_name=营名(展示);system_id=体系 ID(技术);' +
    'graduation_steps[]=营关卡序列数组,每项含 stage_id / stage_number / title / is_completed(bool 学员是否已通关);' +
    'coach_insights[]=教练个性化建议数组(v1 暂返回基础内容,v2 paid+ 启用真个性化);' +
    'peer_anonymous_cases[]=同营优秀学员匿名案例(v1 暂返回基础内容,v2 paid+ 启用)。' +
    '【展示规范】graduation_steps 用进度条 + 编号列表展示,标完成 ✅ / 未完成 ◯;末尾附 links.self_web。' +
    '【何时别用】只想知道当前关卡进度 → 用 student_camps_list;只想看当前一关详情 → student_stage_summary。',
  inputSchema: z.object({
    camp_id: z.string().min(1).describe('训练营 ID,来自 student_camps_list 返回的 camps[].camp_id'),
  }),
  async handler(args) {
    const envelope = await callGateway('student.camp.growth_path', {
      camp_id: args.camp_id,
    })
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
