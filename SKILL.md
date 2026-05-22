---
name: pudding-user-skill
description: 布丁(好奇猫)学员的对话式 AI 入口 — 让 Claude / Cursor / 通义千问 等 AI 客户端通过自然语言直接调你的布丁学习账号(查营进度 / 今日打卡 / 提交打卡 / 能力雷达 / 关卡详情 / 通知 / 成长路径 / 教练洞察)。v2.0.0 按微信读书 skill 标准重写:统一网关 + Envelope 响应 + 字段语义层 + 版本协商 + 三端深度链接
version: 2.0.0
trigger:
  - "布丁打卡" / "好奇猫打卡" / "我的训练营"
  - "今天该学什么" / "我今天有什么任务"
  - "我的能力档" / "雷达图" / "教练建议"
  - "我的学习进度" / "我学到第几关了"
  - "成长路径" / "毕业路径"
  - "我有什么通知" / "老师回复了吗"
not_for:
  - 报名训练营 / 支付 / 改密码(涉及账户安全,不开放)
  - 非布丁学员(需要先报名布丁训练营才能用)
  - 替学员决定打卡难度 / 完成任务 / 写反思(必须学员自己说)
---

# 布丁(好奇猫)学员 Skill v2.0.0

通过 MCP 协议连接布丁学员账号,在 Claude Desktop / Cursor / 龙虾 等 AI 客户端里**对话式**完成学习管理动作。

学员获取专属 token:
1. 登录 https://aixiaoai.cloud
2. 个人中心 → AI 接入 → 一键生成
3. 配置到 AI 客户端 env 的 `PUDDING_MCP_TOKEN`

---

## 1. 接口调用规范

### 1.1 统一入口

```
POST https://aixiaoai.cloud/api/skill/gateway
```

**所有 10 个能力都走这一个 URL**,通过 body 里的 `api_name` 字段路由到不同后端 handler。

### 1.2 鉴权

- Header:`Authorization: Bearer $PUDDING_MCP_TOKEN`
- Token 来源:学员在 https://aixiaoai.cloud/profile/ai-access 生成
- Token 绑定学员身份(userId),后端自动注入,业务调用**不需要再传学员 ID**

### 1.3 请求格式

- **Method**:POST
- **Content-Type**:application/json
- **Body**:JSON,`api_name` 指定接口,**业务参数平铺**在 body 顶层,**每次请求必须带 `skill_version`**

```bash
curl -X POST "https://aixiaoai.cloud/api/skill/gateway" \
  -H "Authorization: Bearer pud-xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"api_name": "student.stage.summary", "skill_version": "2.0.0", "stage_id": "clx0abc123"}'
```

### 1.4 请求 few-shot

**正确:业务参数平铺在 body 顶层**

```json
{"api_name":"student.camps.list","skill_version":"2.0.0"}
{"api_name":"student.stage.summary","skill_version":"2.0.0","stage_id":"st1"}
{"api_name":"student.notifications.list","skill_version":"2.0.0","limit":10}
```

**错误:不要把业务参数包在 `params` 内**

```json
{"api_name":"student.stage.summary","params":{"stage_id":"st1"},"skill_version":"2.0.0"}
```

上面的错误写法会导致 `stage_id` 未被网关读取,响应 `errcode: 40004`。

### 1.5 响应 Envelope 格式

**所有响应都 HTTP 200**,通过 `errcode` 区分成功/错误(对齐 weread 风格)。

```json
{
  "data": { /* 业务数据,errcode === 0 时非 null */ },
  "meta": {
    "skill_version": "2.0.0",
    "tier": "free" | "paid" | "vip",
    "request_id": "req_xxx",
    "upgrade_info": {
      "required": true,
      "min_version": "2.0.0",
      "message": "客户端版本过低...",
      "install_hint": "npx -y pudding-user-skill@latest"
    }
  },
  "links": {
    "self_web": "https://aixiaoai.cloud/stages/xxx?ref=skill",
    "self_wechat": null,
    "self_app": null
  },
  "errcode": 0,
  "errmsg": ""
}
```

错误响应:`data: null`,`errcode != 0`,`errmsg` 含中文提示。

---

## 2. 通用规则(11 条,**全部强制**)

### 规则 1:版本上报(每次必带)

每次请求 body 必须包含 `"skill_version": "2.0.0"`(取本文件顶部 version 字段的值),用于服务端检查版本更新。

