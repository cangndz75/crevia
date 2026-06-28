import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { EventCard } from '@/core/models/EventCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';
import { getEventSceneImage } from '@/features/events/utils/eventAssets';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { shadows } from '@/ui/theme/shadows';

import { planBriefingStyles } from './planBriefingStyles';
import { SuitabilityScoreRing } from './SuitabilityScoreRing';

type StrategyBriefCardProps = {
  event: EventCard;
  brief: EventPlanBriefingPresentation['brief'];
  suitability: EventPlanBriefingPresentation['suitability'];
  reducedMotion?: boolean;
};

export function StrategyBriefCard({
  event,
  brief,
  suitability,
  reducedMotion = false,
}: StrategyBriefCardProps) {
  const { width } = useWindowDimensions();
  const stackVisual = width < 360;
  const imageSource = useMemo(() => getEventSceneImage(event), [event]);

  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardTranslateY = useSharedValue(reducedMotion ? 0 : 14);
  const imageOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const imageScale = useSharedValue(reducedMotion ? 1 : 0.96);

  useEffect(() => {
    if (reducedMotion) return;
    cardOpacity.value = withTiming(1, { duration: 260 });
    cardTranslateY.value = withTiming(0, { duration: 260 });
    imageOpacity.value = withDelay(80, withTiming(1, { duration: 220 }));
    imageScale.value = withDelay(80, withTiming(1, { duration: 220 }));
  }, [cardOpacity, cardTranslateY, imageOpacity, imageScale, reducedMotion]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  return (
    <Animated.View style={[styles.outer, shadows.soft, cardStyle]}>
      <View style={styles.cardInner}>
        <View style={[styles.contentRow, stackVisual && styles.contentRowStack]}>
          <View style={styles.textCol}>
            <Text style={planBriefingStyles.eyebrow}>{brief.eyebrow}</Text>
            <Text style={styles.title}>{brief.title}</Text>
            <Text style={styles.body}>{brief.body}</Text>
          </View>
          <Animated.View style={[styles.visualWrap, stackVisual && styles.visualWrapStack, imageStyle]}>
            <CreviaAssetImage
              source={imageSource}
              contentFit="cover"
              containerStyle={styles.visual}
              style={styles.visualImage}
            />
          </Animated.View>
        </View>
        <SuitabilityScoreRing suitability={suitability} reducedMotion={reducedMotion} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 18,
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contentRowStack: {
    flexDirection: 'column',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 19,
  },
  visualWrap: {
    width: 88,
    height: 88,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    flexShrink: 0,
  },
  visualWrapStack: {
    alignSelf: 'flex-end',
  },
  visual: {
    width: '100%',
    height: '100%',
  },
  visualImage: {
    borderRadius: 18,
  },
});
