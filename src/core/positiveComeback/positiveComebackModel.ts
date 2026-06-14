import {
  AUTHORITY_POSITIVE_COMEBACK_PERMISSIONS,
  POSITIVE_COMEBACK_BENEFIT_LINES,
  POSITIVE_COMEBACK_COPY,
  POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS,
  POSITIVE_COMEBACK_KIND_PRIORITY_BASE,
  POSITIVE_COMEBACK_BENEFIT_LINE_MAX,
  POSITIVE_COMEBACK_KIND_TITLES,
  POSITIVE_COMEBACK_LINE_MAX,
  POSITIVE_COMEBACK_MAX_CANDIDATES,
  POSITIVE_COMEBACK_TITLE_MAX,
} from './positiveComebackConstants';
import type {
  PositiveComebackCandidate,
  PositiveComebackCandidateDraft,
  PositiveComebackDayPolicy,
  PositiveComebackInput,
  PositiveComebackKind,
  PositiveComebackResult,
  PositiveComebackSourceKind,
  PositiveComebackTone,
  PositiveComebackVisibilityLevel,
} from './positiveComebackTypes';

let candidateCounter = 0;

function nextCandidateId(prefix: string): string {
  candidateCounter += 1;
  return `pc_${prefix}_${candidateCounter}`;
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

function hasRealSource(ids: readonly string[], kinds: readonly PositiveComebackSourceKind[]): boolean {
  return ids.length > 0 && !kinds.includes('fallback');
}

function resolveDayPolicy(day: number): PositiveComebackDayPolicy {
  if (day <= 1) return 'day_1';
  if (day <= 7) return 'day_2_7';
  if (day <= 9) return 'day_8_plus';
  return 'day_10_plus';
}

function pickCopy(kind: PositiveComebackKind, seed = 0): string {
  const lines = POSITIVE_COMEBACK_COPY[kind];
  return lines[Math.abs(seed) % lines.length] ?? lines[0];
}

function pickBenefitLine(kind: PositiveComebackKind, seed = 0): string {
  const lines = POSITIVE_COMEBACK_BENEFIT_LINES[kind];
  return lines[Math.abs(seed) % lines.length] ?? lines[0];
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicateLine(line: string, existing: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existing.some((entry) => normalizeLine(entry) === normalized);
}

function containsFakeRecovery(text: string): boolean {
  return POSITIVE_COMEBACK_FAKE_RECOVERY_PATTERNS.some((pattern) => pattern.test(text));
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

function hasLivePersonalitySource(profile: Record<string, unknown>): boolean {
  const sourceKinds = asArray(profile.sourceKinds).map(asString).filter(Boolean);
  if (sourceKinds.length === 0) return false;
  if (sourceKinds.length === 1 && sourceKinds[0] === 'design_baseline') return false;
  return sourceIdsFromUnknown(profile).length > 0;
}

function hasPermission(input: PositiveComebackInput, permissionId: string): boolean {
  const ids = input.authorityPermissionIds ?? [];
  if (ids.includes(permissionId)) return true;
  const summary = input.authorityExpansionSummary;
  if (!isRecord(summary)) return false;
  const benefits = [
    ...asArray(summary.unlockedBenefits),
    ...asArray(summary.teaserBenefits),
  ];
  return benefits.some((benefit) => {
    if (!isRecord(benefit)) return false;
    return (
      asString(benefit.requiredPermissionId) === permissionId &&
      benefit.isUnlocked === true
    );
  });
}

function resolveVisibility(
  input: PositiveComebackInput,
  kind: PositiveComebackKind,
  isFallback: boolean,
): PositiveComebackVisibilityLevel {
  if (isFallback) return 'hidden';
  const permissionId =
    AUTHORITY_POSITIVE_COMEBACK_PERMISSIONS[
      kind as keyof typeof AUTHORITY_POSITIVE_COMEBACK_PERMISSIONS
    ];
  if (!permissionId) return 'summary';
  return hasPermission(input, permissionId) ? 'detailed' : 'teaser';
}

function resolveTone(kind: PositiveComebackKind, draftTone?: PositiveComebackTone): PositiveComebackTone {
  if (draftTone) return draftTone;
  if (kind === 'safe_momentum' || kind === 'fallback') return 'calm';
  if (kind === 'opportunity_window' || kind === 'follow_up_success') return 'hopeful';
  if (kind === 'memory_positive_trace') return 'strategic';
  return 'positive';
}

function buildCandidate(
  draft: PositiveComebackCandidateDraft,
  input: PositiveComebackInput,
  existingLines: readonly string[],
): PositiveComebackCandidate | null {
  const sourceIds = uniqueStrings(draft.sourceIds);
  const sourceKinds = [...new Set(draft.sourceKinds)];
  const isFallback = draft.isFallback === true || sourceKinds.includes('fallback');
  if (!isFallback && sourceIds.length === 0) return null;

  const seed = draft.seed ?? sourceIds.length;
  const line = clampLine(draft.line ?? pickCopy(draft.kind, seed), POSITIVE_COMEBACK_LINE_MAX);
  if (containsFakeRecovery(line)) return null;
  if (duplicateLine(line, existingLines)) return null;

  const benefitLine = clampLine(
    draft.benefitLine ?? pickBenefitLine(draft.kind, seed),
    POSITIVE_COMEBACK_BENEFIT_LINE_MAX,
  );
  if (containsFakeRecovery(benefitLine)) return null;

  const visibilityLevel =
    draft.visibilityLevel ?? resolveVisibility(input, draft.kind, isFallback);

  return {
    id: nextCandidateId(draft.kind),
    kind: draft.kind,
    title: clampLine(draft.title ?? POSITIVE_COMEBACK_KIND_TITLES[draft.kind], POSITIVE_COMEBACK_TITLE_MAX),
    line,
    benefitLine,
    districtId: draft.districtId,
    districtName: draft.districtName,
    tone: resolveTone(draft.kind, draft.tone),
    sourceIds,
    sourceKinds,
    confidence: isFallback ? 'low' : draft.confidence,
    priority: clamp(draft.priority, 0, 100),
    dayPolicy: draft.dayPolicy ?? resolveDayPolicy(input.day),
    isActionable: draft.isActionable === true && !isFallback,
    isFallback,
    visibilityLevel,
  };
}

const FOLLOW_UP_KIND_MAP: Record<string, PositiveComebackKind> = {
  support_recovery: 'district_recovery',
  reinforce_trust: 'trust_recovery',
  calm_social_pulse: 'social_support',
  check_container_line: 'container_improvement',
  review_route: 'route_relief',
  rebalance_resource: 'resource_relief',
  safe_watch: 'safe_momentum',
  capture_memory_trace: 'memory_positive_trace',
};

const PORTFOLIO_ITEM_KIND_MAP: Record<string, PositiveComebackKind> = {
  recovery_opportunity: 'district_recovery',
  positive_opportunity: 'safe_momentum',
  follow_up_candidate: 'follow_up_success',
  resource_pressure: 'resource_relief',
};

const PORTFOLIO_DEFER_KIND_MAP: Record<string, PositiveComebackKind> = {
  opportunity_may_expire: 'opportunity_window',
  safe_to_watch: 'safe_momentum',
  memory_trace_may_harden: 'memory_positive_trace',
};

const DISTRICT_CRITERION_KIND_MAP: Record<string, PositiveComebackKind> = {
  recovery_potential: 'opportunity_window',
  trust_fragility: 'trust_recovery',
  public_visibility: 'social_support',
  container_density: 'container_improvement',
  route_difficulty: 'route_relief',
};

function adaptRewardComeback(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.rewardComebackSignals;
  if (!isRecord(raw)) return [];

  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return [];

  const tone = asString(raw.tone);
  const kind: PositiveComebackKind =
    tone === 'recovery' || tone === 'comeback' ? 'district_recovery' : 'opportunity_window';

  return [
    {
      kind,
      sourceIds,
      sourceKinds: ['reward_comeback'],
      priority: 95,
      confidence: 'high',
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      title: asString(raw.title),
      line: asString(raw.summary) ?? asString(raw.line),
      dayPolicy: 'day_8_plus',
    },
  ];
}

function adaptFollowUpActions(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.followUpActionResult;
  if (!isRecord(raw)) return [];

  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const action of asArray(raw.actions)) {
    if (!isRecord(action)) continue;
    const kindKey = asString(action.kind);
    if (!kindKey) continue;
    const mappedKind = FOLLOW_UP_KIND_MAP[kindKey];
    if (!mappedKind) continue;

    const sourceIds = sourceIdsFromUnknown(action);
    if (sourceIds.length === 0) continue;

    drafts.push({
      kind: mappedKind,
      sourceIds,
      sourceKinds: ['follow_up_action'],
      priority: typeof action.priority === 'number' ? action.priority + 4 : POSITIVE_COMEBACK_KIND_PRIORITY_BASE[mappedKind] + 6,
      confidence:
        asString(action.confidence) === 'high'
          ? 'high'
          : asString(action.confidence) === 'low'
            ? 'low'
            : 'medium',
      districtId: asString(action.districtId),
      districtName: asString(action.districtName),
      title: asString(action.title),
      line: asString(action.line),
      benefitLine: asString(action.benefitLine),
      dayPolicy: (asString(action.dayPolicy) as PositiveComebackDayPolicy | undefined) ?? 'day_8_plus',
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptDailyCapacityPortfolio(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.dailyCapacityPortfolioResult;
  if (!isRecord(raw)) return [];

  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const item of asArray(raw.items)) {
    if (!isRecord(item)) continue;
    const kindKey = asString(item.kind);
    if (!kindKey) continue;

    let mappedKind = PORTFOLIO_ITEM_KIND_MAP[kindKey];
    if (!mappedKind) continue;

    if (kindKey === 'positive_opportunity') {
      const sourceKinds = asArray(item.sourceKinds).map(asString);
      mappedKind = sourceKinds.includes('social_pulse') ? 'social_support' : 'safe_momentum';
    }
    if (kindKey === 'follow_up_candidate') {
      const sourceKinds = asArray(item.sourceKinds).map(asString);
      if (!sourceKinds.includes('reward_comeback') && !sourceKinds.includes('decision_consequence')) {
        continue;
      }
    }
    if (kindKey === 'resource_pressure') {
      const opportunity = asString(item.opportunityValue);
      if (opportunity !== 'medium' && opportunity !== 'high') continue;
      mappedKind = 'resource_relief';
    }

    const sourceIds = sourceIdsFromUnknown(item);
    if (sourceIds.length === 0) continue;

    drafts.push({
      kind: mappedKind,
      sourceIds,
      sourceKinds: ['daily_capacity_portfolio'],
      priority: typeof item.priority === 'number' ? item.priority : POSITIVE_COMEBACK_KIND_PRIORITY_BASE[mappedKind],
      confidence:
        asString(item.confidence) === 'high'
          ? 'high'
          : asString(item.confidence) === 'low'
            ? 'low'
            : 'medium',
      districtId: asString(item.districtId),
      districtName: asString(item.districtName),
      title: asString(item.title),
      line: asString(item.subtitle) ?? asString(item.recommendedReason),
      benefitLine: asString(item.selectBenefitLine),
      dayPolicy: 'day_8_plus',
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptOneMoreDayRetention(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.oneMoreDayRetentionResult;
  if (!isRecord(raw)) return [];

  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const hook of [raw.primaryHook, raw.secondaryHook]) {
    if (!isRecord(hook)) continue;
    const kindKey = asString(hook.kind);
    const sourceIds = sourceIdsFromUnknown(hook);
    if (sourceIds.length === 0) continue;

    let mappedKind: PositiveComebackKind | undefined;
    if (kindKey === 'recovery_opportunity') mappedKind = 'district_recovery';
    else if (kindKey === 'safe_continue') mappedKind = 'safe_momentum';
    if (!mappedKind) continue;

    drafts.push({
      kind: mappedKind,
      sourceIds,
      sourceKinds: ['one_more_day_retention'],
      priority: typeof hook.priority === 'number' ? hook.priority - 4 : 70,
      confidence: asString(hook.confidence) === 'high' ? 'high' : 'medium',
      districtId: asString(hook.districtId),
      districtName: asString(hook.districtName),
      title: asString(hook.title),
      line: asString(hook.line),
      dayPolicy: 'day_8_plus',
    });
  }
  return drafts;
}

function adaptPortfolioDeferRisk(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.portfolioDeferRiskResult;
  if (!isRecord(raw)) return [];

  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const binding of asArray(raw.bindings)) {
    if (!isRecord(binding)) continue;
    const deferRisk = asString(binding.deferRisk);
    if (!deferRisk) continue;

    let mappedKind = PORTFOLIO_DEFER_KIND_MAP[deferRisk];
    if (!mappedKind) continue;

    if (deferRisk === 'safe_to_watch') {
      const tone = asString(binding.tone);
      if (tone !== 'positive') continue;
      mappedKind = 'safe_momentum';
    }
    if (deferRisk === 'memory_trace_may_harden') {
      const sourceKinds = asArray(binding.sourceKinds).map(asString);
      const hasPositive = sourceKinds.some((kind) =>
        ['decision_consequence', 'carry_over', 'city_memory_visibility'].includes(kind ?? ''),
      );
      if (!hasPositive) continue;
    }

    const sourceIds = sourceIdsFromUnknown(binding);
    if (sourceIds.length === 0 || binding.isFallback === true) continue;

    drafts.push({
      kind: mappedKind,
      sourceIds,
      sourceKinds: ['portfolio_defer_risk'],
      priority: typeof binding.priority === 'number' ? binding.priority - 2 : 68,
      confidence:
        asString(binding.confidence) === 'high'
          ? 'high'
          : asString(binding.confidence) === 'low'
            ? 'low'
            : 'medium',
      districtId: asString(binding.districtId),
      districtName: asString(binding.districtName),
      title: asString(binding.title),
      line: asString(binding.line) ?? asString(binding.nextActionLine),
      dayPolicy: 'day_8_plus',
    });
  }
  return drafts;
}

function adaptCityMemoryVisibility(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.cityMemoryVisibilityResult;
  if (!isRecord(raw)) return [];

  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const trace of asArray(raw.traces)) {
    if (!isRecord(trace)) continue;
    const tone = asString(trace.tone);
    const kindKey = asString(trace.kind);
    const sourceIds = sourceIdsFromUnknown(trace);
    if (sourceIds.length === 0 || trace.isFallback === true) continue;

    let mappedKind: PositiveComebackKind | undefined;
    if (tone === 'positive' || kindKey === 'decision_trace') {
      mappedKind = 'memory_positive_trace';
    } else if (kindKey === 'district_trace') {
      mappedKind = 'district_recovery';
    } else if (kindKey === 'story_chain_trace') {
      mappedKind = 'opportunity_window';
    }
    if (!mappedKind) continue;

    const sourceKinds = asArray(trace.sourceKinds).map(asString);
    const hasRecoverySource = sourceKinds.some((kind) =>
      ['decision_consequence', 'carry_over', 'district_memory', 'story_chain', 'city_archive'].includes(
        kind ?? '',
      ),
    );
    if (mappedKind === 'memory_positive_trace' && !hasRecoverySource && tone !== 'positive') continue;
    if (mappedKind === 'district_recovery' && !hasRecoverySource) continue;

    drafts.push({
      kind: mappedKind,
      sourceIds,
      sourceKinds: ['city_memory_visibility'],
      priority: typeof trace.priority === 'number' ? trace.priority - 6 : 64,
      confidence:
        asString(trace.confidence) === 'high'
          ? 'high'
          : asString(trace.confidence) === 'low'
            ? 'low'
            : 'medium',
      districtId: asString(trace.districtId),
      districtName: asString(trace.districtName),
      title: asString(trace.title),
      line: asString(trace.line) ?? asString(trace.shortLine),
      dayPolicy: 'day_10_plus',
    });
  }
  return drafts;
}

function adaptDecisionLike(
  input: PositiveComebackInput,
  raw: unknown,
  sourceKind: PositiveComebackSourceKind,
  basePriority: number,
): PositiveComebackCandidateDraft | null {
  if (!isRecord(raw)) return null;
  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return null;

  const tone = asString(raw.tone) ?? asString(raw.direction);
  const consequenceType = asString(raw.consequenceType) ?? asString(raw.type);
  const isPositive =
    tone === 'positive' ||
    tone === 'recovery' ||
    consequenceType === 'positive_memory' ||
    consequenceType === 'recovery_signal';

  if (!isPositive && sourceKind !== 'butterfly_effect') return null;

  const kind: PositiveComebackKind =
    sourceKind === 'butterfly_effect'
      ? 'opportunity_window'
      : tone === 'recovery'
        ? 'district_recovery'
        : 'memory_positive_trace';

  return {
    kind,
    sourceIds,
    sourceKinds: [sourceKind],
    priority: basePriority,
    confidence: 'medium',
    districtId: asString(raw.districtId) ?? asString(raw.relatedDistrictId),
    districtName: asString(raw.districtName),
    title: asString(raw.title),
    line:
      asString(raw.causalLine) ??
      asString(raw.summary) ??
      asString(raw.line) ??
      asString(raw.text),
    dayPolicy: 'day_8_plus',
  };
}

function adaptDecisionConsequence(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const thread of asArray(input.decisionConsequenceThreads)) {
    const draft = adaptDecisionLike(input, thread, 'decision_consequence', 62);
    if (draft) drafts.push(draft);
  }
  const carry = adaptDecisionLike(input, input.carryOverSignals, 'carry_over', 60);
  if (carry) drafts.push(carry);
  for (const signal of asArray(input.butterflySignals)) {
    const draft = adaptDecisionLike(input, signal, 'butterfly_effect', 58);
    if (draft) drafts.push(draft);
  }
  return drafts;
}

function adaptDistrictPersonality(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const drafts: PositiveComebackCandidateDraft[] = [];
  for (const profile of asArray(input.districtPersonalityProfiles)) {
    if (!isRecord(profile)) continue;
    const districtId = asString(profile.districtId) ?? asString(profile.id);
    if (!districtId) continue;
    const districtName = asString(profile.districtName) ?? asString(profile.name) ?? districtId;
    const sourceIds = sourceIdsFromUnknown(profile);
    const live = hasLivePersonalitySource(profile);

    for (const [criterionId, kind] of Object.entries(DISTRICT_CRITERION_KIND_MAP)) {
      if (criterionBand(profile, criterionId) !== 'high') continue;

      if (kind === 'trust_recovery') {
        const hasTrustSource =
          live &&
          asArray(profile.sourceKinds)
            .map(asString)
            .some((entry) => entry === 'district_trust' || entry === 'social_pulse');
        if (!hasTrustSource) continue;
      }

      if (kind === 'district_recovery') continue;

      drafts.push({
        kind,
        sourceIds: sourceIds.length > 0 ? sourceIds : [`personality_${districtId}_${criterionId}`],
        sourceKinds: ['district_personality'],
        priority: POSITIVE_COMEBACK_KIND_PRIORITY_BASE[kind] - (live ? 0 : 12),
        confidence: live ? 'medium' : 'low',
        districtId,
        districtName,
        dayPolicy: 'day_8_plus',
        seed: criterionId.length,
      });
    }

    if (criterionBand(profile, 'recovery_potential') === 'high') {
      drafts.push({
        kind: 'opportunity_window',
        sourceIds: sourceIds.length > 0 ? sourceIds : [`personality_${districtId}_recovery`],
        sourceKinds: ['district_personality'],
        priority: POSITIVE_COMEBACK_KIND_PRIORITY_BASE.opportunity_window - (live ? 4 : 16),
        confidence: live ? 'medium' : 'low',
        districtId,
        districtName,
        line: live ? undefined : pickCopy('opportunity_window', districtId.length),
        dayPolicy: 'day_8_plus',
      });
    }
  }
  return drafts;
}

function adaptOperationalSignals(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const drafts: PositiveComebackCandidateDraft[] = [];

  const trust = input.districtTrustSignals;
  if (isRecord(trust)) {
    const sourceIds = sourceIdsFromUnknown(trust);
    const band = asString(trust.band) ?? asString(trust.trustBand);
    if (sourceIds.length > 0 && (band === 'recovering' || band === 'improving')) {
      drafts.push({
        kind: 'trust_recovery',
        sourceIds,
        sourceKinds: ['district_trust'],
        priority: 72,
        confidence: 'medium',
        districtId: asString(trust.districtId),
        districtName: asString(trust.districtName),
        line: asString(trust.summary) ?? asString(trust.line),
        dayPolicy: 'day_8_plus',
      });
    }
  }

  const social = input.socialPulseSignals;
  if (isRecord(social)) {
    const sourceIds = sourceIdsFromUnknown(social);
    const tone = asString(social.tone);
    if (sourceIds.length > 0 && (tone === 'positive' || tone === 'calm')) {
      drafts.push({
        kind: 'social_support',
        sourceIds,
        sourceKinds: ['social_pulse'],
        priority: 68,
        confidence: 'medium',
        line: asString(social.summary) ?? asString(social.line),
        dayPolicy: 'day_8_plus',
      });
    }
  }

  const container = input.containerNetworkSignals;
  if (isRecord(container)) {
    const sourceIds = sourceIdsFromUnknown(container);
    const trend = asString(container.trend) ?? asString(container.status);
    if (sourceIds.length > 0 && (trend === 'improving' || trend === 'stable')) {
      drafts.push({
        kind: 'container_improvement',
        sourceIds,
        sourceKinds: ['container_network'],
        priority: 66,
        confidence: 'medium',
        districtId: asString(container.districtId),
        districtName: asString(container.districtName),
        line: asString(container.summary) ?? asString(container.line),
        dayPolicy: 'day_8_plus',
      });
    }
  }

  const resource = input.operationalResourceSignals;
  if (isRecord(resource)) {
    const sourceIds = sourceIdsFromUnknown(resource);
    const trend = asString(resource.trend) ?? asString(resource.state);
    if (sourceIds.length > 0 && (trend === 'improving' || trend === 'stable')) {
      drafts.push({
        kind: 'resource_relief',
        sourceIds,
        sourceKinds: ['operational_resource'],
        priority: 70,
        confidence: 'medium',
        line: asString(resource.summary) ?? asString(resource.line),
        dayPolicy: 'day_8_plus',
      });
    }
  }

  return drafts;
}

function adaptEceStrategyLine(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const raw = input.eceStrategyLineResult;
  if (!isRecord(raw)) return [];
  const sourceIds = sourceIdsFromUnknown(raw);
  if (sourceIds.length === 0) return [];

  const text =
    asString(raw.opportunityLine) ??
    asString(raw.recoveryLine) ??
    asString(raw.strategyLine);
  if (!text) return [];

  return [
    {
      kind: 'opportunity_window',
      sourceIds,
      sourceKinds: ['ece_strategy_line'],
      priority: 58,
      confidence: 'medium',
      line: text,
      dayPolicy: 'day_8_plus',
    },
  ];
}

function adaptSafeFallback(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  const day = Math.max(1, input.day ?? 1);
  if (day <= 1) {
    return [
      {
        kind: 'fallback',
        sourceIds: [`fallback_positive_day_${day}`],
        sourceKinds: ['fallback'],
        priority: POSITIVE_COMEBACK_KIND_PRIORITY_BASE.fallback,
        confidence: 'low',
        dayPolicy: 'day_1',
        isFallback: true,
        visibilityLevel: 'hidden',
      },
    ];
  }
  if (day < 8) return [];
  return [
    {
      kind: 'safe_momentum',
      sourceIds: [`fallback_positive_day_${day}`],
      sourceKinds: ['fallback'],
      priority: POSITIVE_COMEBACK_KIND_PRIORITY_BASE.safe_momentum,
      confidence: 'low',
      dayPolicy: 'day_8_plus',
      isFallback: true,
      visibilityLevel: 'teaser',
    },
  ];
}

function collectDrafts(input: PositiveComebackInput): PositiveComebackCandidateDraft[] {
  return [
    ...adaptRewardComeback(input),
    ...adaptFollowUpActions(input),
    ...adaptDailyCapacityPortfolio(input),
    ...adaptOneMoreDayRetention(input),
    ...adaptPortfolioDeferRisk(input),
    ...adaptCityMemoryVisibility(input),
    ...adaptDecisionConsequence(input),
    ...adaptDistrictPersonality(input),
    ...adaptOperationalSignals(input),
    ...adaptEceStrategyLine(input),
  ];
}

function sortCandidates(candidates: PositiveComebackCandidate[]): PositiveComebackCandidate[] {
  const confidenceScore = { high: 3, medium: 2, low: 1 };
  return [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return confidenceScore[b.confidence] - confidenceScore[a.confidence];
  });
}

function pickSurfaceCandidates(
  candidates: PositiveComebackCandidate[],
  day: number,
): Pick<
  PositiveComebackResult,
  'primaryCandidate' | 'reportCandidate' | 'hubCandidate' | 'eceCandidate' | 'portfolioCandidate'
> {
  const visible = candidates.filter((candidate) => {
    if (day <= 1) return candidate.isFallback;
    if (candidate.visibilityLevel === 'hidden') return false;
    return true;
  });

  const primary = visible[0];
  const nonFallback = visible.filter((candidate) => !candidate.isFallback);

  const report =
    nonFallback.find((candidate) =>
      ['memory_positive_trace', 'district_recovery', 'follow_up_success'].includes(candidate.kind),
    ) ?? primary;

  const hub =
    nonFallback.find((candidate) =>
      ['opportunity_window', 'safe_momentum', 'follow_up_success'].includes(candidate.kind),
    ) ?? primary;

  const ece =
    nonFallback.find((candidate) =>
      ['opportunity_window', 'trust_recovery', 'memory_positive_trace'].includes(candidate.kind),
    ) ?? primary;

  const portfolio =
    nonFallback.find((candidate) =>
      ['district_recovery', 'resource_relief', 'opportunity_window'].includes(candidate.kind),
    ) ?? primary;

  return {
    primaryCandidate: primary,
    reportCandidate: report,
    hubCandidate: hub,
    eceCandidate: ece,
    portfolioCandidate: portfolio,
  };
}

export function buildPositiveComeback(input: PositiveComebackInput): PositiveComebackResult {
  const day = Math.max(1, input.day ?? 1);
  const recentIds = new Set(input.recentCandidateIds ?? []);
  const existingLines: string[] = [];

  const drafts = collectDrafts(input);
  const hasRealDraft = drafts.some(
    (draft) => draft.isFallback !== true && draft.sourceKinds.includes('fallback') === false,
  );

  const allDrafts = hasRealDraft ? drafts : [...drafts, ...adaptSafeFallback(input)];

  const candidates: PositiveComebackCandidate[] = [];
  for (const draft of allDrafts) {
    const candidate = buildCandidate(draft, input, existingLines);
    if (!candidate) continue;
    if (recentIds.has(candidate.id)) continue;
    if (day <= 1 && !candidate.isFallback) continue;
    candidates.push(candidate);
    existingLines.push(candidate.line);
  }

  const sorted = sortCandidates(candidates);
  const uniqueByKind: PositiveComebackCandidate[] = [];
  const seenKinds = new Set<PositiveComebackKind>();
  for (const candidate of sorted) {
    if (seenKinds.has(candidate.kind) && !candidate.isFallback) continue;
    seenKinds.add(candidate.kind);
    uniqueByKind.push(candidate);
    if (uniqueByKind.length >= POSITIVE_COMEBACK_MAX_CANDIDATES) break;
  }

  const surfaces = pickSurfaceCandidates(uniqueByKind, day);
  const sourceIds = uniqueStrings(uniqueByKind.flatMap((candidate) => candidate.sourceIds));

  return {
    day,
    candidates: uniqueByKind,
    ...surfaces,
    sourceIds,
  };
}

export function hasPositiveComebackRealSource(result: PositiveComebackResult): boolean {
  return result.candidates.some(
    (candidate) => hasRealSource(candidate.sourceIds, candidate.sourceKinds),
  );
}

export function collectPositiveComebackLines(result: PositiveComebackResult): string[] {
  return result.candidates.flatMap((candidate) => [
    candidate.title,
    candidate.line,
    candidate.benefitLine,
  ]);
}
