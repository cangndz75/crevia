import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { PlayerProgress } from '@/core/xp/types';

export type CriticalDecisionImpactTone = 'positive' | 'team' | 'cost';

export type CriticalDecisionImpactTileModel = {
  key: 'public' | 'team' | 'resource';
  label: string;
  value: string;
  numericValue: number;
  valueSuffix?: string;
  precision?: number;
  description: string;
  helper: string;
  tone: CriticalDecisionImpactTone;
};

export type DayEndCriticalDecisionPresentation = {
  header: {
    title: string;
    dayLabel: string;
    levelLabel: string;
    resourceLabel: string;
    progressRatio: number;
  };
  decision: {
    title: string;
    subtitle: string;
    chip: string;
  };
  impacts: CriticalDecisionImpactTileModel[];
  reflection: {
    title: string;
    body: string;
    contribution: string;
  };
  advisor: {
    title: string;
    body: string;
  };
  cta: {
    label: string;
    nextHint: string;
    accessibilityLabel: string;
  };
};

type BuildParams = {
  day: number;
  metrics: GameMetrics;
  decisionsToday: DecisionRecord[];
  criticalDecision?: DecisionRecord | null;
  playerProgress?: PlayerProgress | null;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatSignedNumber(value: number): string {
  if (value > 0) return `+${Math.round(value)}`;
  return `${Math.round(value)}`;
}

function formatResourceAmount(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);

  if (absolute >= 1000) {
    const value = absolute / 1000;
    const formatted = Number.isInteger(value) ? `${value}` : value.toFixed(1);
    return `${sign}${formatted}K`;
  }

  return `${sign}${Math.round(absolute)}`;
}

function resolveDecisionPublicDelta(record?: DecisionRecord | null): number | null {
  if (!record) return null;
  return (
    finiteNumber(record.appliedEffects.publicSatisfaction) ??
    finiteNumber(record.appliedEffects.trust)
  );
}

function resolveDecisionTeamDelta(record?: DecisionRecord | null): number | null {
  if (!record) return null;
  return (
    finiteNumber(record.appliedEffects.staffMorale) ??
    (finiteNumber(record.appliedCosts?.morale) != null
      ? -Math.abs(finiteNumber(record.appliedCosts?.morale) ?? 0)
      : null)
  );
}

function resolveDecisionResourceDelta(record?: DecisionRecord | null): number | null {
  if (!record) return null;
  const directBudget = finiteNumber(record.appliedEffects.budget);
  if (directBudget != null && directBudget !== 0) {
    return directBudget;
  }

  const budgetCost = finiteNumber(record.appliedCosts?.budget);
  if (budgetCost != null && budgetCost !== 0) {
    return -Math.abs(budgetCost);
  }

  return directBudget;
}

function sumDecisionDelta(
  decisions: DecisionRecord[],
  resolver: (record: DecisionRecord) => number | null,
): number {
  return decisions.reduce((sum, record) => sum + (resolver(record) ?? 0), 0);
}

function nonZeroOrFallback(value: number | null, fallback: number): number {
  return value == null || value === 0 ? fallback : value;
}

function avoidSameAsTotal(decisionValue: number, totalValue: number, ratio: number): number {
  if (decisionValue !== totalValue || totalValue === 0) return decisionValue;
  const adjusted = Math.round(totalValue * ratio);
  if (adjusted !== totalValue && adjusted !== 0) return adjusted;
  return totalValue > 0 ? totalValue - 1 : totalValue + 1;
}

function buildFallbackPublicTotal(metrics: GameMetrics): number {
  return Math.max(6, Math.round((metrics.publicSatisfaction - 45) * 0.55));
}

function buildFallbackTeamTotal(metrics: GameMetrics): number {
  const pressure = Math.max(4, Math.round((62 - metrics.staffMorale) * 0.4));
  return -pressure;
}

function buildFallbackResourceTotal(metrics: GameMetrics): number {
  const spent = Math.max(4200, Math.round((100_000 - metrics.budget) * 0.3));
  return -Math.round(spent / 100) * 100;
}

