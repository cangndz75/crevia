# Crevia Mini Story Chain System

## Pack amaci

Mini Story Chain sistemi, oyuncuya **“dunku karar bugunku mahallede iz birakti; yarin toparlanma veya takip firsati dogabilir”** hissini vermek icin tasarlandi. Zincirler 2-3 gunluk kisa olay hatlari olarak authoring seviyesinde tanimlanir; her adim trigger, follow-up veya closure mantigiyla ilerler.

Bu patch **foundation / authoring** seviyesindedir. Runtime event generation, day pipeline veya persist baglantisi yoktur.

## Neden 2-3 gunluk zincir?

* Pilot ritmine uygun kisa hafiza penceresi
* Carry-over ve recovery tonunu abartmadan tasima
* Mahalle trust / memory / route sinyalleriyle uyumlu adim sayisi
* Mobil copy uzunlugu (72-96 karakter) icin uygun parca boyutu

## Neden bu patch runtime'a baglanmiyor?

* `ensureDailyEventsForDay` degismez
* `applyDecision` ve `dayPipeline` degismez
* Persist shape ve **SAVE_VERSION 23** korunur
* `isRuntimeLinked: false` — yalnizca hint / presentation foundation
* Sonraki asamada Hub / Map / Report / Result yuzeylerine guvenli baglanti planlanir

## Chain kind'lar

| Kind | Odak |
|------|------|
| `route_pressure_chain` | Rota / aktarma baskisi |
| `container_recovery_chain` | Konteyner cevresi toparlanma |
| `social_trust_chain` | Sosyal guven onarimi |
| `crisis_watch_chain` | Risk buyumeden takip (panik dili yok) |
| `district_recovery_chain` | Mahalle toparlanma penceresi |
| `visible_service_chain` | Gorunur hizmet algisi |
| `resource_fatigue_chain` | Kaynak / ekip dengeleme |
| `operation_followup_chain` | Operasyon takip izi |

## Step progression modeli

Desteklenen step kind'lar:

* `trigger` — zinciri baslatan saha sahnesi
* `follow_up` — ertesi gun veya ayni gun devam izi
* `pressure_shift` — kaynak / rota baskisi kaymasi
* `recovery_window` — toparlanma penceresi
* `reward_echo` — olculu olumlu yanki
* `comeback_window` — kontrollu geri donus
* `prevention_check` — onleyici kontrol adimi
* `closure` — kapanis veya kontrollu takip notu

Her step icin advisor, report, social, map, tomorrow ve result hint zorunludur.

## District trust / memory / route / crisis baglantisi

Resolver su kaynaklari **opsiyonel** okur; eksik state crash uretmez:

* `districtTrustRuntime` snapshot — fragile/strained recovery bonus
* `districtMemoryRuntime` snapshot — unresolved_carry_over / repeated_pressure follow-up bonus
* `resourceFatigue` — resource_fatigue_chain bonus
* `crisisState` — crisis_watch_chain bonus (panik dili yok)
* `activeRouteHint` — route_pressure / operation_followup bonus
* `recentChainKindIds` — freshness penalty

Gun 1: zincir karmasikligi **blocked** / **hidden**.

## Content pack baglantisi

8 template, mevcut pack family id'leriyle uyumlu referans tasir:

* District Pack 1
* Vehicle Route Pack
* Container Environment Pack
* Social Trust Pack
* Crisis Adjacent Pack

Bilinmeyen family id icin `resource_fatigue_balance_chain` fallback calisir. Pack'ler runtime'a baglanmaz.

## Scoring ozeti

| Sinyal | Etki |
|--------|------|
| District match | Guclu bonus |
| Domain match | Guclu bonus |
| Memory carry-over / repeated pressure | Follow-up bonus |
| Trust fragile / strained | Recovery / social bonus |
| Trust improving | Closure / reward bonus |
| Resource fatigue yuksek | Resource chain bonus |
| Crisis watch aktif | Crisis chain bonus |
| Active route | Route chain bonus |
| Ayni kind yakin zamanda | Freshness penalty |
| Gun 1 | Complexity blocked |

## Presentation helper'lar

* `buildStoryChainHubLine`
* `buildStoryChainMapLine`
* `buildStoryChainReportLine`
* `buildStoryChainResultLine`
* `buildStoryChainAdvisorLine`
* `buildStoryChainTomorrowLine`
* `buildStoryChainCompactChip`
* `buildStoryChainPresentationModel`

Copy kurallari: max 72-96 karakter; panik / premium / oyun sonu / kesin cozuldu dili yok.

## Analytics (gelecek)

`buildStoryChainAnalyticsHint()` — raw copy icermez:

* `chainKind`, `status`, `districtId`, `stepCount`, `variantBias`, `isRuntimeLinked: false`

## Template listesi (8)

1. `cumhuriyet_container_recovery_chain` — Cumhuriyet, 3 step
2. `sanayi_route_pressure_chain` — Sanayi, 3 step
3. `istasyon_transfer_flow_chain` — Istasyon, 3 step
4. `yesilvadi_environmental_recovery_chain` — Yesilvadi, 3 step
5. `merkez_visible_service_chain` — Merkez, 3 step
6. `social_trust_repair_chain` — Cumhuriyet / Merkez, 3 step
7. `crisis_watch_prevention_chain` — Sanayi / Istasyon, 3 step
8. `resource_fatigue_balance_chain` — Tum mahalleler, 3 step

## Future integration sirasi

1. Story Chain Runtime Hint Binding
2. Story Chain Report / Map UI Binding
3. Operation Era Pack
4. Reward / Comeback Pack
5. Live-Ops Theme Pack

## SAVE_VERSION

`save_version degismez` — bu pack persist veya runtime activation eklemez.
