import type { CenterHomeCoreSections } from './centerHomePresentation';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import {
  buildHubReadinessSnapshotFromPresentation,
  buildMaintenanceBacklogRuntimePresentation,
  buildMaintenanceRuntimeHubSignal,
} from '@/core/maintenanceBacklog';
import {
  buildHubPeriodGoalCard,
  buildPeriodGoalContextFromHub,
  type HubPeriodGoalCardPresentation,
} from '@/core/periodGoals';
import type { MaintenanceHubSignal } from '@/core/maintenanceBacklog';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import {
  buildCenterHubDepthPresentation,
  type CenterHubDepthPresentation,
} from './centerHubDepthPresentation';
import {
  buildMiniCityFeedPresentation,
  type MiniCityFeedPresentation,
} from './centerMiniCityFeedPresentation';
import {
  centerHomeHasDuplicateVisibleActions,
  enrichCenterActionCandidate,
  labelForCanonicalKey,
  normalizeCenterActionKey,
  selectCenterNextActions,
  selectCenterQuickCommands,
  type CenterActionCandidate,
} from './centerActionDedupe';
import type { CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterOperationDomain } from './centerOperationFocusPresentation';
import type { CenterOperationSignalItem } from './centerOperationSignalsPresentation';
import {
  buildCenterDailyRewardMiniStrip,
  buildCenterNeighborhoodEvents,
  buildCenterStrategicPulseUiModel,
  type CenterDailyRewardMiniStripModel,
  type CenterNeighborhoodEventModel,
} from './centerLowerDashboardUiPresentation';

export type CenterHubAction = {
  label: string;
  route?: string;
  actionKey: string;
  enabled?: boolean;
};

export type CenterMetricView = {
  label: string;
  valueText: string;
  percent: number;
};

export type CenterNextActionCard = {
  id: string;
  title: string;
  subtitle?: string;
  rewardBudget?: string;
  rewardProgress?: string;
  rewardGem?: string;
  iconKey: string;
  accent: 'green' | 'gold' | 'amber' | 'sage';
  canonicalKey: string;
  actionFamily: string;
  actionKey: string;
  routeKey?: string;
  priority: number;
  disabled?: boolean;
  statusLabel?: string;
};

export type CenterNextActionsPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  actions: CenterNextActionCard[];
};

export type CenterNextTargetHeroPresentation = {
  visibility: 'visible' | 'hidden';
  eyebrow: string;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  iconKey: string;
  actionKey: string;
  routeKey?: string;
};

export type CenterStrategicPulseWeeklyPoint = {
  label: string;
  value: number;
};

export type CenterStrategicPulseExplanationRow = {
  id: string;
  label: string;
  value: string;
  tone?: 'neutral' | 'warning' | 'positive';
};

export type CenterStrategicPulseCompact = {
  pressure: CenterMetricView;
  risk: CenterMetricView;
  opportunity: CenterMetricView;
  liveSignalLabel: string;
  advisorHint?: string;
  cta: CenterHubAction;
};

export type CenterStrategicPulseDetail = {
  chart: CenterStrategicPulseWeeklyPoint[];
  signalTitle: string;
  signalBody: string;
  advisorHint?: string;
  explanationRows: CenterStrategicPulseExplanationRow[];
  primaryAction: CenterHubAction;
  secondaryAction?: CenterHubAction;
};

export type CenterStrategicPulsePresentation = {
  compact: CenterStrategicPulseCompact;
  detail: CenterStrategicPulseDetail;
};

export type CenterNeighborhoodEventCard = {
  id: string;
  title: string;
  locationLabel: string;
  valueLabel?: string;
  timeLabel: string;
  imageKey: CenterNeighborhoodEventModel['imageKey'];
  statusLabel?: 'Yeni' | 'Yaklaşıyor' | 'Riskli' | 'Önerilen' | string;
  accent: 'gold' | 'green' | 'purple' | 'amber' | 'sage';
  actionKey: string;
  routeKey?: string;
  isFallback?: boolean;
};

export type CenterNeighborhoodEventsPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  events: CenterNeighborhoodEventCard[];
};

export type CenterQuickCommandLayout =
  | 'hidden'
  | 'singleCompact'
  | 'twoColumn'
  | 'threeColumn'
  | 'twoPlusLockedTeaser';

