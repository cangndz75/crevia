import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  NODE_STATUS_LABELS,
  type DerivedProgressionNode,
} from '@/features/progression/utils/progressionDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type AuthorityNodeCardProps = {
  node: DerivedProgressionNode;
  branchColor: string;
  branchMutedColor: string;
};

const STATUS_CHIP: Record<
  DerivedProgressionNode['status'],
  { bg: string; text: string }
> = {
  unlocked: { bg: colors.successMuted, text: colors.success },
  next: { bg: colors.authorityMuted, text: colors.authority },
  locked: { bg: colors.background, text: colors.textSecondary },
  comingSoon: { bg: colors.purpleMuted, text: colors.purple },
};

export function AuthorityNodeCard({
  node,
  branchColor,
  branchMutedColor,
}: AuthorityNodeCardProps) {
  const chip = STATUS_CHIP[node.status];
  const dimmed = node.status === 'locked';
  const highlight = node.status === 'next';
  const dashed = node.status === 'comingSoon';

  return (
    <View
      style={[
        styles.card,
        { borderColor: highlight ? branchColor : colors.border },
        highlight && { backgroundColor: branchMutedColor },
        dimmed && styles.dimmed,
        dashed && styles.dashed,
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: branchMutedColor }]}>
          <Ionicons name={node.icon} size={18} color={branchColor} />
        </View>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.statusText, { color: chip.text }]}>
            {NODE_STATUS_LABELS[node.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {node.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {node.description}
      </Text>

      <View style={styles.footer}>
        {node.status === 'comingSoon' ? (
          <Text style={styles.footerMeta}>Gün 2+</Text>
        ) : node.status === 'unlocked' ? (
          <Text style={[styles.footerMeta, { color: colors.success }]}>
            Aktif
          </Text>
        ) : (
          <Text style={styles.footerMeta}>
            {node.status === 'next'
              ? `${node.remainingXp} XP kaldı`
              : `${node.requiredXp} XP`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  dashed: {
    borderStyle: 'dashed',
  },
  dimmed: {
    opacity: 0.78,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    ...typography.subtitle,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  footer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
