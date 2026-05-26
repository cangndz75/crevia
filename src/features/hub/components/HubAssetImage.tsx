import { Image, type ImageSource } from 'expo-image';
import { StyleProp, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';

type HubAssetImageProps = {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
};

export function HubAssetImage({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
}: HubAssetImageProps) {
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
