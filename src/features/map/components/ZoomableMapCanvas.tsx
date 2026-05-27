import { Image } from 'expo-image';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { MapImageAsset } from '../data/mapAssets';
import { MapDisplaySizeContext } from './MapDisplaySizeContext';

export type ZoomableMapControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

type ZoomLimits = {
  minScale: number;
  maxScale: number;
};

type Props = {
  asset: MapImageAsset;
  zoomLimits: ZoomLimits;
  children?: React.ReactNode;
};

function clampWorklet(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function computeFitSize(
  viewportW: number,
  viewportH: number,
  imageW: number,
  imageH: number,
): { width: number; height: number } {
  if (viewportW <= 0 || viewportH <= 0 || imageW <= 0 || imageH <= 0) {
    return { width: 0, height: 0 };
  }
  const imageAspect = imageW / imageH;
  const viewportAspect = viewportW / viewportH;

  if (imageAspect > viewportAspect) {
    const width = viewportW;
    return { width, height: width / imageAspect };
  }

  const height = viewportH;
  return { width: height * imageAspect, height };
}

function clampPan(
  fitW: number,
  fitH: number,
  vpW: number,
  vpH: number,
  nextScale: number,
  tx: number,
  ty: number,
): { tx: number; ty: number } {
  if (fitW <= 0 || fitH <= 0 || vpW <= 0 || vpH <= 0) {
    return { tx: 0, ty: 0 };
  }
  const renderedW = fitW * nextScale;
  const renderedH = fitH * nextScale;
  const mX = Math.max(0, (renderedW - vpW) / 2);
  const mY = Math.max(0, (renderedH - vpH) / 2);
  return {
    tx: Math.min(mX, Math.max(-mX, tx)),
    ty: Math.min(mY, Math.max(-mY, ty)),
  };
}

function clampPanWorklet(
  fitW: number,
  fitH: number,
  vpW: number,
  vpH: number,
  nextScale: number,
  tx: number,
  ty: number,
): { tx: number; ty: number } {
  'worklet';
  if (fitW <= 0 || fitH <= 0 || vpW <= 0 || vpH <= 0) {
    return { tx: 0, ty: 0 };
  }
  const renderedW = fitW * nextScale;
  const renderedH = fitH * nextScale;
  const mX = Math.max(0, (renderedW - vpW) / 2);
  const mY = Math.max(0, (renderedH - vpH) / 2);
  return {
    tx: clampWorklet(tx, -mX, mX),
    ty: clampWorklet(ty, -mY, mY),
  };
}

export const ZoomableMapCanvas = forwardRef<ZoomableMapControls, Props>(
  function ZoomableMapCanvas({ asset, zoomLimits, children }, ref) {
    const [viewport, setViewport] = useState({ width: 0, height: 0 });

    const fitSize = useMemo(
      () => computeFitSize(viewport.width, viewport.height, asset.width, asset.height),
      [asset.height, asset.width, viewport.height, viewport.width],
    );

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const fitW = useSharedValue(0);
    const fitH = useSharedValue(0);
    const vpW = useSharedValue(0);
    const vpH = useSharedValue(0);
    const minScaleLimit = useSharedValue(zoomLimits.minScale);
    const maxScaleLimit = useSharedValue(zoomLimits.maxScale);

    useEffect(() => {
      fitW.value = fitSize.width;
      fitH.value = fitSize.height;
      vpW.value = viewport.width;
      vpH.value = viewport.height;
      minScaleLimit.value = zoomLimits.minScale;
      maxScaleLimit.value = zoomLimits.maxScale;
    }, [
      fitH,
      fitSize.height,
      fitSize.width,
      fitW,
      maxScaleLimit,
      minScaleLimit,
      vpH,
      vpW,
      viewport.height,
      viewport.width,
      zoomLimits.maxScale,
      zoomLimits.minScale,
    ]);

    const resetTransform = useCallback(() => {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }, [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

    useEffect(() => {
      resetTransform();
    }, [asset.src, fitSize.width, fitSize.height, resetTransform]);

    const applyZoom = useCallback(
      (multiplier: number) => {
        const raw = scale.value * multiplier;
        const next = Math.min(
          maxScaleLimit.value,
          Math.max(minScaleLimit.value, raw),
        );
        if (!Number.isFinite(next)) return;

        scale.value = withTiming(next, { duration: 150 });
        savedScale.value = next;

        const p = clampPan(
          fitW.value,
          fitH.value,
          vpW.value,
          vpH.value,
          next,
          translateX.value,
          translateY.value,
        );
        translateX.value = p.tx;
        translateY.value = p.ty;
        savedTranslateX.value = p.tx;
        savedTranslateY.value = p.ty;
      },
      [
        fitH,
        fitW,
        maxScaleLimit,
        minScaleLimit,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        translateX,
        translateY,
        vpH,
        vpW,
      ],
    );

    const zoomIn = useCallback(() => applyZoom(1.15), [applyZoom]);
    const zoomOut = useCallback(() => applyZoom(1 / 1.15), [applyZoom]);

    const resetAnimated = useCallback(() => {
      scale.value = withTiming(1, { duration: 200 });
      savedScale.value = 1;
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }, [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

    useImperativeHandle(
      ref,
      () => ({ zoomIn, zoomOut, reset: resetAnimated }),
      [resetAnimated, zoomIn, zoomOut],
    );

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setViewport({ width, height });
    }, []);

    const pinchGesture = useMemo(
      () =>
        Gesture.Pinch()
          .onStart(() => {
            savedScale.value = scale.value;
          })
          .onUpdate((e) => {
            if (!Number.isFinite(e.scale) || e.scale <= 0) return;

            const next = clampWorklet(
              savedScale.value * e.scale,
              minScaleLimit.value,
              maxScaleLimit.value,
            );
            if (!Number.isFinite(next)) return;

            scale.value = next;
            const p = clampPanWorklet(
              fitW.value,
              fitH.value,
              vpW.value,
              vpH.value,
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
          }),
      [
        fitH,
        fitW,
        maxScaleLimit,
        minScaleLimit,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        translateX,
        translateY,
        vpH,
        vpW,
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
          .onUpdate((e) => {
            const p = clampPanWorklet(
              fitW.value,
              fitH.value,
              vpW.value,
              vpH.value,
              scale.value,
              savedTranslateX.value + e.translationX,
              savedTranslateY.value + e.translationY,
            );
            translateX.value = p.tx;
            translateY.value = p.ty;
          })
          .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
          }),
      [
        fitH,
        fitW,
        savedTranslateX,
        savedTranslateY,
        scale,
        translateX,
        translateY,
        vpH,
        vpW,
      ],
    );

    const composed = useMemo(
      () => Gesture.Simultaneous(pinchGesture, panGesture),
      [panGesture, pinchGesture],
    );

    const mapStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    const ready = fitSize.width > 0 && fitSize.height > 0;

    return (
      <View style={styles.viewport} onLayout={handleLayout}>
        {ready && (
          <GestureDetector gesture={composed}>
            <View style={styles.centerStage}>
              <Animated.View
                style={[
                  styles.mapLayer,
                  { width: fitSize.width, height: fitSize.height },
                  mapStyle,
                ]}
              >
                <Image
                  source={asset.src}
                  style={{ width: fitSize.width, height: fitSize.height }}
                  contentFit="fill"
                  cachePolicy="memory-disk"
                  recyclingKey={String(asset.src)}
                  accessibilityIgnoresInvertColors
                />
                <MapDisplaySizeContext.Provider value={fitSize}>
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {children}
                  </View>
                </MapDisplaySizeContext.Provider>
              </Animated.View>
            </View>
          </GestureDetector>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8E4DA',
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLayer: {
    position: 'relative',
  },
});
