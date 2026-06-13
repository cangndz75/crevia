import { calculateAuthorityProgress } from '@/core/authority/authorityEngine';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { getSignalStatusLabel } from '@/core/operations/operationSignalPresentation';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import { buildHubSocialPulseModel } from '@/features/social/utils/socialHubModel';

import type { CenterHeaderSummary } from './centerHeaderPresentation';

export const CENTER_CITY_SUMMARY_MAX_METRICS = 3;

export type CenterCitySummaryTone =
  | 'success'
  | 'stable'
  | 'warning'
  | 'urgent'
  | 'neutral';

export type CenterCitySummaryMetricId =
  | 'reputation'
  | 'happiness'
  | 'activeOperations'
  | 'risk'
  | 'trust'
  | 'authority';

export type CenterCitySummaryMetric = {
  id: CenterCitySummaryMetricId;
  label: string;
  valueText: string;
  helperText?: string;
  tone: CenterCitySummaryTone;
  iconKey: string;
  sourceLabel?: string;
  isEstimated?: boolean;
};

export type CenterCitySummaryProgress = {
  label: string;
  currentText: string;
  targetText?: string;
  progressRatio: number;
  tone: CenterCitySummaryTone;
};

export type CenterCitySummaryInsight = {
  label: string;
  text: string;
  tone: CenterCitySummaryTone;
};

export type CenterCitySummaryIllustrationKey = 'crest' | 'city' | 'district' | 'none';

export type CenterCitySummary = {
  title: string;
  subtitle?: string;
  metrics: CenterCitySummaryMetric[];
  primaryInsight?: CenterCitySummaryInsight;
  progress?: CenterCitySummaryProgress;
  illustrationKey: CenterCitySummaryIllustrationKey;
  accessibilityLabel: string;
};

export type BuildCenterCitySummaryInput = {
  gameState: GameState;
  day: number;
  socialPulseState?: SocialPulseState | null;
  operationSignals?: OperationSignalsState | null;
  dailyGoalState?: DailyGoalState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  activeTargetTitle?: string | null;
  advisorCommentary?: string | null;
  headerSummary?: CenterHeaderSummary | null;
};

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function formatTrustValue(trust: number): string {
  return Math.max(0, Math.round(trust)).toLocaleString('tr-TR');
}

function reputationTone(trust: number, progressPercent: number): CenterCitySummaryTone {
  if (trust < 80) return 'urgent';
  if (trust < 180) return 'warning';
  if (progressPercent >= 70) return 'success';
  return 'stable';
}

function happinessTone(score: number, statusLabel?: string): CenterCitySummaryTone {
  if (statusLabel === 'Kriz Baskısı') return 'urgent';
  if (statusLabel === 'Hassas') return 'warning';
  if (score >= 70) return 'success';
  if (score >= 45) return 'stable';
  return 'warning';
}

function happinessStatusLabel(score: number, hasSocialPulse: boolean): string {
  if (!hasSocialPulse) {
    if (score >= 70) return 'Mutlu';
    if (score >= 45) return 'Dengeli';
    return 'İzleniyor';
  }
  if (score >= 75) return 'Mutlu';
  if (score >= 55) return 'Dengeli';
  if (score >= 40) return 'Hassas';
  return 'Dikkat';
}

function operationTone(
  activeCount: number,
  signalStatus?: string,
  riskPriority?: string,
): CenterCitySummaryTone {
  if (riskPriority === 'high' || signalStatus === 'critical') return 'urgent';
  if (activeCount > 0 || signalStatus === 'strained' || riskPriority === 'medium') {
    return 'warning';
  }
  if (signalStatus === 'stable' && activeCount === 0) return 'success';
  return 'stable';
}

function headerShowsSatisfactionPercent(header?: CenterHeaderSummary | null): string | null {
  const chip = header?.resourceChips.find((item) => item.id === 'satisfaction');
  if (!chip?.valueText.startsWith('%')) return null;
  return chip.valueText;
}

function buildReputationMetric(
  input: BuildCenterCitySummaryInput,
): CenterCitySummaryMetric {
  if (input.day <= 1) {
    return {
      id: 'reputation',
      label: 'Şehir İtibarı',
      valueText: 'Başlangıç',
      helperText: 'İlk gün güven oluşuyor',
      tone: 'neutral',
      iconKey: 'star-outline',
      sourceLabel: 'day1.fallback',
    };
  }

  const authorityState = normalizeAuthorityState(
    input.gameState.pilot.authorityState,
    input.gameState.pilot.currentPilotDay,
  );
  const progress = calculateAuthorityProgress(authorityState);
  const trust = authorityState.authorityTrust;

  let helperText = 'Güven dengeli';
  if (progress.nextRank) {
    helperText = `Sonraki eşik: ${progress.nextRank.trustThreshold.toLocaleString('tr-TR')}`;
    if (progress.progressToNextPercent >= 80) {
      helperText = `${progress.nextRank.label} adaylığı izleniyor`;
    }
  }

  return {
    id: 'reputation',
    label: 'Şehir İtibarı',
    valueText: formatTrustValue(trust),
    helperText,
    tone: reputationTone(trust, progress.progressToNextPercent),
    iconKey: 'shield-checkmark-outline',
    sourceLabel: 'authority.authorityTrust',
  };
}

