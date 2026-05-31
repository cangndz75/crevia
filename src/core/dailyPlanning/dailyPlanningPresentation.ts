import { KNOWN_DISTRICT_IDS } from '@/core/operations/operationSignalConstants';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';

import {
  DAILY_CONTAINER_FOCUS_OPTIONS,
  DAILY_PERSONNEL_FOCUS_OPTIONS,
  DAILY_PLANNING_COPY,
  DAILY_PLAN_STATUS_LABELS,
  DAILY_VEHICLE_FOCUS_OPTIONS,
  MAX_PLAN_REPORT_LINES,
} from './dailyPlanningConstants';
import {
  buildDailyPlanImpactPreview,
  getDailyPlanAdvisorComment,
  getDistrictDisplayName,
  isPlanOverBudget,
} from './dailyPlanningEngine';
import {
  getDailyPlanTotalCost,
  isDailyPlanConfirmedForDay,
} from './dailyPlanningState';
import type {
  DailyContainerFocus,
  DailyOperationsPlanState,
  DailyPersonnelFocus,
  DailyPlanEditModel,
  DailyPlanEditSection,
  DailyPlanHubModel,
  DailyPlanImpactPreviewModel,
  DailyPlanOption,
  DailyPlanPresentationTone,
  DailyPlanReportSummary,
  DailyPlanStatus,
  DailyPlanningEngineInput,
  DailyVehicleFocus,
} from './dailyPlanningTypes';

export function getDailyFocusLabel(
  type: 'personnel' | 'vehicles' | 'containers' | 'district',
  value: string,
): string {
  if (type === 'district') {
    return getDistrictDisplayName(value);
  }
  if (type === 'personnel') {
    return DAILY_PERSONNEL_FOCUS_OPTIONS[value as DailyPersonnelFocus]?.label ?? value;
  }
  if (type === 'vehicles') {
    return DAILY_VEHICLE_FOCUS_OPTIONS[value as DailyVehicleFocus]?.label ?? value;
  }
  return DAILY_CONTAINER_FOCUS_OPTIONS[value as DailyContainerFocus]?.label ?? value;
}

export function getDailyFocusShortLabel(
  type: 'personnel' | 'vehicles' | 'containers' | 'district',
  value: string,
): string {
  if (type === 'district') {
    return getDistrictDisplayName(value);
  }
  if (type === 'personnel') {
    return (
      DAILY_PERSONNEL_FOCUS_OPTIONS[value as DailyPersonnelFocus]?.shortLabel ?? value
    );
  }
  if (type === 'vehicles') {
    return DAILY_VEHICLE_FOCUS_OPTIONS[value as DailyVehicleFocus]?.shortLabel ?? value;
  }
  return (
    DAILY_CONTAINER_FOCUS_OPTIONS[value as DailyContainerFocus]?.shortLabel ?? value
  );
}

export function getDailyPlanStatusLabel(status: DailyPlanStatus): string {
  return DAILY_PLAN_STATUS_LABELS[status];
}

export function getDailyPlanTone(
  plan: DailyOperationsPlanState,
): DailyPlanPresentationTone {
  if (isPlanOverBudget(plan)) return 'warning';
  if (isDailyPlanConfirmedForDay(plan, plan.day)) return 'positive';
  return 'neutral';
}

function buildDistrictOptions(): DailyPlanOption[] {
  return KNOWN_DISTRICT_IDS.map((id) => ({
    id,
    label: getDistrictDisplayName(id),
    shortLabel: getDistrictDisplayName(id),
    description: `${getDistrictDisplayName(id)} mahallesine günlük odak.`,
    upside: 'Mahalle sinyalleri bu bölgede daha yakından izlenir.',
    tradeoff: 'Diğer bölgeler ikincil planda kalabilir.',
    tone: 'balanced' as const,
    cost: 0,
    sourceTags: ['district', id],
  }));
}

