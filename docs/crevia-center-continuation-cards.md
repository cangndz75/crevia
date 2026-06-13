# Crevia — Merkez Mini Devam Alanı

Scroll sonundaki hafif “devam edecek şeyler var” hissi. Ana modül değildir; Aktif Hedef ve Önerilen Plan ile rekabet etmez.

## Amaç

- Son olay, rapor, yetki açılımı, hikâye, bakım/ekip ve rozet teaser’ları
- Max 3 kompakt kart
- Presentation modelden beslenir; raw state okunmaz

## Source priority

1. Son olay / rapor önizlemesi (`last_event`, `report_preview`)
2. Yaklaşan yetki açılımı (`authority`, `next_unlock`)
3. Hikâye zinciri / şehir günlüğü teaser
4. Carry-over hatırlatması
5. Araç bakımı / ekip yorgunluğu
6. Rozet ilerlemesi
7. Empty → alan gizlenir

Sahte story/journal/unlock üretilmez.

## Max 3 kart

- Tercihen 2 kart (yan yana compact)
- 3 kartta dikey liste
- Aynı `sourceId` veya aynı body iki kez gösterilmez

## Kart kind özeti

| kind | Örnek başlık |
|------|----------------|
| `last_event` | Son Olay |
| `report_preview` | Kısa Rapor |
| `authority` / `next_unlock` | Yaklaşan Açılım |
| `story_chain` | Şehir Hikâyesi |
| `city_journal` | Şehir Günlüğü |
| `carry_over` | Dünden Kalan |
| `maintenance` | Bakım Notu |
| `team` | Ekip Durumu |
| `badge` | Rozet İlerlemesi |

## Day 1 / empty / locked

- **Day 1:** max 2 locked teaser kart (`displayMode: locked`)
- **Empty:** `visibility: hidden`, kart yok, layout boşluğu bırakmaz
- **Locked kartlar:** disabled CTA, `lockedReason` metni

## Route / action güvenliği

| actionKey | Route |
|-----------|-------|
| `view_report` | `/reports` |
| `view_journal` | `/reports` |
| `view_authority` / `view_badges` | `/profile` |
| `view_operations` / `view_maintenance` | `/events` |
| `view_story` | route yok → disabled teaser |

`enabled: true` ise route zorunlu.

## Dedupe

Önerilen Plan, ActiveTarget, Ece, OperationSignals, QuickActions, DailyReward, header notification ve CitySummary insight ile birebir metin tekrarı yok. Önerilen Plan aynı kaynağı uzun anlatıyorsa Mini Devam kısa teaser veya çıkarılır.

## Motion

`CreviaAnimatedPressable` tıklanabilir kartlarda; `shouldHighlight` soft static accent. Sonsuz pulse yok.

## Verify

```bash
npm run verify:center-continuation-cards
```

## Sonraki prompt

Merkez Empty / Locked / Low Data States
