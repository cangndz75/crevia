import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type HeaderNotifyButtonProps = {
  count: number;
  /** Dashboard header'da açık zemin üzerinde */
  light?: boolean;
  /** Bildirim noktası rengi — kompakt header'da mor */
  dotColor?: string;
  /** Sadece nokta göster (sayısız) */
  dotOnly?: boolean;
  /** Kompakt header için daha küçük buton */
  compact?: boolean;
};

export function HeaderNotifyButton({
  count,
  light = false,
  dotColor = colors.danger,
  dotOnly = false,
  compact = false,
}: HeaderNotifyButtonProps) {
  const size = compact ? 34 : 40;
  const iconSize = compact ? 18 : 20;

  return (
    <Pressable
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        light ? styles.btnLight : styles.btnDefault,
        !light && shadows.soft,
      ]}
      accessibilityLabel="Bildirimler">
      <Ionicons
        name="notifications-outline"
        size={iconSize}
        color={light ? colors.textInverse : colors.textPrimary}
      />
      {count > 0 ? (
        dotOnly ? (
          <View
            style={[
              styles.dot,
              compact && styles.dotCompact,
              { backgroundColor: dotColor },
              light && styles.dotLightBorder,
            ]}
          />
        ) : (
          <View style={[styles.badge, light && styles.badgeLight]}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnDefault: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLight: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeLight: {
    borderColor: colors.headerTeal,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  dotCompact: {
    top: 6,
    right: 7,
  },
  dotLightBorder: {
    borderColor: colors.headerTeal,
  },
});
