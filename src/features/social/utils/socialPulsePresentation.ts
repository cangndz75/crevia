import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation';
import { buildHubCarryOverMemory } from '@/core/carryOver/carryOverMemoryPresentation';
import type { CarryOverMemoryInput } from '@/core/carryOver/carryOverMemoryTypes';
import {
  buildCityEchoBinding,
  buildCityEchoSocialLine,
} from '@/core/cityEchoBinding';
import { buildRewardComebackSocialPresentation } from '@/core/rewardComeback';
import {
  buildDistrictEventContextLine,
  getDistrictIdentity,
  normalizeMapDistrictId,
  resolveDistrictAccentColor,
} from '@/core/districts/districtIdentityPresentation';
import { buildDistrictLiveBehaviorSignal } from '@/core/districtPersonality';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import {
  buildSocialDecisionEcho,
  buildSocialEchoContextFromPulseArgs,
} from '@/core/socialEcho/socialEchoPresentation';
import type { SocialDecisionEchoModel } from '@/core/socialEcho/socialEchoTypes';
import {
  getIconForDistrict,
  getIconForSocialMentionType,
} from '@/core/presentation/creviaIconPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';

import { buildSocialPulseUiBundle } from './socialUiMappers';
import type {
  HotSocialTopic,
  LiveMention,
  LiveMentionCategory,
  NeighborhoodSocialRisk,
  SocialDecisionAction,
  SocialOutcomeItem,
  SocialPulseSummary,
} from './socialUiModel';
import type { SocialPulseState } from '@/core/social/socialTypes';

export const SOCIAL_PULSE_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

