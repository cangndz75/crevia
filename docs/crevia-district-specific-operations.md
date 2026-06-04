# Crevia District-Specific Operations

## 1. Amaç

Her mahalle kendi kimliğine, güven durumuna, event family sinyallerine, kaynak baskısına ve rank permission açılımlarına göre özel operasyon adayları/preview modeli üretir. Bu patch runtime operasyon aktivasyonu yapmaz; yalnızca deterministic foundation kurar.

## 2. Neden gerekli?

- Mahalleler daha canlı ve ayırt edilebilir olur.
- District trust anlam kazanır; düşük güvende recovery, yüksek güvende görünür hizmet önerileri doğal bağlanır.
- Event family ve mini chain sistemlerine bölgesel hedef verir.
- Harita, aktif rota ve rapor sistemleri aynı mahalle hedefinde birleşir.
- Açık uçlu progression’a bölgesel operasyon hedefleri ekler.

## 3. Mahalle özel operasyonları nedir?

Mahalle özel operasyonları, belirli bir mahalle kimliğine bağlı operasyon adaylarıdır. Örnekler:

- **Sanayi Rota Disiplini** — vardiya, rota ve araç baskısını dengeleme
- **Cumhuriyet Güven Toparlama** — şikayet sonrası sosyal güven recovery
- **Yeşilvadi Çevre Bakım Odağı** — çevre hassasiyeti ve sakin tempo

## 4. Mahalle kimlikleri

| Mahalle | Odak |
| --- | --- |
| Merkez | Görünür hizmet, prestij, kamu alanı baskısı |
| Cumhuriyet | Konut düzeni, aileler, okul çevresi, sosyal güven |
| Sanayi | Rota, vardiya, filo verimliliği, araç baskısı |
| İstasyon | Geçiş yoğunluğu, akşam trafiği, sosyal akış |
| Yeşilvadi | Çevre, bakım, sakinlik, önleyici tempo |

## 5. Operation kinds

| Kind | Açıklama |
| --- | --- |
| `visible_service` | Görünür hizmet ve prestij odağı |
| `route_discipline` | Rota disiplini ve akış yönetimi |
| `container_network` | Konteyner ağı düzeni |
| `public_trust` | Halk güveni ve sosyal algı |
| `recovery_focus` | Güven toparlama / recovery |
| `crisis_prevention` | Kriz önleme ve risk izleme |
| `resource_balance` | Personel/araç kaynak dengesi |
| `environmental_care` | Çevre bakım odağı |
| `district_memory_response` | Mahalle hafıza izine yanıt |
| `operation_era_special` | Operasyon dönemi özel içerik |

## 6. District trust bağlantısı

District trust derived-only foundation ile uyumludur:

- Düşük güven (`fragile`, `watch`) + `recovery_focus` → önerilen operasyon
- Yüksek güven (`stable`, `trusted`, `supportive`) + `visible_service` / `public_trust` → hazır/önerilen
- Mahalle hafıza izleri (`repeated_pressure`, `resource_strain`) eligibility sinyali verir

Bu patch district trust scoring veya persist değiştirmez.

## 7. Event family bağlantısı

Her operasyon `relatedEventFamilyDomains` ile event family domainlerine bağlanır (`social`, `vehicle_route`, `container`, `crisis_adjacent`, vb.). Context’te event family sinyali varsa readiness score ve status yükselir. Runtime event selection yok.

## 8. Map layer / active route bağlantısı

`relatedMapLayerIds` harita katmanlarıyla uyumludur:

- `district_trust`, `district_memory`, `resource_pressure`, `social_pulse`, `crisis_watch`, `active_task_route`

Aktif görev rotasının `targetDistrictId` değeri operasyon mahallesiyle eşleşirse priority ve readiness artar. Active task route engine değiştirilmez.

## 9. Rank permission bağlantısı

String-level uyum:

- `district_specific_operations_preview` — ana preview permission
- `district_trust_preview` — güven sinyali
- `district_memory_trace_preview` — hafıza izi
- `map_trust_layer`, `active_task_route`, `event_family_rotation_preview`

Rank permission matrix dosyaları bu patchte değiştirilmez.

## 10. Bu patchin sınırları

- **runtime activation yok** — operasyon başlatma/uygulama yok
- **Gameplay scoring yok** — reward/penalty eklenmez
- **Event generation yok** — `ensureDailyEventsForDay` değişmez
- **Persist yok** — yeni state kaydedilmez
- **SAVE_VERSION yok** — save version artırılmaz
- **UI redesign yok** — büyük kart/screen eklenmez
- **applyDecision / dayPipeline değişmez**

## 10.1. Aşama 2 sınırlı activation

Aşama 2, foundation operasyonlarını tam event flow’a bağlamadan küçük selectable action olarak açar:

- Day 1 gizli, Day 2-3 preview, Day 4+ seçilebilir.
- Günde en fazla 1 mahalle hamlesi seçilir.
- Seçim sonucu küçük operation signal delta üretir ve priority district odağını günceller.
- Hub, Map ve end-of-day Report bağlanır; Report en fazla 1 action summary satırı gösterir.
- Persist shape değişmez ve SAVE_VERSION 23 kalır.
- Runtime event generation, `applyDecision`, day pipeline ve event variant/freshness runtime değiştirilmez.

## 11. Sonraki patch bağlantıları

- District Operation UI Preview
- Event Family Selection Engine
- Team Specialization System MVP
- Vehicle Maintenance Window System
- Container Network Upgrade
- City Development System
