# Crevia Şehir Günlüğü Lite

## 1. Amaç

Oyuncunun geçmiş kararları ve gün sonu sonuçlarının şehirde küçük bir **tarih** oluşturduğunu hissettirmek. Bu pass full City Archive Persistence değildir; soft launch öncesi **lite presentation katmanıdır**.

Ana his: *“Bu şehirde benim kararlarımla bir geçmiş oluşuyor.”*

## 2. Neden şimdi gerekli

- carryOver, Decision Impact, Tomorrow Risk, City Echo, Mahalle Karnesi ve Main Operation Feel artık üretiyor; ancak oyuncuya **zaman içinde biriken şehir hafızası** hissi verilmiyordu.
- Day 4–7 pilot günlerinde küçük tarih izi, Day 8+ ana operasyonda “şehir günlüğü” tonu retention ve aitlik hissini güçlendirir.
- Persist / SAVE_VERSION / runtime değişikliği olmadan mevcut sinyallerden türetilebilir.

## 3. Lite scope

- `CityJournalLiteModel` — mevcut state’ten derived entry listesi
- Hub compact strip (`HubCityJournalStrip`)
- Report tek satır (“Günlüğe işlendi: …”)
- Map helper (`buildCityJournalMapHint`) — docs + API; UI bağlama opsiyonel
- Yeni route yok, büyük UI redesign yok

## 4. V1.1 City Archive Persistence’dan farkı

| Lite (bu pass) | V1.1 full archive |
|----------------|-------------------|
| Mevcut gün + son sinyallerden türetilir | Persist edilmiş tam geçmiş |
| Max 1–5 entry | Haftalık bülten, paylaşılabilir rapor |
| Presentation-only | Story chain / content pack derin bağ |
| SAVE_VERSION 23 | Migration gerekir |

Tam geçmiş arşiv persist edilmediği için UI copy **“son şehir izi”** / **“son operasyon izi”** tonunu kullanır.

## 5. Entry model

`CityJournalLiteEntry`: id, day, title, line, districtId, domain, kind (13 kind), tone, sourceKind, priority, createdFromDay, maxVisibleLines.

Örnek copy:

- `Gün 4: Sanayi rotası dengelendi.`
- `Gün 6: Cumhuriyet'te sosyal güven toparlandı.`
- `Gün 8: Ana operasyon daha geniş mahalle kapsamıyla başladı.`
- `Gün 9: Yeşilvadi çevre baskısı izleme notuna alındı.`

## 6. Source signals

Öncelikli kaynaklar: lastDailyReport, carryOver memory, decisionImpact, tomorrowRisk, cityEcho, districtMemory/trust, operationSignals, contentPackMeta, mainOperationFeel, postPilotOperation.

## 7. Day-based visibility

| Gün | Visibility | Max entry |
|-----|------------|-----------|
| Day 1 | hidden | 0 |
| Day 2–3 | compact | 1 |
| Day 4–7 | compact/standard | 3 |
| Day 8 | standard + main_operation_started | 3 |
| Day 9+ | standard | 5 |
| Full main operation | timeline_preview | 5 (lite kalır) |

## 8. Entry selection priority

1. main_operation_started (Day 8)
2. resolved carry-over
3. new carry-over / tomorrow risk
4. decision impact
5. district trust shift
6. content pack origin
7. resource pressure
8. social trust recovery
9. operation signal
10. fallback

Aynı gün max 1 ana + 1 secondary; Hub max 2, Report max 3.

## 9. Hub integration

`HubScreen` → `buildCityJournalLiteModel` + `buildCityJournalHubPresentation` → `HubReferenceHome` → `HubCityJournalStrip`.

Başlık: **Şehir Günlüğü**. CTA yok, yeni route yok.

## 10. Report integration

`EndOfDayReportView` → `buildCityJournalReportLine` → “Günlüğe işlendi: …” satırı, Kararın etkisi bloğunun altında.

## 11. Content Pack integration

Pack-origin event’lerden tarihsel entry (teknik pack adı görünmez):

- Vehicle/Route → rota izleme notu
- Container/Environment → konteyner çevresi takipte
- District → mahalle/çevre hassasiyeti

## 12. Mahalle Karnesi integration

Mahalle Karnesi **“şu anki durum”**, Şehir Günlüğü **“geçmiş kayıt”** diliyle konuşur. `recentEffectLine` aynı cümle olarak kullanılmaz; duplicate guard aktif.

## 13. Duplicate guard

Decision Impact, Tomorrow Risk, City Echo, Mahalle Karnesi, MainOperationFeel scopeLine, carryOver summary ile birebir tekrar etmez. Key: day + districtId + domain + kind + sourceKind + contentPackFamilyId.

## 14. Copy guard

Yasaklı: pack, metadata, runtime, activation, variant, premium, panik, felaket, ceza, vb.

Ton: kısa, sakin, kayıt dili, mahalle odaklı, oyuncuya aitlik hissi.

## 15. Non-goals

- Persist / SAVE_VERSION bump
- Story Chain Persistent Runtime
- Weekly Belediye Bulletin
- City Archive Persistence V1
- applyDecision / dayPipeline / event generation değişikliği
- Yeni route, büyük UI redesign
- AI, Remote Config, monetization değişikliği

## 16. Verify sonucu

```bash
npm run verify:city-journal
```

## 17. Sonraki önerilen prompt

**Crevia City Archive Persistence V1.1 Review Aşama 1** — persist shape tasarımı, telemetry karar kriterleri, weekly bulletin backlog; activation yapmadan review-only.

## 18. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:city-journal
npm run verify:district-report-card
npm run verify:content-runtime-activation
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:main-operation-feel
npm run verify:report-ui
npm run verify:hub-ui
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
```
