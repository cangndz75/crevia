import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { CAREER_ROLE_BADGE, CAREER_SUMMARY_DESCRIPTION } from '@/core/content/progressionRoadmap';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type CareerSummaryCardProps = {
  role: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export function CareerSummaryCard({
  role,
  level,
  xp,
  xpToNextLevel,
}: CareerSummaryCardProps) {
  const xpProgress = xpToNextLevel > 0 ? xp / xpToNextLevel : 0;
  const remainingXp = Math.max(0, xpToNextLevel - xp);

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.accentGlow} />
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
        </View>

        <View style={styles.body}>
          <Text style={typography.eyebrow}>Kariyer Özeti</Text>
          <Text style={styles.role} numberOfLines={2}>
            {role}
          </Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{CAREER_ROLE_BADGE}</Text>
          </View>
          <Text style={styles.description}>{CAREER_SUMMARY_DESCRIPTION}</Text>

          <View style={styles.xpBlock}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>
                {xp.toLocaleString('tr-TR')} XP
              </Text>
              <Text style={styles.xpMeta}>
                Sonraki seviye için {remainingXp.toLocaleString('tr-TR')} XP
              </Text>
            </View>
            <ProgressBar
              progress={xpProgress}
              color={colors.primary}
              trackColor={colors.primaryMuted}
              height={8}
            />
          </View>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelEyebrow}>SEVİYE</Text>
          <Text style={styles.levelValue}>{level}</Text>
          <View style={styles.levelRing}>
            <View
              style={[
                styles.levelRingFill,
                {
                  height: `${Math.min(100, xpProgress * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  accentGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryMuted,
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  role: {
    ...typography.subtitle,
    fontSize: 15,
    lineHeight: 20,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
    letterSpacing: 0.4,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  xpBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  xpMeta: {
    ...typography.caption,
    fontSize: 10,
    flexShrink: 1,
    textAlign: 'right',
  },
  levelBadge: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  levelEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  levelValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 30,
  },
  levelRing: {
    width: 8,
    height: 48,
    borderRadius: 4,
    backgroundColor: colors.primaryMuted,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  levelRingFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
