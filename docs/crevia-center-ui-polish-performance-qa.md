# Crevia — Merkez UI Polish & Performance QA

Merkez paketinin final kalite pass’i: yoğunluk, mobil okunabilirlik, motion, erişilebilirlik ve performans.

## Modül hiyerarşisi

1. Header → 2. Merkez Özeti → 3. Günlük Ödül → 4. **Aktif Hedef (hero)** → 5. Ece → 6. Operasyon Odağı → 7. Operasyon Sinyalleri → 8. Hızlı İşlemler → 9. Önerilen Plan → 10. Mini Devam

Aktif Hedef ana aksiyon; alt modüller destekleyici ve compact.

## Density kuralları

| Modül | Limit |
|-------|-------|
| Header chips | 3 |
| CitySummary metrics | 3 |
| OperationSignals | 3 |
| QuickActions | 4 |
| ContinuationCards | 3 |
| RecommendedPlan steps | 3 |
| Hub motion enter | 3 (index 0–2) |

Destek section margin: `CENTER_SUPPORT_SECTION_MARGIN` (14px). Body gap: 14px (compact 12px).

## Typography

- Başlık 1 satır (`numberOfLines`)
- Body/helper max 2 satır
- Min body font 11px
- `sanitizeCenterDisplayText` güvensiz metinleri filtreler

## Motion QA

- Day 1: `day1_minimal` — enter animasyonu kapalı
- `reducedMotion` → `CenterMotionEnter` disabled
- Hub cap: max 3 animated card enter
- CTA pulse: 1–4 tekrar, sonsuz loop yok
- Yeni animasyon eklenmedi

## Accessibility

- `accessibilityLabel` zorunlu (presentation katmanı)
- Decorative illustration `accessibilityElementsHidden`
- Disabled CTA: `accessibilityState.disabled`
- Touch target: hero CTA min 50px; quick action tile min 96px

## Performance

- `buildCenterHomePresentation` HubScreen’de `useMemo` ile sarılı
- `auditCenterHomePresentation` yalnızca verify’de çalışır
- `hubMotionEnabled` HubReferenceHome’da `useMemo` + `reducedMotion` bağlı

## Day 1 / completed / calm

- **Day 1:** tek açık quick action, max 3 focus teaser, teaching plan
- **Completed:** `Sonucu Gör` CTA, claimed reward
- **Calm:** sakin sinyal tonu, fake urgent yok

## Manuel QA checklist

- [ ] iPhone SE / küçük Android (360 genişlik)
- [ ] Font scale büyük (sistem ayarı)
- [ ] Day 1 akışı
- [ ] Day 2–3 normal
- [ ] Completed hedef günü
- [ ] Sakin gün (sinyal yok)
- [ ] Urgent sinyal günü
- [ ] Reduced motion açık
- [ ] Disabled CTA’ya basma (crash yok)
- [ ] VoiceOver / TalkBack kısa tur

## Verify

```bash
npm run verify:center-ui-polish
```

Tüm Merkez verify komutları ile birlikte çalıştırılmalı.

## Bilinen kalan manuel maddeler

- Gerçek cihazda scroll uzunluğu hissiyatı
- Android font scale 1.3+ ile ödül rotası taşması
- Authority chip’lerin district expansion ile çakışması (scroll footer)
