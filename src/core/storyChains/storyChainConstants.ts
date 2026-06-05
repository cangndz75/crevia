import type {
  CreviaStoryChainHealthStatus,
  CreviaStoryChainKind,
  CreviaStoryChainStatus,
  CreviaStoryChainStepKind,
} from './storyChainTypes';

export const STORY_CHAIN_TUTORIAL_MAX_DAY = 1;
export const STORY_CHAIN_MOBILE_COPY_MAX = 96;
export const STORY_CHAIN_COMPACT_COPY_MAX = 72;
export const STORY_CHAIN_MIN_STEP_COUNT = 2;
export const STORY_CHAIN_MAX_STEP_COUNT = 3;

export const STORY_CHAIN_SCORE_WEIGHTS = {
  districtMatch: 25,
  domainMatch: 20,
  memoryFollowUp: 15,
  trustRecovery: 15,
  trustImprovement: 10,
  resourceFatigue: 15,
  crisisWatch: 15,
  activeRoute: 12,
  freshnessPenalty: 20,
  eventFamilyMatch: 18,
} as const;

export const STORY_CHAIN_KINDS: readonly CreviaStoryChainKind[] = [
  'route_pressure_chain',
  'container_recovery_chain',
  'social_trust_chain',
  'crisis_watch_chain',
  'district_recovery_chain',
  'visible_service_chain',
  'resource_fatigue_chain',
  'operation_followup_chain',
] as const;

export const STORY_CHAIN_STATUSES: readonly CreviaStoryChainStatus[] = [
  'preview',
  'candidate',
  'active_hint',
  'continued',
  'resolved',
  'cooled_down',
  'blocked',
] as const;

export const STORY_CHAIN_STEP_KINDS: readonly CreviaStoryChainStepKind[] = [
  'trigger',
  'follow_up',
  'pressure_shift',
  'recovery_window',
  'reward_echo',
  'comeback_window',
  'prevention_check',
  'closure',
] as const;

export const STORY_CHAIN_FORBIDDEN_COPY_TERMS: readonly string[] = [
  'oyun sonu',
  'sezon finali',
  '14 gun bitti',
  '14 günlük sezon',
  'premium',
  'satin al',
  'satın al',
  'paywall',
  'kilitli',
  'gercek zamanli gps',
  'gerçek zamanlı gps',
  'canli takip',
  'canlı takip',
  'kesin varis',
  'kesin varış',
  'kesin cozuldu',
  'kesin çözüldü',
  'basarisiz oldun',
  'başarısız oldun',
] as const;

export const STORY_CHAIN_PANIC_COPY_TERMS: readonly string[] = [
  'panik',
  'alarm',
  'kriz patladi',
  'kriz patladı',
  'coktu',
  'çöktü',
  'felaket',
  'acil durum ilani',
  'acil durum ilanı',
  'kontrol kaybedildi',
] as const;

export type CreviaStoryChainKindDefinition = {
  kind: CreviaStoryChainKind;
  label: string;
  shortLabel: string;
  tone: 'calm' | 'watch' | 'recovery' | 'pressure' | 'trust';
  relatedDomains: readonly string[];
  recommendedDistricts: readonly string[];
  recommendedVariantKinds: readonly string[];
  memoryIntent: string;
  trustIntent: string;
  freshnessIntent: string;
  maxStepCount: number;
  minStepCount: number;
  forbiddenTerms: readonly string[];
};

