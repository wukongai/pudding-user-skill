/**
 * tool: student_stage_summary
 * 调网关 student.stage.summary
 *
 * v2.0.0:从 v1.x 的 get_stage 拆出来的"指标"部分(对应 brainstorming §4 决策 4 协议层分层)
 * 只返回关卡概览,不含 harvest_items / cognitive_goals / tasks 详细(→ student_stage_content)
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_stage_summary',
  description:
    '查询某个关卡的概览信息:标题 / 副标题 / 关卡序号 / 难度档位 / tasks 数量 / 今日是否已打卡。' +
    '当学员问"这一关是什么 / 主题 / 难度档位 / 我今天打卡了吗" 时使用。' +
    '【调用前置】必须先有 stage_id(来自 student_camps_list 当前 current_stage 对应的 stage 或 student_camp_growth_path)。' +
    '【返回字段语义】stage_id=关卡 ID(技术 ID,不展示);title=关卡标题;subtitle=副标题(可能 null);' +
    'stage_number=该营内的关卡序号(从 1 起);system_id=体系 ID(技术);system_name=体系名(展示);' +
    'difficulty_tiers=难度档位标记(字符串,可能含 basic/intermediate/full 信息);' +
    'tasks_count=该关卡 task 总数(整数,**不是 task 详情**,要详情用 student_stage_content);' +
    'is_completed_today=今日是否已打卡(bool)。' +
    '【展示规范】末尾附 links.self_web。' +
    '【何时别用】要 task 详情 / harvest items / cognitive goals → 用 student_stage_content。' +
    '【何时下一步】学员想打卡 → 调 student_stage_content 拿 tasks 再调 student_checkin_submit。',
  inputSchema: z.object({
    stage_id: z.string().min(1).describe('关卡 ID,来自 camps 或 growth_path'),
  }),
  async handler(args) {
    const envelope = await callGateway('student.stage.summary', {
      stage_id: args.stage_id,
    })
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
