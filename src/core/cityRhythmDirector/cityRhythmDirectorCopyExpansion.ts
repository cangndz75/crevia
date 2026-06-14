import type { CityRhythmKind } from './cityRhythmDirectorTypes';

export const CITY_RHYTHM_COPY_EXPANSION: Partial<Record<CityRhythmKind, string[]>> = {
  calm_watch_day: [
    'Sehir bugun dusuk tempoda; en net sinyali izlemek yeterli olabilir.',
    'Her dalga operasyon istemiyor; sakin okuma da bugun strateji sayilir.',
    'Kapasiteyi koruyarak ilerlemek, yarin icin daha temiz bir alan birakir.',
    'Dusuk yogunlukta tek bir net iz, daginik hamlelerden daha degerli.',
    'Bugun acele etmeden tabloyu okumak, sonraki gun kararini kolaylastirir.',
  ],
  strategic_pressure_day: [
    'Birkac baski ayni anda gorunur; oncelik sirasi bugun kritik.',
    'Kaynak, mahalle ve rota sinyalleri birlikte okunmali.',
    'Bugunun ritmi hangi sinyali erteleyecegini de belirleyecek.',
    'Tek hamle yetmeyebilir; once en yuksek etkiyi sec, sonra takip et.',
    'Baski gunlerinde net odak, daginik mudahaleden daha guvenli sonuc verir.',
  ],
  recovery_window_day: [
    'Toparlanma firsati kisa sure acik; kucuk hamle yeterli olabilir.',
    'Sehir sadece risk degil, iyiye donus penceresi de gosteriyor.',
    'Dusuk maliyetli takip, bu bolgede olumlu iz birakabilir.',
    'Iyilesme sinyali buyumeden okumak, yarinin yukunu hafifletir.',
    'Bugun firsati kacirmamak, sonraki gun daha sakin ilerlemeyi saglar.',
  ],
  neglect_attention_day: [
    'Bir mahalle bugun daha dikkatli okunmak istiyor.',
    'Ertelenen bolge sinyali gunun ritmini etkiliyor.',
    'Mahalle takibi bugun stratejik oncelik haline gelebilir.',
    'Kisa bir kontrol, biriken sinyali daha okunur hale getirebilir.',
    'Bu bolgeyi bugun not almak, yarin daha net karar vermene yardim eder.',
  ],
  resource_strain_day: [
    'Kaynak ve rota yuku bugunun kararini belirginlestiriyor.',
    'Kapasiteyi dogru yere koymak bugun kritik.',
    'Arac, ekip ve butce sinyali birlikte okunmali.',
    'Pahali gorunen secim, yarin daha az yuk birakabilir.',
    'Kaynak sikisikliginde siralama, hizdan daha onemli olabilir.',
  ],
  social_trust_day: [
    'Sosyal guven hassasiyeti bugunun ritmini belirliyor.',
    'Gorunur ve sakin takip, guven etkisini yumusatabilir.',
    'Vatandas nabzi operasyon kararina eslik ediyor.',
    'Kucuk iletisim hamlesi, buyuk mudahaleden once degerli olabilir.',
    'Bu bolgede ton ve tempo, sonucu dogrudan etkileyebilir.',
  ],
  memory_echo_day: [
    'Sehir hafizasi bugun eski izleri yeniden one cikariyor.',
    'Bugunku karar, onceki izlerle birlikte okunmali.',
    'Hafiza izi bugunun onceligini sekillendiriyor.',
    'Gecmis secimlerin yankisi, bugunku tabloya baglaniyor.',
    'Bu izi takip etmek, sonraki gun daha tutarli karar saglar.',
  ],
  follow_up_day: [
    'Kucuk takip hamleleri bugun ana karar kadar degerli olabilir.',
    'Her ilerleme buyuk operasyon istemez; dogru takip yeterli.',
    'Takip aksiyonu gunun ritmini sakinlestirebilir.',
    'Dunku izi bugun netlestirmek, yarin icin temiz bir baslangic verir.',
    'Dusuk maliyetli devam, sehir hafizasinda olumlu gorunur.',
  ],
  mixed_city_day: [
    'Sehir tek sinyal degil, karisik bir gundem gosteriyor.',
    'Risk, hafiza ve firsati birlikte okumak gerekiyor.',
    'Bugunun ritmi dengeli ama dikkat istiyor.',
    'Birden fazla iz ayni anda gorunur; once en net olani sec.',
    'Karisik gunde tek odak, daginik hamleden daha okunur ilerleme saglar.',
  ],
  fallback: [
    'Yeterli ritim kaynagi yok; guvenli izleme oneriliyor.',
    'Sehir yeni fazda; ilk sinyali sakin okumak yeterli.',
    'Dusuk veriyle gunun ritmi guvenli sekilde kuruluyor.',
    'Net sinyal gelene kadar kapasiteyi korumak mantikli.',
    'Ilk okuma tamamlaninca oncelik daha belirgin hale gelecek.',
  ],
};
