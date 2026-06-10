# Crevia District Operation Unlock Binding

## Amaç

Mahalle / Ana Operasyon Açılım Bağları, mevcut district trust, district operations, main operation season, authority ve progression bridge sinyallerini tek bir presentation vitrininde birleştirir. Yeni runtime veya persist eklemez.

## Oyuncuya verdiği his

- Hangi mahallelerin **aktif**, **sıradaki** veya **kilitli** olduğunu görür
- Ana operasyon hattının hangi mahalle ve sistemlere bağlandığını anlar
- Yetki progression ile şehir açılımı arasındaki bağı hisseder

## Beslendiği sistemler

| Kaynak | Kullanım |
|--------|----------|
| `districtIdentityConstants` | Mahalle kimlikleri ve isimler |
| `mainOperationConstants` | Sezon günü mahalle durumu (`resolveDistrictStatusForSeasonDay`) |
| `mainOperationState` | `normalizeMainOperationSeasonState` |
| `districtTrustRuntime` | Güven bandı etiketleri |
| `progressionBridge` | İstasyon / Yeşilvadi / ana operasyon önizlemeleri |
| `authority` | Mevcut unvan ve yetki etiketi |

## State ayrımı

| State | Kaynak |
|-------|--------|
| `active` | `MainOperationDistrictStatus: active` |
| `next` | `agenda`, `preview` veya pilot yakın açılım |
| `locked` | `inactive` veya ileri aşama |

## Yetki progression ilişkisi

`PROGRESSION_PREVIEW_DEFINITIONS` ile istasyon, yeşilvadi ve ana operasyon kapsamı aynı authority eşiklerini kullanır; Permission Preview ile çelişmez.

## Ana operasyon bağları

Pilot günlerde pilot hattı; gün 8+ açık uçlu ana operasyon ve progression preview linkleri.

## Map / report / advisor / city archive

Mahalle başına `relatedSystems` presentation etiketleri; gameplay değiştirmez.

## UI yüzeyleri

1. **ProgressionScreen → Açılımlar sekmesi** — tam vitrin
2. **Hub** — `HubDistrictExpansionChip` (district öncelikli; authority permission chip ile çakışmaz)

Profil kartı eklenmedi (yoğunluk nedeniyle).

## Neden persist eklenmedi

Tüm veri mevcut state'ten türetilir.

## SAVE_VERSION

Değiştirilmedi (`SAVE_VERSION = 25`).

## İlişkili sistemler

- **Badge Showcase** — aynı progression sekmesi yapısı
- **Authority Permission Preview** — aynı hub öncelik kuralı

## Verify

```bash
npm run verify:district-operation-unlock-binding
```

## Gelecekte

- Unlock animasyonu
- Map region reveal
- District unlock ceremony
- Advanced district detail screen
- Live-ops district packs
- Story-chain based expansion
- Advisor-guided unlock explanation
