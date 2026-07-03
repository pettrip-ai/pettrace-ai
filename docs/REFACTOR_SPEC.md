# PetTrace AI 完整重构 Spec

> **目标**：将设计系统（Design Library）全面落地到现有 React 代码中，统一视觉语言、消除硬编码样式、重构组件架构，使代码与设计稿完全一致。
>
> **范围**：全量重构，非增量修补。涉及 token 基础设施、UI 组件层、页面层、布局层。

---

## 一、现状分析

### 1.1 核心问题

| 问题 | 严重性 | 说明 |
|------|--------|------|
| 硬编码颜色散布全项目 | P0 | Button 用 `from-[#F8808E] to-[#F76B7A]`，Badge 用 `#B57608`，Toast 用 Tailwind palette `sky-500/red-500`，MapPage 用未定义的 `neutral-*`/`stone-*` |
| 无 CSS 变量抽象层 | P0 | 所有组件通过 Tailwind 自定义主题色直接引用，没有 `var(--primary)` 这类抽象，导致暗色模式切换、主题修改成本极高 |
| `black/*` 与 `ink` 混用 | P1 | Card 用 `border-black/5`，Dialog 用 `border-black/10`，而设计系统定义 foreground 为 `#54311F`，border 为 `#FDD5B5` |
| 组件样式与设计系统不一致 | P1 | Button primary 用 `rounded-xl` (12px)，设计系统定义 `--radius-md (12px)` 但主按钮应为 pill 形 (`--radius-full`)；Chip active 用 `--accent` (薄荷绿)，设计系统已改为 `--primary` (珊瑚粉) |
| 缺少 iOS 风格细节 | P2 | Tab bar 不是悬浮药丸形态；没有状态栏模拟；缺少毛玻璃 `saturate(180%)` 效果 |
| 布局/间距不统一 | P2 | 各页面 padding/margin 不一致，无统一 spacing token 约束 |

### 1.2 设计系统 vs 现有代码差异

| 设计系统 Token | 设计系统值 | 现有代码值 | 需修改 |
|----------------|-----------|-----------|--------|
| --background | #FFF7F0 | tailwind `bg` #FFF7F0 | 一致，需抽象为变量 |
| --foreground | #54311F | tailwind `ink` #2B2522 | **不一致**，需统一 |
| --muted | #A65F34 | tailwind `muted` #A29A93 | **不一致**，需统一 |
| --primary | #F76B7A | tailwind `accent` #F76B7A | 一致，需抽象为变量 |
| --accent | #20A976 | tailwind `accent2` #4CB8A7 | **不一致**，需统一 |
| --border | #FDD5B5 | tailwind `rule` rgba(43,37,34,0.08) | **不一致**，需统一 |
| --shadow-1 | rgba(84,49,31,0.06) | tailwind `soft` rgba(43,37,34,0.03) | **不一致**，需统一 |
| --radius-card | 18px | tailwind `card` 18px | 一致 |
| --radius-button | 12px | tailwind `rounded-xl` 12px | 一致 |

### 1.3 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS 3.4.14
- Zustand 5 (状态管理)
- React Router 7
- React-Leaflet 5 (地图)
- Lucide React 1.21 (图标)
- clsx 2.1 (className 合并)
- Fuse.js 7.4 (模糊搜索)
- date-fns 4.4 (日期)

---

## 二、重构策略

### 2.1 阶段划分

| 阶段 | 内容 | 产出 | 预估工作量 |
|------|------|------|-----------|
| Phase 1 | Token 基础设施 | CSS 变量 + tailwind.config.js 重写 | 小 |
| Phase 2 | 全局样式重写 | index.css、字体、暗色模式 | 小 |
| Phase 3 | UI 组件重构 | 14 个组件重写 | 中 |
| Phase 4 | 布局重构 | AppLayout 移动端/桌面端 | 中 |
| Phase 5 | 页面重构 | 5 个主页面 + 子组件 | 大 |
| Phase 6 | 交互组件补充 | ActionSheet、帖子详情等 | 中 |

