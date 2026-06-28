import { ALL_PERIOD_GOAL_IDS, PERIOD_GOAL_DEFINITIONS } from './periodGoalConstants';
import type {
  PeriodGoalContextInput,
  PeriodGoalId,
  PeriodGoalPresentation,
  PeriodGoalProgressBand,
  PeriodGoalTone,
} from './periodGoalTypes';

type GoalScore = { id: PeriodGoalId; score: number };

function clampDay(day: number): number {
  return Math.max(1, Math.floor(day));
}

function stableTieBreak(day: number, id: PeriodGoalId): number {
  const seed = clampDay(day) * 17;
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), seed);
  return hash % 1000;
}

export function detectRepeatedDistrictFocus(
  decisionHistory: Array<{ day?: number; eventTitle?: string; decisionLabel?: string }> = [],
  currentDay: number,
  windowDays = 3,
): { repeated: boolean; districtName: string | null } {
  const recent = decisionHistory
    .filter((record) => {
      const day = record.day ?? 0;
      return day >= currentDay - windowDays && day <= currentDay;
    })
    .map((record) => extractDistrictHint(record.eventTitle ?? record.decisionLabel ?? ''))
    .filter((name): name is string => Boolean(name));

  if (recent.length < 2) return { repeated: false, districtName: null };

  const counts = new Map<string, number>();
  for (const name of recent) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return { repeated: false, districtName: null };
  return { repeated: true, districtName: top[0] };
}

function extractDistrictHint(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[·|–-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0].length <= 24) return parts[0];
  if (trimmed.length <= 24) return trimmed;
  return null;
}

function scorePeriodGoals(context: PeriodGoalContextInput): GoalScore[] {
  const scores = new Map<PeriodGoalId, number>();
  for (const id of ALL_PERIOD_GOAL_IDS) {
    scores.set(id, 0);
  }

  const maintenanceActive = context.maintenanceActiveCount ?? 0;
  const maintenanceCritical = context.maintenanceCriticalCount ?? 0;
  const maintenanceStrained = context.maintenanceStrainedCount ?? 0;

  if (maintenanceActive > 0) {
    scores.set('strengthen_readiness', (scores.get('strengthen_readiness') ?? 0) + 3);
    scores.set('control_resource_pressure', (scores.get('control_resource_pressure') ?? 0) + 2);
  }
  if (maintenanceCritical > 0) {
    scores.set('strengthen_readiness', (scores.get('strengthen_readiness') ?? 0) + 4);
  }
  if (maintenanceStrained > 0) {
    scores.set('control_resource_pressure', (scores.get('control_resource_pressure') ?? 0) + 2);
  }

  const socialHigh =
    context.socialRiskLevel === 'high' ||
    context.socialRiskLevel === 'critical' ||
    (context.socialPulseScore ?? 0) >= 62;
  if (socialHigh) {
    scores.set('reduce_social_heat', (scores.get('reduce_social_heat') ?? 0) + 4);
  }

  if (context.trustFragile || context.trustDeclining || context.publicSatisfactionLow) {
    scores.set('restore_trust', (scores.get('restore_trust') ?? 0) + 3);
  }
  if (context.trustImproving) {
    scores.set('restore_trust', (scores.get('restore_trust') ?? 0) + 1);
  }

  if (context.repeatedDistrictFocus) {
    scores.set('balance_district_attention', (scores.get('balance_district_attention') ?? 0) + 4);
  }

  if (context.budgetPressureHigh || context.resourcePressureHigh) {
    scores.set('control_resource_pressure', (scores.get('control_resource_pressure') ?? 0) + 3);
  }

  if (context.serviceSensitive || context.routeSensitive) {
    scores.set('stabilize_service_rhythm', (scores.get('stabilize_service_rhythm') ?? 0) + 3);
  }

  if (context.marketPressure) {
    scores.set('reduce_social_heat', (scores.get('reduce_social_heat') ?? 0) + 2);
  }

  if (context.tomorrowRiskHigh) {
    scores.set('prevent_tomorrow_risk', (scores.get('prevent_tomorrow_risk') ?? 0) + 4);
  }

  const style = context.playerStyleId ?? '';
  if (style === 'crisis_watcher' && (context.resourcePressureHigh || maintenanceStrained > 0)) {
    scores.set('control_resource_pressure', (scores.get('control_resource_pressure') ?? 0) + 3);
  }
  if (style === 'resource_guardian' && socialHigh) {
    scores.set('reduce_social_heat', (scores.get('reduce_social_heat') ?? 0) + 2);
    scores.set('restore_trust', (scores.get('restore_trust') ?? 0) + 1);
  }
  if (style === 'district_loyalist') {
    scores.set('balance_district_attention', (scores.get('balance_district_attention') ?? 0) + 2);
  }
  if (style === 'preventive_planner' && context.tomorrowRiskHigh) {
    scores.set('prevent_tomorrow_risk', (scores.get('prevent_tomorrow_risk') ?? 0) + 3);
  }
  if (style === 'public_focused' && socialHigh) {
    scores.set('reduce_social_heat', (scores.get('reduce_social_heat') ?? 0) + 2);
  }

  const day = clampDay(context.day);
  if (day <= 2) {
    scores.set('adaptive_management', (scores.get('adaptive_management') ?? 0) + 2);
  }

  const ranked = [...scores.entries()]
    .filter(([id]) => !(context.avoidGoalIds ?? []).includes(id))
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return stableTieBreak(day, a.id) - stableTieBreak(day, b.id);
    });

  const maxScore = ranked[0]?.score ?? 0;
  if (maxScore <= 0) {
    const fallbackId: PeriodGoalId =
      day % 2 === 0 ? 'stabilize_service_rhythm' : 'adaptive_management';
    return [
      { id: fallbackId, score: 1 },
      { id: 'adaptive_management', score: 0 },
    ];
  }

  return ranked;
}

