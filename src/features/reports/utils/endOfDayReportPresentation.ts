import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import {
  buildDecisionConsequenceThreadsFromReport,
  buildPrimaryTomorrowActionFromThreads,
} from '@/core/decisionConsequence';
import {
  buildPortfolioDeferReportLine,
  buildPortfolioDeferTomorrowActionLine,
  type PortfolioDeferRiskResult,
} from '@/core/portfolioDeferRisk';
import {
  buildReportOneMoreDayCardModel,
  type OneMoreDayRetentionResult,
  type ReportOneMoreDayCardModel,
} from '@/core/oneMoreDayRetention';
import {
  buildPrimaryFollowUpActionCard,
  type FollowUpActionCardModel,
  type FollowUpActionResult,
} from '@/core/followUpActions';
import {
  buildReportFollowUpExecutionNote,
  type FollowUpExecutionResult,
} from '@/core/followUpExecution';
import {
  buildReportDominantStrategyNote,
  type DominantStrategyDetectorResult,
} from '@/core/dominantStrategyDetector';
import {
  buildEceStrategyLineCardModel,
  type EceStrategyLineCardModel,
  type EceStrategyLineResult,
} from '@/core/eceStrategyLines';
import {
  buildReportCityMemoryNote,
  type CityMemoryTraceCardModel,
  type CityMemoryVisibilityResult,
} from '@/core/cityMemoryVisibility';
import { buildReportCityRhythmNote } from '@/core/cityRhythmDirector';
import { buildReportDay8StrategicContentNote } from '@/core/day8StrategicContent';
import { buildReportDistrictNeglectRecoveryNote } from '@/core/districtNeglectRecovery';
import type { DistrictNeglectRecoveryResult } from '@/core/districtNeglectRecovery';
import type { MemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import { buildReportPositiveComebackNote } from '@/core/positiveComeback';
import { buildReportResourcePressureNote } from '@/core/resourcePressureDifferentiation';
import type { PositiveComebackResult } from '@/core/positiveComeback';
import { buildPostPilotReportCopy } from '@/core/postPilot/postPilotOperationUxPresentation';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
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

export type EndOfDayImpactMetric = {
  key: string;
  label: string;
  value: string;
  tone: 'teal' | 'mint' | 'gold' | 'warn';
};

export type EndOfDaySystemSummarySection = {
  key: string;
  title: string;
  icon: string;
  lines: string[];
};

export type EndOfDayXpBreakdownItem = {
  icon: string;
  label: string;
  amount: number;
};

export type EndOfDayReportViewModel = {
  day: number;
  isDay1: boolean;
  isDay7: boolean;
  successScore: number;
  statusTitle: string;
  heroSubtitle: string;
  impactMetrics: EndOfDayImpactMetric[];
  metricCards: EndOfDayMetricCardModel[];
  systemSections: EndOfDaySystemSummarySection[];
  tomorrowNotes: string[];
  oneMoreDayCard?: ReportOneMoreDayCardModel | null;
  eceStrategyLine?: EceStrategyLineCardModel | null;
  cityMemoryNote?: CityMemoryTraceCardModel | null;
  followUpActionHint?: FollowUpActionCardModel | null;
  followUpExecutionNote?: string | null;
  positiveComebackNote?: string | null;
  districtNeglectRecoveryNote?: string | null;
  day8StrategicContentNote?: string | null;
  cityRhythmNote?: string | null;
  resourcePressureNote?: string | null;
  dominantStrategyNote?: string | null;
  showXpCard: boolean;
  showSystemSummaries: boolean;
  showTomorrowNotes: boolean;
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

export const REPORT_UI_BANNED_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'yetkin yetersiz',
  'paywall',
] as const;

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

export function buildEndOfDayStatusTitle(successScore: number): string {
  if (successScore >= 82) return 'Güçlü Gün';
  if (successScore >= 65) return 'Dengeli Gün';
  if (successScore >= 45) return 'Zorlu Gün';
  return 'Baskılı Gün';
}

export function buildEndOfDayHeroSubtitle(successScore: number): string {
  if (successScore >= 82) {
    return 'Bugün sahada güçlü bir sonuç çıkardın. Ekip uyumu ve kaynak verimliliğin yüksek.';
  }
  if (successScore >= 65) {
    return 'Bugün dengeli bir operasyon yürüttün. Birkaç kritik noktaya dikkat et.';
  }
  if (successScore >= 45) {
    return 'Gün zorlu geçti; yarın öncelikleri netleştirerek toparlayabilirsin.';
  }
  return 'Saha baskısı yüksekti. Yarın kaynak ve ekip dengesine öncelik ver.';
}

export function buildEndOfDayImpactMetrics(
  metrics: GameMetrics,
): EndOfDayImpactMetric[] {
  const budgetTone: EndOfDayImpactMetric['tone'] =
    metrics.budget < 50_000 ? 'warn' : 'gold';

  return [
    {
      key: 'public',
      label: 'Halk',
      value: `%${metrics.publicSatisfaction}`,
      tone: 'teal',
    },
    {
      key: 'team',
      label: 'Ekip',
      value: `%${metrics.staffMorale}`,
      tone: 'mint',
    },
    {
      key: 'budget',
      label: 'Kaynak',
      value: formatSourceWithLabel(metrics.budget),
      tone: budgetTone,
    },
  ];
}

export function buildEndOfDaySystemSummarySections(
  report: DailyReport,
  maxLinesPerSection = 2,
): EndOfDaySystemSummarySection[] {
  const sections: EndOfDaySystemSummarySection[] = [
    {
      key: 'container',
      title: 'Atık',
      icon: 'trash-outline',
      lines: (report.containerSummaryLines ?? []).slice(0, maxLinesPerSection),
    },
    {
      key: 'vehicle',
      title: 'Araç',
      icon: 'car-outline',
      lines: (report.vehicleSummaryLines ?? []).slice(0, maxLinesPerSection),
    },
    {
      key: 'personnel',
      title: 'Personel',
      icon: 'people-outline',
      lines: (report.personnelSummaryLines ?? []).slice(0, maxLinesPerSection),
    },
    {
      key: 'social',
      title: 'Sosyal',
      icon: 'chatbubbles-outline',
      lines: (report.socialSummaryLines ?? []).slice(0, maxLinesPerSection),
    },
  ];

  return sections.filter((section) => section.lines.length > 0);
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

export function buildEndOfDayTomorrowNotes(
  report: DailyReport,
  maxNotes = 3,
  portfolioDeferRisk?: PortfolioDeferRiskResult | null,
): string[] {
  const consequenceThreads = buildDecisionConsequenceThreadsFromReport(report);
  const primaryTomorrowAction =
    report.day > 1
      ? buildPrimaryTomorrowActionFromThreads(
          consequenceThreads,
          'Yarin aktif hedefle devam et.',
        )
      : null;
  const portfolioTomorrowAction = buildPortfolioDeferTomorrowActionLine(portfolioDeferRisk, [
    primaryTomorrowAction ?? '',
    ...(report.summaryLines ?? []),
  ]);
  const portfolioReportLine = buildPortfolioDeferReportLine(portfolioDeferRisk, [
    primaryTomorrowAction ?? '',
    portfolioTomorrowAction ?? '',
    ...(report.summaryLines ?? []),
  ]);
  const candidates: string[] = [
    ...(primaryTomorrowAction ? [primaryTomorrowAction] : []),
    ...(portfolioTomorrowAction ? [portfolioTomorrowAction] : []),
    ...(portfolioReportLine ? [portfolioReportLine] : []),
    ...(report.carryOverSummaryLines ?? []),
    ...(report.butterflySummaryLines ?? []),
    ...(report.quickActionSummaryLines ?? []),
    ...(report.highlights ?? []),
    ...(report.summaryLines ?? []),
    ...(report.personnelSummaryLines ?? []).filter((l) =>
      /yarın|devam|taşın|koru|artabilir/i.test(l),
    ),
  ];

  const unique: string[] = [];
  let usedPrimaryTomorrowAction = false;
  for (const line of candidates) {
    const trimmed = line.trim();
    if (!trimmed || unique.includes(trimmed)) continue;
    const looksLikeTomorrowAction = /yarin|yarÄ±n|yarın/i.test(trimmed);
    if (primaryTomorrowAction && usedPrimaryTomorrowAction && looksLikeTomorrowAction) {
      continue;
    }
    unique.push(trimmed);
    if (looksLikeTomorrowAction) usedPrimaryTomorrowAction = true;
    if (unique.length >= maxNotes) break;
  }

  if (unique.length === 0) {
    return report.day === 1
      ? []
      : [
          'Gün özeti kayda geçti; yarın operasyon merkezinden devam edebilirsin.',
        ];
  }

  return unique;
}

function buildXpBreakdown(dailyXpReport: DailyXpReport): EndOfDayXpBreakdownItem[] {
  return dailyXpReport.categories.slice(0, 3).map((group) => {
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

export function collectReportPresentationStrings(
  model: EndOfDayReportViewModel,
  report: DailyReport,
): string[] {
  return [
    model.statusTitle,
    model.heroSubtitle,
    model.xpSubtitle,
    model.eceStrategyLine?.text,
    model.cityMemoryNote?.line,
    model.followUpActionHint?.line,
    model.followUpExecutionNote,
    model.dominantStrategyNote,
    ...model.impactMetrics.map((metric) => `${metric.label} ${metric.value}`),
    ...(report.authoritySummaryLines ?? []),
    ...(report.badgeSummaryLines ?? []),
    ...model.tomorrowNotes,
    ...model.systemSections.flatMap((section) => section.lines),
  ].filter((line): line is string => Boolean(line));
}

export function reportPresentationContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return REPORT_UI_BANNED_WORDS.filter((word) => {
    if (word === 'xp') {
      return /\bxp\b/.test(haystack);
    }
    return haystack.includes(word);
  });
}

export function buildEndOfDayReportViewModel(params: {
  report: DailyReport;
  metrics: GameMetrics;
  dailyXpReport: DailyXpReport;
  day1PriorityLine?: string | null;
  day1GoalsLine?: string | null;
  /** Post-pilot hafif operasyon günü raporu başlık tonu */
  postPilotLightDay?: boolean;
  portfolioDeferRisk?: PortfolioDeferRiskResult | null;
  oneMoreDayRetention?: OneMoreDayRetentionResult | null;
  eceStrategyLines?: EceStrategyLineResult | null;
  cityMemoryVisibility?: CityMemoryVisibilityResult | null;
  followUpActions?: FollowUpActionResult | null;
  followUpExecution?: FollowUpExecutionResult | null;
  dominantStrategyDetector?: DominantStrategyDetectorResult | null;
  positiveComeback?: PositiveComebackResult | null;
  memoryFollowUpContext?: MemoryFollowUpPresentationContext | null;
}): EndOfDayReportViewModel {
  const {
    report,
    metrics,
    dailyXpReport,
    day1PriorityLine,
    day1GoalsLine,
    postPilotLightDay,
    portfolioDeferRisk,
    oneMoreDayRetention,
    eceStrategyLines,
    cityMemoryVisibility,
    followUpActions,
    followUpExecution,
    dominantStrategyDetector,
    positiveComeback,
    memoryFollowUpContext,
  } = params;

  const resolvedPortfolioDefer =
    memoryFollowUpContext?.portfolioDeferRisk ?? portfolioDeferRisk ?? null;
  const resolvedOneMoreDay =
    memoryFollowUpContext?.oneMoreDayRetention ?? oneMoreDayRetention ?? null;
  const resolvedEce =
    memoryFollowUpContext?.eceStrategyLines ?? eceStrategyLines ?? null;
  const resolvedCityMemory =
    memoryFollowUpContext?.cityMemoryVisibility ?? cityMemoryVisibility ?? null;
  const resolvedFollowUp =
    memoryFollowUpContext?.followUpActions ?? followUpActions ?? null;
  const resolvedFollowUpExecution =
    memoryFollowUpContext?.followUpExecution ?? followUpExecution ?? null;
  const resolvedDominantStrategyDetector =
    memoryFollowUpContext?.dominantStrategyDetector ?? dominantStrategyDetector ?? null;
  const resolvedPositiveComeback =
    memoryFollowUpContext?.positiveComeback ?? positiveComeback ?? null;
  const resolvedDistrictNeglectRecovery =
    memoryFollowUpContext?.districtNeglectRecovery ?? null;
  const resolvedDay8StrategicContent =
    memoryFollowUpContext?.day8StrategicContent ?? null;
  const resolvedCityRhythmDirector =
    memoryFollowUpContext?.cityRhythmDirector ?? null;

  const resolvedResourcePressureDifferentiation =
    memoryFollowUpContext?.resourcePressureDifferentiation ?? null;
  const isDay1 = report.day === 1;
  const isDay7 = report.day === 7;
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

  const goalsCard = buildGoalsCard(report.dailyGoalResults, day1GoalsLine);
  if (goalsCard) metricCards.push(goalsCard);

  metricCards.push(buildPersonnelCard(metrics, personnelLines));
  metricCards.push(buildRisksCard(warnings));
  const tomorrowNotes = buildEndOfDayTomorrowNotes(
    report,
    isDay7 ? 2 : isDay1 ? 1 : 3,
    resolvedPortfolioDefer,
  );
  const oneMoreDayCard = buildReportOneMoreDayCardModel(resolvedOneMoreDay, [
    ...(report.summaryLines ?? []),
    ...(report.highlights ?? []),
    ...(report.carryOverSummaryLines ?? []),
  ]);
  const eceStrategyLine = buildEceStrategyLineCardModel(resolvedEce, 'report', [
    oneMoreDayCard?.line,
    oneMoreDayCard?.tomorrowLine,
    ...tomorrowNotes,
    ...(report.summaryLines ?? []),
    ...(report.highlights ?? []),
  ]);
  const cityMemoryNote = isDay1
    ? null
    : buildReportCityMemoryNote(resolvedCityMemory, [
    oneMoreDayCard?.line,
    oneMoreDayCard?.tomorrowLine,
    eceStrategyLine?.text,
    ...tomorrowNotes,
    ...(report.summaryLines ?? []),
    ...(report.highlights ?? []),
    ...(report.carryOverSummaryLines ?? []),
  ].filter((line): line is string => Boolean(line)));
  const followUpActionHint = isDay1
    ? null
    : buildPrimaryFollowUpActionCard(resolvedFollowUp);
  const followUpHintDeduped =
    followUpActionHint &&
    ![oneMoreDayCard?.line, oneMoreDayCard?.tomorrowLine, eceStrategyLine?.text, cityMemoryNote?.line]
      .filter(Boolean)
      .some((line) => line && followUpActionHint.line.toLowerCase().includes(line.toLowerCase()))
      ? followUpActionHint
      : followUpActionHint &&
          cityMemoryNote?.line &&
          followUpActionHint.line.toLowerCase() === cityMemoryNote.line.toLowerCase()
        ? null
        : followUpActionHint;

  const followUpExecutionNote = isDay1
    ? null
    : buildReportFollowUpExecutionNote(resolvedFollowUpExecution, [
        oneMoreDayCard?.line,
        oneMoreDayCard?.tomorrowLine,
        eceStrategyLine?.text,
        cityMemoryNote?.line,
        followUpHintDeduped?.line,
        ...tomorrowNotes,
      ].filter((line): line is string => Boolean(line))) ?? null;

  const positiveComebackNote = isDay1
    ? null
    : buildReportPositiveComebackNote(resolvedPositiveComeback, [
        oneMoreDayCard?.line,
        oneMoreDayCard?.tomorrowLine,
        eceStrategyLine?.text,
        cityMemoryNote?.line,
        followUpHintDeduped?.line,
        followUpExecutionNote,
        ...tomorrowNotes,
      ].filter((line): line is string => Boolean(line)));

  const districtNeglectRecoveryNote = isDay1
    ? null
    : buildReportDistrictNeglectRecoveryNote(resolvedDistrictNeglectRecovery, [
        oneMoreDayCard?.line,
        oneMoreDayCard?.tomorrowLine,
        eceStrategyLine?.text,
        cityMemoryNote?.line,
        followUpHintDeduped?.line,
        followUpExecutionNote,
        positiveComebackNote,
        ...tomorrowNotes,
      ].filter((line): line is string => Boolean(line)));

  const day8StrategicContentNote =
    isDay1 || report.day < 8
      ? null
      : buildReportDay8StrategicContentNote(resolvedDay8StrategicContent, [
          oneMoreDayCard?.line,
          oneMoreDayCard?.tomorrowLine,
          eceStrategyLine?.text,
          cityMemoryNote?.line,
          followUpHintDeduped?.line,
          followUpExecutionNote,
          positiveComebackNote,
          districtNeglectRecoveryNote,
          ...tomorrowNotes,
        ].filter((line): line is string => Boolean(line)));

  const cityRhythmNote =
    isDay1 || report.day < 8
      ? null
      : buildReportCityRhythmNote(resolvedCityRhythmDirector, [
          oneMoreDayCard?.line,
          oneMoreDayCard?.tomorrowLine,
          eceStrategyLine?.text,
          cityMemoryNote?.line,
          followUpHintDeduped?.line,
          followUpExecutionNote,
          positiveComebackNote,
          districtNeglectRecoveryNote,
          day8StrategicContentNote,
          ...tomorrowNotes,
        ].filter((line): line is string => Boolean(line)));

  const resourcePressureNote =
    isDay1 || report.day < 8
      ? null
      : buildReportResourcePressureNote(resolvedResourcePressureDifferentiation, [
          oneMoreDayCard?.line,
          oneMoreDayCard?.tomorrowLine,
          eceStrategyLine?.text,
          cityMemoryNote?.line,
          followUpHintDeduped?.line,
          followUpExecutionNote,
          positiveComebackNote,
          districtNeglectRecoveryNote,
          day8StrategicContentNote,
          cityRhythmNote,
          ...tomorrowNotes,
        ].filter((line): line is string => Boolean(line)));

  const dominantStrategyNote =
    isDay1 || report.day < 4
      ? null
      : buildReportDominantStrategyNote(resolvedDominantStrategyDetector, [
          oneMoreDayCard?.line,
          oneMoreDayCard?.tomorrowLine,
          eceStrategyLine?.text,
          cityMemoryNote?.line,
          followUpHintDeduped?.line,
          followUpExecutionNote,
          positiveComebackNote,
          districtNeglectRecoveryNote,
          day8StrategicContentNote,
          cityRhythmNote,
          resourcePressureNote,
          ...tomorrowNotes,
        ].filter((line): line is string => Boolean(line))) ?? null;

  return {
    day: report.day,
    isDay1,
    isDay7,
    successScore,
    statusTitle: postPilotLightDay
      ? buildPostPilotReportCopy(
          Math.max(POST_PILOT_FIRST_OPERATION_DAY, report.day),
        ).statusTitle
      : buildEndOfDayStatusTitle(successScore),
    heroSubtitle: postPilotLightDay
      ? buildPostPilotReportCopy(
          Math.max(POST_PILOT_FIRST_OPERATION_DAY, report.day),
        ).heroSubtitle
      : buildEndOfDayHeroSubtitle(successScore),
    impactMetrics: buildEndOfDayImpactMetrics(metrics),
    metricCards,
    systemSections: buildEndOfDaySystemSummarySections(report, 2),
    oneMoreDayCard,
    eceStrategyLine,
    cityMemoryNote,
    followUpActionHint: followUpHintDeduped,
    followUpExecutionNote,
    positiveComebackNote,
    districtNeglectRecoveryNote,
    day8StrategicContentNote,
    cityRhythmNote,
    resourcePressureNote,
    dominantStrategyNote,
    tomorrowNotes,
    showXpCard: !isDay1 && dailyXpReport.totalXp > 0,
    showSystemSummaries: !isDay1,
    showTomorrowNotes: !isDay1 || (day1GoalsLine?.length ?? 0) > 0,
    xpTotal: dailyXpReport.totalXp,
    xpSubtitle: 'Bugünkü kararların ilerlemene işlendi.',
    xpBreakdown: buildXpBreakdown(dailyXpReport),
  };
}
