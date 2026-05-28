import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyXpReport } from '@/core/xp/xpReport';
import { XP_CATEGORY_LABELS } from '@/core/xp/xpReport';
import type { XpCategory } from '@/core/xp/types';

export type EndOfDayMetricCardTone = 'green' | 'orange' | 'blue' | 'red';

export type EndOfDayMetricDetailLine = {
  label: string;
  value: string;
};

export type EndOfDayMetricCardModel = {
  key: string;
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  detailLines?: EndOfDayMetricDetailLine[];
  footer: string;
  footerTone?: 'default' | 'accent' | 'success' | 'danger';
  badge?: string;
  tone: EndOfDayMetricCardTone;
  showChevron?: boolean;
};

export type EndOfDayXpBreakdownItem = {
  icon: string;
  label: string;
  amount: number;
};

export type EndOfDayReportViewModel = {
  successScore: number;
  heroSubtitle: string;
  metricCards: EndOfDayMetricCardModel[];
  tomorrowNotes: string[];
  xpTotal: number;
  xpSubtitle: string;
  xpBreakdown: EndOfDayXpBreakdownItem[];
};

const XP_ICON_BY_CATEGORY: Record<XpCategory | 'other', string> = {
  event: 'checkmark-circle',
  daily_goal: 'locate',
  risk: 'shield-checkmark',
  efficiency: 'leaf',
  district: 'map',
  butterfly: 'git-branch',
  tutorial: 'school',
  other: 'star',
};

function clampPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function computeEndOfDaySuccessScore(
  report: DailyReport,
  metrics: GameMetrics,
): number {
  const goals = report.dailyGoalResults ?? [];
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const goalPct =
    goals.length > 0 ? (completedGoals / goals.length) * 100 : 72;

  const priorityScore = report.dailyPriorityResult?.score ?? 68;
  const warningPenalty = Math.min(18, (report.warnings?.length ?? 0) * 6);

  const raw =
    metrics.publicSatisfaction * 0.34 +
    metrics.staffMorale * 0.18 +
    goalPct * 0.24 +
    priorityScore * 0.24 -
    warningPenalty;

  return clampPercent(raw);
}

export function buildEndOfDayHeroSubtitle(successScore: number): string {
  if (successScore >= 82) {
    return 'Bugün sahada harika bir iş çıkardın! Ekip uyumu ve kaynak verimliliğin yüksek.';
  }
  if (successScore >= 65) {
    return 'Bugün dengeli bir operasyon yürüttün. Birkaç kritik noktaya dikkat et.';
  }
  if (successScore >= 45) {
    return 'Gün zorlu geçti; yarın öncelikleri netleştirerek toparlayabilirsin.';
  }
  return 'Saha baskısı yüksekti. Yarın kaynak ve ekip dengesine öncelik ver.';
}

function extractBusiestTeamFooter(personnelLines: string[]): string | null {
  const busiest = personnelLines.find((line) =>
    /yoğun|yorgunluk/i.test(line),
  );
  if (!busiest) return null;

  const percentMatch = busiest.match(/%(\d+)/);
  if (percentMatch) {
    const teamMatch = busiest.match(/^([^:]+)/);
    const teamLabel = teamMatch?.[1]?.trim() ?? 'Saha ekibi';
    return `En yoğun ekip (%${percentMatch[1]}) · ${teamLabel}`;
  }
  return busiest;
}

function buildPriorityCard(
  report: DailyReport,
  day1Line?: string | null,
  personnelLines: string[] = [],
): EndOfDayMetricCardModel | null {
  if (day1Line) {
    return {
      key: 'priority',
      title: 'Günün Önceliği',
      icon: 'locate',
      iconBg: '#E8F7F0',
      iconColor: '#27AE60',
      value: 'İlk Gün Odağı',
      footer: day1Line,
      footerTone: 'accent',
      tone: 'green',
    };
  }

  const result = report.dailyPriorityResult;
  if (!result) return null;

  const busiestFooter =
    extractBusiestTeamFooter(personnelLines) ??
    (result.score >= 60
      ? `Öncelik skoru %${result.score}`
      : 'Öncelik hedefi kısmen karşılandı');

  return {
    key: 'priority',
    title: 'Günün Önceliği',
    icon: 'locate',
    iconBg: '#E8F7F0',
    iconColor: '#27AE60',
    value: result.title,
    footer: busiestFooter,
    footerTone: 'accent',
    tone: 'green',
  };
}

function buildGoalsCard(
  results: DailyReport['dailyGoalResults'],
  tutorialLine?: string | null,
): EndOfDayMetricCardModel | null {
  if (tutorialLine) {
    return {
      key: 'goals',
      title: 'Günlük Hedefler',
      icon: 'bar-chart',
      iconBg: '#FDF4E6',
      iconColor: '#F39C12',
      value: 'Öğretici',
      footer: tutorialLine,
      tone: 'orange',
    };
  }

  if (!results?.length) return null;

  const completed = results.filter((r) => r.status === 'completed').length;
  const total = results.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total && total > 0;

  return {
    key: 'goals',
    title: 'Günlük Hedefler',
    icon: 'bar-chart',
    iconBg: '#FDF4E6',
    iconColor: '#F39C12',
    value: `${completed} / ${total}`,
    footer: allDone ? 'Hedeflerin tamamlandı!' : `${total - completed} hedef yarın taşınabilir`,
    footerTone: allDone ? 'success' : 'default',
    badge: allDone ? `%${pct}` : undefined,
    tone: 'orange',
  };
}

