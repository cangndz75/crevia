import { normalizeSocialPulseState } from '@/core/social/socialIntegration';
import type {
  SocialOutcomeHistory,
  SocialPulseState,
  SocialTopicType,
} from '@/core/social/socialTypes';
import { buildHotSocialTopicFromState } from '@/features/social/utils/socialUiMappers';

export type BuildDailySocialSummaryOptions = {
  day?: number;
  /** Gün başı / kapanış öncesi skor — delta satırı için. */
  previousSocialPulseState?: SocialPulseState | null;
};

function locativePhrase(neighborhood: string): string {
  const trimmed = neighborhood.trim();
  if (!trimmed) {
    return 'Bölgede';
  }
  if (trimmed.endsWith('yon')) {
    return `${trimmed}'da`;
  }
  if (trimmed.endsWith('t')) {
    return `${trimmed}'te`;
  }
  return `${trimmed}'de`;
}

function safeScore(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function buildGlobalStatusLine(score: number): string {
  if (score >= 70) {
    return 'Sosyal Nabız güvenli seviyede.';
  }
  if (score >= 50) {
    return 'Sosyal Nabız dengede kaldı.';
  }
  if (score >= 30) {
    return 'Sosyal baskı bazı mahallelerde arttı.';
  }
  return 'Kamuoyu baskısı kritik seviyeye çıktı.';
}

function buildGlobalLine(
  scoreAfter: number,
  scoreBefore?: number,
): string {
  if (
    scoreBefore != null &&
    Number.isFinite(scoreBefore) &&
    scoreBefore !== scoreAfter
  ) {
    if (scoreAfter > scoreBefore) {
      return `Sosyal Nabız ${scoreBefore} → ${scoreAfter} seviyesine çıktı.`;
    }
    return `Sosyal Nabız ${scoreBefore} → ${scoreAfter} seviyesine indi.`;
  }
  return buildGlobalStatusLine(scoreAfter);
}

function pickTodaySocialOutcome(
  state: SocialPulseState,
  day: number,
): SocialOutcomeHistory | null {
  const history = Array.isArray(state.outcomeHistory)
    ? state.outcomeHistory
    : [];
  const today = history.filter((entry) => entry?.createdDay === day);
  if (today.length === 0) {
    return null;
  }
  const quickAction = today.find((entry) =>
    entry.id.startsWith('social-action-'),
  );
  return quickAction ?? today[0] ?? null;
}

function formatPulseDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

function buildOutcomeReportLine(outcome: SocialOutcomeHistory): string {
  const delta = safeScore(outcome.pulseDelta, 0);

  switch (outcome.title) {
    case 'Açıklama Yapıldı':
      return delta !== 0
        ? `Açıklama Yapıldı: sosyal nabız ${formatPulseDelta(delta)}.`
        : 'Açıklama hamlesi yanlış bilgi riskini azalttı.';
    case 'Ekip Yönlendirildi':
      return 'Ekip Yönlendirildi: kriz yayılımı kontrol altına alındı.';
    case 'Sessiz Kalındı':
      return 'Sessiz Kalındı: sosyal risk artabilir.';
    case 'Kalıcı Çözüm Başlatıldı':
      return delta !== 0
        ? `Kalıcı Çözüm Başlatıldı: sosyal nabız ${formatPulseDelta(delta)}.`
        : 'Kalıcı çözüm süreci sosyal nabzı destekledi.';
    case 'Sosyal Takip Yapıldı':
      return 'Sosyal takip modunda nabız izleniyor.';
    default:
      return delta !== 0
        ? `${outcome.title}: sosyal nabız ${formatPulseDelta(delta)}.`
        : outcome.title;
  }
}

function topicReportLine(
  topicType: SocialTopicType | undefined,
  neighborhood: string,
): string | null {
  if (!topicType) {
    return null;
  }
  const where = locativePhrase(neighborhood);

  switch (topicType) {
    case 'crisis_pressure':
      return `${where} kriz baskısı gündemde.`;
    case 'misinformation':
      return `${where} söylenti riski izleniyor.`;
    case 'complaint_wave':
      return `${where} şikayet dalgası sürüyor.`;
    case 'gratitude_wave':
      return `${where} olumlu geri bildirim arttı.`;
    case 'service_delay':
      return `${where} hizmet gecikmesi gündemde.`;
    case 'environmental_concern':
      return `${where} çevre hassasiyeti izleniyor.`;
    case 'public_question':
      return `${where} bilgi talebi yoğun.`;
    default:
      return `${where} sosyal gündem aktif.`;
  }
}

function buildTopicLine(state: SocialPulseState, day: number): string | null {
  const hotTopic = buildHotSocialTopicFromState(state, day);
  if (hotTopic.isMockFallback || !hotTopic.topicType) {
    return null;
  }
  return topicReportLine(
    hotTopic.topicType as SocialTopicType | undefined,
    hotTopic.neighborhood,
  );
}

/**
 * Gün sonu raporu için en fazla 2 satırlık sosyal özet.
 * Canlı store yerine endDay snapshot state ile çağrılmalıdır.
 */
export function buildDailySocialSummaryLines(
  socialPulseState: SocialPulseState | null | undefined,
  options?: BuildDailySocialSummaryOptions,
): string[] {
  if (socialPulseState == null) {
    return [];
  }

  const day = Math.max(1, options?.day ?? socialPulseState.lastProcessedDay ?? 1);
  const state = normalizeSocialPulseState(socialPulseState, day);
  const scoreAfter = safeScore(state.globalPulseScore, 50);
  const scoreBefore =
    options?.previousSocialPulseState != null
      ? safeScore(
          normalizeSocialPulseState(options.previousSocialPulseState, day)
            .globalPulseScore,
          scoreAfter,
        )
      : undefined;

  const lines: string[] = [buildGlobalLine(scoreAfter, scoreBefore)];

  const todayOutcome = pickTodaySocialOutcome(state, day);
  if (todayOutcome) {
    lines.push(buildOutcomeReportLine(todayOutcome));
  } else {
    const topicLine = buildTopicLine(state, day);
    if (topicLine) {
      lines.push(topicLine);
    }
  }

  return lines.slice(0, 2);
}