**如果回包 `meta.upgrade_info.required === true`,必须立即暂停当前操作**,按 `meta.upgrade_info.message` 中的指引完成升级(`npx -y pudding-user-skill@latest`),升级完成后再重新执行用户请求,不得忽略该字段。

### 规则 2:参数平铺

业务参数必须和 `api_name`、`skill_version` 放在同一层;不要包在 `params`、`data`、`body` 等对象里。

### 规则 3:文档预检

调用任何接口前,必须先查本 SKILL.md「§5 工具详细说明」对应章节,确认:
- 接口参数与必填规则
- 返回字段含义(以 §6 字段语义对照表为准)
- 调用前置条件(如 `student.checkin.submit` 必须先调 `student.stage.content` 拿 task_id)
- 业务口径(单位 / 计算方式 / 边界场景)

**禁止仅凭字段名或经验猜测含义**。

### 规则 4:字段解释优先级(**最重要**)

解释接口回包时,**必须以 §6 字段语义对照表为准**;如果回包字段名和直觉含义冲突,**必须服从说明文件,不得直接翻译字段名**。

举例:
- 字段名 `streak_days` → 直译"连续天数"会让学员误解为"历史最长";**正确语义**是"当前营连续打卡天数",**不是跨营汇总**,**不是历史最长**
- 字段名 `energy` → 直译"能量"模糊不清;**正确语义**是"该能力维度的能量累计值(整数 0+),**不是百分比**"
- 字段名 `max_streak_days` → 直译"最长连续天数",**实际语义**取决于是否传 `camp_id`:传了是单营当前连续;不传是跨营当前连续的最大值(**不是历史最长**)

### 规则 5:bookId 等价规则(布丁版:stage_id / camp_id)

学员说"我在 X 关"(用人类描述)时,先调 `student.camps.list` 获取 `current_stage` 对应的 stage 序号,再用 `student.stage.summary({stage_id: ...})` 拿到具体 stage_id 后再操作。

**禁止凭空捏造 stage_id / camp_id**(都是 cuid 技术 ID,后端会校验)。

### 规则 6:cuid 不展示给学员

后端字段 `stage_id` / `camp_id` / `enrollment_id` / `system_id` / `task_id` / `notification_id` / `checkin_id` 都是 cuid(技术 ID,形如 `clx0abc123def456`)。

**展示给学员时**:
- 用 `title` / `camp_name` / `name`(人类可读名)
- **禁止把 cuid 当作"编号"展示给学员**(学员不需要看)
- 学员选择某项时让学员用名字 + 序号(如"第 1 个营"/"第 5 关"),不要让学员复制粘贴 cuid

### 规则 7:结果展示规范

- 列表用编号展示,方便学员通过数字选择(如"1. 沟通心理营 进度 50%")
- 状态字段做中文化:`ongoing → 进行中` / `graduated → 已毕业` / `marked_for_revisit → 标记重学` / `basic → 基础` / `intermediate → 进阶` / `full → 完整`
- **每次响应必须附上 `links.self_web`** 作为"查看详情"链接(规则 9 强制)
- 长内容截取前 200 字 + "..."

### 规则 8:上下文衔接

对话中记住已查询的 `stage_id` / `camp_id`,后续操作无需让学员重复提供。例:
- 学员问"第 5 关有哪些任务" → 你已经从 `student.stage.summary` 拿到 stage_id
- 学员接着说"提交打卡" → **直接用刚才的 stage_id**,不要再问

### 规则 9:深度链接强制

在展示任何业务数据时,**必须**拼接 `links.self_web` 作为"查看详情"链接,格式:
```
🔗 详情:{links.self_web}
```
该链接是 https 全路径,在微信内自动打开小程序(待小程序上线),在 App 内拦截路由(待 App 上线),在普通浏览器打开 H5。

**禁止只输出 data 不输出链接**(违反此规则会让学员脱离布丁主站,直接影响产品留存)。

### 规则 10:数据展示规范(单位 / 格式)

- **时间戳(`created_at` 等 Unix 秒)**:展示时必须转 `YYYY-MM-DD` 格式(如 `1716278400 → 2024-05-21`),**禁止直接展示原始数字**
- **日期字符串(`last_checkin_at` 等 `YYYY-MM-DD`)**:直接展示
- **百分比字段(`progress_pct`)**:必须带 `%` 号(如 `progress_pct=50 → 50%`,不是 0.5)
- **积分 / 能量值(`total_points` / `energy`)**:整数,不带单位
- **天数字段(`streak_days` / `max_streak_days` / `new_streak_days`)**:整数 + "天"(如 `7 → 7 天`)