export function buildDailyPlanHubModel(
  input: DailyPlanningEngineInput,
): DailyPlanHubModel {
  const plan =
    input.dailyOperationsPlan ??
    ({
      day: input.gameState.city.day,
      status: 'suggested',
    } as DailyOperationsPlanState);

  const compact = input.isDay1Tutorial === true;
  const confirmed = isDailyPlanConfirmedForDay(plan, input.gameState.city.day);
  const overBudget = isPlanOverBudget(plan);
  const used = getDailyPlanTotalCost(plan);

  const personnelOpt = DAILY_PERSONNEL_FOCUS_OPTIONS[plan.personnelFocus];
  const vehicleOpt = DAILY_VEHICLE_FOCUS_OPTIONS[plan.vehicleFocus];
  const containerOpt = DAILY_CONTAINER_FOCUS_OPTIONS[plan.containerFocus];

  return {
    title: DAILY_PLANNING_COPY.hubTitle,
    subtitle: DAILY_PLANNING_COPY.hubSubtitle,
    statusLabel: getDailyPlanStatusLabel(plan.status),
    districtLine: `Mahalle: ${getDistrictDisplayName(plan.districtFocusId)}`,
    focusRows: [
      {
        key: 'district',
        label: 'Mahalle',
        value: getDistrictDisplayName(plan.districtFocusId),
        summary: 'Günlük mahalle odağı',
        iconKey: 'location',
        tone: 'neutral',
      },
      {
        key: 'personnel',
        label: 'Personel',
        value: personnelOpt.shortLabel,
        summary: personnelOpt.upside,
        iconKey: 'people',
        tone: personnelOpt.tone === 'warning' ? 'warning' : 'neutral',
      },
      {
        key: 'vehicles',
        label: 'Araç',
        value: vehicleOpt.shortLabel,
        summary: vehicleOpt.upside,
        iconKey: 'car',
        tone: vehicleOpt.tone === 'warning' ? 'warning' : 'neutral',
      },
      {
        key: 'containers',
        label: 'Konteyner',
        value: containerOpt.shortLabel,
        summary: containerOpt.upside,
        iconKey: 'trash',
        tone: containerOpt.tone === 'warning' ? 'warning' : 'neutral',
      },
    ],
    focusPointsLabel: DAILY_PLANNING_COPY.focusPointsLabel(
      used,
      plan.operationFocusPoints.total,
    ),
    advisorLine: getDailyPlanAdvisorComment(input, plan),
    ctaLabel: confirmed
      ? DAILY_PLANNING_COPY.updateLabel
      : DAILY_PLANNING_COPY.confirmLabel,
    secondaryCtaLabel: compact ? undefined : DAILY_PLANNING_COPY.editLabel,
    compact,
    canConfirm: !confirmed && !overBudget,
    canEdit: !compact,
    overBudget,
  };
}

export function buildDailyPlanEditModel(
  input: DailyPlanningEngineInput,
): DailyPlanEditModel {
  const plan = input.dailyOperationsPlan!;
  const totalCost = getDailyPlanTotalCost(plan);
  const overBudget = isPlanOverBudget(plan);

  const sections: DailyPlanEditSection[] = [
    {
      key: 'district',
      title: DAILY_PLANNING_COPY.districtSectionTitle,
      options: buildDistrictOptions(),
    },
    {
      key: 'personnel',
      title: DAILY_PLANNING_COPY.personnelSectionTitle,
      options: Object.values(DAILY_PERSONNEL_FOCUS_OPTIONS),
    },
    {
      key: 'vehicles',
      title: DAILY_PLANNING_COPY.vehicleSectionTitle,
      options: Object.values(DAILY_VEHICLE_FOCUS_OPTIONS),
    },
    {
      key: 'containers',
      title: DAILY_PLANNING_COPY.containerSectionTitle,
      options: Object.values(DAILY_CONTAINER_FOCUS_OPTIONS),
    },
  ];

  return {
    title: DAILY_PLANNING_COPY.editTitle,
    sections,
    confirmLabel: DAILY_PLANNING_COPY.confirmLabel,
    warningLine: overBudget ? DAILY_PLANNING_COPY.overBudgetWarning : undefined,
    focusPointsLabel: DAILY_PLANNING_COPY.focusPointsLabel(
      totalCost,
      plan.operationFocusPoints.total,
    ),
    selectedDistrictId: plan.districtFocusId,
    selectedPersonnel: plan.personnelFocus,
    selectedVehicle: plan.vehicleFocus,
    selectedContainer: plan.containerFocus,
    totalCost,
    canConfirm: !overBudget,
  };
}

