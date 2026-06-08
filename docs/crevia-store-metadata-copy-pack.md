# Crevia Store Metadata Copy Pack — TR/EN Aşama 1

## 1. Amaç

App Store ve Google Play mağaza metinlerini TR/EN olarak hazırlamak: kısa/uzun açıklama, feature bullets, keyword havuzu, review notes, release notes, IAP tone guidance, privacy disclosure ve false-claim guard. Gerçek console entry veya screenshot dosyası üretmez.

## 2. Neden şimdi gerekli

Screenshot Narrative Pack Aşama 1 tamamlandı (`ready_for_capture`). Metadata copy pack, narrative ile uyumlu mağaza metinlerini console girişi öncesi netleştirir. Public launch blocked; console entry, privacy URL ve IAP sandbox manuel bekliyor.

## 3. Store positioning

**TR:** Crevia, şehir operasyonlarını günlük kararlarla yönettiğin, mahallelerin kararlarına tepki verdiği ve her günün rapora/şehir hafızasına işlendiği mobil operasyon simülasyonudur.

**EN:** Crevia is a mobile city operations simulation where your daily decisions shape neighborhoods, reports, field resources and the city's memory.

**Yanlış positioning (kullanılmaz):** resmi belediye uygulaması, GPS tracking, şehir kurma sandbox, online multiplayer, AI chatbot, idle tycoon, pay-to-win, gerçek veri/resmi sistem.

## 4. TR metadata copy

### Subtitle alternatifleri
1. Şehri kararlarınla yönet
2. Mahalleler kararlarına tepki verir
3. Günlük şehir operasyon simülasyonu

### Kısa açıklama alternatifleri
1. Karar ver, mahallelerin tepkisini gör, gün sonu raporuyla şehrin yönünü takip et.
2. Günlük operasyon kararları, harita tepkileri ve Ece danışmanlığıyla şehri yönet.

### Uzun açıklama bölümleri
Açılış hook → Ne yaparsın? → Karar etkisi → Harita/mahalleler → Ece/Sosyal Nabız/Rapor → Ana operasyon → Neden farklı? → Soft launch notu

Tam metin: `src/core/storeMetadataCopy/storeMetadataCopyConstants.ts` → `STORE_METADATA_COPY_LONG_DESCRIPTION_TR`

## 5. EN metadata copy

### Subtitle alternatives
1. Run daily city operations
2. Decisions that shape a city
3. A civic operations simulation

### Short description alternatives
1. Make daily decisions, watch neighborhoods react, and review how your city changes over time.
2. Plan field operations, read neighborhood signals, and see each day leave a mark on the city.

### Full description sections
Hook → What you do → Decision impact → Map/neighborhoods → Ece/social pulse/reports → Main operation → Why it stands out → Soft launch note

Full text: `STORE_METADATA_COPY_LONG_DESCRIPTION_EN`

## 6. Feature bullets

| # | TR | EN |
|---|----|----|
| 1 | Günlük operasyon kararları ve planlama döngüsü | Daily operation decisions and planning loop |
| 2 | Mahalle tepkileri ve harita görünürlüğü | Neighborhood reactions and map visibility |
| 3 | Ece operasyon danışmanı ve karar tarzı yorumu | Ece, your operations advisor, and decision-style insight |
| 4 | Sosyal Nabız ile saha geri bildirimi | Social pulse feedback from the field |
| 5 | Gün sonu raporları ve yarın riski özeti | End-of-day reports and tomorrow risk summary |
| 6 | Şehir Günlüğü ile karar hafızası | City journal and decision memory |
| 7 | Ekip ve araç kaynaklarını dengeleme | Balance teams and vehicle resources |
| 8 | Pilot sonrası ana operasyon dönemi | Main operation phase after the pilot |
| 9 | Toparlanma ve olumlu iz görünürlüğü | Recovery and positive outcome visibility |

## 7. Keyword/phrase pool

