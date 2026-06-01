# Crevia Carry-over Memory Cards

## Amaç

Önceki gün kararlarının bugüne ve bugünkü kararların yarına etkisini **presentation-only** kartlarla görünür kılmak. Oyuncu “dün verdiğim karar bugün karşıma çıktı” ve “bugünkü kararım yarın iz bırakacak” hissini alır.

## Neden gerekli?

Event domain UI ve echo sistemi yüzey bazlı odak sağlıyor; carry-over katmanı **zaman ekseninde** (dün → bugün → yarın) kısa hafıza cümleleri ekler. Yeni gameplay veya persist yok.

## Oyuncu döngüsündeki yeri

1. **Hub** — Dünden kalan etki (Day 2+)
2. **Event / Plan** — Bugüne taşınan iz
3. **Sonuç** — Yarın için kısa not (domain echo ile duplicate yok)
4. **Rapor** — Yarına taşınan iz (tek kart; tomorrow fallback ile çakışmaz)

## Daily Theme Rhythm ile ilişki

Pilot tema kartı korunur. Carry-over kartı tema ile aynı mesajı tekrarlamaz; veri yoksa gizlenir veya domain fallback kullanır.

## Event Domain UI ile ilişki

`eventDomainFocus` carry-over domain seçiminde önceliklidir. Domain focus özeti ile aynı metinse event hint yalnızca mini tag gösterir.

## Event Echo system ile ilişki

`buildTomorrowHintLine` / `buildCarryOverFromEchoContext` rapor ve sonuç için güçlü kaynak. Echo metni aynı anda iki yüzeyde gösterilmez.

## Surface’ler

| Surface | Bileşen | Yön |
|---------|---------|-----|
| hub | HubCarryOverMemoryCard | yesterday_to_today |
| event_detail / plan | EventCarryOverHintCard | yesterday_to_today |
| result | EventCarryOverHintCard | today_to_tomorrow |
| report | ReportCarryOverPreviewCard | today_to_tomorrow |

## Day 1 safety

`shouldShowCarryOverMemory(1, …)` false. Hub, event ve rapor carry-over göstermez.

## Day 7 final safety

Rapor kartı `compact` modda; panik veya satış dili yok. Pilot final akışı bozulmaz.

## Post-pilot safe fallback

Gün > 7: yalnızca günlük rapor/sinyal varsa hub’da sınırlı gösterim; ağır post-pilot mantığı yok.

## Neyi değiştirmez?

SAVE_VERSION 23, persist, applyDecision, dayPipeline, postPilotEventEngine, event generation, yeni route, runtime AI, analytics SDK.

## Sonraki prompt: Dynamic Social Echo

Roadmap: `dynamic-social-echo` — sosyal nabız yüzeylerinde dinamik echo entegrasyonu.

## Verify

```bash
npm run verify:carry-over-memory
```
