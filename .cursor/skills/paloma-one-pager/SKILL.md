---
name: paloma-one-pager
description: >-
  Implements and maintains the Paloma "China Strategy Summary" board slide (page 2)
  in StratOS at /strategy. Pixel-faithful PPT layout with editable modules and
  Rhautt footer. Use when editing ChinaStrategyOnePager, one-pager API, strategy
  slide icons, or when the user asks for 原 PPT / Paloma / 一页纸 / China Strategy Summary.
---

# Paloma One-Pager (China Strategy Summary)

## Non-negotiables

1. **Slide interior = original PPT** — white `#ffffff`, Arial/Helvetica, Paloma hex palette. **No** StratOS gradient bar, ivory print theme, Logo Mark in title, or Ruud cyan inside the slide.
2. **Only brand change:** footer wordmark **Rhautt** `#c62828` italic serif — replaces Paloma.
3. **Single 16:9 page** — three columns + two thick grey arrows; **no** extra sections below the slide.
4. **Left column = three independent modules** (separate bordered boxes):
   - Market Drivers
   - Core Strengths
   - Strengths to be developed (title **underlined**)
5. **Middle column** = one box, Strategic Priorities + INVEST/INNOVATE/DELIVER rings.
6. **Right column** = one box, period title **underlined**, four KPI blocks.
7. **Toolbar** (草稿/保存/审批) stays **outside** the slide; `print:hidden`.

## Canvas dimensions

- Reference PNG: **1024 × 665 px** (NOT 16:9). Use `aspect-ratio: 1024 / 665`.
- Do **not** use raster crops unless re-derived with correct coordinates; bad crops look worse than SVG.

## Reference asset

- Canonical PNG: `public/brand/china-strategy-reference.png`
- Icons: vector only in `china-strategy-icons.tsx` unless professionally re-cropped
- Data defaults: `lib/strategy/china-strategy-summary.ts`
- UI: `components/strategy/ChinaStrategyOnePager.tsx`
- Icons: `components/strategy/china-strategy-icons.tsx` (`PPT` token object)
- Styles: `app/globals.css` (`.china-strategy-one-pager`, `.ppt-*`)
- API: `app/api/strategy/one-pager/*`, `lib/strategy/one-pager-store.ts`

Full token + layout spec: [reference.md](reference.md)

## Workflow (image-first → code → QA)

Follow **`image-to-code-skill`** adapted for fixed slides (do not generate new mockups; use reference PNG):

```
Task Progress:
- [ ] 1. Read public/brand/china-strategy-reference.png
- [ ] 2. Extract per-zone: icons, colors, type scale, grid proportions
- [ ] 3. Change only components listed above; no StratOS VI on slide body
- [ ] 4. npm run build
- [ ] 5. Visual QA: screenshot /strategy vs reference (frontend-visual-auditor)
- [ ] 6. Fix deltas: spacing, icon size, arrow weight, underline titles
```

### Zone checklist (must match reference)

| Zone | Verify |
|------|--------|
| Title | Top-left, bold ~26px black, no StratOS chrome |
| Market Drivers | Cart + **+** + coin triangle; leaf centered below |
| Core Strengths | Lightbulb head + blue globe, two columns |
| Strengths to be developed | **Separate box**, 3 circular badges, underlined title |
| Arrows | Thick solid `#bdbdbd` chevrons between columns |
| Priorities | Green/blue/orange ring per tier; bullet list |
| KPIs | Grey underlined label, bold black value, grey sublines |
| Footer | Rhautt left, tag center, page **2** right |

## Editable + DB

- `DRAFT`: all text fields editable; `ppt-field` styling only in edit mode.
- `PUT /api/strategy/one-pager` → draft; `POST .../approve` → `APPROVED`; `POST .../revise` → back to draft.
- Always persist `footerBrand: "Rhautt"`.

## Anti-patterns (do not reintroduce)

- StratOS `PageHeader` inside the slide canvas
- `surface-elevated` / BSC gradient **on** the slide
- Stacking left column into one box (Strengths must stay separate)
- `flex-col` mobile stack that looks like 3 pages — use horizontal scroll + min-width grid
- Replacing doctrine colors with `--color-accent` Ruud cyan

## Related skills (load when needed)

- **image-to-code-skill** — section-by-section fidelity pass
- **frontend-visual-auditor** — screenshot diff after changes
- **ui-vi-designer** — toolbar/shell around slide only, not slide body
