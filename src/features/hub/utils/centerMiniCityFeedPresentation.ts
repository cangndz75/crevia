import { buildDistrictFeedWatchCopy } from '@/core/districtPersonality';
import { lineDuplicatesAvoidLines, normalizePresentationText } from '@/core/presentationDedupe';
import type { CenterHomeCoreSections } from './centerHomePresentation';
import type { MaintenanceHubSignal } from '@/core/maintenanceBacklog';
import type {
  CenterAdvisorMiniDirectivePresentation,
  CenterDistrictFocusPresentation,
  CenterRecentImpactSummaryPresentation,
} from './centerHubDepthPresentation';
import type {
  CenterNeighborhoodEventsPresentation,
  CenterStrategicPulsePresentation,
} from './centerHubGameplayPresentation';

export type MiniCityFeedItemType =
  | 'recentImpact'
  | 'socialPulse'
  | 'fieldUpdate'
  | 'advisorHint'
  | 'districtWatch'
  | 'dailyGoal';

export type MiniCityFeedItemTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral'
  | 'active';

export type MiniCityFeedItem = {
  id: string;
  type: MiniCityFeedItemType;
  title: string;
  subtitle?: string;
  sourceLabel: string;
  tone: MiniCityFeedItemTone;
  iconKey?: string;
  districtName?: string;
  routeKey?: string;
  actionKey?: string;
  priority: number;
  dedupeKey: string;
  eventId?: string;
};

export type MiniCityFeedPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  subtitle: string;
  statusPill: string;
  items: MiniCityFeedItem[];
  emptyFallback?: MiniCityFeedItem;
};

export type BuildMiniCityFeedInput = {
  presentation: CenterHomeCoreSections;
  recentImpactSummary: CenterRecentImpactSummaryPresentation;
  advisorMiniDirective: CenterAdvisorMiniDirectivePresentation;
  districtFocus: CenterDistrictFocusPresentation;
  strategicPulse: CenterStrategicPulsePresentation;
  neighborhoodEvents: CenterNeighborhoodEventsPresentation;
  maintenanceHubSignal?: MaintenanceHubSignal | null;
};

const MAX_FEED_ITEMS = 3;
const MAX_ITEMS_PER_DISTRICT = 2;

function normalizeLine(value: string | null | undefined): string {
  return normalizePresentationText(value);
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  return lineDuplicatesAvoidLines(a, [b]);
}

function clampText(value: string | undefined, limit: number): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function resolveDay(presentation: CenterHomeCoreSections): number {
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  return Number(dayChip?.valueText.match(/\d+/)?.[0] ?? 1);
}

function locativeDistrict(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Bölgede';
  if (trimmed.endsWith('yon')) return `${trimmed}'da`;
  if (trimmed.endsWith('t')) return `${trimmed}'te`;
  return `${trimmed}'de`;
}

function iconForTone(tone: MiniCityFeedItemTone, type: MiniCityFeedItemType): string {
  if (type === 'fieldUpdate') return 'navigate-outline';
  if (type === 'advisorHint') return 'sparkles-outline';
  if (type === 'dailyGoal') return 'flag-outline';
  switch (tone) {
    case 'positive':
      return 'trending-up-outline';
    case 'warning':
    case 'critical':
      return 'alert-circle-outline';
    case 'active':
      return 'radio-outline';
    case 'mixed':
      return 'pulse-outline';
    default:
      return 'ellipse-outline';
  }
}

function mapReactionTone(
  tone: CenterRecentImpactSummaryPresentation['tone'],
): MiniCityFeedItemTone {
  switch (tone) {
    case 'positive':
      return 'positive';
    case 'mixed':
      return 'mixed';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'critical';
    default:
      return 'neutral';
  }
}

