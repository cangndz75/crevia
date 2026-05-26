import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveDay1Missions } from '@/features/hub/utils/hubDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubDailyGoalCard() {
  const input = useHubDerivedInput();
  const missions = useMemo(() => deriveDay1Missions(input), [input]);
  const primary = missions[0];
  const completed = missions.filter((m) => m.status === 'completed').length;
  const progress = primary ? Math.min(primary.current / primary.target, 1) : 0;
  const totalXp = missions.reduce((s, m) => s + m.xpReward, 0);

  if (!primary) return null;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.left}>
        <Text style={styles.label}>Günlük Hedef</Text>
        <Text style={styles.goal} numberOfLines={2}>
          {completed >= 2
            ? 'Günlük hedeflere yaklaşıyorsun'
            : `${primary.target} kritik olayı çöz`}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completed}/{missions.length} tamamlandı
          </Text>
        </View>
      </View>
      <View style={styles.reward}>
        <Ionicons name="medal" size={28} color={colors.hubGold} />
        <Text style={styles.xpReward}>+{totalXp} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F0E0B8',
    padding: spacing.lg,
    gap: spacing.md,
  },
  left: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  goal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  progressRow: {
    gap: 4,
    marginTop: spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.hubGold,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reward: {
    alignItems: 'center',
    gap: 4,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
});
