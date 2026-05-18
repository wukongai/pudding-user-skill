/**
 * Tool 注册中心
 *
 * 新加 tool 时只需在此 import + 加入 ALL_TOOLS 数组
 */

import getMyCamps from './get-my-camps.js'
import getTodayCheckin from './get-today-checkin.js'
import getStage from './get-stage.js'
import submitCheckin from './submit-checkin.js'
import getAbilityRadar from './get-ability-radar.js'
import getNotifications from './get-notifications.js'

export const ALL_TOOLS = [
  getMyCamps,
  getTodayCheckin,
  getStage,
  submitCheckin,
  getAbilityRadar,
  getNotifications,
]

// 按 name 查找（O(1)）
export const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]))