export const STORY_CHAIN_KIND_DEFINITIONS: Record<CreviaStoryChainKind, CreviaStoryChainKindDefinition> = {
  route_pressure_chain: {
    kind: 'route_pressure_chain',
    label: 'Rota Baskisi Zinciri',
    shortLabel: 'Rota Baskisi',
    tone: 'pressure',
    relatedDomains: ['vehicle_route', 'personnel', 'resource_pressure'],
    recommendedDistricts: ['sanayi', 'istasyon'],
    recommendedVariantKinds: ['carry_over', 'comeback', 'resource_fatigue', 'improved'],
    memoryIntent: 'Rota baskisi izini mahalle hafizasina tasimak.',
    trustIntent: 'Rota denge kararinin guven etkisini olcmek.',
    freshnessIntent: 'Ayni rota zincirini yakin gunlerde tekrar onerme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  container_recovery_chain: {
    kind: 'container_recovery_chain',
    label: 'Konteyner Toparlanma Zinciri',
    shortLabel: 'Konteyner Toparlanma',
    tone: 'recovery',
    relatedDomains: ['container_network', 'container', 'recovery'],
    recommendedDistricts: ['cumhuriyet'],
    recommendedVariantKinds: ['carry_over', 'recovery', 'district_trust', 'comeback'],
    memoryIntent: 'Konteyner cevresi izini blok hafizasina yazmak.',
    trustIntent: 'Toparlanma penceresinin guven etkisini korumak.',
    freshnessIntent: 'Ayni konteyner zincirini ust uste onerme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  social_trust_chain: {
    kind: 'social_trust_chain',
    label: 'Sosyal Guven Onarim Zinciri',
    shortLabel: 'Guven Onarim',
    tone: 'trust',
    relatedDomains: ['social_trust', 'district_trust', 'social'],
    recommendedDistricts: ['cumhuriyet', 'merkez'],
    recommendedVariantKinds: ['recovery', 'district_trust', 'reward', 'carry_over'],
    memoryIntent: 'Sosyal nabiz izini mahalle hafizasina tasimak.',
    trustIntent: 'Gorunur cevabin guven toparlanmasini desteklemek.',
    freshnessIntent: 'Ayni guven zincirini kisa aralikta tekrar etme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  crisis_watch_chain: {
    kind: 'crisis_watch_chain',
    label: 'Kriz Izleme Zinciri',
    shortLabel: 'Kriz Izleme',
    tone: 'watch',
    relatedDomains: ['crisis_adjacent', 'crisis_watch', 'prevention'],
    recommendedDistricts: ['sanayi', 'istasyon'],
    recommendedVariantKinds: ['crisis_adjacent', 'improved', 'recovery', 'carry_over'],
    memoryIntent: 'Watch katmani izini kontrollu hafizaya almak.',
    trustIntent: 'Onleyici takibin guven tonunu korumak.',
    freshnessIntent: 'Ayni watch zincirini panik dili olmadan seyrelt.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  district_recovery_chain: {
    kind: 'district_recovery_chain',
    label: 'Mahalle Toparlanma Zinciri',
    shortLabel: 'Toparlanma',
    tone: 'recovery',
    relatedDomains: ['recovery', 'district_memory', 'resource_recovery'],
    recommendedDistricts: ['yesilvadi', 'cumhuriyet'],
    recommendedVariantKinds: ['recovery', 'comeback', 'reward', 'district_trust'],
    memoryIntent: 'Toparlanma penceresini mahalle hafizasina yazmak.',
    trustIntent: 'Sakin hizmet algisini desteklemek.',
    freshnessIntent: 'Toparlanma zincirini ayni mahallede siklastirma.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  visible_service_chain: {
    kind: 'visible_service_chain',
    label: 'Gorunur Hizmet Zinciri',
    shortLabel: 'Gorunur Hizmet',
    tone: 'trust',
    relatedDomains: ['visible_service', 'operation_era', 'district_trust'],
    recommendedDistricts: ['merkez'],
    recommendedVariantKinds: ['improved', 'reward', 'district_trust', 'recovery'],
    memoryIntent: 'Gorunur mudahale izini meydan hafizasina tasimak.',
    trustIntent: 'Vatandas algisindaki guven gorunurlugunu korumak.',
    freshnessIntent: 'Gorunur hizmet zincirini ayni cadde icin tekrar etme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  resource_fatigue_chain: {
    kind: 'resource_fatigue_chain',
    label: 'Kaynak Yorgunlugu Zinciri',
    shortLabel: 'Kaynak Denge',
    tone: 'pressure',
    relatedDomains: ['resource_pressure', 'resource_fatigue', 'personnel'],
    recommendedDistricts: ['sanayi', 'istasyon', 'merkez', 'cumhuriyet', 'yesilvadi'],
    recommendedVariantKinds: ['resource_fatigue', 'comeback', 'carry_over', 'recovery'],
    memoryIntent: 'Kaynak baskisi izini ekip hafizasina yazmak.',
    trustIntent: 'Denge tercihinin guven etkisini olcmek.',
    freshnessIntent: 'Kaynak zincirini ust uste onerme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
  operation_followup_chain: {
    kind: 'operation_followup_chain',
    label: 'Operasyon Takip Zinciri',
    shortLabel: 'Operasyon Takip',
    tone: 'watch',
    relatedDomains: ['district_operation', 'operation_era', 'carry_over'],
    recommendedDistricts: ['merkez', 'istasyon', 'sanayi'],
    recommendedVariantKinds: ['carry_over', 'operation_era', 'comeback', 'improved'],
    memoryIntent: 'Operasyon takip izini saha hafizasina tasimak.',
    trustIntent: 'Takip kararinin guven tonunu korumak.',
    freshnessIntent: 'Ayni operasyon zincirini kisa pencerede tekrar etme.',
    maxStepCount: 3,
    minStepCount: 2,
    forbiddenTerms: STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  },
};

export function getStoryChainKindDefinition(kind: CreviaStoryChainKind): CreviaStoryChainKindDefinition {
  return STORY_CHAIN_KIND_DEFINITIONS[kind];
}

export function isStoryChainDayOneBlocked(day: number): boolean {
  return day <= STORY_CHAIN_TUTORIAL_MAX_DAY;
}

export function deriveStoryChainHealthStatus(
  status: CreviaStoryChainStatus,
  isFallback: boolean,
): CreviaStoryChainHealthStatus {
  if (status === 'blocked') return 'blocked';
  if (isFallback) return 'fallback';
  if (status === 'preview' || status === 'candidate') return 'limited';
  if (status === 'cooled_down' || status === 'resolved') return 'healthy';
  return 'watch';
}
