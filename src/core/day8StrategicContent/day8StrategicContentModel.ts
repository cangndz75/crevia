import {
  DAY8_STRATEGIC_CONTENT_COPY,
  DAY8_STRATEGIC_CONTENT_FAKE_CLAIM_PATTERNS,
  DAY8_STRATEGIC_CONTENT_KIND_PRIORITY,
  DAY8_STRATEGIC_CONTENT_KIND_TITLES,
  DAY8_STRATEGIC_CONTENT_LINE_MAX,
  DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES,
  DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS,
  DAY8_STRATEGIC_CONTENT_RISK_KINDS,
  DAY8_STRATEGIC_CONTENT_SHORT_MAX,
  DAY8_STRATEGIC_CONTENT_TITLE_MAX,
  resolveDay8StrategicContentDayPolicy,
} from './day8StrategicContentConstants';
import type {
  Day8StrategicContentCandidate,
  Day8StrategicContentCandidateDraft,
  Day8StrategicContentConfidence,
  Day8StrategicContentInput,
  Day8StrategicContentKind,
  Day8StrategicContentResult,
  Day8StrategicContentSourceKind,
  Day8StrategicContentTone,
  Day8StrategicContentVisibilityLevel,
} from './day8StrategicContentTypes';

let candidateCounter = 0;

