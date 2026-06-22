# Paloma China Strategy Summary — layout & token spec

## Canvas

| Property | Value |
|----------|--------|
| Aspect | 16:9 landscape |
| Background | `#ffffff` |
| Font | Arial, Helvetica, sans-serif |
| Max width | 1280px |
| Page number | 2 (default) |

## Paloma palette (`PPT` in china-strategy-icons.tsx)

| Token | Hex | Use |
|-------|-----|-----|
| border | `#9e9e9e` | Module boxes, header/footer rules |
| arrow | `#bdbdbd` | Column chevrons |
| invest | `#6aae4f` | INVEST ring + tier title |
| innovate | `#5b9bd5` | INNOVATE ring + tier title |
| deliver | `#ed7d31` | DELIVER ring + tier title |
| text | `#212121` | Section titles |
| textMid | `#424242` | Body bullets |
| textMuted | `#616161` | KPI labels, sublines |
| footerMuted | `#757575` | Footer tag |
| footerRed | `#c62828` | Rhautt wordmark |
| coin | `#c9a227` | Premium icon |
| ringGray | `#d9d9d9` | Inactive ring segments |

## Grid

```
┌─────────────────────────────────────────────────────────────┐
│ China Strategy Summary                                      │
├──────────────┬──▶──┬──────────────┬──▶──┬──────────────────┤
│ Market Drv   │     │ Strategic    │     │ 2020 – 2025      │
│ Core Str     │     │ Priorities   │     │ KPI × 4          │
│ Str dev *    │     │ (3 tiers)    │     │                  │
└──────────────┴─────┴──────────────┴─────┴──────────────────┘
│ Rhautt          5 Year Strategy | Confidential            2 │
```

`*` Strengths to be developed = **own bordered module** (not nested in Core Strengths).

## Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Slide title | 22–26px | 700 | Black |
| Section title | 11px | 700 | Uppercase, centered |
| Underlined sections | 11px | 700 | Strengths to develop; period label |
| Tier title | 10px | 700 | Doctrine color |
| Body / bullets | 9px | 400–500 | Mid grey |
| KPI value | 20px | 700 | Black |
| KPI label | 10px | 700 | Muted + underline |
| Footer | 9–10px | — | Tag tracking |

## Default content

See `CHINA_STRATEGY_SUMMARY` in `lib/strategy/china-strategy-summary.ts`.

KPI sublines (multi-line):

- Market Share: FY25 Vol Share / Residential --- 2% / Commercial --- 3.5%
- Unit Volume: FY25 Volume: 147K / Residential --- 28% / Commercial --- 23%

## Files to touch for changes

| Change | File |
|--------|------|
| Layout / edit UX | `components/strategy/ChinaStrategyOnePager.tsx` |
| Icons / colors | `components/strategy/china-strategy-icons.tsx` + `public/brand/ppt-icons/` |
| CSS scale | `app/globals.css` |
| Default JSON | `lib/strategy/china-strategy-summary.ts` |
| Seed | `prisma/seed.ts` |
