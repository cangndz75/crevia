# Crevia — Secret & API Key Hygiene Policy

Bu dosya Crevia projesinin secret key, API key ve credential yönetim politikasını tanımlar.

---

## Secret Policy

### Asla repo'ya commit edilmemesi gerekenler

- RevenueCat secret/private API key'leri
- App Store Connect shared secret
- Google Play service account JSON
- Herhangi bir provider secret token
- Gerçek API key değerleri (public dahil, docs/code'da değer olarak)

### EAS Secrets üzerinden sağlanması gerekenler

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` — RevenueCat iOS public SDK key
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` — RevenueCat Android public SDK key
- Key'ler `eas secret:create` ile set edilir
- Build time'da inject edilir, repo'da değer tutulmaz

---

## Safe Placeholders

Aşağıdaki değerler güvenli placeholder olarak kabul edilir:

- `PENDING_PLACEHOLDER`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (env var adı, değer değil)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (env var adı, değer değil)
- `<YOUR_REVENUECAT_PUBLIC_KEY>`
- `YOUR_KEY_HERE`
- `<REVENUECAT_PUBLIC_SDK_KEY_SET_IN_EAS>`
- `<DO_NOT_COMMIT_SECRET_KEY>`
- `<STORE_SHARED_SECRET_NOT_IN_REPO>`
- `appl_REPLACE_WITH_REVENUECAT_IOS_PUBLIC_KEY`
- `goog_REPLACE_WITH_REVENUECAT_ANDROID_PUBLIC_KEY`

---

## RevenueCat Public vs Secret Key Policy

### Public SDK Key (client-side)

- Prefix: `appl_` (iOS), `goog_` (Android)
- Teknik olarak client-side kullanılabilir
- **Bu proje için policy:** repo/docs'a gerçek değer yazılmaz
- EAS secrets üzerinden build time'da sağlanır
- Docs'ta sadece placeholder veya env var adı kullanılır

### Secret Key (server-side only)

- Prefix: `sk_`, `rcsk_`
- **Asla** client koduna veya repo'ya konmaz
- Tespit edilirse: BLOCKER + rotation required
- Dashboard'da immediate rotate/revoke

---

## Unsafe Örnekler (Gerçek Değer İçermez)

Aşağıdaki pattern'lar scanner tarafından algılanır:

| Pattern | Açıklama | Severity |
|---------|----------|----------|
| Secret key prefix + 10+ karakter | Gerçek secret key değeri | blocker |
| Public key prefix + 10+ karakter (docs'ta) | Gerçek public key docs'ta | high |
| Public key prefix + 10+ karakter (source'ta) | Public key source'ta | medium |
| Uzun token benzeri string | Şüpheli token | low |

> **Not:** Kısa pattern referansları (ör. regex pattern tanımları, güvenlik dokümantasyonu) false positive üretmez. Scanner context-aware çalışır.

---

## Eğer Key Daha Önce Commitlendiyse

1. **Provider dashboard'da key'i rotate/revoke et.** Sadece repo'dan silmek yetmez.
2. Public repo'ya pushlandıysa, key'i exposed say.
3. Git history'de key kalabilir — git history secret cleanup ayrı bir manuel güvenlik işidir.
4. Bu policy yalnızca current working tree sanitization yapar.
5. History rewrite (BFG, git-filter-repo) ayrı güvenlik operasyonudur.

### Rotation Checklist

- [ ] RevenueCat dashboard → API Keys → secret key rotate
- [ ] App Store Connect → shared secret regenerate (gerekiyorsa)
- [ ] Google Play Console → service account key rotate (gerekiyorsa)
- [ ] EAS secrets güncelle: `eas secret:create --force`
- [ ] Development build yeniden oluştur
- [ ] Sandbox smoke test tekrarla

---

## Current Status

| Item | Status |
|------|--------|
| Current tree sanitized | scanner ile doğrulanır |
| Rotation pending | scanner ile doğrulanır |
| Secret key in source | scanner BLOCKER üretir |
| Real key in docs | scanner HIGH üretir |
| Placeholder policy | enforced |

---

## Next Actions

1. `npm run verify:secret-hygiene` çalıştır
2. BLOCKER varsa: dosyayı sanitize et, key'i rotate et
3. WARN varsa: placeholder ile değiştir
4. PASS ise: devam et

---

## Verify Komutu

```bash
npm run verify:secret-hygiene
```
