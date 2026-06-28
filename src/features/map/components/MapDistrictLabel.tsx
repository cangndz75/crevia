import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapMarkerMotionModel } from '../utils/mapMotionPresentation';
import { MapDistrictMotionOverlay } from '../utils/mapMarkerMotionHelper';
import { mapPointToAbsoluteOverlayStyle } from '../utils/mapCoordinates';
import type { CreviaMapDistrictLayout } from '../types/creviaMapTypes';
import { mapUi } from '../utils/mapUiTokens';

type Props = {
  district: CreviaMapDistrictLayout;
  motionModel?: MapMarkerMotionModel | null;
  reducedMotionMode?: boolean;
  selected?: boolean;
  traitLabel?: string;
  emphasize?: boolean;
  onPress?: (districtId: CreviaMapDistrictLayout['id']) => void;
};

const DISTRICT_ICON: Record<CreviaMapDistrictLayout['id'], keyof typeof Ionicons.glyphMap> = {
  merkez: 'business-outline',
  cumhuriyet: 'home-outline',
  sanayi: 'business',
  istasyon: 'train-outline',
  yesilvadi: 'leaf-outline',
};

export const MapDistrictLabel = memo(function MapDistrictLabel({
  district,
  motionModel = null,
  reducedMotionMode = false,
  selected = false,
  traitLabel,
  emphasize = false,
  onPress,
}: Props) {
  const LabelContainer = onPress ? Pressable : View;
  const showTrait = Boolean(traitLabel?.trim()) && (selected || emphasize);
  const accessibilityLabel =
    motionModel?.accessibilityLabel ??
    (onPress
      ? `${district.label} mahallesi${traitLabel ? `, ${traitLabel}` : ''}`
      : undefined);

  return (
    <View
      pointerEvents={onPress ? 'auto' : 'none'}
      style={[
        styles.anchor,
        mapPointToAbsoluteOverlayStyle(district.center),
        selected && styles.anchorSelected,
      ]}>
      <MapDistrictMotionOverlay
        motionModel={motionModel}
        reducedMotionMode={reducedMotionMode}
      />
      <LabelContainer
        onPress={onPress ? () => onPress(district.id) : undefined}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        style={[
          styles.label,
          {
            borderColor: selected ? mapUi.gold : district.color,
            backgroundColor: selected ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.9)',
            opacity: emphasize || selected ? 1 : 0.82,
          },
          selected && styles.labelSelected,
        ]}>
        <Ionicons
          name={DISTRICT_ICON[district.id]}
          size={selected ? 16 : 15}
          color={selected ? mapUi.tealDark : district.color}
        />
        <Text
          style={[
            styles.labelText,
            {
              color: selected ? mapUi.tealDark : (district.labelTextColor ?? district.color),
              fontWeight: selected || emphasize ? '900' : '800',
            },
          ]}
          numberOfLines={1}
          selectable={false}>
          {district.label}
        </Text>
      </LabelContainer>
      {showTrait ? (
        <View style={styles.traitChip}>
          <Text style={styles.traitText} numberOfLines={1}>
            {traitLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    transform: [{ translateX: -45 }, { translateY: -15 }],
    zIndex: 6,
    alignItems: 'center',
  },
  anchorSelected: {
    zIndex: 8,
    transform: [{ translateX: -45 }, { translateY: -17 }, { scale: 1.04 }],
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  labelSelected: {
    borderWidth: 1.5,
    shadowColor: mapUi.gold,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  labelText: {
    fontSize: 12,
    letterSpacing: 0,
  },
  traitChip: {
    marginTop: 4,
    maxWidth: 108,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 22, 20, 0.82)',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  traitText: {
    fontSize: 9,
    fontWeight: '800',
    color: mapUi.gold,
    letterSpacing: 0.15,
  },
});
