# 宠迹AI (PetTrace AI) Demo — PRD

## Overview
- **Summary**: 宠迹AI Demo 是一个响应式 Web App，用于参加 TRAE AI 创造力大赛。产品围绕"让每一次携宠出行更安心"的核心理念，以 **宠物友好地点地图 + AI 对话式行程规划** 为双核心，辅以真实验证社区与宠物私密档案两大模块，完整演示宠迹AI 作为"携宠出行 AI 伙伴"的产品形态。
- **Purpose**: 以最短开发周期交付一个可在浏览器中真实交互的 Demo，在比赛中展示 AI 创造力、地图数据、社区验证、隐私保护四个层面的完整闭环。
- **Target Users**: 大赛评委（主要）、参赛团队内部、后续可能的种子用户。

## Goals
- **G1**: 在浏览器中真实演示"地图搜点 → AI 规划行程 → 打卡验证 → 宠物档案"的完整闭环，体现 AI 创造力。
- **G2**: 以响应式设计兼顾桌面预览与手机模拟，确保比赛现场展示流畅。
- **G3**: 真实 API 可切换 + Mock 兜底，避免比赛现场网络/密钥失效。
- **G4**: 代码结构清晰，后续可平滑扩展为正式产品（小程序 / App）。

## Non-Goals (Out of Scope)
- 不做真实后端服务（无登录、无云端同步）。数据全部存前端 LocalStorage + Mock。
- 不做真实地理编码搜索（地址转坐标）。地点 Marker 采用预定义 Mock 列表，若用户输入地址走模糊匹配。
- 不做真实商家后台、不做支付、不做会员体系。
- 不做图片上传（社区内容图片用占位图）。
- 不做消息推送（档案提醒仅在 App 内可见）。

## Background & Context
- 创意来源见 `宠迹AI-TRAE创造力大赛报名帖.docx` 与 `pettrace-ai-signup-standalone.html`。
- 赛道：生活服务 / 社会公益。
- Demo 展示形态以"**一个 AI 助手 + 一张地图 + 一个宠物档案**"三栏布局在移动与桌面之间自适应切换。

## Functional Requirements

### FR-1：宠物友好地点地图
- 地图显示城市（默认上海）内一批 Mock 地点 Marker，覆盖景点、酒店、餐厅、商场、宠物乐园。
- 每个 Marker 点击弹出卡片：名称、分类标签、宠物规则（体型限制 / 是否可进室内 / 牵引要求 / 费用 / 是否有室外座位）、验证人数、最近验证时间、一致性评分。
- 地图支持分类筛选（如仅显示"允许大型犬"）、关键词搜索、"宠物友好程度"快速过滤。
- 地图可切换城市（上海 / 北京 / 广州 / 成都），各城市有独立 Mock 数据集。
- 地图样式贴近报名帖配色（暖橘 #C2703E + 绿 #5B8C5A）。

### FR-2：AI 对话式行程规划
- 入口：一个聊天界面（支持多轮对话）。
- 用户输入示例："下周六我带金毛（大型犬、性格温和）去杭州玩一天，帮我规划一下"。
- AI 输出结构化为行程方案：日期时间段、交通建议（自驾 / 高铁 + 落地交通）、推荐地点序列（与地图联动高亮）、风险提示、行前清单（宠物证件、疫苗本、湿巾、牵引等）。
- AI 回复分两段呈现：(1) 思路梳理（自然语言） (2) 结构化行程卡片（可点击跳转地图）。
- 支持"改一改"对话：用户可以在 AI 回复基础上说"把晚餐换成室内可以进的"、"改成两天一夜"，AI 调整后重新输出。
- AI 可用真实 API（OpenAI 兼容端点，支持 OpenAI / DeepSeek / 月之暗面 Moonshot / 通义千问 DashScope 等）或本地 Mock（规则引擎 + 随机数，离线可用）。
- 对话历史保存在 LocalStorage，可一键清空。

### FR-3：真实验证社区（轻量 Feed）
- 一个简单的 Feed 页面（或侧边栏）：用户打卡 / 游记 / 避雷提醒，每条内容关联某个地点。
- 社区内容支持"今天我验证了 ✓ / 信息已过期 ✗"两种快速反馈。
- 每次验证会回写到地点 Marker 的"验证人数 / 最近验证时间 / 一致性评分"三个字段。
- 社区内容全部 Mock，也允许用户本地发一条"我今天去了 XX"的打卡。

### FR-4：宠物私密档案
- 一个页面管理一只或多只宠物（Demo 默认 1 只，金毛示例）。
- 字段：名字、品种、体型（大/中/小）、性格标签（温和/活泼/胆小等）、生日、体重。
- 护理日程：疫苗（狂犬 / 联苗）、驱虫、洗澡、体检、绝育。支持添加提醒日期。
- 档案 **默认私密** —— 不与地图、社区、AI 共享真实档案内容；仅在用户主动选择"从档案中选择宠物参与 AI 规划"时才作为上下文传入。
- 档案数据 LocalStorage，无任何云端上传。

### FR-5：导航与壳层
- 底部 Tab（移动端）或左侧导航（桌面端）：地图 · AI行程 · 社区 · 宠物档案。
- 顶部提供"我的宠物"头像、城市切换、设置（含 AI API Key / BaseURL 配置）。
- 设置面板可配置：AI Provider、API Key、Base URL、模型、是否启用 Mock AI、Mock 城市等。

