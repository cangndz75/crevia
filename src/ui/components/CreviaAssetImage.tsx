import { Image, type ImageSource } from 'expo-image';
import { StyleProp, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';

type Props = {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
};

/** Crevia PNG görselleri — `expo-image` sarmalayıcı */
export function CreviaAssetImage({
  source,
  style,
  containerStyle,
  contentFit = 'contain',
}: Props) {
  return (
    <View style={containerStyle}>
      <Image
        source={source}
        style={[styles.image, style]}
        contentFit={contentFit}
        transition={180}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
