import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import { buildDistrictLiveBehaviorSignal } from '@/core/districtPersonality';
import {
  DISTRICT_NEGLECT_RECOVERY_CONFLICT_COPY,
  DISTRICT_NEGLECT_RECOVERY_COPY,
  DISTRICT_NEGLECT_RECOVERY_FAKE_NEGLECT_PATTERNS,
  DISTRICT_NEGLECT_RECOVERY_FAKE_RECOVERY_PATTERNS,
  DISTRICT_NEGLECT_RECOVERY_KIND_PRIORITY,
  DISTRICT_NEGLECT_RECOVERY_KIND_TITLES,
  DISTRICT_NEGLECT_RECOVERY_MAX_INTERNAL_SIGNALS,
  DISTRICT_NEGLECT_RECOVERY_LINE_MAX,
  DISTRICT_NEGLECT_RECOVERY_SHORT_MAX,
  DISTRICT_NEGLECT_RECOVERY_TITLE_MAX,
  resolveDistrictNeglectRecoveryDayPolicy,
  resolveNeglectBand,
  resolveRecoveryBand,
} from './districtNeglectRecoveryConstants';
import type {
  DistrictNeglectRecoveryConfidence,
  DistrictNeglectRecoveryContributionDraft,
  DistrictNeglectRecoveryInput,
  DistrictNeglectRecoveryKind,
  DistrictNeglectRecoveryResult,
  DistrictNeglectRecoverySignal,
  DistrictNeglectRecoverySourceKind,
  DistrictNeglectRecoveryTone,
} from './districtNeglectRecoveryTypes';

let signalCounter = 0;

