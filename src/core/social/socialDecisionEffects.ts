import {
  SOCIAL_DECISION_ACTION_PRIORITY,
  SOCIAL_DECISION_EFFECTS,
  SOCIAL_DECISION_KEYWORDS,
  SOCIAL_EVENT_RELEVANCE_KEYWORDS,
  SOCIAL_NEIGHBORHOOD_ALIASES,
  SOCIAL_NEIGHBORHOOD_IDS,
  SOCIAL_OUTCOME_HISTORY_MAX,
  SOCIAL_OUTCOME_TITLES,
  type SocialNeighborhoodId,
} from './socialConstants';
import {
  calculateNeighborhoodSocialScore,
  clampSocialValue,
  recomputeSocialPulseAggregates,
} from './socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialDecisionAction,
  SocialDecisionChoiceInput,
  SocialDecisionEffectInput,
  SocialDecisionEffectResult,
  SocialDecisionEventInput,
  SocialOutcomeHistory,
  SocialPulseState,
  SocialProfileMetricDeltas,
  SocialRiskLevel,
  SocialTopic,
} from './socialTypes';

const SEVERITY_RANK: Record<SocialRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const DEFAULT_NEIGHBORHOOD: SocialNeighborhoodId = 'merkez';

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeText(...parts: Array<unknown>): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (typeof part === 'number' && Number.isFinite(part)) {
        return String(part);
      }
      return '';
    })
    .filter((part) => part.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function buildEventHaystack(event?: SocialDecisionEventInput): string {
  if (!event) {
    return '';
  }
  return normalizeText(
    event.id,
    event.title,
    event.description,
    event.category,
    event.neighborhoodId,
    event.district,
    event.eventType,
    ...(event.districtIds ?? []),
    ...(event.tags ?? []),
  );
}

function buildDecisionHaystack(decision: SocialDecisionChoiceInput): string {
  return normalizeText(
    decision.id,
    decision.title,
    decision.label,
    decision.description,
    decision.shortText,
    decision.effectText,
    decision.neighborhoodId,
    decision.targetNeighborhoodId,
    ...(decision.tags ?? []),
  );
}

function buildCombinedHaystack(
  event: SocialDecisionEventInput | undefined,
  decision: SocialDecisionChoiceInput,
): string {
  return `${buildEventHaystack(event)} ${buildDecisionHaystack(decision)}`.trim();
}

export function isSocialRelevantEvent(event?: SocialDecisionEventInput): boolean {
  const haystack = buildEventHaystack(event);
  if (!haystack) {
    return false;
  }
  return includesAny(haystack, SOCIAL_EVENT_RELEVANCE_KEYWORDS);
}

function isSocialRelevantDecision(decision: SocialDecisionChoiceInput): boolean {
  const haystack = buildDecisionHaystack(decision);
  return SOCIAL_DECISION_ACTION_PRIORITY.some((action) =>
    includesAny(haystack, SOCIAL_DECISION_KEYWORDS[action]),
  );
}

function classifyFromKeywords(haystack: string): SocialDecisionAction | null {
  for (const action of SOCIAL_DECISION_ACTION_PRIORITY) {
    if (includesAny(haystack, SOCIAL_DECISION_KEYWORDS[action])) {
      return action;
    }
  }
  return null;
}

export function inferSocialDecisionAction(
  event: SocialDecisionEventInput | undefined,
  decision: SocialDecisionChoiceInput,
): SocialDecisionAction {
  const haystack = buildCombinedHaystack(event, decision);
  const fromKeywords = classifyFromKeywords(haystack);
  if (fromKeywords) {
    if (
      !isSocialRelevantEvent(event) &&
      !isSocialRelevantDecision(decision) &&
      fromKeywords !== 'stay_silent'
    ) {
      return 'none';
    }
    return fromKeywords;
  }

  if (!isSocialRelevantEvent(event) && !isSocialRelevantDecision(decision)) {
    return 'none';
  }

  return 'none';
}

export function normalizeSocialNeighborhoodId(
  value: string | undefined | null,
): SocialNeighborhoodId | null {
  if (value == null || value === '') {
    return null;
  }
  if ((SOCIAL_NEIGHBORHOOD_IDS as readonly string[]).includes(value)) {
    return value as SocialNeighborhoodId;
  }
  const key = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return SOCIAL_NEIGHBORHOOD_ALIASES[key] ?? null;
}

function pickHighestSeverityTopic(
  topics: SocialTopic[],
): SocialTopic | null {
  if (topics.length === 0) {
    return null;
  }
  return topics.reduce((best, topic) =>
    SEVERITY_RANK[topic.severity] > SEVERITY_RANK[best.severity] ? topic : best,
  );
}

export function resolveSocialTargetNeighborhoodId(
  event: SocialDecisionEventInput | undefined,
  decision: SocialDecisionChoiceInput,
  state: SocialPulseState,
): SocialNeighborhoodId {
  const fromEvent =
    normalizeSocialNeighborhoodId(stringField(event?.neighborhoodId)) ??
    normalizeSocialNeighborhoodId(stringField(event?.district)) ??
    event?.districtIds
      ?.map((id) => normalizeSocialNeighborhoodId(id))
      .find((id): id is SocialNeighborhoodId => id != null);

  if (fromEvent) {
    return fromEvent;
  }

  const fromDecision =
    normalizeSocialNeighborhoodId(stringField(decision.targetNeighborhoodId)) ??
    normalizeSocialNeighborhoodId(stringField(decision.neighborhoodId));

  if (fromDecision) {
    return fromDecision;
  }

  const topic = pickHighestSeverityTopic(state.activeTopics);
  if (topic) {
    const fromTopic = normalizeSocialNeighborhoodId(topic.neighborhoodId);
    if (fromTopic) {
      return fromTopic;
    }
  }

  return DEFAULT_NEIGHBORHOOD;
}

function applyMetricDeltas(
  profile: NeighborhoodSocialProfile,
  deltas: SocialProfileMetricDeltas,
): NeighborhoodSocialProfile {
  const apply = (current: number, delta: number | undefined) =>
    delta == null ? current : clampSocialValue(current + delta);

  return {
    ...profile,
    trust: apply(profile.trust, deltas.trust),
    complaintHeat: apply(profile.complaintHeat, deltas.complaintHeat),
    misinformation: apply(profile.misinformation, deltas.misinformation),
    gratitude: apply(profile.gratitude, deltas.gratitude),
    crisisSpread: apply(profile.crisisSpread, deltas.crisisSpread),
    mediaAttention: apply(profile.mediaAttention, deltas.mediaAttention),
    fatigue: apply(profile.fatigue, deltas.fatigue),
  };
}

function ensureProfile(
  state: SocialPulseState,
  neighborhoodId: SocialNeighborhoodId,
  day: number,
): NeighborhoodSocialProfile {
  const existing = state.neighborhoods[neighborhoodId];
  if (existing) {
    return { ...existing, activeTopicIds: [...existing.activeTopicIds] };
  }

  const { createInitialSocialPulseState } =
    require('./socialSeed') as typeof import('./socialSeed');
  const seed = createInitialSocialPulseState(day);
  const fallback = seed.neighborhoods[neighborhoodId];
  if (fallback) {
    return { ...fallback, activeTopicIds: [...fallback.activeTopicIds] };
  }

  return {
    neighborhoodId,
    trust: 50,
    complaintHeat: 30,
    misinformation: 20,
    gratitude: 35,
    crisisSpread: 25,
    mediaAttention: 30,
    fatigue: 25,
    activeTopicIds: [],
    lastUpdatedDay: day,
  };
}

function buildOutcomeEntry(params: {
  action: Exclude<SocialDecisionAction, 'none'>;
  pulseDelta: number;
  day: number;
  neighborhoodId: SocialNeighborhoodId;
  decisionId?: string;
  outcomeId?: string;
}): SocialOutcomeHistory {
  const descriptions: Record<Exclude<SocialDecisionAction, 'none'>, string> = {
    communicate: 'Halka açıklama ve bilgilendirme yapıldı.',
    dispatch_team: 'Saha ekibi yönlendirildi.',
    stay_silent: 'Resmi açıklama yapılmadı.',
    permanent_solution: 'Kalıcı çözüm süreci başlatıldı.',
    monitor: 'Sosyal nabız izlemeye alındı.',
  };

  return {
    id:
      params.outcomeId ??
      `social-outcome-${params.day}-${params.action}-${params.decisionId ?? 'decision'}`,
    title: SOCIAL_OUTCOME_TITLES[params.action],
    description: descriptions[params.action],
    pulseDelta: params.pulseDelta,
    createdDay: params.day,
    neighborhoodId: params.neighborhoodId,
  };
}

export function applySocialDecisionEffect(
  state: SocialPulseState,
  input: SocialDecisionEffectInput,
): SocialDecisionEffectResult {
  const day = Math.max(1, input.day);
  const action =
    input.forcedAction ?? inferSocialDecisionAction(input.event, input.decision);
  const targetNeighborhoodId = resolveSocialTargetNeighborhoodId(
    input.event,
    input.decision,
    state,
  );

  if (action === 'none') {
    const unchanged = recomputeSocialPulseAggregates({
      ...state,
      activeTopics: [...state.activeTopics],
      mentionFeed: [...state.mentionFeed],
      outcomeHistory: [...state.outcomeHistory],
      neighborhoods: { ...state.neighborhoods },
    });
    return {
      state: unchanged,
      action,
      targetNeighborhoodId,
      pulseDelta: 0,
      summaryLine: 'Sosyal etki yok',
    };
  }

  const profile = ensureProfile(state, targetNeighborhoodId, day);
  const scoreBefore = calculateNeighborhoodSocialScore(profile);
  const deltas = SOCIAL_DECISION_EFFECTS[action];
  const updatedProfile = applyMetricDeltas(profile, deltas);
  updatedProfile.lastUpdatedDay = day;

  const scoreAfter = calculateNeighborhoodSocialScore(updatedProfile);
  const pulseDelta = scoreAfter - scoreBefore;

  const outcome = buildOutcomeEntry({
    action,
    pulseDelta,
    day,
    neighborhoodId: targetNeighborhoodId,
    decisionId: input.decision.id,
    outcomeId: input.outcomeId,
  });

  const nextState = recomputeSocialPulseAggregates({
    ...state,
    neighborhoods: {
      ...state.neighborhoods,
      [targetNeighborhoodId]: updatedProfile,
    },
    activeTopics: [...state.activeTopics],
    mentionFeed: [...state.mentionFeed],
    outcomeHistory: [outcome, ...state.outcomeHistory].slice(
      0,
      SOCIAL_OUTCOME_HISTORY_MAX,
    ),
  });

  return {
    state: nextState,
    action,
    targetNeighborhoodId,
    pulseDelta,
    summaryLine: `${SOCIAL_OUTCOME_TITLES[action]} (${pulseDelta >= 0 ? '+' : ''}${pulseDelta} Nabız)`,
  };
}
