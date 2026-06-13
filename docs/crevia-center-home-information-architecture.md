# Crevia Merkez — Bilgi Mimarisi

Bu doküman Merkez (Hub) ana ekranının final modül sırasını, görünürlük kurallarını ve veri kaynaklarını tanımlar.

## Final modül sırası

1. **Safe area / header** — şehir kimliği, başkan, kaynak özeti, kısa uyarı
2. **Merkez özeti** — itibar, vatandaş mutluluğu, aktif operasyon/risk
3. **Günlük ödül rotası** — streak adımları, büyük ödül, claim durumu
4. **Aktif hedef** — bugünün ana görevi, ilerleme, CTA
5. **Ece danışman** — kısa yorum, önerilen aksiyon, gerekçe
6. **Operasyon odağı** — ulaşım / enerji / çevre yatay kartları
7. **Operasyon sinyalleri** — en fazla 2–3 sinyal veya empty state
8. **Hızlı işlemler** — 2×2 kompakt grid (gün 2+)
9. **Önerilen plan** — şehir günlüğü / plan özeti
10. **Mini devam alanı** — son olay, rapor önizlemesi, yaklaşan açılım

Uygulama: `buildCenterHomePresentation` → `HubReferenceHome`

## Her modülün amacı

| Modül | Oyuncu sorusu |
|-------|----------------|
| Header | Hangi şehirdeyim, kaynaklarım ne? |
| Merkez özeti | Şehir ne durumda? |
| Günlük ödül | Bugün giriş ödülüm ne? |
| Aktif hedef | Bugün ana hedef ne? |
| Ece | Ece ne öneriyor? |
| Operasyon odağı | Hangi alanlar gelişiyor/bekliyor? |
| Operasyon sinyalleri | Şehirde ne oluyor? |
| Hızlı işlemler | Hangi aksiyona basabilirim? |
| Önerilen plan | Günün plan özeti ne? |
| Devam kartları | Scroll sonunda ne var? |

## Görünürlük kuralları

Kaynak: `buildHubCardVisibilityModel` + `buildCenterHomePresentation` içi kurallar.

- **Gün 1:** operasyon odağı kilitli; hızlı işlemler kilit teaser; sinyaller compact/empty; Ece featured; aktif hedef görünür.
- **Gün 2+:** operasyon odağı ve hızlı işlemler açılır (max 4 karo).
- **Gün 3+:** operasyon odağı “tümünü gör” opsiyonu.
- **Veri yoksa:** empty state (ör. sinyaller: “Bugün kritik sinyal yok”).
- **Kilitliyse:** locked teaser (ör. plan: “Gün 2’den itibaren…”).
- **Tamamlandıysa:** günlük ödül “Bugünün ödülü alındı”.

## Fallback state’leri

- **Ece:** `hubEceContextLine` → `mainOperationFeel.eceLine` → genel onboarding metni
- **Operasyon odağı:** `mainOperationFeelPresentation` → `buildOperationFocus` içinde feel satırı merge
- **Aktif hedef:** primary daily goal → main operation feel → gün 1 giriş hedefi
- **Operasyon sinyalleri:** tomorrow risk + city echo; yoksa empty
- **Önerilen plan:** city journal → district report → story chain → bakım/ekip hatları
- **Ece / plan tekrarı:** metin dedupe; aynı cümle iki kartta gösterilmez

## Presentation model

Dosya: `src/features/hub/utils/centerHomePresentation.ts`  
Header alt modül: `src/features/hub/utils/centerHeaderPresentation.ts`

Ana fonksiyon: `buildCenterHomePresentation(input)`

Verify: `npm run verify:center-home-ia`, `npm run verify:center-header`

**Final polish completed** — bkz. [crevia-center-ui-polish-performance-qa.md](./crevia-center-ui-polish-performance-qa.md)

Header detayı: [crevia-center-header-resource-strip.md](./crevia-center-header-resource-strip.md)  
Merkez Özeti: [crevia-center-city-summary.md](./crevia-center-city-summary.md)
