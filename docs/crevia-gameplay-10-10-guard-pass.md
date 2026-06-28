# Crevia — Genel 10/10 Gameplay Guard Pass

## Amaç

Bundan sonraki tüm **10/10 gameplay polish pass**'leri için güvenli çalışma sınırları, kalite kriterleri ve regression guard'larını netleştirmek.

Bu pass **doğrudan büyük feature ekleme pass'i değildir**. Öncelik, mevcut oyun sistemlerini 10/10 seviyesine taşırken projenin bozulmasını engelleyecek ortak kuralları ve doğrulama standardını oluşturmaktır.

## Genel hedef

Crevia'nın ana oyun deneyimini güçlendirmek:

- Ana loop daha akıcı olmalı.
- Her fonksiyon oyuncuya daha net hissettirmeli.
- Mobil UI dashboard gibi değil, oyun gibi çalışmalı.
- Yeni karmaşa eklenmeden mevcut sistemler derinleşmeli.
- Her değişiklik state, presentation ve verify açısından güvenli olmalı.

## Kapsam dışı

- Store listing, Privacy URL, IAP
- App Store / Play Store screenshot işleri
- Marketing copy
- Cloud save
- Yeni sezon sistemi
- Büyük backend sistemi
- Yeni devasa progression mimarisi
- **SAVE_VERSION değişikliği (onaysız)**

## Temel kurallar (20)

Kaynak: `src/core/quality/gameplayGuardPass/gameplayGuardPassConstants.ts` → `GAMEPLAY_10_10_BASE_RULES`

1. Yeni feature eklemek yerine mevcut fonksiyonları 10/10 hissettirmeye odaklan.
2. Her pass küçük, kontrollü ve izole olmalı.
3. `useGameStore.ts` içine gereksiz yeni karmaşa ekleme.
4. Mümkünse logic'i model/helper/presentation katmanında çöz.
5. Runtime mutation gerekiyorsa açık gerekçe yaz.
6. Persist shape değiştirme.
7. SAVE_VERSION değiştirme.
8. SAVE_VERSION değişmesi gerçekten zorunluysa önce gerekçeyi raporla ve onay bekle.
9. Existing gameplay loop bozulmamalı.
10. Any/unknown ile type kaçışı yapma.
11. Fake PASS yazma.
12. Verify script gerçek davranış assertion'ı içermeli (yalnızca string arama değil).
13. Mobil density her pass'te korunmalı.
14. Day 1 deneyimi sade kalmalı.
15. Day 8+ deneyimi daha zengin olabilir ama oyuncuyu boğmamalı.
16. Her yeni metin deterministic/state-based olmalı.
17. Random copy üretme.
18. Duplicate content guard korunmalı.
19. Küçük ekran, safe area, bottom nav ve scroll davranışı düşünülmeli.
20. Accessibility ve readability bozulmamalı.

## 10/10 kalite standardı (10 kriter)

Kaynak: `GAMEPLAY_10_10_QUALITY_CRITERIA`

| Kriter | Açıklama |
|--------|----------|
| 5 saniyede amaç | Oyuncu ekranın amacını hızla anlar |
| Tek ana aksiyon | Ekran tek ana aksiyona yönlendirir |
| Görünür karar etkisi | Kararların etkisi görünür |
| Bağlı sistemler | Sistemler kopuk hissettirmez |
| Mobilde okunabilir | UI mobilde rahat okunur |
| Dashboard kalabalığı yok | Kart kalabalığı dashboard hissi yaratmaz |
| Day 1 / Day 8+ | Day 1 sade, Day 8+ zengin |
| Tekrarlayan metin yok | Aynı sinyaller sürekli tekrar etmez |
| Tutarlı sonuçlar | Sonuç ekranları önceki kararlarla çelişmez |
| Verify + typecheck | Tüm verify ve typecheck PASS |

## Öncelik sırası (sonraki pass'ler)

