# Crevia Decision Consequence Depth Pass

## Purpose

Bu pass oyuncuya ayni dengeyi farkli kelimelerle tekrar anlatmak yerine mevcut karar izlerini daha okunur hale getirir: "Dun bunu sectim, bugun sehir bunu hatirliyor."

Uygulama modeli presentation-only kalir. `applyDecision`, kalici state sekli, `SAVE_VERSION`, gun pipeline semantigi, route/navigation, store, analytics ve denge hesaplari degismez.

## Existing Consequence Chain

| Source | Existing meaning | Consequence use |
| --- | --- | --- |
| Carry-over memory | Onceki gunden tasinan etki | En yuksek oncelikli nedensel iz |
| Butterfly hint | Kucuk kararin sonraki gun etkisi | Multi-day karar izi |
| Tomorrow risk | Yarin izlenecek risk | Rapor ve merkezde birincil yarin aksiyonu |
| District memory | Mahalle/bolge hafizasi | Hub ve sonuc yuzeyinde mahalle hatirlamasi |
| City journal/archive | Sehir kaydi ve gunluk ozet | Daha dusuk oncelikli arsiv dili |
| Social/resource/authority lines | Sistem yansimalari | Kaynak baskisi, sosyal yanki, yetki ilerlemesi |

## DecisionConsequenceThread Model

`DecisionConsequenceThread` tek bir sunum ipucudur. Her thread:

- `consequenceType`: `resource_pressure`, `district_memory`, `social_echo`, `tomorrow_risk`, `carry_over`, `butterfly`, `city_archive`, `story_chain`, `authority_progress`, `neutral_record`
- `strength`: `low`, `medium`, `high`
- `timeScope`: `immediate`, `next_day`, `multi_day`
- `tone`: `positive`, `neutral`, `warning`
- `visibleIn`: hangi yuzeyde kullanilabilecegi
- `sourceIds`: gercek kaynak id'leri
- `causalLine`: oyuncuya gorunen "bu karar sunu etkiledi" satiri
- `nextActionHint`: varsa tekil bir sonraki aksiyon

Thread sayisi en fazla 3 olur. Ayni listede en fazla bir `high` thread kalir. Duplicate id, duplicate source id ve ayni metin tekrar edilmez.

## Source Selection

Kaynak onceligi su sirayla uygulanir:

1. `carry_over`
2. `butterfly`
3. `tomorrow_risk`
4. `district_memory`
5. `resource_pressure`
6. `social_echo`
7. `authority_progress`
8. `city_archive`
9. `story_chain`
10. `neutral_record`

Kaynak yoksa sadece dusuk riskli `neutral_record` fallback uretilir. Bu fallback sahte carry-over, butterfly, unlock, kriz veya hikaye zinciri iddiasi tasimaz.

## Surface Binding

Result reveal:

- Mevcut reveal item akisini bozmadan ek bir `city_memory` item ekler.
- Sadece sonuc yuzeyinde gorunebilir ve gercek source id tasiyan thread kullanilir.

End-of-day report:

- Gun 2 ve sonrasinda en fazla bir primary tomorrow action aday olarak basa eklenir.
- Gun 1 icin eski bos/dusuk veri davranisi korunur.
- `DailyReport` sekli degismez.

Hub recommended plan:

- Journal, district, story, carry-over ve tomorrow-risk govde satirlarinda varsa consequence line kullanir.
- Mevcut fallback ve dedupe mantigi korunur.

Ece advisor:

- Ece reason/caution satiri consequence thread ile daha nedensel okunur.
- Ayni metnin context/reason olarak tekrar edilmesini engelleyen mevcut dedupe akisi korunur.

Continuation cards:

- Carry-over kart govdesinde varsa consequence line tercih edilir.
- Kart sayisi, action modeli ve route davranisi degismez.

## Fake Risk Guards

Bu pass sunlari uretmez:

- Kaynak yokken carry-over, butterfly veya story-chain iddiasi
- Yeni kriz, yeni unlock, yeni premium/store mesaji
- Yeni analytics veya yeni kalici state alani
- `applyDecision` icinde yeni sonuc semantigi
- Gun pipeline akisini degistiren otomatik karar/aksiyon

Verify script ayrica `applyDecision`, `gamePersist` ve `useGameStore` icinde `decisionConsequence` baglantisi olmadigini kontrol eder.

## Verification Scope

Yeni komut:

```bash
npm run verify:decision-consequence-depth
```

Bu verifier:

- Thread cap, enum, uniqueness, priority ve high-strength sinirlarini kontrol eder.
- Day 1 neutral fallback ve fake urgency guardlarini kontrol eder.
- Result, report, hub ve Ece yuzeylerinin consequence line uretebildigini kontrol eder.
- Mevcut `verify:operation-result-reveal`, `verify:operation-flow-qa`, `verify:center-recommended-plan`, `verify:center-continuation-cards`, `verify:center-advisor` senaryolarini nested calistirir.
- `SAVE_VERSION === 26` ve persist/applyDecision/day-store baglantisizligini kontrol eder.

## Remaining Event Freshness & Variety Gameplay Pass Notes

Decision consequence derinligi sadece mevcut karar izlerini daha okunur yapar. Hala ayri bir Event Freshness & Variety Gameplay Pass gerekir:

- Olay tekrarlarini azaltan freshness scoring
- Daha belirgin olay varyasyonlari
- Ayni karar tonunun pes pese gelmesini sinirlayan secim cesitliligi
- Yeni denge sistemi eklemeden, mevcut event selection verisi uzerinden sunum ve secim kalitesi
