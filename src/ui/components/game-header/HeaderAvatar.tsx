import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { hubAssets } from '@/features/hub/utils/hubAssets';
import { colors } from '@/ui/theme/colors';

type HeaderAvatarProps = {
  size?: number;
  level?: number;
  showLevelBadge?: boolean;
  borderColor?: string;
  style?: ViewStyle;
};

export function HeaderAvatar({
  size = 40,
  level,
  showLevelBadge = false,
  borderColor = colors.primary,
  style,
}: HeaderAvatarProps) {
  const radius = size / 2;
  const badgeSize = Math.max(16, Math.round(size * 0.36));

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={hubAssets.playerAvatar}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor,
          },
        ]}
        contentFit="cover"
      />
      {showLevelBadge && level != null ? (
        <View
          style={[
            styles.levelBadge,
            {
              minWidth: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}>
          <Text style={[styles.levelText, { fontSize: badgeSize * 0.5 }]}>
            {level}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  image: {
    borderWidth: 2,
    backgroundColor: colors.primaryMuted,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: colors.hubGold,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  levelText: {
    fontWeight: '800',
    color: '#1C1C1E',
  },
});
