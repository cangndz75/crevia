# Crevia Content Pack Runtime Activation Review

## Amaç

Mevcut content pack havuzunun runtime activation için ne kadar hazır olduğunu review-only olarak değerlendirir. Bu belge hiçbir content pack'i runtime event generation'a bağlamaz. Event selection davranışı değişmez. Runtime activation yapılmaz.

## Mevcut pack havuzu

| Pack | Açıklama |
|------|----------|
| district_pack_one | Bölge bazlı event family'leri — Merkez, Cumhuriyet, Sanayi, İstasyon, Yeşilvadi |
| vehicle_route_pack_one | Araç/rota bazlı event family'leri |
| container_environment_pack_one | Konteyner/ortam event family'leri |
| social_trust_pack_one | Sosyal güven event family'leri |
| crisis_adjacent_pack_one | Kriz komşuluğu event family'leri |

## Soft launch öncesi neden activation yok?

1. **No-New-System Freeze aktif.** Freeze, yeni content pack eklenmesini, runtime activation yapılmasını ve event generation değiştirilmesini yasaklar.
2. **Soft launch riski.** Runtime activation, test edilmemiş event selection path'leri açar. Soft launch sırasında beklenmedik content gösterimi riski oluşur.
3. **Telemetry eksikliği.** Post-launch telemetry olmadan hangi pack'in ne zaman aktive edilmesi gerektiğine veri ile karar verilemez.
4. **Event selection engine foundation only.** Engine mevcut ama pack gating runtime adapter'ı henüz implemente edilmedi.
5. **Story chain ve operation era partial.** Runtime entegrasyon henüz tamamlanmadı.

## Activation readiness tablosu

| Alan | Durum | Not |
|------|-------|-----|
| Total family count | ≥80 | Yeterli |
| Total variant count | ≥300 | Yeterli |
| District coverage | 5 bölge | Tüm bölgeler |
| Domain coverage | ≥4 domain | Yeterli |
| Variant kind coverage | ≥8 tür | Yeterli |
| Echo surface coverage | Mevcut | Pack definition'larda tanımlı |
| Duplicate collision | PASS/WARN | Cross-pack audit sonucu |
| Mobile copy guard | PASS | Uzunluk limitleri dahilinde |
| Forbidden copy guard | PASS | Yasaklı terimler temiz |
| Crisis/panic wording | PASS | Panik ifadeleri yok |
| Selection engine compat | PASS | Foundation mevcut |
| Variant adapter compat | PASS | Foundation mevcut |
| Freshness guard compat | PASS | Foundation mevcut |
| Story chain compat | PARTIAL | Runtime integration V1.1 |
| Operation era compat | PARTIAL | Runtime expansion V1.1 |
| Day 1 safety | PASS | Blocker content yok |
| Day 8+ suitability | PASS | Yeterli content hacmi |
| V1.1 activation risk | BLOCKED | Freeze aktif |

## Riskler

- **[BLOCKER]** No-New-System Freeze aktifken runtime activation yapılamaz.
- **[WARNING]** Runtime adapter implemente edilmedi; content packs event generation'a bağlı değil.
- **[WARNING]** Story chain runtime integration partial — persistent state V1.1'de.
- **[WARNING]** Operation era runtime expansion partial — preview only.
- **[WARNING]** Domain imbalance mümkün — post-launch telemetry ile tune edilmeli.
- **[WARNING]** Variant kind coverage high ama bazı edge case'ler eksik olabilir.

## V1.1 önerilen sıra

1. **Event Selection Runtime Pack Activation Design** [high] — Pack gating mekanizması tasarımı
2. **Content Pack Balance Tuning** [high] — Telemetry bazlı ağırlık ayarı
3. **District Pack Runtime Gating** [high] — district_pack_one aktif etme
4. **Vehicle Route Pack Runtime Gating** [high] — vehicle_route_pack_one aktif etme
5. **Container Environment Pack Runtime Gating** [medium] — container_environment_pack_one aktif etme
6. **Social Trust Pack Runtime Gating** [medium] — social_trust_pack_one aktif etme
7. **Crisis Adjacent Pack Runtime Gating** [medium] — crisis_adjacent_pack_one aktif etme
8. **Story Chain Persistent Runtime Integration** [medium] — Kalıcı story chain state
9. **Operation Era Runtime Expansion** [medium] — Era'dan full runtime'a geçiş
10. **Post-launch telemetry based content weighting** [low] — Veri bazlı ağırlıklandırma

## Post-launch telemetry ile nasıl karar verilecek

1. **Day 1–7 soft launch:** Mevcut event family'lerin engagement rate'i ölçülür. Runtime activation yapılmaz.
2. **Day 8+ cohort oluşunca:** Open-ended progression cohort verileri toplanır.
3. **Pack activation kararı:** Telemetry verileri şu soruları yanıtlar:
   - Mevcut event variety yeterli mi?
   - Hangi domain eksik kalıyor?
   - Hangi bölge daha fazla content istiyor?
   - Repeat rate ne? Freshness problem var mı?
4. **V1.1 activation:** Freeze kalktıktan sonra, telemetry sonuçlarına göre pack'ler sırayla aktive edilir.
5. **Gradual rollout:** Her pack önce %10 cohort'a açılır, engagement ölçülür, sonra full açılır.
6. **Content weighting:** Telemetry ile her pack'in selection weight'i dynamically ayarlanır.

## Freeze uyumu

- Yeni content pack eklenmedi: ✓
- Runtime activation yapılmadı: ✓
- Event generation değişmedi: ✓
- Content activation V1.1 backlog'a taşındı: ✓
- Freeze forbidden scope ihlal edilmedi: ✓
- SAVE_VERSION değişmedi (23): ✓