export function buildDayEndCriticalDecisionPresentation({
  day,
  metrics,
  decisionsToday,
  criticalDecision,
  playerProgress,
}: BuildParams): DayEndCriticalDecisionPresentation {
  const dayTotalPublicRaw = sumDecisionDelta(decisionsToday, resolveDecisionPublicDelta);
  const dayTotalTeamRaw = sumDecisionDelta(decisionsToday, resolveDecisionTeamDelta);
  const dayTotalResourceRaw = sumDecisionDelta(decisionsToday, resolveDecisionResourceDelta);

  const dayTotalPublic = nonZeroOrFallback(dayTotalPublicRaw, buildFallbackPublicTotal(metrics));
  const dayTotalTeam = nonZeroOrFallback(dayTotalTeamRaw, buildFallbackTeamTotal(metrics));
  const dayTotalResource = nonZeroOrFallback(
    dayTotalResourceRaw,
    buildFallbackResourceTotal(metrics),
  );

  const publicDelta = avoidSameAsTotal(
    nonZeroOrFallback(resolveDecisionPublicDelta(criticalDecision), Math.round(dayTotalPublic * 0.67)),
    dayTotalPublic,
    0.67,
  );
  const teamDelta = avoidSameAsTotal(
    nonZeroOrFallback(resolveDecisionTeamDelta(criticalDecision), Math.round(dayTotalTeam * 0.6)),
    dayTotalTeam,
    0.6,
  );
  const resourceDeltaRaw = nonZeroOrFallback(
    resolveDecisionResourceDelta(criticalDecision),
    Math.round(dayTotalResource * 0.38),
  );
  const resourceDelta = avoidSameAsTotal(resourceDeltaRaw, dayTotalResource, 0.38);
  const publicContribution = Math.min(
    99,
    Math.max(1, Math.round((Math.abs(publicDelta) / Math.max(1, Math.abs(dayTotalPublic))) * 100)),
  );
  const progressRatio =
    playerProgress && playerProgress.nextLevelXp > 0
      ? Math.min(1, Math.max(0, playerProgress.currentLevelXp / playerProgress.nextLevelXp))
      : 0.62;

  return {
    header: {
      title: 'Raporlar',
      dayLabel: `${day}. Gün · ${criticalDecision?.neighborhoodName ?? 'Cumhuriyet'}`,
      levelLabel: `Seviye ${playerProgress?.currentLevel ?? 2}`,
      resourceLabel: `${formatResourceAmount(metrics.budget)} Kaynak`,
      progressRatio,
    },
    decision: {
      title: criticalDecision?.decisionLabel ?? 'Personel desteği verildi',
      subtitle: 'Görünür hizmet etkisi için ekip desteği artırıldı.',
      chip: 'Dengeyi hizmet tarafına çekti',
    },
    impacts: [
      {
        key: 'public',
        label: 'Halk',
        value: formatSignedNumber(publicDelta),
        numericValue: publicDelta,
        description: publicDelta >= 0 ? 'Güven yükseldi' : 'Güven baskılandı',
        helper: 'Kritik karar etkisi',
        tone: 'positive',
      },
      {
        key: 'team',
        label: 'Ekip',
        value: formatSignedNumber(teamDelta),
        numericValue: teamDelta,
        description: teamDelta < 0 ? 'Tempo düştü' : 'Tempo korundu',
        helper: teamDelta < 0 ? 'Ekip yükü arttı' : 'Ekip dengesi korundu',
        tone: 'team',
      },
      {
        key: 'resource',
        label: 'Kaynak',
        value: formatResourceAmount(resourceDelta),
        numericValue: resourceDelta / 1000,
        valueSuffix: 'K',
        precision: 1,
        description: 'Ek destek maliyeti',
        helper: `Gün toplamı: ${formatResourceAmount(dayTotalResource)}`,
        tone: 'cost',
      },
    ],
    reflection: {
      title: 'Bugünkü Yansıma',
      body:
        'Karar, ilk günün hizmet etkisini güçlendirdi. Ancak ekip yorgunluğu ve maliyet baskısı yarına taşınabilir.',
      contribution: `Gün toplamı içindeki katkı: Halk etkisinin %${publicContribution}'si bu karardan geldi.`,
    },
    advisor: {
      title: 'Ece Strateji Notu',
      body:
        'Kazancı koru, baskıyı büyütme. Yarın aynı çözümü tekrar etmek yerine ekip yükünü dağıt.',
    },
    cta: {
      label: 'Gün Akışını Gör',
      nextHint: 'Sonraki: Kararların şehirde bıraktığı iz',
      accessibilityLabel: 'Gün Akışını Gör, raporun gün akışı bölümüne geçer',
    },
  };
}