export type CenterQuickCommandTile = {
  id: string;
  title: string;
  subtitle?: string;
  iconKey: string;
  accent: 'green' | 'gold' | 'sage' | 'amber';
  canonicalKey: string;
  actionFamily: string;
  actionKey: string;
  routeKey?: string;
  disabled?: boolean;
  unlockLabel?: string;
};

export type CenterQuickCommandsPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  layout: CenterQuickCommandLayout;
  commands: CenterQuickCommandTile[];
};

export type CenterHubGameplayPresentation = CenterHubDepthPresentation & {
  nextTargetHero: CenterNextTargetHeroPresentation;
  nextActions: CenterNextActionsPresentation;
  strategicPulse: CenterStrategicPulsePresentation;
  neighborhoodEvents: CenterNeighborhoodEventsPresentation;
  quickCommands: CenterQuickCommandsPresentation;
  dailyRewardMini?: CenterDailyRewardMiniStripModel;
  miniCityFeed: MiniCityFeedPresentation;
  cityAgenda: HubPeriodGoalCardPresentation;
  maintenanceHubSignal: MaintenanceHubSignal | null;
};

export type {
  CenterRecentImpactSummaryPresentation,
  CenterAdvisorMiniDirectivePresentation,
  CenterDistrictFocusPresentation,
  CenterUnlockPreviewMiniPresentation,
  CenterHubDepthPresentation,
} from './centerHubDepthPresentation';

export type {
  MiniCityFeedPresentation,
  MiniCityFeedItem,
  MiniCityFeedItemType,
  MiniCityFeedItemTone,
} from './centerMiniCityFeedPresentation';

const FALLBACK_QUICK_COMMANDS: {
  title: string;
  iconKey: string;
  actionKey: string;
  canonicalKey: string;
  route: string;
  accent: CenterQuickCommandTile['accent'];
}[] = [
  { title: 'Bölgeyi Yönet', iconKey: 'map-outline', actionKey: 'open_domain', canonicalKey: 'district.manage', route: '/map', accent: 'green' },
  { title: 'Kaynak Ayır', iconKey: 'wallet-outline', actionKey: 'open_resources', canonicalKey: 'resource.allocate', route: '/resources', accent: 'gold' },
  { title: 'Denetim Aç', iconKey: 'clipboard-outline', actionKey: 'open_operations', canonicalKey: 'inspection.open', route: '/operations', accent: 'sage' },
  { title: 'Haritada Gör', iconKey: 'navigate-outline', actionKey: 'open_map', canonicalKey: 'district.manage', route: '/map', accent: 'green' },
  { title: 'Raporlarda Aç', iconKey: 'document-text-outline', actionKey: 'open_report', canonicalKey: 'report.open', route: '/report', accent: 'amber' },
  { title: 'Şehir Nabzını İncele', iconKey: 'pulse-outline', actionKey: 'view_signals', canonicalKey: 'signal.open', route: '/events', accent: 'sage' },
];

function routeOrFallback(route: string | undefined, fallback = '/events'): string {
  return route?.trim() || fallback;
}

function isActiveTargetCompleted(presentation: CenterHomeCoreSections): boolean {
  const { activeTarget } = presentation;
  return (
    activeTarget.status === 'completed' ||
    activeTarget.visibility === 'completed' ||
    (activeTarget.progress?.progressRatio ?? 0) >= 1
  );
}

function iconForKey(iconKey: string | undefined): string {
  const value = iconKey?.trim();
  return value && value.length > 0 ? value : 'ellipse-outline';
}

function urgencyBoost(urgency: CenterActionCandidate['urgency']): number {
  switch (urgency) {
    case 'high':
      return 24;
    case 'medium':
      return 12;
  }
  return 0;
}

function accentForCandidate(candidate: CenterActionCandidate): CenterNextActionCard['accent'] {
  if (candidate.accent) return candidate.accent;
  if (candidate.urgency === 'high') return 'amber';
  if (candidate.source === 'activeTarget') return 'gold';
  return 'green';
}

function tileAccentForCandidate(candidate: CenterActionCandidate): CenterQuickCommandTile['accent'] {
  switch (candidate.accent) {
    case 'gold':
      return 'gold';
    case 'amber':
      return 'amber';
    case 'sage':
      return 'sage';
    default:
      return 'green';
  }
}

