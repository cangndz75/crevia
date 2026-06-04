# Crevia Content Production Pipeline

## 1. Amaç

Crevia içerikleri tek tek rastgele yazılmaz. **Content pack**, **coverage matrix**, **echo completeness**, **duplicate guard** ve **quality scoring** ile üretilir.

Bu foundation patch deterministik schema, coverage ölçümü, duplicate/echo guard ve writer checklist sağlar — **runtime event generation olmadan**.

## 2. Neden gerekli?

- Sıkılmayı azaltır.
- Event tekrarını azaltır.
- Mahalle kimliğini korur.
- Operation era içeriklerini planlar.
- Ece / rapor / sosyal / harita echo bağlantılarını eksik bırakmaz.
- Soft launch sonrası içerik üretimini sürdürülebilir yapar.

## 3. Content pack nedir?

Paket türleri:

- `pilot_core`
- `open_operation_core`
- `district_pack`
- `event_family_pack`
- `operation_era_pack`
- `social_echo_pack`
- `report_echo_pack`
- `map_hint_pack`
- `recovery_reward_pack`
- `crisis_adjacent_pack`
- `live_ops_theme`
- `future_expansion`

Her pack: id, version, status, target district/domain/era/surface, items ve copy blocks taşır.

## 4. Coverage matrix

Ölçülen boyutlar:

- **district** — 5 ana mahalle
- **domain** — container, vehicle_route, social, crisis_adjacent, operation_era, vb.
- **variant_kind** — normal, reward, recovery, operation_era, vb.
- **echo_surface** — advisor, report, social, map, tomorrow_preview, operation_result
- **operation_era** — core_city_operations, route_maintenance_era, vb.

Minimum altı **FAIL**, recommended altı **WARN**, üstü **PASS**.

## 5. Duplicate guard

Benzer title/domain/district/echo tekrarını yakalar.

- ≥ 0.82 benzerlik: **FAIL**
- 0.65–0.81: **WARN**
- Altı: PASS

Duplicate scoring edge case: duplicate guard WARN/FAIL riski bulmadiginda risk listesi bos kalir. Bu durumda duplicate-safety tam guvenli kabul edilir (`safety ratio full`) ve kalite skorunu dusurmez. WARN/FAIL riski varsa mevcut esikler ve skor cezasi aynen korunur.

## 6. Echo completeness

Her içerik olay/operasyon/era dışındaki yüzeylere bağlanmalı:

- **Ece** (advisor_echo)
- **Rapor** (report_echo)
- **Sosyal Nabız** (social_echo)
- **Harita** (map_hint)
- **Yarın preview** (tomorrow_preview)
- **Operasyon sonucu** (operation_result)
- **Mahalle hafızası** (district_memory — event family bağlamında)

## 7. Writer checklist

- Somut sahne var mı?
- Mahalle kimliği var mı?
- Aktör belli mi?
- Gerçek trade-off var mı?
- Yarın etkisi var mı?
- Ece yorumlayabilir mi?
- Haritada görünür mü?
- Sosyal Nabız echo var mı?
- Rapor echo var mı?
- Mobilde kısa mı?
- Forbidden copy yok mu?
- Operation era veya rank permission bağlantısı var mı?

## 8. Soft launch content targets

**Bu patch gerçek içerik sayısını artırmaz** ama hedefleri koyar.

Future targets (docs hedefi):

| Alan | Hedef |
| --- | --- |
| Event family | 70–90 |
| Variant | 250–400 |
| Social mention | 150–250 |
| Report echo | 120–200 |
| Map hint | 80–150 |
| Mini chain | 15–25 |
| Reward/recovery event | 30–50 |
| Crisis-adjacent family | 20–35 |

Foundation minimum: district operation ≥ 15, operation era ≥ 6.

## 9. Operation era bağlantısı

Her operation era kendi content targetlarına bağlanır. `buildContentPackItemFromOperationEra` era definition’dan item üretir.

**Runtime era activation yok.**

## 10. Analytics future mapping

İleride analytics payload alanları:

- `contentPackId`
- `contentPackVersion`
- `eventFamilyId`
- `variantId`
- `operationEraId`
- `districtId`
- `domain`

**Bu patch analytics runtime contract değiştirmez.**

## 11. Admin dashboard future mapping

İleride dashboard alanları:

- Content pack listesi
- Coverage matrix
- Quality score
- Duplicate warning / no-risk safety summary
- Echo completeness
- Version status
- Release readiness

**Admin dashboard yok** — yalnızca foundation.

## 12. Bu patchin sınırları

- **Runtime event generation yok**
- **Event selection engine yok**
- **Admin dashboard yok**
- **Remote config yok**
- **SAVE_VERSION yok** — mevcut sürüm korunur (save_version artırılmaz)
- **Persist yok** — yeni contentProductionState kaydedilmez
- **UI redesign yok**

## 13. Sonraki patch bağlantıları

- Event Family Selection Engine Aşama 2
- Content Pack Authoring Aşama 2
- Admin Dashboard Foundation
- Operation Era Runtime
- Content Analytics Feedback Loop

## 14. Modül yapısı

```
src/core/contentProduction/
  contentProductionTypes.ts
  contentProductionConstants.ts
  contentPackSchema.ts
  contentCoverageMatrix.ts
  contentDuplicateGuard.ts
  contentEchoCompleteness.ts
  contentProductionPresentation.ts
  verifyContentProductionScenario.ts
  index.ts
```

Verify: `npm run verify:content-production`
