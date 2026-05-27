import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ProfileBadge } from '@/features/profile/utils/profileModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type OperatorBadgeRowProps = {
  badges: ProfileBadge[];
};

function BadgeMedal({ badge }: { badge: ProfileBadge }) {
  return (
    <View
      style={[
        styles.medal,
        badge.locked ? styles.medalLocked : styles.medalActive,
        shadows.soft,
      ]}>
      <View
        style={[
          styles.medalIcon,
          badge.locked ? styles.medalIconLocked : styles.medalIconActive,
        ]}>
        <Ionicons
          name={badge.locked ? 'lock-closed' : badge.icon}
          size={16}
          color={badge.locked ? colors.textSecondary : colors.hubGoldDark}
        />
      </View>
      <Text
        style={[styles.medalLabel, badge.locked && styles.medalLabelLocked]}
        numberOfLines={1}>
        {badge.label}
      </Text>
    </View>
  );
}

export function OperatorBadgeRow({ badges }: OperatorBadgeRowProps) {
  return (
    <View style={[styles.strip, shadows.card]}>
      <Text style={styles.stripTitle}>Operatör Kartı</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {badges.map((badge) => (
          <BadgeMedal key={badge.id} badge={badge} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  stripTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  medal: {
    width: 76,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  medalActive: {
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.35)',
  },
  medalLocked: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    opacity: 0.85,
  },
  medalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalIconActive: {
    backgroundColor: 'rgba(245,183,49,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
  },
  medalIconLocked: {
    backgroundColor: colors.backgroundAlt,
  },
  medalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
    textAlign: 'center',
  },
  medalLabelLocked: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
