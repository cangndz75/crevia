# Crevia — Result Phase Impact Reveal Pass

## Amaç

Operasyon akışının **Sonuç** fazını sert route geçişiyle açılan düz bir özet sayfasından çıkarıp, oyuncunun kararının şehirde iz bıraktığını hissettiren sıralı bir **impact reveal** deneyimine dönüştürmek.

Bu pass yalnızca Sonuç ekranına odaklanır. İncele, Planla, Yönlendir ve Sahada fazları değiştirilmedi.

## Eski problem

`DecisionResultScreen` önceden tüm metrikleri, ödül hero’sunu ve CTA’ları aynı anda gösteriyordu. Oyuncu “ne oldu?” sorusuna anında cevap alıyordu ama kararın şehir üzerindeki etkisi dağınık ve rapor benzeri kalıyordu.

## Yeni akış

1. Sonuç ekranı açılır (`/events/decision-result`, `applyDecision` akışı değişmedi).
2. **Hero outcome** hemen görünür (Operasyon tamamlandı / Kısmi başarı / Risk kontrol altında vb.).
3. **Impact reveal** kartları sırayla açılır (120–180 ms stagger, toplam ~1500 ms).
4. Opsiyonel **seçili plan** strip’i.
5. **Ece** kısa sonuç yorumu (reveal tamamlanınca).
6. **Final actions**: Merkez’e Dön (birincil), Raporu Aç (ikincil), gerekirse Yetkileri Gör.

## Presentation modeli

`src/features/events/utils/eventResultRevealPresentation.ts`

- `EventResultRevealPresentation` — ekranın tek veri kaynağı
- `buildEventResultRevealPresentation` — `DecisionResultSnapshot` + opsiyonel carry-over / authority / plan context
- `auditEventResultRevealPresentation` — verify senaryosu için güvenlik denetimi

### Reveal item sırası (deterministik)

| Sıra | kind |
|------|------|
| 1 | task |
| 2 | resource |
| 3 | district_trust |
| 4 | social_pulse |
| 5 | tomorrow_risk |
| 6 | xp / badge / authority (ilk bulunan) |
| 7 | carry_over / butterfly / city_memory |

Kurallar: min 3, max 7 kart; kind duplicate yok; fake unlock/butterfly üretilmez; veri yoksa neutral fallback (`Sonuç kaydı`).

## Outcome summary

`buildOutcomeSummary` gerçek snapshot’tan türetilir:

- `resultTone`, metrik deltaları, risk satırları
- Fallback modda: “Sonuç kayda alındı”
- `outcomeBand`: success | partial | mixed | risk | unknown

## Kaynak / mahalle / sosyal / yarın riski

- **Kaynak**: bütçe/morale/araç-personel subsystem; band copy, fake maliyet yok
- **Mahalle**: `publicSatisfaction` delta veya bölge adı; trust verisi yoksa neutral “bölge etkisi izleniyor”
- **Sosyal nabız**: `subsystemOutcomes.social` veya calm fallback
- **Yarın riski**: `butterflyHint`, `dailyPriorityImpact`, `riskLines` veya calm “Yarın için ek baskı görünmüyor”

## Rozet / yetki / carry-over

- XP: `dailyGoalImpact`
- Rozet: `highlightLines` içinde “rozet” geçen satır (unlock değil, ilerleme)
- Yetki: ekrandan gelen `authorityProgressLine`
- Carry-over: `buildResultCarryOverMemory` özeti
- Butterfly: yalnızca `snapshot.butterflyHint` varsa

## selectedPlanStrategyId audit

Plan → Dispatch → Field boyunca taşınan strateji, result’a **route params ile değil** session store üzerinden bağlanır:

- `useGameStore.lastOperationPlanStrategyId` (persist edilmez)
- `EventDetailDecisionScreen.applySelectedDecision` içinde `setLastOperationPlanStrategyId` çağrılır
- Result ekranı bunu `selectedPlanContext` olarak gösterir (ör. “Dengeli Çözüm sonucu”)
- Balance / `applyDecision` semantiği değişmedi

## Ece result yorumu

`buildEventResultAdvisorComment`:

- Gün 1: öğretici ton
- Carry-over/butterfly varsa: şehir hafızası
- Risk varsa: yarın uyarısı
- Başarı: sahada karşılık buldu
- Field fazı yorumu birebir tekrar edilmez

## CTA güvenliği

`buildFinalActions`:

- `back_to_hub` → `/` (enabled)
- `open_report` → `/reports` (enabled)
- `view_authority` → `/profile` (yalnızca authority satırı varsa)
- `next_day` → yalnızca `showNextDayAction` true ise, varsayılan disabled

## Motion / reduced motion

`operationMotionTokens.ts`:

- Stagger: 150 ms (`OPERATION_MOTION_RESULT_STAGGER_MS`)
- Toplam: 1500 ms
- Reduced: 100 ms, stagger 0 — tüm kartlar anında

`DecisionResultScreen`: `setTimeout` ile stagger, unmount cleanup; `setInterval` yok.

## UI bileşenleri

`src/features/events/components/result/ResultRevealMotionSections.tsx`

- `ResultOutcomeHero`
- `ResultRevealItemCard`
- `ResultPlanContextStrip`
- `ResultAdvisorCommentCard`
- `ResultFinalActions`

Mevcut impact explanation, domain focus, carry-over hint, systems echo, map summary korunur.

## Verify

```bash
npm run verify:operation-result-reveal
```

Kritik verify’lerin bozulmaması gerekir: `verify:event-result-ui`, `verify:operation-field-live`, `verify:operation-dispatch-motion`, `verify:operation-plan-ui`, `verify:operation-inspect-ui`, `verify:dispatch-field-ui`, `verify:motion-foundation`, `verify:main-operation-feel`.

## Sonraki adım

**Operation Flow Performance & QA** — tüm operasyon fazlarının birleşik performans profili, gerçek cihaz stagger hissi, erişilebilirlik turu ve uçtan uca pilot QA.
