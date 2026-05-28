import {
  getNeighborhoodDisplayName,
  getNeighborhoodSocialChipLabel,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { SOCIAL_NEIGHBORHOOD_IDS } from '@/core/social/socialConstants';
import { normalizeSocialPulseState } from '@/core/social/socialIntegration';
import {
  calculateNeighborhoodSocialScore,
  getSocialRiskLevel,
  isSocialRiskLevel,
} from '@/core/social/socialSelectors';
import type {
  SocialMention,
  SocialMentionType,
  SocialOutcomeHistory,
  SocialPulseState,
  SocialRiskLevel,
  SocialTopic,
  SocialTopicType,
} from '@/core/social/socialTypes';

import {
  MOCK_SOCIAL_PULSE,
  type HotSocialTopic,
  type HotSocialTopicVisualTone,
  type LiveMention,
  type LiveMentionCategory,
  type NeighborhoodSocialRisk,
  type SocialOutcomeIcon,
  type SocialOutcomeItem,
  type SocialPulseSummary,
} from './socialUiModel';

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

const MENTION_UI_CATEGORY: Record<SocialMentionType, LiveMentionCategory> = {
  complaint: 'complaint',
  gratitude: 'praise',
  rumor: 'rumor',
  crisis: 'crisis',
  question: 'question',
  neutral: 'neutral',
};

const MOCK_FALLBACK = {
  summary: MOCK_SOCIAL_PULSE.summary,
  neighborhoods: MOCK_SOCIAL_PULSE.neighborhoods,
  outcomes: MOCK_SOCIAL_PULSE.outcomes,
  mentions: MOCK_SOCIAL_PULSE.mentions,
  activeMentionCount: MOCK_SOCIAL_PULSE.activeMentionCount,
  hotTopic: MOCK_SOCIAL_PULSE.hotTopic,
} as const;

const SEVERITY_RANK: Record<SocialRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const REACH_BY_SEVERITY: Record<SocialRiskLevel, string> = {
  low: '420',
  medium: '1.2K',
  high: '2.8K',
  critical: '4.6K',
};

const COMMENTS_BY_SEVERITY: Record<SocialRiskLevel, string> = {
  low: '84',
  medium: '210',
  high: '642',
  critical: '1.1K',
};

const RISK_CHIP_BY_SEVERITY: Record<
  SocialRiskLevel,
  { label: string; value: string }[]
> = {
  low: [
    { label: 'Risk', value: 'Düşük' },
    { label: 'Yayılma', value: 'Yavaş' },
  ],
  medium: [
    { label: 'Risk', value: 'Orta' },
    { label: 'Yayılma', value: 'Kontrollü' },
  ],
  high: [
    { label: 'Risk', value: 'Yüksek' },
    { label: 'Yayılma', value: 'Hızlı' },
  ],
  critical: [
    { label: 'Risk', value: 'Kritik' },
    { label: 'Yayılma', value: 'Çok Hızlı' },
  ],
};

type TopicCopy = {
  title: (mahalle: string) => string;
  description: string;
  badge: string;
  visualTone: HotSocialTopicVisualTone;
};

const TOPIC_COPY_BY_TYPE: Record<SocialTopicType, TopicCopy> = {
  complaint_wave: {
    title: (m) => `${m} Mahallesi Şikayet Dalgası`,
    description:
      'Kısa sürede artan şikayetler mahalle güvenini baskılıyor.',
    badge: 'Şikayet Dalgası',
    visualTone: 'complaint',
  },
  misinformation: {
    title: (m) => `${m} Mahallesi Yanlış Bilgi Yayılımı`,
    description:
      'Sosyal kanallarda doğrulanmamış bilgiler hızla yayılıyor.',
    badge: 'Söylenti Riski',
    visualTone: 'misinformation',
  },
  gratitude_wave: {
    title: (m) => `${m} Mahallesi Takdir Dalgası`,
    description:
      'Vatandaşlardan gelen olumlu geri bildirimler güveni artırıyor.',
    badge: 'Pozitif Gündem',
    visualTone: 'gratitude',
  },
  crisis_pressure: {
    title: (m) => `${m} Mahallesi Kriz Baskısı`,
    description:
      'Krizle ilgili paylaşımlar hızlanıyor, kamuoyu baskısı artıyor.',
    badge: 'Kriz Alarmı',
    visualTone: 'crisis',
  },
  service_delay: {
    title: (m) => `${m} Mahallesi Hizmet Gecikmesi`,
    description: 'Geciken hizmetler sosyal şikayetleri artırıyor.',
    badge: 'Gecikme Riski',
    visualTone: 'service',
  },
  environmental_concern: {
    title: (m) => `${m} Mahallesi Çevre Hassasiyeti`,
    description:
      'Koku, temizlik ve çevre şikayetleri görünür hale geliyor.',
    badge: 'Çevre Baskısı',
    visualTone: 'environment',
  },
  public_question: {
    title: (m) => `${m} Mahallesi Bilgi Talebi`,
    description: 'Vatandaşlar süreçle ilgili net bilgi bekliyor.',
    badge: 'Bilgi Talebi',
    visualTone: 'question',
  },
};

const ACTIVE_MENTION_COUNT_FLOOR = 240;
const OUTCOME_LABEL_MAX = 42;
const MENTION_TEXT_MAX = 160;

export type SocialPulseUiBundle = {
  summary: SocialPulseSummary;
  neighborhoods: NeighborhoodSocialRisk[];
  outcomes: SocialOutcomeItem[];
  mentions: LiveMention[];
  activeMentionCount: number;
  hotTopic: HotSocialTopic;
};

type ResolvedUiContext = {
  state: SocialPulseState;
  currentDay: number;
};

function safeScore(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function clampPercent(value: unknown, fallback = 0): number {
  return safeScore(value, fallback);
}

function safeTrendDelta(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.round(Math.max(-99, Math.min(99, value)));
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveState(
  state: SocialPulseState | null | undefined,
  currentDay: number,
): SocialPulseState | null {
  if (state == null || typeof state !== 'object') {
    return null;
  }
  try {
    return normalizeSocialPulseState(state, Math.max(1, currentDay));
  } catch {
    return null;
  }
}

function tryResolveContext(
  state: SocialPulseState | null | undefined,
  currentDay: number,
): ResolvedUiContext | null {
  const resolved = resolveState(state, currentDay);
  if (!resolved) {
    return null;
  }
  return { state: resolved, currentDay: Math.max(1, currentDay) };
}

function withMapper<T>(
  state: SocialPulseState | null | undefined,
  currentDay: number,
  build: (ctx: ResolvedUiContext) => T,
  fallback: T,
): T {
  try {
    const ctx = tryResolveContext(state, currentDay);
    if (!ctx) {
      return fallback;
    }
    return build(ctx);
  } catch {
    return fallback;
  }
}

function getMockUiBundle(): SocialPulseUiBundle {
  return {
    summary: { ...MOCK_FALLBACK.summary },
    neighborhoods: [...MOCK_FALLBACK.neighborhoods],
    outcomes: [...MOCK_FALLBACK.outcomes],
    mentions: [...MOCK_FALLBACK.mentions],
    activeMentionCount: MOCK_FALLBACK.activeMentionCount,
    hotTopic: {
      ...MOCK_FALLBACK.hotTopic,
      topicId: 'mock-crisis',
      neighborhoodId: 'merkez',
      isMockFallback: true,
      actions: [...MOCK_FALLBACK.hotTopic.actions],
      riskChips: [...MOCK_FALLBACK.hotTopic.riskChips],
    },
  };
}

function normalizeSeverity(value: unknown): SocialRiskLevel {
  if (isSocialRiskLevel(value)) {
    return value;
  }
  return 'medium';
}

function compareTopics(a: SocialTopic, b: SocialTopic): number {
  const severityDiff =
    SEVERITY_RANK[normalizeSeverity(b.severity)] -
    SEVERITY_RANK[normalizeSeverity(a.severity)];
  if (severityDiff !== 0) {
    return severityDiff;
  }
  const intensityDiff = safeScore(b.intensity) - safeScore(a.intensity);
  if (intensityDiff !== 0) {
    return intensityDiff;
  }
  return safeScore(b.createdDay) - safeScore(a.createdDay);
}

function pickPrimaryActiveTopic(topics: SocialTopic[]): SocialTopic | null {
  if (!Array.isArray(topics) || topics.length === 0) {
    return null;
  }
  const valid = topics.filter(
    (topic) => topic != null && typeof topic === 'object',
  );
  if (valid.length === 0) {
    return null;
  }
  return [...valid].sort(compareTopics)[0] ?? null;
}

function formatTopicRemainingTime(
  topic: SocialTopic,
  currentDay: number,
): string {
  if (typeof topic.expiresDay !== 'number' || !Number.isFinite(topic.expiresDay)) {
    return 'Aktif gündem';
  }
  const remaining = Math.round(topic.expiresDay - currentDay);
  if (remaining <= 0) {
    return 'Bugün kapanıyor';
  }
  if (remaining === 1) {
    return '1 gün kaldı';
  }
  return `${remaining} gün kaldı`;
}

function topicCopyForType(type: string): TopicCopy {
  if (type in TOPIC_COPY_BY_TYPE) {
    return TOPIC_COPY_BY_TYPE[type as SocialTopicType];
  }
  return TOPIC_COPY_BY_TYPE.crisis_pressure;
}

function mapTopicToHotSocialTopic(
  topic: SocialTopic,
  currentDay: number,
): HotSocialTopic {
  const severity = normalizeSeverity(topic.severity);
  const mahalle = neighborhoodLabel(topic.neighborhoodId ?? '');
  const copy = topicCopyForType(topic.type);

  return {
    id: topic.id || `topic-${topic.neighborhoodId}-${topic.type}`,
    topicId: topic.id,
    neighborhoodId: topic.neighborhoodId,
    topicType: topic.type,
    severity,
    isMockFallback: false,
    badge: copy.badge,
    remainingTime: formatTopicRemainingTime(topic, currentDay),
    title: copy.title(mahalle),
    description: copy.description,
    neighborhood: mahalle,
    interactions: REACH_BY_SEVERITY[severity],
    comments: COMMENTS_BY_SEVERITY[severity],
    riskChips: [...RISK_CHIP_BY_SEVERITY[severity]],
    actions: [...MOCK_SOCIAL_PULSE.hotTopic.actions],
    visualTone: copy.visualTone,
  };
}

function buildHotTopicFromResolved(ctx: ResolvedUiContext): HotSocialTopic {
  const topics = ctx.state.activeTopics ?? [];
  const primary = pickPrimaryActiveTopic(topics);
  if (!primary) {
    return getMockUiBundle().hotTopic;
  }
  return mapTopicToHotSocialTopic(primary, ctx.currentDay);
}

function averageTrust(state: SocialPulseState): number {
  const profiles = Object.values(state.neighborhoods);
  if (profiles.length === 0) {
    return safeScore(state.globalPulseScore, MOCK_FALLBACK.summary.score);
  }
  const total = profiles.reduce(
    (sum, profile) => sum + safeScore(profile.trust, 0),
    0,
  );
  return total / profiles.length;
}

function buildWeeklyTrend(score: number): number[] {
  const end = safeScore(score);
  const start = Math.max(0, end - 16);
  return Array.from({ length: 7 }, (_, index) =>
    Math.round(start + ((end - start) * index) / 6),
  );
}

function buildMiniTrend(score: number): number[] {
  const end = safeScore(score);
  const start = Math.max(0, end - 10);
  return Array.from({ length: 5 }, (_, index) =>
    Math.round(start + ((end - start) * index) / 4),
  );
}

/** Skor bandına göre durum — globalRisk override yok (QA freeze). */
function summaryStatus(score: number): {
  statusLabel: string;
  description: string;
} {
  const safe = safeScore(score);
  if (safe >= 70) {
    return {
      statusLabel: 'Güven Yüksek',
      description: 'Topluluğun güveni güçlü seyrediyor.',
    };
  }
  if (safe >= 50) {
    return {
      statusLabel: 'Dengede',
      description: 'Topluluğun nabzı istikrarlı.',
    };
  }
  if (safe >= 30) {
    return {
      statusLabel: 'Hassas',
      description: 'Bazı mahallelerde sosyal baskı artıyor.',
    };
  }
  return {
    statusLabel: 'Kriz Baskısı',
    description: 'Kamuoyu baskısı kritik seviyede.',
  };
}

function trendDeltaFromOutcomes(history: SocialOutcomeHistory[]): number {
  if (!Array.isArray(history) || history.length === 0) {
    return 0;
  }
  const recent = history.slice(0, 2);
  const total = recent.reduce(
    (sum, item) => sum + safeTrendDelta(item.pulseDelta),
    0,
  );
  return safeTrendDelta(total);
}

function formatConversationVolume(state: SocialPulseState): string {
  if (!Array.isArray(state.mentionFeed) || state.mentionFeed.length === 0) {
    return MOCK_FALLBACK.summary.conversationVolume;
  }
  const value =
    state.mentionFeed.reduce(
      (sum, mention) =>
        sum + safeScore(mention.likes, 0) + safeScore(mention.replies, 0),
      0,
    ) + (Array.isArray(state.activeTopics) ? state.activeTopics.length : 0) * 120;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return String(Math.max(0, value));
}

function toUiRiskLevel(
  risk: SocialRiskLevel,
): NeighborhoodSocialRisk['riskLevel'] {
  if (risk === 'critical') {
    return 'critical';
  }
  if (risk === 'high') {
    return 'high';
  }
  if (risk === 'medium') {
    return 'medium';
  }
  return 'low';
}

function outcomeIcon(title: string): SocialOutcomeIcon {
  const lower = title.toLowerCase();
  if (lower.includes('sessiz')) {
    return 'volume-mute-outline';
  }
  if (lower.includes('ekip')) {
    return 'people-outline';
  }
  if (lower.includes('kalıcı')) {
    return 'construct-outline';
  }
  if (lower.includes('takip')) {
    return 'eye-outline';
  }
  return 'megaphone-outline';
}

function formatOutcomeTimeAgo(currentDay: number, createdDay: number): string {
  const diff = Math.max(0, Math.round(currentDay - createdDay));
  if (diff === 0) {
    return 'Bugün';
  }
  if (diff === 1) {
    return '1 gün önce';
  }
  return `${diff} gün önce`;
}

function authorInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'SN';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]![0] ?? '';
    const second = parts[1]![0] ?? '';
    const initials = `${first}${second}`.toUpperCase();
    return initials || 'SN';
  }
  const short = trimmed.slice(0, 2).toUpperCase();
  return short || 'SN';
}