### 2.2 不变的部分（保留现有逻辑）

- **业务逻辑**：所有 hooks、API 调用、store actions、mock 引擎保持不变
- **数据结构**：types/data.ts、store 状态结构、localStorage schema 保持不变
- **路由结构**：路由表、懒加载策略保持不变
- **地图功能**：react-leaflet 配置、瓦片源、标记点逻辑保持不变
- **虚拟列表**：CommunityPage virtualFeed.ts 保持不变

---

## 三、Phase 1 — Token 基础设施

### 3.1 新增 `src/tokens.css`

从设计系统 `colors_and_type.css` 提取核心变量，生成项目级 CSS 变量文件。

```css
/* src/tokens.css — Design System Token Variables */
:root {
  /* === Colors === */
  --color-bg: #FFF7F0;
  --color-surface: #ffffff;
  --color-surface-dim: #FFF1EB;
  --color-surface-container: #FFE0E3;
  --color-surface-container-high: #FFC7CD;
  --color-foreground: #54311F;
  --color-muted: #A65F34;
  --color-muted-foreground: #8A4D2D;
  --color-border: #FDD5B5;
  --color-outline-variant: #FFE8D6;

  --color-primary: #F76B7A;
  --color-primary-foreground: #ffffff;
  --color-primary-hover: #EF4460;

  --color-secondary: #FFF1F2;
  --color-secondary-foreground: #54311F;

  --color-accent: #20A976;
  --color-accent-foreground: #ffffff;

  --color-ring: #F76B7A;

  --color-error: #EF4444;
  --color-error-container: #FEF2F2;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  /* Scale tokens for component use */
  --coral-50: #fff1f2;
  --coral-100: #ffe0e3;
  --coral-200: #ffc7cd;
  --coral-300: #ffa0ab;
  --coral-400: #fd6b7e;
  --coral-500: #f76b7a;
  --coral-600: #ef4460;
  --mint-50: #eefbf4;
  --mint-100: #d5f5e3;
  --honey-50: #fffbeb;
  --honey-100: #fef3c7;
  --honey-500: #f59e0b;

  /* === Typography === */
  --font-display: 'Nunito', 'PingFang SC', sans-serif;
  --font-heading: 'Nunito', 'PingFang SC', sans-serif;
  --font-body: 'DM Sans', 'PingFang SC', sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;

  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;

  /* === Spacing (4px base) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* === Radius === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-1: 0 1px 3px rgba(84,49,31,0.06), 0 1px 2px rgba(84,49,31,0.04);
  --shadow-2: 0 4px 8px -2px rgba(84,49,31,0.08);
  --shadow-3: 0 8px 24px -4px rgba(84,49,31,0.12);
  --shadow-4: 0 16px 40px -8px rgba(84,49,31,0.18);
  --shadow-5: 0 24px 56px -12px rgba(84,49,31,0.24);

  --shadow-primary-glow: 0 4px 16px rgba(247,107,122,0.35);
  --shadow-card-hover: 0 4px 8px -2px rgba(84,49,31,0.08);
}

.dark {
  --color-bg: #1a100c;
  --color-surface: #2a1d16;
  --color-surface-dim: #231812;
  --color-foreground: #FFE8D6;
  --color-muted: #8A7060;
  --color-muted-foreground: #B09080;
  --color-border: #4A3529;
  --color-secondary: #332219;
  --color-secondary-foreground: #FFE0E3;
  /* ... shadows update for dark mode */
}
```

### 3.2 重写 `tailwind.config.js`

将现有硬编码颜色映射到 CSS 变量：

