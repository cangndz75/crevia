# Crevia Post-Launch Telemetry Readiness

## Amaç

Soft launch sonrası ürün metriklerini **mevcut analytics schema ve new-systems event’leri** üzerinden okuyabilmek için KPI, funnel, dashboard kart önerileri, alert eşikleri ve post-launch review sorularını tanımlar. Bu paket gerçek analytics SDK veya dashboard entegrasyonu yapmaz; yeni analytics event eklemez. No-New-System Freeze kapsamında yalnızca readiness, documentation, verify ve reporting sağlar.

**Health:** WARN
**Docs:** docs/crevia-post-launch-telemetry-readiness.md

## Summary

| Metric | Value |
|--------|-------|
| KPI groups | 8 |
| KPI definitions | 45 |
| Funnel definitions | 5 |
| Dashboard cards | 12 |
| Review questions | 20 |
| Events in schema | 35/35 |
| Privacy guard | PASS |

## KPI list

| Group | KPI | Source event | Segment | Priority |
|-------|-----|--------------|---------|----------|
| A. First Session | app_open | app_opened | — | core |
| A. First Session | first hub view | session_started | isFirstSession=true | core |
| A. First Session | first event inspect | first_event_opened | — | core |
| A. First Session | first plan | daily_plan_confirmed | — | core |
| A. First Session | first dispatch | assignment_confirmed | — | core |
| A. First Session | first result | event_completed | — | core |
| A. First Session | first report | report_opened | — | core |
| A. First Session | first session completion | hub_returned | — | core |
| B. Day 1 Funnel | Day 1 start | day_started | day=1 | core |
| B. Day 1 Funnel | first event completed | event_completed | day=1 | core |
| B. Day 1 Funnel | first report viewed | report_opened | day=1 | core |
| B. Day 1 Funnel | Day 2 reached | pilot_day_started | pilotDay=2 | core |
| C. Pilot 1–7 Progression | daily completion rate | pilot_day_completed | — | core |
| C. Pilot 1–7 Progression | Day 3 reached | pilot_day_started | pilotDay=3 | core |
| C. Pilot 1–7 Progression | Day 7 reached | day7_report_opened | — | core |
| C. Pilot 1–7 Progression | pilot completed | pilot_completion_seen | — | core |
| C. Pilot 1–7 Progression | post-pilot offer viewed | post_pilot_offer_opened | — | core |
| D. Day 8+ Open-Ended Operation | Day 8 reached | main_operation_day_started | day>=8 | core |
| D. Day 8+ Open-Ended Operation | hub open-ended card viewed | hub_open_ended_card_viewed | — | core |
| D. Day 8+ Open-Ended Operation | operation era line viewed | hub_open_ended_focus_line_viewed | lineKind=operation_era | optional |
| D. Day 8+ Open-Ended Operation | district operation action viewed / selected | map_district_operation_hint_viewed | — | optional |
| D. Day 8+ Open-Ended Operation | story chain hint viewed | manual_proxy | — | optional |
| D. Day 8+ Open-Ended Operation | profile career showcase viewed | profile_career_showcase_viewed | — | core |
| E. Map / Route Engagement | map district intelligence viewed | map_district_intelligence_viewed | — | core |
| E. Map / Route Engagement | active route preview viewed | active_route_preview_viewed | — | core |
| E. Map / Route Engagement | route phase viewed | active_route_phase_viewed | — | core |
| E. Map / Route Engagement | route/resource warning viewed | active_route_resource_warning_viewed | — | core |
| F. Result / Report Engagement | result systems echo viewed | result_systems_echo_viewed | — | core |
| F. Result / Report Engagement | report systems card viewed | report_systems_card_viewed | — | core |
| F. Result / Report Engagement | tomorrow/carry-over line viewed | report_tomorrow_carryover_line_viewed | — | core |
| F. Result / Report Engagement | advisor comment viewed | advisor_hint_requested | — | optional |
| G. IAP / Monetization Funnel | post-pilot offer viewed | post_pilot_offer_opened | — | core |
| G. IAP / Monetization Funnel | product loaded | iap_product_list_loaded | — | core |
| G. IAP / Monetization Funnel | purchase started | iap_purchase_started | — | core |
| G. IAP / Monetization Funnel | purchase cancelled | manual_proxy | — | optional |
| G. IAP / Monetization Funnel | purchase failed | iap_purchase_failed | — | core |
| G. IAP / Monetization Funnel | purchase completed | iap_purchase_completed | — | core |
| G. IAP / Monetization Funnel | restore started | iap_restore_started | — | core |
| G. IAP / Monetization Funnel | restore completed | iap_restore_completed | — | core |
| G. IAP / Monetization Funnel | entitlement active | iap_purchase_completed | resultBand=success + accessMode transition | optional |
| H. Technical / Quality | crash rate placeholder | placeholder | — | core |
| H. Technical / Quality | app restart after report | hub_returned | — | core |
| H. Technical / Quality | offline graceful handling | manual_proxy | — | core |
| H. Technical / Quality | performance warning manual proxy | manual_proxy | — | core |
| H. Technical / Quality | smoke test status | manual_proxy | — | core |

