import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { colors } from '@/ui/theme/colors';
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
        style={[styles.primaryBtn, hubPremiumShadowCard()]}>
        <LinearGradient
          colors={[
            HUB_PREMIUM_COLORS.tealDark,
            HUB_PREMIUM_COLORS.tealCta,
            HUB_PREMIUM_COLORS.teal,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryGradient}>
          <View style={styles.primaryIcon}>
            <HubAssetImage
              source={creviaAssets.reports.endOfDay.clipboardStamp}
              containerStyle={styles.footerAsset}
              contentFit="contain"
            />
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
            hubPremiumShadowCard(),
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Operasyonlar">
          <View style={styles.secondaryIcon}>
            <HubAssetImage
              source={creviaAssets.icons.signals.beaconTeal}
              containerStyle={styles.footerAsset}
              contentFit="contain"
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.secondaryTitle} numberOfLines={1}>
              Operasyonlar
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
    borderRadius: HUB_PREMIUM_RADIUS.card,
    overflow: 'hidden',
    minWidth: 0,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 76,
  },
  primaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  footerAsset: {
    width: 24,
    height: 24,
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
    backgroundColor: HUB_PREMIUM_COLORS.cardGold,
    borderRadius: HUB_PREMIUM_RADIUS.card,
    borderWidth: 1.5,
    borderColor: HUB_PREMIUM_COLORS.borderGold,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 76,
    minWidth: 0,
  },
  secondaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
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
