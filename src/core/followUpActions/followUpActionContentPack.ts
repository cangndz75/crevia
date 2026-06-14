import type { FollowUpActionKind } from './followUpActionTypes';

export type FollowUpActionContentLine = {
  title: string;
  line: string;
  benefitLine: string;
  riskLine?: string;
};

export const FOLLOW_UP_ACTION_CONTENT: Record<FollowUpActionKind, FollowUpActionContentLine[]> = {
  recheck_district: [
    {
      title: 'Mahalle Kontrolu',
      line: 'Bu bolgeyi kisa bir takip turuyla yeniden oku.',
      benefitLine: 'Erken kontrol, yarinki baskiyi daha gorunur yapar.',
    },
    {
      title: 'Bolgeyi Yeniden Oku',
      line: 'Mahalle sinyalini ana operasyon acmadan kisa kontrol et.',
      benefitLine: 'Ihmal riski buyumeden gorunur hale gelebilir.',
    },
    {
      title: 'Takip Turu',
      line: 'Dun ertelenen bolgeyi bugun kisa bir turda izle.',
      benefitLine: 'Bolge durumunu daha net okuyabilirsin.',
    },
    {
      title: 'Mahalle Nabzi',
      line: 'Bolge sinyalini kucuk bir saha okumasiyla kontrol et.',
      benefitLine: 'Yarin icin oncelik kararini kolaylastirabilir.',
      riskLine: 'Kisa kontrol bile sosyal gorunurlugu artirabilir.',
    },
  ],
  monitor_signal: [
    {
      title: 'Sinyali Izle',
      line: 'Bugun cozmedigin sinyali izleme modunda tut.',
      benefitLine: 'Sinyal buyurse yarin daha net karar verirsin.',
    },
    {
      title: 'Izleme Modu',
      line: 'Sakin sinyali bugun aktif mudahale etmeden takip et.',
      benefitLine: 'Kapasite harcamadan bilgi toplayabilirsin.',
    },
    {
      title: 'Pasif Takip',
      line: 'Sinyal henuz acil degil; izleme yeterli olabilir.',
      benefitLine: 'Yarin icin daha net bir okuma elde edebilirsin.',
    },
    {
      title: 'Sinyal Gozlemi',
      line: 'Bugun mudahale etmeden sinyalin yonunu izle.',
      benefitLine: 'Erken uyari, yarinki karari kolaylastirabilir.',
    },
  ],
  send_small_team: [
    {
      title: 'Kucuk Ekip Yonlendir',
      line: 'Ana operasyon acmadan kucuk bir saha kontrolu planla.',
      benefitLine: 'Dusuk maliyetle bolgeyi sakin tutabilir.',
    },
    {
      title: 'Hafif Saha Kontrolu',
      line: 'Kisa bir ekip turuyla bolgeyi kontrol altinda tut.',
      benefitLine: 'Operasyon slotu harcamadan bilgi toplayabilirsin.',
    },
    {
      title: 'Mini Ekip Turu',
      line: 'Kucuk bir ekip gondererek bolgeyi oku.',
      benefitLine: 'Saha gorunurlugunu artirabilir.',
      riskLine: 'Ekip dagilimi diger isleri etkileyebilir.',
    },
    {
      title: 'Hafif Mudahale',
      line: 'Tam operasyon yerine kucuk bir ekip hamlesi dusun.',
      benefitLine: 'Bolge baskisini kontrollu tutabilir.',
    },
  ],
  rebalance_resource: [
    {
      title: 'Kaynagi Dengele',
      line: 'Kaynak baskisini buyumeden yeniden dagit.',
      benefitLine: 'Yarinki operasyon alanini rahatlatabilir.',
    },
    {
      title: 'Kaynak Dagilimi',
      line: 'Baski birikmeden kaynaklari yeniden oku.',
      benefitLine: 'Operasyon maliyetini daha gorunur yapar.',
    },
    {
      title: 'Denge Kontrolu',
      line: 'Kaynak dagilimini kucuk bir ayarla yeniden dengele.',
      benefitLine: 'Yarin icin daha esnek bir plan olusturabilir.',
      riskLine: 'Kaynak kaydirmasi baska bolgeyi etkileyebilir.',
    },
    {
      title: 'Kaynak Okumasi',
      line: 'Bugun kaynak baskisini kucuk bir denge hamlesiyle oku.',
      benefitLine: 'Baski buyumeden mudahale alani acabilir.',
    },
  ],
  review_route: [
    {
      title: 'Rotayi Gozden Gecir',
      line: 'Rota baskisi birikmeden hatti tekrar oku.',
      benefitLine: 'Arac ve ekip kararini daha guvenli hale getirir.',
    },
    {
      title: 'Rota Kontrolu',
      line: 'Ertelenen rota sinyalini bugun kisa bir okumayla izle.',
      benefitLine: 'Yarin icin rota onceligini netlestirebilir.',
    },
    {
      title: 'Hat Okumasi',
      line: 'Rota daralmasini ana operasyon acmadan kontrol et.',
      benefitLine: 'Arac uygunlugunu daha erken gorebilirsin.',
    },
    {
      title: 'Rota Takibi',
      line: 'Rota baskisini kucuk bir gozden gecirmeyle oku.',
      benefitLine: 'Yarinki operasyon planini kolaylastirabilir.',
      riskLine: 'Rota degisikligi diger bolgeleri etkileyebilir.',
    },
  ],
  check_container_line: [
    {
      title: 'Konteyner Hattini Kontrol Et',
      line: 'Tek noktayi degil, hattin tamamini kisa kontrol et.',
      benefitLine: 'Cevre baskisi buyumeden gorunur olur.',
    },
    {
      title: 'Hat Kontrolu',
      line: 'Konteyner agini kisa bir turda yeniden oku.',
      benefitLine: 'Kaynak ihtiyacini daha erken gorebilirsin.',
    },
    {
      title: 'Ag Okumasi',
      line: 'Konteyner hattinin genel durumunu kisa kontrol et.',
      benefitLine: 'Baski birikmeden mudahale alani acabilir.',
    },
    {
      title: 'Konteyner Turu',
      line: 'Hat boyunca kisa bir kontrol turu planla.',
      benefitLine: 'Cevresel etkiyi daha kontrollu izleyebilirsin.',
      riskLine: 'Hat kontrolu ek kaynak isteyebilir.',
    },
  ],
  calm_social_pulse: [
    {
      title: 'Sosyal Nabzi Sakinlestir',
      line: 'Gorunur iletisimle tepkiyi izlemeye al.',
      benefitLine: 'Guven etkisini daha kontrollu tasir.',
    },
    {
      title: 'Iletisim Izleme',
      line: 'Sosyal tepkiyi kucuk bir iletisim hamlesiyle oku.',
      benefitLine: 'Tepki buyumeden mudahale alani acabilir.',
    },
    {
      title: 'Sosyal Kontrol',
      line: 'Mahalle nabzini gorunur ama sakin bir sekilde izle.',
      benefitLine: 'Guven kaybini yavaslatabilir.',
    },
    {
      title: 'Nabiz Okumasi',
      line: 'Sosyal sinyali bugun sakin bir iletisimle takip et.',
      benefitLine: 'Yarin icin daha net bir sosyal okuma saglayabilir.',
      riskLine: 'Gorunur iletisim beklenti yaratabilir.',
    },
  ],
  reinforce_trust: [
    {
      title: 'Guveni Pekistir',
      line: 'Hassas bolgede kucuk guven hamlesi hazirla.',
      benefitLine: 'Kararin sosyal etkisini yumusatabilir.',
    },
    {
      title: 'Guven Hamlesi',
      line: 'Bolgede kucuk bir guven adimi planla.',
      benefitLine: 'Sosyal etkiyi daha kontrollu tasiyabilir.',
    },
    {
      title: 'Guven Takibi',
      line: 'Guven sinyalini kucuk bir pekistirme hamlesiyle izle.',
      benefitLine: 'Mahalle iliskisini yumusatabilir.',
    },
    {
      title: 'Iliski Pekistirme',
      line: 'Hassas bolgede gorunur ama hafif bir guven adimi dusun.',
      benefitLine: 'Tepki siddetini azaltabilir.',
      riskLine: 'Beklenti yaratirsa baski artabilir.',
    },
  ],
  capture_memory_trace: [
    {
      title: 'Izi Kayda Al',
      line: 'Kararin biraktigi izi sehir hafizasinda takip et.',
      benefitLine: 'Sonraki gun ayni bolgeyi daha net okursun.',
    },
    {
      title: 'Hafiza Izleme',
      line: 'Karar izini sehir hafizasinda kisa bir takiple oku.',
      benefitLine: 'Gelecek kararlarda baglam saglayabilir.',
    },
    {
      title: 'Iz Takibi',
      line: 'Bolgede kalan karar izini kayda al.',
      benefitLine: 'Ayni bolgede daha tutarli karar verebilirsin.',
    },
    {
      title: 'Sehir Hafizasi',
      line: 'Kararin biraktigi izi bugun kisa bir okumayla izle.',
      benefitLine: 'Mahalle baglamini daha net gorebilirsin.',
    },
  ],
  support_recovery: [
    {
      title: 'Toparlanmayi Destekle',
      line: 'Olumlu firsati kucuk bir takip hamlesiyle guclendir.',
      benefitLine: 'Bolgenin toparlanma etkisini artirabilir.',
    },
    {
      title: 'Firsati Guclendir',
      line: 'Toparlanma penceresini kucuk bir hamleyle destekle.',
      benefitLine: 'Olumlu etkiyi daha gorunur tutabilir.',
    },
    {
      title: 'Iyilesme Takibi',
      line: 'Bolgedeki iyilesme sinyalini kucuk bir takiple destekle.',
      benefitLine: 'Toparlanma etkisini yumusak sekilde artirabilir.',
    },
    {
      title: 'Olumlu Hamle',
      line: 'Acik firsati dusuk maliyetli bir takip hamlesiyle izle.',
      benefitLine: 'Bolge moralini destekleyebilir.',
    },
  ],
  prepare_tomorrow: [
    {
      title: 'Yarini Hazirla',
      line: 'Bugunden kucuk hazirlikla yarinki baskiyi azalt.',
      benefitLine: 'Yeni gune daha net oncelikle baslarsin.',
    },
    {
      title: 'Yarin Hazirligi',
      line: 'Yarin icin kucuk bir hazirlik adimi planla.',
      benefitLine: 'Sabah kararini kolaylastirabilir.',
    },
    {
      title: 'On Hazirlik',
      line: 'Bugun kucuk bir hazirlikla yarin icin zemin olustur.',
      benefitLine: 'Oncelik kararini daha net verebilirsin.',
    },
    {
      title: 'Sabah Plani',
      line: 'Yarin icin kisa bir hazirlik notu birak.',
      benefitLine: 'Gune daha odakli baslayabilirsin.',
    },
  ],
  safe_watch: [
    {
      title: 'Izlemede Tut',
      line: 'Bu sinyal bugun sakin; izlemek yeterli olabilir.',
      benefitLine: 'Kapasiteyi harcamadan bilgi toplarsin.',
    },
    {
      title: 'Sakin Izleme',
      line: 'Sinyal dusuk; bugun mudahale gerekmiyor olabilir.',
      benefitLine: 'Kapasiteyi ana operasyon icin saklayabilirsin.',
    },
    {
      title: 'Guvenli Takip',
      line: 'Sinyal sakin gorunuyor; izlemeye devam et.',
      benefitLine: 'Yarin icin daha net bir okuma elde edebilirsin.',
    },
    {
      title: 'Pasif Izleme',
      line: 'Bugun bu sinyal icin izleme yeterli olabilir.',
      benefitLine: 'Operasyon slotunu harcamadan bilgi toplarsin.',
    },
  ],
};

export function pickFollowUpContent(
  kind: FollowUpActionKind,
  seed = 0,
): FollowUpActionContentLine {
  const lines = FOLLOW_UP_ACTION_CONTENT[kind];
  return lines[Math.abs(seed) % lines.length] ?? lines[0];
}
