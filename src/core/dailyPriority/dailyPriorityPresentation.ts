import { colors } from '@/ui/theme/colors';

import { DAILY_PRIORITY_CHOICE_BY_KEY } from './dailyPriorityConstants';
import type {
  DailyPriorityKey,
  DailyPriorityState,
  DailyPriorityStatus,
  DailyPriorityVisualTone,
} from './dailyPriorityTypes';

const STATUS_LABELS: Record<DailyPriorityStatus, string> = {
  not_selected: 'Seçilmedi',
  active: 'Sürüyor',
  fulfilled: 'Başarılı',
  partial: 'Kısmi',
  failed: 'Riskte',
};

const TONE_COLORS: Record<
  DailyPriorityVisualTone,
  { bg: string; text: string; border: string }
> = {
  green: {
    bg: colors.successMuted,
    text: colors.success,
    border: colors.success,
  },
  blue: {
    bg: colors.secondaryMuted,
    text: colors.secondary,
    border: colors.secondary,
  },
  amber: {
    bg: colors.warningMuted,
    text: colors.warning,
    border: colors.warning,
  },
};

export function getDailyPriorityStatusLabel(status: DailyPriorityStatus): string {
  return STATUS_LABELS[status] ?? 'Sürüyor';
}

export function getDailyPriorityChoice(key: DailyPriorityKey) {
  return DAILY_PRIORITY_CHOICE_BY_KEY[key];
}

export function getDailyPriorityToneColors(key: DailyPriorityKey) {
  const tone = DAILY_PRIORITY_CHOICE_BY_KEY[key].visualTone;
  return TONE_COLORS[tone];
}

export function getLatestPriorityImpactText(
  state: DailyPriorityState | null | undefined,
): string | null {
  const latest = state?.impactLog[0];
  return latest?.text ?? null;
}

export function buildDay1TutorialPriorityLine(): string {
  return 'İlk gün önceliği: temel müdahaleyi öğrenmek.';
}

export function enrichDailyGoalHintWithPriority(
  hint: string | null,
  priorityKey: DailyPriorityKey | undefined,
): string | null {
  if (!hint || !priorityKey) return hint;
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[priorityKey];
  const prefix = `${choice.shortTitle} önceliği: `;
  const combined = `${prefix}${hint}`;
  return combined.length > 96 ? hint : combined;
}

export function buildDailyPriorityReportResult(
  state: DailyPriorityState | null | undefined,
): {
  key: DailyPriorityKey;
  title: string;
  status: 'fulfilled' | 'partial' | 'failed';
  text: string;
  carryOverText?: string;
  score: number;
} | null {
  if (!state?.selectedKey || !state.finalResult) {
    return null;
  }
  const choice = DAILY_PRIORITY_CHOICE_BY_KEY[state.selectedKey];
  return {
    key: state.selectedKey,
    title: choice.title,
    status: state.finalResult.status,
    text: state.finalResult.text,
    carryOverText: state.finalResult.carryOverText,
    score: state.score,
  };
}
