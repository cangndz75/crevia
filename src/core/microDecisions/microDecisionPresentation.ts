import type { EventCard } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';

import { MICRO_DECISION_FOOTER_NOTES, MICRO_DECISION_TYPE_LABELS } from './microDecisionConstants';
import {
  buildMicroDecisionEngineInputFromStore,
  getMicroDecisionAdvisorLine,
} from './microDecisionEngine';
import { getActiveMicroDecisions } from './microDecisionState';
import type {
  ActiveMicroDecisionsModel,
  MicroDecision,
  MicroDecisionCardModel,
  MicroDecisionEngineInput,
  MicroDecisionImpactPreviewModel,
  MicroDecisionReportModel,
  MicroDecisionTone,
  MicroDecisionDomain,
  MicroDecisionType,
} from './microDecisionTypes';

export function getMicroDecisionTypeLabel(type: MicroDecisionType): string {
  return MICRO_DECISION_TYPE_LABELS[type];
}

export function getMicroDecisionTone(decision: MicroDecision): MicroDecisionTone {
  switch (decision.type) {
    case 'advisor_warning':
      return 'neutral';
    case 'field_update':
      return 'neutral';
    case 'crisis_threshold':
      return 'warning';
    case 'district_representative':
      return 'warning';
    case 'operation_opportunity':
      return 'positive';
    default:
      return 'neutral';
  }
}

export function getMicroDecisionDomainIconKey(domain: MicroDecisionDomain): string {
  switch (domain) {
    case 'personnel':
      return 'people';
    case 'vehicles':
      return 'car';
    case 'containers':
      return 'trash';
    case 'districts':
    case 'social':
      return 'location';
    case 'crisis':
      return 'alert-circle';
    case 'assignments':
      return 'git-branch';
    case 'planning':
      return 'calendar';
    case 'season':
      return 'flag';
    default:
      return 'pulse';
  }
}

export function buildMicroDecisionAdvisorLine(
  input: MicroDecisionEngineInput,
  decision: MicroDecision,
): string {
  return decision.advisorLine ?? getMicroDecisionAdvisorLine(input, decision);
}

export function buildMicroDecisionCardModel(
  input: MicroDecisionEngineInput,
  decision: MicroDecision,
  options?: { compact?: boolean },
): MicroDecisionCardModel {
  const compact = options?.compact ?? false;
  const tone = getMicroDecisionTone(decision);
  return {
    id: decision.id,
    title: decision.title,
    typeLabel: getMicroDecisionTypeLabel(decision.type),
    summary: decision.summary,
    reasonLine: decision.reasonLine,
    advisorLine: buildMicroDecisionAdvisorLine(input, decision),
    tone,
    iconKey: getMicroDecisionDomainIconKey(decision.domain),
    optionRows: decision.options.map((o) => ({
      id: o.id,
      label: o.label,
      description: o.description,
      upside: o.upside,
      tradeoff: o.tradeoff,
      tone: o.tone,
    })),
    footerNote: MICRO_DECISION_FOOTER_NOTES.default,
    compact,
  };
}

export function buildActiveMicroDecisionsModel(
  input: MicroDecisionEngineInput,
  options?: { compact?: boolean },
): ActiveMicroDecisionsModel | undefined {
  const ctx = input;
  const active = getActiveMicroDecisions(input.microDecisionState).slice(0, 2);
  if (active.length === 0) return undefined;
  return {
    title: 'Canlı Operasyon',
    subtitle: 'Gün içi saha sinyalleri',
    decisions: active.map((d) =>
      buildMicroDecisionCardModel(ctx, d, { compact: options?.compact }),
    ),
  };
}

export function buildMicroDecisionReportModel(
  input: MicroDecisionEngineInput,
  closingDay: number,
): MicroDecisionReportModel | undefined {
  const summary = input.microDecisionState.dailySummary;
  if (!summary || summary.day !== closingDay) return undefined;
  const hasActivity =
    summary.resolvedCount > 0 || summary.skippedCount > 0;
  if (!hasActivity) return undefined;

  const lines =
    summary.reportLines.length > 0
      ? summary.reportLines
      : summary.resolvedCount === 0
        ? []
        : ['Gün içi canlı operasyon kararı alındı.'];

  if (lines.length === 0) return undefined;

  return {
    title: 'Canlı Operasyon Kararları',
    lines: lines.slice(0, 3),
    footerNote: MICRO_DECISION_FOOTER_NOTES.advisor,
    tone: summary.resolvedCount > 0 ? 'positive' : 'neutral',
  };
}

export function buildMicroDecisionImpactPreviewModel(
  input: MicroDecisionEngineInput,
  event?: EventCard,
  _assignment?: EventAssignmentState,
): MicroDecisionImpactPreviewModel | undefined {
  if (!event) return undefined;
  const related = getActiveMicroDecisions(input.microDecisionState).find(
    (d) => d.relatedEventId === event.id,
  );
  if (!related) return undefined;
  if (related.domain !== 'vehicles' && related.type !== 'field_update') {
    return undefined;
  }
  return {
    line: 'Canlı operasyon: Ece bu kararın araç baskısını etkileyebileceğini izliyor.',
    tone: 'warning',
  };
}

export function buildMicroDecisionPresentationInput(
  store: Parameters<typeof buildMicroDecisionEngineInputFromStore>[0],
): MicroDecisionEngineInput {
  return buildMicroDecisionEngineInputFromStore(store);
}

export function microDecisionTextContainsForbiddenWords(text: string): boolean {
  const lower = text.toLowerCase();
  return ['xp', 'premium', 'satın al', 'kilitli'].some((w) => lower.includes(w));
}
