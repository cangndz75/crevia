# Crevia Privacy Policy + Data Safety Final Text Pack — Aşama 1

## 1. Amaç

Privacy policy ve store data safety hazırlığını final metin seviyesine getirmek: Sentry, analytics, RevenueCat/IAP, local save, no GPS/no real municipality data/no raw save upload açıklamalarını TR/EN netleştirmek. Privacy URL manuel yayınlanacak — bu pass URL’yi yayınlanmış gibi işaretlemez.

## 2. Legal disclaimer / manual review note

**Bu pass hukuk danışmanlığı değildir.** Metin taslağı üretir; final legal review pending kalır.

Manual checks (last checked: manual):
- Apple App Privacy details manual check required.
- Google Play Data Safety manual check required.
- RevenueCat privacy/data disclosure must match actual SDK configuration.
- Sentry privacy/data disclosure must match actual SDK configuration.
- Analytics SDK/data disclosure must match actual SDK configuration.
- Final privacy policy legal review required before public launch.

## 3. TR privacy policy draft

12 bölüm — tam metin: `src/core/privacyPolicyText/privacyPolicyTextConstants.ts` → `PRIVACY_POLICY_TEXT_SECTIONS`

| # | Bölüm |
|---|-------|
| 1 | Giriş / Overview |
| 2 | Toplanabilecek veri türleri |
| 3 | Toplamadığımız veriler |
| 4 | Çökme raporlama (Sentry) |
| 5 | Analitik |
| 6 | Satın almalar / RevenueCat / Mağazalar |
| 7 | Yerel kayıt / Oyun ilerlemesi |
| 8 | Çocuklar / Yaş uygunluğu |
| 9 | Veri paylaşımı |
| 10 | Kullanıcı seçenekleri |
| 11 | İletişim / Destek |
| 12 | Politika değişiklikleri |

Yayınlanmış URL: `[PRIVACY_URL_PENDING — henüz yayınlanmadı]`

## 4. EN privacy policy draft

Same 12 sections with natural EN bodies in `PRIVACY_POLICY_TEXT_SECTIONS`. Published URL: `[PRIVACY_URL_PENDING — not yet published]`.

## 5. Data safety matrix

15 satır — `PRIVACY_POLICY_TEXT_DATA_SAFETY_MATRIX`

| Category | Collected |
|----------|-----------|
| Crash diagnostics | conditional |
| Usage analytics | pending_manual_review |
| Purchase status | conditional |
| Entitlement status | conditional |
| Device/app information | yes |
| Local gameplay progress | yes (device only) |
| Support contact info | conditional |
| Precise location | no |
| Contacts | no |
| Photos/videos | no |
| Microphone | no |
| Health data | no |
| Real municipality data | no |
| Real citizen data | no |
| Free-form user content | no |

## 6. SDK disclosure matrix

| SDK | Code | Env/Dashboard | Notes |
|-----|------|---------------|-------|
| Sentry | present | pending | No raw save, PII, precise location |
| Analytics | present | pending | Schema ready; SDK/dashboard pending |
| RevenueCat/IAP | present | pending | Keys, sandbox, restore pending |
| App Store / Google Play | present | pending | Payments via platform |

## 7. Store disclosure copy

**TR:** Crevia; çökme raporları, sınırlı kullanım sinyalleri ve satın alma/erişim durumunu işleyebilir. Kamu kurumu verisi, GPS, ham kayıt veya kişisel serbest metin gönderilmez.

**EN:** Crevia may process crash diagnostics, limited usage signals and purchase/access status. It does not send agency records, precise GPS, raw save files or free-form personal text.

Store metadata destek copy’sidir; privacy policy yerine geçmez.

## 8. False claim guard

`scanPrivacyPolicyTextForViolations` — AI, GPS, resmi belediye, “no data collected” genellemesi, URL published fake, data safety submitted fake. `fakePassGuard: true`.

## 9. Privacy URL publish checklist

- [ ] Legal review completed
- [ ] Host privacy policy at real URL (replace placeholder)
- [ ] Update App Store Connect privacy URL field
- [ ] Update Play Console privacy policy URL
- [ ] Attach URL evidence to manual launch tracker
- [ ] Do not mark `privacy_url_published` done without verified evidence

## 10. Store Data Safety manual checklist

- [ ] Complete Apple App Privacy questionnaire
- [ ] Complete Google Play Data Safety form
- [ ] Align crash row with Sentry activation
- [ ] Align analytics row with SDK wiring
- [ ] Align purchase/entitlement with RevenueCat
- [ ] Mark location, contacts, health, photos, microphone as not collected
- [ ] Confirm local save stays on device only

## 11. Readiness integration

| Modül | Bağlantı |
|-------|----------|
| `privacyPolicyReadiness` | `privacyTextPackId`, `privacyTextStatus`, `privacyDocsPath`, `dataSafetyChecklistStatus`, `sdkDisclosureMatrixStatus`, `legalReviewStatus`, `privacyUrlStatus` |
| `storeMetadataFinalization` | `privacyTextDocsPath` |
| `storeMetadataCopy` | privacy disclosure copy aligned |
| `releaseCandidate` | privacy BLOCKED if URL missing |
| `manualLaunchTracker` | `privacy_url_published` pending |

**Durum:** Text pack `ready_for_legal_review`; URL placeholder; data safety forms pending; public launch blocked.

## 12. Non-goals

- Privacy URL published / legal review done / data safety submitted fake
- RevenueCat/Sentry/analytics dashboard fake PASS
- Gameplay / SAVE_VERSION / persist changes
- Fake evidence

## 13. Verify sonucu

```bash
npm run verify:privacy-policy-text
```

Beklenti: exit 0; `ready_for_legal_review`; URL placeholder; verified evidence 0.

## 14. Sonraki önerilen prompt

> Privacy Policy + Data Safety Pack Aşama 2: Legal review sonrası hosted privacy URL yayınla; Apple App Privacy ve Google Play Data Safety formlarını manuel doldur; evidence attach et; `privacy_url_published` blocker'ı yalnızca verified evidence ile güncelle.

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:privacy-policy-text
npm run verify:privacy-policy-readiness
npm run verify:store-metadata-copy
npm run verify:store-metadata-finalization
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:crash-performance
npm run verify:post-launch-telemetry-readiness
npm run verify:iap-integration
npm run verify:soft-launch-regression-cleanup
npm run verify:full-loop
npm run verify:full-ux-flow
```
