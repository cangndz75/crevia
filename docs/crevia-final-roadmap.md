# Crevia Final Roadmap — Scope Freeze & Soft Launch Polish

## Amaç

Crevia artık yeni büyük gameplay sistemi açma aşamasında değil. Bu doküman soft-launch öncesi **final polish** döneminde merkezi kapsam koruma, roadmap guard ve verify/audit referansıdır.

**Bu patch gameplay davranışını değiştirmez.** Yeni event üretimi, `applyDecision` sonucu, authority/badge/progression motoru, monetization davranışı, post-pilot phase akışı ve persist state shape değiştirilmez.

Kaynak kod: `src/core/quality/finalPolish/`  
Verify: `npm run verify:final-polish`

## Scope Freeze Kuralları

- Pilot gün 1–7 akışı bozulmayacak.
- Gün 1 tutorial / progressive reveal bozulmayacak.
- `applyDecision` core davranışı değişmeyecek.
- Authority, badge, progression, leaderboard core motorları değişmeyecek.
- Post-pilot `limited` / `light` / `full` ayrımı korunacak.
- `SAVE_VERSION` yalnızca persist shape değişirse artacak (şu an: **23**).
- Yeni route/screen açılmayacak (roadmap maddesi `allowsNewRoute: true` değilse).
- Büyük gameplay sistemi eklenmeyecek.
- UI patch’lerinde mobile overflow guard korunacak.
- Harita, içerik, danışman, rapor, sosyal nabız, analytics ve monetization işleri aşamalı yapılacak.
- Her yeni patch `verify:final-polish` ve ilgili domain verify ile kapanacak.

## Yapılmayacaklar

Final polish döneminde **yasaklı veya later**:

| Kapsam | Not |
| --- | --- |
| Tam gerçek zamanlı rota simülasyonu | Full logistics simulation |
| Gerçek GPS / pathfinding | Harita yalnızca presentation |
| Tekil personel envanteri | Aggregate signals |
| Tekil araç filosu yönetimi | — |
| Tekil konteyner kapasite simülasyonu | — |
| Drag-drop dispatch | Mevcut karar kartı akışı |
| Yeni büyük navigation sistemi | Alt nav kökten değişmez |
| Season 2 restart | — |
| Çoklu danışman upgrade sistemi | — |
| Runtime AI advisor entegrasyonu | `ai_later` grubu |
| Büyük monetization redesign | Checklist + sandbox odak |
| `applyDecision` refactor | Blocker guard |
| Authority / badge / progression engine rewrite | Blocker guard |
| SAVE_VERSION gereksiz artış | Persist shape değişmeden |

## Yapılabilecekler

- Content pack genişletme
- Event writing standard
- Presentation helper
- UI prioritization
- Map presentation layer
- Lightweight derived state
- Carry-over presentation
- Social echo presentation
- Advisor template variation
- Report preview
- Day 7 recap
- Main operation preview polish
- Analytics SDK adapter
- IAP manual setup checklist
- EAS smoke test checklist
- Manual playtest checklist
- Release candidate audit

## Final Prompt Sırası

| # | Madde | Grup |
| --- | --- | --- |
| 0 | Scope Freeze & Final Polish Guard | scope_freeze |
| 1 | Daily Theme Rhythm | anti_boredom_core |
| 2 | Dynamic Event Writing Standard + Content Schema Audit | anti_boredom_core |
| 3 | Content Safety Pack Aşama 1: Mahalle + Konteyner | content_safety_pack |
| 4 | Content Safety Pack Aşama 2: Araç/Rota + Personel + Sosyal/Kriz | content_safety_pack |
| 5 | Content Safety Pack Aşama 3: Ece + Social + Report Echo | content_safety_pack |
| 6 | Event Domain UI Prioritization | decision_visibility |
| 7 | Carry-over Memory Cards | decision_visibility |
| 8 | Dynamic Social Echo | decision_visibility |
| 9 | Report Tomorrow Preview | decision_visibility |
| 10 | Dynamic Field Presence Map Layer | dynamic_map_presence |
| 11 | Resource Fatigue Visual States | resource_visual_states |
| 12 | Map Before After State | dynamic_map_presence |
| 13 | Ece Player Style Recognition | advisor_depth |
| 14 | Advisor Seniority System | advisor_depth |
| 15 | Specialist Advisor Notes MVP | advisor_depth |
| 16 | Day 7 Personal Pilot Recap | premium_wow |
| 17 | Main Operation Trailer Preview | premium_wow |
| 18 | Reward Showcase Moments | premium_wow |
| 19 | Public Bulletin Polish | premium_wow |
| 20 | Post-Pilot Variety Polish | post_pilot_variety |
| 21 | District Story Arcs MVP | post_pilot_variety |
| 22 | Rare Special Incidents | post_pilot_variety |
| 23 | Season Goal Variety Polish | post_pilot_variety |
| 24 | Dynamic Bottom Nav Alerts | post_pilot_variety |
| 25 | Analytics SDK Adapter + Dashboard Funnel | analytics_sdk |
| 26 | RevenueCat Store Manual Setup | monetization_iap |
| 27 | EAS Dev Build IAP Sandbox Smoke Test | monetization_iap |
| 28 | Manual Playtest Checklist | manual_playtest |
| 29 | Release Candidate Audit | release_candidate |

