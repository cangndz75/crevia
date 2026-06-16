import { ensureAtLeastOneAffordableDecision } from '@/core/game/decisionAffordabilityFallback';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildAuthorityGameplayEffectSnapshot } from '@/core/authorityGameplayExpansion/authorityGameplayEffectModel';
import { isPostPilotLightEventLoopEligible } from '@/core/postPilot/postPilotEventEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';

import { buildDailyCapacityPortfolio } from './dailyCapacityPortfolioModel';
import type { DailyCapacityPortfolioResult, OperationPortfolioItem } from './dailyCapacityPortfolioTypes';
import { buildDailyCapacityPortfolioStoreInput } from './dailyCapacityPortfolioStoreInput';
import type { BuildDailyCapacityPortfolioStoreInputParams } from './dailyCapacityPortfolioStoreInput';
import type {
  DailyCapacityRuntimeBindingMode,
  DailyCapacityRuntimeSnapshot,
  DailyOperationsPlanPortfolioView,
} from './dailyCapacityRuntimeBindingTypes';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function shouldApplyPortfolioRuntimeBinding(
  day: number,
  gameState: GameState,
): boolean {
  if (day <= 1) return false;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return false;
  return isPostPilotLightEventLoopEligible(gameState);
}

export function resolvePortfolioBindingMode(
  day: number,
  gameState: GameState,
): DailyCapacityRuntimeBindingMode {
  return shouldApplyPortfolioRuntimeBinding(day, gameState)
    ? 'portfolio_runtime'
    : 'legacy';
}

function resolveEventIdFromPortfolioItem(
  item: OperationPortfolioItem,
  catalogIds: Set<string>,
): string | undefined {
  for (const sourceId of item.sourceIds) {
    if (catalogIds.has(sourceId)) return sourceId;
  }
  return undefined;
}

export function resolveRuntimeActiveEventsFromPortfolio(params: {
  catalog: EventCard[];
  portfolio: DailyCapacityPortfolioResult;
  blockedIds: Set<string>;
  budget: number;
  maxEvents: number;
  anchorEventId?: string;
}): {
  activeEvents: EventCard[];
  activeEventIds: string[];
  deferredEventIds: string[];
  featuredEventId?: string;
} {
  const catalogById = new Map(params.catalog.map((event) => [event.id, event]));
  const catalogIds = new Set(params.catalog.map((event) => event.id));

  const operationItems = params.portfolio.items
    .filter(
      (item) =>
        item.kind === 'active_operation' ||
        item.sourceKinds.includes('active_events') ||
        item.sourceKinds.includes('post_pilot_event_quota'),
    )
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const selectedEventIds: string[] = [];
  const deferredFromPortfolio: string[] = [];

  for (const item of operationItems) {
    const eventId = resolveEventIdFromPortfolioItem(item, catalogIds);
    if (!eventId || params.blockedIds.has(eventId)) continue;

    if (item.status === 'selected' && selectedEventIds.length < params.maxEvents) {
      selectedEventIds.push(eventId);
      continue;
    }

    if (
      item.status === 'deferred' ||
      item.status === 'watch_only' ||
      (item.status === 'available' && selectedEventIds.length >= params.maxEvents)
    ) {
      deferredFromPortfolio.push(eventId);
    }
  }

  if (selectedEventIds.length === 0) {
    const fallbackIds = params.catalog
      .filter((event) => !params.blockedIds.has(event.id))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, params.maxEvents)
      .map((event) => event.id);
    selectedEventIds.push(...fallbackIds);
  }

  const activeEventIds = uniqueStrings(selectedEventIds).slice(0, params.maxEvents);
  const deferredEventIds = uniqueStrings([
    ...deferredFromPortfolio,
    ...params.catalog
      .map((event) => event.id)
      .filter((id) => !activeEventIds.includes(id) && !params.blockedIds.has(id)),
  ]);

  const activeEvents = activeEventIds
    .map((id) => catalogById.get(id))
    .filter((event): event is EventCard => event != null)
    .map((event) => ensureAtLeastOneAffordableDecision(event, params.budget));

  const anchorStillActive =
    params.anchorEventId != null && activeEventIds.includes(params.anchorEventId);
  const featuredEventId = anchorStillActive
    ? params.anchorEventId
    : activeEventIds[0];

  return {
    activeEvents,
    activeEventIds,
    deferredEventIds,
    featuredEventId,
  };
}

export function buildDailyOperationsPlanPortfolioView(
  portfolio: DailyCapacityPortfolioResult,
  deferredOperationEventIds: string[],
  portfolioDeferRiskLine?: string,
  authorityLine?: string,
): DailyOperationsPlanPortfolioView {
  const todayFocusEventIds = uniqueStrings(
    portfolio.selectedItems.flatMap((item) =>
      item.sourceIds.filter((id) => !id.startsWith('portfolio_') && !id.startsWith('catalog_')),
    ),
  );
  const recommendedEventIds = uniqueStrings(
    portfolio.items
      .filter((item) => item.status === 'selected' || item.status === 'available')
      .flatMap((item) =>
        item.sourceIds.filter((id) => !id.startsWith('portfolio_') && !id.startsWith('catalog_')),
      ),
  );
  const deferredEventIds = uniqueStrings([
    ...deferredOperationEventIds,
    ...portfolio.deferredItems.flatMap((item) =>
      item.sourceIds.filter((id) => !id.startsWith('portfolio_') && !id.startsWith('catalog_')),
    ),
  ]);

  const capacityLabel = `${portfolio.summary.selectedItemCount}/${portfolio.summary.operationSlotLimit} operasyon slotu`;

  return {
    day: portfolio.summary.day,
    todayFocusEventIds,
    recommendedEventIds,
    deferredEventIds,
    primaryDeferRiskLine: portfolioDeferRiskLine,
    capacityLabel,
    primaryTradeoffLine: portfolio.primaryTradeoffLine,
    authorityLine,
  };
}

