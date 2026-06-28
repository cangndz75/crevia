import type { EventCard } from '@/core/models/EventCard';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import {
  ARCHETYPE_BADGE_LABELS,
  PLAN_STRATEGY_TO_ARCHETYPE,
  type ContextFitBadge,
  type ContextFitBadgeTone,
  type DecisionArchetypeId,
} from '@/features/events/utils/decisionTradeoffTypes';

export type DecisionContextSignals = {
  severityScore: number;
  districtTrustLow: boolean;
  socialPulseHigh: boolean;
  resourcePressure: boolean;
  readinessLow: boolean;
  moraleLow: boolean;
  recurringEvent: boolean;
  operationsToday: number;
};

export type BuildContextFitInput = {
  event: EventCard;
  day?: number;
  operationsToday?: number;
  readinessScore?: number;
  moraleScore?: number;
};

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveSeverityScore(event: EventCard): number {
  switch (event.riskLevel) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 2;
  }
}

function hasResourcePressure(event: EventCard): boolean {
  return event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 0 ||
      (costs.staffHours ?? 0) > 0 ||
      (costs.vehicleUsage ?? 0) > 0
    );
  });
}

export function buildDecisionContextSignals(input: BuildContextFitInput): DecisionContextSignals {
  const { event } = input;
  const socialPulseHigh = (event.previewEffects?.publicSatisfaction ?? 0) <= -5;
  return {
    severityScore: resolveSeverityScore(event),
    districtTrustLow: socialPulseHigh,
    socialPulseHigh,
    resourcePressure: hasResourcePressure(event),
    readinessLow: (input.readinessScore ?? 70) < 45,
    moraleLow: (input.moraleScore ?? 70) < 45,
    recurringEvent: (event.urgencyHours ?? 0) >= 6 && event.riskLevel !== 'critical',
    operationsToday: input.operationsToday ?? 1,
  };
}

type FitScore = {
  archetypeId: DecisionArchetypeId;
  score: number;
  risky: boolean;
};

function scoreArchetype(
  archetypeId: DecisionArchetypeId,
  signals: DecisionContextSignals,
): FitScore {
  let score = 50;
  let risky = false;

  switch (archetypeId) {
    case 'rapid_response':
      if (signals.severityScore >= 3) score += 28;
      if (signals.socialPulseHigh) score += 18;
      if (signals.districtTrustLow) score += 12;
      if (signals.resourcePressure) {
        score -= 14;
        risky = true;
      }
      if (signals.readinessLow) {
        score -= 16;
        risky = true;
      }
      break;
    case 'preventive':
      if (signals.recurringEvent) score += 24;
      if (signals.readinessLow) score += 16;
      if (signals.severityScore >= 4) {
        score -= 18;
        risky = true;
      }
      if (signals.socialPulseHigh && signals.severityScore >= 3) {
        score -= 12;
        risky = true;
      }
      break;
    case 'resource_saving':
      if (signals.resourcePressure) score += 26;
      if (signals.operationsToday >= 2) score += 14;
      if (signals.severityScore >= 3) {
        score -= 20;
        risky = true;
      }
      if (signals.socialPulseHigh) {
        score -= 10;
        risky = true;
      }
      break;
    case 'social_trust':
      if (signals.districtTrustLow) score += 30;
      if (signals.socialPulseHigh) score += 22;
      if (signals.resourcePressure) {
        score -= 12;
        risky = true;
      }
      break;
    case 'balanced':
      if (signals.severityScore === 2) score += 18;
      if (signals.severityScore >= 4) score -= 10;
      if (signals.resourcePressure && signals.socialPulseHigh) score += 8;
      break;
    default:
      break;
  }

  return {
    archetypeId,
    score: clampScore(score, 0, 100),
    risky,
  };
}

function mapScoreToBadge(
  fit: FitScore,
  signals: DecisionContextSignals,
): ContextFitBadge | null {
  if (fit.risky && fit.score < 45) {
    return { id: 'risky', label: 'Riskli seçim', tone: 'risky_choice' };
  }
  if (fit.score >= 72) {
    return { id: 'strong', label: 'Güçlü eşleşme', tone: 'strong_match' };
  }
  if (fit.archetypeId === 'resource_saving' && signals.resourcePressure && fit.score >= 58) {
    return { id: 'resource', label: 'Kaynak dostu', tone: 'resource_friendly' };
  }
  if (fit.archetypeId === 'social_trust' && signals.socialPulseHigh && fit.score >= 58) {
    return { id: 'social', label: 'Sosyal olarak güçlü', tone: 'social_strong' };
  }
  if (fit.archetypeId === 'preventive' && signals.recurringEvent && fit.score >= 55) {
    return { id: 'tomorrow', label: 'Yarın riski düşük', tone: 'tomorrow_risk' };
  }
  if (fit.archetypeId === 'rapid_response' && signals.readinessLow) {
    return { id: 'tomorrow-risk', label: 'Yarın riski var', tone: 'tomorrow_risk' };
  }
  if (fit.score >= 55) {
    return { id: 'fit', label: 'Uygun koşul', tone: 'neutral' };
  }
  return null;
}

export function resolveContextFitBadgeForPlanStrategy(
  strategyId: EventPlanStrategyId,
  input: BuildContextFitInput,
): ContextFitBadge | null {
  const signals = buildDecisionContextSignals(input);
  const archetypeId = PLAN_STRATEGY_TO_ARCHETYPE[strategyId];
  const fit = scoreArchetype(archetypeId, signals);
  return mapScoreToBadge(fit, signals);
}

export function resolveContextFitBadgeForArchetype(
  archetypeId: DecisionArchetypeId,
  input: BuildContextFitInput,
): ContextFitBadge | null {
  const signals = buildDecisionContextSignals(input);
  const fit = scoreArchetype(archetypeId, signals);
  return mapScoreToBadge(fit, signals);
}

export function comparePlanStrategyFit(
  strategyA: EventPlanStrategyId,
  strategyB: EventPlanStrategyId,
  input: BuildContextFitInput,
): number {
  const signals = buildDecisionContextSignals(input);
  const scoreA = scoreArchetype(PLAN_STRATEGY_TO_ARCHETYPE[strategyA], signals).score;
  const scoreB = scoreArchetype(PLAN_STRATEGY_TO_ARCHETYPE[strategyB], signals).score;
  return scoreA - scoreB;
}

export function archetypeLabel(archetypeId: DecisionArchetypeId): string {
  return ARCHETYPE_BADGE_LABELS[archetypeId];
}

export function contextFitToneLabel(tone: ContextFitBadgeTone): string {
  switch (tone) {
    case 'strong_match':
      return 'Güçlü eşleşme';
    case 'risky_choice':
      return 'Riskli seçim';
    case 'resource_friendly':
      return 'Kaynak dostu';
    case 'social_strong':
      return 'Sosyal olarak güçlü';
    case 'tomorrow_risk':
      return 'Yarın riski';
    default:
      return 'Uygun koşul';
  }
}