function collectNextActionCandidates(presentation: CenterHomeCoreSections): CenterActionCandidate[] {
  const candidates: CenterActionCandidate[] = [];
  const { activeTarget, operationFocus, recommendedPlan } = presentation;
  const commandPanel = operationFocus.commandPanel;
  const targetCompleted = isActiveTargetCompleted(presentation);

  if (targetCompleted) {
    candidates.push(
      enrichCenterActionCandidate({
        id: 'completed-next-target',
        source: 'activeTarget',
        placement: 'nextAction',
        label: 'Sıradaki Hedefe Geç',
        subtitle: presentation.recommendedPlan.title?.trim() || 'Yeni operasyonu aç',
        iconKey: 'arrow-forward-circle-outline',
        actionKey: 'start_operation',
        canonicalKey: 'next.target',
        actionFamily: 'operation',
        routeKey: routeOrFallback(recommendedPlan.cta?.route ?? activeTarget.cta.route),
        priority: 150,
        urgency: 'high',
        statusLabel: 'Sıradaki',
        accent: 'gold',
      }),
      enrichCenterActionCandidate({
        id: 'completed-impact-review',
        source: 'recommendedPlan',
        placement: 'nextAction',
        label: 'Sonucu İncele',
        subtitle: 'Şehir etkisini gör',
        iconKey: 'sparkles-outline',
        actionKey: 'view_report',
        canonicalKey: 'result.review',
        actionFamily: 'report',
        routeKey: routeOrFallback(recommendedPlan.cta?.route, '/report'),
        priority: 132,
        statusLabel: 'Yeni',
        accent: 'sage',
      }),
      enrichCenterActionCandidate({
        id: 'completed-signal-scan',
        source: 'operationCommandPanel',
        placement: 'nextAction',
        label: 'Sinyal Tara',
        subtitle: 'Yeni fırsatları bul',
        iconKey: 'pulse-outline',
        actionKey: 'view_signals',
        canonicalKey: 'signal.scan',
        routeKey: routeOrFallback(presentation.operationSignals.cta?.route),
        priority: 124,
        statusLabel: 'Hazır',
        accent: 'green',
      }),
    );
    return candidates;
  }

  if (activeTarget.cta.enabled && activeTarget.cta.route) {
    candidates.push(
      enrichCenterActionCandidate({
        id: 'active-target-cta',
        source: 'activeTarget',
        placement: 'nextAction',
        label: activeTarget.cta.label,
        subtitle: activeTarget.title,
        iconKey: 'flag-outline',
        actionKey: activeTarget.cta.actionKey,
        routeKey: activeTarget.cta.route,
        priority: 120 + urgencyBoost(activeTarget.priority === 'urgent' ? 'high' : 'medium'),
        urgency: activeTarget.priority === 'urgent' ? 'high' : 'medium',
        statusLabel: 'Sıradaki',
        accent: 'gold',
      }),
    );
  }

  operationFocus.items.forEach((item, index) => {
    candidates.push(
      enrichCenterActionCandidate({
        id: `focus-${item.id}`,
        source: 'operationFocus',
        placement: 'nextAction',
        label: item.title,
        subtitle: item.subtitle ?? item.statusLabel,
        iconKey: iconForKey(item.iconKey),
        actionKey: operationFocus.cta?.actionKey ?? 'open_domain',
        routeKey: routeOrFallback(item.route ?? operationFocus.cta?.route),
        priority: 90 - index * 4 + urgencyBoost(item.tone === 'urgent' ? 'high' : 'medium'),
        urgency: item.tone === 'urgent' || item.tone === 'warning' ? 'high' : 'medium',
        statusLabel: item.statusLabel,
        accent: item.tone === 'warning' ? 'amber' : 'green',
      }),
    );
  });

  if (commandPanel?.recommendedMove) {
    const move = commandPanel.recommendedMove;
    candidates.push(
      enrichCenterActionCandidate({
        id: 'recommended-move',
        source: 'operationCommandPanel',
        placement: 'nextAction',
        label: move.title,
        subtitle: move.description,
        iconKey: 'flash-outline',
        actionKey: 'start_operation',
        routeKey: routeOrFallback(move.route),
        priority: 88,
        statusLabel: 'Önerilen',
        accent: 'gold',
      }),
    );
  }

  commandPanel?.statusCards.forEach((card, index) => {
    const sheet = commandPanel.sheets[card.id];
    candidates.push(
      enrichCenterActionCandidate({
        id: `status-${card.id}`,
        source: 'operationCommandPanel',
        placement: 'nextAction',
        label: card.title,
        subtitle: card.statusLine,
        iconKey: iconForKey(card.iconKey),
        actionKey: card.id,
        routeKey: routeOrFallback(sheet?.primaryCtaRoute ?? commandPanel.recommendedMove.route),
        priority: 82 - index * 3,
        urgency: card.state === 'warning' ? 'high' : 'medium',
        statusLabel: card.state === 'warning' ? 'Dikkat' : card.state === 'completed' ? 'Tamam' : 'Hazır',
        accent: card.state === 'warning' ? 'amber' : card.id === 'resource' ? 'gold' : 'green',
      }),
    );
  });

  recommendedPlan.steps?.forEach((step, index) => {
    if (step.state === 'done') return;
    candidates.push(
      enrichCenterActionCandidate({
        id: `plan-${step.id}`,
        source: 'recommendedPlan',
        placement: 'nextAction',
        label: step.label,
        subtitle: recommendedPlan.title,
        iconKey: 'list-outline',
        actionKey: recommendedPlan.cta?.actionKey ?? 'view_plan',
        routeKey: routeOrFallback(recommendedPlan.cta?.route),
        priority: 70 - index * 2,
        statusLabel: step.state === 'current' ? 'Aktif' : 'Plan',
        accent: 'sage',
      }),
    );
  });

  return candidates;
}

