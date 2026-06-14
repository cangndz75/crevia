import {
  DOMAIN_AXIS_PREFERENCE,
  DOMAIN_BASE_VECTORS,
  DOMAIN_OPPORTUNITY_LINES,
  DOMAIN_CAUTION_LINES,
  DOMAIN_PRIORITY_BASE,
  DOMAIN_REASON_LINES,
  DOMAIN_TITLES,
  OPERATION_FEED_COST_REASON_BY_BIAS,
  RESOURCE_PRESSURE_DIFFERENTIATION_DAY_ACTIVE,
  RESOURCE_PRESSURE_DIFFERENTIATION_MAX_PROFILES,
  RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX,
} from './resourcePressureDifferentiationConstants';
import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import type {
  ResourcePressureConfidence,
  ResourcePressureCostAxis,
  ResourcePressureCostVector,
  ResourcePressureDifferentiationInput,
  ResourcePressureDifferentiationProfile,
  ResourcePressureDifferentiationResult,
  ResourcePressureDomain,
  ResourcePressureIntensity,
} from './resourcePressureDifferentiationTypes';

let profileCounter = 0;

function nextProfileId(prefix: string): string {
  profileCounter += 1;
  return `rpd_${prefix}_${profileCounter}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeCostVector(vector: ResourcePressureCostVector): ResourcePressureCostVector {
  return {
    budget: clamp(vector.budget, 0, 100),
    team: clamp(vector.team, 0, 100),
    vehicle: clamp(vector.vehicle, 0, 100),
    time: clamp(vector.time, 0, 100),
    trust: clamp(vector.trust, 0, 100),
    attention: clamp(vector.attention, 0, 100),
    futureRisk: clamp(vector.futureRisk, 0, 100),
  };
}

function axisValue(vector: ResourcePressureCostVector, axis: ResourcePressureCostAxis): number {
  switch (axis) {
    case 'budget':
      return vector.budget;
    case 'team':
      return vector.team;
    case 'vehicle':
      return vector.vehicle;
    case 'time':
      return vector.time;
    case 'trust':
      return vector.trust;
    case 'attention':
      return vector.attention;
    case 'future_risk':
      return vector.futureRisk;
    default:
      return 0;
  }
}

export function resolveDominantAxis(
  vector: ResourcePressureCostVector,
  domain?: ResourcePressureDomain,
): ResourcePressureCostAxis {
  const normalized = normalizeCostVector(vector);
  const preference =
    (domain && DOMAIN_AXIS_PREFERENCE[domain]) ??
    ([
      'future_risk',
      'attention',
      'trust',
      'vehicle',
      'time',
      'team',
      'budget',
    ] as ResourcePressureCostAxis[]);

  let best: ResourcePressureCostAxis = preference[0] ?? 'attention';
  let bestValue = -1;
  for (const axis of preference) {
    const value = axisValue(normalized, axis);
    if (value > bestValue) {
      bestValue = value;
      best = axis;
    }
  }
  return best;
}

export function directCostSum(vector: ResourcePressureCostVector): number {
  const normalized = normalizeCostVector(vector);
  return normalized.budget + normalized.team + normalized.vehicle;
}

export function vectorsEqual(a: ResourcePressureCostVector, b: ResourcePressureCostVector): boolean {
  const left = normalizeCostVector(a);
  const right = normalizeCostVector(b);
  return (
    left.budget === right.budget &&
    left.team === right.team &&
    left.vehicle === right.vehicle &&
    left.time === right.time &&
    left.trust === right.trust &&
    left.attention === right.attention &&
    left.futureRisk === right.futureRisk
  );
}

function dayIntensityScale(day: number): number {
  if (day < RESOURCE_PRESSURE_DIFFERENTIATION_DAY_ACTIVE) return 0.35;
  if (day < 10) return 0.88;
  return 1;
}

function scaleVector(
  vector: ResourcePressureCostVector,
  scale: number,
): ResourcePressureCostVector {
  return normalizeCostVector({
    budget: vector.budget * scale,
    team: vector.team * scale,
    vehicle: vector.vehicle * scale,
    time: vector.time * scale,
    trust: vector.trust * scale,
    attention: vector.attention * scale,
    futureRisk: vector.futureRisk * scale,
  });
}

function pickLine(domain: ResourcePressureDomain, seed = 0, previousLines?: readonly string[]): string {
  const lines = DOMAIN_REASON_LINES[domain];
  return pickSurfaceCopy(domain, 'resource_pressure', lines, { seed, previousLines });
}

function pickOpportunityLine(domain: ResourcePressureDomain, seed = 0): string | undefined {
  const lines = DOMAIN_OPPORTUNITY_LINES[domain];
  if (!lines?.length) return undefined;
  return pickSurfaceCopy(domain, 'resource_pressure', lines, { seed, duplicateKey: 'opportunity' });
}

function pickCautionLine(domain: ResourcePressureDomain, seed = 0): string | undefined {
  const lines = DOMAIN_CAUTION_LINES[domain];
  if (!lines?.length) return undefined;
  return pickSurfaceCopy(domain, 'resource_pressure', lines, { seed, duplicateKey: 'caution' });
}

function portfolioKindToDomain(kind: string): ResourcePressureDomain | undefined {
  switch (kind) {
    case 'active_operation':
      return 'general_resource';
    case 'risk_signal':
      return 'risk_signal';
    case 'route_pressure':
      return 'route_pressure';
    case 'social_pressure':
      return 'social_trust_pressure';
    case 'container_pressure':
      return 'container_pressure';
    case 'resource_pressure':
      return 'general_resource';
    case 'district_pressure':
      return 'district_neglect_pressure';
    case 'maintenance_warning':
      return 'vehicle_strain_pressure';
    case 'memory_trace':
      return 'follow_up_pressure';
    case 'recovery_opportunity':
      return 'recovery_opportunity';
    case 'positive_opportunity':
      return 'safe_watch';
    case 'follow_up_candidate':
      return 'follow_up_pressure';
    default:
      return undefined;
  }
}

function deferKindToDomain(kind: string): ResourcePressureDomain | undefined {
  switch (kind) {
    case 'route_may_strain':
      return 'route_pressure';
    case 'social_reaction_may_grow':
      return 'social_trust_pressure';
    case 'resource_cost_may_rise':
      return 'general_resource';
    case 'trust_may_drop':
      return 'social_trust_pressure';
    case 'pressure_may_grow':
      return 'district_neglect_pressure';
    case 'opportunity_may_expire':
      return 'recovery_opportunity';
    case 'memory_trace_may_harden':
      return 'follow_up_pressure';
    case 'safe_to_watch':
      return 'safe_watch';
    default:
      return undefined;
  }
}

function feedBiasToDomain(kind: string): ResourcePressureDomain | undefined {
  switch (kind) {
    case 'route_pressure_bias':
      return 'route_pressure';
    case 'container_pressure_bias':
      return 'container_pressure';
    case 'social_trust_bias':
      return 'social_trust_pressure';
    case 'resource_pressure_bias':
      return 'general_resource';
    case 'follow_up_bias':
      return 'follow_up_pressure';
    case 'district_neglect_bias':
      return 'district_neglect_pressure';
    case 'district_recovery_bias':
      return 'recovery_opportunity';
    case 'defer_risk_bias':
      return 'risk_signal';
    case 'memory_trace_bias':
      return 'follow_up_pressure';
    case 'positive_comeback_bias':
      return 'recovery_opportunity';
    case 'city_rhythm_bias':
      return 'general_resource';
    case 'safe_watch_bias':
      return 'safe_watch';
    default:
      return undefined;
  }
}

type ProfileDraft = {
  domain: ResourcePressureDomain;
  title?: string;
  reasonLine?: string;
  opportunityCostLine?: string;
  cautionLine?: string;
  sourceIds: string[];
  priority?: number;
  intensity?: ResourcePressureIntensity;
  confidence?: ResourcePressureConfidence;
  isFallback?: boolean;
  vectorAdjust?: Partial<ResourcePressureCostVector>;
  hintBucket?: 'portfolio' | 'defer' | 'operation_feed' | 'daily_capacity';
};

function buildProfile(draft: ProfileDraft, seed: number): ResourcePressureDifferentiationProfile {
  const base = DOMAIN_BASE_VECTORS[draft.domain];
  const scaled = scaleVector(
    {
      ...base,
      ...draft.vectorAdjust,
    },
    1,
  );
  const domain = draft.domain;
  const reasonLine = clampLine(
    draft.reasonLine ?? pickLine(domain, seed),
    RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX,
  );

  return {
    id: nextProfileId(domain),
    domain,
    title: draft.title ?? DOMAIN_TITLES[domain],
    reasonLine,
    costVector: scaled,
    dominantAxis: resolveDominantAxis(scaled, domain),
    opportunityCostLine: draft.opportunityCostLine
      ? clampLine(draft.opportunityCostLine, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX)
      : pickOpportunityLine(domain, seed)
        ? clampLine(pickOpportunityLine(domain, seed)!, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX)
        : undefined,
    cautionLine: draft.cautionLine
      ? clampLine(draft.cautionLine, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX)
      : pickCautionLine(domain, seed)
        ? clampLine(pickCautionLine(domain, seed)!, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX)
        : undefined,
    sourceIds: uniqueStrings(draft.sourceIds),
    priority: clamp(
      draft.priority ?? DOMAIN_PRIORITY_BASE[domain],
      1,
      100,
    ),
    intensity: draft.intensity ?? 'medium',
    confidence: draft.confidence ?? 'medium',
    isFallback: draft.isFallback ?? false,
  };
}

function extractPortfolioDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const item of asArray(result.items)) {
    if (!isRecord(item)) continue;
    const kind = asString(item.kind);
    if (!kind) continue;
    const domain = portfolioKindToDomain(kind);
    if (!domain) continue;
    const pressureLevel = asString(item.pressureLevel);
    const intensity: ResourcePressureIntensity =
      pressureLevel === 'high' ? 'high' : pressureLevel === 'low' ? 'low' : 'medium';
    drafts.push({
      domain: kind === 'resource_pressure' ? 'general_resource' : domain,
      title: asString(item.title) ?? DOMAIN_TITLES[domain],
      reasonLine: asString(item.recommendedReason) ?? asString(item.selectBenefitLine),
      sourceIds: uniqueStrings([
        asString(item.id),
        ...asArray(item.sourceIds).map(asString),
      ]),
      priority: asNumber(item.priority) ?? DOMAIN_PRIORITY_BASE[domain],
      intensity,
      confidence: 'medium',
      vectorAdjust:
        kind === 'resource_pressure'
          ? { team: 62, vehicle: 35, budget: 58 }
          : kind === 'container_pressure'
            ? { futureRisk: 82, trust: 58 }
            : undefined,
      hintBucket: 'portfolio',
    });
  }
  return drafts;
}

function extractDeferDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const binding of asArray(result.bindings)) {
    if (!isRecord(binding)) continue;
    const kind = asString(binding.kind);
    if (!kind) continue;
    const domain = deferKindToDomain(kind);
    if (!domain) continue;
    drafts.push({
      domain,
      title: asString(binding.title) ?? DOMAIN_TITLES[domain],
      reasonLine: asString(binding.tomorrowLine) ?? asString(binding.reportLine),
      sourceIds: uniqueStrings([
        asString(binding.id),
        ...asArray(binding.sourceIds).map(asString),
      ]),
      priority: asNumber(binding.priority) ?? DOMAIN_PRIORITY_BASE[domain] - 2,
      intensity: domain === 'safe_watch' ? 'low' : 'medium',
      confidence: 'medium',
      hintBucket: 'defer',
    });
  }
  return drafts;
}

function extractOperationFeedDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const bias of asArray(result.biases)) {
    if (!isRecord(bias)) continue;
    const kind = asString(bias.kind);
    if (!kind) continue;
    const domain = feedBiasToDomain(kind);
    if (!domain) continue;
    drafts.push({
      domain,
      title: asString(bias.title) ?? DOMAIN_TITLES[domain],
      reasonLine:
        OPERATION_FEED_COST_REASON_BY_BIAS[kind] ??
        asString(bias.reasonLine),
      sourceIds: uniqueStrings([
        asString(bias.id),
        ...asArray(bias.sourceIds).map(asString),
      ]),
      priority: asNumber(bias.priority) ?? DOMAIN_PRIORITY_BASE[domain],
      intensity: 'medium',
      confidence:
        asString(bias.confidence) === 'high'
          ? 'high'
          : asString(bias.confidence) === 'low'
            ? 'low'
            : 'medium',
      hintBucket: 'operation_feed',
    });
  }
  for (const binding of asArray(result.itemBindings)) {
    if (!isRecord(binding)) continue;
    const reason = asString(binding.reasonLine);
    if (!reason) continue;
    drafts.push({
      domain: 'general_resource',
      title: asString(binding.title) ?? 'Operasyon odağı',
      reasonLine: reason,
      sourceIds: uniqueStrings([
        asString(binding.id),
        ...asArray(binding.sourceIds).map(asString),
      ]),
      priority: asNumber(binding.priority) ?? 70,
      intensity: 'medium',
      confidence: 'medium',
      hintBucket: 'operation_feed',
    });
  }
  return drafts;
}

function extractFollowUpDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const action of asArray(result.availableActions ?? result.actions)) {
    if (!isRecord(action)) continue;
    drafts.push({
      domain: 'follow_up_pressure',
      title: asString(action.title) ?? DOMAIN_TITLES.follow_up_pressure,
      reasonLine: asString(action.reasonLine) ?? asString(action.summaryLine),
      sourceIds: uniqueStrings([
        asString(action.id),
        ...asArray(action.sourceIds).map(asString),
      ]),
      priority: DOMAIN_PRIORITY_BASE.follow_up_pressure,
      intensity: 'low',
      confidence: 'medium',
      hintBucket: 'daily_capacity',
    });
  }
  return drafts;
}

function extractDistrictNeglectDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const signal of asArray(result.signals ?? result.candidates)) {
    if (!isRecord(signal)) continue;
    const kind = asString(signal.kind) ?? asString(signal.signalKind);
    const domain: ResourcePressureDomain =
      kind?.includes('recovery') ? 'recovery_opportunity' : 'district_neglect_pressure';
    drafts.push({
      domain,
      title: asString(signal.title) ?? DOMAIN_TITLES[domain],
      reasonLine: asString(signal.line) ?? asString(signal.summaryLine),
      sourceIds: uniqueStrings([
        asString(signal.id),
        ...asArray(signal.sourceIds).map(asString),
      ]),
      priority: DOMAIN_PRIORITY_BASE[domain],
      intensity: asString(signal.intensity) === 'high' ? 'high' : 'medium',
      confidence: 'medium',
      hintBucket: 'portfolio',
    });
  }
  return drafts;
}

function extractStrategicContentDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const candidate of asArray(result.candidates)) {
    if (!isRecord(candidate)) continue;
    const focus = asString(candidate.focusKind) ?? asString(candidate.kind);
    const domain: ResourcePressureDomain | undefined =
      focus === 'route_focus'
        ? 'route_pressure'
        : focus === 'container_focus'
          ? 'container_pressure'
          : focus === 'social_focus'
            ? 'social_trust_pressure'
            : focus === 'resource_focus'
              ? 'general_resource'
              : undefined;
    if (!domain) continue;
    drafts.push({
      domain,
      title: asString(candidate.title) ?? DOMAIN_TITLES[domain],
      reasonLine: asString(candidate.line) ?? asString(candidate.summaryLine),
      sourceIds: uniqueStrings([
        asString(candidate.id),
        ...asArray(candidate.sourceIds).map(asString),
      ]),
      priority: asNumber(candidate.priority) ?? DOMAIN_PRIORITY_BASE[domain] - 1,
      intensity: 'medium',
      confidence: 'medium',
      hintBucket: 'daily_capacity',
    });
  }
  return drafts;
}

function extractCityRhythmDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const slot of asArray(result.slots ?? result.rhythmSlots)) {
    if (!isRecord(slot)) continue;
    const focus = asString(slot.focusKind) ?? asString(slot.kind);
    const domain: ResourcePressureDomain | undefined =
      focus === 'route_rhythm'
        ? 'route_pressure'
        : focus === 'social_rhythm'
          ? 'social_trust_pressure'
          : focus === 'resource_rhythm'
            ? 'general_resource'
            : focus === 'container_rhythm'
              ? 'container_pressure'
              : undefined;
    if (!domain) continue;
    drafts.push({
      domain,
      title: asString(slot.title) ?? DOMAIN_TITLES[domain],
      reasonLine: asString(slot.line) ?? asString(slot.summaryLine),
      sourceIds: uniqueStrings([
        asString(slot.id),
        ...asArray(slot.sourceIds).map(asString),
      ]),
      priority: asNumber(slot.priority) ?? DOMAIN_PRIORITY_BASE[domain] - 3,
      intensity: 'medium',
      confidence: 'medium',
      hintBucket: 'daily_capacity',
    });
  }
  return drafts;
}

function extractRuntimeDrafts(input: ResourcePressureDifferentiationInput): ProfileDraft[] {
  const drafts: ProfileDraft[] = [];
  if (isRecord(input.vehicleMaintenanceState)) {
    drafts.push({
      domain: 'vehicle_strain_pressure',
      title: DOMAIN_TITLES.vehicle_strain_pressure,
      reasonLine: asString(input.vehicleMaintenanceState.summary) ?? pickLine('vehicle_strain_pressure', 0),
      sourceIds: uniqueStrings([
        asString(input.vehicleMaintenanceState.id),
        ...asArray(input.vehicleMaintenanceState.sourceIds).map(asString),
      ]),
      priority: DOMAIN_PRIORITY_BASE.vehicle_strain_pressure,
      intensity: 'medium',
      confidence: 'medium',
      hintBucket: 'daily_capacity',
    });
  }
  if (isRecord(input.teamSpecializationState)) {
    drafts.push({
      domain: 'team_capacity_pressure',
      title: DOMAIN_TITLES.team_capacity_pressure,
      reasonLine: asString(input.teamSpecializationState.summary) ?? pickLine('team_capacity_pressure', 0),
      sourceIds: uniqueStrings([
        asString(input.teamSpecializationState.id),
        ...asArray(input.teamSpecializationState.sourceIds).map(asString),
      ]),
      priority: DOMAIN_PRIORITY_BASE.team_capacity_pressure,
      intensity: 'medium',
      confidence: 'medium',
      hintBucket: 'daily_capacity',
    });
  }
  if (isRecord(input.socialPulseState)) {
    const score = asNumber(input.socialPulseState.globalPulseScore) ?? 55;
    if (score >= 50) {
      drafts.push({
        domain: 'social_trust_pressure',
        title: DOMAIN_TITLES.social_trust_pressure,
        reasonLine: pickLine('social_trust_pressure', 1),
        sourceIds: ['social_pulse_runtime'],
        priority: DOMAIN_PRIORITY_BASE.social_trust_pressure - 1,
        intensity: score >= 65 ? 'high' : 'medium',
        confidence: 'medium',
        hintBucket: 'daily_capacity',
      });
    }
  }
  return drafts;
}

function extractPositiveComebackDrafts(result: unknown): ProfileDraft[] {
  if (!isRecord(result)) return [];
  const drafts: ProfileDraft[] = [];
  for (const candidate of asArray(result.candidates)) {
    if (!isRecord(candidate)) continue;
    drafts.push({
      domain: 'recovery_opportunity',
      title: asString(candidate.title) ?? DOMAIN_TITLES.recovery_opportunity,
      reasonLine: asString(candidate.line) ?? asString(candidate.benefitLine),
      sourceIds: uniqueStrings([
        asString(candidate.id),
        ...asArray(candidate.sourceIds).map(asString),
      ]),
      priority: DOMAIN_PRIORITY_BASE.recovery_opportunity + 2,
      intensity: 'low',
      confidence: 'medium',
      hintBucket: 'portfolio',
      vectorAdjust: { budget: 25, team: 35, attention: 50 },
    });
  }
  return drafts;
}

function mergeDrafts(drafts: ProfileDraft[]): ResourcePressureDifferentiationProfile[] {
  const byDomain = new Map<ResourcePressureDomain, ProfileDraft>();
  for (const draft of drafts) {
    const existing = byDomain.get(draft.domain);
    if (!existing || (draft.priority ?? 0) > (existing.priority ?? 0)) {
      byDomain.set(draft.domain, {
        ...draft,
        sourceIds: uniqueStrings([
          ...(existing?.sourceIds ?? []),
          ...draft.sourceIds,
        ]),
      });
    } else if (existing) {
      existing.sourceIds = uniqueStrings([...existing.sourceIds, ...draft.sourceIds]);
    }
  }
  return [...byDomain.values()]
    .map((draft, index) => buildProfile(draft, index))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, RESOURCE_PRESSURE_DIFFERENTIATION_MAX_PROFILES);
}

function applyDayScaling(
  profiles: ResourcePressureDifferentiationProfile[],
  day: number,
): ResourcePressureDifferentiationProfile[] {
  const scale = dayIntensityScale(day);
  return profiles.map((profile) => {
    const costVector = scaleVector(profile.costVector, scale);
    return {
      ...profile,
      costVector,
      dominantAxis: resolveDominantAxis(costVector, profile.domain),
      intensity:
        scale < 0.5 ? 'low' : profile.intensity === 'high' && day < 10 ? 'medium' : profile.intensity,
    };
  });
}

function ensureResourceDistinct(
  profiles: ResourcePressureDifferentiationProfile[],
): ResourcePressureDifferentiationProfile[] {
  const general = profiles.find((profile) => profile.domain === 'general_resource');
  const container = profiles.find((profile) => profile.domain === 'container_pressure');
  if (general && container && vectorsEqual(general.costVector, container.costVector)) {
    return profiles.map((profile) => {
      if (profile.domain !== 'container_pressure') return profile;
      const costVector = normalizeCostVector({
        ...profile.costVector,
        futureRisk: Math.max(profile.costVector.futureRisk, 82),
        trust: Math.max(profile.costVector.trust, 58),
        attention: Math.max(profile.costVector.attention, 58),
      });
      return {
        ...profile,
        costVector,
        dominantAxis: resolveDominantAxis(costVector, profile.domain),
      };
    });
  }
  return profiles;
}

function authorityExplanationOnly(
  profiles: ResourcePressureDifferentiationProfile[],
  authorityExpansionSummary: unknown,
): ResourcePressureDifferentiationProfile[] {
  if (!isRecord(authorityExpansionSummary)) return profiles;
  const detailLevel = asString(authorityExpansionSummary.detailLevel);
  if (detailLevel !== 'detailed') return profiles;
  return profiles.map((profile) => ({
    ...profile,
    reasonLine: clampLine(
      `${profile.reasonLine} Yetki görünümü maliyeti değiştirmez; okumayı derinleştirir.`,
      RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX,
    ),
    confidence: profile.confidence === 'low' ? 'medium' : profile.confidence,
  }));
}

export function buildResourcePressureDifferentiation(
  input: ResourcePressureDifferentiationInput,
): ResourcePressureDifferentiationResult {
  const day = input.day;
  const isActive = day >= RESOURCE_PRESSURE_DIFFERENTIATION_DAY_ACTIVE;

  if (!isActive) {
    const safe = buildProfile(
      {
        domain: 'safe_watch',
        sourceIds: ['day_pre_active'],
        priority: DOMAIN_PRIORITY_BASE.safe_watch,
        intensity: 'low',
        confidence: 'high',
        isFallback: true,
        hintBucket: 'daily_capacity',
      },
      0,
    );
    return {
      day,
      isActive: false,
      profiles: [safe],
      primaryProfile: safe,
      dailyCapacityCostHints: [safe],
      portfolioCostHints: [],
      deferRiskCostHints: [],
      operationFeedCostHints: [],
      sourceIds: safe.sourceIds,
    };
  }

  const drafts: ProfileDraft[] = [
    ...extractPortfolioDrafts(input.dailyCapacityPortfolioResult),
    ...extractDeferDrafts(input.portfolioDeferRiskResult),
    ...extractOperationFeedDrafts(input.day8OperationFeedBindingResult),
    ...extractFollowUpDrafts(input.followUpExecutionResult),
    ...extractDistrictNeglectDrafts(input.districtNeglectRecoveryResult),
    ...extractCityRhythmDrafts(input.cityRhythmDirectorResult),
    ...extractStrategicContentDrafts(input.day8StrategicContentResult),
    ...extractRuntimeDrafts(input),
    ...extractPositiveComebackDrafts(input.positiveComebackResult),
  ];

  let profiles = mergeDrafts(drafts);
  if (profiles.length === 0) {
    profiles = [
      buildProfile(
        {
          domain: 'safe_watch',
          sourceIds: ['day8_low_data'],
          priority: DOMAIN_PRIORITY_BASE.safe_watch,
          intensity: 'low',
          confidence: 'low',
          isFallback: true,
          hintBucket: 'daily_capacity',
        },
        0,
      ),
    ];
  }

  profiles = applyDayScaling(profiles, day);
  profiles = ensureResourceDistinct(profiles);
  profiles = authorityExplanationOnly(profiles, input.authorityExpansionSummary);

  const primaryProfile = profiles[0];
  const portfolioCostHints = profiles.filter((profile) =>
    drafts.some(
      (draft) => draft.domain === profile.domain && draft.hintBucket === 'portfolio',
    ),
  );
  const deferRiskCostHints = profiles.filter((profile) =>
    drafts.some(
      (draft) => draft.domain === profile.domain && draft.hintBucket === 'defer',
    ),
  );
  const operationFeedCostHints = profiles.filter((profile) =>
    drafts.some(
      (draft) => draft.domain === profile.domain && draft.hintBucket === 'operation_feed',
    ),
  );
  const dailyCapacityCostHints = profiles.filter(
    (profile) =>
      portfolioCostHints.includes(profile) ||
      deferRiskCostHints.includes(profile) ||
      operationFeedCostHints.includes(profile) ||
      drafts.some(
        (draft) => draft.domain === profile.domain && draft.hintBucket === 'daily_capacity',
      ) ||
      profile.id === primaryProfile?.id,
  );

  const sourceIds = uniqueStrings(profiles.flatMap((profile) => profile.sourceIds));

  return {
    day,
    isActive,
    profiles,
    primaryProfile,
    dailyCapacityCostHints: dailyCapacityCostHints.length > 0 ? dailyCapacityCostHints : profiles.slice(0, 2),
    portfolioCostHints,
    deferRiskCostHints,
    operationFeedCostHints,
    sourceIds,
  };
}

export function collectResourcePressureDifferentiationLines(
  result: ResourcePressureDifferentiationResult,
): string[] {
  return uniqueStrings([
    result.primaryProfile?.reasonLine,
    ...result.profiles.map((profile) => profile.reasonLine),
    ...result.profiles.map((profile) => profile.opportunityCostLine),
  ]);
}

export function buildResourcePressureDifferentiationForMemoryContext(
  input: ResourcePressureDifferentiationInput,
): ResourcePressureDifferentiationResult {
  return buildResourcePressureDifferentiation(input);
}
