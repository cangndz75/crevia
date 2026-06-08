# Crevia — Vehicle Maintenance Runtime V1

## 1. Amaç

Fleet-group tabanlı araç bakım baskısı ve bakım penceresi hissi veren ilk güvenli runtime. Oyuncu hissi: rota ve araç kararları sadece bugünü değil, filonun bakım temposunu ve yarınki operasyon riskini de etkiler.

## 2. What changed

- `SAVE_VERSION` 24 → 25; persisted `vehicleMaintenance` state eklendi.
- Day-close engine: fatigue/condition güncelleme, deterministik scoring.
- Day 8+ bakım penceresi önerileri (internal max 2/gün).
- Hub / Report / Map / City Archive yüzey entegrasyonu (her biri max 1 satır).
- v24→v25 güvenli migration.

## 3. Persist shape / SAVE_VERSION 25

`gamePersist.vehicleMaintenance`: `VehicleMaintenanceStateV1`

- `version`, `createdAtDay`, `updatedAtDay`
- `fleetGroups` (5 grup)
- `maintenanceWindows`
- `fatigueSummary`, `routePressureSummary`, `assignmentImpactSummary`
- `cityArchiveLinkSummary`, `migrationMeta`, `sourceSignals`

## 4. Fleet groups

`light_service`, `route_support`, `container_support`, `field_response`, `backup_fleet`

Her grup: `conditionBand`, `fatigueBand`, `availabilityBand`, skorlar, `playerVisibleLine`, `duplicateKey`.

Day ≤ 7: stable/low/ready pasif. Day ≥ 8: operasyon sinyallerinden türetilir.

## 5. Maintenance scoring

Deterministik (Math.random yok). Örnek katkılar:

- consecutive use +10/gün
- vehicle_route +15, resource_pressure +12
- poor assignment fit +10, route_balanced −8
- completed window −20, resource_recovery −10

Bantlar: 0–24 stable, 25–44 watch, 45–64 strained, 65–79 maintenance_due, 80+ critical.

## 6. Maintenance window engine

- Day 1–3: pencere yok
- Day 4–7: pasif internal
- Day 8+: `suggested` görünür olabilir
- Max 2 öneri/gün; aynı grup aynı gün tekrarlanmaz
- `expired` / `skipped` / `completed` day-close’ta türetilir

## 7. Day-close update timing

`endCurrentDay` → `buildVehicleMaintenanceDayCloseBundle` → state güncelleme + isteğe bağlı archive append.

## 8. Assignment integration

Read-only: seçili araç grubu, uyumluluk skoru, yaklaşım. Scoring rewrite veya UI değişikliği yok.

## 9. City Archive integration

Yeni kinds: `vehicle_maintenance_suggested`, `vehicle_maintenance_completed`, `vehicle_fatigue_warning`, `fleet_recovered`.

Max 1 maintenance archive entry/gün; story_chain / reward ile çakışmada suppress.

## 10. Story Chain integration

`buildVehicleMaintenanceStorySignal` export — route/resource chain sinyali güçlendirme/yumuşatma. Mevcut story chain engine guard’ları authoritative.

## 11. Content Pack integration

Full Aşama 1 read-only: `vehicle_route`, `resource_pressure`, route_balanced / comeback sinyalleri skora yansır. Aşama 2 (max 3 pack/gün) açılmadı.

## 12. Hub / Report / Map / City Journal surfaces

| Yüzey | Max | Örnek |
|-------|-----|-------|
| Hub | 1 | Araç hattı: Rota destek ekibi yarın hafif bakım penceresi istiyor. |
| Report | 1 | Araç bakım izi: … |
| Map | 1 | Araç desteği: Rota hattı bakım izinde. |
| City Journal | archive | Bakım penceresi / Filo toparlandı |

## 13. Copy / privacy guard

Yasak: plaka, GPS, canlı takak, premium, pack, metadata, runtime, AI, panik.

İzinli: araç hattı, rota destek ekibi, hafif bakım penceresi, yorgunluk izleniyor, filo toparlandı.

## 14. Migration V25

- Eksik `vehicleMaintenance` → initial state
- Day ≤ 7 → pasif stable
- Day ≥ 8 → mevcut sinyallerden türet
- Corrupt → safe initial + `migrationMeta` warning
- Idempotent; migration sırasında archive backfill yok

## 15. Non-goals

Tekil araç/plaka, GPS, garage ekranı, applyDecision / event generation / dayPipeline rewrite, Content Pack max 3, Team Specialization, IAP/evidence/manual blocker değişikliği.

## 16. Verify sonucu

`npm run verify:vehicle-maintenance` — runtime V1 kontrolleri.

## 17. Sonraki prompt

Vehicle Maintenance V1.1: bakım penceresi planlama etkileşimi, assignment preview compact hint, story chain engine’e doğrudan sinyal hook, device evidence.

## 18. Commands

```bash
npm run typecheck
npm run verify:vehicle-maintenance
npm run verify:vehicle-maintenance-planning
npm run verify:city-archive
npm run verify:story-chain-persistent-runtime
npm run verify:full-loop
npm run verify:release-candidate
npm run verify:manual-launch-tracker
```
