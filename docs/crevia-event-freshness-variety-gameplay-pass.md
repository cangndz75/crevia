# Crevia — Event Freshness & Variety Gameplay Pass

## Amaç

Event variety sistemini yalnızca başlık/metin/family çeşitliliğinden çıkarıp, oyuncuya **farklı karar baskısı** yaratan gameplay variety seviyesine taşımak.

- **Decision Consequence Depth Pass:** “Dünkü karar bugünü nasıl etkiledi?”
- **Bu pass:** “Bugünkü event neden diğerlerinden farklı oynanıyor?”

## Content variety vs gameplay variety

| Boyut | Content variety (mevcut) | Gameplay variety (bu pass) |
| ----- | ------------------------ | --------------------------- |
| Ölçüm | Title, profile, category, mahalle | decisionShape, primaryPressure, domain |
| Kaynak | eventVariationEngine, freshness guard | EventGameplayVarietyProfile |
| Oyuncu hissi | Farklı hikâye | Farklı düşünme biçimi |
| Persist | Pilot content memory | **Persist edilmez** — presentation-time |

## Mevcut event variety zinciri

| Aşama | Dosya/model | Ne yapıyor? | Variety katkısı | Eksik |
| ----- | ----------- | ----------- | --------------- | ----- |
| Pilot event generation | `generateDailyEventSet`, `ensureDailyEventsForDay` | Gün 1–7 slot + ağırlık + enrich | Kategori/mahalle/title çeşitliliği | Gameplay pressure bağlı değil |
| Post-pilot generation | `postPilotEventEngine` | Gün 8+ anchor/side şablon | 2 event/gün ritim | Aynı inspect→plan→dispatch şekli |
| Content activation | `contentRuntimeActivation*` | Pack family seçimi | Domain pack çeşitliliği | Oyuncuya pressure olarak görünmezdi |
| Event family variant | `eventFamilyVariantModel` | Family/variant imzası | Pack seçim skoru | Pilot runtime seçimine bağlı değil |
| Freshness guard | `eventFreshnessGuard` | Family/domain/title tekrarı | İçerik tekrarı azalır | decisionShape tekrarı ölçülmezdi |
| Domain/category selection | `eventVariationEngine`, rhythm | Kategori/mahalle filtresi | İçerik dağılımı | Karar şekli farklılaşmıyordu |
| Operation inspect | `eventInspectPhasePresentation` | Heuristic bulgular | Domain bulguları | Pressure copy zayıftı |
| Operation plan | `eventPlanPhasePresentation` | 3 sabit strateji şablonu | Recommended heuristic | Domain pressure tonu yoktu |
| Dispatch/field pressure | `eventDispatch/FieldPhasePresentation` | Uyum/rota metinleri | Plan özeti | Pressure hint yoktu |

**Sonuç:** Eventler çoğunlukla farklı metinle aynı decision loop hissi veriyordu; gameplay pressure modeli bu pass ile presentation katmanına bağlandı.

## EventGameplayVarietyProfile modeli

Dosyalar:

- `src/core/eventVariety/eventGameplayVarietyTypes.ts`
- `src/core/eventVariety/eventGameplayVarietyModel.ts`
- `src/core/eventVariety/eventGameplayVarietyPresentation.ts`

```ts
type EventGameplayVarietyProfile = {
  eventId: string;
  domain: EventGameplayPressureDomain;
  primaryPressure: EventGameplayPressureKind;
  secondaryPressures: EventGameplayPressureKind[];
  strategyBias: EventGameplayStrategyBias;
  decisionShape: EventGameplayDecisionShape;
  freshnessScore: number; // 0–100
  repetitionRisk: 'low' | 'medium' | 'high';
  playerFacingLine: string;
  planHintLine?: string;
  dispatchHintLine?: string;
  fieldHintLine?: string;
  sourceLabel: string;
  sourceIds: string[];
};
```

Persist edilmez. `EventCard`, `contentPackMeta`, `inferEventDomainUiFocus`, gerçek maliyet/sosyal sinyallerinden türetilir.

## Domain-specific pressure kuralları

