import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import type { AdvisorState } from '@/core/advisors/advisorTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { normalizePostPilotOperationState } from '@/core/postPilot';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import type { GameStore } from '@/store/useGameStore';

import {
  ASSIGNMENT_COPY,
  MAX_ASSIGNMENT_REPORT_LINES,
  PERSONNEL_ASSIGNMENT_OPTIONS,
  RESPONSE_APPROACH_OPTIONS,
  VEHICLE_ASSIGNMENT_OPTIONS,
} from './assignmentConstants';
import {
  buildAssignmentImpactPreview,
  calculateAssignmentCompatibility,
  getAssignmentAdvisorComment,
} from './assignmentEngine';
import { getEventAssignment } from './assignmentState';
import type {
  AssignmentEditorModel,
  AssignmentEngineInput,
  AssignmentImpactPreviewModel,
  AssignmentPanelModel,
  AssignmentPresentationTone,
  AssignmentReportModel,
  AssignmentResultSummaryModel,
  AssignmentsState,
  CompatibilityLabel,
  EventAssignmentState,
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from './assignmentTypes';

export function buildAssignmentEngineInputFromStore(state: {
  gameState: GameState;
  operationSignals?: OperationSignalsState;
  advisorState?: AdvisorState;
  dailyOperationsPlan?: DailyOperationsPlanState;
  assignments: AssignmentsState;
  isDay1Tutorial?: boolean;
}): AssignmentEngineInput {
  const postPilot = normalizePostPilotOperationState(
    state.gameState.pilot.postPilotOperation,
    {
      pilotStatus: state.gameState.pilot.status,
      currentPilotDay: state.gameState.pilot.currentPilotDay,
    },
  );
  return {
    gameState: state.gameState,
    operationSignals: state.operationSignals,
    advisorState: state.advisorState,
    dailyOperationsPlan: state.dailyOperationsPlan,
    assignments: state.assignments,
    isDay1Tutorial: state.isDay1Tutorial,
    postPilotLightPhase: postPilot.phase === 'main_operation_light',
  };
}

export type AssignmentEngineStoreSlice = Pick<
  GameStore,
  | 'gameState'
  | 'operationSignals'
  | 'advisorState'
  | 'dailyOperationsPlan'
  | 'assignments'
  | 'tutorialState'
>;

export function buildAssignmentEngineInputFromGameStore(
  store: AssignmentEngineStoreSlice,
): AssignmentEngineInput {
  return buildAssignmentEngineInputFromStore({
    gameState: store.gameState,
    operationSignals: store.operationSignals,
    advisorState: store.advisorState,
    dailyOperationsPlan: store.dailyOperationsPlan,
    assignments: store.assignments,
    isDay1Tutorial: selectIsDay1TutorialEligible(store as GameStore),
  });
}

export function getPersonnelAssignmentLabel(value: PersonnelAssignmentType): string {
  return PERSONNEL_ASSIGNMENT_OPTIONS[value]?.label ?? value;
}

export function getVehicleAssignmentLabel(value: VehicleAssignmentType): string {
  return VEHICLE_ASSIGNMENT_OPTIONS[value]?.label ?? value;
}

export function getResponseApproachLabel(value: ResponseApproachType): string {
  return RESPONSE_APPROACH_OPTIONS[value]?.label ?? value;
}

export function getCompatibilityTone(
  label: CompatibilityLabel,
): AssignmentPresentationTone {
  if (label === 'Güçlü uyum') return 'positive';
  if (label === 'Zayıf uyum') return 'warning';
  return 'neutral';
}

function statusLabel(assignment: EventAssignmentState): string {
  switch (assignment.status) {
    case 'confirmed':
      return ASSIGNMENT_COPY.statusConfirmed;
    case 'dispatched':
      return ASSIGNMENT_COPY.statusDispatched;
    case 'processed':
      return ASSIGNMENT_COPY.statusProcessed;
    default:
      return ASSIGNMENT_COPY.statusDraft;
  }
}

export function buildAssignmentAdvisorLine(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): string {
  return (
    assignment.advisorNote ??
    getAssignmentAdvisorComment(input, event, assignment)
  );
}

export function buildAssignmentPanelModel(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): AssignmentPanelModel {
  const compat = calculateAssignmentCompatibility(input, event, assignment);
  const compact = input.isDay1Tutorial === true;
  const isConfirmed =
    assignment.status === 'confirmed' ||
    assignment.status === 'dispatched' ||
    assignment.status === 'processed';

  return {
    title: ASSIGNMENT_COPY.panelTitle,
    subtitle: ASSIGNMENT_COPY.panelSubtitle,
    statusLabel: statusLabel(assignment),
    compatibilityLabel: compat.label,
    compatibilitySummary: compat.summary,
    rows: [
      {
        key: 'personnel',
        label: 'Ekip',
        value: getPersonnelAssignmentLabel(assignment.personnelType),
        summary: PERSONNEL_ASSIGNMENT_OPTIONS[assignment.personnelType].upside,
        iconKey: 'people',
        tone: PERSONNEL_ASSIGNMENT_OPTIONS[assignment.personnelType].tone,
      },
      {
        key: 'vehicle',
        label: 'Araç',
        value: getVehicleAssignmentLabel(assignment.vehicleType),
        summary: VEHICLE_ASSIGNMENT_OPTIONS[assignment.vehicleType].upside,
        iconKey: 'car',
        tone: VEHICLE_ASSIGNMENT_OPTIONS[assignment.vehicleType].tone,
      },
      {
        key: 'approach',
        label: 'Yaklaşım',
        value: getResponseApproachLabel(assignment.approachType),
        summary: RESPONSE_APPROACH_OPTIONS[assignment.approachType].upside,
        iconKey: 'compass',
        tone: RESPONSE_APPROACH_OPTIONS[assignment.approachType].tone,
      },
    ],
    advisorLine: buildAssignmentAdvisorLine(input, event, {
      ...assignment,
      compatibilityScore: compat.score,
      compatibilityLabel: compat.label,
    }),
    ctaLabel: compact
      ? ASSIGNMENT_COPY.day1CtaLabel
      : isConfirmed
        ? ASSIGNMENT_COPY.updateLabel
        : ASSIGNMENT_COPY.confirmLabel,
    editLabel: ASSIGNMENT_COPY.editLabel,
    compact,
    isConfirmed,
  };
}

export function buildAssignmentEditorModel(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): AssignmentEditorModel {
  const compat = calculateAssignmentCompatibility(input, event, assignment);
  return {
    title: ASSIGNMENT_COPY.editTitle,
    sections: [
      {
        key: 'personnel',
        title: ASSIGNMENT_COPY.personnelSectionTitle,
        options: Object.values(PERSONNEL_ASSIGNMENT_OPTIONS),
      },
      {
        key: 'vehicle',
        title: ASSIGNMENT_COPY.vehicleSectionTitle,
        options: Object.values(VEHICLE_ASSIGNMENT_OPTIONS),
      },
      {
        key: 'approach',
        title: ASSIGNMENT_COPY.approachSectionTitle,
        options: Object.values(RESPONSE_APPROACH_OPTIONS),
      },
    ],
    warningLines: compat.warnings.slice(0, 3),
    strengths: compat.strengths.slice(0, 3),
    confirmLabel: ASSIGNMENT_COPY.confirmLabel,
  };
}

export function buildAssignmentImpactPreviewModel(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment?: EventAssignmentState,
): AssignmentImpactPreviewModel | null {
  if (input.isDay1Tutorial && !assignment) return null;
  const resolved =
    assignment ?? getEventAssignment(input.assignments, event.id);
  if (!resolved) return null;

  const preview = buildAssignmentImpactPreview(input, event, resolved);
  return {
    title: preview.title,
    summary: preview.summary,
    compatibilityLabel: preview.compatibilityLabel,
    tone: preview.tone,
    visible: true,
  };
}

export function buildAssignmentResultSummaryModel(
  input: AssignmentEngineInput,
  event: EventCard,
  assignment: EventAssignmentState,
): AssignmentResultSummaryModel {
  const effectLines = assignment.effects
    .slice(0, 2)
    .map((e) => e.reason)
    .filter(Boolean);
  const fallback =
    assignment.effects[0]?.reason ??
    `${getPersonnelAssignmentLabel(assignment.personnelType)} ataması sahada uygulandı.`;

  return {
    title: ASSIGNMENT_COPY.fieldSummaryTitle,
    lines:
      effectLines.length > 0
        ? effectLines
        : [fallback],
    compatibilityLabel: assignment.compatibilityLabel,
  };
}

const DOMAIN_LABELS: Record<string, string> = {
  personnel: 'personel',
  vehicles: 'filo',
  containers: 'konteyner',
  districts: 'mahalle',
  overall: 'genel operasyon',
};

export function buildAssignmentReportModel(
  input: AssignmentEngineInput,
  report: DailyReport,
): AssignmentReportModel {
  const summary = input.assignments.dailyAssignmentSummary;
  const compact = input.isDay1Tutorial === true;
  const lines: string[] = [];

  if (compact) {
    return {
      title: ASSIGNMENT_COPY.reportTitle,
      lines: [ASSIGNMENT_COPY.day1ReportLine],
      footerNote: ASSIGNMENT_COPY.reportFooter,
      tone: 'neutral',
    };
  }

  if (summary && summary.day === report.day) {
    if (summary.confirmedCount > 0) {
      lines.push(`${summary.confirmedCount} onaylı saha ataması tamamlandı.`);
    }
    if (summary.strongFitCount > 0) {
      lines.push(`${summary.strongFitCount} atama güçlü uyumla sahaya çıktı.`);
    }
    if (summary.weakFitCount > 0) {
      lines.push(`${summary.weakFitCount} atama zayıf uyumla risk taşıdı.`);
    }
    if (summary.dominantDomain) {
      lines.push(
        `En çok etkilenen alan: ${DOMAIN_LABELS[summary.dominantDomain] ?? summary.dominantDomain}.`,
      );
    }
  }

  if (lines.length === 0) {
    lines.push('Bugün saha ataması kaydı sınırlı kaldı.');
  }

  let tone: AssignmentPresentationTone = 'neutral';
  if (summary?.weakFitCount && summary.weakFitCount > summary.strongFitCount) {
    tone = 'warning';
  } else if (summary?.strongFitCount && summary.strongFitCount > 0) {
    tone = 'positive';
  }

  return {
    title: ASSIGNMENT_COPY.reportTitle,
    lines: lines.slice(0, MAX_ASSIGNMENT_REPORT_LINES),
    footerNote: ASSIGNMENT_COPY.reportFooter,
    tone,
  };
}
