# Crevia Merkez — City Summary (Merkez Özeti)

Bu doküman Merkez Özeti kartının runtime binding kurallarını tanımlar.

## Amaç

Oyuncuya şehir sağlığını 3 ana metrikle anlatmak:

1. Şehir itibarı
2. Vatandaş mutluluğu / sosyal durum
3. Aktif operasyon veya risk yoğunluğu

Header kısa kimlik verir; Merkez Özeti şehir sağlığını açıklar.

## Presentation modeli

Dosya: `src/features/hub/utils/centerCitySummaryPresentation.ts`  
UI: `src/features/hub/components/CenterCitySummaryCard.tsx`

Ana fonksiyon: `buildCenterCitySummary(input)`

## Üç ana metrik (max 3)

| Metrik | Kaynak önceliği |
|--------|-----------------|
| Şehir İtibarı | `authority.authorityTrust` + terfi eşiği |
| Vatandaş Mutluluğu | `socialPulse.score` → `city.publicSatisfaction` |
| Aktif Operasyon / Risk | `events.length` → `operationSignals` → `dailyGoal` → fallback |

## Day 1 fallback

- İtibar: `Başlangıç`
- Mutluluk: `Dengeli`
- Odak: `Hazır` / helper `İlk hedef hazır`
- Insight: `Şehri tanı, ilk hedefe başlayarak merkez akışını aç.`
- Crest: kapalı (`illustrationKey: none`)

## Empty / low-data fallback

- Mutluluk sosyal nabız yoksa: band etiketi (`Mutlu` / `Dengeli` / `İzleniyor`), `isEstimated: true`
- Operasyon yoksa: `Sakin` + `Kritik sinyal yok`
- Asla `undefined`, `NaN`, boş string gösterilmez

## Tone mantığı

- `success` — iyi durum, sakin gün, yüksek memnuniyet
- `stable` — dengeli / normal
- `warning` — risk artışı, hedef riskte
- `urgent` — kritik operasyon / yüksek risk
- `neutral` — Day 1 başlangıç

## Progress

- Kaynak: authority terfi ilerlemesi
- `progressRatio` 0–1 clamp
- Day 1’de gösterilmez

## Tekrar etmeme

- Header satisfaction chip `%XX` ise özet value band etiketi kullanır
- Aktif hedef başlığıyla birebir aynı metin basılmaz
- `primaryInsight` Ece `commentary` ile duplicate olmaz

## Verify

```bash
npm run verify:center-city-summary
npm run verify:center-home-ia
npm run verify:center-header
```