function buildHappinessMetric(
  input: BuildCenterCitySummaryInput,
): CenterCitySummaryMetric {
  if (input.day <= 1) {
    return {
      id: 'happiness',
      label: 'Vatandaş Mutluluğu',
      valueText: 'Dengeli',
      helperText: 'Sosyal nabız oluşuyor',
      tone: 'stable',
      iconKey: 'happy-outline',
      sourceLabel: 'day1.fallback',
    };
  }

  const social = input.socialPulseState
    ? buildHubSocialPulseModel(input.socialPulseState, input.day)
    : null;
  const score = social?.score ?? input.gameState.city.publicSatisfaction;
  const rounded = Math.round(score);
  const headerPercent = headerShowsSatisfactionPercent(input.headerSummary);

  const valueText =
    headerPercent && headerPercent === `%${rounded}`
      ? happinessStatusLabel(rounded, Boolean(social))
      : `%${rounded}`;

  let helperText = social?.signalLine?.trim() || 'Bugün kritik tepki yok';
  if (!social) {
    helperText =
      rounded >= 70
        ? 'Kamu memnuniyeti olumlu'
        : rounded >= 45
          ? 'Sosyal nabız izleniyor'
          : 'Veri oluşuyor';
  }

  return {
    id: 'happiness',
    label: 'Vatandaş Mutluluğu',
    valueText,
    helperText,
    tone: happinessTone(rounded, social?.statusLabel),
    iconKey: 'happy-outline',
    isEstimated: !input.socialPulseState,
    sourceLabel: social ? 'socialPulse.score' : 'city.publicSatisfaction',
  };
}

function buildOperationMetric(input: BuildCenterCitySummaryInput): CenterCitySummaryMetric {
  if (input.day <= 1) {
    return {
      id: 'activeOperations',
      label: 'Bugünkü Odak',
      valueText: 'Hazır',
      helperText: 'İlk hedef hazır',
      tone: 'stable',
      iconKey: 'flag-outline',
      sourceLabel: 'day1.fallback',
    };
  }

  const activeEvents = input.gameState.events.length;
  const primaryGoal = selectPrimaryDailyGoal(input.dailyGoalState);
  const signalStatus = input.operationSignals?.overall.status;
  const riskPriority = input.hubTomorrowRisk?.priority;

  if (activeEvents > 0) {
    const label = activeEvents === 1 ? 'Aktif Operasyon' : 'Aktif Operasyonlar';
    return {
      id: 'activeOperations',
      label,
      valueText: String(activeEvents),
      helperText: primaryGoal?.shortLabel?.trim() || 'Devam ediyor',
      tone: operationTone(activeEvents, signalStatus, riskPriority),
      iconKey: 'pulse-outline',
      sourceLabel: 'gameState.events.length',
    };
  }

  if (signalStatus === 'critical' || signalStatus === 'strained' || riskPriority === 'high') {
    const signalLabel = input.operationSignals
      ? getSignalStatusLabel(input.operationSignals.overall.status)
      : 'Yüksek';
    return {
      id: 'risk',
      label: 'Aktif Risk',
      valueText: riskPriority === 'high' ? '1 yüksek' : signalLabel,
      helperText:
        input.hubTomorrowRisk?.mainLine?.trim() ||
        input.operationSignals?.overall.summary?.trim() ||
        'Yüksek risk sinyali',
      tone: operationTone(0, signalStatus, riskPriority),
      iconKey: 'alert-circle-outline',
      sourceLabel: 'operationSignals.overall',
    };
  }

  if (primaryGoal && primaryGoal.status !== 'locked') {
    const focusShort = primaryGoal.shortLabel?.trim() || 'Bugünkü hedef';
    const duplicateTitle =
      input.activeTargetTitle &&
      linesAreDuplicate(focusShort, input.activeTargetTitle);
    return {
      id: 'activeOperations',
      label: 'Bugünkü Odak',
      valueText: duplicateTitle ? 'Hazır' : focusShort.slice(0, 18),
      helperText: primaryGoal.isCompleted ? 'Tamamlandı' : 'Hedef aktif',
      tone: primaryGoal.status === 'at_risk' ? 'warning' : 'stable',
      iconKey: 'flag-outline',
      sourceLabel: 'dailyGoal.primary',
    };
  }

  return {
    id: 'activeOperations',
    label: 'Aktif Operasyonlar',
    valueText: 'Sakin',
    helperText: 'Kritik sinyal yok',
    tone: 'success',
    iconKey: 'checkmark-circle-outline',
    sourceLabel: 'fallback.calm',
  };
}