function collectQuickCommandCandidates(presentation: CenterHomeCoreSections): CenterActionCandidate[] {
  const candidates: CenterActionCandidate[] = [];
  const commandPanel = presentation.operationFocus.commandPanel;

  presentation.quickActions.items.forEach((item, index) => {
    candidates.push(
      enrichCenterActionCandidate({
        id: `quick-${item.id}`,
        source: 'quickActions',
        placement: 'quickCommand',
        label: item.label,
        subtitle: item.description ?? item.badgeText,
        iconKey: iconForKey(item.iconKey),
        actionKey: item.actionKey,
        routeKey: item.route,
        priority: (item.isRecommended ? 70 : 60) - index,
        disabled: !item.enabled || !item.route,
        unlockLabel: item.lockedReason,
        accent: item.tone === 'gold' ? 'gold' : item.tone === 'warning' ? 'amber' : 'green',
      }),
    );
  });

  commandPanel?.statusCards.forEach((card, index) => {
    const sheet = commandPanel.sheets[card.id];
    candidates.push(
      enrichCenterActionCandidate({
        id: `qc-status-${card.id}`,
        source: 'operationCommandPanel',
        placement: 'quickCommand',
        label: labelForCanonicalKey(normalizeCenterActionKey({ actionKey: card.id }), card.title),
        subtitle: card.statusLine,
        iconKey: iconForKey(card.iconKey),
        actionKey: card.id,
        routeKey: routeOrFallback(sheet?.primaryCtaRoute ?? commandPanel.recommendedMove.route),
        priority: 55 - index,
        disabled: card.state === 'locked',
        unlockLabel: card.state === 'locked' ? card.statusLine : undefined,
        accent: 'sage',
      }),
    );
  });

  presentation.continuationCards.cards.forEach((card, index) => {
    candidates.push(
      enrichCenterActionCandidate({
        id: `continuation-${card.id}`,
        source: 'continuationCards',
        placement: 'quickCommand',
        label: card.title,
        subtitle: card.label,
        iconKey: 'arrow-forward-circle-outline',
        actionKey: card.actionKey,
        routeKey: card.route,
        priority: 48 - index,
        disabled: !card.enabled,
        accent: card.tone === 'warning' ? 'amber' : 'green',
      }),
    );
  });

  FALLBACK_QUICK_COMMANDS.forEach((fallback, index) => {
    candidates.push(
      enrichCenterActionCandidate({
        id: `fallback-${fallback.actionKey}-${index}`,
        source: 'fallback',
        placement: 'quickCommand',
        label: fallback.title,
        iconKey: fallback.iconKey,
        actionKey: fallback.actionKey,
        routeKey: fallback.route,
        canonicalKey: fallback.canonicalKey,
        priority: 8 - index,
        accent: fallback.accent,
      }),
    );
  });

  return candidates;
}