### 规则 11:不要做清单(参考 §8)

写动作(`student.checkin.submit`)前必读 §8,凭空捏造数据会被后端 errcode 40004/40402 拒绝。

---

## 3. 工具速览表

| # | 工具名 | api_name | 类型 | tier | 何时用 |
|---|---|---|---|---|---|
| 1 | `_list` | `_list` | 元 | free | LLM 启动时自学 / 学员问"你能做什么" |
| 2 | `student_camps_list` | `student.camps.list` | 指标 | free | "我报了哪些营 / 进度 / 学到第几关" |
| 3 | `student_stage_summary` | `student.stage.summary` | 指标 | free | "这一关是什么 / 难度档 / 我今天打卡了吗" |
| 4 | `student_ability_indicators` | `student.ability.indicators` | 指标 | free | "我能力雷达 / 各维度怎样" |
| 5 | `student_checkin_today` | `student.checkin.today` | 指标 | free | "今天打卡了吗 / 连续多少天 / 积分多少" |
| 6 | `student_notifications_list` | `student.notifications.list` | 指标 | free | "我有什么通知 / 老师回复" |
| 7 | `student_camp_growth_path` | `student.camp.growth_path` | 内容 | free→paid+ | "这营完整路径 / 教练建议 / 优秀案例" |
| 8 | `student_stage_content` | `student.stage.content` | 内容 | free→paid+ | "这关有哪些任务 / 收获项 / 认知目标" |
| 9 | `student_ability_insights` | `student.ability.insights` | 内容 | free→paid+ | "我哪个能力弱 / 教练怎么看我" |
| 10 | `student_checkin_submit` | `student.checkin.submit` | 写 | free | "帮我打卡 / 提交打卡"(学员明确说) |

---

## 4. 跨工具编舞场景(3 个典型链路)

### 4.1 提交打卡完整链(写动作前置)

```
学员说"帮我打卡到沟通心理营第 5 关"
   ↓
1. student_camps_list           → 确认学员在哪个营,current_stage 是多少
   ↓
2. student_stage_summary({stage_id})  → 拿当前关卡概览,确认 tasks_count
   ↓
3. student_stage_content({stage_id})  → 拿真实 tasks[] 含 task_id,让学员勾选
   ↓
4. 问学员:难度档(basic/intermediate/full)?
   ↓
5. 问学员:今日反思(reflection)?
   ↓
6. 问学员:疑问(question,真无可写"暂无")?
   ↓
7. student_checkin_submit({stage_id, difficulty, completed_task_ids, reflection, question})
   ↓
8. 展示 data.note(v1 极简版打卡说明,**必须告知学员**)+ data.new_streak_days + links.self_web
```

### 4.2 查看关卡完整链路(只学习不打卡)

```
学员说"沟通心理营第 5 关讲什么"
   ↓
1. student_camps_list  → 确认学员在该营,拿 current_stage 对应的 stage_id
   ↓
2. student_stage_summary({stage_id})   → 概览(标题 / 难度 / tasks_count)
   ↓
3. student_stage_content({stage_id})   → 详细(harvest_items / cognitive_goals / tasks)
   ↓
4. 展示 + links.self_web 让学员去 H5/小程序看完整内容
```

### 4.3 复盘能力链路(诊断弱项)

```
学员说"我哪个能力比较弱,要怎么提升"
   ↓
1. student_ability_indicators  → 拿所有 system × category 能量数值
   ↓
2. student_ability_insights({system_id?})  → 拿最弱维度 + brief + improvement_paths
   ↓
3. 综合展示:维度雷达 + 最弱维度 + 教练建议 + 提升路径 + links.self_web
```

---

## 5. 工具详细说明

### 5.1 `student_camps_list`(api_name: `student.camps.list`)

**类型**:指标 | **tier**:free | **写动作**:否

**请求参数**:无

**调用前置**:无(顶层入口,可独立调用)

**响应 `data`**:
```json
{
  "camps": [
    {
      "enrollment_id": "e1",
      "camp_id": "c1",
      "camp_name": "沟通心理营",
      "system_id": "s1",
      "current_stage": 5,
      "total_stages": 10,
      "progress_pct": 50,
      "streak_days": 3,
      "total_points": 120,
      "last_checkin_at": "2026-05-17",
      "status": "ongoing"
    }
  ]
}
```

