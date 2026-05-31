import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import type { AuthorityDailyGainSnapshot, AuthorityState } from '@/core/authority/authorityTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyReport } from '@/core/models/DailyReport';

import {
  buildReportPilotCompactModel,
  buildReportTomorrowNoteFallback,
  type ReportPilotCompactModel,
} from '@/features/reports/presentation/reportScreenPresentation';
import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import type { EndOfDayImpactMetric } from '@/features/reports/utils/endOfDayReportPresentation';
import { buildEndOfDayImpactMetrics } from '@/features/reports/utils/endOfDayReportPresentation';

export type ReportImpactMetricTone = 'mint' | 'blue' | 'gold' | 'warn';

export type ReportImpactMetricCardModel = {
  key: string;
  label: string;
  value: string;
  deltaLine: string;
  deltaPositive: boolean | null;
  tone: ReportImpactMetricTone;
  icon: 'people' | 'shield-checkmark' | 'diamond';
};

export type ReportPrimaryImpactModel = {
  timePill: string;
  metrics: ReportImpactMetricCardModel[];
};

export type AuthorityTrustTier = 'low' | 'mid' | 'high';

export type ReportAuthorityTrustModel = {
  tier: AuthorityTrustTier;
  tierBadgeLabel: string;
  title: string;
  statusLabel: string;
  showUpdated: boolean;
  descriptionLine1: string;
  descriptionLine2: string;
};

export type ReportTomorrowNotesModel = {
  description: string;
};

export type ReportPilotSummaryStatColumn = {
  icon: 'pulse' | 'people' | 'flag';
  title: string;
  subtitle: string;
};

export type ReportPilotSummaryPremiumModel = ReportPilotCompactModel & {
  insightPill: string;
  themePill: string;
  statColumns: ReportPilotSummaryStatColumn[];
};

const TIER_LABELS: Record<AuthorityTrustTier, string> = {
  low: 'DÜŞÜK',
  mid: 'ORTA',
  high: 'YÜKSEK',
};

const IMPACT_TONE_MAP: Record<EndOfDayImpactMetric['tone'], ReportImpactMetricTone> = {
  teal: 'mint',
  mint: 'blue',
  gold: 'gold',
  warn: 'warn',
};

const IMPACT_ICON_MAP: Record<string, ReportImpactMetricCardModel['icon']> = {
  public: 'people',
  team: 'shield-checkmark',
  budget: 'diamond',
};

function sumDecisionMetricDeltas(
  decisionHistory: DecisionRecord[],
  day: number,
): { public: number; team: number; budget: number } {
  const totals = { public: 0, team: 0, budget: 0 };
  for (const record of decisionHistory) {
    if (record.day !== day) continue;
    const effects = record.appliedEffects;
    if (effects.publicSatisfaction != null) {
      totals.public += effects.publicSatisfaction;
    }
    if (effects.staffMorale != null) {
      totals.team += effects.staffMorale;
    }
    if (effects.budget != null) {
      totals.budget += effects.budget;
    }
  }
  return totals;
}

function formatImpactDeltaLine(
  delta: number,
  key: 'public' | 'team' | 'budget',
): { line: string; positive: boolean | null } {
  if (delta === 0) {
    return { line: 'Dengede', positive: null };
  }
  const positive = delta > 0;
  const arrow = positive ? '↑' : '↓';
  if (key === 'budget') {
    const abs = Math.abs(delta);
    const formatted =
      abs >= 1000
        ? `${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`
        : String(abs);
    return { line: `${arrow} ${formatted}`, positive };
  }
  return { line: `${arrow} ${Math.abs(delta)} puan`, positive };
}

export function resolveAuthorityTrustTier(trust: number): AuthorityTrustTier {
  if (trust >= 350) return 'high';
  if (trust >= 150) return 'mid';
  return 'low';
}

