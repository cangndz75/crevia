# Crevia Report Tomorrow Preview

## Amaç

Gün sonu raporu artık sadece bugünü kapatmaz; oyuncuya yarın hangi operasyon risklerine dikkat etmesi gerektiğini kısa, net ve bağlamsal şekilde gösterir. Kararların ertesi güne etkisi rapor yüzeyinde görünür kalır.

## Neden gerekli?

Oyuncu şu sorulara cevap almalı:

- Bugünkü kararım yarına iz bıraktı mı?
- Yarın hangi mahalleye veya kaynağa dikkat etmeliyim?
- Rapor sadece skor değil, sonraki gün için operasyon notu veriyor mu?

## Oyuncu döngüsündeki yeri

Karar → sonuç → gün sonu raporu → yarın operasyon notu. Bu patch, rapor ekranında hero/impact bölümünden hemen sonra compact bir “yarın önizleme” kartı sunar.

## Carry-over Memory ile ilişki

Carry-over memory report preview birincil kaynaktır. Aynı metin hem carry-over kartında hem tomorrow preview’da görünmez; duplicate suppression devreye girer.

## Event Echo system ile ilişki

`buildTomorrowHintLine` ikinci öncelikli kaynaktır. Mevcut Stage 3 echo entegrasyonu korunur.

## Dynamic Social Echo ile ilişki

Sosyal mention dördüncü öncelikte değerlendirilir. Social Pulse ile birebir aynı metin bastırılır.

## Report yüzeyindeki yeri

`EndOfDayReportView` içinde `ReportPrimaryImpactSection` sonrasında `ReportTomorrowPreviewCard` render edilir. Alt bölümdeki carry-over kartı duplicate ise gizlenir; `ReportTomorrowNotesCard` fallback olarak kalır.

## Day 1 safety

Gün 1’de tomorrow preview gizlidir (`hidden`). Öğrenme akışı sade kalır.

## Day 7 final safety

Gün 7’de `final_safe` compact görünüm; pilot final akışıyla çakışmaz. `maxLines` 1–2 ile sınırlıdır.

## Post-pilot safe fallback

Gün >7’de yalnızca gerçek veri varsa preview gösterilir; aksi halde `null`. Full post-pilot preview sonraki fazda.

## Neyi değiştirmez?

- `SAVE_VERSION`, persist shape, applyDecision, dayPipeline, event generation
- post-pilot engine, authority, badge, progression, monetization
- Analytics SDK, harita marker, yeni route/screen
- Runtime AI, report scoring

## Sonraki prompt: Dynamic Field Presence Map Layer

Final polish roadmap’te bir sonraki adım: **Crevia Dynamic Field Presence Map Layer** — harita presentation katmanında konteyner, araç ve ekip marker hedefleri.
