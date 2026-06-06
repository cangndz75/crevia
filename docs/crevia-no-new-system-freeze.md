# Crevia — No-New-System Freeze Gate

Soft launch hazırlığı sırasında yeni gameplay sistemi, content pack, runtime activation ve büyük UI değişikliklerini durdurmak için release öncesi freeze gate.

---

## Freeze Amacı

Runtime gameplay stabil; full-loop ve full-ux-flow geçiyor. Launch candidate hâlâ manuel store/IAP/playtest blocker'ları nedeniyle BLOCKED. Bu aşamada scope genişletmek riski artırır — sadece blocker kapatma ve polish serbesttir.

---

## Neden Şimdi Freeze?

- Soft Launch Readiness Review tamamlandı
- Secret hygiene ve rotation closure temiz
- Store metadata, screenshot, privacy draft hazır
- IAP sandbox planı ve manual setup tracker mevcut
- Gerçek cihaz playtest ve IAP smoke henüz yapılmadı
- Launch candidate BLOCKED — yeni sistem eklemek blocker kapatmayı geciktirir

---

## Allowed scope (Serbest)

| Scope | Açıklama |
|-------|----------|
| bugfix | Genel hata düzeltme |
| crash_fix | Crash düzeltme |
| layout_overflow_fix | Layout taşma düzeltme |
| typo_copy_fix | Yazım düzeltme |
| false_claim_copy_fix | Yanlış iddia / legacy copy düzeltme |
| secret_hygiene_fix | Secret/API key hygiene |
| privacy_store_fix | Privacy / store compliance |
| iap_setup_tracker_update | IAP manual setup tracker |
| iap_smoke_result_update | IAP smoke sonuç kaydı |
| real_device_playtest_result_update | Playtest sonuç kaydı |
| store_metadata_update | Store metadata |
| screenshot_capture_status_update | Screenshot durumu |
| performance_selector_fix | Selector performans |
| release_candidate_audit | Release audit |
| verification_only | Sadece verify |
| documentation_only | Sadece docs |

---

## Forbidden scope (Yasak)

Yeni gameplay sistemi, content pack, runtime activation, progression sistemi, map layer, profile/report/hub sistemi, analytics event schema, SAVE_VERSION bump, persist shape değişikliği, event generation / applyDecision / dayPipeline rewrite, IAP purchase flow rewrite, yeni screen/route, büyük UI redesign, AI runtime, remote config, live ops.

---

## Manual Blocker Listesi (Freeze'i Gerekli Kılar)

Bu blocker'lar freeze'i **engellemez** — tam tersine freeze'i **zorunlu** kılar:

- Real device playtest pending
- IAP sandbox smoke pending
- RevenueCat keys pending
- App Store / Play Console product pending
- EAS secrets pending
- Privacy URL placeholder
- Screenshots pending
- Metadata console entry pending

---

## Prompt Guard Checklist

Her yeni Cursor prompt'u için:

1. Bu prompt yeni gameplay sistemi ekliyor mu? → Evet ise **reddet**
2. Bu prompt SAVE_VERSION artırıyor mu? → Evet ise **reddet**
3. Bu prompt runtime event generation değiştiriyor mu? → Evet ise **reddet**
4. Bu prompt applyDecision/dayPipeline değiştiriyor mu? → Evet ise **reddet**
5. Bu prompt yeni content pack ekliyor mu? → Evet ise **reddet**
6. Bu prompt release blocker kapatıyor mu? → **İzin ver** (allowed)
7. Bu prompt sadece bugfix/readiness/polish mi? → **İzin ver**
8. Cevap hayırsa prompt freeze sonrası reddedilmeli.

---

## Release Öncesi Yapılabilecek İşler

- Blocker fix, crash fix, layout overflow
- Copy / typo / false claim düzeltme
- Store / IAP / privacy / screenshot / metadata readiness
- Real device playtest ve IAP sandbox smoke sonuç kaydı
- Secret / privacy / compliance düzeltmeleri
- Verify script çalıştırma

---

## V1.1 Backlog (Release Sonrası)

- Yeni gameplay sistemi veya content pack
- Yeni progression / profile sistemi
- Yeni hub card veya report sistemi
- Büyük UI redesign
- Remote config / live ops
- Analytics event schema genişletmesi
- SAVE_VERSION bump ve persist shape değişikliği

---

## Karar Kriterleri

| Decision | Anlam |
|----------|-------|
| freeze_ready | Gate hazır, expansion riski yok |
| freeze_recommended_after_manual_blockers | Manuel blocker'lar açık — fix-only önerilir |
| freeze_blocked_by_active_system_work | Expansion riski tespit edildi |
| freeze_active | Soft launch candidate — freeze zorunlu |
| fix_only_mode | Launch candidate — sadece allowed scope |

---

## Verify

```bash
npm run verify:no-new-system-freeze
```
