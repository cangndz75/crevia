import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  CREVIA_GAME_LOGO,
  CREVIA_GAME_LOGO_ASPECT,
} from '@/core/brand/brandAssets';

type CreviaGameLogoProps = {
  width: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function CreviaGameLogo({
  width,
  style,
  accessibilityLabel = 'Crevia',
}: CreviaGameLogoProps) {
  const height = Math.round(width / CREVIA_GAME_LOGO_ASPECT);

  return (
    <View style={[styles.wrap, { width, height }, style]} accessibilityRole="image">
      <Image
        source={CREVIA_GAME_LOGO}
        style={{ width, height }}
        contentFit="contain"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
