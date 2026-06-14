import { inferEventDomainUiFocus } from '@/core/events/eventDomainPresentation';
import type { EventDomainUiFocus } from '@/core/events/eventDomainPresentationTypes';
import { mapEventToContentCategory } from '@/core/events/eventVariationEngine';
import type { EventCard } from '@/core/models/EventCard';

import type {
  BuildEventGameplayVarietyProfileInput,
  EventGameplayDecisionShape,
  EventGameplayPressureDomain,
  EventGameplayPressureKind,
  EventGameplayRepetitionRisk,
  EventGameplayStrategyBias,
  EventGameplayVarietyProfile,
} from './eventGameplayVarietyTypes';

const RECENT_WINDOW = 6;

type DomainPressureRule = {
  primary: EventGameplayPressureKind[];
  secondary: EventGameplayPressureKind[];
  decisionShapes: EventGameplayDecisionShape[];
  strategyBias: EventGameplayStrategyBias;
  playerFacingLine: string;
  planHintLine: string;
  dispatchHintLine?: string;
  fieldHintLine?: string;
};

const DOMAIN_RULES: Record<EventGameplayPressureDomain, DomainPressureRule> = {
  transport: {
    primary: ['route_pressure', 'time_pressure'],
    secondary: ['resource_pressure', 'tomorrow_risk_pressure'],
    decisionShapes: ['fast_vs_costly', 'coverage_vs_depth'],
    strategyBias: 'mixed',
    playerFacingLine: 'Süre önemli; hızlı çözüm kaynak ve araç baskısı yaratabilir.',
    planHintLine: 'Hızlı müdahale rotayı kısaltır; kaynak maliyeti artabilir.',
    dispatchHintLine: 'Rota baskısı izleniyor',
    fieldHintLine: 'Rota süresi plan seçimine bağlı',
  },
  environment: {
    primary: ['resource_pressure', 'container_network_pressure'],
    secondary: ['tomorrow_risk_pressure', 'district_trust_pressure'],
    decisionShapes: ['repair_vs_prevent', 'short_term_vs_long_term'],
    strategyBias: 'long_term_fix',
    playerFacingLine: 'Bugün temizlemek mi, kalıcı ağ baskısını azaltmak mı?',
    planHintLine: 'Kalıcı yatırım ağ baskısını düşürebilir; acil temizlik daha hızlı.',
    dispatchHintLine: 'Çevre baskısı izleniyor',
    fieldHintLine: 'Alan dengesi izleniyor',
  },
  social: {
    primary: ['social_sensitivity', 'district_trust_pressure'],
    secondary: ['tomorrow_risk_pressure', 'resource_pressure'],
    decisionShapes: ['social_vs_resource', 'safe_vs_risky'],
    strategyBias: 'balanced_plan',
    playerFacingLine: 'Sosyal tepkiyi hızlı yatıştırmak mı, güveni uzun vadede güçlendirmek mi?',
    planHintLine: 'Dengeli plan sosyal tepkiyi kontrol eder; hızlı müdahale kaynak tüketebilir.',
    fieldHintLine: 'Sosyal tepki plan sonucuna duyarlı',
  },
  logistics: {
    primary: ['resource_pressure', 'route_pressure'],
    secondary: ['time_pressure', 'district_trust_pressure'],
    decisionShapes: ['coverage_vs_depth'],
    strategyBias: 'mixed',
    playerFacingLine: 'Her yere yetişmek mi, kritik noktaya derin müdahale mi?',
    planHintLine: 'Kapsam genişlerse kaynak dağılır; odaklı müdahale derin etki verir.',
    dispatchHintLine: 'Lojistik kapsamı izleniyor',
    fieldHintLine: 'Kapsam ve derinlik dengeleniyor',
  },
  maintenance: {
    primary: ['vehicle_maintenance_pressure', 'team_fatigue_pressure'],
    secondary: ['tomorrow_risk_pressure', 'resource_pressure'],
    decisionShapes: ['repair_vs_prevent', 'short_term_vs_long_term'],
    strategyBias: 'long_term_fix',
    playerFacingLine: 'Bugün aracı zorlamak mı, bakım penceresini korumak mı?',
    planHintLine: 'Kalıcı veya dengeli plan bakım riskini azaltır; hızlı müdahale yorgunluk uyarısı alır.',
    dispatchHintLine: 'Bakım riski izleniyor',
    fieldHintLine: 'Ekip yorgunluğu etkili',
  },
  container: {
    primary: ['container_network_pressure', 'district_trust_pressure'],
    secondary: ['resource_pressure', 'tomorrow_risk_pressure'],
    decisionShapes: ['repair_vs_prevent'],
    strategyBias: 'balanced_plan',
    playerFacingLine: 'Tek noktayı çözmek mi, konteyner ağını dengelemek mi?',
    planHintLine: 'Ağ dengesi için dengeli veya kalıcı plan daha uygun görünür.',
    dispatchHintLine: 'Konteyner ağı izleniyor',
    fieldHintLine: 'Ağ dengesi izleniyor',
  },
  general: {
    primary: ['calm_standard'],
    secondary: ['opportunity_window'],
    decisionShapes: ['standard'],
    strategyBias: 'none',
    playerFacingLine: 'Standart operasyon; karar etkisi sınırlı ama okunabilir.',
    planHintLine: 'Dengeli yaklaşım güvenli başlangıç noktası.',
  },
};

function clampFreshnessScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function dedupeSourceIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function hasResourcePressure(event: EventCard): boolean {
  return event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 0 ||
      (costs.staffHours ?? 0) > 0 ||
      (costs.vehicleUsage ?? 0) > 0
    );
  });
}

function hasSocialSensitivity(event: EventCard): boolean {
  return (event.previewEffects?.publicSatisfaction ?? 0) <= -5;
}

function hasTomorrowRisk(event: EventCard): boolean {
  return event.riskLevel === 'high' || event.riskLevel === 'critical' || (event.previewEffects?.risk ?? 0) >= 2;
}

function hasTimePressure(event: EventCard): boolean {
  return event.urgencyHours <= 4 || event.filterTags?.includes('urgent') === true;
}

function hasVehicleUsagePressure(event: EventCard): boolean {
  return event.decisions.some((d) => (d.costs?.vehicleUsage ?? 0) > 0);
}

function mapUiFocusToDomain(focus: EventDomainUiFocus): EventGameplayPressureDomain | null {
  switch (focus) {
    case 'vehicle_route':
      return 'transport';
    case 'container':
      return 'container';
    case 'social':
      return 'social';
    case 'personnel':
      return 'maintenance';
    case 'crisis_adjacent':
      return 'environment';
    case 'district_balance':
      return 'logistics';
    default:
      return null;
  }
}

function mapContentCategoryToDomain(category: string): EventGameplayPressureDomain | null {
  switch (category) {
    case 'vehicle_route':
      return 'transport';
    case 'waste_container':
      return 'container';
    case 'social_pressure':
    case 'citizen_complaint':
    case 'noise':
      return 'social';
    case 'personnel_morale':
    case 'maintenance':
      return 'maintenance';
    case 'inspection_gap':
    case 'permanent_solution':
      return 'environment';
    case 'market_vendor':
    case 'sidewalk_occupation':
    case 'community_support':
      return 'logistics';
    default:
      return null;
  }
}

export function resolveEventGameplayPressureDomain(event: EventCard): EventGameplayPressureDomain {
  const packDomain = event.contentPackMeta?.domain;
  if (packDomain) {
    const mapped = mapPackFamilyDomain(packDomain);
    if (mapped) return mapped;
  }

  const fromFocus = mapUiFocusToDomain(inferEventDomainUiFocus(event));
  if (fromFocus) return fromFocus;

  const category = event.contentCategory ?? mapEventToContentCategory(event);
  const fromCategory = mapContentCategoryToDomain(category);
  if (fromCategory) return fromCategory;

  return 'general';
}

function mapPackFamilyDomain(domain: string): EventGameplayPressureDomain | null {
  switch (domain) {
    case 'vehicle_route':
      return 'transport';
    case 'container':
      return 'container';
    case 'social':
      return 'social';
    case 'crisis_adjacent':
    case 'resource_recovery':
      return 'environment';
    case 'district_balance':
      return 'logistics';
    case 'generic_operation':
      return 'general';
    default:
      return null;
  }
}

function pickPrimaryPressure(
  domain: EventGameplayPressureDomain,
  event: EventCard,
  rule: DomainPressureRule,
): EventGameplayPressureKind {
  if (domain === 'general') {
    return 'calm_standard';
  }

  const candidates = rule.primary;

  if (domain === 'transport') {
    if (hasTimePressure(event)) return 'time_pressure';
    if (hasVehicleUsagePressure(event) || event.urgencyHours <= 6) return 'route_pressure';
    return candidates[0] ?? 'route_pressure';
  }

  if (domain === 'environment' || domain === 'container') {
    if (hasResourcePressure(event)) return 'resource_pressure';
    return domain === 'container' ? 'container_network_pressure' : 'container_network_pressure';
  }

  if (domain === 'social') {
    if (hasSocialSensitivity(event)) return 'social_sensitivity';
    if (event.district) return 'district_trust_pressure';
    return candidates[0] ?? 'social_sensitivity';
  }

  if (domain === 'logistics') {
    if (hasResourcePressure(event)) return 'resource_pressure';
    if (hasTimePressure(event)) return 'route_pressure';
    return 'resource_pressure';
  }

  if (domain === 'maintenance') {
    if (hasVehicleUsagePressure(event)) return 'vehicle_maintenance_pressure';
    if (hasResourcePressure(event)) return 'team_fatigue_pressure';
    return candidates[0] ?? 'vehicle_maintenance_pressure';
  }

  return candidates[0] ?? 'calm_standard';
}

