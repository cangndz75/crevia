# Memory & Follow-up Visibility Wiring Lite

## Amaç

City Memory / Story Chain Visibility ve Follow-up Action Content Pack modüllerini production presentation akışına **read-only** ve güvenli şekilde bağlamak. Bu pass yeni runtime davranışı, execution, persist veya day pipeline eklemez.

Oyuncu hissi:

> Şehir hafızası sadece modelde durmuyor; raporda, devam odağında ve Ece yorumunda gerçekten görünüyor. Dün bıraktığım iz bugün küçük bir takip hamlesine dönüşebiliyor.

## Neden wiring gerekli?

Önceki pass'ler modelleri ve presentation helper'larını üretti; ancak Hub / Report / Continuation / Ece caller'ları opt-in kaldı. Bu pass gerçek `gameState` ve hub/report snapshot kaynaklarını tek bir adapter üzerinden toplayıp yüzeylere dağıtır.

## Build order

`buildMemoryFollowUpPresentationContext` sırası:

1. `DailyCapacityPortfolio`
2. `PortfolioDeferRisk`
3. `OneMoreDayRetention`
4. `CityMemoryVisibility`
5. `FollowUpActions`
6. `EceStrategyLines`

## CityMemory production wiring

- Adapter: `src/features/shared/utils/memoryFollowUpPresentationContext.ts`
- Kaynaklar: decision consequence threads, carry-over, butterfly, city archive, district memory, story chains, portfolio defer, one-more-day, hub/report satırları
- Caller'lar: `centerHomePresentation`, `EndOfDayReportView`, `endOfDayReportPresentation`, `centerContinuationCardsPresentation`

## FollowUpActions production wiring

- Aynı context builder içinde `cityMemoryVisibilityResult` ile beslenir
- Caller'lar: Report (`followUpActionHint`), Hub continuation (`follow-up-action-continuation`), Ece advisor (`buildEceFollowUpActionLine`)

## Report integration

`buildEndOfDayReportViewModel` context'ten çözümler:

- `cityMemoryNote` — max 1, `buildReportCityMemoryNote`
- `followUpActionHint` — max 1, `buildPrimaryFollowUpActionCard` + duplicate guard

Öncelik: OneMoreDay → Ece → CityMemory → FollowUp

## Hub continuation integration

`buildCenterContinuationCards` production input:

- `city-memory-continuation` — max 1
- `follow-up-action-continuation` — max 1, yalnızca görünürlük; route `/reports`

Day 1: follow-up yok. Day 2+: kaynak varsa memory. Day 8+: retention + memory + follow-up arasında duplicate guard.

## Ece integration

`centerAdvisorPresentation` production `eceStrategyLines` ve `followUpActions` alır. `buildEceHubAdvisorLine` + `buildEceFollowUpActionLine` reason zincirinde; max 1 strateji hattı.

## Duplicate guard

- Aynı `sourceId` kart içinde tekrar etmez
- Aynı exact line Report'ta OneMoreDay / Ece / CityMemory / FollowUp arasında çıkmaz
- City memory: iz/hafıza dili; follow-up: aksiyon odaklı copy; Ece: yorum/strateji dili

## Follow-up visibility vs execution

**İzinli:** hint, continuation önerisi, Ece satırı, presentation card model  
**Yasak:** Tamamla/Gönder, state mutation, route execution, reward, event spawn

CTA yalnızca mevcut güvenli rotalar: `/`, `/reports`, `/events`, `/map`

## Analyzer / verify

- `npm run analyze:memory-followup-wiring`
- `npm run verify:memory-followup-wiring`

Senaryolar: Day 1 low-noise, Day 3 consequence, Day 8 defer/memory/follow-up, Day 10 story chain, duplicate source, low data, authority permission.

## Değiştirilmeyen sınırlar

- execution yok
- persist / SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- Hub / Report / Map UI redesign yok

## Sonraki prompt

**Positive & Comeback Event Pass** — comeback sinyallerinin runtime ve event seçimine bağlanması.
