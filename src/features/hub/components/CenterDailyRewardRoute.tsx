import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCenterRewardPulse } from '@/shared/motion';

import type {
  CenterDailyReward,
  CenterDailyRewardDay,
  CenterDailyRewardItemTone,
} from '@/features/hub/utils/centerDailyRewardPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  teal: '#07564F',
  tealDark: '#043A36',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  goldDark: '#9A6F12',
  green: '#3E9E6A',
  purple: '#8747C8',
  white: '#FFFFFF',
} as const;

const toneColors: Record<CenterDailyRewardItemTone, string> = {
  gold: palette.gold,
  green: palette.green,
  teal: palette.goldSoft,
  purple: palette.purple,
  neutral: 'rgba(255,255,255,0.72)',
};

type CenterDailyRewardRouteProps = {
  reward: CenterDailyReward;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
  onClaimPress?: () => void;
};

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'gift-outline': 'gift-outline',
    'flash-outline': 'flash-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'cube-outline': 'cube-outline',
    'ribbon-outline': 'ribbon-outline',
    'lock-closed-outline': 'lock-closed-outline',
  };
  return known[iconKey] ?? 'gift-outline';
}

function RouteDayNode({ day }: { day: CenterDailyRewardDay }) {
  const isToday = day.state === 'today';
  const isDone = day.state === 'done';
  const iconColor = isDone
    ? palette.goldDark
    : isToday
      ? palette.tealDark
      : 'rgba(255,255,255,0.38)';

  return (
    <View
      style={[styles.dayNodeWrap, isToday ? styles.dayNodeWrapToday : undefined]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.dayCoin,
          isToday ? styles.dayCoinToday : undefined,
          isDone ? styles.dayCoinDone : undefined,
          day.isBigReward ? styles.dayCoinBig : undefined,
        ]}>
        {isDone ? (
          <Ionicons name="checkmark" size={12} color={palette.white} />
        ) : (
          <Ionicons
            name={resolveIcon(day.rewardIconKey)}
            size={day.isBigReward ? 14 : 12}
            color={iconColor}
          />
        )}
      </View>
      <Text
        style={[styles.dayLabel, isToday ? styles.dayLabelToday : undefined]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}>
        {isToday ? day.label : `${day.dayIndex}`}
      </Text>
    </View>
  );
}

function BigRewardTeaser({
  item,
  dayIndex,
}: {
  item: NonNullable<CenterDailyReward['nextBigReward']>;
  dayIndex: number;
}) {
  const accent = toneColors[item.tone];
  return (
    <View
      style={styles.bigRewardTeaser}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.bigRewardDivider, { backgroundColor: accent }]} />
      <View style={styles.bigRewardContent}>
        <Text style={styles.bigRewardKicker} numberOfLines={1}>
          {dayIndex}. GÜN
        </Text>
        <View style={[styles.bigRewardIconRing, { borderColor: accent }]}>
          <Ionicons name={resolveIcon(item.iconKey)} size={14} color={accent} />
        </View>
        <Text
          style={[styles.bigRewardLabel, { color: accent }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {item.label}
        </Text>
      </View>
    </View>
  );
}

export function CenterDailyRewardRoute({
  reward,
  visibility,
  reducedMotion = false,
  onClaimPress,
}: CenterDailyRewardRouteProps) {
  const isVisible = (visibility ?? reward.visibility) !== 'hidden';
  const shouldAnimatePulse = reward.pulseAvailable && reward.ctaEnabled;
  const pulseStyle = useCenterRewardPulse(
    shouldAnimatePulse,
    reducedMotion,
    reward.ctaEnabled,
  );
  const showTeaserBorder = reward.pulseAvailable && !reward.ctaEnabled;

  if (!isVisible) {
    return null;
  }

  const bigRewardDay = reward.days.find((day) => day.isBigReward);
  const showBigTeaser = reward.nextBigReward && bigRewardDay;

  return (
    <AnimatedGradient
      colors={[palette.tealDark, palette.teal, '#0B665E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        showTeaserBorder ? styles.cardPulseReady : undefined,
        shouldAnimatePulse ? pulseStyle : undefined,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={reward.accessibilityLabel}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {reward.title}
          </Text>
          {reward.subtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {reward.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.streakPill}>
          <Ionicons name="flame-outline" size={12} color={palette.goldSoft} />
          <Text style={styles.streakPillText} numberOfLines={1}>
            {reward.streakLabel}
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.routeTrack}>
          <View style={styles.routeLine} />
          <View style={styles.routeDays}>
            {reward.days.map((day) => (
              <RouteDayNode key={day.dayIndex} day={day} />
            ))}
          </View>
        </View>
        {showBigTeaser ? (
          <BigRewardTeaser item={reward.nextBigReward!} dayIndex={bigRewardDay!.dayIndex} />
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.todayRewardCopy}>
          {reward.primaryReward ? (
            <View style={styles.todayRewardRow}>
              <Ionicons
                name={resolveIcon(reward.primaryReward.iconKey)}
                size={14}
                color={toneColors[reward.primaryReward.tone]}
              />
              <Text
                style={styles.todayRewardText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {reward.primaryReward.label}
              </Text>
            </View>
          ) : null}
          {reward.helperText ? (
            <Text style={styles.helperText} numberOfLines={2}>
              {reward.helperText}
            </Text>
          ) : null}
        </View>

        {reward.ctaLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reward.ctaLabel}
            accessibilityState={{ disabled: !reward.ctaEnabled }}
            disabled={!reward.ctaEnabled}
            onPress={onClaimPress}
            style={({ pressed }) => [
              styles.ctaButton,
              !reward.ctaEnabled ? styles.ctaButtonDisabled : undefined,
              pressed && reward.ctaEnabled ? styles.ctaButtonPressed : undefined,
            ]}>
            <Text
              style={[styles.ctaText, !reward.ctaEnabled ? styles.ctaTextDisabled : undefined]}
              numberOfLines={1}>
              {reward.ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AnimatedGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.gold,
    minHeight: 96,
    maxHeight: 132,
    overflow: 'hidden',
  },
  cardPulseReady: {
    borderColor: '#E8C04A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.goldSoft,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
    flexShrink: 0,
  },
  streakPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 4,
  },
  routeTrack: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  routeLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '42%',
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  routeDays: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 2,
  },
  dayNodeWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  dayNodeWrapToday: {
    transform: [{ translateY: -1 }],
  },
  dayCoin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dayCoinToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold,
  },
  dayCoinDone: {
    backgroundColor: 'rgba(216,167,46,0.28)',
    borderColor: palette.gold,
  },
  dayCoinBig: {
    borderColor: palette.purple,
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  dayLabelToday: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  bigRewardTeaser: {
    width: 62,
    flexShrink: 0,
    alignItems: 'center',
    gap: 3,
  },
  bigRewardDivider: {
    width: 2,
    height: 34,
    borderRadius: 999,
    opacity: 0.65,
  },
  bigRewardContent: {
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  bigRewardKicker: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  bigRewardIconRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  bigRewardLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  todayRewardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  todayRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  todayRewardText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: palette.white,
  },
  helperText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 12,
  },
  ctaButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.gold,
    flexShrink: 0,
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaButtonPressed: {
    opacity: 0.88,
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  ctaTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
});
