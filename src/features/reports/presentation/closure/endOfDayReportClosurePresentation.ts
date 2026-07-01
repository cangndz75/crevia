import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import type { ReportReplayContextInput } from '@/core/reportReplay';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { buildMaintenanceEconomyClosureBridge } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { buildReportReadinessMemory } from '@/core/readinessStrategicPriority/readinessSurfaceBridge';
import type { ReadinessReportMemoryPresentation } from '@/core/readinessStrategicPriority/readinessStrategicPriorityTypes';

import {
  buildEndOfDayClosingTonePresentation,
  type EndOfDayClosingTonePresentation,
} from './endOfDayReportClosingTonePresentation';
import {
  buildEndOfDayDecisionStoryPresentation,
  type EndOfDayDecisionStoryPresentation,
} from './endOfDayDecisionStoryPresentation';
import {
  buildEndOfDayNeighborhoodPulsePresentation,
  type EndOfDayNeighborhoodPulsePresentation,
} from './endOfDayNeighborhoodPulsePresentation';
import {
  buildEndOfDayTradeoffBalancePresentation,
  type EndOfDayTradeoffBalancePresentation,
} from './endOfDayTradeoffBalancePresentation';
import {
  buildEndOfDayTomorrowFocusPresentation,
  type EndOfDayTomorrowFocusPresentation,
} from './endOfDayTomorrowFocusPresentation';
import {
  buildEndOfDayReplayTimelinePresentation,
  type EndOfDayReplayTimelinePresentation,
} from './endOfDayReplayTimelinePresentation';
import {
  buildEndOfDayManagerStyleSurface,
  type EndOfDayManagerStyleSurface,
} from './endOfDayManagerStylePresentation';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

export type ClosureOutcomeChip = {
  key: string;
  label: string;
  value?: string;
  tone: 'positive' | 'neutral' | 'warning' | 'teal';
};

export type EndOfDayClosureHeroPresentation = {
  day: number;
  closingTitle: string;
  closingSummary: string;
  statusBadge: string;
  badgeTone: EndOfDayClosingTonePresentation['badgeTone'];
  successScore: number;
  showScoreRing: boolean;
};

export type EndOfDayEceClosingPresentation = {
  visible: boolean;
  line: string;
};

export type EndOfDayReportClosurePresentation = {
  isDay1: boolean;
  isRichDay: boolean;
  hero: EndOfDayClosureHeroPresentation;
  closingTone: EndOfDayClosingTonePresentation;
  outcomeChips: ClosureOutcomeChip[];
  decisionStory: EndOfDayDecisionStoryPresentation;
  neighborhoodPulse: EndOfDayNeighborhoodPulsePresentation;
  tradeoffBalance: EndOfDayTradeoffBalancePresentation;
  tomorrowFocus: EndOfDayTomorrowFocusPresentation;
  eceClosing: EndOfDayEceClosingPresentation;
  replayTimeline: EndOfDayReplayTimelinePresentation;
  readinessMemory: ReadinessReportMemoryPresentation;
  managerStyle: EndOfDayManagerStyleSurface;
  primaryCtaLabel: string;
  secondaryCtaLabels: string[];
  collectStrings: () => string[];
};

export type BuildEndOfDayReportClosureInput = {
  day: number;
  metrics: GameMetrics;
  successScore?: number;
  decisionsToday: DecisionRecord[];
  criticalDecision?: DecisionRecord | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  socialPulseScore?: number;
  districtReportLine?: string | null;
  socialEchoMessage?: string | null;
  managementStyleLine?: string | null;
  decisionImpactLine?: string | null;
  tomorrowNotes?: string[];
  tomorrowPreparationLine?: string | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  carryOverSummary?: string | null;
  cliffhangerFocus?: string | null;
  eceStrategyLine?: string | null;
  eceAdvisorLine?: string | null;
  maintenanceRiskHigh?: boolean;
  resourcePressureHigh?: boolean;
  periodGoalProgress?: boolean;
  streakDays?: number;
  replayInput: ReportReplayContextInput;
  hideScoreRing?: boolean;
  avoidLines?: string[];
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
  strategyHistory?: StrategyHistoryStateV1 | null;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  dominantStrategyNote?: string | null;
  districtNeglectRecoveryNote?: string | null;
  positiveComebackNote?: string | null;
  decisionHistory?: Array<{
    day: number;
    decisionLabel: string;
    eventTitle: string;
  }>;
  showManagerStyleCta?: boolean;
};

