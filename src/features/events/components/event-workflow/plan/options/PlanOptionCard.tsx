import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { PlanOptionPresentation } from '@/features/events/utils/eventPlanOptionsPresentation';
import { shadows } from '@/ui/theme/shadows';

import { PlanOptionStatsRow } from './PlanOptionStatsRow';
import { ContextFitBadgeView } from './ContextFitBadgeView';
import { ReadinessFitChipView } from './ReadinessFitChipView';
import { PlanOptionTradeoffStrip, TradeoffChipRow } from './PlanOptionTradeoffStrip';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TONE_ICON: Record<PlanOptionPresentation['tone'], IconName> = {
  urgent: 'flash-outline',
  balanced: 'git-compare-outline',
  preventive: 'shield-checkmark-outline',
};

const TONE_MEDALLION: Record<
  PlanOptionPresentation['tone'],
  { bg: string; icon: string; border: string }
> = {
  urgent: {
    bg: 'rgba(217, 147, 61, 0.14)',
    icon: '#B45309',
    border: 'rgba(217, 147, 61, 0.24)',
  },
  balanced: {
    bg: 'rgba(11, 107, 97, 0.12)',
    icon: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.20)',
  },
  preventive: {
    bg: 'rgba(62, 158, 106, 0.12)',
    icon: '#1A7A5C',
    border: 'rgba(62, 158, 106, 0.22)',
  },
};

type PlanOptionCardProps = {
  option: PlanOptionPresentation;
  index: number;
  reducedMotion?: boolean;
  onSelect: () => void;
};

export function PlanOptionCard({
  option,
  index,
  reducedMotion = false,
  onSelect,
}: PlanOptionCardProps) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 14);
  const cardScale = useSharedValue(
    reducedMotion ? 1 : option.selected && option.recommended ? 0.985 : 1,
  );
  const checkScale = useSharedValue(reducedMotion ? 1 : option.selected ? 0.7 : 1);
  const badgeOpacity = useSharedValue(reducedMotion ? 1 : option.recommended ? 0 : 0);

  const medallion = TONE_MEDALLION[option.tone];
  const icon = TONE_ICON[option.tone];
  const entranceDelay = index * 80;

  useEffect(() => {
    if (reducedMotion) {
      cardScale.value = 1;
      checkScale.value = 1;
      badgeOpacity.value = option.recommended ? 1 : 0;
      return;
    }

    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 240 }));
    translateY.value = withDelay(entranceDelay, withTiming(0, { duration: 240 }));

    if (option.selected && option.recommended) {
      cardScale.value = withDelay(
        entranceDelay + 40,
        withSpring(1, { damping: 14, stiffness: 200 }),
      );
    }

    if (option.selected) {
      checkScale.value = withDelay(
        entranceDelay + 60,
        withSpring(1, { damping: 12, stiffness: 220 }),
      );
    }

    if (option.recommended) {
      badgeOpacity.value = withDelay(entranceDelay + 100, withTiming(1, { duration: 200 }));
    }
  }, [
    badgeOpacity,
    cardScale,
    checkScale,
    entranceDelay,
    opacity,
    option.recommended,
    option.selected,
    reducedMotion,
    translateY,
  ]);

  useEffect(() => {
    if (reducedMotion) return;
    checkScale.value = withSpring(option.selected ? 1 : 0.85, {
      damping: 14,
      stiffness: 220,
    });
  }, [checkScale, option.selected, reducedMotion]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: cardScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
  }));

  return (
    <Animated.View style={enterStyle}>
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [
          styles.card,
          shadows.soft,
          option.selected ? styles.cardSelected : styles.cardDefault,
          option.selected && option.recommended && styles.cardRecommendedSelected,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: option.selected }}
        accessibilityLabel={option.accessibilityLabel}>
        {option.recommended ? (
          <Animated.View style={[styles.recommendedBadge, badgeStyle]}>
            <Ionicons name="sparkles" size={10} color={eventDetail.tealDark} />
            <Text style={styles.recommendedText}>Önerilen Plan</Text>
          </Animated.View>
        ) : null}

        <View style={styles.mainRow}>
          <View
            style={[
              styles.medallion,
              {
                backgroundColor: medallion.bg,
                borderColor: medallion.border,
              },
            ]}>
            <Ionicons name={icon} size={20} color={medallion.icon} />
          </View>

          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {option.depth.strategyBadge}
              </Text>
              {option.recommended ? (
                <View style={styles.inlineRecommended}>
                  <Ionicons name="sparkles" size={9} color={eventDetail.tealDark} />
                </View>
              ) : null}
            </View>
            <TradeoffChipRow
              benefit={option.depth.benefitChip}
              cost={option.depth.costChip}
            />
            <Text style={styles.description} numberOfLines={2}>
              {option.depth.opportunityCost}
            </Text>
            {option.depth.contextFitBadge ? (
              <ContextFitBadgeView badge={option.depth.contextFitBadge} />
            ) : null}
            {option.depth.readinessFitBadge ? (
              <ReadinessFitChipView badge={option.depth.readinessFitBadge} />
            ) : null}
            {option.depth.riskWarning ? (
              <Text style={styles.riskWarning} numberOfLines={1}>
                {option.depth.riskWarning}
              </Text>
            ) : null}
            {option.depth.dominantStrategyWarning ? (
              <Text style={styles.memoryWarning} numberOfLines={2}>
                {option.depth.dominantStrategyWarning}
              </Text>
            ) : null}
            {option.depth.portfolioConflictHint ? (
              <Text style={styles.portfolioHint} numberOfLines={2}>
                {option.depth.portfolioConflictHint}
              </Text>
            ) : null}
            {option.depth.maintenanceEconomyHint ? (
              <Text style={styles.portfolioHint} numberOfLines={2}>
                {option.depth.maintenanceEconomyHint}
              </Text>
            ) : null}
            <PlanOptionTradeoffStrip
              meter={option.depth.tradeoffMeter}
              selected={option.selected}
            />
          </View>

          <Animated.View style={checkStyle}>
            {option.selected ? (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.radioCircle} />
            )}
          </Animated.View>
        </View>

        <PlanOptionStatsRow stats={option.stats} selected={option.selected} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 20,
    borderWidth: 2,
    padding: 14,
    backgroundColor: eventDetail.mintSoft,
  },
  cardDefault: {
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  cardSelected: {
    borderColor: eventDetail.teal,
    backgroundColor: eventDetail.mintSoft,
  },
  cardRecommendedSelected: {
    shadowColor: eventDetail.teal,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.14)',
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  medallion: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineRecommended: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: eventDetail.textDark,
    flexShrink: 1,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  riskWarning: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  memoryWarning: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 15,
    marginTop: 2,
  },
  portfolioHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 15,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.teal,
    marginTop: 2,
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(107, 125, 120, 0.35)',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
});
