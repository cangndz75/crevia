import type {
  DailyGoal,
  DailyGoalReportResult,
  DailyGoalState,
  DailyGoalStatus,
} from '@/core/dailyGoals/dailyGoalTypes';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import {
  getNeighborhoodPlayerHint,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

export type DailyGoalTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_LABELS: Record<DailyGoalStatus, string> = {
  active: 'Devam',
  completed: 'Tamamlandı',
  at_risk: 'Riskte',
  failed: 'Kaçtı',
  locked: 'Bekliyor',
};

const STATUS_TONES: Record<DailyGoalStatus, DailyGoalTone> = {
  active: 'info',
  completed: 'success',
  at_risk: 'warning',
  failed: 'danger',
  locked: 'neutral',
};

const ICON_BY_SUBSYSTEM: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  personnel: 'people-outline',
  container: 'trash-outline',
  vehicle: 'car-outline',
  social: 'chatbubbles-outline',
  general: 'flag-outline',
};

export function getDailyGoalStatusLabel(status: DailyGoalStatus): string {
  return STATUS_LABELS[status] ?? 'Devam';
}

export function getDailyGoalTone(status: DailyGoalStatus): DailyGoalTone {
  return STATUS_TONES[status] ?? 'neutral';
}

export function getDailyGoalIcon(goal: DailyGoal): string {
  if (goal.relatedSubsystem && ICON_BY_SUBSYSTEM[goal.relatedSubsystem]) {
    return ICON_BY_SUBSYSTEM[goal.relatedSubsystem]!;
  }
  return goal.priority === 'primary' ? 'trophy-outline' : 'ellipse-outline';
}

export function formatGoalProgress(goal: DailyGoal): string {
  if (goal.isCompleted) return 'Tamam';
  if (goal.kind === 'resolve_event_count' || goal.kind === 'resolve_main_event') {
    return `${goal.currentValue ?? 0}/${goal.targetValue ?? 1}`;
  }
  return `%${goal.progressPercent}`;
}

export function buildDailyGoalHint(goals: DailyGoal[]): string | null {
  const primary = goals.find((g) => g.priority === 'primary');
  if (!primary) return null;

  if (primary.isCompleted) {
    return 'Ana hedef tamam — yan hedeflere odaklanabilirsin.';
  }

  if (primary.status === 'at_risk') {
    return primary.riskText ?? 'Risk: Ana hedef sınırına yaklaşıldı.';
  }

  if (primary.kind === 'resolve_main_event') {
    return 'Öncelik: Ana olayı çözmeden günü bitirme.';
  }

  const neighborhoodId = normalizeNeighborhoodId(primary.relatedNeighborhoodId);
  if (neighborhoodId) {
    const hint = getNeighborhoodPlayerHint(neighborhoodId);
    if (hint.length <= 72) {
      return hint;
    }
  }

  return primary.description.length > 72
    ? `${primary.description.slice(0, 69)}…`
    : primary.description;
}

export function buildDailyGoalReportResults(
  state: DailyGoalState | null | undefined,
): DailyGoalReportResult[] {
  if (!state?.goals?.length) return [];

  return state.goals.map((goal) => {
    let status: DailyGoalReportResult['status'] = 'active';
    if (goal.isCompleted) status = 'completed';
    else if (goal.isFailed) status = 'failed';
    else if (goal.status === 'at_risk') status = 'at_risk';

    let resultText = goal.description;
    if (goal.isCompleted) {
      resultText = `${goal.shortLabel} hedefi tamamlandı.`;
    } else if (goal.isFailed) {
      resultText = `${goal.shortLabel} hedefi kaçtı.`;
    } else if (goal.status === 'at_risk') {
      resultText = goal.riskText ?? `${goal.shortLabel} riskte kaldı.`;
    }

    return {
      title: goal.title,
      status,
      resultText,
    };
  });
}

export function buildDailyGoalReportLines(
  state: DailyGoalState | null | undefined,
): string[] {
  return buildDailyGoalReportResults(state)
    .slice(0, 4)
    .map((r) => r.resultText);
}

export function buildDay1TutorialGoalReportLine(
  state: DailyGoalState | null | undefined,
): string | null {
  const primary = selectPrimaryDailyGoal(state);
  if (!primary?.isCompleted) {
    return 'İlk gün hedefi: karar verip günü raporlamaya devam et.';
  }
  return 'İlk gün hedefi tamamlandı: karar verip günü raporladın.';
}

export function buildDecisionGoalImpactLine(
  state: DailyGoalState | null | undefined,
  before: DailyGoalState | null | undefined,
): string | null {
  if (!state?.goals?.length) return null;

  const completedNow = state.goals.filter(
    (g) =>
      g.isCompleted &&
      !before?.goals.some((b) => b.id === g.id && b.isCompleted),
  );
  if (completedNow.length > 0) {
    return `Günlük hedef ilerledi: ${completedNow[0]!.shortLabel}`;
  }

  const atRisk = state.goals.find((g) => g.status === 'at_risk' && !g.isCompleted);
  if (atRisk) {
    return `Günlük hedef riskte: ${atRisk.shortLabel}`;
  }

  return null;
}
