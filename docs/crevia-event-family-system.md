# Crevia Event Family System

## 1. Amaç

Crevia'da olaylar tekil tekrar eden içerikler değil, family + variant yapısında yönetilir. Bu doküman Aşama 1 foundation kapsamını anlatır.

## 2. Neden gerekli?

- Sıkılmayı azaltır.
- Mahalle kimliğini güçlendirir.
- Oyuncu kararlarının ertesi güne taşınmasını sağlar.
- Ece, rapor, sosyal nabız ve harita echo sistemlerini bağlar.
- Açık uçlu progression için içerik tazeliği sağlar.

## 3. Event family nedir?

Event family, aynı operasyon temasının farklı koşullarda kullanılabilecek varyant kümesidir. Örnek: Sanayi araç/rota baskısı family'si standart, kaynak yorgunluğu, oyuncu tarzına göre, kriz eşiği ve recovery varyantlarını taşıyabilir.

## 4. Variant türleri

- `normal`: Standart durum.
- `improved`: Önceki kararlar veya iyi kaynak dengesiyle iyileşmiş durum.
- `worsened`: Gecikme veya kaynak baskısıyla zorlaşmış durum.
- `carry_over`: Kararın ertesi güne taşınan izi.
- `crisis_adjacent`: Kriz eşiğine yaklaşan ama runtime kriz sistemi olmayan içerik.
- `player_adaptive`: Oyuncu karar tarzına göre ağırlıklandırılabilecek varyant.
- `resource_fatigue`: Araç, ekip veya konteyner yorgunluğu sinyali.
- `district_trust`: Mahalle güveni sinyali.
- `reward`: Pozitif sonuç görünürlüğü.
- `comeback`: Toparlanma fırsatı.
- `recovery`: İyileştirme veya kaynak toparlanması.
- `operation_era`: Uzun vadeli operasyon dönemi teması.

## 5. Echo surfaces

- Ece
- Rapor
- Sosyal Nabız
- Harita
- Yarın preview
- Operasyon sonucu
- Mahalle hafızası
- Hub

## 6. Quality scoring

100 puanlık foundation skoru:

- Concrete domain/district bağlamı: 20
- Variant coverage: 20
- Echo surface completeness: 20
- Carry-over/reward/recovery support: 15
- Duplicate guard metadata: 10
- Mobile readability: 10
- Forbidden copy safety: 5

## 7. Duplicate/freshness guard

Foundation duplicate signature; domain, mahalle, quality tag, duplicate guard tag, variant kind ve başlık anahtar kelimelerini bir araya getirir. Amaç aynı family/domain/district/echo tekrarlarını seçim motoruna geçmeden önce görünür kılmaktır.

## 8. Rank permission bağlantısı

Event family rotation, mini story chain, player-adaptive event, reward/comeback event ve operation era preview permission'ları ileride bu sisteme bağlanır. Bu patch rank permission runtime davranışını değiştirmez ve import cycle yaratmaz.

## 9. Bu patchin sınırları

- Runtime generation değişmez.
- Yeni event pack yok.
- Gameplay gating yok.
- Persist yok.
- SAVE_VERSION yok.
- UI redesign yok.

## 10. Sonraki patch bağlantıları

- Event Family Selection Engine
- District Trust Level System
- Mini Story Chain Runtime
- Player-Adaptive Event Weighting
- Content Production Pipeline
