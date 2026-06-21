import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { radius } from '@/ui/theme/radius';

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
      <View style={styles.logoSlot}>
        <CreviaGameLogo width={92} />
        <Text style={styles.tagline} numberOfLines={1}>
          ŞEHRİNİ İNŞA ET
        </Text>
      </View>

      <Pressable
        onPress={onNotificationsPress}
        style={styles.notifyBtn}
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
    minHeight: 52,
    paddingTop: 2,
  },
  logoSlot: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    letterSpacing: 1.4,
  },
  notifyBtn: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 40,
    height: 40,
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
