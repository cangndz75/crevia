import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';
import { useCreviaPressMotion } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

import { planBriefingStyles } from './planBriefingStyles';

type RecommendedPlanPreviewCardProps = {
  recommendedPlan: EventPlanBriefingPresentation['recommendedPlan'];
  reducedMotion?: boolean;
  onPress?: () => void;
};

export function RecommendedPlanPreviewCard({
  recommendedPlan,
  reducedMotion = false,
  onPress,
}: RecommendedPlanPreviewCardProps) {
  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardTranslateY = useSharedValue(reducedMotion ? 0 : 16);
  const arrowOpacity = useSharedValue(reducedMotion ? 1 : 0);

  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useCreviaPressMotion({
    reducedMotion,
    pressScale: 0.98,
  });

  const {
    animatedStyle: arrowPressStyle,
    onPressIn: arrowPressIn,
    onPressOut: arrowPressOut,
  } = useCreviaPressMotion({
    reducedMotion,
    pressScale: 0.96,
  });

  useEffect(() => {
    if (reducedMotion) return;
    cardOpacity.value = withDelay(180, withTiming(1, { duration: 260 }));
    cardTranslateY.value = withDelay(180, withTiming(0, { duration: 260 }));
    arrowOpacity.value = withDelay(280, withTiming(1, { duration: 180 }));
  }, [arrowOpacity, cardOpacity, cardTranslateY, reducedMotion]);

  const cardEnterStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const arrowFadeStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

  const handlePress = () => {
    playLightImpactHaptic();
    onPress?.();
  };

  return (
    <Animated.View style={cardEnterStyle}>
      <Text style={[planBriefingStyles.eyebrow, styles.sectionEyebrow]}>
        {recommendedPlan.eyebrow}
      </Text>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={recommendedPlan.accessibilityLabel}>
        <Animated.View style={[styles.card, shadows.card, pressStyle]}>
          <View style={styles.iconTile}>
            <Ionicons name="git-compare-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{recommendedPlan.title}</Text>
            <Text style={styles.body}>{recommendedPlan.body}</Text>
            <View style={styles.chipRow}>
              {recommendedPlan.chips.map((chip) => (
                <View key={chip} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Animated.View style={arrowFadeStyle}>
            <Pressable
              onPress={handlePress}
              onPressIn={arrowPressIn}
              onPressOut={arrowPressOut}
              style={styles.arrowHit}
              accessibilityRole="button"
              accessibilityLabel="Plan seçeneklerine git"
              hitSlop={6}>
              <Animated.View style={[styles.arrowButton, arrowPressStyle]}>
                <Ionicons name="arrow-forward" size={18} color={eventDetail.tealDark} />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionEyebrow: {
    marginHorizontal: eventDetail.screenPadding,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#0E5A52',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingTop: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  arrowHit: {
    alignSelf: 'center',
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
