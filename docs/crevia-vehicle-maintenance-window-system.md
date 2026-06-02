# Crevia Vehicle Maintenance Window System

## 1. Amaç

Araç bakım penceresi, araç/rota baskısını oyuncuya yönetilebilir trade-off olarak gösterir: “bugün hızlı devam et, yarını zorla” veya “bugün bakım penceresi aç, yarını koru”. Bu patch presentation-level foundation kurar; runtime aktivasyon yoktur.

## 2. Ne değildir?

- Bu foundation **tekil araç sistemi değildir**.
- **Araç inventory değildir**.
- Bu foundation **upgrade economy değildir** — araç yükseltme ekonomisi yoktur.
- Gerçek rota optimizasyonu veya pathfinding değildir.
- **Persisted vehicle state değildir**.

## 3. Maintenance window modeli

| Alan | Açıklama |
| --- | --- |
| `readinessScore` | Bakım penceresinin açılabilirliği (0–100) |
| `urgencyScore` | Bakım ihtiyacının aciliyeti (0–100) |
| `riskLevel` | low → critical |
| `kind` | preventive_check, route_load_rebalance, fatigue_recovery, vb. |
| `tradeoffTypes` | protect_tomorrow, push_today, rebalance_route, vb. |
| `suggestedTeamSpecializationId` | Teknik/Rota Destek önerisi |

## 4. Team specialization bağlantısı

- `technical_team_preventive_maintenance` readiness artırır
- `route_support_discipline` route_load_rebalance readiness artırır
- teamSpecialization engine behavior değiştirilmez

## 5. Active task route bağlantısı

Route pressure (`high`/`critical`) urgency artırır. `vehicle_route` domain maintenance kind’ı etkiler. activeTaskRoutes engine değiştirilmez.

## 6. District operation bağlantısı

Sanayi `route_discipline` ve `vehicle_resource` operasyonları readiness/urgency sinyali verir. `resource_balance` kind fatigue_recovery ile ilişkilidir. districtOperations behavior değiştirilmez.

## 7. Event family bağlantısı

`vehicle_route`, `resource_recovery`, `crisis_adjacent` domainleri urgency/readiness etkiler. Event generation değişmez.

## 8. Operational resources / resource fatigue bağlantısı

Vehicle `maintenanceRisk`, `routePressure`, `capacityPressure` ve status safe optional okunur. operationalResources/resourceFatigue engine değiştirilmez.

## 9. Rank permission bağlantısı

- `vehicle_maintenance_window_preview`
- `resource_pressure_summary`
- `map_resource_layer`
- `assignment_fit_preview`

## 10. Bu patchin sınırları

- **SAVE_VERSION yok**
- **Persist yok**
- Tekil araç/inventory/upgrade yok
- Gameplay scoring yok
- applyDecision değişmez
- Assignment scoring değişmez
- UI redesign yok

## 11. Sonraki patch bağlantıları

- Container Network Upgrade System
- Team Specialization UI Polish
- Vehicle Maintenance Runtime
- Individual Vehicle Inventory v2
- Real Route Optimization Lite
