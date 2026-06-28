import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type ProfileBrandHeaderProps = {
  notificationCount?: number;
  onNotificationsPress?: () => void;
};

export function ProfileBrandHeader({
  notificationCount = 0,
  onNotificationsPress,
}: ProfileBrandHeaderProps) {
  const showBadge = notificationCount > 0;

  return (
    <View style={styles.row}>
      <View style={[styles.profilePill, shadows.soft]}>
        <Ionicons name="trophy" size={14} color={PROFILE_REFERENCE_THEME.tealDeep} />
        <Text style={styles.profilePillText} numberOfLines={1}>
          Profil
        </Text>
      </View>

      <View style={styles.logoSlot}>
        <CreviaGameLogo width={96} />
      </View>

      <Pressable
        onPress={onNotificationsPress}
        style={[styles.notifyBtn, shadows.soft]}
        accessibilityRole="button"
        accessibilityLabel="Bildirimler">
        <Ionicons name="notifications-outline" size={22} color={PROFILE_REFERENCE_THEME.tealDark} />
        {showBadge ? <View style={styles.notifyDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 74,
  },
  profilePill: {
    position: 'absolute',
    left: 0,
    top: 8,
    minWidth: 72,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(14, 79, 71, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
  },
  logoSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  notifyBtn: {
    position: 'absolute',
    right: 0,
    top: 7,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(14, 79, 71, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: PROFILE_REFERENCE_THEME.gold,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
