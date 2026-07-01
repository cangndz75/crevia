import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import type {
  DecisionArchetypeId,
  DecisionExpectedImpactPreview,
  DecisionPreviewImpactLine,
  DecisionPreviewImpactTone,
  DecisionTradeoffDensityBand,
  TradeoffMeterSegment,
} from '@/features/events/utils/decisionTradeoffTypes';

const PREVIEW_TITLE = 'Beklenen Etki';
const PREVIEW_DISCLAIMER = 'Tahmini sonuç; gerçek etki değişebilir.';

const DIMENSION_LABELS = {
  trust: 'Güven',
  risk: 'Risk',
  resource: 'Kaynak',
  social_pressure: 'Sosyal Baskı',
  team_capacity: 'Ekip Yorgunluğu',
} as const;

type ArchetypeDeltaProfile = {
  trust: number;
  risk: number;
  resource: number;
  social_pressure: number;
  team_capacity: number;
};

const ARCHETYPE_DELTA: Record<DecisionArchetypeId, ArchetypeDeltaProfile> = {
  rapid_response: {
    trust: 6,
    risk: -12,
    resource: -6000,
    social_pressure: -4,
    team_capacity: -2,
  },
  preventive: {
    trust: 2,
    risk: -14,
    resource: -4000,
    social_pressure: 1,
    team_capacity: 0,
  },
  resource_saving: {
    trust: 0,
    risk: 3,
    resource: 2500,
    social_pressure: -2,
    team_capacity: 1,
  },
  social_trust: {
    trust: 8,
    risk: -6,
    resource: -5000,
    social_pressure: -8,
    team_capacity: -1,
  },
  balanced: {
    trust: 3,
    risk: -6,
    resource: -3000,
    social_pressure: -2,
    team_capacity: -1,
  },
};

const STRATEGY_DELTA_MOD: Record<EventPlanStrategyId, number> = {
  rapid_response: 1.1,
  balanced_plan: 1,
  long_term_fix: 0.95,
};

function riskLevelMultiplier(event: EventCard): number {
  switch (event.riskLevel) {
    case 'critical':
      return 1.35;
    case 'high':
      return 1.15;
    case 'low':
      return 0.85;
    default:
      return 1;
  }
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatResource(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const rounded = Math.round(value / 100) / 10;
    return `${rounded > 0 ? '+' : ''}${rounded}K`;
  }
  return formatSigned(value);
}

function toneForValue(value: number, invert = false): DecisionPreviewImpactTone {
  const effective = invert ? -value : value;
  if (effective >= 3) return 'positive';
  if (effective <= -3) return 'negative';
  if (effective <= -1) return 'warning';
  return 'neutral';
}

