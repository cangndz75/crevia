# Crevia — Gameplay Loop QA

## Amaç

Day 1 pilot başlangıcından Day 8+ ana oyun döngüsüne kadar tüm gameplay loop'un uçtan uca doğrulanması, regression temizliği, verify zinciri toparlanması ve kalan teknik borçların sınıflandırılması.

Yeni gameplay sistemi eklenmez. Persist, SAVE_VERSION, applyDecision ve day pipeline değişmez.

## Preflight komutları

```bash
npm run typecheck:tsc
npm run verify:gameplay-loop-qa
npm run verify:city-rhythm-director
npm run verify:map-motion
npm run verify:motion-foundation
npm run verify:memory-followup-wiring
# ... bağlı verify zinciri
```

## Day scenario matrix

| Senaryo | Gün | Kontrol |
|---------|-----|---------|
| A) Day 1 pilot start | 1 | Hub sade, CityRhythm/Day8/FollowUp/Positive kapalı, map idle |
| B) Day 3 consequence | 3 | Duplicate yok, Ece tek yol |
| C) Day 7 transition | 7 | Day 8 stratejik yüzey yok |
| D) Day 8 first strategic | 8 | Portfolio, Day8, CityRhythm, map guard |
| E) Day 8 low-data | 8 | safe_watch fallback, fake claim yok |
| F) Day 10 mixed | 10 | Neglect/recovery/memory dengeli |
| G) Day 12 high pressure | 12 | Warning spam yok, report okunabilir |
| H) Reduced motion | 8 | pulse kapalı, static fallback |
| I) Save/resume smoke | 8 | Context rebuild crash yok |

## Duplicate surface QA

Report, Hub continuation, Ece, OneMoreDay, CityRhythm, Day8StrategicContent, FollowUp, PositiveComeback, CityMemory aynı exact line tekrar etmemeli.

## Density / layout QA

- Hub continuation max 3 kart
- Report notları numberOfLines + flexShrink guard
- Map motion max 5 animated / 1 strong

## Typecheck cleanup

- `cityRhythmDirectorModel.ts` type error düzeltildi
- Map motion `MapPresenceViewModel` uyumu
- CreviaBaseMap duplicate import düzeltildi

## Motion foundation cleanup

HubReferenceHome'a `CenterMotionEnter` + `hubMotionEnabled` (Day 8+) entegrasyonu eklendi.

## Analyzer / verify

```bash
npm run verify:gameplay-loop-qa
npm run analyze:gameplay-loop-qa
```

## Kalan riskler

- Event selection hâlâ Day8StrategicContent/CityRhythm'i doğrudan okumuyor (bilinçli gap)
- Cross-day rhythm persist dışarıda
- Cihazda map motion gerçek save gözle kontrolü önerilir

## Final UI Redesign için notlar

- HubReferenceHome hâlâ referans layout; production Center modülleri ayrı surface
- Report memory/rhythm notları minimal kart olarak render edildi
- Büyük visual polish bu pass kapsamı dışında

## Değiştirilmeyen sınırlar

- persist yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline rewrite yok
- event selection rewrite yok
- event spawn yok
- UI redesign yok
