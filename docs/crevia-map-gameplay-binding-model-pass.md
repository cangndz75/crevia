# Crevia Map Gameplay Binding Model Pass

## Amac

Bu pass haritayi UI redesign yapmadan karar destek modeliyle baglar. Model
presentation-time uretilir, persist edilmez ve MapScreen tarafina otomatik
entegre edilmez.

## Model Ailesi

Yeni core modul:

- `src/core/mapGameplayBinding/mapGameplayBindingTypes.ts`
- `src/core/mapGameplayBinding/mapGameplayBindingModel.ts`
- `src/core/mapGameplayBinding/mapGameplayBindingPresentation.ts`
- `src/core/mapGameplayBinding/verifyMapGameplayBindingScenario.ts`

`MapGameplayBinding` su bilgiyi tasir: role, playerQuestion,
supportedDecision, sourceKinds, sourceIds, permission/rank gereksinimi,
visibilityLevel, dayRange, confidence, priority ve guardReason.

## Roller

- `overview`: Haritanin guvenli genel sorusu.
- `operation_tracker`: Aktif operasyonun nerede ve hangi fazda oldugu.
- `risk_reader`: Mahalle risk, trust ve sosyal nabiz okuma.
- `resource_board`: Kaynak, personel, arac ve konteyner baskisi.
- `district_memory`: Onceki kararlarin mahalle izi.
- `route_support`: Aktif rota veya saha hatti destegi.
- `result_trace`: Karar sonucunun sehirde gorunen izi.
- `authority_unlock_surface`: Yetki ve harita katmaninin actigi bilgi.

## Supported Decision

Model haritayi su karar hatlarina baglar: aktif operasyonu acma, operasyon
onceligi secme, strateji stili secme, kaynak yonlendirme, rota baskisini
izleme, mahalle guvenini izleme, kaynak baskisini izleme, mahalleye geri
donme, sonuc izini inceleme ve acilan katmani anlama.

## Source Guard Kurallari

- District memory kaynagi yoksa `district_memory_trace` actionable olamaz.
- Active task route kaynagi yoksa `route_support_hint` rota iddiasi kurmaz.
- Container kaynagi yoksa konteyner agi karar cizgisi uretilmez.
- Vehicle kaynagi yoksa arac/bakim/rota iddiasi source olarak eklenmez.
- Tomorrow risk sadece spatial source tasiyorsa map binding olabilir.
- Authority permission yoksa detailed layer visibility uretilmez.
- Day 1'de overview disinda detayli map gameplay spam'i yoktur.
- Fake urgent, crisis, city memory, route veya marker gameplay claim yoktur.

## VisibilityLevel

- `hidden`: Kaynak yok, gun erken veya teaser da guvenli degil.
- `teaser`: Yetki/rank henuz yok ama unlock motivasyonu anlamli.
- `summary`: Kaynak var ve oyuncu genel karar destegi alabilir.
- `detailed`: Kaynak var, gerekli permission/rank var ve gun uygun.

Day davranisi:

- Day 1: overview guvenli, ileri binding'ler hidden/teaser.
- Day 2-7: aktif operasyon, district risk ve rota destek sinyali sinirli.
- Day 8+: resource board, route support, result trace ve memory acilabilir.
- Day 10+: authority layer surface daha gorunur hale gelir.

## Authority Permission Baglantisi

- `district_trust_preview` ve `map_trust_layer` risk reader'i guclendirir.
- `resource_pressure_summary` ve `map_resource_layer` resource board'u acar.
- `assignment_fit_preview` route support / operation tracker hattini destekler.
- `district_memory_trace_preview` memory trace'i summary/detailed yapabilir.
- `map_resource_layer`, `map_trust_layer`, `map_social_layer` authority surface
  visibility'sini guclendirir.

Permission yokken detailed bilgi gosterilmez; teaser sadece karar motivasyonu
icin vardir.

## Presentation Card Modeli

`buildMapGameplayBindingCardModels` hidden binding'lerden card uretmez, en
fazla 3 card dondurur ve teknik enum'lari UI metni olarak sizdirmaz. Siralama
actionable high confidence, Day 8+ stratejik sinyal, authority teaser ve
overview fallback onceligine gore yapilir.

## Analyzer ve Verify

- `npm run verify:map-gameplay-binding`
- `npm run analyze:map-gameplay-depth`

Verify kapsami: enum validation, unique id/sourceIds, priority clamp,
non-empty decision line, hidden card skip, max 3 card, Day 1 safe overview,
Day 8+ strategic source, source guards, permission detailed guard, fake claim
guard, SAVE_VERSION/persist/applyDecision/dayPipeline/MapScreen guard.

Analyzer kapsami: Day 1, Day 3, Day 7, Day 8 ve Day 10 sample state; player
questions, role coverage, source guard hidden count, teaser/detailed oranlari
ve actionable binding sayisi.

## Degistirilmeyen Sinirlar

- UI redesign yok.
- Map component degisikligi yok.
- Marker, route line veya animation yok.
- SAVE_VERSION degisikligi yok.
- Persist shape degisikligi yok.
- applyDecision degisikligi yok.
- Day pipeline degisikligi yok.
- Event selection, balance, navigation, RevenueCat, analytics veya asset yok.

## Sonraki Prompt

Active Operation Map Binding Pass: bu modelden yalnizca aktif operasyon karti
ve harita yuzeyi icin guvenli, source-driven UI baglantisi uretilecek.