function neighborhoodLabel(neighborhoodId: string): string {
  const normalized = normalizeNeighborhoodId(neighborhoodId);
  if (normalized) {
    return getNeighborhoodDisplayName(normalized);
  }
  const known = NEIGHBORHOOD_LABELS[neighborhoodId];
  if (known) {
    return known;
  }
  const readable = neighborhoodId
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  return readable.length > 0 ? readable : 'Mahalle';
}

function mentionUiCategory(type: string): LiveMentionCategory {
  if (type in MENTION_UI_CATEGORY) {
    return MENTION_UI_CATEGORY[type as SocialMentionType];
  }
  return 'neutral';
}

function buildSummaryFromResolved(ctx: ResolvedUiContext): SocialPulseSummary {
  const score = safeScore(
    ctx.state.globalPulseScore,
    MOCK_FALLBACK.summary.score,
  );
  const { statusLabel, description } = summaryStatus(score);

  return {
    score,
    maxScore: 100,
    statusLabel,
    description,
    trendDelta: trendDeltaFromOutcomes(ctx.state.outcomeHistory ?? []),
    conversationVolume: formatConversationVolume(ctx.state),
    satisfactionPercent: clampPercent(
      averageTrust(ctx.state),
      MOCK_FALLBACK.summary.satisfactionPercent,
    ),
    weeklyTrend: buildWeeklyTrend(score),
  };
}

