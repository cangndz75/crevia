# Crevia — Privacy / Data Safety Checklist

Mağaza **Data safety** (Play) ve **App Privacy** (Apple) formları için kontrol iskeleti. Bu doküman hukuki policy değildir; gerçek privacy policy metni ayrı pass’te finalize edilir.

İlgili: [crevia-privacy-policy-draft.md](./crevia-privacy-policy-draft.md), [crevia-eas-store-build-prep-foundation.md](./crevia-eas-store-build-prep-foundation.md)

## Veri toplama özeti

| Başlık | Durum | Not |
|--------|-------|-----|
| Personal data collected? | Minimal / local | Hesap zorunlu değil; PII toplama hedeflenmiyor |
| Analytics? | Structured, privacy-safe | Ham event metni / save dump **toplanmaz** |
| Crash reporting? | SDK present, config pending | `@sentry/react-native` — production DSN EAS secret |
| Purchases? | Via store + RevenueCat | Canlı ödeme testi bu pass’te yok |
| Account / login? | Not currently integrated | Yerel save only |
| Location? | Not currently integrated | Harita oyun içi; GPS yok |
| Notifications? | Not currently integrated | Push yok |
| Local save data? | Yes | AsyncStorage — cihazda kalır |
| Cloud sync? | Not currently integrated | |
| Third-party SDKs? | Sentry, RevenueCat (optional) | RevenueCat public key placeholder |
| Children / age rating? | 4+ / Everyone hedef | Çocuklara yönelik değil |

## SDK envanteri (build prep snapshot)

| SDK | Amaç | Veri | Store disclosure |
|-----|------|------|------------------|
| `@sentry/react-native` | Crash / performance | Crash stack, device metadata | Pending DSN + form |
| `react-native-purchases` (RevenueCat) | IAP entitlement | Store receipt, anonymous app user id | Pending sandbox |
| `@react-native-async-storage/async-storage` | Local persist | Oyun save (cihazda) | Local only |
| `@react-native-community/netinfo` | Connectivity | Network state | Not transmitted by default |

## Store form checklist

- [ ] Privacy policy URL canlı ve erişilebilir
- [ ] Data collected vs not collected tablosu mağaza formu ile uyumlu
- [ ] Purchase data: Apple/Google + RevenueCat disclosure
- [ ] Crash data: Sentry disclosure (when DSN active)
- [ ] Analytics: structured events only — no raw user text
- [ ] Data deletion / account: N/A (no account) — local uninstall clears save
- [ ] COPPA / children: not directed at children under 13

## RevenueCat / IAP disclosure skeleton

- Ürün: Ana Operasyon tek seferlik unlock
- iOS: `crevia.main_operation.season1`
- Android: `crevia_main_operation_season_1`
- Entitlement: `main_operation_full_access`
- Restore purchases: desteklenmeli (kod mevcut; sandbox test pending)

## Not

Bu checklist kesin hukuki tavsiye değildir. Store submission öncesi privacy policy metni ve formlar manuel doğrulanmalıdır.
