/**
 * tool: _list (元接口)
 * 调网关 _list
 *
 * v2.0.0 新增:让 LLM 运行时自学所有可用 api(对应 weread SKILL.md L82 内省接口范式)
 */

import { z } from 'zod'
import { callGateway } from '../api-client.js'

export default {
  name: '_list',
  description:
    '元接口:列出所有支持的 api_name + 参数 schema + 返回字段定义。' +
    '当 LLM 启动时一次性拉所有 api 定义 / 遇到不认识的 api_name 时查询 / 学员问"你都能做什么" 时使用。' +
    '【返回字段语义】apis[]=ApiDescriptor 数组,每项含 api_name(技术 ID) / summary(中文说明) / type(metric|content|write|meta) / tier_required(free|paid|vip) / params 数组 / response_schema。' +
    '【展示规范】给学员看时用中文 summary 列表 + 分类(查询/内容/写操作/元),不直接输出技术 api_name。' +
    '【何时别用】学员问具体业务问题 — 使用对应业务 tool 直接调,不需要先调 _list。',
  inputSchema: z.object({}),
  async handler() {
    const envelope = await callGateway('_list', {})
    return {
      data: envelope.data,
      // _list 元接口不需要 links
    }
  },
}
