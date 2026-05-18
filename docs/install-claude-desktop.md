# Claude Desktop 装机指南

> 适用客户端：[Claude Desktop](https://claude.ai/download)（Mac / Windows 桌面 App）
> 时长：3 分钟

## 一、确认 Claude Desktop 版本

Claude Desktop 至少 0.7.0+（支持 MCP）。打开 App → 顶栏 Claude → About 查看版本。

## 二、拿 token

参考 [README § 获取你的认证字符串](../README.md#-获取你的认证字符串token)。

## 三、编辑 config 文件

文件位置（按系统选）：

| 系统 | 路径 |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

文件可能不存在，自己创建。粘贴：

```json
{
  "mcpServers": {
    "pudding": {
      "command": "npx",
      "args": ["-y", "github:wukongai/pudding-user-skill"],
      "env": {
        "PUDDING_API_URL": "https://aixiaoai.cloud",
        "PUDDING_MCP_TOKEN": "<把你的 token 粘到这里>"
      }
    }
  }
}
```

> ⚠️ 必须确保你电脑里有 `node` 和 `npx`（建议 v18+）。检查：终端跑 `node -v` 看版本号。
> 没装的话：https://nodejs.org/

## 四、重启 Claude Desktop

完全退出（Cmd+Q on Mac，右键托盘 Quit on Windows）→ 重新打开。

## 五、验证

新开会话，输入：

```
我的布丁训练营有哪些？
```

如果 Claude Desktop 顶栏出现工具调用提示，说明 MCP server 已连上。

## 六、查看 MCP 连接状态

Claude Desktop 设置 → Developer → 看 `pudding` 是否在 MCP servers 列表 + 状态绿色。

## 七、常见问题

### Q：开 Claude 后没反应 / 调不到工具

1. 检查 JSON 格式是否正确（漏逗号 / 多逗号都会让 Claude 解析失败）
2. 看 Claude Desktop 的 MCP log：设置 → Developer → "Open MCP Logs"
3. 看到 `缺少 PUDDING_MCP_TOKEN` → env 里 token 字段名打错或 token 是空
4. 看到 `布丁认证失败` → token 失效，重新生成

### Q：node 不在 PATH

`npx` 找不到 node 时会装 server 失败。在 config 里用绝对路径：

```json
"command": "/usr/local/bin/npx"
```

用 `which npx` 查你的实际路径。

### Q：首次启动很慢

第一次 npx 会从 GitHub 下载 + 装依赖（约 30 秒，30 MB）。之后就是缓存秒启。

## 八、相关

- [Claude Code 的装机文档（更简单）](install-claude-code.md)
- [Cursor 的装机文档](install-cursor.md)
