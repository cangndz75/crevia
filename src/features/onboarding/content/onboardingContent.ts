/** @deprecated Import from `@/features/onboarding/data/onboardingData` */
export {
  ONBOARDING_STEPS,
  WELCOME_PILLS as WELCOME_TAGS,
  WELCOME_METRICS as WELCOME_FLOATING_METRICS,
  WELCOME_CHARACTERS,
  REGION_CARDS as REGION_OPTIONS,
  TUTORIAL_EVENT,
  EVENT_DECISIONS as TUTORIAL_DECISION_OPTIONS,
  ROADMAP_DAYS,
} from '@/features/onboarding/data/onboardingData';

export type {
  OnboardingStepId,
  OnboardingStepMeta as OnboardingStep,
  FloatingMetricData as FloatingMetric,
  RegionCardData as RegionOption,
  EventDecisionOption as TutorialDecisionOption,
} from '@/features/onboarding/data/onboardingData';

export const ADVISOR = {
  name: 'Deniz Erdem',
  role: 'Saha Şefi',
  initials: 'DE',
} as const;

export const PLAYER_START_ROLE = 'Temizlik ve Çevre Operasyon Sorumlusu';

export const OFFLINE_COPY = {
  title: 'Bağlantı Gerekli',
  body: 'Crevia şehir operasyon verilerini senkronize etmek için internet bağlantısına ihtiyaç duyar. Bağlantını kontrol edip tekrar dene.',
  retryLabel: 'Tekrar Dene',
} as const;
