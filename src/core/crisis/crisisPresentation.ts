import type { DailyReport } from '@/core/models/DailyReport';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';

import { BALANCE_COPY } from '@/core/balance/gameplayImpactConstants';

import { CRISIS_ACCESS_COPY, CRISIS_UI_COPY } from './crisisConstants';
import {
  buildCrisisEngineInput,
  calculateCrisisImpactPreview,
  deriveCrisisAccessMode,
  deriveCrisisStateFromGameState,
  getCrisisAdvisorComment,
} from './crisisEngine';
import { getCrisisRiskLabel } from './crisisState';
import type {
  CrisisDeskHubModel,
  CrisisEngineInput,
  CrisisImpactPreview,
  CrisisReportSummary,
  CrisisRiskLevel,
  CrisisState,
} from './crisisTypes';

export function getCrisisTone(
  level: CrisisRiskLevel,
): 'positive' | 'neutral' | 'warning' | 'critical' {
  switch (level) {
    case 'stable':
      return 'positive';
    case 'watch':
      return 'neutral';
    case 'elevated':
      return 'warning';
    default:
      return 'critical';
  }
}

export function getCrisisDomainIconKey(domain: string): string {
  switch (domain) {
    case 'districts':
      return 'location';
    case 'vehicles':
      return 'car';
    case 'containers':
      return 'trash';
    case 'assignments':
      return 'people';
    case 'social':
      return 'chatbubble';
    default:
      return 'pulse';
  }
}

function buildInput(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
  extras?: Partial<CrisisEngineInput>,
): CrisisEngineInput {
  return buildCrisisEngineInput({
    gameState,
    monetization,
    crisisState,
    ...extras,
  });
}

export function shouldShowCrisisHubCard(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return false;
  }
  if (gameState.pilot.status !== 'completed') {
    return false;
  }
  const mode = deriveCrisisAccessMode(gameState, monetization);
  return mode === 'active' || mode === 'limited_preview';
}

export function buildCrisisDeskHubModel(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
  options?: { compact?: boolean },
): CrisisDeskHubModel | undefined {
  if (!shouldShowCrisisHubCard(gameState, monetization)) {
    return undefined;
  }

  const input = buildInput(gameState, monetization, crisisState);
  const state = deriveCrisisStateFromGameState(input);
  const accessMode = state.accessMode;

  const signalRows = state.recentSignals.slice(0, 2).map((sig) => ({
    id: sig.id,
    title: sig.title,
    summary: sig.summary,
    tone: getCrisisTone(sig.riskLevel),
    iconKey: getCrisisDomainIconKey(sig.domain),
  }));

  return {
    title: CRISIS_UI_COPY.hubTitle,
    subtitle: CRISIS_UI_COPY.hubSubtitle,
    accessLabel: CRISIS_ACCESS_COPY[accessMode],
    riskLabel: getCrisisRiskLabel(state.riskLevel),
    riskScoreLabel: `Şehir baskısı ${state.cityCrisisScore}`,
    activeIncidentTitle: state.activeIncident?.title,
    activeIncidentSummary: state.activeIncident?.summary,
    signalRows,
    footerNote: CRISIS_UI_COPY.hubFooter,
    compact: options?.compact ?? false,
    visible: true,
  };
}

export function buildCrisisDeskReportModel(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
  _report?: DailyReport,
): CrisisReportSummary | undefined {
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return undefined;
  }

  const input = buildInput(gameState, monetization, crisisState);
  const state = deriveCrisisStateFromGameState(input);
  const accessMode = state.accessMode;

  if (accessMode === 'inactive') {
    return undefined;
  }

  if (accessMode === 'limited_preview') {
    return {
      title: CRISIS_UI_COPY.reportTitle,
      lines: [CRISIS_ACCESS_COPY.limited_preview],
      footerNote: '',
      tone: 'neutral',
    };
  }

  const lines: string[] = [];
  if (state.activeIncident) {
    lines.push(state.activeIncident.reportLine ?? state.activeIncident.summary);
  } else if (state.riskLevel === 'stable' || state.riskLevel === 'watch') {
    lines.push('Şehir baskısı izleme seviyesinde kaldı.');
  } else {
    lines.push(`Şehir baskısı: ${getCrisisRiskLabel(state.riskLevel)}.`);
  }

  for (const sig of state.recentSignals.slice(0, 2)) {
    if (lines.length >= 3) break;
    lines.push(sig.title);
  }

  if (
    state.riskLevel === 'stable' &&
    (input.assignments?.dailyAssignmentSummary?.strongFitCount ?? 0) > 0
  ) {
    lines.push(BALANCE_COPY.crisisPreventiveReduced);
  }

  if (
    (input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0) > 0 &&
    state.riskLevel !== 'stable'
  ) {
    lines.push(BALANCE_COPY.crisisMonitorCarry);
  }

  if (input.dailyOperationsPlan?.vehicleFocus === 'preventive_maintenance') {
    lines.push(BALANCE_COPY.crisisPreventiveReduced);
  }

  return {
    title: CRISIS_UI_COPY.reportTitle,
    lines: lines.slice(0, 3),
    footerNote: CRISIS_UI_COPY.reportFooter,
    tone: getCrisisTone(state.riskLevel),
  };
}

export function buildCrisisImpactPreviewModel(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
  extras: Partial<CrisisEngineInput> & {
    event?: EventCard;
    decision?: EventDecision;
    assignment?: EventAssignmentState;
  },
): (CrisisImpactPreview & { visible: boolean; summary: string }) | undefined {
  const input = buildInput(gameState, monetization, crisisState, extras);
  const preview = calculateCrisisImpactPreview(
    input,
    extras.event,
    extras.decision,
    extras.assignment,
  );
  if (!preview) {
    return undefined;
  }
  return {
    ...preview,
    visible: true,
    summary: `${CRISIS_UI_COPY.impactPrefix} ${preview.summary}`,
  };
}

export function buildCrisisAdvisorNoteModel(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
  advisorLevel: 1 | 2 | 3 = 2,
): { title: string; body: string; tone: string } | undefined {
  const body = getCrisisAdvisorComment(
    buildInput(gameState, monetization, crisisState),
    advisorLevel,
  );
  if (!body) {
    return undefined;
  }
  return {
    title: CRISIS_UI_COPY.hubTitle,
    body,
    tone: getCrisisTone(crisisState.riskLevel),
  };
}

export function collectCrisisUiStrings(
  gameState: GameState,
  monetization: MonetizationState,
  crisisState: CrisisState,
): string[] {
  const hub = buildCrisisDeskHubModel(gameState, monetization, crisisState);
  const report = buildCrisisDeskReportModel(gameState, monetization, crisisState);
  return [
    hub?.title ?? '',
    hub?.accessLabel ?? '',
    hub?.footerNote ?? '',
    report?.title ?? '',
    ...(report?.lines ?? []),
    report?.footerNote ?? '',
  ].filter(Boolean);
}

export { getCrisisRiskLabel };