**字段语义**(以 §6 字段语义对照表为准):
- `current_stage`:当前学到的关卡序号(整数,**从 1 起**)
- `progress_pct`:进度百分比(整数 0-100,`1=1%` **不是 100%**)
- `streak_days`:**单营**连续打卡天数,**不是跨营汇总**
- `status`:营状态枚举(`ongoing` 进行中 / `graduated` 已毕业 / `marked_for_revisit` 标记重学)

**何时用**:学员问"我报了哪些营" / "我的训练营" / "我学到第几关了" / "看下布丁"

**何时别用**:学员只问"今天该学什么" → 直接用 `student_checkin_today` 更直接

**few-shot**:学员说"看下我的进度" → 调本工具 → 返回 N 个营 → 用编号 + 中文化 status + 进度条展示 + 每个营尾部附 `links.self_web`

---

### 5.2 `student_camp_growth_path`(api_name: `student.camp.growth_path`)

**类型**:内容 | **tier**:free(v1 全开),v2 paid+ 解锁 coach_insights + peer_anonymous_cases | **写动作**:否

**请求参数**:
- `camp_id` (string, 必填):来自 `student_camps_list` 的 `camps[].camp_id`

**调用前置**:必须先调 `student_camps_list` 拿 `camp_id`,**禁止凭空捏造**

**响应 `data`**:
```json
{
  "camp_id": "c1",
  "camp_name": "沟通心理营",
  "system_id": "s1",
  "graduation_steps": [
    { "stage_id": "st1", "stage_number": 1, "title": "关 1 倾听", "subtitle": null, "is_completed": true },
    { "stage_id": "st2", "stage_number": 2, "title": "关 2 表达", "subtitle": null, "is_completed": false }
  ]
}
```

**字段语义**:
- `graduation_steps[]`:营关卡序列(从 1 到 totalStages)
- `is_completed`:学员是否已在该关卡有打卡记录(bool)
- `coach_insights[]` / `peer_anonymous_cases[]`:v1 暂返回基础内容,v2 paid+ 解锁完整

**何时用**:"这营完整路径" / "学完后我会变成什么样" / "教练对我有什么建议" / "同营优秀学员怎么做"

**错误**:`errcode 40301` 学员未报名该营(此时让学员先去主站报名,**不要重试**)

---

### 5.3 `student_stage_summary`(api_name: `student.stage.summary`)

**类型**:指标 | **tier**:free

**请求参数**:
- `stage_id` (string, 必填)

**调用前置**:必须先有 `stage_id`(来自 `student_camps_list` 或 `student_camp_growth_path`)

**响应 `data`**:
```json
{
  "stage_id": "st1",
  "title": "关 1 — 倾听",
  "subtitle": "同理与回应",
  "stage_number": 1,
  "system_id": "s1",
  "system_name": "沟通心理",
  "difficulty_tiers": "basic|intermediate|full",
  "harvest_title": "本关你将学会",
  "tasks_count": 5,
  "is_completed_today": false
}
```

**字段语义**:
- `tasks_count`:该关卡 task 总数(**整数,不是 task 详情**,要详情用 `student_stage_content`)
- `is_completed_today`:今天该关卡是否已有打卡记录(bool)

**何时用**:"这一关是什么 / 主题 / 难度档位 / 我今天打卡了吗"

**何时别用**:要 task 详情 / harvest items → 用 `student_stage_content`

**错误**:`errcode 40401` stage 不存在或未发布;`errcode 40301` 学员未报名该营

---

### 5.4 `student_stage_content`(api_name: `student.stage.content`)

**类型**:内容 | **tier**:free(v1 全开),v2 free 只看前 3 tasks + paid 看完整 + `expanded_blocks`

**请求参数**:
- `stage_id` (string, 必填)

**调用前置**:必须先有 `stage_id`;**`student_checkin_submit` 前必调本工具**(为了拿 `task_id` 让学员勾选)

**响应 `data`**:
```json
{
  "stage_id": "st1",
  "title": "关 1",
  "harvest_items": ["学会同理倾听", "识别 3 种反应"],
  "cognitive_goals": ["区分倾听与等候说话"],
  "application_goals": ["对话练习 3 次"],
  "tasks": [
    { "task_id": "t1", "type": "reflection", "title": "反思练习", "description": "...", "difficulty": "basic" }
  ]
}
```

