import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanOptionsPresentation } from '@/features/events/utils/eventPlanOptionsPresentation';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

import { CompareOptionsCTA } from './CompareOptionsCTA';
import { EceRecommendationCard } from './EceRecommendationCard';
import { PlanOptionCard } from './PlanOptionCard';

type PlanOptionsSectionProps = {
  optionsPresentation: EventPlanOptionsPresentation;
  reducedMotion?: boolean;
  onSelectOption: (strategyId: EventPlanStrategyId) => void;
  onComparePress: () => void;
};

export function PlanOptionsSection({
  optionsPresentation,
  reducedMotion = false,
  onSelectOption,
  onComparePress,
}: PlanOptionsSectionProps) {
  const titleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const titleTranslateY = useSharedValue(reducedMotion ? 0 : 10);

  useEffect(() => {
    if (reducedMotion) return;
    titleOpacity.value = withTiming(1, { duration: 180 });
    titleTranslateY.value = withTiming(0, { duration: 180 });
  }, [reducedMotion, titleOpacity, titleTranslateY]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={optionsPresentation.sectionAccessibilityLabel}>
      <Animated.View style={[styles.header, titleStyle]}>
        <View style={styles.headerIcon}>
          <Ionicons name="layers-outline" size={16} color={eventDetail.tealDark} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{optionsPresentation.sectionTitle}</Text>
          <Text style={styles.description}>{optionsPresentation.sectionDescription}</Text>
        </View>
      </Animated.View>

      <View style={styles.cardList}>
        {optionsPresentation.options.map((option, index) => (
          <PlanOptionCard
            key={option.id}
            option={option}
            index={index}
            reducedMotion={reducedMotion}
            onSelect={() => onSelectOption(option.id)}
          />
        ))}
      </View>

      <EceRecommendationCard
        recommendation={optionsPresentation.eceRecommendation}
        reducedMotion={reducedMotion}
      />

      <CompareOptionsCTA
        cta={optionsPresentation.compareCta}
        reducedMotion={reducedMotion}
        onPress={onComparePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: eventDetail.screenPadding,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.10)',
    marginTop: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  cardList: {
    gap: 10,
  },
});
