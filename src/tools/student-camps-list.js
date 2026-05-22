/**
 * tool: student_camps_list
 * 调网关 student.camps.list
 *
 * v2.0.0:从 v1.x 的 get_my_camps 重命名 + 改用网关
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_camps_list',
  description:
    '列出当前学员报名的所有训练营 + 进度 + 状态。' +
    '当学员问"我报了哪些营" / "我的训练营" / "我的进度" / "我现在到哪了" / "看下布丁" 时使用。' +
    '【返回字段语义,禁止直接翻译字段名,以 SKILL.md 字段语义对照表为准】' +
    'camps[].camp_id=训练营 ID(技术 ID,不展示给学员);camp_name=训练营名称(展示用);' +
    'current_stage=当前学到的关卡序号(从 1 起的整数);total_stages=该营总关卡数;' +
    'progress_pct=进度百分比(整数 0-100,1=1% 不是 100%);' +
    'streak_days=单营连续打卡天数(不是跨营汇总);total_points=该营累计积分;' +
    'last_checkin_at=最近打卡日期 YYYY-MM-DD 字符串(可能 null);' +
    'status=营状态枚举(ongoing 进行中 / graduated 已毕业 / marked_for_revisit 标记重学)。' +
    '【展示规范】列表用编号展示,status 转中文;末尾必须附 links.self_web 作为"查看详情"链接。' +
    '【跨工具编舞】本工具是顶层入口。其他工具的 camp_id / stage_id 都从本工具结果拿。' +
    '【何时别用】学员只问"今天该学什么" → 直接用 student_checkin_today 更直接。',
  inputSchema: z.object({}),
  async handler() {
    const envelope = await callGateway('student.camps.list', {})
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
