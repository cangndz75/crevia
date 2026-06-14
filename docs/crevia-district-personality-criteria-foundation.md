# Crevia District Personality & Criteria Foundation

## Amac

Bu pass mahalleleri sadece isim, harita noktasi veya trust degeri olmaktan
cikarip gameplay odakli karar baglamina donusturur. Model presentation-time
uretilir, persist edilmez ve UI redesign yapmaz.

## Neden Oncelikli

Day 8+ sonrasi oyuncunun sadece "hangi event?" degil, "hangi bolgeye hangi
stratejiyle, hangi kaynakla, hangi sirayla mudahale edecegim?" sorusunu
okuyabilmesi gerekir. District criteria bu soruya event variety, map binding,
Ece line, retention, resource pressure, memory ve future city-rhythm sistemleri
icin ortak context verir.

## Baseline personality vs live pressure

Baseline personality mahallenin oyun tasarimindaki sabit egilimidir. Source
olarak `design_baseline` ve `district_identity` kullanir. "Bu bolge rota
kararlarina duyarlidir" gibi genel oyun baglami uretir.

Live pressure o gun gercek kaynakla gelen sinyaldir. Source olarak
`social_pulse`, `operation_signal`, `resource_pressure`, `active_task_route`,
`district_memory`, `city_archive`, `decision_consequence` gibi girdileri
kullanir. Source yokken "bugun kriz var", "dunku karar iz birakti" veya
"sosyal tepki patliyor" gibi iddialar uretilmez.

## Criteria

- `social_sensitivity`: Sosyal nabiz ve iletisim tonu karar hassasiyetini artirir.
- `route_difficulty`: Rota, arac ve zaman kararlarini daha onemli hale getirir.
- `container_density`: Konteyner ve cevre hatlari daha dikkatli okunur.
- `trust_fragility`: Karar tonu mahalle guveninde daha gorunur etki yaratabilir.
- `recovery_potential`: Dogru takip hamlesi pozitif toparlanma firsati yaratabilir.
- `neglect_risk`: Uzun bekleme baskinin birikmesine yol acabilir.
- `maintenance_exposure`: Arac, ekip ve bakim penceresi karari daha belirleyicidir.
- `operation_history_weight`: Gecmis kararlar burada daha okunur iz birakabilir.
- `public_visibility`: Operasyon sonucu daha hizli fark edilebilir.
- `resource_dependency`: Mudahale daha fazla ekip, arac veya kapasite isteyebilir.

## Archetypes

Archetype listesi: `balanced_district`, `socially_sensitive`,
`route_bottleneck`, `container_dense`, `trust_fragile`, `recovery_ready`,
`neglect_prone`, `maintenance_exposed`, `public_attention_zone`,
`resource_heavy`.

Her profile en fazla iki archetype tasir. Gercek source veya bilinen district
identity yoksa balanced fallback kullanilir. Archetype'lar gercek topluluk
profili degil, sadece oyun ici operasyonel egilimdir.

## Profile Modeli

`DistrictPersonalityProfile` district id/name, archetype listesi, primary ve
secondary criteria, gameplay tag'leri, event bias, strategy bias, map bias,
Ece tone hint, retention hint, confidence, fallback state ve source id'leri
tasir. Score 0-100 clamp edilir; band `low`, `medium`, `high` olarak verilir.

## Score Yaklasimi

Skorlar baseline + live modifier seklinde presentation-time hesaplanir.
Baseline district identity/design mapping'den gelir. Live modifier sadece
gercek signal input'u varsa eklenir. Decision engine veya balance dogrudan
degismez.

## Source Guard

- Source id'leri dedupe edilir.
- Fallback profile low confidence ve balanced olur.
- Fallback profile live pressure iddiasi kurmaz.
- Live source yoksa memory, route, trust veya tomorrow risk kesin iddiasi yoktur.
- Permission yoksa detailed district bilgisi helper tarafinda acilmaz.

