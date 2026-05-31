import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type EventHeaderProps = {
  showNotificationDot?: boolean;
};

export function EventHeader({ showNotificationDot = true }: EventHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel="Geri"
          hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={eventDetail.textDark} />
        </Pressable>

        <View style={styles.logoWrap}>
          <CreviaGameLogo width={96} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel="Bildirimler"
          hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={eventDetail.textDark} />
          {showNotificationDot ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.glass,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.88,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: eventDetail.red,
    borderWidth: 1.5,
    borderColor: eventDetail.card,
  },
});
