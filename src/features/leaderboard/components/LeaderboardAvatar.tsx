import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { getLeaderboardAvatarSource } from '@/features/leaderboard/utils/leaderboardAvatars';
import { colors } from '@/ui/theme/colors';

type LeaderboardAvatarProps = {
  entryKey: string;
  size: number;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
};

export function LeaderboardAvatar({
  entryKey,
  size,
  borderColor = colors.surface,
  borderWidth = 3,
  style,
}: LeaderboardAvatarProps) {
  const radius = size / 2;
  const innerSize = Math.max(0, size - borderWidth * 2);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: borderWidth > 0 ? borderColor : 'transparent',
          borderWidth,
        },
        style,
      ]}>
      <Image
        source={getLeaderboardAvatarSource(entryKey)}
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
        }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
