import type { PortfolioDeferRiskResult } from '@/core/portfolioDeferRisk';

import {
  FOLLOW_UP_BENEFIT_LINE_MAX,
  FOLLOW_UP_KIND_PRIORITY_BASE,
  FOLLOW_UP_LINE_MAX,
  FOLLOW_UP_MAX_ACTIONS,
  FOLLOW_UP_RISK_LINE_MAX,
  FOLLOW_UP_TITLE_MAX,
  resolveFollowUpCostBand,
  resolveFollowUpDayPolicy,
  resolveFollowUpImpactBand,
} from './followUpActionConstants';
import { pickFollowUpContent } from './followUpActionContentPack';
import type {
  FollowUpAction,
  FollowUpActionDraft,
  FollowUpActionInput,
  FollowUpActionKind,
  FollowUpActionResult,
  FollowUpActionSourceKind,
  FollowUpActionVisibilityLevel,
} from './followUpActionTypes';

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
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : isRecord(value) ? [value] : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sourceIdsFromUnknown(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return uniqueStrings([
    asString(value.id),
    ...asArray(value.sourceIds).map(asString),
  ]);
}

function hasRealSource(ids: readonly string[], kinds: readonly FollowUpActionSourceKind[]): boolean {
  return ids.length > 0 && !kinds.includes('fallback');
}

function criterionBand(
  profile: Record<string, unknown>,
  criterionId: string,
): 'low' | 'medium' | 'high' | undefined {
  const criteria = asArray(profile.criteria);
  for (const entry of criteria) {
    if (!isRecord(entry)) continue;
    if (asString(entry.id) !== criterionId) continue;
    const band = asString(entry.band);
    if (band === 'low' || band === 'medium' || band === 'high') return band;
  }
  return undefined;
}

function hasLiveSource(profile: Record<string, unknown>): boolean {
  const sourceKinds = asArray(profile.sourceKinds).map(asString).filter(Boolean);
  if (sourceKinds.length === 0) return false;
  if (sourceKinds.length === 1 && sourceKinds[0] === 'design_baseline') return false;
  return sourceIdsFromUnknown(profile).length > 0;
}

const PORTFOLIO_DEFER_KIND_MAP: Record<string, FollowUpActionKind> = {
  route_may_strain: 'review_route',
  social_reaction_may_grow: 'calm_social_pulse',
  trust_may_drop: 'reinforce_trust',
  resource_cost_may_rise: 'rebalance_resource',
  opportunity_may_expire: 'support_recovery',
  memory_trace_may_harden: 'capture_memory_trace',
  safe_to_watch: 'monitor_signal',
  pressure_may_grow: 'monitor_signal',
};

const PORTFOLIO_ITEM_KIND_MAP: Record<string, FollowUpActionKind> = {
  follow_up_candidate: 'recheck_district',
  recovery_opportunity: 'support_recovery',
  positive_opportunity: 'support_recovery',
  container_pressure: 'check_container_line',
  route_pressure: 'review_route',
  social_pressure: 'calm_social_pulse',
  resource_pressure: 'rebalance_resource',
  memory_trace: 'capture_memory_trace',
  risk_signal: 'monitor_signal',
};

const DISTRICT_CRITERION_KIND_MAP: Record<string, FollowUpActionKind> = {
  neglect_risk: 'recheck_district',
  recovery_potential: 'support_recovery',
  route_difficulty: 'review_route',
  container_density: 'check_container_line',
  trust_fragility: 'reinforce_trust',
  social_sensitivity: 'calm_social_pulse',
  operation_history_weight: 'capture_memory_trace',
};

const CITY_MEMORY_TRACE_KIND_MAP: Record<string, FollowUpActionKind> = {
  decision_trace: 'capture_memory_trace',
  memory_trace: 'capture_memory_trace',
  district_trace: 'recheck_district',
  story_chain_trace: 'prepare_tomorrow',
  map_memory_hint: 'recheck_district',
};