export function deriveActivePeriodGoal(context: PeriodGoalContextInput): PeriodGoalId {
  return scorePeriodGoals(context)[0]?.id ?? 'adaptive_management';
}

export function deriveSecondaryPeriodGoals(
  context: PeriodGoalContextInput,
  limit = 2,
): PeriodGoalId[] {
  const ranked = scorePeriodGoals(context);
  const active = ranked[0]?.id;
  return ranked
    .slice(1, limit + 1)
    .map((entry) => entry.id)
    .filter((id) => id !== active);
}

export function buildPeriodGoalProgress(
  goalId: PeriodGoalId,
  context: PeriodGoalContextInput,
): { band: PeriodGoalProgressBand; label: string; value?: number; tone: PeriodGoalTone } {
  const maintenanceActive = context.maintenanceActiveCount ?? 0;
  const maintenanceCritical = context.maintenanceCriticalCount ?? 0;
  const socialHigh =
    context.socialRiskLevel === 'high' ||
    context.socialRiskLevel === 'critical' ||
    (context.socialPulseScore ?? 0) >= 62;

  let band: PeriodGoalProgressBand = 'steady';

  switch (goalId) {
    case 'restore_trust':
      if (context.trustDeclining || context.publicSatisfactionLow) band = 'at_risk';
      else if (context.trustImproving) band = 'moving';
      else if (socialHigh) band = 'strained';
      else if (context.day <= 2) band = 'starting';
      break;
    case 'control_resource_pressure':
      if (maintenanceCritical > 0 || context.budgetPressureHigh) band = 'at_risk';
      else if (maintenanceActive > 0 || context.resourcePressureHigh) band = 'strained';
      else if (context.readinessReady) band = 'steady';
      else band = 'moving';
      break;
    case 'stabilize_service_rhythm':
      if (context.routeSensitive && context.resourcePressureHigh) band = 'strained';
      else if (context.serviceSensitive) band = 'moving';
      else if (context.day <= 2) band = 'starting';
      break;
    case 'reduce_social_heat':
      if (context.socialRiskLevel === 'critical') band = 'at_risk';
      else if (socialHigh) band = 'strained';
      else band = 'moving';
      break;
    case 'strengthen_readiness':
      if (maintenanceCritical > 0) band = 'at_risk';
      else if (maintenanceActive > 0) band = 'strained';
      else if (context.readinessReady) band = 'steady';
      else band = 'moving';
      break;
    case 'balance_district_attention':
      if (context.repeatedDistrictFocus) band = 'strained';
      else band = 'steady';
      break;
    case 'prevent_tomorrow_risk':
      if (context.tomorrowRiskHigh) band = 'strained';
      else if (context.day <= 2) band = 'starting';
      else band = 'moving';
      break;
    case 'adaptive_management':
      band = context.day <= 2 ? 'starting' : 'steady';
      break;
    default:
      band = 'steady';
  }

  const labelMap: Record<PeriodGoalProgressBand, string> = {
    starting: 'Yeni oluşuyor',
    moving: 'İlerliyor',
    steady: 'Dengede',
    strained: 'Baskı altında',
    at_risk: 'Riskte',
  };

  const toneMap: Record<PeriodGoalProgressBand, PeriodGoalTone> = {
    starting: 'neutral',
    moving: 'positive',
    steady: 'neutral',
    strained: 'warning',
    at_risk: 'critical',
  };

  const value =
    band === 'moving' || band === 'steady'
      ? Math.min(72, 38 + clampDay(context.day) * 2)
      : undefined;

  return { band, label: labelMap[band], value, tone: toneMap[band] };
}