function pickSecondaryPressures(
  domain: EventGameplayPressureDomain,
  primary: EventGameplayPressureKind,
  event: EventCard,
  rule: DomainPressureRule,
): EventGameplayPressureKind[] {
  const secondary: EventGameplayPressureKind[] = [];

  for (const kind of rule.secondary) {
    if (kind === primary) continue;
    if (secondary.length >= 3) break;

    if (kind === 'resource_pressure' && !hasResourcePressure(event)) continue;
    if (kind === 'social_sensitivity' && !hasSocialSensitivity(event)) continue;
    if (kind === 'tomorrow_risk_pressure' && !hasTomorrowRisk(event)) continue;
    if (kind === 'time_pressure' && !hasTimePressure(event)) continue;
    if (kind === 'route_pressure' && domain !== 'transport' && domain !== 'logistics') continue;
    if (kind === 'opportunity_window' && !event.filterTags?.includes('opportunity')) continue;
    if (kind === 'district_trust_pressure' && !event.district) continue;
    if (kind === 'team_fatigue_pressure' && domain !== 'maintenance') continue;
    if (kind === 'vehicle_maintenance_pressure' && !hasVehicleUsagePressure(event)) continue;
    if (kind === 'container_network_pressure' && domain !== 'container' && domain !== 'environment') {
      continue;
    }

    secondary.push(kind);
  }

  return secondary.slice(0, 3);
}

function pickDecisionShape(
  domain: EventGameplayPressureDomain,
  primary: EventGameplayPressureKind,
  event: EventCard,
  rule: DomainPressureRule,
): EventGameplayDecisionShape {
  if (domain === 'general' || primary === 'calm_standard') {
    return 'standard';
  }

  const shapes = rule.decisionShapes;
  if (shapes.length === 1) return shapes[0]!;

  if (domain === 'transport') {
    return hasResourcePressure(event) ? 'fast_vs_costly' : 'coverage_vs_depth';
  }

  if (domain === 'social') {
    return hasResourcePressure(event) ? 'social_vs_resource' : 'safe_vs_risky';
  }

  if (domain === 'environment' || domain === 'container' || domain === 'maintenance') {
    return hasTomorrowRisk(event) ? 'short_term_vs_long_term' : 'repair_vs_prevent';
  }

  return shapes[0] ?? 'standard';
}

function resolveStrategyBias(
  domain: EventGameplayPressureDomain,
  primary: EventGameplayPressureKind,
  rule: DomainPressureRule,
  isDay1: boolean,
): EventGameplayStrategyBias {
  if (isDay1) return 'balanced_plan';

  if (primary === 'calm_standard') return 'none';

  if (domain === 'transport' && (primary === 'route_pressure' || primary === 'time_pressure')) {
    return 'mixed';
  }

  if (domain === 'social' && primary === 'social_sensitivity') {
    return 'balanced_plan';
  }

  if (domain === 'maintenance') {
    return 'long_term_fix';
  }

  return rule.strategyBias;
}

function inputIsLowData(event: EventCard): boolean {
  const hasDistrict = Boolean((event.district ?? '').trim());
  const hasDescription = Boolean((event.description ?? '').trim());
  const hasEffects =
    Math.abs(event.previewEffects?.publicSatisfaction ?? 0) > 0 ||
    Math.abs(event.previewEffects?.risk ?? 0) > 0;
  return !hasDistrict && !hasDescription && !hasEffects && event.riskLevel === 'low';
}

