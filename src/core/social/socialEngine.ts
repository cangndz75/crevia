import { SOCIAL_DAILY_DRIFT, SOCIAL_NEIGHBORHOOD_IDS } from './socialConstants';
import {
  calculateGlobalSocialPulseScore,
  clampSocialValue,
  recomputeSocialPulseAggregates,
} from './socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialPulseState,
  SocialRiskLevel,
  SocialTopic,
  SocialTopicType,
} from './socialTypes';

type SeverityGainMap = Record<SocialRiskLevel, number>;

const COMPLAINT_CRISIS_TOPIC_TYPES: readonly SocialTopicType[] = [
  'complaint_wave',
  'service_delay',
  'crisis_pressure',
  'environmental_concern',
] as const;

function getTopicSeverityGain(
  severity: SocialRiskLevel,
  gainMap: SeverityGainMap,
): number {
  return gainMap[severity];
}

function halfGain(value: number): number {
  return Math.max(1, Math.round(value / 2));
}

function hasActiveTopicType(
  topics: SocialTopic[],
  neighborhoodId: string,
  types: readonly SocialTopicType[],
): boolean {
  return topics.some(
    (topic) =>
      topic.neighborhoodId === neighborhoodId && types.includes(topic.type),
  );
}

function removeExpiredTopics(
  activeTopics: SocialTopic[],
  day: number,
): SocialTopic[] {
  return activeTopics.filter(
    (topic) => topic.expiresDay == null || topic.expiresDay > day,
  );
}

function clampProfileMetrics(
  profile: NeighborhoodSocialProfile,
): NeighborhoodSocialProfile {
  return {
    ...profile,
    trust: clampSocialValue(profile.trust),
    complaintHeat: clampSocialValue(profile.complaintHeat),
    misinformation: clampSocialValue(profile.misinformation),
    gratitude: clampSocialValue(profile.gratitude),
    crisisSpread: clampSocialValue(profile.crisisSpread),
    mediaAttention: clampSocialValue(profile.mediaAttention),
    fatigue: clampSocialValue(profile.fatigue),
  };
}

function applyTopicDriftToProfile(
  profile: NeighborhoodSocialProfile,
  neighborhoodTopics: SocialTopic[],
): NeighborhoodSocialProfile {
  let next = { ...profile };

  for (const topic of neighborhoodTopics) {
    const complaintGain = getTopicSeverityGain(
      topic.severity,
      SOCIAL_DAILY_DRIFT.topicComplaintHeatGain,
    );
    const crisisGain = getTopicSeverityGain(
      topic.severity,
      SOCIAL_DAILY_DRIFT.topicCrisisSpreadGain,
    );
    const mediaGain = getTopicSeverityGain(
      topic.severity,
      SOCIAL_DAILY_DRIFT.topicMediaAttentionGain,
    );
    const misinfoGain = getTopicSeverityGain(
      topic.severity,
      SOCIAL_DAILY_DRIFT.topicMisinformationGain,
    );

    switch (topic.type) {
      case 'complaint_wave':
      case 'service_delay':
        next.complaintHeat += complaintGain;
        next.mediaAttention += halfGain(mediaGain);
        break;
      case 'misinformation':
        next.misinformation += misinfoGain;
        next.trust -= getTopicSeverityGain(
          topic.severity,
          SOCIAL_DAILY_DRIFT.misinformationTrustLoss,
        );
        break;
      case 'crisis_pressure':
        next.crisisSpread += crisisGain;
        next.mediaAttention += mediaGain;
        next.complaintHeat += halfGain(complaintGain);
        break;
      case 'gratitude_wave':
        next.gratitude += getTopicSeverityGain(
          topic.severity,
          SOCIAL_DAILY_DRIFT.gratitudeWaveGain,
        );
        next.trust += getTopicSeverityGain(
          topic.severity,
          SOCIAL_DAILY_DRIFT.gratitudeWaveTrustGain,
        );
        break;
      case 'environmental_concern':
        next.complaintHeat += complaintGain;
        next.crisisSpread += halfGain(crisisGain);
        break;
      case 'public_question':
        next.mediaAttention += halfGain(mediaGain);
        next.misinformation += topic.severity === 'low' ? 1 : 2;
        break;
      default:
        break;
    }
  }

  return next;
}

