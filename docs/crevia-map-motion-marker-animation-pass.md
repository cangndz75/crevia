# Crevia — Map Motion & Marker Animation Pass

## Amaç

Harita yüzeyini statik bir durum ekranı olmaktan çıkarıp; aktif operasyon, mahalle sinyali, rota baskısı, şehir hafızası, toparlanma fırsatı ve Day 8+ stratejik odakları görsel olarak daha canlı hissettiren kontrollü, performanslı ve erişilebilir marker/motion sistemini kurmak.

Oyuncu şunu hissetmeli: **“Harita yaşıyor.”**

## Map motion policy

- Presentation-time only; store/persist alanı yok.
- Maksimum **5 animasyonlu marker**, **1 strong**, **2 medium**.
- Aktif operasyon varsa her zaman primary marker.
- Reduced motion açıksa pulse/glow kapalı; static emphasis kullanılır.
- Technical enum UI metninde görünmez.

## Marker motion model

`MapMarkerMotionModel` alanları:

- `kind`: active_operation, route_pressure, district_neglect, district_recovery, city_memory_trace, positive_opportunity, resource_pressure, container_pressure, social_trust, safe_watch, idle
- `intensity`: none | subtle | medium | strong
- `pulse`, `glow`, `routeHint`
- `accessibilityLabel`, `sourceIds`, `sourceKinds`, `priority`

Ana builder: `buildMapMotionPresentation()` — `src/features/map/utils/mapMotionPresentation.ts`

## Source mapping

| Kaynak | Motion kind |
|--------|-------------|
| ActiveOperationMapBinding | active_operation, routeHint |
| MapGameplayBinding | active_operation, district_neglect, resource_pressure, city_memory_trace, route_pressure |
| Day8StrategicContent map candidate | map_priority_focus → active_operation / safe_watch, neglect/recovery/positive/route/container/social/memory |
| DistrictNeglectRecovery | district_neglect, district_recovery, route_pressure, container_pressure, social_trust |
| PositiveComeback | district_recovery, positive_opportunity, route/container/social/memory |
| CityMemoryVisibility | city_memory_trace |
| ActiveTaskRoute | route_pressure + routeHint |
| MapPresence | safe_watch |

## Priority policy

1. Active operation marker
2. Day8 strategic map candidate
3. DistrictNeglectRecovery high/strong
4. PositiveComeback opportunity
5. CityMemoryVisibility map trace
6. Route/resource/container/social pressure
7. ActiveTaskRoute / presence
8. fallback idle

Aynı district’te birden fazla source merge edilir; sourceIds tekrarsız kalır.

## Animation behavior

- Stack: React Native Reanimated (mevcut proje bağımlılığı).
- `MapDistrictMotionOverlay`: pulse ring, soft glow, route dash badge, kind badge.
- `MapOperationMarker`: motionModel + reducedMotion desteği.
- Infinite loop cleanup: useEffect + cancelAnimation.
- Layout thrash yok; motion model useMemo ile build edilir.

## Reduced motion

- `reducedMotion: true` → pulse false, glow false, static ring/badge.
- `suppressAnimationReason: 'reduced_motion'`.
- Screen reader spam yok; district label accessibilityLabel motion model’den gelir.

## Accessibility

- Her marker’da Türkçe accessibilityLabel.
- Renk tek başına gösterge değil; badge/shape/label birlikte.
- Tap target küçültülmedi.

## Performance guard

- Max 5 animated marker
- Max 1 strong
- Max 2 medium
- Stable marker keys
- Ağır shadow yok

## Visual language

| Kind | Görsel |
|------|--------|
| active_operation | dark teal pulse + Aktif badge |
| route_pressure | route dash badge |
| district_neglect | amber pulse |
| district_recovery / positive_opportunity | mint/gold glow |
| city_memory_trace | archive dot + Iz badge |
| resource/container/social | compact badge, hafif animasyon |

Renkler: `mapUi` token’ları (teal, gold, riskHigh, mint).

## Analyzer / verify kapsamı

```bash
npm run verify:map-motion
npm run analyze:map-motion
```

Senaryolar: idle, active operation, route pressure, neglect high, recovery strong, memory trace, positive comeback, mixed 7 source, reduced motion, duplicate district merge.

## Değiştirilmeyen sınırlar

- CityRhythm core yok
- event selection rewrite yok
- event spawn yok
- persist yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- execution yok
- reward payout yok
- map redesign yok
- yeni native dependency yok

## Sonraki prompt

- **Gameplay Loop QA**
