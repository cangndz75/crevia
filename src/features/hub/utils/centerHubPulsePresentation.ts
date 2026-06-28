import { lineDuplicatesAvoidLines, normalizePresentationText } from '@/core/presentationDedupe';
import type { HubDisclosureBand } from './centerHubDensityPresentation';
import {
  HUB_DENSITY_LIMITS,
  resolveHubCityPulseSignalCap,
  resolveHubImpactChipCap,
} from './centerHubDensityPolicy';
import type { CenterHomePresentation } from './centerHomePresentation';
import type {
  CenterGameFirstAdvisorPresentation,
  CenterGameFirstCityPulse,
  CenterGameFirstCityPulseItem,
  CenterTodayFocusPresentation,
} from './centerHubGameFirstPresentation';

export type CenterHubCompactImpactChip = {
  id: string;
  label: string;
  valueText?: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type CenterHubCompactPulsePresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  primarySignal?: CenterGameFirstCityPulseItem;
  signals: CenterGameFirstCityPulseItem[];
  impactChips: CenterHubCompactImpactChip[];
  statusPill: string;
};

export type CenterHubCompactAdvisorPresentation = {
  visibility: 'visible' | 'hidden';
  advisorName: string;
  recommendation: string;
  reasonChip?: string;
  suggestedAction?: {
    label: string;
    route?: string;
    actionKey: string;
    enabled: boolean;
  };
};

export type CenterHubFirstViewportPulseBundle = {
  pulse: CenterHubCompactPulsePresentation;
  advisor: CenterHubCompactAdvisorPresentation;
};

function normalizeLine(value: string | null | undefined): string {
  return normalizePresentationText(value);
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  return lineDuplicatesAvoidLines(a, [b]);
}

function clampText(value: string | undefined, limit: number): string {
  const cleaned = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!cleaned) return '';
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function mapRecentImpactTone(
  tone: string | undefined,
): CenterHubCompactImpactChip['tone'] {
  switch (tone) {
    case 'positive':
      return 'positive';
    case 'warning':
      return 'warning';
    case 'critical':
    case 'urgent':
      return 'critical';
    default:
      return 'neutral';
  }
}

function buildImpactChips(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  band: HubDisclosureBand,
  excludeLines: string[],
): CenterHubCompactImpactChip[] {
  const cap = resolveHubImpactChipCap(band);
  const chips: CenterHubCompactImpactChip[] = [];

  const recent = presentation.recentImpactSummary;
  if (recent.visibility === 'visible') {
    for (const chip of recent.chips) {
      if (chips.length >= cap) break;
      const line = `${chip.label} ${chip.valueText}`.trim();
      if (linesAreDuplicate(line, excludeLines.join(' '))) continue;
      chips.push({
        id: chip.id,
        label: chip.label,
        valueText: chip.valueText,
        tone: mapRecentImpactTone(chip.tone),
      });
    }
  }

  if (chips.length < cap && presentation.hubDensity.maintenanceSignal) {
    const signal = presentation.hubDensity.maintenanceSignal;
    const line = signal.title;
    if (!linesAreDuplicate(line, excludeLines.join(' '))) {
      chips.push({
        id: 'maintenance-signal',
        label: clampText(signal.title, 32),
        valueText: signal.subtitle ? clampText(signal.subtitle, 24) : undefined,
        tone: signal.tone === 'critical' ? 'critical' : 'warning',
      });
    }
  }

  return chips.slice(0, cap);
}

export function buildCenterHubCompactPulse(
  cityPulse: CenterGameFirstCityPulse,
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  band: HubDisclosureBand,
): CenterHubCompactPulsePresentation {
  const signalCap = resolveHubCityPulseSignalCap(band);
  const signals = cityPulse.items.slice(0, signalCap);
  const primarySignal = signals[0];
  const excludeLines = signals.flatMap((item) => [item.message, item.detail ?? '']);
  const impactChips = buildImpactChips(presentation, band, excludeLines);

  const visible = signals.length > 0 || impactChips.length > 0;
  if (!visible) {
    return {
      visibility: 'hidden',
      title: band === 'day1' ? 'Şehirden Gelen' : 'Şehir Nabzı',
      signals: [],
      impactChips: [],
      statusPill: '',
    };
  }

  return {
    visibility: 'visible',
    title: cityPulse.title,
    primarySignal,
    signals,
    impactChips,
    statusPill: primarySignal
      ? 'Canlı sinyal'
      : impactChips.length > 0
        ? `${impactChips.length} etki`
        : cityPulse.statusPill,
  };
}