function applyNaturalSocialDrift(
  profile: NeighborhoodSocialProfile,
  neighborhoodTopics: SocialTopic[],
): NeighborhoodSocialProfile {
  const drift = SOCIAL_DAILY_DRIFT;
  const neighborhoodId = profile.neighborhoodId;

  let next = { ...profile };

  next.gratitude -= drift.gratitudeDecay;
  next.mediaAttention -= drift.mediaAttentionDecay;
  next.crisisSpread -= drift.crisisSpreadDecay;

  if (
    !hasActiveTopicType(neighborhoodTopics, neighborhoodId, ['misinformation'])
  ) {
    next.misinformation -= drift.misinformationDecay;
  }

  if (
    !hasActiveTopicType(
      neighborhoodTopics,
      neighborhoodId,
      COMPLAINT_CRISIS_TOPIC_TYPES,
    )
  ) {
    next.complaintHeat -= drift.complaintHeatDecay;
  }

  if (next.complaintHeat >= 65) {
    next.trust -= drift.trustLossHighComplaint;
  } else if (next.complaintHeat <= 30 && next.crisisSpread <= 25) {
    next.trust += drift.trustRecoveryLowComplaint;
  }

  if (next.complaintHeat >= 65 || next.crisisSpread >= 60) {
    next.fatigue += drift.fatigueGainHighComplaint;
  } else {
    next.fatigue -= drift.fatigueRecovery;
  }

  return next;
}

function syncNeighborhoodTopicIds(
  profile: NeighborhoodSocialProfile,
  activeTopics: SocialTopic[],
): NeighborhoodSocialProfile {
  const topicIds = activeTopics
    .filter((topic) => topic.neighborhoodId === profile.neighborhoodId)
    .map((topic) => topic.id);

  return {
    ...profile,
    activeTopicIds: topicIds,
  };
}

/**
 * Gün sonu sosyal drift — aynı gün tekrar çağrılırsa state değişmez (idempotent).
 */
export function processSocialPulseEndOfDay(
  state: SocialPulseState,
  day: number,
): SocialPulseState {
  const resolvedDay = Math.max(1, day);

  if (state.lastProcessedDay >= resolvedDay) {
    return state;
  }

  const activeTopics = removeExpiredTopics(state.activeTopics, resolvedDay);
  const nextNeighborhoods: Record<string, NeighborhoodSocialProfile> = {};

  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const base = state.neighborhoods[id];
    if (!base) {
      continue;
    }

    const neighborhoodTopics = activeTopics.filter(
      (topic) => topic.neighborhoodId === id,
    );

    let profile: NeighborhoodSocialProfile = { ...base };
    profile = applyTopicDriftToProfile(profile, neighborhoodTopics);
    profile = applyNaturalSocialDrift(profile, neighborhoodTopics);
    profile = clampProfileMetrics(profile);
    profile = syncNeighborhoodTopicIds(profile, activeTopics);
    profile = {
      ...profile,
      lastUpdatedDay: resolvedDay,
    };

    nextNeighborhoods[id] = profile;
  }

  const drifted: SocialPulseState = {
    ...state,
    neighborhoods: nextNeighborhoods,
    activeTopics,
    mentionFeed: state.mentionFeed,
    outcomeHistory: state.outcomeHistory,
    lastProcessedDay: resolvedDay,
    globalPulseScore: state.globalPulseScore,
    globalRiskLevel: state.globalRiskLevel,
  };

  return recomputeSocialPulseAggregates(drifted);
}

/** Verify / debug — drift sonrası özet satırları. */
export function buildSocialDailyDriftSummaryLines(
  before: SocialPulseState,
  after: SocialPulseState,
): string[] {
  const scoreBefore = calculateGlobalSocialPulseScore(before);
  const scoreAfter = calculateGlobalSocialPulseScore(after);
  return [
    `Gün ${after.lastProcessedDay}: nabız ${scoreBefore} → ${scoreAfter}`,
    `Aktif konu: ${before.activeTopics.length} → ${after.activeTopics.length}`,
  ];
}
