import type { FollowUpExecutionKind, FollowUpExecutionSourceKind } from './followUpExecutionTypes';
import {
  FOLLOW_UP_EXECUTION_ACTION_VARIANTS,
  FOLLOW_UP_EXECUTION_RESULT_VARIANTS,
} from './followUpExecutionCopyExpansion';

export const FOLLOW_UP_EXECUTION_MIN_DAY = 8;
export const FOLLOW_UP_EXECUTION_MAX_CANDIDATES = 3;
export const FOLLOW_UP_EXECUTION_LINE_MAX = 110;
export const FOLLOW_UP_EXECUTION_ACCESSIBILITY_MAX = 160;

export const FOLLOW_UP_EXECUTION_BADGE_LABELS: Record<FollowUpExecutionKind, string> = {
  recheck_district: 'Tekrar bak',
  send_small_team: 'Kucuk ekip',
  monitor_signal: 'Izle',
  rebalance_resource: 'Dengele',
  review_route: 'Rota',
  check_container_line: 'Hat kontrolu',
  calm_social_pulse: 'Sosyal nabiz',
  reinforce_trust: 'Guven',
  capture_memory_trace: 'Hafiza',
  support_recovery: 'Toparlanma',
  safe_watch: 'Guvenli izleme',
};

export const FOLLOW_UP_EXECUTION_CTA_LABELS: Record<FollowUpExecutionKind, string> = {
  recheck_district: 'Kontrol Et',
  send_small_team: 'Ekibi Yonlendir',
  monitor_signal: 'Sinyali Izle',
  rebalance_resource: 'Dengeyi Kur',
  review_route: 'Rotayi Gozden Gecir',
  check_container_line: 'Hatti Kontrol Et',
  calm_social_pulse: 'Nabzi Sakinlestir',
  reinforce_trust: 'Guveni Pekistir',
  capture_memory_trace: 'Izi Kaydet',
  support_recovery: 'Toparlanmayi Destekle',
  safe_watch: 'Guvenli Izle',
};

export const FOLLOW_UP_EXECUTION_COPY: Record<
  FollowUpExecutionKind,
  { title: string; line: string; resultLine: string }
> = {
  recheck_district: {
    title: 'Mahalle Kontrolu',
    line: 'Dunku mahalle sinyalini tekrar okuyup bugunun riskini netlestir.',
    resultLine: 'Dunku mahalle sinyali tekrar kontrol edildi; risk daha okunur durumda.',
  },
  send_small_team: {
    title: 'Kucuk Ekip Hamlesi',
    line: 'Buyuk operasyon acmadan kucuk bir ekibi dar alana yonlendir.',
    resultLine: 'Kucuk ekip dar alana yonlendirildi; takip isi kapanmaya yaklasti.',
  },
  monitor_signal: {
    title: 'Sinyal Izleme',
    line: 'Sinyali buyutmeden izle ve bugunun onceligine not dus.',
    resultLine: 'Sinyal izlendi; bugunun onceligi daha sakin bir hatta cekildi.',
  },
  rebalance_resource: {
    title: 'Kaynak Dengesi',
    line: 'Dunku kaynak baskisini hafifletmek icin bugun kucuk bir denge kur.',
    resultLine: 'Kaynak dengesi guncellendi; yarina tasinan baski azaldi.',
  },
  review_route: {
    title: 'Rota Gozden Gecirme',
    line: 'Dunku rota baskisini kontrol edip bugunun akisina kisa not ekle.',
    resultLine: 'Rota baskisi gozden gecirildi; ekipler bugunku akisi daha net goruyor.',
  },
  check_container_line: {
    title: 'Konteyner Hatti',
    line: 'Konteyner hattini hizli kontrol edip birikme riskini izole et.',
    resultLine: 'Konteyner hatti kontrol edildi; birikme riski takip listesine alindi.',
  },
  calm_social_pulse: {
    title: 'Sosyal Nabiz',
    line: 'Mahalle tepkisini buyutmeden sakinlestirecek kisa bir takip yap.',
    resultLine: 'Sosyal nabiz sakinlestirildi; guven notu rapora eklendi.',
  },
  reinforce_trust: {
    title: 'Guven Pekistirme',
    line: 'Dunku guven izini guclendirip mahalleye takip edildigini hissettir.',
    resultLine: 'Guven izi pekistirildi; mahalle takibin surdugunu hissediyor.',
  },
  capture_memory_trace: {
    title: 'Hafiza Izi',
    line: 'Dunku kararin izini kaydet ve bugunun karar hafizasina bagla.',
    resultLine: 'Hafiza izi kaydedildi; bugunun raporu dunku karara baglandi.',
  },
  support_recovery: {
    title: 'Toparlanma Destegi',
    line: 'Toparlanma firsatini kucuk bir takip hamlesiyle guclendir.',
    resultLine: 'Toparlanma destegi verildi; olumlu geri donus daha gorunur.',
  },
  safe_watch: {
    title: 'Guvenli Izleme',
    line: 'Kaynak harcamadan guvenli izleme kur ve gereksiz buyumeyi engelle.',
    resultLine: 'Guvenli izleme kuruldu; yeni operasyon acmadan takip tamamlandi.',
  },
};

function buildActionVariants(): Record<FollowUpExecutionKind, string[]> {
  const kinds = Object.keys(FOLLOW_UP_EXECUTION_COPY) as FollowUpExecutionKind[];
  return Object.fromEntries(
    kinds.map((kind) => [
      kind,
      [FOLLOW_UP_EXECUTION_COPY[kind].line, ...(FOLLOW_UP_EXECUTION_ACTION_VARIANTS[kind] ?? [])],
    ]),
  ) as Record<FollowUpExecutionKind, string[]>;
}

function buildResultVariants(): Record<FollowUpExecutionKind, string[]> {
  const kinds = Object.keys(FOLLOW_UP_EXECUTION_COPY) as FollowUpExecutionKind[];
  return Object.fromEntries(
    kinds.map((kind) => [
      kind,
      [FOLLOW_UP_EXECUTION_COPY[kind].resultLine, ...(FOLLOW_UP_EXECUTION_RESULT_VARIANTS[kind] ?? [])],
    ]),
  ) as Record<FollowUpExecutionKind, string[]>;
}

export const FOLLOW_UP_EXECUTION_ACTION_LINES = buildActionVariants();
export const FOLLOW_UP_EXECUTION_RESULT_LINES = buildResultVariants();

export const FOLLOW_UP_EXECUTION_ALLOWED_SOURCE_KINDS: FollowUpExecutionSourceKind[] = [
  'follow_up_action',
  'day8_operation_feed_binding',
  'positive_comeback',
  'city_memory_visibility',
  'district_neglect_recovery',
  'daily_capacity_portfolio',
  'portfolio_defer_risk',
  'one_more_day_retention',
  'city_rhythm_director',
];
