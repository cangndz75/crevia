import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveHubMotto, deriveHubRiskScore } from '@/features/hub/utils/hubDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubStatusSummaryCard() {
  const input = useHubDerivedInput();
  const { score } = useMemo(() => deriveHubRiskScore(input), [input]);
  const motto = useMemo(() => deriveHubMotto(input), [input]);

  const title =
    score >= 42 ? 'Bugün Bölge Hareketli' : 'Bugün Bölge Dengede';

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption} numberOfLines={3}>
          {motto}
        </Text>
      </View>

      <View style={styles.visualCol}>
        <View style={styles.pulseBadge}>
          <Ionicons name="pulse" size={18} color={colors.warning} />
        </View>
        <View style={styles.isometric}>
          <View style={styles.blockA} />
          <View style={styles.blockB} />
          <View style={styles.blockC} />
          <View style={styles.tree} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  visualCol: {
    width: 110,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pulseBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  isometric: {
    width: 100,
    height: 72,
    position: 'relative',
  },
  blockA: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 44,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
    transform: [{ skewX: '-12deg' }],
  },
  blockB: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    width: 36,
    height: 24,
    borderRadius: 5,
    backgroundColor: colors.secondaryMuted,
    transform: [{ skewX: '-10deg' }],
  },
  blockC: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.successMuted,
    transform: [{ skewX: '-8deg' }],
  },
  tree: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
  },
});
