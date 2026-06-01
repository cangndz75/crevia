# Crevia Pilot Gün Teması (Daily Theme Rhythm)

## Amaç

Pilot günleri 1–7 arasında her günün net bir ana teması, öğrettiği baskı türü ve Hub/Report/Ece presentation karşılığı olması. **Gameplay core değişmez** — event generation motoru (`src/core/events/pilotRhythm*`) ayrı kalır; bu modül yalnızca **gün teması presentation** katmanıdır (`src/core/pilotRhythm/`).

Verify: `npm run verify:pilot-rhythm` (event rhythm + theme rhythm)

## Neden gerekli?

Aynı hissedilen pilot haftası oyuncu bağını zayıflatır. Gün bazlı tema, öğrenme eğrisini ve domain vurgusunu UI’da görünür kılar; içerik pack ve event yazım standardı sonraki adımlardır.

## 1–7 Gün Tema Tablosu

| Gün | Tema | Domain | Ton |
| --- | --- | --- | --- |
| 1 | İlk Saha Müdahalesi | first_response | learning |
| 2 | Konteyner Baskısı | container_pressure | operational |
| 3 | Kaynak Dayanıklılığı | resource_fatigue | caution |
| 4 | Sosyal Nabız | social_pulse | social |
| 5 | Mahalle Dengesi | district_balance | strategic |
| 6 | Kriz Öncesi Sinyal | crisis_signal | caution |
| 7 | Pilot Finali | pilot_final | transition |

## Day 1 Sade Kalma Kuralı

- Hub: `compact` visibility, tag yok, kısa özet.
- Ece: tema satırı day-1 short advisor modunda gizlenir; ana insight korunur.
- Event: “Bugünün odağı” satırı gün 1’de gösterilmez.

## Day 7 Final / Ana Operasyon Geçiş Kuralı

- Hub/Report: `final` visibility, ana operasyon teaser dili.
- Satış/paywall dili yok; “ana operasyon ufukta”, “kapsam büyür” tonu kullanılabilir.

## UI Yüzeyleri

| Yüzey | Bileşen | Not |
| --- | --- | --- |
| Hub | `HubPilotThemeCard` | Hero sonrası, düşük profil |
| Report | `ReportPilotThemeSummary` | Hero sonrası kompakt satır |
| Ece | `HubAdvisorCard` tema context satırı | Primary insight’ın altında, motor değişmez |
| Event | `buildPilotThemeEventFocusLine` | Helper hazır; tam UI Event Domain UI prompt’unda |

## Neyi Değiştirmez?

- `applyDecision`, `dayPipeline`, authority/badge/progression
- Event generation / `applyPilotRhythmToDailyEventSet`
- Persist shape, `SAVE_VERSION`
- Analytics SDK, IAP, harita marker, AI
- Post-pilot gün 8+ (helper `null`)

## Sonraki Prompt

**Crevia Dynamic Event Writing Standard + Content Schema Audit** — `dynamic-event-writing-standard` roadmap maddesi.