## Funnel definitions

| Funnel | Steps | Success event |
|--------|-------|---------------|
| First Session Funnel | app_open → hub_view → event_inspect → plan → dispatch → result → report | report_opened |
| Day 1 Completion Funnel | day_start → event_completed → report_viewed → next_day_started | pilot_day_started |
| Pilot Completion Funnel | day_1_started → day_3_reached → day_7_reached → pilot_completed → post_pilot_offer_viewed | post_pilot_offer_opened |
| Open-Ended Engagement Funnel | day_8_reached → hub_open_ended_viewed → map_intelligence_viewed → district_action_selected → report_systems_viewed | report_systems_card_viewed |
| IAP Funnel | offer_viewed → product_loaded → purchase_started → purchase_completed → entitlement_active | iap_purchase_completed |

## Dashboard cards

| Card | Status | Owner | Chart | Question |
|------|--------|-------|-------|----------|
| First session completion | pending_sdk | product | funnel | İlk oturumda rapora kadar kaç oyuncu geliyor?… |
| Day 1 drop-off | pending_sdk | product | funnel | Gün 1 hangi adımda oyuncu kaybediliyor?… |
| Pilot day progression | pending_sdk | product | line | Pilot gün 1–7 ilerleme eğrisi nasıl?… |
| Day 8 reached | pending_sdk | product | bar | Pilot sonrası Day 8+ operasyona kaç oyuncu ulaşıyor?… |
| Post-pilot offer view | pending_sdk | monetization | funnel | Pilot tamamlayanların kaçı teklif ekranını görüyor?… |
| Purchase funnel | pending_sdk | monetization | funnel | Satın alma hunisinde nerede düşüş var?… |
| Map engagement | pending_sdk | product | bar | Harita intelligence ve rota önizlemesi kullanılıyor mu?… |
| Report engagement | pending_sdk | product | bar | Rapor sistem kartları ve carry-over satırları okunuyor mu?… |
| Profile career engagement | pending_sdk | product | bar | Profil kariyer vitrini açılıyor mu?… |
| IAP smoke status | manual_only | qa | status_badge | Sandbox smoke testleri geçti mi?… |
| Crash/performance placeholder | manual_only | engineering | table | Crash ve performans sinyalleri (SDK öncesi manuel).… |
| Manual blocker status | manual_only | release | status_badge | Soft launch review manuel blocker durumu.… |

## Alert thresholds

