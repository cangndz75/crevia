# Crevia — Merkez Aktif Hedef Hero Kartı

Bu belge Merkez sayfasındaki **Aktif Hedef / Ana Görev** hero kartının presentation modelini, kaynak önceliğini ve UI sınırlarını açıklar.

## Amaç

Aktif Hedef kartı oyuncuya şu sorulara yanıt verir:

1. Bugünün ana hedefi ne?
2. Neden önemli?
3. Şu an ne kadar ilerledim?
4. Tamamlarsam ne kazanacağım / şehirde ne değişecek?
5. Hangi butona basıp devam edeceğim?

Kart Merkez'in ana aksiyon alanıdır; Günlük Ödül Rotası'ndan daha baskındır. Raw `gameState` okumaz.

## Presentation modeli

Kaynak: `src/features/hub/utils/centerActiveTargetPresentation.ts`

- `CenterActiveTarget` — tam kart çıktısı
- `progress`, `reward`, `impactPreview[]` (maks. 3)
- `cta` — tek ana aksiyon (`actionKey`, `route`, `enabled`)
- `motionHint` — sonraki motion prompt için hook

UI bileşeni: `src/features/hub/components/HubActiveTaskCardStack.tsx` (tek hero kart; stack/swipe kaldırıldı)

## Source priority

1. **Günlük hedef** — `selectPrimaryDailyGoal`, `status !== 'locked'`
2. **Ana operasyon** — `mainOperationFeelPresentation.visible && heroTitle`
3. **Operasyon sinyali** — `critical` veya `strained` domain sinyali
4. **Day 1 fallback** — `day <= 1`
5. **Sakin gün** — `status: empty`, compact CTA

`sourceLabel`: Günlük hedef · Ana operasyon · Operasyon sinyali · Başlangıç hedefi · Sakin gün

## Status / CTA matrisi

| Status | CTA label | actionKey | Route |
|--------|-----------|-----------|-------|
| `ready` | Operasyonu Başlat | `start_operation` | `/events` |
| `ready` (Gün 1) | İlk Olayı İncele | `start_operation` | `/events` |
| `in_progress` | Devam Et | `continue_operation` | `/events` |
| `completed` | Sonucu Gör | `view_result` | `/reports` |
| `locked` | Yakında Açılır | `locked` | — (disabled) |
| `empty` | Operasyonları Gör | `view_plan` | `/events` |

## Reward ve impact preview

- Maksimum **1 reward** + **3 impact**
- XP: `formatHubTaskRewardLabel` (+N ilerleme)
- Elmas/gem gösterilmez
- Impact metinleri beklenen etki tonunda: "Artabilir", "Azalır", "Denge gerekir"

## Day 1 fallback

- `title`: İlk Operasyonu Başlat
- `categoryLabel`: Başlangıç
- `reward`: Başlangıç ödülü
- Impact: Merkez akışı · Ece rehberliği · Günlük seri
- `helperText`: Başlamak için hazır. Tamamlarsan günlük seri açılır.

## Completed / empty state

- **Completed:** kart kaybolmaz; tamamlandı rozeti + Sonucu Gör CTA
- **Empty:** "Bugün merkez sakin" — alan boş kalmaz, compact CTA

## Dedupe kuralları

| Modül | Rol |
|-------|-----|
| Merkez Özeti | Şehir metrikleri + insight |
| Aktif Hedef | Ana görev + CTA |
| Ece | Neden önerildiği |
| Günlük Ödül | Seri / claim |
| Operasyon Sinyalleri | Risk/fırsat detayı |

Aynı cümle `description` içinde tekrar edilmez (`hubEceContextLine`, `primaryInsight` ile dedupe).

## Motion (sonraki prompt)

- `motionHint.shouldPulseCta` — ready/high priority
- `motionHint.shouldHighlightProgress` — in_progress
- `motionHint.revealLevel` — urgent → strong

Bu promptta Reanimated entegrasyonu yok; yalnızca model alanları bırakıldı.

## Verify

```bash
npm run verify:center-active-target
```

Regresyon:

```bash
npm run verify:center-home-ia
npm run verify:center-header
npm run verify:center-city-summary
npm run verify:center-daily-reward
```
