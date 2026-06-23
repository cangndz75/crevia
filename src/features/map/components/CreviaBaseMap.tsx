import { Image } from 'expo-image';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  CREVIA_BASE_MAP_ZOOM_LIMITS,
  creviaBaseMapV1,
  creviaBaseOperationMarkers,
  creviaDistrictLayout,
} from '../data/creviaMapLayout';
import type {
  CreviaBaseMapMode,
  CreviaMapDistrictId,
  CreviaMapDistrictLayout,
  CreviaMapImageAsset,
  CreviaMapOperationMarker,
  CreviaMapPoint,
} from '../types/creviaMapTypes';
import { MapDistrictLabel } from './MapDistrictLabel';
import { MapOperationMarker } from './MapOperationMarker';
import type { MapMarkerMotionModel } from '../utils/mapMotionPresentation';
import { pickDistrictMotionModel } from '../utils/mapMarkerMotionHelper';

export type CreviaBaseMapControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusOnPoint: (point: CreviaMapPoint, zoom?: number) => void;
};

type ContentFit = 'contain' | 'cover';

type Props = {
  mode?: CreviaBaseMapMode;
  contentFit?: ContentFit;
  asset?: CreviaMapImageAsset;
  districts?: readonly CreviaMapDistrictLayout[];
  operationMarkers?: readonly CreviaMapOperationMarker[];
  districtMotionMarkers?: readonly MapMarkerMotionModel[];
  reducedMotionMode?: boolean;
  showControls?: boolean;
  style?: ViewStyle;
  onDistrictPress?: (districtId: CreviaMapDistrictId) => void;
};

