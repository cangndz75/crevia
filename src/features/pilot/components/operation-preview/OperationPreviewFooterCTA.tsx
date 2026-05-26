import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type OperationPreviewFooterCTAProps = {
  onPilotReport: () => void;
};

export function OperationPreviewFooterCTA({
  onPilotReport,
}: OperationPreviewFooterCTAProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(520).duration(340).springify().damping(22)}
      style={styles.wrap}>
      <View style={[styles.ctaCard, shadows.card]}>
        <Pressable
          disabled
          style={styles.primaryBtn}
          accessibilityState={{ disabled: true }}>
          <LinearGradient
            colors={[colors.hubGoldMuted, '#FFF8E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}>
            <Ionicons name="lock-closed" size={17} color={colors.hubGoldDark} />
            <Text style={styles.primaryText}>Ana Operasyon Yakında Açılacak</Text>
          </LinearGradient>
        </Pressable>

        <GameButton
          title="Pilot Raporuna Dön"
          onPress={onPilotReport}
          variant="secondary"
          style={styles.secondaryBtn}
        />
      </View>

      <Text style={styles.footerNote}>
        Ana operasyon modu ilerleyen güncellemelerde aktif edilecek.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ctaCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.hubGold}99`,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    alignSelf: 'stretch',
  },
  footerNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
