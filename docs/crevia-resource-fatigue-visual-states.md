# Crevia Resource Fatigue Visual States

## Amaç

Araç, ekip ve konteyner durumlarını sayı/metrik yerine kısa, tutarlı görsel state’ler (chip + harita marker tonu) olarak sunmak. Oyuncu “hazır / yoğun / yorgun / bakım riski / toparlandı” ayrımını hızlı okur.

## Neden gerekli?

Dynamic Field Presence Map Layer saha varlıklarını gösterdi; ancak marker ve kartların durum dili parçalıydı. Bu katman merkezi bir presentation mapper sağlar.

## Hangi kaynaklar?

- Araç (`vehicle`)
- Ekip / personel (`personnel`)
- Konteyner ağı (`container`)
- Rota yükü (`route`)
- Birleşik risk (`mixed`, Day 6+)

## Vehicle states

`ready`, `busy`, `tired`, `maintenance_risk`, `critical` — operationalResources `standard_truck` ve operationSignals’tan türetilir; panik dili yok.

## Personnel states

`stable`, `busy`, `strained`, `tired`, `critical` — `field_team` fatigue/morale skorlarından.

## Container states

`watch`, `strained`, `critical`, `recovering`, `resolved` — district network baskısı ve event/carry-over sonucundan.

## Route states

`stable`, `busy`, `strained`, `tired`, `maintenance_risk` — araç rota/bakım baskısından.

## Dynamic Field Presence ile ilişki

`mapPresencePresentation` marker status’larını `buildResourceFatigueMapMarkerStatus` ile hizalar; anchor sistemi değişmez.

## Event Domain UI ile ilişki

Dispatch/field/result yüzeylerinde `inferResourceDomainFromEventFocus` domain önceliğini korur.

## Report Tomorrow Preview ile ilişki

Rapor yüzeyinde aynı domain’de yarın önizlemesi varsa resource fatigue satırı gösterilmez (duplicate önleme).

## Day 1 safety

Gün 1’de strip/chip gizli.

## Day 7 final safety

Özet en fazla 2 state ile kompakt.

## Neyi değiştirmez?

- `SAVE_VERSION`, persist, `applyDecision`, day pipeline, event generation
- `operationalResources` / `operationSignals` engine
- Analytics SDK, IAP

## Sonraki prompt: Map Before After State

Roadmap: `map-before-after-state` — karar öncesi/sonrası harita snapshot presentation.

Doğrulama: `npm run verify:resource-fatigue-visuals`
