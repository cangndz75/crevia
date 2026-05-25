import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PROGRESSION_UNLOCKS } from '@/features/progression/content/progressionUnlocks';
import {
  selectLevel,
  selectRole,
  selectXp,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function ProgressionHeader() {
  const insets = useSafeAreaInsets();
  const xp = useGameStore(selectXp);
  const level = useGameStore(selectLevel);
  const role = useGameStore(selectRole);

  const unlocked = PROGRESSION_UNLOCKS.filter(
    (item) => xp >= item.xpRequired,
  ).length;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="ribbon" size={20} color={colors.authority} />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>Yetki Ağacı</Text>
            <Text style={styles.brandSub}>
              {unlocked} özellik açık · Seviye {level}
            </Text>
            <Text style={styles.role} numberOfLines={2}>
              {role}
            </Text>
          </View>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>OYUNCU XP</Text>
          <Text style={styles.pointsValue}>
            {xp.toLocaleString('tr-TR')} XP
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  brandText: {
    flex: 1,
    gap: 2,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.subtitle,
    fontSize: 17,
  },
  brandSub: {
    ...typography.caption,
    fontSize: 12,
  },
  role: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  pointsCard: {
    backgroundColor: colors.authorityMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.authority,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.authority,
  },
});
