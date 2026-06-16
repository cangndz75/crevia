import {
  DEFER_RISK_COPY,
  DETAILED_PORTFOLIO_PERMISSION_IDS,
  PORTFOLIO_BASE_COSTS,
  PORTFOLIO_COST_MAX,
  PORTFOLIO_KIND_PRIORITY_BASE,
  PORTFOLIO_MAX_MAP_RECOMMENDED,
  PORTFOLIO_MAX_SELECTED_ITEMS_DAY8,
  PORTFOLIO_MAX_VISIBLE_ITEMS,
  resolveDailyCapacityMode,
  resolveOperationSlotLimit,
  resolvePortfolioItemLimit,
} from './dailyCapacityPortfolioConstants';
import {
  buildAuthorityGameplayEffectSnapshot,
  enrichPortfolioItemWithAuthorityEffect,
  resolveAuthorityPortfolioPriorityBonus,
} from '@/core/authorityGameplayExpansion/authorityGameplayEffectModel';
import {
  collectPortfolioDrafts,
  type PortfolioAdapterDraft,
} from './dailyCapacityPortfolioSourceAdapters';
import type {
  DailyCapacityBand,
  DailyCapacityEntry,
  DailyCapacityKind,
  DailyCapacityPortfolioInput,
  DailyCapacityPortfolioResult,
  DailyCapacitySourceKind,
  DailyCapacitySummary,
  OperationPortfolioCapacityCost,
  OperationPortfolioDeferRisk,
  OperationPortfolioItem,
  OperationPortfolioItemStatus,
} from './dailyCapacityPortfolioTypes';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function uniqueSourceKinds(values: DailyCapacitySourceKind[]): DailyCapacitySourceKind[] {
  return [...new Set(values)];
}

function clampCost(cost: OperationPortfolioCapacityCost): OperationPortfolioCapacityCost {
  return {
    operationSlots: clamp(cost.operationSlots, 0, PORTFOLIO_COST_MAX),
    team: clamp(cost.team, 0, PORTFOLIO_COST_MAX),
    vehicle: clamp(cost.vehicle, 0, PORTFOLIO_COST_MAX),
    resource: clamp(cost.resource, 0, PORTFOLIO_COST_MAX),
    social: clamp(cost.social, 0, PORTFOLIO_COST_MAX),
    districtFocus: clamp(cost.districtFocus, 0, PORTFOLIO_COST_MAX),
    followUp: clamp(cost.followUp, 0, PORTFOLIO_COST_MAX),
  };
}

function applyDistrictCostModifiers(
  cost: OperationPortfolioCapacityCost,
  highCriteria: string[] | undefined,
  day: number,
): OperationPortfolioCapacityCost {
  const next = { ...cost };
  for (const criterion of highCriteria ?? []) {
    if (criterion === 'social_sensitivity') next.social += 1;
    if (criterion === 'route_difficulty') next.vehicle += 1;
    if (criterion === 'container_density') next.resource += 1;
    if (criterion === 'trust_fragility') {
      next.districtFocus += 1;
      next.social += 1;
    }
    if (criterion === 'recovery_potential') next.followUp += 1;
    if (criterion === 'neglect_risk') next.followUp += 1;
    if (criterion === 'maintenance_exposure') next.vehicle += 1;
    if (criterion === 'resource_dependency') next.resource += 1;
  }
  if (day <= 1) {
    next.operationSlots = Math.min(next.operationSlots, 1);
    next.team = Math.min(next.team, 1);
    next.vehicle = Math.min(next.vehicle, 1);
    next.resource = Math.min(next.resource, 1);
    next.social = Math.min(next.social, 1);
  }
  return clampCost(next);
}

export function computePortfolioCapacityCost(
  draft: PortfolioAdapterDraft,
  day: number,
): OperationPortfolioCapacityCost {
  const base = { ...PORTFOLIO_BASE_COSTS[draft.kind] };
  if (draft.kind === 'maintenance_warning' && draft.urgency === 'low') {
    base.operationSlots = 0;
  }
  if (
    (draft.kind === 'recovery_opportunity' || draft.kind === 'positive_opportunity') &&
    draft.opportunityValue === 'high'
  ) {
    base.operationSlots = Math.max(base.operationSlots, 1);
  }
  return applyDistrictCostModifiers(base, draft.districtCriterionHigh, day);
}

