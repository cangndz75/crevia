# Crevia — Final UI Visual Unification

## Final visual direction

Premium light-theme mobile city-management game:

- Teal / mint / cream / soft green palette
- Dark teal primary CTA accents
- Gold / mint strategic highlights
- Rounded cards, soft shadows, compact mobile layout
- Readable hierarchy without corporate dashboard density

Tokens live in `src/ui/theme/gameUiTokens.ts` and extend `src/ui/theme/colors.ts`, `radius.ts`, `shadows.ts`, `spacing.ts`, `typography.ts`.

## Color tokens

| Token | Value | Usage |
|-------|-------|-------|
| backgroundCream | `#F8F1E4` | Screen background |
| cardWhite | `#FFFCF5` | Default card |
| cardMintTint | `#EAF5EE` | Positive / mint cards |
| primaryTeal | `#07564F` | Primary CTA, titles |
| mintPositive | `#3E9E6A` | Success / recovery |
| amberCaution | `#C78925` | Warning |
| goldAccent | `#D8A72E` | Achievement / nav active |
| textMuted | `#68746E` | Body secondary |

## Radius / shadow / typography / spacing

- **Badge** `radius.sm` (8)
- **Chip** 10
- **Card** `radius.lg` (16)
- **Hero container** `radius.xxl` (24)
- **Card shadow** `shadows.card`
- **Hero shadow** elevated teal-tinted shadow in `gameUi.shadow.hero`
- **Nav active glow** gold glow in `gameUi.shadow.navActiveGlow`
- **Screen horizontal padding** 16 (`spacing.lg`)
- **Section gap** 16, **card gap** 12, **dense list gap** 8

## Hub final layout

`HubReferenceHome` composes presentation modules in IA order:

1. `CenterHomeHeader` — day / rank / resource chips
2. `CenterCitySummaryCard` — compact city pulse
3. `CenterDailyRewardRoute` — daily reward teaser
4. `HubActiveTaskCardStack` — hero active operation
5. `CenterAdvisorCard` — max one primary Ece line
6. `CenterOperationFocusSection` — 2–3 compact focus cards
7. `CenterPortfolioSurface` — daily capacity portfolio (Day 8+ motion enter)
8. `CenterOperationSignalsSection` — compact signals
9. `CenterRecommendedPlanCard` — recommended plan
10. `CenterContinuationCardsSection` — oneMoreDay, rhythm, strategic, neglect, comeback, memory, follow-up (max 3)

## Report final layout

`EndOfDayReportView` uses `CompactInsightRow` for secondary notes:

- City memory, follow-up, positive comeback, district neglect/recovery, Day 8+ strategic, city rhythm
- Hero + primary impact unchanged
- One More Day card + Ece strategy line preserved

## Map final layout

Map polish remains presentation-only (no redesign):

- `MapHeroPanel` priority stack
- Max 5 motion markers, reduced-motion static badges
- District recovery / neglect / memory badges readable

## Operation flow

Existing operation flow screens share teal/mint card language via center + event tokens. Stage headers, compact cards, bottom CTA pattern unchanged at route level.

## Authority / Achievements

Progression surfaces use gold accent sparingly via existing `badgeShowcaseTheme` and authority chips.

## Bottom nav

`CreviaBottomTabBar` — Merkez / Operasyon / Harita / Başarılar / Raporlar. Routes unchanged. Active label uses `gameUi.colors.navActive`.

## Shared components

| Component | Path |
|-----------|------|
| CompactInsightRow | `src/components/game/CompactInsightRow.tsx` |
| PremiumSectionHeader | `src/components/game/PremiumSectionHeader.tsx` |
| SoftGameCard | `src/components/game/SoftGameCard.tsx` |

## Accessibility / reduced motion

- `numberOfLines` / `ellipsizeMode` on compact rows
- `accessibilityLabel` on insight rows and nav tabs
- `useCreviaReducedMotion` gates hub motion enter and map pulse

## Analyzer / verify

```bash
npm run verify:final-ui-visual-unification
npm run analyze:final-ui-visual-unification
```

Scenarios: Day 1 Hub, Day 8 Hub, Day 10 Hub mixed — card count, duplicate text, motion markers, accessibility gaps.

## Non-goals (unchanged)

- Core gameplay logic
- Persist / SAVE_VERSION / applyDecision / day pipeline
- Event selection rewrite, spawn, reward payout
- New navigation routes or native dependencies
