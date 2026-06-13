# Crevia Merkez — Header & Resource Strip

Bu doküman Merkez ekranının üst header ve kaynak strip alanını tanımlar.

## Amaç

Oyuncuya ilk bakışta şunları vermek:

1. Bu ekranın Crevia Merkez olduğu
2. Hangi şehir/başkan kimliğiyle oynandığı
3. Ana kaynakların kısa özeti
4. Tek ve kısa bir bildirim/uyarı

Header, Merkez Özeti kartıyla bilgi yarışına girmez; üst kimlik ve hızlı özet katmanıdır.

## Presentation modeli

Dosya: `src/features/hub/utils/centerHeaderPresentation.ts`

Ana fonksiyon: `buildCenterHeaderSummary(input)`

UI: `src/features/hub/components/CenterHomeHeader.tsx`

## Resource chip önceliği (max 3)

**Gün 2+**

1. Kaynak — `economy.currentSource` (yoksa `city.budget`, `isEstimated: true`)
2. Mutluluk — `socialPulse.score` (yoksa `city.publicSatisfaction`)
3. Seri veya Yetki — `player.streakDays` (ödül rotası görünürken) / `authority.authorityTrust`

**Gün 1**

1. Gün — `city.day`
2. Başlangıç — onboarding fallback
3. Ece Hazır — advisor hazır sinyali

**Empty fallback**

- Merkez Aktif + Gün X (minimum 2 chip)

## Notification önceliği (max 1)

1. `urgent` — yüksek tomorrow risk, kritik/yüksek olay, kritik operasyon sinyali
2. `info` — günlük ödül alınmadı (`Ödül hazır`)
3. `success` — yeni yetki önizlemesi (`Yeni yetki yakında`)
4. `info` — oyuncu bildirim sayısı
5. Icon-only sakin gün (`Bugün sakin`)

## Veri kaynakları

| Alan | Kaynak |
|------|--------|
| title | Sabit: `Crevia` |
| subtitle | `Merkez · Gün X` |
| cityName | `city.name` → `selectedDistrictName` → `Crevia` |
| playerName | `player.name` → `Başkan` |
| playerRoleLabel | `authority.formalRankId` → `player.role` |
| levelLabel | `playerProgress.currentLevel` |
| budget chip | `economySource` / `city.budget` |
| satisfaction chip | `socialPulse` / `publicSatisfaction` |
| streak chip | `player.streakDays` |
| authority chip | `authority.authorityTrust` |

## Kurallar

- En fazla 3 resource chip
- Chip id’leri duplicate olmaz
- Uzun şehir adı `displayCityName` ile ellipsis
- Header tam itibar değerini Merkez Özeti ile tekrar etmez
- Raw `gameState` header component’inde okunmaz

## Verify

```bash
npm run verify:center-header
npm run verify:center-home-ia
```
