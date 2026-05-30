import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useEntranceAnimation } from '@/core/animations/useEntranceAnimation';
import type { EventResultHeroModel } from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

const HERO_GRADIENTS: Record<
  EventResultHeroModel['tone'],
  readonly [string, string]
> = {
  positive: ['#F1FBF6', '#EFFAF4'],
  balanced: ['#FFFBF3', '#FFF6E8'],
  warning: ['#FFF8F6', '#FDEEED'],
  neutral: ['#F5F8FA', '#EBF2FA'],
};

const CHIP_COLORS: Record<EventResultHeroModel['tone'], { bg: string; text: string; icon: string }> =
  {
    positive: { bg: '#DDF4E8', text: colors.success, icon: colors.success },
    balanced: { bg: colors.warningMuted, text: colors.warning, icon: colors.warning },
    warning: { bg: colors.dangerMuted, text: colors.danger, icon: colors.danger },
    neutral: { bg: colors.secondaryMuted, text: colors.secondary, icon: colors.secondary },
  };

type Props = {
  model: EventResultHeroModel;
};

export function EventResultHeroCard({ model }: Props) {
  const { animatedStyle } = useEntranceAnimation();
  const chip = CHIP_COLORS[model.tone];

  return (
    <Animated.View style={[styles.outer, animatedStyle]}>
      <LinearGradient
        colors={[...HERO_GRADIENTS[model.tone]]}
        style={[styles.card, shadows.soft]}>
        <View style={styles.sparkleRow} pointerEvents="none">
          <View style={[styles.sparkle, styles.sparkleA]} />
          <View style={[styles.sparkle, styles.sparkleB]} />
        </View>

        <View style={styles.contentRow}>
          <View style={styles.textCol}>
            <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
              <Ionicons name="shield-checkmark" size={13} color={chip.icon} />
              <Text style={[styles.statusChipText, { color: chip.text }]} numberOfLines={1}>
                {model.statusLabel}
              </Text>
            </View>

            <Text style={styles.title} numberOfLines={4}>
              {model.title}
            </Text>

            <View style={styles.contextCard}>
              <Ionicons
                name="shield-outline"
                size={14}
                color={eventDetail.tealMid}
                style={styles.contextIcon}
              />
              <View style={styles.contextCopy}>
                <Text style={styles.contextEventTitle} numberOfLines={2}>
                  {model.eventTitle}
                </Text>
                <Text style={styles.contextDecision} numberOfLines={1}>
                  Karar:{' '}
                  <Text style={styles.contextDecisionAccent}>{model.decisionLabel}</Text>
                </Text>
              </View>
            </View>
          </View>

          {model.imageSource ? (
            <View style={styles.visualCol} pointerEvents="none">
              <Image
                source={model.imageSource}
                style={styles.heroImage}
                contentFit="contain"
              />
              <View style={styles.shieldBadge}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              </View>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 18,
    marginTop: 16,
    minWidth: 0,
  },
  card: {
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.1)',
    minHeight: 250,
    overflow: 'hidden',
    minWidth: 0,
  },
  sparkleRow: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(107, 203, 142, 0.45)',
  },
  sparkleA: {
    top: 18,
    right: 96,
  },
  sparkleB: {
    top: 42,
    right: 72,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  textCol: {
    flex: 1,
    maxWidth: '58%',
    minWidth: 0,
    gap: 10,
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 36,
    letterSpacing: -0.5,
    flexShrink: 1,
    minWidth: 0,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  contextIcon: {
    marginTop: 2,
  },
  contextCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  contextEventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.textDark,
    lineHeight: 17,
    flexShrink: 1,
    minWidth: 0,
  },
  contextDecision: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flexShrink: 1,
    minWidth: 0,
  },
  contextDecisionAccent: {
    color: eventDetail.teal,
    fontWeight: '800',
  },
  visualCol: {
    width: 118,
    height: 130,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginTop: 4,
  },
  heroImage: {
    width: 112,
    height: 112,
  },
  shieldBadge: {
    position: 'absolute',
    bottom: 6,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 2,
  },
});
