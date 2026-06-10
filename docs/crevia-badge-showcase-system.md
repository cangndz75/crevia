# Crevia Rozet Vitrini (Badge Showcase System)

## Amaç

Rozet Vitrini, mevcut badge core motorunun ürettiği `BadgeState` verisini oyuncuya prestijli, okunabilir ve mobil uyumlu bir vitrin olarak sunar. Yeni gameplay motoru veya persist katmanı eklemez; yalnızca presentation/model/helper/UI entegrasyonu sağlar.

## Oyuncuya verdiği his

- **Başardım:** Kazanılmış rozetler kariyer izi ve operasyon tarzı sinyali taşır.
- **Yakınım:** İlerlemedeki rozetler yüzde/bant ve kısa ipuçlarıyla motivasyon verir.
- **Hedefim var:** Kilitli rozetler gizemli ama anlaşılır dilde gelecek hedefleri gösterir.

## Beslendiği sistemler

| Kaynak | Kullanım |
|--------|----------|
| `src/core/badges/badgeConstants.ts` | Rozet tanımları (başlık, kategori, rarity, target) |
| `src/core/badges/badgeSeed.ts` | `normalizeBadgeState` — güvenli state okuma |
| `src/core/badges/badgeTypes.ts` | `BadgeState`, `BadgeId`, `BadgeCategory`, `BadgeRarity` |
| `src/core/presentation/creviaIconPresentation.ts` | Kategori ikon eşlemesi |
| Badge engine (değiştirilmedi) | `earnedBadgeIds`, `badgeProgress`, `history` |

## State ayrımı

| State | Koşul |
|-------|--------|
| `earned` | `earnedBadgeIds` içinde |
| `in_progress` | Kazanılmamış + `badgeProgress.current > 0` ve `!completed` |
| `locked` | Kazanılmamış + ilerleme yok |

`totalCount = earned + in_progress + locked` her zaman tutarlıdır.

## Kategori mantığı

Core `BadgeCategory` vitrin domain'ine presentation katmanında map edilir:

- `operations`, `crisis` → **Operasyon**
- `publicTrust` → **Güven**
- `resources`, `personnel` → **Kaynak**
- `consistency`, `butterfly_handler` → **Strateji**
- `authority` → **Yetki**
- `pilot`, `pilot_finisher` → **Şehir Hafızası**

## Prestij bandı (presentation-only)

| Rarity | Band |
|--------|------|
| common | Saha Başlangıcı |
| uncommon | Güvenilir Operatör |
| rare | Şehir Hafızasında |
| epic | Kriz Ustası |

Gameplay etkisi yoktur; sıralama, glow ve metin için kullanılır.

## UI yüzeyleri

1. **ProgressionScreen** (`/progression`, Rozetler sekmesi) — tam vitrin: özet kart, öne çıkanlar, yakında açılacaklar, kategori blokları, detay modalı.
2. **ProfileScreen** — kompakt özet kart + “Vitrine bak” CTA.
3. **HubReferenceHome** — `HubBadgeShowcaseChip`: rozet sayısı, yakın hedef, progression yönlendirmesi (yalnızca anlamlı veri varsa).
4. **CollectionProgressHeroCard** — hero ipucu metni showcase'den beslenir.

## Core API

```typescript
import {
  buildBadgeShowcaseSummary,
  buildBadgeShowcaseCompactSummary,
} from '@/core/badges/badgeShowcaseModel';
```

## Neden persist eklenmedi

Rozet durumu zaten `pilot.badgeState` içinde persist ediliyor. Vitrin türetilmiş (derived) bir görünüm modelidir; kaydetmeye gerek yoktur.

## Neden SAVE_VERSION değişmedi

`SAVE_VERSION` (25) yalnızca kayıt şeması değişikliklerinde artırılır. Bu özellik persist modeline dokunmaz.

## Verify

```bash
npm run verify:badge-showcase
```

Kontroller: state ayrımı, toplam tutarlılığı, featured/nearUnlock seçimi, kilitli ipuçları, empty state, SAVE_VERSION guard, presentation metin sızıntısı.

## Gelecekte yapılabilecekler

- Rozet kazanım animasyonu
- Özel rozet ikon asset'leri
- Sezonluk rozet paketleri
- Sosyal paylaşım kartı
- Achievement push/banner bildirimi
- Live-ops badge pack entegrasyonu