export function buildDailyCapacityRuntimeSnapshot(
  params: BuildDailyCapacityPortfolioStoreInputParams & {
    decisionConsequenceThreads?: unknown[];
    carryOverSignals?: unknown[];
  },
): DailyCapacityRuntimeSnapshot {
  const portfolioInput = buildDailyCapacityPortfolioStoreInput(params);
  const portfolio = buildDailyCapacityPortfolio(portfolioInput);
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day: params.day,
    portfolioResult: portfolio,
    decisionConsequenceThreads: params.decisionConsequenceThreads,
    tomorrowRiskSignals: params.hubTomorrowRisk ?? undefined,
    carryOverSignals: params.carryOverSignals,
    authorityPermissionIds: portfolioInput.authorityPermissionIds,
  });

  const authorityEffectSnapshot = buildAuthorityGameplayEffectSnapshot({
    day: params.day,
    permissionIds: portfolioInput.authorityPermissionIds,
    rankId: portfolioInput.authorityRankId,
  });

  const deferredOperationEventIds =
    params.deferredOperationEventIds ??
    portfolio.deferredItems.flatMap((item) =>
      item.sourceIds.filter((id) => !id.startsWith('portfolio_') && !id.startsWith('catalog_')),
    );

  const activeOperationEventIds = portfolio.selectedItems.flatMap((item) =>
    item.sourceIds.filter((id) => !id.startsWith('portfolio_') && !id.startsWith('catalog_')),
  );

  const planPortfolioView = buildDailyOperationsPlanPortfolioView(
    portfolio,
    deferredOperationEventIds,
    portfolioDeferRisk.tomorrowActionLine,
    authorityEffectSnapshot.planningAuthorityLine,
  );

  return {
    day: params.day,
    mode: resolvePortfolioBindingMode(params.day, params.gameState),
    portfolio,
    portfolioDeferRisk,
    deferredOperationEventIds: uniqueStrings(deferredOperationEventIds),
    activeOperationEventIds: uniqueStrings(activeOperationEventIds),
    planPortfolioView,
    authorityEffectSnapshot,
    sourceIds: uniqueStrings([
      ...portfolio.sourceIds,
      ...portfolioDeferRisk.sourceIds,
      ...authorityEffectSnapshot.sourceIds,
    ]),
  };
}

export function applyPortfolioCapacityToPostPilotDailySet(params: {
  day: number;
  gameState: GameState;
  dailySet: PostPilotDailyEventSet;
  blockedIds: Set<string>;
  budget: number;
  maxEvents: number;
  mainOperationContext?: {
    operationSignals?: unknown;
    assignments?: unknown;
  };
}): {
  activeEvents: EventCard[];
  deferredEventIds: string[];
  featuredEventId?: string;
  portfolio: DailyCapacityPortfolioResult;
} {
  const portfolioInput = buildDailyCapacityPortfolioStoreInput({
    day: params.day,
    gameState: params.gameState,
    operationSignals:
      (params.mainOperationContext?.operationSignals as BuildDailyCapacityPortfolioStoreInputParams['operationSignals']) ??
      undefined,
    catalogOperationEvents: params.dailySet.catalog,
    deferredOperationEventIds: params.dailySet.deferredEventIds,
  });

  const portfolio = buildDailyCapacityPortfolio(portfolioInput);

  if (!shouldApplyPortfolioRuntimeBinding(params.day, params.gameState)) {
    const legacyActive = params.dailySet.allEventIds
      .filter((id) => !params.blockedIds.has(id))
      .slice(0, params.maxEvents)
      .map((id) => params.dailySet.catalog.find((event) => event.id === id))
      .filter((event): event is EventCard => event != null)
      .map((event) => ensureAtLeastOneAffordableDecision(event, params.budget));

    return {
      activeEvents: legacyActive,
      deferredEventIds: params.dailySet.allEventIds.filter(
        (id) => !legacyActive.some((event) => event.id === id),
      ),
      featuredEventId: params.dailySet.anchorEventId,
      portfolio,
    };
  }

  const selection = resolveRuntimeActiveEventsFromPortfolio({
    catalog: params.dailySet.catalog,
    portfolio,
    blockedIds: params.blockedIds,
    budget: params.budget,
    maxEvents: params.maxEvents,
    anchorEventId: params.dailySet.anchorEventId,
  });

  return {
    activeEvents: selection.activeEvents,
    deferredEventIds: selection.deferredEventIds,
    featuredEventId: selection.featuredEventId,
    portfolio,
  };
}
