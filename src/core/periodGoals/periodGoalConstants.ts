import type { PeriodGoalId, PeriodGoalProgressBand, PeriodGoalTone } from './periodGoalTypes';

export type PeriodGoalDefinition = {
  id: PeriodGoalId;
  title: string;
  shortTitle: string;
  description: string;
  defaultTone: PeriodGoalTone;
  chipTemplates: Array<{ label: string; value: string; tone: PeriodGoalTone }>;
  nextHint: string;
  eceHint: string;
};

export const PERIOD_GOAL_DEFINITIONS: Record<PeriodGoalId, PeriodGoalDefinition> = {
  restore_trust: {
    id: 'restore_trust',
    title: 'Mahalle Güvenini Toparla',
    shortTitle: 'Güven odağı',
    description: 'Görünür ve dengeli müdahalelerle güven kırılganlığını azalt.',
    defaultTone: 'strategic',
    chipTemplates: [
      { label: 'Güven', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Sosyal Nabız', value: 'Takipte', tone: 'neutral' },
      { label: 'Mahalle Hafızası', value: 'Aktif', tone: 'neutral' },
    ],
    nextHint: 'Güveni kırılgan mahallelerde küçük ama görünür aksiyonlar etkili olur.',
    eceHint:
      'Bu dönem güveni toparlamak kritik. Görünür ama kaynakları yormayan hamleler daha güvenli.',
  },
  control_resource_pressure: {
    id: 'control_resource_pressure',
    title: 'Kaynak Baskısını Dengele',
    shortTitle: 'Kaynak dengesi',
    description: 'Ekip, bütçe ve operasyon temposunu yarına taşan baskı oluşturmadan yönet.',
    defaultTone: 'warning',
    chipTemplates: [
      { label: 'Kaynak', value: 'Baskı altında', tone: 'warning' },
      { label: 'Ekip Temposu', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Bakım Kuyruğu', value: 'Takipte', tone: 'neutral' },
    ],
    nextHint: 'Yüksek maliyetli planlardan sonra daha dengeli müdahale seç.',
    eceHint:
      'Kaynak baskısı dönemin ana sınavı. Hızlı hamlelerden sonra ekip temposunu dengele.',
  },
  stabilize_service_rhythm: {
    id: 'stabilize_service_rhythm',
    title: 'Hizmet Ritmini Koruyun',
    shortTitle: 'Hizmet ritmi',
    description: 'Rutin aksama ve rota baskısını büyütmeden şehir akışını dengede tut.',
    defaultTone: 'neutral',
    chipTemplates: [
      { label: 'Rota', value: 'Dengede', tone: 'neutral' },
      { label: 'Rutin Hizmet', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Saha Akışı', value: 'Takipte', tone: 'neutral' },
    ],
    nextHint: 'Rota ve hizmet hassasiyeti yüksek bölgelerde gecikmeyi azalt.',
    eceHint: 'Rutin akış bozulmadan ilerlemek bu dönemin ana çizgisi. Gecikmeyi erken fark et.',
  },
  reduce_social_heat: {
    id: 'reduce_social_heat',
    title: 'Sosyal Nabzı Sakinleştir',
    shortTitle: 'Sosyal nabız',
    description: 'Vatandaş beklentisi yükselmeden görünür müdahale ve takip duygusu oluştur.',
    defaultTone: 'warning',
    chipTemplates: [
      { label: 'Sosyal Tepki', value: 'Yüksek', tone: 'warning' },
      { label: 'Görünür Hizmet', value: 'Öncelik', tone: 'strategic' },
      { label: 'Ece Uyarısı', value: 'Aktif', tone: 'mixed' },
    ],
    nextHint: 'Sosyal nabız yüksekse sessiz değil, görünür plan tercih et.',
    eceHint: 'Sosyal nabız yükseliyor. Sessiz kalmak yerine görünür ve ölçülü müdahale daha güvenli.',
  },
  strengthen_readiness: {
    id: 'strengthen_readiness',
    title: 'Saha Hazırlığını Güçlendir',
    shortTitle: 'Saha hazırlığı',
    description: 'Ekip, araç, rota ve bakım sinyallerini kontrol altında tut.',
    defaultTone: 'strategic',
    chipTemplates: [
      { label: 'Readiness', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Bakım Adayı', value: 'Takipte', tone: 'warning' },
      { label: 'Ekip', value: 'Dengede', tone: 'neutral' },
    ],
    nextHint: 'Bakım kuyruğuna taşınan sinyalleri yeni operasyonlardan önce izle.',
    eceHint:
      'Hazırlık sinyalleri birikiyor. Yeni operasyondan önce bakım kuyruğunu göz ardı etme.',
  },
  balance_district_attention: {
    id: 'balance_district_attention',
    title: 'Bölge Dengesini Koru',
    shortTitle: 'Bölge dengesi',
    description: 'Tek mahalleye aşırı yüklenmeden hizmet adaletini ve güven dengesini koru.',
    defaultTone: 'strategic',
    chipTemplates: [
      { label: 'Mahalle Dengesi', value: 'Dikkat', tone: 'warning' },
      { label: 'Hizmet Adaleti', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Güven', value: 'Dengede', tone: 'neutral' },
    ],
    nextHint: 'Üst üste aynı bölgeye odaklandıysan diğer bölgelerde beklenti birikebilir.',
    eceHint: 'Aynı bölgeye fazla yükleniyorsun. Diğer mahallelerde beklenti birikebilir.',
  },
  prevent_tomorrow_risk: {
    id: 'prevent_tomorrow_risk',
    title: 'Yarın Riskini Azalt',
    shortTitle: 'Yarın riski',
    description: 'Bugünkü kararların yarına taşıdığı riskleri erken dengele.',
    defaultTone: 'warning',
    chipTemplates: [
      { label: 'Yarın Riski', value: 'Yüksek', tone: 'warning' },
      { label: 'Cliffhanger', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Kalan Baskı', value: 'Takipte', tone: 'neutral' },
    ],
    nextHint: 'Gün sonu sinyallerini yarının ilk hamlesine bağla.',
    eceHint: 'Yarına taşan risk sinyalleri var. Bugünkü son hamleler yarını hafifletebilir.',
  },
  adaptive_management: {
    id: 'adaptive_management',
    title: 'Uyumlu Yönetim Çizgisi',
    shortTitle: 'Uyumlu yönetim',
    description: 'Tek bir stratejiye sıkışmadan olayın türüne göre esnek karar ver.',
    defaultTone: 'neutral',
    chipTemplates: [
      { label: 'Oyuncu Tarzı', value: 'Esnek', tone: 'neutral' },
      { label: 'Denge', value: 'İzleniyor', tone: 'mixed' },
      { label: 'Uyum', value: 'Aktif', tone: 'positive' },
    ],
    nextHint: 'Karar tarzını olay bağlamına göre esnek tut.',
    eceHint: 'Tek bir çizgiye kilitlenme. Olayın bağlamına göre esnek karar bu dönemi taşır.',
  },
};

export const PERIOD_GOAL_PROGRESS_LABELS: Record<PeriodGoalProgressBand, string> = {
  starting: 'Yeni oluşuyor',
  moving: 'İlerliyor',
  steady: 'Dengede',
  strained: 'Baskı altında',
  at_risk: 'Riskte',
};

export const PERIOD_GOAL_PROGRESS_TONES: Record<PeriodGoalProgressBand, PeriodGoalTone> = {
  starting: 'neutral',
  moving: 'positive',
  steady: 'neutral',
  strained: 'warning',
  at_risk: 'critical',
};

export const ALL_PERIOD_GOAL_IDS = Object.keys(PERIOD_GOAL_DEFINITIONS) as PeriodGoalId[];