function buildRecentImpactFeedItem(
  recent: CenterRecentImpactSummaryPresentation,
  day: number,
): MiniCityFeedItem | null {
  if (recent.visibility !== 'visible') return null;

  const district = recent.districtName?.trim();
  const tone = mapReactionTone(recent.tone);
  let title: string | undefined;
  let subtitle: string | undefined;

  if (district && tone === 'positive') {
    title = `${locativeDistrict(district)} güven toparlanıyor.`;
    subtitle = clampText(
      recent.subtitle ?? 'Son müdahalenin etkisi mahallede görünür oldu.',
      72,
    );
  } else if (district && (tone === 'warning' || tone === 'critical')) {
    title = `${locativeDistrict(district)} baskı izleniyor.`;
    subtitle = clampText(recent.subtitle ?? recent.compactSummary, 72);
  } else if (recent.compactSummary?.trim()) {
    title = clampText(recent.compactSummary, 64);
    subtitle = clampText(recent.subtitle ?? recent.socialLine, 72);
  } else if (recent.subtitle?.trim()) {
    title = clampText(recent.subtitle, 64);
    subtitle = clampText(recent.socialLine ?? recent.advisorLine, 72);
  }

  if (!title) return null;

  if (day <= 1) {
    title = clampText(recent.subtitle ?? title, 64) ?? title;
    subtitle = clampText('İlk etki mahallede kayda geçti.', 72);
  }

  return {
    id: `feed-recent-${recent.eventId ?? recent.id ?? 'impact'}`,
    type: 'recentImpact',
    title,
    subtitle,
    sourceLabel: 'Son Etki',
    tone,
    iconKey: iconForTone(tone, 'recentImpact'),
    districtName: district,
    routeKey: recent.secondaryAction?.route ?? recent.primaryAction?.route,
    actionKey: recent.secondaryAction?.actionKey ?? recent.primaryAction?.actionKey,
    priority: 100,
    dedupeKey: `recentImpact:${recent.eventId ?? recent.id ?? title}`,
    eventId: recent.eventId,
  };
}

function buildSocialPulseFeedItem(
  presentation: CenterHomeCoreSections,
  districtFocus: CenterDistrictFocusPresentation,
  day: number,
): MiniCityFeedItem | null {
  if (day <= 1) return null;

  const socialSignal = presentation.operationSignals.signals.find(
    (signal) => signal.signalType === 'social_reaction' || signal.domain === 'social',
  );

  const district =
    socialSignal?.sourceLabel?.trim() ||
    districtFocus.districtName?.trim() ||
    presentation.activeTarget.subtitle?.replace(/^konum:\s*/i, '').split('·')[0]?.trim();

  const happiness = presentation.citySummary.metrics.find((metric) => metric.id === 'happiness');
  const rising =
    socialSignal?.tone === 'warning' ||
    socialSignal?.severity === 'high' ||
    socialSignal?.severity === 'urgent' ||
    happiness?.tone === 'warning';

  if (!socialSignal && !rising) return null;

  const title = rising
    ? district
      ? `Sosyal nabız ${district}'da yükseliyor.`
      : 'Sosyal nabız yükseliyor.'
    : district
      ? `Sosyal nabız ${district}'da hareketli.`
      : 'Sosyal nabız hareketli.';

  const subtitle = clampText(
    socialSignal?.description ??
      socialSignal?.helperText ??
      'Beklenti artmadan görünür takip gerekebilir.',
    72,
  );

  return {
    id: `feed-social-${socialSignal?.id ?? 'pulse'}`,
    type: 'socialPulse',
    title,
    subtitle,
    sourceLabel: 'Sosyal Nabız',
    tone: rising ? 'warning' : 'mixed',
    iconKey: iconForTone(rising ? 'warning' : 'mixed', 'socialPulse'),
    districtName: district || undefined,
    routeKey: socialSignal?.route ?? presentation.operationSignals.cta?.route,
    actionKey: socialSignal?.actionKey ?? presentation.operationSignals.cta?.actionKey,
    priority: 86,
    dedupeKey: `socialPulse:${socialSignal?.id ?? title}`,
    eventId: socialSignal?.sourceIds[0],
  };
}

