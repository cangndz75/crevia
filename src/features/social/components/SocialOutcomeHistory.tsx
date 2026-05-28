import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { SocialOutcomeItem } from '../utils/socialUiModel';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  outcomes: SocialOutcomeItem[];
  onViewAll?: () => void;
};

function OutcomeMiniItem({ item }: { item: SocialOutcomeItem }) {
  const delta =
    typeof item.delta === 'number' && Number.isFinite(item.delta)
      ? Math.round(item.delta)
      : 0;
  const positive = delta > 0;
  const deltaColor = positive ? colors.primary : colors.danger;
  const deltaBg = positive ? colors.primaryMuted : colors.dangerMuted;
  const deltaText = delta > 0 ? `+${delta} Nabız` : `${delta} Nabız`;

  return (
    <View style={styles.outcomeItem}>
      <View style={styles.iconSquare}>
        <Ionicons name={item.icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.outcomeTextCol}>
        <Text style={styles.outcomeLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={[styles.deltaPill, { backgroundColor: deltaBg }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {deltaText}
          </Text>
        </View>
        <Text style={styles.timeText}>{item.timeAgo}</Text>
      </View>
    </View>
  );
}

export function SocialOutcomeHistory({ outcomes, onViewAll }: Props) {
  const items = Array.isArray(outcomes) ? outcomes.slice(0, 3) : [];

  return (
    <Animated.View
      entering={FadeInLeft.delay(300).duration(400)}
      style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Sonuç Geçmişi</Text>
      </View>
      <Pressable onPress={onViewAll} hitSlop={8}>
        <Text style={styles.viewAllLink}>Tüm Geçmişi Gör</Text>
      </Pressable>

      <View style={styles.outcomesList}>
        {items.map((o) => (
          <OutcomeMiniItem key={o.id} item={o} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    padding: spacing.md,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  viewAllLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  outcomesList: {
    gap: 8,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  outcomeTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  outcomeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deltaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  deltaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