export function buildCenterHubCompactAdvisor(
  advisor: CenterGameFirstAdvisorPresentation,
  todayFocus: CenterTodayFocusPresentation,
  band: HubDisclosureBand,
): CenterHubCompactAdvisorPresentation {
  if (advisor.visibility !== 'visible' || !advisor.recommendation.trim()) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      recommendation: '',
    };
  }

  const reasonChip =
    advisor.riskWarning?.trim() ||
    advisor.rationale?.trim() ||
    advisor.trustIndicator?.trim() ||
    undefined;

  const chipLine = reasonChip ? clampText(reasonChip, 28) : undefined;
  if (chipLine && linesAreDuplicate(chipLine, todayFocus.goalSentence)) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      recommendation: '',
    };
  }

  const maxLen = band === 'day1' ? 88 : 120;
  const recommendation = clampText(advisor.recommendation, maxLen);
  if (!recommendation) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      recommendation: '',
    };
  }

  return {
    visibility: 'visible',
    advisorName: advisor.advisorName,
    recommendation,
    reasonChip: chipLine,
    suggestedAction: advisor.suggestedAction
      ? {
          label: advisor.suggestedAction.label,
          route: advisor.suggestedAction.route,
          actionKey: advisor.suggestedAction.actionKey,
          enabled: advisor.suggestedAction.enabled ?? true,
        }
      : undefined,
  };
}

export function buildCenterHubFirstViewportPulseBundle(input: {
  presentation: Omit<CenterHomePresentation, 'gameFirst'>;
  cityPulse: CenterGameFirstCityPulse;
  advisor: CenterGameFirstAdvisorPresentation;
  todayFocus: CenterTodayFocusPresentation;
  band: HubDisclosureBand;
}): CenterHubFirstViewportPulseBundle {
  return {
    pulse: buildCenterHubCompactPulse(input.cityPulse, input.presentation, input.band),
    advisor: buildCenterHubCompactAdvisor(input.advisor, input.todayFocus, input.band),
  };
}

export function buildCenterGameFirstCityPulseFromFeed(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  band: HubDisclosureBand,
): CenterGameFirstCityPulse {
  const feed = presentation.miniCityFeed;
  const maxItems = resolveHubCityPulseSignalCap(band);
  const seenTypes = new Set<string>();
  const items: CenterGameFirstCityPulseItem[] = [];

  for (const item of feed.items) {
    if (items.length >= maxItems) break;
    if (seenTypes.has(item.type)) continue;
    seenTypes.add(item.type);
    items.push({
      id: item.id,
      message: item.title,
      detail: item.subtitle,
      tone: item.tone,
      sourceLabel: item.sourceLabel,
      type: item.type,
      routeKey: item.routeKey,
      actionKey: item.actionKey,
    });
  }

  if (items.length === 0 && feed.emptyFallback) {
    items.push({
      id: feed.emptyFallback.id,
      message: feed.emptyFallback.title,
      detail: feed.emptyFallback.subtitle,
      tone: feed.emptyFallback.tone,
      sourceLabel: feed.emptyFallback.sourceLabel,
      type: feed.emptyFallback.type,
      routeKey: feed.emptyFallback.routeKey,
      actionKey: feed.emptyFallback.actionKey,
    });
  }

  return {
    visibility: items.length > 0 ? 'visible' : 'hidden',
    title: band === 'day1' ? 'Şehirden Gelen' : 'Şehir Nabzı',
    subtitle:
      band === 'day1'
        ? 'Mahallelerden kısa ve öğretici sinyaller.'
        : feed.subtitle || 'Canlı gelişmeler ve sonuç bağlantıları.',
    statusPill: items.length > 0 ? `${items.length} sinyal` : feed.statusPill,
    items,
  };
}

export function compactPulseHasDuplicateCopy(bundle: CenterHubFirstViewportPulseBundle): boolean {
  const lines = [
    bundle.pulse.primarySignal?.message,
    bundle.pulse.primarySignal?.detail,
    ...bundle.pulse.impactChips.map((chip) => `${chip.label} ${chip.valueText ?? ''}`),
    bundle.advisor.recommendation,
    bundle.advisor.reasonChip,
  ].filter(Boolean);

  const normalized = lines.map((line) => normalizeLine(line));
  return new Set(normalized).size !== normalized.length;
}

export function compactPulseImpactChipCount(bundle: CenterHubFirstViewportPulseBundle): number {
  return bundle.pulse.impactChips.length;
}

export function compactPulseWithinCaps(
  bundle: CenterHubFirstViewportPulseBundle,
  band: HubDisclosureBand,
): boolean {
  const chipCap = resolveHubImpactChipCap(band);
  if (bundle.pulse.impactChips.length > chipCap) return false;
  if (bundle.advisor.recommendation.length > resolveHubEceCharCap(band)) return false;
  if (bundle.advisor.reasonChip && bundle.advisor.reasonChip.length > 32) return false;
  return true;
}

function resolveHubEceCharCap(band: HubDisclosureBand): number {
  return band === 'day1'
    ? HUB_DENSITY_LIMITS.eceRecommendationDay1MaxChars
    : HUB_DENSITY_LIMITS.eceRecommendationMaxChars;
}
