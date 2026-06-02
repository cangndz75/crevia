# Crevia District Trust System

## 1. Amaç

Mahalleler sadece isim değil, oyuncuyla ilişki ve güven seviyesi taşıyan yaşayan bölgeler olur. Aşama 1 bu ilişkiyi derived-only foundation olarak kurar.

## 2. District trust nedir?

District trust uzun vadeli mahalle güveni ve ilişki göstergesidir.

Social pulse'dan farkı:

- Social pulse günlük anlık nabızdır.
- District trust daha uzun vadeli ilişki ve itibar göstergesidir.

## 3. Trust levels

- Kırılgan
- İzlemede
- Dengeli
- Güvenli
- Güveniyor
- Destekleyici

## 4. Trust trend

- Düşüyor
- Baskıda
- Sabit
- İyileşiyor
- Toparlanıyor

## 5. Derived-only yaklaşımı

Bu patch trust'ı persist etmez. Mevcut district identity, operation signals, social pulse, recent event, carry-over, resource fatigue, crisis state ve report summary sinyallerinden türetir.

## 6. Memory trace

Memory trace kalıcı state değildir; mevcut sinyallerden kısa hafıza satırı üretir. Kalıcı şehir hafızası ileride ayrı patch konusudur.

## 7. Rank permission bağlantısı

- `district_trust_preview`
- `district_memory_trace_preview`
- `district_specific_operations_preview`

## 8. Event family bağlantısı

- `district_trust variant`
- `district_memory echo`
- `district_trust_low/high trigger`

## 9. Map/Social/Report bağlantısı

Foundation helper'ları compact chip ve kısa memory line üretebilir. Bu patchte mevcut Map, Social veya Report layout'una yeni büyük kart eklenmez.

## 10. Bu patchin sınırları

- SAVE_VERSION yok
- Persist yok
- event generation yok
- applyDecision yok
- gameplay scoring yok
- UI redesign yok

## 11. Sonraki patch bağlantıları

- District-Specific Operations
- Map Layer Unlock System
- Event Family Selection Engine
- City Development System
- Persistent District Trust State, ileride gerekirse