```js
// tailwind.config.js — Phase 1: 映射到 CSS 变量
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        bg2: 'var(--color-surface-dim)',
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-surface-dim)',
        ink: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-fg': 'var(--color-muted-foreground)',
        rule: 'var(--color-border)',
        'outline-variant': 'var(--color-outline-variant)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          fg: 'var(--color-primary-foreground)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--coral-100)',
          deep: 'var(--coral-600)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          fg: 'var(--color-accent-foreground)',
          soft: 'var(--mint-100)',
          deep: '#16895F',
        },
        honey: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--honey-50)',
          deep: '#D97706',
        },
        success: 'var(--color-success)',
        error: {
          DEFAULT: 'var(--color-error)',
          container: 'var(--color-error-container)',
        },
        coral: {
          50: 'var(--coral-50)',
          100: 'var(--coral-100)',
          200: 'var(--coral-200)',
          300: 'var(--coral-300)',
          400: 'var(--coral-400)',
          500: 'var(--coral-500)',
          600: 'var(--coral-600)',
        },
        mint: {
          50: 'var(--mint-50)',
          100: 'var(--mint-100)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-xl)',
        card: '18px',
        'pill-lg': '28px',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        card: 'var(--shadow-1)',
        soft: 'var(--shadow-1)',
        pop: 'var(--shadow-3)',
        'primary-glow': 'var(--shadow-primary-glow)',
        tab: 'var(--shadow-2)',
        nav: 'var(--shadow-3)',
      },
      // 保留现有的 zIndex、animation、plugin 配置
      // ...
    },
  },
  plugins: [],
}
```

### 3.3 迁移映射表

用于全局搜索替换：

| 旧 Tailwind Class | 新 Tailwind Class | 说明 |
|-------------------|-------------------|------|
| `bg-accent2/15` | `bg-accent/15` | accent2 → accent |
| `text-accent2` | `text-accent` | accent2 → accent |
| `text-accent2-deep` | `text-accent` | 去掉 deep 变体 |
| `bg-accent2/15` | `bg-mint-50` 或 `bg-accent/10` | 取决于上下文 |
| `bg-black/5` | `border-rule` 或 `bg-outline-variant` | 黑色边框 → 品牌边框 |
| `border-black/5` | `border-rule` | |
| `border-black/10` | `border-rule` | |
| `border-black/[0.04]` | `border-outline-variant` | |
| `text-ink` | `text-ink` (已映射到变量) | 无需改 |
| `bg-stone-50` | `bg-bg2` | stone → bg2 |
| `bg-neutral-100` | `bg-bg2` | neutral → bg2 |
| `bg-neutral-200` | `bg-outline-variant` | neutral-200 → 浅边框 |
| `from-[#F8808E] to-[#F76B7A]` | `bg-primary` 或自定义渐变 | 去掉 hex 硬编码 |
| `text-[#B57608]` | `text-honey-deep` | Badge honey → warning deep |
| `bg-red-50` | `bg-error/10` 或保留 | error 容器色 |
| `text-red-600` | `text-error` | |
| `shadow-lg shadow-accent/20` | `shadow-primary-glow` | 品牌辉光 |

---

## 四、Phase 2 — 全局样式重写

### 4.1 `src/index.css` 重写

```css
@import './tokens.css';
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background: var(--color-bg);
    color: var(--color-foreground);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* iOS safe area */
  :root {
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
  }
}

/* 删除现有的 #root 背景纹理层（设计稿中无此要求） */
/* 如果保留纹理，需将 gradient 色改为 token 变量 */
```

### 4.2 字体引入

在 `index.html` 中确保 Google Fonts 正确加载 Nunito 和 DM Sans。

---

## 五、Phase 3 — UI 组件重构

### 5.1 重构原则

- 每个组件的 Tailwind class 必须映射到 CSS 变量（通过 tailwind.config.js 间接引用）
- 零硬编码 hex 颜色
- 零 `black/*` 引用（用 `rule` / `outline-variant` 替代）
- Props 接口保持不变（或仅扩展），确保页面层零修改
- 组件内部用 `clsx` 组合样式，保持灵活性

### 5.2 Button 重构

