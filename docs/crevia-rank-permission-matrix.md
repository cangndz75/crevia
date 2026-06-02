# Crevia Rank Permission Matrix

## Amaç

Ünvanlar sadece kozmetik değildir. Her ünvan oyuncuya operasyon kariyerinde yeni yetki, kapsam veya preview açılımı verdiğini anlatır.

## Progression eksenleri

- XP
- Authority
- Rank / Ünvan
- Resource stability
- District trust
- Crisis control
- Operation era

## Rank listesi

| Rank | Oyuncuya verdiği his | Açılan kategoriler | Örnek permissionlar |
| --- | --- | --- | --- |
| Saha Gözlemcisi | Temel olayları okuma | Operasyon | Temel Olay İnceleme |
| Operasyon Asistanı | Günlük plan desteği | Planlama, Ece | Günlük Plan Önizlemesi, Ece notları |
| Saha Koordinatörü | Atama ve kaynak görünürlüğü | Yönlendirme, Kaynak | Atama Uyumu, Kaynak Baskısı |
| Bölge Sorumlusu | Mahalle güveni ve hafıza | Mahalle | Mahalle Güveni, Hafıza İzi |
| Operasyon Sorumlusu | Kriz ve bakım pencereleri | Kriz, Kaynak | Kriz Katmanı, Ekip Uzmanlığı, Araç Bakımı |
| Şehir Operasyon Yöneticisi | Harita ve olay ailesi kapsamı | Harita Katmanı, Olay İçeriği | Kaynak Katmanı, Sosyal Katman, Olay Ailesi |
| Strateji Koordinatörü | Operation era ve adaptif içerik | Operasyon Dönemi, Olay İçeriği | Operation Era, Adaptif Olay, Toparlanma Olayı |
| Baş Operasyon Direktörü | Şehir gelişimi ve departman yönetimi | Şehir Gelişimi | Şehir Gelişimi, Departmanlar |

## Permission kategorileri

- Operasyon
- Planlama
- Yönlendirme
- Harita Katmanı
- Mahalle
- Kaynak
- Kriz
- Ece
- Olay İçeriği
- Operasyon Dönemi
- Şehir Gelişimi

## Preview-only yaklaşımı

Bu patch gerçek gameplay gating yapmaz. Matrix, oyuncuya mevcut ünvanla görünen açılımları ve bir sonraki ünvanda gündeme gelecek 1-3 açılımı gösteren deterministic presentation foundation sağlar.

## Sonraki patch bağlantıları

- Event Family Core Schema
- District Trust Level System
- Map Layer Unlock System
- Team Specialization
- Vehicle Maintenance Window
- Container Network Upgrade
- Operation Era Runtime
- City Development System

## Kısıtlar

- SAVE_VERSION yok
- Persist yok
- Authority engine refactor yok
- UI redesign yok
- Analytics, IAP veya navigation contract değişmez
