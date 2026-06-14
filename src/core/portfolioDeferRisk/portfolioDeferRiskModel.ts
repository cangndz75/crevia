import type {
  OperationPortfolioDeferRisk,
  OperationPortfolioItem,
} from '@/core/dailyCapacityPortfolio';

import type {
  PortfolioDeferBinding,
  PortfolioDeferBindingKind,
  PortfolioDeferBindingTimeScope,
  PortfolioDeferRiskInput,
  PortfolioDeferRiskResult,
} from './portfolioDeferRiskTypes';

const REPORT_LINE_MAX = 110;
const MAX_BINDINGS = 2;

const DEFER_RISK_KIND: Record<OperationPortfolioDeferRisk, PortfolioDeferBindingKind> = {
  pressure_may_grow: 'deferred_risk',
  trust_may_drop: 'deferred_risk',
  resource_cost_may_rise: 'deferred_risk',
  route_may_strain: 'deferred_risk',
  social_reaction_may_grow: 'deferred_risk',
  opportunity_may_expire: 'opportunity_window',
  memory_trace_may_harden: 'memory_trace',
  safe_to_watch: 'safe_watch',
  none: 'none',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))];
}

function clampLine(value: string, max = REPORT_LINE_MAX): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}...`;
}

function displayTitle(item: OperationPortfolioItem): string {
  const title = item.title.replace(/^yarin\s+/i, '').trim() || item.title;
  return `${title.charAt(0).toLocaleUpperCase('tr-TR')}${title.slice(1)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractSourceIdsFromUnknown(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const own = typeof value.id === 'string' ? [value.id] : [];
  const sourceIds = asArray(value.sourceIds).filter((entry): entry is string => typeof entry === 'string');
  return uniqueStrings([...own, ...sourceIds]);
}

function extractDuplicateSourceIds(input: PortfolioDeferRiskInput): Set<string> {
  const ids = new Set<string>();
  for (const thread of asArray(input.decisionConsequenceThreads)) {
    for (const id of extractSourceIdsFromUnknown(thread)) ids.add(id);
  }
  return ids;
}

function hasTrustedSource(item: OperationPortfolioItem): boolean {
  return item.sourceIds.length > 0 && !item.sourceKinds.includes('fallback');
}

function hasTomorrowSource(item: OperationPortfolioItem, input: PortfolioDeferRiskInput): boolean {
  if (item.sourceKinds.includes('tomorrow_risk')) return true;
  const riskIds = asArray(input.tomorrowRiskSignals).flatMap(extractSourceIdsFromUnknown);
  return riskIds.some((id) => item.sourceIds.includes(id));
}

function hasFutureContextSource(item: OperationPortfolioItem, input: PortfolioDeferRiskInput): boolean {
  if (hasTomorrowSource(item, input)) return true;
  if (item.sourceKinds.includes('district_memory')) return true;
  if (item.sourceKinds.includes('decision_consequence')) return true;
  return Boolean(
    input.carryOverSignals || input.cityArchiveSignals || input.storyChainSignals,
  );
}

function resolveKind(item: OperationPortfolioItem): PortfolioDeferBindingKind {
  if (item.deferRisk === 'safe_to_watch') return 'safe_watch';
  if (item.kind === 'recovery_opportunity') return 'recovery_window';
  if (item.kind === 'positive_opportunity') return 'opportunity_window';
  if (item.isFollowUp) return 'follow_up';
  if (item.status === 'watch_only') return 'watch_signal';
  return DEFER_RISK_KIND[item.deferRisk] ?? 'none';
}

function resolveTimeScope(
  item: OperationPortfolioItem,
  input: PortfolioDeferRiskInput,
): PortfolioDeferBindingTimeScope {
  if (hasTomorrowSource(item, input)) return 'next_day';
  if (item.deferRisk === 'memory_trace_may_harden' || item.kind === 'memory_trace') return 'multi_day';
  return item.status === 'watch_only' ? 'same_day_report' : 'next_day';
}

function priorityForItem(item: OperationPortfolioItem, input: PortfolioDeferRiskInput): number {
  let priority = item.priority;
  if (item.deferRisk !== 'none' && item.deferRisk !== 'safe_to_watch') priority += 14;
  if (item.status === 'deferred') priority += 12;
  if (hasTomorrowSource(item, input)) priority += 10;
  if (item.districtId) priority += 4;
  if (item.kind === 'recovery_opportunity' || item.kind === 'positive_opportunity') priority += 8;
  if (item.deferRisk === 'safe_to_watch') priority -= 10;
  if (item.confidence === 'low') priority -= 12;
  return clamp(priority, 0, 100);
}

function lineForItem(item: OperationPortfolioItem, kind: PortfolioDeferBindingKind): string {
  const title = displayTitle(item);
  if (kind === 'safe_watch') return `${title} bugun izlemeye birakildi; sinyal sakin gorunuyor.`;
  if (kind === 'watch_signal') return `${title} bugun izleniyor; karar baskisi dusuk tutuldu.`;
  if (kind === 'recovery_window') return `${title} icin toparlanma penceresi izleniyor.`;
  if (kind === 'opportunity_window') return `${title} bugun izleniyor; firsat penceresi acik kalabilir.`;
  if (kind === 'memory_trace') return `${title} kalici iz olarak takip listesinde.`;
  if (kind === 'follow_up') return `${title} yarin yeniden okunacak takip adayi.`;
  return item.deferRiskLine ?? `${title} ertelendi; kaynakli risk takipte.`;
}

function reportLineForItem(item: OperationPortfolioItem, kind: PortfolioDeferBindingKind): string | undefined {
  const title = displayTitle(item);
  if (kind === 'none') return undefined;
  if (kind === 'safe_watch') return clampLine(`Bugun izlemeye birakilan ${title} guvenli gorunuyor.`);
  if (kind === 'watch_signal') return clampLine(`${title} bugun izlemeye birakildi.`);
  if (kind === 'recovery_window') return clampLine(`${title} izleniyor; yarin kucuk takip hamlesi degerli olabilir.`);
  if (kind === 'opportunity_window') return clampLine(`${title} firsati izleniyor; kaynak uygunlugu tekrar okunabilir.`);
  if (kind === 'memory_trace') return clampLine(`${title} bugun kaybolmadi; uzun iz olarak takipte.`);
  if (kind === 'follow_up') return clampLine(`${title} yarin takip adayi olarak kaldi.`);
  return clampLine(`${title} ertelendi; ${item.deferRiskLine ?? 'yarin yeniden kontrol edilebilir.'}`);
}

function tomorrowLineForItem(
  item: OperationPortfolioItem,
  kind: PortfolioDeferBindingKind,
  input: PortfolioDeferRiskInput,
): string | undefined {
  if (!hasFutureContextSource(item, input)) return undefined;
  const title = displayTitle(item);
  if (kind === 'safe_watch') return undefined;
  if (kind === 'recovery_window' || kind === 'opportunity_window') {
    return clampLine(`${title} icin bu bolgeyi yarin yeniden oku.`);
  }
  if (item.kind === 'route_pressure') return clampLine(`Yarin ilk olarak ${title} kontrol et.`);
  if (item.kind === 'social_pressure' || item.deferRisk === 'trust_may_drop') {
    return clampLine(`Yarin ${title} etkisini izle.`);
  }
  return clampLine(`${title} yarin tekrar kontrol et.`);
}

function shouldBuildBinding(
  item: OperationPortfolioItem,
  duplicateSourceIds: Set<string>,
): boolean {
  if (item.visibilityLevel === 'hidden') return false;
  if (item.status !== 'deferred' && item.status !== 'watch_only') return false;
  if (!hasTrustedSource(item)) return false;
  if (
    item.deferRisk === 'memory_trace_may_harden' &&
    !item.sourceKinds.some((kind) => kind === 'district_memory' || kind === 'decision_consequence')
  ) {
    return false;
  }
  if (
    (item.kind === 'recovery_opportunity' || item.kind === 'positive_opportunity') &&
    !item.sourceKinds.some((kind) => kind === 'reward_comeback' || kind === 'event_gameplay_variety')
  ) {
    return false;
  }
  if (item.deferRisk === 'none' && item.status !== 'watch_only' && !item.isFollowUp) return false;
  return !item.sourceIds.some((id) => duplicateSourceIds.has(id));
}

function buildBinding(
  item: OperationPortfolioItem,
  input: PortfolioDeferRiskInput,
): PortfolioDeferBinding | null {
  const kind = resolveKind(item);
  if (kind === 'none') return null;

  const sourceIds = uniqueStrings(item.sourceIds);
  const sourceKinds = uniqueStrings(item.sourceKinds);
  const priority = priorityForItem(item, input);
  const line = clampLine(lineForItem(item, kind));
  const reportLine = reportLineForItem(item, kind);
  const tomorrowLine = tomorrowLineForItem(item, kind, input);
  const isFallback = item.confidence === 'low' || sourceKinds.includes('fallback');

  return {
    id: `portfolio_defer_${item.id}`,
    portfolioItemId: item.id,
    kind,
    title: clampLine(item.title, 64),
    line,
    nextActionLine: tomorrowLine,
    reportLine,
    tomorrowLine,
    districtId: item.districtId,
    districtName: item.districtName,
    deferRisk: item.deferRisk,
    timeScope: resolveTimeScope(item, input),
    priority,
    tone:
      kind === 'recovery_window' || kind === 'opportunity_window'
        ? 'positive'
        : kind === 'safe_watch' || item.confidence === 'low'
          ? 'neutral'
          : 'warning',
    confidence: isFallback ? 'low' : item.confidence,
    sourceIds,
    sourceKinds,
    isActionable: Boolean(tomorrowLine) && kind !== 'safe_watch',
    isFallback,
  };
}

export function buildPortfolioDeferRiskBindings(
  input: PortfolioDeferRiskInput,
): PortfolioDeferRiskResult {
  const day = Math.max(1, input.day ?? 1);
  if (day <= 1 || !input.portfolioResult || input.portfolioResult.sourceIds.length === 0) {
    return {
      bindings: [],
      hasActionableDeferredRisk: false,
      sourceIds: [],
    };
  }

  const duplicateSourceIds = extractDuplicateSourceIds(input);
  const candidates = [
    ...input.portfolioResult.deferredItems,
    ...input.portfolioResult.watchOnlyItems,
  ];

  const bindings = candidates
    .filter((item) => shouldBuildBinding(item, duplicateSourceIds))
    .map((item) => buildBinding(item, input))
    .filter((binding): binding is PortfolioDeferBinding => Boolean(binding))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, MAX_BINDINGS);

  const primaryBinding = bindings[0];
  const sourceIds = uniqueStrings(bindings.flatMap((binding) => binding.sourceIds));

  return {
    bindings,
    primaryBinding,
    reportSummaryLine: primaryBinding?.reportLine,
    tomorrowActionLine: primaryBinding?.tomorrowLine,
    hasActionableDeferredRisk: bindings.some((binding) => binding.isActionable),
    sourceIds,
  };
}
