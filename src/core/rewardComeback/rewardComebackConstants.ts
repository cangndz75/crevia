import type { RewardComebackMomentKind, RewardComebackVisibility } from './rewardComebackTypes';

export const REWARD_COMEBACK_COPY_LIMITS = {
  title: 48,
  line: 160,
  hub: 140,
  report: 150,
  result: 120,
  social: 140,
  map: 120,
  ece: 150,
  journal: 140,
  label: 32,
} as const;

export const REWARD_COMEBACK_FORBIDDEN_TERMS = [
  'ödül kazandın',
  'ödül kazand',
  'coin',
  'para',
  'sandık',
  'premium',
  'kilit açıldı',
  'kaçırma',
  'başarısız oldun',
  'yanlış yaptın',
  'felaket',
  'panik',
  'viral',
  'trend oldu',
  'pack',
  'metadata',
  'runtime',
  'loot',
  'gacha',
  'chest',
  'currency',
] as const;

export const REWARD_COMEBACK_BLAME_TERMS = [
  'yanlış yaptın',
  'başarısız',
  'kötü yaptın',
  'hata yaptın',
  'suçlu',
] as const;

export const REWARD_COMEBACK_MOMENT_LABELS: Record<RewardComebackMomentKind, string> = {
  decision_worked: 'Karar etkisi',
  district_recovered: 'Mahalle toparlandı',
  risk_prevented: 'Risk önlendi',
  trust_improved: 'Güven arttı',
  route_balanced: 'Rota dengelendi',
  container_relief: 'Konteyner rahatladı',
  resource_recovered: 'Kaynak toparlandı',
  social_thanks: 'Halk fark etti',
  comeback_available: 'Toparlama fırsatı',
  comeback_started: 'Toparlanma başladı',
  comeback_completed: 'Toparlanma tamamlandı',
  reward_event_seen: 'Olumlu iz',
  positive_followup: 'Olumlu takip',
  advisor_prediction_confirmed: 'Ece doğruladı',
  fallback: 'Olumlu iz',
};

export const REWARD_COMEBACK_MOMENT_COPY: Record<RewardComebackMomentKind, string> = {
  decision_worked: 'Dünkü rota tercihi {district} hattını rahatlattı.',
  district_recovered: '{district}’te sosyal güven toparlanma çizgisine girdi.',
  risk_prevented: 'Kriz eşiğine gelmeden rota baskısı düşürüldü.',
  trust_improved: '{district}’te güven toparlanıyor.',
  route_balanced: '{district} rotası bugün daha dengeli görünüyor.',
  container_relief: 'Konteyner çevresindeki baskı bugün daha sakin.',
  resource_recovered: 'Araç temposu bugün daha dengeli görünüyor.',
  social_thanks: 'Mahallede görünür hizmet fark edildi.',
  comeback_available: 'Dünkü sıkışma bugün toparlama fırsatına dönüştü.',
  comeback_started: '{district}’te toparlanma çizgisi başladı.',
  comeback_completed: '{district}’te dün taşan baskı bugün kontrol altına alındı.',
  reward_event_seen: 'Bugünkü karar olumlu bir iz bıraktı.',
  positive_followup: 'Dünkü kararın etkisi bugün de görünür.',
  advisor_prediction_confirmed:
    'Ece’nin dünkü rota uyarısı bugün doğrulandı; {district} hattı daha sakin.',
  fallback: 'Bugünkü operasyon küçük ama olumlu bir iz bıraktı.',
};

export const REWARD_COMEBACK_DAY1_LINE = 'İlk kararın rapora işlendi.';

export const REWARD_COMEBACK_MAX_MOMENTS_BY_DAY = {
  day1: 1,
  day2_3: 1,
  day4_7: 1,
  day8_plus: 2,
  main_operation: 2,
} as const;

export const REWARD_COMEBACK_VARIANT_KINDS = [
  'reward',
  'comeback',
  'recovery',
  'improved',
  'prevented',
  'positive_followup',
  'social_trust',
  'resource_recovery',
] as const;

export function resolveRewardComebackVisibility(
  day: number,
  isMainOperationFull?: boolean,
): RewardComebackVisibility {
  if (day <= 1) return 'compact';
  if (isMainOperationFull && day >= 8) return 'highlighted';
  if (day <= 3) return 'compact';
  if (day <= 7) return 'standard';
  return 'standard';
}

export function resolveRewardComebackMaxMoments(
  day: number,
  isMainOperationFull?: boolean,
): number {
  if (day <= 1) return REWARD_COMEBACK_MAX_MOMENTS_BY_DAY.day1;
  if (day <= 3) return REWARD_COMEBACK_MAX_MOMENTS_BY_DAY.day2_3;
  if (day <= 7) return REWARD_COMEBACK_MAX_MOMENTS_BY_DAY.day4_7;
  if (isMainOperationFull) return REWARD_COMEBACK_MAX_MOMENTS_BY_DAY.main_operation;
  return REWARD_COMEBACK_MAX_MOMENTS_BY_DAY.day8_plus;
}