export function computeDeferRisk(draft: PortfolioAdapterDraft): OperationPortfolioDeferRisk {
  if (draft.deferRisk !== 'none') return draft.deferRisk;
  if (draft.hasTomorrowRiskSource) {
    if (draft.hasRouteSource) return 'route_may_strain';
    if (draft.hasSocialSource) return 'social_reaction_may_grow';
    return 'pressure_may_grow';
  }
  if (draft.hasTrustSource && draft.sourceKinds.includes('district_trust')) {
    return 'trust_may_drop';
  }
  if (draft.hasResourceSource && draft.sourceKinds.includes('resource_pressure')) {
    return 'resource_cost_may_rise';
  }
  if (draft.hasRouteSource) return 'route_may_strain';
  if (draft.hasSocialSource) return 'social_reaction_may_grow';
  if (draft.hasOpportunitySource) return 'opportunity_may_expire';
  if (draft.hasMemorySource) return 'memory_trace_may_harden';
  if (draft.isWatchOnlyCandidate || draft.confidence === 'low') return 'safe_to_watch';
  return 'none';
}

function deferRiskLine(
  deferRisk: OperationPortfolioDeferRisk,
  draft: PortfolioAdapterDraft,
  hasTomorrowPermission: boolean,
): string | undefined {
  if (deferRisk === 'none') return undefined;
  if (deferRisk === 'pressure_may_grow' && !draft.hasTomorrowRiskSource && !hasTomorrowPermission) {
    return undefined;
  }
  if (
    (deferRisk === 'route_may_strain' || deferRisk === 'social_reaction_may_grow') &&
    !draft.hasTomorrowRiskSource &&
    !draft.hasRouteSource &&
    !draft.hasSocialSource
  ) {
    return undefined;
  }
  if (deferRisk === 'trust_may_drop' && !draft.hasTrustSource) return undefined;
  if (deferRisk === 'resource_cost_may_rise' && !draft.hasResourceSource) return undefined;
  if (deferRisk === 'opportunity_may_expire' && !draft.hasOpportunitySource) return undefined;
  if (deferRisk === 'memory_trace_may_harden' && !draft.hasMemorySource) return undefined;
  return DEFER_RISK_COPY[deferRisk];
}

function computePriority(
  draft: PortfolioAdapterDraft,
  day: number,
  seenDistricts: Set<string>,
  seenKinds: Set<string>,
  permissionIds: Set<string>,
  authorityEffectSnapshot?: ReturnType<typeof buildAuthorityGameplayEffectSnapshot>,
): number {
  let score = PORTFOLIO_KIND_PRIORITY_BASE[draft.kind];
  if (draft.urgency === 'high') score += 12;
  if (draft.pressureLevel === 'high') score += 10;
  if (draft.opportunityValue === 'high') score += 8;
  if (draft.isMapRecommended) score += 8;
  if (draft.confidence === 'high') score += 5;
  if (day >= 8) score += 5;
  if (draft.sourceKinds.includes('map_gameplay_binding')) score += 6;
  if (draft.sourceKinds.includes('active_operation_map_binding')) score += 5;
  if (draft.sourceKinds.includes('operation_signals') && draft.pressureLevel === 'high') {
    score += 7;
  }
  if (draft.sourceKinds.includes('decision_consequence')) score += 4;
  if (draft.sourceKinds.includes('tomorrow_risk')) score += 6;
  if (permissionIds.has('resource_pressure_summary') && draft.kind === 'resource_pressure') {
    score += 4;
  }
  if (permissionIds.has('district_trust_preview') && draft.hasTrustSource) score += 4;
  if (permissionIds.has('assignment_fit_preview') && draft.kind === 'active_operation') score += 3;
  if (permissionIds.has('tomorrow_risk_preview') && draft.hasTomorrowRiskSource) score += 3;
  score += resolveAuthorityPortfolioPriorityBonus(draft, authorityEffectSnapshot);
  if (draft.districtId && seenDistricts.has(draft.districtId)) score -= 8;
  if (seenKinds.has(draft.kind)) score -= 6;
  if (draft.confidence === 'low') score -= 10;
  if (draft.isWatchOnlyCandidate) score -= 8;
  return clamp(score, 0, 100);
}

