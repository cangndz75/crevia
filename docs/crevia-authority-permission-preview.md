# Crevia Yetki Permission Preview

## Amaç

Yetki Permission Preview, mevcut authority state ve rank permission matrix verisini oyuncuya anlaşılır, motivasyon veren bir vitrin olarak sunar. Yeni yetki motoru, persist veya runtime state eklemez.

## Oyuncuya verdiği his

- **Şu an ne yapabiliyorum?** — Açık izinler ve sistem erişimleri
- **Terfi bana ne kazandıracak?** — Sıradaki izinler ve fayda metinleri
- **Hangi sistemlere yaklaşıyorum?** — İleri kilitli izinler ve rank ipuçları

## Beslendiği sistemler

| Kaynak | Kullanım |
|--------|----------|
| `authoritySeed` / `authorityEngine` | `normalizeAuthorityState`, `calculateAuthorityProgress` |
| `rankPermissions/rankPermissionMatrix` | İzin durumu (active/next/locked), rank bundle |
| `rankPermissions/rankPermissionPresentation` | Kısa açıklamalar (değiştirilmedi) |
| Mevcut `authorityPermissionPreview.ts` | Karar kartı bağlam önizlemesi (ayrı, korundu) |

## State ayrımı

| State | Kaynak matrix durumu |
|-------|----------------------|
| `active` | `unlocked`, `current` |
| `next` | `next` |
| `locked` | `locked`, `future` |

## Permission kategori mantığı

`RankPermissionCategory` presentation katmanında vitrin domain'ine map edilir: operations, map, districts, resources, advisor, reports, crisis, story, progression.

## UI yüzeyleri

1. **ProgressionScreen → Yetkiler sekmesi** — tam preview panel (özet, açık/sıradaki/kilitli, kategori blokları, detay modalı)
2. **ProfileScreen** — kompakt `ProfileAuthorityPermissionPreviewCard`
3. **HubReferenceHome** — `HubAuthorityPermissionPreviewChip` (yalnızca anlamlı next unlock + day > 1)
4. **HubAuthorityProgressChip** — sıradaki izin satırı (chip kullanıldığında)

## Profile ve Hub entegrasyonu

- Profil: `Açık: X / Y`, `Sıradaki: …`, CTA `İzinleri gör` → `/progression`
- Hub: `Sıradaki izin: …` satırı; day 1 veya next yoksa gizli

## Badge Showcase ile ilişkisi

Aynı presentation-only pattern: core model türetir, UI vitrin sunar, persist dokunulmaz. Rozet vitrini progression/rozet sekmesinde; yetki izinleri progression/yetki sekmesinde.

## Neden persist eklenmedi

İzin durumu authority state ve rank matrix'ten türetilir; ayrı kayıt gerekmez.

## Neden SAVE_VERSION değişmedi

Kayıt şeması değişmedi (`SAVE_VERSION = 25`).

## Verify

```bash
npm run verify:authority-permission-preview
```

Decision preview + showcase senaryolarını birlikte çalıştırır.

## Gelecekte yapılabilecekler

- Unlock animasyonu
- Permission notification
- Rank-up ceremony
- Advanced permission detail screen
- Seasonal authority modifiers
- Live-ops unlock preview
