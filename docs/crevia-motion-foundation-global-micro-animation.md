# Crevia Motion Foundation + Global Micro Animation - Aşama 1

## 1. Amaç

Crevia'nın ana yüzeylerine güvenli, performans dostu ve erişilebilir bir mikro animasyon dili eklemek. Bu pass yeni gameplay sistemi değildir; karar mantığı, runtime, persist, store/evidence ve navigation akışı değişmez.

## 2. Neden şimdi gerekli

Dynamic Map Reaction V1 motion sonrası harita daha canlı hissediyor. Hub, onboarding, decision result, report ve social yüzeyleri aynı dili paylaşmazsa ürün hissi dengesiz kalır. Amaç küçük, tutarlı ve sınırlı motion feedback sağlamaktır.

## 3. Dependency / docs check

- Expo SDK v54 checked: https://docs.expo.dev/versions/v54.0.0/
- Reanimated existing dependency checked: `react-native-reanimated ~4.1.1`
- Reduced motion pattern checked: existing map motion uses `AccessibilityInfo` and `reduceMotionChanged`
- New dependency: none

## 4. Motion token sistemi

Durations:

- instant: 0
- fast: 120
- base: 180
- medium: 260
- slow: 360
- emphasis: 480

Delays:

- none: 0
- short: 40
- stagger: 60
- medium: 100

Kinds include screen enter, card enter, compact card enter, line appear, chip appear, CTA press, selection press, result emphasis, report section enter, onboarding step transition, soft pulse, glow soft and reduced static.

## 5. Reduced motion model

`buildMotionAccessibilityModel` returns entrance, press scale, pulse, glow, stagger and static fallback flags. When reduced motion is true:

- pulse and glow are disabled
- press scale is disabled
- entrance motion falls back to static
- information is not carried only by animation
- API unavailability does not crash

## 6. Reusable motion primitives

Added:

- `CreviaAnimatedCard`
- `CreviaAnimatedPressable`
- `CreviaAnimatedChip`
- `CreviaAnimatedLine`
- `CreviaMotionView`
- `CreviaSoftPulseDot`
- `useCreviaEntranceMotion`
- `useCreviaPressMotion`
- `useCreviaReducedMotion`

## 7. Hub integration

`HubReferenceHome` now wraps:

- Main Operation Feel: `card_enter`, highlighted only for Day 8+
- Tomorrow Risk: `compact_card_enter`
- Advisor line/card: `line_appear`

Hub card order stays unchanged. Day 1 stays minimal. Resource and Journal wrappers are static to keep the Hub cap at max 3 animated items.

## 8. DecisionResult integration

`DecisionResultScreen` now uses:

- Result hero: `result_emphasis`
- Decision Impact card: `card_enter`
- Reward/Comeback chip: `chip_appear`
- Primary and secondary CTA: `CreviaAnimatedPressable`

No confetti, no economy reward implication, and CTA visibility is unchanged.

## 9. Report integration

`EndOfDayReportView` now uses:

- Decision impact report line: `line_appear`
- City Journal line: `chip_appear`
- Reward/Comeback line: `chip_appear`

The visible report motion cap is 3. Existing report compact mode and secondary line guards stay in place.

## 10. Onboarding integration

`CreviaOnboardingScreen` wraps continuation cards with `onboarding_step_transition`. Swipe remains disabled, step gate logic remains unchanged, and presentation district mapping remains unchanged.

## 11. Social light integration

`MentionFeedCard` uses compact card enter only for the first two mentions. Mention count, truncation and dynamic type guards remain unchanged.

## 12. Map V1 compatibility

This pass does not implement Map Motion V2. Existing `MapReactionMotionLayer` and `MapReactionMotionHints` stay in place. Motion foundation does not inject new map pulse behavior.

## 13. Motion density rules

- Day 1: minimal
- Day 2-3: compact
- Day 4-7: standard
- Day 8+: one highlighted main-operation card, then standard
- Hub: max 3 animated items
- Decision Result: max 2 emphasis items
- Report: max 3 visible animations
- Social: max 2 mention animations
- Map: V1 only

## 14. Performance guard

- No `setInterval`
- No unbounded `withRepeat` in new motion primitives
- Reduced motion guard is present
- No unbounded list animation
- Hub, Report and Social have source-level caps
- No new dependency

## 15. Accessibility guard

- Pressable role and label are preserved
- Reduced motion static fallback exists
- Motion is never the only information channel
- Chip and line text remains visible
- VoiceOver/TalkBack manual QA pending

## 16. Non-goals

- No gameplay system
- No large UI redesign
- No new route
- No persist shape change
- No `SAVE_VERSION` bump
- No `applyDecision` change
- No `dayPipeline` change
- No event generation change
- No IAP/paywall behavior change
- No store/evidence/manual blocker change
- No fake PASS
- No Map Motion V2

## 17. Verify sonucu

Expected:

- `verify:motion-foundation` exits 0
- public launch remains blocked
- evidence verified remains 0
- protected core files remain unchanged
- typecheck passes

## 18. Sonraki prompt

Motion Foundation Aşama 2: Profile ve secondary Hub quick action surfaces için aynı primitives ile dar kapsamlı polish yap; Map Motion V2 veya gameplay runtime değişikliği yapma.

## 19. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:motion-foundation
npm run verify:map-reaction-motion
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:onboarding-continuation
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:event-result-ui
npm run verify:map-ui
npm run verify:map-reactions
npm run verify:reward-comeback
npm run verify:advisor-relationship
npm run verify:post-pilot-ux
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:full-loop
npm run verify:full-ux-flow
```
