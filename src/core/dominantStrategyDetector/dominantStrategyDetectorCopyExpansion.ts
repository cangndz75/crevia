import type { DominantStrategyPattern } from './dominantStrategyDetectorTypes';

export const DOMINANT_STRATEGY_REFLECTION_LINES: Partial<
  Record<DominantStrategyPattern, string[]>
> = {
  rapid_response_overuse: [
    'Hizli cozumleri sik seciyorsun; sehir ritmi hizli ama yuklu kalabilir.',
    'Acele mudahale aliskanligi gunleri yogun tutuyor.',
    'Hiz onceligi bazen kapasiteyi erken tuketiyor.',
    'Hizli secimler ise yariyor; tempo da yuksek kaliyor.',
  ],
  preventive_overuse: [
    'Onleyici adimlari sik seciyorsun; bugunun gorunur baskisi da onemli.',
    'Yarin odagi guclu; bugunun sinyali de izlenmeli.',
    'Onlem aliskanligi riski erken dusuruyor, gorunurlugu geciktirebilir.',
    'Koruyucu ritim guvenli; bugun de kucuk bir adim degerli.',
  ],
  balanced_default_overuse: [
    'Dengeli secimleri sik kullaniyorsun; bazi gunler net oncelik daha iz birakir.',
    'Guvenli orta yol aliskanligi; tek odak bazen daha okunur.',
    'Denge iyi calisiyor; net oncelik ekstra iz birakabilir.',
    'Sik dengeli secim; bugun tek odak dusunmeye deger.',
  ],
  resource_saving_overuse: [
    'Kaynak koruma egilimin guclu; dusuk maliyetli firsatlar da gorunur kalmali.',
    'Tasarruf ritmi guvenli; kucuk firsatlar kacmasin.',
    'Maliyet kontrolu iyi; toparlanma pencereleri de izlenmeli.',
    'Kaynaklari koruyorsun; dusuk maliyetli hamle de deger yaratabilir.',
  ],
  public_trust_overfocus: [
    'Guven odagini iyi kuruyorsun; rota ve kaynak yuku de gorunur kalmali.',
    'Sosyal hassasiyet guclu; lojistik sinyaller de tabloda.',
    'Guveni koruyorsun; diger eksenler de denge ister.',
    'Iletisim odagi iyi; arac ve konteyner hatlari da izlenmeli.',
  ],
  crisis_priority_overfocus: [
    'Riskleri hizli seciyorsun; kucuk toparlanma firsatlari denge saglayabilir.',
    'Kriz onceligi guclu; dusuk maliyetli iyilesme de degerli.',
    'Risk kapatma iyi; firsat pencereleri de tabloda kalsin.',
    'Acil sinyaller on planda; sakin toparlanma da dusunulebilir.',
  ],
  district_repetition: [
    'Ayni bolgeyi yakin izliyorsun; baska mahalle sessizce birikebilir.',
    'Tek mahalle odagi guclu; cevre sinyalleri de kontrol edilmeli.',
    'Bolge tekrari iyi takip sagliyor; diger izler de gorunur kalmali.',
    'Ayni hat uzerinde kaliyorsun; yeni sinyal de tabloya girebilir.',
  ],
  route_heavy_repetition: [
    'Rota ve arac sinyalleri kararlarinda one cikiyor; sosyal hatlar da izlenmeli.',
    'Ulasim odagi guclu; konteyner ve guven eksenleri de onemli.',
    'Rota ritmi iyi okunuyor; diger domainler denge icin bakilmali.',
    'Arac hatti on planda; mahalle ve sosyal sinyal de tabloda.',
  ],
  social_pressure_avoidance: [
    'Sosyal sinyal gorunuyor ama yanit dusuk kaliyor; kucuk iletisim yarini rahatlatabilir.',
    'Sosyal hat gec okunuyor; kisa adim birikimi onler.',
    'Iletisim adimlari sinirli; kucuk gorunurluk fark yaratabilir.',
    'Sosyal sinyal tabloda; kisa yanit yarin isini kolaylastirir.',
  ],
  recovery_opportunity_neglect: [
    'Riskleri kapatirken toparlanma firsatlari arka planda kaliyor olabilir.',
    'Kriz onceligi guclu; iyilesme pencereleri de degerli.',
    'Risk kapatma iyi; dusuk maliyetli firsat da izlenmeli.',
    'Acil isler bitiyor; toparlanma notu da tabloya girebilir.',
  ],
  inconsistent_switching: [
    'Gundemler hizli degisiyor; tek odak daha okunur ilerleme saglayabilir.',
    'Sik yon degisimi; bugun bir izi sabitlemek faydali olabilir.',
    'Coklu odak; tek oncelik daha net sonuc verebilir.',
    'Hizli gecisler; bugun bir hat secip takip etmek sakinlestirir.',
  ],
  none: [
    'Karar tarzin icin henuz guvenli bir tekrar sinyali yok.',
    'Aliskanlik henuz netlesmedi; biraz daha veri gerekiyor.',
    'Tekrar eden bir ritim gorunmuyor; bu da esneklik saglar.',
    'Tarz sinyali dusuk; serbestce farkli yaklasimlar deneyebilirsin.',
  ],
};

export const DOMINANT_STRATEGY_COUNTER_LINES: Partial<
  Record<DominantStrategyPattern, string[]>
