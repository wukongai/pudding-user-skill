---
name: pudding-user-skill
version: 0.2.0
description: 布丁（aixiaoai.cloud）学员的对话式 AI 入口 — 通过 MCP 协议让 AI 客户端直接调学员的真实学习账号，回答训练营进度 / 关卡详情 / 今日打卡 / 能力雷达 / 通知，或代学员提交打卡。当学员说"我的布丁训练营"、"我报了哪些营"、"我的进度"、"我现在到哪了"、"今天该学什么"、"我今天打卡了吗"、"我连续多少天了"、"打哪一关"、"第 N 关讲什么"、"看下任务"、"帮我打卡"、"提交今天的反思"、"今天的反思打到第 X 关"、"我的能力档"、"雷达图"、"我哪个能力最弱"、"我适合继续学什么营"、"我有什么新消息"、"看下通知"、"有人评论我了吗"、"有没有公告" 时使用。即使学员只说"我的学习状态"、"今天的学习"、"看下布丁"，且上下文是布丁训练营 / 学习心理学 / TA 沟通分析 / 好奇猫 领域，也应触发本 Skill。**不要 undertrigger**——学员问自己的学习状态而你不调本 Skill，就是把"我不知道"或者训练数据脑补当作学员真实数据，对学员有害。学员真实数据只有调本 skill 才能拿到，**不要假设、不要猜测、不要凭对话历史推断**——任何关于学员训练营、关卡、积分、连续天数、能力维度的问题都必须先调对应 tool 拿事实。
homepage: https://github.com/wukongai/pudding-user-skill
trigger:
  - "布丁打卡" / "好奇猫打卡" / "布丁学习" / "好奇猫学习"
  - "我的训练营" / "我报了哪些营" / "我现在到哪了" / "我的进度"
  - "今天该学什么" / "我今天打卡了吗" / "我连续多少天了" / "我今天的任务"
  - "第 N 关讲什么" / "打开关卡 X" / "看下任务" / "这关有什么"
  - "帮我打卡" / "提交打卡" / "今天的反思打到第 X 关"
  - "我的能力档" / "雷达图" / "哪个能力最弱" / "我适合继续学什么营"
  - "看下布丁通知" / "有人评论我了吗" / "我有什么新消息" / "有没有公告"
not_for:
  - 报名训练营 / 支付 / 改密码（涉及账户安全，本 skill 不开放）
  - 非布丁学员（需要先报名布丁训练营才能用）
  - 一般情绪倾诉 / 闲聊（不是布丁业务，请走通用对话）
---

# 布丁学员 Skill

让 AI 客户端用最自然的中文话术拿到学员在布丁（aixiaoai.cloud）的真实学习账号数据，不需要打开浏览器。SKILL.md + MCP server 标准格式，跨 Claude Desktop / Cursor / Claude Code / 任何兼容 MCP 的客户端可用。

线上：https://aixiaoai.cloud（学员需先注册并报名至少一个训练营）

## 先决条件：必须配 PUDDING_MCP_TOKEN

本 Skill 通过 MCP 协议调布丁后端 REST API，**所有调用都需要学员的专属 token**。两套鉴权物理隔离：MCP token 走专门的 `UserMcpEndpoint` 表，与浏览器 JWT 完全分离。撤销 MCP token **不影响**学员的浏览器登录态，反之亦然。

### 没配 token 会怎样

启动 MCP server 时 `config.js` 会立即抛错：

```
Error: Missing required env: PUDDING_MCP_TOKEN
```

AI 客户端（Claude Desktop / Cursor / Claude Code）的 MCP 列表里会看到 `pudding` 状态是 `failed` 而不是 `connected`，调任何 tool 都会立即报错。

### 怎么拿 token

1. 浏览器登录布丁 https://aixiaoai.cloud
2. （Phase 3 上线后）个人中心 → AI 接入 → 一键生成 token
3. （Phase 3 上线前临时方案）从浏览器 localStorage 取 JWT → curl 调 `POST /api/mcp-endpoints` → 返回 `endpoint.token`

