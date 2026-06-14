import type { PositiveComebackKind } from './positiveComebackTypes';

export const POSITIVE_COMEBACK_COPY_EXPANSION: Partial<
  Record<PositiveComebackKind, string[]>
> = {
  trust_recovery: [
    'Guven sinyali toparlanmaya acik; kucuk takip yeterli olabilir.',
    'Sakin iletisim bu bolgede olumlu iz birakabilir.',
    'Hassas bolgede gorunur ama hafif adim degerli.',
  ],
  resource_relief: [
    'Kaynak baskisi dogru oncelikle yumusayabilir.',
    'Kucuk dengeleme yarin operasyon alanini acabilir.',
    'Dusuk maliyetli hamle bugun rahatlama saglayabilir.',
  ],
  social_support: [
    'Gorunur takip sosyal destegi guclendirebilir.',
    'Iletisim tonu olumlu etki yaratabilir.',
    'Kucuk guven hamlesi nabzi sakinlestirebilir.',
  ],
  district_recovery: [
    'Mahallede toparlanma penceresi kisa ama degerli.',
    'Bolge kucuk hamleyle yeniden dengeye gelebilir.',
    'Iyilesme sinyali dikkatli takip ister.',
  ],
  container_improvement: [
    'Konteyner hattinda kucuk iyilestirme cevre baskisini azaltabilir.',
    'Hat kontrolu bu bolgede rahatlama yaratabilir.',
    'Lojistik sinyali toparlanmaya acik gorunuyor.',
  ],
  route_relief: [
    'Rota baskisi kucuk kontrolle yumusayabilir.',
    'Erken rota okumasi operasyon alanini genisletebilir.',
    'Arac hatti sakinlestirilirse yuk hafifler.',
  ],
  follow_up_success: [
    'Dunku takip bugun olumlu bir iz birakabilir.',
    'Kucuk devam hamlesi guvenli toparlanma saglayabilir.',
    'Dusuk maliyetli takip sehir hafizasinda olumlu gorunur.',
  ],
  memory_positive_trace: [
    'Sehir hafizasinda olumlu bir iz olusabilir.',
    'Onceki karar bu kez iyi bir firsata baglaniyor.',
    'Dogru takip izi olumlu yonde guclendirebilir.',
  ],
  opportunity_window: [
    'Firsat penceresi bugun daha degerli.',
    'Kucuk hamle buyuk baski olmadan yon verebilir.',
    'Toparlanma izi kapanmadan not almak iyi olur.',
  ],
  safe_momentum: [
    'Sakin ilerleme olumlu momentum yaratabilir.',
    'Kucuk iyilesme uzun vadede sehir hissini guclendirir.',
    'Denge kurmak da bugun icin degerli bir sonuc.',
  ],
  fallback: [
    'Kucuk bir iyiye gidis yakalanabilir.',
    'Sakin tempo olumlu iz birakabilir.',
    'Her gun kriz degil; bugun denge de basari.',
  ],
};
