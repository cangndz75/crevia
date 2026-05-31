# Crevia — Analytics Runtime Instrumentation (MVP Aşama 2)

Bu belge, **Analytics Event Schema (Aşama 1)** üzerine inşa edilen runtime instrumentation katmanını özetler. Gerçek SDK veya dashboard yok; tüm eventler `trackAnalyticsEvent` no-op tracker üzerinden validate + sanitize edilir.

## Instrumented MVP events

| Event | Surface | Tip | Guard |
| --- | --- | --- | --- |
| `day_started` | hub | impression | `day_started:{day}` |
| `first_guide_seen` | hub | impression | `first_guide_seen:{day}` (Day 1 guide görünürse) |
| `daily_plan_seen` | hub | impression | `daily_plan_seen:{day}` |
| `daily_plan_confirmed` | hub | action | — |
| `operational_resources_card_seen` | hub | impression | `operational_resources_card_seen:{day}` |
| `operational_resources_detail_opened` | hub | action | CTA |
| `season_goal_card_seen` | hub | impression | `season_goal_card_seen:{day}` |
| `crisis_desk_seen` | hub | impression | `crisis_desk_seen:{day}` |
| `first_event_opened` | event_plan | impression | `first_event_opened:{eventId}` |
| `decision_selected` | event_plan | action | — |
| `assignment_seen` | event_dispatch | impression | `assignment_seen:{eventId}` |
| `assignment_confirmed` | event_dispatch | action | — |
| `field_phase_started` | event_field | impression | `field_phase_started:{eventId}` |
| `micro_decision_seen` | event_field | impression | `micro_decision_seen:{decisionId}` |
| `micro_decision_resolved` | event_field | action | — |
| `event_completed` | event_result | impression | `event_completed:{eventId}` |
| `report_opened` | report | impression | `report_opened:{day}` |
| `report_*_seen` | report | impression | `report_{section}_seen:{day}` |
| `season_end_seen` / `report_season_end_seen` | report | impression | gün bazlı |
| `season_end_detail_opened` | report | action | CTA |
| `hub_returned` | hub | action | rapor CTA |
| `map_opened` | map | impression | `map_opened:{day}` |
| `map_resource_overlay_seen` | map | impression | overlay görünürse |
| `map_crisis_overlay_seen` | map | impression | overlay görünürse |
| `crisis_action_sheet_opened` | hub | action | CTA |
| `crisis_action_selected` | hub | action | sheet onay |
| `crisis_action_processed` | hub | impression | rapor + seçili hamle |

Post-pilot IAP eventleri `PostPilotOfferScreen` üzerinde (Aşama 2 IAP patch) bağlı kalmaya devam eder.

## Surfaces

- **HubScreen** — gün başlangıcı, rehber, plan, kaynak kartı, sezon hedefi, kriz masası
- **HubDailyOperationsPlanCard** — plan onayı
- **HubOperationalResourcesCard** — detay sheet
- **EventDetailDecisionScreen** — olay açılışı, atama, saha fazı, karar
- **EventAssignmentPanel** — atama onayı
- **EventFieldMicroDecisionCard** / **HubLiveOperationsCard** — mikro karar
- **DecisionResultScreen** — olay tamamlandı
- **EndOfDayReportView** / **ReportScreen** — rapor funnel + hub dönüşü
- **MapScreen** — harita ve overlay
- **HubCrisisActionCard** / **CrisisActionSheet** — kriz hamlesi

## Impression vs action

- **Impression:** `trackOncePerRuntime(key, …)` — modül seviyesi `Set`, persist yok, uygulama yeniden başlayınca sıfırlanır.
- **Action:** `trackCreviaEvent(…)` — her kullanıcı aksiyonunda (onay, seçim, CTA).

Render içinde doğrudan `track` çağrısı yok; `useEffect` veya handler kullanılır.

## Privacy-safe payload

Örnek (hub gün başlangıcı):

```json
{
  "eventName": "day_started",
  "surface": "hub",
  "schemaVersion": 1,
  "day": 1,
  "pilotDay": 1,
  "accessMode": "pilot",
  "isFirstSession": true,
  "timestampMs": 1710000000000
}
```

Yasak: PII, `saveState`, ham metin, `advisorLine`, `reportText`. `districtId`, `optionId`, `eventType`, `*Band` alanları kontrollü enum/slug.

## Non-instrumented (bilinçli)

- `app_opened`, `session_started`, `tab_changed`, sosyal/profil/leaderboard
- Tam event kataloğunun geri kalanı
- Session recording
- Engine içi `applyDecision` / day pipeline hook’ları

## SDK entegrasyonu (sonraki adım)

1. `analyticsTracker.ts` içinde `trackAnalyticsEvent` → SDK adapter
2. Dashboard funnel tanımları (9 funnel, `analyticsFunnels.ts`)
3. `launch_candidate` modunda manuel cihaz smoke

## Smoke test checklist

- [ ] Day 1: hub → plan onay → olay → karar → atama → saha → sonuç → rapor → hub
- [ ] `npm run verify:analytics-runtime` PASS
- [ ] Post-pilot: kaynak kartı, kriz sheet, harita overlay
- [ ] Sezon sonu kartı + detay sheet (tam erişim günü)
- [ ] Dev konsolda event spam yok

## Verify

```bash
npm run verify:analytics-runtime
npm run verify:analytics-events
```
