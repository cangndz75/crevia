# Crevia Crisis Adjacent Pack One

Crisis Adjacent Pack One is an authoring-only content pack for crisis watch, prevention, recovery, and resource pressure scenes.
It supports controlled risk monitoring without panic escalation language across all five districts.

## Scope

- 5 districts: Cumhuriyet, Sanayi, Istasyon, Merkez, Yesilvadi.
- 14 event family entries: Cumhuriyet 3, Sanayi 3, Istasyon 3, Merkez 3, Yesilvadi 2.
- 56+ variant copy entries, at least 4 per family.
- 6 echo surfaces per family: advisor, report, social, map, tomorrow preview, result.
- Crisis watch, prevention, recovery, resource pressure, district trust, and district memory intents are metadata/content links only.
- Per-family hints: crisis watch, prevention, recovery, advisor risk tone, report risk summary.

## Crisis-Adjacent Language Safety

Copy uses calm operational tone: onleyici takip, toparlanma penceresi, saha baskisi izleniyor, kisa mudahale alani, yarina takip birakiyor.
Forbidden panic wording: panik, alarm, kriz patladi, coktu, felaket, acil durum ilani, kontrol kaybedildi, kesin cozuldu.

## District Distribution

Cumhuriyet: repeated container perimeter pressure, apartment complaint softening, trust recovery window.

Sanayi: shift route balancing, industrial waste preventive tracking, vehicle fatigue crew planning.

Istasyon: transfer density prevention, pedestrian platform pressure watch, short litter social-impact prevention.

Merkez: visible service area pressure control, official line sensitive tracking, intervention trust protection.

Yesilvadi: environmental sensitivity plan, park density recovery, calm service perception protection.

## Variant Coverage

Variant kinds include normal, improved, worsened, carry over, comeback, recovery, resource fatigue, district trust, crisis adjacent, and reward.
Player adaptive and operation era context may appear in hints only, not as primary event framing.

## Prevention / Recovery / Crisis Watch Intent Coverage

Every family includes `crisisWatchIntent` and `preventionIntent`.
Every family includes `recoveryIntent` and `resourcePressureIntent`.
Every family includes `districtTrustIntent` and `districtMemoryIntent`.

## Echo Surfaces

Each family ships advisor, report, social, map, tomorrow preview, and result echoes.
Social echoes may use short role-prefixed quotes (yonetim, ekip, sorumlu, gorevli, sakin).
Crisis and risk hints are stored as map_hint copy blocks and pack metadata.

## Runtime Boundary

- Runtime activation yok.
- Event generation rewrite yok.
- Crisis engine degismez.
- Persist shape degismez.
- SAVE_VERSION degismez; it remains 23.
- District operation action engine, UI, analytics, and IAP degismez.

## QA

Run:

```bash
npm run verify:crisis-adjacent-pack-one
```

The verifier checks district distribution, variant count, echo completeness, hint coverage, duplicate risk (internal and vs District Pack One, Vehicle Route Pack One, Container Environment Pack One, and Social Trust Pack One), mobile copy length, panic wording guard, dependent pipeline scenarios, and SAVE_VERSION.

## Next Pack Suggestions

1. Mini Story Chain Pack
2. Operation Era Pack
3. Reward / Comeback Pack
4. Live-Ops Theme Pack