function nextSignalId(prefix: string): string {
  signalCounter += 1;
  return `dnr_${prefix}_${signalCounter}`;
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
  return Array.isArray(value) ? value : isRecord(value) ? [value] : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sourceIdsFromUnknown(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return uniqueStrings([asString(value.id), ...asArray(value.sourceIds).map(asString)]);
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicateLine(line: string, existing: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existing.some((entry) => normalizeLine(entry) === normalized);
}

function containsFakeNeglect(text: string): boolean {
  return DISTRICT_NEGLECT_RECOVERY_FAKE_NEGLECT_PATTERNS.some((pattern) => pattern.test(text));
}

function containsFakeRecovery(text: string): boolean {
  return DISTRICT_NEGLECT_RECOVERY_FAKE_RECOVERY_PATTERNS.some((pattern) => pattern.test(text));
}

function pickCopy(kind: DistrictNeglectRecoveryKind, seed = 0, previousLines?: readonly string[]): string {
  const lines = DISTRICT_NEGLECT_RECOVERY_COPY[kind];
  return pickSurfaceCopy(kind, 'report', lines, { seed, previousLines });
}

function criterionBand(profile: Record<string, unknown>, criterionId: string): string | undefined {
  for (const entry of asArray(profile.criteria)) {
    if (!isRecord(entry)) continue;
    if (asString(entry.id) !== criterionId) continue;
    return asString(entry.band);
  }
  return undefined;
}

function hasLivePersonalitySource(profile: Record<string, unknown>): boolean {
  const sourceKinds = [
    ...asArray(profile.sourceKinds).map(asString).filter(Boolean),
    ...asArray(profile.criteria).flatMap((criterion) =>
      isRecord(criterion) ? asArray(criterion.sourceKinds).map(asString).filter(Boolean) : [],
    ),
  ];
  if (sourceKinds.length === 0) return false;
  if (
    sourceKinds.every(
      (kind) => kind === 'design_baseline' || kind === 'district_identity',
    )
  ) {
    return false;
  }
  return sourceIdsFromUnknown(profile).length > 0;
}

type DistrictAccumulator = {
  districtId: string;
  districtName: string;
  neglectScore: number;
  recoveryScore: number;
  sourceIds: string[];
  sourceKinds: DistrictNeglectRecoverySourceKind[];
  neglectKindHints: DistrictNeglectRecoveryKind[];
  recoveryKindHints: DistrictNeglectRecoveryKind[];
  hasLiveSource: boolean;
  hasTrustSource: boolean;
  hasRouteSource: boolean;
  hasContainerSource: boolean;
  hasSocialSource: boolean;
  personalityNeglectBoost: boolean;
  personalityRecoveryBoost: boolean;
  personalityBehaviorLine?: string;
  personalityBehaviorChip?: string;
  maxPriority: number;
  maxConfidence: DistrictNeglectRecoveryConfidence;
};

function districtKey(id?: string, name?: string): string {
  return id?.trim() || name?.trim() || 'city';
}

function getAccumulator(
  map: Map<string, DistrictAccumulator>,
  draft: DistrictNeglectRecoveryContributionDraft,
): DistrictAccumulator {
  const key = districtKey(draft.districtId, draft.districtName);
  const existing = map.get(key);
  if (existing) return existing;
  const created: DistrictAccumulator = {
    districtId: draft.districtId ?? key,
    districtName: draft.districtName ?? 'Mahalle',
    neglectScore: 0,
    recoveryScore: 0,
    sourceIds: [],
    sourceKinds: [],
    neglectKindHints: [],
    recoveryKindHints: [],
    hasLiveSource: false,
    hasTrustSource: false,
    hasRouteSource: false,
    hasContainerSource: false,
    hasSocialSource: false,
    personalityNeglectBoost: false,
    personalityRecoveryBoost: false,
    personalityBehaviorLine: undefined,
    personalityBehaviorChip: undefined,
    maxPriority: 0,
    maxConfidence: 'low',
  };
  map.set(key, created);
  return created;
}

function mergeDraft(map: Map<string, DistrictAccumulator>, draft: DistrictNeglectRecoveryContributionDraft): void {
  const acc = getAccumulator(map, draft);
  if (draft.neglectDelta) acc.neglectScore += draft.neglectDelta;
  if (draft.recoveryDelta) acc.recoveryScore += draft.recoveryDelta;
  acc.sourceIds.push(...draft.sourceIds);
  acc.sourceKinds.push(...draft.sourceKinds);
  if (draft.neglectKindHint) acc.neglectKindHints.push(draft.neglectKindHint);
  if (draft.recoveryKindHint) acc.recoveryKindHints.push(draft.recoveryKindHint);
  if (draft.requiresLiveSource !== false && draft.sourceKinds.some((k) => k !== 'fallback')) {
    acc.hasLiveSource = true;
  }
  if (draft.marksTrustSource) acc.hasTrustSource = true;
  if (draft.marksRouteSource) acc.hasRouteSource = true;
  if (draft.marksContainerSource) acc.hasContainerSource = true;
  if (draft.marksSocialSource) acc.hasSocialSource = true;
  if (draft.personalityNeglectBoost) acc.personalityNeglectBoost = true;
  if (draft.personalityRecoveryBoost) acc.personalityRecoveryBoost = true;
  if (draft.personalityBehaviorLine && !acc.personalityBehaviorLine) {
    acc.personalityBehaviorLine = draft.personalityBehaviorLine;
  }
  if (draft.personalityBehaviorChip && !acc.personalityBehaviorChip) {
    acc.personalityBehaviorChip = draft.personalityBehaviorChip;
  }
  if (typeof draft.priority === 'number') {
    acc.maxPriority = Math.max(acc.maxPriority, draft.priority);
  }
  if (draft.confidence === 'high') acc.maxConfidence = 'high';
  else if (draft.confidence === 'medium' && acc.maxConfidence === 'low') {
    acc.maxConfidence = 'medium';
  }
}

function adaptPositiveComeback(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.positiveComebackResult;
  if (!isRecord(raw)) return [];
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const candidate of asArray(raw.candidates)) {
    if (!isRecord(candidate)) continue;
    const kind = asString(candidate.kind);
    const sourceIds = sourceIdsFromUnknown(candidate);
    if (sourceIds.length === 0) continue;
    if (kind === 'district_recovery' || kind === 'trust_recovery') {
      drafts.push({
        districtId: asString(candidate.districtId),
        districtName: asString(candidate.districtName),
        recoveryDelta: kind === 'district_recovery' ? 35 : 28,
        sourceIds,
        sourceKinds: ['positive_comeback'],
        recoveryKindHint: kind === 'district_recovery' ? 'recovery_window' : 'recovery_progress',
        confidence: asString(candidate.confidence) === 'high' ? 'high' : 'medium',
        priority: 90,
        marksTrustSource: kind === 'trust_recovery',
      });
    } else if (kind === 'opportunity_window' || kind === 'safe_momentum') {
      drafts.push({
        districtId: asString(candidate.districtId),
        districtName: asString(candidate.districtName),
        recoveryDelta: 22,
        sourceIds,
        sourceKinds: ['positive_comeback'],
        recoveryKindHint: 'positive_momentum',
        confidence: 'medium',
        priority: 78,
      });
    }
  }
  return drafts;
}

function adaptFollowUpActions(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.followUpActionResult;
  if (!isRecord(raw)) return [];
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const action of asArray(raw.actions)) {
    if (!isRecord(action)) continue;
    const kind = asString(action.kind);
    const sourceIds = sourceIdsFromUnknown(action);
    if (!kind || sourceIds.length === 0) continue;
    if (kind === 'support_recovery' || kind === 'reinforce_trust') {
      drafts.push({
        districtId: asString(action.districtId),
        districtName: asString(action.districtName),
        recoveryDelta: 25,
        sourceIds,
        sourceKinds: ['follow_up_action'],
        recoveryKindHint: 'recovery_window',
        confidence: 'medium',
        priority: 84,
        marksTrustSource: kind === 'reinforce_trust',
      });
    } else if (kind === 'recheck_district' || kind === 'monitor_signal') {
      drafts.push({
        districtId: asString(action.districtId),
        districtName: asString(action.districtName),
        neglectDelta: 18,
        sourceIds,
        sourceKinds: ['follow_up_action'],
        neglectKindHint: 'neglect_watch',
        confidence: 'medium',
        priority: 70,
      });
    }
  }
  return drafts;
}

