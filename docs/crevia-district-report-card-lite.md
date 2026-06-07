# Crevia — Mahalle Karnesi Lite (Aşama 1)

## Amaç

Her mahallenin oyuncu gözünde daha anlamlı, takip edilebilir ve karakterli hissetmesi. Haritada mahalleye tıklanınca güven durumu, baskın problem, son etki ve Ece önerisi hızlı okunabilir.

Ana oyuncu hissi: “Bu mahalle sadece haritada bir isim değil. Kendi durumu, geçmişi ve operasyon ihtiyacı var.”

## Neden şimdi gerekli

District trust, memory, operations runtime, map intelligence, content pack wiring ve echo sistemleri mevcut ancak oyuncuya tek bir mahalle odaklı özet sunulmuyordu. Soft launch öncesi lite presentation katmanı bu boşluğu kapatır.

## Lite scope

- `DistrictReportCardLiteModel` presentation modülü
- Map alt panelinde compact kart
- Hub/Report için opsiyonel helper (UI bağlantısı zorunlu değil)
- Content pack metadata entegrasyonu
- Day-based visibility
- Duplicate/copy guard

## Full Mahalle Karnesi V1.1’den farkı

| Lite (Aşama 1) | V1.1 (gelecek) |
|----------------|----------------|
| Max 3–4 kısa satır | Son 3 olay listesi |
| Presentation-only | Persistent city archive |
| Mevcut runtime snapshot okuma | Oyuncu tarzı / halk tonu |
| Ece tek satır öneri | Mahalle temsilcisi/NPC |

## District identity guide

- **Merkez:** koordinasyon, görünür hizmet
- **Cumhuriyet:** sosyal güven, konteyner çevresi
- **Sanayi:** rota baskısı, vardiya çıkışı
- **İstasyon:** aktarma, yoğunluk
- **Yeşilvadi:** çevre bakımı, sakin toparlanma

Kimlik tonları fallback copy varyantı olarak kullanılır; hardcoded lore değildir.

## Source signals

- districtTrustRuntime snapshot
- districtMemoryRuntime snapshot
- districtOperationsRuntime snapshot
- operationSignals, resourceFatigue, socialPulse
- carryOver, contentPackMeta, cityEcho (opsiyonel)
- mapDistrictIntelligence lines (duplicate guard)

## Dominant issue selection

Öncelik: carryOver → content pack → memory pressure → trust → operation signals → resource fatigue → social recovery → district identity fallback.

## Day-based visibility

| Gün | Mod |
|-----|-----|
| 1 | compact — kimlik satırı, ağır sistem dili yok |
| 2–3 | compact — max 2 satır |
| 4–7 | standard — trust + issue + recent effect |
| 8+ | standard (post-pilot) |
| 8+ full | detailed_preview — yine lite, olay listesi yok |

## Map integration

- `MapDistrictReportCard` — cream/teal compact kart
- Post-pilot: `MapOperationBottomPanel` içinde intelligence strip sonrası
- Pilot detail view: alt kart alanında standalone
- Layout guard: numberOfLines, flexShrink, minWidth

## Content Pack integration

Pack metadata aynı mahalledeyse dominant issue ve contentPackLine üretir. Teknik pack adları UI’da görünmez.

## Duplicate guard

Map intelligence, MainOperationFeel map hint, TomorrowRisk, CityEcho ve fallback satırlarıyla birebir tekrar engellenir (`isDistrictReportCardDuplicate`).

## Copy guard

Yasaklı: pack, metadata, runtime, panik, premium, viral vb. Operasyonel, sakin, mahalle odaklı ton.

## Non-goals

- Trust/memory hesaplama değişikliği
- Persist schema / SAVE_VERSION değişikliği
- applyDecision / dayPipeline / event generation değişikliği
- NPC, AI, Live-Ops, yeni route
- Day 1–7 pack injection davranışı değişikliği

## Verify sonucu

```bash
npm run verify:district-report-card
```

## Sonraki önerilen prompt

> **Mahalle Karnesi Lite Aşama 2 — Hub/Report Surface Polish:** Hub priority district strip ve Report gün sonu satırına karne helper bağla; duplicate guard genişlet; V1.1 olay listesi tasarım notu.

## Modül yapısı

```
src/core/districtReportCard/
  districtReportCardTypes.ts
  districtReportCardConstants.ts
  districtReportCardModel.ts
  districtReportCardPresentation.ts
  verifyDistrictReportCardScenario.ts
  index.ts
src/features/map/components/MapDistrictReportCard.tsx
scripts/verify-district-report-card.ts
```
