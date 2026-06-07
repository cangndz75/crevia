# Crevia — Advisor Operational Relationship Pass (Aşama 1)

## 1. Amaç

Ece'yi yalnızca bilgi veren danışmandan çıkarıp oyuncunun karar tarzını, önceki kararlarını, mahalle bağlamını ve operasyon gelişimini hatırlayan daha kişisel ama profesyonel bir operasyon danışmanı haline getirmek.

Ana oyuncu hissi: *"Ece beni ve şehirdeki karar tarzımı tanıyor. Sadece genel tavsiye vermiyor; önceki kararlarımı, riskleri ve mahalleleri bağlayarak konuşuyor."*

## 2. Neden şimdi gerekli

Mevcut sistemler (advisor seniority, city echo, decision impact, tomorrow risk, player style, district report card, carry-over) ayrı ayrı çalışıyordu. Ece kişisellik puanı ~84/100 seviyesindeydi; operasyonel güven ve çalışma ritmi ilişkisini tek bir model altında birleştirmek 95+ hedefine yaklaşmak için gerekli.

## 3. Relationship model

`AdvisorOperationalRelationshipModel` — `src/core/advisorRelationship/`

Alanlar:
- `day`, `relationshipVisibility`, `trustTone`, `familiarityBand`
- `playerStyleSignal`, `previousDecisionReference`, `districtMemoryReference`, `resourceHabitReference`
- `predictionCorrectionLine`, `predictionState`, `confidenceLine`
- `mainAdvisorLine`, `supportingLine`, `reportLine`, `hubLine`, `resultLine`
- `sourceSignals`, `duplicateKey`, `maxVisibleLines`

Ana builder: `buildAdvisorOperationalRelationshipModel`

## 4. Day-based tone

| Gün | Ton | Örnek |
|-----|-----|-------|
| 1 | Öğretici, sade | "Ece bu ilk kararda etkiyi birlikte izleyecek." |
| 2–3 | Gözlem | "Ece karar tarzını gözlemliyor." |
| 4–7 | Eğilim tanıma | Hızlı müdahale + kaynak temposu notu |
| 8+ | Stratejik partner | Mahalle dengesi + kaynak temposu birlikte okunur |
| Full operation | Stratejik partner | Rota baskısı + önceki hızlı müdahale çizgisi |

## 5. Player style signals

Style kind: `fast_responder`, `social_trust_focused`, `route_balancer`, `resource_guardian`, `crisis_watcher`, `district_mediator`, `recovery_builder`, `balanced_operator`, `unknown`

Oyuncuya rozet gibi vitrinlenmez; Ece satırı içinde yumuşak, geçici operasyonel dil kullanılır. Negatif yargı yok.

## 6. Previous decision references

Kaynaklar: Decision Impact, City Journal, Carry-over, Tomorrow Risk, decision history, district report card, operation signals.

Day 1'de önceki karar referansı yok. City Echo / Decision Impact / Tomorrow Risk ile birebir duplicate engellenir.

## 7. Prediction correction

States: `prediction_confirmed`, `prediction_softened`, `prediction_corrected`, `still_observing`, `no_prediction`

"Ece yanıldı" gibi güven kıran copy yasak. Danışman diliyle doğrulama veya yumuşatma.

## 8. District-specific Ece lines

5 mahalle: Merkez, Cumhuriyet, Sanayi, İstasyon, Yeşilvadi — `ADVISOR_RELATIONSHIP_DISTRICT_LINES` sabitlerinde.

## 9. UI integration

| Yüzey | Entegrasyon |
|-------|-------------|
| HubAdvisorCard | `buildAdvisorRelationshipHubPresentation` — main line + day 8+ supporting |
| ReportAdvisorCommentCard | `buildAdvisorRelationshipReportPresentation` — rapor sonu satırı |
| DecisionResultScreen | `buildAdvisorRelationshipResultPresentation` — EceComment relationship line |

`numberOfLines` ve `flexShrink` guard uygulandı.

## 10. Duplicate guard

`duplicateKey`: day + styleKind + districtId + domain + sourceKind + previousDecisionId

`isDuplicateAdvisorRelationshipLine` — City Echo, Tomorrow Risk, Decision Impact, report sistemleriyle çakışma baskılanır.

## 11. Copy guard

Yasak: romantik ton, "güvenmiyor", "yanlış yaptın", panik, premium/IAP, AI/LLM/metadata/runtime/pack kelimeleri.

İstenen: operasyonel, sakin, oyuncuyu tanıyan, profesyonel ama insani, kısa.

## 12. Non-goals

- AI/OpenAI entegrasyonu yok
- Serbest metin üretimi yok
- Romantik/dating sim tonu yok
- Yeni gameplay sonucu yok
- `applyDecision`, `dayPipeline`, event generation değişmedi
- Persist shape / SAVE_VERSION değişmedi
- Yeni route yok
- Büyük UI redesign yok

## 13. Verify sonucu

`npm run verify:advisor-relationship` — Advisor Operational Relationship model, style, previous decision, prediction, district, UI wiring ve safety guard'larını doğrular.

## 14. Sonraki önerilen prompt

> Crevia için Ece Operational Relationship Pass Aşama 2 yap: Hub'da relationship visibility band'lerini main operation feel ve district report card ile zenginleştir; profile helper'ı opsiyonel profile ekranına bağla; player style badge showcase pass'ine hazırlık için `getPlayerStyleLabelHelper` export'unu kullan.

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:advisor-relationship
npm run verify:advisor
npm run verify:city-echo-binding
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:operational-resource-presence
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:event-result-ui
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:full-loop
npm run verify:full-ux-flow
```
