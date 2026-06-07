import {
  CreviaOnboardingScreen,
  type CreviaOnboardingScreenProps,
  type OnboardingFinishPayload,
} from '@/features/onboarding/screens/CreviaOnboardingScreen';

type OnboardingScreenProps = {
  onComplete: (payload: OnboardingFinishPayload) => void | Promise<void>;
};

/** @deprecated Use `CreviaOnboardingScreen` — geriye uyumluluk alias'ı */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return <CreviaOnboardingScreen onFinish={onComplete} />;
}

export type { CreviaOnboardingScreenProps };
