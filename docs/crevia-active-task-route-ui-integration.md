# Crevia Active Task Route UI Integration (Aşama 1)

## Ne çözüyor?

Active Task Route UI Integration, mevcut operasyon akışında (Planla → Yönlendir → Sahada → Harita) seçili görevin **mahalle, ekip/araç ve saha ilerleyişine** bağlandığını hissettiren **presentation-only** rota önizlemesi sağlar.

## Ne eklemez?

- Gerçek pathfinding / GPS / koordinat takibi
- Yeni gameplay action veya assignment etkisi
- Persist alanı veya SAVE_VERSION değişikliği
- Runtime event generation rewrite

Foundation katmanı `src/core/activeTaskRoutes/` altında; UI integration `activeTaskRouteUiPresentation.ts` ve yüzey binding’leri ile genişletildi.

## Route phase sistemi

UI phase’leri: `planned`, `dispatch_ready`, `en_route`, `on_site`, `resolving`, `completed`, `delayed`, `risk_watch`

Her phase: label, tone, iconKey, dispatch/field/map/report line intent, forbidden terms.

## Route step modeli

Max **4 step**:

1. Ekip hazırlanıyor
2. Araç hedef hattına yönlendi
3. Saha ekibi hedef çevresinde
4. Son kontrol rapora taşınacak

## Yüzey binding

| Yüzey | Bileşen | İçerik |
|-------|---------|--------|
| Yönlendir | `ActiveTaskRoutePreviewStrip` | Ekip, araç, hedef mahalle, status, max 1 resource warning |
| Sahada | `LiveOperationCard` + route line | Phase line, mini stepper |
| Harita | `MapOperationBottomPanel` | Max 1 compact route line; operation hint ile çakışma guard |

## Visibility kuralları

| Gün | Davranış |
|-----|----------|
| Day 1 | Gizli / sade |
| Day 2–3 | Compact dispatch/field line |
| Day 4+ | Standard route preview + steps |
| Post-pilot | Map route hint aktif olabilir |

Kriz overlay aktifken map route compact moda düşer.

## Verify

```bash
npm run verify:active-task-route
npm run verify:active-task-routes
```

## Kısıtlar

- SAVE_VERSION 23 sabit
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` dokunulmaz
- Assignment engine etkisi değişmez
