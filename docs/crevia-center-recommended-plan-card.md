# Crevia — Merkez Önerilen Plan / Şehir Günlüğü Preview

Bu kart, bugünkü operasyon akışını ve şehir hafızasını özetler. Aktif Hedef “ne yapılacak”, Ece “neden/nasıl”, Önerilen Plan ise “bugünkü bağlam ve devamlılık” rolünü üstlenir.

## Amaç

- Şehir günlüğü / rapor / hikâye zinciri / carry-over / yarın riski kaynaklarından tek kompakt özet
- Önceki karar etkisini hatırlatma
- Aktif hedefi tekrar etmeden bağlam sağlama
- Secondary CTA (ana CTA Aktif Hedef kartında kalır)

## Source priority

Deterministik sıra:

1. `city_journal` — bugün veya son gün journal kaydı (Day 1 hariç)
2. `district_report` — mahalle rapor satırı
3. `story_chain` — devam eden hikâye satırı
4. `carry_over` — önceki karar etkisi (`hubImpactExplanationLine`)
5. `tomorrow_risk` — anlamlı yarın riski (`shouldShowInHub`, fallback değil)
6. `daily_plan` — aktif hedef üzerinden akış özeti
7. Day 1 teaching fallback
8. `empty` — sakin gün

Sahte journal veya story üretilmez.

## planType özeti

| planType | Başlık örneği | Rol |
|----------|---------------|-----|
| `city_journal` | Şehir Günlüğü | Günlük kayıt özeti |
| `district_report` | Önerilen Plan | Mahalle etkisi |
| `story_chain` | Önerilen Plan | Devam eden hikâye |
| `carry_over` | Dünden Kalan Etki | Karar hafızası |
| `tomorrow_risk` | Yarın İçin Not | Risk önizlemesi |
| `daily_plan` | Önerilen Plan / Bugünkü Plan | Günlük akış |
| `empty` | Önerilen Plan | Sakin özet |
| `locked` | Önerilen Plan | Kilitli teaser |

## Step kuralı

- Maksimum 3 adım
- Örnek setler: İncele → Planla → Yönlendir
- Day 1: İncele `current`, Planla `next`, Yönlendir `locked`
- Günlük Ödül Rotası gibi uzun progression değil

## CTA kuralı

- Secondary pill; küçük ve opsiyonel
- `enabled: true` ise güvenli `route` + `actionKey` zorunlu
- Aktif Hedef CTA label’ı ile duplicate olmaz
- Locked: disabled “Sonuçtan sonra açılır”

## Day 1 / empty / locked

- **Day 1:** `tone: teaching`, fake journal yok, şehir günlüğü teaser metni
- **Empty:** “Aktif hedefe odaklan”, sahte risk/story yok
- **Locked:** compact görünürlük + journal yok → kilitli teaser

## Dedupe farkı

| Modül | Soru |
|-------|------|
| ActiveTarget | Ne yapacağım? |
| Ece | Neden / nasıl? |
| Önerilen Plan | Bugünkü akış ve şehir hafızası |
| OperationSignals | Spesifik risk/fırsat |

Dedupe kaynakları: ActiveTarget, Ece, OperationSignals, OperationFocus, DailyReward helper, header notification, CitySummary insight.

## Motion foundation

- `CreviaAnimatedPressable` secondary CTA için
- `revealLevel: soft` teaching / journal durumlarında
- `shouldHighlight` carry-over / yüksek öncelik risk
- Sonsuz pulse yok; reduced motion’da highlight sadeleşir

## Verify

```bash
npm run verify:center-recommended-plan
```

## Sonraki prompt

Merkez Mini Devam Alanı Final