详见 [README § 获取你的认证字符串](README.md#-获取你的认证字符串token)。

### 怎么撤销 token

去布丁主站个人中心 → AI 接入 → 找对应 endpoint → 撤销。撤销后该 token 立即失效，已配该 token 的 AI 客户端调任何 tool 会撞 HTTP 401（见下方"常见错误处理"）。

## 什么时候用

| 学员在说 | 应该走的 tool |
|---|---|
| "我的训练营"、"我报了哪些营"、"我现在到哪了"、"我的进度" | `get_my_camps`（列学员所有营 + 进度） |
| "我今天打卡了吗"、"我连续多少天了"、"今天还有什么任务" | `get_today_checkin`（今日打卡状态聚合） |
| "今天该学什么"、"我的学习状态" | `get_my_camps` + `get_today_checkin`（先看营 + 状态，再让学员决定动作） |
| "第 N 关讲什么"、"看下任务"、"打开关卡 X" | `get_stage`（拿关卡 + 任务清单） |
| "帮我打卡"、"提交今天的反思打到第 X 关" | 严格前置流程 → 最后调 `submit_checkin` |
| "我的能力档"、"雷达图"、"哪个能力最弱"、"我适合继续学什么营" | `get_ability_radar`（拿 6 能力大类 energy 值） |
| "我有什么新消息"、"看下通知"、"有人评论我了吗"、"有没有公告" | `get_notifications`（未读数 + 最近列表） |

通用启发：**学员问的是"我真实的学习账号事实"，不要凭训练数据脑补，永远走 tool**。即使你"觉得"知道答案（比如学员之前在对话里提过自己学了 5 天），也要查一遍——学员当前状态只有调 tool 才能拿到。

## 6 个工具速览 + 跨工具编舞

| Tool | 用途 | 必填参数 | 链路前置 |
|---|---|---|---|
| `get_my_camps` | 列学员训练营 + 进度 | — | 无（顶层入口） |
| `get_today_checkin` | 今日打卡状态 | — | 可选 `campId`（从 `get_my_camps` 拿） |
| `get_stage` | 关卡详情 + 任务列表 | `stageId` | 通常从 `get_my_camps` 拿 currentStage → 业务上下文里的 stageId |
| `submit_checkin` | 提交打卡（v1 极简版） | `stageId` / `difficulty` / `completedTaskIds[]` / `reflection` / `question` | **强制**先调 `get_stage` 拿真实 task.id |
| `get_ability_radar` | 能力雷达图数据 | — | 无 |
| `get_notifications` | 通知未读 + 最近列表 | — | 无 |

### 跨工具典型编舞

**场景 1：学员说"帮我打卡"**

```
1. get_my_camps          → 列出学员有哪些营
2. 问学员"打哪一关" → 学员回答
3. get_stage(stageId)    → 拿真实 task.id 数组 + 难度档候选
4. 问学员"完成了哪些任务" + "选哪个难度"
5. 让学员写 reflection（今日感想）+ question（疑问）
6. submit_checkin(...)   → 提交
```

**禁止跳过 1-5 直接调 6**——task.id 编造会被后端 400 拒绝。

**场景 2：学员说"今天该学什么"**

```
1. get_my_camps          → 看学员在哪些营
2. get_today_checkin     → 看今天哪些营还没打卡
3. （可选）get_stage      → 把当前关的任务列出来给学员
```

**不要直接调 `submit_checkin`**——学员只是问状态，没说要提交。

**场景 3：学员说"我哪个能力最弱"**

```
1. get_ability_radar     → 拿 6 个能力大类的 energy 值
2. 分析最低的 1-2 个能力
3. （可选）get_my_camps   → 看哪些营覆盖这些弱能力，给学员推荐学习方向
```

## 关键工作流（防 AI 误调）

### 学员说"帮我打卡"

严格按 **场景 1** 流程跑。每一步都要让学员真正参与，**不要替学员**做以下决定：

- **不要替学员选**完成了哪些任务（必须问学员勾选）
- **不要替学员选**难度档（basic / intermediate / full，必须学员明确说）
- **不要替学员写** reflection 和 question（学员真实的思考才有意义）

### 学员说"今天该学什么"

先 `get_today_checkin` 看状态，**不要直接打卡**。学员可能只是想了解状态，不是要提交。

### 学员说"我的学习状态"（边界场景）

这是触发面边界场景——学员表达模糊。**应该触发本 skill**，调 `get_my_camps` + `get_today_checkin` 给出综合简报，让学员决定下一步。**不要 undertrigger**（误判为闲聊不调 skill）。

### 学员说"我心情不好 / 学不下去 / 想放弃"

这是情绪倾诉，**不要调任何 tool**。切到通用对话模式，倾听 + 共情。如果学员后续说"算了我还是看看进度"才调 skill。

## 返回数据形态

> ⚠️ 下面是 tool 返回的 JSON 结构示例（给 AI 解析用），**不是给学员看的最终展示**。展示给学员的格式见下方"给学员的输出格式"章节。

### `get_my_camps` 返回

```json
{
  "camps": [
    {
      "id": "cm9xyz123abc456def789ghi0",
      "name": "TA 沟通分析",
      "systemId": "cm8abc...",
      "systemName": "心理基础",
      "currentStage": 6,
      "totalStages": 10,
      "progress": 60,
      "streakDays": 7,
      "status": "ongoing",
      "joinedAt": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

字段不变量：
- 必有：`id` / `name` / `currentStage` / `totalStages` / `progress` / `streakDays` / `status`
- 可空：`systemName` / `joinedAt`
- `status` 枚举：`ongoing`（进行中）/ `graduated`（已毕业）/ `markedForRevisit`（标记复盘）
- `progress`：0-100 整数
- `id` / `systemId`：cuid 25 字符字符串
- 学员没报营时返回 `{ camps: [], hint: "请先去布丁主站报名训练营" }`

### `get_today_checkin` 返回

```json
{
  "checkedInToday": true,
  "todayCount": 2,
  "totalPoints": 1280,
  "longestStreak": 14,
  "lastCheckinAt": "2026-05-18T01:48:00.000Z",
  "campBreakdown": [
    { "campId": "cm9...", "campName": "TA 沟通分析", "checkedIn": true, "streakDays": 7 }
  ]
}
```

字段不变量：
- 必有：`checkedInToday`（boolean）/ `todayCount` / `totalPoints` / `longestStreak`
- 可空：`lastCheckinAt`（学员从未打过卡时为 null）
- 不传 `campId` 跨所有营聚合；传 `campId` 仅返回该营的状态

### `get_stage` 返回

```json
{
  "stage": {
    "id": "cm9stage123...",
    "title": "第 6 关 · 为什么你宁愿被骂也不愿被无视",
    "subtitle": "安抚饥渴",
    "harvests": ["认识安抚的 6 种形式", "..."],
    "cognitiveGoals": ["理解负面安抚优于零安抚的心理机制"],
    "applicationGoals": ["在 1 周内觉察自己 3 次安抚饥渴情境"],
    "tasks": [
      {
        "id": "cm9task123...",
        "title": "完成 5 题安抚识别小测",
        "type": "quiz",
        "difficulty": "basic"
      }
    ]
  }
}
```

字段不变量：
- `tasks[].id`：cuid，**submit_checkin 的 completedTaskIds 必须从这里拿**
- `tasks[].difficulty` 枚举：`basic` / `intermediate` / `full`
- `tasks[].type` 枚举（按实际后端实现）：`quiz` / `reading` / `practice` / `reflection` 等
- `harvests` / `cognitiveGoals` / `applicationGoals` 是字符串数组

### `submit_checkin` 返回

```json
{
  "checkin": {
    "id": "cm9checkin...",
    "stageId": "cm9stage...",
    "difficulty": "intermediate",
    "completedTaskIds": ["cm9task..."],
    "createdAt": "2026-05-18T10:30:00.000Z"
  },
  "streakDays": 8,
  "_v1_note": "本次只记录笔记 + 更新连续天数。积分 / 勋章 / 关卡解锁在下次浏览器内打卡时一并刷新。"
}
```

字段不变量：
- `streakDays`：本次打卡后的连续天数
- v1 极简版**不返回**积分增量 / 勋章 / 关卡解锁信息

### `get_ability_radar` 返回

```json
{
  "radar": [
    {
      "campId": "cm9...",
      "campName": "TA 沟通分析",
      "abilities": [
        { "name": "觉察力", "energy": 78 },
        { "name": "表达力", "energy": 65 },
        { "name": "共情力", "energy": 82 },
        { "name": "边界感", "energy": 54 },
        { "name": "决策力", "energy": 60 },
        { "name": "复盘力", "energy": 71 }
      ]
    }
  ]
}
```

字段不变量：
- `radar[]` 按训练营分组
- `abilities[].energy`：0-100 数字，越大表示越强
- 6 个能力大类（具体名称按学员实际营的能力体系，可能略不同）

### `get_notifications` 返回

```json
{
  "unreadCount": 3,
  "recent": [
    {
      "id": "cm9notif...",
      "type": "comment",
      "title": "助教在你的打卡下留言",
      "content": "...",
      "url": "https://aixiaoai.cloud/checkin/...",
      "isRead": false,
      "createdAt": "2026-05-18T08:30:00.000Z"
    }
  ]
}
```

字段不变量：
- `recent[]` 按 createdAt 倒序，长度 ≤ `limit` 参数（默认 5，最大 20）
- `recent[].type` 常见值：`comment`（评论）/ `announcement`（公告）/ `system`（系统通知）

## 给学员的输出格式

> ⚠️ **核心原则**：tool 返回的 JSON 是给 AI 解析用的，**不是给学员看的最终内容**。AI 必须按下面格式重新组织成学员能直接看懂的中文简报。任何 raw 字段名 / cuid 字符串 / 端点路径都不能出现在给学员的回复里。

### `get_my_camps` 返回 → 展示给学员

```markdown
📚 你的训练营（共 N 个）

1. **TA 沟通分析** · 第 6/10 关 · 60%
   连续打卡 7 天 · 进行中

2. **正念基础** · 第 3/8 关 · 38%
   连续打卡 2 天 · 进行中

3. **边界感训练** · 已毕业 🎓
```

**status 转人话表**：

| 内部值 | 展示给学员 |
|---|---|
| `ongoing` | "进行中" |
| `graduated` | "已毕业 🎓" |
| `markedForRevisit` | "标记复盘 🔁" |

### `get_today_checkin` 返回 → 展示给学员

已打卡：

```markdown
✅ 今日已打卡（2 个营，共 1 次）
- TA 沟通分析：连续 7 天
- 上次打卡：今天上午 09:48
```

未打卡：

```markdown
⚠️ 今天还没打卡
- TA 沟通分析：连续 7 天（昨日打过）
- 正念基础：连续 2 天（昨日打过）

要继续打卡吗？我可以帮你提交。
```

### `get_stage` 返回 → 展示给学员

不要把 raw JSON 全甩给学员。**按学员意图分流**：

**学员问"这关讲什么" / "第 6 关讲什么"**：

```markdown
**第 6 关 · 为什么你宁愿被骂也不愿被无视**
> 副标题：安抚饥渴

🎯 收获
- 认识安抚的 6 种形式
- ...

🧠 认知目标
- 理解负面安抚优于零安抚的心理机制

🛠 应用目标
- 在 1 周内觉察自己 3 次安抚饥渴情境
```

**学员要打卡** → 展示任务清单让学员勾选：

```markdown
本关共 N 个任务，你完成了哪些？

1. 完成 5 题安抚识别小测（basic）
2. 写一段"我被忽视时的感受"（intermediate）
3. ...

回复完成的编号 + 选难度档（basic / intermediate / full）
```

### `submit_checkin` 返回 → 展示给学员

```markdown
🎉 打卡完成！

- 关卡：第 6 关 · 为什么你宁愿被骂也不愿被无视
- 难度：进阶（intermediate）
- 完成任务：3 个
- 连续天数：8 天 🔥

⚠️ v1 限制提示：本次只记录笔记 + 更新连续天数。
积分 / 勋章 / 关卡解锁会在你下次浏览器内打卡时一并刷新。
```

### `get_ability_radar` 返回 → 展示给学员

```markdown
🕸 你的能力雷达（TA 沟通分析）

- 觉察力 ████████░░ 78
- 表达力 ██████░░░░ 65
- 共情力 ████████░░ 82  ← 你的强项
- 边界感 █████░░░░░ 54  ← 最弱
- 决策力 ██████░░░░ 60
- 复盘力 ███████░░░ 71

💡 建议：边界感最弱，可以考虑学"边界感训练"营或在当前营关注边界相关任务。
```

### `get_notifications` 返回 → 展示给学员

```markdown
🔔 你有 3 条未读消息

1. **助教在你的打卡下留言**（今天上午 08:30）
   "你这次的反思很到位..."
   👉 https://aixiaoai.cloud/checkin/...

2. ...
```

### 时间转人话

`lastCheckinAt` / `createdAt` 等 ISO 8601 时间戳，**必须**转成北京时间 + 学员能扫读的相对/绝对时间：

| 内部值 | 展示给学员 |
|---|---|
| `2026-05-18T01:48:00.000Z` | "今天上午 09:48" / "2 小时前" |
| `2026-05-17T18:08:17.000Z` | "今天凌晨 02:08" / "10 小时前" |
| `2026-05-16T16:43:00.000Z` | "5/17 00:43" / "昨天" |

**不要**直接展示 ISO 字符串——学员看不懂。

### 副标题／元信息只写人话

**OK**（学员能直接懂）：

- "今日已打卡，连续 7 天"
- "你在'TA 沟通分析'营 第 6/10 关"
- "本周还有 3 关待打卡"
- "你的能力雷达数据更新于今天上午"

**不 OK**（基础设施泄漏，**禁止**写到给学员的回复里）：

- ❌ raw 字段名：`streakDays: 7` / `status: "ongoing"` / `progress: 60`
- ❌ 端点路径：`/api/skill-public/my-camps`
- ❌ 鉴权细节：token / endpoint id / mcpUrl / `PUDDING_MCP_TOKEN`
- ❌ HTTP 状态码 / API 错误码 / 限流参数
- ❌ 任何 cuid 字符串（task.id / stage.id / camp.id）——学员视角无意义

## 常见错误处理

### HTTP 401 — token 无效 / 已撤销 / 已过期

后端返回 `{ "error": "MCP 认证字符串无效" }` / `"MCP 入口已撤销"` / `"MCP 入口已过期"`。

**学员侧友好提示**（**必须**这样说，**不要**抛 raw 错误）：

> 你的布丁 AI 入口好像失效了。请去布丁主站 https://aixiaoai.cloud 个人中心 → AI 接入 → 重新生成 token，然后用新 token 重新配置你的 AI 客户端（参考装机文档）。

### HTTP 400 — 字段校验失败

通常出现在 `submit_checkin`。例如 `completedTaskIds` 含编造的 ID、`difficulty` 不是合法枚举值、`reflection` / `question` 为空字符串。

**学员侧友好提示**：

> 打卡提交被布丁拒绝了，原因：<把后端 error 翻译成学员能懂的话，比如"任务编号不对，可能是我记错了">。让我们重新走一遍：先调 `get_stage` 拿任务列表，你勾选完成的任务，再写反思和疑问。

**禁止**：直接说"backend returned 400: invalid completedTaskIds[2]"——学员看不懂。

### HTTP 403 — 该 token 未授权访问目标关卡 / 营

学员尝试看自己没报名的营 / 关卡。

**学员侧友好提示**：

> 这个关卡看起来不属于你报名的训练营。可以让我列一下你的训练营吗？我用 get_my_camps 看下。

### HTTP 429 — 限流

后端按 `dailyLimit` 限制（默认每个 endpoint 每天 500 次调用）。

**学员侧友好提示**：

> 今天的调用次数到上限了。明天 0 点会重置，或者去布丁主站升级你的 AI 入口配额。

### HTTP 5xx / 网络错误

**学员侧友好提示**：

> 布丁后端暂时不可用，请稍后重试。如果持续不行，可以去主站 https://aixiaoai.cloud 直接操作。

## 不要做（AI 调用 tool 时的禁约）

- ❌ **不要**在学员明确说"打卡 / 提交 / 打到 X 关"前主动调 `submit_checkin` — 学员可能只是聊学习心得，不是要提交
- ❌ **不要**凭空捏造 `task.id` / `stage.id` / `camp.id` — 必须从 `get_my_camps` / `get_stage` 返回的真实 ID 拿
- ❌ **不要**把后端 raw error 直接抛给学员 — 必须按上方"常见错误处理"章节翻译成学员能懂的话
- ❌ **不要**把 cuid（25 字符的 ID 字符串）展示给学员 — 学员看到只会困惑
- ❌ **不要**假设学员当前在哪个营 / 第几关 / 连续多少天 — 必须先调对应 tool 拿事实，不要凭对话历史推断
- ❌ **不要**替学员选难度 / 任务 / 写反思和疑问 — 这些是学员的真实学习决策，AI 不能代做
- ❌ **不要**频繁调 `get_today_checkin` — 当天状态短时间不会变，缓存上次结果即可
- ❌ **不要**把 `PUDDING_MCP_TOKEN` / `mcpUrl` / endpoint id 等鉴权细节出现在给学员的回复里
- ❌ **不要**在学员只是闲聊 / 倾诉情绪时调任何 tool — 切到通用对话模式即可
- ❌ **不要**调任何工具来"测试"或"探索" — 每次调用都消耗学员的真实数据 + dailyLimit 配额
- ❌ **不要**把 raw JSON 直接抛给学员 — 必须按"给学员的输出格式"章节重新组织成中文简报

## 安全

- 本 skill 只调读端点 + 提交打卡，**不涉及支付 / 改密码 / 改账户信息**（这些走主站 UI）
- token 是学员可撤销的（去布丁主站撤销），不影响浏览器登录
- token 仅在 endpoint 创建时一次性返回，列表 API 永不返回
- MCP token 与浏览器 JWT 物理隔离（不同表 + 不同中间件），互不影响

## 反馈

GitHub Issues: https://github.com/wukongai/pudding-user-skill/issues
