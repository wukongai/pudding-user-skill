# Claude Code 装机指南

> 适用客户端：[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)（命令行 `claude` 工具）
> 时长：3 分钟

## 一、装 Claude Code

如果还没装：
```bash
npm install -g @anthropic-ai/claude-code
claude auth login
```

## 二、拿 token（一次性，5 分钟）

参考 [README § 获取你的认证字符串](../README.md#-获取你的认证字符串token)。

执行完你应该有一串形如 `cl9xyz...` 的长字符串（cuid 25 字符）。

## 三、添加 MCP server

一行命令搞定：

```bash
# 国外（推荐，速度快）
claude mcp add pudding \
  --env PUDDING_API_URL=https://aixiaoai.cloud \
  --env PUDDING_MCP_TOKEN=<把第二步拿到的 token 粘贴这里> \
  -- npx -y github:wukongai/pudding-user-skill

# 国内（GitHub 不稳时走 Gitee 镜像，等价）
claude mcp add pudding \
  --env PUDDING_API_URL=https://aixiaoai.cloud \
  --env PUDDING_MCP_TOKEN=<把第二步拿到的 token 粘贴这里> \
  -- npx -y https://gitee.com/teacherai/pudding-user-skill.git
```

> 说明：
> - `claude mcp add` 会自动写到 `~/.claude/mcp.json` 或项目 `.claude/settings.json`（看你在哪跑的）
> - `npx -y github:wukongai/pudding-user-skill` = 不走 npm registry，直接从 GitHub URL clone + 跑（首次会缓存约 30 MB）
> - 后续升级跑 `npx -y github:wukongai/pudding-user-skill@latest` 或删 npm 缓存（`rm -rf ~/.npm/_npx/`）

## 四、验证

```bash
claude mcp list
```

应该看到 `pudding` 在列表里且状态是 `connected`。

打开新会话试：

```
我的布丁训练营有哪些？
```

Claude 应该会自动调 `get_my_camps` 工具并把结果按自然语言告诉你。

## 五、常见问题

### Q：报 `缺少 PUDDING_MCP_TOKEN` 错

`claude mcp add` 时 `--env` 的值带空格 / 引号？重跑一次确认。或者直接编辑 `~/.claude/mcp.json` 把 token 填对。

### Q：报 `布丁认证失败`

token 失效。重新走「拿 token」流程，把新 token 用 `claude mcp remove pudding` 后重新 `add`。

### Q：Claude 不主动调工具

可能是 `description` 没让模型识别到。可以在对话里明确说"用 pudding 的 get_my_camps 查一下"，模型会更稳。

### Q：想撤销某台机器的 token

去布丁主站浏览器：
```bash
# 列出你所有 endpoint
curl -H "Authorization: Bearer <你的 JWT>" https://aixiaoai.cloud/api/mcp-endpoints

# 撤销指定 endpoint（id 从上一步拿）
curl -X POST -H "Authorization: Bearer <你的 JWT>" \
  https://aixiaoai.cloud/api/mcp-endpoints/<endpoint-id>/revoke
```

Phase 3 上线后会有 UI 一键撤销。

## 六、相关

- [其他 AI 工具的装机文档](../README.md#-5-分钟装机按客户端选一种)
- [6 个工具详细说明](../SKILL.md#6-个工具)
