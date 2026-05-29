import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import type { ProfileBadge } from '@/features/profile/utils/profileModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type OperatorBadgeRowProps = {
  badges: ProfileBadge[];
  compact?: boolean;
};

function BadgeMedal({
  badge,
  compact,
}: {
  badge: ProfileBadge;
  compact: boolean;
}) {
  const pending = badge.locked;

  return (
    <View
      style={[
        styles.medal,
        compact && styles.medalCompact,
        pending ? styles.medalPending : styles.medalActive,
      ]}>
      <View
        style={[
          styles.medalIcon,
          compact && styles.medalIconCompact,
          pending ? styles.medalIconPending : styles.medalIconActive,
        ]}>
        <Ionicons
          name={pending ? 'time-outline' : badge.icon}
          size={compact ? 13 : 15}
          color={pending ? colors.textSecondary : colors.hubGoldDark}
        />
      </View>
      <Text
        style={[styles.medalLabel, pending && styles.medalLabelPending]}
        numberOfLines={compact ? 1 : 2}>
        {pending ? PROFILE_UI_COPY.queued : badge.label}
      </Text>
    </View>
  );
}

export function OperatorBadgeRow({ badges, compact = false }: OperatorBadgeRowProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={[styles.strip, compact && styles.stripCompact]}>
      <Text style={styles.stripTitle} numberOfLines={1}>
        {PROFILE_UI_COPY.featuredBadges}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {badges.map((badge) => (
          <BadgeMedal key={badge.id} badge={badge} compact={compact} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.1)',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    gap: spacing.xs,
  },
  stripCompact: {
    paddingVertical: 8,
  },
  stripTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  medal: {
    width: 72,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 0,
  },
  medalCompact: {
    width: 64,
    paddingVertical: 5,
  },
  medalActive: {
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.28)',
  },
  medalPending: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
  },
  medalIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalIconCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  medalIconActive: {
    backgroundColor: 'rgba(245,183,49,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
  },
  medalIconPending: {
    backgroundColor: colors.surface,
  },
  medalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.hubGoldDark,
    textAlign: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  medalLabelPending: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
