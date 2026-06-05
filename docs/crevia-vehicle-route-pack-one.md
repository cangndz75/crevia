# Crevia Vehicle and Route Pack One

Vehicle and Route Pack One is an authoring-only content pack for vehicle, route, field flow, and maintenance pressure.
It strengthens Sanayi and Istasyon while adding route-linked support families for Merkez, Cumhuriyet, and Yesilvadi.

## Scope

- 5 districts: Merkez, Cumhuriyet, Sanayi, Istasyon, Yesilvadi.
- 16 event family entries: Sanayi 5, Istasyon 5, Merkez 2, Cumhuriyet 2, Yesilvadi 2.
- 64+ variant copy entries, at least 4 per family.
- 6 echo surfaces per family: advisor, report, social, map, tomorrow preview, result.
- Route hints per family: dispatch, field, active route, maintenance.
- Active route, vehicle maintenance, and resource fatigue intents are metadata/content links only.

## Sanayi and Istasyon Weight

Sanayi families focus on shift-exit vehicle density, industrial road bottlenecks, heavy-waste route pressure, maintenance windows, and field-team route alignment.

Istasyon families focus on morning transfer crowds, evening return waves, short pedestrian-pocket litter, minute-level route timing, and dual-vehicle coordination.

## Variant Coverage

Variant kinds include normal, improved, worsened, carry over, reward, comeback, resource fatigue, district trust, and controlled crisis-adjacent copy.
Crisis-adjacent lines stay operational and avoid panic wording.

## Route, Maintenance, and Fatigue Intent Coverage

Every family includes `activeRouteIntent`.
Every family includes `vehicleMaintenanceIntent` and `resourceFatigueIntent`.
Route hints cover dispatch, field, active route, and maintenance surfaces.

## Echo Surfaces

Each family ships advisor, report, social, map, tomorrow preview, and result echoes.
Route-specific short hints are stored as map_hint copy blocks and pack metadata.

## Runtime Boundary

- Runtime activation yok.
- Event generation rewrite yok.
- Persist shape degismez.
- SAVE_VERSION degismez; it remains 23.
- UI route, screen, analytics, IAP, district operation action engine, active route engine, vehicle maintenance engine, applyDecision, and dayPipeline degismez.

## QA

Run:

```bash
npm run verify:vehicle-route-pack-one
```

The verifier checks district distribution, variant count, echo completeness, route hint coverage, duplicate risk (internal and vs District Pack One), mobile copy length, controlled crisis-adjacent tone, dependent pipeline scenarios, and SAVE_VERSION.

## Next Pack Suggestions

1. Container and Environment Pack
2. Social Trust Pack
3. Crisis Adjacent Pack
4. Mini Story Chain Pack