export function adaptPortfolioDeferRisk(input: FollowUpActionInput): FollowUpActionDraft[] {
  const result = input.portfolioDeferRiskResult as PortfolioDeferRiskResult | undefined;
  if (!result || result.bindings.length === 0) return [];

  const drafts: FollowUpActionDraft[] = [];
  for (const binding of result.bindings) {
    if (binding.sourceIds.length === 0 || binding.isFallback) continue;
    const deferRisk = binding.deferRisk;
    let kind = PORTFOLIO_DEFER_KIND_MAP[deferRisk];
    if (!kind && binding.kind === 'recovery_window') kind = 'support_recovery';
    if (!kind && binding.kind === 'safe_watch') kind = 'safe_watch';
    if (!kind && binding.kind === 'memory_trace') kind = 'capture_memory_trace';
    if (!kind && binding.kind === 'follow_up') kind = 'prepare_tomorrow';
    if (!kind) continue;

    drafts.push({
      kind,
      sourceIds: binding.sourceIds,
      sourceKinds: ['portfolio_defer_risk'],
      priority: clamp(binding.priority + 8, 0, 100),
      confidence: binding.confidence === 'low' ? 'medium' : binding.confidence,
      districtId: binding.districtId,
      districtName: binding.districtName,
      dayPolicy: 'day_8_plus',
      seed: binding.priority,
    });
  }
  return drafts;
}

export function adaptOneMoreDayRetention(input: FollowUpActionInput): FollowUpActionDraft[] {
  const result = input.oneMoreDayRetentionResult;
  if (!isRecord(result)) return [];
  const hook = result.primaryHook;
  if (!isRecord(hook)) return [];

  const sourceIds = sourceIdsFromUnknown(hook);
  const sourceKinds: FollowUpActionSourceKind[] = ['one_more_day_retention'];
  if (!hasRealSource(sourceIds, sourceKinds)) return [];

  const hookKind = asString(hook.kind);
  let kind: FollowUpActionKind = 'prepare_tomorrow';
  if (hookKind === 'route_pressure') kind = 'review_route';
  else if (hookKind === 'social_watch') kind = 'calm_social_pulse';
  else if (hookKind === 'recovery_opportunity') kind = 'support_recovery';
  else if (hookKind === 'memory_trace') kind = 'capture_memory_trace';
  else if (hookKind === 'resource_pressure') kind = 'rebalance_resource';
  else if (hookKind === 'district_follow_up') kind = 'recheck_district';

  return [
    {
      kind,
      sourceIds,
      sourceKinds,
      priority: clamp((typeof hook.priority === 'number' ? hook.priority : 70) + 6, 0, 100),
      confidence: asString(hook.confidence) === 'high' ? 'high' : 'medium',
      districtId: asString(hook.districtId),
      districtName: asString(hook.districtName),
      dayPolicy: 'day_2_7',
      seed: sourceIds.length,
    },
  ];
}

export function adaptDailyCapacityPortfolio(input: FollowUpActionInput): FollowUpActionDraft[] {
  const result = input.dailyCapacityPortfolioResult;
  if (!isRecord(result)) return [];

  const items = asArray(result.deferredItems).concat(asArray(result.watchOnlyItems));
  const drafts: FollowUpActionDraft[] = [];

  for (const raw of items) {
    if (!isRecord(raw)) continue;
    const sourceIds = sourceIdsFromUnknown(raw);
    const sourceKinds: FollowUpActionSourceKind[] = ['daily_capacity_portfolio'];
    if (!hasRealSource(sourceIds, sourceKinds)) continue;

    const itemKind = asString(raw.kind) ?? '';
    let kind: FollowUpActionKind | undefined = PORTFOLIO_ITEM_KIND_MAP[itemKind];
    if (!kind && raw.isFollowUp === true) kind = 'recheck_district';
    if (!kind) {
      const deferRisk = asString(raw.deferRisk);
      if (deferRisk) kind = PORTFOLIO_DEFER_KIND_MAP[deferRisk];
    }
    if (!kind) continue;

    drafts.push({
      kind,
      sourceIds,
      sourceKinds,
      priority: clamp((typeof raw.priority === 'number' ? raw.priority : 60) + 4, 0, 100),
      confidence:
        asString(raw.confidence) === 'high'
          ? 'high'
          : asString(raw.confidence) === 'low'
            ? 'low'
            : 'medium',
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      dayPolicy: 'day_8_plus',
      riskLine: asString(raw.deferRiskLine),
      seed: sourceIds.length,
    });
  }

  const recovery = asArray(result.items).find((raw) => {
    if (!isRecord(raw)) return false;
    const kind = asString(raw.kind);
    return (
      (kind === 'recovery_opportunity' || kind === 'positive_opportunity') &&
      hasRealSource(sourceIdsFromUnknown(raw), ['daily_capacity_portfolio'])
    );
  });
  if (isRecord(recovery)) {
    drafts.push({
      kind: 'support_recovery',
      sourceIds: sourceIdsFromUnknown(recovery),
      sourceKinds: ['daily_capacity_portfolio'],
      priority: clamp((typeof recovery.priority === 'number' ? recovery.priority : 65) + 6, 0, 100),
      confidence: 'high',
      districtId: asString(recovery.districtId),
      districtName: asString(recovery.districtName),
      dayPolicy: 'day_8_plus',
      seed: 2,
    });
  }

  return drafts;
}

