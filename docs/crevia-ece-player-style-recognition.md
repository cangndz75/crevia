# Crevia Ece Player Style Recognition

## Amaç

Ece’nin oyuncunun karar tarzını fark eden bir operasyon asistanı gibi hissettirmesi — rule-based, deterministic, presentation-only.

## Neden gerekli?

Map before/after, carry-over, report tomorrow ve resource fatigue katmanları **ne oldu** sorusunu yanıtlar. Player style katmanı **nasıl oynadığını** özetler; Ece’nin danışmanlığı kişiselleşir.

## Runtime AI neden yok?

Soft launch güvenliği, deterministik verify ve gameplay motorlarından izolasyon. Tüm çıkarım şablon + sinyal ağırlıkları ile yapılır.

## Stil listesi

| Stil | Özet |
|------|------|
| `fast_responder` | Hızlı müdahale, kısa vadeli baskı düşürme |
| `preventive_planner` | Yarını rahatlatma, önleyici plan |
| `public_focused` | Sosyal görünürlük ve güven |
| `resource_guardian` | Kaynak koruma, rotasyon |
| `crisis_watcher` | Risk sinyali izleme |
| `balanced_operator` | Dengeli çoklu etki |
| `inconsistent_operator` | Değişken tepkiler, esnek çizgi |
| `unknown` | Yetersiz gözlem |

## Sinyal kaynakları

Öncelik sırasıyla birleştirilir:

1. `event_result` / decision kind (fast_response, preventive_route, …)
2. `carry_over` memory
3. `resource_fatigue` state
4. `social_echo`
5. `map_before_after` outcome
6. `event_domain` focus
7. `decision_history` label inference
8. `daily_report` metin ipuçları

## Confidence sistemi

| Seviye | Koşul |
|--------|--------|
| `none` | Gün 1 veya &lt; 2 gözlem |
| `low` | 2–3 gözlem veya düşük dominans |
| `medium` | 4–6 gözlem |
| `high` | 7+ gözlem veya yüksek skor farkı |

## Ece metin kuralları

- Yargılama yok, tek doğru seçenek dayatma yok.
- “Şu tarzın güçlü; şu riski izle” tonu.
- Yasak: premium, paywall, “bunu yap”, “en iyi seçenek”, “yanlış oynuyorsun”.

## Hub entegrasyonu

`HubAdvisorCard` — primary insight altında; gün 2–3 chip, gün 4+ kompakt kart.

## Report entegrasyonu

`ReportAdvisorCommentCard` — Ece yorumu altında kompakt style insight; gün 7’de “pilot tarzı şekilleniyor” hazırlık satırı (kişisel recap değil).

## Day 1 safety

Gün 1’de stil gizli veya `unknown`; gözlem başlıyor mesajı.

## Day 7 personal recap ile ilişki

Bu patch Day 7 Personal Pilot Recap’i **değiştirmez**; yalnızca tarz hazırlık satırı ekler.

## Neyi değiştirmez?

- `SAVE_VERSION`, persist shape
- `applyDecision`, `dayPipeline`, event generation
- Advisor XP/level engine (`advisorEngine`)
- Authority, badge, progression
- Map/resource gameplay motorları

## Sonraki prompt: Advisor Seniority System

Roadmap: `advisor-seniority-system` — danışman kıdem gösterimi (presentation-only).
