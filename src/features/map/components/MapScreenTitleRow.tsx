import { Pressable, StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { colors } from '@/ui/theme/colors';

type Props = {
  onInfoPress?: () => void;
};

export function MapScreenTitleRow({ onInfoPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        Operasyon Haritası
      </Text>
      {onInfoPress ? (
        <Pressable
          style={styles.infoBtn}
          onPress={onInfoPress}
          accessibilityLabel="Harita rehberi"
          hitSlop={8}>
          <CreviaAssetImage
            source={creviaAssets.icons.knowledge.operationGuide}
            containerStyle={styles.infoAsset}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.headerTealDark,
    letterSpacing: -0.5,
  },
  infoAsset: {
    width: 24,
    height: 24,
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mapUi.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