function resolveNextActionRewardPreview(
  candidate: CenterActionCandidate,
): Pick<CenterNextActionCard, 'rewardBudget' | 'rewardProgress' | 'rewardGem'> {
  const label = candidate.label.toLowerCase();
  if (/ulaşım|hat|transport|route/.test(label) || candidate.actionFamily === 'transport') {
    return { rewardBudget: '+2.500', rewardProgress: '+150', rewardGem: '+20' };
  }
  if (/atık|geri dönüşüm|waste|environment|çevre/.test(label) || candidate.actionFamily === 'environment') {
    return { rewardBudget: '+2.000', rewardProgress: '+120', rewardGem: '+15' };
  }
  if (/denetim|drone|uçuş|scan|sinyal/.test(label) || candidate.actionFamily === 'signal') {
    return { rewardBudget: '+1.500', rewardProgress: '+100', rewardGem: '+10' };
  }
  if (candidate.source === 'activeTarget') {
    return { rewardBudget: '+1.200', rewardProgress: '+80', rewardGem: '+12' };
  }
  return { rewardBudget: '+1.000', rewardProgress: '+50', rewardGem: '+8' };
}

function mapNextActionCard(candidate: CenterActionCandidate): CenterNextActionCard {
  return {
    id: candidate.id,
    title: candidate.label,
    subtitle: candidate.subtitle,
    ...resolveNextActionRewardPreview(candidate),
    iconKey: candidate.iconKey,
    accent: accentForCandidate(candidate),
    canonicalKey: candidate.canonicalKey,
    actionFamily: candidate.actionFamily,
    actionKey: candidate.actionKey,
    routeKey: candidate.routeKey,
    priority: candidate.priority,
    disabled: candidate.disabled,
    statusLabel: candidate.statusLabel,
  };
}

function resolveQuickCommandLayout(
  activeCommands: CenterQuickCommandTile[],
  lockedTeaser?: CenterQuickCommandTile,
): CenterQuickCommandLayout {
  if (activeCommands.length === 0 && !lockedTeaser) return 'hidden';
  if (lockedTeaser && activeCommands.length === 1) return 'twoPlusLockedTeaser';
  if (activeCommands.length >= 3) return 'threeColumn';
  if (activeCommands.length === 2) return 'twoColumn';
  if (activeCommands.length === 1) return 'singleCompact';
  return 'hidden';
}

function buildQuickCommandsPresentation(
  presentation: CenterHomeCoreSections,
  nextActions: CenterNextActionCard[],
): CenterQuickCommandsPresentation {
  const usedKeys = new Set(nextActions.map((item) => item.canonicalKey));
  const usedFamilies = new Set(nextActions.map((item) => item.actionFamily));

  const selected = selectCenterQuickCommands(
    collectQuickCommandCandidates(presentation),
    usedKeys,
    usedFamilies,
  ).filter((item) => !item.disabled && item.routeKey);

  const activeTiles: CenterQuickCommandTile[] = selected.map((candidate) => ({
    id: candidate.id,
    title: candidate.label,
    subtitle: candidate.subtitle,
    iconKey: candidate.iconKey,
    accent: tileAccentForCandidate(candidate),
    canonicalKey: candidate.canonicalKey,
    actionFamily: candidate.actionFamily,
    actionKey: candidate.actionKey,
    routeKey: candidate.routeKey,
  }));

  let lockedTeaser: CenterQuickCommandTile | undefined;
  const lockedCandidate = collectQuickCommandCandidates(presentation).find(
    (item) =>
      item.disabled &&
      item.unlockLabel &&
      item.unlockLabel.trim().length > 0 &&
      !/yakında/i.test(item.unlockLabel),
  );

  if (lockedCandidate && activeTiles.length < 3) {
    lockedTeaser = {
      id: `locked-${lockedCandidate.id}`,
      title: lockedCandidate.label,
      subtitle: lockedCandidate.unlockLabel,
      iconKey: 'lock-closed-outline',
      accent: 'amber',
      canonicalKey: lockedCandidate.canonicalKey,
      actionFamily: lockedCandidate.actionFamily,
      actionKey: lockedCandidate.actionKey,
      disabled: true,
      unlockLabel: lockedCandidate.unlockLabel,
    };
  }

  const layout = resolveQuickCommandLayout(activeTiles, lockedTeaser);
  const commands =
    layout === 'twoPlusLockedTeaser' && lockedTeaser
      ? [...activeTiles.slice(0, 1), lockedTeaser]
      : activeTiles.slice(0, 3);

  return {
    visibility: layout === 'hidden' ? 'hidden' : 'visible',
    title: 'Hızlı Komutlar',
    layout,
    commands,
  };
}

