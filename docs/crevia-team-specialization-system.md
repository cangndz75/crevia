# Crevia Team Specialization System

## 1. Amaç

Ekipler sadece kaynak sayısı değil, operasyon türüne göre uzmanlık taşıyan gruplardır. Bu patch, mevcut personel/operational resources ve assignment mantığını bozmadan presentation-level fit/preview modeli kurar.

## 2. Ne değildir?

- Bu foundation **tekil personel sistemi değildir** — bireysel personel kartı veya envanter yoktur.
- Personel kart koleksiyonu değildir.
- Yeni gameplay scoring değildir — assignment score/effects değişmez.
- **Persisted staff state değildir** — yeni state kaydedilmez.

## 3. Uzman ekipler

| Ekip | Odak |
| --- | --- |
| Saha Ekibi | Hızlı müdahale, saha uygulaması |
| Teknik Ekip | Bakım, konteyner ağı, kaynak toparlanması |
| Halk İletişim Ekibi | Sosyal güven, mahalle algısı |
| Rota Destek Ekibi | Rota disiplini, aktif görev rotası |
| Kriz Destek Ekibi | Kriz koordinasyonu, toparlanma |
| Konteyner Ağı Ekibi | Konteyner ağı, çevre hassasiyeti |

## 4. Uzmanlık domainleri

`container`, `vehicle_route`, `personnel`, `social`, `crisis`, `district_balance`, `resource_recovery`, `public_trust`, `environmental_care`, `generic_operation`

## 5. Assignment bağlantısı

Assignment context (`personnelType`, `vehicleType`, `approachType`) specialization group’a map edilir. Fit score presentation-only üretilir; assignment engine scoring değişmez.

## 6. District operation bağlantısı

`DistrictOperationCandidate` impact domain ve kind bilgisi ekip uzmanlığı score’una sinyal verir. District operations behavior değiştirilmez.

## 7. Active route bağlantısı

Aktif görev rotasının domain ve pressure bilgisi rota destek ve saha ekiplerinin fit skorunu etkiler. Active task route engine değiştirilmez.

## 8. Event family bağlantısı

Event family domain sinyalleri uzmanlık domain eşleşmesine katkı verir. Event generation değişmez.

## 9. Operational resources bağlantısı

Mevcut personel morale/workload/fatigue context’i pressure warning üretir. Operational resources engine değiştirilmez.

## 10. Bu patchin sınırları

- **SAVE_VERSION yok**
- **Persist yok**
- Assignment engine değişmez
- applyDecision değişmez
- Gameplay effect yok
- UI redesign yok

## 11. Sonraki patch bağlantıları

- Vehicle Maintenance Window System
- Container Network Upgrade System
- Individual Personnel System v2
- Personnel Training / Certification
- Team Specialization UI Polish

Individual Personnel System v2 bu foundation üzerine bireysel personel katmanı ekleyecektir.
