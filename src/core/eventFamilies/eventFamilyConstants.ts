import type {
  EventFamilyAvailabilityPhase,
  EventFamilyDefinition,
  EventFamilyDomain,
  EventFamilyEchoSurface,
  EventFamilyOutcomeTone,
  EventFamilyVariantDefinition,
  EventFamilyVariantKind,
} from './eventFamilyTypes';

export const EVENT_FAMILY_REQUIRED_VARIANT_KINDS: readonly EventFamilyVariantKind[] = [
  'normal',
  'improved',
  'worsened',
  'carry_over',
  'crisis_adjacent',
  'player_adaptive',
  'resource_fatigue',
  'district_trust',
  'reward',
  'comeback',
  'recovery',
  'operation_era',
] as const;

export const EVENT_FAMILY_REQUIRED_ECHO_SURFACES: readonly EventFamilyEchoSurface[] = [
  'advisor',
  'report',
  'social',
  'map',
  'district_memory',
] as const;

export const EVENT_FAMILY_ALLOWED_OUTCOME_TONES: readonly EventFamilyOutcomeTone[] = [
  'neutral',
  'positive',
  'strained',
  'recovering',
  'warning',
  'crisis_watch',
  'resolved',
] as const;

export const EVENT_FAMILY_ALLOWED_DOMAINS: readonly EventFamilyDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'resource_recovery',
  'authority_milestone',
  'operation_era',
  'generic_operation',
] as const;

export const EVENT_FAMILY_ALLOWED_AVAILABILITY_PHASES: readonly EventFamilyAvailabilityPhase[] = [
  'pilot_training',
  'light_main_operation',
  'district_responsibility',
  'crisis_recovery_management',
  'citywide_operations',
  'long_term_career',
] as const;

export const EVENT_FAMILY_DUPLICATE_GUARD_MAX_SHARED_TAGS = 3;

export const EVENT_FAMILY_MOBILE_TEXT_LIMITS = {
  titlePattern: 72,
  situationLine: 120,
  decisionPressureLine: 120,
  echoHint: 90,
} as const;

export const EVENT_FAMILY_FORBIDDEN_COPY_TERMS: readonly string[] = [
  'sezon sonu',
  'sezon finali',
  '14 günlük sezon',
  'oyun bitti',
  'yeni sezona başla',
  'paywall',
  'satın almazsan',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
] as const;

export const EVENT_FAMILY_RECOMMENDED_DOMAIN_COVERAGE: readonly EventFamilyDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'operation_era',
  'authority_milestone',
] as const;

