# Crevia Event Domain UI Prioritization

## Amaç

Event tipine göre İncele, Planla, Yönlendir, Sahada, Sonuç ve impact preview yüzeylerinde ilgili domain önceliğini göstermek. Yeni event veya gameplay motoru eklenmez; yalnızca presentation katmanı güncellenir.

## Neden gerekli?

54 yüksek kaliteli event ve Stage 3 echo sistemi varken, oyuncu her kartta aynı metrik sırasını görüyordu. Domain UI prioritization, konteyner/araç/ekip/sosyal/kriz/mahalle odaklarını yüzeye özel kısa metinlerle öne çıkarır.

## Daily Theme Rhythm ile ilişki

Gün teması (`buildPilotThemeEventFocusLine`) korunur. Event domain aynı gün temasıyla hizalıysa tek satır birleşir: `Bugünün odağı: Konteyner Baskısı`. Çakışmada tema satırı + domain özeti veya `EventDomainFocusStrip` kullanılır. Day 1’de inspect strip gizlenir veya compact kalır.

## Content Safety Pack ile ilişki

`inferEventDomainUiFocus` csp1/csp2 id ve `domain` alanlarını okur. `mergePilotCatalogWithContentSafetyPacks()` değiştirilmez. Stage 1/2/3 verify scriptleri regression olarak çalıştırılır.

## Echo system ile ilişki

`buildEventDomainFocusModel({ includeEcho: true })` isteğe bağlı `buildEventEchoBundle` satırlarını bağlar. Sonuç ekranında tek echo satırı gösterilir; Ece kartı ile duplicate üretilmez.

## Domain listesi

| Focus | Oyuncu hissi |
|--------|----------------|
| container | Konteyner baskısı, rota/yarın etkisi |
| vehicle_route | Araç yorgunluğu, bakım/gecikme |
| personnel | Ekip dayanıklılığı, moral |
| social | Vatandaş etkisi, Sosyal Nabız |
| crisis_adjacent | Kriz eşiği, önleyici sinyal (panik dili yok) |
| district_balance | Bölgesel öncelik, denge |
| pilot_learning | Day 1 öğrenme odağı |
| pilot_final | Day 7 geçiş |
| generic_operation | Fallback |

## Surface priority rules

`buildEventDomainSurfacePriority(focus, surface, day)` primary/secondary/muted section id’leri döner. Dispatch’te domain uyarı satırı; field’da hint; plan/result’ta `EventDomainImpactFocusCard` / `EventDomainFocusStrip`.

## UI entegrasyon yüzeyleri

- `EventDetailDecisionScreen` — birleşik tema + strip
- `EventPlanPhase` — plan impact card
- `OperationImpactPreviewStrip` — `prioritizeOperationImpactSummary`
- `EventAssignmentPanel` — dispatch warning
- `EventFieldMicroDecisionCard` — field hint
- `DecisionResultScreen` — sonuç odağı + echo

## Day 1 safety

`shouldShowEventDomainFocus(1, 'inspect', …)` false. Officer kartında yalnızca pilot öğrenme teması. Gelişmiş impact strip Day 1 compact modda sade kalır.

## Day 7 final safety

`pilot_final` focus ve tema `pilot_final` domain hizası korunur; satış veya panik dili yok.

## Neyi değiştirmez?

- SAVE_VERSION (23)
- Persist shape, applyDecision, dayPipeline, postPilotEventEngine
- Event generation cap/idempotency
- Yeni route/screen, runtime AI, analytics SDK, IAP, harita marker

## Sonraki prompt: Carry-over Memory Cards

Roadmap `carry-over-memory-cards` — önceki günlerden taşan hafıza kartları presentation katmanında.

## Verify

```bash
npm run verify:event-domain-ui-prioritization
```