function scoreRepetitionRisk(
  profile: Pick<EventGameplayVarietyProfile, 'domain' | 'primaryPressure' | 'decisionShape'>,
  recentProfiles: BuildEventGameplayVarietyProfileInput['recentProfiles'],
): { risk: EventGameplayRepetitionRisk; freshnessScore: number } {
  const recent = recentProfiles ?? [];
  if (recent.length === 0) {
    return { risk: 'low', freshnessScore: 85 };
  }

  const window = recent.slice(-RECENT_WINDOW);
  let penalty = 0;

  const sameShapeCount = window.filter((p) => p.decisionShape === profile.decisionShape).length;
  if (sameShapeCount >= 2) penalty += 25;
  else if (sameShapeCount >= 1) penalty += 10;

  const last = window[window.length - 1];
  if (last?.primaryPressure === profile.primaryPressure) penalty += 20;

  const consecutivePressure = window
    .slice(-2)
    .every((p) => p.primaryPressure === profile.primaryPressure);
  if (consecutivePressure && window.length >= 2) penalty += 15;

  const sameDomainDifferentPressure = window.some(
    (p) => p.domain === profile.domain && p.primaryPressure !== profile.primaryPressure,
  );
  if (sameDomainDifferentPressure) penalty -= 10;

  const sameDomainSameShape = window.some(
    (p) => p.domain === profile.domain && p.decisionShape === profile.decisionShape,
  );
  if (sameDomainSameShape && profile.domain !== 'general') penalty += 8;

  const differentDomainSameShape = window.some(
    (p) => p.domain !== profile.domain && p.decisionShape === profile.decisionShape,
  );
  if (differentDomainSameShape && sameShapeCount >= 1) {
    // orta risk — penalty zaten var
  }

  const freshnessScore = clampFreshnessScore(100 - penalty);
  let risk: EventGameplayRepetitionRisk = 'low';
  if (penalty >= 35) risk = 'high';
  else if (penalty >= 15) risk = 'medium';

  return { risk, freshnessScore };
}

export function buildEventGameplayVarietyProfile(
  event: EventCard,
  input: BuildEventGameplayVarietyProfileInput = {},
): EventGameplayVarietyProfile {
  const isDay1 = input.isDay1LearningEvent === true || input.day === 1;

  if (inputIsLowData(event)) {
    return {
      eventId: event.id,
      familyId: event.contentPackMeta?.familyId,
      variantId: event.contentPackMeta?.variantId,
      domain: 'general',
      primaryPressure: 'calm_standard',
      secondaryPressures: [],
      strategyBias: isDay1 ? 'balanced_plan' : 'none',
      decisionShape: 'standard',
      freshnessScore: 80,
      repetitionRisk: 'low',
      playerFacingLine: DOMAIN_RULES.general.playerFacingLine,
      planHintLine: DOMAIN_RULES.general.planHintLine,
      sourceLabel: 'Gameplay variety fallback',
      sourceIds: dedupeSourceIds([event.id, 'variety:low_data_fallback']),
    };
  }

  const domain = resolveEventGameplayPressureDomain(event);
  const rule = DOMAIN_RULES[domain];
  const primaryPressure = isDay1 ? 'calm_standard' : pickPrimaryPressure(domain, event, rule);
  const secondaryPressures = isDay1
    ? []
    : pickSecondaryPressures(domain, primaryPressure, event, rule);
  const decisionShape = isDay1 ? 'standard' : pickDecisionShape(domain, primaryPressure, event, rule);
  const strategyBias = resolveStrategyBias(domain, primaryPressure, rule, isDay1);

  const partial = { domain, primaryPressure, decisionShape };
  const { risk, freshnessScore } = scoreRepetitionRisk(partial, input.recentProfiles);

  const sourceIds = dedupeSourceIds([
    event.id,
    `domain:${domain}`,
    `pressure:${primaryPressure}`,
    `shape:${decisionShape}`,
    event.contentPackMeta?.familyId ?? '',
    event.contentProfileId ?? '',
    event.contentCategory ?? mapEventToContentCategory(event),
  ]);

  return {
    eventId: event.id,
    familyId: event.contentPackMeta?.familyId,
    variantId: event.contentPackMeta?.variantId,
    domain,
    primaryPressure,
    secondaryPressures,
    strategyBias,
    decisionShape,
    freshnessScore,
    repetitionRisk: risk,
    playerFacingLine: isDay1
      ? 'İlk operasyon; bulgular plan seçimini yönlendirecek.'
      : rule.playerFacingLine,
    planHintLine: rule.planHintLine,
    dispatchHintLine: rule.dispatchHintLine,
    fieldHintLine: rule.fieldHintLine,
    sourceLabel: 'Gameplay variety model',
    sourceIds,
  };
}

export function buildProfilesForEventIds(
  events: EventCard[],
  options?: BuildEventGameplayVarietyProfileInput,
): EventGameplayVarietyProfile[] {
  const profiles: EventGameplayVarietyProfile[] = [];
  const seedRecent = options?.recentProfiles ?? [];
  for (const event of events) {
    profiles.push(
      buildEventGameplayVarietyProfile(event, {
        day: options?.day,
        isDay1LearningEvent: options?.isDay1LearningEvent,
        recentProfiles: [
          ...seedRecent,
          ...profiles.map((p) => ({
            domain: p.domain,
            primaryPressure: p.primaryPressure,
            decisionShape: p.decisionShape,
          })),
        ],
      }),
    );
  }
  return profiles;
}
