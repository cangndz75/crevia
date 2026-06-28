import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type {
  MapBubbleMotionCue,
  MapJournalMotionCue,
} from '@/core/mapReactionsMotion/mapReactionMotionTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  journalCue?: MapJournalMotionCue;
  bubbleCue?: MapBubbleMotionCue;
  reducedMotionMode?: boolean;
  bottomOffset?: number;
};

function FlashHint({
  label,
  animate,
  tone,
  accessibilityLabel,
}: {
  label: string;
  animate: boolean;
  tone: 'journal' | 'social';
  accessibilityLabel: string;
}) {
  const opacity = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.92 : 1);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = 1;
      scale.value = 1;
      return;
    }

    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(0.85, { duration: 520 }),
      withTiming(0, { duration: 280 }),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1.02, { duration: 520 }),
      withTiming(0.98, { duration: 280 }),
    );
  }, [animate, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const palette =
    tone === 'journal'
      ? { bg: mapUi.mint, border: 'rgba(15, 143, 134, 0.2)', text: mapUi.teal }
      : { bg: '#F0F4FA', border: 'rgba(123, 159, 212, 0.35)', text: '#5A7BA8' };

  return (
    <Animated.View
      style={[
        styles.hint,
        shadows.soft,
        { backgroundColor: palette.bg, borderColor: palette.border },
        animatedStyle,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}>
      <Text style={[styles.hintText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

export function MapReactionMotionHints({
  journalCue,
  bubbleCue,
  reducedMotionMode = false,
  bottomOffset = 12,
}: Props) {
  if (!journalCue && !bubbleCue) return null;

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="none">
      {journalCue ? (
        <FlashHint
          label={journalCue.hintLine}
          animate={journalCue.shouldAnimate && !reducedMotionMode}
          tone="journal"
          accessibilityLabel={journalCue.accessibilityLabel}
        />
      ) : null}
      {bubbleCue ? (
        <FlashHint
          label={bubbleCue.shortLine}
          animate={bubbleCue.shouldAnimate && !reducedMotionMode}
          tone="social"
          accessibilityLabel={bubbleCue.accessibilityLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    gap: 6,
    alignItems: 'flex-start',
    zIndex: 4,
  },
  hint: {
    maxWidth: '88%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
});
