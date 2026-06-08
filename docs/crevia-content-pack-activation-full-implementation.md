# Content Pack Activation Full Implementation — Aşama 1

## 1. Amaç

Day 8+ tam erişimde kontrollü `limited_full` aktivasyonunu açmak; pilot Day 1–7 güvenliğini, Lite cap’leri ve planning balance guard’larını bozmadan içerik çeşitliliğini artırmak.

Ana oyuncu hissi: *Day 8 sonrası şehir daha çeşitli olaylar üretmeye başlıyor ama rapor, harita, Ece ve mahalle yüzeyleri kalabalıklaşmıyor.*

## 2. What changed

- `ContentRuntimeActivationMode` genişletildi: `limited_full`
- `contentRuntimeActivationFullGuards.ts` — planning guard’larının runtime bağlantısı
- `contentRuntimeActivationFullImplementationConstants.ts` — cap ve chip sabitleri
- Selector pool Day 8+ full için `social_trust_pack_one` ve sınırlı `crisis_adjacent_pack_one` içerir
- Integration guard özet alanları döner: `capSummary`, `districtBalanceSummary`, `archiveWriteEligibility`, `storyTriggerEligibility`, `surfaceDensitySummary`
- Mapper `content_runtime_activation_limited_full` source desteği
- Verify: `verify:content-runtime-activation-full-implementation`

## 3. Activation mode

| Gün / erişim | Mode |
|---|---|
| Day 1–7 | `off` |
| Day 8+ light (`limited`) | `lite` |
| Day 8+ full (`main_operation_full` + `full`) | `limited_full` |

## 4. Pack groups enabled/limited/blocked

**Açık (ready):** District, Vehicle & Route, Container & Environment, Social & Public Trust, Reward/Comeback varyantları

**Sınırlı:** Personnel & Morale (domain bazlı, max 1 pencere), Operation Follow-up (Day 8+, aktif ana operasyon), Crisis-adjacent (max 1/gün, düşük skor)

**Kapalı:** Seasonal/live ops, Remote config, AI, admin/editor, yeni ekonomi reward events

## 5. Day/access caps

| Durum | pack-origin | archive | story trigger |
|---|---|---|---|
| Day 1 | 0 | 0 | 0 |
| Day 2–7 | 0 | 0 | 0 |
| Day 8+ light | 1 | 1 | 1 |
| Day 8+ limited_full | 2 | 2 | 1 |

Future Day 10+ max 3 planlandı; Aşama 1’de max 2 kalır.

## 6. District balance implementation

- 2 günlük pencerede aynı mahalle max 2 pack-origin
- Aynı gün aynı mahalle+domain engeli
- Aktif story chain mahallesinde closure/recovery tercihi
- Sanayi/İstasyon overload guard
- Yeşilvadi çevre tekrar guard
- Underused district hafif öncelik (forced değil)

## 7. Freshness duplicate implementation

- Event family cooldown (önceki family ID)
- Copy semantic cluster aynı gün limiti
- District+domain aynı gün yok
- Selected event ID benzersiz
- Deterministic `stableContentRuntimeHash` (Math.random yok)

## 8. Archive spam guard

- `archiveWriteEligibility` — light max 1, limited_full max 2
- Raw pack metadata saklanmaz
- Player-facing copy’de pack/runtime/metadata görünmez

## 9. Story chain trigger guard

- `evaluateStoryChainPackRisk` runtime selector’a bağlı
- Day 8+ limited_full max 1 pack-origin start/gün
- Reward/comeback pressure chain başlatmaz
- Crisis-adjacent chain spam yapmaz

## 10. Surface density guard

- Report pack continuity max 1
- Hub pack line max 1
- Map journal trace story/comeback altında
- Social enrichment max 1, mention count artmaz

## 11. PostPilotEventEngine integration

Mevcut `augmentPostPilotDailySetWithContentActivation` mimarisi korunur; `buildContentActivationInput` değişmedi. Mode accessMode + postPilotPhase üzerinden çözülür.

## 12. Presentation/copy guard

İzinli chip’ler: Mahalle izi, Rota dengesi, Konteyner çevresi, Sosyal güven, Toparlanma fırsatı, Operasyon takibi

Yasak: pack, metadata, runtime, full activation, limited_full, AI, premium, kilitli

## 13. Non-goals

- Pilot Day 1–7 full activation
- SAVE_VERSION artırma (24)
- persist / migration / applyDecision / dayPipeline rewrite
- Remote Config / Live-Ops / AI
- Manual launch blocker değişikliği
- Fake PASS

## 14. Verify sonucu

`npm run verify:content-runtime-activation-full-implementation` — implementasyon sonrası çalıştırılır.

## 15. Sonraki prompt

> Content Pack Activation Full Implementation Aşama 2: Day 10+ max 3 pack-origin, personnel_morale pack group genişletme, City Archive day-close pack-origin yazım hook’u ve surface resolver’lara tam bağlantı.

## 16. Commands

```bash
npm run typecheck
npm run verify:content-runtime-activation-full-implementation
npm run verify:content-runtime-activation-full-planning
npm run verify:content-runtime-activation
```