function buildGoalChips(
  goalId: PeriodGoalId,
  context: PeriodGoalContextInput,
): PeriodGoalPresentation['chips'] {
  const def = PERIOD_GOAL_DEFINITIONS[goalId];
  const chips = def.chipTemplates.slice(0, 3).map((chip) => ({ ...chip }));

  if (goalId === 'strengthen_readiness' && (context.maintenanceActiveCount ?? 0) > 0) {
    const count = context.maintenanceActiveCount ?? 0;
    chips[1] = {
      label: 'Bakım Adayı',
      value: `${count} takip adayı`,
      tone: context.maintenanceCriticalCount ? 'critical' : 'warning',
    };
  }

  if (goalId === 'balance_district_attention' && context.repeatedDistrictName) {
    chips[0] = {
      label: 'Mahalle Dengesi',
      value: context.repeatedDistrictName,
      tone: 'warning',
    };
  }

  if (goalId === 'reduce_social_heat' && (context.socialPulseScore ?? 0) > 0) {
    chips[0] = {
      label: 'Sosyal Tepki',
      value: `Nabız ${Math.round(context.socialPulseScore ?? 0)}`,
      tone: 'warning',
    };
  }

  return chips.slice(0, 3);
}

function buildCurrentSignal(goalId: PeriodGoalId, context: PeriodGoalContextInput): string {
  switch (goalId) {
    case 'strengthen_readiness':
      if ((context.maintenanceCriticalCount ?? 0) > 0) {
        return 'Kritik hazırlık sinyali izleniyor.';
      }
      if ((context.maintenanceActiveCount ?? 0) > 0) {
        return 'Bakım kuyruğunda takip adayları birikiyor.';
      }
      return 'Saha hazırlığı dengede görünüyor.';
    case 'restore_trust':
      if (context.trustDeclining) return 'Güven sinyali zayıflıyor.';
      if (context.trustImproving) return 'Güven toparlanma eğiliminde.';
      return 'Mahalle güveni izleniyor.';
    case 'reduce_social_heat':
      return 'Sosyal nabız yüksek; görünürlük önemli.';
    case 'balance_district_attention':
      return context.repeatedDistrictName
        ? `${context.repeatedDistrictName} üst üste öne çıkıyor.`
        : 'Bölge dağılımı izleniyor.';
    case 'prevent_tomorrow_risk':
      return context.tomorrowRiskLine?.trim() || 'Yarın riski erken dengeleme gerektiriyor.';
    case 'control_resource_pressure':
      return context.resourcePressureHigh
        ? 'Kaynak baskısı dönemin ana sınavı.'
        : 'Kaynak kullanımı izleniyor.';
    default:
      return 'Operasyon dönemi bağlamı güncelleniyor.';
  }
}

export function buildPeriodGoalPresentation(
  goalId: PeriodGoalId,
  context: PeriodGoalContextInput,
): PeriodGoalPresentation {
  const def = PERIOD_GOAL_DEFINITIONS[goalId];
  const progress = buildPeriodGoalProgress(goalId, context);

  return {
    id: goalId,
    title: def.title,
    shortTitle: def.shortTitle,
    description: def.description,
    tone: progress.tone === 'positive' ? 'positive' : def.defaultTone,
    progressBand: progress.band,
    progressLabel: progress.label,
    progressValue: progress.value,
    chips: buildGoalChips(goalId, context),
    currentSignal: buildCurrentSignal(goalId, context),
    nextHint: def.nextHint,
    relatedSurfaces: ['hub', 'report', 'growth', 'advisor'],
  };
}

export function enrichPeriodGoalContext(
  base: PeriodGoalContextInput,
  decisionHistory: Array<{ day?: number; eventTitle?: string; decisionLabel?: string }> = [],
): PeriodGoalContextInput {
  const repeated = detectRepeatedDistrictFocus(decisionHistory, base.day);
  return {
    ...base,
    repeatedDistrictFocus: base.repeatedDistrictFocus ?? repeated.repeated,
    repeatedDistrictName: base.repeatedDistrictName ?? repeated.districtName,
  };
}