function buildWeeklyChart(presentation: CenterHomeCoreSections): CenterStrategicPulseWeeklyPoint[] {
  const pulse = buildCenterStrategicPulseUiModel(presentation);
  const base = pulse.metrics.find((metric) => metric.id === 'opportunity')?.value ?? 60;
  return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((label, index) => ({
    label,
    value: Math.max(0, Math.min(100, Math.round(base * (0.82 + index * 0.03)))),
  }));
}

function buildDynamicWeeklyChart(
  presentation: CenterHomeCoreSections,
): CenterStrategicPulseWeeklyPoint[] {
  const pulse = buildCenterStrategicPulseUiModel(presentation);
  const pressure = pulse.metrics.find((metric) => metric.id === 'pressure')?.value ?? 52;
  const risk = pulse.metrics.find((metric) => metric.id === 'risk')?.value ?? 42;
  const opportunity = pulse.metrics.find((metric) => metric.id === 'opportunity')?.value ?? 60;
  const baseline = buildWeeklyChart(presentation).map((point) => point.value);
  const signalWeight = presentation.operationSignals.signals.reduce((total, signal, index) => {
    const severityWeight = { urgent: 12, high: 8, medium: 5, low: 2 }[signal.severity] ?? 2;
    return total + severityWeight / (index + 1);
  }, 0);
  const base = opportunity * 0.52 + pressure * 0.24 + Math.max(0, 100 - risk) * 0.24;
  const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return labels.map((label, index) => {
    const wave = Math.sin((index + 1) * 1.18 + signalWeight * 0.04) * 7;
    const recovery = index >= 4 ? Math.max(0, opportunity - risk) * 0.08 : 0;
    const pressureDip = index === 2 || index === 3 ? pressure * 0.06 : 0;
    const baselinePull = (baseline[index] ?? base) * 0.16;
    const value = base * 0.84 + baselinePull + wave + recovery - pressureDip + signalWeight * 0.28;
    return {
      label,
      value: Math.max(0, Math.min(100, Math.round(value))),
    };
  });
}

function buildStrategicPulsePresentation(
  presentation: CenterHomeCoreSections,
): CenterStrategicPulsePresentation {
  const pulseUi = buildCenterStrategicPulseUiModel(presentation);
  const pressureMetric = pulseUi.metrics.find((metric) => metric.id === 'pressure')!;
  const riskMetric = pulseUi.metrics.find((metric) => metric.id === 'risk')!;
  const opportunityMetric = pulseUi.metrics.find((metric) => metric.id === 'opportunity')!;

  const topSignal = [...presentation.operationSignals.signals].sort((left, right) => {
    const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
    return weight[right.severity] - weight[left.severity];
  })[0];

  const compact: CenterStrategicPulseCompact = {
    pressure: {
      label: pressureMetric.label,
      valueText: `%${pressureMetric.value}`,
      percent: pressureMetric.value,
    },
    risk: {
      label: riskMetric.label,
      valueText: `%${riskMetric.value}`,
      percent: riskMetric.value,
    },
    opportunity: {
      label: opportunityMetric.label,
      valueText: `%${opportunityMetric.value}`,
      percent: opportunityMetric.value,
    },
    liveSignalLabel: pulseUi.liveTitle,
    advisorHint: pulseUi.advisorLine,
    cta: {
      label: 'Detaya Git',
      actionKey: pulseUi.liveActionKey,
      route: pulseUi.liveRoute,
      enabled: true,
    },
  };

  const detail: CenterStrategicPulseDetail = {
    chart: buildDynamicWeeklyChart(presentation),
    signalTitle: pulseUi.liveTitle,
    signalBody: pulseUi.liveBody,
    advisorHint: pulseUi.advisorLine,
    explanationRows: pulseUi.metrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      value: `%${metric.value}`,
      tone: metric.id === 'risk' ? 'warning' : metric.id === 'opportunity' ? 'positive' : 'neutral',
    })),
    primaryAction: {
      label: 'Operasyona Git',
      route: routeOrFallback(presentation.activeTarget.cta.route),
      actionKey: presentation.activeTarget.cta.actionKey,
      enabled: presentation.activeTarget.cta.enabled,
    },
    secondaryAction: {
      label: 'Raporlarda Aç',
      route: routeOrFallback(presentation.recommendedPlan.cta?.route, '/report'),
      actionKey: presentation.recommendedPlan.cta?.actionKey ?? 'view_report',
      enabled: true,
    },
  };

  if (topSignal?.route) {
    detail.primaryAction = {
      label: 'Operasyona Git',
      route: topSignal.route,
      actionKey: topSignal.actionKey ?? 'view_signal',
      enabled: true,
    };
  }

  return { compact, detail };
}

