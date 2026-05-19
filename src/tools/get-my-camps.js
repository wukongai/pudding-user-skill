/**
 * tool: get_my_camps
 * 调 GET /api/skill-public/my-camps
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_my_camps',
  description:
    '查询当前学员（你正在帮的这个人）在布丁报名的所有训练营列表 + 进度（当前第几关 / 总关数 / 进度% / 连续天数 / 报名时间）。' +
    '当学员说"我报了哪些营"/"我的训练营"/"我的进度"/"我现在到哪了"/"我学到第几关了"/"看下我的布丁账号"/"我的学习状态"/"看下布丁" 时使用。' +
    '即使学员只是模糊地问"我的学习"或者上下文是布丁 / 训练营 / 好奇猫，也应该主动调本工具拿事实——**不要凭对话历史推断**学员当前在哪个营。' +
    '返回 status 字段：ongoing（进行中）/ graduated（已毕业）/ markedForRevisit（标记复盘）。' +
    '🔗 **跨工具编舞**：本工具是顶层入口。get_today_checkin 的可选 campId 参数从这里拿；get_stage 的 stageId 需要进入某个 camp 后才能拿到；submit_checkin 严格依赖本工具先确认学员在哪个营。' +
    '🚫 学员没报营时返回 { camps: [], hint: ... }——此时应**提醒学员先去布丁主站报名**，不要尝试调其他 tool。',
  inputSchema: z.object({}),
  async handler() {
    const data = await callApi('GET', '/api/skill-public/my-camps')
    if (!data.camps || data.camps.length === 0) {
      return {
        camps: [],
        hint: '该学员还没报名任何训练营。请提醒学员先去布丁主站 https://aixiaoai.cloud 浏览并报名训练营。',
      }
    }
    return data
  },
}