function adaptPortfolioDeferRisk(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.portfolioDeferRiskResult;
  if (!isRecord(raw)) return [];
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const binding of asArray(raw.bindings)) {
    if (!isRecord(binding)) continue;
    const deferRisk = asString(binding.deferRisk);
    const sourceIds = sourceIdsFromUnknown(binding);
    if (!deferRisk || sourceIds.length === 0) continue;
    const draft: DistrictNeglectRecoveryContributionDraft = {
      districtId: asString(binding.districtId),
      districtName: asString(binding.districtName),
      sourceIds,
      sourceKinds: ['portfolio_defer_risk'],
      confidence: 'medium',
      priority: 76,
    };
    if (deferRisk === 'trust_may_drop') {
      draft.neglectDelta = 25;
      draft.neglectKindHint = 'trust_fragility';
      draft.marksTrustSource = true;
    } else if (deferRisk === 'social_reaction_may_grow') {
      draft.neglectDelta = 22;
      draft.neglectKindHint = 'social_cooling';
      draft.marksSocialSource = true;
    } else if (deferRisk === 'opportunity_may_expire') {
      draft.recoveryDelta = 18;
      draft.recoveryKindHint = 'recovery_window';
    } else if (deferRisk === 'route_may_strain') {
      draft.neglectDelta = 20;
      draft.neglectKindHint = 'route_backlog';
      draft.marksRouteSource = true;
    } else if (deferRisk === 'resource_cost_may_rise' || deferRisk === 'pressure_may_grow') {
      draft.neglectDelta = 18;
      draft.neglectKindHint = 'neglect_watch';
    } else {
      continue;
    }
    drafts.push(draft);
  }
  return drafts;
}

function adaptDailyCapacityPortfolio(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.dailyCapacityPortfolioResult;
  if (!isRecord(raw)) return [];
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const item of asArray(raw.items)) {
    if (!isRecord(item)) continue;
    const kind = asString(item.kind);
    const status = asString(item.status);
    const sourceIds = sourceIdsFromUnknown(item);
    if (!kind || sourceIds.length === 0) continue;

    if (kind === 'district_pressure' && (status === 'deferred' || status === 'watch_only')) {
      drafts.push({
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        neglectDelta: 30,
        sourceIds,
        sourceKinds: ['daily_capacity_portfolio'],
        neglectKindHint: status === 'deferred' ? 'neglect_warning' : 'neglect_watch',
        confidence: 'medium',
        priority: 80,
      });
    } else if (kind === 'recovery_opportunity' || kind === 'positive_opportunity') {
      drafts.push({
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        recoveryDelta: 22,
        sourceIds,
        sourceKinds: ['daily_capacity_portfolio'],
        recoveryKindHint: 'recovery_window',
        confidence: 'medium',
        priority: 78,
      });
    } else if (kind === 'route_pressure') {
      drafts.push({
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        neglectDelta: 15,
        sourceIds,
        sourceKinds: ['daily_capacity_portfolio'],
        neglectKindHint: 'route_backlog',
        marksRouteSource: true,
        confidence: 'medium',
        priority: 72,
      });
    } else if (kind === 'container_pressure') {
      drafts.push({
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        neglectDelta: 15,
        sourceIds,
        sourceKinds: ['daily_capacity_portfolio'],
        neglectKindHint: 'container_backlog',
        marksContainerSource: true,
        confidence: 'medium',
        priority: 70,
      });
    } else if (kind === 'social_pressure' && status === 'deferred') {
      drafts.push({
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        neglectDelta: 20,
        sourceIds,
        sourceKinds: ['daily_capacity_portfolio'],
        neglectKindHint: 'social_cooling',
        marksSocialSource: true,
        confidence: 'medium',
        priority: 74,
      });
    }
  }
  return drafts;
}