function buildNeighborhoodsFromResolved(
  ctx: ResolvedUiContext,
): NeighborhoodSocialRisk[] {
  const items: NeighborhoodSocialRisk[] = [];
  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const profile = ctx.state.neighborhoods[id];
    if (!profile) {
      continue;
    }
    const score = calculateNeighborhoodSocialScore(profile);
    const safe = safeScore(score);
    items.push({
      id,
      name: neighborhoodLabel(id),
      score: safe,
      riskLevel: toUiRiskLevel(getSocialRiskLevel(safe)),
      trend: buildMiniTrend(safe),
      identityTagline: getNeighborhoodSocialChipLabel(id),
    });
  }
  return items.length > 0 ? items : [...MOCK_FALLBACK.neighborhoods];
}

function buildOutcomesFromResolved(ctx: ResolvedUiContext): SocialOutcomeItem[] {
  const history = ctx.state.outcomeHistory ?? [];
  if (history.length === 0) {
    return [...MOCK_FALLBACK.outcomes];
  }

  return history.map((item) => ({
    id: item.id || `outcome-${item.createdDay}`,
    label: truncateText(item.title || 'Sosyal Karar', OUTCOME_LABEL_MAX),
    delta: safeTrendDelta(item.pulseDelta),
    timeAgo: formatOutcomeTimeAgo(ctx.currentDay, item.createdDay),
    icon: outcomeIcon(item.title ?? ''),
  }));
}

