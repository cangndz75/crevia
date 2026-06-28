import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  TuningControlDefinition,
  TuningControlTone,
  TuningLevel,
} from '@/features/events/utils/eventPlanTuningPresentation';

type TuningSegmentedControlProps = {
  control: TuningControlDefinition;
  value: TuningLevel;
  reducedMotion?: boolean;
  onChange: (value: TuningLevel) => void;
};

const TONE_SELECTED: Record<TuningControlTone, { bg: string; text: string }> = {
  teal: { bg: eventDetail.teal, text: '#FFFFFF' },
  purple: { bg: '#7856B4', text: '#FFFFFF' },
  amber: { bg: '#D9A646', text: '#FFFFFF' },
};

export function TuningSegmentedControl({
  control,
  value,
  reducedMotion = false,
  onChange,
}: TuningSegmentedControlProps) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {control.options.map((option) => (
        <Segment
          key={option.value}
          label={option.label}
          selected={value === option.value}
          tone={control.tone}
          reducedMotion={reducedMotion}
          onPress={() => onChange(option.value)}
          accessibilityLabel={`${control.title} ${option.label}${value === option.value ? ' seçili' : ''}`}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  selected,
  tone,
  reducedMotion,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  tone: TuningControlTone;
  reducedMotion: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);
  const selectedColors = TONE_SELECTED[tone];

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withTiming(selected ? 1 : 0.98, { duration: 160 });
  }, [reducedMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={styles.segmentHit}>
      <Animated.View
        style={[
          styles.segment,
          selected
            ? { backgroundColor: selectedColors.bg }
            : styles.segmentUnselected,
          animatedStyle,
        ]}>
        <Text
          style={[
            styles.segmentText,
            selected ? { color: selectedColors.text } : styles.segmentTextMuted,
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(107, 125, 120, 0.10)',
    borderRadius: 12,
    padding: 3,
    minWidth: 168,
    flexShrink: 0,
  },
  segmentHit: {
    flex: 1,
    minHeight: 40,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentUnselected: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  segmentTextMuted: {
    color: eventDetail.textMuted,
  },
});
