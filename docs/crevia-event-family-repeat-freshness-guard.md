# Crevia Event Family Repeat & Freshness Runtime Guard — Aşama 1

Bu doküman, Event Family Selection Engine ve Event Variant Runtime Adapter üzerine kurulan **merkezi freshness guard** katmanını açıklar.

## Selection penalty ile freshness guard arasındaki fark

| Katman | Rol |
|--------|-----|
| **Selection engine penalty** | Candidate *skorlama* sırasında district/domain/family tekrarı için ağırlık düşürür; ranking’i etkiler |
| **Freshness guard** | Merkezi exposure memory ile family/district/domain/variant/echo/title tekrarlarını izler; block/warn/penalty kararı verir; selection result’a adapter olarak uygulanır |

Selection engine tek başına “bugün aynı echo cümlesi” veya “reward variant 3 gün üst üste” gibi runtime exposure senaryolarını tam kapsamaz. Freshness guard bu boşluğu doldurur.

## Neden persist eklenmedi?

- SAVE_VERSION 23 ve persist shape korunmalı
- Guard runtime-lite foundation; caller `recentExposureRecords` array’i sağlar
- Mevcut state/history/dailyReports varsa okunabilir; yoksa boş exposure ile güvenli fallback

## Recent exposure nasıl sağlanır?

```typescript
buildEventFreshnessContext({
  currentDay: 10,
  recentExposureRecords: [
    { day: 9, familyId: 'container_overflow', districtIds: ['merkez'], variantKind: 'reward' },
  ],
  recentEchoSignatures: ['abc123'],
});
```

Caller (gelecekteki runtime hint binding) günlük exposure kayıtlarını geçici olarak iletir; persist zorunlu değildir.

## Hangi tekrarlar block, hangileri sadece penalty?

| Durum | Karar |
|-------|-------|
| Aynı echo signature aynı gün | `block_echo_repeat` |
| Yüksek title/copy + duplicate guard | `block_duplicate` |
| Aynı family 1 gün içinde | `strong_penalty` (kriz bağlamında `warn_repeat`) |
| Aynı family 2–3 gün | `strong_penalty` / `soft_penalty` |
| District/domain üst üste | `soft_penalty` / `warn_repeat` |
| Variant reward/comeback tekrarı | `strong_penalty` |
| Gün 1 heavy candidate | `strong_penalty` + tutorial penalty |

Kritik/kriz bağlamında tam block yerine güçlü penalty veya uyarı uygulanır.

## Reward / comeback / crisis_adjacent tekrarları neden daha sıkı?

Bu variant tonları oyuncu algısını hızla doyurur veya panik yaratabilir. Üst üste görüldüklerinde güçlü variant penalty uygulanır. `crisis_adjacent` tam block yerine kontrollü `warn_repeat` ile yönetilir.

## Content Production duplicate guard ile ilişki

- `compareContentItemSimilarity` → `duplicateGuard` penalty
- `evaluateEchoCompleteness` düşükse echo repeat guard daha sıkı
- Coverage düşük olsa freshness tam block etmez; debug’da trade-off açıklanır

## Sonraki patch sırası

1. District Trust Runtime-lite Integration
2. District Memory Runtime-lite
3. Event Selection Runtime Hint Binding
4. Result/Report/Map variant + freshness UI binding

## Kısıtlar

- SAVE_VERSION 23
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` değiştirilmedi
- Math.random yok; deterministic signature (stableHash + normalize)