export function adaptCityMemoryVisibility(input: FollowUpActionInput): FollowUpActionDraft[] {
  const result = input.cityMemoryVisibilityResult;
  if (!isRecord(result)) return [];

  const traces = asArray(result.traces).concat(asArray(result.memoryTraces));
  const drafts: FollowUpActionDraft[] = [];

  for (const raw of traces) {
    if (!isRecord(raw)) continue;
    const sourceIds = sourceIdsFromUnknown(raw);
    const traceKind = asString(raw.traceKind) ?? asString(raw.kind) ?? '';
    const kind = CITY_MEMORY_TRACE_KIND_MAP[traceKind];
    if (!kind || sourceIds.length === 0) continue;

    drafts.push({
      kind,
      sourceIds,
      sourceKinds: ['city_memory_visibility'],
      priority: 64,
      confidence: 'medium',
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      dayPolicy: 'day_8_plus',
      seed: sourceIds.length,
    });
  }
  return drafts;
}

export function adaptDecisionLikeSignals(input: FollowUpActionInput): FollowUpActionDraft[] {
  const drafts: FollowUpActionDraft[] = [];

  const sources: Array<{
    raw: unknown;
    sourceKind: FollowUpActionSourceKind;
    kind: FollowUpActionKind;
    priority: number;
  }> = [
    ...asArray(input.decisionConsequenceThreads).map((raw) => ({
      raw,
      sourceKind: 'decision_consequence' as const,
      kind: 'capture_memory_trace' as const,
      priority: 70,
    })),
    ...asArray(input.carryOverSignals).map((raw) => ({
      raw,
      sourceKind: 'carry_over' as const,
      kind: 'prepare_tomorrow' as const,
      priority: 66,
    })),
    ...asArray(input.butterflySignals).map((raw) => ({
      raw,
      sourceKind: 'butterfly_effect' as const,
      kind: 'monitor_signal' as const,
      priority: 62,
    })),
    ...asArray(input.districtMemorySignals).map((raw) => ({
      raw,
      sourceKind: 'district_memory' as const,
      kind: 'capture_memory_trace' as const,
      priority: 68,
    })),
    ...asArray(input.cityArchiveSignals).map((raw) => ({
      raw,
      sourceKind: 'city_archive' as const,
      kind: 'capture_memory_trace' as const,
      priority: 64,
    })),
    ...asArray(input.storyChainSignals).map((raw) => ({
      raw,
      sourceKind: 'story_chain' as const,
      kind: 'prepare_tomorrow' as const,
      priority: 62,
    })),
  ];

  for (const source of sources) {
    if (!isRecord(source.raw)) continue;
    const sourceIds = sourceIdsFromUnknown(source.raw);
    if (sourceIds.length === 0) continue;
    const consequenceType = asString(source.raw.consequenceType);
    let kind = source.kind;
    if (consequenceType === 'tomorrow_risk') kind = 'prepare_tomorrow';
    if (consequenceType === 'social_echo') kind = 'calm_social_pulse';
    if (consequenceType === 'resource_pressure') kind = 'rebalance_resource';

    drafts.push({
      kind,
      sourceIds,
      sourceKinds: [source.sourceKind],
      priority: source.priority,
      confidence: 'medium',
      districtId: asString(source.raw.districtId) ?? asString(source.raw.relatedDistrictId),
      districtName: asString(source.raw.districtName),
      dayPolicy: 'day_2_7',
      riskLine: asString(source.raw.riskLine),
      seed: sourceIds.length,
    });
  }

  const tomorrowRisks = asArray(input.tomorrowRiskSignals);
  for (const raw of tomorrowRisks) {
    if (!isRecord(raw)) continue;
    const sourceIds = sourceIdsFromUnknown(raw);
    const sources = asArray(raw.sourceSignals).map(asString).filter(Boolean);
    if (sourceIds.length === 0 || sources.every((s) => s === 'fallback')) continue;

    const domain = asString(raw.relatedDomain);
    const kind: FollowUpActionKind =
      domain === 'route'
        ? 'review_route'
        : domain === 'social' || domain === 'district'
          ? 'calm_social_pulse'
          : domain === 'resource' || domain === 'container'
            ? 'rebalance_resource'
            : 'prepare_tomorrow';

    drafts.push({
      kind,
      sourceIds,
      sourceKinds: ['tomorrow_risk'],
      priority: asString(raw.priority) === 'high' ? 78 : 68,
      confidence: 'high',
      districtId: asString(raw.relatedDistrictId),
      dayPolicy: 'day_8_plus',
      seed: sourceIds.length,
    });
  }

  return drafts;
}

