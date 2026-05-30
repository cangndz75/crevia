export type AnimationDurationKey = 'fast' | 'normal' | 'slow';

export type AnimationScaleKey = 'press' | 'pop' | 'subtle';

export type AnimationDistanceKey = 'small' | 'medium' | 'entrance';

export type AnimationEasingKey = 'standard' | 'soft' | 'springLike';

export type AnimationPresetKey =
  | 'pressScale'
  | 'cardEntrance'
  | 'softPop'
  | 'selectedPulse'
  | 'stepTransition';

export type AnimationHookOptions = {
  /** Animasyonları kapatır; final state döner. */
  reduceMotion?: boolean;
};

export type EntranceAnimationOptions = AnimationHookOptions & {
  /** Mount gecikmesi (ms). Liste öğelerinde toplu delay kullanma. */
  delay?: number;
};

export type PulseAnimationOptions = AnimationHookOptions & {
  /** Sonsuz döngü yerine sınırlı tekrar (varsayılan: 2). */
  repeatCount?: number;
};
