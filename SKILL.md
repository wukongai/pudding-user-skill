---
name: pudding-user-skill
version: 0.1.0
description: 布丁（aixiaoai.cloud）学员的对话式 AI 入口 — 通过自然语言查训练营进度 / 今日打卡 / 能力雷达，或提交打卡。当学员说"我的布丁训练营"/"帮我打卡"/"我的能力档"时使用。
homepage: https://github.com/wukongai/pudding-user-skill
trigger:
  - "布丁打卡" / "好奇猫打卡" / "我的训练营"
  - "我今天的任务" / "我连续多少天" / "今天该学什么"
  - "我的能力档" / "雷达图" / "哪个能力最弱"
  - "看下布丁通知" / "有人评论我了吗"
not_for:
  - 报名训练营 / 支付 / 改密码（涉及账户安全，本 skill 不开放）
  - 非布丁学员（需要先报名布丁训练营才能用）
  - 一般情绪倾诉 / 闲聊（不是布丁业务，请走通用对话）
---

# 布丁学员 Skill

## 认证

学员需要：
1. 在布丁注册账号并报名至少一个训练营（https://aixiaoai.cloud）
2. 生成专属 MCP token（v0.1 临时走 curl，Phase 3 上线后在 `/profile/ai-access` 一键生成）
3. 把 token 配到 AI 客户端 env 的 `PUDDING_MCP_TOKEN`

详见 [README.md § 获取你的认证字符串](README.md#-获取你的认证字符串token)。

## 6 个工具

| Tool | 用途 | 必填参数 |
|---|---|---|
| `get_my_camps` | 列我的训练营 + 进度% | — |
| `get_today_checkin` | 今日打卡状态 | — |
| `get_stage` | 关卡详情 + 任务列表 | `stageId` |
| `submit_checkin` | 提交打卡 | `stageId` / `difficulty` / `completedTaskIds[]` / `reflection` / `question` |
| `get_ability_radar` | 能力雷达 | — |
| `get_notifications` | 通知未读 + 最近列表 | — |

## 关键工作流（防 AI 误调）

### 学员说"帮我打卡"

不能直接调 `submit_checkin`，必须先：

1. `get_my_camps` 看学员有哪些营
2. 问学员"打哪一关" → `get_stage` 拿真实 tasks
3. 问学员选了哪些任务 + 哪个难度
4. 让学员写 reflection + question
5. 组装好才调 `submit_checkin`

否则 task ID 编造会被后端 400 拒绝。

### 学员问"今天该学什么"

先 `get_today_checkin` 看状态，**不要直接打卡**。学员可能只是想了解状态，不是要提交。

## 安全

- 本 skill 只调读端点 + 提交打卡，**不涉及支付 / 改密码 / 改账户信息**
- token 是学员可撤销的（去布丁主站撤销），不影响浏览器登录
- token 仅 endpoint 创建时一次性返回，列表 API 永不返回

## 反馈

GitHub Issues: https://github.com/wukongai/pudding-user-skill/issues
