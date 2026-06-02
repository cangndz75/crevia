# Crevia Container Network Upgrade System

## 1. Amaç

Konteyner ağı geliştirme sistemi, mahalle bazlı temizlik ve kaynak baskısını yönetilebilir bir progression fırsatına dönüştürür. Bu foundation patch, mevcut district trust, resource pressure, event family, district operation, team specialization ve map layer sinyallerinden deterministik bir **konteyner ağı sağlık modeli** ve **upgrade candidate** presentation katmanı üretir.

Oyuncuya mahalle bazında konteyner ağını iyileştirme, görünür temizlik noktalarını güçlendirme ve çevre baskısını azaltma hissi verir — gerçek upgrade ekonomisi veya persisted state olmadan.

## 2. Ne değildir?

- **Tekil konteyner sistemi değildir.** Haritada veya sahnede tek tek konteyner objesi üretmez.
- **Harita üzerinde tek tek konteyner objesi değildir.**
- **Upgrade economy değildir.** Satın alma, maliyet veya kaynak harcama içermez.
- **Satın alma sistemi değildir.**
- **Persisted network state değildir.** SAVE_VERSION artırılmaz; persist shape değişmez.

## 3. Container network modeli

| Bileşen | Açıklama |
| --- | --- |
| **health score** | 0–100; konteyner ağının genel sağlığı |
| **pressure score** | 0–100; kapasite/temizlik/sosyal baskı |
| **readiness score** | 0–100; geliştirmenin görünürlük/uygunluk hazırlığı |
| **impact score** | 0–100; geliştirmenin mahalle etkisi potansiyeli |
| **upgrade kind** | Mahalle profiline göre önerilen geliştirme türü |
| **tradeoff** | Kısa vadeli saha hızı vs. uzun vadeli baskı azaltma |
| **suggested team** | Teknik Ekip veya Konteyner Ağı Ekibi önerisi |
| **compact presentation** | Harita/rapor/hub için 1 satırlık özet |

### Health level eşikleri

- fragile: 0–24
- strained: 25–39
- functional: 40–59
- stable: 60–74
- optimized: 75–89
- showcase: 90–100

## 4. Mahalle profilleri

| Mahalle | Odak | Preferred upgrade kinds |
| --- | --- | --- |
| **Merkez** | Görünür temizlik / prestij | visible_clean_point, capacity_rebalance |
| **Cumhuriyet** | Konut / okul çevresi | school_residential_order, recovery_cleanup_focus |
| **Sanayi** | Ağır kullanım / vardiya akışı | industrial_heavy_use_point, capacity_rebalance |
| **İstasyon** | Geçiş yoğunluğu / akış | transit_flow_support, visible_clean_point |
| **Yeşilvadi** | Çevre hassasiyeti / sakinlik | environmental_sensitivity_point, recovery_cleanup_focus |

## 5. Team specialization bağlantısı

- `technical_team_preventive_maintenance` readiness skorunu artırır.
- `container_network_unit` readiness skorunu artırır; çevre hassasiyeti olan mahallelerde önerilir.
- **teamSpecialization behavior değiştirilmez** — yalnızca read-only fit sonuçları okunur.

## 6. District operation bağlantısı

`container_network_cumhuriyet`, `container_network_yesilvadi`, `environmental_care_yesilvadi`, `visible_service_merkez` gibi mahalle operasyonları readiness/impact skorunu artırabilir.

- **districtOperations behavior değiştirilmez.**

## 7. Event family bağlantısı

`container`, `resource_recovery`, `district_balance` domainleri health, pressure ve readiness hesaplarına sinyal verir.

- **Olay üretim katmanına dokunulmadı.**

## 8. District trust bağlantısı

- Güven düşükse (fragile/watch) recovery/cleanup impact artabilir.
- Güven yüksekse (stable/trusted) visible_clean_point/showcase potansiyeli artabilir.
- **districtTrust scoring değiştirilmez.**

## 9. Map layer bağlantısı

İlgili katmanlar: `resource_pressure`, `district_trust`, `district_memory`, gelecekte `city_development`.

- **mapLayers behavior değiştirilmez.**

## 10. Active task route bağlantısı

Hedef mahalle + `container` domain aktif rota, pressure skoruna sinyal verebilir.

- **activeTaskRoutes behavior değiştirilmez.**

## 11. Operational resources / resource fatigue bağlantısı

`fillPressure`, `cleanlinessPressure`, `maintenancePressure`, `socialPressure` güvenli optional okunur.

- **operationalResources engine değiştirilmez.**
- **resourceFatigue engine değiştirilmez.**

## 12. Rank permission bağlantısı (string-level)

- `container_network_upgrade_preview`
- `resource_pressure_summary`
- `district_trust_preview`
- `district_specific_operations_preview`
- `map_resource_layer`
- `map_trust_layer`

**rankPermissions dosyası değiştirilmez.**

## 13. Bu patchin sınırları

- SAVE_VERSION yok — mevcut sürüm korunur (save_version artırılmaz)
- Persist yok — yeni containerNetworkState kaydedilmez
- Tekil konteyner yok
- Upgrade economy yok
- Gameplay scoring yok
- Karar uygulama katmanına dokunulmadı
- dayPipeline değişikliği yok
- UI redesign yok — foundation-only; map/report entegrasyonu follow-up

## 14. Gün görünürlük kuralları

| Gün | Davranış |
| --- | --- |
| Day 1 | Gizli |
| Day 2 | Preview olabilir |
| Day 3+ | Container/resource context varsa available/recommended |
| Day 4+ | District trust/memory ile daha net |

## 15. Sonraki patch bağlantıları

- Operation Era System Foundation
- Container Network Runtime
- City Development System
- Map Container Layer UI
- Content Production Pipeline

## 16. Modül yapısı

```
src/core/containerNetwork/
  containerNetworkTypes.ts
  containerNetworkConstants.ts
  containerNetworkModel.ts
  containerNetworkPresentation.ts
  verifyContainerNetworkScenario.ts
  index.ts
```

Verify: `npm run verify:container-network`