_Review thresholds — not hard-coded business truth._

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Day 1 completion rate | below 50% | investigate | Day 1 funnel adımlarını incele; tutorial ve plan yoğunluğunu gözden geçir. |
| First event completion rate | below 60% | high_risk | İlk olay keşfi ve plan→dispatch geçişini incele. |
| Day 7 reach rate | below 20% | review | Pilot pacing ve gün yoğunluğunu gözden geçir. |
| Day 8 reach rate | below 10% | review | Post-pilot değer önerisi ve Day 8 onboarding incele. |
| Offer view vs purchase start gap | gap_high offer_view >> purchase_start | investigate | IAP copy ve ürün sunumu incele. |
| Purchase start vs completion gap | gap_high purchase_started >> purchase_completed | investigate | Store/RevenueCat/IAP sandbox sorunlarını incele. |
| Report view rate | below benchmark TBD | review | Rapor yoğunluğu ve carry-over tekrarını incele. |
| Map intelligence view rate | below benchmark TBD | review | Map CTA ve keşfedilebilirlik incele. |

## Post-launch review questions

1. **Oyuncular ilk event'e ulaşıyor mu?** — _first_event_opened / first_session_funnel_ (product)
2. **İlk raporu görüyor mu?** — _report_opened day=1_ (product)
3. **Day 2'ye geçiyor mu?** — _pilot_day_started pilotDay=2_ (product)
4. **Day 7'ye ulaşıyor mu?** — _day7_report_opened_ (product)
5. **Day 8 teklifini görüyor mu?** — _post_pilot_offer_opened + main_operation_day_started_ (monetization)
6. **Hub open-ended card işe yarıyor mu?** — _hub_open_ended_card_viewed_ (product)
7. **Map intelligence kullanılıyor mu?** — _map_district_intelligence_viewed_ (product)
8. **Report çok ağır mı?** — _report_systems_card_viewed + session length proxy_ (product)
9. **Profile career showcase açılıyor mu?** — _profile_career_showcase_viewed_ (product)
10. **IAP offer görüntüleniyor mu?** — _post_pilot_offer_opened_ (monetization)
11. **Purchase flow nerede düşüyor?** — _iap_* funnel steps_ (monetization)
12. **Restore kullanılıyor mu?** — _iap_restore_*_ (monetization)
13. **District operation action seçiliyor mu?** — _map_district_operation_hint_viewed (selection gap)_ (product)
14. **Story chain hints okunuyor mu?** — _manual — event schema gap_ (product)
15. **Operation era preview fark ediliyor mu?** — _hub_open_ended_focus_line_viewed proxy_ (product)
16. **Resource fatigue oyuncuyu kaçırıyor mu?** — _active_route_resource_warning_viewed + churn cohort_ (product)
17. **Crash var mı?** — _crash SDK placeholder / manual reports_ (engineering)
18. **Offline davranış sorunlu mu?** — _manual QA + iap offline cases_ (engineering)
19. **Android/iOS farkı var mı?** — _platform segment (SDK sonrası)_ (product)
20. **Küçük ekranlarda drop-off artıyor mu?** — _screen size segment (SDK sonrası) + playtest notes_ (product)

## Event coverage gaps

_No coverage gaps — all required events in schema with day + privacy-safe payloads._

## Privacy guard

- Raw copy blocked: true
- Save dump blocked: true
- Precise location blocked: true
- Device ID policy aligned: true
- Purchase payload aligned: true
- Dashboard needs PII: no

## What is missing before real analytics dashboard?

- Production analytics SDK (Firebase/Amplitude/etc.) not connected
- Dashboard workspace and chart builds
- Platform/screen-size segmentation
- Crash SDK integration
- Purchase cancel event (store-native; schema gap — manual proxy)
- Story chain hint + district action selection events (optional backlog)

## Soft launch first 7 days review plan

1. **Day 0–1:** First session + Day 1 funnel — `verify:post-launch-telemetry-readiness` + manual playtest cross-check
2. **Day 2:** Day 2 transition rate vs Day 1 completion
3. **Day 3:** Pilot pacing — Day 3 reach threshold review
4. **Day 4–5:** Map/report engagement cards
5. **Day 6:** IAP offer view (if pilot nearing completion on test cohort)
6. **Day 7:** Pilot completion funnel + smoke status
7. **Day 8+:** Open-ended engagement funnel when cohort reaches Day 8