## Prohibited Profiling Guard

Model ve copy gercek dunya insan gruplari hakkinda gelir, etnik yapi, din,
siyasi gorus, suc, saglik, gocmenlik veya benzeri hassas profil iddiasi
uretmez. "Sosyal hassasiyet" oyun ici social-pulse/trust contextidir.

## EventGameplayVariety Baglantisi

`buildDistrictPersonalityEventContext(profile)` domain bias, pressure bias,
decision shape hint, inspect line, plan line ve strategy caution line uretir.
Event selection veya EventGameplayVariety core davranisi degismez.

## MapGameplayBinding Baglantisi

`buildDistrictPersonalityMapContext(profile)` preferred map roles, map signal
line, source kinds, source ids ve confidence verir. Bu map binding icin
hazir source/context adapteridir; MapScreen, marker, route veya animation
eklemez.

## Ece Line Baglantisi

`buildDistrictPersonalityAdvisorLine(profile, context)` tek cumlelik safe line
uretir. Day 1 hub spam'i yapmaz, low confidence durumunda kesin konusmaz ve
permission hidden ise line dondurmez.

## Retention Hint

`buildDistrictRetentionHint(profile, context)` district id, title, line,
priority, sourceKinds ve actionable state verir. Source yoksa veya fallback ise
non-actionable kalabilir. One More Day Retention Pass icin hazir modeldir.

## Positive/Comeback Mapping

- `recovery_potential` high: positive/recovery candidate.
- `trust_fragility` high + improvement source: trust comeback candidate.
- `neglect_risk` high + follow-up source: recovery candidate.
- `container_density` high + cleanup source: environment positive candidate.
- `social_sensitivity` high + social improvement source: civic support candidate.

Bu pass event uretmez.

## Neglect Future Mapping

Neglect foundation baseline neglect risk, unresolved carry-over, tomorrow risk,
trust decline, repeated resource pressure ve city archive negative trace ile
beslenebilir. Bu pass neglect meter persist etmez ve neglect event uretmez.

## City Rhythm Future Mapping

- social + public visibility: public attention day candidate.
- resource + route: resource squeeze day candidate.
- recovery: opportunity window day candidate.
- neglect: rising pressure day candidate.
- trust fragility: careful recovery day candidate.

Bu pass city rhythm runtime yazmaz.

## Authority Visibility

- `district_trust_preview`: trust/social summary.
- `resource_pressure_summary`: resource/container/route summary.
- `assignment_fit_preview`: route/maintenance summary.
- `map_trust_layer`: district risk detailed.
- `map_resource_layer`: resource board detailed.
- `district_memory_trace_preview`: operation history detailed.

Permission yoksa detailed bilgi yoktur; teaser olabilir ama locked spam yoktur.

## Analyzer ve Verify

- `npm run analyze:district-personality`
- `npm run verify:district-personality`

Analyzer district sayisi, fallback orani, confidence dagilimi, archetype
dagilimi, criteria cesitliligi, Day 8+ map/event/retention katkisi ve
prohibited copy riskini raporlar.

Verify safe model, score clamp, archetype cap, source dedupe, fallback guard,
baseline/live ayrimi, prohibited copy, line pack, event/map/advisor/retention
helper, permission detailed guard, Day 1 low-noise, Day 8+ context ve repo
boundary guardlarini kontrol eder.

## Degistirilmeyen Sinirlar

- SAVE_VERSION yok.
- Persist yok.
- Migration yok.
- applyDecision yok.
- Day pipeline yok.
- Map UI yok.
- Marker, route, animation yok.
- Event selection rewrite yok.
- Balance degisikligi yok.
- Navigation, RevenueCat, analytics, store veya asset yok.

## Sonraki Prompt

Siradaki uygun prompt: Active Operation Map Binding Pass, Map Signal Copy Pack
veya Daily Capacity / Operation Portfolio Planning.
