import type { FollowUpExecutionKind } from './followUpExecutionTypes';

export const FOLLOW_UP_EXECUTION_ACTION_VARIANTS: Partial<
  Record<FollowUpExecutionKind, string[]>
> = {
  recheck_district: [
    'Mahalle sinyalini kisa bir kontrolle yeniden oku.',
    'Bolge tablosunu bugunun riskine gore hizlica gozden gecir.',
    'Dunku mahalle notunu bugun icin netlestir.',
    'Kucuk bir mahalle taramasi yap; buyuk hamle acma.',
  ],
  send_small_team: [
    'Kucuk bir ekibi dar alana yonlendir.',
    'Buyuk operasyon acmadan kisa bir saha kontrolu yap.',
    'Sinirli ekiple hedefli bir kontrol gonder.',
    'Dar alanda hizli bir gozlem ekibi calistir.',
  ],
  monitor_signal: [
    'Sinyali buyutmeden izle ve not dus.',
    'Kisa izleme modu kur; acele karar verme.',
    'Sinyali takip listesine al, mudahale etme.',
    'Sakin izleme ile bugunun onceligini netlestir.',
  ],
  rebalance_resource: [
    'Kaynak dagilimini hafifce yeniden dengele.',
    'Butce ve ekip payini kucuk bir duzeltmeyle ayarla.',
    'Dunku baskiyi hafifletmek icin kisa denge hamlesi yap.',
    'Kapasiteyi bir adim geri cekip tabloyu sakinlestir.',
  ],
  review_route: [
    'Rota hattini hizlica gozden gecir.',
    'Arac ve ekip akisina kisa bir not ekle.',
    'Dunku rota baskisini bugunun planina bagla.',
    'Ulasim hattini kontrol et; buyuk degisiklik yapma.',
  ],
  check_container_line: [
    'Konteyner hattini hizli kontrol et.',
    'Biriken noktayi izole et, hat genelini oku.',
    'Lojistik hattina kisa bir gozlem notu dus.',
    'Cevre baskisini erken yakalamak icin hatti tara.',
  ],
  calm_social_pulse: [
    'Sosyal nabzi sakinlestirecek kisa bir takip yap.',
    'Mahalle tepkisini buyutmeden gorunur kal.',
    'Iletisim tonunu yumusatan kucuk bir adim at.',
    'Vatandas nabzini izle, agresif mudahale etme.',
  ],
  reinforce_trust: [
    'Guven izini kucuk bir takiple guclendir.',
    'Mahalleye takip edildigini hissettiren kisa not birak.',
    'Sosyal guvene dair sakin bir pekistirme yap.',
    'Dunku guven sinyalini bugun icin netlestir.',
  ],
  capture_memory_trace: [
    'Dunku kararin izini kayda al.',
    'Karar hafizasina kisa bir baglanti notu ekle.',
    'Sehir izini bugunun raporuna bagla.',
    'Hafiza izini kaydet; buyuk operasyon acma.',
  ],
  support_recovery: [
    'Toparlanma firsatini kucuk takiple destekle.',
    'Iyilesme sinyalini koruyan hafif bir adim at.',
    'Bolge toparlanmasina dusuk maliyetli destek ver.',
    'Olumlu donusu guclendiren kisa bir hamle yap.',
  ],
  safe_watch: [
    'Kaynak harcamadan guvenli izleme kur.',
    'Sakin modda takip et; gereksiz buyumeyi engelle.',
    'Dusuk maliyetli izleme ile gunu kapat.',
    'Acele etmeden sinyali guvenli sekilde izle.',
  ],
};

export const FOLLOW_UP_EXECUTION_RESULT_VARIANTS: Partial<
  Record<FollowUpExecutionKind, string[]>
> = {
  recheck_district: [
    'Mahalle sinyali yeniden okundu; risk daha net.',
    'Bolge tablosu guncellendi; oncelik sakinlesti.',
    'Kisa kontrol tamamlandi; mahalle notu netlesti.',
    'Mahalle taramasi bitti; bugunun riski daha okunur.',
  ],
  send_small_team: [
    'Kucuk ekip dar alanda kontrolu tamamladi.',
    'Hedefli saha kontrolu bitti; takip kapanmaya yaklasti.',
    'Sinirli ekip notu rapora eklendi.',
    'Dar alan kontrolu tamamlandi; buyuk yuk acilmadi.',
  ],
  monitor_signal: [
    'Sinyal izlendi; oncelik sakin bir hatta cekildi.',
    'Izleme modu kuruldu; acele karar engellendi.',
    'Takip notu alindi; mudahale ertelendi.',
    'Sakin izleme tamamlandi; tablo daha net.',
  ],
  rebalance_resource: [
    'Kaynak dengesi guncellendi; yarin yuku azaldi.',
    'Kucuk denge hamlesi tamamlandi.',
    'Kapasite dagilimi sakinlesti; butce notu eklendi.',
    'Kaynak ayari yapildi; baski hafifledi.',
  ],
  review_route: [
    'Rota hatti gozden gecirildi; akis daha net.',
    'Ulasim notu eklendi; ekipler plani gordu.',
    'Rota kontrolu tamamlandi; baski okunur hale geldi.',
    'Arac ve ekip akisi bugun icin netlesti.',
  ],
  check_container_line: [
    'Konteyner hatti kontrol edildi; birikme izole edildi.',
    'Lojistik tarama tamamlandi; hat notu alindi.',
    'Cevre baskisi takip listesine eklendi.',
    'Hat kontrolu bitti; erken uyari kaydedildi.',
  ],
  calm_social_pulse: [
    'Sosyal nabiz sakinlesti; guven notu eklendi.',
    'Iletisim tonu yumusadi; mahalle tepkisi kontrol altinda.',
    'Kisa takip tamamlandi; nabiz rapora yazildi.',
    'Sakin mudahale bitti; sosyal etki dengelendi.',
  ],
  reinforce_trust: [
    'Guven izi pekistirildi; mahalle takibi hissediyor.',
    'Kisa guven notu birakildi; sosyal etki yumusadi.',
    'Guven pekistirmesi tamamlandi.',
    'Mahalle guven sinyali bugun icin guclendi.',
  ],
  capture_memory_trace: [
    'Hafiza izi kaydedildi; rapor dunku karara baglandi.',
    'Karar izi arsive eklendi; devam notu alindi.',
    'Sehir hafizasi guncellendi; iz korundu.',
    'Hafiza kaydi tamamlandi; sonraki gun icin hazir.',
  ],
  support_recovery: [
    'Toparlanma destegi verildi; olumlu donus gorunur.',
    'Iyilesme sinyali korundu; bolge notu eklendi.',
    'Kucuk destek tamamlandi; momentum devam ediyor.',
    'Toparlanma hamlesi bitti; firsat penceresi acik.',
  ],
  safe_watch: [
    'Guvenli izleme kuruldu; yeni operasyon acilmadi.',
    'Sakin takip tamamlandi; kapasite korundu.',
    'Dusuk maliyetli izleme bitti; tablo net.',
    'Guvenli mod tamamlandi; gereksiz yuk engellendi.',
  ],
};