function adaptCityMemory(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.cityMemoryVisibilityResult;
  if (!isRecord(raw)) return [];
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const trace of asArray(raw.traces)) {
    if (!isRecord(trace)) continue;
    const kind = asString(trace.kind);
    const sourceIds = sourceIdsFromUnknown(trace);
    if (sourceIds.length === 0) continue;
    const tone = asString(trace.tone);
    if (kind?.includes('district') || asString(trace.districtName)) {
      drafts.push({
        districtId: asString(trace.districtId),
        districtName: asString(trace.districtName),
        neglectDelta: tone === 'positive' ? 0 : 18,
        recoveryDelta: tone === 'positive' ? 18 : 0,
        sourceIds,
        sourceKinds: ['city_memory_visibility'],
        neglectKindHint: tone === 'positive' ? undefined : 'neglect_watch',
        recoveryKindHint: tone === 'positive' ? 'positive_momentum' : undefined,
        confidence: 'medium',
        priority: 66,
      });
    }
  }
  return drafts;
}

function adaptDecisionThreads(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const thread of input.decisionConsequenceThreads ?? []) {
    if (!isRecord(thread)) continue;
    const sourceIds = sourceIdsFromUnknown(thread);
    if (sourceIds.length === 0) continue;
    const tone = asString(thread.tone);
    const draft: DistrictNeglectRecoveryContributionDraft = {
      districtId: asString(thread.districtId) ?? asString(thread.neighborhoodId),
      districtName: asString(thread.districtName) ?? asString(thread.neighborhoodName),
      sourceIds,
      sourceKinds: ['decision_consequence'],
      confidence: 'medium',
      priority: 64,
    };
    if (tone === 'positive' || tone === 'recovery') {
      draft.recoveryDelta = 15;
      draft.recoveryKindHint = 'recovery_progress';
    } else if (tone === 'warning' || tone === 'cautious') {
      draft.neglectDelta = 20;
      draft.neglectKindHint = 'neglect_watch';
    } else {
      draft.neglectDelta = 12;
      draft.neglectKindHint = 'neglect_watch';
    }
    drafts.push(draft);
  }
  return drafts;
}

function adaptCarryOver(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const signal of asArray(input.carryOverSignals)) {
    if (!isRecord(signal)) continue;
    const sourceIds = sourceIdsFromUnknown(signal);
    if (sourceIds.length === 0) continue;
    drafts.push({
      sourceIds,
      sourceKinds: ['carry_over'],
      neglectDelta: 20,
      neglectKindHint: 'neglect_watch',
      confidence: 'medium',
      priority: 62,
    });
  }
  return drafts;
}

function adaptSocialPulse(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const raw = input.socialPulseSignals;
  if (!isRecord(raw)) return [];
  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return [];
  const score = typeof raw.score === 'number' ? raw.score : undefined;
  if (score !== undefined && score < 45) {
    return [
      {
        sourceIds,
        sourceKinds: ['social_pulse'],
        neglectDelta: 15,
        neglectKindHint: 'social_cooling',
        marksSocialSource: true,
        confidence: 'medium',
        priority: 68,
      },
    ];
  }
  return [];
}

