import type { OperationPortfolioItem } from '@/core/dailyCapacityPortfolio';

import {
  ONE_MORE_DAY_COPY,
  ONE_MORE_DAY_LINE_MAX,
  ONE_MORE_DAY_MAX_HOOKS,
  ONE_MORE_DAY_TITLE_MAX,
} from './oneMoreDayRetentionConstants';
import type {
  OneMoreDayRetentionHook,
  OneMoreDayRetentionHookKind,
  OneMoreDayRetentionInput,
  OneMoreDayRetentionResult,
  OneMoreDayRetentionSourceKind,
  OneMoreDayRetentionTone,
} from './oneMoreDayRetentionTypes';

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
    ...asArray(value.sourceSignals).map((source) =>
      typeof source === 'string' ? `tomorrow_${source}` : undefined,
    ),
  ]);
}

function hasRealSource(ids: readonly string[], kinds: readonly OneMoreDayRetentionSourceKind[]): boolean {
  return ids.length > 0 && !kinds.includes('fallback');
}

function pickCopy(kind: OneMoreDayRetentionHookKind, seed = 0): string {
  const lines = ONE_MORE_DAY_COPY[kind];
  return lines[Math.abs(seed) % lines.length] ?? lines[0];
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicateLine(line: string, existing: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existing.some((entry) => normalizeLine(entry) === normalized);
}

function safeRoute(route: string | undefined): string | undefined {
  const trimmed = route?.trim();
  if (!trimmed || !trimmed.startsWith('/')) return undefined;
  return trimmed;
}

function buildHook(params: {
  id: string;
  kind: OneMoreDayRetentionHookKind;
  title: string;
  line: string;
  tomorrowLine?: string;
  ctaLabel: string;
  ctaRoute?: string;
  districtId?: string;
  districtName?: string;
  tone: OneMoreDayRetentionTone;
  priority: number;
  confidence: 'low' | 'medium' | 'high';
  sourceIds: string[];
  sourceKinds: OneMoreDayRetentionSourceKind[];
  isFallback?: boolean;
}): OneMoreDayRetentionHook {
  const ctaRoute = safeRoute(params.ctaRoute);
  const sourceIds = uniqueStrings(params.sourceIds);
  const sourceKinds = [...new Set(params.sourceKinds)];
  const isFallback = params.isFallback === true || sourceKinds.includes('fallback');
  return {
    id: params.id,
    kind: params.kind,
    title: clampLine(params.title, ONE_MORE_DAY_TITLE_MAX),
    line: clampLine(params.line, ONE_MORE_DAY_LINE_MAX),
    tomorrowLine: params.tomorrowLine
      ? clampLine(params.tomorrowLine, ONE_MORE_DAY_LINE_MAX)
      : undefined,
    ctaLabel: params.ctaLabel,
    ctaRoute,
    districtId: params.districtId,
    districtName: params.districtName,
    tone: params.tone,
    priority: clamp(params.priority, 0, 100),
    confidence: isFallback ? 'low' : params.confidence,
    sourceIds,
    sourceKinds,
    isActionable: Boolean(ctaRoute) && !isFallback,
    isFallback,
  };
}

function hookFromPortfolioDefer(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const primary = input.portfolioDeferRiskResult?.primaryBinding;
  const tomorrowLine = input.portfolioDeferRiskResult?.tomorrowActionLine;
  if (!primary || !tomorrowLine || primary.sourceIds.length === 0 || primary.isFallback) return null;

  const kind: OneMoreDayRetentionHookKind =
    primary.kind === 'recovery_window' || primary.kind === 'opportunity_window'
      ? 'recovery_opportunity'
      : primary.deferRisk === 'route_may_strain'
        ? 'route_pressure'
        : primary.deferRisk === 'social_reaction_may_grow' || primary.deferRisk === 'trust_may_drop'
          ? 'social_watch'
          : 'deferred_signal';

  return buildHook({
    id: `one_more_day_${primary.id}`,
    kind,
    title: primary.title,
    line: pickCopy(kind, primary.priority),
    tomorrowLine,
    ctaLabel: 'Yarin Devam Et',
    ctaRoute: input.currentRouteHints?.hubRoute,
    districtId: primary.districtId,
    districtName: primary.districtName,
    tone: kind === 'recovery_opportunity' ? 'positive' : 'strategic',
    priority: 100,
    confidence: primary.confidence === 'low' ? 'medium' : primary.confidence,
    sourceIds: primary.sourceIds,
    sourceKinds: ['portfolio_defer_risk'],
  });
}

function hookFromTomorrowRisk(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const risk = asArray(input.tomorrowRiskSignals).find((entry) => {
    if (!isRecord(entry)) return false;
    const sources = asArray(entry.sourceSignals).map(asString).filter(Boolean);
    return sources.length > 0 && !sources.every((source) => source === 'fallback');
  });
  if (!isRecord(risk)) return null;
  const ids = sourceIdsFromUnknown(risk);
  if (ids.length === 0) return null;

  const domain = asString(risk.relatedDomain);
  const kind: OneMoreDayRetentionHookKind =
    domain === 'route'
      ? 'route_pressure'
      : domain === 'social' || domain === 'district'
        ? 'social_watch'
        : domain === 'resource' || domain === 'container'
          ? 'resource_pressure'
          : 'tomorrow_priority';

  return buildHook({
    id: `one_more_day_tomorrow_${asString(risk.id) ?? ids[0]}`,
    kind,
    title: asString(risk.title) ?? 'Yarin onceligi',
    line: pickCopy(kind, ids.length),
    tomorrowLine: asString(risk.mainLine),
    ctaLabel: domain === 'route' ? 'Haritada Kontrol Et' : 'Onceligi Gor',
    ctaRoute: domain === 'route' ? input.currentRouteHints?.mapRoute : input.currentRouteHints?.hubRoute,
    districtId: asString(risk.relatedDistrictId),
    tone: asString(risk.priority) === 'high' ? 'warning' : 'strategic',
    priority: asString(risk.priority) === 'high' ? 88 : 76,
    confidence: 'high',
    sourceIds: ids,
    sourceKinds: ['tomorrow_risk'],
  });
}

function hookFromDecisionLike(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const sources: Array<{
    raw: unknown;
    sourceKind: OneMoreDayRetentionSourceKind;
    basePriority: number;
  }> = [
    ...asArray(input.decisionConsequenceThreads).map((raw) => ({
      raw,
      sourceKind: 'decision_consequence' as const,
      basePriority: 72,
    })),
    ...asArray(input.carryOverSignals).map((raw) => ({
      raw,
      sourceKind: 'carry_over' as const,
      basePriority: 68,
    })),
    ...asArray(input.butterflySignals).map((raw) => ({
      raw,
      sourceKind: 'butterfly_effect' as const,
      basePriority: 64,
    })),
  ];

  for (const source of sources) {
    const ids = sourceIdsFromUnknown(source.raw);
    if (ids.length === 0 || !isRecord(source.raw)) continue;
    const line =
      asString(source.raw.nextActionHint) ??
      asString(source.raw.causalLine) ??
      asString(source.raw.summary) ??
      asString(source.raw.line);
    if (!line) continue;
    return buildHook({
      id: `one_more_day_${source.sourceKind}_${ids[0]}`,
      kind: source.sourceKind === 'butterfly_effect' ? 'achievement_momentum' : 'memory_trace',
      title: asString(source.raw.title) ?? 'Karar izi',
      line: source.sourceKind === 'butterfly_effect' ? pickCopy('achievement_momentum') : pickCopy('memory_trace'),
      tomorrowLine: line,
      ctaLabel: 'Yeni Gune Gec',
      ctaRoute: input.currentRouteHints?.hubRoute,
      tone: source.sourceKind === 'butterfly_effect' ? 'positive' : 'strategic',
      priority: source.basePriority,
      confidence: 'medium',
      sourceIds: ids,
      sourceKinds: [source.sourceKind],
    });
  }
  return null;
}

function hookFromMemoryTrace(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const sources: Array<{ raw: unknown; sourceKind: OneMoreDayRetentionSourceKind; priority: number }> = [
    ...asArray(input.districtMemorySignals).map((raw) => ({
      raw,
      sourceKind: 'district_memory' as const,
      priority: 62,
    })),
    ...asArray(input.cityArchiveSignals).map((raw) => ({
      raw,
      sourceKind: 'city_archive' as const,
      priority: 60,
    })),
    ...asArray(input.storyChainSignals).map((raw) => ({
      raw,
      sourceKind: 'story_chain' as const,
      priority: 60,
    })),
  ];
  for (const source of sources) {
    const ids = sourceIdsFromUnknown(source.raw);
    if (ids.length === 0 || !isRecord(source.raw)) continue;
    return buildHook({
      id: `one_more_day_${source.sourceKind}_${ids[0]}`,
      kind: 'memory_trace',
      title: asString(source.raw.title) ?? asString(source.raw.name) ?? 'Sehir hafizasi',
      line: pickCopy('memory_trace', ids.length),
      tomorrowLine: asString(source.raw.summary) ?? asString(source.raw.line),
      ctaLabel: 'Yeni Gune Gec',
      ctaRoute: input.currentRouteHints?.hubRoute,
      tone: 'strategic',
      priority: source.priority,
      confidence: 'medium',
      sourceIds: ids,
      sourceKinds: [source.sourceKind],
    });
  }
  return null;
}

function hookFromDailyCapacity(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const result = input.dailyCapacityPortfolioResult;
  if (!result) return null;
  const item = result.items.find(
    (candidate: OperationPortfolioItem) =>
      candidate.visibilityLevel !== 'hidden' &&
      (candidate.kind === 'recovery_opportunity' ||
        candidate.kind === 'positive_opportunity' ||
        candidate.sourceKinds.includes('reward_comeback')),
  );
  if (!item || item.sourceIds.length === 0 || item.sourceKinds.includes('fallback')) return null;
  return buildHook({
    id: `one_more_day_capacity_${item.id}`,
    kind: 'recovery_opportunity',
    title: item.title,
    line: pickCopy('recovery_opportunity', item.priority),
    tomorrowLine: item.selectBenefitLine ?? item.recommendedReason,
    ctaLabel: 'Onceligi Gor',
    ctaRoute: input.currentRouteHints?.hubRoute,
    districtId: item.districtId,
    districtName: item.districtName,
    tone: 'positive',
    priority: 58,
    confidence: item.confidence,
    sourceIds: item.sourceIds,
    sourceKinds: ['daily_capacity_portfolio'],
  });
}

function hookFromMap(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook | null {
  const binding = asArray(input.mapGameplayBindings).find((entry) => {
    if (!isRecord(entry)) return false;
    return asString(entry.visibilityLevel) !== 'hidden' && sourceIdsFromUnknown(entry).length > 0;
  });
  if (!isRecord(binding)) return null;
  const ids = sourceIdsFromUnknown(binding);
  const role = asString(binding.role);
  const kind: OneMoreDayRetentionHookKind =
    role === 'route_support' ? 'route_pressure' : role === 'resource_board' ? 'resource_pressure' : 'district_follow_up';
  return buildHook({
    id: `one_more_day_map_${ids[0]}`,
    kind,
    title: asString(binding.playerFacingTitle) ?? asString(binding.title) ?? 'Harita odagi',
    line: role === 'route_support' ? pickCopy('route_pressure') : pickCopy('district_follow_up'),
    tomorrowLine: asString(binding.playerFacingLine) ?? asString(binding.mapLine),
    ctaLabel: 'Haritada Kontrol Et',
    ctaRoute: input.currentRouteHints?.mapRoute,
    tone: 'strategic',
    priority: 52,
    confidence: asString(binding.confidence) === 'high' ? 'high' : 'medium',
    sourceIds: ids,
    sourceKinds: ['map_gameplay_binding'],
  });
}

function fallbackHook(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook {
  const day = Math.max(1, input.day ?? 1);
  return buildHook({
    id: `one_more_day_fallback_day_${day}`,
    kind: day <= 1 ? 'fallback' : 'safe_continue',
    title: day <= 1 ? 'Ilk gun tamamlandi' : 'Yarin devam',
    line: day <= 1 ? 'Yarin sehir sinyallerini biraz daha net okuyacaksin.' : pickCopy('safe_continue', day),
    ctaLabel: day <= 1 ? 'Devam Et' : 'Yeni Gune Gec',
    ctaRoute: input.currentRouteHints?.hubRoute,
    tone: 'calm',
    priority: 10,
    confidence: 'low',
    sourceIds: [`fallback_day_${day}`],
    sourceKinds: ['fallback'],
    isFallback: true,
  });
}

function buildCandidateHooks(input: OneMoreDayRetentionInput): OneMoreDayRetentionHook[] {
  return [
    hookFromPortfolioDefer(input),
    hookFromTomorrowRisk(input),
    hookFromDecisionLike(input),
    hookFromMemoryTrace(input),
    hookFromDailyCapacity(input),
    hookFromMap(input),
  ].filter((hook): hook is OneMoreDayRetentionHook => Boolean(hook));
}

function pickHooks(hooks: OneMoreDayRetentionHook[]): OneMoreDayRetentionHook[] {
  const picked: OneMoreDayRetentionHook[] = [];
  const usedLines: string[] = [];
  const usedSources = new Set<string>();
  for (const hook of [...hooks].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
    if (picked.length >= ONE_MORE_DAY_MAX_HOOKS) break;
    if (duplicateLine(hook.line, usedLines) || (hook.tomorrowLine && duplicateLine(hook.tomorrowLine, usedLines))) continue;
    if (hook.sourceIds.some((id) => usedSources.has(id))) continue;
    picked.push(hook);
    usedLines.push(hook.line, hook.tomorrowLine ?? '');
    for (const id of hook.sourceIds) usedSources.add(id);
  }
  return picked;
}

export function buildOneMoreDayRetention(
  input: OneMoreDayRetentionInput,
): OneMoreDayRetentionResult {
  const day = Math.max(1, input.day ?? 1);
  const candidates = day <= 1 ? [fallbackHook(input)] : buildCandidateHooks(input);
  const hooks = pickHooks(candidates.length > 0 ? candidates : [fallbackHook(input)]);
  const primaryHook = hooks[0] ?? fallbackHook(input);
  const secondaryHook = hooks[1];
  const sourceIds = uniqueStrings(hooks.flatMap((hook) => hook.sourceIds));
  const sourceKinds = [...new Set(hooks.flatMap((hook) => hook.sourceKinds))];
  const route = safeRoute(primaryHook.ctaRoute) ?? safeRoute(input.currentRouteHints?.hubRoute);

  const summaryLine =
    day <= 1
      ? 'Yarin sehir sinyallerini biraz daha net okuyacaksin.'
      : day >= 8 && hasRealSource(primaryHook.sourceIds, primaryHook.sourceKinds)
        ? 'Bugunku secim yarinin ilk odagini netlestiriyor.'
        : primaryHook.line;

  return {
    day,
    isVisible: true,
    title:
      day <= 1
        ? 'Ilk gun tamamlandi'
        : day >= 8
          ? 'Yarin icin odak'
          : 'Bir sonraki gun',
    summaryLine: clampLine(summaryLine, ONE_MORE_DAY_LINE_MAX),
    primaryHook,
    secondaryHook,
    ctaLabel: primaryHook.ctaLabel,
    ctaRoute: route,
    footerLine: secondaryHook?.line,
    sourceIds,
    sourceKinds,
  };
}
