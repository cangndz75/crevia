# Crevia — Merkez Empty / Locked / Low Data States

Merkez modüllerinin boş, kilitli, düşük veri ve tamamlanmış durumlarda tutarlı davranması için ortak policy katmanı.

## Global state policy

Dosya: `src/features/hub/utils/centerStatePolicy.ts`

| State | Anlam |
|-------|--------|
| `ready` | Normal render |
| `empty` | Sakin gün, kompakt copy |
| `locked` | Sebep göster, aksiyon kapalı |
| `completed` | Sonraki adıma yönlendir |
| `low_data` | Tahmini/güvenli fallback |
| `disabled` | Route yok, press kapalı |
| `hidden` | Layout boşluğu yok |

`applyCenterVisibilityPolicy()` — `centerHomePresentation` visibility flag’lerini normalize eder (ör. boş continuation → `hidden`).

## Day 1 görünürlük

Zorunlu: Header, Özet, Ödül, Aktif Hedef, Ece, Önerilen Plan (teaching).

Locked/sade: Operasyon Odağı (max 3 teaser), Sinyaller (tek compact), Hızlı İşlemler (1 açık), Mini Devam (max 2 locked).

Yasak: fake journal/story/unlock, 3+ risk sinyali, enabled locked quick action.

## Low data

- Fake değer üretilmez
- `sanitizeCenterDisplayText()` ile güvensiz metin filtrelenir
- CitySummary metric `NaN` → `—`
- Teknik “veri eksik” metni yok

## Locked dili

İyi: “İlk sonuçtan sonra açılır”, “İlk olaydan sonra”, “Operasyon tamamlanınca netleşir”

Kötü: `undefined`, `null route`, `feature locked`, aşırı `coming soon`

## Empty dili

- “Bugün kritik sinyal yok”
- “Merkez sakin”
- “Aktif hedefe odaklan”
- Mini Devam: kart yoksa `hidden`

## Completed yönlendirme

- Aktif Hedef: `Sonucu Gör` + `/reports`
- DailyReward: `claimed` → `ctaEnabled: false`
- Ece: celebration tonu (mevcut advisor builder)

## Action / route safety

`centerPresentationRouteSafetyValid()` — enabled CTA’larda route veya güvenli `actionKey` zorunlu; locked quick action `enabled: false`.

## Dedupe rolleri

Policy `centerPresentationNoCriticalDuplicates()` ile ActiveTarget, Ece, RecommendedPlan, Signals, QuickActions, DailyReward, Header, CitySummary arasında birebir tekrar denetlenir.

## Visibility flags

`buildVisibilityFlags` → `applyCenterVisibilityPolicy`. Continuation boşsa flag `hidden`; Day 1 operation focus `locked`.

## Verify

```bash
npm run verify:center-empty-locked-states
```

Tüm mevcut Merkez verify komutları ile birlikte çalıştırılmalı.

## Sonraki prompt

Merkez UI Polish & Performance QA
