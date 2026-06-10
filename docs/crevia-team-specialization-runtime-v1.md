# Crevia — Team Specialization Runtime V1

## Amaç

Oyuncunun ekipleri belirli operasyon türlerinde deneyim kazanır; fazla kullanımda yorgunluk birikir, doğru kullanımda moral ve uzmanlık artar. Sistem bireysel personel yönetimine dönüşmez — oyuncuya küçük ama anlamlı “ekip izi” satırları gösterilir.

## Oyuncuya verdiği his

- Ekiplerin sahada iz bıraktığını hissettirir.
- Yorgunluk uyarıları panik üretmez; “daha dikkatli kullanılmalı” dili kullanılır.
- Uzmanlık abartılmaz: “deneyim kazanıyor”, “daha güvenilir hale geliyor”.

## Team groups (6)

| ID | Oyuncu etiketi |
|---|---|
| `field_coordination` | Saha koordinasyon ekibi |
| `route_cleanup` | Rota temizlik grubu |
| `container_service` | Konteyner saha grubu |
| `social_response` | Sosyal müdahale grubu |
| `rapid_support` | Hızlı destek ekibi |
| `backup_team` | Yedek destek ekibi |

## Experience / fatigue / morale

- Skorlar 0–100 aralığında clamp edilir.
- Gün kapanışında assignment, operasyon sinyalleri ve archive read-only girdileriyle güncellenir.
- Fatigue yüksekken experience kazanımı azalır.
- `backup_team` aşırı kullanımda morale düşer, fatigue artar.

## Day / access safety

| Gün | UI |
|---|---|
| 1 | Gizli |
| 2–3 | Gizli |
| 4–7 | Pasif (Hub/Report/Map satırı yok) |
| 8+ | Hub/Report/Map max 1 compact satır |

## Entegrasyonlar

- **Assignment:** Read-only personnel/domain/compatibility girdisi; scoring rewrite yok.
- **Vehicle Maintenance:** `vehicleMaintenanceLinkSummary` read-only; `route_cleanup` ↔ rota strain.
- **City Archive:** `team_specialization_gained`, `team_fatigue_warning`, `team_morale_recovered`, `team_domain_mastery`, `backup_team_overused`.
- **Story Chain:** 6 low-priority team signal (domine etmez).
- **Content Pack:** Read-only domain sinyali; runtime injection yok.

## UI yüzeyleri

- Hub: max 1 compact line (Day 8+)
- Report: max 1 compact line
- Map: max 1 compact hint (yeni marker yok)
- Assignment: future preview ipucu (kart şişirilmez)
- City Journal: max 1 anlamlı entry

## Bilinçli sınırlar

- Bireysel personel uzmanlığı yok.
- Team detail route yok.
- Payroll / maaş / monetization dili yok.

## SAVE_VERSION 26

- v25 → v26 idempotent migration.
- Eksik `teamSpecialization` alanı için güvenli initial state.
- Day ≤ 7: none/low/steady default.
- Day ≥ 8: assignment/archive sinyallerinden güvenli derive.

## UI Density QA

### Hub / Report / Map — max 1 compact line

- Day 1: gizli.
- Day 2–7: pasif; Hub/Report/Map satırı üretilmez.
- Day 8+: yüzey başına en fazla 1 compact satır.
- Anlamlı veri yoksa (`specializationBand: none`, düşük fatigue/morale, boş öneri) satır gizlenir.
- Aynı gün `duplicateKey` / mevcut satır guard ile tekrar gösterilmez.
- Hub yoğun insight bağlamında (aktif operasyon, authority preview, district expansion, badge showcase) pozitif ekip gelişimi satırı düşük öncelikli kalır ve gizlenebilir; fatigue/strain uyarısı kısa ve sakin kalır.

### Assignment hint — safe hook

- `buildTeamSpecializationAssignmentHint` → `selectTeamSpecializationAssignmentHint` üzerinden `EventAssignmentPanel`’a bağlandı.
- Sadece tek satırlık preview; scoring, personel seçimi veya uyumluluk sonucunu değiştirmez.
- Day 8+ ve anlamlı state yoksa hiçbir şey göstermez.
- Raw skor, enum ve panik dili yok.

### Vehicle Maintenance + Team Specialization strain guard

- Aynı gün hem araç hem ekip yorgunluk/strain sinyali varsa iki ayrı panik metni yerine tek sakin öncelik satırı üretilir (ör. rota hattında birleşik iz).
- Birleşik satır anlamlı değilse ayrı satırlar korunur; her gün otomatik görünmez.

### Yorgunluk copy tonu

- Kullanılan: “izleniyor”, “deneyim kazanıyor”, “daha dengeli kullanılmalı”, “yarın dikkatli plan iyi olur”.
- Kaçınılan: “çöktü”, “kriz”, “başarısız”, raw enum, skor dili.

### Day / access safety

- Eksik `teamSpecialization`, assignment veya vehicle maintenance summary crash üretmez; selector’lar güvenli `undefined` döner.

### Bilinçli olarak eklenmeyenler

- Yeni route, team detail ekranı, bireysel personel uzmanlığı ve payroll/maliyet sistemi eklenmedi.
- SAVE_VERSION 26, migration ve persist shape değiştirilmedi.
- Release candidate manual blocker’lar fake PASS yapılmadı; `verifiedEvidence = 0` korunur.

## Stabilization notes

- `HubReferenceHome` typecheck repair: barrel export çakışması giderildi; conditional style dizileri `undefined` fallback ile güvenli hale getirildi.
- Hub/Report/Map: Day 8+ max 1 compact line; duplicate guard aynı gün tekrar satır üretmez.
- Hub compact progression chip yoğunluğu: authority/district + badge en fazla 2 insight.
- Assignment hint `EventAssignmentPanel` dispatch preview’ına bağlandı.
- Release candidate manual blocker’lar değiştirilmedi; `verifiedEvidence = 0` korunur.

## Gelecek aşamalar

- Team detail screen
- Advanced fatigue recovery
- Team-based story chains
- Team specialization notification
- Live-ops team modifiers