**文件**: `src/components/ui/Button.tsx`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| primary 背景 | `bg-gradient-to-r from-[#F8808E] to-[#F76B7A]` | `bg-primary`（或保留渐变用 `from-coral-400 to-primary`）|
| primary 文字 | `text-white` | `text-primary-fg` |
| primary 阴影 | `shadow-lg shadow-accent/20` | `shadow-primary-glow` |
| ghost hover | `hover:bg-black/[0.03]` | `hover:bg-outline-variant/50` |
| 圆角 | `rounded-xl` | 保持 `rounded-xl` (= `var(--radius-md)` 12px) |
| 危险按钮 | `bg-red-500 hover:bg-red-600` | `bg-error hover:bg-red-700`（或新增 `error-hover` token）|

### 5.3 Card 重构

**文件**: `src/components/ui/Card.tsx`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| default 背景 | `bg-white/80` | `bg-surface/80` |
| default 边框 | `border border-black/5` | `border border-rule/30` |
| default 阴影 | `shadow-card` | `shadow-card`（已映射到变量） |
| soft 边框 | `border-black/[0.04]` | `border-outline-variant/40` |

### 5.4 Chip 重构

**文件**: `src/components/ui/Chip.tsx`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| active 背景 | `bg-accent` | `bg-primary` |
| active 阴影 | `rgba(247,107,122,0.22)` | `shadow-primary-glow`（或较弱版本） |
| inactive 边框 | `border-black/10` | `border-rule` |
| 圆角 | `rounded-full` | 保持 |

### 5.5 Avatar 重构

**文件**: `src/components/ui/Avatar.tsx`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 默认背景 | `bg-accent2/15` | `bg-coral-100`（宠物品牌头像用珊瑚色） |
| 默认文字 | `text-accent2` | `text-primary` |
| 新增渐变模式 | 无 | `variant: 'gradient'` → 珊瑚渐变背景 |

### 5.6 Badge 重构

**文件**: `src/components/ui/Badge.tsx`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| honey 文字 | `text-[#B57608]` | `text-honey-deep` |
| gray 文字 | `text-ink` | `text-muted-fg` |
| red 容器 | `bg-red-50 text-red-600` | `bg-error/10 text-error` |

### 5.7 Input / Textarea 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 背景 | `bg-white/80` | `bg-surface/80` |
| 边框 | `border-black/10` | `border-rule` |
| focus ring | `focus:ring-accent focus:border-accent` | `focus:ring-primary focus:border-primary` |
| error | `border-red-400 text-red-500` | `border-error text-error` |

### 5.8 Dialog 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 遮罩 | `bg-black/45` | `bg-ink/40` |
| 容器 | `bg-white/95 border-black/10` | `bg-surface/95 border-rule` |
| 圆角 | `rounded-2xl` | `rounded-xl`（= `var(--radius-xl)` 24px）|

### 5.9 Sheet 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 遮罩 | `bg-black/45` | `bg-ink/40` |
| 拖拽条 | `bg-black/15` | `bg-muted/20` |
| 底部边框 | `border-black/5` | `border-rule/40` |

### 5.10 Toast 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| info 类型 | `bg-sky-500` | `bg-info` |
| warning 类型 | `bg-amber-500` | `bg-honey` |
| error 类型 | `bg-red-500` | `bg-error` |
| success 类型 | `bg-mint` (= accent2) | `bg-success` |

### 5.11 Loading 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| shimmer 颜色 | `rgba(43,37,34,...)` | `var(--color-border)` 和 `var(--color-surface-dim)` |
| spinner | `border-accent/25 border-t-accent` | `border-primary/25 border-t-primary` |

### 5.12 EmptyState 重构

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 标题 | `text-ink` | `text-foreground` |
| 描述 | `text-muted` | `text-muted-fg` |
| emoji → icon | `emoji?: string` | `icon?: LucideIcon`（用宠物相关图标替代 emoji） |

---

## 六、Phase 4 — 布局重构

### 6.1 AppLayout 移动端

**文件**: `src/layouts/AppLayout.tsx`

