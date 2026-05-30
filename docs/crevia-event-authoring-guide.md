# Crevia Event Authoring Guide

Bu belge, Crevia’da yeni olayların nasıl yazılacağını tanımlar. **Plan ve standarttır**; mevcut `pilotEvents` veya event generation motoruna otomatik bağlanmaz.

Kaynak kod: `src/core/content/eventAuthoring*.ts`, `eventPackPlan.ts`

---

## 1. Crevia event felsefesi

- Olay = sahadaki **gerçek problem** + **mahalle karakteri** + **karar trade-off’u**.
- Oyuncu “doğru cevabı” değil, **farklı stratejiler** arasında seçer.
- Sonuç ekranı ve gün sonu raporu aynı kararın **kısa yankısını** taşır.
- Pilot (gün 1–7) öğretici ve yarı lineer; post-pilot light (gün 8+) hafif ve cap’li kalır.

---

## 2. Mahalle kimliği kullanımı

Her event bir `MapDistrictId` ile etiketlenir: `cumhuriyet`, `merkez`, `sanayi`, `istasyon`, `yesilvadi`.

`districtFitReason` alanında:

- Mahalle `personality` / `pressurePoints` / `strengths` ile bağ kurun.
- `eventContextLine` tonunu tekrarlamak yerine **bu olaya özel** gerekçe yazın.

Referans: `src/core/districts/districtIdentityConstants.ts`

---

## 3. Karar trade-off standardı

- En az **3 karar seçeneği**.
- En az biri: net avantaj + net bedel.
- “İyi / kötü” etiketi yok; **farklı strateji** (hız vs güven, kaynak vs algı, vb.).
- `EventDecisionIntent` ile workflow uyumu: `inspect`, `plan`, `dispatch`, `field`, …

---

## 4. Halk / ekip / kaynak etki modeli

Her karar için not edin:

| Boyut | Soru |
|--------|------|
| Halk | Memnuniyet / algı / şikayet hattı nasıl etkilenir? |
| Ekip | Moral, yorgunluk, saha güveni? |
| Kaynak | Bütçe, araç, konteyner, rota kapasitesi? |

Bu notlar `resultCopyNotes` ve gameplay etkilerine girdi olur (implementasyon ayrı patch).

---

## 5. Yetki preview ile uyum

`authorityPreviewHints`: `AuthorityPermissionId[]`

Örnek: `field_priority_note`, `daily_preparation_authority`, `operations_responsible_scope`

Karar, preview’da gösterilen yetki seviyesini **mantıksız şekilde aşmamalı**.

---

## 6. Rozet progress ile uyum

`badgeProgressHints`: `BadgeId[]`

Yanlış rozet spam’i riski: her event tüm rozetlere dokunmamalı. İlgili 1–2 rozet ipucu yeterli.

---

## 7. Result screen copy standardı

- 1–2 cümle saha etkisi (`EventResultHeroCard` tonu: positive / balanced / risky / crisis).
- Teknik sistem adı yok; sahada ne değiştiği görünür.
- `expectedResultTone` ile uyumlu.

---

## 8. Report copy standardı

- Gün sonu raporda **1 cümle** özet (`reportCopyNotes`).
- Yetki / rozet satırlarıyla çelişmesin.
- Pilot gün 7 “sezon sonu” dili ile post-pilot “hafif gündem” dili karışmasın.

---

## 9. Post-pilot light event standardı

- Faz: `post_pilot_light`, pack: `post_pilot_light`
- **Günde en fazla 2 aktif event** (mevcut motor: 1 anchor + 1 side ritmi).
- Mevcut envanter planı: 3 anchor + 4 side; genişleme hedefi: 6 anchor + 8 side (cap aynı kalır).
- Abartılı kriz veya “tam ana operasyon” hissi vermeyin.

---

## 10. Event pack roadmap

| Pack | Amaç | Durum |
|------|------|--------|
| `pilot_core` | Gün 1–7 çekirdek | Mevcut pilot içeriği |
| `district_*` | Mahalle temalı havuzlar | Planlandı |
| `post_pilot_light` | Gün 8+ hafif loop | Kısmen aktif |
| `crisis_pack_future` | Yüksek risk | Sadece plan |
| `social_pack_future` | Sosyal nabız odaklı | Sadece plan |

Detay sayılar: `src/core/content/eventPackPlan.ts`

---

## 11. Yasaklı dil listesi

Kullanmayın:

- XP, level up, rank up
- erişim kısıtı, premium, ödeme duvarı dili
- yetkin yetersiz, full mode

---

## 12. Örnek authoring profilleri

Aşağıdaki örnekler **yalnızca rehberdir**; `pilotEvents` veya generator’a bağlı değildir.

### Örnek 1 — Cumhuriyet sosyal şikayet

- **Problem:** Gece gürültü şikayetleri artıyor; mahalle güveni hassas.
- **Mahalle uyumu:** Sosyal nabız yüksek; küçük aksaklık şikayete döner.
- **Ana sistem:** `social` · **İkincil:** operations, personnel
- **Karar niyetleri:** inspect, communicate, dispatch, stabilize_social
- **Sonuç notu:** Gece devriyesi sıklaştı; şikayet hattı sakinleşti.
- **Rapor notu:** Cumhuriyet’te gece şikayetleri kontrol altına alındı.

Kod: `example_cumhuriyet_social_complaint` in `EVENT_AUTHORING_EXAMPLE_PROFILES`

### Örnek 2 — Sanayi rota / araç

- **Problem:** Sabah vardiyasında rota sıkışması; gecikme zinciri riski.
- **Mahalle uyumu:** Rota ve ekip yükü baskın.
- **Ana sistem:** `route` · **İkincil:** vehicle, personnel, container
- **Karar niyetleri:** inspect, plan, optimize_route, allocate_resource, dispatch
- **Sonuç notu:** Rota yeniden dengelendi; araç yorgunluğu izlenmeli.
- **Rapor notu:** Sanayi hattında rota müdahalesi verimi korudu.

Kod: `example_sanayi_route_vehicle`

### Örnek 3 — İstasyon post-pilot light

- **Problem:** Sabah yoğunluğu; geçiş noktasında koordinasyon.
- **Mahalle uyumu:** Post-pilot geçiş; yoğunluk yönetimi.
- **Faz:** `post_pilot_light` · **Cap:** günde ≤2 aktif event
- **Karar niyetleri:** inspect, plan, dispatch, field, reduce_risk
- **Sonuç notu:** Bekleme süreleri kısaldı; hafif operasyon tonu.
- **Rapor notu:** İstasyon’da hafif gündemle yoğunluk dengelendi.

Kod: `example_istasyon_post_pilot_light`

---

## Event authoring checklist (özet)

Tam liste: `EVENT_QUALITY_CHECKLIST` in `eventAuthoringGuide.ts`

Çalıştırma:

```bash
npm run verify:event-authoring
npm run typecheck
```

İlgili regression:

```bash
npm run verify:district-identity
npm run verify:full-ux-flow
npm run verify:post-pilot-loop-balance
npm run verify:full-loop
```

---

## Metadata modeli (`EventAuthoringProfile`)

Yeni event taslağı oluştururken `src/core/content/eventAuthoringTypes.ts` şemasını doldurun. Pack ataması `eventPackPlan.ts` ile uyumlu olmalı.

**Bu patch yeni event eklemez.** İçerik üretimi bundan sonra bu disipline göre yapılır.
