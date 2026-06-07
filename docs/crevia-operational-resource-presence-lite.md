# Crevia — Ekip & Araç Operasyon Detayı Lite (Aşama 1)

## Amaç

Oyuncunun saha kapasitesini ekip grubu ve araç filosu seviyesinde daha net okuması. Kararların mahalle dengesinin yanı sıra ekip temposunu ve araç kapasitesini de etkilediği hissi.

Ana oyuncu hissi: “Bugünkü kararım sadece mahalleyi değil, ekip temposunu ve araç kapasitesini de etkiliyor.”

## Neden tekil personel değil ekip grubu

Soft launch öncesi tam personel yönetimi açılmaz. Oyuncu isim, fotoğraf veya bireysel moral takibi yapmaz; bunun yerine “Temizlik Ekibi”, “Rota Destek Ekibi” gibi operasyonel gruplar görür.

## Neden tekil araç değil araç grubu

Plaka, model veya tekil envanter yok. “Rota Destek Araçları”, “Hafif Hizmet Araçları” gibi filo seviyesi özet sunulur.

## Lite scope

- `OperationalResourcePresenceLiteModel` presentation modülü
- Hub kartı ve detail sheet güçlendirme
- Map presence helper (canlı takip yok)
- Report / Decision / Tomorrow / Echo helper satırları
- Content pack metadata entegrasyonu
- Day-based visibility
- Duplicate/copy guard

## V1.1 Team/Vehicle Runtime’dan farkı

| Lite (Aşama 1) | V1.1 (gelecek) |
|----------------|----------------|
| Presentation-only | Team Specialization Runtime |
| Grup seviyesi özet | Tekil personel envanteri |
| Bakım izleme dili | Vehicle Maintenance Runtime |
| Harita presence satırı | Canlı rota / GPS takibi |

## Team group model

`TeamGroupPresence`: cleanup, route, container, support, rapid_response, coordination grupları; status (ready, assigned, busy, fatigued, recovering, watch); workload/fatigue/morale band.

## Vehicle group model

`VehicleGroupPresence`: light_service, route_support, container, field_support, maintenance_watch grupları; capacity/fatigue/maintenance band; status (ready, assigned, route_pressure, fatigue_watch, maintenance_watch, limited).

## Hub entegrasyonu

`HubOperationalResourcesCard` presence özet satırlarını gösterir. CTA “Kaynakları Gör” aynı kalır. Default tab en baskılı kaynak türüne göre seçilir.

## Detail sheet entegrasyonu

`OperationalResourcesDetailSheet` Ekipler ve Araçlar sekmesinde presence kartları (max 2 satır, kompakt chip). Konteyner sekmesi mevcut yapıda kalır.

## Map presence helper

`buildMapResourcePresencePanelLine` — selected district / bottom panel için kısa satır. Canlı konum, GPS, rota çizgisi yok.

## Report/helper entegrasyonu

`buildOperationalResourcePresenceReportLine` — gün sonu raporda küçük “Saha kapasitesi” satırı. Decision Impact ile duplicate edilmez.

## Content pack integration

- vehicle_route_pack_one → route_support_vehicle / route_team
- resource_fatigue variant → fatigue_watch
- vehicle_maintenance domain → maintenance_watch (runtime açmaz)
- container_environment_pack_one → container_team / container_vehicle
- district_pack_one → support_team / coordination_team

Teknik pack adları UI’da görünmez.

## Day-based visibility

| Gün | Mod |
|-----|-----|
| 1 | hidden — ağır kaynak dili yok |
| 2–3 | compact — max 1 baskı satırı |
| 4–7 | standard — ekip/araç grupları görünür |
| 8+ | standard (post-pilot ana operasyon) |
| 8+ full | detailed_preview — yine lite, full management değil |

## Duplicate guard

Decision Impact, Tomorrow Risk, City Echo, MainOperationFeel, DistrictReportCard, CityJournal, map overlay, operationSignals ve resource fatigue satırlarıyla tekrar engellenir.

## Copy guard

Yasak: GPS, canlı takip, koordinat, plaka, personel adı, tekil araç, pack, metadata, runtime, panik dili.

## Non-goals

- Tekil personel/araç listesi
- GPS / canlı takip
- Vehicle Maintenance Runtime
- Team Specialization Runtime
- applyDecision / dayPipeline / persist değişikliği
- SAVE_VERSION artışı
- Yeni route / büyük UI redesign

## Verify sonucu

`npm run verify:operational-resource-presence` — model, pack wiring, visibility, UI guard, safety kontrolleri.

## Sonraki önerilen prompt

“Crevia Dynamic Map Reaction Lite Aşama 1 — map presence marker’larını district seçiminde görsel chip olarak bağla; yine GPS/canlı takip açma.”

## Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:operational-resource-presence
npm run verify:operational-resources
npm run verify:resource-fatigue-visuals
npm run verify:content-runtime-activation
npm run verify:main-operation-feel
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:hub-ui
npm run verify:map-ui
npm run verify:report-ui
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
```
