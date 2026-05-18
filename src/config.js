/**
 * 配置加载与校验
 *
 * 学员两个必填环境变量：
 *   - PUDDING_API_URL    布丁后端 base URL（如 https://aixiaoai.cloud）
 *   - PUDDING_MCP_TOKEN  学员从 /profile/ai-access 复制的认证字符串
 *
 * 任一缺失 → stderr 打印友好提示 + exit(1)（MCP 客户端会展示给学员看）
 */

const DEFAULT_API_URL = 'https://aixiaoai.cloud'

export function loadConfig() {
  const apiUrl = (process.env.PUDDING_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
  const token = process.env.PUDDING_MCP_TOKEN

  if (!token) {
    console.error('')
    console.error('❌ pudding-user-skill 启动失败：缺少 PUDDING_MCP_TOKEN 环境变量')
    console.error('')
    console.error('📖 装机步骤：')
    console.error('   1. 浏览器登录布丁 https://aixiaoai.cloud')
    console.error('   2. 进个人中心 → AI 接入 → 一键生成专属字符串')
    console.error('   3. 复制 token，配置到 MCP 客户端的 env 里')
    console.error('')
    console.error('   示例（Claude Desktop / Cursor / Claude Code 通用）：')
    console.error('   {')
    console.error('     "mcpServers": {')
    console.error('       "pudding": {')
    console.error('         "command": "npx",')
    console.error('         "args": ["-y", "github:wukongai/pudding-user-skill"],')
    console.error('         "env": {')
    console.error('           "PUDDING_API_URL": "https://aixiaoai.cloud",')
    console.error('           "PUDDING_MCP_TOKEN": "<你的 token>"')
    console.error('         }')
    console.error('       }')
    console.error('     }')
    console.error('   }')
    console.error('')
    process.exit(1)
  }

  return { apiUrl, token }
}