**字段语义**:
- `harvest_items[]`:收获项(学员完成本关将获得的具体能力或洞察)
- `cognitive_goals[]`:认知目标(本关培养的思维与认知)
- `application_goals[]`:应用目标(本关培养的实际场景应用能力)
- `tasks[].task_id`:**技术 ID,提交打卡时用,不展示给学员**
- `tasks[].difficulty`:`basic` 基础 / `intermediate` 进阶 / `full` 完整(中文化展示)

**何时用**:学员问"这一关有哪些任务 / 学习目标 / 收获项 / 要做什么练习";`student_checkin_submit` 前必调

---

### 5.5 `student_ability_indicators`(api_name: `student.ability.indicators`)

**类型**:指标 | **tier**:free

**请求参数**:无

**响应 `data`**:
```json
{
  "radar": [
    {
      "system_id": "s1",
      "system_name": "沟通心理",
      "categories": [
        { "category_id": "c1", "name": "同理心", "icon": "❤️", "energy": 80 }
      ]
    }
  ]
}
```

**字段语义**:
- `energy`:**整数累计值**(不是百分比,不是 0-100),反映该能力维度的训练量 × 质量积累
- `categories[]`:该体系的能力维度数组

**何时用**:"我能力雷达 / 各维度怎样 / 看我的能量值"

**何时别用**:要文字解读 / 教练建议 → 用 `student_ability_insights`

---

### 5.6 `student_ability_insights`(api_name: `student.ability.insights`)

**类型**:内容 | **tier**:free(v1 全开),v2 free 只返 `weakest_category` + `insight_brief` + paid 返完整

**请求参数**:
- `system_id` (string, 可选):不传则全系统聚合

**响应 `data`**:
```json
{
  "system_id": "s1",
  "weakest_category": { "category_id": "c1", "name": "清晰表达", "energy": 20 },
  "insight_brief": "你目前在「清晰表达」维度积累较少...",
  "insight_full": "「清晰表达」维度的能量值反映了...",
  "improvement_paths": ["优先学完该营内涉及「清晰表达」的下一关", "..."]
}
```

**字段语义**:
- `weakest_category`:当前能量最低的能力维度
- `insight_brief`:一句话教练评语(免费)
- `insight_full`:详细诊断(v1 全开;v2 paid 独享)
- `improvement_paths[]`:提升路径建议(v1 全开;v2 paid 独享)

**何时用**:"我哪个能力弱" / "教练怎么看我" / "怎么提升"

---

### 5.7 `student_checkin_today`(api_name: `student.checkin.today`)

**类型**:指标 | **tier**:free

**请求参数**:
- `camp_id` (string, 可选):不传跨营汇总,传则单营

**响应 `data`**:
```json
{
  "today": "2026-05-21",
  "is_checked_today": true,
  "today_checkin_count": 2,
  "total_points": 320,
  "max_streak_days": 7,
  "latest_checkin_at": "2026-05-21",
  "camp_id": null
}
```

**字段语义**:
- `today`:今日日期(以服务器时区计)
- `max_streak_days`:**当前最长连续打卡天数**(单营值或跨营时取最大),**不是历史最长**
- `latest_checkin_at`:最近一次打卡日期(可能不是今天,可能 null)

**何时用**:"今天打卡了吗 / 连续多少天 / 上次打卡是什么时候 / 积分多少"

**何时别用**:要提交打卡 → `student_checkin_submit`

---

### 5.8 `student_checkin_submit`(api_name: `student.checkin.submit`)⚠️ 写动作

**类型**:写 | **tier**:free | **学员必须明确同意**

**请求参数必填**:
- `stage_id` (string)
- `difficulty` (`'basic'|'intermediate'|'full'`)
- `completed_task_ids` (string[],至少 1 个)
- `reflection` (string,今日感想)
- `question` (string,疑问,无则填"暂无")

**请求参数可选**:
- `focus_rating` (int 1-5)
- `harvest_rating` (int 1-5)
- `free_note` (string,给老师的悄悄话)

