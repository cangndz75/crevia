# Crevia District Operation Action Persistence Review — Aşama 1

## Amaç

District Operation Actions sisteminin ileride kalıcı hale getirilmesi gerekip gerekmediğini **review-only** değerlendirmek.

Bu patch:
- Persist **eklemez**
- SAVE_VERSION **artırmaz**
- district operation action state'i kalıcı hale **getirmez**
- Runtime gameplay davranışını **değiştirmez**

No-New-System Freeze aktiftir. Bu katman yalnızca mevcut session-only modelin yeterliliğini, V1.1 persistence ihtiyacını, migration riskini, save shape etkisini ve telemetry sonrası karar kriterlerini dokümante eder.

## Mevcut durum

| Alan | Durum |
|------|-------|
| Action state | Session-only (`useGameStore.districtOperationActionState`) |
| Persist shape | `districtOperationActionState` yazılmıyor |
| SAVE_VERSION | 23 (değişmedi) |
| Görünürlük | Day 1 hidden, Day 2-3 preview-only, Day 4+ selectable |
| UI bağlantısı | Hub / Map / Report küçük action echo |
| Günlük kural | Max 1 action / gün |
| Telemetry | Real user telemetry yok |

**Özet:** Action state şu an session-only. Persist shape'e yazılmıyor. App restart sonrası selected action kaybolabilir veya derived fallback'e dönebilir. Bu soft launch için kabul edilebilir olabilir çünkü action küçük etkili ve optional. Kalıcı persistence V1.1'de telemetry sonrası değerlendirilmeli.

## Session-only neden seçildi

1. **No-New-System Freeze** — `persist_shape_change` ve `save_version_bump` yasak.
2. **Küçük etki** — `applyDistrictOperationActionEffects` sınırlı operationSignals delta üretir; blocking değil.
3. **Telemetry yok** — Persist ihtiyacı veri olmadan spekülatif kalır.
4. **Migration maliyeti** — Soft launch öncesi gereksiz risk.

## Soft launch için risk

### Blocker (mevcut modelde olmamalı)

- Session-only model crash yaratıyorsa
- Daily max 1 action kuralı bozuluyorsa
- Action effect idempotent değilse
- Persistence review yanlışlıkla SAVE_VERSION değiştiriyorsa

### Warning (kabul edilebilir)

- Restart continuity zayıf
- Report echo app restart sonrası eksilebilir
- Telemetry action selection continuity zayıf
- V1.1 migration planı gerekli

## Persistence seçenekleri

### A. Keep session-only (mevcut — soft launch önerisi)

- Migration yok, düşük risk
- Restart continuity zayıf
- No-New-System Freeze uyumlu

### B. Persist daily selected action summary (V1.1 adayı)

- SAVE_VERSION bump gerekir
- Migration gerekir (`normalizePersistedSave`)
- Report/tomorrow continuity güçlenir
- Orta migration karmaşıklığı, düşük balance riski

### C. Persist action history window (V2 backlog)

- Zengin memory/telemetry potansiyeli
- Yüksek migration ve balance riski
- Save boyutu artışı

## Migration riski

| Seçenek | SAVE bump | Migration | Karmaşıklık | Balance risk |
|---------|-----------|-----------|-------------|--------------|
| A session-only | Hayır | Hayır | none | none |
| B daily summary | Evet | Evet | medium | low |
| C history window | Evet | Evet | high | high |

## Telemetry karar soruları

Post-launch için şu sorular üretilir:

1. Oyuncular district operation action görüyor mu?
2. Day 4+ action seçiliyor mu?
3. Action seçen oyuncular Day 5/6 devam ediyor mu?
4. Report'ta action summary işe yarıyor mu?
5. App restart sonrası oyuncu continuity kaybı yaşıyor mu?
6. Action selected ama report'a ulaşmadan çıkış oranı yüksek mi?
7. District action ile map engagement artıyor mu?
8. Persist gerekli mi yoksa session-only yeterli mi?

## V1.1 önerisi

- **Soft launch öncesi persist ekleme.**
- V1.1'de telemetry sonrası **"persist daily selected action summary"** (Option B) değerlendir.
- SAVE_VERSION bump gerekiyorsa **ayrı migration patch** tasarla.
- Action history window (Option C) **V1.1 sonrası veya V2 backlog**'a kalsın.

### V1.1 backlog

- Persist daily selected action summary — tasarım
- SAVE_VERSION migration patch (ayrı)
- Restart continuity telemetry analizi
- Report echo effectiveness ölçümü
- Map action engagement ölçümü
- Action history window (V2 backlog)

## No-New-System Freeze uyumu

Bu review doğrular:

- Persist eklenmedi
- SAVE_VERSION değişmedi
- Store persist shape değişmedi
- Action behavior değişmedi
- Review-only yapıldı
- V1.1 backlog üretildi

## Soft launch review entegrasyonu

`verify:soft-launch-review` district runtime alanında şu finding'leri okur:

- `district_action.persistence_review_present`
- `district_action.session_only_current`
- `district_action.persist_not_required_for_soft_launch`
- `district_action.v11_persistence_backlog_defined`
- `district_action.save_version_unchanged`

## Yapılmayanlar

- Persist ekleme
- SAVE_VERSION artırma
- `useGameStore` action behavior değiştirme
- `dayPipeline` değiştirme
- `operationSignals` effect değiştirme
- UI component ekleme
- Event generation değiştirme
- Analytics event ekleme
- Runtime gameplay değiştirme

## Verify

```bash
npm run verify:district-operation-action-persistence-review
```

İlgili dosyalar:

- `src/core/districtOperationActions/districtOperationActionPersistenceReviewTypes.ts`
- `src/core/districtOperationActions/districtOperationActionPersistenceReviewAudit.ts`
- `src/core/districtOperationActions/districtOperationActionPersistenceReviewPresentation.ts`
- `src/core/districtOperationActions/verifyDistrictOperationActionPersistenceReviewScenario.ts`
- `scripts/verify-district-operation-action-persistence-review.ts`
