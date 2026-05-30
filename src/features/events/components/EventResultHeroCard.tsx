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
  readonly [string, string, string]
> = {
  positive: ['#FFFFFF', '#EEF9F3', '#DDF4E8'],
  balanced: ['#FFFFFF', '#FFF8EC', '#FDF4E6'],
  warning: ['#FFFFFF', '#FFF5F4', '#FDEEED'],
  neutral: ['#FFFFFF', '#F5F4F1', '#EBF2FA'],
};

const CHIP_COLORS: Record<EventResultHeroModel['tone'], { bg: string; text: string }> =
  {
    positive: { bg: colors.successMuted, text: colors.success },
    balanced: { bg: colors.warningMuted, text: colors.warning },
    warning: { bg: colors.dangerMuted, text: colors.danger },
    neutral: { bg: colors.secondaryMuted, text: colors.secondary },
  };

type Props = {
  model: EventResultHeroModel;
};

export function EventResultHeroCard({ model }: Props) {
  const { animatedStyle } = useEntranceAnimation();
  const chip = CHIP_COLORS[model.tone];

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={[...HERO_GRADIENTS[model.tone]]}
        style={[styles.card, shadows.soft]}>
        <Text style={styles.panelTitle} numberOfLines={1}>
          {model.panelTitle}
        </Text>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.statusChipText, { color: chip.text }]} numberOfLines={1}>
            {model.statusLabel}
          </Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {model.summary}
        </Text>
        <View style={styles.contextRow}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {model.eventTitle}
          </Text>
          <Text style={styles.neighborhood} numberOfLines={1}>
            {model.neighborhoodLabel}
          </Text>
        </View>
        <Text style={styles.decisionLine} numberOfLines={2}>
          Karar: {model.decisionTitle}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    minWidth: 0,
    flexShrink: 1,
  },
  panelTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summary: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  contextRow: {
    gap: 2,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  neighborhood: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  decisionLine: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 17,
  },
});
