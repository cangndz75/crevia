import { PILOT_SCENARIO_DAYS, getPilotDayPlan } from '@/core/content/pilotDayPlan';
import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { GameState } from '@/core/models/GameState';
import type { PilotDayTheme } from '@/core/models/PilotDayPlan';
import { PILOT_DAY_THEME_LABELS } from '@/features/pilot/utils/pilotDayPresentation';
import { PILOT_STATUS_LABELS } from '@/features/pilot/utils/pilotFinalPresentation';
import type { GameChipTone } from '@/ui/components/GameChip';

export type PilotReportContext = {
  isVisible: boolean;
  completedPilotDay: number;
  completedPilotDayLabel: string;
  completedPilotDayTitle: string;
  completedPilotThemeLabel: string;
  completedPilotGoal: string;
  headline: string;
  summary: string;
  todayImpactHint: string | null;
  nextPilotDay: number | null;
  nextPilotDayLabel: string | null;
  nextPilotDayTitle: string | null;
  nextPilotThemeLabel: string | null;
  nextHint: string;
  reportTone: GameChipTone;
  showButterflyCallback: boolean;
  butterflyCallbackTitle: string | null;
  butterflyCallbackBody: string | null;
  showPilotReportCta: boolean;
  showCompletedReportCta: boolean;
  finalResultScore: number | null;
  finalResultStatusLabel: string | null;
  finalResultStatusChip: string | null;
};

type DayReportCopy = {
  headline: string;
  summary: string;
  tone: GameChipTone;
};

const DAY_REPORT_COPY: Record<number, DayReportCopy> = {
  1: {
    headline: 'İlk saha günü tamamlandı',
    summary:
      'Pilot bölgedeki ilk kararlar hizmet dengesinin nasıl değiştiğini gösterdi.',
    tone: 'info',
  },
  2: {
    headline: 'İlk şikayet yönetildi',
    summary:
      'Vatandaş geri bildirimleri artık kararlarının önemli bir parçası.',
    tone: 'warning',
  },
  3: {
    headline: 'Kaynak dengesi test edildi',
    summary:
      'Personel, bütçe ve operasyon riski arasındaki denge daha görünür hale geldi.',
    tone: 'neutral',
  },
  4: {
    headline: 'Mahalle algısı şekillendi',
    summary:
      'Hizmet kararları artık sadece sahada değil, mahalle gündeminde de karşılık buluyor.',
    tone: 'purple',
  },
  5: {
    headline: 'Fırsat günü geride kaldı',
    summary:
      'Kalıcı çözüm fırsatları, tekrar eden sorunları azaltmak için yeni kapılar açtı.',
    tone: 'success',
  },
  6: {
    headline: 'Kelebek etkisi ortaya çıktı',
    summary:
      'Önceki kararların bugünkü olayların tonunu değiştirebildiği görüldü.',
    tone: 'warning',
  },
  7: {
    headline: 'Pilot değerlendirme hazır',
    summary:
      '7 günlük pilot operasyon tamamlandı. Sonuçlar üst yönetime sunulacak seviyeye geldi.',
    tone: 'purple',
  },
};

const BUTTERFLY_DAY1_MESSAGES: Record<string, string> = {
  fast: 'İlk gün hızlı müdahale tercihin bugünkü operasyon temposunu etkiledi.',
  planned: 'İlk gün planlı bekleme tercihin bugünkü şikayet tonunu etkiledi.',
  partial:
    'İlk gün kısmi müdahale tercihin sorunun tamamen kapanmadığını gösterdi.',
};

function clampPilotDay(day: number): number {
  return Math.min(PILOT_SCENARIO_DAYS, Math.max(1, Math.round(day)));
}

function resolveCompletedPilotDay(
  gameState: GameState,
  lastDailyReport: DailyReport | null | undefined,
  lastClosedDay: number | null | undefined,
): number {
  const pilot = gameState.pilot;

  if (pilot.status === 'completed') {
    return PILOT_SCENARIO_DAYS;
  }

  if (pilot.status === 'active') {
    const current = pilot.currentPilotDay;
    if (current === PILOT_SCENARIO_DAYS) {
      if (canCompletePilot(gameState)) {
        return PILOT_SCENARIO_DAYS;
      }
      return PILOT_SCENARIO_DAYS - 1;
    }
    if (current > 1) {
      return clampPilotDay(current - 1);
    }
  }

  if (lastDailyReport?.day != null) {
    return clampPilotDay(lastDailyReport.day);
  }

  if (lastClosedDay != null) {
    return clampPilotDay(lastClosedDay);
  }

  if (pilot.status === 'active') {
    return clampPilotDay(Math.max(1, pilot.currentPilotDay - 1));
  }

  return 1;
}

function resolveNextPilotDay(
  gameState: GameState,
  completedPilotDay: number,
): number | null {
  const pilot = gameState.pilot;

  if (pilot.status === 'completed') {
    return null;
  }

  if (completedPilotDay >= PILOT_SCENARIO_DAYS) {
    return null;
  }

  if (pilot.status === 'active') {
    return clampPilotDay(pilot.currentPilotDay);
  }

  return clampPilotDay(completedPilotDay + 1);
}

function buildTodayImpactHint(
  decisionHistory: DecisionRecord[],
  reportDay: number,
): string | null {
  const today = decisionHistory.filter((record) => record.day === reportDay);
  if (today.length === 0) {
    return 'Bugün kayıtlı karar yok; metrikler gün sonu dengesine göre güncellendi.';
  }
  if (today.length === 1) {
    const [record] = today;
    return `Bugünkü karar: ${record.decisionLabel} — ${record.eventTitle}`;
  }
  return `Bugün ${today.length} karar alındı; etkiler metriklerde yansıdı.`;
}

