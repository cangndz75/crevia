# Crevia — RevenueCat / Store Dashboard Manual Setup Tracker

Bu dosya RevenueCat, App Store Connect, Google Play Console, EAS ve sandbox tester manuel kurulumlarının izlenmesini sağlar. Gerçek dashboard işlemi yapılmaz; sadece checklist ve durum takibi.

> **UYARI:** Gerçek API key değerlerini bu dosyaya veya repo'ya yazmayın. Key'ler yalnızca EAS secrets'ta saklanır.

---

## A. RevenueCat Project Setup

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | RevenueCat project exists | pending_manual | Dashboard'da proje oluştur |
| 2 | iOS app created | pending_manual | App Store Connect shared secret ile bağla |
| 3 | Android app created | pending_manual | Play service account JSON ile bağla |
| 4 | Public SDK keys available | pending_manual | iOS: appl_* / Android: goog_* |
| 5 | Keys stored as EAS secrets | pending_manual | `eas secret:create` |
| 6 | No secret key committed | pending_manual | Secret key prefixleri repo'da olmamalı |

## B. RevenueCat Entitlement

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Entitlement: `main_operation_full_access` | pending_manual | Dashboard'da oluştur |
| 2 | Entitlement attached to product | pending_manual | iOS + Android ürünleri bağla |
| 3 | Entitlement sync expected | pending_manual | Purchase sonrası CustomerInfo kontrolü |

## C. RevenueCat Offering

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Offering id: `default` | pending_manual | Default offering oluştur |
| 2 | Package mapping | pending_manual | `main_operation_season_1` paketi |
| 3 | Product linked to offering | pending_manual | Store ürünleri offering'e bağla |
| 4 | Offering visible in SDK | pending_manual | EAS dev build ile doğrula |

## D. App Store Connect IAP

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Product id: `crevia.main_operation.season1` | pending_manual | Non-consumable oluştur |
| 2 | Product type: non-consumable | pending_manual | Subscription olmamalı |
| 3 | Metadata (display name, description) | pending_manual | TR + EN lokalize |
| 4 | Price tier | pending_manual | Sandbox için aktif |
| 5 | Review screenshot | pending_manual | Placeholder veya gerçek |
| 6 | Cleared for sale / sandbox | pending_manual | Sandbox ortamında erişilebilir |

## E. Google Play Console Product

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Product id: `crevia_main_operation_season_1` | pending_manual | Managed product oluştur |
| 2 | Classification: one-time (not subscription) | pending_manual | In-app product |
| 3 | Metadata (title, description) | pending_manual | Lokalize |
| 4 | Price active | pending_manual | Default fiyat ayarla |
| 5 | Active status | pending_manual | Ürün aktif |
| 6 | License tester | pending_manual | Gmail ekle |

## F. EAS / Build Config

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` secret | pending_manual | `eas secret:create` |
| 2 | `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` secret | pending_manual | `eas secret:create` |
| 3 | Development build profile | pending_manual | eas.json development profili |
| 4 | Native billing permission | pending_manual | Android manifest kontrolü |
| 5 | Bundle id / package name alignment | pending_manual | app.json ile store eşleşmesi |

## G. Sandbox Test Accounts

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | iOS sandbox tester | pending_manual | Sandbox Apple ID |
| 2 | Android license tester | pending_manual | Gmail + internal track |
| 3 | Test account notes | pending_manual | Repo dışında dokümante et |
| 4 | Restore test account state | pending_manual | Reset prosedürü |

## H. Manual Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Product metadata loads | pending_manual | getOfferings title/price |
| 2 | Purchase flow starts | pending_manual | Store sheet görünür |
| 3 | Restore flow starts | pending_manual | restorePurchases çalışır |
| 4 | Entitlement sync | pending_manual | `main_operation_full_access` aktif |
| 5 | Offline fallback | pending_manual | Airplane mode → kontrollü hata |
| 6 | Observations recorded | pending_manual | Smoke execution docs'a yaz |

---

## Status Tanımları

| Status | Açıklama |
|--------|----------|
| `not_started` | Henüz başlanmadı |
| `pending_manual` | Manuel işlem bekleniyor |
| `configured_unverified` | Dashboard'da yapıldı ama cihazda doğrulanmadı |
| `verified` | Cihazda doğrulandı |
| `blocked` | Engel var |
| `not_applicable` | Bu ortam için geçerli değil |

> **Önemli:** `configured_unverified` sandbox pass sayılmaz. Cihazda smoke test gerekir.

---

## Key / Secret Safety Kuralları

1. **Secret key (secret SDK key prefixleri) repo'ya commit edilmemeli.**
2. Public SDK key placeholder ise sandbox-ready sayılmaz.
3. Env var adları dokümante edilmeli (`EXPO_PUBLIC_REVENUECAT_*`).
4. EAS secret olarak saklanmalı.
5. Docs gerçek key değeri içermemeli.
6. `.env` örneği varsa placeholder olmalı.

---

## Next Action Sırası

1. RevenueCat dashboard'da proje oluştur
2. iOS ve Android app ekle
3. Entitlement ve offering konfigüre et
4. App Store Connect / Play Console'da ürün oluştur
5. EAS secrets'a key'leri ekle
6. Development build oluştur
7. Sandbox tester hesapları hazırla
8. EAS dev build üzerinde manual smoke test
9. Sonuçları smoke execution docs'a kaydet

---

## Verify Komutu

```bash
npm run verify:iap-manual-setup-tracker
```

Bu script setup alanlarını, product ID uyumluluğunu, key safety kontrollerini ve soft launch review entegrasyonunu doğrular.
