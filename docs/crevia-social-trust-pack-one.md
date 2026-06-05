# Crevia Social Trust Pack One

Social Trust Pack One is an authoring-only content pack for social pulse, district trust, public sentiment, citizen feedback, and visible service perception.
It strengthens Cumhuriyet, Merkez, and Yesilvadi while adding social and operational perception support for Istasyon and Sanayi.

## Scope

- 5 districts: Merkez, Cumhuriyet, Sanayi, Istasyon, Yesilvadi.
- 16 event family entries: Cumhuriyet 4, Merkez 4, Yesilvadi 3, Istasyon 3, Sanayi 2.
- 64+ variant copy entries, at least 4 per family.
- 6 echo surfaces per family: advisor, report, social, map, tomorrow preview, result.
- Social trust, public sentiment, district trust, district memory, and social mention intents are metadata/content links only.
- Per-family hints: social mention, district trust, advisor tone, report public reaction.

## District Weight

Cumhuriyet families focus on apartment-front complaint ledgers, post-night waste trust repair, neighbourhood feedback books, and repeated-pressure softening.

Merkez families focus on visible stop perception, square comment waves, official-line intervention traces, and evening-density reactions.

Yesilvadi families focus on calm service expectation notes, park-edge user comments, and regular follow-up trust recovery.

Istasyon and Sanayi families focus on transfer comments, platform perception notes, coordination echoes, workplace-front perception, and shift-exit feedback.

## Variant Coverage

Variant kinds include normal, improved, worsened, carry over, reward, comeback, district trust, recovery, player adaptive, and controlled crisis-adjacent.
Resource fatigue appears on selected Istasyon and Sanayi families only.
Operation era context stays in hints and metadata only, not as primary event framing.

## Social Trust, District Trust, and Memory Intent Coverage

Every family includes `socialTrustIntent` and `publicSentimentIntent`.
Every family includes `districtTrustIntent` and `districtMemoryIntent`.
Every family includes `socialMentionIntent` for social pulse mention authoring.

## Echo Surfaces

Each family ships advisor, report, social, map, tomorrow preview, and result echoes.
Social echoes are written to be livelier than advisor lines and may use short role-prefixed quotes (mahalleli, esnaf, site sakini, yolcu, calisan).
Social and trust short hints are stored as map_hint copy blocks and pack metadata.

## Runtime Boundary

- Runtime activation yok.
- Event generation rewrite yok.
- Persist shape degismez.
- SAVE_VERSION degismez; it remains 23.
- Social pulse engine, district operation action engine, UI, analytics, and IAP degismez.

## QA

Run:

```bash
npm run verify:social-trust-pack-one
```

The verifier checks district distribution, variant count, echo completeness, hint coverage, duplicate risk (internal and vs District Pack One, Vehicle Route Pack One, and Container Environment Pack One), mobile copy length, controlled crisis-adjacent tone, social echo safety, dependent pipeline scenarios, and SAVE_VERSION.

## Next Pack Suggestions

1. Crisis Adjacent Pack
2. Mini Story Chain Pack
3. Operation Era Pack
4. Reward / Comeback Pack