function nextCandidateId(prefix: string): string {
  candidateCounter += 1;
  return `d8sc_${prefix}_${candidateCounter}`;
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

function containsFakeClaim(text: string): boolean {
  return DAY8_STRATEGIC_CONTENT_FAKE_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

function pickCopy(kind: Day8StrategicContentKind, seed = 0): string {
  const lines = DAY8_STRATEGIC_CONTENT_COPY[kind];
  return lines[Math.abs(seed) % lines.length] ?? lines[0];
}

function hasPermission(input: Day8StrategicContentInput, permissionId: string): boolean {
  const ids = input.authorityPermissionIds ?? [];
  if (ids.includes(permissionId)) return true;
  const summary = input.authorityExpansionSummary;
  if (!isRecord(summary)) return false;
  for (const benefit of asArray(summary.unlockedBenefits)) {
    if (!isRecord(benefit)) continue;
    if (asString(benefit.requiredPermissionId) === permissionId && benefit.isUnlocked === true) {
      return true;
    }
  }
  return false;
}

function resolveVisibilityForKind(
  input: Day8StrategicContentInput,
  kind: Day8StrategicContentKind,
  base: Day8StrategicContentVisibilityLevel = 'summary',
): Day8StrategicContentVisibilityLevel {
  if (kind === 'fallback' || (input.day ?? 1) < 8) return 'hidden';
  const permissionByKind: Partial<Record<Day8StrategicContentKind, string>> = {
    resource_pressure_focus: 'portfolio_cost_explanation',
    defer_risk_focus: 'tomorrow_priority_reason',
    district_neglect_focus: 'district_context_detail',
    district_recovery_focus: 'district_context_detail',
    map_priority_focus: 'map_layer_detail',
    strategic_operation_focus: 'ece_analysis_depth',
    authority_explanation_focus: 'ece_analysis_depth',
  };
  const permissionId = permissionByKind[kind];
  if (!permissionId) return base;
  return hasPermission(input, permissionId) ? 'detailed' : base === 'detailed' ? 'summary' : base;
}

function resolveTone(kind: Day8StrategicContentKind, draft?: Day8StrategicContentCandidateDraft): Day8StrategicContentTone {
  if (draft?.tone) return draft.tone;
  if (DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS.includes(kind)) return 'positive';
  if (DAY8_STRATEGIC_CONTENT_RISK_KINDS.includes(kind)) return 'cautious';
  if (kind === 'strategic_operation_focus' || kind === 'map_priority_focus') return 'strategic';
  if (kind === 'authority_explanation_focus') return 'locked';
  if (kind === 'fallback' || kind === 'safe_watch_focus') return 'neutral';
  return 'strategic';
}

function pushDraft(drafts: Day8StrategicContentCandidateDraft[], draft: Day8StrategicContentCandidateDraft): void {
  if (draft.sourceIds.length === 0) return;
  drafts.push(draft);
}

function adaptDistrictNeglectRecovery(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.districtNeglectRecoveryResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  for (const signal of asArray(raw.signals)) {
    if (!isRecord(signal) || signal.isFallback === true) continue;
    const kind = asString(signal.kind);
    const sourceIds = sourceIdsFromUnknown(signal);
    if (sourceIds.length === 0) continue;
    const base = {
      districtId: asString(signal.districtId),
      districtName: asString(signal.districtName),
      sourceIds,
      sourceKinds: ['district_neglect_recovery'] as Day8StrategicContentSourceKind[],
      confidence: (asString(signal.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof signal.priority === 'number' ? signal.priority : 80,
      lineHint: asString(signal.line),
      seed: sourceIds.length,
    };
    if (kind === 'neglect_warning' || kind === 'neglect_watch') {
      const neglectBand = asString(signal.neglectBand);
      pushDraft(drafts, {
        ...base,
        kind: 'district_neglect_focus',
        isRisk: true,
        priority: neglectBand === 'high' || neglectBand === 'rising' ? 94 : base.priority,
        confidence: neglectBand === 'high' ? 'high' : base.confidence,
      });
    } else if (kind === 'trust_fragility' || kind === 'social_cooling') {
      pushDraft(drafts, { ...base, kind: 'social_trust_focus', isRisk: true, priority: 82 });
    } else if (kind === 'route_backlog') {
      pushDraft(drafts, { ...base, kind: 'route_pressure_focus', isRisk: true, priority: 84 });
    } else if (kind === 'container_backlog') {
      pushDraft(drafts, { ...base, kind: 'container_pressure_focus', isRisk: true, priority: 82 });
    } else if (kind === 'recovery_window' || kind === 'recovery_progress') {
      pushDraft(drafts, { ...base, kind: 'district_recovery_focus', isPositive: true, priority: 92 });
    } else if (kind === 'positive_momentum') {
      pushDraft(drafts, { ...base, kind: 'positive_comeback_focus', isPositive: true, priority: 88 });
    }
  }
  return drafts;
}

function adaptPositiveComeback(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.positiveComebackResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const kindMap: Record<string, Day8StrategicContentKind> = {
    district_recovery: 'district_recovery_focus',
    trust_recovery: 'social_trust_focus',
    resource_relief: 'resource_pressure_focus',
    social_support: 'social_trust_focus',
    container_improvement: 'container_pressure_focus',
    route_relief: 'route_pressure_focus',
    follow_up_success: 'follow_up_focus',
    memory_positive_trace: 'memory_trace_focus',
    opportunity_window: 'positive_comeback_focus',
    safe_momentum: 'positive_comeback_focus',
  };
  for (const candidate of asArray(raw.candidates)) {
    if (!isRecord(candidate) || candidate.isFallback === true) continue;
    const kind = asString(candidate.kind);
    const mapped = kind ? kindMap[kind] : undefined;
    if (!mapped) continue;
    const sourceIds = sourceIdsFromUnknown(candidate);
    if (sourceIds.length === 0) continue;
    pushDraft(drafts, {
      kind: mapped,
      districtId: asString(candidate.districtId),
      districtName: asString(candidate.districtName),
      sourceIds,
      sourceKinds: ['positive_comeback'],
      confidence: (asString(candidate.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof candidate.priority === 'number' ? candidate.priority : 86,
      isPositive: DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS.includes(mapped),
      lineHint: asString(candidate.line),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptPortfolioDeferRisk(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.portfolioDeferRiskResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const kindMap: Record<string, Day8StrategicContentKind> = {
    trust_may_drop: 'social_trust_focus',
    social_reaction_may_grow: 'social_trust_focus',
    route_may_strain: 'route_pressure_focus',
    resource_cost_may_rise: 'resource_pressure_focus',
    opportunity_may_expire: 'positive_comeback_focus',
    memory_trace_may_harden: 'memory_trace_focus',
    pressure_may_grow: 'defer_risk_focus',
  };
  for (const binding of asArray(raw.bindings)) {
    if (!isRecord(binding)) continue;
    const deferRisk = asString(binding.deferRisk);
    const mapped = deferRisk ? kindMap[deferRisk] : undefined;
    if (!mapped) continue;
    const sourceIds = sourceIdsFromUnknown(binding);
    if (sourceIds.length === 0) continue;
    pushDraft(drafts, {
      kind: mapped,
      districtId: asString(binding.districtId),
      districtName: asString(binding.districtName),
      sourceIds,
      sourceKinds: ['portfolio_defer_risk'],
      confidence: 'medium',
      priority: deferRisk === 'opportunity_may_expire' ? 84 : 86,
      isRisk: mapped === 'defer_risk_focus' || DAY8_STRATEGIC_CONTENT_RISK_KINDS.includes(mapped),
      isPositive: mapped === 'positive_comeback_focus',
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptDailyCapacityPortfolio(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.dailyCapacityPortfolioResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const kindMap: Record<string, Day8StrategicContentKind> = {
    district_pressure: 'district_neglect_focus',
    resource_pressure: 'resource_pressure_focus',
    route_pressure: 'route_pressure_focus',
    social_pressure: 'social_trust_focus',
    container_pressure: 'container_pressure_focus',
    recovery_opportunity: 'district_recovery_focus',
    positive_opportunity: 'positive_comeback_focus',
    follow_up_candidate: 'follow_up_focus',
  };
  for (const item of asArray(raw.items)) {
    if (!isRecord(item)) continue;
    const kind = asString(item.kind);
    const mapped = kind ? kindMap[kind] : undefined;
    if (!mapped) continue;
    const sourceIds = sourceIdsFromUnknown(item);
    if (sourceIds.length === 0) continue;
    const status = asString(item.status);
    pushDraft(drafts, {
      kind: mapped,
      districtId: asString(item.districtId),
      districtName: asString(item.districtName),
      sourceIds,
      sourceKinds: ['daily_capacity_portfolio'],
      confidence: status === 'deferred' ? 'high' : 'medium',
      priority: typeof item.priority === 'number' ? item.priority : 78,
      isRisk: mapped === 'district_neglect_focus' && (status === 'deferred' || status === 'watch_only'),
      isPositive: DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS.includes(mapped),
      titleHint: asString(item.title),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptFollowUpActions(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.followUpActionResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const kindMap: Record<string, Day8StrategicContentKind> = {
    support_recovery: 'district_recovery_focus',
    reinforce_trust: 'social_trust_focus',
    review_route: 'route_pressure_focus',
    check_container_line: 'container_pressure_focus',
    rebalance_resource: 'resource_pressure_focus',
    capture_memory_trace: 'memory_trace_focus',
    prepare_tomorrow: 'follow_up_focus',
    safe_watch: 'safe_watch_focus',
    recheck_district: 'district_neglect_focus',
    monitor_signal: 'safe_watch_focus',
  };
  for (const action of asArray(raw.actions)) {
    if (!isRecord(action) || action.isFallback === true) continue;
    const kind = asString(action.kind);
    const mapped = kind ? kindMap[kind] : undefined;
    if (!mapped) continue;
    const sourceIds = sourceIdsFromUnknown(action);
    if (sourceIds.length === 0) continue;
    pushDraft(drafts, {
      kind: mapped,
      districtId: asString(action.districtId),
      districtName: asString(action.districtName),
      sourceIds,
      sourceKinds: ['follow_up_action'],
      confidence: (asString(action.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof action.priority === 'number' ? action.priority : 80,
      isPositive: mapped === 'district_recovery_focus' || mapped === 'follow_up_focus',
      isRisk: mapped === 'district_neglect_focus',
      lineHint: asString(action.line),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptCityMemory(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.cityMemoryVisibilityResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  for (const trace of asArray(raw.traces)) {
    if (!isRecord(trace) || trace.isFallback === true) continue;
    const traceKind = asString(trace.kind);
    const sourceIds = sourceIdsFromUnknown(trace);
    if (sourceIds.length === 0) continue;
    const mapped =
      traceKind === 'map_memory_hint'
        ? 'map_priority_focus'
        : 'memory_trace_focus';
    pushDraft(drafts, {
      kind: mapped,
      districtId: asString(trace.districtId),
      districtName: asString(trace.districtName),
      sourceIds,
      sourceKinds: ['city_memory_visibility'],
      confidence: (asString(trace.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof trace.priority === 'number' ? trace.priority : 78,
      lineHint: asString(trace.line),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptOneMoreDayRetention(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.oneMoreDayRetentionResult;
  if (!isRecord(raw)) return [];
  const hook = raw.primaryHook;
  if (!isRecord(hook) || hook.isFallback === true) return [];
  const sourceIds = sourceIdsFromUnknown(hook);
  if (sourceIds.length === 0) return [];
  const hookKind = asString(hook.kind);
  const kind: Day8StrategicContentKind =
    hookKind === 'recovery_opportunity' || hookKind === 'district_follow_up'
      ? 'follow_up_focus'
      : 'defer_risk_focus';
  return [
    {
      kind,
      districtId: asString(hook.districtId),
      districtName: asString(hook.districtName),
      sourceIds,
      sourceKinds: ['one_more_day_retention'],
      confidence: (asString(hook.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof hook.priority === 'number' ? hook.priority : 76,
      isPositive: kind === 'follow_up_focus',
      isRisk: kind === 'defer_risk_focus',
      lineHint: asString(hook.line),
      seed: sourceIds.length,
    },
  ];
}

function adaptMapBindings(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const bindings = [
    ...asArray(input.mapGameplayBindings),
    ...asArray(input.activeOperationMapBindings),
  ];
  for (const binding of bindings) {
    if (!isRecord(binding) || binding.isFallback === true) continue;
    const sourceIds = sourceIdsFromUnknown(binding);
    if (sourceIds.length === 0) continue;
    const role = asString(binding.role) ?? asString(binding.kind);
    let kind: Day8StrategicContentKind = 'map_priority_focus';
    if (role === 'operation_tracker' || role === 'active_operation_tracker') {
      kind = 'strategic_operation_focus';
    } else if (role === 'risk_reader' || role === 'district_risk_reader') {
      kind = 'district_neglect_focus';
    } else if (role === 'resource_board' || role === 'resource_pressure_board') {
      kind = 'resource_pressure_focus';
    } else if (role === 'route_support' || role === 'route_support_hint') {
      kind = 'route_pressure_focus';
    } else if (role === 'district_memory' || role === 'district_memory_trace') {
      kind = 'memory_trace_focus';
    }
    pushDraft(drafts, {
      kind,
      districtId: asString(binding.districtId),
      districtName: asString(binding.districtName),
      sourceIds,
      sourceKinds: asArray(input.activeOperationMapBindings).includes(binding)
        ? ['active_operation_map_binding']
        : ['map_gameplay_binding'],
      confidence: (asString(binding.confidence) as Day8StrategicContentConfidence) ?? 'medium',
      priority: typeof binding.priority === 'number' ? binding.priority : 74,
      isRisk: kind === 'district_neglect_focus',
      lineHint: asString(binding.line) ?? asString(binding.summary),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptResourceSignals(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  const sources: Array<{ value: unknown; kind: Day8StrategicContentSourceKind; contentKind: Day8StrategicContentKind }> = [
    { value: input.vehicleMaintenanceSignals, kind: 'vehicle_maintenance', contentKind: 'route_pressure_focus' },
    { value: input.teamSpecializationSignals, kind: 'team_specialization', contentKind: 'resource_pressure_focus' },
    { value: input.containerNetworkSignals, kind: 'container_network', contentKind: 'container_pressure_focus' },
    { value: input.operationalResourceSignals, kind: 'operational_resource', contentKind: 'resource_pressure_focus' },
    { value: input.socialPulseSignals, kind: 'social_pulse', contentKind: 'social_trust_focus' },
    { value: input.districtTrustSignals, kind: 'district_trust', contentKind: 'social_trust_focus' },
  ];
  for (const source of sources) {
    for (const entry of asArray(source.value)) {
      if (!isRecord(entry)) continue;
      const sourceIds = sourceIdsFromUnknown(entry);
      if (sourceIds.length === 0) continue;
      pushDraft(drafts, {
        kind: source.contentKind,
        districtId: asString(entry.districtId),
        districtName: asString(entry.districtName),
        sourceIds,
        sourceKinds: [source.kind],
        confidence: 'medium',
        priority: 68,
        isRisk: true,
        lineHint: asString(entry.summary) ?? asString(entry.title) ?? asString(entry.line),
        seed: sourceIds.length,
      });
    }
    if (isRecord(source.value)) {
      const sourceIds = sourceIdsFromUnknown(source.value);
      if (sourceIds.length > 0) {
        pushDraft(drafts, {
          kind: source.contentKind,
          sourceIds,
          sourceKinds: [source.kind],
          confidence: 'medium',
          priority: 66,
          isRisk: true,
          lineHint:
            asString(source.value.summary) ??
            asString(source.value.title) ??
            asString(source.value.line),
          seed: sourceIds.length,
        });
      }
    }
  }
  return drafts;
}

function adaptAuthorityExpansion(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.authorityExpansionSummary;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  for (const benefit of asArray(raw.unlockedBenefits)) {
    if (!isRecord(benefit) || benefit.isUnlocked !== true) continue;
    const sourceIds = sourceIdsFromUnknown(benefit);
    if (sourceIds.length === 0) continue;
    const benefitKind = asString(benefit.kind);
    if (!benefitKind) continue;
    pushDraft(drafts, {
      kind: 'authority_explanation_focus',
      sourceIds,
      sourceKinds: ['authority_gameplay_expansion'],
      confidence: 'medium',
      priority: 62,
      visibilityLevel: 'summary',
      lineHint: asString(benefit.summary) ?? asString(benefit.title),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function adaptEceStrategyLines(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  const raw = input.eceStrategyLineResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8StrategicContentCandidateDraft[] = [];
  for (const key of ['primaryLine', 'secondaryLine'] as const) {
    const line = raw[key];
    if (!isRecord(line) || line.isFallback === true) continue;
    const sourceIds = sourceIdsFromUnknown(line);
    if (sourceIds.length === 0) continue;
    pushDraft(drafts, {
      kind: 'strategic_operation_focus',
      sourceIds,
      sourceKinds: ['ece_strategy_line'],
      confidence: (asString(line.confidence) as Day8StrategicContentConfidence) ?? 'low',
      priority: 58,
      lineHint: asString(line.text),
      seed: sourceIds.length,
    });
  }
  return drafts;
}

function collectDrafts(input: Day8StrategicContentInput): Day8StrategicContentCandidateDraft[] {
  return [
    ...adaptDistrictNeglectRecovery(input),
    ...adaptPositiveComeback(input),
    ...adaptPortfolioDeferRisk(input),
    ...adaptDailyCapacityPortfolio(input),
    ...adaptFollowUpActions(input),
    ...adaptCityMemory(input),
    ...adaptOneMoreDayRetention(input),
    ...adaptMapBindings(input),
    ...adaptResourceSignals(input),
    ...adaptAuthorityExpansion(input),
    ...adaptEceStrategyLines(input),
  ].filter((draft) => !(input.suppressSourceIds ?? []).some((id) => draft.sourceIds.includes(id)));
}

function applyDiversityGuard(
  drafts: Day8StrategicContentCandidateDraft[],
  day: number,
): Day8StrategicContentCandidateDraft[] {
  const sorted = [...drafts].sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));
  const picked: Day8StrategicContentCandidateDraft[] = [];
  const kindCount = new Map<string, number>();
  const districtCount = new Map<string, number>();
  let riskCount = 0;
  let positiveCount = 0;
  const hasRiskSource = drafts.some((draft) => draft.isRisk);
  const hasPositiveSource = drafts.some((draft) => draft.isPositive);

  for (const draft of sorted) {
    if (picked.length >= DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES) break;
    const kindUses = kindCount.get(draft.kind) ?? 0;
    const hasAlternativeKind = sorted.some(
      (alt) => alt.kind !== draft.kind && !kindCount.has(alt.kind),
    );
    if (kindUses >= 1 && hasAlternativeKind) continue;
    const districtKey = draft.districtId ?? draft.districtName ?? 'city';
    const districtUses = districtCount.get(districtKey) ?? 0;
    if (districtUses >= 2) continue;
    if (draft.isRisk && hasPositiveSource && riskCount >= 1 && positiveCount === 0) {
      continue;
    }
    if (draft.isPositive && hasRiskSource && positiveCount >= 1 && riskCount === 0) {
      continue;
    }
    picked.push(draft);
    kindCount.set(draft.kind, kindUses + 1);
    districtCount.set(districtKey, districtUses + 1);
    if (draft.isRisk) riskCount += 1;
    if (draft.isPositive) positiveCount += 1;
  }

  if (day >= 10 && picked.length >= 2) {
    const sourceKinds = new Set(picked.flatMap((draft) => draft.sourceKinds));
    if (sourceKinds.size < 2) {
      const extra = sorted.find(
        (draft) =>
          !picked.some((entry) => entry.sourceIds[0] === draft.sourceIds[0]) &&
          draft.sourceKinds.some((kind) => !sourceKinds.has(kind)),
      );
      if (extra && picked.length < DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES) {
        picked.push(extra);
      }
    }
  }

  return picked;
}

function buildCandidateFromDraft(
  draft: Day8StrategicContentCandidateDraft,
  input: Day8StrategicContentInput,
  existingLines: readonly string[],
  isFallback = false,
): Day8StrategicContentCandidate | null {
  const kind = draft.kind;
  const line = clampLine(draft.lineHint ?? pickCopy(kind, draft.seed ?? 0), DAY8_STRATEGIC_CONTENT_LINE_MAX);
  if (containsFakeClaim(line) || duplicateLine(line, existingLines)) return null;
  const title = clampLine(
    draft.titleHint ?? DAY8_STRATEGIC_CONTENT_KIND_TITLES[kind],
    DAY8_STRATEGIC_CONTENT_TITLE_MAX,
  );
  const priority = clamp(
    draft.priority || DAY8_STRATEGIC_CONTENT_KIND_PRIORITY[kind],
    0,
    100,
  );
  return {
    id: nextCandidateId(kind),
    kind,
    title,
    line,
    shortLine: clampLine(line, DAY8_STRATEGIC_CONTENT_SHORT_MAX),
    districtId: draft.districtId,
    districtName: draft.districtName,
    tone: resolveTone(kind, draft),
    priority,
    confidence: isFallback ? 'low' : draft.confidence,
    sourceIds: uniqueStrings(draft.sourceIds),
    sourceKinds: uniqueStrings(draft.sourceKinds) as Day8StrategicContentSourceKind[],
    dayPolicy: resolveDay8StrategicContentDayPolicy(input.day),
    visibilityLevel: isFallback
      ? 'hidden'
      : resolveVisibilityForKind(input, kind, draft.visibilityLevel ?? 'summary'),
    isActionable: false,
    isFallback,
  };
}

function buildFallbackCandidate(
  input: Day8StrategicContentInput,
  existingLines: readonly string[],
): Day8StrategicContentCandidate {
  const line = clampLine(pickCopy('fallback', input.day), DAY8_STRATEGIC_CONTENT_LINE_MAX);
  const safeLine = duplicateLine(line, existingLines)
    ? clampLine(pickCopy('safe_watch_focus', input.day), DAY8_STRATEGIC_CONTENT_LINE_MAX)
    : line;
  return {
    id: nextCandidateId('fallback'),
    kind: 'fallback',
    title: DAY8_STRATEGIC_CONTENT_KIND_TITLES.fallback,
    line: safeLine,
    shortLine: clampLine(safeLine, DAY8_STRATEGIC_CONTENT_SHORT_MAX),
    tone: 'neutral',
    priority: 20,
    confidence: 'low',
    sourceIds: ['fallback'],
    sourceKinds: ['fallback'],
    dayPolicy: resolveDay8StrategicContentDayPolicy(input.day),
    visibilityLevel: input.day < 8 ? 'hidden' : 'summary',
    isActionable: false,
    isFallback: true,
  };
}

function pickSurfaceCandidate(
  candidates: Day8StrategicContentCandidate[],
  prefer: (candidate: Day8StrategicContentCandidate) => boolean,
): Day8StrategicContentCandidate | undefined {
  return candidates.find((candidate) => !candidate.isFallback && prefer(candidate)) ?? candidates.find((c) => !c.isFallback);
}

export function buildDay8StrategicContent(input: Day8StrategicContentInput): Day8StrategicContentResult {
  candidateCounter = 0;
  const day = Math.max(1, input.day ?? 1);
  const existingLines = input.suppressLines ?? [];

  if (day < 8) {
    const fallback = buildFallbackCandidate(input, existingLines);
    return {
      day,
      candidates: [fallback],
      sourceIds: fallback.sourceIds,
    };
  }

  const drafts = collectDrafts(input);
  const diversified = applyDiversityGuard(drafts, day);
  const candidates: Day8StrategicContentCandidate[] = [];
  const usedLines = [...existingLines];

  for (const draft of diversified) {
    const candidate = buildCandidateFromDraft(draft, input, usedLines);
    if (!candidate) continue;
    candidates.push(candidate);
    usedLines.push(candidate.line);
  }

  if (candidates.length === 0) {
    const fallback = buildFallbackCandidate(input, usedLines);
    candidates.push(fallback);
  }

  const visibleCandidates = candidates.filter((candidate) => !candidate.isFallback);
  const primaryCandidate = visibleCandidates[0] ?? candidates[0];
  const secondaryCandidate = visibleCandidates[1];
  const reportCandidate = pickSurfaceCandidate(
    visibleCandidates,
    (candidate) =>
      candidate.kind === 'district_neglect_focus' ||
      candidate.kind === 'defer_risk_focus' ||
      candidate.kind === 'memory_trace_focus',
  ) ?? primaryCandidate;
  const hubCandidate = pickSurfaceCandidate(
    visibleCandidates,
    (candidate) =>
      candidate.kind === 'strategic_operation_focus' ||
      candidate.kind === 'district_recovery_focus' ||
      candidate.kind === 'follow_up_focus',
  ) ?? primaryCandidate;
  const mapCandidate = pickSurfaceCandidate(
    visibleCandidates,
    (candidate) => candidate.kind === 'map_priority_focus' || Boolean(candidate.districtId),
  ) ?? primaryCandidate;
  const eceCandidate = pickSurfaceCandidate(
    visibleCandidates,
    (candidate) =>
      candidate.kind === 'strategic_operation_focus' ||
      candidate.kind === 'authority_explanation_focus',
  ) ?? primaryCandidate;
  const portfolioCandidate = pickSurfaceCandidate(
    visibleCandidates,
    (candidate) =>
      candidate.kind === 'resource_pressure_focus' ||
      candidate.kind === 'defer_risk_focus' ||
      candidate.sourceKinds.includes('daily_capacity_portfolio'),
  ) ?? primaryCandidate;

  return {
    day,
    candidates,
    primaryCandidate,
    secondaryCandidate,
    reportCandidate,
    hubCandidate,
    mapCandidate,
    eceCandidate,
    portfolioCandidate,
    sourceIds: uniqueStrings(candidates.flatMap((candidate) => candidate.sourceIds)),
  };
}

export function collectDay8StrategicContentLines(result: Day8StrategicContentResult): string[] {
  return result.candidates.map((candidate) => candidate.line);
}

export function hasDay8StrategicContentRealSource(input: Day8StrategicContentInput): boolean {
  return collectDrafts(input).length > 0;
}
