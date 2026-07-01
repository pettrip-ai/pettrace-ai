---
name: pettrace-design
description: Use this skill to generate well-branded interfaces for PetTrace AI — an AI-powered pet companion app. Contains colors, type, fonts, assets, and UI kit for prototyping app UIs.
user-invocable: true
---
# PetTrace AI Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts, copy assets out and create static HTML files. If working on production code, read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — brand context, content fundamentals, visual foundations (read first)
- `css.json` — structured token understanding source
- `colors_and_type.css` — drop-in runtime CSS variables; link it, do not read it to understand tokens when css.json exists
- `components/index.json` — component index + cross-component patterns
- resolved component sources — use `preview/component-{slug}.html` first, `components/{slug}.json` for intent/variants
- `preview/` — small HTML cards illustrating foundations and components
- `library-consumption.json` — recommended downstream read order

## Essentials at a glance
- Brand primary `#F76B7A` — warm coral-pink, playful and pet-friendly. Mint (`#20A976`) and honey (`#F59E0B`) as secondary accents.
- Radius 8/12/16/24/9999 — rounded cards (16px), buttons (12px), pills (9999px). 8px for small controls.
- 36px input height, 40px default button height, 4px spacing unit, 8-pt grid.
- Type: Nunito (display + headings, 800–700 weight); DM Sans (body + caption, 400–500 weight).
- Voice: bilingual CN-first, warm, friendly, pet-centric. No emoji in UI.
- Shadows warm-tinted: 5 levels from subtle card (`shadow-1`) to overlay pop (`shadow-5`), all `rgba(84,49,31,...)` brown-tinted.
- Surface canvas `#FFF7F0` (warm cream), cards pure white — cream-on-white layering, not gray.
- AI-first product: dedicated chat bubble, typing indicator, and itinerary card patterns.

## Components
| Slug | Name | Key Insight |
|------|------|-------------|
| button | Button | Coral-pink gradient primary with pill-lg radius, warm glow shadow on press |
| card | Card | Glassmorphic white cards with soft blur backdrop on cream canvas |
| bottom-nav | BottomNav | Floating pill-shaped tab bar with promoted AI center |
| input | Input | Rounded warm-white input with coral focus ring |
| avatar | Avatar | Gradient coral initials for pet identity |
| chip | Chip | Pill-shaped filter toggles with coral active state |
