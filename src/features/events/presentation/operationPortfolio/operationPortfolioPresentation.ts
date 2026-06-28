import {
  buildDailyCapacityPortfolio,
  buildDailyCapacityPortfolioStoreInput,
  type DailyCapacityPortfolioResult,
} from '@/core/dailyCapacityPortfolio';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { ResourcePressureDifferentiationResult } from '@/core/resourcePressureDifferentiation';
import type { MemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { buildMaintenanceEconomyPortfolioLine } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';

import { buildOperationPortfolioCapacityPresentation } from './operationPortfolioCapacityPresentation';
import { buildOperationPortfolioConflictPresentation } from './operationPortfolioConflictPresentation';
import { buildOperationPortfolioOutcomePreview } from './operationPortfolioOutcomePreview';
import {
  buildOperationPortfolioSlot,
  resolveEventIdFromItem,
  resolveSlotCta,
} from './operationPortfolioPriorityModel';
import type {
  OperationPortfolioBoardPresentation,
  OperationPortfolioHeroPresentation,
  OperationPortfolioHubAlignment,
  OperationPortfolioPendingSignal,
  OperationPortfolioSuggestedPlanPresentation,
  OperationPortfolioTone,
} from './operationPortfolioTypes';

export type BuildOperationPortfolioInput = {
  day: number;
  gameState: GameState;
  activeEvents: EventCard[];
  featuredEventId: string | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  memoryFollowUp?: MemoryFollowUpPresentationContext | null;
  dailyCapacityPortfolioResult?: DailyCapacityPortfolioResult | null;
  hubTodayFocus?: string | null;
  hubPrimaryOperationTitle?: string | null;
  hubPrimaryEventId?: string | null;
  hubPrimaryCtaLabel?: string | null;
  avoidLines?: string[];
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

const MAX_PRIMARY_SLOTS_DAY1 = 1;
const MAX_PRIMARY_SLOTS_RICH = 3;
const MAX_PENDING_DAY1 = 1;
const MAX_PENDING_RICH = 4;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function uniqueAvoidLines(lines: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line?.trim();
    if (!trimmed) continue;
    const key = normalizeLine(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function resolvePortfolio(input: BuildOperationPortfolioInput): DailyCapacityPortfolioResult {
  if (input.dailyCapacityPortfolioResult) return input.dailyCapacityPortfolioResult;
  const portfolioInput = buildDailyCapacityPortfolioStoreInput({
    day: input.day,
    gameState: input.gameState,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
  });
  return buildDailyCapacityPortfolio(portfolioInput);
}

function derivePortfolioTone(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  resourcePressure?: ResourcePressureDifferentiationResult | null;
}): { label: string; id: OperationPortfolioTone } {
  const items = input.portfolio.items.filter((item) => item.visibilityLevel !== 'hidden');
  const highPressure = items.filter((item) => item.pressureLevel === 'high').length;
  const trustRisk = items.some((item) => item.deferRisk === 'trust_may_drop');
  const resourceHigh =
    input.resourcePressure?.primaryProfile?.intensity === 'high' ||
    (input.resourcePressure?.profiles.some((profile) => profile.intensity === 'high') ?? false);
  const maintenance = items.some((item) => item.kind === 'maintenance_warning');
  const opportunity = items.some((item) => item.opportunityValue === 'high');

  if (input.day <= 1) return { label: 'İlk operasyon günü', id: 'neutral' };
  if (highPressure >= 2) return { label: 'Bugün risk yoğun', id: 'critical' };
  if (resourceHigh) return { label: 'Kaynaklar sınırlı', id: 'warning' };
  if (trustRisk) return { label: 'Mahalle güveni kırılgan', id: 'warning' };
  if (maintenance) return { label: 'Bakım baskısı kararları etkiliyor', id: 'warning' };
  if (opportunity) return { label: 'Fırsat günü: güven toparlanabilir', id: 'positive' };
  return { label: 'Gün dengeli ilerliyor', id: 'neutral' };
}

function buildHero(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  primarySlotEventId?: string;
  featuredEventId: string | null;
  activeEvents: EventCard[];
  portfolioTone: { label: string; id: OperationPortfolioTone };
  avoidLines: string[];
}): OperationPortfolioHeroPresentation {
  const visibleCount = input.portfolio.items.filter((item) => item.visibilityLevel !== 'hidden').length;
  const criticalCount = input.portfolio.items.filter(
    (item) => item.pressureLevel === 'high' && item.visibilityLevel !== 'hidden',
  ).length;
  const operationCount = input.day <= 1 ? 1 : Math.max(1, Math.min(visibleCount, input.portfolio.summary.operationSlotLimit));

  const boardTitle =
    input.day <= 1
      ? 'Bugünün Tahtası: ilk operasyon'
      : `Bugünün Tahtası: ${criticalCount > 0 ? criticalCount : operationCount} kritik operasyon`;

  const districtNames = uniqueAvoidLines(
    input.portfolio.selectedItems
      .map((item) => item.districtName)
      .filter(Boolean) as string[],
  );
  const districtHint =
    districtNames.length > 0
      ? `${districtNames.slice(0, 2).join(' ve ')} hattında`
      : 'Merkez hattında';

  const summaryCandidates = [
    input.day <= 1
      ? 'Tek operasyonla başla; Merkez seni bekliyor.'
      : `${districtHint} güven baskısı yükseliyor. Önceliği doğru seç.`,
    input.portfolio.summary.summaryLine,
    input.portfolio.primaryTradeoffLine,
  ];
  const summaryLine =
    summaryCandidates.find(
      (line) => line && !lineDuplicatesAvoidLines(line, input.avoidLines),
    ) ?? summaryCandidates[0] ?? 'Bugünün operasyon yükünü yönet.';

  const primaryItem =
    input.portfolio.primaryRecommendation ??
    input.portfolio.selectedItems[0] ??
    input.portfolio.items.find((item) => item.kind === 'active_operation');

  const eventId =
    input.primarySlotEventId ??
    (primaryItem ? resolveEventIdFromItem(primaryItem) : undefined) ??
    input.featuredEventId ??
    input.activeEvents[0]?.id;

  const cta = primaryItem
    ? resolveSlotCta(primaryItem, eventId ?? undefined, input.featuredEventId, true)
    : {
        label: 'Operasyonu İncele',
        route: eventId ? `/events/${eventId}` : '/events',
        eventId: eventId ?? undefined,
        enabled: Boolean(eventId ?? input.activeEvents.length),
      };

  return {
    dayLabel: `Gün ${input.day}`,
    boardTitle: clampLine(boardTitle, 52),
    portfolioTone: input.portfolioTone.label,
    portfolioToneId: input.portfolioTone.id,
    summaryLine: clampLine(summaryLine, 96),
    operationCountLabel:
      input.day <= 1 ? '1 ana operasyon' : `${operationCount} operasyon masada`,
    cta,
  };
}

function buildSuggestedPlan(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  primarySlotId?: string;
  featuredEventId: string | null;
  activeEvents: EventCard[];
  avoidLines: string[];
  playerStyleLabel?: string | null;
}): OperationPortfolioSuggestedPlanPresentation {
  const eceLine = input.portfolio.ecePortfolioLine?.trim();
  const primaryItem =
    input.portfolio.items.find((item) => item.id === input.primarySlotId) ??
    input.portfolio.primaryRecommendation ??
    input.portfolio.selectedItems[0];

  const socialItem = input.portfolio.items.find((item) => item.kind === 'social_pressure');
  const maintenanceItem = input.portfolio.items.find((item) => item.kind === 'maintenance_warning');

  const recommendationCandidates = [
    eceLine,
    socialItem && maintenanceItem
      ? 'Önce sosyal baskısı yüksek operasyonu çöz, sonra bakım riski düşük olanı planla.'
      : undefined,
    input.day >= 8 && input.portfolio.deferredItems.length > 0
      ? 'Bugün kaynak koruyucu gitmek güvenli, ama Merkez Mahallesi bekletilmemeli.'
      : undefined,
    primaryItem?.recommendedReason,
    input.day <= 1
      ? 'İlk operasyonu incele; planı kısa tut.'
      : 'Önce en kritik slotu netleştir, sonra ikincil sinyallere bak.',
  ];

  const recommendationLine =
    recommendationCandidates.find(
      (line) => line && !lineDuplicatesAvoidLines(line, input.avoidLines),
    ) ?? recommendationCandidates[recommendationCandidates.length - 1]!;

  const chips = [];
  if (socialItem?.districtName) {
    chips.push({
      id: 'plan_social',
      label: `${socialItem.districtName} önceliği`,
      tone: 'amber' as const,
    });
  }
  if (maintenanceItem) {
    chips.push({ id: 'plan_maint', label: 'Bakım riski', tone: 'warning' as const });
  }
  if (input.day >= 8 && input.playerStyleLabel) {
    chips.push({
      id: 'plan_style',
      label: input.playerStyleLabel,
      tone: 'teal' as const,
    });
  }
  if (chips.length === 0 && primaryItem?.districtName) {
    chips.push({
      id: 'plan_district',
      label: primaryItem.districtName,
      tone: 'teal' as const,
    });
  }

  const eventId = primaryItem ? resolveEventIdFromItem(primaryItem) : input.featuredEventId ?? undefined;
  const cta = primaryItem
    ? resolveSlotCta(primaryItem, eventId, input.featuredEventId, true)
    : {
        label: 'Öneriyi Uygula',
        route: eventId ? `/events/${eventId}` : '/events',
        eventId,
        enabled: Boolean(eventId),
      };

  return {
    visible: true,
    advisorLabel: input.day <= 1 ? 'Ece önerisi' : 'Merkez önerisi',
    recommendationLine: clampLine(recommendationLine, 96),
    chips: chips.slice(0, 2),
    cta,
  };
}

function buildHubAlignment(input: {
  hubTodayFocus?: string | null;
  hubPrimaryOperationTitle?: string | null;
  hubPrimaryEventId?: string | null;
  primarySlotTitle?: string;
  boardPrimaryEventId?: string;
}): OperationPortfolioHubAlignment {
  const focus = input.hubTodayFocus?.trim();
  const hubOp = input.hubPrimaryOperationTitle?.trim();
  const boardOp = input.primarySlotTitle?.trim();

  if (input.hubPrimaryEventId && input.boardPrimaryEventId) {
    if (input.hubPrimaryEventId === input.boardPrimaryEventId) {
      return {
        hubTodayFocus: focus,
        hubPrimaryOperationTitle: hubOp,
        hubPrimaryEventId: input.hubPrimaryEventId,
        boardPrimaryEventId: input.boardPrimaryEventId,
        alignedWithHub: true,
      };
    }
  }

  if (!focus && !hubOp) {
    return { alignedWithHub: true };
  }

  const normalizedFocus = normalizeLine(focus);
  const normalizedHubOp = normalizeLine(hubOp);
  const normalizedBoardOp = normalizeLine(boardOp);

  const titleAligned =
    !normalizedHubOp ||
    !normalizedBoardOp ||
    normalizedHubOp === normalizedBoardOp ||
    normalizedBoardOp.includes(normalizedHubOp) ||
    normalizedHubOp.includes(normalizedBoardOp) ||
    normalizedBoardOp.split(' ').some((token) => token.length > 4 && normalizedHubOp.includes(token));

  const focusAligned =
    !normalizedFocus ||
    !normalizedBoardOp ||
    normalizedFocus.includes(normalizedBoardOp) ||
    normalizedBoardOp.includes(normalizedFocus) ||
    normalizedFocus.includes('güven') ||
    normalizedFocus.includes('operasyon') ||
    normalizedFocus.includes('merkez');

  const aligned = titleAligned && focusAligned;

  return {
    hubTodayFocus: focus,
    hubPrimaryOperationTitle: hubOp,
    hubPrimaryEventId: input.hubPrimaryEventId ?? undefined,
    boardPrimaryEventId: input.boardPrimaryEventId,
    alignedWithHub: aligned,
    alignmentNote: aligned ? undefined : 'Tahta önceliği hub odağıyla hizalanmalı.',
  };
}

function buildPendingSignals(
  items: DailyCapacityPortfolioResult['items'],
  max: number,
  slotIds: Set<string>,
): OperationPortfolioPendingSignal[] {
  return items
    .filter((item) => item.visibilityLevel !== 'hidden' && !slotIds.has(item.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max)
    .map((item) => ({
      id: item.id,
      label: clampLine(item.title, 42),
      tone:
        item.pressureLevel === 'high'
          ? ('warning' as const)
          : item.kind.includes('opportunity')
            ? ('positive' as const)
            : ('neutral' as const),
    }));
}

export function buildOperationPortfolioPresentation(
  input: BuildOperationPortfolioInput,
): OperationPortfolioBoardPresentation {
  const portfolio = resolvePortfolio(input);
  const resourcePressure = input.memoryFollowUp?.resourcePressureDifferentiation ?? null;
  const avoidLines = uniqueAvoidLines([
    ...(input.avoidLines ?? []),
    input.hubTodayFocus,
    input.hubPrimaryOperationTitle,
    input.hubPrimaryCtaLabel,
    ...(input.memoryFollowUp?.dedupeLines ?? []),
  ]);

  const portfolioTone = derivePortfolioTone({
    day: input.day,
    portfolio,
    resourcePressure,
  });

  const visibleItems = portfolio.items
    .filter((item) => item.visibilityLevel !== 'hidden')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const hubOpKey = normalizeLine(input.hubPrimaryOperationTitle ?? undefined);
  const alignedFirst = hubOpKey
    ? [...visibleItems].sort((a, b) => {
        const aMatch = normalizeLine(a.title).includes(hubOpKey) || hubOpKey.includes(normalizeLine(a.title));
        const bMatch = normalizeLine(b.title).includes(hubOpKey) || hubOpKey.includes(normalizeLine(b.title));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.priority - a.priority || a.id.localeCompare(b.id);
      })
    : visibleItems;

  const maxSlots = input.day <= 1 ? MAX_PRIMARY_SLOTS_DAY1 : MAX_PRIMARY_SLOTS_RICH;
  const slotItems = alignedFirst.slice(0, maxSlots);

  const slotOptions = {
    day: input.day,
    featuredEventId: input.featuredEventId,
    activeEvents: input.activeEvents,
    avoidLines,
  };

  const slots = slotItems.map((item, index) =>
    buildOperationPortfolioSlot(
      item,
      index,
      index === 0 ? 'primary' : input.day <= 1 ? 'compact' : 'secondary',
      slotOptions,
    ),
  );

  const primarySlot = slots[0] ?? null;
  const secondarySlots = slots.slice(1);
  const slotIds = new Set(slots.map((slot) => slot.id));

  const hero = buildHero({
    day: input.day,
    portfolio,
    primarySlotEventId: primarySlot?.cta.eventId,
    featuredEventId: input.featuredEventId,
    activeEvents: input.activeEvents,
    portfolioTone,
    avoidLines,
  });
  avoidLines.push(hero.boardTitle, hero.summaryLine, hero.portfolioTone, hero.operationCountLabel);

  const capacity = buildOperationPortfolioCapacityPresentation({
    day: input.day,
    portfolio,
    operationSignals: input.operationSignals,
    resourcePressure,
    maintenanceLine: input.hubVehicleMaintenanceLine,
  });
  avoidLines.push(capacity.summaryLine);

  const conflicts = buildOperationPortfolioConflictPresentation({
    day: input.day,
    portfolio,
    operationSignals: input.operationSignals,
    maintenanceLine:
      buildMaintenanceEconomyPortfolioLine({
        day: input.day,
        runtime: input.maintenanceBacklogRuntime,
        operationsToday: visibleItems.length,
      }) ?? input.hubVehicleMaintenanceLine,
  });

  const suggestedPlan = buildSuggestedPlan({
    day: input.day,
    portfolio,
    primarySlotId: primarySlot?.id,
    featuredEventId: input.featuredEventId,
    activeEvents: input.activeEvents,
    avoidLines: [...avoidLines, primarySlot?.deferRiskLine, primarySlot?.operationName].filter(Boolean) as string[],
    playerStyleLabel: input.memoryFollowUp?.dominantStrategyDetector?.title ?? null,
  });
  avoidLines.push(suggestedPlan.recommendationLine);

  const outcomePreview = buildOperationPortfolioOutcomePreview({
    day: input.day,
    portfolio,
    resourcePressure,
    playerStyleLabel: input.memoryFollowUp?.dominantStrategyDetector?.title ?? null,
  });

  const hubAlignment = buildHubAlignment({
    hubTodayFocus: input.hubTodayFocus,
    hubPrimaryOperationTitle: input.hubPrimaryOperationTitle ?? primarySlot?.operationName,
    hubPrimaryEventId: input.hubPrimaryEventId ?? input.featuredEventId,
    primarySlotTitle: primarySlot?.operationName,
    boardPrimaryEventId: primarySlot?.cta.eventId ?? input.featuredEventId ?? undefined,
  });

  const pendingSignals = buildPendingSignals(
    visibleItems,
    input.day <= 1 ? MAX_PENDING_DAY1 : MAX_PENDING_RICH,
    slotIds,
  );

  const collectStrings = (): string[] => {
    const raw = [
      hero.boardTitle,
      hero.summaryLine,
      hero.portfolioTone,
      primarySlot?.operationName,
      primarySlot?.deferRiskLine,
      ...secondarySlots.flatMap((slot) => [slot.operationName, slot.deferRiskLine]),
      capacity.summaryLine,
      ...conflicts.signals.map((signal) => signal.line),
      suggestedPlan.recommendationLine,
      outcomePreview.tonePreview,
      ...pendingSignals.map((signal) => signal.label),
    ].filter(Boolean) as string[];

    const seen = new Set<string>();
    return raw.filter((line) => {
      const key = normalizeLine(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    isVisible: input.activeEvents.length > 0 || visibleItems.length > 0 || input.day <= 1,
    isDay1: input.day <= 1,
    isRichDay: input.day >= 8,
    hero,
    primarySlot,
    secondarySlots,
    pendingSignals,
    capacity,
    conflicts,
    suggestedPlan,
    outcomePreview,
    hubAlignment,
    collectStrings,
  };
}

export function auditOperationPortfolioPresentation(
  presentation: OperationPortfolioBoardPresentation,
): string[] {
  const issues: string[] = [];
  const strings = presentation.collectStrings();
  const normalized = strings.map(normalizeLine).filter(Boolean);
  if (new Set(normalized).size !== normalized.length) {
    issues.push('duplicate copy detected');
  }
  if (presentation.isDay1 && presentation.secondarySlots.length > 0) {
    issues.push('day1 should not show secondary slots');
  }
  if (presentation.isDay1 && presentation.conflicts.visible && presentation.conflicts.badgeCount > 1) {
    issues.push('day1 conflict bounded');
  }
  if (presentation.isRichDay && presentation.secondarySlots.length > 2) {
    issues.push('rich day slot overflow');
  }
  if (!presentation.primarySlot && presentation.isVisible && !presentation.isDay1) {
    issues.push('missing primary slot');
  }
  if (presentation.primarySlot) {
    const slot = presentation.primarySlot;
    if (!slot.riskLabel || !slot.priorityBadge || !slot.cta.label || !slot.deferRiskLine) {
      issues.push('primary slot missing required fields');
    }
  }
  if (presentation.outcomePreview.visible && presentation.outcomePreview.chips.length > 3) {
    issues.push('outcome preview chip overflow');
  }
  if (presentation.conflicts.signals.length > 3) {
    issues.push('conflict signal overflow');
  }
  const basicFallback = /^(liste|tablo|özet|durum|bilgi)$/i;
  if (basicFallback.test(presentation.hero.boardTitle)) {
    issues.push('basic fallback hero title');
  }
  return issues;
}

export function operationPortfolioHubAligned(
  presentation: OperationPortfolioBoardPresentation,
): boolean {
  return presentation.hubAlignment.alignedWithHub !== false;
}

export function operationPortfolioHasPrimarySlot(
  presentation: OperationPortfolioBoardPresentation,
): boolean {
  return Boolean(presentation.primarySlot);
}

export function operationPortfolioDeferRiskDeterministic(
  presentation: OperationPortfolioBoardPresentation,
): boolean {
  const slots = [presentation.primarySlot, ...presentation.secondarySlots].filter(
    (slot): slot is NonNullable<typeof slot> => Boolean(slot),
  );
  return slots.every((slot) => slot.deferRiskLine.trim().length > 0);
}

export function operationPortfolioCtaWorkflowSafe(
  presentation: OperationPortfolioBoardPresentation,
): boolean {
  const allowed = /^(İncele|Planla|Devam Et|Yönlendir|Sahaya Geç|Sonucu Gör|Operasyonu İncele|Haritada Gör|Öneriyi Uygula|İzle|Operasyonları Aç)$/i;
  const slotCtas = [presentation.primarySlot, ...presentation.secondarySlots].filter(
    (slot): slot is NonNullable<typeof slot> => Boolean(slot),
  );
  const labels = [
    presentation.hero.cta.label,
    presentation.suggestedPlan.cta.label,
    ...slotCtas.map((slot) => slot.cta.label),
  ];
  return labels.every((label) => allowed.test(label.trim()));
}