function mapNeighborhoodAccent(
  accent: CenterNeighborhoodEventModel['accent'],
): CenterNeighborhoodEventCard['accent'] {
  switch (accent) {
    case 'purple':
      return 'purple';
    case 'teal':
      return 'sage';
    case 'green':
      return 'green';
    default:
      return 'gold';
  }
}

export function buildCenterNeighborhoodEventsPresentation(
  presentation: CenterHomeCoreSections,
): CenterNeighborhoodEventsPresentation {
  const events = buildCenterNeighborhoodEvents(presentation).map((event) => ({
    id: event.id,
    title: event.title,
    locationLabel: event.locationLabel,
    valueLabel: event.valueLabel,
    timeLabel: event.timeLabel,
    imageKey: event.imageKey,
    statusLabel: event.statusLabel as CenterNeighborhoodEventCard['statusLabel'],
    accent: mapNeighborhoodAccent(event.accent),
    actionKey: event.actionKey,
    routeKey: event.route,
    isFallback: event.isFallback,
  }));

  return {
    visibility: events.length > 0 ? 'visible' : 'hidden',
    title: 'Mahalle Etkinlikleri',
    events,
  };
}

function buildNextActionsPresentation(presentation: CenterHomeCoreSections): CenterNextActionsPresentation {
  const selected = selectCenterNextActions(collectNextActionCandidates(presentation)).map(mapNextActionCard);

  if (selected.length === 0 && presentation.activeTarget.cta.enabled) {
    const fallback = enrichCenterActionCandidate({
      id: 'active-target-fallback',
      source: 'activeTarget',
      placement: 'nextAction',
      label: presentation.activeTarget.cta.label,
      subtitle: presentation.activeTarget.title,
      iconKey: 'flag-outline',
      actionKey: presentation.activeTarget.cta.actionKey,
      routeKey: presentation.activeTarget.cta.route,
      priority: 50,
      statusLabel: 'Sıradaki',
      accent: 'gold',
    });
    return {
      visibility: fallback.routeKey ? 'visible' : 'hidden',
      title: 'Sıradaki Hamleler',
      actions: [mapNextActionCard(fallback)],
    };
  }

  return {
    visibility: selected.length > 0 ? 'visible' : 'hidden',
    title: 'Sıradaki Hamleler',
    actions: selected,
  };
}

function buildNextTargetHeroPresentation(
  presentation: CenterHomeCoreSections,
  nextActions: CenterNextActionCard[],
): CenterNextTargetHeroPresentation {
  if (!isActiveTargetCompleted(presentation)) {
    return {
      visibility: 'hidden',
      eyebrow: 'Sıradaki Hedef',
      title: '',
      iconKey: 'arrow-forward-circle-outline',
      actionKey: 'none',
    };
  }

  const primary = nextActions.find((action) => action.routeKey && !action.disabled) ?? nextActions[0];
  if (!primary) {
    return {
      visibility: 'hidden',
      eyebrow: 'Sıradaki Hedef',
      title: '',
      iconKey: 'arrow-forward-circle-outline',
      actionKey: 'none',
    };
  }

  return {
    visibility: 'visible',
    eyebrow: 'Sıradaki Hedef',
    title: primary.title,
    subtitle: primary.subtitle,
    statusLabel: primary.statusLabel,
    iconKey: primary.iconKey,
    actionKey: primary.actionKey,
    routeKey: primary.routeKey,
  };
}

