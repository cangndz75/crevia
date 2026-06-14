# Crevia — Event Variety Verify Cleanup

## Amaç

`verify:event-variety` script eksikliğini kapatmak ve pilot hafta event çeşitliliği için strict invariant doğrulaması sağlamak.

## verify:event-variety

```bash
npm run verify:event-variety
```

Kontroller:

- `generateDailyEventSet` ile 7 günlük dengeli senaryo üretimi
- Tekrarlayan başlık yok
- Day 1 anchor korunur
- Gün başına kategori cap (≤2)
- Day 8+ `buildProfilesForEventIds` güvenli
- Player-facing satırlarda teknik enum yok
- SAVE_VERSION / persist / applyDecision / day pipeline değişmedi

## analyze:event-variety ile fark

| | verify | analyze |
|---|--------|---------|
| Kapsam | Strict PASS/FAIL | 6 senaryo diagnostik |
| Çıkış | CI gate | İnceleme / WARN kabul |

İkisi çelişmez: verify tek senaryoda hard invariant; analyze geniş simülasyon.

## Değiştirilmeyen sınırlar

- Event spawn yok
- Event selection rewrite yok
- Persist / SAVE_VERSION / applyDecision / day pipeline yok