**TR:** belediye oyunu, şehir yönetimi, operasyon simülasyonu, karar oyunu, mahalle yönetimi, strateji simülasyonu, günlük rapor, kaynak yönetimi, sosyal nabız, şehir hafızası

**EN:** city operations, civic simulation, decision game, neighborhood management, operations strategy, daily reports, resource management, city pulse, simulation game, management strategy

Keyword stuffing yapılmaz.

## 8. Review notes

Review notes şunları açıklar:
- Resmi belediye uygulaması değildir
- Gerçek belediye verisi / GPS yok
- IAP neyi açar (pay-to-win değil)
- Sentry/analytics privacy policy referansı
- Önerilen reviewer flow: onboarding → Day 1 → report → Day 8+
- Sandbox test account: `[SANDBOX_TEST_ACCOUNT_PLACEHOLDER — TODO]`

Fake credential yazılmaz.

## 9. Release notes

**TR:** İlk soft launch — pilot akışı, mahalle tepkileri, Ece, Sosyal Nabız, raporlar, ana operasyon önizlemesi. Final public launch ready demez.

**EN:** Initial soft launch build with pilot flow, neighborhood reactions, Ece advisor notes, social pulse, end-of-day reports and main operation preview. Not a final public launch claim.

## 10. IAP product copy guidance

**TR tone:** Ana Operasyon erişimi, pilot sonrası daha geniş şehir kapsamını ve sezon akışını açar.

**EN tone:** Main Operation access expands the city scope and season flow after the pilot.

- Product ID / fiyat uydurulmaz (listing constants kullanılır)
- Premium baskısı / FOMO yok
- Restore purchase sakin açıklama
- Pilot hafta satın alma olmadan tamamlanabilir

## 11. Privacy disclosure copy

**TR:** Çökme raporları ve kullanım sinyalleri güvenilirlik için kullanılabilir; serbest metin veya kayıt dosyası gönderilmez. Gizlilik politikası yerine geçmez.

**EN:** Crash reports and usage signals may improve reliability; free-form text or raw save data is not sent. Does not replace privacy policy.

Privacy URL placeholder kapanmaz.

## 12. False claim guard

`scanMetadataCopyForFalseClaims` — AI, GPS, online, resmi belediye, pay-to-win, garanti, crypto/NFT, tıbbi iddia vb. taranır. `fakePassGuard: true` — console entry submitted olarak işaretlenmez.

## 13. Store readiness integration

| Modül | Bağlantı |
|-------|----------|
| `storeMetadataFinalization` | `copyPackId`, `copyPackStatus`, `copyDocsPath` |
| `storeScreenshotNarrative` | `narrativePackDocsPath` cross-link |
| `releaseCandidate` | metadata/console blocker pending |
| `manualLaunchTracker` | evidence verified = 0 |

**Durum:** Copy pack `ready_for_console_entry`; console entry `pending`; public launch `blocked`.

## 14. Non-goals

- Console entry submitted/done işaretleme
- Fake evidence / screenshot captured
- Product ID/fiyat uydurma
- Privacy URL placeholder kapatma
- Gameplay / SAVE_VERSION / persist / pipeline değişikliği

## 15. Verify sonucu

```bash
npm run verify:store-metadata-copy
```

Beklenti: exit 0; copy guard PASS; console entry pending; verified evidence 0.

## 16. Sonraki önerilen prompt

> Store Metadata Copy Pack Aşama 2: TR/EN metinleri App Store Connect ve Play Console'a yapıştır; field limit manual check; privacy URL yayınla; screenshot capture + narrative overlay ile birlikte store listing draft review yap.

## 17. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:store-metadata-copy
npm run verify:store-metadata-finalization
npm run verify:store-screenshot-narrative
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```

### Manual limit checks (official docs — last checked: manual)

- Apple App Store metadata field limits manual check required.
- Google Play short/full description limits manual check required.
- Keyword rules manual check required.
- IAP product metadata rules manual check required.
- Privacy/data safety copy must match actual SDKs and data use.
