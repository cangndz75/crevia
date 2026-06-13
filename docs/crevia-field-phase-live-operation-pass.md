# Crevia — Field Phase Live Operation Pass

## Amaç

Sahada (Field) fazını boş bekleme veya sonuç öncesi ara ekrandan çıkarıp canlı operasyon takip deneyimine dönüştürmek. Oyuncu ekibin sahada ilerlediğini, seçili planın ve atama uyumunun akışı etkilediğini, timeline üzerinden operasyonun aktığını ve nadiren mikro kararların çıktığını hisseder.

## Eski bas-geç problemi

Önceki saha ekranı statik progress yüzdesi ve basit “Ekip sahada” metniyle sınırlıydı. Plan seçimi görünmüyordu, uyum etkisi yoktu, timeline adımları belirsizdi ve CTA hemen aktifti.

## Seçili plan / assignment effect field bağlantısı

`eventFieldPhasePresentation.ts`:

- `selectedPlanStrategyId` → “Dengeli Çözüm sahada” + saha-odaklı effect line
- `assignment.compatibilityLabel` → uyum etiketi ve kısa body (high/medium/low/unknown)

Planla ve Dispatch metinleri birebir tekrar edilmez; dil “sahada uygulanıyor” tonundadır.

## Timeline/progress modeli

5 adım: Ekip sahaya ulaştı → Rota kontrol edildi → Müdahale başladı → Alan dengeleniyor → Operasyon tamamlanıyor.

- `progressPercent` 0–100 clamp
- `currentStepId` net
- `helperText` operasyon durumuna göre güncellenir

## Auto-complete policy

`EventFieldPhase` lokal state:

1. **running** — adımlar sırayla ilerler (~1100ms toplam, adım başına ~220ms)
2. **paused_for_decision** — mikro karar varsa durur
3. **completed** — CTA “Sonucu Gör” aktif

Reduced motion: ~100ms, doğrudan tamamlanmaya yakın.

Timer cleanup unmount’ta yapılır; `setInterval` kullanılmaz.

## MicroDecision görünürlük kuralları

Mevcut `microDecision` runtime kullanılır; yeni generator yazılmadı.

- `getActiveMicroDecisions` + `relatedEventId` eşleşmesi
- Day 1 / first-ten-minutes gizleme korunur
- Veri yoksa kart render edilmez (fake üretilmez)
- Çözülünce timeline devam eder

## Ece field yorumu

`buildEventFieldAdvisorComment` — gün, uyum, plan ve mikro karar bağlamına göre 1–2 cümle. Dispatch Ece metnini tekrar etmez.

## Plan strategy → decision/result bridge

- `selectedPlanStrategyId` field presentation’a taşındı
- `effectiveSelectedId` / `handleApplyPress` → `applyDecision` → `/events/decision-result` akışı korundu
- Kullanıcı kararı override edilmez; dispatch’teki `suggestDecisionIdForPlanStrategy` köprüsü geçerliliğini korur

**Result Phase Impact Reveal Pass’te `applyDecision` binding audit yapılacak** — balance motoru bu pass’te değiştirilmedi.

## Motion / reduced motion

`operationMotionTokens.ts`:

- `OPERATION_MOTION_FIELD_PROGRESS_MS` (1100)
- `OPERATION_MOTION_FIELD_REDUCED_MS` (100)
- Adım reveal, completion highlight, mikro karar reveal süreleri

## Verify

```bash
npm run verify:operation-field-live
```

## Sonraki prompt

**Result Phase Impact Reveal Pass** — sonuç ekranı impact reveal, applyDecision binding audit, şehir etkisi okunabilirliği.
