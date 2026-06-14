# Crevia — Meaningful Authority Gameplay Pass

## Amaç

Yetki/progression sistemini yalnızca rozet/preview/kilit açıldı hissinden çıkarıp, oyuncunun **daha bilinçli karar vermesini** sağlayan gerçek **information advantage**’lara bağlamak.

- **Decision Consequence Depth:** karar izlerini görünür yapar
- **Event Freshness & Variety:** eventlerin farklı karar baskısı üretir
- **Meaningful Authority:** yetki arttıkça bu baskıları daha iyi görürsün

## Preview unlock vs gameplay information advantage

| | Preview unlock (önce) | Information advantage (bu pass) |
| --- | --- | --- |
| Hissi | “Yeni özellik açıldı” | “Artık daha derin görüyorum” |
| Etki | Vitrin/rozet | Inspect/Plan/Dispatch/Field copy detayı |
| Mekanik | `isPreviewOnly: true` rank izinleri | VisibilityLevel → presentation copy |
| Balance | Değişmez | Değişmez |

## Seçilen 4 core permission

| Permission | Rank kaynağı | Faz | Düşük yetki | Yüksek yetki |
| ---------- | ------------- | --- | ----------- | ------------ |
| Assignment Fit Preview | `assignment_fit_preview` | Dispatch/Field | “Uyum izleniyor” | Ekip yorgunluğu / araç uygunluğu / rota baskısı |
| District Trust Preview | `district_trust_preview` | Inspect/Plan | “Bölge etkisi var” | Güven hassasiyeti + plan bağlantısı |
| Resource Pressure Summary | `resource_pressure_summary` | Plan/Inspect | Genel kaynak etiketi | Araç / personel / konteyner ayrımı |
| Tomorrow Risk Preview | `advisor_specialist_notes_preview` | Inspect/Plan | “Yarın etkisi izlenir” | Rota/kaynak/sosyal yarın riski |

## AuthorityGameplayUnlockProfile modeli

Dosyalar:

- `src/core/authority/authorityGameplayUnlockTypes.ts`
- `src/core/authority/authorityGameplayUnlockModel.ts`
- `src/core/authority/authorityGameplayUnlockPresentation.ts`

Persist edilmez. `authorityState` + `isPermissionPreviewUnlocked` ile presentation-time üretilir.

## VisibilityLevel kuralları

| Level | Ne zaman | Oyuncu görür |
| ----- | -------- | ------------- |
| hidden | Çok erken / map-only kilit | (gösterilmez) |
| teaser | `next` rank permission | “Yakında: … görebileceksin” |
| summary | Kilitli veya Gün 1 | Genel etiket |
| detailed | `unlocked` / `current` + gün>1 | Ayrıştırılmış reason/impact |

Fake detailed bilgi yok. Gün 1 sade kalır.

## Inspect / Plan / Dispatch / Field bağlantıları

- **Inspect:** `applyAuthorityToInspectFindings` — district/trust, tomorrow risk, resource copy
- **Plan:** `applyAuthorityToPlanStrategies` — expected impact + tradeoff label zenginleştirme
- **Dispatch:** `applyAuthorityToDispatchReasons` — assignment fit reason kalitesi (max 3)
- **Field:** `applyAuthorityToFieldAssignmentEffect` — hafif saha copy

`authorityGameplayContext` store’dan (`gameState.pilot.authorityState`) Inspect/Plan/Dispatch/Field faz bileşenlerine geçirilir.

## Profile / Authority copy dili

`buildAuthorityPermissionDetailBody` core permission’lar için:

- Görebilirsin: …
- Daha iyi karar verirsin: …
- Etkilediği faz: …

## Hub next unlock preview

`buildAuthorityPermissionPreviewCompactSummary` gameplay odaklı satır üretir:

- “Sonraki yetki: Atama uyum nedenlerini görebileceksin.”
- “Yakında: Mahalle güveni karar öncesi görünür olacak.”

## Map layer planning notu (Map Gameplay Binding’e devir)

| Unlock | Gameplay rolü |
| ------ | ------------- |
| `map_trust_layer` | Hangi mahallede güven hassas? |
| `map_resource_layer` | Hangi bölge kaynak baskısı yaratıyor? |
| `map_social_layer` | (mevcut rank) Sosyal tepki riski haritada |

Bu pass Map UI yazmaz; rol dokümante edildi.

## Guard’lar

- `applyDecision` — değişmedi
- `SAVE_VERSION` / persist — değişmedi
- `decisionConsequenceThread*` — dokunulmadı
- `EventGameplayVarietyProfile` core — değişmedi (tamamlayıcı authority katmanı)
- Rank threshold / authority gain balance — değişmedi

## Verify / analyze

| Komut | Rol |
| ----- | --- |
| `npm run verify:meaningful-authority-gameplay` | Model + faz copy + nested verify |
| `npm run analyze:authority-gameplay` | Diagnostic rapor + WARN |

### TypeScript regression cleanup (Haz 2026)

Authority gameplay unlock katmanı (`authorityGameplayUnlockTypes/Model/Presentation`) repo typecheck kapısı için stabilize edildi:

- `RankPermissionId` → `AuthorityGameplayUnlockId` eşlemesi tek kaynakta (`RANK_PERMISSION_TO_GAMEPLAY_UNLOCK`)
- `buildAuthorityPermissionDetailBody` / `buildAuthorityPermissionPreviewCompactSummary` gameplay profilini type-safe tüketir
- `npx tsc --noEmit` ve `npm run typecheck:tsc` PASS
- `npm run verify:meaningful-authority-gameplay` PASS (nested operation verify dahil)

## Sonraki prompt: Map Gameplay Binding Planning

- Map layer unlock → harita üzerinde decision support bağlama
- Post-pilot selection’a authority hint (opsiyonel)
- Day 10+ authority unlock yoğunluğu izleme