**AI Later:** AI-1 … AI-6 (`ai_later` grubu, status `later`).

## Anti-Boredom Core

- **Daily Theme Rhythm** — günlük tema etiketi ve ritim; generation motoru değişmez.
- **Dynamic Event Writing Standard** — authoring guide ve schema audit; `verify:event-authoring`.

## Content Safety Pack

Üç aşamalı içerik güvenliği: mahalle/konteyner → araç/personel/sosyal/kriz → Ece/social/report echo. Her aşama content pack genişletmesi; core motor rewrite yok.

## Decision Visibility

Carry-over kartları, sosyal echo, rapor yarın önizlemesi ve event domain UI önceliklendirme — yalnızca presentation / derived state.

## Dynamic Field Presence Map Layer

Harita **presentation katmanı** hedefleri:

- **Container cluster marker** — konteyner küme göstergesi
- **Vehicle marker** — araç saha varlığı
- **Team marker** — ekip saha varlığı

Gerçek GPS, pathfinding ve tam rota simülasyonu **yok**.

## Advisor Depth

Şablon tabanlı Ece stil tanıma, danışman kıdem, uzman notları MVP. Runtime AI **ai_later** fazında.

## Premium Wow Layer

Gün 7 recap, ana operasyon trailer preview, ödül showcase, public bulletin — paywall dili preview copy’de yok.

## Analytics Current Status

- Analytics Runtime Instrumentation MVP **Aşama 2 tamamlandı**.
- **33** privacy-safe event runtime’da instrument edildi.
- `verify:analytics-runtime` — **96 PASS, 0 FAIL**.
- `verify:analytics-events` — **88 PASS, 3 WARN**.
- Runtime hâlâ **no-op** (gerçek gönderim yok).
- Gerçek SDK ve dashboard funnel **eksik**.
- `launch_candidate` analytics **blocker devam ediyor**.
- Sonraki analytics adımı: **Analytics SDK Adapter + Dashboard Funnel Setup**.

## Monetization/IAP Closure

- Ürün tasarımı: `docs/crevia-iap-product-design.md`
- Sıradaki: RevenueCat Store manual setup + EAS dev build IAP sandbox smoke
- Verify: `verify:monetization-gate`, `verify:iap-sandbox-qa`, `verify:iap-product-design`

## Manual Playtest

`manual-playtest-checklist` — pilot 1–7 ve post-pilot phase manuel smoke; `verify:player-flow-audit` ile desteklenir.

## Release Candidate Audit

Tüm regression verify, soft-launch readiness ve final-polish guard PASS hedefi.

## AI Later

| ID | Başlık |
| --- | --- |
| ai-advisor-architecture-foundation | AI-1 Advisor AI Architecture Foundation |
| ai-ece-dynamic-comments | AI-2 Ece Dynamic Comments |
| ai-player-style-analysis | AI-3 Player Style AI Analysis |
| ai-specialist-advisor-notes | AI-4 Specialist Advisor AI Notes |
| ai-dynamic-report-city-bulletin | AI-5 Dynamic Report & City Bulletin |
| ai-season-end-evaluation | AI-6 Season End AI Evaluation |

Final polish main path’te runtime AI entegrasyonu **yasak**.

## İlk Sonraki Prompt Önerisi

**Crevia Daily Theme Rhythm** — `daily-theme-rhythm` roadmap maddesi; pilot ritmi ve `verify:pilot-rhythm` korunarak günlük tema presentation katmanı.
