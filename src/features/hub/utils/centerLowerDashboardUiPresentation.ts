import type { CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterHomeCoreSections } from './centerHomePresentation';
import type { CenterOperationDomain } from './centerOperationFocusPresentation';
import type { CenterOperationSignalItem } from './centerOperationSignalsPresentation';

export type CenterLowerActionKey = string;

export type CenterStrategicPulseMetricModel = {
  id: 'pressure' | 'risk' | 'opportunity';
  label: string;
  value: number;
  iconKey: string;
  tone: 'gold' | 'green' | 'amber';
};

export type CenterStrategicPulseUiModel = {
  metrics: CenterStrategicPulseMetricModel[];
  liveTitle: string;
  liveBody: string;
  liveRoute: string;
  liveActionKey: CenterLowerActionKey;
  advisorLine?: string;
  advisorRoute?: string;
};

export type CenterNextActionModel = {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  iconKey: string;
  route: string;
  actionKey: CenterLowerActionKey;
  tone: 'green' | 'gold' | 'warning';
};

export type CenterNeighborhoodEventAccent = 'gold' | 'green' | 'purple' | 'teal';

export type CenterNeighborhoodEventImageKey =
  | 'park'
  | 'city'
  | 'hall'
  | 'market'
  | 'safe';

export type CenterNeighborhoodEventModel = {
  id: string;
  title: string;
  locationLabel: string;
  valueLabel?: string;
  timeLabel: string;
  imageKey: CenterNeighborhoodEventImageKey;
  statusLabel: string;
  accent: CenterNeighborhoodEventAccent;
  actionKey: CenterLowerActionKey;
  route?: string;
  isFallback?: boolean;
};

export type CenterGameCommandTileModel = {
  id: string;
  title: string;
  subtitle: string;
  iconKey: string;
  route: string;
  actionKey: CenterLowerActionKey;
  tone: 'forest' | 'gold' | 'green';
  sourceLabel: string;
  isStaticFallback?: boolean;
};

export type CenterDailyRewardMiniStripModel = {
  label: string;
  rewardText: string;
  helperText?: string;
  iconKey: string;
};

