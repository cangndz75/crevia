import { resolveXpDistrictType } from '@/core/xp/districtBonus';
import { mergeDistrictBonusFlags } from '@/core/xp/mergeDistrictBonusFlags';
import type {
  DistrictBonusFlags,
  EventSeverity,
  EventXpBreakdownInput,
  XpDistrictType,
} from '@/core/xp/types';

/** Adapter girdileri — mevcut event/decision tiplerini genişletmeye gerek yok. */
export type XpEventLike = {
  id: string;
  title?: string;
  name?: string;
  severity?: EventSeverity;
  riskLevel?: EventSeverity;
  priority?: string | number;
  isCritical?: boolean;
  urgency?: number;
  urgencyHours?: number;
  districtType?: XpDistrictType;
  districtId?: string;
  districtIds?: string[];
  district?: string;
  expectedBudget?: number;
  expectedCost?: number;
  filterTags?: string[];
  /** District engine — event seviyesi mahalle ipuçları. */
  districtBonusHints?: DistrictBonusFlags;
};

export type XpDecisionLike = {
  id?: string;
  expectedBudget?: number;
  expectedCost?: number;
  cost?: number;
  districtBonusFlags?: DistrictBonusFlags;
};

export type XpDecisionResultLike = {
  satisfactionDelta?: number;
  publicSatisfactionDelta?: number;
  riskDelta?: number;
  operationRiskDelta?: number;
  budgetSpent?: number;
  cost?: number;
  expectedBudget?: number;
  expectedCost?: number;
  staffFatigueDelta?: number;
  personnelFatigueDelta?: number;
  vehicleConditionDelta?: number;
  districtBonusFlags?: DistrictBonusFlags;
  effects?: Record<string, unknown>;
};

export type XpDistrictLike = {
  id?: string;
  type?: XpDistrictType;
};

export type MapDecisionResultToXpInputParams = {
  day: number;
  event: XpEventLike;
  decision?: XpDecisionLike;
  decisionResult: XpDecisionResultLike;
  district?: XpDistrictLike;
  dailyGoalCompleted?: boolean;
  butterflyPositive?: boolean;
  tutorialBonus?: boolean;
};

const DEFAULT_EXPECTED_BUDGET = 5000;
const DEFAULT_DISTRICT_TYPE: XpDistrictType = 'merkez';

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function resolveEventSeverity(event: XpEventLike): EventSeverity {
  if (event.severity) {
    return event.severity;
  }
  if (event.riskLevel) {
    return event.riskLevel;
  }

  const priority = event.priority;
  if (priority === 'critical') {
    return 'critical';
  }
  if (priority === 'high') {
    return 'high';
  }
  if (event.isCritical === true) {
    return 'high';
  }

  if (event.filterTags?.includes('crisis')) {
    return 'critical';
  }
  if (event.filterTags?.includes('urgent')) {
    return 'high';
  }

  const urgency = event.urgency ?? event.urgencyHours;
  if (urgency != null) {
    if (urgency >= 80) return 'critical';
    if (urgency >= 60) return 'high';
    if (urgency >= 30) return 'medium';
  }

  return 'medium';
}

/**
 * districtType netleşince DEFAULT_DISTRICT_TYPE fallback kaldırılabilir.
 * Şimdilik çözülemeyen mahalleler Merkez kurallarıyla hesaplanır.
 */
export function resolveDistrictForXp(
  event: XpEventLike,
  district?: XpDistrictLike,
): { districtId?: string; districtType: XpDistrictType } {
  if (event.districtType) {
    return { districtId: event.districtId, districtType: event.districtType };
  }
  if (district?.type) {
    return { districtId: district.id, districtType: district.type };
  }

  const candidates = [
    event.districtId,
    event.districtIds?.[0],
    district?.id,
    event.district,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const resolved = resolveXpDistrictType(candidate);
    if (resolved) {
      return { districtId: candidate, districtType: resolved };
    }
  }

  return { districtId: district?.id ?? event.districtId, districtType: DEFAULT_DISTRICT_TYPE };
}

function resolveEventTitle(event: XpEventLike): string {
  return event.title ?? event.name ?? 'Olay çözüldü';
}