function buildFieldUpdateFeedItem(
  presentation: CenterHomeCoreSections,
): MiniCityFeedItem | null {
  const { activeTarget } = presentation;
  if (activeTarget.status !== 'in_progress' && activeTarget.visibility !== 'visible') {
    return null;
  }
  if (activeTarget.status !== 'in_progress') return null;

  const district =
    activeTarget.subtitle?.replace(/^konum:\s*/i, '').split('·')[0]?.trim() ||
    activeTarget.categoryLabel?.trim();

  const shortTitle = district
    ? `Saha ekibi ${district} odağında.`
    : 'Saha ekibi bölgede.';

  const subtitle = clampText(
    activeTarget.progress?.label ??
      activeTarget.helperText ??
      'İlk kontrol başladı, kaynak kullanımı izleniyor.',
    72,
  );

  return {
    id: `feed-field-${activeTarget.id}`,
    type: 'fieldUpdate',
    title: shortTitle,
    subtitle,
    sourceLabel: 'Saha',
    tone: 'active',
    iconKey: iconForTone('active', 'fieldUpdate'),
    districtName: district || undefined,
    routeKey: activeTarget.cta.route,
    actionKey: activeTarget.cta.actionKey,
    priority: 112,
    dedupeKey: `fieldUpdate:${activeTarget.id}`,
  };
}

function isUnsafeFeedDistrictName(value: string | undefined): boolean {
  const normalized = normalizeLine(value);
  return (
    !normalized ||
    normalized === 'ilk olay' ||
    normalized === 'günlük hedef' ||
    normalized === 'başlangıç' ||
    normalized === 'baslangic' ||
    normalized.includes('hedef') ||
    normalized.includes('olay') ||
    normalized.includes('taşma') ||
    normalized.includes('tasma')
  );
}

function buildDistrictWatchFeedItem(
  districtFocus: CenterDistrictFocusPresentation,
  day: number,
): MiniCityFeedItem | null {
  if (districtFocus.visibility !== 'visible' || day <= 1) return null;

  const risk = districtFocus.riskLabel.trim();
  const trust = districtFocus.trustLabel.trim();
  const fragile =
    /yüksek|orta|kırılgan|izle|düşük/i.test(risk) ||
    /düşük|kırılgan|izle/i.test(trust);

  if (!fragile) return null;

  const name = districtFocus.districtName.trim();
  if (!name || isUnsafeFeedDistrictName(name)) return null;

  const personalityCopy = buildDistrictFeedWatchCopy({
    districtName: name,
    day,
    fragile: fragile,
    outcomeBand: /yüksek|orta/i.test(risk) ? 'warning' : 'neutral',
    avoidLines: [risk, trust],
  });

  const title = personalityCopy?.title ?? `${name} takipte.`;
  const subtitle =
    personalityCopy?.subtitle ??
    clampText(
      /yüksek|orta/i.test(risk)
        ? 'Güven kırılgan, görünür takip fayda sağlar.'
        : 'Küçük aksiyon fark yaratabilir.',
      72,
    );

  return {
    id: `feed-district-${normalizeLine(name)}`,
    type: 'districtWatch',
    title,
    subtitle,
    sourceLabel: 'Mahalle',
    tone: /yüksek/i.test(risk) ? 'warning' : 'neutral',
    iconKey: iconForTone(/yüksek/i.test(risk) ? 'warning' : 'neutral', 'districtWatch'),
    districtName: name,
    routeKey: districtFocus.cta.route,
    actionKey: districtFocus.cta.actionKey,
    priority: 78,
    dedupeKey: `districtWatch:${normalizeLine(name)}`,
  };
}

function buildAdvisorFeedItem(
  advisor: CenterAdvisorMiniDirectivePresentation,
): MiniCityFeedItem | null {
  if (advisor.visibility !== 'visible' || !advisor.directive.trim()) return null;

  const directive = advisor.directive.trim();
  const title = directive.startsWith('Ece:') ? directive : `Ece: ${directive}`;
  const route = advisor.cta.route;
  const actionKey = advisor.cta.actionKey;

  if (!route && actionKey === 'none') {
    return {
      id: 'feed-advisor-hint',
      type: 'advisorHint',
      title: clampText(title, 72) ?? title,
      sourceLabel: advisor.advisorName || 'Ece',
      tone: 'neutral',
      iconKey: iconForTone('neutral', 'advisorHint'),
      priority: 52,
      dedupeKey: `advisor:${normalizeLine(directive)}`,
    };
  }

  return {
    id: 'feed-advisor-hint',
    type: 'advisorHint',
    title: clampText(title, 72) ?? title,
    sourceLabel: advisor.advisorName || 'Ece',
    tone: 'neutral',
    iconKey: iconForTone('neutral', 'advisorHint'),
    routeKey: route,
    actionKey,
    priority: 52,
    dedupeKey: `advisor:${normalizeLine(directive)}`,
  };
}

