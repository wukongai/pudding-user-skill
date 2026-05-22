/**
 * tool: student_ability_indicators
 * 调网关 student.ability.indicators
 *
 * v2.0.0:从 v1.x 的 get_ability_radar 重命名(指标类)
 * 只返回数值,文字解读由 student_ability_insights 提供
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: 'student_ability_indicators',
  description:
    '查询学员各体系的能力雷达指标 — 维度名 + 当前能量分数(数字 0+,非百分比)。' +
    '当学员问"我能力雷达 / 各维度怎样 / 看我的能量值" 时使用。' +
    '【返回字段语义】radar[]=按体系分组的雷达数组;radar[].system_id=体系 ID(技术);' +
    'system_name=体系名(展示);categories[]=该体系的能力维度数组,每项含 category_id(技术) / name(展示) / icon / energy(整数,能量累计值)。' +
    '【展示规范】能量值不是百分比是分数累计;末尾附 links.self_web。' +
    '【何时别用】要文字解读 / 教练建议 → 用 student_ability_insights。',
  inputSchema: z.object({}),
  async handler() {
    const envelope = await callGateway('student.ability.indicators', {})
    return {
      data: envelope.data,
      links: envelope.links,
    }
  },
}