export const EVENT_FAMILY_RECOMMENDED_DISTRICT_COVERAGE = [
  'cumhuriyet',
  'merkez',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const EVENT_FAMILY_RECOMMENDED_VARIANT_COVERAGE: readonly EventFamilyVariantKind[] =
  EVENT_FAMILY_REQUIRED_VARIANT_KINDS;

function makeVariant(
  familyId: string,
  kind: EventFamilyVariantKind,
  tone: EventFamilyOutcomeTone,
  signals: EventFamilyVariantDefinition['triggerSignals'],
  extra?: Partial<EventFamilyVariantDefinition>,
): EventFamilyVariantDefinition {
  return {
    id: `${familyId}_${kind}`,
    familyId,
    kind,
    titlePattern: `${kind.replaceAll('_', ' ')} saha varyantı`,
    situationLine: 'Mahalle operasyonunda somut saha baskısı ölçülür.',
    decisionPressureLine: 'Karar ekip, zaman ve sosyal etki dengesine göre tartılır.',
    expectedOutcomeTone: tone,
    triggerSignals: signals,
    echoHints: [
      { surface: 'advisor', hint: 'Ece operasyon odağını kısa notla bağlar.', required: true },
      { surface: 'report', hint: 'Rapor ertesi gün izini özetler.', required: true },
      { surface: 'social', hint: 'Sosyal nabız karar etkisini yansıtır.', required: true },
    ],
    mapHintTags: [{ layer: 'operation_context', tone }],
    freshnessTags: [familyId, kind],
    mobileReadabilityScore: 88,
    ...extra,
  };
}

export const EVENT_FAMILY_VERIFY_FIXTURES: readonly EventFamilyDefinition[] = [
  {
    id: 'container_overflow_cumhuriyet',
    title: 'Cumhuriyet Konteyner Baskısı',
    shortLabel: 'Konteyner Baskısı',
    description: 'Cumhuriyet hattında konteyner taşması, sosyal algı ve ertesi gün izi birlikte izlenir.',
    domain: 'container',
    primaryDistrictIds: ['cumhuriyet'],
    availabilityPhases: ['light_main_operation', 'district_responsibility'],
    unlockRankPermissionId: 'event_family_rotation_preview',
    requiredRankKey: 'city_operations_manager',
    triggerSignals: ['day_progression', 'district_trust_low', 'carry_over_pending'],
    variantKinds: ['normal', 'improved', 'worsened', 'carry_over', 'reward', 'comeback'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'tomorrow_preview', 'district_memory'],
    outcomeTones: ['neutral', 'positive', 'strained', 'recovering'],
    qualityTags: ['concrete_district', 'container_domain', 'carry_over_ready'],
    duplicateGuardTags: ['cumhuriyet', 'container', 'overflow'],
    isPreviewOnly: true,
    playerFacingPriority: 10,
  },
  {
    id: 'vehicle_route_sanayi',
    title: 'Sanayi Araç Rota Baskısı',
    shortLabel: 'Araç Rota',
    description: 'Sanayi yoğunluğunda rota, filo yorgunluğu ve oyuncu karar tarzı sinyalleri ayrıştırılır.',
    domain: 'vehicle_route',
    primaryDistrictIds: ['sanayi'],
    availabilityPhases: ['district_responsibility', 'crisis_recovery_management'],
    unlockRankPermissionId: 'player_adaptive_event_preview',
    requiredRankKey: 'strategy_coordinator',
    triggerSignals: ['resource_fatigue', 'player_style_fast_response', 'crisis_watch'],
    variantKinds: ['normal', 'resource_fatigue', 'player_adaptive', 'crisis_adjacent', 'recovery'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'operation_result', 'district_memory'],
    outcomeTones: ['warning', 'crisis_watch', 'recovering', 'resolved'],
    qualityTags: ['vehicle_route_domain', 'resource_signal', 'adaptive_ready'],
    duplicateGuardTags: ['sanayi', 'vehicle_route', 'fatigue'],
    isPreviewOnly: true,
    playerFacingPriority: 20,
  },
  {
    id: 'personnel_morale_merkez',
    title: 'Merkez Personel Morali',
    shortLabel: 'Personel Morali',
    description: 'Merkez ekip temposu, moral desteği ve toparlanma notları için family zemini sağlar.',
    domain: 'personnel',
    primaryDistrictIds: ['merkez'],
    availabilityPhases: ['light_main_operation', 'district_responsibility'],
    unlockRankPermissionId: 'reward_recovery_event_preview',
    triggerSignals: ['resource_stability', 'player_style_resource_guardian'],
    variantKinds: ['normal', 'worsened', 'reward', 'recovery'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'hub'],
    outcomeTones: ['neutral', 'positive', 'recovering', 'strained'],
    qualityTags: ['personnel_domain', 'recovery_ready', 'mobile_clear'],
    duplicateGuardTags: ['merkez', 'personnel', 'morale'],
    isPreviewOnly: true,
    playerFacingPriority: 30,
  },
  {
    id: 'social_trust_cumhuriyet',
    title: 'Cumhuriyet Sosyal Güven',
    shortLabel: 'Sosyal Güven',
    description: 'Cumhuriyet sosyal nabzı, mahalle güveni ve oyuncu iletişim tarzı için varyant temeli kurar.',
    domain: 'social',
    primaryDistrictIds: ['cumhuriyet'],
    availabilityPhases: ['district_responsibility', 'citywide_operations'],
    unlockRankPermissionId: 'district_trust_preview',
    triggerSignals: ['district_trust_low', 'district_trust_high', 'player_style_public_focused'],
    variantKinds: ['normal', 'district_trust', 'player_adaptive', 'reward'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'district_memory'],
    outcomeTones: ['neutral', 'positive', 'strained', 'resolved'],
    qualityTags: ['social_domain', 'trust_signal', 'echo_ready'],
    duplicateGuardTags: ['cumhuriyet', 'social', 'trust'],
    isPreviewOnly: true,
    playerFacingPriority: 40,
  },
  {
    id: 'crisis_watch_istasyon',
    title: 'İstasyon Kriz Eşiği İzleme',
    shortLabel: 'Kriz Eşiği',
    description: 'İstasyon hattında risk yükselmeden önce izleme, geri dönüş ve toparlanma bağlamı hazırlanır.',
    domain: 'crisis_adjacent',
    primaryDistrictIds: ['istasyon'],
    availabilityPhases: ['crisis_recovery_management', 'citywide_operations'],
    unlockRankPermissionId: 'mini_story_chain_preview',
    triggerSignals: ['crisis_watch', 'crisis_active', 'carry_over_pending'],
    variantKinds: ['normal', 'crisis_adjacent', 'comeback', 'recovery'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'tomorrow_preview', 'district_memory'],
    outcomeTones: ['warning', 'crisis_watch', 'recovering', 'resolved'],
    qualityTags: ['crisis_watch', 'recovery_ready', 'district_memory'],
    duplicateGuardTags: ['istasyon', 'crisis_watch', 'recovery'],
    isPreviewOnly: true,
    playerFacingPriority: 50,
  },
  {
    id: 'district_balance_yesilvadi',
    title: 'Yeşilvadi Mahalle Dengesi',
    shortLabel: 'Mahalle Dengesi',
    description: 'Yeşilvadi kararlarının mahalle dengesi, ertesi gün izi ve pozitif sonuç bağı hazırlanır.',
    domain: 'district_balance',
    primaryDistrictIds: ['yesilvadi'],
    availabilityPhases: ['district_responsibility', 'citywide_operations'],
    unlockRankPermissionId: 'district_memory_trace_preview',
    triggerSignals: ['district_trust_high', 'resource_stability', 'carry_over_pending'],
    variantKinds: ['normal', 'improved', 'reward', 'carry_over'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'district_memory'],
    outcomeTones: ['neutral', 'positive', 'resolved'],
    qualityTags: ['district_balance', 'positive_outcome', 'carry_over_ready'],
    duplicateGuardTags: ['yesilvadi', 'district_balance', 'reward'],
    isPreviewOnly: true,
    playerFacingPriority: 60,
  },
  {
    id: 'operation_era_maintenance',
    title: 'Operasyon Dönemi Bakım Odağı',
    shortLabel: 'Bakım Dönemi',
    description: 'Uzun vadeli bakım teması, filo yorgunluğu ve operasyon dönemi içeriğine bağlanır.',
    domain: 'operation_era',
    primaryDistrictIds: [],
    availabilityPhases: ['citywide_operations', 'long_term_career'],
    unlockRankPermissionId: 'operation_era_preview',
    requiredRankKey: 'strategy_coordinator',
    triggerSignals: ['operation_era_active', 'resource_fatigue', 'resource_stability'],
    variantKinds: ['normal', 'operation_era', 'resource_fatigue', 'recovery'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'operation_result'],
    outcomeTones: ['neutral', 'warning', 'recovering', 'positive'],
    qualityTags: ['operation_era', 'resource_recovery', 'long_term'],
    duplicateGuardTags: ['operation_era', 'maintenance', 'resource'],
    isPreviewOnly: true,
    playerFacingPriority: 70,
  },
  {
    id: 'authority_milestone_citywide',
    title: 'Şehir Geneli Yetki Milestone',
    shortLabel: 'Yetki Milestone',
    description: 'Yetki artışıyla görünür olacak şehir geneli pozitif içerik ailesi için temel oluşturur.',
    domain: 'authority_milestone',
    primaryDistrictIds: [],
    availabilityPhases: ['citywide_operations', 'long_term_career'],
    unlockRankPermissionId: 'event_family_rotation_preview',
    requiredRankKey: 'chief_operations_director',
    triggerSignals: ['rank_unlock', 'authority_level'],
    variantKinds: ['normal', 'reward', 'operation_era'],
    echoSurfaces: ['advisor', 'report', 'social', 'map', 'hub'],
    outcomeTones: ['positive', 'resolved', 'neutral'],
    qualityTags: ['authority_milestone', 'reward_ready', 'citywide'],
    duplicateGuardTags: ['citywide', 'authority', 'milestone'],
    isPreviewOnly: true,
    playerFacingPriority: 80,
  },
] as const;

export const EVENT_FAMILY_VERIFY_VARIANTS: readonly EventFamilyVariantDefinition[] =
  EVENT_FAMILY_VERIFY_FIXTURES.flatMap((family) =>
    family.variantKinds.map((kind) =>
      makeVariant(
        family.id,
        kind,
        kind === 'reward'
          ? 'positive'
          : kind === 'comeback' || kind === 'recovery'
            ? 'recovering'
            : kind === 'crisis_adjacent'
              ? 'crisis_watch'
              : 'neutral',
        family.triggerSignals,
        kind === 'carry_over'
          ? { carryOverHint: 'Kararın ertesi güne taşınan izi takip edilir.' }
          : undefined,
      ),
    ),
  );
