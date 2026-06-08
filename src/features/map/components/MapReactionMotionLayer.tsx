import { useEffect, useMemo } from 'react';
import { Circle, G } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { MapDistrictMotionCue } from '@/core/mapReactionsMotion/mapReactionMotionTypes';
import {
  motionCueRingRadius,
  motionCueStrokeColor,
} from '@/core/mapReactionsMotion/mapReactionMotionHelpers';

import { CITY_DISTRICT_REGIONS } from '../data/cityOverviewGeometry';
import type { MapDistrictId } from '../data/mapAssets';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DistrictMotionRingProps = {
  cue: MapDistrictMotionCue;
  cx: number;
  cy: number;
};

function DistrictMotionRing({ cue, cx, cy }: DistrictMotionRingProps) {
  const baseR = motionCueRingRadius(cue);
  const stroke = motionCueStrokeColor(cue);
  const opacity = useSharedValue(cue.shouldAnimate ? 0.35 : 0.45);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!cue.shouldAnimate) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = 0.45;
      scale.value = 1;
      return;
    }

    const half = Math.max(300, Math.floor(cue.durationMs / 2));
    const repeat =
      cue.repeatPolicy === 'once'
        ? 1
        : cue.repeatPolicy === 'limited'
          ? 2
          : cue.repeatPolicy === 'subtle_loop'
            ? 3
            : 0;

    if (repeat <= 0) {
      opacity.value = 0.4;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: half }),
        withTiming(0.25, { duration: half }),
      ),
      repeat,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: half }),
        withTiming(1, { duration: half }),
      ),
      repeat,
      false,
    );
  }, [cue.durationMs, cue.repeatPolicy, cue.shouldAnimate, opacity, scale]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    r: baseR * scale.value,
  }));

  if (cue.motionKind === 'static_indicator') {
    return (
      <Circle
        cx={cx}
        cy={cy}
        r={baseR}
        fill="none"
        stroke={stroke}
        strokeWidth={0.003}
        opacity={0.5}
      />
    );
  }

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      fill="none"
      stroke={stroke}
      strokeWidth={cue.motionKind === 'operation_scope_ring' ? 0.0025 : 0.0035}
      animatedProps={animatedProps}
    />
  );
}

type Props = {
  cues: MapDistrictMotionCue[];
  activeDistrictId?: MapDistrictId;
  operationScopeDistrictIds?: MapDistrictId[];
};

export function MapReactionMotionLayer({
  cues,
  activeDistrictId,
  operationScopeDistrictIds,
}: Props) {
  const cueByDistrict = useMemo(() => {
    const map = new Map<MapDistrictId, MapDistrictMotionCue>();
    for (const cue of cues) {
      const existing = map.get(cue.districtId);
      if (!existing || cue.priority === 'high') {
        map.set(cue.districtId, cue);
      }
    }
    return map;
  }, [cues]);

  const scopeSet = useMemo(
    () => new Set(operationScopeDistrictIds ?? []),
    [operationScopeDistrictIds],
  );

  if (cueByDistrict.size === 0 && scopeSet.size === 0) return null;

  return (
    <G pointerEvents="none">
      {CITY_DISTRICT_REGIONS.map((region) => {
        const cue = cueByDistrict.get(region.id);
        const isScope = scopeSet.has(region.id);
        if (!cue && !isScope) return null;

        const cx = region.label.x;
        const cy = region.label.y;
        const activeCue =
          cue ??
          ({
            districtId: region.id,
            reactionKind: 'operation_scope_marker',
            motionKind: 'operation_scope_ring',
            tone: 'neutral',
            intensity: 'low',
            durationMs: 1400,
            repeatPolicy: 'subtle_loop',
            accessibilityLabel: 'Operasyon kapsamı',
            reducedMotionFallbackLabel: 'Operasyon kapsamı',
            shouldAnimate: false,
            priority: 'low',
          } satisfies MapDistrictMotionCue);

        const emphasize = region.id === activeDistrictId;
        if (!emphasize && activeCue.motionKind === 'soft_pulse' && !isScope) {
          return null;
        }

        return (
          <DistrictMotionRing
            key={`motion-${region.id}`}
            cue={activeCue}
            cx={cx}
            cy={cy}
          />
        );
      })}
    </G>
  );
}
