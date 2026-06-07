# Crevia — Dynamic Map Reaction Lite (Aşama 1)

## Amaç

Crevia haritasını sadece mahalle seçme / bilgi okuma yüzeyi olmaktan çıkarıp, oyuncunun kararlarına ve şehir sinyallerine küçük ama hissedilir görsel tepkiler veren canlı bir operasyon yüzeyi haline getirmek.

Ana oyuncu hissi: “Harita sadece statik değil. Şehir kararlarıma tepki veriyor.”

## Neden şimdi gerekli

Map district intelligence, Mahalle Karnesi, Şehir Günlüğü, Operational Resource Presence ve content pack runtime zaten sinyal üretiyor. Bu pass bu sinyalleri harita pin/strip/bottom panel üzerinde küçük reaction katmanına dönüştürür — full living map motoru açmadan.

## Lite scope

- `MapReactionLiteModel` core presentation modülü
- MapScreen / MapOperationBottomPanel / neighborhood strip entegrasyonu
- CityOverviewMap district highlight (mint stroke)
- Day-based visibility
- Duplicate/copy guard
- Verify script ve dokümantasyon

## Full Living Map V1.1/V2’den farkı

| Lite (Aşama 1) | V1.1/V2 (gelecek) |
|----------------|-------------------|
| Pin/strip/bottom hint | Rota çizgisi, canlı araç hareketi |
| Soft pulse / ring / glow style state | Heatmap layer |
| Grup/kapasite dili | GPS / tekil konum |
| Max 4 reaction | Full resource tracking |

## Reaction kind listesi

1. `trust_pulse` — güven toparlanıyor
2. `risk_ring` — yarın riski / carry-over izleme
3. `recovery_glow` — recovery momentum
4. `social_bubble` — City Echo sosyal satır
5. `route_pressure_marker` — rota baskısı
6. `container_pressure_marker` — konteyner çevresi
7. `resource_fatigue_marker` — kaynak yorgunluğu
8. `resource_presence_marker` — saha kapasitesi
9. `team_capacity_marker` — ekip temposu
10. `vehicle_capacity_marker` — araç kapasitesi
11. `crisis_watch_ring` — kriz eşiği değil, izleme
12. `operation_scope_marker` — Day 8+ ana operasyon kapsamı
13. `journal_trace` — Şehir Günlüğü son iz
14. `content_pack_marker` — pack-origin sinyal (teknik ad yok)
15. `active_route_hint` — aktif görev rotası ipucu
16. `fallback` — hiç sinyal yoksa mahalle kimliği

## Source signal priority

1. Selected district active reaction
2. TomorrowRisk / carryOver (yüksek öncelik)
3. DistrictReportCard dominant issue
4. OperationalResourcePresence selected district pressure
5. ContentPackMeta domain/district marker
6. CityEcho social/recovery line
7. districtTrust fragile/recovering/trusted band
8. districtMemory unresolved/recovery trace
9. operationSignals route/container/personnel/vehicle pressure
10. resourceFatigue
11. CityJournal recent entry (`buildCityJournalMapHint`)
12. MainOperationFeel scope district
13. fallback district identity
14. Day-based visibility cap

## Day-based visibility

| Gün | Mod | Max reaction |
|-----|-----|--------------|
| 1 | hidden / minimal | 0 — tutorial harita |
| 2–3 | compact | 1 (selected district) |
| 4–7 | standard (hafif) | 3 |
| 8+ | standard | 4 |
| Full main operation | standard | 4 (heatmap yok) |

## Map UI integration

- **MapNeighborhoodStrip** — reaction dot + kısa indicator label
- **MapOperationBottomPanel** — `Harita tepkisi: …` hint satırı
- **CityOverviewMap** — reaction highlight district mint stroke
- **MapHeroPanel / CityMapCard** — `reactionHighlightDistrictIds` prop zinciri

Yeni tam ekran UI, yeni route veya chip yığını yok.

## Animation rules

Lite animasyon ipuçları: soft pulse, opacity fade, tiny scale-in, ring glow, mention bubble pop.

- Süre 120–300ms hedefi
- Infinite aggressive loop yok
- Yeni ağır animation dependency yok
- Mevcut style state + `shouldAnimate` / `pulseStyle` / `animationHint` alanları

Motion polish backlog: Reanimated ile pin pulse V1.1.

## Resource Presence Lite integration

Operational Resource Presence sinyalleri şu reaction’ları besler:

- `resource_presence_marker`, `team_capacity_marker`, `vehicle_capacity_marker`
- `resource_fatigue_marker`, `route_pressure_marker`, `container_pressure_marker`

Yasak dil: GPS, canlı takip, koordinat, plaka, personel adı, tekil araç konumu.

## Content Pack integration

| Pack domain | Reaction |
|-------------|----------|
| Vehicle/Route | route_pressure_marker, vehicle_capacity_marker, resource_fatigue_marker |
| Container/Environment | container_pressure_marker, recovery_glow |
| District | trust_pulse, social_bubble, operation_scope_marker |
| crisis_adjacent variant | crisis_watch_ring (panik dili yok) |
| recovery variant | recovery_glow |
| operation_era variant | operation_scope_marker |

Teknik pack adları UI’da görünmez.

## City Journal integration

Selected district ile ilişkili son günlük entry varsa `journal_trace` üretilir (`buildCityJournalMapHint`). Max 1 journal trace; Mahalle Karnesi / Hub journal satırı ile duplicate edilmez.

## District Report Card integration

Mahalle Karnesi `dominantIssueKind` reaction seçimine kaynak olur; aynı satır birebir kullanılmaz. Kart ana açıklama, MapReaction pin/bubble görsel sinyal.

## Operational Resource Presence integration

Presence map line ile duplicate guard. Harita reaction kısa (“bu hatta kapasite baskısı”); Detail sheet daha açıklayıcı.

## Duplicate guard

Duplicate key: districtId + reactionKind + domain + sourceKind (+ familyId, resourceKind).

- Aynı district max 1 dominant reaction
- Social bubble ve journal trace aynı district’te çakışmaz
- Risk ring ve crisis_watch birleşir
- Resource presence ve resource fatigue aynı line üretmez

## Copy guard

Yasaklı kelimeler: pack, metadata, runtime, GPS, canlı takip, koordinat, plaka, panik, felaket, vb.

Ton: kısa, sakin, operasyonel, mahalle/domain referanslı.

## Non-goals

- Full living map engine
- GPS / tekil araç-personel konumu
- Rota çizgisi / pathfinding / animasyonlu hareket
- Heatmap / konteyner doluluk animasyonu
- applyDecision / dayPipeline / event generation değişikliği
- SAVE_VERSION artırımı / persist shape değişikliği
- Yeni route / büyük UI redesign
- Vehicle Maintenance Runtime / Team Runtime açma

## Verify sonucu

Çalıştır:

```bash
npm run verify:map-reactions
```

Beklenen: model üretimi, 16 reaction kind, day visibility, mapping, UI integration, duplicate guard, resource safety, SAVE_VERSION 23.

## Sonraki önerilen prompt

**Dynamic Map Reaction Lite Aşama 2:** Reanimated pin pulse, selected district bubble tap-to-expand, journal trace ↔ City Journal deep link, Day 8+ operation scope animated ring polish.

## Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:map-reactions
npm run verify:map-ui
npm run verify:map-district-intelligence
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:operational-resource-presence
npm run verify:operational-resources
npm run verify:resource-fatigue-visuals
npm run verify:content-runtime-activation
npm run verify:main-operation-feel
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:active-task-route
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
```
