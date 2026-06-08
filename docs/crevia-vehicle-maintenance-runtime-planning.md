# Vehicle Maintenance Runtime V1 Planning

## 1. Amaç

Content Pack Activation Full Aşama 1 sonrası Day 8+ şehir olaylarında `vehicle_route`, `resource_pressure`, araç yorgunluğu, rota dengesi ve saha destek sinyalleri daha anlamlı hale geldi. Bu pass, araç bakım sistemi için **runtime implementation’a geçmeden önce** güvenli state modeli, migration planı, bakım penceresi kuralları, resource fatigue bağlantısı, event/assignment etkisi, Map/Hub/Report yüzeyleri ve verify matrix’ini tasarlar.

**Ana oyuncu hissi:** *Rota ve araç kararlarım sadece bugünkü olayı değil, şehir filosunun bakım temposunu da etkiliyor.*

Bu çalışma **implementation değildir**. SAVE_VERSION 24 kalır; persist shape değişmez; gerçek araç bakım runtime’ı açılmaz.

## 2. Why after Content Pack Full Aşama 1

- Day 8+ `limited_full` modda `vehicle_route` ve `resource_pressure` domain’leri görünür.
- Assignment Layer araç grubu seçimi ve uyum skoru mevcut.
- Operational Resources / resource fatigue sistemleri hazır.
- City Archive, Story Chain ve yüzey duplicate guard’ları aktif.
- Bakım sistemi bu sinyalleri tek bir fleet-group modelinde birleştirebilir.

## 3. VehicleMaintenanceStateV1 target model

Implementation’da kullanılacak (bu pass’te persist’e eklenmeyecek):

```typescript
VehicleMaintenanceStateV1 {
  version: 1
  createdAtDay, updatedAtDay
  fleetGroups: Record<VehicleFleetGroupId, VehicleFleetGroupState>
  maintenanceWindows: VehicleMaintenanceWindow[]
  fatigueSummary
  routePressureSummary
  assignmentImpactSummary
  cityArchiveLinkSummary
  migrationMeta
  sourceSignals
}
```

**VehicleFleetGroupState:** `conditionBand`, `fatigueBand`, `availabilityBand`, `maintenanceNeedScore`, `routePressureScore`, `assignmentPressureScore`, `districtPressureIds`, `relatedArchiveEntryIds`, `playerVisibleLine`

**VehicleMaintenanceWindow:** `status` (suggested/planned/skipped/completed/expired), `windowKind`, `priority`, `tradeoffLine`, `expectedEffect`, `duplicateKey`

## 4. Fleet groups

| ID | Oyuncu etiketi | Bağlantı |
|---|---|---|
| `light_service` | Hafif saha desteği | social_trust, district_balance |
| `route_support` | Rota destek ekibi | Sanayi/İstasyon, vehicle_route, route_balanced |
| `container_support` | Konteyner saha ekibi | Cumhuriyet/Yeşilvadi, container_environment |
| `field_response` | Acil saha müdahale | crisis_adjacent, hızlı response |
| `backup_fleet` | Yedek destek hattı | yüksek baskılı günler, tampon |

Kurallar: tekil plaka/araç yok; GPS/canlı takip yok; UI’da teknik fleet ID görünmez.

## 5. Maintenance pressure scoring plan

`maintenanceNeedScore` 0–100; kaynaklar:

| Kaynak | Etki |
|---|---|
| consecutiveUseDays | +10/gün (1. günden sonra) |
| vehicle_route pressure | +15 |
| resource_pressure | +12 |
| poor assignment fit | +10 |
| route_balanced positive | -8 |
| completed maintenance window | -20 |
| backup overuse | +10 |
| crisis field response | +8 |

## 6. Maintenance window rules

