import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type ProfileNavHeaderProps = {
  onBack: () => void;
  notificationCount?: number;
};

export function ProfileNavHeader({
  onBack,
  notificationCount = 0,
}: ProfileNavHeaderProps) {
  const showBadge = notificationCount > 0;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Geri dön">
        <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
        <Text style={styles.backLabel}>Geri</Text>
      </Pressable>

      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          Operatör Profili
        </Text>
      </View>

      <View style={styles.notifyWrap} pointerEvents="none">
        <Ionicons
          name="notifications-outline"
          size={20}
          color="rgba(255,255,255,0.9)"
        />
        {showBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
    minWidth: 64,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 72,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  notifyWrap: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.hubGold,
    borderWidth: 1.5,
    borderColor: colors.headerTealDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
