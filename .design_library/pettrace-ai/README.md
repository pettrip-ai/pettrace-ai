# PetTrace AI Design System

A design system reconstruction of **PetTrace AI** — an AI-powered pet companion app that helps pet owners discover pet-friendly venues, plan outings, and manage pet profiles. The system is purpose-built for a mobile-first consumer app with warm, approachable visual language targeting young pet owners.

## Source

- **Route:** from-scratch (no Figma bundle)
- **Brand owner:** PetTrace AI
- **Component confidence:** medium (all components inferred from brand tokens, not extracted from production Figma)

## What this design system covers

- **Foundations** — warm coral-pink primary, cream canvas, mint/honey secondary accents, Nunito + DM Sans type scale, 8-pt spacing, 5-level warm-tinted shadow system
- **Components** — 6 documented components: Button, Card, BottomNav, Input, Avatar, Chip
- **Preview pages** — one HTML card per component for visual verification

---

## CONTENT FUNDAMENTALS

### Voice & tone

The product voice is bilingual and Chinese-first. UI copy is warm and conversational but concise — think "a helpful neighbor who knows your dog by name." The app avoids stiff system-language in favor of short, action-oriented labels. There is no emoji usage in the product UI; warmth comes from color and illustration, not from text decoration. Formality is low: the app speaks to the user in second person with brief imperative constructions ("告诉我你的目的地") rather than polite suffixes.

### Concrete copy examples (from preview pages)

- Primary CTA: *"AI 行程规划"* — the central action repeated across all button sizes, signaling this is the app's core differentiator
- Secondary action: *"取消"* — paired with the primary CTA as a graceful exit path
- Card title: *"宠物档案"* with body *"品种 · 体型 · 生日"* — dot-separated metadata, not colon-labeled form fields
- Card soft variant: *"下次驱虫日期：2026年7月15日"* — full date format, practical care reminder
- Search placeholder: *"地点名 / 备注 / 地址"* — slash-separated hint showing multiple accepted input formats
- Chat placeholder: *"告诉我你的目的地"* — conversational, second-person prompt
- Error hint: *"请输入有效的地点信息"* — direct, no exclamation mark, no "please" redundancy
- Navigation labels: *"地图", "社区", "AI规划", "档案", "设置"* — two-character brevity for mobile tab bar
- Sidebar collapse: *"收起"* — single verb, no icon-label redundancy
- Filter chips: *"咖啡厅", "宠物公园", "宠物医院", "宠物商店", "附近", "全城", "我的收藏", "散步中", "休息", "进食中"* — concrete venue names and activity states
- Ghost button: *"清空"* — minimal destructive action label
- Danger button: *"删除"* — plain, no emoji or warning decoration

### When generating copy

- Use two-character labels for navigation items (地图, 社区, 档案, 设置) — consistency with the established tab bar pattern
- Placeholders should use slash-separated alternatives ("A / B / C") to hint at accepted formats
- Error messages are declarative statements without exclamation marks or "请" when the action is already clear
- Card body text uses the middle dot (·) as a lightweight separator for metadata lists
- AI-related features are labeled with "AI" prefix, not "智能" — the product treats AI as a feature category, not a marketing adjective

---

## VISUAL FOUNDATIONS

### Color

The palette is built around warmth — this is not a cold tech product. The background is a warm cream (`#FFF7F0`) that reads as off-white with personality, not sterile gray. Cards sit in pure white (`#FFFFFF`) against that cream, creating a layered "cream-on-white" depth that relies on shadow and blur rather than border contrast.

**Brand primary** is `#F76B7A` — a coral-pink that sits between playful and polished. The primary button uses a gradient from `#F76B7A` to `#EF4460` (coral-500 to coral-600), giving it a subtle dimensional shift without being flashy. The primary maps to the coral scale's 500-stop; the 600-stop serves as the hover/press state.

**Accent green** `#20A976` (mint-500) handles secondary emphasis and — notably — the input focus ring. This is an intentional contrast: the coral draws attention to CTAs, while the green confirms active interaction zones. The accent never competes with primary; it supports.

**Honey amber** `#F59E0B` covers warnings. The warm yellow-orange sits naturally in the palette alongside coral and cream — no jarring cold blue warning.

**Semantic colors** map to recognizable families: success is emerald (`#10B981`), error is red (`#EF4444`), info is blue (`#2563EB`). These are standard enough for universal comprehension but kept at arm's length from the brand core — they appear in status contexts only.

**Neutrals** are unusual: instead of gray, the neutral scale runs from warm off-white (`#FFF7F0`) through tan (`#C97840`) to deep brown (`#54311F`). The foreground text is `#54311F` — a dark chocolate brown, not black. Muted text (`#A65F34`) and muted-foreground (`#8A4D2D`) continue the brown family. This is the single most distinctive color decision: the product has no true gray at all.

