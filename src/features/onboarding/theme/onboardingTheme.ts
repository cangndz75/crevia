import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

/** Onboarding ekranları için premium mavi/lavender tema — legacy alias */
export const onboardingTheme = {
  bg: onboardingTokens.background,
  bgSoft: onboardingTokens.backgroundGradientEnd,
  primary: onboardingTokens.primary,
  primaryDark: onboardingTokens.primaryDark,
  primaryMuted: 'rgba(169,156,255,0.22)',
  navy: onboardingTokens.textMain,
  textMuted: onboardingTokens.textMuted,
  glass: onboardingTokens.card,
  glassBorder: onboardingTokens.border,
  success: onboardingTokens.success,
  successMuted: onboardingTokens.successMuted,
  warning: '#F59E0B',
  warningMuted: onboardingTokens.warningMuted,
  danger: onboardingTokens.dangerSoft,
  dangerMuted: '#FFE8E4',
  purple: onboardingTokens.primaryDark,
  purpleMuted: 'rgba(169,156,255,0.2)',
} as const;
