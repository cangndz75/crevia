# Crevia Operation Era System

## 1. Amaç

Operation Era, açık uçlu operasyon kariyerinde **dönemsel içerik/tema odağıdır**. Oyuncunun kariyeri devam ederken belirli sistemleri, event family’leri, mahalle operasyonlarını ve kaynak geliştirme alanlarını öne çıkaran foundation modelidir.

Bu patch deterministik era tanımları, readiness/relevance skorları ve compact presentation helper üretir — runtime activation veya canlı operasyon sunucusu olmadan.

## 2. Ne değildir?

- **14 günlük sezon değildir.**
- **Sezon finali değildir.**
- **Oyun bitişi değildir.**
- **Daily live-ops zorunlu değildir.** Her gün canlı operasyon yapmak zorunlu değildir.
- **Uzaktan yapılandırma sistemi değildir.**
- **Yönetim paneli (admin dashboard) değildir.**
- **Monetization gate değildir.**

## 3. Neden gerekli?

- Açık uçlu progression’a dönemsel hedef verir.
- Event family ve content pack üretimini organize eder.
- District operations, vehicle maintenance, container network ve map layer sistemlerini aynı temaya bağlar.
- Oyuncuya uzun vadeli “şimdi neye odaklanıyorum?” cevabı verir.

## 4. Operation Era catalog

| Era ID | Başlık | Odak |
| --- | --- | --- |
| `core_city_operations` | Temel Şehir Operasyonları | Temel operasyon / verimlilik |
| `route_maintenance_era` | Rota ve Bakım Dönemi | Araç / rota / bakım |
| `container_network_era` | Konteyner Ağı Gelişim Dönemi | Konteyner ağı / mahalle güveni |
| `district_trust_era` | Mahalle Güveni Dönemi | Mahalle güveni / sosyal nabız |
| `crisis_recovery_era` | Kriz Hazırlığı ve Toparlanma Dönemi | Kriz / toparlanma / ekip |
| `city_growth_preview_era` | Şehir Gelişimi Hazırlığı | Şehir gelişimi (future) |
| `social_pulse_era` | Sosyal Nabız Dönemi | Sosyal nabız / güven |

## 5. Cadence

- milestone_based — Milestone bazlı
- weekly_theme — Haftalık tema
- biweekly_theme — İki haftalık tema
- monthly_theme — Aylık tema
- rank_unlock — Ünvan açılımı
- content_pack — İçerik paketi
- future_live_ops — İleride canlı operasyon (schema only)

Küçük ekip için sürdürülebilir yaklaşım **dönemsel temadır**; günlük live-ops zorunlu değildir.

## 6. Rank permission bağlantısı

String-level permission referansları:

- `operation_era_preview`
- `event_family_rotation_preview`
- `district_specific_operations_preview`
- `map_resource_layer`
- `map_trust_layer`
- `vehicle_maintenance_window_preview`
- `container_network_upgrade_preview`
- `city_development_preview`

**rankPermissions behavior değiştirilmez.**

## 7. Event family bağlantısı

Her era `relatedEventFamilyDomains` taşır. `getOperationEraContentWeightHints` future weight hint üretir.

**Olay üretim katmanına dokunulmadı.**

## 8. District operation bağlantısı

`relatedDistrictOperationKinds` readiness/relevance sinyali sağlar (`route_discipline`, `container_network`, `crisis_prevention`, vb.).

**districtOperations behavior değiştirilmez.**

## 9. Vehicle maintenance bağlantısı

`route_maintenance_era`, `operation_era_maintenance` ve diğer bakım kind’ları ile uyumlu.

**vehicleMaintenance behavior değiştirilmez.**

## 10. Container network bağlantısı

`container_network_era`, `operation_era_upgrade` ve diğer upgrade kind’ları ile uyumlu.

**containerNetwork behavior değiştirilmez.**

## 11. Map layer bağlantısı

`operation_era`, `resource_pressure`, `district_trust`, `city_development` katmanları ile uyumlu.

**mapLayers behavior değiştirilmez.**

## 12. Periodic review bağlantısı

Operation Era sonrası **oyun bitmez**. `completed_review` status yalnızca dönemsel operasyon değerlendirmesi anlamı taşır; terminal game state değildir.

## 13. Bu patchin sınırları

- SAVE_VERSION yok — mevcut sürüm korunur (save_version artırılmaz)
- Persist yok — yeni operationEraState kaydedilmez
- Runtime activation yok
- Olay üretim katmanına dokunulmadı
- Canlı operasyon sunucusu eklenmedi
- Yönetim paneli eklenmedi
- UI redesign yok — foundation-only

## 14. Gün görünürlük kuralları

| Dönem | Davranış |
| --- | --- |
| Day 1–7 (pilot) | Gizli veya çok compact preview |
| Day 8+ | Preview / available / recommended |
| Future-only era | future / preview only |

## 15. Sonraki patch bağlantıları

- **Content Production Pipeline MVP**
- Event Family Selection Engine
- Non-Daily Canlı Operasyon Takvimi
- Admin Dashboard
- Operation Era Runtime
- City Development System

## 16. Modül yapısı

```
src/core/operationEra/
  operationEraTypes.ts
  operationEraConstants.ts
  operationEraCatalog.ts
  operationEraModel.ts
  operationEraPresentation.ts
  verifyOperationEraScenario.ts
  index.ts
```

Verify: `npm run verify:operation-era`

## 17. Future analytics mapping (not implemented)

İleride `operation_era_preview_seen`, `operation_era_recommended`, `operation_era_review_completed` gibi analytics event’leri eklenebilir. Bu patch analytics contract değiştirmez.
