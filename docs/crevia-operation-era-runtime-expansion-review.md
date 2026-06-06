# Crevia Operation Era Runtime Expansion Review

## Amaç

Operation Era Runtime-lite Preview sisteminin gerçek runtime expansion'a taşınıp taşınmaması gerektiğini review-only değerlendirir. Bu belge persist eklemez, SAVE_VERSION artırmaz, event generation'a bağlanmaz, content pack activation yapmaz ve runtime gameplay davranışını değiştirmez.

## Mevcut durum

- Operation Era Runtime-lite Preview Aşama 1 tamamlandı.
- 8 preview kind mevcut:
  - `route_efficiency_era`
  - `container_recovery_era`
  - `social_trust_era`
  - `crisis_prevention_era`
  - `district_development_era`
  - `resource_balance_era`
  - `visible_service_era`
  - `open_operation_career_era`
- Hub / Report / Profile Day 8+ operation era line bağlı.
- Map için helper-only binding (`buildOperationEraMapLine`).
- `isRuntimeLinked: false` — preview presentation/context layer.
- Content Pack Runtime Activation Review tamamlandı; activation V1.1 backlog.
- Story Chain Persistent Runtime Review tamamlandı; persistence V1.1/V2 backlog.
- District Operation Actions Persistence Review tamamlandı; persist yok.
- Post-launch Telemetry Readiness tamamlandı.
- No-New-System Freeze aktif.
- SAVE_VERSION 23.

## Runtime-lite preview modeli

Operation era sistemi **şu an gerçek runtime era değildir**. Preview modeli deterministic presentation/context layer olarak çalışır:

1. `buildOperationEraRuntimePreviewModel` operation signals, crisis state, post-pilot flags ve district context'ten derived era kind üretir.
2. Hub/Report/Profile yüzeylerinde compact/standard/detailed line builders bağlı.
3. Map helper-only (`buildOperationEraMapLine`); full map render binding yok.
4. `buildOperationEraSelectionContextHint`, `buildOperationEraVariantBias`, `buildOperationEraStoryChainBias` helper-only; event generation değişmez.
5. Persist shape'e yazılmaz.
6. App restart sonrası aktif era state korunmaz.

### Gün bazlı visibility

| Gün | Visibility | Not |
|-----|------------|-----|
| Day 1-7 | hidden | `OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY = 7` |
| Day 8+ limited | compact | Post-pilot limited mode |
| Day 8+ full | standard / detailed | Post-pilot full mode |

## Soft launch için neden yeterli

1. Operation era yalnızca **açık uçlu operasyon hissi** sağlar; gameplay kararını bloklamaz.
2. No-New-System Freeze aktif; persist shape ve event selection değişikliği yasak.
3. Real post-launch telemetry yok; expansion kararı veri sonrası alınmalı.
4. Content pack runtime activation henüz yapılmadı; era depth metadata ile sınırlı.
5. Restart continuity kaybı küçük etkili; preview yeniden derived edilebilir.
6. Map helper-only olduğu için map density riski düşük.

## Expansion seçenekleri

| Option | Açıklama | SAVE bump | Migration | Önerilen |
|--------|----------|-----------|-----------|----------|
| **A. Keep runtime-lite preview** | Mevcut model — persist yok, helper-only | Hayır | Hayır | Soft launch |
| **B. Persist current operation era summary** | currentEraKind, startedDay, focusDistricts, activeDomains | Evet | Evet (orta) | V1.1 adayı |
| **C. Runtime era weighting for event selection** | Event selection runtime davranışını etkiler | Evet | Evet (yüksek) | V1.1 sonrası |
| **D. Full operation era season/runtime engine** | Event generation, content packs, story chains derin entegrasyon | Evet | Evet (yüksek) | V2 backlog |

## Save/migration riski

### Olası future persist alanları (dokümantasyon only — uygulanmadı)

- `activeOperationEra`
- `operationEraStartedDay`
- `operationEraFocusDistrictIds`
- `operationEraFocusDomains`
- `operationEraExposureWindow`
- `operationEraProgressSummary`
- `operationEraLastResolvedDay`

**Kural:** Bu patch'te hiçbiri `gamePersist`'e eklenmedi. SAVE_VERSION değişmedi. `useGameStore` shape değişmedi.

### Riskler

