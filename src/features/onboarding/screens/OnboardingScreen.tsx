import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import {
  CreviaOnboardingScreen,
  type CreviaOnboardingScreenProps,
} from '@/features/onboarding/screens/CreviaOnboardingScreen';

type OnboardingScreenProps = {
  onComplete: (districtId: PilotDistrictId) => void | Promise<void>;
};

/** @deprecated Use `CreviaOnboardingScreen` — geriye uyumluluk alias'ı */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return <CreviaOnboardingScreen onFinish={onComplete} />;
}

export type { CreviaOnboardingScreenProps };
