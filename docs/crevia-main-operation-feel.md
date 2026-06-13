# Crevia — Day 8+ Main Operation Feel (Aşama 1)

## Amaç

Pilot Day 1–7 tamamlandıktan sonra oyuncunun Day 8+’da **“eğitim bitti, şimdi gerçek şehir operasyonu başladı”** hissini almasını sağlamak. Bu pass presentation-layer odaklıdır; gameplay engine, persist veya monetization davranışı değiştirilmez.

## Oyuncu problemi

Day 8+ oyuncuya ana operasyon başlangıcı yeterince güçlü hissettirilmiyordu. Pilot sonrası akış aynı kartların devamı gibi algılanabiliyordu.

## Pilot dili vs ana operasyon dili

| Pilot | Ana operasyon |
|-------|----------------|
| Öğrenme, ilk görevler | Kapsam büyüyor |
| Yönlendirme, sade açıklama | Şehir dengesi, mahalle önceliği |
| Tek mahalle odağı | Operasyon temposu, kaynak dengesi |
| | Rapor takibi, yarına taşan karar |

**İyi copy örnekleri:**
- “Pilot tamamlandı. Şehir operasyonu daha geniş mahalle kapsamıyla devam ediyor.”
- “Bugün Merkez, Cumhuriyet ve Sanayi hattı birlikte izleniyor.”

**Yasak copy:** premium, kilitli, satın al, kaçırma, fırsat, FOMO.

## Day 8 opening behavior

- `tone: opening`
- Başlık: **Ana Operasyon Başladı**
- Subtitle + scopeLine + cityStateLine görünür
- Hub hero kartı en açıklayıcı modda
- Ece satırı pilot sonrası kapsam genişlemesini vurgular

## Day 9+ compact behavior

- `tone: expanding | steady | watch | recovery`
- Başlık: **Ana Operasyon**
- Subtitle kısa; scopeLine ve günlük mahalle/tempo sinyali öne çıkar
- Hub kartı kompakt (max 2 satır)

## Light / full access copy rules

**Light (limited):**
- “Ana operasyon önizlemesi”
- “Sınırlı kapsam”
- Satış baskısı yok

**Full:**
- “Geniş mahalle kapsamı”
- “Çoklu mahalle takibi”
- Sezon hedefleri season card’da kalır (duplicate guard)

## Hub entegrasyonu

Day 8+ main operation feel artık ayrı `HubMainOperationFeelCard` yerine Merkez **Operasyon Odağı** modülüne akar:

- `HubScreen` — `buildMainOperationFeelFromStore` + `buildMainOperationFeelHubPresentation`
- `centerHomePresentation` — `mainOperationFeelPresentation` orchestrator input’u
- `centerOperationFocusPresentation` — feel `detailLine` operasyon odağı kartına merge
- `HubReferenceHome` — `CenterOperationFocusSection` + `presentation.operationFocus`
- `HubMainOperationFeelCard` — legacy/standalone bileşen; verify helper olarak kalabilir
- `HubMainOperationSeasonCard` ayrı kalır (season goals); feel duplicate etmez

Verify: `HubReferenceHome entegrasyonu` → CenterOperationFocusSection + presentation zinciri kontrol edilir.

## Report entegrasyonu

- `ReportMainOperationSeasonCard` — feel `reportLine` season kartına merge edilir
- Tomorrow risk / city echo ile duplicate guard uygulanır

## Map hint yaklaşımı

- `buildMainOperationFeelMapHint` → `mainOperationScopeHintLine`
- `MapScreen` + `mapUiPresentation` — overview panelde küçük kapsam hint’i
- Full dynamic map reaction yok; mevcut scope badge’lerle uyumlu

## Duplicate guard

Feel satırları şu sistemlerle tekrar etmez:
- ProgressionBridgeCard
- HubMainOperationSeasonCard / ReportMainOperationSeasonCard
- TomorrowRiskCard
- CityEchoBinding
- OperationSignalsCard
- DistrictOperationActionCard
- PostPilotOfferScreen / MainOperationPreview

## Content variety notu

Day 8+ event variety **Content Pack Runtime Activation Lite** ile güçlendirilmeli. Bu pass içinde content pack runtime activation yapılmadı; mevcut operation signal domain’lerinden küçük scope line üretilebilir.

## Non-goals

- Content Pack Runtime Activation Lite
- Event selection algoritması değişikliği
- Yeni gameplay engine
- `applyDecision` / `dayPipeline` değişikliği
- Persistence / `SAVE_VERSION` artışı
- Monetization davranışı değişikliği
- AI, Remote Config, Live-Ops
- Büyük UI redesign
- Yeni navigation route

## Verify sonucu

```bash
npm run verify:main-operation-feel
```

Kontroller: Day 1–7 kapalı, Day 8 opening, Day 9+ compact, light/full copy, scope/report/map/ece satırları, forbidden words, Hub/Report/Map entegrasyonu, SAVE_VERSION=23.

## Sonraki önerilen prompt

> **Day 8+ Main Operation Feel Pass Aşama 2 — Content Pack Runtime Activation Lite:** Day 8+ event domain çeşitliliğini content pack selection ile bağla; feel model `sourceSignals` içine pack hint ekle; hâlâ presentation-only, SAVE_VERSION bump yok.

## Modül yapısı

```
src/core/mainOperationFeel/
  mainOperationFeelTypes.ts
  mainOperationFeelConstants.ts
  mainOperationFeelModel.ts
  mainOperationFeelPresentation.ts
  verifyMainOperationFeelScenario.ts
  index.ts
scripts/verify-main-operation-feel.ts
```