export type CenterLowerDashboardUiModel = {
  strategicPulse: CenterStrategicPulseUiModel;
  nextActions: CenterNextActionModel[];
  neighborhoodEvents: CenterNeighborhoodEventModel[];
  gameCommands: CenterGameCommandTileModel[];
  dailyRewardMini?: CenterDailyRewardMiniStripModel;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseMetricNumber(valueText: string | undefined): number | undefined {
  if (!valueText) return undefined;
  const match = valueText.replace(/\./g, '').match(/\d+/);
  if (!match) return undefined;
  const value = Number.parseInt(match[0], 10);
  return Number.isFinite(value) ? value : undefined;
}

function routeOrFallback(route: string | undefined, fallback = '/events'): string {
  return route?.trim() || fallback;
}

function normalizeText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function domainFromSignal(signal: CenterOperationSignalItem | undefined): CenterOperationDomain | undefined {
  return signal?.domain;
}

function normalizeEventDomain(
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

function eventCopyForDomain(domain: ReturnType<typeof normalizeEventDomain>, seed: number) {
  const variants = {
    environment: [
      { title: 'Atık Noktası Açıldı', imageKey: 'park' as const, accent: 'green' as const },
      { title: 'Park Temizliği Tamamlandı', imageKey: 'safe' as const, accent: 'green' as const },
    ],
    social: [
      { title: 'Mahalle Buluşması Başladı', imageKey: 'city' as const, accent: 'purple' as const },
      { title: 'Gençlik Etkinliği Aktif', imageKey: 'hall' as const, accent: 'purple' as const },
    ],
    logistics: [
      { title: 'Elektrikli Hat Hazır', imageKey: 'market' as const, accent: 'gold' as const },
      { title: 'Pazar Akışı Dengede', imageKey: 'city' as const, accent: 'teal' as const },
    ],
    safety: [
      { title: 'Saha Gözü Taraması Tamamlandı', imageKey: 'safe' as const, accent: 'teal' as const },
      { title: 'Güvenlik Devriyesi Aktif', imageKey: 'city' as const, accent: 'teal' as const },
    ],
    economy: [
      { title: 'Esnaf Günü Başladı', imageKey: 'market' as const, accent: 'gold' as const },
      { title: 'Pazar Denetimi Tamam', imageKey: 'market' as const, accent: 'gold' as const },
    ],
  };
  const list = variants[domain];
  return list[seed % list.length] ?? list[0]!;
}

function valueForEventDomain(domain: ReturnType<typeof normalizeEventDomain>): string {
  switch (domain) {
    case 'environment':
      return 'Çevre etkisi +8';
    case 'social':
      return 'Mahalle güveni güçlendi';
    case 'logistics':
      return 'Ulaşım baskısını düşürür';
    case 'economy':
      return 'Yerel ekonomi canlandı';
    default:
      return 'Riskli bölgeler tarandı';
  }
}

function isPassiveEventTitle(title: string): boolean {
  return /rapor önizlemesi|yaklaşan açılım|şehir hikâyesi|yetki önizlemesi|hikâye zinciri/i.test(
    title.trim(),
  );
}

function iconForKey(iconKey: string | undefined): string {
  const value = iconKey?.trim();
  return value && value.length > 0 ? value : 'ellipse-outline';
}

export function buildCenterStrategicPulseUiModel(
  presentation: CenterHomeCoreSections,
): CenterStrategicPulseUiModel {
  const topSignal = [...presentation.operationSignals.signals].sort((left, right) => {
    const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
    return weight[right.severity] - weight[left.severity];
  })[0];
  const riskMetric = presentation.citySummary.metrics.find((metric) => metric.id === 'risk');
  const trustMetric = presentation.citySummary.metrics.find((metric) => metric.id === 'trust');
  const activeMetric = presentation.citySummary.metrics.find(
    (metric) => metric.id === 'activeOperations',
  );
  const urgentCount = presentation.operationSignals.signals.filter(
    (signal) => signal.severity === 'urgent' || signal.severity === 'high',
  ).length;
  const signalCount = presentation.operationSignals.signals.length;
  const riskValue =
    parseMetricNumber(riskMetric?.valueText) ??
    (topSignal?.severity === 'urgent' ? 82 : topSignal?.severity === 'high' ? 68 : 42);
  const pressureValue =
    parseMetricNumber(activeMetric?.valueText) !== undefined
      ? 52 + parseMetricNumber(activeMetric?.valueText)! * 8
      : 48 + urgentCount * 14 + signalCount * 4;
  const opportunityValue =
    parseMetricNumber(trustMetric?.valueText) ??
    Math.max(38, 72 - urgentCount * 10 + Math.max(0, signalCount - urgentCount) * 6);
  const advisor = presentation.advisorSuggestion;
  const advisorVisible =
    advisor.visibility !== 'hidden' &&
    advisor.visibility !== 'empty' &&
    advisor.recommendation.trim().length > 0;

  return {
    metrics: [
      {
        id: 'pressure',
        label: 'Baskı',
        value: clampPercent(pressureValue),
        iconKey: 'pulse-outline',
        tone: 'gold',
      },
      {
        id: 'risk',
        label: 'Risk',
        value: clampPercent(riskValue),
        iconKey: 'warning-outline',
        tone: 'amber',
      },
      {
        id: 'opportunity',
        label: 'Fırsat',
        value: clampPercent(opportunityValue),
        iconKey: 'trending-up-outline',
        tone: 'green',
      },
    ],
    liveTitle: normalizeText(topSignal?.title, 'Şehir dengede'),
    liveBody: normalizeText(
      topSignal?.description ?? presentation.operationSignals.summaryLine,
      presentation.citySummary.primaryInsight?.text ?? 'Saha akışı izleniyor.',
    ),
    liveRoute: routeOrFallback(topSignal?.route ?? presentation.operationSignals.cta?.route),
    liveActionKey: topSignal?.actionKey ?? presentation.operationSignals.cta?.actionKey ?? 'view_signals',
    advisorLine: advisorVisible ? advisor.recommendation : undefined,
    advisorRoute: advisorVisible ? advisor.action?.route : undefined,
  };
}

function titleForNextAction(
  id: string,
  fallback: string,
): string {
  switch (id) {
    case 'team':
      return 'Ekip Yönlendir';
    case 'signal':
      return 'Sinyal Tara';
    case 'resource':
      return 'Kaynak Ayır';
    case 'flow':
      return 'Raporu Tamamla';
    default:
      return fallback;
  }
}

export function buildCenterNextActions(
  presentation: CenterHomeCoreSections,
): CenterNextActionModel[] {
  const commandPanel = presentation.operationFocus.commandPanel;
  const fromStatusCards =
    commandPanel?.statusCards.map((card) => {
      const sheet = commandPanel.sheets[card.id];
      return {
        id: `status-${card.id}`,
        title: titleForNextAction(card.id, card.title),
        subtitle: card.statusLine,
        statusLabel: card.state === 'warning' ? 'Dikkat' : card.state === 'completed' ? 'Tamam' : 'Hazır',
        iconKey: iconForKey(card.iconKey),
        route: routeOrFallback(sheet?.primaryCtaRoute ?? commandPanel.recommendedMove.route),
        actionKey: card.id,
        tone: card.state === 'warning' ? ('warning' as const) : card.id === 'resource' ? ('gold' as const) : ('green' as const),
      };
    }) ?? [];

  const fromFocusItems = presentation.operationFocus.items.map((item) => ({
    id: `focus-${item.id}`,
    title: item.title,
    subtitle: item.subtitle ?? item.statusLabel,
    statusLabel: item.statusLabel,
    iconKey: iconForKey(item.iconKey),
    route: routeOrFallback(item.route ?? presentation.operationFocus.cta?.route),
    actionKey: presentation.operationFocus.cta?.actionKey ?? 'view_domain',
    tone: item.tone === 'warning' || item.tone === 'urgent' ? ('warning' as const) : ('green' as const),
  }));

  const actions = [...fromStatusCards, ...fromFocusItems].slice(0, 3);
  if (actions.length > 0) return actions;

  return [
    {
      id: 'active-target-fallback',
      title: normalizeText(presentation.activeTarget.cta.label, 'Operasyona Git'),
      subtitle: presentation.activeTarget.title,
      statusLabel: 'Sıradaki',
      iconKey: 'flag-outline',
      route: routeOrFallback(presentation.activeTarget.cta.route),
      actionKey: presentation.activeTarget.cta.actionKey,
      tone: 'gold',
    },
  ];
}

function eventFromContinuationCard(
  presentation: CenterHomeCoreSections,
  index: number,
): CenterNeighborhoodEventModel[] {
  return presentation.continuationCards.cards
    .filter((card) => !isPassiveEventTitle(card.title))
    .map((card, cardIndex) => {
    const domain = normalizeEventDomain(domainFromSignal(presentation.operationSignals.signals[cardIndex]));
    const copy = eventCopyForDomain(domain, cardIndex);
    return {
      id: `continuation-${card.id}`,
      title: copy.title,
      locationLabel: card.label ?? 'Mahalle gündemi',
      valueLabel: card.body || valueForEventDomain(domain),
      timeLabel: card.priority === 'high' ? 'Bugün' : '5dk önce',
      imageKey: copy.imageKey,
      statusLabel: card.label ?? (card.enabled ? 'Aktif' : 'İzle'),
      accent: card.tone === 'warning' ? 'gold' : copy.accent,
      actionKey: card.actionKey,
      route: card.route,
    };
  }).slice(index);
}

export function buildCenterNeighborhoodEvents(
  presentation: CenterHomeCoreSections,
): CenterNeighborhoodEventModel[] {
  const events: CenterNeighborhoodEventModel[] = [];

  presentation.operationSignals.signals.forEach((signal, index) => {
    const domain = normalizeEventDomain(signal.domain);
    const copy = eventCopyForDomain(domain, index);
    events.push({
      id: `signal-${signal.id}`,
      title: signal.title && !isPassiveEventTitle(signal.title) ? signal.title : copy.title,
      locationLabel: signal.sourceLabel || copy.title,
      valueLabel: signal.description || valueForEventDomain(domain),
      timeLabel:
        signal.severity === 'urgent' || signal.severity === 'high'
          ? '5dk önce'
          : index === 0
            ? '15dk önce'
            : 'Bugün',
      imageKey: copy.imageKey,
      statusLabel:
        domain === 'logistics'
          ? 'Ulaşım'
          : domain === 'environment'
            ? 'Çevre'
            : domain === 'safety'
              ? 'Güvenlik'
              : domain === 'economy'
                ? 'Ekonomi'
                : 'Yeni',
      accent: signal.tone === 'warning' || signal.tone === 'urgent' ? 'gold' : copy.accent,
      actionKey: signal.actionKey ?? 'view_signal',
      route: signal.route,
    });
  });

  if (events.length < 4) {
    events.push(...eventFromContinuationCard(presentation, 0));
  }

  if (events.length < 4) {
    presentation.recommendedPlan.steps?.forEach((step, index) => {
      const domain = normalizeEventDomain(presentation.activeTarget.domain);
      const copy = eventCopyForDomain(domain, index + events.length);
      events.push({
        id: `plan-${step.id}`,
        title: step.label || copy.title,
        locationLabel: presentation.recommendedPlan.title,
        valueLabel:
          step.state === 'locked'
            ? 'İlk operasyon sonrasında açılır'
            : step.state === 'current'
              ? 'Sıradaki adımı tamamla'
              : 'Yeni bölge hazırlanıyor',
        timeLabel: step.state === 'current' ? 'Şimdi' : 'Plan',
        imageKey: copy.imageKey,
        statusLabel: step.state === 'done' ? 'Tamam' : step.state === 'current' ? 'Aktif' : 'Sırada',
        accent: copy.accent,
        actionKey: presentation.recommendedPlan.cta?.actionKey ?? 'view_plan',
        route: presentation.recommendedPlan.cta?.route,
      });
    });
  }

  if (events.length < 4 && presentation.activeTarget.visibility !== 'empty') {
    const domain = normalizeEventDomain(presentation.activeTarget.domain);
    const copy = eventCopyForDomain(domain, events.length);
    events.push({
      id: `active-${presentation.activeTarget.id}`,
      title: copy.title,
      locationLabel: presentation.activeTarget.categoryLabel ?? presentation.activeTarget.title,
      valueLabel:
        presentation.activeTarget.status === 'completed'
          ? 'Şehir etkisini gör'
          : 'Operasyon etkisini başlat',
      timeLabel: presentation.activeTarget.status === 'completed' ? 'Tamamlandı' : 'Bugün',
      imageKey: copy.imageKey,
      statusLabel: presentation.activeTarget.priority === 'urgent' ? 'Acil' : 'Aktif',
      accent: copy.accent,
      actionKey: presentation.activeTarget.cta.actionKey,
      route: presentation.activeTarget.cta.route,
    });
  }

  if (events.length < 4 && presentation.citySummary.primaryInsight) {
    const copy = eventCopyForDomain('safety', events.length);
    events.push({
      id: 'city-insight',
      title: copy.title,
      locationLabel: presentation.citySummary.primaryInsight.label,
      valueLabel: presentation.citySummary.primaryInsight.text,
      timeLabel: 'İzle',
      imageKey: copy.imageKey,
      statusLabel: presentation.citySummary.primaryInsight.tone === 'warning' ? 'Dikkat' : 'Dengeli',
      accent: copy.accent,
      actionKey: 'view_city_summary',
      route: '/events',
    });
  }

  if (events.length === 0) {
    return [
      {
        id: 'fallback-neighborhood',
        title: 'Mahalle Akışı',
        locationLabel: 'Veri bekleniyor',
        valueLabel: 'İlk operasyon sonrasında açılır',
        timeLabel: 'Yakında',
        imageKey: 'city',
        statusLabel: 'Hazırlanıyor',
        accent: 'teal',
        actionKey: 'none',
        route: '/events',
        isFallback: true,
      },
    ];
  }

  const unique = new Map<string, CenterNeighborhoodEventModel>();
  events.forEach((event) => {
    if (!unique.has(event.id)) unique.set(event.id, event);
  });
  return [...unique.values()].slice(0, 4);
}

function titleForCommand(input: {
  domain?: string;
  actionKey?: string;
  iconKey?: string;
  status?: string;
  label: string;
}): string {
  const haystack = [input.domain, input.actionKey, input.iconKey, input.status, input.label]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/open_operations|view_operations/.test(haystack)) return 'Denetim Aç';
  if (/open_map|view_map|map|logistics|transport/.test(haystack)) return 'Saha Akışını Aç';
  if (/team|people|personnel|assign/.test(haystack)) return 'Ekip Yönlendir';
  if (/infrastructure|resource|wallet|energy|open_resources|kaynak/.test(haystack)) return 'Altyapı Başlat';
  if (/social|trust|authority|halk|uzla/.test(haystack)) return 'Uzlaşma Kur';
  if (/signal|risk|pulse|warning/.test(haystack)) return 'Sinyal Tara';
  if (/report|completed|flow|journal/.test(haystack)) return 'Sonucu Gör';
  return input.label;
}

export function buildCenterGameCommandTiles(
  presentation: CenterHomeCoreSections,
): CenterGameCommandTileModel[] {
  const quickTiles = presentation.quickActions.items
    .filter((item) => item.enabled && item.route)
    .map((item, index) => ({
      id: `quick-${item.id}`,
      title: titleForCommand({
        domain: item.domain,
        actionKey: item.actionKey,
        iconKey: item.iconKey,
        status: item.status,
        label: item.label,
      }),
      subtitle: item.description ?? item.badgeText ?? item.sourceLabel,
      iconKey: iconForKey(item.iconKey),
      route: routeOrFallback(item.route),
      actionKey: item.actionKey,
      tone: index === 1 ? ('gold' as const) : index % 2 === 0 ? ('forest' as const) : ('green' as const),
      sourceLabel: item.sourceLabel,
    }));

  const commandPanel = presentation.operationFocus.commandPanel;
  const statusTiles =
    commandPanel?.statusCards.map((card, index) => {
      const sheet = commandPanel.sheets[card.id];
      return {
        id: `status-${card.id}`,
        title: titleForCommand({
          actionKey: card.id,
          iconKey: card.iconKey,
          status: card.state,
          label: card.title,
        }),
        subtitle: card.statusLine,
        iconKey: iconForKey(card.iconKey),
        route: routeOrFallback(sheet?.primaryCtaRoute ?? commandPanel.recommendedMove.route),
        actionKey: card.id,
        tone: index === 1 ? ('gold' as const) : index % 2 === 0 ? ('forest' as const) : ('green' as const),
        sourceLabel: 'operationFocus.commandPanel',
      };
    }) ?? [];

  const tiles = [...quickTiles, ...statusTiles].slice(0, 3);
  if (tiles.length > 0) {
    return tiles.map((tile, index) => ({
      ...tile,
      tone: index === 1 ? 'gold' : index === 0 ? 'forest' : 'green',
    }));
  }

  return [
    {
      id: 'active-target-command',
      title: normalizeText(presentation.activeTarget.cta.label, 'Operasyona Git'),
      subtitle: presentation.activeTarget.title,
      iconKey: 'flag-outline',
      route: routeOrFallback(presentation.activeTarget.cta.route),
      actionKey: presentation.activeTarget.cta.actionKey,
      tone: 'gold',
      sourceLabel: 'activeTarget.cta',
      isStaticFallback: true,
    },
  ];
}

export function buildCenterDailyRewardMiniStrip(
  presentation: CenterHomeCoreSections,
): CenterDailyRewardMiniStripModel | undefined {
  const reward = presentation.dailyReward;
  if (reward.visibility === 'hidden' || reward.visibility === 'empty' || reward.claimState === 'unavailable') {
    return undefined;
  }
  const rewardText =
    reward.primaryReward?.valueText ??
    reward.today.rewardText ??
    reward.nextBigReward?.label ??
    'ödül hazır';

  return {
    label: `Günlük Seri · ${reward.today.dayIndex}. gün`,
    rewardText,
    helperText: reward.claimedToday ? 'Bugün alındı' : reward.helperText,
    iconKey: reward.primaryReward?.iconKey ?? reward.today.rewardIconKey,
  };
}

export function buildCenterLowerDashboardUiModel(
  presentation: CenterHomeCoreSections,
): CenterLowerDashboardUiModel {
  return {
    strategicPulse: buildCenterStrategicPulseUiModel(presentation),
    nextActions: buildCenterNextActions(presentation),
    neighborhoodEvents: buildCenterNeighborhoodEvents(presentation),
    gameCommands: buildCenterGameCommandTiles(presentation),
    dailyRewardMini: buildCenterDailyRewardMiniStrip(presentation),
  };
}
