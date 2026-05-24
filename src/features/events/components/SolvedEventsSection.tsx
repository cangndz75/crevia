import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { SolvedEvent } from '@/core/models/EventCard';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function SolvedRow({ item }: { item: SolvedEvent }) {
  return (
    <View style={[styles.row, shadows.soft]}>
      <View style={styles.check}>
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.xpPill}>
        <Ionicons name="heart" size={11} color={colors.purple} />
        <Text style={styles.xp}>+{item.xpEarned} XP</Text>
      </View>
    </View>
  );
}

export function SolvedEventsSection() {
  const items = mockGameData.solvedEvents;

  return (
    <View>
      <SectionHeader
        title="Bugün Çözülenler"
        icon="checkmark-done"
        iconColor={colors.success}
      />
      <View style={styles.list}>
        {items.map((item) => (
          <SolvedRow key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subtitle,
    flex: 1,
    fontSize: 15,
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.purpleMuted,
  },
  xp: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
  },
});