function resolveBudgetSpent(
  decisionResult: XpDecisionResultLike,
  decision?: XpDecisionLike,
): number {
  return (
    decisionResult.budgetSpent ??
    decisionResult.cost ??
    decision?.cost ??
    0
  );
}

function resolveExpectedBudget(
  event: XpEventLike,
  decision: XpDecisionLike | undefined,
  decisionResult: XpDecisionResultLike,
  budgetSpent: number,
): number {
  return (
    decisionResult.expectedBudget ??
    decisionResult.expectedCost ??
    event.expectedBudget ??
    event.expectedCost ??
    decision?.expectedBudget ??
    decision?.expectedCost ??
    (budgetSpent > 0 ? Math.round(budgetSpent * 1.2) : DEFAULT_EXPECTED_BUDGET)
  );
}

function resolveSatisfactionDelta(decisionResult: XpDecisionResultLike): number {
  const effects = decisionResult.effects;
  return (
    decisionResult.satisfactionDelta ??
    decisionResult.publicSatisfactionDelta ??
    readNumber(effects?.satisfaction) ??
    readNumber(effects?.publicSatisfaction) ??
    0
  );
}

function resolveRiskDelta(decisionResult: XpDecisionResultLike): number {
  const effects = decisionResult.effects;
  return (
    decisionResult.riskDelta ??
    decisionResult.operationRiskDelta ??
    readNumber(effects?.risk) ??
    0
  );
}

function resolveStaffFatigueDelta(decisionResult: XpDecisionResultLike): number {
  const effects = decisionResult.effects;
  return (
    decisionResult.staffFatigueDelta ??
    decisionResult.personnelFatigueDelta ??
    readNumber(effects?.staffFatigue) ??
    0
  );
}

function resolveVehicleConditionDelta(
  decisionResult: XpDecisionResultLike,
): number | undefined {
  const effects = decisionResult.effects;
  return (
    decisionResult.vehicleConditionDelta ??
    readNumber(effects?.vehicleCondition)
  );
}

function mapEffectsToDistrictFlags(
  effects?: Record<string, unknown>,
): DistrictBonusFlags {
  if (!effects) {
    return {};
  }

  return {
    resolvedQuickly: readBoolean(effects.resolvedQuickly),
    socialRiskPrevented: readBoolean(effects.socialRiskPrevented),
    trafficReduced: readBoolean(effects.trafficReduced),
    vehicleBreakdownPrevented: readBoolean(effects.vehicleBreakdownPrevented),
    publicTrustProtected: readBoolean(effects.publicTrustProtected),
    crowdControlled: readBoolean(effects.crowdControlled),
    parkOrderProtected: readBoolean(effects.parkOrderProtected),
  };
}

export function mapDecisionResultToXpInput(
  params: MapDecisionResultToXpInputParams,
): EventXpBreakdownInput {
  const { event, decision, decisionResult, district, day } = params;
  const budgetSpent = resolveBudgetSpent(decisionResult, decision);
  const { districtId, districtType } = resolveDistrictForXp(event, district);
  const fromEffects = mapEffectsToDistrictFlags(decisionResult.effects);

  return {
    day,
    eventId: event.id,
    eventTitle: resolveEventTitle(event),
    severity: resolveEventSeverity(event),
    districtId,
    districtType,
    satisfactionDelta: resolveSatisfactionDelta(decisionResult),
    riskDelta: resolveRiskDelta(decisionResult),
    budgetSpent,
    expectedBudget: resolveExpectedBudget(
      event,
      decision,
      decisionResult,
      budgetSpent,
    ),
    staffFatigueDelta: resolveStaffFatigueDelta(decisionResult),
    vehicleConditionDelta: resolveVehicleConditionDelta(decisionResult),
    districtBonusFlags: mergeDistrictBonusFlags(
      fromEffects,
      event.districtBonusHints,
      decisionResult.districtBonusFlags,
      decision?.districtBonusFlags,
    ),
    dailyGoalCompleted: params.dailyGoalCompleted,
    butterflyPositive: params.butterflyPositive,
    tutorialBonus: params.tutorialBonus,
  };
}