export function buildDailyPlanImpactPreviewModel(
  input: DailyPlanningEngineInput,
  event?: EventCard,
  decision?: EventDecision,
): DailyPlanImpactPreviewModel {
  const preview = buildDailyPlanImpactPreview(input, event, decision);
  if (!preview) {
    return {
      title: '',
      summary: '',
      tone: 'neutral',
      visible: false,
    };
  }
  return {
    title: preview.title,
    summary: preview.summary,
    tone: preview.tone,
    visible: true,
  };
}

export function buildDailyPlanReportModel(
  input: DailyPlanningEngineInput,
  _report?: DailyReport,
): DailyPlanReportSummary {
  const plan = input.dailyOperationsPlan;
  const day = input.gameState.city.day;

  if (input.isDay1Tutorial) {
    return {
      title: DAILY_PLANNING_COPY.reportTitle,
      lines: [DAILY_PLANNING_COPY.day1ReportLine],
      footerNote: DAILY_PLANNING_COPY.reportFooter,
      tone: 'neutral',
    };
  }

  if (input.postPilotLightPhase) {
    return {
      title: DAILY_PLANNING_COPY.reportTitle,
      lines: [
        DAILY_PLANNING_COPY.postPilotReportLine,
        ...(plan?.appliedEffects.length
          ? [plan.appliedEffects[0]!.reason]
          : []),
      ].slice(0, MAX_PLAN_REPORT_LINES),
      footerNote: DAILY_PLANNING_COPY.reportFooter,
      tone: 'neutral',
    };
  }

  const effects =
    plan?.appliedEffects?.length && plan.lastProcessedDay === day
      ? plan.appliedEffects
      : plan
        ? []
        : [];

  const lines: string[] = [];
  for (const effect of effects) {
    if (effect.delta < 0) {
      lines.push(effect.reason.endsWith('.') ? effect.reason : `${effect.reason}.`);
    } else if (effect.delta > 0 && lines.length < MAX_PLAN_REPORT_LINES) {
      lines.push(`${effect.reason} (kısa vadede ek baskı).`);
    }
    if (lines.length >= MAX_PLAN_REPORT_LINES) break;
  }

  if (lines.length === 0 && plan) {
    lines.push(
      `${getDailyFocusShortLabel('vehicles', plan.vehicleFocus)} odağı bugünkü operasyona yön verdi.`,
    );
  }

  let tone: DailyPlanPresentationTone = 'neutral';
  const hasRisk = effects.some((e) => e.delta > 0);
  const hasGain = effects.some((e) => e.delta < 0);
  if (hasRisk && hasGain) tone = 'warning';
  else if (hasGain) tone = 'positive';
  else if (hasRisk) tone = 'warning';

  return {
    title: DAILY_PLANNING_COPY.reportTitle,
    lines: lines.slice(0, MAX_PLAN_REPORT_LINES),
    footerNote: DAILY_PLANNING_COPY.reportFooter,
    tone,
  };
}

export function buildDailyPlanAdvisorLine(
  input: DailyPlanningEngineInput,
): string {
  return getDailyPlanAdvisorComment(input);
}

export function buildDailyPlanningEngineInputFromStore(state: {
  gameState: DailyPlanningEngineInput['gameState'];
  operationSignals?: DailyPlanningEngineInput['operationSignals'];
  advisorState?: DailyPlanningEngineInput['advisorState'];
  dailyOperationsPlan?: DailyOperationsPlanState;
  isDay1Tutorial?: boolean;
  postPilotLightPhase?: boolean;
}): DailyPlanningEngineInput {
  return { ...state };
}
