# Crevia Dynamic Field Presence Map Layer

## Amaç

Haritada yalnızca mahalle etiketi ve genel pinler yerine, aktif event domain’i ve operasyon sinyallerinden türetilen **presentation-only** saha varlığı katmanı göstermek. Oyuncu konteyner baskısı, araç hattı, ekip konumu, sosyal hotspot ve kontrollü risk sinyalini harita üzerinde hissetmeli.

## Neden gerekli?

Önceki harita polish katmanları kriz ve kaynak vurgusunu güçlendirdi; ancak saha “nerede ne oluyor?” sorusu hâlâ soyut kalabiliyordu. Bu katman karar görünürlüğünü artırır, gameplay’e dokunmadan haritayı operasyonel bir okuma yüzeyine çevirir.

## Ne değildir?

- Gerçek GPS, pathfinding veya canlı filo takibi değildir.
- Tekil konteyner/araç/personel envanteri veya drag-drop dispatch değildir.
- Persist, `applyDecision`, event generation veya gün pipeline’ı değiştirmez.

## Anchor sistemi

Beş mahalle (`merkez`, `cumhuriyet`, `sanayi`, `istasyon`, `yesilvadi`) için sabit anchor seti: en az 3 konteyner, 1 araç geçişi, 1 ekip istasyonu, 1 sosyal hotspot, 1 kriz noktası, 1 mahalle merkezi. Koordinatlar 0.05–0.95 aralığında ve çakışmayı azaltacak şekilde dağıtılmıştır.

## Container cluster markerları

Konteyner domain’inde cluster chip’ler `pressure`, `carry_over`, `resolved` durumlarıyla gösterilir. Pulse yalnızca kontrollü ve sınırlı tekrarlı animasyonla (ağır sonsuz pulse yok).

## Araç markerları

`vehicle_route` domain’inde araç chip’i; `en_route`, `working`, `tired`, `maintenance_risk` durumları operationalResources’tan türetilebilir (yoksa güvenli fallback).

## Ekip markerları

`personnel` ve `social` domain’lerinde ekip/sosyal badge; `assigned`, `working`, `tired`, `social_watch`.

## Route hint

Gerçek rota simülasyonu yok; kısa kesik çizgi veya hedef anchor yakınında nokta/ok ipucu. En fazla 1 hint.

## Crisis overlay önceliği

Aktif kriz varken mevcut kriz overlay birinci önceliklidir. Presence marker’lar azaltılır veya muted olur; `crisis_adjacent` dili “Risk sinyali izleniyor” çizgisindedir — “kriz başladı” yok.

## Daily Theme Rhythm ile ilişki

Gün bazlı görünürlük (Day 1 sade, Day 6 risk, Day 7 kompakt) pilot ritmiyle uyumludur; tema motoru değiştirilmez.

## Event Domain UI ile ilişki

`buildEventDomainFocusModel` çıktısı domain önceliğini belirler; UI öncelik sırası korunur.

## Carry-over / Report Tomorrow ile ilişki

Carry-over `container` → `carry_over` marker; report tomorrow `vehicle_route` → yorgun araç/route hint ipucu; sosyal echo → sosyal hotspot. Yalnızca sunum.

## Day 1 safety

Katman gizli veya minimal; panel satırı yok.

## Day 7 final safety

Marker sayısı kompakt tutulur; final akışı bozulmaz.

## Post-pilot safe fallback

Day > 7: yalnızca gerçek event/operasyon verisi varsa sınırlı marker (max ~3).

## Neyi değiştirmez?

- `SAVE_VERSION`, persist shape, `applyDecision`, day pipeline, event generation, post-pilot engine, analytics SDK, IAP.

## Sonraki prompt: Resource Fatigue Visual States

Roadmap sonraki adım: `resource-fatigue-visual-states` — kaynak yorgunluk durumlarının hub/map/report yüzeylerinde tutarlı görsel dili.

Doğrulama: `npm run verify:map-presence`
