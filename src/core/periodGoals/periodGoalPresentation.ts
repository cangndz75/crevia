import { buildDistrictPersonalityEceHint } from '@/core/districtPersonality';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { selectActiveMaintenanceRuntimeItems } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { CenterHomeCoreSections } from '@/features/hub/utils/centerHomePresentation';

import {
  PERIOD_GOAL_DEFINITIONS,
  PERIOD_GOAL_PROGRESS_TONES,
} from './periodGoalConstants';
import {
  buildPeriodGoalPresentation,
  deriveActivePeriodGoal,
  deriveSecondaryPeriodGoals,
  enrichPeriodGoalContext,
} from './periodGoalModel';
import type {
  GrowthPeriodFocusCardPresentation,
  HubPeriodGoalCardPresentation,
  PeriodGoalContextInput,
  PeriodGoalDashboardPresentation,
  PeriodGoalId,
  PeriodGoalPresentation,
  ReportPeriodGoalInsight,
} from './periodGoalTypes';

export function dedupePeriodGoalCopy(line: string, avoidLines: string[] = []): boolean {
  return lineDuplicatesAvoidLines(line, avoidLines);
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function resolvePresentationDay(presentation: CenterHomeCoreSections): number {
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  return Number(dayChip?.valueText.match(/\d+/)?.[0] ?? 1);
}

function resolveDistrictName(
  presentation: CenterHomeCoreSections,
  selectedDistrictName?: string | null,
): string | null {
  return selectedDistrictName?.trim() || presentation.activeTarget?.title?.trim() || null;
}

function countMaintenanceRuntime(runtime: MaintenanceBacklogRuntimeState | null | undefined) {
  const active = selectActiveMaintenanceRuntimeItems(runtime ?? { items: [], attentionStreaks: {} });
  return {
    activeCount: active.length,
    criticalCount: active.filter((item) => item.severity === 'critical').length,
    strainedCount: active.filter((item) => item.severity === 'strained').length,
  };
}

export function buildPeriodGoalContextFromHub(
  presentation: CenterHomeCoreSections,
  options: {
    maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
    socialPulseState?: SocialPulseState | null;
    tomorrowRisk?: TomorrowRiskModel | null;
    playerStyleId?: PlayerStyleId | null;
    decisionHistory?: Array<{ day?: number; eventTitle?: string; decisionLabel?: string }>;
    selectedDistrictName?: string | null;
  } = {},
): PeriodGoalContextInput {
  const day = resolvePresentationDay(presentation);
  const maintenance = countMaintenanceRuntime(options.maintenanceBacklogRuntime);
  const happiness = presentation.citySummary.metrics.find((metric) => metric.id === 'happiness');
  const satisfaction = Number(happiness?.valueText.match(/\d+/)?.[0] ?? 60);
  const riskSignal = presentation.operationSignals.signals.find((s) => s.severity === 'urgent' || s.severity === 'high');
  const trustFragile = satisfaction < 52;
  const trustDeclining = satisfaction < 48;
  const trustImproving = satisfaction >= 64;

  const base: PeriodGoalContextInput = {
    day,
    socialPulseScore: options.socialPulseState?.globalPulseScore,
    socialRiskLevel: options.socialPulseState?.globalRiskLevel,
    maintenanceActiveCount: maintenance.activeCount,
    maintenanceCriticalCount: maintenance.criticalCount,
    maintenanceStrainedCount: maintenance.strainedCount,
    readinessReady: maintenance.activeCount === 0 && !riskSignal,
    budgetPressureHigh: Boolean(
      presentation.operationSignals.summaryLine?.toLowerCase().includes('bütçe') ||
        presentation.operationSignals.summaryLine?.toLowerCase().includes('kaynak'),
    ),
    resourcePressureHigh: Boolean(riskSignal) || maintenance.strainedCount > 0,
    trustFragile,
    trustDeclining,
    trustImproving,
    serviceSensitive: presentation.activeTarget.domain === 'logistics',
    routeSensitive: presentation.activeTarget.domain === 'transport',
    marketPressure: presentation.activeTarget.domain === 'energy',
    tomorrowRiskHigh:
      options.tomorrowRisk?.priority === 'high' ||
      Boolean(options.tomorrowRisk?.mainLine?.trim()),
    tomorrowRiskLine: options.tomorrowRisk?.mainLine ?? null,
    playerStyleId: options.playerStyleId ?? null,
    selectedDistrictName: resolveDistrictName(presentation, options.selectedDistrictName),
    publicSatisfactionLow: satisfaction < 55,
    repeatedDistrictFocus: false,
    repeatedDistrictName: null,
  };

  return enrichPeriodGoalContext(base, options.decisionHistory ?? []);
}

export function buildPeriodGoalDashboardPresentation(
  context: PeriodGoalContextInput,
): PeriodGoalDashboardPresentation {
  const activeId = deriveActivePeriodGoal(context);
  const activeGoal = buildPeriodGoalPresentation(activeId, context);
  const secondaryGoals = deriveSecondaryPeriodGoals(context, 2).map((id) =>
    buildPeriodGoalPresentation(id, context),
  );

  return {
    title: 'Şehir Gündemi',
    subtitle: 'Bu dönemin operasyon odağı',
    activeGoal,
    secondaryGoals,
    summary: activeGoal.currentSignal,
    countLabel: `${1 + secondaryGoals.length} odak`,
  };
}

function pickHubChips(goal: PeriodGoalPresentation, maintenanceActiveCount: number) {
  const chips = goal.chips.slice(0, 2);
  if (goal.id === 'strengthen_readiness' && maintenanceActiveCount > 0) {
    return chips.map((chip, index) =>
      index === 0
        ? {
            ...chip,
            value:
              maintenanceActiveCount === 1
                ? '1 takip adayı'
                : `${maintenanceActiveCount} takip adayı`,
          }
        : chip,
    );
  }
  return chips;
}

export function buildHubPeriodGoalCard(
  context: PeriodGoalContextInput,
  avoidLines: string[] = [],
): HubPeriodGoalCardPresentation {
  const dashboard = buildPeriodGoalDashboardPresentation(context);
  const goal = dashboard.activeGoal;
  const maintenanceActive = context.maintenanceActiveCount ?? 0;

  let summary = goal.description;
  if (goal.id === 'strengthen_readiness' && maintenanceActive > 0) {
    summary =
      'Bakım kuyruğuna taşınan sinyaller yeni operasyonlardan önce izlenmeli.';
  }
  if (dedupePeriodGoalCopy(summary, avoidLines)) {
    summary = goal.currentSignal;
  }

  const eceHint = buildEcePeriodGoalHint(goal.id, avoidLines);
  const districtEceHint =
    context.selectedDistrictName?.trim() && context.day >= 2
      ? buildDistrictPersonalityEceHint(
          {
            districtName: context.selectedDistrictName,
            day: context.day,
            avoidLines: [...avoidLines, eceHint ?? ''],
          },
          'periodGoal',
        )
      : null;
  const secondaryChip = dashboard.secondaryGoals[0]?.shortTitle ?? null;

  return {
    visibility: context.day >= 1 ? 'visible' : 'hidden',
    sectionTitle: 'Şehir Gündemi',
    goalTitle: goal.title,
    summary: clamp(summary, 120),
    progressLabel: goal.progressLabel,
    progressTone: PERIOD_GOAL_PROGRESS_TONES[goal.progressBand],
    chips: pickHubChips(goal, maintenanceActive),
    nextHint: clamp(goal.nextHint, 100),
    secondaryChip,
    eceHint: districtEceHint ?? eceHint,
  };
}

export function buildGrowthPeriodFocusCard(
  context: PeriodGoalContextInput,
  playerStyleLabel?: string | null,
): GrowthPeriodFocusCardPresentation {
  const goal = buildPeriodGoalPresentation(deriveActivePeriodGoal(context), context);
  const styleNote = playerStyleLabel?.trim()
    ? `Bu hedef ${playerStyleLabel} tarzına göre şekilleniyor.`
    : 'Bu hedef karar tarzına göre şekilleniyor.';

  return {
    visibility: context.day >= 2 ? 'visible' : 'hidden',
    sectionTitle: 'Dönemsel Odak',
    microcopy: styleNote,
    goalTitle: goal.title,
    progressLabel: goal.progressLabel,
    progressTone: PERIOD_GOAL_PROGRESS_TONES[goal.progressBand],
    evidenceChips: goal.chips.slice(0, 2),
  };
}

const REPORT_IMPACT_TEMPLATES: Record<
  PeriodGoalId,
  { positive: string; strained: string; steady: string }
> = {
  restore_trust: {
    positive: 'Bugünkü kararlar güven toparlama hedefinde ilerleme sağladı.',
    strained: 'Güven hedefi izleniyor; sosyal nabız hâlâ dikkat istiyor.',
    steady: 'Mahalle güvenini toparlama hedefi dengede ilerliyor.',
  },
  control_resource_pressure: {
    positive: 'Kaynak baskısı hedefinde bugünkü kararlar dengeyi destekledi.',
    strained: 'Kaynak baskısı hedefi baskı altında; ekip temposu izlenmeli.',
    steady: 'Kaynak dengesi hedefi kontrollü ilerliyor.',
  },
  stabilize_service_rhythm: {
    positive: 'Hizmet ritmi hedefi bugün istikrar kazandı.',
    strained: 'Hizmet ritmi hedefi baskı altında; rota gecikmeleri izlenmeli.',
    steady: 'Hizmet ritmi hedefi dengede tutuluyor.',
  },
  reduce_social_heat: {
    positive: 'Sosyal nabız sakinleşti. Sakinleştirme hedefi ilerliyor.',
    strained: 'Sosyal nabız hâlâ yüksek; görünür müdahale izlenmeli.',
    steady: 'Sosyal nabız hedefi dengede izleniyor.',
  },
  strengthen_readiness: {
    positive: 'Bugünkü kararlar saha hazırlığı hedefinde baskıyı azalttı.',
    strained:
      'Saha hazırlığı hedefi baskı altında; bakım sinyalleri izlenmeli.',
    steady: 'Saha hazırlığı hedefi dengede ilerliyor.',
  },
  balance_district_attention: {
    positive: 'Bölge dengesi hedefi bugün daha adil bir dağılım gösterdi.',
    strained: 'Aynı bölgeye yüklenme riski var; denge izlenmeli.',
    steady: 'Bölge dengesi hedefi kontrollü ilerliyor.',
  },
  prevent_tomorrow_risk: {
    positive: 'Yarın riski hedefinde bugünkü kararlar dengeyi destekledi.',
    strained: 'Yarın riski hedefi baskı altında; gün sonu sinyalleri izlenmeli.',
    steady: 'Yarın riski hedefi erken dengeleme ile izleniyor.',
  },
  adaptive_management: {
    positive: 'Uyumlu yönetim çizgisi bugün esnek kararlarla ilerledi.',
    strained: 'Uyumlu yönetim hedefi baskı altında; bağlam değişimleri izlenmeli.',
    steady: 'Uyumlu yönetim hedefi dengede ilerliyor.',
  },
};

export function buildReportPeriodGoalInsight(
  context: PeriodGoalContextInput,
  avoidLines: string[] = [],
): ReportPeriodGoalInsight | null {
  if (context.day < 2) return null;

  const goal = buildPeriodGoalPresentation(deriveActivePeriodGoal(context), context);
  const templates = REPORT_IMPACT_TEMPLATES[goal.id];
  let line: string;
  if (goal.progressBand === 'moving' || goal.progressBand === 'starting') {
    line = templates.positive;
  } else if (goal.progressBand === 'strained' || goal.progressBand === 'at_risk') {
    line = templates.strained;
  } else {
    line = templates.steady;
  }

  if (goal.id === 'strengthen_readiness' && (context.maintenanceActiveCount ?? 0) > 0) {
    line =
      'Bugünkü kararlar saha hazırlığı hedefinde baskıyı azalttı, ancak ekip temposu hâlâ izlenmeli.';
  }

  line = clamp(line, 150);
  if (dedupePeriodGoalCopy(line, avoidLines)) return null;

  return {
    label: 'Şehir Gündemine Etki',
    line,
    tone: goal.tone,
  };
}

export function buildEcePeriodGoalHint(
  goalId: PeriodGoalId,
  avoidLines: string[] = [],
): string | null {
  const hint = clamp(PERIOD_GOAL_DEFINITIONS[goalId].eceHint, 140);
  if (dedupePeriodGoalCopy(hint, avoidLines)) return null;
  return hint;
}

export function buildPeriodGoalContextFromReport(params: {
  day: number;
  metrics?: { publicSatisfaction?: number; staffMorale?: number; budget?: number };
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
  socialPulseState?: SocialPulseState | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  playerStyleId?: PlayerStyleId | null;
  decisionHistory?: Array<{ day?: number; eventTitle?: string; decisionLabel?: string }>;
  warnings?: string[];
  selectedDistrictName?: string | null;
  selectedDistrictId?: string | null;
}): PeriodGoalContextInput {
  const maintenance = countMaintenanceRuntime(params.maintenanceBacklogRuntime);
  const satisfaction = params.metrics?.publicSatisfaction ?? 60;
  const warnings = params.warnings ?? [];

  const base: PeriodGoalContextInput = {
    day: params.day,
    socialPulseScore: params.socialPulseState?.globalPulseScore,
    socialRiskLevel: params.socialPulseState?.globalRiskLevel,
    maintenanceActiveCount: maintenance.activeCount,
    maintenanceCriticalCount: maintenance.criticalCount,
    maintenanceStrainedCount: maintenance.strainedCount,
    readinessReady: maintenance.activeCount === 0,
    budgetPressureHigh: (params.metrics?.budget ?? 100000) < 65000,
    resourcePressureHigh:
      (params.metrics?.staffMorale ?? 60) < 50 || maintenance.strainedCount > 0,
    trustFragile: satisfaction < 52,
    trustDeclining: satisfaction < 48,
    trustImproving: satisfaction >= 62,
    tomorrowRiskHigh:
      params.tomorrowRisk?.priority === 'high' || warnings.length > 2,
    tomorrowRiskLine: params.tomorrowRisk?.mainLine ?? null,
    playerStyleId: params.playerStyleId ?? null,
    publicSatisfactionLow: satisfaction < 55,
    selectedDistrictName: params.selectedDistrictName ?? null,
    serviceSensitive: maintenance.activeCount > 0 && satisfaction < 58,
    routeSensitive: maintenance.strainedCount > 0,
    marketPressure: satisfaction < 55 && (params.socialPulseState?.globalRiskLevel === 'high'),
  };

  return enrichPeriodGoalContext(base, params.decisionHistory ?? []);
}