**调用前置(全部必须满足)**:
1. 必须先调 `student_camps_list` 确认学员当前在哪个营、`current_stage` 是多少
2. 必须先调 `student_stage_content({stage_id})` 拿真实 `tasks[]` 含 `task_id` 列表
3. 让学员**自己**勾选完成了哪些 task(从 `tasks[].task_id` 中选,**不要凭空捏造**)
4. 让学员**自己**选难度档(必须明确说出来)
5. 让学员**自己**写 reflection 和 question
6. 把以上信息组装好才调本工具

**响应 `data`**:
```json
{
  "success": true,
  "checkin_id": "ck1",
  "stage_title": "关 1 倾听",
  "new_streak_days": 8,
  "note": "v1 MCP 简化版打卡:已记录笔记 + 更新连续天数;积分/勋章/能量将在下次浏览器内打卡时一并刷新"
}
```

**字段语义**:
- `new_streak_days`:本次打卡后的连续天数(整数,新一天 +1,断了重置为 1)
- `note`:**必须透传给学员**的服务端提示(v1 极简版打卡说明)

**何时用**:学员**明确**说"帮我打卡 / 提交打卡 / 今天的反思打到第 X 关 / submit checkin"

**禁止行为**:
- 凭空捏造 task_id(必须从 `student_stage_content` 返回的 tasks[].task_id 选)
- 学员只是聊学习心得 / 倾诉情绪 / 问"今天该学什么"时**不主动**调本工具
- 替学员选难度 / 写反思 / 编造完成的任务
- 一次提交失败后无限重试(撞 errcode 40004 / 40402 按错误码处理)

**错误**:
- `errcode 40402` 部分 task_id 不属于该关卡 → 提示 AI 重新调 `student_stage_content`
- `errcode 40401` stage_id 不存在 → 重新调 `student_camps_list`
- `errcode 40301` 未报名该营 → 让学员去主站报名

---

### 5.9 `student_notifications_list`(api_name: `student.notifications.list`)

**类型**:指标 | **tier**:free

**请求参数**:
- `limit` (int 1-20, 可选):默认 5

**响应 `data`**:
```json
{
  "unread_count": 3,
  "recent": [
    {
      "notification_id": "n1",
      "type": "teacher_reply",
      "title": "老师回复",
      "content": "继续加油",
      "link": "/notifications/n1",
      "is_read": false,
      "created_at": 1716278400
    }
  ]
}
```

**字段语义**:
- `created_at`:**Unix 时间戳(秒)**,展示时**必须**转 `YYYY-MM-DD`(规则 10)
- `type`:通知类型枚举,如 `teacher_reply` / `system_broadcast`
- `link`:跳转链接(可能 null,有则展示)

**何时用**:"我有什么通知 / 老师有回复吗 / 最近动态"

---

### 5.10 `_list`(api_name: `_list`)元接口

**类型**:元 | **tier**:free

**请求参数**:无

**响应 `data`**:
```json
{
  "apis": [
    {
      "api_name": "student.camps.list",
      "summary": "列出当前学员报名的所有训练营 + 进度 + 状态",
      "type": "metric",
      "tier_required": "free",
      "params": [],
      "response_schema": { "fields": [...] }
    }
  ]
}
```

**何时用**:LLM 启动时一次性拉所有 api 定义 / 遇到不认识的 api_name 时查询 / 学员问"你能做什么"

**展示规范**:不直接输出技术 api_name,用 summary 中文 + 类型分组("查询 / 内容 / 写操作 / 元")展示

---

## 6. 字段语义对照表(技术 ID → 业务含义,**LLM 必读**)