**Dark mode** inverts to a deep espresso base (`#1A100C` background, `#2A1D16` surfaces) with warm tan foreground (`#FFE8D6`). Shadows shift from brown-tinted to pure black with increasing opacity.

**Surface system** provides five elevation steps: `--surface-dim` through `--surface-container-highest`, ranging from `#FFF1EB` to `#FDD5B5`. These are used primarily for background layering behind cards, not for component fills.

### Typography

**Display and headings** use **Nunito** — a rounded geometric sans-serif with friendly terminals. Display (56px, weight 800, line-height 1.1) and H1 (40px, weight 800) carry maximum visual weight for hero moments. H2 (32px, weight 700) and H3 (24px, weight 700) handle section headers. H4 (20px, weight 600) is the component-level heading used in card titles and sidebar logos. Display and H1 apply a tight -0.01em letter-spacing for optical tightness at large sizes.

**Body and UI text** use **DM Sans** — a clean, slightly geometric sans with better readability at small sizes. Body is 16px at weight 400 with a generous 1.6 line-height. Lead (18px, weight 500, line-height 1.7) provides emphasis for intro paragraphs. Caption (12px, weight 500, line-height 1.5) handles labels, hints, and nav item text. Mono reuses DM Sans in a monospace stack for any code-like content.

Both fonts are loaded via Google Fonts CDN. The fallback stack is `sans-serif` for Nunito and DM Sans respectively — adequate but not ideal. DM Sans also serves as the mono face, which is a pragmatic choice given the consumer app context where monospace is rarely needed.

### Spacing

The spacing system is a 4px base unit with 8 defined tokens: 4, 8, 12, 16, 24, 32, 48, 64px. The most frequently used values are 8px and 16px (internal component padding and gaps), with 24px for card-level spacing and 32px for section separation. The 4px token appears in fine-tuning contexts (nav item gaps, chip inner padding).

Component heights are calibrated for mobile touch targets: input height is 36px, buttons range from 32px (small) through 40px (medium, the default) to 48px (large). The bottom-nav center button is 48px — deliberately oversized to signal its importance as the AI entry point. Avatar sizes follow the 32/40/56px progression.

### Radius

The radius system is deliberate about softness. Small controls (chips, small buttons) use 8px. Standard interactive elements (medium buttons, inputs, card action buttons) use 12px. Cards use 18px in their CSS (slightly above the 16px `--radius-lg` token — this is a fixed value in `components.css`, not token-driven). The sidebar uses 16px. Pills — chips and icon buttons — use 9999px (full round).

The distinction is clear: 8px is functional, 12px is comfortable, 16-18px is "container soft," and 9999px is exclusively for filter toggles and circular icon buttons.

### Shadow / Elevation

Five shadow levels, all warm-tinted with `rgba(84,49,31,...)` — the foreground brown color at varying opacities. Level 1 (card rest state) is whisper-quiet: two stacked subtle shadows at 0.06 and 0.04 opacity. Level 2 (card hover, primary button) introduces a soft pop at 0.08 opacity with a -2px spread for containment. Level 3 (floating elements) opens to 24px blur at 0.12. Level 4 (modals) reaches 40px blur at 0.18. Level 5 (overlays) hits 56px blur at 0.24 — the heaviest elevation in the system.

Dark mode replaces the brown tint with pure `rgba(0,0,0,...)` at higher opacities (0.20 through 0.52), which reads as more conventional shadow on dark surfaces.

The shadow philosophy is "warm ambient" — shadows are meant to feel like the card is resting on a slightly warm-lit surface, not floating in cold space. This is consistent with the cream canvas and brown neutrals.

### Borders

Borders are extremely restrained. Card borders are `rgba(0,0,0,0.05)` — nearly invisible, relying on shadow and backdrop-blur for edge definition. Input borders are slightly stronger at `rgba(0,0,0,0.1)`, becoming `rgba(0,0,0,0.2)` on hover. The outline/border token resolves to `#FDD5B5` (neutral-200), a warm tan that functions as a visible divider without feeling harsh. The bottom-nav uses `rgba(0,0,0,0.08)` for its top edge.

### Glassmorphism

A notable pattern across cards, buttons, and the bottom-nav: semi-transparent white backgrounds (`rgba(255,255,255, 0.55-0.80)`) combined with `backdrop-filter: blur()`. Cards blur at 24px, the bottom-nav at 40px, soft cards at 16px, secondary buttons at 8px. This creates a frosted-glass layering effect on the cream canvas that reinforces the "warm, soft, approachable" aesthetic. It is not applied to inputs or chips — those use solid or near-solid backgrounds for readability.

### Iconography

Icons are sourced from Lucide (via CDN). Standard sizes are 16px (small), 20px (medium/default), and 24px (large). Icons in input fields are set to 20px with 0.5 opacity, deliberately subdued to avoid competing with text. The bottom-nav center button inverts its icon to white via CSS filter. No custom icon set exists in this library — all icons are CDN-loaded SVGs.