function mapMention(mention: SocialMention): LiveMention {
  const minuteOffset = safeScore(mention.minuteOffset, 0);
  const timeAgo = minuteOffset > 0 ? `${minuteOffset} dk` : 'Az önce';
  const authorName = mention.authorName?.trim() || 'Sakin';

  return {
    id: mention.id || `mention-${mention.createdDay}-${minuteOffset}`,
    avatarInitials: authorInitials(authorName),
    name: authorName,
    neighborhood: neighborhoodLabel(mention.neighborhoodId),
    timeAgo,
    category: mentionUiCategory(mention.type),
    text: truncateText(mention.message || '', MENTION_TEXT_MAX),
    likes: safeScore(mention.likes, 0),
    comments: safeScore(mention.replies, 0),
  };
}

function buildMentionsFromResolved(ctx: ResolvedUiContext): LiveMention[] {
  const feed = ctx.state.mentionFeed ?? [];
  if (feed.length === 0) {
    return [...MOCK_FALLBACK.mentions];
  }
  return feed.map(mapMention);
}

function buildActiveMentionCountFromResolved(ctx: ResolvedUiContext): number {
  const feed = ctx.state.mentionFeed ?? [];
  if (feed.length === 0) {
    return MOCK_FALLBACK.activeMentionCount;
  }

  const engagement = feed.reduce(
    (sum, mention) =>
      sum + safeScore(mention.likes, 0) + safeScore(mention.replies, 0),
    0,
  );
  const derived = Math.max(engagement, feed.length * 40);
  return Math.max(derived, ACTIVE_MENTION_COUNT_FLOOR);
}