function buildProgress(
  input: BuildCenterCitySummaryInput,
): CenterCitySummaryProgress | undefined {
  if (input.day <= 1) return undefined;

  const authorityState = normalizeAuthorityState(
    input.gameState.pilot.authorityState,
    input.gameState.pilot.currentPilotDay,
  );
  const progress = calculateAuthorityProgress(authorityState);
  if (!progress.nextRank) return undefined;

  return {
    label: 'Terfi ilerlemesi',
    currentText: formatTrustValue(authorityState.authorityTrust),
    targetText: progress.nextRank.trustThreshold.toLocaleString('tr-TR'),
    progressRatio: clampRatio(progress.progressToNextPercent / 100),
    tone: reputationTone(authorityState.authorityTrust, progress.progressToNextPercent),
  };
}

function buildPrimaryInsight(input: BuildCenterCitySummaryInput): CenterCitySummaryInsight {
  if (input.day <= 1) {
    return {
      label: 'İlk adım',
      text: 'Şehri tanı, ilk hedefe başlayarak merkez akışını aç.',
      tone: 'neutral',
    };
  }

  const candidates: Array<{ text: string; tone: CenterCitySummaryTone; label: string }> = [];

  if (input.hubTomorrowRisk?.priority === 'high' && input.hubTomorrowRisk.mainLine?.trim()) {
    candidates.push({
      label: 'Risk',
      text: 'Yüksek risk sinyali var; operasyon önceliği önerilir.',
      tone: 'warning',
    });
  }

  const social = input.socialPulseState
    ? buildHubSocialPulseModel(input.socialPulseState, input.day)
    : null;
  if (social && social.score >= 65) {
    candidates.push({
      label: 'Sosyal durum',
      text: 'Vatandaş mutluluğu artıyor; bugünkü hedef bunu güçlendirebilir.',
      tone: 'success',
    });
  }

  const focusDomain = input.operationSignals?.dailyFocus;
  if (focusDomain && focusDomain !== 'balanced') {
    const domainLabel =
      focusDomain === 'vehicles'
        ? 'ulaşım'
        : focusDomain === 'containers'
          ? 'çevre'
          : focusDomain === 'personnel'
            ? 'personel'
            : 'bölge';
    candidates.push({
      label: 'Operasyon',
      text: `Şehir dengede, ${domainLabel} odağı öne çıkıyor.`,
      tone: 'stable',
    });
  }

  candidates.push({
    label: 'Genel',
    text: 'Şehir dengede; bugünkü planı Merkez akışından sürdür.',
    tone: 'stable',
  });

  const advisorLine = input.advisorCommentary?.trim();
  const picked =
    candidates.find((candidate) => !linesAreDuplicate(candidate.text, advisorLine)) ??
    candidates[0]!;

  return {
    label: picked.label,
    text: picked.text,
    tone: picked.tone,
  };
}

export function buildCenterCitySummary(
  input: BuildCenterCitySummaryInput,
): CenterCitySummary {
  const metrics = [
    buildReputationMetric(input),
    buildHappinessMetric(input),
    buildOperationMetric(input),
  ].slice(0, CENTER_CITY_SUMMARY_MAX_METRICS);

  const progress = buildProgress(input);
  const primaryInsight = buildPrimaryInsight(input);
  const subtitle =
    input.day <= 1 ? 'Şehir sağlığı özeti' : `Gün ${input.day} · şehir sağlığı`;

  const accessibilityLabel = [
    'Merkez özeti',
    ...metrics.map((metric) => `${metric.label} ${metric.valueText}`),
    primaryInsight.text,
    progress ? `${progress.label} ${Math.round(progress.progressRatio * 100)} yüzde` : undefined,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    title: 'MERKEZ ÖZETİ',
    subtitle,
    metrics,
    primaryInsight,
    progress,
    illustrationKey: input.day <= 1 ? 'none' : 'crest',
    accessibilityLabel,
  };
}

export function centerCitySummaryMetricIdsAreUnique(summary: CenterCitySummary): boolean {
  const ids = summary.metrics.map((metric) => metric.id);
  return new Set(ids).size === ids.length;
}

export function centerCitySummaryMetricCountValid(summary: CenterCitySummary): boolean {
  return (
    summary.metrics.length > 0 &&
    summary.metrics.length <= CENTER_CITY_SUMMARY_MAX_METRICS
  );
}

export function centerCitySummaryValuesValid(summary: CenterCitySummary): boolean {
  return summary.metrics.every((metric) => {
    const value = metric.valueText.trim();
    return (
      value.length > 0 &&
      !value.includes('undefined') &&
      !value.includes('null') &&
      !value.includes('NaN')
    );
  });
}

export function centerCitySummaryProgressClamped(summary: CenterCitySummary): boolean {
  if (!summary.progress) return true;
  const ratio = summary.progress.progressRatio;
  return ratio >= 0 && ratio <= 1 && Number.isFinite(ratio);
}

export function centerCityInsightNotDuplicateAdvisor(
  summary: CenterCitySummary,
  advisorCommentary?: string | null,
): boolean {
  if (!summary.primaryInsight?.text) return true;
  return !linesAreDuplicate(summary.primaryInsight.text, advisorCommentary);
}
