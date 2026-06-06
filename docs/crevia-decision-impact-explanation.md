# Crevia Decision Impact Explanation

## Amaç

Karar sonrası oyuncuya karar -> sonuç -> tradeoff -> yarına etki zincirini kısa ve anlaşılır biçimde göstermek.

## Oyuncu problemi

Oyuncu metriklerin değiştiğini görüyor, fakat bazen neden değiştiğini ve yarına ne bıraktığını tek bakışta okuyamayabiliyor.

## Gameplay değiştirmez

Bu pass deterministic presentation katmanıdır. `applyDecision`, event generation, day pipeline, persistence ve `SAVE_VERSION` değiştirmez.

## Explanation kind listesi

`positive_tradeoff`, `risk_tradeoff`, `resource_pressure`, `district_trust_shift`, `social_response`, `route_balance`, `container_pressure`, `personnel_fatigue`, `crisis_prevention`, `carry_over_warning`, `recovery_signal`, `neutral_learning`, `fallback`.

## Selection rules

Öncelik sırası: carry-over, resource pressure, district/social trust, route/container/personnel domain, crisis/risk, recovery, neutral fallback.

## Result screen entegrasyonu

`DecisionResultScreen` içinde `RewardHero` sonrasında ve metrik panellerinden önce `EventResultImpactExplanationCard` gösterilir.

## Report/Hub echo entegrasyonu

Report içinde mevcut akışa kısa "Kararın etkisi" satırı eklenir. Hub içinde yeni kart açılmaz; mevcut önceki karar etkisi kartına tek kısa echo satırı verilir.

## Copy tone guide

Metinler kısa, somut ve tradeoff odaklıdır. Panik, FOMO, suçlayıcı dil, "mükemmel seçim", "kötü karar", "ceza" ve "ödül kazan" dili kullanılmaz.

## Non-goals

`applyDecision` logic değiştirme, snapshot shape genişletme, persist alanı ekleme, `SAVE_VERSION` artırma, yeni route ekleme, AI kullanma, geniş UI redesign yapma, authority/badge/balance motorunu değiştirme.

## Verify sonucu

`npm run verify:decision-impact-explanation` kind kapsamını, copy guard'ları, result/report/hub entegrasyonlarını ve non-goal dosya guard'larını kontrol eder.

## Sonraki önerilen prompt

Decision Impact Explanation Pass Aşama 2: mevcut event family copy metadata'sından daha spesifik domain varyantları üret, fakat persist ve applyDecision shape değiştirme.
