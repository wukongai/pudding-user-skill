#!/usr/bin/env node
/**
 * pudding-user-skill MCP server 入口
 *
 * 协议：Model Context Protocol（MCP）via stdio transport
 * 客户端：Claude Desktop / Cursor / Claude Code / 龙虾 等支持 MCP 的 AI 客户端
 *
 * 启动流程：
 *   1. 客户端按 config.json 启动本进程（npx -y github:wukongai/pudding-user-skill）
 *   2. 客户端通过 stdin / stdout JSON-RPC 与本 server 通信
 *   3. 客户端调用 tools/list → 本 server 返回 6 个 tool schema
 *   4. 客户端调用 tools/call → 本 server 路由到对应 tool.handler → 调布丁后端 REST
 *
 * 日志：必须只往 stderr 写，stdout 是 MCP 协议通道，写任何非协议数据会让客户端解析挂掉
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { loadConfig } from './config.js'
import { createApiClient } from './api-client.js'
import { ALL_TOOLS, TOOL_MAP } from './tools/index.js'

// 1. 加载配置（缺 token 会自己 exit(1) 给出友好提示）
const config = loadConfig()

// 2. 初始化 axios 单例
createApiClient(config)

// 3. 创建 MCP server
const server = new Server(
  {
    name: 'pudding-user-skill',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// 4. 注册 tools/list 处理器 — 返回 6 个 tool 的 schema
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    // zod schema 转 JSON Schema（MCP 协议要求 JSON Schema 格式）
    inputSchema: zodToJsonSchema(t.inputSchema, { target: 'jsonSchema7' }),
  })),
}))

// 5. 注册 tools/call 处理器 — 按 name 路由到对应 tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  const tool = TOOL_MAP[name]
  if (!tool) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `未知工具：${name}。可用工具：${ALL_TOOLS.map((t) => t.name).join(', ')}`,
        },
      ],
    }
  }

  try {
    // zod 校验参数
    const validatedArgs = tool.inputSchema.parse(args)
    // 真调 handler
    const result = await tool.handler(validatedArgs)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  } catch (err) {
    // zod 校验失败 / axios 报错 / 业务逻辑报错都进这里
    const errMessage = err.errors // zod ValidationError 有 errors 数组
      ? `参数校验失败：${JSON.stringify(err.errors, null, 2)}`
      : err.message || String(err)
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: errMessage,
        },
      ],
    }
  }
})

// 6. 启动 stdio transport
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr 启动日志（不污染 stdout MCP 通道）
  console.error(
    `[pudding-user-skill] MCP server 已启动 (${ALL_TOOLS.length} tools) → ${config.apiUrl}`,
  )
}

main().catch((err) => {
  console.error('[pudding-user-skill] 致命错误：', err)
  process.exit(1)
})