function clampDelta(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scaleArchetypeDelta(
  profile: ArchetypeDeltaProfile,
  multiplier: number,
): ArchetypeDeltaProfile {
  return {
    trust: clampDelta(profile.trust * multiplier, -20, 20),
    risk: clampDelta(profile.risk * multiplier, -25, 25),
    resource: clampDelta(profile.resource * multiplier, -15000, 8000),
    social_pressure: clampDelta(profile.social_pressure * multiplier, -15, 15),
    team_capacity: clampDelta(profile.team_capacity * multiplier, -8, 8),
  };
}

function resolveTrustDelta(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): number {
  if (decision) {
    const trust =
      (decision.effects.publicSatisfaction ?? 0) + (decision.effects.trust ?? 0);
    if (trust !== 0) return clampDelta(trust, -20, 20);
  }
  const preview = event.previewEffects?.publicSatisfaction ?? 0;
  if (preview <= -6) return clampDelta(scaled.trust * 1.15, -20, 20);
  return scaled.trust;
}

function resolveRiskDelta(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): number {
  if (decision && decision.effects.risk !== 0) {
    return clampDelta(decision.effects.risk, -25, 25);
  }
  const previewRisk = event.previewEffects?.risk ?? 0;
  if (previewRisk >= 3) return clampDelta(scaled.risk * 1.1, -25, 25);
  return scaled.risk;
}

function resolveResourceDelta(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): number {
  if (decision) {
    const budget = decision.effects.budget ?? 0;
    const cost = decision.costs?.budget ?? 0;
    if (budget !== 0) return clampDelta(budget, -15000, 8000);
    if (cost > 0) return clampDelta(-cost, -15000, 8000);
  }
  return scaled.resource;
}

function resolveSocialPressureDelta(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): number {
  if (decision && decision.effects.publicSatisfaction !== 0) {
    return clampDelta(-decision.effects.publicSatisfaction * 0.8, -15, 15);
  }
  const preview = event.previewEffects?.publicSatisfaction ?? 0;
  if (preview < 0) return clampDelta(scaled.social_pressure * 1.1, -15, 15);
  return scaled.social_pressure;
}

function resolveTeamCapacityDelta(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): number {
  if (decision) {
    const morale =
      (decision.effects.morale ?? 0) + (decision.effects.staffMorale ?? 0);
    const hours = decision.costs?.staffHours ?? 0;
    if (morale !== 0) return clampDelta(-morale, -8, 8);
    if (hours > 0) return clampDelta(hours, 1, 8);
  }
  return scaled.team_capacity;
}

function buildImpactLine(
  id: DecisionPreviewImpactLine['id'],
  value: number,
  formatter: (n: number) => string = formatSigned,
  invertTone = false,
): DecisionPreviewImpactLine | null {
  if (value === 0) return null;
  return {
    id,
    label: DIMENSION_LABELS[id],
    valueText: formatter(value),
    tone: toneForValue(value, invertTone),
    visible: true,
  };
}

function deriveDistrictSideEffect(
  event: EventCard,
  archetypeId: DecisionArchetypeId,
  riskDelta: number,
): string | null {
  const district = event.district?.trim() || 'Mahalle';
  if (archetypeId === 'preventive') {
    const bump = clampDelta(Math.abs(riskDelta) * 0.25 + 2, 2, 6);
    return `Yan Etki: ${district}'de gecikme riski +${bump}`;
  }
  if (archetypeId === 'resource_saving' && riskDelta >= 0) {
    const bump = clampDelta(riskDelta + 2, 2, 5);
    return `Yan Etki: ${district}'de tepki riski +${bump}`;
  }
  if (archetypeId === 'rapid_response' && riskDelta <= -8) {
    return `Yan Etki: ${district}'de kaynak yorgunluğu +2`;
  }
  return null;
}

function buildLines(
  event: EventCard,
  decision: EventDecision | undefined,
  scaled: ArchetypeDeltaProfile,
): DecisionPreviewImpactLine[] {
  const lines: DecisionPreviewImpactLine[] = [];
  const trust = buildImpactLine('trust', resolveTrustDelta(event, decision, scaled));
  const risk = buildImpactLine('risk', resolveRiskDelta(event, decision, scaled));
  const resource = buildImpactLine(
    'resource',
    resolveResourceDelta(event, decision, scaled),
    formatResource,
  );
  const social = buildImpactLine(
    'social_pressure',
    resolveSocialPressureDelta(event, decision, scaled),
  );
  const team = buildImpactLine(
    'team_capacity',
    resolveTeamCapacityDelta(event, decision, scaled),
  );

  for (const line of [trust, risk, resource, social, team]) {
    if (line) lines.push(line);
  }
  return lines;
}

export function buildDecisionExpectedImpactPreview(input: {
  event: EventCard;
  archetypeId: DecisionArchetypeId;
  decision?: EventDecision;
  strategyId?: EventPlanStrategyId;
  densityBand?: DecisionTradeoffDensityBand;
}): DecisionExpectedImpactPreview {
  const multiplier =
    riskLevelMultiplier(input.event) *
    (input.strategyId ? STRATEGY_DELTA_MOD[input.strategyId] : 1);
  const scaled = scaleArchetypeDelta(ARCHETYPE_DELTA[input.archetypeId], multiplier);
  const lines = buildLines(input.event, input.decision, scaled);
  const riskDelta = resolveRiskDelta(input.event, input.decision, scaled);
  const sideEffectLine = deriveDistrictSideEffect(
    input.event,
    input.archetypeId,
    riskDelta,
  );

  const maxLines = input.densityBand === 'day1' ? 3 : 5;
  const visibleLines = lines.slice(0, maxLines);

  return {
    title: PREVIEW_TITLE,
    disclaimer: PREVIEW_DISCLAIMER,
    lines: visibleLines,
    sideEffectLine,
    visibleCount: visibleLines.length,
  };
}

export function expectedImpactToTradeoffMeter(
  preview: DecisionExpectedImpactPreview,
): TradeoffMeterSegment[] {
  const directionFor = (tone: DecisionPreviewImpactTone): TradeoffMeterSegment['direction'] => {
    if (tone === 'positive') return 'up';
    if (tone === 'negative' || tone === 'warning') return 'down';
    return 'steady';
  };

  const emphasisFor = (line: DecisionPreviewImpactLine): TradeoffMeterSegment['emphasis'] => {
    const abs = Math.abs(Number.parseInt(line.valueText.replace(/[^-\d]/g, ''), 10) || 0);
    if (abs >= 8) return 'strong';
    if (abs >= 3) return 'medium';
    return 'light';
  };

  const dimensionMap: Record<
    DecisionPreviewImpactLine['id'],
    TradeoffMeterSegment['dimensionId']
  > = {
    trust: 'trust',
    risk: 'tomorrow_risk',
    resource: 'resource',
    social_pressure: 'patience',
    team_capacity: 'readiness',
  };

  return preview.lines.slice(0, 4).map((line) => ({
    dimensionId: dimensionMap[line.id],
    label: line.label,
    direction: directionFor(line.tone),
    emphasis: emphasisFor(line),
  }));
}
