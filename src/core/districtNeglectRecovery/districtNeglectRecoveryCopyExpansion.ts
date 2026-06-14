import type { DistrictNeglectRecoveryKind } from './districtNeglectRecoveryTypes';

export const DISTRICT_NEGLECT_RECOVERY_COPY_EXPANSION: Partial<
  Record<DistrictNeglectRecoveryKind, string[]>
> = {
  neglect_watch: [
    'Mahalle sinyali sakin; kisa takip notu yeterli olabilir.',
    'Bolge izleme modunda; buyuk hamle gerekmiyor.',
    'Kucuk kontrol biriken sinyali erken gorunur kilar.',
  ],
  neglect_warning: [
    'Ertelenen sinyal birikmeye baslamis olabilir.',
    'Bolge artik sadece izleme degil, oncelik isteyebilir.',
    'Kisa mahalle kontrolu yarin yukunu azaltabilir.',
  ],
  trust_fragility: [
    'Guven hassasiyeti bu bolgede dikkatli okunmali.',
    'Kucuk iletisim hamlesi etkiyi yumusatabilir.',
    'Sosyal sinyali gec okumamak onemli.',
  ],
  social_cooling: [
    'Sosyal nabiz burada sogumadan takip edilmeli.',
    'Gorunur takip guveni koruyabilir.',
    'Kucuk kontrol tepkiyi buyutmeden denge saglar.',
  ],
  route_backlog: [
    'Rota baskisi bu mahallede birikmeye acik.',
    'Erken rota okumasi bolgeyi rahatlatabilir.',
    'Arac hatti kucuk kontrolden fayda gorebilir.',
  ],
  container_backlog: [
    'Konteyner hatti burada takip gerektirebilir.',
    'Hat birlikte okunmazsa cevre baskisi yayilir.',
    'Kisa kontrol birikmeyi erken izole eder.',
  ],
  recovery_window: [
    'Mahallede toparlanma firsati acik.',
    'Kucuk takip hamlesi bolgeyi yeniden dengeleyebilir.',
    'Iyilesme sinyali dusuk maliyetle korunabilir.',
  ],
  recovery_progress: [
    'Olumlu iz guclenmeye baslamis olabilir.',
    'Toparlanma sinyali kucuk devamla korunur.',
    'Iyiye gidis dikkatli takip ister.',
  ],
  positive_momentum: [
    'Kucuk ama degerli olumlu momentum var.',
    'Mahalle sadece risk degil, firsat da gosteriyor.',
    'Dogru takip guvenli ilerleme saglayabilir.',
  ],
  safe_watch: [
    'Mahalle bugun izleme modunda kalabilir.',
    'Kapasiteyi daha acil sinyale ayirabilirsin.',
    'Kisa takip bu bolge icin yeterli olabilir.',
  ],
  fallback: [
    'Mahalle sinyalleri sakin; yeni izler raporda netlesir.',
    'Belirgin ihmal ya da toparlanma sinyali yok.',
    'Bolge takibi icin yeni veri bekleniyor.',
  ],
};
