# Crevia Advisor Seniority System

## Amaç

Ece’nin kıdeminin yalnızca etiket değil, yorum derinliği olarak hissedilmesi — mevcut advisor level/reliability/experience verisinden presentation-only model.

## Neden gerekli?

Player Style Recognition **nasıl oynadığını** söyler; Seniority System **ne kadar derin yorumlayabildiğini** gösterir.

## Runtime AI neden yok?

Deterministik şablonlar, verify güvenliği ve advisor engine izolasyonu.

## Kıdem seviyeleri

| Tier | Başlık | Derinlik |
|------|--------|----------|
| `trainee` | Stajyer Operasyon Asistanı | `basic_observation` |
| `assistant` | Operasyon Asistanı | `short_term_tradeoff` |
| `field_advisor` | Saha Danışmanı | `resource_and_social` |
| `operations_specialist` | Operasyon Uzmanı | `carry_over_and_style` |
| `chief_advisor_preview` | Başdanışman Hazırlığı | `strategic_context` (Gün 7 teaser) |

Tier kaynağı: `advisorState.level`, `experience`, `reliabilityBand` + gün fallback. **advisorState shape değişmez.**

## Capability sistemi

Kıdem arttıkça açılan yetenekler: `explain_event` → `explain_tradeoff` → `mention_resource_pressure` / `mention_social_effect` → `mention_carry_over` / `mention_player_style` → `mention_season_context`.

## Ece Player Style Recognition ile ilişki

- `trainee`: tarz yorumu yok
- `assistant`: “tarz sinyali oluşuyor”
- `operations_specialist` / `chief_advisor_preview`: `playerStyleProfile.advisorLine` insight’a eklenebilir
- `shouldSuppressPlayerStyleForSeniority` duplicate kartı bastırır

## Hub entegrasyonu

`AdvisorSeniorityBadge` + `AdvisorDepthInsightBlock` — primary insight altında; player style kartı ile çakışmaz.

## Report entegrasyonu

Meta chip satırında badge; gün 3+ kompakt depth line; gün 7 final-safe.

## Day 1 safety

Stajyer badge hub’da kompakt; raporda gizli; insight gün 2+.

## Day 7 personal recap ile ilişki

`chief_advisor_preview` yalnızca hazırlık satırı; Day 7 Personal Pilot Recap bu patch’te yok.

## Neyi değiştirmez?

- `SAVE_VERSION`, persist shape
- `advisorEngine` XP/level/reliability
- Gameplay motorları
- Çoklu danışman / upgrade shop

## Sonraki prompt: Specialist Advisor Notes MVP

Roadmap: `specialist-advisor-notes-mvp` — statik uzman not şablonları.
