import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import {
  AUTHORITY_PERMISSION_BY_BIAS,
  CITY_RHYTHM_TO_BIAS,
  DAILY_CAPACITY_TO_BIAS,
  DAY8_OPERATION_FEED_BIAS_BADGES,
  DAY8_OPERATION_FEED_BIAS_COPY,
  DAY8_OPERATION_FEED_BIAS_DOMAIN_TAGS,
  DAY8_OPERATION_FEED_BINDING_MAX_BIASES,
  DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS,
  DAY8_OPERATION_FEED_BINDING_MIN_DAY,
  DAY8_OPERATION_FEED_BINDING_PRIORITY_MAX,
  DAY8_OPERATION_FEED_BINDING_REASON_MAX,
  DAY8_OPERATION_FEED_BINDING_SAFE_WATCH_BOOST_MAX,
  DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX,
  DAY8_OPERATION_FEED_BINDING_TOTAL_BOOST_MAX,
  DAY8_OPERATION_FEED_FAKE_CLAIM_PATTERNS,
  DAY8_OPERATION_FEED_FORCED_SELECTION_PATTERNS,
  DAY8_OPERATION_FEED_PRESENTATION_ONLY_COPY,
  DAY8_STRATEGIC_CONTENT_TO_BIAS,
  DISTRICT_NEGLECT_TO_BIAS,
  FOLLOW_UP_TO_BIAS,
  PORTFOLIO_DEFER_TO_BIAS,
  POSITIVE_COMEBACK_TO_BIAS,
} from './day8OperationFeedBindingConstants';
import type {
  Day8OperationFeedBias,
  Day8OperationFeedBiasDraft,
  Day8OperationFeedBindingInput,
  Day8OperationFeedBindingResult,
  Day8OperationFeedBindingSourceKind,
  Day8OperationFeedConfidence,
  Day8OperationFeedItemBinding,
  Day8OperationFeedTone,
  Day8OperationFeedVisibilityLevel,
  NormalizedEventCandidate,
  NormalizedOperationFeedItem,
} from './day8OperationFeedBindingTypes';

let biasCounter = 0;

