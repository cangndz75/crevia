# Crevia — Merkez Günlük Ödül Rotası

Bu belge Merkez sayfasındaki **Günlük Ödül Rotası** modülünün presentation modelini, state mantığını ve UI sınırlarını açıklar.

## Amaç

Günlük Ödül Rotası, oyuncuya şu sorulara kısa ve güvenli yanıt verir:

1. Bugün rotanın kaçıncı günündeyim?
2. Bugünkü ödül hazır mı / alındı mı?
3. Sıradaki büyük ödül ne?
4. Seri devam ediyor mu?
5. Ödül için hangi aksiyon var?

Modül retention sinyali verir; ana hedef kartı kadar büyük değildir ve raw `gameState` okumaz.

## Presentation modeli

Kaynak: `src/features/hub/utils/centerDailyRewardPresentation.ts`

- `CenterDailyReward` — kartın tam presentation çıktısı
- `CenterDailyRewardDay` — rota üzerindeki tek gün (`done | today | locked | missed`)
- `CenterDailyRewardItem` — bugünkü veya büyük ödül özeti
- `claimState` — `available | claimed | locked | unavailable`
- `ctaEnabled` — gerçek claim persist yokken `false` kalır (`DAILY_REWARD_CLAIM_PERSIST_ENABLED`)

UI bileşeni: `src/features/hub/components/CenterDailyRewardRoute.tsx`

## Streak / rota mantığı

- Rota uzunluğu: **5 gün** (`DAILY_REWARD_ROUTE_LENGTH`)
- Aktif slot: `min(max(streakDays + 1, 1), 5)` (`player.streakDays`)
- Geçmiş slotlar: `done`
- Aktif slot: `today` (alınmadıysa) veya `done` (alındıysa)
- Gelecek slotlar: `locked`
- 5. gün: `isBigReward` — rozet ilerlemesi teaser

## Claim state

| State | Koşul | CTA | Helper |
|-------|--------|-----|--------|
| `available` | Bugünkü slot açık, alınmamış | "Ödülü Al" (persist yoksa disabled) | "Bugünkü seriyi koru." |
| `claimed` | Günlük hedef tamam veya streak günü yakalandı | Gizli | "Bugünün ödülü alındı." |
| `locked` | Gün 1 teaser veya henüz açılmamış | Gizli | "İlk hedefi tamamlayarak seriyi başlat." / "Yarın tekrar gel." |
| `unavailable` | Eksik/bozuk streak verisi | Gizli | "Seri bilgisi hazırlanıyor." |

**Önemli:** Gerçek claim persist bağlanana kadar fake kaynak artışı veya aktif claim yapılmaz.

## Ödül türleri

Mevcut progression değerlerinden türetilir; elmas/gem ekonomisi kullanılmaz.

| Gün | Ödül metni | Kaynak |
|-----|------------|--------|
| 1 | Başlangıç ödülü | Giriş teaser |
| 2 | +60 XP | XP progression |
| 3 | +80 Yetki | Yetki puanı |
| 4 | Ek kaynak | Kaynak bandı |
| 5 | Rozet ilerlemesi | Büyük ödül teaser |

## Day 1 fallback

- `title`: "Günlük Seri"
- `streakLabel`: "Gün 1" (header’daki "Seri X. gün" tekrarından kaçınır)
- `claimState`: `locked`
- `helperText`: "İlk hedefi tamamlayarak seriyi başlat."

## Büyük ödül teaser

5. gün kartın sağında kompakt teaser olarak gösterilir. Tamamen gizlenmez; kilitli ama merak uyandırıcı kalır.

## Header ve Merkez Özeti ile tekrar etmeme

- **Header** streak chip: "Seri · 3. gün" — günlük rota bunu uzun metinle tekrarlamaz; `streakLabel` olarak `3/5` kullanır.
- **Merkez Özeti** şehir sağlığı / yetki ilerlemesi gösterir; günlük rota şehir metriğine dönüşmez.
- Modül yalnızca ödül rotası ve claim hissine odaklanır.

## Motion (sonraki prompt)

- `pulseAvailable: true` — `claimState === 'available'` iken hafif glow/pulse için hook
- Claimed check animasyonu ayrı motion promptunda bağlanacak
- Reduced motion uyumu planlandı; bu promptta Reanimated/Lottie yok

## Verify

```bash
npm run verify:center-daily-reward
```

İlgili dosya: `src/features/hub/verifyCenterDailyRewardScenario.ts`

Regresyon:

```bash
npm run verify:center-home-ia
npm run verify:center-header
npm run verify:center-city-summary
```
