import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function AdvisorBriefingCard() {
  const { advisor } = mockGameData.operationsBrief;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.accentStripe} />
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.iconBadge}>
            <Ionicons name="clipboard-outline" size={18} color={colors.authority} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={typography.eyebrow}>{advisor.eyebrow}</Text>
            <Text style={styles.hook}>Simülasyon tavsiyesi</Text>
          </View>
        </View>
        <Text style={styles.body}>{advisor.body}</Text>
        <Text style={styles.attr}>{advisor.attribution}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStripe: {
    width: 5,
    backgroundColor: colors.authority,
    opacity: 0.95,
  },
  inner: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hook: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.authority,
    marginTop: 4,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  attr: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
});
