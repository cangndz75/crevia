import { StyleSheet, View, ViewStyle } from 'react-native';

import { radius } from '@/ui/theme/radius';

type ProgressBarProps = {
  progress: number;
  color: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({
  progress,
  color,
  trackColor = '#E8E6E1',
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
