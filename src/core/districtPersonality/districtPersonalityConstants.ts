import type {
  DistrictArchetypeId,
  DistrictCriterionId,
  DistrictGameplayTag,
} from './districtPersonalityTypes';

export const DISTRICT_PERSONALITY_EXPECTED_SAVE_VERSION = 26;

export const DISTRICT_PERSONALITY_PROHIBITED_TERMS = [
  'gelir',
  'yoksul',
  'zengin',
  'etnik',
  'din',
  'dini',
  'siyasi',
  'politik',
  'suc',
  'suclu',
  'saglik',
  'gocmen',
  'multeci',
  'irk',
  'mezhep',
] as const;

export const DISTRICT_CRITERION_LABELS: Record<DistrictCriterionId, string> = {
  social_sensitivity: 'Sosyal hassasiyet',
  route_difficulty: 'Rota zorlugu',
  container_density: 'Konteyner yogunlugu',
  trust_fragility: 'Guven hassasiyeti',
  recovery_potential: 'Toparlanma firsati',
  neglect_risk: 'Ihmal birikimi',
  maintenance_exposure: 'Bakim etkisi',
  operation_history_weight: 'Operasyon hafizasi',
  public_visibility: 'Gorunurluk',
  resource_dependency: 'Kaynak ihtiyaci',
};

export const DISTRICT_CRITERION_MEANINGS: Record<DistrictCriterionId, string> = {
  social_sensitivity: 'Sosyal nabiz ve iletisim tonu karar hassasiyetini artirir.',
  route_difficulty: 'Rota, arac ve zaman kararlarini daha onemli hale getirir.',
  container_density: 'Konteyner ve cevre hatlari daha dikkatli okunur.',
  trust_fragility: 'Karar tonu mahalle guveninde daha gorunur etki yaratabilir.',
  recovery_potential: 'Dogru takip hamlesi pozitif toparlanma firsati yaratabilir.',
  neglect_risk: 'Uzun bekleme baskinin birikmesine yol acabilir.',
  maintenance_exposure: 'Arac, ekip ve bakim penceresi karari daha belirleyicidir.',
  operation_history_weight: 'Gecmis kararlar burada daha okunur iz birakabilir.',
  public_visibility: 'Operasyon sonucu daha hizli fark edilebilir.',
  resource_dependency: 'Mudahale daha fazla ekip, arac veya kapasite isteyebilir.',
};

export const DISTRICT_ARCHETYPE_LABELS: Record<DistrictArchetypeId, string> = {
  balanced_district: 'Dengeli bolge',
  socially_sensitive: 'Sosyal hassas bolge',
  route_bottleneck: 'Rota darbogazi',
  container_dense: 'Konteyner yogun bolge',
  trust_fragile: 'Guven hassas bolge',
  recovery_ready: 'Toparlanmaya acik bolge',
  neglect_prone: 'Ihmal birikimi izlenen bolge',
  maintenance_exposed: 'Bakim etkisine acik bolge',
  public_attention_zone: 'Gorunurlugu yuksek bolge',
  resource_heavy: 'Kaynak agir bolge',
};

export const DISTRICT_BASELINE_SCORES: Record<
  string,
  Partial<Record<DistrictCriterionId, number>>
> = {
  merkez: {
    social_sensitivity: 70,
    route_difficulty: 72,
    public_visibility: 84,
    trust_fragility: 58,
    resource_dependency: 56,
  },
  cumhuriyet: {
    social_sensitivity: 82,
    trust_fragility: 72,
    recovery_potential: 76,
    public_visibility: 68,
    neglect_risk: 55,
  },
  sanayi: {
    route_difficulty: 76,
    container_density: 78,
    maintenance_exposure: 80,
    resource_dependency: 82,
    operation_history_weight: 62,
  },
  istasyon: {
    route_difficulty: 84,
    maintenance_exposure: 72,
    public_visibility: 74,
    resource_dependency: 70,
    neglect_risk: 62,
  },
  yesilvadi: {
    container_density: 68,
    recovery_potential: 82,
    trust_fragility: 58,
    neglect_risk: 60,
    social_sensitivity: 56,
  },
};

export const DISTRICT_ARCHETYPE_CRITERIA: Record<
  Exclude<DistrictArchetypeId, 'balanced_district'>,
  DistrictCriterionId[]
> = {
  socially_sensitive: ['social_sensitivity', 'public_visibility'],
  route_bottleneck: ['route_difficulty', 'maintenance_exposure'],
  container_dense: ['container_density', 'resource_dependency'],
  trust_fragile: ['trust_fragility', 'social_sensitivity'],
  recovery_ready: ['recovery_potential'],
  neglect_prone: ['neglect_risk', 'operation_history_weight'],
  maintenance_exposed: ['maintenance_exposure', 'route_difficulty'],
  public_attention_zone: ['public_visibility', 'social_sensitivity'],
  resource_heavy: ['resource_dependency', 'container_density'],
};

export const DISTRICT_CRITERION_TAGS: Record<DistrictCriterionId, DistrictGameplayTag> = {
  social_sensitivity: 'social_watch',
  route_difficulty: 'route_watch',
  container_density: 'container_watch',
  trust_fragility: 'trust_watch',
  recovery_potential: 'recovery_window',
  neglect_risk: 'neglect_watch',
  maintenance_exposure: 'maintenance_watch',
  operation_history_weight: 'memory_watch',
  public_visibility: 'social_watch',
  resource_dependency: 'resource_watch',
};
