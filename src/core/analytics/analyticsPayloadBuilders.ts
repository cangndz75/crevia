import { getEventAssignment } from '@/core/assignments/assignmentState';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import { getOperationalResourceStatus } from '@/core/operationalResources/operationalResourceState';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { SeasonEndEvaluationModel } from '@/core/seasonEnd/seasonEndTypes';
import type { DecisionResultSummaryTone } from '@/features/events/types/decisionResultTypes';
import {
  buildCommonAnalyticsBase,
  getAnalyticsAccessModeFromGameState,
  type AnalyticsTrackBase,
} from './analyticsRuntime';
import type { AnalyticsPayloadValue } from './analyticsTypes';

export type ResourceStatusBand = 'stable' | 'busy' | 'strained' | 'critical';
export type CrisisRiskBand = 'stable' | 'watch' | 'elevated' | 'critical';
export type AssignmentFitBand = 'weak' | 'steady' | 'strong';
export type AnalyticsResultBand = 'strong' | 'steady' | 'weak' | 'critical';

const SAFE_ID_PATTERN = /^[a-z0-9_]{1,64}$/;

export function sanitizeAnalyticsId(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value.includes('@') || value.includes(' ')) return undefined;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64);
  if (!slug || !SAFE_ID_PATTERN.test(slug)) {
    return undefined;
  }
  return slug;
}

export function sanitizeAnalyticsEventType(
  event: Pick<EventCard, 'eventType' | 'category' | 'districtEventType'>,
): string {
  const raw = event.eventType ?? event.districtEventType ?? event.category ?? 'operations';
  return sanitizeAnalyticsId(raw) ?? 'operations';
}

export function getAssignmentFitBand(score: number): AssignmentFitBand {
  if (score >= 62) return 'strong';
  if (score <= 46) return 'weak';
  return 'steady';
}

export function getAssignmentFitBandFromLabel(
  label: string | undefined,
  score?: number,
): AssignmentFitBand {
  if (label === 'Güçlü uyum') return 'strong';
  if (label === 'Zayıf uyum') return 'weak';
  if (typeof score === 'number') {
    return getAssignmentFitBand(score);
  }
  return 'steady';
}

export function getResourceStatusBand(
  status: 'stable' | 'busy' | 'strained' | 'critical',
): ResourceStatusBand {
  return status;
}

export function getCrisisRiskBand(
  riskLevel: CrisisState['riskLevel'] | undefined,
): CrisisRiskBand {
  if (
    riskLevel === 'stable' ||
    riskLevel === 'watch' ||
    riskLevel === 'elevated' ||
    riskLevel === 'critical'
  ) {
    return riskLevel;
  }
  return 'stable';
}

export function getResultBandFromSummaryTone(
  tone: DecisionResultSummaryTone | undefined,
): AnalyticsResultBand {
  switch (tone) {
    case 'positive':
      return 'strong';
    case 'negative':
      return 'critical';
    case 'mixed':
      return 'steady';
    default:
      return 'steady';
  }
}

export function getRatingBandFromSeasonRating(
  rating: SeasonEndEvaluationModel['overallRating'] | undefined,
): AnalyticsResultBand {
  switch (rating) {
    case 'excellent':
    case 'strong':
      return 'strong';
    case 'steady':
      return 'steady';
    case 'strained':
      return 'weak';
    case 'critical':
      return 'critical';
    default:
      return 'steady';
  }
}

function worstResourceStatus(
  operationalResources: OperationalResourcesState,
): ResourceStatusBand {
  const order: ResourceStatusBand[] = ['stable', 'busy', 'strained', 'critical'];
  let worst: ResourceStatusBand = 'stable';
  const statuses = [
    ...Object.values(operationalResources.personnelGroups).map((g) => g.status),
    ...Object.values(operationalResources.vehicleGroups).map((g) => g.status),
    ...Object.values(operationalResources.containerNetworksByDistrictId ?? {}).map(
      (g) => g.status,
    ),
  ];
  for (const status of statuses) {
    if (order.indexOf(status) > order.indexOf(worst)) {
      worst = status;
    }
  }
  return getResourceStatusBand(worst);
}

