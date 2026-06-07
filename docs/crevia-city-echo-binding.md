# Crevia City Echo Binding

## Amaç

Karar, şehir sinyali ve yarın riski Ece, Sosyal Nabız, rapor ve hub yüzeylerinde tutarlı ama birebir kopya olmayan şekilde yankılansın.

## Oyuncu problemi

Oyuncu kararının sadece sonuç ekranında değil, şehirde ve raporda da fark edildiğini okumak ister.

## Yüzeylerin rolleri

Ece operasyonel danışman gibi tradeoff yorumlar. Sosyal Nabız sahadaki insan hissini kısa ve doğal verir. Rapor sakin kayıt dili kullanır. Tomorrow tek net yarın notu söyler. Hub düşük yoğunluklu, yeni güne taşınan kısa izi gösterir.

## Echo kind listesi

`decision_tradeoff_echo`, `tomorrow_risk_echo`, `route_balance_echo`, `container_pressure_echo`, `personnel_fatigue_echo`, `vehicle_fatigue_echo`, `social_trust_echo`, `district_trust_echo`, `crisis_prevention_echo`, `recovery_momentum_echo`, `carry_over_echo`, `operation_era_echo`, `post_pilot_scope_echo`, `generic_city_echo`, `fallback`.

## Selection rules

Öncelik: Decision Impact Explanation, Tomorrow Risk, carry-over, event/domain signal, resource fatigue, social pulse, district trust, Day 8+ operation context, fallback.

## Duplicate guard

Duplicate key same district + domain + resource + sourceKind üzerinden kurulur. Ece/Social/Report satırları aynı cümleyi paylaşmaz. Report/hub existing lines ile duplicate ise surface gizlenir. Fallback aynı anda birden fazla yüzeye yayılmaz.

## Ece entegrasyonu

`HubAdvisorCard` city echo advisor line üretir ve kısa Ece satırı olarak gösterir. Day 1 ağır sistem dili kullanılmaz.

## Social Pulse entegrasyonu

`socialPulsePresentation` decision echo mention için city echo social line kullanabilir. Mention sayısı artırılmaz, mevcut decision echo metni koordineli hale getirilir.

## Report entegrasyonu

`EndOfDayReportView` mevcut küçük karar etkisi satırını city echo report line ile besler. Yeni büyük rapor kartı açılmaz.

## Hub entegrasyonu

`HubScreen` existing previous decision line için city echo hub line üretir. Yeni hub kartı açılmaz.

## Day bazlı davranış

Day 1 minimal ve öğretici. Day 2-6 tek ana echo. Day 7 pilot kapanışıyla uyumlu. Day 8+ ana operasyon bağlamını daha net kullanabilir.

## Non-goals

Yeni gameplay engine, `applyDecision`, event generation, day pipeline, persistence, `SAVE_VERSION`, AI, yeni route, yeni büyük UI kartları, Remote Config, Live-Ops, persistent story chain, district operation action persistence ve monetization davranışı kapsam dışıdır.

## Verify sonucu

`npm run verify:city-echo-binding` echo kind kapsamını, duplicate guard'ı, yüzey helper bağlantılarını ve non-goal guard'larını kontrol eder.

## Sonraki önerilen prompt

City Echo Binding Pass Aşama 2: eventEcho template varyantlarını domain-specific city echo copy seçiminde daha zengin kullan, fakat surface sayısını artırma.
