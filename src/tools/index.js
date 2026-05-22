/**
 * Tool 注册中心 v2.0.0
 *
 * 注:MCP tool 名用下划线(MCP 协议限制 a-z0-9_)
 *     网关 api_name 用点号(weread 风格,体现层级)
 *     两者通过 tool.handler → callGateway(apiName) 映射
 *
 * 10 个 tool:
 *   - 1 个元(_list)
 *   - 5 个指标(camps.list / stage.summary / ability.indicators / checkin.today / notifications.list)
 *   - 3 个内容(camp.growth_path / stage.content / ability.insights)
 *   - 1 个写动作(checkin.submit)
 */

import studentCampsList from './student-camps-list.js'
import studentCampGrowthPath from './student-camp-growth-path.js'
import studentStageSummary from './student-stage-summary.js'
import studentStageContent from './student-stage-content.js'
import studentAbilityIndicators from './student-ability-indicators.js'
import studentAbilityInsights from './student-ability-insights.js'
import studentCheckinToday from './student-checkin-today.js'
import studentCheckinSubmit from './student-checkin-submit.js'
import studentNotificationsList from './student-notifications-list.js'
import _list from './_list.js'

export const ALL_TOOLS = [
  // 元接口(放最前面,让 LLM 优先发现)
  _list,
  // 指标类
  studentCampsList,
  studentStageSummary,
  studentAbilityIndicators,
  studentCheckinToday,
  studentNotificationsList,
  // 内容类
  studentCampGrowthPath,
  studentStageContent,
  studentAbilityInsights,
  // 写动作
  studentCheckinSubmit,
]

// 按 name 查找(O(1))
export const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]))