function buildDailyGoalFeedItem(presentation: CenterHomeCoreSections): MiniCityFeedItem | null {
  const { activeTarget } = presentation;
  if (activeTarget.visibility === 'hidden' || activeTarget.status === 'completed') {
    return null;
  }

  const looksLikeDailyGoal =
    /günün|gunun|günlük|gunluk|hedef/i.test(activeTarget.categoryLabel ?? '') ||
    /günün|gunun|günlük|gunluk|hedef/i.test(activeTarget.title) ||
    activeTarget.sourceLabel === 'dailyGoal';

  if (!looksLikeDailyGoal && activeTarget.priority !== 'urgent') return null;

  const focusLine = activeTarget.description?.trim() || activeTarget.title?.trim();
  if (!focusLine) return null;

  const normalizedFocus = focusLine.replace(/^günün odağı:\s*/i, '').trim();
  const title = normalizedFocus.toLowerCase().startsWith('günün odağı')
    ? clampText(focusLine, 64) ?? focusLine
    : `Günün odağı: ${clampText(normalizedFocus, 48) ?? normalizedFocus}.`;

  const subtitle = clampText(
    activeTarget.helperText ?? 'Öncelikli operasyon güveni toparlamaya bağlı.',
    72,
  );

  return {
    id: `feed-daily-${activeTarget.id}`,
    type: 'dailyGoal',
    title,
    subtitle,
    sourceLabel: 'Gün Planı',
    tone: activeTarget.priority === 'urgent' ? 'active' : 'mixed',
    iconKey: iconForTone('active', 'dailyGoal'),
    routeKey: activeTarget.cta.route,
    actionKey: activeTarget.cta.actionKey,
    priority: 48,
    dedupeKey: `dailyGoal:${activeTarget.id}`,
  };
}

function buildMaintenanceFeedItem(
  signal: MaintenanceHubSignal | null | undefined,
  day: number,
): MiniCityFeedItem | null {
  if (!signal || day <= 1) return null;

  const tone: MiniCityFeedItemTone =
    signal.tone === 'critical'
      ? 'critical'
      : signal.tone === 'warning'
        ? 'warning'
        : signal.tone === 'positive'
          ? 'positive'
          : 'mixed';

  return {
    id: `feed-maintenance-${signal.dedupeKey}`,
    type: 'fieldUpdate',
    title: clampText(signal.title, 64) ?? signal.title,
    subtitle: clampText(signal.subtitle, 72),
    sourceLabel: 'Hazırlık Sinyali',
    tone,
    iconKey: iconForTone(tone, 'fieldUpdate'),
    priority: tone === 'critical' ? 72 : tone === 'warning' ? 58 : 44,
    dedupeKey: signal.dedupeKey,
  };
}

function buildEmptyFallback(day: number): MiniCityFeedItem {
  if (day <= 1) {
    return {
      id: 'feed-fallback-day1',
      type: 'fieldUpdate',
      title: 'Şehir akışı sakin izleniyor.',
      subtitle: 'Yeni saha sinyalleri geldikçe burada görünecek.',
      sourceLabel: 'Merkez',
      tone: 'neutral',
      iconKey: 'ellipse-outline',
      priority: 0,
      dedupeKey: 'fallback:day1',
    };
  }

  return {
    id: 'feed-fallback-calm',
    type: 'fieldUpdate',
    title: 'Şehir sakin izleniyor.',
    subtitle: 'Sosyal nabız ve saha sinyalleri izleniyor.',
    sourceLabel: 'Merkez',
    tone: 'neutral',
    iconKey: 'ellipse-outline',
    priority: 0,
    dedupeKey: 'fallback:calm',
  };
}

