import type { ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';

type MainOperationCardBannerProps = {
  source: ImageSource;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  overlayColors?: readonly [string, string, ...string[]];
};

export function MainOperationCardBanner({
  source,
  height = 56,
  borderRadius = 12,
  style,
  overlayColors = ['rgba(255,253,247,0.1)', 'rgba(255,253,247,0.92)'],
}: MainOperationCardBannerProps) {
  return (
    <View style={[styles.wrap, { height, borderRadius }, style]}>
      <HubAssetImage
        source={source}
        containerStyle={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={overlayColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#E8E2D8',
  },
});