| 字段名(技术 ID) | 业务含义 | 单位 | 注意 |
|---|---|---|---|
| `camp_id` | 训练营技术 ID | string(cuid)| 不展示给学员;来自 `camps.list` |
| `camp_name` | 训练营名称 | string | 展示用 |
| `enrollment_id` | 学员报名记录 ID | string(cuid)| 不展示;某些 admin 接口用 |
| `system_id` | 训练体系 ID | string(cuid)| 不展示;`camp_id` 隐含 `system_id` |
| `system_name` | 训练体系名 | string | 展示用 |
| `stage_id` | 关卡技术 ID | string(cuid)| **不展示给学员**;来自 `camps.list` 或 `stage.summary` |
| `stage_number` | 关卡序号 | int(从 1 起)| 展示用("第 1 关") |
| `current_stage` | 学员当前在该营第几关 | int(从 1 起)| 展示用 |
| `total_stages` | 该营总关卡数 | int | 展示用 |
| `progress_pct` | 进度百分比 | int 0-100 | **必须带 % 号展示**;1=1% 不是 100% |
| `streak_days` | **当前单营**连续打卡天数 | int | **不是跨营汇总**;**不是历史最长** |
| `max_streak_days` | 当前最长连续打卡天数 | int | 传 camp_id 是单营;不传是跨营时取最大;**不是历史最长** |
| `new_streak_days` | 打卡后的连续天数 | int | 仅 `checkin.submit` 响应有 |
| `total_points` | 累计积分 | int | 单营或跨营汇总 |
| `last_checkin_at` | 最近打卡日期 | `YYYY-MM-DD` string | 可能 null |
| `latest_checkin_at` | 最近一次打卡 | `YYYY-MM-DD` string | 可能不是今天;可能 null |
| `is_checked_today` | 今天是否已打卡 | bool | 传 camp_id 限单营;否则任意营 |
| `is_completed_today` | **特定关卡**今天是否打卡 | bool | `stage.summary` 用 |
| `today_checkin_count` | 今天打卡次数 | int | 跨营汇总(除非传 camp_id) |
| `today` | 今天日期 | `YYYY-MM-DD` | 服务器时区 |
| `status` | 营状态 | enum | `ongoing` 进行中 / `graduated` 已毕业 / `marked_for_revisit` 标记重学 |
| `is_completed` | 关卡是否打卡过(任意时间)| bool | `growth_path` 用 |
| `task_id` | 任务技术 ID | string(cuid)| **不展示**;`submit` 时必须从 `tasks[].task_id` 选 |
| `difficulty` | 难度档 | enum | `basic` 基础 / `intermediate` 进阶 / `full` 完整 |
| `difficulty_tiers` | 关卡支持的难度档 | string | 可能 `basic\|intermediate\|full` |
| `harvest_items` | 收获项数组 | string[] | `stage.content` 返回 |
| `cognitive_goals` | 认知目标数组 | string[] | `stage.content` 返回 |
| `application_goals` | 应用目标数组 | string[] | `stage.content` 返回 |
| `tasks` | 任务详情数组 | Task[] | `stage.content` 返回 |
| `energy` | 能力维度能量累计值 | int 0+ | **不是百分比**;累计训练量×质量 |
| `weakest_category` | 当前最弱能力维度 | object | `ability.insights` 返回 |
| `insight_brief` | 一句话教练评语 | string | 免费可见 |
| `insight_full` | 详细诊断 | string | v2 paid 独享 |
| `improvement_paths` | 提升路径建议数组 | string[] | v2 paid 独享 |
| `category_id` | 能力维度技术 ID | string(cuid)| 不展示 |
| `notification_id` | 通知技术 ID | string(cuid)| 不展示 |
| `is_read` | 通知是否已读 | bool | |
| `created_at` | Unix 秒时间戳 | int(秒)| **必须转 `YYYY-MM-DD` 展示** |
| `unread_count` | 未读通知数 | int | |
| `checkin_id` | 打卡记录 ID | string(cuid)| `submit` 返回;不展示但用作 deep link 参数 |
| `note` | 服务端业务说明 | string | `submit` 返回;**必须透传给学员** |
| `reflection` | 学员今日感想 | string | submit 参数 |
| `question` | 学员疑问 | string | submit 参数;真无可写"暂无" |
| `focus_rating` | 投入度自评 | int 1-5 | submit 可选 |
| `harvest_rating` | 收获感自评 | int 1-5 | submit 可选 |
| `free_note` | 给老师悄悄话 | string | submit 可选;默认仅老师可见 |

---

## 7. 错误码归一化

| errcode | 含义 | 学员侧友好处理 |
|---|---|---|
| `0` | 成功 | 正常处理 data |
| `40001` | 缺 `skill_version` | 提示 LLM 升级客户端版本 |
| `40002` | 缺 `api_name` | 内部错误,提示重试 |
| `40003` | 未知 api_name | 调 `_list` 看支持的接口 |
| `40004` | 参数校验失败 | 看 errmsg 修参数后重试 |
| `40101` | 缺 token | 让学员去 `/profile/ai-access` 生成 |
| `40102` | token 无效 | 让学员去 `/profile/ai-access` **重新生成** |
| `40103` | token 已撤销 | 同 40102 |
| `40104` | token 已过期 | 同 40102 |
| `40301` | 未报名该营 | **让学员去主站报名**,不要重试 |
| `40302` | tier 不足(付费功能)| 让学员去 `/profile` 升级会员;v1 不会出现 |
| `40401` | 资源不存在(stage/notification)| 重新调 `student_camps_list` 拿正确 ID |
| `40402` | 子资源不存在(部分 task_id 错)| 重新调 `student_stage_content` 拿最新 tasks |
| `42901` | 限流(每日 500 次上限)| 告诉学员"明天再用" |
| `50001` | 服务器内部错误 | 告知"稍后重试" |