## Non-Functional Requirements
- **NFR-1**: 首页首屏渲染 ≤ 3s（本地运行；含 Mock 数据）。
- **NFR-2**: 移动端（375px）、桌面（≥ 1024px）两种断点下布局均自然，无明显错位。
- **NFR-3**: 离线可用 —— 关闭网络 + 未配置 API Key 时，App 仍可完成 90% 交互（地图 + Mock AI + 社区 + 档案）。
- **NFR-4**: 可访问性 —— 颜色对比度满足 WCAG AA；所有交互元素可键盘 Tab。
- **NFR-5**: 零登录 / 零后端依赖。
- **NFR-6**: 无任何第三方追踪、无埋点、无数据上报。

## Constraints
- **Technical**: Vite + React 18 + TypeScript + Tailwind CSS 3 + React Router + Leaflet（@vis.gl/react-leaflet 或 react-leaflet）+ Lucide React 图标。AI 客户端使用 fetch 对接 OpenAI Chat Completions 兼容协议。
- **Technical**: 地图瓦片使用 OSM（OpenStreetMap）公共瓦片，免密钥、可离线缓存。可选接入高德 Web API 地理编码（需 key，非必需）。
- **Business**: Demo 开发周期约 3-5 天（从 spec 确认到可部署版本）。
- **Dependencies**:
  - 强制：Node.js 18+、npm 9+。
  - 可选：OpenAI / DeepSeek / Moonshot / DashScope 任一 API Key（用户自备，spec 不内置任何 key）。

## Assumptions
- 比赛环境有网络（但我们仍以离线可跑为底线）。
- 评委用 Chromium 内核浏览器（Edge / Chrome / 新版 Safari）。
- 用户电脑已安装 Node.js 18+，或可通过 `npx vite preview` 运行生产包。
- 所有 Mock 地点数据以 5 个城市 × 8-12 条地点为主，不追求海量。

## Acceptance Criteria

### AC-1：地图可搜、可看、可筛
- **Given**: 打开 App 默认进入"地图"Tab
- **When**: 用户浏览 Marker 或点击 Marker
- **Then**: Marker 显示地点类型图标，点击弹出规则卡片，卡片含"验证人数 / 评分 / 最近验证"三项关键指标
- **Verification**: `programmatic`（可通过自动化脚本判断卡片字段完整性）
- **Notes**: 若 Leaflet 瓦片加载失败，需有占位色并可交互。

### AC-2：AI 规划输出结构化行程
- **Given**: 用户打开"AI行程"Tab 并输入一段自然语言请求
- **When**: AI 返回
- **Then**: 回复同时包含(1)自然语言分析 和 (2) 结构化行程（日期分段、地点列表、风险提示、行前清单）；结构化行程点击可跳地图并高亮相关 Marker
- **Verification**: `human-judgment`（结构美观 + 地图联动）
- **Notes**: Mock AI 至少覆盖"一日游 / 两日一夜 / 更换晚餐地点"三种典型追问。

### AC-3：档案默认私密，需用户主动授权才喂给 AI
- **Given**: "宠物档案"里已有一只"金毛 · 大型犬 · 温和"
- **When**: 用户进入 AI 规划页
- **Then**: AI 不自动读取档案，仅在用户点选"使用档案宠物参与规划"后才将特征拼入上下文
- **Verification**: `programmatic`（可检查 Network 请求体或 Mock 上下文是否含宠物字段）

### AC-4：真实验证闭环
- **Given**: 用户在 Marker 卡片或社区 Feed 里点了"我验证了 ✓"
- **When**: 该操作完成
- **Then**: 对应地点的"验证人数 + 1"、"最近验证时间 = now"、"一致性评分"根据最近验证比例变化；社区 Feed 顶部多出一条最新打卡
- **Verification**: `programmatic`（可测状态更新与卡片 UI 变化）

### AC-5：离线 & Mock 兜底
- **Given**: 未配置任何 AI API Key + 断开外网
- **When**: 用户走完地图 / AI / 社区 / 档案全流程
- **Then**: 所有功能可正常使用，AI 回复采用内置 Mock 规则引擎，无白屏、无报错
- **Verification**: `programmatic`（可在 CI 中跑 E2E 断网用例）

### AC-6：响应式布局
- **Given**: 分别以 375px 宽度和 1440px 宽度打开 App
- **When**: 切换四大 Tab
- **Then**: 移动端以底部 TabNav + 全屏页面；桌面以左侧侧边栏 + 主内容。无横向滚动条，所有按钮可点
- **Verification**: `human-judgment` + `programmatic`（截图对比 / Playwright viewport 用例）

### AC-7：AI 多提供商兼容
- **Given**: 用户在设置里填入任一 OpenAI 兼容端点（如 DeepSeek / Moonshot）
- **When**: 触发 AI 请求
- **Then**: 可正确返回；错误时给出友好提示，并可一键切回 Mock
- **Verification**: `human-judgment`

## Open Questions
- [ ] AI 回复卡片在桌面端是"左侧聊天 + 右侧地图联动"还是"地图嵌在聊天下方"？—— 默认推荐后者，地图始终可见。
- [ ] 是否需要"扫码加宠物"的入口？—— Demo 期不做。
- [ ] 是否展示报名帖中的"价值飞轮"示意图？—— 放在设置或 About 页面，作为彩蛋。
