# Crevia QA Evidence Storage

Gerçek cihaz test kanıtları bu klasöre konur. **Boş klasör = tracker `missing` kalır** — fake PASS yok.

## Klasör yapısı

```
docs/evidence/
  ios/          # iPhone screenshot / screen recording
  android/      # Android screenshot / screen recording
  build/        # EAS build_log, install notları (opsiyonel)
```

## Zorunlu metadata

Her dosya için `docs/crevia-real-device-qa-evidence-round-1.md` içindeki evidence formatını doldurun:

- `deviceName`, `osVersion`, `buildProfile`, `testDate`, `tester`, `result`, `notes`
- `evidenceLocation` bu dosyaya işaret etmeli (ör. `docs/evidence/ios/day1-hub.png`)

## Durum akışı

1. `missing` — dosya yok, test yapılmadı
2. `attached` — dosya eklendi, QA lead henüz doğrulamadı
3. `verified` — QA lead onayladı; yalnızca bu durum test PASS sayılır
4. `rejected` — yeniden test gerekir

Şablon ve checklist: `docs/crevia-real-device-qa-evidence-round-1.md`
