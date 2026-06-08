# Team Specialization Runtime V1 Planning

## 1. Amaç

Vehicle Maintenance Runtime V1 Implementation sonrası ekip/araç kararları daha anlamlı hale gelecek. Bu pass'in amacı Team Specialization Runtime V1 implementation'a geçmeden önce ekip uzmanlığı state modeli, migration planı, assignment bağlantısı, vehicle maintenance bağlantısı, City Archive/Story Chain etkisi, Hub/Report/Map yüzeyleri ve verify matrix'ini tasarlamak.

**Ana oyuncu hissi:** *Ekipleri sürekli aynı tarz olaylara yönlendirdikçe deneyim kazanıyorlar; ama aşırı kullanım yorgunluk ve denge riski yaratıyor.*

Bu çalışma **implementation değildir**. SAVE_VERSION 25 kalır; persist shape değişmez; gerçek team specialization runtime'ı açılmaz.

## 2. Why after Vehicle Maintenance

- Vehicle Maintenance V1 fleet fatigue ve maintenance window sinyalleri sağlar.
- Assignment Layer personel grubu, araç grubu, müdahale yaklaşımı ve uyum skoru mevcut.
- Operational Resource Presence / resource fatigue sistemleri hazır.
- City Archive persistent; Story Chain Persistent Runtime aktif.
- Content Pack Activation Full Aşama 1 aktif.
- Hub/Report/Map duplicate ve density guard'ları mevcut.
- Ekip uzmanlığı bu sinyalleri grup bazlı bir modelde birleştirebilir.

## 3. TeamSpecializationStateV1 target model

Implementation'da kullanılacak (bu pass'te persist'e eklenmeyecek):

```typescript
TeamSpecializationStateV1 {
  version: 1
  createdAtDay, updatedAtDay
  teamGroups: Record<TeamGroupId, TeamGroupSpecializationState>
  specializationSummary
  fatigueSummary
  assignmentFitSummary
  districtExperienceSummary
  cityArchiveLinkSummary
  vehicleMaintenanceLinkSummary
  migrationMeta
  sourceSignals
}
```

**TeamGroupSpecializationState:** `specializationBand`, `fatigueBand`, `moraleBand`, `dominantDomain`, `secondaryDomain`, `experienceScore`, `fatigueScore`, `moraleScore`, `consecutiveUseDays`, `districtExperienceIds`, `relatedArchiveEntryIds`, `suggestedUseLine`, `cautionLine`, `duplicateKey`

**Bands:**
- specializationBand: `none` | `emerging` | `trained` | `reliable` | `expert_preview`
- fatigueBand: `low` | `moderate` | `high` | `strained`
- moraleBand: `steady` | `watch` | `motivated` | `tired`

## 4. Team groups

| ID | Oyuncu etiketi | Bağlantı |
|---|---|---|
| `field_coordination` | Saha koordinasyon ekibi | district_balance, operation_followup, crisis_adjacent |
| `route_cleanup` | Rota temizlik grubu | vehicle_route, route_pressure_chain, Sanayi/İstasyon |
| `container_service` | Konteyner saha grubu | container_environment, container_recovery_chain, Cumhuriyet/Yeşilvadi |
| `social_response` | Sosyal müdahale grubu | social_trust, publicTone, reward/comeback |
| `rapid_support` | Hızlı destek ekibi | crisis_adjacent, field_response |
| `backup_team` | Yedek destek ekibi | yoğun gün tamponu, aşırı kullanımda fatigue/morale riski |

Kurallar: bireysel personel adı yok; maaş/işçi yönetimi yok; sendika hassasiyeti yok; UI'da teknik team ID görünmez.

## 5. Specialization scoring plan

**ExperienceScore** kaynakları:

| Kaynak | Etki |
|---|---|
| Same domain successful assignment | +10 |
| High compatibility | +6 |
| Repeated same district/domain success | +5 |
| Reward/comeback positive | +8 |
| Story chain closure | +8 |
| Poor fit or failed outcome | -4 |
| Fatigue high | gain azalır |
| Backup overuse | morale düşer |

Kaynaklar: Assignment personel grubu, uyum skoru, event domain/outcome, City Archive, Story Chain, District Report Card playerStyleInDistrict, Content Pack domain, Reward/Comeback, Operational Resources, Vehicle Maintenance fatigue.

## 6. Fatigue/morale scoring plan

**FatigueScore:**

| Kaynak | Etki |
|---|---|
| Consecutive use | +10/gün (1. günden sonra) |
| rapid_support + field_response heavy day | +12 |
| crisis_adjacent | +10 |
| Poor fit | +8 |
| Completed recovery/rest window | -15 |
| Successful balanced assignment | -5 |

**MoraleScore:**

| Kaynak | Etki |
|---|---|
| Positive outcome | +8 |
| Public thanks/social_trust | +6 |
| Repeated strain | -8 |
| Backup overuse | -6 |
| Team capacity stable | +4 |

## 7. Assignment integration plan

- Assignment personel grubu specialization input olacak.
- Good fit + matching domain → specialization gain.
- Poor fit + repeated use → fatigue increase.
- Same team repeated every day → fatigue increase.
- Backup team emergency buffer; spam → morale düşer.
- Vehicle group + team group future combined fit üretebilir.

**Non-goal:** Assignment UI değiştirme; assignment scoring rewrite.

## 8. Vehicle Maintenance integration plan

Vehicle Maintenance V1 varsa:

- `route_cleanup` + `route_support` sık kullanım → route fatigue artabilir.
- `rapid_support` + `field_response` heavy → iki tarafta strain sinyali.
- `container_service` + `container_support` dengeli → container relief.
- `maintenance_due` araç grubu → ilgili ekipte `cautionLine`.