### Animation

Transitions are consistently 0.15s with `ease` timing. The interaction model is subtle: hover uses `filter: brightness(1.08)` for a gentle lift, active uses `transform: scale(0.97)` for tactile press feedback. No keyframe animations or complex transitions are defined in the component CSS — the system prefers instant perceived responsiveness over decorative motion.

---

## COMPONENT PATTERNS

| Component | Preview | Contract | CSS Source | Key Facts | Key Insight |
|---|---|---|---|---|---|
| Button | `preview/component-button.html` | `components/button.json` | `components.css` section Button | 4 variants (primary/secondary/ghost/danger), 3 sizes (sm/md/lg) + icon-only, disabled state, press-scale micro-interaction | Gradient primary with coral-to-deep-coral shift, scale-0.97 press feedback, no outline-primary variant |
| Card | `preview/component-card.html` | `components/card.json` | `components.css` section Card | 2 variants (default/soft), hoverable shadow lift, title + body + actions anatomy, 18px fixed radius | Glassmorphic backdrop-blur at 24px on cream canvas, card action buttons use separate sizing from standalone buttons |
| BottomNav | `preview/component-bottom-nav.html` | `components/bottom-nav.json` | `components.css` section Bottom Nav | 2 platforms (mobile tab bar / desktop sidebar), sidebar collapsible state, 5-item layout with promoted AI center | Floating pill shape (30px top radius), center button elevated -14px with shadow-2, desktop variant includes full collapsed state |
| Input | `preview/component-input.html` | `components/input.json` | `components.css` section Input | 2 types (text input / chat textarea), 3 states (default/error/disabled), optional leading icon, accent focus ring | Focus ring uses mint accent (not coral), chat variant has auto-grow textarea with inline send button |
| Avatar | `preview/component-avatar.html` | `components/avatar.json` | `components.css` section Avatar | 3 variants (gradient/solid/outlined), 3 sizes (sm/md/lg), initial character display, full-round radius | Coral gradient for pet identity, mint-tinted solid for categories, no image-avatar variant in current scope |
| Chip | `preview/component-chip.html` | `components/chip.json` | `components.css` section Chip | 2 states (active/inactive), pill radius, active coral glow shadow, scale-0.97 press | Active state uses accent green (not coral primary), min-width 56px for touch safety |

---

## Index

- `README.md` — this file
- `SKILL.md` — agent skill manifest with essentials and quick map
- `css.json` — structured token reference for programmatic consumption
- `colors_and_type.css` — drop-in CSS variables file (link, don't read when css.json exists)
- `components.css` — aggregated component CSS extracted from preview pages
- `components/index.json` — component index with cross-component patterns
- `components/{slug}.json` — per-component contract with variants, anatomy, and usage hints
- `preview/component-{slug}.html` — standalone HTML preview cards for visual verification
- `library-consumption.json` — recommended downstream read order

---

## Caveats / known substitutions

1. **Nunito and DM Sans** are loaded via Google Fonts CDN. In offline or restricted-network environments, both fall back to generic `sans-serif`. Nunito's rounded terminals are a core brand personality element — if unavailable, the visual warmth degrades noticeably. Consider self-hosting WOFF2 for production.

2. **DM Sans is reused as the mono face** (`--font-mono: 'DM Sans', monospace`). This is pragmatic for a consumer app but is not a true monospaced font. Any UI requiring precise character alignment (code blocks, data tables) will render with proportional spacing.

3. **Card radius is 18px in `components.css`** but the nearest token is `--radius-lg: 16px`. This 2px discrepancy is intentional in the preview CSS but creates a token inconsistency. When implementing production components, decide whether to formalize `--radius-card: 18px` or align cards to the 16px token.

4. **All components are `from-scratch` with `medium` confidence.** There is no Figma source file or production screenshot set to validate against. Component anatomy, variant dimensions, and interaction patterns are inferred from the brand tokens and product description. If a production design audit becomes available, these components should be cross-checked.

5. **Icons are CDN-loaded from Lucide static.** The library has no self-contained SVG icon set. For production use, the referenced icons (bot, map-pin, users, folder, settings, search, send, plus, menu, trash-2, chevrons-left, paw-print) should be vendored locally or replaced with a custom icon system.

6. **BrandFile (`phase2-brand-analyst.json`) was empty.** All brand context in this README and SKILL.md was derived from the generated token files (`colors_and_type.css`, `css.json`) and the component contracts. Any brand narrative, voice guidelines, or design principles described here are synthesized from observable patterns in the token and component data, not from a formal brand brief.

7. **No dark mode component variants exist in preview pages.** The `colors_and_type.css` defines a `.dark` class with full dark-mode token overrides, but no preview HTML exercises these tokens against actual components. Dark mode implementation is unverified at the component level.