function dedupeDrafts(drafts: PortfolioAdapterDraft[]): PortfolioAdapterDraft[] {
  const byKey = new Map<string, PortfolioAdapterDraft>();

  for (const draft of drafts) {
    const key = `${draft.kind}:${draft.districtId ?? 'city'}:${draft.title}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, draft);
      continue;
    }
    const merged: PortfolioAdapterDraft = {
      ...existing,
      sourceIds: uniqueStrings([...existing.sourceIds, ...draft.sourceIds]),
      sourceKinds: uniqueSourceKinds([...existing.sourceKinds, ...draft.sourceKinds]),
      confidence:
        existing.confidence === 'high' || draft.confidence === 'high'
          ? 'high'
          : existing.confidence === 'medium' || draft.confidence === 'medium'
            ? 'medium'
            : 'low',
      isMapRecommended: existing.isMapRecommended || draft.isMapRecommended,
      isSelectedCandidate: existing.isSelectedCandidate || draft.isSelectedCandidate,
      hasTomorrowRiskSource: existing.hasTomorrowRiskSource || draft.hasTomorrowRiskSource,
      hasTrustSource: existing.hasTrustSource || draft.hasTrustSource,
      hasResourceSource: existing.hasResourceSource || draft.hasResourceSource,
      hasRouteSource: existing.hasRouteSource || draft.hasRouteSource,
      hasSocialSource: existing.hasSocialSource || draft.hasSocialSource,
      hasOpportunitySource: existing.hasOpportunitySource || draft.hasOpportunitySource,
      hasMemorySource: existing.hasMemorySource || draft.hasMemorySource,
      districtCriterionHigh: uniqueStrings([
        ...(existing.districtCriterionHigh ?? []),
        ...(draft.districtCriterionHigh ?? []),
      ]),
    };
    byKey.set(key, merged);
  }

  return [...byKey.values()];
}

function suppressSpam(drafts: PortfolioAdapterDraft[], day: number): PortfolioAdapterDraft[] {
  const kindCount = new Map<string, number>();
  const districtCount = new Map<string, number>();
  const result: PortfolioAdapterDraft[] = [];

  const sorted = [...drafts].sort((a, b) => a.id.localeCompare(b.id));

  for (const draft of sorted) {
    const kindKey = draft.kind;
    const districtKey = draft.districtId ?? 'city';
    const nextKindCount = (kindCount.get(kindKey) ?? 0) + 1;
    const nextDistrictCount = (districtCount.get(districtKey) ?? 0) + 1;
    const maxPerKind = kindKey === 'active_operation' && day >= 8 ? 4 : 2;

    if (nextKindCount > maxPerKind || (draft.districtId && nextDistrictCount > 2)) {
      continue;
    }

    kindCount.set(kindKey, nextKindCount);
    districtCount.set(districtKey, nextDistrictCount);
    result.push(draft);
  }

  return result;
}

function resolveVisibilityLevel(
  draft: PortfolioAdapterDraft,
  permissionIds: Set<string>,
): 'hidden' | 'teaser' | 'summary' | 'detailed' {
  if (draft.confidence === 'low' && draft.sourceKinds.includes('fallback')) return 'summary';
  const needsDetailed =
    (draft.kind === 'resource_pressure' && permissionIds.has('resource_pressure_summary')) ||
    (draft.kind === 'memory_trace' && permissionIds.has('district_memory_trace_preview')) ||
    (draft.deferRisk !== 'none' && permissionIds.has('tomorrow_risk_preview')) ||
    (draft.hasTrustSource && permissionIds.has('district_trust_preview')) ||
    ((draft.kind === 'route_pressure' || draft.kind === 'active_operation') &&
      permissionIds.has('assignment_fit_preview')) ||
    (draft.isMapRecommended && permissionIds.has('map_resource_layer'));

  if (needsDetailed && draft.sourceIds.length > 0 && !draft.sourceKinds.includes('fallback')) {
    return 'detailed';
  }
  if (draft.isLockedCandidate) return 'teaser';
  return 'summary';
}

function assignStatuses(
  scored: Array<PortfolioAdapterDraft & { priority: number }>,
  day: number,
  operationSlotLimit: number,
): OperationPortfolioItem[] {
  const selectedBudget = day <= 1 ? 1 : operationSlotLimit;
  let selectedUsed = 0;
  let mapRecommendedUsed = 0;

  const items: OperationPortfolioItem[] = [];

  for (const draft of scored) {
    let status: OperationPortfolioItemStatus = 'available';

    if (draft.isLockedCandidate) {
      status = 'locked';
    } else if (draft.isSelectedCandidate && selectedUsed < selectedBudget) {
      status = 'selected';
      selectedUsed += 1;
    } else if (draft.isWatchOnlyCandidate) {
      status = 'watch_only';
    } else if (draft.isSelectedCandidate && selectedUsed >= selectedBudget) {
      status = 'deferred';
    } else if (selectedUsed >= selectedBudget && draft.urgency !== 'low') {
      status = 'deferred';
    } else {
      status = 'available';
    }

    const isMapRecommended =
      draft.isMapRecommended && mapRecommendedUsed < PORTFOLIO_MAX_MAP_RECOMMENDED;
    if (isMapRecommended) mapRecommendedUsed += 1;

    items.push({
      id: draft.id,
      kind: draft.kind,
      status,
      title: draft.title,
      subtitle: draft.subtitle,
      districtId: draft.districtId,
      districtName: draft.districtName,
      pressureLevel: draft.pressureLevel,
      urgency: draft.urgency,
      opportunityValue: draft.opportunityValue,
      deferRisk: computeDeferRisk(draft),
      capacityCost: computePortfolioCapacityCost(draft, day),
      recommendedReason: draft.recommendedReason,
      selectBenefitLine: draft.selectBenefitLine,
      mapLine: draft.mapLine,
      sourceIds: uniqueStrings(draft.sourceIds),
      sourceKinds: uniqueSourceKinds(draft.sourceKinds),
      confidence: draft.confidence,
      priority: draft.priority,
      isActionable: draft.isActionable && status !== 'locked' && status !== 'watch_only',
      isMapRecommended,
      isFollowUp: draft.isFollowUp,
      visibilityLevel: 'summary',
    });
  }

  return items;
}

function capacityBand(remaining: number, available: number): DailyCapacityBand {
  if (available <= 0) return 'low';
  const ratio = remaining / available;
  if (ratio <= 0) return 'full';
  if (ratio < 0.35) return 'low';
  if (ratio < 0.7) return 'medium';
  return 'high';
}

function buildCapacityEntries(
  day: number,
  items: OperationPortfolioItem[],
  operationSlotLimit: number,
  sourceIds: string[],
  sourceKinds: DailyCapacitySourceKind[],
): DailyCapacityEntry[] {
  const selected = items.filter((item) => item.status === 'selected');
  const sum = (pick: (cost: OperationPortfolioCapacityCost) => number): number =>
    selected.reduce((total, item) => total + pick(item.capacityCost), 0);

  const kinds: Array<{
    kind: DailyCapacityKind;
    available: number;
    label: string;
    line: string;
    used: () => number;
  }> = [
    {
      kind: 'operation_slots',
      available: operationSlotLimit,
      label: 'Operasyon slotu',
      line: 'Bugun kac operasyonu ayni anda surdurebilirsin.',
      used: () => sum((cost) => cost.operationSlots),
    },
    {
      kind: 'field_team_capacity',
      available: day <= 1 ? 1 : day < 8 ? 2 : 3,
      label: 'Saha ekibi',
      line: 'Ekip dagilimi ve yorgunluk.',
      used: () => sum((cost) => cost.team),
    },
    {
      kind: 'vehicle_route_capacity',
      available: day <= 1 ? 1 : day < 8 ? 2 : 3,
      label: 'Arac ve rota',
      line: 'Rota ve arac uygunlugu.',
      used: () => sum((cost) => cost.vehicle),
    },
    {
      kind: 'resource_attention',
      available: day <= 1 ? 1 : 2,
      label: 'Kaynak dikkati',
      line: 'Malzeme ve lojistik odagi.',
      used: () => sum((cost) => cost.resource),
    },
    {
      kind: 'social_attention',
      available: day <= 1 ? 0 : 2,
      label: 'Sosyal dikkat',
      line: 'Mahalle tepkisi ve iletisim.',
      used: () => sum((cost) => cost.social),
    },
    {
      kind: 'district_focus',
      available: day <= 1 ? 1 : 2,
      label: 'Bolge odağı',
      line: 'Ayni anda kac bolgeye derin odaklanabilirsin.',
      used: () => sum((cost) => cost.districtFocus),
    },
    {
      kind: 'follow_up_capacity',
      available: day <= 1 ? 0 : 2,
      label: 'Takip kapasitesi',
      line: 'Izleme ve takip adayi isleri.',
      used: () => sum((cost) => cost.followUp),
    },
  ];

  return kinds.map((entry) => {
    const used = clamp(entry.used(), 0, entry.available);
    const reserved = 0;
    const remaining = clamp(entry.available - used - reserved, 0, entry.available);
    return {
      kind: entry.kind,
      available: entry.available,
      used,
      reserved,
      remaining,
      band: capacityBand(remaining, entry.available),
      label: entry.label,
      line: entry.line,
      sourceIds,
      sourceKinds,
    };
  });
}

function buildTradeoffLine(items: OperationPortfolioItem[]): string | undefined {
  const deferred = items.filter((item) => item.status === 'deferred');
  const selected = items.filter((item) => item.status === 'selected');
  if (deferred.length === 0 || selected.length === 0) return undefined;

  const deferredTitle = deferred[0]?.title;
  const selectedTitle = selected[0]?.title;
  if (!deferredTitle || !selectedTitle) return undefined;
  return `Bugun ${selectedTitle} secildi; ${deferredTitle} yarin icin bekliyor.`;
}

export function buildDailyCapacityPortfolio(
  input: DailyCapacityPortfolioInput,
): DailyCapacityPortfolioResult {
  const day = Math.max(1, input.day ?? 1);
  const mode = resolveDailyCapacityMode(day);
  const operationSlotLimit = resolveOperationSlotLimit(day);
  const portfolioItemLimit = resolvePortfolioItemLimit(day);
  const permissionIds = new Set(input.authorityPermissionIds ?? []);
  const authorityEffectSnapshot = buildAuthorityGameplayEffectSnapshot({
    day,
    permissionIds: [...permissionIds],
    rankId: input.authorityRankId,
  });

  const rawDrafts = collectPortfolioDrafts(input);
  const deduped = suppressSpam(dedupeDrafts(rawDrafts), day);

  const seenDistricts = new Set<string>();
  const seenKinds = new Set<string>();
  const scored = deduped
    .map((draft) => {
      const priority = computePriority(
        draft,
        day,
        seenDistricts,
        seenKinds,
        permissionIds,
        authorityEffectSnapshot,
      );
      if (draft.districtId) seenDistricts.add(draft.districtId);
      seenKinds.add(draft.kind);
      return { ...draft, priority };
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  let items = assignStatuses(scored, day, operationSlotLimit);

  items = items.map((item) => {
    const draft = scored.find((entry) => entry.id === item.id);
    const visibilityLevel = draft
      ? resolveVisibilityLevel(draft, permissionIds)
      : 'summary';
    const hasTomorrowPermission = permissionIds.has('tomorrow_risk_preview');
    const riskLine = deferRiskLine(item.deferRisk, draft ?? scored[0], hasTomorrowPermission);
    const authorityTeaserLine =
      item.status === 'locked'
        ? 'Yetki acilinca bu sinyalin detayi gorunur.'
        : visibilityLevel === 'teaser'
          ? 'Ozet gorunur; detay yetkiyle acilir.'
          : undefined;

    return enrichPortfolioItemWithAuthorityEffect(
      {
        ...item,
        visibilityLevel,
        deferRiskLine: riskLine,
        authorityTeaserLine,
        urgency:
          item.confidence === 'low' && item.sourceKinds.includes('fallback')
            ? 'low'
            : item.urgency,
      },
      authorityEffectSnapshot,
    );
  });

  const visibleItems = items
    .filter((item) => item.visibilityLevel !== 'hidden')
    .slice(0, portfolioItemLimit);

  const hiddenIds = new Set(visibleItems.map((item) => item.id));
  items = items.map((item) =>
    hiddenIds.has(item.id) ? item : { ...item, visibilityLevel: 'hidden' as const },
  );

  if (day >= 8 && visibleItems.filter((item) => item.status === 'selected').length > PORTFOLIO_MAX_SELECTED_ITEMS_DAY8) {
    let selectedSeen = 0;
    items = items.map((item) => {
      if (item.status !== 'selected') return item;
      selectedSeen += 1;
      if (selectedSeen > PORTFOLIO_MAX_SELECTED_ITEMS_DAY8) {
        return { ...item, status: 'available' as const };
      }
      return item;
    });
  }

  const sourceIds = uniqueStrings(items.flatMap((item) => item.sourceIds));
  const sourceKinds = uniqueSourceKinds(items.flatMap((item) => item.sourceKinds));

  const selectedItems = items.filter((item) => item.status === 'selected');
  const availableItems = items.filter((item) => item.status === 'available');
  const deferredItems = items.filter((item) => item.status === 'deferred');
  const watchOnlyItems = items.filter((item) => item.status === 'watch_only');
  const mapRecommendedItems = items.filter((item) => item.isMapRecommended);

  const primaryRecommendation =
    visibleItems.find((item) => item.isActionable && item.status !== 'watch_only') ??
    visibleItems[0];

  const primaryTradeoffLine = buildTradeoffLine(items);

  const summary: DailyCapacitySummary = {
    day,
    mode,
    title:
      mode === 'tutorial'
        ? 'Gunluk kapasite'
        : mode === 'post_pilot_strategic'
          ? 'Stratejik portfoy'
          : 'Operasyon portfoyu',
    summaryLine:
      mode === 'tutorial'
        ? 'Bugun tek operasyona odaklan.'
        : mode === 'post_pilot_light' || mode === 'post_pilot_strategic'
          ? `${visibleItems.length} sinyal var; ${operationSlotLimit} operasyon slotun var.`
          : `${visibleItems.length} aday sinyal izleniyor.`,
    capacityEntries: buildCapacityEntries(day, items, operationSlotLimit, sourceIds, sourceKinds),
    operationSlotLimit,
    portfolioItemLimit,
    selectedItemCount: selectedItems.length,
    availableItemCount: availableItems.length,
    deferredItemCount: deferredItems.length,
    hasStrategicPressure: day >= 8 && deferredItems.length > 0,
    primaryTradeoffLine,
    sourceIds,
    sourceKinds,
  };

  const portfolioResult: DailyCapacityPortfolioResult = {
    summary,
    items,
    selectedItems,
    availableItems,
    deferredItems,
    watchOnlyItems,
    mapRecommendedItems,
    primaryRecommendation,
    primaryTradeoffLine,
    sourceIds,
  };

  return {
    ...portfolioResult,
    ecePortfolioLine: buildEcePortfolioLine(portfolioResult),
  };
}

export function buildEcePortfolioLine(result: DailyCapacityPortfolioResult): string | undefined {
  const { summary, items, primaryRecommendation } = result;
  const visible = items.filter((item) => item.visibilityLevel !== 'hidden');
  if (visible.length === 0) return undefined;

  if (summary.mode === 'tutorial') {
    return 'Ilk gun tek operasyon yeterli; diger sinyalleri izlemek guvenli.';
  }

  const lowConfidence = visible.every((item) => item.confidence === 'low');
  if (lowConfidence) return undefined;

  const route = visible.find((item) => item.kind === 'route_pressure');
  const social = visible.find((item) => item.kind === 'social_pressure');
  const container = visible.find((item) => item.kind === 'container_pressure');
  const opportunity = visible.find(
    (item) => item.kind === 'recovery_opportunity' || item.kind === 'positive_opportunity',
  );
  const deferred = visible.find((item) => item.status === 'deferred');

  if (route && social) {
    return 'Bugun iki kapasiten var; rota baskisi ve guven hassasiyeti ayni anda geliyor.';
  }
  if (container && social) {
    return 'Konteyner hatti kalici baski yaratiyor, ama sosyal tepki daha gorunur.';
  }
  if (opportunity && deferred) {
    return 'Bu firsati izlemek guvenli; baskiyi oncelemek daha iyi.';
  }
  if (summary.operationSlotLimit === 2 && visible.length >= 3) {
    return 'Bugun bir operasyonu secip bir sinyali izlemeye birakmak mantikli.';
  }
  if (primaryRecommendation?.recommendedReason) {
    return primaryRecommendation.recommendedReason.slice(0, 90);
  }
  return undefined;
}
