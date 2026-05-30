import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { HexagonBadgeIcon } from '@/features/progression/components/authorities/HexagonBadgeIcon';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import type { BadgePreviewModel } from '@/features/progression/utils/authorityCollectionPresentation';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LargeBadgePreviewCardProps = {
  item: BadgePreviewModel;
  index: number;
};

function CornerStatusIcon({ item }: { item: BadgePreviewModel }) {
  if (item.showActive) {
    return (
      <View style={[styles.cornerBadge, styles.cornerActive]}>
        <Ionicons name="checkmark" size={11} color={colors.textInverse} />
      </View>
    );
  }
  if (item.showSoon) {
    return (
      <View style={[styles.cornerBadge, styles.cornerSoon]}>
        <Ionicons name="time-outline" size={11} color={colors.authority} />
      </View>
    );
  }
  if (item.showLock) {
    return (
      <View style={[styles.cornerBadge, styles.cornerLocked]}>
        <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
      </View>
    );
  }
  return null;
}

export function LargeBadgePreviewCard({ item, index }: LargeBadgePreviewCardProps) {
  const dimmed = item.showLock;

  return (
    <Animated.View
      entering={FadeInUp.delay(100 + index * 60).duration(340)}
      style={[styles.card, shadows.card, dimmed && styles.cardDimmed]}>
      <View style={styles.patternA} />
      <View style={styles.patternB} />
      <CornerStatusIcon item={item} />

      <View style={styles.hexWrap}>
        <HexagonBadgeIcon
          icon={item.icon}
          theme={item.theme}
          dimmed={dimmed}
          size={78}
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexBasis: '48%',
    minWidth: 0,
    backgroundColor: AUTHORITY_COLLECTION_THEME.cardBg,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    padding: spacing.md,
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDimmed: {
    opacity: 0.94,
  },
  patternA: {
    position: 'absolute',
    top: -18,
    right: -10,
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 143, 134, 0.06)',
    transform: [{ rotate: '18deg' }],
  },
  patternB: {
    position: 'absolute',
    bottom: -14,
    left: -8,
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(141, 106, 216, 0.07)',
    transform: [{ rotate: '-12deg' }],
  },
  cornerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
    zIndex: 2,
  },
  cornerActive: {
    backgroundColor: colors.primary,
  },
  cornerSoon: {
    backgroundColor: colors.authorityMuted,
  },
  cornerLocked: {
    backgroundColor: colors.backgroundAlt,
  },
  hexWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 21,
    flexShrink: 1,
  },
});
