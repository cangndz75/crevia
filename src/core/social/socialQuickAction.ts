import { normalizeSocialPulseState } from './socialIntegration';
import { applySocialDecisionEffect } from './socialDecisionEffects';
import { isSocialRiskLevel } from './socialSelectors';
import type {
  ApplySocialQuickActionInput,
  ApplySocialQuickActionResult,
  SocialDecisionEventInput,
  SocialPulseState,
  SocialQuickActionType,
  SocialTopic,
} from './socialTypes';

const MOCK_TOPIC_KEY = 'mock-crisis';

const QUICK_ACTION_COPY: Record<
  SocialQuickActionType,
  { title: string; description: string; feedback: string }
> = {
  communicate: {
    title: 'Açıklama Yap',
    description: 'Halkı bilgilendir ve yanlış bilgiyi azalt.',
    feedback: 'Açıklama yayımlandı. Yanlış bilgi baskısı azaldı.',
  },
  dispatch_team: {
    title: 'Ekip Yönlendir',
    description: 'Sahaya ekip yönlendir ve krizi kontrol altına al.',
    feedback: 'Ekip yönlendirildi. Kriz yayılımı kontrol altına alındı.',
  },
  stay_silent: {
    title: 'Sessiz Kal',
    description: 'Şimdilik açıklama yapmadan bekle.',
    feedback: 'Sessiz kalındı. Sosyal risk artabilir.',
  },
  monitor: {
    title: 'Takip Et',
    description: 'Sosyal gündemi izle ve raporla.',
    feedback: 'Sosyal gündem izlemeye alındı.',
  },
  permanent_solution: {
    title: 'Kalıcı Çözüm',
    description: 'Uzun vadeli çözüm başlat.',
    feedback: 'Kalıcı çözüm süreci başlatıldı.',
  },
};

export function buildSocialQuickActionOutcomeId(
  topicKey: string,
  action: SocialQuickActionType,
  day: number,
): string {
  return `social-action-${topicKey}-${action}-${day}`;
}

/** Aynı gündem (topicKey) + gün için tek quick action — action türünden bağımsız. */
export function hasSocialQuickActionLock(
  state: SocialPulseState,
  topicKey: string,
  day: number,
): boolean {
  const prefix = `social-action-${topicKey}-`;
  const suffix = `-${day}`;
  return (state.outcomeHistory ?? []).some(
    (entry) =>
      typeof entry.id === 'string' &&
      entry.id.startsWith(prefix) &&
      entry.id.endsWith(suffix),
  );
}

function resolveTopicKey(topicId: string | undefined): string {
  return topicId && topicId.length > 0 ? topicId : MOCK_TOPIC_KEY;
}

function findTopic(
  state: SocialPulseState,
  topicId: string | undefined,
): SocialTopic | null {
  if (!topicId) {
    return null;
  }
  return (
    (state.activeTopics ?? []).find((topic) => topic?.id === topicId) ?? null
  );
}

function buildTopicEventDescription(topic: SocialTopic): string {
  const severity = isSocialRiskLevel(topic.severity) ? topic.severity : 'medium';
  const intensity =
    typeof topic.intensity === 'number' && Number.isFinite(topic.intensity)
      ? Math.round(topic.intensity)
      : 0;
  return `${topic.type} · ${severity} · yoğunluk ${intensity}`;
}

function buildQuickActionEvent(
  topic: SocialTopic | null,
  topicKey: string,
): SocialDecisionEventInput {
  if (topic) {
    return {
      id: `social-topic-${topic.id}`,
      title: topic.title,
      description: buildTopicEventDescription(topic),
      neighborhoodId: topic.neighborhoodId,
      category: 'social',
      tags: ['sosyal', 'kriz', topic.type],
    };
  }

  return {
    id: `social-topic-${topicKey}`,
    title: 'Merkez Mahallesi Su Tahliyesi Sorunu',
    description:
      'Yoğun yağış sonrası sosyal medya şikayetleri artıyor. crisis_pressure · high yoğunluk',
    neighborhoodId: 'merkez',
    category: 'social',
    tags: ['sosyal', 'kriz', 'şikayet'],
  };
}

export function applySocialQuickAction(
  state: SocialPulseState | null | undefined,
  input: ApplySocialQuickActionInput,
): ApplySocialQuickActionResult {
  const day = Math.max(1, input.day ?? 1);
  const copy = QUICK_ACTION_COPY[input.action];
  const topicKey = resolveTopicKey(input.topicId);

  let normalized: SocialPulseState;
  try {
    normalized = normalizeSocialPulseState(state ?? {}, day);
  } catch {
    return {
      success: false,
      blocked: false,
      message: 'Sosyal nabız güncellenemedi.',
      state: normalizeSocialPulseState({}, day),
    };
  }

  if (hasSocialQuickActionLock(normalized, topicKey, day)) {
    return {
      success: false,
      blocked: true,
      message: 'Bugün bu gündem için aksiyon alındı.',
      state: normalized,
    };
  }

  const topic = findTopic(normalized, input.topicId);
  const event = buildQuickActionEvent(topic, topicKey);
  const neighborhoodId = topic?.neighborhoodId ?? 'merkez';
  const outcomeId = buildSocialQuickActionOutcomeId(
    topicKey,
    input.action,
    day,
  );

  try {
    const effect = applySocialDecisionEffect(normalized, {
      event,
      decision: {
        id: `social-quick-${input.action}`,
        title: copy.title,
        description: copy.description,
        neighborhoodId,
      },
      day,
      forcedAction: input.action,
      outcomeId,
    });

    return {
      success: true,
      blocked: false,
      message: copy.feedback,
      state: effect.state,
      action: effect.action,
    };
  } catch {
    return {
      success: false,
      blocked: false,
      message: 'Sosyal nabız güncellenemedi.',
      state: normalized,
    };
  }
}
