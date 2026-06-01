import { buildTomorrowHintLine } from '@/core/contentPacks/eventEchoPresentation';
import {
  buildReportTomorrowFallback,
  inferReportTomorrowDomain,
} from '@/core/reports/reportTomorrowPreviewPresentation';
import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';
import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import type { GameStatusSnapshot } from '@/store/gameSelectors';

export type ReportHeaderModel = {
  title: string;
  level: number;
  levelLabel: string;
  metaLine: string;
  resourceValue: string;
  resourceLabel: string;
  xpCurrent: number;
  xpTarget: number;
  xpProgress: number;
};

export type ReportPilotCompactModel = {
  completedDayLabel: string;
  themeChip: string;
  dayTitleChip: string;
  headline: string;
  summary: string;
  goalStripText: string;
  impactStripText: string;
  nextDayLine: string;
};

const PILOT_SUMMARY_SHORT: Record<number, string> = {
  1: 'İlk kararlar hizmet dengesine yansıdı.',
  2: 'Şikayet yönetimi mahalle algısına yansıdı.',
  3: 'Kaynak dengesi gün sonu metriklerine işlendi.',
  4: 'Mahalle algısı gün sonu raporuna yansıdı.',
  5: 'Fırsat günü sonuçları kayda geçti.',
  6: 'Kelebek etkisi gün sonu özetine eklendi.',
  7: 'Pilot değerlendirme sonuçları hazır.',
};

export function buildReportHeaderModel(
  status: GameStatusSnapshot,
  reportDay: number,
): ReportHeaderModel {
  const districtShort = status.selectedDistrictName.split(' ')[0] ?? status.selectedDistrictName;
  return {
    title: 'Raporlar',
    level: status.level,
    levelLabel: `Seviye ${status.level}`,
    metaLine: `${reportDay}. Gün • ${districtShort}`,
    resourceValue: status.sourceShort,
    resourceLabel: 'Kaynak',
    xpCurrent: status.xp,
    xpTarget: status.xpTarget,
    xpProgress: status.xpProgress,
  };
}

export function buildReportPilotCompactModel(
  context: PilotReportContext,
): ReportPilotCompactModel {
  const summaryShort =
    PILOT_SUMMARY_SHORT[context.completedPilotDay] ??
    (() => {
      const first = context.summary.split('.')[0]?.trim();
      return first ? `${first}.` : context.summary;
    })();

  const nextTheme = context.nextPilotThemeLabel ?? context.nextPilotDayTitle ?? 'Devam';
  const nextDayNum = context.nextPilotDay ?? context.completedPilotDay + 1;
  const nextDayLine =
    context.nextPilotDay != null
      ? `Sıradaki gün: ${nextTheme} • ${nextDayNum}/7`
      : context.nextHint;

  const impactText = context.todayImpactHint
    ? context.todayImpactHint.length > 64
      ? context.todayImpactHint.slice(0, 62) + '…'
      : context.todayImpactHint
    : 'Bugün karar alındı; etkiler metriklere yansıdı.';

  return {
    completedDayLabel: context.completedPilotDayLabel,
    themeChip: context.completedPilotThemeLabel,
    dayTitleChip: context.completedPilotDayTitle,
    headline: context.headline,
    summary: summaryShort.length > 72 ? summaryShort.slice(0, 70) + '…' : summaryShort,
    goalStripText: context.completedPilotGoal,
    impactStripText: impactText.length > 64 ? impactText.slice(0, 62) + '…' : impactText,
    nextDayLine,
  };
}

export function buildReportTomorrowNoteFallback(day = 3): string {
  const fallback = buildReportTomorrowFallback(day, inferReportTomorrowDomain({ day }));
  if (fallback?.summary) {
    return fallback.summary;
  }
  const line = buildTomorrowHintLine({
    day,
    domain: 'generic_operation',
    outcomeBand: 'mixed',
    eventId: 'report-tomorrow-fallback',
  });
  return line ?? 'Operasyon kararlarının halk, ekip ve kaynak dengesini birlikte etkiler.';
}

export function formatReportBudgetDisplay(budget: number): string {
  return formatSourceWithLabel(budget);
}

export type ReportBadgeSlotModel = {
  id: string;
  active: boolean;
  label?: string;
};

export function buildReportBadgeSlots(
  evaluation?: BadgeEvaluationSnapshot | null,
): ReportBadgeSlotModel[] {
  const earned = evaluation?.earnedBadgeIds ?? [];
  const slots: ReportBadgeSlotModel[] = [];

  for (let i = 0; i < 4; i += 1) {
    const badgeId = earned[i];
    if (badgeId) {
      slots.push({ id: badgeId, active: true, label: badgeId });
    } else if (i < 2 && earned.length === 0 && (evaluation?.progressLines?.length ?? 0) > 0) {
      slots.push({ id: `progress-${i}`, active: true });
    } else {
      slots.push({ id: `locked-${i}`, active: false });
    }
  }

  return slots;
}
