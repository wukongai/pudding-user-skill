/**
 * tool: get_ability_radar
 * 调 GET /api/skill-public/ability-radar
 */

import { z } from 'zod'
import { callApi } from '../api-client.js'

export default {
  name: 'get_ability_radar',
  description:
    '查询学员的能力雷达图数据（按训练营分组的能力大类能量值，对应布丁主站个人中心的蛛网图）。' +
    '当学员说"我的能力档"/"哪个能力最弱"/"看下雷达图"/"我适合继续什么营"时使用。' +
    '返回 radar 数组，每项是一个训练营 + 6 个能力大类的 energy 值（数字越大表示该能力越强）。' +
    'AI 拿到数据后可以分析"最弱的两个能力是什么 + 哪些营能补强"，给学员推荐学习方向。',
  inputSchema: z.object({}),
  async handler() {
    return await callApi('GET', '/api/skill-public/ability-radar')
  },
}
