import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { MapObservationPresentationModel } from '@/features/map/presentation/mapObservationPresentation';
import { observationScanStatusLine } from '@/features/map/presentation/mapObservationPresentation';
import type { MapObservationModeState } from '@/features/map/presentation/mapObservationPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

import { ObservationConfidenceMeter } from './ObservationConfidenceMeter';
import { ObservationHotspotMarker } from './ObservationHotspotMarker';
import { ObservationResultSheet } from './ObservationResultSheet';
import { ObservationScanRing } from './ObservationScanRing';
import { ObservationStatusChip } from './ObservationStatusChip';

type Props = {
  model: MapObservationPresentationModel;
  mode: MapObservationModeState;
  confidence: number;
  scanningPhase: number;
  showResultSheet: boolean;
  pinsRevealed: boolean;
  energyRemaining: number;
  reducedMotion?: boolean;
  onApplyRecommendation: () => void;
  onFocusMap: () => void;
  onDismissResult: () => void;
};

export function MapObservationOverlay({
  model,
  mode,
  confidence,
  scanningPhase,
  showResultSheet,
  pinsRevealed,
  energyRemaining,
  reducedMotion = false,
  onApplyRecommendation,
  onFocusMap,
  onDismissResult,
}: Props) {
  const overlayOpacity = useSharedValue(0);

  const visible =
    mode === 'scanning' ||
    mode === 'completed' ||
    showResultSheet ||
    mode === 'blocked' ||
    mode === 'cooldown' ||
    mode === 'insufficient_energy';

  useEffect(() => {
    overlayOpacity.value = withTiming(visible ? 0.35 : 0, {
      duration: reducedMotion ? 60 : 180,
      easing: Easing.out(Easing.quad),
    });
  }, [overlayOpacity, reducedMotion, visible]);

  const dimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible && !showResultSheet) return null;

  const statusLine = observationScanStatusLine(mode, scanningPhase);
  const confidenceAnimating = mode === 'completed' || confidence > model.initialConfidence;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />

      <View pointerEvents="box-none" style={styles.mapLayer}>
        <ObservationScanRing
          centerX={model.scanCenter.x}
          centerY={model.scanCenter.y}
          active={mode === 'scanning'}
          reducedMotion={reducedMotion}
        />
        {model.hotspots.map((hotspot) => (
          <ObservationHotspotMarker
            key={hotspot.id}
            x={hotspot.x}
            y={hotspot.y}
            revealed={pinsRevealed}
            scanning={mode === 'scanning'}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>

      <View pointerEvents="box-none" style={styles.hud}>
        <View style={styles.chipRow}>
          <ObservationStatusChip label="Saha Gözü Aktif" />
          <ObservationStatusChip label={model.targetDistrictName} tone="muted" />
        </View>
        <View style={styles.chipRow}>
          <ObservationStatusChip
            label={statusLine}
            tone={mode === 'blocked' || mode === 'insufficient_energy' ? 'warning' : 'active'}
          />
          <ObservationStatusChip
            label={`Saha Gözü ${energyRemaining}/${model.energyMax}`}
            tone="muted"
          />
        </View>
        <View style={styles.metaRow}>
          <ObservationConfidenceMeter
            initial={model.initialConfidence}
            current={confidence}
            animate={confidenceAnimating}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.hotspotMeta}>{model.hotSpotCount} sıcak nokta</Text>
        </View>
        <Text style={styles.costMeta}>Tarama maliyeti: {model.scanCost}</Text>
        {mode === 'completed' ? (
          <Text style={styles.readyMeta}>Öneri hazır</Text>
        ) : null}
      </View>

      <ObservationResultSheet
        model={model}
        visible={showResultSheet}
        reducedMotion={reducedMotion}
        onApplyRecommendation={onApplyRecommendation}
        onFocusMap={onFocusMap}
        onDismiss={onDismissResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#031614',
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    gap: 8,
    pointerEvents: 'none',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  hotspotMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.gold,
    letterSpacing: 0.3,
  },
  costMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: mapUi.textMuted,
  },
  readyMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.teal,
  },
});
