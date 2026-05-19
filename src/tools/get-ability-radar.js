/**
 * tool: get_ability_radar
 * 调 GET /api/skill-public/ability-radar
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_ability_radar',
  description:
    '查询学员的能力雷达图数据（按训练营分组的 6 大能力维度 energy 值，对应布丁主站个人中心的蛛网图）。' +
    '当学员说"我的能力档"/"哪个能力最弱"/"看下雷达图"/"我适合继续学什么营"/"我的能力分布"/"哪方面需要补"/"看下能力雷达"/"我的强项是什么" 时使用。' +
    '返回 radar 数组，每项是一个训练营 + 6 个能力大类的 energy 值（0-100，数字越大表示该能力越强）。' +
    '🔗 **跨工具编舞**：本工具的产出常常驱动下一步——分析出"最弱两个能力" → 调 get_my_camps 看现有营是否能补强，或推荐学员去主站浏览相关营报名。' +
    '📋 **展示给学员时**：用条形图 ASCII 或文字表格化呈现，标出强项/弱项，**不要直接抛 raw JSON**。可附"建议学习方向"一句话点评，但不强求。' +
    '🚫 学员从未报营或所有营都没产生足够数据时 radar 可能为空数组——此时应告知学员"还需要多打几次卡才能生成能力雷达"，**不要凭空脑补**能力数值。',
  inputSchema: z.object({}),
  async handler() {
    return await callApi('GET', '/api/skill-public/ability-radar')
  },
}