Plan: `vehicleMaintenanceLinkSummary` okur; araç bakım riskini ekip uzmanlaşması ile duplicate etmez; vehicle fatigue ve team fatigue ayrı ama ilişkili kalır.

## 9. City Archive integration plan

Önerilen future entry kind'lar (bu pass'te eklenmez):

- `team_specialization_gained`
- `team_fatigue_warning`
- `team_morale_recovered`
- `team_domain_mastery`
- `backup_team_overused`

Kurallar: raw personnel data yok; bireysel isim yok; duplicateKey şart; kısa deterministic copy.

Örnek copy:
- *"Ekip izi: Rota temizlik grubu Sanayi hattında deneyim kazandı."*
- *"Ekip yorgunluğu: Hızlı destek ekibi üst üste yoğun güne çıktı."*
- *"Ekip toparlandı: Sosyal müdahale grubu bugünkü güven çizgisini güçlendirdi."*

## 10. Story Chain integration plan

Bağlanabilir chain'ler: `route_pressure_chain`, `container_recovery_chain`, `social_trust_chain`, `crisis_watch_chain`, `resource_fatigue_chain`, `operation_followup_chain`.

- Matching team success → advance/soften chain.
- Team fatigue high → `resource_fatigue_chain` sadece guard altında.
- Story closure → specialization gain.
- No story chain spam; team signal low-priority input.

## 11. Content Pack integration plan

Content Pack Full Aşama 1 domain'leri:

- `personnel_morale` → Team Specialization V1 sonrası daha güvenli genişler.
- `social_trust` → `social_response` deneyim.
- `vehicle_route` → `route_cleanup` deneyim/fatigue.
- `container_environment` → `container_service` deneyim.
- `crisis_adjacent` → `rapid_support` fatigue riski.
- `reward_positive` / `comeback_recovery` → morale recovery.

Bu pass runtime injection değiştirmez. Content Pack Aşama 2 max 3 açılmaz.

## 12. UI surface plan

| Yüzey | Max | Örnek |
|---|---|---|
| Hub (Day 8+) | 1 | *"Ekip izi: Rota temizlik grubu Sanayi hattında deneyim kazanıyor."* |
| Report | 1 | *"Ekip yorgunluğu: Hızlı destek hattı yarın daha dikkatli kullanılmalı."* |
| Map | 1 | *"Ekip desteği: Cumhuriyet konteyner ekibi sahada daha net iz bırakıyor."* |
| Assignment (future) | preview | *"Bu ekip bu tür olaylarda deneyim kazandı."* |
| City Journal | 1 | anlamlıysa |

No new route. No profile/team detail screen in V1.

## 13. Day/access safety

| Gün | Görünürlük |
|---|---|
| Day 1 | hidden |
| Day 2–3 | no specialization visible |
| Day 4–7 | passive behind-the-scenes / minimal hint |
| Day 8+ | visible compact line (max 1 Hub/Report/Map) |

Full access locked/premium copy göstermez. "Uzman ekip satın al" iması yok.

## 14. V26 migration plan

Implementation V1 muhtemelen **SAVE_VERSION 26** gerektirir (Vehicle Maintenance V1 = 25).

Bu pass SAVE_VERSION değiştirmez; sadece plan yazar.

Migration adımları:
1. v25 save without `teamSpecialization` → initial `TeamSpecializationStateV1`
2. Day ≤ 7 → hidden/passive default (`none`/`low`/`steady`)
3. Day ≥ 8 → derive from assignment/resource/archive if available
4. Missing/corrupt cityArchive/vehicleMaintenance → safe default
5. Idempotent; no duplicate entries; no crash on missing personnel group

## 15. Non-goals

- Team Specialization Runtime implementation
- Persist shape değiştirme / SAVE_VERSION artırma
- Migration implementation
- Personel bireysel isim/seviye sistemi
- Yeni personel yönetim ekranı
- Assignment scoring rewrite
- Vehicle Maintenance runtime rewrite
- applyDecision / event generation / dayPipeline değiştirme
- Content Pack Aşama 2 max 3
- AI / Remote Config / Live-Ops
- Yeni route / büyük UI redesign
- Manual launch blocker/evidence değiştirme
- Fake PASS

## 16. Verify sonucu

`npm run verify:team-specialization-planning` çalıştırıldığında:

- Planning model, 6 grup, band'ler, scoring, integration, UI, day safety, V26 migration ve scope doğrulanır.
- SAVE_VERSION 25 unchanged; persist shape unchanged; runtime closed.
- Public launch blocked; evidence verified = 0.

## 17. Sonraki prompt

**Team Specialization Runtime V1 Implementation:**

- SAVE_VERSION 26
- persisted `teamSpecialization` state
- v25 → v26 migration
- day-close team experience/fatigue update
- assignment read-only input
- Hub/Report compact team lines
- City Archive future team entries
- Story Chain low-priority team signal
- no individual personnel list
- no team detail route
- no payroll/worker management

**Not included:** individual personnel profiles, hiring/firing, economy upgrade, paid team boost, morale shop, AI suggestions, live ops.

## 18. Commands

```bash
npm run typecheck
npm run verify:team-specialization-planning
npm run verify:vehicle-maintenance
npm run verify:vehicle-maintenance-planning
npm run verify:content-runtime-activation-full-implementation
npm run verify:city-archive
npm run verify:story-chain-persistent-runtime
npm run verify:district-report-card
npm run verify:operational-resource-presence
npm run verify:assignment-layer
npm run verify:map-reactions
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
npm run verify:release-candidate
npm run verify:manual-launch-tracker
```
