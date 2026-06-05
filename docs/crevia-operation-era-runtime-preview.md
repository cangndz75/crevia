# Crevia Operation Era Runtime-lite Preview — Aşama 1

## Amaç

7 günlük pilot sonrası açık uçlu ana operasyon kariyerinde **dönemsel operasyon teması** hissi vermek. Hub, Report, Profile ve Map yüzeylerinde mevcut dönemin operasyon odağı görünür; rota verimliliği, konteyner toparlanması, sosyal güven onarımı, kriz önleyici takip, mahalle gelişimi veya kaynak dengeleme.

## Kapsam sınırı

- **Gerçek live-ops calendar değil**
- `isRuntimeLinked: false` — presentation-only preview
- Event generation, `applyDecision`, `dayPipeline`, persist shape **değişmez**
- `SAVE_VERSION` **artırılmaz** (23)
- Content pack'ler runtime selection'a **bağlanmaz**

## Preview kind'ları

| Kind | Odak |
|------|------|
| `route_efficiency_era` | Rota verimliliği |
| `container_recovery_era` | Konteyner ağı toparlanması |
| `social_trust_era` | Sosyal güven onarımı |
| `crisis_prevention_era` | Kriz önleyici takip |
| `district_development_era` | Mahalle gelişimi |
| `resource_balance_era` | Kaynak dengeleme |
| `visible_service_era` | Görünür hizmet |
| `open_operation_career_era` | Açık uçlu kariyer fallback |

## Visibility

| Gün | Davranış |
|-----|----------|
| 1–7 | Gizli (pilot) |
| 8+ limited | Compact preview |
| 8+ full | Standard preview |
| 8+ high rank | Detailed preview |

## Dosyalar

- `src/core/operationEra/operationEraRuntimePreviewTypes.ts`
- `src/core/operationEra/operationEraRuntimePreviewConstants.ts`
- `src/core/operationEra/operationEraRuntimePreviewModel.ts`
- `src/core/operationEra/operationEraRuntimePreviewPresentation.ts`
- `src/core/operationEra/verifyOperationEraRuntimePreviewScenario.ts`
- `scripts/verify-operation-era-runtime-preview.ts`

## Verify

```bash
npm run verify:operation-era-runtime-preview
```

## Future runtime hazırlığı

Selection/variant/story chain bias helper'ları mevcut; engine davranışını değiştirmez:

- `buildOperationEraSelectionContextHint()`
- `buildOperationEraVariantBias()`
- `buildOperationEraStoryChainBias()`
