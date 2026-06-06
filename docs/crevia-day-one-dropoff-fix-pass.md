# Crevia Day 1 Drop-off Pre-Launch Fix Pass

## Amaç

Soft launch öncesi Day 1 ilk 10 dakika akışında oyuncunun düşmesine neden olabilecek friction, metin yoğunluğu, CTA belirsizliği, layout taşması ve erken sistem karmaşasını azaltmak.

Bu pass **gerçek post-launch drop-off verisi kullanmaz** — soft launch henüz yapılmadı. Amaç pre-launch Day 1 drop-off **risk azaltımı**dır.

**Verify:** `npm run verify:day-one-dropoff-fix`

**No-New-System Freeze:** Fix-only scope — yeni sistem, event, route veya SAVE_VERSION yok.

---

## Day 1 riskleri

| Risk | Azaltım |
|------|---------|
| Hub kart yoğunluğu | Max 2 featured; quick prep / sinyaller / open-ended gizli |
| CTA belirsizliği | Planı Onayla, Kısa Öneri Al, Önerilen Atamayı Onayla, Sonucu Gör |
| Erken advanced sistem | Operation era, story chain, crisis, district ops Day 1 gizli |
| Result/report yoğunluğu | Result echo 0 satır; report systems max 1 learning satırı |
| Yasak copy | Sezon finali, premium, panik, başarısız oldun, GPS iddiası vb. |
| DevTools görünürlüğü | Day 1'de devtools bastırılır |

---

## İncelenen yüzeyler

- Hub (Ece welcome, learning timeline, daily plan)
- Event inspect / plan / dispatch / field / result
- End-of-day report Day 1 learning mode
- Open-ended / operation era / story chain / district operation hints
- Layout overflow guard (numberOfLines, flexShrink, minWidth)

---

## Yapılan küçük düzeltmeler (fix-only)

- Hub Day 1: QuickPreparationStrip, OperationSignalsCompactCard, open-ended kart suppress
- Hub plan kartı: kısa Day 1 copy + tek satır açıklama
- DevTools: Day 1 suppress (`suppressDevTools`)
- Copy: guideCardLine, planSupport kısaltma; genişletilmiş forbidden word listesi
- Result UI: punitive copy guard (`başarısız oldun`, `yanlış karar`)
- firstTenMinutes: yeni advanced system hide keys (operation_era, story_chain, vb.)

---

## Yapılmayanlar

- Yeni tutorial sistemi veya onboarding screen
- Yeni Hub card sistemi veya büyük redesign
- Yeni analytics event / SDK
- SAVE_VERSION bump / persist shape değişikliği
- Event generation / applyDecision / dayPipeline değişikliği
- IAP flow değişikliği

---

## Real device playtest dikkat notları

1. Day 1 Hub'ta yalnızca Ece + öğrenme timeline + plan grid görünmeli
2. "Gün 2" quick prep kartları Day 1'de görünmemeli
3. Operasyon sinyalleri kartı Day 1'de görünmemeli
4. İlk olay akışı: tek net CTA zinciri takip edilebilmeli
5. Rapor: kısa advisor + max 1 systems learning satırı
6. Sonuç ekranı: deep system echo görünmemeli

Checklist: `docs/crevia-real-device-playtest-round-1.md`

---

## Post-launch telemetry karşılaştırması

Soft launch sonrası `docs/crevia-post-launch-telemetry-readiness.md` Day 1 funnel'ları ile karşılaştır:

- **First session funnel:** app_open → hub → event_inspect → plan → dispatch → result → report
- **Day 1 completion funnel:** day_start → event_completed → report_viewed → next_day_started

Bu pass'teki suppress/guard kararları telemetry drop-off adımlarına map edilmeli.

---

## Fix-only allowed scope

- `bugfix`
- `layout_overflow_fix`
- `typo_copy_fix`
- `false_claim_copy_fix`
- `performance_selector_fix`
- `verification_only`
- `documentation_only`
