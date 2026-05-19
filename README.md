# 🍮 pudding-user-skill — 让 Claude / Cursor 直接调你的布丁学习账号

> **布丁**（aixiaoai.cloud）的学员对话式入口：你在自己惯用的 AI 客户端（Claude Desktop / Cursor / Claude Code 等）配一次，之后所有"今天该学什么/连续多少天/帮我打卡/我的能力档"类问题，AI 自己调你的布丁账号回答。

## 🎯 这是什么

布丁有 2 个学员入口：**主站 H5**（aixiaoai.cloud）+ **微信小程序**。
本项目是**第三种入口** —— 通过 [MCP 协议](https://modelcontextprotocol.io/) 让 AI 客户端直接调布丁后端 REST API，学员用自然语言代替 UI 操作。

```
┌─────────────┐    MCP (stdio)    ┌────────────────────┐    HTTPS    ┌──────────────┐
│  Claude /   │ ←───────────────→ │  pudding-user-     │ ──────────→ │  布丁后端     │
│  Cursor 等  │                   │  skill (npx 启动)  │              │  /api/skill- │
└─────────────┘                   └────────────────────┘              │  public/*    │
                                          ↑                          └──────────────┘
                                          │
                                          token + apiUrl
                                          (学员从 /profile/ai-access 复制)
```

**学员的体验**：

- 「我今天该学什么？」→ AI 自动查你的训练营进度告诉你
- 「帮我提交今天的打卡，难度选 basic，完成了任务 1、2」→ AI 帮你打到布丁
- 「我哪个能力维度最弱？」→ AI 拉雷达图分析推荐继续学什么

## ⚡ 5 分钟装机（按客户端选一种）

| 客户端 | 文档 |
|---|---|
| **Claude Code（CC）** ⭐ 推荐 | [install-claude-code.md](docs/install-claude-code.md) |
| **Claude Desktop** | [install-claude-desktop.md](docs/install-claude-desktop.md) |
| **Cursor** | [install-cursor.md](docs/install-cursor.md) |

> **OpenClaude / 龙虾 / Coze / GPTs 装机文档**：留 v0.2 跟着 OpenAPI yaml 一起发布。

### 🌏 国内用户走 Gitee 镜像

GitHub 在国内访问不稳定时，把所有装机命令里的 GitHub URL 换成 Gitee 镜像：

```bash
# GitHub（国外速度快）
npx -y github:wukongai/pudding-user-skill

# Gitee 镜像（国内速度快，等价）
npx -y https://gitee.com/teacherai/pudding-user-skill.git
```

> ⚠️ `npx` 原生支持 `github:` 缩写，但**不支持 `gitee:` 缩写** — 用 Gitee 必须写完整 https URL。
>
> 镜像同步：Phase 4 会加 GitHub Action 自动同步。当前 v0.1 由维护者手动 `git push gitee master`，可能滞后几小时；通常版本号有变化前不影响装机体验。

## 🔑 获取你的认证字符串（token）

> ⚠️ Phase 3 完成前，学员管理 UI `/profile/ai-access` 还没上线。当前临时用 curl 走后端 API 生成。

1. 浏览器登录布丁 https://aixiaoai.cloud
2. 打开 DevTools → Application → Local Storage → 复制 `token`（这是 JWT）
3. 在终端跑：
   ```bash
   curl -X POST https://aixiaoai.cloud/api/mcp-endpoints \
     -H "Authorization: Bearer <你的 JWT>" \
     -H "Content-Type: application/json" \
     -d '{"label":"我的 Mac"}'
   ```
4. 返回的 `endpoint.token` 就是 MCP 用的 token（cuid 长字符串）。**复制保存** — 这个 token 只在创建时返回这一次。
5. （可选）也复制 `endpoint.mcpUrl` 备用

⏳ Phase 3 上线后，去布丁个人中心 → AI 接入 → 一键生成，免去 curl 步骤。

## 🛠 6 个能用的动作

| Tool | 作用 | 学员触发话术 |
|---|---|---|
| `get_my_camps` | 列我的训练营 + 进度% | "我的训练营" / "我现在到哪了" |
| `get_today_checkin` | 今日打卡状态 | "我今天打卡了吗" / "我连续多少天了" |
| `get_stage` | 关卡详情 + 任务列表 | "第 5 关讲什么" / "看下任务" |
| `submit_checkin` | 提交打卡 | "帮我打卡" / "把今天的反思打到第 3 关" |
| `get_ability_radar` | 能力雷达 | "我哪个能力最弱" |
| `get_notifications` | 通知未读数 + 最近列表 | "我有什么新消息" |

⚠️ **submit_checkin v1 极简版**：v1 只记录笔记 + 更新连续天数，**不算积分 / 不发勋章 / 不算关卡解锁**。学员下次浏览器内打卡时会一并补算。完整业务接入留 v2（布丁后端抽 `lib/checkin-service.js` 后实施）。

## 📦 返回数据形态（快速参考）

> 完整 JSON schema + 字段不变量见 [SKILL.md § 返回数据形态](SKILL.md#返回数据形态)。本节给关键 3 个 tool 的精简示例。

### `get_my_camps`

```json
{
  "camps": [
    {
      "id": "cm9xyz...",
      "name": "TA 沟通分析",
      "currentStage": 6,
      "totalStages": 10,
      "progress": 60,
      "streakDays": 7,
      "status": "ongoing"
    }
  ]
}
```

- `status` 枚举：`ongoing` / `graduated` / `markedForRevisit`
- `progress`：0-100 整数

### `get_stage`

```json
{
  "stage": {
    "id": "cm9stage...",
    "title": "第 6 关 · ...",
    "tasks": [
      { "id": "cm9task...", "title": "...", "type": "quiz", "difficulty": "basic" }
    ]
  }
}
```

- `tasks[].id` 是 cuid，**`submit_checkin.completedTaskIds` 必须从这里拿**
- `tasks[].difficulty` 枚举：`basic` / `intermediate` / `full`

### `submit_checkin`

```json
{
  "checkin": { "id": "...", "createdAt": "2026-05-18T10:30:00.000Z" },
  "streakDays": 8,
  "_v1_note": "本次只记录笔记 + 更新连续天数..."
}
```

## 🚨 常见错误排查

> 完整错误码表 + AI 应答模板见 [SKILL.md § 常见错误处理](SKILL.md#常见错误处理)。本节给学员装机/使用时最常见的 4 种情况。

### MCP 列表显示 `pudding: failed`

启动失败，原因通常是 `PUDDING_MCP_TOKEN` 没配或配错。

**自助排查**：

1. 看 AI 客户端 MCP 日志，搜 `Missing required env: PUDDING_MCP_TOKEN` — 没配 token
2. 看日志有没有 `401 / MCP 认证字符串无效` — token 撤销或失效，重新生成
3. 看 `PUDDING_API_URL` 是不是 `https://aixiaoai.cloud`（默认就是，一般不动）

### AI 回复"你的布丁 AI 入口好像失效了"

后端返回 HTTP 401。原因：token 在主站被撤销 / 过期。

**自助修复**：

1. 去 https://aixiaoai.cloud 个人中心 → AI 接入 → 撤销旧的 endpoint
2. 重新生成新 endpoint 拿新 token
3. 更新 AI 客户端 env 里的 `PUDDING_MCP_TOKEN` → 重启客户端

### AI 回复"打卡提交被布丁拒绝了，原因 ..."

后端返回 HTTP 400。原因：通常是 AI 编造了 task ID 或漏填 reflection / question。

**自助修复**：让 AI 重新走"打卡严格前置流程"——先 `get_my_camps` → 选营 → `get_stage` 拿真实 task → 你勾选 → 再调 `submit_checkin`。

### AI 回复"今天的调用次数到上限了"

后端返回 HTTP 429。该 endpoint 当天调用超过 dailyLimit（默认 500 次/天）。

**自助修复**：

- 等到第二天 0 点自动重置
- 或去主站升级 endpoint 的 dailyLimit 配额

## 💡 为什么做这个（设计决策摘要）

- **两套鉴权物理隔离**：MCP token 走专门的 `UserMcpEndpoint` 表 + `mcpEndpointMiddleware`，与浏览器 JWT 完全分离。学员撤销 MCP 入口不影响浏览器登录态，反之亦然。
- **stdio over HTTP/SSE**：v1 选 stdio 模式 = MCP server 跑学员本地，零基础设施成本（不用 nginx SSE 配置 / 不用长连接进程）。v2 再加远程 HTTP 模式。
- **Tool description 防 AI 误调**：每个 tool 的 description 写清"什么时候用 / 什么时候别用 / 严格前置流程"，避免 AI 把"聊天叨叨"识别成"帮我打卡"。
- **GitHub URL 直装（不上 npm）**：避免包名占用 + 学员升级无 npm 缓存阻力 + 不需要 npm 账号审核。

完整决策记录见 [布丁主仓 design 文档](https://github.com/wukongai/zhixing-game/blob/master/docs/superpowers/specs/2026-05-15-学员侧Skill-MCP第三入口-spec.md)。

## 🧪 本地开发

```bash
git clone https://github.com/wukongai/pudding-user-skill.git
cd pudding-user-skill
npm install
npm test                # 30 case 全过
PUDDING_MCP_TOKEN=fake PUDDING_API_URL=http://localhost:4001 npm start
```

## 🤝 反馈 & Issue

- 装机问题、tool 描述优化建议 → [GitHub Issues](https://github.com/wukongai/pudding-user-skill/issues)
- 布丁主站 bug / 新功能需求 → [布丁主仓](https://github.com/wukongai/zhixing-game/issues)

## 📜 License

[MIT](LICENSE)

## 🔗 相关

- [布丁主站](https://aixiaoai.cloud)
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
