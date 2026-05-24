import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { OpsPulseStatus } from '@/core/models/OperationsBrief';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function pulseColor(status: OpsPulseStatus) {
  switch (status) {
    case 'steady':
      return colors.success;
    case 'watch':
      return colors.warning;
    case 'hot':
      return colors.danger;
    default:
      return colors.textSecondary;
  }
}

function PulseRow({
  headline,
  detail,
  status,
}: {
  headline: string;
  detail: string;
  status: OpsPulseStatus;
}) {
  const stripe = pulseColor(status);
  return (
    <View style={styles.row}>
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowHead}>
          <Text style={styles.headline} numberOfLines={1}>
            {headline}
          </Text>
          <View style={[styles.pill, { borderColor: stripe }]}>
            <View style={[styles.pillDot, { backgroundColor: stripe }]} />
            <Text style={[styles.pillText, { color: stripe }]}>
              {status === 'steady'
                ? 'istikrarlı'
                : status === 'watch'
                  ? 'izleniyor'
                  : 'sıcak'}
            </Text>
          </View>
        </View>
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

export function LiveOpsPulseStrip() {
  const lines = mockGameData.operationsBrief.livePulse;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="radio-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={typography.eyebrow}>Canlı hat</Text>
            <Text style={styles.headerSub}>Saha ve koordinasyon akışı</Text>
          </View>
        </View>
      </View>
      <View style={styles.list}>
        {lines.map((item) => (
          <PulseRow
            key={item.id}
            headline={item.headline}
            detail={item.detail}
            status={item.status}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    paddingVertical: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stripe: {
    width: 4,
    borderRadius: 2,
    marginRight: spacing.sm,
    alignSelf: 'stretch',
    minHeight: 36,
    marginTop: 2,
    marginBottom: 2,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headline: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detail: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