**所有 errcode 都通过 HTTP 200 返回**,网络层错误(HTTP 401/500 等)由 client 库统一抛出。

---

## 8. 不要做清单

❌ **不要凭空捏造** `stage_id` / `camp_id` / `task_id` / `enrollment_id` — 都是 cuid,后端校验,会 400 拒绝

❌ **不要展示 cuid 给学员看** — 用 `title` / `name` / 序号代替,学员看不懂 cuid

❌ **不要把字段名直接翻译为产品话术** — 必须查 §6 字段语义对照表,以文档为准

❌ **不要忽略 `meta.upgrade_info`** — 一旦看到 `required: true` 必须立即停下,引导学员升级

❌ **不要忽略 `links.self_web`** — 每次响应必须附"详情:{link}",这是产品留存命脉

❌ **不要替学员决定** 打卡难度 / 完成的任务 / 反思内容(违背"学员真实学习决策"原则)

❌ **不要主动调 `student_checkin_submit`** — 学员只是聊学习心得 / 倾诉情绪 / 问"今天该学什么"时不要主动打卡

❌ **不要重复硬撞 errcode 40004 / 40402** — 看到这俩错误是参数错或前置不全,按错误码引导,不要循环重试

❌ **不要展示原始 Unix 时间戳数字** — `created_at: 1716278400` 必须转 `2024-05-21`(规则 10)

❌ **不要把 `progress_pct` 当 0-1 小数** — 是整数 0-100,展示带 %(`50 → 50%`,不是 `0.5 → 50%`)

❌ **不要在 `streak_days = 0` 时直接说"连续 0 天"** — 改成"今天还没开始打卡"或"已断签",更友好

❌ **不要在心理引导对话中主动评判** 学员的 reflection 内容 — 这是教练型 AI 边界,只承接事实查询和提交动作

---

## 9. v0.x → v2.0.0 升级说明

### Breaking changes

| 项 | v0.x | v2.0.0 |
|---|---|---|
| 协议 | 6 个分散 REST endpoint | 1 个统一网关 `POST /api/skill/gateway` + `body.api_name` 路由 |
| 响应 | 业务数据直返 | Envelope `{ data, meta, links, errcode, errmsg }` |
| 字段命名 | camelCase | **snake_case** |
| Tool 名 | `get_my_camps` 等 | `student_camps_list` 等(`student_*` 前缀)|
| Tool 数 | 6 | 10(新增 `_list` / `growth_path` / `ability_insights` + `get_stage` 拆为 summary/content)|
| 错误处理 | HTTP 401/403/429/5xx | HTTP 永远 200 + `errcode`(底层故障仍 4xx/5xx)|
| 版本协商 | 无 | `skill_version` 必带 + `upgrade_info` 强制升级 |
| 回流链接 | 无 | `links.self_web` 必有(三端 UA 路由)|

### 升级动作

```bash
# 1. 升级 npm 包
npx -y pudding-user-skill@latest

# 2. MCP 客户端配置不变(env 不动)

# 3. 旧 tool 名失效:
# get_my_camps → student_camps_list
# get_today_checkin → student_checkin_today
# get_stage → 拆为 student_stage_summary + student_stage_content
# submit_checkin → student_checkin_submit
# get_ability_radar → student_ability_indicators
# get_notifications → student_notifications_list

# 4. 老对话历史里的 cuid 仍然有效(后端字段名变,但 ID 不变)
```

---

## 10. Sources / References

- 微信读书官方 skill 方案(2026-05-17 发布):https://cdn.weread.qq.com/skills/weread-skills.zip
- 布丁主仓 spec:`docs/superpowers/specs/2026-05-21-学员侧Skill-v1.21.0-按weread标准重写-spec.md`
- 布丁主仓 brainstorming:`docs/superpowers/specs/2026-05-21-学员侧Skill-v1.21.0-按weread标准重写-brainstorming.md`
