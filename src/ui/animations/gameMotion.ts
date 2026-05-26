import { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

export const duration = {
  fast: 200,
  normal: 320,
  slow: 480,
  reveal: 600,
} as const;

export const springConfig = {
  gentle: { damping: 20, stiffness: 180 },
  snappy: { damping: 15, stiffness: 300 },
  soft: { damping: 24, stiffness: 140 },
} as const;

export function staggerDelay(index: number, base = 60) {
  return index * base;
}

export const entering = {
  fadeInUp: (delay = 0) =>
    FadeInUp.delay(delay).duration(duration.normal).springify().damping(20),
  fadeInDown: (delay = 0) =>
    FadeInDown.delay(delay).duration(duration.normal).springify().damping(20),
  fadeIn: (delay = 0) =>
    FadeIn.delay(delay).duration(duration.normal),
  scaleIn: (delay = 0) =>
    ZoomIn.delay(delay).duration(duration.normal).springify().damping(18),
  cardReveal: (index: number) =>
    FadeInUp.delay(staggerDelay(index)).duration(duration.normal).springify().damping(22),
  heroReveal: () =>
    FadeIn.duration(duration.reveal),
} as const;
