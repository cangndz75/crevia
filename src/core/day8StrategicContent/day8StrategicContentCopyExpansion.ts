import type { Day8StrategicContentKind } from './day8StrategicContentTypes';

export const DAY8_STRATEGIC_CONTENT_COPY_EXPANSION: Partial<
  Record<Day8StrategicContentKind, string[]>
> = {
  strategic_operation_focus: [
    'Bugunun stratejik odagi, hangi sinyali once okuyacagini belirler.',
    'Ana karar artik tek olay degil; sehirdeki oncelik sirasidir.',
    'Kaynak, mahalle ve takip izleri birlikte okunmadan net sonuc zor.',
    'Day 8 sonrasi oncelik secimi, operasyon kadar karar vericidir.',
  ],
  district_neglect_focus: [
    'Bu mahallede ertelenen sinyal stratejik oncelik isteyebilir.',
    'Bolgeyi uzun sure pas gecmek yarin baskiyi artirabilir.',
    'Mahalleyi bugun okumak, sonraki gun yukunu azaltabilir.',
    'Kisa bir mahalle kontrolu, biriken sinyali daha gorunur yapar.',
  ],
  district_recovery_focus: [
    'Bu mahallede toparlanma firsati stratejik deger tasiyor.',
    'Kucuk takip hamlesi bolgeyi yeniden dengeleyebilir.',
    'Risk kadar toparlanma penceresini okumak onemli.',
    'Iyilesme sinyali dusuk maliyetle korunabilir.',
  ],
  resource_pressure_focus: [
    'Kaynak baskisi kararin gercek maliyetini belirliyor.',
    'Bugun pahali gorunen secim, yarin yuku azaltabilir.',
    'Kaynaklari korumak degil, dogru yere koymak onemli.',
    'Kapasite dagilimi bugunun stratejik sinirini cizer.',
  ],
  route_pressure_focus: [
    'Rota hatti bugunun stratejik kararini etkiliyor.',
    'Arac ve ekip yukunu erken okumak yarin baskiyi azaltabilir.',
    'Bu bolgedeki rota sinyali sehir akisini etkiler.',
    'Ulasim baskisi kucuk gorunse de gunun onceligini degistirir.',
  ],
  container_pressure_focus: [
    'Konteyner hatti tek nokta degil, bolge etkisi yaratiyor.',
    'Cevre baskisi buyumeden hatti birlikte okumak iyi olur.',
    'Bu sinyal kucuk gorunse de mahalle algisini etkileyebilir.',
    'Hat izleme, lojistik maliyetini erken gorunur kilar.',
  ],
  social_trust_focus: [
    'Guven hassasiyeti bu karari daha stratejik hale getiriyor.',
    'Sosyal nabzi dogru okumak, operasyon etkisini yumusatabilir.',
    'Bu bolgede gorunur takip guveni koruyabilir.',
    'Iletisim tonu, bugunku oncelik seciminde belirleyici olabilir.',
  ],
  memory_trace_focus: [
    'Sehir hafizasi bu kararin arkasindaki izi gosteriyor.',
    'Bugunku secim, onceki izlerle birlikte okunmali.',
    'Bu sinyal tek gunluk degil; sehir hafizasinda karsiligi var.',
    'Hafiza izi, sonraki gun onceligini sekillendirebilir.',
  ],
  follow_up_focus: [
    'Kucuk takip hamlesi bugun ana operasyon kadar degerli olabilir.',
    'Her cozum buyuk operasyon istemez; dogru takip yeterlidir.',
    'Bu aksiyon yarin kararini daha net hale getirebilir.',
    'Dusuk maliyetli devam, stratejik odagi guclendirir.',
  ],
  positive_comeback_focus: [
    'Bugun sadece risk degil, olumlu donus firsati da var.',
    'Dogru hamle sehirde kucuk ama degerli iyilesme yaratabilir.',
    'Bu firsat dusuk maliyetle olumlu iz birakabilir.',
    'Toparlanma penceresi kapanmadan stratejik not almak iyi olur.',
  ],
  defer_risk_focus: [
    'Erteledigin sinyal yarin onceligi degistirebilir.',
    'Bugun pas gectigin konu kaybolmaz; sehir tekrar hatirlatir.',
    'Bu sinyali izlemeye almak yarin baskiyi daha okunur yapar.',
    'Erteleme maliyeti bugunun stratejik tablosuna da yazilir.',
  ],
  map_priority_focus: [
    'Haritadaki iz, kararin sehirde nerede karsilik buldugunu gosterir.',
    'Bu bolgeyi haritada okumak onceligi netlestirir.',
    'Konum, kaynak ve mahalle sinyali burada birlesiyor.',
    'Harita yogunlugu, bugunun stratejik sirasini belirleyebilir.',
  ],
  authority_explanation_focus: [
    'Yetki aciklamasi bugunku onceligi daha net okumani saglar.',
    'Acik kaynakli oncelik, kararin maliyetini daha gorunur kilar.',
    'Stratejik odak, yetkiyle birlikte daha okunur hale gelir.',
    'Yeni yetki alani, bugunun karar sinirini genisletiyor.',
  ],
  safe_watch_focus: [
    'Bu sinyal izleme modunda kalabilir.',
    'Kapasiteyi koruyup en net onceligi secmek daha dogru olabilir.',
    'Sehir sakin degil; ama bugun her sinyal operasyon istemiyor.',
    'Guvenli izleme, yarin icin daha temiz bir karar alani birakir.',
  ],
  fallback: [
    'Day 8+ odagi icin yeterli kaynak yok; guvenli izleme oneriliyor.',
    'Stratejik sinyaller sinirli; en net onceligi sakin belirle.',
    'Sehir yeni faza geciyor; ilk okuma tamamlaninca odak netlesir.',
    'Dusuk veriyle stratejik tablo kuruluyor; acele etme.',
  ],
};