const MAX_OUTCOME_CHIPS = 4;

function deriveClosureSuccessScore(metrics: GameMetrics, override?: number): number {
  if (override != null) return Math.round(Math.min(100, Math.max(0, override)));
  const raw =
    metrics.publicSatisfaction * 0.45 +
    metrics.staffMorale * 0.25 +
    (metrics.budget >= 50_000 ? 72 : 48) * 0.3;
  return Math.round(Math.min(100, Math.max(0, raw)));
}
function clampLine(text: string, max = 100): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function sumTrustDelta(decisions: DecisionRecord[]): number {
  return decisions.reduce((sum, r) => {
    const v = r.appliedEffects.publicSatisfaction ?? r.appliedEffects.trust ?? 0;
    return sum + v;
  }, 0);
}

function buildOutcomeChips(
  metrics: GameMetrics,
  socialPulseScore: number,
  maintenanceRiskHigh: boolean,
  tone: EndOfDayClosingTonePresentation,
): ClosureOutcomeChip[] {
  const chips: ClosureOutcomeChip[] = [
    {
      key: 'trust',
      label: 'Güven',
      value: `%${metrics.publicSatisfaction}`,
      tone: metrics.publicSatisfaction >= 58 ? 'positive' : 'warning',
    },
    {
      key: 'resource',
      label: 'Kaynak',
      value: metrics.budget >= 50_000 ? 'Dengede' : 'Baskı',
      tone: metrics.budget >= 50_000 ? 'teal' : 'warning',
    },
    {
      key: 'readiness',
      label: 'Hazırlık',
      value: maintenanceRiskHigh ? 'Risk' : 'İzlendi',
      tone: maintenanceRiskHigh ? 'warning' : 'neutral',
    },
    {
      key: 'pulse',
      label: 'Şehir Nabzı',
      value: socialPulseScore >= 58 ? 'Stabil' : 'Kırılgan',
      tone: socialPulseScore >= 58 ? 'positive' : 'warning',
    },
  ];

  if (tone.chipAccents[0]) {
    chips[0] = { ...chips[0], label: tone.chipAccents[0].split(' ')[0] ?? chips[0].label };
  }

  return chips.slice(0, MAX_OUTCOME_CHIPS);
}

function buildEceClosingLine(input: BuildEndOfDayReportClosureInput): EndOfDayEceClosingPresentation {
  const avoid = input.avoidLines ?? [];
  const candidates = [
    input.eceAdvisorLine,
    input.eceStrategyLine,
    input.cityReaction?.advisorNote,
  ].filter((line): line is string => Boolean(line?.trim()));

  for (const candidate of candidates) {
    const norm = candidate.toLocaleLowerCase('tr-TR');
    const dup = avoid.some((a) => {
      const an = a.toLocaleLowerCase('tr-TR');
      return an.length > 12 && (norm.includes(an) || an.includes(norm));
    });
    if (!dup && candidate.length <= 140) {
      return { visible: true, line: clampLine(candidate, 120) };
    }
  }

  if (input.day === 1) {
    return {
      visible: true,
      line: 'Bugün ilk kararının etkisini gördün. Yarın kaynak ve güven dengesini birlikte düşün.',
    };
  }

  const style = input.managementStyleLine?.split('.')[0]?.trim();
  if (input.day >= 8 && style) {
    return {
      visible: true,
      line: clampLine(
        `${style} çizgin güçlendi. Yarın ekip yorgunluğu bu tempoyu sınırlayabilir.`,
        120,
      ),
    };
  }

  return {
    visible: true,
    line: 'Bugün kontrollü kapandı. Yarın önceliği tek bir riske odakla.',
  };
}

