import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mapPointToAbsoluteOverlayStyle } from '../utils/mapCoordinates';
import type { CreviaMapDistrictLayout } from '../types/creviaMapTypes';

type Props = {
  district: CreviaMapDistrictLayout;
  onPress?: (districtId: CreviaMapDistrictLayout['id']) => void;
};

const DISTRICT_ICON: Record<CreviaMapDistrictLayout['id'], keyof typeof Ionicons.glyphMap> = {
  merkez: 'business-outline',
  cumhuriyet: 'home-outline',
  sanayi: 'business',
  istasyon: 'train-outline',
  yesilvadi: 'leaf-outline',
};

export const MapDistrictLabel = memo(function MapDistrictLabel({ district, onPress }: Props) {
  const LabelContainer = onPress ? Pressable : View;

  return (
    <View
      pointerEvents={onPress ? 'auto' : 'none'}
      style={[
        styles.anchor,
        mapPointToAbsoluteOverlayStyle(district.center),
      ]}>
      <LabelContainer
        onPress={onPress ? () => onPress(district.id) : undefined}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `${district.label} mahallesini ac` : undefined}
        style={[styles.label, { borderColor: district.color }]}>
        <Ionicons name={DISTRICT_ICON[district.id]} size={15} color={district.color} />
        <Text
          style={[styles.labelText, { color: district.labelTextColor ?? district.color }]}
          numberOfLines={1}
          selectable={false}>
          {district.label}
        </Text>
      </LabelContainer>
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    transform: [{ translateX: -45 }, { translateY: -15 }],
    zIndex: 6,
  },
  label: {
    minWidth: 90,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
