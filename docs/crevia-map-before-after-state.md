# Crevia Map Before After State

## Amaç

Oyuncu karar verdiğinde haritanın yalnızca görev sırasında marker göstermesi yerine, karar öncesi baskı ile karar sonrası operasyon etkisini kısa ve görsel olarak anlatması.

## Neden gerekli?

Dynamic Field Presence katmanı sahadaki varlığı gösterir; Resource Fatigue görsel state’leri yorgunluğu taşır. Before/after katmanı ise **tek bir kararın harita üzerindeki algılanan farkını** result ekranı ve harita panelinde özetler.

## Ne değildir?

- Gerçek GPS veya pathfinding simülasyonu değildir.
- Tekil konteyner/araç envanteri veya persist shape değişikliği değildir.
- `applyDecision`, `dayPipeline`, event generation veya resource engine değişikliği değildir.
- Runtime AI veya analytics SDK entegrasyonu değildir.

## Before/after outcome model

Domain: `container`, `vehicle_route`, `personnel`, `social`, `crisis_adjacent`, `district_balance`, `generic_operation`.

Outcome: `improved`, `partially_improved`, `unchanged`, `worsened`, `carried_over`, `prevented`, `unknown`.

Tone: `positive`, `mixed`, `warning`, `strategic`, `muted`.

## Dynamic Field Presence ile ilişki

`buildMapPresenceViewModel` opsiyonel `mapBeforeAfterSummary` alır; marker status güncellemeleri presentation-only uygulanır. Mevcut marker cap ve crisis önceliği korunur.

## Resource Fatigue ile ilişki

Fatigue state (`tired`, `maintenance_risk`, `strained`) carry-over outcome çıkarımında kullanılır; fatigue chip ile duplicate suppression paylaşılır.

## Carry-over ve Report Tomorrow ile ilişki

Kaynak önceliği: eventResult → carryOverMemory → reportTomorrowPreview → resourceFatigue → mapPresence → eventDomainFocus → operationSignals → fallback.

`suppressMapBeforeAfterDuplicate` aynı cümleyi carry-over, yarın önizlemesi, sosyal echo ve domain echo ile tekrar basmaz.

## Result screen kullanımı

`EventMapImpactSummaryCard` — `DecisionResultScreen` içinde impact metrics sonrası; Day 1 gizli veya çok kompakt; domain echo ile duplicate yoksa görünür.

## Map panel kullanımı

`MapBeforeAfterImpactStrip` — `MapOperationBottomPanel` içinde en fazla 1 strip; crisis aktifken gösterilmez; presence satırlarıyla çakışmaz.

## Day 1 safety

Gün 1’de before/after harita panelinde gizli; result yüzeyinde minimal.

## Day 7 final safety

Kompakt metin; panic dili yok; tag ve satır limitleri korunur.

## Crisis overlay önceliği

Crisis aktifken non-crisis before/after strip bastırılır; mevcut crisis panel önceliği değişmez.

## Neyi değişirmez?

- `SAVE_VERSION` ve persist shape
- Gameplay motorları (`applyDecision`, `dayPipeline`, event generation, `postPilotEventEngine`)
- Map anchor sistemi (koordinatlar)
- Report scoring
- Yeni route/screen

## Sonraki prompt: Ece Player Style Recognition

Roadmap: `ece-player-style-recognition` — rule-based oyuncu stil tanıma şablonları (runtime AI yok).
