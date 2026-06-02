# Crevia Map Layer Unlock System

## 1. Amaç

Harita katmanları oyuncunun operasyon kariyeri ilerledikçe açılır. Bu patch, hangi katmanın aktif, açık, sırada, yetkiyle açılır veya future olduğunu presentation seviyesinde hesaplayan foundation kurar.

## 2. Neden gerekli?

- Harita progression ödülü olur.
- Mahalle güveni ve hafıza izi görünür olur.
- Kaynak, sosyal, kriz, rota ve operation era sinyalleri tek harita sisteminde toplanır.
- Açık uçlu operasyon kariyerini görsel hale getirir.

## 3. Layer listesi

| id | Ad | Kategori | Unlock ekseni | Örnek kullanım |
| --- | --- | --- | --- | --- |
| `base_districts` | Temel Mahalle Görünümü | base | day | Şehir haritasının ana görünümü |
| `district_identity` | Mahalle Kimliği | district | day | Mahalle karakter ve risk odağı |
| `resource_pressure` | Kaynak Baskısı | resource | rank_permission | Araç/personel/konteyner baskısı |
| `resource_fatigue` | Kaynak Yorgunluğu | resource | resource_stability | Bakım ve kapasite sinyali |
| `social_pulse` | Sosyal Nabız | social | rank_permission | Mahalle algısı ve sosyal gündem |
| `crisis_watch` | Kriz İzleme | crisis | crisis_state | Risk eşiği izleme |
| `district_trust` | Mahalle Güveni | district | district_trust | Uzun vadeli güven trendi |
| `district_memory` | Mahalle Hafıza İzi | district | district_trust | Önceki karar izleri |
| `active_task_route` | Aktif Görev Rotası | route | rank_permission | Future route foundation |
| `event_family_signal` | Olay Ailesi Sinyali | event_content | rank_permission | Event family foundation sinyali |
| `operation_era` | Operasyon Dönemi | progression | operation_era | Uzun vadeli operasyon teması |
| `city_development` | Şehir Gelişimi | city_growth | future_system | Future şehir gelişimi katmanı |

## 4. Rank permission bağlantısı

- `map_resource_layer`
- `map_social_layer`
- `map_crisis_layer`
- `map_trust_layer`
- `district_trust_preview`
- `district_memory_trace_preview`

## 5. Day visibility

- Day 1: temel mahalle ve mahalle kimliği.
- Day 2: kaynak katmanları preview olabilir.
- Day 3: kaynak baskısı ve aktif görev rotası yetki/context varsa görünür.
- Day 4: sosyal nabız, mahalle güveni ve hafıza izi görünür hale gelebilir.
- Day 5+: kriz izleme ilgili context varsa öne çıkar.
- Day 8+: event family ve operation era preview olabilir.

## 6. District Trust bağlantısı

Mahalle Güveni ve Mahalle Hafıza İzi layerları derived-only District Trust foundation ile uyumludur. Bu patch district trust state persist etmez.

## 7. Event Family bağlantısı

Olay Ailesi Sinyali future/foundation layer olarak event family schema ile bağlanır. Runtime event selection yok.

## 8. Active Task Route bağlantısı

Aktif Görev Rotası gerçek route simülasyonu değildir. Pathfinding veya route algorithm eklenmez; yalnızca future/foundation layer olarak tanımlanır.

## 9. Bu patchin sınırları

- SAVE_VERSION yok
- Persist yok
- Gameplay scoring yok
- Event generation yok
- Real route algorithm yok
- UI redesign yok

## 10. Sonraki patch bağlantıları

- Active Task Route System
- District-Specific Operations
- Map Layer UI Polish
- Event Family Selection Engine
- City Development Map Layer