export function formatReportTimePill(createdAt?: string): string {
  if (createdAt) {
    const date = new Date(createdAt);
    if (!Number.isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  return '--:--';
}

export function buildReportPrimaryImpactModel(params: {
  metrics: GameMetrics;
  decisionHistory: DecisionRecord[];
  day: number;
  createdAt?: string;
}): ReportPrimaryImpactModel {
  const { metrics, decisionHistory, day, createdAt } = params;
  const baseMetrics = buildEndOfDayImpactMetrics(metrics);
  const deltas = sumDecisionMetricDeltas(decisionHistory, day);

  const metricsCards: ReportImpactMetricCardModel[] = baseMetrics.map((metric) => {
    const deltaKey =
      metric.key === 'public'
        ? 'public'
        : metric.key === 'team'
          ? 'team'
          : 'budget';
    const { line, positive } = formatImpactDeltaLine(deltas[deltaKey], deltaKey);

    return {
      key: metric.key,
      label: metric.label,
      value: metric.value,
      deltaLine: line,
      deltaPositive: positive,
      tone: IMPACT_TONE_MAP[metric.tone],
      icon: IMPACT_ICON_MAP[metric.key] ?? 'people',
    };
  });

  return {
    timePill: formatReportTimePill(createdAt),
    metrics: metricsCards,
  };
}

export function buildReportAuthorityTrustModel(params: {
  authorityLines: string[];
  authorityDailyGain?: AuthorityDailyGainSnapshot | null;
  authorityState: AuthorityState;
}): ReportAuthorityTrustModel {
  const { authorityLines, authorityDailyGain, authorityState } = params;
  const tier = resolveAuthorityTrustTier(authorityState.authorityTrust);

  const line1 =
    authorityLines[0]?.trim() ||
    'Yetki değerlendirmesi pilot boyunca izlenir.';
  const line2 =
    authorityLines[1]?.trim() ||
    'Gün sonunda üst yönetim güven puanını günceller.';

  const netGain = authorityDailyGain?.netGain ?? 0;
  const showUpdated =
    netGain !== 0 ||
    authorityLines.some((line) => /güncellendi|arttı|\+/i.test(line));

  return {
    tier,
    tierBadgeLabel: TIER_LABELS[tier],
    title: 'Yetki Güveni',
    statusLabel: showUpdated ? 'Güncellendi' : 'İzleniyor',
    showUpdated,
    descriptionLine1: line1.endsWith('.') ? line1 : `${line1}.`,
    descriptionLine2: line2.endsWith('.') ? line2 : `${line2}.`,
  };
}

export function buildReportTomorrowNotesModel(
  notes: string[],
): ReportTomorrowNotesModel {
  const primary = notes[0]?.trim();
  return {
    description: primary || buildReportTomorrowNoteFallback(),
  };
}

function buildPilotStatColumns(
  context: PilotReportContext,
  decisionsToday: number,
): ReportPilotSummaryStatColumn[] {
  const decisionsTitle =
    decisionsToday === 0
      ? 'Bugün karar kaydı yok'
      : decisionsToday === 1
        ? 'Bugün 1 karar alındı'
        : `Bugün ${decisionsToday} karar alındı`;

  const decisionsSubtitle =
    decisionsToday === 0
      ? 'Metrikler gün sonu dengesine göre güncellendi.'
      : 'Etkiler metriklerde yansıdı.';

  const nextSubtitle =
    context.nextPilotDay != null
      ? `${context.nextPilotDay}. güne hazır ol`
      : context.nextHint.length > 42
        ? `${context.nextHint.slice(0, 40)}…`
        : context.nextHint;

  return [
    {
      icon: 'pulse',
      title: decisionsTitle,
      subtitle: decisionsSubtitle,
    },
    {
      icon: 'people',
      title: 'Denge Odaklı',
      subtitle: 'Halk • Ekip • Kaynak',
    },
    {
      icon: 'flag',
      title: 'Sonraki Hedef',
      subtitle: nextSubtitle,
    },
  ];
}

export function buildReportPilotSummaryPremiumModel(params: {
  context: PilotReportContext;
  decisionHistory: DecisionRecord[];
  reportDay: number;
}): ReportPilotSummaryPremiumModel {
  const { context, decisionHistory, reportDay } = params;
  const compact = buildReportPilotCompactModel(context);
  const decisionsToday = decisionHistory.filter((r) => r.day === reportDay).length;

  return {
    ...compact,
    insightPill: compact.goalStripText,
    themePill: compact.dayTitleChip.toLocaleUpperCase('tr-TR'),
    statColumns: buildPilotStatColumns(context, decisionsToday),
  };
}

/** Post-pilot / non-pilot günlerde kaynak etiketi tutarlılığı */
export function formatReportBudgetMetricValue(budget: number): string {
  return formatSourceWithLabel(budget);
}