- Day 1–3: görünmez / tutorial-safe hidden
- Day 4–7: passive hint, karar açma yok
- Day 8+: suggestion görünür
- `watch`/`strained` → suggested window
- `maintenance_due` → Hub/Report line
- `critical` → risk artar, panik dili yok
- Günde max 2 window önerisi; aynı grup spam yok
- Event seçim cap’lerini bozmaz
- Skipped → fatigue riski artar; completed → ertesi gün fatigue düşer

## 7. Assignment integration plan

- Araç grubu seçimi fatigue üretir (future).
- Yüksek uyumsuzluk + heavy route → needScore artışı.
- İyi uyum + balanced route → fatigue düşüşü.
- `field_response` üst üste → fatigue artışı.
- `backup_fleet` aşırı kullanım → availability düşüşü.
- **Non-goal:** Assignment UI/scoring değişmez (bu pass).

## 8. City Archive integration plan

Önerilen future entry kind’lar (bu pass’te eklenmez):

- `vehicle_maintenance_suggested`
- `vehicle_maintenance_completed`
- `vehicle_fatigue_warning`
- `fleet_recovered`

Kurallar: raw metadata yok; plaka/GPS yok; duplicateKey şart; kısa deterministic copy.

## 9. Story Chain integration plan

- Yüksek vehicle fatigue → `route_pressure_chain` başlat/advance
- Maintenance completed → closure/softening signal
- `resource_fatigue_chain` active → window önerisi güçlenir
- Story chain spam guard korunur

## 10. Content Pack Full integration plan

- `vehicle_route` pack events → maintenanceNeedScore input
- `resource_pressure` events → fatigue input
- reward/comeback route_balance → fatigue düşüşü
- Content Pack Aşama 2 max 3 açılmadan önce maintenance guard gerekir
- Bu pass runtime injection değiştirmez

## 11. UI surface plan

| Yüzey | Max line | Örnek |
|---|---|---|
| Hub | 1 | Araç hattı: Rota destek ekibi yarın hafif bakım penceresi istiyor. |
| Report | 1 | Araç bakım izi: Sanayi rota desteğinde yorgunluk izleniyor. |
| Map | 1 | resource marker breathe uyumlu hint |
| Assignment | 0 (future preview) | Üst üste kullanım uyarısı |
| City Journal | 1 | Bakım penceresi tamamlandı |

## 12. Day/access safety

| Gün | UI | Window |
|---|---|---|
| 1 | hidden | kapalı |
| 2–3 | hidden | kapalı |
| 4–7 | passive hint | kapalı |
| 8+ | suggested/visible | açık (kontrollü) |

Lite/full ayrımı “kilitli” gibi görünmez; premium copy yok.

## 13. V25 migration plan

- Mevcut: SAVE_VERSION **24** (bu pass)
- Implementation: SAVE_VERSION **25**

Adımlar:
1. `vehicleMaintenance` yoksa initial state oluştur
2. Day ≤ 7 → hidden/passive default
3. Day ≥ 8 → operationSignals, resource fatigue, archive’tan türet
4. Corrupt archive → safe default
5. Idempotent; duplicate window yok

## 14. Non-goals

- Runtime implementation
- Persist / SAVE_VERSION değişikliği
- Event generation / applyDecision / dayPipeline / assignment scoring değişikliği
- Content Pack Aşama 2 max 3
- Team Specialization, individual vehicle, garage screen
- AI / Remote Config / Live-Ops
- Manual launch blocker değişikliği
- Fake PASS

## 15. Verify sonucu

`npm run verify:vehicle-maintenance-planning`

## 16. Sonraki prompt

> **Vehicle Maintenance Runtime V1 Implementation:** SAVE_VERSION 25, persisted `vehicleMaintenance` state, v24→v25 migration, day-close fatigue update, maintenance window suggestion engine, Hub/Report compact line (max 1), Map resource marker hint, City Archive maintenance entry kinds. No individual vehicle list, no garage screen, no GPS tracking.

## 17. Commands

```bash
npm run typecheck
npm run verify:vehicle-maintenance-planning
npm run verify:content-runtime-activation-full-implementation
npm run verify:content-runtime-activation
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
