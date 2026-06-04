# Crevia District Pack One

District Pack One is an authoring-only content pack for phase 2 of the content production pipeline.
It adds the first real district-focused event family set without connecting it to runtime activation.

## Scope

- 5 districts: Merkez, Cumhuriyet, Sanayi, Istasyon, Yesilvadi.
- 20 event family entries, exactly 4 per district.
- 80 variant copy entries, at least 4 per family.
- 6 echo surfaces per family: advisor, report, social, map, tomorrow preview, result.
- District trust, district memory, resource pressure, active route, and operation era references are metadata/content links only.

## Runtime Boundary

- Runtime activation yok.
- Event generation rewrite yok.
- Persist shape degismez.
- SAVE_VERSION degismez; it remains 23.
- UI route, screen, analytics, IAP, and live content delivery changes yok.

## Coverage

The pack covers container, vehicle route, personnel, social trust, district operation, resource fatigue, carry over, and reward recovery authoring needs. Existing content-production domain ids are used where available, with district operation, carry over, and reward recovery represented as tags when they are concept links rather than domain ids.

Variant coverage includes normal, improved, worsened, carry over, reward, comeback, resource fatigue, district trust, controlled adjacent risk, operation era context, player adaptive, and recovery.

## QA

Run:

```bash
npm run verify:district-pack-one
```

The verifier checks district distribution, variant count, echo completeness, duplicate risk, mobile copy length, controlled adjacent-risk tone, existing pipeline scenarios, and SAVE_VERSION.