export function adaptDistrictPersonality(input: FollowUpActionInput): FollowUpActionDraft[] {
  const drafts: FollowUpActionDraft[] = [];

  for (const raw of asArray(input.districtPersonalityProfiles)) {
    if (!isRecord(raw)) continue;
    if (!hasLiveSource(raw)) continue;

    const districtId = asString(raw.districtId) ?? asString(raw.id);
    if (!districtId) continue;
    const districtName = asString(raw.districtName) ?? asString(raw.name) ?? districtId;
    const sourceIds = sourceIdsFromUnknown(raw);

    for (const [criterionId, kind] of Object.entries(DISTRICT_CRITERION_KIND_MAP)) {
      if (criterionBand(raw, criterionId) !== 'high') continue;
      drafts.push({
        kind,
        sourceIds,
        sourceKinds: ['district_personality'],
        priority: FOLLOW_UP_KIND_PRIORITY_BASE[kind] - 4,
        confidence: sourceIds.length > 1 ? 'high' : 'medium',
        districtId,
        districtName,
        dayPolicy: 'day_8_plus',
        seed: criterionId.length,
      });
    }
  }
  return drafts;
}

export function adaptRewardComeback(input: FollowUpActionInput): FollowUpActionDraft[] {
  const raw = input.rewardComebackSignals;
  if (!isRecord(raw)) return [];

  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return [];

  const tone = asString(raw.tone);
  const kind: FollowUpActionKind =
    tone === 'recovery' || tone === 'comeback' ? 'support_recovery' : 'reinforce_trust';

  return [
    {
      kind,
      sourceIds,
      sourceKinds: ['reward_comeback'],
      priority: 84,
      confidence: 'high',
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      dayPolicy: 'day_10_plus',
      seed: sourceIds.length,
    },
  ];
}

export function adaptEceStrategyLine(input: FollowUpActionInput): FollowUpActionDraft[] {
  const raw = input.eceStrategyLineResult;
  if (!isRecord(raw)) return [];
  const line = asString(raw.followUpHint) ?? asString(raw.strategyLine);
  if (!line) return [];

  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return [];

  return [
    {
      kind: 'monitor_signal',
      sourceIds,
      sourceKinds: ['ece_strategy_line'],
      priority: 50,
      confidence: 'medium',
      dayPolicy: 'any',
      seed: line.length,
    },
  ];
}

export function adaptSafeFallback(input: FollowUpActionInput): FollowUpActionDraft[] {
  const day = Math.max(1, input.day ?? 1);
  if (day > 1) return [];
  return [
    {
      kind: 'safe_watch',
      sourceIds: [`fallback_follow_up_day_${day}`],
      sourceKinds: ['fallback'],
      priority: 20,
      confidence: 'low',
      dayPolicy: 'day_1',
      isFallback: true,
      seed: day,
    },
  ];
}

function resolveVisibilityLevel(
  draft: FollowUpActionDraft,
  hasDetailedPermission: boolean,
): FollowUpActionVisibilityLevel {
  if (draft.isFallback) return 'summary';
  if (!hasDetailedPermission) {
    return draft.confidence === 'low' ? 'teaser' : 'summary';
  }
  if (draft.confidence === 'high' && draft.sourceKinds.some((k) => k !== 'fallback')) {
    return 'detailed';
  }
  return 'summary';
}

function buildActionFromDraft(
  draft: FollowUpActionDraft,
  index: number,
  hasDetailedPermission: boolean,
): FollowUpAction {
  const content = pickFollowUpContent(draft.kind, draft.seed + index);
  const sourceIds = uniqueStrings(draft.sourceIds);
  const sourceKinds = [...new Set(draft.sourceKinds)];
  const isFallback = draft.isFallback === true || sourceKinds.includes('fallback');
  const costBand = resolveFollowUpCostBand(draft.kind, sourceKinds);
  const impactBand = resolveFollowUpImpactBand(draft.kind, draft.confidence, sourceKinds);
  const visibilityLevel = resolveVisibilityLevel(draft, hasDetailedPermission);

  const benefitLine =
    visibilityLevel === 'detailed' && hasDetailedPermission
      ? content.benefitLine
      : content.benefitLine.split(';')[0] ?? content.benefitLine;

  return {
    id: `follow_up_${draft.kind}_${sourceIds[0] ?? index}`,
    kind: draft.kind,
    title: clampLine(content.title, FOLLOW_UP_TITLE_MAX),
    line: clampLine(content.line, FOLLOW_UP_LINE_MAX),
    benefitLine: clampLine(benefitLine, FOLLOW_UP_BENEFIT_LINE_MAX),
    riskLine:
      visibilityLevel === 'detailed' && draft.riskLine
        ? clampLine(draft.riskLine, FOLLOW_UP_RISK_LINE_MAX)
        : visibilityLevel === 'detailed'
          ? content.riskLine
            ? clampLine(content.riskLine, FOLLOW_UP_RISK_LINE_MAX)
            : undefined
          : undefined,
    districtId: draft.districtId,
    districtName: draft.districtName,
    costBand,
    impactBand,
    sourceIds,
    sourceKinds,
    confidence: isFallback ? 'low' : draft.confidence,
    priority: clamp(draft.priority, 0, 100),
    dayPolicy: draft.dayPolicy,
    visibilityLevel,
    isActionable: !isFallback && draft.kind !== 'safe_watch',
    isFallback,
  };
}