function adaptDistrictPersonality(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  const drafts: DistrictNeglectRecoveryContributionDraft[] = [];
  for (const profile of input.districtPersonalityProfiles ?? []) {
    if (!isRecord(profile)) continue;
    if (!hasLivePersonalitySource(profile)) continue;
    const sourceIds = sourceIdsFromUnknown(profile);
    const districtId = asString(profile.districtId);
    const districtName = asString(profile.districtName);
    if (criterionBand(profile, 'neglect_risk') === 'high') {
      const behavior = buildDistrictLiveBehaviorSignal({
        districtId,
        districtName,
        profile: profile as never,
        day: input.day,
        outcomeBand: 'warning',
      });
      drafts.push({
        districtId,
        districtName,
        sourceIds,
        sourceKinds: ['district_personality'],
        neglectDelta: 10,
        personalityNeglectBoost: true,
        personalityBehaviorLine: behavior?.neglectRecoveryLine,
        personalityBehaviorChip: behavior?.mapChip,
        confidence: 'low',
        priority: 40,
        requiresLiveSource: true,
      });
    }
    if (criterionBand(profile, 'recovery_potential') === 'high') {
      const behavior = buildDistrictLiveBehaviorSignal({
        districtId,
        districtName,
        profile: profile as never,
        day: input.day,
        outcomeBand: 'positive',
      });
      drafts.push({
        districtId,
        districtName,
        sourceIds,
        sourceKinds: ['district_personality'],
        recoveryDelta: 10,
        personalityRecoveryBoost: true,
        personalityBehaviorLine: behavior?.neglectRecoveryLine,
        personalityBehaviorChip: behavior?.mapChip,
        confidence: 'low',
        priority: 40,
        requiresLiveSource: true,
      });
    }
    if (criterionBand(profile, 'trust_fragility') === 'high') {
      const behavior = buildDistrictLiveBehaviorSignal({
        districtId,
        districtName,
        profile: profile as never,
        day: input.day,
        outcomeBand: 'warning',
      });
      drafts.push({
        districtId,
        districtName,
        sourceIds,
        sourceKinds: ['district_personality'],
        neglectDelta: 8,
        personalityNeglectBoost: true,
        personalityBehaviorLine: behavior?.neglectRecoveryLine,
        personalityBehaviorChip: behavior?.mapChip,
        marksTrustSource: true,
        confidence: 'low',
        priority: 38,
        requiresLiveSource: true,
      });
    }
  }
  return drafts;
}

function resolveSignalKind(acc: DistrictAccumulator): DistrictNeglectRecoveryKind {
  const neglectBand = resolveNeglectBand(acc.neglectScore);
  const recoveryBand = resolveRecoveryBand(acc.recoveryScore);

  if (neglectBand === 'none' && recoveryBand === 'none') return 'safe_watch';

  const neglectDominant = acc.neglectScore >= acc.recoveryScore;

  if (neglectDominant) {
    if (acc.neglectKindHints.includes('trust_fragility') && acc.hasTrustSource) return 'trust_fragility';
    if (acc.neglectKindHints.includes('route_backlog') && acc.hasRouteSource) return 'route_backlog';
    if (acc.neglectKindHints.includes('container_backlog') && acc.hasContainerSource) return 'container_backlog';
    if (acc.neglectKindHints.includes('social_cooling') && acc.hasSocialSource) return 'social_cooling';
    if (acc.neglectKindHints.includes('neglect_warning') || neglectBand === 'high' || neglectBand === 'rising') {
      return 'neglect_warning';
    }
    return 'neglect_watch';
  }

  if (acc.recoveryKindHints.includes('positive_momentum') || recoveryBand === 'strong') {
    return 'positive_momentum';
  }
  if (acc.recoveryKindHints.includes('recovery_progress') || recoveryBand === 'active') {
    return 'recovery_progress';
  }
  return 'recovery_window';
}

function resolveTone(
  kind: DistrictNeglectRecoveryKind,
  acc: DistrictAccumulator,
): DistrictNeglectRecoveryTone {
  const neglectBand = resolveNeglectBand(acc.neglectScore);
  const recoveryBand = resolveRecoveryBand(acc.recoveryScore);
  if (neglectBand !== 'none' && recoveryBand !== 'none' && acc.neglectScore >= 40 && acc.recoveryScore >= 40) {
    return 'strategic';
  }
  if (kind === 'positive_momentum' || kind === 'recovery_window' || kind === 'recovery_progress') {
    return 'positive';
  }
  if (
    kind === 'neglect_warning' ||
    kind === 'trust_fragility' ||
    kind === 'route_backlog' ||
    kind === 'container_backlog'
  ) {
    return 'cautious';
  }
  return 'neutral';
}

