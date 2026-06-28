import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapControlStackProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onLayersPress: () => void;
  layersActive?: boolean;
};

export function MapControlStack({
  onZoomIn,
  onZoomOut,
  onLocate,
  onLayersPress,
  layersActive = false,
}: MapControlStackProps) {
  return (
    <View style={styles.stack}>
      <Pressable style={styles.btn} onPress={onZoomIn} accessibilityLabel="Yakınlaştır">
        <Ionicons name="add" size={22} color={mapUi.textLight} />
      </Pressable>
      <Pressable style={styles.btn} onPress={onZoomOut} accessibilityLabel="Uzaklaştır">
        <Ionicons name="remove" size={22} color={mapUi.textLight} />
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnAccent]}
        onPress={onLocate}
        accessibilityLabel="Haritayı ortala">
        <Ionicons name="locate-outline" size={20} color={mapUi.gold} />
      </Pressable>
      <Pressable
        style={[styles.btn, layersActive && styles.btnActive]}
        onPress={onLayersPress}
        accessibilityLabel="Harita katmanları">
        <Ionicons
          name="layers-outline"
          size={20}
          color={layersActive ? mapUi.gold : mapUi.textLight}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: 14,
    top: '34%',
    gap: 10,
    zIndex: 20,
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mapUi.glass,
    borderWidth: 1,
    borderColor: mapUi.border,
    ...mapUi.controlShadow,
  },
  btnAccent: {
    borderColor: mapUi.goldBorder,
  },
  btnActive: {
    borderColor: mapUi.gold,
    backgroundColor: mapUi.goldSoftDark,
    shadowColor: mapUi.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
