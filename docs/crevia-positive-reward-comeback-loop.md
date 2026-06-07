# Crevia — Positive Reward & Comeback Visibility Loop (Aşama 1)

## 1. Amaç

Oyuncunun sadece sorun çözen değil, başarıyı ve toparlanmayı da hisseden bir şehir yöneticisi gibi deneyim yaşamasını sağlamak. Pozitif sonuçlar, recovery anları, comeback fırsatları ve “dünkü karar işe yaradı” hissi daha görünür olsun.

Ana oyuncu hissi: *"Dünkü kararım işe yaradı. Mahalle toparlandı. Halk bunu fark etti. Kötü giden yeri de bugün toparlama şansım var."*

## 2. Neden şimdi gerekli

Advisor Operational Relationship Pass Aşama 1 tamamlandı; Ece artık oyuncu tarzı ve önceki kararları bağlayabiliyor. Ancak pozitif/recovery görünürlüğü hâlâ risk ve problem takibinin gölgesinde kalıyordu. Bu pass duygusal/operasyonel geri bildirimi güçlendirir.

## 3. Reward vs economy reward farkı

Bu sistem **ekonomi ödülü değildir**. Coin, currency, loot, chest, gacha, premium reward yok. Amaç operasyonel ve duygusal geri bildirim: mahalle toparlandı, karar işe yaradı, comeback fırsatı var.

## 4. Comeback philosophy

Comeback satırları suçlayıcı değil. “Dün kötü yaptın” demez; “bugün toparlama fırsatı var” der. Kötüleşme, carry-over, Tomorrow Risk watch ve strained district sinyallerinden türetilir.

## 5. Moment model

`RewardComebackVisibilityModel` — `src/core/rewardComeback/`

- `moments[]`, `primaryMoment`, surface lines (`hubLine`, `reportLine`, `socialLine`, `mapLine`, `eceLine`, `journalLine`, `resultLine`)
- `RewardComebackMoment`: kind, tone, district, title, line, playerFacingLabel, mapReactionKind

Moment kinds: `decision_worked`, `district_recovered`, `risk_prevented`, `route_balanced`, `container_relief`, `resource_recovered`, `social_thanks`, `comeback_available`, `comeback_completed`, `reward_event_seen`, `advisor_prediction_confirmed`, vb.

## 6. Source signals

Decision Impact, Advisor Relationship, City Echo, Tomorrow Risk, Carry-over, District Report Card, City Journal, Map Reaction, Content Pack metadata, Operation Signals, Resource Fatigue, Main Operation Feel.

## 7. Day-based visibility

| Gün | Görünürlük | Max moment |
|-----|------------|------------|
| 1 | Very light | 1 |
| 2–3 | Compact | 1 |
| 4–7 | Standard | 1 |
| 8+ | Standard / highlighted | 2 |

## 8. Surface integration

| Yüzey | Helper |
|-------|--------|
| DecisionResultScreen | `buildRewardComebackResultPresentation` — küçük chip |
| HubAdvisorCard | `buildRewardComebackHubPresentation` — supporting line |
| EndOfDayReportView | `buildRewardComebackReportPresentation` — olumlu iz satırı |
| Social Pulse | `buildRewardComebackSocialPresentation` |
| Map | `buildRewardComebackMapPresentation` — recovery_glow/trust_pulse |
| Ece | moment `eceLine` + advisor relationship bağlantısı |
| City Journal | `journalLine` helper |

## 9. Content pack integration

Variant kinds: `reward`, `comeback`, `recovery`, `improved`, `prevented`, `positive_followup`, `social_trust`, `resource_recovery`

Teknik pack adı görünmez. Event injection cap'leri değiştirilmez (`rewardVariantAllowed` korunur).

## 10. Duplicate guard

`isDuplicateRewardComebackLine` — Decision Impact, Tomorrow Risk, City Echo, City Journal, District Report Card, Map Reaction, Advisor Relationship ile çakışma baskılanır.

## 11. Copy guard

Yasak: ödül kazandın, coin, para, sandık, premium, panik, pack, metadata, runtime, suçlayıcı dil.

## 12. Non-goals

- Ekonomi reward / monetization değişikliği yok
- `applyDecision`, `dayPipeline`, event generation core değişmedi
- SAVE_VERSION / persist shape değişmedi
- AI, Remote Config, Story Chain açılmadı

## 13. Verify sonucu

`npm run verify:reward-comeback` — model, moment kinds, integration, content pack, copy guard, safety.

## 14. Sonraki önerilen prompt

> Crevia için Positive Reward & Comeback Visibility Pass Aşama 2 yap: Hub'da city journal strip ile reward moment birleşimini zenginleştir; profile/career showcase'e operasyonel başarı özeti helper'ı ekle; content pack reward variant'ları için görsel chip polish (economy olmadan).

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:reward-comeback
npm run verify:advisor-relationship
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:map-reactions
npm run verify:content-runtime-activation
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:social-pulse-ui
npm run verify:event-result-ui
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:full-loop
npm run verify:full-ux-flow
```
