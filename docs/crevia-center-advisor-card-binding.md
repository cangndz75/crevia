# Crevia — Merkez Ece Danışman Kartı

Bu belge Merkez sayfasındaki **Ece Danışman** kartının presentation modelini, kaynak önceliğini ve diğer modüllerle ilişkisini açıklar.

**Not:** Bu modül deterministik presentation katmanından beslenir. LLM/online AI entegrasyonu yoktur.

## Amaç

Ece kartı oyuncuya şunları verir:

1. Bugünkü durumda Ece ne görüyor?
2. Aktif hedef için neden bu aksiyon mantıklı?
3. Risk / fırsat / ödül açısından nelere dikkat edilmeli?
4. Şimdi hangi tek aksiyona yönelmeli?
5. Gerektiğinde compact/sakin mod

UI raw `gameState` okumaz.

## Presentation modeli

Kaynak: `src/features/hub/utils/centerAdvisorPresentation.ts`

- `CenterAdvisorSuggestion` — tam kart çıktısı
- `contextLine`, `recommendation`, `reason?`, `caution?`
- `tone`, `priority`, `confidence`
- `action?`, `secondaryAction?` (maks. 2)
- `compactMode`, `shouldShowAvatar`, `motionHint`

UI: `src/features/hub/components/CenterAdvisorCard.tsx`

## Source priority

1. **Aktif hedef** — neden/ nasıl yorumu (title tekrarı yok)
2. **Kritik/strained sinyal** — sakin günde veya hedefle birlikte uyarı
3. **Günlük ödül** — yalnızca destekleyici cümle (Gün 1 seri teaser)
4. **CitySummary warning** — sosyal/operasyon dikkat uyarısı
5. **TomorrowRisk** — kısa yarına etki uyarısı
6. **Gün 1** — öğretici mod (`teaching`)
7. **Düşük veri** — sakin compact öneri, fake kriz yok

## Tone / priority / confidence

| Tone | Ne zaman |
|------|----------|
| `teaching` | Gün 1 |
| `celebration` | Hedef tamamlandı |
| `calm` | Sakin gün / düşük veri |
| `positive` | Hazır hedef / iyi durum |
| `warning` | Risk sinyali / düşük mutluluk |
| `urgent` | Kritik sinyal |

**Priority:** urgent signal → urgent; hedef high → high; sakin → low

**Confidence:** hedef + sinyal/özet uyumu → high; tek kaynak → medium; fallback → low

## ActiveTarget ile ilişki

- Primary `action` activeTarget CTA ile hizalı (`view_result` → `view_report`)
- Ece “ne” değil “neden/nasıl” anlatır
- Aktif hedef kartını gölgelemez; CTA daha küçük pill

## Dedupe

Şunlarla birebir tekrar yok:

- ActiveTarget title/description/helperText
- CitySummary primaryInsight
- DailyReward helperText
- Recommended plan body

## Motion (sonraki prompt)

- `motionHint.attentionLevel`
- `motionHint.shouldPulseAvatar`
- `motionHint.shouldRevealSpeech`

Bu promptta animasyon yok.

## Verify

```bash
npm run verify:center-advisor
```

Regresyon: tüm `verify:center-*` komutları.
