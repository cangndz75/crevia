# Crevia Event Family Selection Engine — Aşama 2

Bu doküman, Content Production Pipeline MVP Aşama 1 üzerine kurulan **Event Family Selection Engine** foundation katmanını açıklar. Bu patch mevcut runtime event generation’ı değiştirmez; deterministic weighted selection, verify senaryoları ve runtime-lite adapter hint’leri sağlar.

## Neden full event generation rewrite yapılmadı?

- `ensureDailyEventsForDay` ve mevcut pilot event kataloğu oyuncu save’lerinde kanıtlanmış bir yol izliyor.
- SAVE_VERSION 23 ve persist shape korunmalı; büyük generation rewrite kırıcı risk taşır.
- Selection engine önce **adapter/foundation** olarak doğrulanır; runtime entegrasyonu kontrollü ve geriye uyumlu ilerler.
- Content Production verify pack production content değildir; engine testleri için foundation fixture olarak kullanılır.

## Selection engine neyi çözüyor?

- Gün, district, career phase, trust, resource pressure, operation era ve recent exposure sinyallerinden **weighted candidate scoring**
- `event_family`, `district_operation_hint`, `operation_era_context` kaynaklarının **ayrı candidate kind** ile karıştırılmaması
- Content echo completeness, duplicate guard ve forbidden copy risklerinin skora yansıması
- Repeat/freshness guard ile aynı family/district/domain tekrarlarının cezalandırılması
- Variant recommendation (sadece öneri; runtime variant adapter değil)
- Debug/verify için okunabilir weight breakdown ve summary satırları

## Candidate scoring nasıl çalışıyor?

Her candidate `CONTENT_PRODUCTION_VERIFY_PACK` (veya gelecekteki content pack builder çıktısı) item’larından türetilir.

| Sinyal | Ağırlık (yaklaşık) |
|--------|-------------------|
| district relevance | +14 |
| domain relevance | +12 |
| operation phase relevance | +8 |
| rank unlock relevance | +8 |
| operation era relevance | +10 |
| resource pressure relevance | +10 |
| district trust relevance | +8 |
| crisis relevance | +8 |
| player style relevance | +6 |
| echo completeness bonus | +8 (pass) / +4 (warn) |
| content quality bonus | +6 |
| mobile readiness bonus | +4 |
| freshness family penalty | −18 |
| freshness district penalty | −10 |
| freshness domain penalty | −8 |
| duplicate penalty | −15 (yüksek) / −7.5 (orta) |

Skor 0–100 aralığında clamp edilir. Sıralama skor azalan; eşitlikte `stableHash(day|district|candidateId|score)` ile deterministic tie-break uygulanır. **Math.random kullanılmaz.**

Primary seçim yalnızca `kind === 'event_family'` ve `isSelectablePrimary === true` olan adaylardan yapılır.

## Freshness / repeat guard nasıl çalışıyor?

- `recentEventFamilyIds` içindeki family → freshness family penalty
- Aynı district son günlerde 2+ kez → district penalty
- Aynı domain son günlerde 2+ kez → domain penalty
- Yüksek content similarity (duplicate guard) → duplicate penalty
- Forbidden player-facing copy → candidate blocked (skor 0, seçilemez)
- Gün 1 tutorial context → heavy/complex candidate’lar seçilmez (ek penalty + select filter)

## Content Production Pipeline ile bağlantı

- Candidate kaynağı: `CONTENT_PRODUCTION_VERIFY_PACK` (`isRuntimeLinked: false`)
- `evaluateEchoCompleteness` → echo bonus
- `compareContentItemSimilarity` → duplicate penalty
- `contentProductionCopyContainsForbiddenTerms` → block
- `operation_era` item’ları primary event değil; weight hint veya era context olarak kalır
- `district_operation` item’ları operation hint olarak işaretlenir

## Variant recommendation neden sadece öneri?

Bu patch **Event Variant Runtime Adapter değildir**. Runtime event card shape ve variant uygulaması değişmez. Engine yalnızca `recommendedVariantKind` döner:

| Context | Öneri |
|---------|-------|
| düşük trust | comeback / district_trust |
| yüksek trust + iyi kaynak | reward / improved |
| yüksek kriz riski | crisis_adjacent (panik dili yok) |
| resource fatigue | resource_fatigue |
| recent unresolved | carry_over |
| operation era aktif | operation_era |

## Runtime-lite adapter

- `buildEventSelectionRecommendationForDay(gameState, extras?)`
- `buildEventSelectionRecommendationForDistrict(districtId, context?)`
- `buildEventSelectionDebugReport(result)`

Tüm adapter çıktıları `isRuntimeHintOnly: true` taşır. Mevcut generation’a bağlanacaksa yalnızca optional hint olarak kullanılmalıdır.

## Sonraki patch sırası

1. Event Variant Runtime Adapter Aşama 1
2. Event Family Repeat & Freshness Runtime Guard
3. District Trust Runtime-lite Integration
4. Content Pack Authoring Aşama 2

## Kısıtlar (bu patch)

- SAVE_VERSION artırılmadı (23)
- Persist shape değişmedi
- `ensureDailyEventsForDay` rewrite yapılmadı
- Existing event card output shape korundu
- UI redesign / yeni ekran yok
- IAP / analytics event adları değişmedi
