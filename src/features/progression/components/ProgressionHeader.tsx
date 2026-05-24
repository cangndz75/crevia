import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatAuthorityPoints,
  mockGameData,
} from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function ProgressionHeader() {
  const insets = useSafeAreaInsets();
  const { player } = mockGameData;
  const unlocked = mockGameData.abilities.filter(
    (a) => a.status !== 'locked',
  ).length;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="ribbon" size={20} color={colors.authority} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Yetki Ağacı</Text>
            <Text style={styles.brandSub}>
              {unlocked} yetki aktif · Seviye {player.level}
            </Text>
          </View>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>OTORİTE PUANI</Text>
          <Text style={styles.pointsValue}>
            {formatAuthorityPoints(player.authorityPoints)} XP
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
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
