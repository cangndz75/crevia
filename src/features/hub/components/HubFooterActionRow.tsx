import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubFooterActionRowProps = {
  onEndDay: () => void;
  onContinueOperation: () => void;
  continueEventCount?: number;
  showContinue?: boolean;
};

export function HubFooterActionRow({
  onEndDay,
  onContinueOperation,
  continueEventCount = 1,
  showContinue = true,
}: HubFooterActionRowProps) {
  return (
    <View style={styles.wrap}>
      <CreviaAnimatedPressable
        onPress={onEndDay}
        accessibilityRole="button"
        accessibilityLabel="Günü tamamla"
        style={[styles.primaryBtn, shadows.soft]}>
        <LinearGradient
          colors={['#0F4A47', colors.headerTealDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryGradient}>
          <View style={styles.primaryIcon}>
            <Ionicons name="flag" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.primaryTitle} numberOfLines={1}>
              Günü Tamamla
            </Text>
            <Text style={styles.primarySubtitle} numberOfLines={1}>
              Raporu Gör
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      </CreviaAnimatedPressable>

      {showContinue ? (
        <Pressable
          onPress={onContinueOperation}
          style={({ pressed }) => [
            styles.secondaryBtn,
            shadows.soft,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Operasyona devam et">
          <View style={styles.secondaryIcon}>
            <Ionicons name="flash" size={16} color={colors.hubGoldDark} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.secondaryTitle} numberOfLines={1}>
              Operasyona Devam
            </Text>
            <Text style={styles.secondarySubtitle} numberOfLines={1}>
              +{continueEventCount} olay
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.hubGoldDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.lg,
    minWidth: 0,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    minWidth: 0,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 72,
  },
  primaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  primaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  primarySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 183, 49, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 72,
    minWidth: 0,
  },
  secondaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  secondaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  secondarySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.hubGoldDark,
  },
  pressed: {
    opacity: 0.92,
  },
});