/** Tek normalize — ekran bu bundle’ı kullanmalı. */
export function buildSocialPulseUiBundle(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): SocialPulseUiBundle {
  try {
    const ctx = tryResolveContext(state, currentDay);
    if (!ctx) {
      return getMockUiBundle();
    }
    return {
      summary: buildSummaryFromResolved(ctx),
      neighborhoods: buildNeighborhoodsFromResolved(ctx),
      outcomes: buildOutcomesFromResolved(ctx),
      mentions: buildMentionsFromResolved(ctx),
      activeMentionCount: buildActiveMentionCountFromResolved(ctx),
      hotTopic: buildHotTopicFromResolved(ctx),
    };
  } catch {
    return getMockUiBundle();
  }
}

export function buildSocialPulseSummaryFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): SocialPulseSummary {
  return withMapper(
    state,
    currentDay,
    buildSummaryFromResolved,
    { ...MOCK_FALLBACK.summary },
  );
}

export function buildNeighborhoodRiskItemsFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): NeighborhoodSocialRisk[] {
  return withMapper(
    state,
    currentDay,
    buildNeighborhoodsFromResolved,
    [...MOCK_FALLBACK.neighborhoods],
  );
}

export function buildOutcomeHistoryFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): SocialOutcomeItem[] {
  return withMapper(
    state,
    currentDay,
    buildOutcomesFromResolved,
    [...MOCK_FALLBACK.outcomes],
  );
}

export function buildMentionFeedFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): LiveMention[] {
  return withMapper(
    state,
    currentDay,
    buildMentionsFromResolved,
    [...MOCK_FALLBACK.mentions],
  );
}

export function buildActiveMentionCountFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): number {
  return withMapper(
    state,
    currentDay,
    buildActiveMentionCountFromResolved,
    MOCK_FALLBACK.activeMentionCount,
  );
}

export function buildHotSocialTopicFromState(
  state: SocialPulseState | null | undefined,
  currentDay = 1,
): HotSocialTopic {
  return withMapper(
    state,
    currentDay,
    buildHotTopicFromResolved,
    getMockUiBundle().hotTopic,
  );
}
