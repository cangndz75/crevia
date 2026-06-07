import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';
import {
  EVENT_DECISIONS,
  REGION_CARDS,
  ROADMAP_DAYS,
  type EventDecisionImpact,
} from '@/features/onboarding/data/onboardingData';

export type OnboardingRoadmapPreview = {
  districtId: PilotDistrictId;
  districtTitle: string;
  districtShortLabel: string;
  decisionId: OnboardingStarterDecisionId;
  decisionTitle: string;
  decisionBadge: string;
  impacts: EventDecisionImpact[];
  headline: string;
  statusLine: string;
  noteLine: string;
  butterflyTeaser: string;
  ringProgress: number;
  ringTone: 'green' | 'blue' | 'orange';
  stats: {
    icon: 'pulse-outline' | 'heart-outline' | 'shield-outline' | 'wallet-outline';
    label: string;
    value: string;
    positive?: boolean;
  }[];
};

const DECISION_COPY: Record<
  OnboardingStarterDecisionId,
  Pick<OnboardingRoadmapPreview, 'statusLine' | 'noteLine' | 'butterflyTeaser' | 'ringProgress' | 'ringTone'>
> = {
  fast: {
    statusLine: 'Hızlı müdahale ile başlıyorsun',
    noteLine: 'İlk gün güven artışı yüksek; ekip temposunu gün 3’ten itibaren izle.',
    butterflyTeaser: 'Gün 6: Hızlı kararların ekip yorgunluğu etkisi belirginleşebilir.',
    ringProgress: 0.78,
    ringTone: 'green',
  },
  planned: {
    statusLine: 'Planlı çözüm ile başlıyorsun',
    noteLine: 'Kaynaklar korunur; ertelenen konular gün 2–3’te tekrar görünebilir.',
    butterflyTeaser: 'Gün 6: Bekletilen sorunlar şikayet olarak geri dönebilir.',
    ringProgress: 0.58,
    ringTone: 'blue',
  },
  partial: {
    statusLine: 'Dengeli müdahale ile başlıyorsun',
    noteLine: 'Sosyal baskı yatışır; saha sorununun tam kapanması biraz sürebilir.',
    butterflyTeaser: 'Gün 6: Kısmi çözümün izleri operasyon dengesinde kalır.',
    ringProgress: 0.66,
    ringTone: 'orange',
  },
};

function resolveDistrictTitle(districtId: PilotDistrictId): string {
  return REGION_CARDS.find((r) => r.id === districtId)?.title ?? 'Pilot Bölge';
}

function resolveDistrictShortLabel(districtId: PilotDistrictId): string {
  switch (districtId) {
    case 'central':
      return 'Merkez';
    case 'cumhuriyet':
      return 'Cumhuriyet';
    case 'industrial_market':
      return 'Sanayi & Pazar';
    default:
      return 'Pilot';
  }
}

function resolveDecision(decisionId: OnboardingStarterDecisionId) {
  return (
    EVENT_DECISIONS.find((d) => d.id === decisionId) ?? EVENT_DECISIONS[0]!
  );
}

export function buildOnboardingRoadmapPreview(
  districtId: PilotDistrictId,
  decisionId: OnboardingStarterDecisionId,
): OnboardingRoadmapPreview {
  const decision = resolveDecision(decisionId);
  const copy = DECISION_COPY[decisionId];
  const districtTitle = resolveDistrictTitle(districtId);
  const districtShortLabel = resolveDistrictShortLabel(districtId);

  const trust = decision.impacts.find((i) => i.label === 'Güven');
  const risk = decision.impacts.find((i) => i.label === 'Risk');
  const budget = decision.impacts.find((i) => i.label === 'Bütçe');

  return {
    districtId,
    districtTitle,
    districtShortLabel,
    decisionId,
    decisionTitle: decision.title,
    decisionBadge: decision.badge,
    impacts: decision.impacts,
    headline: 'Pilot başlangıç özeti',
    statusLine: copy.statusLine,
    noteLine: copy.noteLine,
    butterflyTeaser: copy.butterflyTeaser,
    ringProgress: copy.ringProgress,
    ringTone: copy.ringTone,
    stats: [
      {
        icon: 'heart-outline',
        label: 'İlk gün güven',
        value: trust?.value ?? '+0',
        positive: trust?.positive,
      },
      {
        icon: 'shield-outline',
        label: 'Risk etkisi',
        value: risk?.value ?? '0',
        positive: risk?.positive,
      },
      {
        icon: 'wallet-outline',
        label: 'Bütçe',
        value: budget?.value ?? '0',
      },
    ],
  };
}

export function buildRoadmapStepSubtitle(
  districtId: PilotDistrictId,
  decisionId: OnboardingStarterDecisionId,
): string {
  const preview = buildOnboardingRoadmapPreview(districtId, decisionId);
  return `${preview.districtShortLabel} · ${preview.decisionTitle} — 7 günlük pilot yolculuğun hazır.`;
}

export { ROADMAP_DAYS };
