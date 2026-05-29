import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import type { LeaderboardAvatarModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { getLeaderboardAvatarSource } from '@/features/leaderboard/utils/leaderboardAvatars';
import { getInitialsPalette } from '@/features/leaderboard/utils/podiumAvatarHelpers';
import { colors } from '@/ui/theme/colors';

const TONE_COLORS: Record<
  LeaderboardAvatarModel['tone'],
  { bg: string; text: string; border: string }
> = {
  teal: { bg: colors.primaryMuted, text: colors.primary, border: 'rgba(26,143,138,0.25)' },
  mint: { bg: '#E6F7F4', text: '#2BB5A8', border: 'rgba(43,181,168,0.25)' },
  amber: { bg: colors.hubGoldMuted, text: colors.hubGoldDark, border: 'rgba(212,160,23,0.28)' },
  green: { bg: colors.successMuted, text: colors.success, border: 'rgba(34,197,94,0.22)' },
  blue: { bg: colors.secondaryMuted, text: colors.secondary, border: 'rgba(59,130,246,0.22)' },
};

type Props = {
  avatar: LeaderboardAvatarModel;
  size: number;
  highlighted?: boolean;
  style?: ViewStyle;
};

export function LeaderboardDynamicAvatar({
  avatar,
  size,
  highlighted = false,
  style,
}: Props) {
  const [uriFailed, setUriFailed] = useState(false);
  const palette = getInitialsPalette(avatar.portraitKey);
  const tone = TONE_COLORS[avatar.tone];
  const borderWidth = highlighted ? 2.5 : 2;
  const innerSize = Math.max(0, size - borderWidth * 2);
  const outerRadius = size / 2;
  const innerRadius = innerSize / 2;
  const uri = avatar.imageUrl?.trim();
  const hasUri = Boolean(uri);
  const showRemote = hasUri && !uriFailed;
  const showInitialsOnly = hasUri && uriFailed;
  const fontSize = Math.max(10, Math.round(innerSize * 0.34));

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: outerRadius,
          borderColor: highlighted ? colors.primary : tone.border,
          borderWidth,
        },
        style,
      ]}>
      {showRemote && uri ? (
        <RNImage
          source={{ uri }}
          style={{ width: innerSize, height: innerSize, borderRadius: innerRadius }}
          resizeMode="cover"
          onError={() => setUriFailed(true)}
          accessibilityLabel={avatar.displayName}
        />
      ) : null}

      {showInitialsOnly ? (
        <View
          style={[
            styles.initials,
            { width: innerSize, height: innerSize, borderRadius: innerRadius, backgroundColor: palette.bg },
          ]}>
          <Text style={[styles.initialsText, { color: palette.text, fontSize }]}>
            {avatar.initials}
          </Text>
        </View>
      ) : null}

      {!hasUri ? (
        <Image
          source={getLeaderboardAvatarSource(avatar.portraitKey)}
          style={{ width: innerSize, height: innerSize, borderRadius: innerRadius }}
          contentFit="cover"
          accessibilityLabel={avatar.displayName}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