export function collectMiniCityFeedExcludeLines(input: BuildMiniCityFeedInput): string[] {
  const { presentation, recentImpactSummary, advisorMiniDirective, strategicPulse, neighborhoodEvents } =
    input;

  const lines = [
    recentImpactSummary.targetTitle,
    recentImpactSummary.compactSummary,
    recentImpactSummary.subtitle,
    recentImpactSummary.socialLine,
    recentImpactSummary.advisorLine,
    recentImpactSummary.footerLine,
    advisorMiniDirective.directive,
    strategicPulse.compact.liveSignalLabel,
    strategicPulse.compact.advisorHint,
    presentation.advisorSuggestion.recommendation,
    presentation.activeTarget.title,
    presentation.activeTarget.description,
    presentation.recommendedPlan.body,
    presentation.citySummary.primaryInsight?.text,
    presentation.operationSignals.summaryLine,
    input.maintenanceHubSignal?.title,
    input.maintenanceHubSignal?.subtitle,
  ];

  neighborhoodEvents.events.forEach((event) => {
    lines.push(event.title, event.valueLabel, event.locationLabel);
  });

  return lines.filter((line): line is string => Boolean(line?.trim()));
}

export function dedupeMiniCityFeedItems(
  candidates: MiniCityFeedItem[],
  excludeLines: string[],
): MiniCityFeedItem[] {
  const selected: MiniCityFeedItem[] = [];
  const seenDedupeKeys = new Set<string>();
  const seenEventIds = new Set<string>();
  const districtCounts = new Map<string, number>();

  const sorted = [...candidates].sort((left, right) => right.priority - left.priority);

  for (const item of sorted) {
    if (selected.length >= MAX_FEED_ITEMS) break;
    if (seenDedupeKeys.has(item.dedupeKey)) continue;

    if (item.eventId && seenEventIds.has(item.eventId)) continue;

    const districtKey = normalizeLine(item.districtName);
    if (districtKey) {
      const count = districtCounts.get(districtKey) ?? 0;
      if (count >= MAX_ITEMS_PER_DISTRICT) continue;
    }

    const duplicatesHero = excludeLines.some(
      (line) =>
        linesAreDuplicate(item.title, line) ||
        linesAreDuplicate(item.subtitle, line) ||
        (item.subtitle ? linesAreDuplicate(item.title, line) : false),
    );
    if (duplicatesHero) continue;

    const duplicatesSelected = selected.some(
      (existing) =>
        linesAreDuplicate(existing.title, item.title) ||
        linesAreDuplicate(existing.subtitle, item.subtitle) ||
        linesAreDuplicate(existing.title, item.subtitle),
    );
    if (duplicatesSelected) continue;

    selected.push(item);
    seenDedupeKeys.add(item.dedupeKey);
    if (item.eventId) seenEventIds.add(item.eventId);
    if (districtKey) districtCounts.set(districtKey, (districtCounts.get(districtKey) ?? 0) + 1);
  }

  return selected;
}

export function buildMiniCityFeedItems(input: BuildMiniCityFeedInput): MiniCityFeedItem[] {
  const day = resolveDay(input.presentation);
  const candidates = [
    buildMaintenanceFeedItem(input.maintenanceHubSignal, day),
    buildFieldUpdateFeedItem(input.presentation),
    buildRecentImpactFeedItem(input.recentImpactSummary, day),
    buildSocialPulseFeedItem(input.presentation, input.districtFocus, day),
    buildDistrictWatchFeedItem(input.districtFocus, day),
    buildAdvisorFeedItem(input.advisorMiniDirective),
    buildDailyGoalFeedItem(input.presentation),
  ].filter((item): item is MiniCityFeedItem => item !== null);

  return dedupeMiniCityFeedItems(candidates, collectMiniCityFeedExcludeLines(input));
}

export function buildMiniCityFeedPresentation(input: BuildMiniCityFeedInput): MiniCityFeedPresentation {
  const day = resolveDay(input.presentation);
  const items = buildMiniCityFeedItems(input);
  const emptyFallback = buildEmptyFallback(day);
  const displayItems = items.length > 0 ? items : [emptyFallback];

  return {
    visibility: 'visible',
    title: 'Şehir Akışı',
    subtitle:
      day <= 1
        ? 'Sahadan ve mahallelerden kısa sinyaller'
        : 'Son kararların şehirdeki kısa yankıları',
    statusPill: items.length > 0 ? `${items.length} sinyal` : 'Canlı',
    items: displayItems.slice(0, MAX_FEED_ITEMS),
    emptyFallback: items.length === 0 ? emptyFallback : undefined,
  };
}
