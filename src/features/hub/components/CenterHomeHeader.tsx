import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import {
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type {
  CenterHeaderNotification,
  CenterHeaderResourceChip,
  CenterHeaderSummary,
} from '@/features/hub/utils/centerHeaderPresentation';

const compactBreakpoint = 370;
const profilePortraitImage = require('@/assets/pp1.png');

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  background: '#F8F1E4',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldDark: '#9B741D',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.08)',
  white: '#FFFFFF',
} as const;

const chipToneColors: Record<
  CenterHeaderResourceChip['tone'],
  { icon: string; bg: string; border: string }
> = {
  gold: { icon: palette.goldDark, bg: '#FFF8EC', border: 'rgba(216,167,46,0.22)' },
  green: { icon: palette.green, bg: '#F2FAF4', border: 'rgba(62,158,106,0.18)' },
  teal: { icon: palette.tealMid, bg: palette.tealSoft, border: 'rgba(7,86,79,0.12)' },
  purple: { icon: '#8747C8', bg: '#F7F1FF', border: 'rgba(135,71,200,0.18)' },
  neutral: { icon: palette.muted, bg: '#F6F4EF', border: palette.border },
  warning: { icon: palette.amber, bg: '#FFF7EA', border: 'rgba(199,137,37,0.2)' },
};

const notificationToneColors: Record<
  CenterHeaderNotification['tone'],
  { icon: string; bg: string }
> = {
  info: { icon: palette.tealMid, bg: palette.tealSoft },
  success: { icon: palette.green, bg: '#E8F5EA' },
  warning: { icon: palette.amber, bg: '#FFF4E5' },
  urgent: { icon: '#C85A4B', bg: '#FCECEA' },
};

function pressedScale(pressed: boolean) {
  return {
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  };
}

function resolveChipIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'cash-outline': 'cash-outline',
    'happy-outline': 'happy-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'flame-outline': 'flame-outline',
    'calendar-outline': 'calendar-outline',
    'flag-outline': 'flag-outline',
    'bulb-outline': 'bulb-outline',
    'home-outline': 'home-outline',
    'people-outline': 'people-outline',
    diamond: 'diamond',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function resolveNotificationIcon(notification: CenterHeaderNotification): IconName {
  if (notification.tone === 'urgent') return 'warning-outline';
  if (notification.tone === 'success') return 'checkmark-circle-outline';
  if (notification.id === 'daily-reward-ready') return 'gift-outline';
  if (notification.id === 'player-notifications') return 'notifications-outline';
  return 'notifications-outline';
}

function useHeaderInsets() {
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight ?? 24)
      : insets.top;
  return { topInset };
}

function HeaderResourceChip({
  chip,
  compact,
}: {
  chip: CenterHeaderResourceChip;
  compact: boolean;
}) {
  const tone = chipToneColors[chip.tone];
  return (
    <View
      style={[
        styles.resourceChip,
        { backgroundColor: tone.bg, borderColor: tone.border },
        compact ? styles.resourceChipCompact : undefined,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Ionicons name={resolveChipIcon(chip.iconKey)} size={compact ? 13 : 14} color={tone.icon} />
      {!compact ? (
        <Text style={styles.resourceChipLabel} numberOfLines={1}>
          {chip.label}
        </Text>
      ) : null}
      <Text style={styles.resourceChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {chip.valueText}
      </Text>
    </View>
  );
}

function HeaderNotificationButton({
  notification,
  onPress,
}: {
  notification: CenterHeaderNotification;
  onPress: () => void;
}) {
  const colors = notificationToneColors[notification.tone];
  const showLabel = !notification.iconOnly && notification.label.trim().length > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.label}
      hitSlop={8}
      style={({ pressed }) => [styles.notificationButton, pressedScale(pressed)]}>
      <View style={[styles.notificationIconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={resolveNotificationIcon(notification)} size={18} color={colors.icon} />
      </View>
      {showLabel ? (
        <Text style={[styles.notificationLabel, { color: colors.icon }]} numberOfLines={1}>
          {notification.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function CenterHomeHeader({ header }: { header: CenterHeaderSummary }) {
  const router = useRouter();
  const { topInset } = useHeaderInsets();
  const { width } = useWindowDimensions();
  const compact = width <= compactBreakpoint;

  const openNotification = () => {
    playLightImpactHaptic();
    const route = header.notification.targetRoute ?? '/profile';
    router.push(route as Href);
  };

  return (
    <View
      style={[styles.header, { paddingTop: topInset + 12 }]}
      accessibilityRole="header"
      accessibilityLabel={header.accessibilityLabel}>
      <View style={styles.skylineOne} />
      <View style={styles.skylineTwo} />
      <View style={styles.skylineThree} />

      <View style={styles.brandRow}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {header.title}
          </Text>
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            {header.subtitle}
          </Text>
        </View>
        <HeaderNotificationButton notification={header.notification} onPress={openNotification} />
      </View>

      <View style={styles.identityRow}>
        <Pressable
          onPress={() => router.push('/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel={`${header.playerName}, ${header.displayCityName}`}
          style={({ pressed }) => [styles.identityBlock, pressedScale(pressed)]}>
          <View style={styles.avatarWrap}>
            <Image source={profilePortraitImage} style={styles.avatarImage} contentFit="contain" />
            {header.levelLabel ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText} numberOfLines={1}>
                  {header.levelLabel.replace('Sv. ', '')}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
              {header.playerName}
            </Text>
            <View style={styles.cityRow}>
              <Ionicons name="location" size={12} color={palette.tealMid} />
              <Text style={styles.cityName} numberOfLines={1} ellipsizeMode="tail">
                {header.displayCityName}
              </Text>
            </View>
            <Text style={styles.roleLabel} numberOfLines={1}>
              {header.playerRoleLabel}
            </Text>
          </View>
        </Pressable>

        <View style={styles.resourceStrip}>
          {header.resourceChips.map((chip) => (
            <HeaderResourceChip key={chip.id} chip={chip} compact={compact} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    gap: 10,
  },
  skylineOne: {
    position: 'absolute',
    right: 32,
    top: 78,
    width: 54,
    height: 86,
    backgroundColor: 'rgba(7,86,79,0.07)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  skylineTwo: {
    position: 'absolute',
    right: 88,
    top: 108,
    width: 42,
    height: 64,
    backgroundColor: 'rgba(7,86,79,0.05)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  skylineThree: {
    position: 'absolute',
    right: 148,
    top: 124,
    width: 34,
    height: 48,
    backgroundColor: 'rgba(7,86,79,0.04)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: palette.teal,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    maxWidth: '42%',
  },
  notificationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationLabel: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    minWidth: 0,
  },
  identityBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    flexShrink: 0,
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  levelBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.white,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  playerName: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: palette.text,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  cityName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: palette.tealMid,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.muted,
  },
  resourceStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: '48%',
    flexShrink: 0,
  },
  resourceChip: {
    minWidth: 0,
    maxWidth: 108,
    flexGrow: 1,
    flexBasis: '30%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 1,
    alignItems: 'flex-start',
  },
  resourceChipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  resourceChipLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  resourceChipValue: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.text,
    fontVariant: ['tabular-nums'],
    maxWidth: '100%',
  },
});
