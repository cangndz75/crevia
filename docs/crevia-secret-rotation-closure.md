# Crevia — Secret Rotation / Exposure Closure

Bu dosya Secret Hygiene Cleanup sonrası manuel güvenlik kapanış sürecini tanımlar.

---

## Amaç

Hygiene scan current tree'yi temizledikten sonra, geçmişte sızmış olabilecek key'ler için rotate/revoke ve kapanış kanıtını izlemek. Bu sistem **gerçek dashboard işlemi yapmaz** — sadece manuel adımları ve blocker policy'yi yönetir.

---

## Raw Key Saklamama Kuralı

- Exposure record'lar **asla** raw key değeri içermez (`rawValueStored: false`).
- Maskeli key bile zorunlu değilse tutulmaz.
- File path + finding kind + provider yeterlidir.
- Evidence note ve dashboard referanslarında key benzeri pattern olmamalıdır.

---

## Provider Bazlı Rotation Policy

| Finding kind | Provider | Rotation required | Launch blocking |
|--------------|----------|-------------------|-----------------|
| revenuecat_secret_key | RevenueCat | Evet | Evet |
| store_shared_secret | App Store / Play | Evet | Evet |
| generic_api_key | Unknown | Evet (manuel review) | Evet |
| eas_secret_value | EAS | Evet | Evet |
| revenuecat_public_key | RevenueCat | Hayır (rotate önerilir) | Hayır |
| docs_real_key_value | Docs | Hayır (manuel review) | Yapılandırılabilir |
| suspicious_token | Unknown | Evet (review) | Evet |
| placeholder_safe | N/A | Hayır | Hayır |

---

## RevenueCat Dashboard Revoke/Rotate Checklist

- [ ] RevenueCat dashboard → API Keys açıldı
- [ ] Exposed secret key revoke/rotate edildi
- [ ] Eski key devre dışı doğrulandı
- [ ] Yeni public SDK key EAS secret olarak eklendi
- [ ] Yeni key repo/docs içinde yok
- [ ] Secret hygiene scan tekrar PASS

---

## EAS Secret Update Checklist

- [ ] `eas secret:create` ile yeni key set edildi
- [ ] Eski secret silindi veya override edildi
- [ ] Development build yeniden oluşturuldu
- [ ] Build log'da key değeri görünmüyor

---

## Store Shared Secret Checklist

- [ ] App Store Connect shared secret regenerate edildi (gerekiyorsa)
- [ ] Google Play service account key rotate edildi (gerekiyorsa)
- [ ] Eski secret repo/docs'tan kaldırıldı

---

## Public Repo Exposure Policy

- Key public remote'a pushlandıysa **exposed** sayılır.
- Sadece current tree'den silmek yetmez — provider'da rotate/revoke zorunlu.
- Git history cleanup ayrı manuel güvenlik işidir.
- `SECRET_ROTATION_PUBLIC_REPO_EXPOSURE_FLAG` true ise rotation pending kalır.

---

## Manual Evidence Format

Evidence kaydı raw key içermemeli:

| Alan | Örnek |
|------|-------|
| exposureId | exposure path referansı |
| actionType | revoked / rotated / reviewed_not_secret / false_positive |
| confirmedBy | ekip üyesi adı |
| confirmationDateLabel | 2026-06-06 |
| evidenceNote | "RC dashboard'da secret key rotate edildi" |
| dashboardReferencePlaceholder | RevenueCat API Keys page |
| rawKeyIncluded | false (zorunlu) |
| verifiedByAudit | hygiene scan PASS sonrası true |

---

## Closure Criteria

Kapanış tamamlanmış sayılır when:

1. Current tree sanitized (secret hygiene PASS)
2. Tüm rotation-required exposure'lar `verified_closed` statüsünde
3. Evidence raw key içermiyor
4. False positive claim'ler manual evidence ile doğrulanmış

---

## Current Status

| Item | Durum |
|------|-------|
| Current tree sanitized | scanner ile doğrulanır |
| Rotation required | exposure registry'ye bağlı |
| Evidence present | manuel registry |
| Closure can proceed | audit sonucu |

---

## Next Actions

1. `npm run verify:secret-hygiene` — tree temiz mi?
2. `npm run verify:secret-rotation-closure` — kapanış durumu
3. Rotation pending varsa dashboard checklist'i tamamla
4. Evidence kaydı ekle (raw key olmadan)
5. Tekrar verify çalıştır

---

## Verify

```bash
npm run verify:secret-rotation-closure
```