export function buildDecisionAnalyticsPayload(
  event: EventCard,
  option: EventDecision,
  gameState: GameState,
  monetization?: MonetizationState,
): AnalyticsTrackBase {
  const districtId =
    sanitizeAnalyticsId(event.neighborhoodId) ??
    sanitizeAnalyticsId(event.districtIds?.[0]) ??
    sanitizeAnalyticsId(event.district);
  return {
    ...buildCommonAnalyticsBase(gameState, 'event_plan', monetization),
    eventType: sanitizeAnalyticsEventType(event),
    eventCategory: sanitizeAnalyticsId(event.category) ?? 'operations',
    districtId,
    decisionType:
      sanitizeAnalyticsId(option.decisionStyle ?? option.style) ?? 'balanced',
    optionId: sanitizeAnalyticsId(option.id) ?? 'unknown_option',
  };
}

export function buildAssignmentAnalyticsPayload(
  event: EventCard,
  assignment: EventAssignmentState | undefined,
  gameState: GameState,
  monetization?: MonetizationState,
): AnalyticsTrackBase {
  const districtId =
    sanitizeAnalyticsId(event.neighborhoodId) ??
    sanitizeAnalyticsId(event.districtIds?.[0]) ??
    sanitizeAnalyticsId(event.district);
  const fitBand = assignment
    ? getAssignmentFitBandFromLabel(
        assignment.compatibilityLabel,
        assignment.compatibilityScore,
      )
    : 'steady';
  return {
    ...buildCommonAnalyticsBase(gameState, 'event_dispatch', monetization),
    eventType: sanitizeAnalyticsEventType(event),
    districtId,
    assignmentFitBand: fitBand,
    optionId: assignment
      ? sanitizeAnalyticsId(assignment.personnelType) ??
        sanitizeAnalyticsId(assignment.approachType)
      : undefined,
  };
}

export function buildResourceAnalyticsPayload(
  operationalResources: OperationalResourcesState,
  _gameState?: GameState,
  _monetization?: MonetizationState,
): Record<string, AnalyticsPayloadValue> {
  void _gameState;
  void _monetization;
  return {
    resourceStatusBand: worstResourceStatus(operationalResources),
  };
}

export function buildCrisisAnalyticsPayload(
  crisisState: Pick<CrisisState, 'riskLevel'>,
  gameState: GameState,
  monetization?: MonetizationState,
  extra: Record<string, AnalyticsPayloadValue> = {},
): AnalyticsTrackBase {
  return {
    ...buildCommonAnalyticsBase(gameState, 'hub', monetization),
    crisisRiskBand: getCrisisRiskBand(crisisState.riskLevel),
    hasCrisisAction: extra.hasCrisisAction,
    ...extra,
  };
}

export function buildSeasonEndAnalyticsPayload(
  model: Pick<SeasonEndEvaluationModel, 'overallRating'> | null | undefined,
  gameState: GameState,
  monetization?: MonetizationState,
): AnalyticsTrackBase {
  const ratingBand = getRatingBandFromSeasonRating(model?.overallRating);
  return {
    ...buildCommonAnalyticsBase(gameState, 'report', monetization),
    ratingBand,
    hasSeasonEnd: Boolean(model),
  };
}

export function buildEventResultAnalyticsPayload(
  event: EventCard | null,
  summaryTone: DecisionResultSummaryTone | undefined,
  gameState: GameState,
  monetization?: MonetizationState,
): AnalyticsTrackBase {
  const districtId = event
    ? sanitizeAnalyticsId(event.neighborhoodId) ??
      sanitizeAnalyticsId(event.districtIds?.[0]) ??
      sanitizeAnalyticsId(event.district)
    : undefined;
  return {
    ...buildCommonAnalyticsBase(gameState, 'event_result', monetization),
    eventType: event ? sanitizeAnalyticsEventType(event) : 'operations',
    districtId,
    resultBand: getResultBandFromSummaryTone(summaryTone),
  };
}

export function resolveAssignmentForEventPayload(
  assignments: { assignmentsByEventId: Record<string, EventAssignmentState> },
  eventId: string,
): EventAssignmentState | undefined {
  return getEventAssignment(assignments, eventId);
}

export function scoreToResourceStatusBand(score: number): ResourceStatusBand {
  return getResourceStatusBand(getOperationalResourceStatus(score));
}

export function getAnalyticsAccessMode(
  gameState: GameState,
  monetization: MonetizationState,
): ReturnType<typeof getAnalyticsAccessModeFromGameState> {
  return getAnalyticsAccessModeFromGameState(gameState, monetization);
}
