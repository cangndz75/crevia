# Crevia Analytics Event Schema

## Amaç

Soft-launch öncesi hangi oyuncu davranışlarının ölçüleceğini netleştirmek. Bu doküman ve `src/core/analytics/` kodu gerçek Firebase, Amplitude veya PostHog entegrasyonu içermez; event sözleşmesi, funnel tanımları, privacy kuralları ve no-op tracker sağlar.

## İlkeler

- Payload’da PII, ham rapor metni, save state veya cihaz tanımlayıcı yok.
- Event isimleri `snake_case`, sabit union type (`AnalyticsEventName`).
- Her event: `surface`, `schemaVersion`, funnel bağlantısı ve allowlist/required key listesi.
- Production’da `trackAnalyticsEvent` no-op; ağ isteği yok.
- Instrumentation sonraki aşamada; bu aşamada schema + verify yeterli.

## Privacy-safe

### Privacy-safe payload kuralları

**İzin verilen generic key’ler:** `day`, `pilotDay`, `seasonDay`, `surface`, `accessMode`, `districtId`, `eventType`, `eventCategory`, `decisionType`, `optionId`, `assignmentFitBand`, `resourceStatusBand`, `crisisRiskBand`, `ratingBand`, `resultBand`, `ctaId`, `tabId`, `source`, `isFirstSession`, `isTutorial`, `hasCrisisAction`, `hasSeasonEnd`, `schemaVersion`, `timestampMs`.

**Yasak key’ler:** `name`, `email`, `phone`, `address`, `rawText`, `reportText`, `freeText`, `saveState`, `deviceId`, `idfa`, `idfv`, `advertisingId`, `ipAddress`, `locationLat`, `locationLng` ve `*Text` / `summary` / `advisorLine` gibi serbest metin alanları.

**Band/enum değerleri:** Kontrollü string’ler kullan (`strong`, `weak`, `elevated`, `critical` vb.). Uzun serbest metin gönderme.

## Event naming convention

- Fiil + nesne: `daily_plan_confirmed`, `crisis_action_selected`.
- Rapor görünürlüğü: `report_*_seen`.
- Navigasyon: `map_opened`, `tab_changed`.

## Funnel listesi

| Funnel ID | Başarı olayı |
| --- | --- |
| `first_session` | `hub_returned` |
| `pilot_completion` | `post_pilot_offer_opened` |
| `post_pilot_offer` | `main_operation_mock_purchase_completed` |
| `limited_operation` | `report_opened` |
| `full_main_operation` | `season_end_seen` |
| `crisis_management` | `crisis_action_processed` |
| `operational_resources` | `report_resources_seen` |
| `season_end` | `season_end_detail_opened` |
| `retention` | `hub_returned` |

## First Session Funnel

1. `app_opened` → `session_started` → `day_started` → `first_guide_seen`
2. `advisor_hint_requested` → `daily_plan_confirmed`
3. `first_event_opened` → `decision_selected` → `assignment_confirmed`
4. `field_phase_started` → `event_completed` → `report_opened` → `hub_returned`

**Drop-off:** Plan onayı öncesi çıkış; atama panelinde takılma; rapor açılmadan hub dönüşü.

## Pilot Completion Funnel

`day7_report_opened` → `pilot_completion_seen` → `post_pilot_offer_opened`

## Post-Pilot Offer Funnel

`post_pilot_offer_opened` → CTA → `limited_continue_selected` veya mock purchase tamamlanması.

## Full Main Operation Funnel

`main_operation_day_started` → sezon/kaynak/kriz kartları → `season_end_seen`.

## Crisis Management Funnel

`crisis_desk_seen` → sheet → `crisis_action_selected` → `crisis_action_processed` → `report_crisis_seen`.

## Operational Resources Funnel

`operational_resources_card_seen` → `operational_resources_detail_opened` → `map_resource_overlay_seen` → `report_resources_seen`.

## Season End Funnel

`report_season_end_seen` → `season_end_seen` → `season_end_detail_opened`.

## Event payload örnekleri

```json
{
  "eventName": "daily_plan_confirmed",
  "surface": "hub",
  "schemaVersion": 1,
  "day": 1,
  "accessMode": "pilot",
  "source": "hub_card"
}
```

```json
{
  "eventName": "crisis_action_selected",
  "surface": "hub",
  "schemaVersion": 1,
  "day": 12,
  "seasonDay": 5,
  "accessMode": "main_operation_full",
  "crisisRiskBand": "elevated",
  "optionId": "crisis_coordination"
}
```

```json
{
  "eventName": "season_end_seen",
  "surface": "report",
  "schemaVersion": 1,
  "day": 21,
  "seasonDay": 14,
  "ratingBand": "strong",
  "hasSeasonEnd": true
}
```

## Yasak payload örnekleri

```json
{
  "eventName": "report_opened",
  "email": "oyuncu@ornek.com",
  "reportText": "Bugün zor bir gündü..."
}
```

```json
{
  "eventName": "assignment_confirmed",
  "saveState": "{ ... full json ... }"
}
```

## SDK entegrasyonu (sonraki aşama)

1. `trackAnalyticsEvent` içinde validate + sanitize korunur.
2. Adapter katmanı (Firebase/Amplitude/PostHog) sadece sanitized payload alır.
3. UI’da kritik noktalara tek satır `trackAnalyticsEvent(createAnalyticsEvent(...))` eklenir.
4. Production’da sampling ve consent gate eklenir.

## Soft-launch metrikleri

| Metrik | Event / kaynak |
| --- | --- |
| D1 first session completion | `hub_returned` / first_session funnel |
| daily_plan_confirmed rate | `daily_plan_confirmed` |
| assignment_confirmed rate | `assignment_confirmed` |
| report_opened rate | `report_opened` |
| day7 offer reach | `post_pilot_offer_opened` |
| limited vs full selection | `limited_continue_selected` vs `main_operation_mock_purchase_completed` |
| crisis_action_selected rate | `crisis_action_selected` |
| operational_resources_detail_opened | `operational_resources_detail_opened` |
| season_end_seen rate | `season_end_seen` |
| crash-free session rate | Dokümantasyon (bu patch’te ölçülmez) |
| average report density | `verify:full-season-simulation` rapor yoğunluğu |

## Verify

```bash
npm run verify:analytics-events
```

Schema sürümü: `ANALYTICS_SCHEMA_VERSION = 1`.
