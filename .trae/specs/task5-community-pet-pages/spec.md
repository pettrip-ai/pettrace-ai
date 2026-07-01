# PetTrace AI - Task 5：CommunityPage + PetPage 产品需求文档

## Overview
- **Summary**: 在 PetTrace AI（携宠出行 AI 助手）项目中，新增"真实验证社区"Feed 页面和"宠物私密档案"页面，支持用户浏览社区打卡/游记/避雷/经验分享，发布验证 Feed，管理多只宠物档案和护理日程，并在 AI 规划时主动决定是否带入宠物档案。
- **Purpose**: 打通社区验证闭环（Map 验证 → Community 打卡 → 反馈迭代），完善宠物档案（体型/性格/护理日程）以便 AI 给出更精准推荐。
- **Target Users**: 有带宠出行需求的用户；宠物主群体。

## Goals
- 提供 Feed 社区浏览 + 筛选 + 发布能力
- 提供宠物档案 CRUD（含体型/性格标签/生日/体重/规则卡片）
- 提供护理日程（疫苗/狂犬/驱虫/洗澡/体检/绝育）自动算下次日期 + 状态 Chip
- 打通 store：feeds、pets、careTasks、verifyPlace、showPetInChat

## Non-Goals
- 不做图片上传（头像仅占位）
- 不做后端 / 云同步（本地 localStorage）
- 不做社交关系（关注、粉丝、评论）
- 不做真实地理定位

## Background & Context
- 项目已存在 MapPage、AiPage、SettingsPage、AppLayout、Zustand store、tailwind 配色（accent/accent2/bg/bg2/ink/muted/rule）。
- types.ts 中已存在 Pet / Place / FeedItem / CareTask / CityId；FeedType='打卡'|'游记'|'避雷'|'经验分享'。
- mock.ts 中 PLACES = `Record<CityId, Place[]>`，CITIES 四市。
- useStore.ts 已包含 feeds / addFeed / likeFeed / unlikeFeed / verifyPlace / pets / careTasks / showPetInChat。

## Functional Requirements
- **FR-1**: CommunityPage 顶部 sticky 区展示标题、类型筛选 dropdown（全部/打卡/游记/避雷/经验分享）、城市 tab（全部/上海/北京/广州/成都）
- **FR-2**: Feed 列表按 whenISO 倒序；每张卡展示用户头像首字母 + 昵称 + 时间（date-fns zh-CN formatDistanceToNow）+ 类型 Chip（打卡=accent、游记=accent2、避雷=红、经验分享=rule）+ 正文（line-clamp-6 可展开）+ 地点标签（点击跳转 /map 并 setHighlightPlaceId）+ 点赞 Heart（未点空心 text-muted，已点实心 text-accent likes+1）+ ✓/✗ 验证按钮
- **FR-3**: 浮动 FAB（圆形 bg-accent，右下 Plus）和顶部"发布验证"按钮均能弹出自制 Modal（fixed inset-0 bg-black/40 + flex + bg-white rounded-xl），内有地点下拉、类型 chip radio、textarea、"发布打卡并验证"按钮（调 addFeed + verifyPlace）
- **FR-4**: Toast（top-center 小黑卡 bg-ink）自动消失 2.5s
- **FR-5**: 空状态显示"成为第一条验证者吧！"按钮
- **FR-6**: PetPage 列表展示 store.pets，每只一张 rounded-2xl bg-bg2 border-rule 卡：头像（PawPrint + accent2 圆）+ 名字 + 品种 + sizeLabel chip + 性格 chip + 生日 + 体重 + 编辑按钮 + 规则卡片（适合/不适合场景根据 size 推导）+ 删除按钮
- **FR-7**: 宠物新增/编辑 Modal（同一个组件内部 isEdit 分支），字段：名字（必填）、品种、种类、体型 radio、性格多选 chip、生日、体重、备注
- **FR-8**: 护理日程卡片（rounded-2xl bg-white border-rule），每一项展示类型、上次日期（可点击 prompt 修改）、下次日期（自动上次+间隔）、状态 Chip（已逾期红、≤7 天红、否则绿）、删除按钮、"+ 添加新护理" Modal
- **FR-9**: 底部红色私密提示条 `bg-red-50/60 border-red-200 text-red-700`
- **FR-10**: "使用档案宠物参与规划" toggle（与 AiPage 文案一致"使用档案宠物 {petName} 参与规划"），关=bg-muted/40，开=bg-accent

## Non-Functional Requirements
- **NFR-1**: 构建 `npm run build` 退出码 = 0
- **NFR-2**: 类型检查 `npx tsc --noEmit` 退出码 = 0
- **NFR-3**: 不引入 shadcn / styled-components
- **NFR-4**: 所有 Modal 自制（fixed inset-0 bg-black/40 + flex + bg-white rounded-xl）
- **NFR-5**: Lucide 图标覆盖：Heart, Plus, X, Check, Sparkles, Notebook, MessageSquare, AlertTriangle, PawPrint, CalendarDays, Edit, Trash2, Save, ChevronDown, ChevronUp, CheckCircle

## Constraints
- **Technical**: React 18 + TS + Vite + Zustand + Tailwind CSS + date-fns
- **Business**: 所有数据本地 localStorage；离线可用
- **Dependencies**: lucide-react, date-fns, clsx, zustand

## Acceptance Criteria

### AC-1: 社区 Feed 倒序展示
- **Given**: store.feeds 存在 8+ 条 seed mock Feed
- **When**: 打开 CommunityPage
- **Then**: Feed 按 whenISO 从新到旧排列，顶部 sticky 标题 + 筛选 dropdown + 城市 tabs 可见
- **Verification**: `programmatic` + 人工浏览

### AC-2: 发布 Feed 并自动验证
- **Given**: 用户在 CommunityPage 点 FAB → 选地点 → 选类型='打卡' → 写正文
- **When**: 点"发布打卡并验证"
- **Then**: store.feeds 新增、store.recentVerifications 新增、目标 place.verifierCount+1、Toast "发布成功"、Modal 关闭
- **Verification**: `programmatic`

### AC-3: 宠物档案 CRUD
- **Given**: 用户打开 PetPage，默认 1 只豆豆
- **When**: 新增/编辑/删除宠物
- **Then**: store.pets 变更、默认豆豆有联苗/狂犬/驱虫/洗澡/体检 6 条默认护理任务（通过 addPet 自动调 defaultCareTasksFor）
- **Verification**: `programmatic`

### AC-4: 护理日程状态计算
- **Given**: 某护理任务 intervalDays=365，上次=30 天前
- **When**: 进入 PetPage
- **Then**: 下次日期=335 天后、状态 Chip="无需担心"；若只剩 5 天则"即将到期 5 天"；若已经过了则"已逾期 N 天"
- **Verification**: `programmatic`

### AC-5: build & tsc 双 0
- **Given**: 项目完整
- **When**: npm run build / npx tsc --noEmit
- **Then**: 退出码均为 0
- **Verification**: `programmatic`

## Open Questions
- 无
