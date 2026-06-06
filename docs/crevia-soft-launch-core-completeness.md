# Crevia Soft Launch Core Completeness Audit

## Amaç
Soft launch öncesi Crevia teknik temelinin oyuncuya tam oyun hissi verip vermediğini denetler. Ana soru: oyuncu karar verdiğinde şehir tepki veriyor mu, Ece bunu fark ediyor mu, rapor bunu hatırlıyor mu, yarın buna göre anlam kazanıyor mu?

## Bu audit release readiness değildir
Bu audit klasik release readiness değildir. Store, IAP, privacy, screenshot ve metadata blockerlarını farkında tutar; ana odağı oyuncu deneyimi, karar etkisi, şehir hafızası, Day 8+ ana operasyon hissi, Ece/Sosyal Nabız/Rapor bağlantısı, mahalle anlamlılığı ve retention motivasyonudur.

## Oyuncu hissi odakları
- First 10 minutes oyuncuya ne yapacağını net anlatmalı.
- Day 1-7 pilot loop anlamlı ilerleme vermeli.
- Day 8+ oyun boşalmış değil, ana operasyon başlamış hissettirmeli.
- Decision impact chain rastgele puan değil, sebep-sonuç üretmeli.
- Tomorrow risk rapor sonunda bir gün daha oynama motivasyonu vermeli.
- Ece, Sosyal Nabız ve Rapor aynı olayı tutarlı yankılamalı.

## Audit alanları
- first_10_minutes: First 10 Minutes Completeness
- pilot_loop_day_1_7: Day 1-7 Pilot Loop Completeness
- day_8_main_operation_feel: Day 8+ Main Operation Feel
- decision_impact_chain: Decision Impact Chain
- tomorrow_risk_one_more_day: Tomorrow Risk / One More Day Motivation
- ece_social_report_echo_binding: Ece / Social Pulse / Report Echo Binding
- city_memory_archive_lite: City Memory / Operation Archive Lite Readiness
- district_report_card_lite: District Report Card / Mahalle Karnesi Lite Readiness
- content_variety_visibility: Content Variety Visibility
- map_as_living_city: Map as Living City
- player_style_recognition: Player Style Recognition
- weekly_bulletin_season_summary: Weekly Bulletin / Season Summary Readiness
- offline_resume_continuity: Offline / Resume / Continuity Risk
- performance_selector_ui_density: Performance / Selector / UI Density Risk
- monetization_iap_store_blockers: Monetization / IAP / Store Blocker Awareness

## Bulgular
Crevia technical foundation strong. Pilot loop, report integration, operation signals, district trust/memory/operations, carry-over, event echo, content packs, post-pilot foundations and telemetry readiness artifacts exist.

Main risk is not missing foundation; it is player-facing completeness. The strongest pre-soft-launch risks are decision impact explanation, tomorrow risk visibility, Ece/Social/Report echo binding, Day 8+ main operation feel, content variety visibility, and offline/resume robustness.

Launch candidate remains blocked by IAP/store/manual-test blockers. Internal device test can proceed as a separate activity while blockers are open.

## Soft launch öncesi must/should/optional işler
### Must
- Decision Impact Explanation Pass
- Tomorrow Risk Card + One More Day CTA Pass
- Ece / Social / Report Echo Binding Pass
- Day 8+ Main Operation Feel Pass
- Content Pack Runtime Activation Lite
- Release Candidate Audit

### Should
- Offline / Resume Robustness Pass
- Crash / Performance SDK Integration
- Localization EN/TR Polish
- Accessibility / Large Text Pass

### Optional
- Mahalle Karnesi Lite after completion pass if playtest shows district meaning gap.
- Şehir Günlüğü Lite after completion pass if playtest shows memory gap.
- Dynamic Map Reaction Lite after decision impact and echo binding passes.

## V1.1'e bırakılan işler
- Mahalle Karnesi Lite expansion: last 3 events, player style, citizen tone.
- Şehir Günlüğü Lite if soft-launch telemetry shows memory demand.
- Style badges for fast responder, social trust, resource saver, route balancer.
- Deterministic weekly municipality bulletin.
- Dynamic map reaction lite polish after completion pass.

## V2'ye bırakılan işler
- AI-supported weekly bulletin.
- Full living map layers: vehicle route drawing, container fill animation, full reaction layer.
- Persistent story chain runtime.
- Container Network Runtime.
- Vehicle Maintenance Runtime.
- Team Specialization Runtime.
- Seasonal Challenge System.

## Launch blocker'ları
- RevenueCat public keys missing.
- App Store product missing.
- Play Console product missing.
- IAP sandbox purchase test not completed.
- IAP restore test not completed.
- Real device playtest not completed.
- Privacy URL placeholder.
- Screenshots pending.
- Metadata console entry pending.

## Net karar
- Crevia technical foundation strong.
- Soft launch core needs completion pass.
- Launch candidate remains blocked until IAP/store/manual test blockers are closed.
- Do not open major runtime systems before completion pass.
- Prioritize decision impact, tomorrow risk, echo binding, Day 8+ feel, and content visibility.

## Sıradaki önerilen prompt
Decision Impact Explanation Pass

## Non-goals confirmed
- No new gameplay engine.
- No new monetization system.
- No real AI advisor integration.
- No Remote Config runtime.
- No Live-Ops system.
- No Story Chain Persistent Runtime.
- No District Operation Actions Persistence.
- No Container Network Runtime.
- No Vehicle Maintenance Runtime.
- No Team Specialization Runtime.
- No Seasonal Challenge System.
- No SAVE_VERSION increase.
- No persist schema change.
- No navigation route addition.
- No large UI redesign.
- No event generation rewrite.
- No dayPipeline or applyDecision core logic change.