export const SOCIAL_PULSE_LAYOUT_GUARDS = {
  headerSummaryNumberOfLines: 2,
  hotTopicTitleNumberOfLines: 2,
  hotTopicContextNumberOfLines: 1,
  mentionTextNumberOfLines: 2,
  maxNeighborhoodStripItems: 5,
  maxLiveMentions: 3,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;

export const SOCIAL_PULSE_TIP_LINE =
  'Sosyal nabız, yarınki operasyon baskısını etkileyebilir.';

export const SOCIAL_PULSE_EMPTY_MENTIONS =
  'Bugün sakin bir sosyal akış var.';

export const SOCIAL_PULSE_POST_PILOT_CONTEXT =
  'Pilot sonrası gündem halk algısında izleniyor.';

export type SocialPulseHeaderTone = 'calm' | 'watching' | 'warning' | 'critical';

export type SocialPulseHeaderModel = {
  title: string;
  subtitle: string;
  statusLabel: string;
  summary: string;
  score: number;
  maxScore: number;
  tone: SocialPulseHeaderTone;
};

export type NeighborhoodSensitivityItem = {
  districtId: MapDistrictId | string;
  title: string;
  statusLabel: string;
  iconKey: string;
  accentColor: string;
  score: number;
};

export type HotSocialTopicPresentation = {
  title: string;
  badge: string;
  remainingTime: string;
  districtLabel: string;
  contextLine?: string;
  tone: SocialPulseHeaderTone;
  tonePillLabel: string;
  actions: SocialDecisionAction[];
  topicId?: string;
  isMockFallback?: boolean;
};

export type LiveMentionCardModel = {
  id: string;
  authorLabel: string;
  districtLabel: string;
  timeAgo: string;
  typeLabel: string;
  category: LiveMentionCategory;
  iconRegistryKey: string;
  text: string;
  likes: number;
  comments: number;
};

export type LiveMentionsSectionModel = {
  title: string;
  items: LiveMentionCardModel[];
  showEmptyState: boolean;
  emptyMessage: string;
  showViewAll: boolean;
  activeCountLabel?: string;
};

export type LastDecisionSocialEchoModel = {
  title: string;
  summary: string;
};

export type SocialPulseScreenViewModel = {
  header: SocialPulseHeaderModel;
  neighborhoods: NeighborhoodSensitivityItem[];
  hotTopic: HotSocialTopicPresentation;
  mentions: LiveMentionsSectionModel;
  decisionEcho: SocialDecisionEchoModel | null;
  postPilotContextLine?: string;
  tipLine: string;
  isCompact: boolean;
  showOutcomeHistory: boolean;
};

export const MENTION_TEXT_PRESENTATION_MAX = 120;

function truncateMentionText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MENTION_TEXT_PRESENTATION_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, MENTION_TEXT_PRESENTATION_MAX - 1).trimEnd()}…`;
}

const MENTION_TYPE_LABELS: Record<LiveMentionCategory, string> = {
  complaint: 'Şikayet',
  praise: 'Takdir',
  rumor: 'Söylenti',
  opportunity: 'Bilgilendirme',
  crisis: 'Şikayet',
  question: 'Bilgilendirme',
  neutral: 'Bilgilendirme',
};

function safeScore(value: unknown, fallback = 50): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function headerToneFromScore(score: number): SocialPulseHeaderTone {
  if (score >= 70) {
    return 'calm';
  }
  if (score >= 50) {
    return 'calm';
  }
  if (score >= 30) {
    return 'watching';
  }
  if (score >= 15) {
    return 'warning';
  }
  return 'critical';
}

function headerStatusLabel(score: number): string {
  if (score >= 70) {
    return 'Güvenli';
  }
  if (score >= 50) {
    return 'Denge korunuyor';
  }
  if (score >= 30) {
    return 'Dikkat';
  }
  return 'Yükselen Tepki';
}

function headerSummaryFromScore(score: number): string {
  if (score >= 70) {
    return 'Vatandaş geri bildirimi güven verici seyrediyor.';
  }
  if (score >= 50) {
    return 'Vatandaş geri bildirimi kontrol altında ilerliyor.';
  }
  if (score >= 30) {
    return 'Bazı mahallelerde sosyal nabız hassaslaşıyor.';
  }
  return 'Halk algısında baskı yükseliyor; hızlı iletişim önemli.';
}

function neighborhoodStatusLabel(item: NeighborhoodSocialRisk): string {
  const trend = item.trend ?? [];
  const improving =
    trend.length >= 2 && trend[trend.length - 1]! > trend[0]! + 2;

  if (improving && item.riskLevel !== 'critical') {
    return 'Toparlanıyor';
  }
  if (item.riskLevel === 'low') {
    return 'Sakin';
  }
  if (item.riskLevel === 'medium') {
    return 'İzleniyor';
  }
  return 'Yoğun tepki';
}

function hotTopicTone(topic: HotSocialTopic): SocialPulseHeaderTone {
  if (topic.severity === 'critical') {
    return 'critical';
  }
  if (topic.severity === 'high') {
    return 'warning';
  }
  if (topic.visualTone === 'gratitude') {
    return 'calm';
  }
  if (topic.visualTone === 'misinformation' || topic.visualTone === 'crisis') {
    return 'warning';
  }
  return 'watching';
}

function hotTopicTonePill(tone: SocialPulseHeaderTone): string {
  switch (tone) {
    case 'calm':
      return 'Sakin gündem';
    case 'watching':
      return 'İzleniyor';
    case 'warning':
      return 'Dikkat';
    case 'critical':
      return 'Yoğun tepki';
    default:
      return 'Gündemde';
  }
}

function resolveDistrictIdFromHotTopic(topic: HotSocialTopic): MapDistrictId | null {
  if (topic.neighborhoodId) {
    const id = normalizeMapDistrictId(topic.neighborhoodId);
    if (id) {
      return id;
    }
  }
  return normalizeMapDistrictId(topic.neighborhood);
}

function findNeighborhoodRisk(
  id: string,
  items: NeighborhoodSocialRisk[],
): NeighborhoodSocialRisk | undefined {
  return items.find((item) => item.id === id);
}

export function buildSocialPulseHeaderModel(
  summary: SocialPulseSummary | null | undefined,
  options?: { isCompact?: boolean },
): SocialPulseHeaderModel {
  const score = safeScore(summary?.score, 50);
  const tone = headerToneFromScore(score);
  const statusLabel = summary?.statusLabel
    ? mapLegacyStatusToDisplay(summary.statusLabel, score)
    : headerStatusLabel(score);

  const summaryLine =
    summary?.description?.trim() || headerSummaryFromScore(score);

  return {
    title: 'Sosyal Nabız',
    subtitle: options?.isCompact ? 'Halk Algısı' : 'Halk Algısı',
    statusLabel,
    summary: summaryLine,
    score,
    maxScore: safeScore(summary?.maxScore, 100) || 100,
    tone,
  };
}

function mapLegacyStatusToDisplay(legacy: string, score: number): string {
  const lower = legacy.toLowerCase();
  if (lower.includes('güven') && score >= 65) {
    return 'Güvenli';
  }
  if (lower.includes('deng')) {
    return 'Denge korunuyor';
  }
  if (lower.includes('hassas') || lower.includes('kriz')) {
    return score < 30 ? 'Yükselen Tepki' : 'Dikkat';
  }
  return headerStatusLabel(score);
}

export function buildNeighborhoodSocialSensitivityStrip(
  neighborhoods: NeighborhoodSocialRisk[] | null | undefined,
  options?: { postPilotPhase?: PostPilotPhase | null },
): NeighborhoodSensitivityItem[] {
  const source = Array.isArray(neighborhoods) ? neighborhoods : [];
  const items: NeighborhoodSensitivityItem[] = MAP_DISTRICT_IDENTITY_IDS.map(
    (districtId) => {
      const risk = findNeighborhoodRisk(districtId, source);
      const identity = getDistrictIdentity(districtId);
      const score = safeScore(risk?.score, 50);
      const fallbackRisk: NeighborhoodSocialRisk = {
        id: districtId,
        name: identity.name,
        score,
        riskLevel: 'medium',
        trend: [score, score],
      };
      const resolved = risk ?? fallbackRisk;

      return {
        districtId,
        title: identity.shortLabel || identity.name,
        statusLabel: neighborhoodStatusLabel(resolved),
        iconKey: getIconForDistrict(districtId).key,
        accentColor: resolveDistrictAccentColor(districtId),
        score: safeScore(resolved.score, score),
      };
    },
  ).slice(0, SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems);

  if (options?.postPilotPhase === 'main_operation_light') {
    const istasyonIndex = items.findIndex((item) => item.districtId === 'istasyon');
    if (istasyonIndex > 0) {
      const [istasyon] = items.splice(istasyonIndex, 1);
      items.unshift(istasyon!);
    }
  }

  return items;
}

export function buildHotSocialTopicModel(
  topic: HotSocialTopic | null | undefined,
): HotSocialTopicPresentation {
  const safe = topic ?? {
    id: 'fallback',
    badge: 'Gündemde',
    remainingTime: 'Aktif',
    title: 'Sosyal gündem sakin',
    description: '',
    neighborhood: 'Merkez',
    interactions: '—',
    comments: '—',
    riskChips: [],
    actions: [],
    isMockFallback: true,
  };

  const districtId = resolveDistrictIdFromHotTopic(safe);
  const identityContextLine = districtId
    ? buildDistrictEventContextLine(districtId)
    : undefined;
  const behaviorContextLine = districtId
    ? buildDistrictLiveBehaviorSignal({
        districtId,
        districtName: getDistrictIdentity(districtId).name,
        outcomeBand:
          safe.severity === 'critical' || safe.severity === 'high'
            ? 'warning'
            : 'neutral',
        avoidLines: [identityContextLine ?? '', safe.title ?? ''].filter(Boolean),
      })?.socialPressureLine
    : undefined;
  const contextLine = behaviorContextLine ?? identityContextLine;
  const tone = hotTopicTone(safe);

  return {
    title: safe.title?.trim() || 'Sosyal gündem izleniyor',
    badge: safe.badge || 'Gündemde',
    remainingTime: safe.remainingTime || 'Aktif',
    districtLabel: safe.neighborhood || getDistrictIdentity(districtId).name,
    contextLine,
    tone,
    tonePillLabel: hotTopicTonePill(tone),
    actions: Array.isArray(safe.actions) ? safe.actions.slice(0, 2) : [],
    topicId: safe.topicId,
    isMockFallback: safe.isMockFallback,
  };
}

export function buildLiveMentionCardsModel(
  mentions: LiveMention[] | null | undefined,
  options?: { isCompact?: boolean; maxItems?: number },
): LiveMentionsSectionModel {
  const maxItems =
    options?.maxItems ??
    (options?.isCompact ? 1 : SOCIAL_PULSE_LAYOUT_GUARDS.maxLiveMentions);
  const source = Array.isArray(mentions) ? mentions : [];
  const items = source.slice(0, maxItems).map((mention) => {
    const socialIcon = getIconForSocialMentionType(mention.category);
    return {
      id: mention.id,
      authorLabel: mention.name?.trim() || 'Sakin',
      districtLabel: mention.neighborhood?.trim() || 'Mahalle',
      timeAgo: mention.timeAgo || 'Az önce',
      typeLabel: MENTION_TYPE_LABELS[mention.category] ?? 'Bilgilendirme',
      category: mention.category,
      iconRegistryKey: socialIcon.key,
      text: truncateMentionText(mention.text ?? ''),
      likes: Math.max(0, Math.round(mention.likes ?? 0)),
      comments: Math.max(0, Math.round(mention.comments ?? 0)),
    };
  });

  return {
    title: 'Canlı Geri Bildirim',
    items,
    showEmptyState: source.length === 0,
    emptyMessage: SOCIAL_PULSE_EMPTY_MENTIONS,
    showViewAll: source.length > 0 && !options?.isCompact,
  };
}

export function buildLastDecisionSocialEchoModel(
  lastDecision: DecisionResultSnapshot | null | undefined,
  outcomes: SocialOutcomeItem[] | null | undefined,
): LastDecisionSocialEchoModel | null {
  if (!lastDecision) {
    return null;
  }

  const socialOutcome = lastDecision.subsystemOutcomes?.find(
    (entry) => entry.key === 'social',
  );
  if (socialOutcome?.primaryText?.trim()) {
    return {
      title: 'Son kararın halk algısına etkisi',
      summary: socialOutcome.primaryText.trim(),
    };
  }

  const history = Array.isArray(outcomes) ? outcomes : [];
  const latest = history[0];
  if (!latest?.label) {
    return null;
  }

  const deltaLabel =
    latest.delta === 0
      ? 'Dengeli yankı'
      : `${latest.delta > 0 ? '+' : ''}${latest.delta} nabız`;

  return {
    title: 'Son kararın halk algısına etkisi',
    summary: `${latest.label} · ${deltaLabel}`,
  };
}

export function buildDynamicSocialDecisionEchoModel(
  params: BuildSocialPulseScreenParams,
): SocialDecisionEchoModel | null {
  const currentDay = Math.max(1, params.currentDay ?? 1);
  if (params.isDay1Compact === true || currentDay === 1) {
    return null;
  }

  const carryInput: CarryOverMemoryInput | null =
    params.operationSignals || params.lastDecisionResult
      ? {
          day: currentDay,
          operationSignals: params.operationSignals ?? undefined,
          eventResult: params.lastDecisionResult ?? undefined,
        }
      : null;

  const carryHub = carryInput ? buildHubCarryOverMemory(carryInput) : null;

  const eventDomainFocus = params.lastDecisionResult
    ? buildEventDomainFocusModel({
        day: currentDay,
        event: {
          id: params.lastDecisionResult.eventId,
          title: params.lastDecisionResult.eventTitle,
          neighborhoodId: params.lastDecisionResult.neighborhoodId,
        },
        includeEcho: true,
        resultLike: {
          successLabel: params.lastDecisionResult.summaryTitle,
          tone: params.lastDecisionResult.resultTone,
        },
      })
    : null;

  const context = buildSocialEchoContextFromPulseArgs({
    day: currentDay,
    lastDecisionResult: params.lastDecisionResult ?? undefined,
    eventDomainFocus,
    carryOverMemory: carryHub
      ? {
          summary: carryHub.summary,
          domain: carryHub.domain,
          tone: carryHub.tone,
        }
      : undefined,
    operationSignals: params.operationSignals ?? undefined,
    socialPulseState: params.socialPulseState
      ? { score: params.socialPulseState.globalPulseScore }
      : undefined,
  });

  const echo = buildSocialDecisionEcho(context);
  const packMeta = resolveContentPackMetaForWiring({
    event: params.lastDecisionEvent,
    eventId: params.lastDecisionResult?.eventId,
    districtId: params.lastDecisionResult?.neighborhoodId,
    day: currentDay,
    eventPool: params.eventPool,
  });
  const cityEchoLine = buildCityEchoSocialLine(
    buildCityEchoBinding({
      day: currentDay,
      snapshot: params.lastDecisionResult ?? undefined,
      carryOverSummary: carryHub?.summary,
      event: params.lastDecisionEvent,
      contentPackMeta: packMeta,
      operationSignals: params.operationSignals ?? undefined,
      socialPulse: params.socialPulseState
        ? { globalPulseScore: params.socialPulseState.globalPulseScore }
        : undefined,
      existingLines: [echo?.mention ?? ''].filter(Boolean),
    }),
  );

  const rewardSocial = buildRewardComebackSocialPresentation({
    day: currentDay,
    surface: 'social',
    snapshot: params.lastDecisionResult ?? undefined,
    contentPackMeta: packMeta,
    operationSignals: params.operationSignals ?? undefined,
    existingLines: [echo?.mention ?? '', cityEchoLine ?? ''].filter(Boolean),
  });

  const rewardLine = rewardSocial.socialLine;
  const preferredLine = rewardLine && rewardLine !== echo?.mention ? rewardLine : cityEchoLine;

  if (!echo || !preferredLine) return echo;
  if (preferredLine === echo.mention) return echo;

  return {
    ...echo,
    mention: preferredLine,
    source: rewardLine ? 'event_echo' : 'event_echo',
    debugReason: `${echo.debugReason ?? 'social'}:${rewardLine ? 'reward_comeback' : 'city_echo_binding'}`,
  };
}

export function assertNoSocialPulseForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of SOCIAL_PULSE_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectSocialPulsePresentationStrings(
  model: SocialPulseScreenViewModel,
): string[] {
  return [
    model.header.title,
    model.header.subtitle,
    model.header.statusLabel,
    model.header.summary,
    ...model.neighborhoods.flatMap((n) => [n.title, n.statusLabel]),
    model.hotTopic.title,
    model.hotTopic.badge,
    model.hotTopic.districtLabel,
    model.hotTopic.contextLine ?? '',
    model.hotTopic.tonePillLabel,
    ...model.mentions.items.flatMap((m) => [
      m.authorLabel,
      m.districtLabel,
      m.typeLabel,
      m.text,
    ]),
    model.mentions.emptyMessage,
    model.decisionEcho?.title ?? '',
    model.decisionEcho?.mention ?? '',
    model.postPilotContextLine ?? '',
    model.tipLine,
  ].filter(Boolean);
}

export type BuildSocialPulseScreenParams = {
  socialPulseState?: SocialPulseState | null;
  currentDay?: number;
  postPilotPhase?: PostPilotPhase | null;
  lastDecisionResult?: DecisionResultSnapshot | null;
  lastDecisionEvent?: EventCard | null;
  eventPool?: EventCard[];
  operationSignals?: OperationSignalsState | null;
  isDay1Compact?: boolean;
};

export function buildSocialPulseScreenViewModel(
  params: BuildSocialPulseScreenParams = {},
): SocialPulseScreenViewModel {
  const currentDay = Math.max(1, params.currentDay ?? 1);
  const bundle = buildSocialPulseUiBundle(
    params.socialPulseState,
    currentDay,
  );
  const isCompact = params.isDay1Compact === true;

  const header = buildSocialPulseHeaderModel(bundle.summary, { isCompact });
  const neighborhoods = buildNeighborhoodSocialSensitivityStrip(
    bundle.neighborhoods,
    { postPilotPhase: params.postPilotPhase },
  );
  const hotTopic = buildHotSocialTopicModel(bundle.hotTopic);
  const mentions = buildLiveMentionCardsModel(bundle.mentions, { isCompact });
  const decisionEcho = isCompact ? null : buildDynamicSocialDecisionEchoModel(params);

  const postPilotContextLine =
    params.postPilotPhase === 'main_operation_light'
      ? SOCIAL_PULSE_POST_PILOT_CONTEXT
      : undefined;

  return {
    header,
    neighborhoods,
    hotTopic,
    mentions,
    decisionEcho,
    postPilotContextLine,
    tipLine: SOCIAL_PULSE_TIP_LINE,
    isCompact,
    showOutcomeHistory: !isCompact,
  };
}