function suppressSpam(drafts: FollowUpActionDraft[]): FollowUpActionDraft[] {
  const kindCount = new Map<string, number>();
  const districtCount = new Map<string, number>();
  const result: FollowUpActionDraft[] = [];

  const sorted = [...drafts].sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));

  for (const draft of sorted) {
    const kindKey = draft.kind;
    const districtKey = draft.districtId ?? 'city';
    const nextKindCount = (kindCount.get(kindKey) ?? 0) + 1;
    const nextDistrictCount = (districtCount.get(districtKey) ?? 0) + 1;

    if (nextKindCount > 2 || (draft.districtId && nextDistrictCount > 2)) continue;

    kindCount.set(kindKey, nextKindCount);
    districtCount.set(districtKey, nextDistrictCount);
    result.push(draft);
  }

  return result;
}

function extractPermissionIds(input: FollowUpActionInput): Set<string> {
  const summary = input.authorityExpansionSummary;
  if (!isRecord(summary)) return new Set();

  const ids = new Set<string>();
  for (const benefit of asArray(summary.unlockedBenefits)) {
    if (!isRecord(benefit)) continue;
    const perm = asString(benefit.requiredPermissionId);
    if (perm && benefit.isUnlocked === true) ids.add(perm);
  }
  return ids;
}

function hasDetailedPermission(permissionIds: Set<string>): boolean {
  return (
    permissionIds.has('portfolio_defer_reason') ||
    permissionIds.has('tomorrow_risk_preview') ||
    permissionIds.has('district_memory_trace_preview')
  );
}

function collectDrafts(input: FollowUpActionInput): FollowUpActionDraft[] {
  const day = Math.max(1, input.day ?? 1);
  if (day <= 1) {
    const fallback = adaptSafeFallback(input);
    return fallback;
  }

  const candidates = [
    ...adaptPortfolioDeferRisk(input),
    ...adaptOneMoreDayRetention(input),
    ...adaptDailyCapacityPortfolio(input),
    ...adaptCityMemoryVisibility(input),
    ...adaptDecisionLikeSignals(input),
    ...adaptDistrictPersonality(input),
    ...adaptRewardComeback(input),
    ...adaptEceStrategyLine(input),
  ].filter((draft) => hasRealSource(draft.sourceIds, draft.sourceKinds));

  if (candidates.length === 0) return [];
  return suppressSpam(candidates);
}

export function buildFollowUpActions(input: FollowUpActionInput): FollowUpActionResult {
  const day = Math.max(1, input.day ?? 1);
  const permissionIds = extractPermissionIds(input);
  const detailed = hasDetailedPermission(permissionIds);

  const drafts = collectDrafts(input);
  const recentIds = new Set(input.recentActionIds ?? []);

  const actions = drafts
    .filter((draft) => !draft.sourceIds.some((id) => recentIds.has(id)))
    .map((draft, index) => buildActionFromDraft(draft, index, detailed))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, day <= 1 ? 1 : FOLLOW_UP_MAX_ACTIONS);

  const primaryAction = actions[0];
  const secondaryAction = actions.length > 1 ? actions[1] : undefined;
  const sourceIds = uniqueStrings(actions.flatMap((action) => action.sourceIds));

  return {
    day,
    actions,
    primaryAction,
    secondaryAction,
    sourceIds,
  };
}

export function buildFollowUpActionDebugRows(result: FollowUpActionResult): string[] {
  return result.actions.map((action) => {
    const district = action.districtName ? ` @${action.districtName}` : '';
    return `[${action.kind}] p${action.priority} ${action.costBand}/${action.impactBand} ${action.title}${district}`;
  });
}
