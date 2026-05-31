# Crevia — Gerçek Oyuncu Akışı Playtest Kontrol Listesi

## Amaç

Bu belge, Crevia’nın **First 10 Minutes**, **Operational Resources**, **kriz hamleleri**, **post-pilot monetization gate** ve **Ana Operasyon** yüzeylerinin gerçek cihazda sistematik test edilmesi içindir. Otomatik denetim için:

```bash
npm run verify:player-flow-audit
```

## Test cihazları

- **iOS** — küçük ekran (ör. iPhone SE / mini sınıfı)
- **Android** — orta segment, 6–6.5"
- **Tablet (isteğe bağlı)** — metin taşması kontrolü

Her oturumda: temiz kurulum veya bilinçli devam kaydı; ekran kaydı önerilir (araç henüz üründe yok).

## Test profilleri

### 1. Yeni oyuncu

- Crevia’yı ilk kez açan kişi
- **Başarı:** İlk 10 dakikada plan → olay → atama → sonuç → rapor akışını tek cümleyle anlatır

### 2. Strateji oyuncusu

- Trade-off ve neden-sonuç okumayı sever
- **Başarı:** Rapor ve Ece satırlarından “bugünkü etki” ve “yarınki risk” çıkarır

### 3. Hızlı mobil oyuncu

- Metinleri hızlı geçer, CTA’ya güvenir
- **Başarı:** Yanlış ekrana gitmeden ana CTA’yı bulur

### 4. Karışıklık testi

- “Şimdi ne yapmalıyım?” diye sorulur; 5 saniye süre verilir
- **Başarı:** Hub’da Planı Onayla / operasyon CTA’sını işaret eder

---

## Day 1 — İlk oturum (ilk 10 dakika)

**Hedef:** Temel döngü anlaşılır; gelişmiş sistemler gürültü yapmaz.

| Adım | Ne izlenir | Geçti | Başarısızlık sinyali |
|------|------------|-------|----------------------|
| Hub açılışı | ≤ 2 featured kart | 8 sn içinde ana CTA | 4+ kart, kaybolma |
| Ece | Kısa metin | Okunabilir veya bilinçli atlama | “Çok uzun” |
| Günlük plan | Önerilen plan | Onay gerekçesi söylenir | Rastgele onay |
| Plan düzenleme | Kapalı + not | Not fark edilir | Editör aranır |
| Atama | Önerilen atama | ≤ 30 sn | Editörde takılma |
| Micro / Kriz / Sezon | Gizli | Fark edilmez / aranmaz | Yanlışlıkla görünür |
| Saha kaynakları | Gizli/minimum | Rahatsız etmez | Korku / karmaşa |
| Rapor | Kısa, eğitici | CTA ile döner | Uzun liste |
| Rapor CTA | Operasyon Merkezine Dön | Tek net çıkış | Belirsiz |

---

## Day 2–3 — Pekiştirme ve genişleme

**Day 2:** Operasyon sinyalleri, compact Saha Kaynakları, Ece’de en fazla tek kaynak satırı; kriz yok.

**Day 3:** MicroDecision eligible ama spam değil; Kaynakları Gör sheet; harita kaynak overlay (baskı varsa); atama editörü bulunabilir.

| Sinyal | Geçti | Başarısızlık |
|--------|-------|--------------|
| Hub yoğunluğu | Kontrollü | “Çok kart” |
| Harita baskısı | Mahalle ayırt edilir | Gürültü |
| Canlı karar | Anlamlı seçim | Spam / anlamsız |

---

## Day 7 — Pilot kapanışı

| Kontrol | Geçti | Başarısızlık |
|---------|-------|--------------|
| Pilot completion kartı net | “Pilot bitti” denir | Belirsiz geçiş |
| Ana Operasyon CTA | Tek hedef | Çoklu eşit CTA |
| Yetki/rozet | Completion’ı gölgelemez | Hero kaybolur |
| Yasaklı kelime yok | XP/premium/satın al/kilitli yok | Oyuncu dili kırılır |

---

## Post-pilot teklif

| Kontrol | Geçti | Başarısızlık |
|---------|-------|--------------|
| Full değer önerisi (mahalle, sezon, kriz, kaynak, canlı karar, rapor) | ≥ 2 fark söylenir | Fark anlaşılmaz |
| Sınırlı gündem net | Kapsam dar hissi | Full sanılır |
| Mock/dev metni yok | Temiz UI | “mock” görünür |

---

## Gün 8 — Sınırlı vs Ana Operasyon

| Mod | Beklenen | Başarısızlık |
|-----|----------|--------------|
| **Sınırlı** | main_operation_light; kriz hamlesi yok; harita ≤ 1 uyarı satırı | Full sanılır |
| **Full** | Sezon kartı, kaynaklar, kriz masası (context), daha yüksek olay yoğunluğu | Limited ile aynı |

---

## Kriz test senaryosu (full)

1. Hub kriz masası risk gösterir
2. Kriz hamlesi sheet — 5 seçenek, kısa trade-off
3. Ece tek satır öneri
4. Haritada kriz, kaynaktan öncelikli (amber > mint)
5. Rapor hamleyi yansıtır (max 3 satır)

**Başarısızlık:** Spam, çelişkili rapor, boş CTA

---

## Saha kaynakları test senaryosu

1. Hub kart ≤ 3 satır
2. **Kaynakları Gör** → Ekipler / Araçlar / Konteyner
3. Day 1’de sheet yok
4. Harita overlay anlamlı (Day 3+, baskı varsa)

---

## Rapor okunabilirlik testi

Oyuncudan istenen tek cümle: *“Bugün operasyonu nasıl etkiledim?”*

| Mesaj | Geçti | Başarısızlık |
|-------|-------|--------------|
| Bugünkü ana etki | Anlatılır | Sistem listesi |
| Trade-off | Strateji oyuncusu fark eder | “Etki yok” |
| Yarınki odak | Bulunur | Belirsiz yarın |

---

## Gözlem formu (oturum başına)

| Alan | Değer |
|------|--------|
| Tarih / build | |
| Profil (yeni / strateji / hızlı / karışıklık) | |
| Cihaz | |
| Day 1 ana CTA süresi (sn) | |
| Ece okundu mu? | evet / hayır / kısmen |
| Plan onay gerekçesi (alıntı) | |
| Atama duraksama? | evet / hayır |
| Rapor okundu mu? | evet / atlandı |
| Day 7 full/limited farkı (alıntı) | |
| Harita kriz vs kaynak | ayırt etti / karıştı |
| Kriz hamlesi seçimi + gerekçe | |
| Genel skor (1–5) | |
| Notlar | |

---

## Başarısızlık sinyalleri (öncelik)

1. **Kritik:** Day 1’de kriz/micro/sezon görünür; fake CTA; yasaklı kelime; otomatik audit FAIL
2. **Yüksek:** 5 sn’de ana CTA bulunamıyor; pilot bitişi belirsiz; full/limited farkı anlaşılmıyor
3. **Orta:** Rapor okunmuyor; harita gürültülü; Ece çok konuşuyor
4. **Düşük:** Kozmetik metin taşması; sekme sırası tercihi

## Düzeltme önceliği

1. FAIL otomatik kontroller → patch önce
2. Kritik manuel sinyaller → UX/copy
3. WARN (insan playtest bekliyor) → planlı playtest oturumu
4. Analytics / kayıt entegrasyonu → sonraki aşama

---

*Son güncelleme: Player Flow Audit Aşama 1 — `verify:player-flow-audit`*
