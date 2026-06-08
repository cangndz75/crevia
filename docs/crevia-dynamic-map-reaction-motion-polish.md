# Crevia — Dynamic Map Reaction V1 Motion Polish (Aşama 1)

## 1. Amaç

Dynamic Map Reaction Lite sistemine **presentation-only** motion katmanı eklemek. Oyuncu kararlarının haritada küçük ama net görsel tepkiler oluşturduğunu hissettirmek — gameplay, persist, event generation veya map runtime davranışını değiştirmeden.

**Oyuncu hissi:** “Şehir sadece kartlarda değil, haritada da nefes alıyor. Mahalleler kararlarıma tepki veriyor.”

## 2. Neden şimdi gerekli

Map Reaction Lite metin ve statik vurguları tamamladı; bir sonraki doğal adım harita üzerinde hafif animasyonla “premium mobil oyun” hissi vermek. Full Living Map değil — kontrollü, gün bazlı, performans dostu bir polish pass.

## Doküman kontrolü (checked)

| Kaynak | Durum | Not |
|--------|-------|-----|
| [Expo SDK v54](https://docs.expo.dev/versions/v54.0.0/) | **checked** | `expo ~54.0.34`, RN 0.81.5; yeni dependency eklenmedi |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | **checked** | Projede `react-native-reanimated ~4.1.1` mevcut; `usePulseAnimation`, `MapPin` pattern'i izlendi |
| [RN Accessibility / reduced motion](https://reactnative.dev/docs/accessibility#reduce-motion) | **checked** | `AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged`; web'de `prefers-reduced-motion` fallback |
| Mevcut animasyon pattern'leri | **checked** | `src/core/animations/usePulseAnimation.ts` — limited repeat, cancel on unmount |

## 3. Motion model

`MapReactionMotionModel` (`src/core/mapReactionsMotion/`):

- `visibility`: hidden \| subtle \| standard \| highlighted
- `selectedDistrictMotion`, `globalMotionCues`
- `bubbleCue`, `journalCue`, `operationScopeCue`
- `reducedMotionMode`, `maxAnimatedCues`, `animatedCueCount`
- `sourceSignals`, `duplicateKey`

## 4. Reaction kind → motion mapping

| Reaction kind | Motion | Görsel |
|---------------|--------|--------|
| trust_pulse | trust_ping | Soft mint pulse |
| risk_ring | risk_ring | Amber ring, sakin |
| recovery_glow | recovery_glow | Soft green glow |
| social_bubble | social_bubble_pop | Mini bubble hint |
| route/container/team/vehicle markers | resource_marker_breathe | Subtle breathe |
| resource_fatigue_marker | risk_ring (low) | Warning ring |
| crisis_watch_ring | risk_ring (high) | Amber ring |
| operation_scope_marker | operation_scope_ring | Day 8+ geniş halka |
| journal_trace | journal_trace_flash | “Günlüğe işlendi” flash, max 1 |
| content_pack_marker | soft_pulse / static | Teknik pack adı yok |
| active_route_hint | static_indicator | GPS/rota çizimi iddiası yok |
| fallback | static_indicator | Güvenli fallback |

## 5. Day-based visibility

| Gün | Visibility | Max animated |
|-----|------------|--------------|
| 1 | hidden / static | 0 |
| 2–3 | subtle | 1 (seçili mahalle) |
| 4–7 | standard | 2 |
| 8+ | standard/highlighted | 3 |
| Full main operation | highlighted | 3 (living map yok) |

## 6. Reduced motion / accessibility

- `useReduceMotionPreference()` — `AccessibilityInfo` + web `prefers-reduced-motion` fallback
- Reduced motion açıkken tüm cue'lar `static_indicator`, `shouldAnimate: false`
- Her cue'da `accessibilityLabel` ve `reducedMotionFallbackLabel`
- Risk ring: “izleme sinyali” — panik/alarm dili yok
- Renk tek başına anlam taşımıyor; metin/label destekli

## 7. UI integration

| Dosya | Rol |
|-------|-----|
| `MapScreen.tsx` | Motion model üretimi, props geçişi |
| `CityOverviewMap.tsx` | `MapReactionMotionLayer` SVG overlay |
| `CityMapCard.tsx` | `MapReactionMotionHints` (journal/social) |
| `MapNeighborhoodStrip.tsx` | Mevcut reaction strip + accessibility (değişmedi) |
| `MapOperationBottomPanel.tsx` | Metin duplicate guard korunuyor |

Mint stroke highlight fallback olarak kalır. Motion props yoksa eski UI çalışır.

## 8. Performance guard

- `maxAnimatedCues` modelde enforced
- Reanimated shared values, izole bileşenler (`MapReactionMotionLayer`, `MapReactionMotionHints`)
- `setInterval` yok; `useEffect` cleanup ile `cancelAnimation`
- Çoklu mahalle aynı anda animate edilmez (cap + seçili mahalle önceliği)

## 9. Duplicate guard

- Journal trace max 1
- Social bubble max 1
- Resource marker breathe max 1 animated
- `existingTextLines` ile journal/social/resource metin çakışması suppress
- Görsel cue varken panel metni duplicate guard ile bastırılabilir

## 10. Copy guard

Yasak: GPS, canlı takip, plaka, gerçek konum, rota çiziliyor, panik, alarm, pack, metadata, runtime, premium, kilitli.

Motion etiketleri: Harita tepkisi, Toparlanma izi, Risk halkası, Sosyal sinyal, Saha kapasitesi, Günlük izi, Operasyon kapsamı.

## 11. Non-goals

- GPS / canlı takip, tekil araç/personel, gerçek rota/pathfinding, heatmap, full living map
- Map data model rewrite, event generation / applyDecision / dayPipeline / persist değişikliği
- SAVE_VERSION artırımı, content pack full activation, vehicle maintenance / team specialization runtime
- Büyük map redesign, yeni route, fake PASS

## 12. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `npm run typecheck` | PASS |
| `npm run verify:map-reaction-motion` | 45 PASS, 0 FAIL |
| `npm run verify:map-reactions` | 52 PASS, 0 FAIL |
| `npm run verify:map-ui` | PASS |
| `npm run verify:district-report-card` | 71 PASS |
| `npm run verify:city-journal` | 60 PASS |
| `npm run verify:operational-resource-presence` | 51 PASS |
| `npm run verify:reward-comeback` | PASS |
| `npm run verify:advisor-relationship` | PASS |
| `npm run verify:main-operation-feel` | 50 PASS |
| `npm run verify:ui-density` | PASS |
| `npm run verify:first-10-minutes` | PASS |
| `npm run verify:post-pilot-ux` | PASS |
| `npm run verify:release-candidate` | blocked (beklenen); evidence verified=0 |
| `npm run verify:manual-launch-tracker` | PASS (public blocked beklenen) |
| `npm run verify:full-loop` | PASS |
| `npm run verify:full-ux-flow` | PASS |

Public launch **blocked**. Evidence verified **0**. SAVE_VERSION **23** (değişmedi). Fake PASS yok.

## 13. Sonraki önerilen prompt

> **Dynamic Map Reaction V2 Motion Polish Aşama 2:** MapNeighborhoodStrip kart pulse, tap-to-expand social bubble, journal trace strip sync, Reanimated worklet optimizasyonu ve gerçek cihaz motion QA.

## 14. Commands

```bash
npm run typecheck
npm run verify:map-reaction-motion
npm run verify:map-reactions
npm run verify:map-ui
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:operational-resource-presence
npm run verify:reward-comeback
npm run verify:advisor-relationship
npm run verify:main-operation-feel
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:full-loop
npm run verify:full-ux-flow
```