function buildSignalFromAccumulator(
  acc: DistrictAccumulator,
  input: DistrictNeglectRecoveryInput,
  existingLines: readonly string[],
  isFallback = false,
): DistrictNeglectRecoverySignal | null {
  const sourceIds = uniqueStrings(acc.sourceIds).filter(
    (id) => !(input.recentSignalIds ?? []).includes(id) && !(input.suppressSourceIds ?? []).includes(id),
  );
  const sourceKinds = [...new Set(acc.sourceKinds)];

  if (!isFallback && !acc.hasLiveSource && acc.neglectScore < 20 && acc.recoveryScore < 20) {
    return null;
  }

  if (
    !isFallback &&
    (acc.personalityNeglectBoost || acc.personalityRecoveryBoost) &&
    !acc.hasLiveSource
  ) {
    return null;
  }

  const neglectScore = clamp(Math.round(acc.neglectScore), 0, 100);
  const recoveryScore = clamp(Math.round(acc.recoveryScore), 0, 100);
  const neglectBand = resolveNeglectBand(neglectScore);
  const recoveryBand = resolveRecoveryBand(recoveryScore);

  if (!isFallback) {
    if (neglectBand === 'none' && recoveryBand === 'none') return null;
    if (acc.neglectKindHints.includes('trust_fragility') && !acc.hasTrustSource) {
      if (neglectScore < 25) return null;
    }
    if (acc.neglectKindHints.includes('route_backlog') && !acc.hasRouteSource) {
      if (neglectScore < 25) return null;
    }
    if (acc.neglectKindHints.includes('container_backlog') && !acc.hasContainerSource) {
      if (neglectScore < 25) return null;
    }
    if (acc.neglectKindHints.includes('social_cooling') && !acc.hasSocialSource) {
      if (neglectScore < 25) return null;
    }
    if (recoveryScore > 0 && recoveryBand === 'none') return null;
    if (neglectScore > 0 && neglectBand === 'none' && recoveryBand === 'none') return null;
  }

  const kind = isFallback ? 'fallback' : resolveSignalKind(acc);
  const seed = sourceIds.length + neglectScore + recoveryScore;
  let line = pickCopy(kind, seed);
  if (
    !isFallback &&
    neglectBand !== 'none' &&
    recoveryBand !== 'none' &&
    acc.neglectScore >= 40 &&
    acc.recoveryScore >= 40
  ) {
    line = DISTRICT_NEGLECT_RECOVERY_CONFLICT_COPY[seed % DISTRICT_NEGLECT_RECOVERY_CONFLICT_COPY.length];
  }
  line = clampLine(line, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
  if (containsFakeNeglect(line) || containsFakeRecovery(line)) return null;
  if (duplicateLine(line, existingLines)) return null;

  const tone = resolveTone(kind, acc);
  const confidence: DistrictNeglectRecoveryConfidence = isFallback
    ? 'low'
    : acc.maxConfidence;

  return {
    id: nextSignalId(kind),
    districtId: acc.districtId,
    districtName: acc.districtName,
    kind,
    title: clampLine(DISTRICT_NEGLECT_RECOVERY_KIND_TITLES[kind], DISTRICT_NEGLECT_RECOVERY_TITLE_MAX),
    line,
    shortLine: clampLine(line, DISTRICT_NEGLECT_RECOVERY_SHORT_MAX),
    behaviorLine: acc.personalityBehaviorLine
      ? clampLine(acc.personalityBehaviorLine, DISTRICT_NEGLECT_RECOVERY_LINE_MAX)
      : undefined,
    behaviorChip: acc.personalityBehaviorChip,
    neglectScore,
    recoveryScore,
    neglectBand,
    recoveryBand,
    tone,
    sourceIds: isFallback ? ['fallback'] : sourceIds,
    sourceKinds: isFallback ? ['fallback'] : sourceKinds,
    confidence,
    priority: clamp(
      acc.maxPriority || DISTRICT_NEGLECT_RECOVERY_KIND_PRIORITY[kind],
      0,
      100,
    ),
    dayPolicy: resolveDistrictNeglectRecoveryDayPolicy(input.day),
    isActionable: false,
    isFallback,
  };
}

function collectContributions(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryContributionDraft[] {
  return [
    ...adaptPositiveComeback(input),
    ...adaptFollowUpActions(input),
    ...adaptPortfolioDeferRisk(input),
    ...adaptDailyCapacityPortfolio(input),
    ...adaptCityMemory(input),
    ...adaptDecisionThreads(input),
    ...adaptCarryOver(input),
    ...adaptSocialPulse(input),
    ...adaptDistrictPersonality(input),
  ];
}

export function buildDistrictNeglectRecovery(
  input: DistrictNeglectRecoveryInput,
): DistrictNeglectRecoveryResult {
  signalCounter = 0;
  const day = Math.max(1, input.day ?? 1);
  const existingLines = input.suppressLines ?? [];
  const accumulators = new Map<string, DistrictAccumulator>();

  if (day <= 1) {
    const fallback = buildSignalFromAccumulator(
      {
        districtId: 'city',
        districtName: 'Şehir',
        neglectScore: 0,
        recoveryScore: 0,
        sourceIds: [],
        sourceKinds: [],
        neglectKindHints: [],
        recoveryKindHints: [],
        hasLiveSource: false,
        hasTrustSource: false,
        hasRouteSource: false,
        hasContainerSource: false,
        hasSocialSource: false,
        personalityNeglectBoost: false,
        personalityRecoveryBoost: false,
        maxPriority: 20,
        maxConfidence: 'low',
      },
      { ...input, day },
      existingLines,
      true,
    );
    const signals = fallback ? [fallback] : [];
    return {
      day,
      signals,
      sourceIds: fallback?.sourceIds ?? [],
    };
  }

  for (const draft of collectContributions(input)) {
    mergeDraft(accumulators, draft);
  }

  const signals: DistrictNeglectRecoverySignal[] = [];
  const usedLines: string[] = [...existingLines];

  const ranked = [...accumulators.values()].sort(
    (a, b) => Math.max(b.neglectScore, b.recoveryScore) - Math.max(a.neglectScore, a.recoveryScore),
  );

  for (const acc of ranked) {
    if (signals.length >= DISTRICT_NEGLECT_RECOVERY_MAX_INTERNAL_SIGNALS) break;
    const signal = buildSignalFromAccumulator(acc, { ...input, day }, usedLines);
    if (!signal) continue;
    signals.push(signal);
    usedLines.push(signal.line);
  }

  if (signals.length === 0 && day >= 8) {
    const fallback = buildSignalFromAccumulator(
      {
        districtId: 'city',
        districtName: 'Şehir',
        neglectScore: 0,
        recoveryScore: 0,
        sourceIds: [],
        sourceKinds: ['fallback'],
        neglectKindHints: [],
        recoveryKindHints: [],
        hasLiveSource: false,
        hasTrustSource: false,
        hasRouteSource: false,
        hasContainerSource: false,
        hasSocialSource: false,
        personalityNeglectBoost: false,
        personalityRecoveryBoost: false,
        maxPriority: 20,
        maxConfidence: 'low',
      },
      { ...input, day },
      usedLines,
      true,
    );
    if (fallback) signals.push(fallback);
  }

  const primarySignal = signals.find((signal) => !signal.isFallback) ?? signals[0];
  const reportSignal = primarySignal;
  const hubSignal = primarySignal;
  const mapSignal = signals.find((signal) =>
    ['route_backlog', 'container_backlog', 'neglect_warning'].includes(signal.kind),
  ) ?? primarySignal;
  const eceSignal = primarySignal;
  const portfolioSignal =
    signals.find((signal) =>
      ['recovery_window', 'neglect_warning', 'neglect_watch'].includes(signal.kind),
    ) ?? primarySignal;

  return {
    day,
    signals,
    primarySignal,
    reportSignal,
    hubSignal,
    mapSignal,
    eceSignal,
    portfolioSignal,
    sourceIds: uniqueStrings(signals.flatMap((signal) => signal.sourceIds)),
  };
}

export function collectDistrictNeglectRecoveryLines(result: DistrictNeglectRecoveryResult): string[] {
  return result.signals.map((signal) => signal.line).filter(Boolean);
}

export function hasDistrictNeglectRecoveryRealSource(result: DistrictNeglectRecoveryResult): boolean {
  return result.signals.some((signal) => !signal.isFallback && signal.sourceIds.length > 0);
}
