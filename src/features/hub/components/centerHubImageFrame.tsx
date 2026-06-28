import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';

type CenterHubImageFrameProps = {
  source: ImageProps['source'];
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  vignette?: boolean;
};

const DEFAULT_GRADIENT = ['#0B1919', '#132A29', '#050D0E'] as const;

/** Transparent PNG checkerboard'u gizlemek için gradient zemin + vignette. */
export function CenterHubImageFrame({
  source,
  style,
  imageStyle,
  gradientColors = DEFAULT_GRADIENT,
  vignette = true,
}: CenterHubImageFrameProps) {
  return (
    <View style={[styles.frame, style]}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        contentFit="cover"
        transition={160}
        cachePolicy="memory-disk"
      />
      {vignette ? (
        <LinearGradient
          colors={['rgba(5,13,14,0.08)', 'rgba(5,13,14,0.42)']}
          style={styles.vignette}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#0B1919',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});