| Domain | Primary pressure | Decision shape | Oyuncu hissi |
| ------ | ---------------- | -------------- | ------------ |
| transport | route_pressure / time_pressure | fast_vs_costly, coverage_vs_depth | Süre önemli; hız kaynak baskısı yaratır |
| environment | resource_pressure / container_network_pressure | repair_vs_prevent, short_term_vs_long_term | Bugün temizle vs kalıcı ağ |
| social | social_sensitivity / district_trust_pressure | social_vs_resource, safe_vs_risky | Hızlı yatıştır vs güven inşa et |
| logistics | resource_pressure / route_pressure | coverage_vs_depth | Her yere yetiş vs derin müdahale |
| maintenance | vehicle_maintenance_pressure / team_fatigue_pressure | repair_vs_prevent, short_term_vs_long_term | Aracı zorla vs bakım penceresi |
| container | container_network_pressure / district_trust_pressure | repair_vs_prevent | Tek nokta vs ağ dengesi |
| general | calm_standard | standard | Standart operasyon |

## Decision shape açıklamaları

- **fast_vs_costly** — Hızlı müdahale kaynak/araç maliyeti
- **social_vs_resource** — Sosyal tepki ile kaynak dengesi
- **short_term_vs_long_term** — Bugünkü rahatlama vs yarın riski
- **safe_vs_risky** — Güvenli plan vs riskli hız
- **repair_vs_prevent** — Onarım vs önleme
- **coverage_vs_depth** — Geniş kapsam vs odaklı müdahale
- **standard** — Düşük baskı / öğrenme günü

## Repetition risk (analyze seviyesi)

Son N event içinde:

- Aynı `decisionShape` tekrarı → risk artar
- Üst üste aynı `primaryPressure` → risk artar
- Aynı domain farklı pressure → risk düşer
- Seçim algoritması büyük değiştirilmedi; önce ölçüm, sonra presentation hint

## Day 8+ gameplay variety analizi

`MAX_POST_PILOT_ACTIVE_EVENTS = 2` light loop’ta anchor + side event profilleri `verify:event-gameplay-variety` ve `analyze:event-gameplay-variety` ile ölçülür.

| Senaryo | Event 1 pressure | Event 2 pressure | Aynı shape riski | Not |
| ------- | ---------------- | ---------------- | ---------------- | --- |
| day_8_light_loop | verify çıktısı | verify çıktısı | low–medium | Farklı domain hedeflenir |
| day_9_light_loop | verify çıktısı | verify çıktısı | medium olabilir | Şablon rotasyonu |
| day_10_light_loop | verify çıktısı | verify çıktısı | ölçülür | Day 10+ yeni pressure çeşitliliği gerekebilir |

## Inspect / Plan / Dispatch / Field bağlantıları

- **Inspect:** Variety profile bulgu skorunu artırır ve domain copy zenginleştirir (max 3 bulgu korunur)
- **Plan:** Strateji `description` ve `expectedImpact` tonları domain pressure ile farklılaşır; `resolveRecommendedPlanStrategyId` değişmedi
- **Dispatch:** Rota `estimatedLabel` ve uyum reason’larına hafif hint (max 3)
- **Field:** Timeline helper ve Ece yorumunda sosyal/konteyner pressure hint

## Analyzer / verify kapsamı

| Komut | Rol |
| ----- | --- |
| `npm run analyze:event-variety` | Mevcut içerik variety + gameplay probe |
| `npm run analyze:event-gameplay-variety` | decisionShape / primaryPressure dağılımı, Day 8+ |
| `npm run verify:event-gameplay-variety` | Model güvenliği + faz audit + nested operation verify |

Kontroller: ≥4 decisionShape, ≥5 pressure kind (6 senaryo), Day 8+ çeşitlilik, fake urgent yok.

## Guard’lar (dokunulmadı)

- `applyDecision` — değişmedi
- `decisionConsequenceThread*` — değişmedi
- Result/consequence thread presentation — değişmedi
- `SAVE_VERSION` — değişmedi
- `gamePersist` / `useGameStore` persist shape — değişmedi
- Plan strateji balance algoritması (`resolveRecommendedPlanStrategyId`) — değişmedi

## Sonraki prompt: Meaningful Authority Gameplay Pass

Kalan noktalar:

- Post-pilot selection skoruna gameplay pressure hint (güvenli, küçük)
- Authority/trust kararlarının operasyon fazlarında daha görünür baskısı
- Day 10+ için ek pressure kind çeşitliliği
- Pack activation → gameplay pressure görünürlüğü artırma (content zaten var)