Kaynak: `src/core/quality/gameplayGuardPass/gameplayGuardPassRegistry.ts`

| # | Pass | Verify script(ler) | Hedef dizinler |
|---|------|-------------------|----------------|
| 1 | Sahada fazı canlı operasyon | `verify:operation-field-live` | `src/features/events` |
| 2 | Hub game-first density | `verify:center-hub-density` | `src/features/hub` |
| 3 | Gün sonu raporu taranabilirlik | `verify:report-ui`, `verify:report-replay` | `src/features/reports` |
| 4 | Karar derinliği / tradeoff | `verify:decision-impact-explanation` | `src/features/events` |
| 5 | Maintenance economy bedel | `verify:maintenance-economy` | `src/core/maintenanceBacklog` |
| 6 | Ece kısa bağlamsal dil | `verify:presentation-dedupe` | `src/core/eceTone` |
| 7 | Şehir canlılığı / mini feed | `verify:dynamic-social-echo` | `src/core/socialEcho` |
| 8 | Gelişim / player style | `verify:player-style` | `src/core/playerStyle` |
| 9 | Harita marker feedback | `verify:map-marker-feedback` | `src/features/map` |
| 10 | Full gameplay loop QA | `verify:gameplay-loop-qa` | `src/core/quality` |

**Sonraki önerilen pass:** #1 Sahada fazı canlı operasyon hissi (`field_live_operation`)

## Riskli alanlar

- `useGameStore.ts` — yüksek blast radius
- Persist / migration dosyaları
- Hub ve Report ekranları — density riski
- Ece metinleri — uzunluk oyun hissini düşürür
- Maintenance economy — denge riski
- Harita — ana mutation board'a dönüşmemeli
- Day 1 — fazla bilgi onboarding'i zedeler

## Her pass sonunda zorunlu rapor formatı (12 bölüm)

1. Kısa özet
2. Değişen dosyalar
3. Hangi fonksiyon 10/10'a yaklaştırıldı?
4. Oyuncu deneyiminde ne değişti?
5. Day 1 davranışı
6. Day 8+ davranışı
7. Runtime/persist etkisi var mı?
8. SAVE_VERSION değişti mi?
9. Yeni veya güncellenen verify kontrolleri
10. Komut sonuçları
11. Kalan riskler
12. Sonraki önerilen pass

## Minimum komutlar

### Guard pass (bu pass)

```bash
npm run typecheck:tsc
npm run verify:gameplay-loop-qa
npm run verify:final-ui-visual-unification
npm run verify:save-version-policy
npm run verify:gameplay-guard-pass
```

### Her feature pass sonunda

```bash
npm run typecheck:tsc
npm run verify:<ilgili-feature>
npm run verify:gameplay-loop-qa
npm run verify:final-ui-visual-unification
```

İlgili feature verify script'i yoksa: yeni verify ekle, `package.json`'a kaydet, gerçek davranış assertion'ı yaz.

## Verify

```bash
npm run verify:gameplay-guard-pass
```

Guard verify şunları doğrular:

- 20 kural, 10 kalite kriteri, 10 öncelik pass registry tamam
- Tüm öncelik pass verify script'leri `package.json`'da kayıtlı
- SAVE_VERSION policy uyumu (runtime değişmedi)
- Day 1 / Day 8 hub density contract (presentation builder)
- Field phase timeline + CTA contract
- Report Day 1 sade / Day 8+ zengin contract
- Presentation dedupe (duplicate content guard)

## Kabul kriteri (bu guard pass)

- [x] 10/10 gameplay polish standardı netleşmiş
- [x] Yeni gameplay feature eklenmemiş
- [x] Runtime davranışı değişmemiş
- [x] SAVE_VERSION değişmemiş
- [x] Typecheck PASS
- [x] Var olan verify script'leri bozulmamış
- [x] Sonraki pass'ler için teknik sınırlar açık
