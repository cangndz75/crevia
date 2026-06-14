# Crevia Hub Portfolio Surface Lite

## Amaç

Daily Capacity Portfolio modelinin read-only çıktısını Merkez yüzeyinde kompakt bir kapasite seçimi olarak göstermek. Bu pass oyuncuya Day 8+ sonrasında "bugün 2 kapasite · 4 sinyal" hissini verir; Hub bilgi mimarisini, navigation yapısını veya core karar akışını değiştirmez.

## Hub Adapter

`src/features/hub/utils/centerDailyCapacityPortfolioPresentation.ts` içinde Hub state snapshot'ı `buildDailyCapacityPortfolio(input)` için read-only input'a çevrilir.

Adapter şu kaynakları okur:

- `gameState.events`
- `gameState.pilot.postPilotOperation`
- `operationSignals`
- Hub'da zaten üretilen tomorrow risk, bakım, ekip ve social pulse satırları

Adapter persist yazmaz, store shape değiştirmez ve karar uygulama akışına bağlanmaz.

## Surface Model

`CenterPortfolioSurfaceModel` şu alanları üretir:

- `summaryLine`
- `capacityLabel`
- `primaryTradeoffLine`
- max 3 `CenterPortfolioItemModel`
- max 1 `eceLine`
- güvenli `ctaRoute`
- accessibility label

Item copy karar dili kullanır: seçim, erteleme, izleme ve kapasite etkisi. Operation Signals tarafındaki risk/sinyal diliyle aynı exact title veya exact copy tekrar edilmez.

## Day Behavior

- Day 1: surface gizli kalır; kapasite baskısı gösterilmez.
- Day 2-7: sadece yeterli aktif operasyon ve izlenecek sinyal varsa "Bugünkü odak" olarak kompakt gösterilir.
- Day 8+: surface görünür; kapasite ve sinyal sayısı öne çıkar.
- Day 10+: max 3 item korunur; map kaynaklı item varsa kısa map line gösterilebilir.

## Hub Placement

`CenterPortfolioSurface` mevcut `HubReferenceHome` içinde Merkez akışı kartından sonra, kazanımlar bölümünden önce render edilir. Active Target hero, quick actions ve bottom nav değiştirilmedi.

## Ece Line Policy

`buildEcePortfolioLine(result)` çıktısı surface içinde tek küçük not olarak kullanılır. Advisor kartına ikinci kez bağlanmaz; böylece aynı portfolio tradeoff line iki yerde görünmez.

## Duplicate Guard

Surface builder, Operation Focus item title'larını, Operation Signals title/description satırlarını ve Recommended Plan body metnini avoid context olarak alır.

Guard kuralları:

- same exact title yok
- same exact line yok
- technical enum leak yok
- fake high-risk copy yok
- hidden portfolio item görünmez
- same kind/same district spam guard core modelde kalır

## CTA Policy

Enabled CTA sadece mevcut route varsa üretilir.

- Active/actionable item: `/events`
- Map recommended item: `/risks`
- Watch/deferred veya route'suz item: enabled CTA yok

Yeni navigation route eklenmedi.

## Accessibility And Small Screen

Component `minWidth: 0`, `flexShrink`, `numberOfLines` ve `ellipsizeMode` guard'larıyla küçük ekranlarda taşmayı sınırlar. Dekoratif ikonlar accessibility ağacından çıkarılır. CTA'lar `accessibilityState.disabled` kullanır.

## Verify And Analyzer

- `npm run verify:hub-portfolio-surface`
- `npm run analyze:hub-portfolio-surface`

Verify kapsamı Day 1 low-noise, Day 8+ görünürlük, max 3 item, CTA route safety, Ece max one, duplicate guard, technical enum guard, small screen guard ve persist/SAVE_VERSION/applyDecision/day pipeline sınırlarını kontrol eder.

## Değiştirilmeyen Sınırlar

- Persist yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- report/tomorrow/defer binding yok
- map UI yok
- navigation yok
- analytics/store/RevenueCat yok

## Sonraki Pass

Portfolio Defer Risk Binding Pass ayrı ele alınmalıdır. Bu pass report, tomorrow risk, end-of-day pipeline veya decision consequence logic'e bağlama yapmaz.
