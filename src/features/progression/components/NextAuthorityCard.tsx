import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DerivedProgressionNode } from '@/features/progression/utils/progressionDerived';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type NextAuthorityCardProps = {
  nextNode: DerivedProgressionNode | null;
  xp: number;
};

export function NextAuthorityCard({ nextNode, xp }: NextAuthorityCardProps) {
  if (!nextNode) {
    return (
      <View style={styles.wrap}>
        <Text style={typography.label}>Sıradaki Yetki</Text>
        <View style={[styles.card, styles.cardComplete, shadows.soft]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <View style={styles.completeBody}>
            <Text style={typography.subtitle}>Tüm yetkiler açıldı</Text>
            <Text style={typography.caption}>
              Gün 1 kilometre taşlarının tamamına ulaştın. Yeni sistemler
              yakında eklenecek.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const ready = xp >= nextNode.requiredXp;
  const progress = nextNode.requiredXp > 0 ? xp / nextNode.requiredXp : 1;

  return (
    <View style={styles.wrap}>
      <Text style={typography.label}>Sıradaki Yetki</Text>
      <View style={[styles.card, ready && styles.cardReady, shadows.card]}>
        <View style={styles.cardTop}>
          <View style={styles.iconCircle}>
            <Ionicons name={nextNode.icon} size={20} color={colors.authority} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={typography.subtitle}>{nextNode.title}</Text>
            <Text style={styles.xpReq}>
              {nextNode.requiredXp} XP&apos;de açılır
            </Text>
          </View>
          {ready ? (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Açıldı</Text>
            </View>
          ) : (
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingValue}>
                {nextNode.remainingXp}
              </Text>
              <Text style={styles.remainingLabel}>XP kaldı</Text>
            </View>
          )}
        </View>

        <Text style={styles.effect}>{nextNode.description}</Text>

        {!ready && (
          <ProgressBar
            progress={progress}
            color={colors.authority}
            trackColor={colors.authorityMuted}
            height={6}
            style={styles.bar}
          />
        )}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            {ready ? 'Yeni yetki aktif' : 'Yaklaşıyorsun'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardReady: {
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
  },
  cardComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
    padding: spacing.lg,
  },
  completeBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  xpReq: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.authority,
  },
  remainingBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    minWidth: 56,
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.warning,
  },
  remainingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
    letterSpacing: 0.3,
  },
  openBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
  effect: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  bar: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.authorityMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.authority,
    letterSpacing: 0.2,
  },
});