function buildPersonnelCard(
  metrics: GameMetrics,
  personnelLines: string[],
): EndOfDayMetricCardModel {
  const balanced =
    metrics.publicSatisfaction >= 50 && metrics.staffMorale >= 50;
  const moraleLow = metrics.staffMorale < 50;

  let footer = balanced ? 'Ekip dengede' : 'Ekip yükü artıyor';
  if (personnelLines.some((l) => /kritik|uyarı|düşük/i.test(l))) {
    footer = 'Personel nabzını izle';
  }

  return {
    key: 'personnel',
    title: 'Personel Özeti',
    icon: 'people',
    iconBg: '#EBF2FA',
    iconColor: '#3498DB',
    value: '',
    detailLines: [
      {
        label: 'Halk Memnuniyeti',
        value: `%${metrics.publicSatisfaction}`,
      },
      {
        label: 'Personel Morali',
        value: `%${metrics.staffMorale}`,
      },
    ],
    footer,
    footerTone: moraleLow ? 'danger' : balanced ? 'success' : 'default',
    tone: 'blue',
  };
}

function buildRisksCard(warnings: string[]): EndOfDayMetricCardModel {
  const count = warnings.length;
  return {
    key: 'risks',
    title: 'Risk / Uyarılar',
    icon: 'warning',
    iconBg: '#FDEEED',
    iconColor: '#E74C3C',
    value: count === 0 ? 'Uyarı yok' : `${count} Uyarı`,
    footer:
      warnings[0] ??
      'Çözülmemiş olaylar yarın risk oluşturabilir.',
    footerTone: count > 0 ? 'danger' : 'default',
    tone: 'red',
    showChevron: count > 0,
  };
}

export function buildEndOfDayTomorrowNotes(report: DailyReport): string[] {
  const candidates: string[] = [
    ...(report.carryOverSummaryLines ?? []),
    ...(report.butterflySummaryLines ?? []),
    ...(report.containerSummaryLines ?? []),
    ...(report.quickActionSummaryLines ?? []),
    ...(report.highlights ?? []),
    ...(report.summaryLines ?? []),
    ...(report.personnelSummaryLines ?? []).filter((l) =>
      /yarın|devam|taşın|koru|artabilir/i.test(l),
    ),
  ];

  const unique: string[] = [];
  for (const line of candidates) {
    const trimmed = line.trim();
    if (!trimmed || unique.includes(trimmed)) continue;
    unique.push(trimmed);
    if (unique.length >= 4) break;
  }

  if (unique.length === 0) {
    return [
      'Gün özeti kayda geçti; yarın operasyon merkezinden devam edebilirsin.',
    ];
  }

  return unique;
}

function buildXpBreakdown(dailyXpReport: DailyXpReport): EndOfDayXpBreakdownItem[] {
  return dailyXpReport.categories.slice(0, 4).map((group) => {
    const category = group.category;
    const icon =
      category !== 'other' && category in XP_ICON_BY_CATEGORY
        ? XP_ICON_BY_CATEGORY[category as XpCategory]
        : XP_ICON_BY_CATEGORY.other;
    const label =
      category !== 'other' && category in XP_CATEGORY_LABELS
        ? XP_CATEGORY_LABELS[category as XpCategory]
        : group.label;
    return { icon, label, amount: group.total };
  });
}

export function buildEndOfDayReportViewModel(params: {
  report: DailyReport;
  metrics: GameMetrics;
  dailyXpReport: DailyXpReport;
  day1PriorityLine?: string | null;
  day1GoalsLine?: string | null;
}): EndOfDayReportViewModel {
  const { report, metrics, dailyXpReport, day1PriorityLine, day1GoalsLine } =
    params;
  const successScore = computeEndOfDaySuccessScore(report, metrics);
  const personnelLines = report.personnelSummaryLines ?? [];
  const warnings = report.warnings ?? [];

  const metricCards: EndOfDayMetricCardModel[] = [];

  const priorityCard = buildPriorityCard(
    report,
    day1PriorityLine,
    personnelLines,
  );
  if (priorityCard) metricCards.push(priorityCard);

  const goalsCard = buildGoalsCard(
    report.dailyGoalResults,
    day1GoalsLine,
  );
  if (goalsCard) metricCards.push(goalsCard);

  metricCards.push(buildPersonnelCard(metrics, personnelLines));
  metricCards.push(buildRisksCard(warnings));

  return {
    successScore,
    heroSubtitle: buildEndOfDayHeroSubtitle(successScore),
    metricCards,
    tomorrowNotes: buildEndOfDayTomorrowNotes(report),
    xpTotal: dailyXpReport.totalXp,
    xpSubtitle: 'Bugünkü kararların ilerlemene işlendi.',
    xpBreakdown: buildXpBreakdown(dailyXpReport),
  };
}