- **[WARNING]** Operation era gerçek runtime değil — presentation/context layer only.
- **[WARNING]** Restart continuity yok — aktif era state korunmaz.
- **[WARNING]** Content pack activation olmadan era depth sınırlı.
- **[WARNING]** Story chain persistence olmadan era continuity sınırlı.
- **[WARNING]** Map helper-only olduğu için map görünürlüğü sınırlı.
- **[WARNING]** Telemetry event coverage bazı era-specific noktalar için proxy olabilir.
- **[WARNING]** V1.1 migration planı gerekli.
- **[BLOCKER]** Bu patch persist eklerse, SAVE_VERSION artırırsa, event generation/selection değiştirirse veya runtime activation yaparsa.

## Content pack / story chain / event selection dependency

- **Content pack:** `relatedContentPacks` metadata 8 kind'da mevcut; runtime activation V1.1 backlog. Option C öncesi Content Pack Runtime Activation gerekir.
- **Story chain:** `buildOperationEraStoryChainBias` helper-only; Story Chain Persistent Runtime Review persistence'i V1.1/V2 backlog'a taşıdı.
- **Event selection:** `buildOperationEraSelectionContextHint` hint-only; `ensureDailyEvents` / selection pipeline değişmedi.
- **Variant bias:** `buildOperationEraVariantBias` helper-only; variant resolver değişmedi.
- **District operation actions:** session-only; era optional action state okur, persist coupling yok.

## Telemetry karar soruları

1. Oyuncular Day 8+ operation era line görüyor mu?
2. Hub operation era line olan oyuncular daha fazla gün tamamlıyor mu?
3. Report operation era line okunuyor mu?
4. Profile career showcase içinde era chip uzun vadeli hedef hissi veriyor mu?
5. Map'te operation era helper render edilmeli mi?
6. Hangi era kind daha çok engagement yaratıyor?
7. Open operation career fallback yeterli mi?
8. Crisis prevention era calm wording doğru mu?
9. Resource balance era oyuncuda ceza hissi yaratıyor mu?
10. Operation era, story chain hint ile duplicate oluyor mu?
11. Operation era runtime event weighting gerekli mi?
12. Persisted current era summary gerekli mi?
13. Day 8+ retention düşükse era expansion çözüm mü?
14. IAP full mode ile era visibility ilişkisi conversion'a etki ediyor mu?

## V1.1 önerisi

- Soft launch öncesi operation era runtime expansion yapma.
- Mevcut runtime-lite preview sistemi korunmalı.
- V1.1'de telemetry sonrası **Option B: persist current operation era summary** değerlendirilmeli.
- Content Pack Runtime Activation ve Event Selection Runtime Pack Activation olmadan **Option C yapılmamalı**.
- Full operation era season/runtime engine **V2 backlog**'a taşınmalı.
- Map render binding, density telemetry veya real device playtest sonrası ayrıca değerlendirilmeli.

## V1.1 backlog

| ID | Priority | Title |
|----|----------|-------|
| v11.persist_era_summary_design | high | Persist current operation era summary — tasarım |
| v11.save_version_migration_patch | high | SAVE_VERSION migration patch (ayrı) |
| v11.era_visibility_telemetry | high | Day 8+ era visibility telemetry analizi |
| v11.content_pack_prerequisite | medium | Content pack activation öncesi era weighting bekle |
| v11.map_render_playtest | medium | Map helper render playtest değerlendirmesi |
| v11.era_event_weighting_backlog | low | Runtime era event weighting (V1.1 sonrası) |
| v11.full_era_engine_v2 | low | Full operation era season engine (V2 backlog) |

## V2 full runtime notu

Option D (Full operation era season/runtime engine) event generation, content packs, story chains, district memory, rewards ve season goals ile derin entegrasyon gerektirir. Yüksek risk; soft launch öncesi yasak; V2 backlog.

## Yapılmayanlar

- Persist ekleme
- SAVE_VERSION artırma
- useGameStore / gamePersist shape değiştirme
- Event generation değiştirme
- Event selection behavior değiştirme
- Variant resolver değiştirme
- applyDecision / dayPipeline değiştirme
- Operation era runtime behavior değiştirme
- UI component ekleme
- Analytics event ekleme
- Content pack activation

## No-New-System Freeze uyumu

- Persist eklenmedi.
- SAVE_VERSION değişmedi (23).
- Runtime activation yapılmadı.
- Event generation / selection değişmedi.
- applyDecision / dayPipeline değişmedi.
- UI component eklenmedi.
- Review-only yapıldı.
- V1.1/V2 backlog üretildi.

## Verify

```bash
npm run verify:operation-era-runtime-expansion-review
npm run verify:operation-era-runtime-preview
npm run verify:operation-era
npm run verify:no-new-system-freeze
npm run verify:soft-launch-review
```
