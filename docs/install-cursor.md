# Cursor 装机指南

> 适用客户端：[Cursor](https://cursor.com/)（VS Code 衍生 IDE，Claude/GPT 内嵌）
> Cursor 版本：0.42.0+（支持 MCP）
> 时长：3 分钟

## 一、拿 token

参考 [README § 获取你的认证字符串](../README.md#-获取你的认证字符串token)。

## 二、Cursor 添加 MCP server

### 方式 A：Cursor Settings UI（推荐）

1. Cursor → Cmd+Shift+P → 搜 "Cursor Settings: Open"
2. 左栏选 **Features** → 找 **Model Context Protocol** 段
3. 点 **+ Add new MCP server**
4. 填：
   - Name: `pudding`
   - Type: `command`
   - Command: `npx -y github:wukongai/pudding-user-skill`
   - Env：加 2 行
     - `PUDDING_API_URL` = `https://aixiaoai.cloud`
     - `PUDDING_MCP_TOKEN` = `<你的 token>`
5. 点 Save

### 方式 B：直接编辑 ~/.cursor/mcp.json

```json
{
  "mcpServers": {
    "pudding": {
      "command": "npx",
      "args": ["-y", "github:wukongai/pudding-user-skill"],
      "env": {
        "PUDDING_API_URL": "https://aixiaoai.cloud",
        "PUDDING_MCP_TOKEN": "<你的 token>"
      }
    }
  }
}
```

## 三、Reload Cursor

Cmd+Shift+P → "Reload Window"

## 四、验证

打开 Cursor Chat（右侧栏，或 Cmd+L）→ 输入：

```
@pudding 我的训练营有哪些
```

或不带 @ 让 Cursor 自动识别：

```
帮我看下布丁的今日打卡状态
```

正确响应应该是 Cursor 调用 `get_my_camps` / `get_today_checkin` 工具并返回结果。

## 五、常见问题

### Q：Cursor 看不到 MCP server

检查 Cursor 版本是否 0.42+（菜单 Cursor → About）。

### Q：调用工具时报 token 错

参考 [Claude Desktop 装机文档常见问题](install-claude-desktop.md#七常见问题)（错误处理一致）。

### Q：想在某个项目内独立配置

把 mcp.json 放在项目根 `.cursor/mcp.json`（项目内 MCP 优先级 > 用户 ~/.cursor/）。适合不同项目用不同 token 测试。

## 六、相关

- [Claude Code 的装机文档](install-claude-code.md)
- [Claude Desktop 的装机文档](install-claude-desktop.md)