export function buildEndOfDayReportClosurePresentation(
  input: BuildEndOfDayReportClosureInput,
): EndOfDayReportClosurePresentation {
  const isDay1 = input.day <= 1;
  const isRichDay = input.day >= 8;
  const successScore = deriveClosureSuccessScore(input.metrics, input.successScore);
  const trustDelta = sumTrustDelta(input.decisionsToday);

  const closingTone = buildEndOfDayClosingTonePresentation({
    day: input.day,
    successScore,
    metrics: input.metrics,
    trustDelta,
    resourcePressureHigh: input.resourcePressureHigh,
    maintenanceRiskHigh: input.maintenanceRiskHigh,
    socialPulseScore: input.socialPulseScore,
    tomorrowRiskHigh: input.tomorrowRisk?.priority === 'high',
    periodGoalProgress: input.periodGoalProgress,
    streakDays: input.streakDays,
  });

  const avoid = [
    ...(input.avoidLines ?? []),
    closingTone.heroSummary,
    closingTone.heroTitle,
  ];

  const decisionStory = buildEndOfDayDecisionStoryPresentation({
    day: input.day,
    metrics: input.metrics,
    decisionsToday: input.decisionsToday,
    criticalDecision: input.criticalDecision,
    cityReaction: input.cityReaction,
    managementStyleLine: isRichDay ? input.managementStyleLine : null,
    decisionImpactLine: input.decisionImpactLine,
    avoidLines: avoid,
  });

  const neighborhoodPulse = buildEndOfDayNeighborhoodPulsePresentation({
    day: input.day,
    socialPulseScore: input.socialPulseScore,
    districtReportLine: input.districtReportLine,
    cityReaction: input.cityReaction,
    socialEchoMessage: input.socialEchoMessage,
    lastDistrictName: input.criticalDecision?.neighborhoodName,
    avoidLines: [...avoid, decisionStory.decisionSentence],
  });

  const maintenanceBridge = buildMaintenanceEconomyClosureBridge({
    day: input.day,
    runtime: input.maintenanceBacklogRuntime,
    resourcePressureHigh: input.resourcePressureHigh,
  });

  const tradeoffBalance = buildEndOfDayTradeoffBalancePresentation({
    day: input.day,
    metrics: input.metrics,
    decisionsToday: input.decisionsToday,
    maintenanceRiskHigh: input.maintenanceRiskHigh,
    resourcePressureHigh: input.resourcePressureHigh,
    trustDelta,
  });
  if (maintenanceBridge.gainLabel && tradeoffBalance.gains.length < 3) {
    tradeoffBalance.gains.unshift({
      key: 'maintenance_gain',
      label: maintenanceBridge.gainLabel,
      tone: 'gain',
    });
  }
  if (maintenanceBridge.costLabel && tradeoffBalance.costs.length < 3) {
    tradeoffBalance.costs.unshift({
      key: 'maintenance_cost',
      label: maintenanceBridge.costLabel,
      tone: 'cost',
    });
  }

  const tomorrowFocus = buildEndOfDayTomorrowFocusPresentation({
    day: input.day,
    tomorrowNotes: input.tomorrowNotes,
    tomorrowPreparationLine: maintenanceBridge.tomorrowHint ?? input.tomorrowPreparationLine,
    tomorrowRisk: input.tomorrowRisk,
    carryOverSummary: input.carryOverSummary,
    cliffhangerFocus: input.cliffhangerFocus,
    avoidLines: [
      ...avoid,
      decisionStory.decisionSentence,
      neighborhoodPulse.headline,
    ],
  });

  const eceClosing = buildEceClosingLine({
    ...input,
    avoidLines: [
      ...avoid,
      decisionStory.decisionSentence,
      neighborhoodPulse.headline,
      tomorrowFocus.focusLine,
    ],
  });

  const replayTimeline = buildEndOfDayReplayTimelinePresentation({
    ...input.replayInput,
    day: input.day,
    isDay1,
  });

  const readinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'report',
    day: input.day,
    moraleDelta: input.metrics.staffMorale < 48 ? -3 : 0,
    budgetDelta: input.metrics.budget < 50_000 ? -3 : 0,
    eventRiskLevel: input.maintenanceRiskHigh ? 'high' : 'medium',
  });
  const readinessMemory = buildReportReadinessMemory({
    day: input.day,
    readinessSnapshot,
    memoryStreakDays: input.streakDays,
    socialPressure: (input.socialPulseScore ?? input.metrics.publicSatisfaction) < 50,
  });

  const managerStyle = buildEndOfDayManagerStyleSurface({
    day: input.day,
    metrics: input.metrics,
    decisionsToday: input.decisionsToday,
    criticalDecision: input.criticalDecision,
    decisionHistory: input.decisionHistory,
    strategyHistory: input.strategyHistory,
    dominantStrategy: input.dominantStrategy,
    dominantStrategyNote: input.dominantStrategyNote,
    managementStyleLine: input.managementStyleLine,
    districtNeglectRecoveryNote: input.districtNeglectRecoveryNote,
    positiveComebackNote: input.positiveComebackNote,
    tomorrowFocusLine: tomorrowFocus.focusLine,
    socialPulseScore: input.socialPulseScore,
    showStyleDetailCta: input.showManagerStyleCta ?? !isDay1,
    avoidLines: [
      ...avoid,
      decisionStory.decisionSentence,
      neighborhoodPulse.headline,
      tomorrowFocus.focusLine,
      eceClosing.line,
    ],
  });

  const outcomeChips = isDay1
    ? buildOutcomeChips(
        input.metrics,
        input.socialPulseScore ?? input.metrics.publicSatisfaction,
        input.maintenanceRiskHigh ?? false,
        closingTone,
      ).slice(0, 2)
    : buildOutcomeChips(
        input.metrics,
        input.socialPulseScore ?? input.metrics.publicSatisfaction,
        input.maintenanceRiskHigh ?? false,
        closingTone,
      );

  const hero: EndOfDayClosureHeroPresentation = {
    day: input.day,
    closingTitle: closingTone.heroTitle,
    closingSummary: closingTone.heroSummary,
    statusBadge: closingTone.statusBadge,
    badgeTone: closingTone.badgeTone,
    successScore,
    showScoreRing: !input.hideScoreRing && !isDay1,
  };

  const collectStrings = (): string[] =>
    [
      hero.closingTitle,
      hero.closingSummary,
      hero.statusBadge,
      ...outcomeChips.map((c) => `${c.label} ${c.value ?? ''}`),
      decisionStory.decisionSentence,
      ...decisionStory.impactLines.map((l) => l.label),
      decisionStory.outcomeBadge,
      decisionStory.playerStyleTag,
      neighborhoodPulse.headline,
      ...neighborhoodPulse.chips.map((c) => c.label),
      ...tradeoffBalance.gains.map((g) => g.label),
      ...tradeoffBalance.costs.map((c) => c.label),
      tradeoffBalance.balanceLabel,
      tomorrowFocus.focusLine,
      tomorrowFocus.riskTag,
      eceClosing.line,
      readinessMemory.closureLine,
      managerStyle.summary,
      managerStyle.styleLabel,
      managerStyle.advisorLine,
      managerStyle.positiveReinforcement,
      managerStyle.recoveryNote,
      managerStyle.dominantWarning?.message,
      ...managerStyle.behaviorSignals.map((s) => `${s.label} ${s.value}`),
      ...managerStyle.impactChips.map((c) => `${c.label} ${c.value}`),
      ...replayTimeline.items.map((i) => `${i.title} ${i.impactChip}`),
      closingTone.ctaSubtext,
    ].filter((s): s is string => Boolean(s?.trim()));

  return {
    isDay1,
    isRichDay,
    hero,
    closingTone,
    outcomeChips,
    decisionStory,
    neighborhoodPulse,
    tradeoffBalance: isDay1
      ? { ...tradeoffBalance, gains: tradeoffBalance.gains.slice(0, 2), costs: tradeoffBalance.costs.slice(0, 1) }
      : tradeoffBalance,
    tomorrowFocus,
    eceClosing,
    replayTimeline: isDay1
      ? { ...replayTimeline, items: replayTimeline.items.slice(0, 3) }
      : replayTimeline,
    readinessMemory,
    managerStyle,
    primaryCtaLabel: 'Yeni Güne Başla',
    secondaryCtaLabels: isDay1
      ? ['Merkeze Dön']
      : ['Merkeze Dön', 'Rapor Detayını Gör'],
    collectStrings,
  };
}

export function closurePresentationHasDuplicateCopy(
  presentation: EndOfDayReportClosurePresentation,
): string[] {
  const strings = presentation.collectStrings().map((s) =>
    s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim(),
  );
  const dupes: string[] = [];
  for (let i = 0; i < strings.length; i += 1) {
    for (let j = i + 1; j < strings.length; j += 1) {
      if (strings[i].length > 14 && strings[i] === strings[j]) {
        dupes.push(strings[i]);
      }
    }
  }
  return [...new Set(dupes)];
}