function nextBiasId(prefix: string): string {
  biasCounter += 1;
  return `d8ofb_${prefix}_${biasCounter}`;
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

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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
  return DAY8_OPERATION_FEED_FAKE_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

function pickPresentationOnlyCopy(kind: Day8OperationFeedBias['kind'], seed = 0): string {
  const lines = DAY8_OPERATION_FEED_PRESENTATION_ONLY_COPY[kind];
  return clampLine(lines[Math.abs(seed) % lines.length] ?? lines[0], DAY8_OPERATION_FEED_BINDING_REASON_MAX);
}

export function containsForcedSelectionLanguage(text: string): boolean {
  return DAY8_OPERATION_FEED_FORCED_SELECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function buildExistingEventCandidatesFromActiveEvents(
  events: unknown[] | undefined,
  day: number,
): NormalizedEventCandidate[] {
  if (!events?.length || day < DAY8_OPERATION_FEED_BINDING_MIN_DAY) return [];
  const normalized: NormalizedEventCandidate[] = [];
  for (const [index, raw] of events.entries()) {
    if (!isRecord(raw)) continue;
    const status = asString(raw.status);
    if (status === 'resolved' || status === 'completed' || status === 'expired') continue;
    const districtId =
      asString(raw.neighborhoodId) ??
      asString(raw.districtId) ??
      asArray(raw.districtIds).map(asString).find(Boolean);
    const category = asString(raw.contentCategory) ?? asString(raw.domain) ?? 'general';
    normalized.push({
      id: asString(raw.id) ?? `live_event_${index}`,
      eventId: asString(raw.id),
      title: asString(raw.title) ?? 'Operasyon',
      districtIds: uniqueStrings([districtId]),
      domains: [category],
      tags: uniqueStrings([category, ...(asArray(raw.tags).map(asString))]),
      score: asNumber(raw.score, 50),
      isBlocked: false,
    });
  }
  return normalized;
}

function resolveScoreBoost(confidence: Day8OperationFeedConfidence, kind: Day8OperationFeedBias['kind']): number {
  if (kind === 'safe_watch_bias') {
    return DAY8_OPERATION_FEED_BINDING_SAFE_WATCH_BOOST_MAX;
  }
  if (confidence === 'high') return 18;
  if (confidence === 'medium') return 11;
  return 5;
}

function resolveTone(
  kind: Day8OperationFeedBias['kind'],
  draft?: Day8OperationFeedBiasDraft,
): Day8OperationFeedTone {
  if (draft?.tone) return draft.tone;
  if (kind === 'positive_comeback_bias' || kind === 'district_recovery_bias') return 'positive';
  if (
    kind === 'district_neglect_bias' ||
    kind === 'defer_risk_bias' ||
    kind === 'resource_pressure_bias' ||
    kind === 'route_pressure_bias' ||
    kind === 'container_pressure_bias'
  ) {
    return 'cautious';
  }
  if (kind === 'safe_watch_bias' || kind === 'fallback') return 'neutral';
  return 'strategic';
}

function pickCopy(kind: Day8OperationFeedBias['kind'], seed = 0, hint?: string, previousLines?: readonly string[]): string {
  if (hint?.trim() && !containsFakeClaim(hint)) return clampLine(hint, DAY8_OPERATION_FEED_BINDING_REASON_MAX);
  const lines = DAY8_OPERATION_FEED_BIAS_COPY[kind];
  return clampLine(
    pickSurfaceCopy(kind, 'operation_feed', lines, { seed, previousLines }),
    DAY8_OPERATION_FEED_BINDING_REASON_MAX,
  );
}

function hasPermission(input: Day8OperationFeedBindingInput, permissionId: string): boolean {
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

function resolveVisibility(
  input: Day8OperationFeedBindingInput,
  kind: Day8OperationFeedBias['kind'],
  base: Day8OperationFeedVisibilityLevel = 'summary',
): Day8OperationFeedVisibilityLevel {
  if ((input.day ?? 1) < DAY8_OPERATION_FEED_BINDING_MIN_DAY) return 'hidden';
  const permissionId = AUTHORITY_PERMISSION_BY_BIAS[kind];
  if (!permissionId) return base;
  return hasPermission(input, permissionId) ? 'detailed' : base === 'detailed' ? 'summary' : base;
}

function pushDraft(drafts: Day8OperationFeedBiasDraft[], draft: Day8OperationFeedBiasDraft): void {
  if (draft.sourceIds.length === 0 || draft.isFallback) return;
  drafts.push(draft);
}

function mapKinds(
  mapping: Record<string, Day8OperationFeedBias['kind'] | Day8OperationFeedBias['kind'][]>,
  key: string | undefined,
): Day8OperationFeedBias['kind'][] {
  if (!key) return [];
  const mapped = mapping[key];
  if (!mapped) return [];
  return Array.isArray(mapped) ? mapped : [mapped];
}

function adaptDay8StrategicContent(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.day8StrategicContentResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  for (const candidate of [raw.primaryCandidate, raw.secondaryCandidate]) {
    if (!isRecord(candidate) || candidate.isFallback === true) continue;
    const kindKey = asString(candidate.kind);
    for (const biasKind of mapKinds(DAY8_STRATEGIC_CONTENT_TO_BIAS, kindKey)) {
      pushDraft(drafts, {
        kind: biasKind,
        districtId: asString(candidate.districtId),
        districtName: asString(candidate.districtName),
        sourceIds: sourceIdsFromUnknown(candidate),
        sourceKinds: ['day8_strategic_content'],
        priority: asNumber(candidate.priority, 70),
        confidence: (asString(candidate.confidence) as Day8OperationFeedConfidence) ?? 'medium',
        visibilityLevel: asString(candidate.visibilityLevel) as Day8OperationFeedVisibilityLevel,
        reasonHint: asString(candidate.line) ?? asString(candidate.shortLine),
        titleHint: asString(candidate.title),
      });
    }
  }
  return drafts;
}

function adaptCityRhythmDirector(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.cityRhythmDirectorResult;
  if (!isRecord(raw) || raw.isVisible === false) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const rhythmKind = asString(raw.rhythmKind);
  for (const biasKind of mapKinds(CITY_RHYTHM_TO_BIAS, rhythmKind)) {
    const slot = isRecord(raw.primarySlot) ? raw.primarySlot : undefined;
    pushDraft(drafts, {
      kind: biasKind,
      sourceIds: uniqueStrings([
        ...sourceIdsFromUnknown(raw),
        ...sourceIdsFromUnknown(slot),
      ]),
      sourceKinds: ['city_rhythm_director'],
      priority: asNumber(slot?.priority, 72),
      confidence: 'medium',
      reasonHint: asString(slot?.line) ?? asString(raw.summaryLine),
      titleHint: asString(slot?.title) ?? asString(raw.title),
    });
  }
  return drafts;
}

function adaptDistrictNeglectRecovery(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.districtNeglectRecoveryResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const primary = raw.primarySignal ?? asArray(raw.signals)[0];
  if (!isRecord(primary) || primary.isFallback === true) return drafts;
  const kindKey = asString(primary.kind);
  for (const biasKind of mapKinds(DISTRICT_NEGLECT_TO_BIAS, kindKey)) {
    pushDraft(drafts, {
      kind: biasKind,
      districtId: asString(primary.districtId),
      districtName: asString(primary.districtName),
      sourceIds: sourceIdsFromUnknown(primary),
      sourceKinds: ['district_neglect_recovery'],
      priority: asNumber(primary.priority, 75),
      confidence: (asString(primary.confidence) as Day8OperationFeedConfidence) ?? 'medium',
      reasonHint: asString(primary.line) ?? asString(primary.shortLine),
      titleHint: asString(primary.title),
    });
  }
  return drafts;
}

function adaptPositiveComeback(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.positiveComebackResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const primary = raw.primaryCandidate ?? asArray(raw.candidates)[0];
  if (!isRecord(primary) || primary.isFallback === true) return drafts;
  for (const biasKind of mapKinds(POSITIVE_COMEBACK_TO_BIAS, asString(primary.kind))) {
    pushDraft(drafts, {
      kind: biasKind,
      districtId: asString(primary.districtId),
      districtName: asString(primary.districtName),
      sourceIds: sourceIdsFromUnknown(primary),
      sourceKinds: ['positive_comeback'],
      priority: asNumber(primary.priority, 68),
      confidence: (asString(primary.confidence) as Day8OperationFeedConfidence) ?? 'medium',
      reasonHint: asString(primary.line) ?? asString(primary.benefitLine),
      titleHint: asString(primary.title),
    });
  }
  return drafts;
}

function adaptPortfolioDeferRisk(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.portfolioDeferRiskResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const primary = raw.primaryBinding ?? asArray(raw.bindings)[0];
  if (!isRecord(primary) || primary.isFallback === true) return drafts;
  const portfolioItemId = asString(primary.portfolioItemId);
  const portfolio = input.dailyCapacityPortfolioResult;
  let deferRiskKey: string | undefined;
  if (portfolioItemId && isRecord(portfolio)) {
    const item = asArray(portfolio.items).find(
      (entry) => isRecord(entry) && asString(entry.id) === portfolioItemId,
    );
    deferRiskKey = asString(isRecord(item) ? item.deferRisk : undefined);
  }
  for (const biasKind of mapKinds(PORTFOLIO_DEFER_TO_BIAS, deferRiskKey)) {
    pushDraft(drafts, {
      kind: biasKind,
      districtId: asString(primary.districtId),
      districtName: asString(primary.districtName),
      sourceIds: sourceIdsFromUnknown(primary),
      sourceKinds: ['portfolio_defer_risk'],
      priority: asNumber(primary.priority, 74),
      confidence: (asString(primary.confidence) as Day8OperationFeedConfidence) ?? 'medium',
      reasonHint: asString(primary.line) ?? asString(primary.reportLine),
      titleHint: asString(primary.title),
    });
  }
  return drafts;
}

function adaptDailyCapacityPortfolio(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.dailyCapacityPortfolioResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const items = asArray(raw.items);
  const selected = items.filter((item) => isRecord(item) && asString(item.status) === 'selected');
  const deferred = items.filter((item) => isRecord(item) && asString(item.status) === 'deferred');
  const prioritized = [...selected, ...deferred, ...items].slice(0, 2);
  for (const item of prioritized) {
    if (!isRecord(item)) continue;
    const kindKey = asString(item.kind);
    for (const biasKind of mapKinds(DAILY_CAPACITY_TO_BIAS, kindKey)) {
      pushDraft(drafts, {
        kind: biasKind,
        districtId: asString(item.districtId),
        districtName: asString(item.districtName),
        sourceIds: sourceIdsFromUnknown(item),
        sourceKinds: ['daily_capacity_portfolio'],
        priority: asNumber(item.priority, 66),
        confidence: 'medium',
        reasonHint: asString(item.decisionLine) ?? asString(item.summaryLine),
        titleHint: asString(item.title),
      });
    }
  }
  return drafts;
}

function adaptFollowUpActions(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.followUpActionResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const primary = raw.primaryAction ?? asArray(raw.actions)[0];
  if (!isRecord(primary) || primary.isFallback === true) return drafts;
  for (const biasKind of mapKinds(FOLLOW_UP_TO_BIAS, asString(primary.kind))) {
    pushDraft(drafts, {
      kind: biasKind,
      districtId: asString(primary.districtId),
      districtName: asString(primary.districtName),
      sourceIds: sourceIdsFromUnknown(primary),
      sourceKinds: ['follow_up_action'],
      priority: asNumber(primary.priority, 64),
      confidence: (asString(primary.confidence) as Day8OperationFeedConfidence) ?? 'medium',
      reasonHint: asString(primary.line) ?? asString(primary.benefitLine),
      titleHint: asString(primary.title),
    });
  }
  return drafts;
}

function adaptCityMemoryVisibility(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.cityMemoryVisibilityResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const primary = raw.primaryTrace ?? asArray(raw.traces)[0];
  if (!isRecord(primary) || primary.isFallback === true) return drafts;
  pushDraft(drafts, {
    kind: 'memory_trace_bias',
    districtId: asString(primary.districtId),
    districtName: asString(primary.districtName),
    sourceIds: sourceIdsFromUnknown(primary),
    sourceKinds: ['city_memory_visibility'],
    priority: asNumber(primary.priority, 62),
    confidence: (asString(primary.confidence) as Day8OperationFeedConfidence) ?? 'medium',
    reasonHint: asString(primary.line) ?? asString(primary.shortLine),
    titleHint: asString(primary.title),
  });
  return drafts;
}

function adaptOneMoreDayRetention(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const raw = input.oneMoreDayRetentionResult;
  if (!isRecord(raw)) return [];
  const drafts: Day8OperationFeedBiasDraft[] = [];
  const hook = raw.primaryHook;
  if (!isRecord(hook)) return drafts;
  pushDraft(drafts, {
    kind: 'defer_risk_bias',
    sourceIds: sourceIdsFromUnknown(hook),
    sourceKinds: ['one_more_day_retention'],
    priority: asNumber(hook.priority, 60),
    confidence: 'medium',
    reasonHint: asString(hook.line) ?? asString(hook.tomorrowLine),
    titleHint: asString(hook.title),
  });
  return drafts;
}

function adaptAuthorityExplanation(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  const summary = input.authorityExpansionSummary;
  if (!isRecord(summary)) return [];
  const sourceIds = sourceIdsFromUnknown(summary);
  if (sourceIds.length === 0) return [];
  return [
    {
      kind: 'city_rhythm_bias',
      sourceIds,
      sourceKinds: ['authority_gameplay_expansion'],
      priority: 40,
      confidence: 'low',
      visibilityLevel: hasPermission(input, 'ece_analysis_depth') ? 'detailed' : 'summary',
      reasonHint: asString(summary.summaryLine),
      titleHint: 'Yetki derinliği',
    },
  ];
}

function finalizeBias(
  input: Day8OperationFeedBindingInput,
  draft: Day8OperationFeedBiasDraft,
  seed: number,
  suppressLines: string[],
): Day8OperationFeedBias | null {
  if (draft.sourceIds.length === 0) return null;
  const visibilityLevel = draft.visibilityLevel ?? resolveVisibility(input, draft.kind);
  if (visibilityLevel === 'hidden') return null;
  const reasonLine = pickCopy(draft.kind, seed, draft.reasonHint);
  if (duplicateLine(reasonLine, suppressLines) || containsFakeClaim(reasonLine)) return null;
  const scoreBoost = clamp(
    resolveScoreBoost(draft.confidence, draft.kind),
    0,
    DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX,
  );
  const badgeLabel = clampLine(
    DAY8_OPERATION_FEED_BIAS_BADGES[draft.kind],
    24,
  );
  return {
    id: nextBiasId(draft.kind),
    kind: draft.kind,
    title: clampLine(draft.titleHint ?? badgeLabel, 48),
    reasonLine,
    badgeLabel,
    districtId: draft.districtId,
    districtName: draft.districtName,
    targetDomainTags: DAY8_OPERATION_FEED_BIAS_DOMAIN_TAGS[draft.kind],
    scoreBoost: draft.kind === 'city_rhythm_bias' && draft.sourceKinds.includes('authority_gameplay_expansion')
      ? 0
      : scoreBoost,
    priority: clamp(draft.priority, 0, DAY8_OPERATION_FEED_BINDING_PRIORITY_MAX),
    confidence: draft.confidence,
    tone: resolveTone(draft.kind, draft),
    sourceIds: uniqueStrings(draft.sourceIds),
    sourceKinds: draft.sourceKinds,
    visibilityLevel,
    isFallback: false,
  };
}

export function normalizeEventCandidates(candidates: unknown[] | undefined): NormalizedEventCandidate[] {
  if (!candidates?.length) return [];
  const normalized: NormalizedEventCandidate[] = [];
  for (const [index, raw] of candidates.entries()) {
    if (!isRecord(raw)) continue;
    normalized.push({
      id: asString(raw.id) ?? `candidate_${index}`,
      eventId: asString(raw.eventId),
      operationId: asString(raw.operationId),
      eventFamilyId: asString(raw.eventFamilyId),
      districtIds: uniqueStrings([
        ...asArray(raw.districtIds).map(asString),
        asString(raw.districtId),
      ]),
      domains: asArray(raw.domains).map(asString).filter((value): value is string => Boolean(value)),
      tags: asArray(raw.tags).map(asString).filter((value): value is string => Boolean(value)),
      title: asString(raw.title) ?? asString(raw.id) ?? `candidate_${index}`,
      score: asNumber(raw.score, 0),
      isBlocked: raw.isBlocked === true,
    });
  }
  return normalized;
}

export function normalizeOperationFeedItems(items: unknown[] | undefined): NormalizedOperationFeedItem[] {
  if (!items?.length) return [];
  const normalized: NormalizedOperationFeedItem[] = [];
  for (const [index, raw] of items.entries()) {
    if (!isRecord(raw)) continue;
    normalized.push({
      id: asString(raw.id) ?? `feed_${index}`,
      eventId: asString(raw.eventId),
      operationId: asString(raw.operationId),
      title: asString(raw.title) ?? asString(raw.id) ?? `feed_${index}`,
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      domains: asArray(raw.domains).map(asString).filter((value): value is string => Boolean(value)),
      tags: asArray(raw.tags).map(asString).filter((value): value is string => Boolean(value)),
      kind: asString(raw.kind),
    });
  }
  return normalized;
}

function candidateMatchesBias(candidate: NormalizedEventCandidate, bias: Day8OperationFeedBias): boolean {
  if (bias.districtId && candidate.districtIds.some((id) => id.toLowerCase() === bias.districtId?.toLowerCase())) {
    return true;
  }
  if (bias.targetEventFamilyIds?.includes(candidate.eventFamilyId ?? '')) return true;
  const domainTags = bias.targetDomainTags ?? [];
  if (domainTags.length === 0) return false;
  const haystack = [...candidate.domains, ...candidate.tags].map((value) => value.toLowerCase());
  return domainTags.some((tag) => haystack.some((entry) => entry.includes(tag.toLowerCase())));
}

function feedItemMatchesBias(item: NormalizedOperationFeedItem, bias: Day8OperationFeedBias): boolean {
  if (bias.districtId && item.districtId?.toLowerCase() === bias.districtId.toLowerCase()) return true;
  const domainTags = bias.targetDomainTags ?? [];
  if (domainTags.length === 0) return false;
  const haystack = [...item.domains, ...item.tags, item.kind ?? ''].map((value) => value.toLowerCase());
  return domainTags.some((tag) => haystack.some((entry) => entry.includes(tag.toLowerCase())));
}

export function computeCandidateBiasBoost(
  candidate: NormalizedEventCandidate,
  biases: readonly Day8OperationFeedBias[],
): number {
  if (biases.length === 0 || candidate.isBlocked) return 0;
  let total = 0;
  for (const bias of biases) {
    if (!candidateMatchesBias(candidate, bias)) continue;
    total += bias.scoreBoost;
  }
  return clamp(total, 0, DAY8_OPERATION_FEED_BINDING_TOTAL_BOOST_MAX);
}

export function applyDay8OperationFeedBiasToEventCandidates<T extends NormalizedEventCandidate>(
  candidates: readonly T[],
  biases: readonly Day8OperationFeedBias[],
): Array<T & { strategicBoost: number; adjustedScore: number }> {
  if (biases.length === 0) {
    return candidates.map((candidate) => ({
      ...candidate,
      strategicBoost: 0,
      adjustedScore: candidate.score,
    }));
  }
  return candidates.map((candidate) => {
    const strategicBoost = computeCandidateBiasBoost(candidate, biases);
    return {
      ...candidate,
      strategicBoost,
      adjustedScore: candidate.score + strategicBoost,
    };
  });
}

export function rankEventCandidatesWithBias<T extends NormalizedEventCandidate & { adjustedScore: number }>(
  candidates: readonly T[],
): T[] {
  return [...candidates].sort((a, b) => {
    if (b.adjustedScore !== a.adjustedScore) return b.adjustedScore - a.adjustedScore;
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });
}

export function hasDay8OperationFeedRealSource(input: Day8OperationFeedBindingInput): boolean {
  const adapters = [
    adaptDay8StrategicContent,
    adaptCityRhythmDirector,
    adaptDistrictNeglectRecovery,
    adaptPositiveComeback,
    adaptPortfolioDeferRisk,
    adaptDailyCapacityPortfolio,
    adaptFollowUpActions,
    adaptCityMemoryVisibility,
    adaptOneMoreDayRetention,
  ];
  return adapters.some((adapter) => adapter(input).length > 0);
}

function collectBiasDrafts(input: Day8OperationFeedBindingInput): Day8OperationFeedBiasDraft[] {
  return [
    ...adaptDay8StrategicContent(input),
    ...adaptCityRhythmDirector(input),
    ...adaptDistrictNeglectRecovery(input),
    ...adaptPositiveComeback(input),
    ...adaptPortfolioDeferRisk(input),
    ...adaptDailyCapacityPortfolio(input),
    ...adaptFollowUpActions(input),
    ...adaptCityMemoryVisibility(input),
    ...adaptOneMoreDayRetention(input),
    ...adaptAuthorityExplanation(input),
  ];
}

function dedupeBiases(biases: Day8OperationFeedBias[]): Day8OperationFeedBias[] {
  const seen = new Set<string>();
  const result: Day8OperationFeedBias[] = [];
  for (const bias of [...biases].sort((a, b) => b.priority - a.priority)) {
    const key = `${bias.kind}|${bias.districtId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(bias);
    if (result.length >= DAY8_OPERATION_FEED_BINDING_MAX_BIASES) break;
  }
  return result;
}

function buildFeedBindings(
  biases: Day8OperationFeedBias[],
  eventCandidates: NormalizedEventCandidate[],
  feedItems: NormalizedOperationFeedItem[],
  suppressLines: string[],
): Day8OperationFeedItemBinding[] {
  const bindings: Day8OperationFeedItemBinding[] = [];
  const usedCandidateIds = new Set<string>();
  const usedFeedIds = new Set<string>();

  const candidatePool = eventCandidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    eventId: candidate.eventId,
    operationId: candidate.operationId,
    districtId: candidate.districtIds[0],
    districtName: undefined as string | undefined,
    domains: candidate.domains,
    tags: candidate.tags,
    kind: undefined as string | undefined,
    isPresentationOnly: false,
  }));

  const feedPool = feedItems.map((item) => ({
    id: item.id,
    title: item.title,
    eventId: item.eventId,
    operationId: item.operationId,
    districtId: item.districtId,
    districtName: item.districtName,
    domains: item.domains,
    tags: item.tags,
    kind: item.kind,
    isPresentationOnly: true,
  }));

  const tryBind = (
    bias: Day8OperationFeedBias,
    entry: {
      id: string;
      title: string;
      eventId?: string;
      operationId?: string;
      districtId?: string;
      districtName?: string;
      domains: string[];
      tags: string[];
      kind?: string;
      isPresentationOnly: boolean;
    },
    presentationOnly: boolean,
  ): boolean => {
    if (bindings.length >= DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS) return false;
    const reasonLine = presentationOnly
      ? pickPresentationOnlyCopy(bias.kind, bindings.length)
      : pickCopy(bias.kind, bindings.length, bias.reasonLine);
    if (
      duplicateLine(reasonLine, suppressLines) ||
      containsFakeClaim(reasonLine) ||
      containsForcedSelectionLanguage(reasonLine)
    ) {
      return false;
    }
    bindings.push({
      id: nextBiasId('binding'),
      eventId: entry.eventId,
      operationId: entry.operationId,
      title: entry.title,
      reasonLine,
      badgeLabel: bias.badgeLabel,
      districtId: entry.districtId ?? bias.districtId,
      districtName: entry.districtName ?? bias.districtName,
      appliedBiasIds: [bias.id],
      sourceIds: bias.sourceIds,
      priority: bias.priority,
      visibilityLevel: bias.visibilityLevel,
      isRecommended: bindings.length === 0,
      isPresentationOnly: presentationOnly,
    });
    return true;
  };

  for (const bias of biases) {
    if (bindings.length >= DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS) break;

    const candidateMatch = candidatePool.find((entry) => {
      if (usedCandidateIds.has(entry.id)) return false;
      return candidateMatchesBias(
        {
          id: entry.id,
          eventId: entry.eventId,
          operationId: entry.operationId,
          title: entry.title,
          districtIds: entry.districtId ? [entry.districtId] : [],
          domains: entry.domains,
          tags: entry.tags,
          score: 0,
        },
        bias,
      );
    });
    if (candidateMatch && tryBind(bias, candidateMatch, false)) {
      usedCandidateIds.add(candidateMatch.id);
      continue;
    }

    const feedMatch = feedPool.find((entry) => {
      if (usedFeedIds.has(entry.id)) return false;
      return feedItemMatchesBias(
        {
          id: entry.id,
          eventId: entry.eventId,
          operationId: entry.operationId,
          title: entry.title,
          districtId: entry.districtId,
          districtName: entry.districtName,
          domains: entry.domains,
          tags: entry.tags,
          kind: entry.kind,
        },
        bias,
      );
    });
    if (feedMatch && tryBind(bias, feedMatch, true)) {
      usedFeedIds.add(feedMatch.id);
    }
  }

  return bindings;
}

export function buildDay8OperationFeedBinding(
  input: Day8OperationFeedBindingInput,
): Day8OperationFeedBindingResult {
  const day = Math.max(1, input.day ?? 1);
  const inactive: Day8OperationFeedBindingResult = {
    day,
    isActive: false,
    biases: [],
    feedBindings: [],
    sourceIds: [],
  };
  if (day < DAY8_OPERATION_FEED_BINDING_MIN_DAY) return inactive;

  const suppressLines = [...(input.suppressLines ?? [])];
  const suppressSourceIds = new Set(input.suppressSourceIds ?? []);
  const drafts = collectBiasDrafts(input).filter((draft) =>
    draft.sourceIds.every((id) => !suppressSourceIds.has(id)),
  );

  if (drafts.length === 0 && !hasDay8OperationFeedRealSource(input)) {
    return inactive;
  }

  const biases = dedupeBiases(
    drafts
      .map((draft, index) => finalizeBias(input, draft, index, suppressLines))
      .filter((bias): bias is Day8OperationFeedBias => bias !== null),
  );

  if (biases.length === 0) return inactive;

  const eventCandidates = normalizeEventCandidates(input.existingEventCandidates);
  const feedItems = normalizeOperationFeedItems(input.existingOperationFeedItems);
  const boosted = applyDay8OperationFeedBiasToEventCandidates(eventCandidates, biases);
  const ranked = input.existingEventCandidates?.length
    ? rankEventCandidatesWithBias(boosted)
  : [];

  const feedBindings = buildFeedBindings(biases, eventCandidates, feedItems, suppressLines);
  const maxBoost = boosted.reduce((max, candidate) => Math.max(max, candidate.strategicBoost), 0);
  const boostedCount = boosted.filter((candidate) => candidate.strategicBoost > 0).length;
  const matchedCandidateCount = boostedCount;
  const presentationOnlyBindingCount = feedBindings.filter((binding) => binding.isPresentationOnly).length;
  const hasEventCandidatePool = eventCandidates.length > 0;
  const unmatchedBindingReason =
    hasEventCandidatePool && matchedCandidateCount === 0 && presentationOnlyBindingCount > 0
      ? 'No matching event candidate; reason kept out of selection bias'
      : biases.length > 0 && feedBindings.length === 0
        ? 'No matching feed item for strategic bias'
        : undefined;

  return {
    day,
    isActive: true,
    biases,
    feedBindings,
    primaryFeedBinding: feedBindings[0],
    selectionBiasSummary: hasEventCandidatePool || feedBindings.length > 0
      ? {
          applied: matchedCandidateCount > 0,
          totalBoostedCandidates: boostedCount,
          matchedCandidateCount,
          presentationOnlyBindingCount,
          maxBoost,
          reasonLine: feedBindings[0]?.reasonLine ?? biases[0]?.reasonLine,
          unmatchedBindingReason,
        }
      : undefined,
    sourceIds: uniqueStrings(biases.flatMap((bias) => bias.sourceIds)),
  };
}

export function collectDay8OperationFeedBindingLines(result: Day8OperationFeedBindingResult): string[] {
  return [
    ...result.biases.map((bias) => bias.reasonLine),
    ...result.feedBindings.map((binding) => binding.reasonLine),
    result.selectionBiasSummary?.reasonLine,
  ].filter((line): line is string => Boolean(line?.trim()));
}

export function compareEventCandidateOrder(
  before: readonly NormalizedEventCandidate[],
  after: readonly NormalizedEventCandidate[],
): boolean {
  if (before.length !== after.length) return false;
  return before.every((candidate, index) => candidate.id === after[index]?.id);
}

export function applyStrategicBiasToRankedEventSelection<
  T extends {
    id: string;
    score: number;
    districtIds: string[];
    domains: string[];
    tags: string[];
    eventFamilyId?: string;
    isBlocked?: boolean;
  },
>(candidates: readonly T[], biases: readonly Day8OperationFeedBias[]): T[] {
  if (biases.length === 0) return [...candidates];
  const normalized = normalizeEventCandidates([...candidates]);
  const boosted = applyDay8OperationFeedBiasToEventCandidates(normalized, biases);
  const scoreById = new Map(boosted.map((candidate) => [candidate.id, candidate.adjustedScore]));
  return [...candidates].sort((a, b) => {
    const aScore = scoreById.get(a.id) ?? a.score;
    const bScore = scoreById.get(b.id) ?? b.score;
    if (bScore !== aScore) return bScore - aScore;
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });
}