type Size = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampWorklet(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function computeImageSize(
  viewport: Size,
  asset: CreviaMapImageAsset,
  contentFit: ContentFit,
): Size {
  if (viewport.width <= 0 || viewport.height <= 0 || asset.width <= 0 || asset.height <= 0) {
    return { width: 0, height: 0 };
  }

  const imageAspect = asset.width / asset.height;
  const viewportAspect = viewport.width / viewport.height;
  const shouldFitWidth =
    contentFit === 'contain'
      ? imageAspect > viewportAspect
      : imageAspect < viewportAspect;

  if (shouldFitWidth) {
    return {
      width: viewport.width,
      height: viewport.width / imageAspect,
    };
  }

  return {
    width: viewport.height * imageAspect,
    height: viewport.height,
  };
}

function clampPan(
  imageW: number,
  imageH: number,
  viewportW: number,
  viewportH: number,
  scale: number,
  tx: number,
  ty: number,
): { tx: number; ty: number } {
  if (imageW <= 0 || imageH <= 0 || viewportW <= 0 || viewportH <= 0) {
    return { tx: 0, ty: 0 };
  }

  const maxX = Math.max(0, (imageW * scale - viewportW) / 2);
  const maxY = Math.max(0, (imageH * scale - viewportH) / 2);

  return {
    tx: clamp(tx, -maxX, maxX),
    ty: clamp(ty, -maxY, maxY),
  };
}

function clampPanWorklet(
  imageW: number,
  imageH: number,
  viewportW: number,
  viewportH: number,
  scale: number,
  tx: number,
  ty: number,
): { tx: number; ty: number } {
  'worklet';
  if (imageW <= 0 || imageH <= 0 || viewportW <= 0 || viewportH <= 0) {
    return { tx: 0, ty: 0 };
  }

  const maxX = Math.max(0, (imageW * scale - viewportW) / 2);
  const maxY = Math.max(0, (imageH * scale - viewportH) / 2);

  return {
    tx: clampWorklet(tx, -maxX, maxX),
    ty: clampWorklet(ty, -maxY, maxY),
  };
}

function isMarkerVisible(marker: CreviaMapOperationMarker, zoomLevel: number): boolean {
  if (marker.minZoom && zoomLevel < marker.minZoom) {
    return false;
  }

  const kind = marker.kind ?? 'main';

  if (zoomLevel < 1.25) {
    return kind === 'main';
  }

  if (zoomLevel < 1.75) {
    return kind === 'main' || kind === 'pulse';
  }

  return true;
}

export const CreviaBaseMap = forwardRef<CreviaBaseMapControls, Props>(
  function CreviaBaseMap(
    {
      mode = 'card',
      contentFit = 'contain',
      asset = creviaBaseMapV1,
      districts = creviaDistrictLayout,
      operationMarkers = creviaBaseOperationMarkers,
      districtMotionMarkers = [],
      reducedMotionMode = false,
      showControls = false,
      style,
      onDistrictPress,
    },
    ref,
  ) {
    const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);

    const imageSize = useMemo(
      () => computeImageSize(viewport, asset, contentFit),
      [asset, contentFit, viewport],
    );

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const imageW = useSharedValue(0);
    const imageH = useSharedValue(0);
    const viewportW = useSharedValue(0);
    const viewportH = useSharedValue(0);

    useEffect(() => {
      imageW.value = imageSize.width;
      imageH.value = imageSize.height;
      viewportW.value = viewport.width;
      viewportH.value = viewport.height;
    }, [imageH, imageSize.height, imageSize.width, imageW, viewport.height, viewport.width, viewportH, viewportW]);

    const syncZoomLevel = useCallback((nextZoom: number) => {
      setZoomLevel(Number(nextZoom.toFixed(2)));
    }, []);

    const reset = useCallback(() => {
      scale.value = withTiming(1, { duration: 180 });
      savedScale.value = 1;
      translateX.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      setZoomLevel(1);
    }, [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

    useEffect(() => {
      reset();
    }, [asset.source, contentFit, imageSize.height, imageSize.width, reset]);

    const applyZoom = useCallback(
      (multiplier: number) => {
        const next = clamp(
          scale.value * multiplier,
          CREVIA_BASE_MAP_ZOOM_LIMITS.min,
          CREVIA_BASE_MAP_ZOOM_LIMITS.max,
        );
        const p = clampPan(
          imageW.value,
          imageH.value,
          viewportW.value,
          viewportH.value,
          next,
          translateX.value,
          translateY.value,
        );

        scale.value = withTiming(next, { duration: 160 });
        savedScale.value = next;
        translateX.value = withTiming(p.tx, { duration: 160 });
        translateY.value = withTiming(p.ty, { duration: 160 });
        savedTranslateX.value = p.tx;
        savedTranslateY.value = p.ty;
        syncZoomLevel(next);
      },
      [
        imageH,
        imageW,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        syncZoomLevel,
        translateX,
        translateY,
        viewportH,
        viewportW,
      ],
    );

    const focusOnPoint = useCallback(
      (point: CreviaMapPoint, zoom = 1.85) => {
        const next = clamp(
          zoom,
          CREVIA_BASE_MAP_ZOOM_LIMITS.min,
          CREVIA_BASE_MAP_ZOOM_LIMITS.max,
        );
        if (imageW.value <= 0 || imageH.value <= 0) {
          return;
        }

        const pointX = (clamp(point.x, 0, 1000) / 1000) * imageW.value;
        const pointY = (clamp(point.y, 0, 1000) / 1000) * imageH.value;
        const targetX = -(pointX - imageW.value / 2) * next;
        const targetY = -(pointY - imageH.value / 2) * next;
        const p = clampPan(
          imageW.value,
          imageH.value,
          viewportW.value,
          viewportH.value,
          next,
          targetX,
          targetY,
        );

        scale.value = withTiming(next, { duration: 260 });
        savedScale.value = next;
        translateX.value = withTiming(p.tx, { duration: 260 });
        translateY.value = withTiming(p.ty, { duration: 260 });
        savedTranslateX.value = p.tx;
        savedTranslateY.value = p.ty;
        syncZoomLevel(next);
      },
      [
        imageH,
        imageW,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        syncZoomLevel,
        translateX,
        translateY,
        viewportH,
        viewportW,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => applyZoom(1.18),
        zoomOut: () => applyZoom(1 / 1.18),
        reset,
        focusOnPoint,
      }),
      [applyZoom, focusOnPoint, reset],
    );

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setViewport({ width, height });
    }, []);

    const pinchGesture = useMemo(
      () =>
        Gesture.Pinch()
          .onStart(() => {
            savedScale.value = scale.value;
          })
          .onUpdate((event) => {
            if (!Number.isFinite(event.scale) || event.scale <= 0) {
              return;
            }

            const next = clampWorklet(
              savedScale.value * event.scale,
              CREVIA_BASE_MAP_ZOOM_LIMITS.min,
              CREVIA_BASE_MAP_ZOOM_LIMITS.max,
            );
            scale.value = next;

            const p = clampPanWorklet(
              imageW.value,
              imageH.value,
              viewportW.value,
              viewportH.value,
              next,
              translateX.value,
              translateY.value,
            );
            translateX.value = p.tx;
            translateY.value = p.ty;
          })
          .onEnd(() => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            runOnJS(syncZoomLevel)(scale.value);
          }),
      [
        imageH,
        imageW,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        syncZoomLevel,
        translateX,
        translateY,
        viewportH,
        viewportW,
      ],
    );

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .maxPointers(1)
          .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
          })
          .onUpdate((event) => {
            const p = clampPanWorklet(
              imageW.value,
              imageH.value,
              viewportW.value,
              viewportH.value,
              scale.value,
              savedTranslateX.value + event.translationX,
              savedTranslateY.value + event.translationY,
            );
            translateX.value = p.tx;
            translateY.value = p.ty;
          })
          .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
          }),
      [
        imageH,
        imageW,
        savedTranslateX,
        savedTranslateY,
        scale,
        translateX,
        translateY,
        viewportH,
        viewportW,
      ],
    );

    const doubleTapGesture = useMemo(
      () =>
        Gesture.Tap()
          .numberOfTaps(2)
          .onEnd((event) => {
            const next =
              scale.value < 1.45
                ? 1.75
                : scale.value < 2.05
                  ? 2.2
                  : 1;

            const localX = (event.x - viewportW.value / 2 - translateX.value) / scale.value + imageW.value / 2;
            const localY = (event.y - viewportH.value / 2 - translateY.value) / scale.value + imageH.value / 2;
            const targetX = next === 1 ? 0 : -(localX - imageW.value / 2) * next;
            const targetY = next === 1 ? 0 : -(localY - imageH.value / 2) * next;
            const p = clampPanWorklet(
              imageW.value,
              imageH.value,
              viewportW.value,
              viewportH.value,
              next,
              targetX,
              targetY,
            );

            scale.value = withTiming(next, { duration: 220 });
            translateX.value = withTiming(p.tx, { duration: 220 });
            translateY.value = withTiming(p.ty, { duration: 220 });
            savedScale.value = next;
            savedTranslateX.value = p.tx;
            savedTranslateY.value = p.ty;
            runOnJS(syncZoomLevel)(next);
          }),
      [
        imageH,
        imageW,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        syncZoomLevel,
        translateX,
        translateY,
        viewportH,
        viewportW,
      ],
    );

    const gesture = useMemo(
      () => Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture),
      [doubleTapGesture, panGesture, pinchGesture],
    );

    const mapTransformStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    const visibleMarkers = useMemo(
      () => operationMarkers.filter((marker) => isMarkerVisible(marker, zoomLevel)),
      [operationMarkers, zoomLevel],
    );

    const markerMotionById = useMemo(() => {
      const map = new Map<string, MapMarkerMotionModel>();
      for (const motion of districtMotionMarkers) {
        if (motion.markerId) {
          map.set(motion.markerId, motion);
        }
      }
      const activeOperation = districtMotionMarkers.find(
        (motion) => motion.kind === 'active_operation',
      );
      if (activeOperation && !activeOperation.markerId) {
        for (const marker of visibleMarkers) {
          if (marker.kind === 'main' || marker.kind === 'pulse') {
            map.set(marker.id, activeOperation);
          }
        }
      }
      return map;
    }, [districtMotionMarkers, visibleMarkers]);

    const ready = imageSize.width > 0 && imageSize.height > 0;

    return (
      <View
        style={[
          styles.shell,
          mode === 'fullscreen' ? styles.fullscreenShell : styles.cardShell,
          style,
        ]}>
        <View style={styles.viewport} onLayout={handleLayout}>
          {ready ? (
            <GestureDetector gesture={gesture}>
              <View style={styles.stage}>
                <Animated.View
                  style={[
                    styles.mapLayer,
                    {
                      width: imageSize.width,
                      height: imageSize.height,
                    },
                    mapTransformStyle,
                  ]}>
                  <Image
                    source={asset.source}
                    style={StyleSheet.absoluteFill}
                    contentFit="fill"
                    cachePolicy="memory-disk"
                    transition={0}
                    priority="high"
                    recyclingKey={`crevia-base-map-${asset.source}`}
                    accessibilityIgnoresInvertColors
                  />
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {districts.map((district) => (
                      <MapDistrictLabel
                        key={district.id}
                        district={district}
                        motionModel={pickDistrictMotionModel(
                          districtMotionMarkers,
                          district.id as CreviaMapDistrictId,
                        )}
                        reducedMotionMode={reducedMotionMode}
                        onPress={onDistrictPress}
                      />
                    ))}
                    {visibleMarkers.map((marker) => (
                      <MapOperationMarker
                        key={marker.id}
                        marker={marker}
                        motionModel={markerMotionById.get(marker.id) ?? null}
                        reducedMotionMode={reducedMotionMode}
                      />
                    ))}
                  </View>
                </Animated.View>
              </View>
            </GestureDetector>
          ) : null}
        </View>

        {showControls ? (
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => applyZoom(1.18)}
              accessibilityLabel="Haritayi yakinlastir">
              <Text style={styles.controlText}>+</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => applyZoom(1 / 1.18)}
              accessibilityLabel="Haritayi uzaklastir">
              <Text style={styles.controlText}>-</Text>
            </Pressable>
            <Pressable
              style={styles.resetButton}
              onPress={reset}
              accessibilityLabel="Haritayi sifirla">
              <Text style={styles.resetText}>1x</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FCF9F2',
  },
  cardShell: {
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fullscreenShell: {
    flex: 1,
    borderRadius: 0,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F4EFE4',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLayer: {
    position: 'relative',
  },
  controls: {
    position: 'absolute',
    right: 14,
    top: 14,
    gap: 8,
    zIndex: 12,
  },
  controlButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
  },
  controlText: {
    color: '#005B53',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  resetButton: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(216, 162, 29, 0.35)',
  },
  resetText: {
    color: '#B8871D',
    fontSize: 12,
    fontWeight: '800',
  },
});