function buildNextHint(
  gameState: GameState,
  nextPilotDay: number | null,
  nextThemeLabel: string | null,
): string {
  const pilot = gameState.pilot;

  if (pilot.status === 'completed') {
    return 'Pilot tamamlandı. Final raporu tekrar görüntülenebilir.';
  }

  if (canCompletePilot(gameState)) {
    return 'Pilot raporu hazır. Sonuçları görüntüleyebilirsin.';
  }

  if (nextPilotDay != null && nextThemeLabel) {
    return `Sıradaki gün: ${nextThemeLabel}`;
  }

  if (nextPilotDay != null) {
    return `Sıradaki pilot günü: ${nextPilotDay}/7`;
  }

  return 'Pilot haftası tamamlandı.';
}

function getButterflyCallback(
  gameState: GameState,
  completedPilotDay: number,
): Pick<
  PilotReportContext,
  'showButterflyCallback' | 'butterflyCallbackTitle' | 'butterflyCallbackBody'
> {
  if (completedPilotDay !== 6) {
    return {
      showButterflyCallback: false,
      butterflyCallbackTitle: null,
      butterflyCallbackBody: null,
    };
  }

  const style = gameState.pilot.flags.day1ResponseStyle;
  if (style == null || typeof style !== 'string') {
    return {
      showButterflyCallback: false,
      butterflyCallbackTitle: null,
      butterflyCallbackBody: null,
    };
  }

  const body = BUTTERFLY_DAY1_MESSAGES[style];
  if (!body) {
    return {
      showButterflyCallback: false,
      butterflyCallbackTitle: null,
      butterflyCallbackBody: null,
    };
  }

  return {
    showButterflyCallback: true,
    butterflyCallbackTitle: 'Önceki karar geri döndü',
    butterflyCallbackBody: body,
  };
}

function themeTone(theme: PilotDayTheme | undefined): GameChipTone {
  switch (theme) {
    case 'learning':
      return 'info';
    case 'complaint':
      return 'warning';
    case 'resource':
      return 'neutral';
    case 'social_pressure':
      return 'purple';
    case 'opportunity':
      return 'success';
    case 'butterfly_effect':
      return 'warning';
    case 'final_report':
      return 'purple';
    default:
      return 'neutral';
  }
}

export type GetPilotReportContextParams = {
  gameState: GameState;
  lastDailyReport?: DailyReport | null;
  lastClosedDay?: number | null;
  decisionHistory?: DecisionRecord[];
};

export function getPilotReportContext(
  params: GetPilotReportContextParams,
): PilotReportContext | null {
  const {
    gameState,
    lastDailyReport,
    lastClosedDay,
    decisionHistory = [],
  } = params;
  const pilot = gameState.pilot;

  if (pilot.status === 'not_started' || pilot.selectedDistrictId == null) {
    return null;
  }

  const completedPilotDay = resolveCompletedPilotDay(
    gameState,
    lastDailyReport,
    lastClosedDay,
  );
  const completedPlan = getPilotDayPlan(completedPilotDay);
  const copy = DAY_REPORT_COPY[completedPilotDay] ?? {
    headline: completedPlan?.title ?? 'Pilot günü tamamlandı',
    summary:
      completedPlan?.description ??
      'Gün sonu özeti pilot bağlamında güncellendi.',
    tone: themeTone(completedPlan?.theme),
  };

  const nextPilotDay = resolveNextPilotDay(gameState, completedPilotDay);
  const nextPlan =
    nextPilotDay != null ? getPilotDayPlan(nextPilotDay) : undefined;
  const nextThemeLabel = nextPlan
    ? PILOT_DAY_THEME_LABELS[nextPlan.theme]
    : null;

  const reportDay = lastDailyReport?.day ?? lastClosedDay ?? completedPilotDay;
  const butterfly = getButterflyCallback(gameState, completedPilotDay);
  const pilotReady = canCompletePilot(gameState);
  const pilotCompleted = pilot.status === 'completed' && pilot.finalResult != null;

  return {
    isVisible: true,
    completedPilotDay,
    completedPilotDayLabel: `Tamamlanan Gün: ${completedPilotDay}/${PILOT_SCENARIO_DAYS}`,
    completedPilotDayTitle: completedPlan?.title ?? `Gün ${completedPilotDay}`,
    completedPilotThemeLabel: completedPlan
      ? PILOT_DAY_THEME_LABELS[completedPlan.theme]
      : 'Pilot',
    completedPilotGoal:
      completedPlan?.goal ?? 'Pilot gün hedefi tamamlandı.',
    headline: copy.headline,
    summary: copy.summary,
    todayImpactHint: buildTodayImpactHint(decisionHistory, reportDay),
    nextPilotDay,
    nextPilotDayLabel:
      nextPilotDay != null
        ? `Sıradaki Gün: ${nextPilotDay}/${PILOT_SCENARIO_DAYS}`
        : null,
    nextPilotDayTitle: nextPlan?.title ?? null,
    nextPilotThemeLabel: nextThemeLabel,
    nextHint: buildNextHint(gameState, nextPilotDay, nextThemeLabel),
    reportTone: copy.tone,
    ...butterfly,
    showPilotReportCta: pilotReady && !pilotCompleted,
    showCompletedReportCta: pilotCompleted,
    finalResultScore: pilot.finalResult?.score ?? null,
    finalResultStatusLabel: pilot.finalResult
      ? `${pilot.finalResult.score}/100`
      : null,
    finalResultStatusChip: pilot.finalResult
      ? PILOT_STATUS_LABELS[pilot.finalResult.status]
      : null,
  };
}