export function buildCenterHubGameplayPresentation(
  presentation: CenterHomeCoreSections,
  recentDecision?: DecisionRecord | null,
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null,
  periodGoalOptions?: {
    socialPulseState?: import('@/core/social/socialTypes').SocialPulseState | null;
    tomorrowRisk?: import('@/core/tomorrowRisk/tomorrowRiskTypes').TomorrowRiskModel | null;
    playerStyleId?: import('@/core/playerStyle/playerStyleTypes').PlayerStyleId | null;
    selectedDistrictName?: string | null;
  },
): CenterHubGameplayPresentation {
  const nextActions = buildNextActionsPresentation(presentation);
  const quickCommands = buildQuickCommandsPresentation(presentation, nextActions.actions);
  const strategicPulse = buildStrategicPulsePresentation(presentation);
  const depth = buildCenterHubDepthPresentation(
    presentation,
    nextActions.actions,
    strategicPulse.compact.advisorHint,
    recentDecision,
  );

  const neighborhoodEvents = buildCenterNeighborhoodEventsPresentation(presentation);
  const hubReadinessSnapshot = buildHubReadinessSnapshotFromPresentation(presentation);
  const maintenancePresentation = buildMaintenanceBacklogRuntimePresentation(
    maintenanceBacklogRuntime ?? { items: [], attentionStreaks: {} },
    { readinessSnapshot: hubReadinessSnapshot },
  );
  const maintenanceHubSignal = buildMaintenanceRuntimeHubSignal(maintenancePresentation, [
    strategicPulse.compact.advisorHint ?? '',
    depth.advisorMiniDirective.directive,
    presentation.operationSignals.summaryLine ?? '',
    presentation.advisorSuggestion.recommendation,
  ].filter((line): line is string => Boolean(line?.trim())), {
    day: presentation.dailyReward.today.dayIndex,
    runtime: maintenanceBacklogRuntime ?? undefined,
    operationsToday: presentation.operationFocus.items.length || 1,
  });
  const miniCityFeed = buildMiniCityFeedPresentation({
    presentation,
    recentImpactSummary: depth.recentImpactSummary,
    advisorMiniDirective: depth.advisorMiniDirective,
    districtFocus: depth.districtFocus,
    strategicPulse,
    neighborhoodEvents,
    maintenanceHubSignal,
  });

  const periodGoalContext = buildPeriodGoalContextFromHub(presentation, {
    maintenanceBacklogRuntime,
    socialPulseState: periodGoalOptions?.socialPulseState,
    tomorrowRisk: periodGoalOptions?.tomorrowRisk,
    playerStyleId: periodGoalOptions?.playerStyleId,
    selectedDistrictName: periodGoalOptions?.selectedDistrictName,
    decisionHistory: recentDecision
      ? [
          {
            day: recentDecision.day,
            eventTitle: recentDecision.eventTitle,
            decisionLabel: recentDecision.decisionLabel,
          },
        ]
      : [],
  });
  const cityAgenda = buildHubPeriodGoalCard(periodGoalContext, [
    strategicPulse.compact.advisorHint ?? '',
    depth.advisorMiniDirective.directive,
    maintenanceHubSignal?.title ?? '',
    maintenanceHubSignal?.subtitle ?? '',
    miniCityFeed.title,
    miniCityFeed.subtitle,
  ].filter((line): line is string => Boolean(line?.trim())));

  return {
    ...depth,
    nextTargetHero: buildNextTargetHeroPresentation(presentation, nextActions.actions),
    nextActions,
    strategicPulse,
    neighborhoodEvents,
    quickCommands,
    dailyRewardMini: buildCenterDailyRewardMiniStrip(presentation),
    miniCityFeed,
    cityAgenda,
    maintenanceHubSignal,
  };
}

export { centerHomeHasDuplicateVisibleActions };

export function domainFromSignal(
  signal: CenterOperationSignalItem | undefined,
): CenterOperationDomain | undefined {
  return signal?.domain;
}

export function normalizeEventDomain(
  domain: CenterOperationDomain | CenterActiveTargetDomain | undefined,
): 'environment' | 'social' | 'logistics' | 'safety' | 'economy' {
  switch (domain) {
    case 'environment':
    case 'maintenance':
    case 'energy':
      return 'environment';
    case 'social':
      return 'social';
    case 'transport':
    case 'logistics':
      return 'logistics';
    default:
      return 'safety';
  }
}