**Tab Bar 重构为 iOS 悬浮药丸样式：**

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 容器 | 贴底 fixed | `left-3 right-3 bottom-3` 悬浮 |
| 背景 | 实色/半透明 | `backdrop-blur-xl bg-surface/72` 毛玻璃 |
| 圆角 | `rounded-t-2xl` (仅顶部) | `rounded-xl` 全圆角药丸 |
| 阴影 | `shadow-nav` | `shadow-nav + border border-surface/50` |
| 中心按钮 | 渐变圆形 | `bg-primary shadow-primary-glow -mt-5`（浮起效果） |
| 活跃态 | `text-accent` | `text-primary font-semibold` |
| 图标 | `bot` | `dog`（Lucide） |
| AI 图标 | `bot` → `sparkles` | `dog` → `paw-print` |

**Header 重构：**

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 背景 | 实色 | `backdrop-blur-xl bg-bg/82` 毛玻璃 |
| Logo | 渐变方块 + '迹' | 保持（已是品牌标识） |
| 城市选择 | `CityPill` | 保持，但样式用 token 变量 |

### 6.2 AppLayout 桌面端

保持现有侧边栏结构，仅更新样式：
- 侧边栏背景 → `bg-surface/70 backdrop-blur-xl`
- 活跃项 → `text-primary`
- 适配新的 token 变量

---

## 七、Phase 5 — 页面重构

### 7.1 AI 行程规划页 (AiPage)

**文件**: `src/pages/AiPage/index.tsx` + 子组件

| 子组件 | 关键变更 |
|--------|----------|
| `index.tsx` | 顶部 header 改为毛玻璃；宠物选择器用渐变 Avatar |
| `WelcomeHero.tsx` | 去掉 emoji，改用 `dog` 图标；渐变色改为 coral 系列 |
| `MessageBubble.tsx` | AI 气泡改为毛玻璃效果（`bg-surface/75 backdrop-blur-md`）；用户气泡用 `bg-primary gradient` |
| `ItineraryCard.tsx` | 使用 Card 组件（已重构）；顶部渐变色条 `from-coral-100 to-coral-200` |
| `InputArea.tsx` | 输入框底部加 "内容由AI生成" 提示；发送按钮用 primary 渐变 |
| `QuickSuggestions.tsx` | Chip 改为 primary active（已重构） |
| `TypingIndicator.tsx` | 圆点颜色改为 `bg-primary` |

### 7.2 地图页 (MapPage)

**文件**: `src/pages/MapPage/index.tsx` + 子组件

| 子组件/区域 | 关键变更 |
|------------|----------|
| `index.tsx` | 保持地图全屏逻辑 |
| `FilterBarMobile` | 搜索框改为毛玻璃药丸形（`bg-surface/75 backdrop-blur-lg rounded-full`） |
| `PlaceListMobileSheet` | 使用 Sheet 组件（已重构）；地点卡片用 Card + token |
| `components.tsx` | `bg-neutral-100/200` → `bg-bg2 / bg-outline-variant` |
| `marker.tsx` | Marker SVG 颜色改为 token 引用或品牌色 |
| `tiles.tsx` | 保持不变（瓦片源配置） |
| `filter.ts` | 保持不变（筛选逻辑） |

### 7.3 社区页 (CommunityPage)

**文件**: `src/pages/CommunityPage/index.tsx` + 子组件

| 子组件 | 关键变更 |
|--------|----------|
| `index.tsx` | 城市 Tab 用 Chip 组件（已重构） |
| `FeedCard.tsx` | 用 Card 组件；验证徽章用 Badge `color="success"`；用户头像用 Avatar gradient |
| `PostSheet.tsx` | 用 Sheet 组件（已重构）；分类选择用带图标的 ActionSheet 行 |
| 互动栏 | icon 改用 `heart`/`message-circle`/`bookmark`（Lucide） |
| 评分 | `star` 图标 + `text-honey` 颜色 |

### 7.4 宠物档案页 (PetPage)

**文件**: `src/pages/PetPage/index.tsx` + 子组件

