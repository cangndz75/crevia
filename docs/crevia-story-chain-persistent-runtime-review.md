# Crevia Story Chain Persistent Runtime Review

## Amaç

Mini Story Chain sisteminin kalıcı runtime'a taşınıp taşınmaması gerektiğini review-only değerlendirir. Bu belge persist eklemez, SAVE_VERSION artırmaz, event generation'a bağlanmaz ve runtime gameplay davranışını değiştirmez.

## Mevcut durum

- Mini Story Chain System Aşama 1 tamamlandı.
- Story Chain Runtime Hint Binding Aşama 1 tamamlandı.
- 8 template, 8 kind, resolver + presentation helper'ları mevcut.
- Hub/Map/Result/Report yüzeylerinde max 1 story_chain hint line.
- Advisor helper-only binding mevcut.
- `isRuntimeLinked: false` — hints presentation-only.
- Persist yok. SAVE_VERSION 23.
- No-New-System Freeze aktif.
- Real post-launch telemetry yok.

## Presentation-only hint modeli

Story chain sistemi **persistent runtime değildir**. Hint'ler mevcut state'ten derived/presentation-only üretilir:

1. `buildStoryChainRuntimeHintModel` trust/memory/carry-over/operation signals snapshot'larından okur.
2. Hub/Map/Result/Report yüzeylerinde max 1 satır; Advisor helper-only.
3. Duplicate suppression carry-over, memory ve mevcut echo satırlarına karşı aktif.
4. Persist shape'e yazılmaz.
5. App restart sonrası aktif chain state korunmaz.

### Gün bazlı visibility

| Gün | Visibility | Not |
|-----|------------|-----|
| Day 1 | hidden | `STORY_CHAIN_TUTORIAL_MAX_DAY = 1` |
| Day 2-3 | subtle / hidden | Carry-over veya memory sinyali varsa subtle |
| Day 4-7 | compact | Sabit |
| Day 8+ | detailed / standard | Post-pilot veya `day >= 8` → detailed |

## Soft launch için neden yeterli

1. Chain sistemi yalnızca **"hissedilen bağlam"** sağlar; gameplay kararını bloklamaz.
2. No-New-System Freeze aktif; persist shape değişikliği yasak.
3. Real post-launch telemetry yok; persist kararı veri sonrası alınmalı.
4. Content pack runtime activation henüz yapılmadı; full continuation sınırlı.
5. Restart continuity kaybı küçük etkili; hint'ler yeniden derived edilebilir.

## Persistence seçenekleri

| Option | Açıklama | SAVE bump | Migration | Önerilen |
|--------|----------|-----------|-----------|----------|
| **A. Presentation-only derived hints** | Mevcut model — persist yok | Hayır | Hayır | Soft launch |
| **B. Persist active chain summary** | kind, districtId, stepIndex, startedDay, expiresDay | Evet | Evet (orta) | V1.1 adayı |
| **C. Persist chain event history window** | Son N gün exposure geçmişi | Evet | Evet (yüksek) | V1.1 sonrası / V2 |
| **D. Full story chain runtime engine** | Event selection + content pack derin entegrasyon | Evet | Evet (yüksek) | V2 backlog |

## Save/migration riski

### Olası future persist alanları (dokümantasyon only — uygulanmadı)

- `activeStoryChains`
- `completedStoryChainIds`
- `storyChainExposureWindow`
- `storyChainLastResolvedDay`
- `storyChainContinuationSeed`

**Kural:** Bu patch'te hiçbiri `gamePersist`'e eklenmedi. SAVE_VERSION değişmedi. `useGameStore` shape değişmedi.

### Riskler

- **[WARNING]** Restart continuity zayıf — aktif chain state korunmaz.
- **[WARNING]** Report/result chain echo restart sonrası değişebilir.
- **[WARNING]** Story chain telemetry event coverage opsiyonel gap.
- **[WARNING]** V1.1 migration planı gerekli.
- **[WARNING]** Content pack activation olmadan full chain continuation sınırlı.
- **[BLOCKER]** Bu patch persist eklerse, SAVE_VERSION artırırsa veya event generation'a bağlarsa.

## Telemetry karar soruları

1. Oyuncular story chain hint görüyor mu?
2. Story chain hint görülen oyuncular report'a devam ediyor mu?
3. Result systems echo içinde story chain line faydalı mı?
4. Hub story chain focus line retention etkiliyor mu?
5. Map chain trace line map engagement artırıyor mu?
6. Day 2-3 subtle hint görünürlüğü yeterli mi?
7. Day 8+ detailed hint açık uçlu operasyon hissi veriyor mu?
8. Restart sonrası chain continuity kaybı fark ediliyor mu?
9. Duplicate suppression fazla agresif mi?
10. Persistent runtime gerekli mi, derived hint yeterli mi?
11. Chain hints Day 1 drop-off riskini artırıyor mu?
12. Hangi chain kind'lar daha çok kullanılmalı?

## V1.1 önerisi

- **Soft launch öncesi story chain persist ekleme.**
- Soft launch boyunca current derived hint sistemi korunmalı.
- V1.1'de telemetry sonrası **Option B: persist active chain summary** değerlendirilmeli.
- Content Pack Runtime Activation ve Event Selection Runtime Pack Activation kararından **önce** full story chain runtime yapılmamalı.
- Full story chain runtime engine **V2 backlog**'a taşınmalı.

## V2 full runtime notu

Option D (Full story chain runtime engine) event selection, content pack activation, freshness guard ve district memory ile derin entegrasyon gerektirir. Soft launch öncesi yasak. Content Pack Runtime Activation kararından önce yapılmamalı.

## Yapılmayanlar

- Persist ekleme
- SAVE_VERSION artırma
- useGameStore / gamePersist shape değiştirme
- Event generation değiştirme
- applyDecision / dayPipeline değiştirme
- Story chain resolver runtime behavior değiştirme
- UI component ekleme
- Analytics event ekleme
- Runtime activation
- No-New-System Freeze forbidden scope ihlali

## Freeze uyumu

- Persist eklenmedi: ✓
- SAVE_VERSION değişmedi (23): ✓
- Runtime activation yapılmadı: ✓
- Event generation değişmedi: ✓
- applyDecision/dayPipeline değişmedi: ✓
- UI component eklenmedi: ✓
- Review-only yapıldı: ✓
- V1.1 backlog üretildi: ✓
