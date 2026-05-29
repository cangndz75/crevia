import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardHeaderProps = {
  onBack: () => void;
};

export function LeaderboardHeader({ onBack }: LeaderboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={onBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Geri dön">
        <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
      </Pressable>

      <View style={styles.textCol}>
        <Text style={styles.title}>Liderlik</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Pilot performansın ve şehir operasyon prestijin
        </Text>
      </View>

      <View style={styles.trophyBadge}>
        <Ionicons name="trophy" size={20} color={colors.hubGoldDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.hubCream,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 14,
  },
  trophyBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