| 子组件 | 关键变更 |
|--------|----------|
| `PetCard.tsx` | 用 Card 组件；头像改为渐变 Avatar（coral-100 → coral-200） |
| `PetSheet.tsx` | 用 Sheet 组件（已重构）；性格标签用 Chip |
| `CareAddSheet.tsx` | 用 Sheet 组件；护理类型用带图标的列表行 |
| `PetCareList.tsx` | 护理提醒用 Badge `color="honey"` 标记到期状态 |
| 护理区域 | 过期 → `text-error`，即将到期 → `text-honey`，正常 → `text-success` |

### 7.5 设置页 (SettingsPage)

**文件**: `src/pages/SettingsPage/index.tsx` + 子组件

| 区域 | 关键变更 |
|------|----------|
| 设置分组 | 用 Card 组件包裹 |
| 设置行 | 统一样式：`flex justify-between py-3 border-b border-rule/50` |
| Toggle 开关 | 用 `bg-primary` / `bg-muted/30` + `bg-surface` knob |
| 清空数据按钮 | `text-error border-error/20` 危险样式 |
| 版本信息 | 用 `text-muted-fg` |

---

## 八、Phase 6 — 交互组件补充

### 8.1 新增 `src/components/ui/ActionSheet.tsx`

```tsx
interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: { icon: LucideIcon; label: string; subtitle?: string; iconBg?: string; iconColor?: string; onClick?: () => void }[];
  cancelText?: string;
}
```

**样式参考**: 设计稿 `action-sheet.html` — 毛玻璃底部面板、拖拽条、分组行、取消按钮。

### 8.2 新增帖子详情路由

```
路由: /community/:postId
文件: src/pages/CommunityPage/PostDetailPage.tsx
```

**结构**: 导航头（返回+分享） → 图片 Hero → 作者信息 → 地点卡片 → 正文 → 互动栏（固定底部）。

### 8.3 新增骨架屏组件

在现有 `Loading.tsx` 中新增 `variant: 'card' | 'post' | 'place'` 骨架屏预设，对应设计稿 `states.html` 中的 3 种骨架样式。

---

## 九、验证清单

### 9.1 每个 Phase 完成后的验证项

- [ ] `npm run build` 零 TypeScript 错误
- [ ] `npm run dev` 启动正常
- [ ] 所有页面渲染无白屏/布局错乱
- [ ] 移动端 375px 下 Tab bar 正常悬浮显示
- [ ] 所有颜色来自 CSS 变量（搜索 `#[0-9a-fA-F]{6}` 应仅出现在 tokens.css）
- [ ] 暗色模式切换正常（body 添加 `dark` class）
- [ ] 所有 5 个主 tab 页面可正常导航

### 9.2 关键对照点（设计稿 ↔ 代码）

| 对照项 | 设计稿页面 | 代码文件 |
|--------|-----------|---------|
| Tab bar 悬浮药丸 | 所有页面 | `AppLayout.tsx MobileTabBar` |
| 毛玻璃效果 | 所有页面 header/card | `tailwind.config.js` plugins.glass |
| Chip primary active | ai-planner.html | `Chip.tsx` active state |
| 渐变用户气泡 | ai-chat.html | `MessageBubble.tsx` |
| 渐变宠物头像 | pet-profile.html | `Avatar.tsx` gradient variant |
| 珊瑚色发送按钮 | ai-chat.html | `InputArea.tsx` send button |
| AI 免责声明 | ai-chat.html | `InputArea.tsx` footer |
| 验证徽章 | community.html | `Badge.tsx` success color |
| ActionSheet | action-sheet.html | 新增 `ActionSheet.tsx` |
| 骨架屏 | states.html | `Loading.tsx` 新增 variants |

---

## 十、风险与注意事项

1. **地图 Marker 颜色** — SVG 内联颜色无法直接使用 CSS 变量，需通过 React 组件 props 传递 token 值
2. **第三方组件** — Leaflet popup 样式需单独覆盖，无法通过 Tailwind 变量控制
3. **虚拟列表** — `virtualFeed.ts` 性能敏感，重构仅限样式，不改渲染逻辑
4. **Mock AI 引擎** — 纯逻辑代码，不涉及样式变更
5. **localStorage schema** — 不变更数据格式，仅改视觉呈现
