# Crevia — UI Density + Large Text + Accessibility Polish (Aşama 1)

## Amaç

Soft launch öncesi ana ekranlarda kart/satır yoğunluğunu kontrol etmek, küçük ekran ve büyük font senaryolarında taşmayı azaltmak, temel erişilebilirlik kurallarını güçlendirmek.

Ana oyuncu hissi: “Oyun zengin görünüyor ama boğmuyor.”

## Neden şimdi gerekli

Decision Impact, Tomorrow Risk, City Journal, Map Reaction, Resource Presence gibi presentation katmanları üst üste bindi. Mobil yoğunluk ve large text riski arttı.

## Kapsam

- `src/core/uiDensity/` audit modülü
- Hub card priority + carry-over visibility
- Large text guards (numberOfLines, flexShrink, minWidth)
- Temel accessibilityLabel / accessibilityRole
- Verify script

## Screen-by-screen density findings

| Ekran | Bulgu | Aksiyon |
|-------|-------|---------|
| Hub | Kart sırası post-pilot önceliğine göre düzenlendi | Main Operation → Tomorrow Risk → Carry-over → Ece → Resources → Journal |
| Hub | `showHubCarryOver` kullanılmıyordu | Koşullu PreviousDecisionEffectCard |
| Hub | OperationalResourcesCard mount edilmiyordu | `showOperationalResources` ile wiring |
| Result | Impact card sabit 2 satır | `maxVisibleLines` + compact 1 satır |
| Map | Panel/strip shrink eksikleri | minWidth/flexShrink eklendi |
| Social | Mevcut cap iyi | SOCIAL_PULSE_LAYOUT_GUARDS korundu |

## Large text guards

Beklenen pattern: `numberOfLines`, `flexShrink: 1`, `minWidth: 0`, chip maxWidth, CTA minHeight 44.

Güncellenen bileşenler: HubMainOperationFeelCard, HubTomorrowRiskStrip, HubOperationalResourcesCard, EventResultImpactExplanationCard, MapOperationBottomPanel, MapNeighborhoodStrip.

## Accessibility basics

- HubMainOperationFeelCard CTA → `accessibilityRole` + `accessibilityLabel`
- MapNeighborhoodStrip → district + reaction `accessibilityLabel`
- EventResultImpactExplanationCard → `accessibilityRole="summary"`
- Reaction dot yalnızca renk değil — `reactionIndicatorLabel` metin ile

Full VoiceOver/TalkBack matrix → V1.1 backlog.

## Priority / compact rules

Constants (`uiDensityConstants.ts`):

- `maxHubPrimaryCards = 4`
- `maxHubSecondaryStrips = 3`
- `maxMapBottomPanelLines = 6`
- `maxSocialMentionsDay1 = 3`
- `maxMapReactions = 4`

## Day-based density rules

| Gün | Mod |
|-----|-----|
| 1 | Maksimum sade, post-pilot hidden |
| 2-3 | Compact, max 2 secondary strip |
| 4-7 | Standard kontrollü |
| 8 | Main operation opening — strip tercih |
| 9+ | Kompakt strip/satır |

## Fixed issues

- Hub card priority reorder
- showHubCarryOver guard
- HubOperationalResourcesCard wiring
- HubTomorrowRiskStrip shouldShowAsCompact support line hide
- Large text guards across hub/map/result components
- Map reaction accessibility labels

## Remaining issues

- Full accessibility audit (VoiceOver/TalkBack)
- Tablet layout density pass
- HubAdvisorCard dedicated density polish
- OperationalResourcesDetailSheet tab accessibilityRole (minor)

## Non-goals

Gameplay, persist, SAVE_VERSION, applyDecision, yeni route, tema overhaul, tablet pass.

## Verify sonucu

```bash
npm run verify:ui-density
```

## Sonraki önerilen prompt

**UI Density Aşama 2:** Real-device large font QA matrix; Report section collapse; Social mention card dynamic type; OperationalResourcesDetailSheet tab a11y; tablet-friendly breakpoints V1.1.

## Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:map-ui
npm run verify:social-pulse-ui
npm run verify:operational-resource-presence
npm run verify:map-reactions
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:main-operation-feel
npm run verify:content-runtime-activation
npm run verify:event-result-ui
npm run verify:decision-result
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
```
