import { StyleSheet, Text, View } from 'react-native';

import type { DistrictMapVisualStateMap } from '@/core/map/mapDistrictVisualState';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';
import { mapUi } from '@/features/map/utils/mapUiTokens';

const TONE_COLOR: Record<
  DistrictMapVisualStateMap['statusChips'][number]['tone'],
  { bg: string; border: string; text: string }
> = {
  stable: { bg: 'rgba(255,255,255,0.9)', border: mapUi.border, text: mapUi.textSecondary },
  risk: { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.28)', text: mapUi.riskHigh },
  recovery: { bg: 'rgba(216, 167, 46, 0.14)', border: mapUi.goldBorder, text: mapUi.gold },
  active: { bg: 'rgba(20, 184, 166, 0.14)', border: mapUi.borderStrong, text: mapUi.tealDark },
  social: { bg: 'rgba(90, 123, 168, 0.12)', border: 'rgba(90, 123, 168, 0.28)', text: '#5A7BA8' },
  neutral: { bg: 'rgba(255,255,255,0.92)', border: mapUi.border, text: mapUi.teal },
};

type Props = {
  model: DistrictMapVisualStateMap | null | undefined;
  topOffset?: number;
};

export function MapDistrictVisualStateStrip({ model, topOffset = 108 }: Props) {
  if (!model?.statusChips.length) return null;

  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="none">
      {model.statusChips.map((chip) => {
        const palette = TONE_COLOR[chip.tone];
        return (
          <View
            key={chip.id}
            style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <Text style={[styles.district, { color: palette.text }]} numberOfLines={1}>
              {getMapDistrictLabel(chip.districtId)}
            </Text>
            <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
              {chip.label}
            </Text>
          </View>
        );
      })}
      {model.mapHintLine ? (
        <Text style={styles.hint} numberOfLines={2}>
          {model.mapHintLine}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 72,
    gap: 6,
    zIndex: 3,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  district: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: 'rgba(4, 58, 54, 0.82)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    maxWidth: '100%',
  },
});