> = {
  rapid_response_overuse: [
    'Hizli cozum ise yariyor; bugun kucuk takip yuku azaltabilir.',
    'Tempoyu bir adim dusurmek kapasiteyi korur.',
    'Kisa izleme, hizli mudahaleden once degerli olabilir.',
    'Acele etmeden tabloyu okumak yarin alan acar.',
  ],
  preventive_overuse: [
    'Yarini rahatlaturken bugunun gorunur sikayeti icin kucuk adim degerli.',
    'Bugune dair kisa kontrol dengeyi tamamlar.',
    'Onlem iyi; bugun de kucuk gorunur hamle dusun.',
    'Koruyucu ritme bugunku sinyal de eklenebilir.',
  ],
  balanced_default_overuse: [
    'Dengeli secim guvenli; bugun tek oncelik daha fazla iz birakabilir.',
    'Orta yol iyi; net bir odak secimi tabloyu netlestirir.',
    'Denge korunurken bugun bir sinyali one almak faydali.',
    'Guvenli ritim; tek odak ekstra okunurluk saglar.',
  ],
  resource_saving_overuse: [
    'Kaynagi koruyorsun; dusuk maliyetli toparlanma firsati deger yaratabilir.',
    'Kucuk hamle maliyeti dusuk, etkisi gorunur olabilir.',
    'Tasarruf iyi; firsat penceresi de tabloda kalsin.',
    'Dusuk maliyetli adim kaynaklari tuketmeden iz birakir.',
  ],
  public_trust_overfocus: [
    'Guveni koruyorsun; rota ve kaynak yuku de gorunur kalmali.',
    'Sosyal odak iyi; lojistik sinyal de kisa kontrol isteyebilir.',
    'Iletisim guclu; arac hatti bugun denge katabilir.',
    'Guven ekseni iyi; diger hatlara kisa bakis faydali.',
  ],
  crisis_priority_overfocus: [
    'Riskleri iyi kapatiyorsun; kucuk toparlanma firsati da var.',
    'Kriz onceligi dogru; iyilesme notu da eklenebilir.',
    'Acil isler iyi; dusuk maliyetli firsat da izlenmeli.',
    'Risk kapatma guclu; sakin toparlanma dengeyi tamamlar.',
  ],
  district_repetition: [
    'Bu bolgeyi iyi izliyorsun; baska mahalle sessizce birikebilir.',
    'Mahalle takibi iyi; cevre sinyali de kisa kontrol isteyebilir.',
    'Tek hat guclu; yeni bolge notu tabloyu genisletir.',
    'Ayni bolge iyi; baska iz de gorunur kalmali.',
  ],
  route_heavy_repetition: [
    'Rota hattini iyi okuyorsun; bugun sosyal veya konteyner sinyali denge katabilir.',
    'Ulasim odagi iyi; guven ekseni kisa not alabilir.',
    'Arac ritmi guclu; mahalle sinyali denge saglar.',
    'Rota iyi; konteyner hatti bugun tabloya girebilir.',
  ],
  social_pressure_avoidance: [
    'Sosyal sinyaller birikebilir; kucuk iletisim adimi yarin isini kolaylastirir.',
    'Kisa gorunurluk sosyal yuku hafifletir.',
    'Iletisim notu dusuk maliyetle etki yaratabilir.',
    'Sosyal hat icin kucuk adim bugun yeterli olabilir.',
  ],
  recovery_opportunity_neglect: [
    'Riskleri kapatiyorsun; toparlanma firsati dusuk maliyetle deger yaratabilir.',
    'Iyilesme penceresi kucuk hamleyle korunabilir.',
    'Risk iyi; firsat notu da bugun eklenebilir.',
    'Toparlanma dusuk maliyetle dengeyi tamamlar.',
  ],
  inconsistent_switching: [
    'Gundem degisiyor; bugun tek odagi sabitlemek daha okunur olabilir.',
    'Bir sinyali secip takip etmek tabloyu sakinlestirir.',
    'Tek oncelik hizli gecislerden daha net iz birakir.',
    'Bugun bir hat sec; yarin yeni sinyal degerlendirilir.',
  ],
  none: [
    'Farkli yaklasimlar denemek icin alan var.',
    'Net ritim yok; bugunun sinyaline gore esnek kal.',
    'Aliskanlik henuz yok; en net oncelige odaklan.',
    'Serbest secim; bugunun tablosuna gore hareket et.',
  ],
};

export const DOMINANT_STRATEGY_BADGE_VARIANTS: Partial<
  Record<DominantStrategyPattern, string[]>
> = {
  rapid_response_overuse: ['Hizli ritim', 'Tempo yuksek'],
  preventive_overuse: ['Onleyici ritim', 'Yarin odak'],
  balanced_default_overuse: ['Dengeli ritim', 'Orta yol'],
  resource_saving_overuse: ['Tasarruf ritmi', 'Maliyet kontrol'],
  public_trust_overfocus: ['Guven odagi', 'Sosyal hassas'],
  crisis_priority_overfocus: ['Risk onceligi', 'Kriz odagi'],
  district_repetition: ['Bolge tekrari', 'Mahalle odagi'],
  route_heavy_repetition: ['Rota odagi', 'Ulasim ritmi'],
  social_pressure_avoidance: ['Sosyal gecikme', 'Iletisim notu'],
  recovery_opportunity_neglect: ['Firsat notu', 'Toparlanma izi'],
  inconsistent_switching: ['Coklu odak', 'Hizli gecis'],
  none: ['Tarz acik', 'Esnek ritim'],
};
