import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';

import type { AuthorityTheme } from '@/features/progression/content/authoritiesDisplay';
import { AUTHORITY_THEME } from '@/features/progression/components/authorities/theme';
import type { ProgressionIconName } from '@/core/content/progressionRoadmap';
import { colors } from '@/ui/theme/colors';

type HexagonBadgeIconProps = {
  icon: ProgressionIconName;
  theme: AuthorityTheme;
  dimmed?: boolean;
  size?: number;
};

export function HexagonBadgeIcon({
  icon,
  theme,
  dimmed = false,
  size = 72,
}: HexagonBadgeIconProps) {
  const palette = AUTHORITY_THEME[theme];
  const height = size * 1.12;
  const points = `${size * 0.5},2 ${size - 4},${height * 0.28} ${size - 4},${height * 0.72} ${size * 0.5},${height - 2} 4,${height * 0.72} 4,${height * 0.28}`;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height },
        dimmed && styles.dimmed,
      ]}>
      <View
        style={[
          styles.glow,
          {
            width: size + 12,
            height: height + 8,
            backgroundColor: palette.glow,
          },
        ]}
      />
      <Svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <Defs>
          <SvgGradient id={`hex-${theme}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.hex[0]} stopOpacity="0.95" />
            <Stop offset="1" stopColor={palette.hex[1]} stopOpacity="0.88" />
          </SvgGradient>
        </Defs>
        <Polygon
          points={points}
          fill={`url(#hex-${theme})`}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
        />
      </Svg>
      <View style={[styles.iconOverlay, { width: size, height }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'transparent']}
          style={styles.shine}
        />
        <Ionicons name={icon} size={size * 0.34} color={colors.textInverse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dimmed: {
    opacity: 0.82,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ scaleX: 0.9 }],
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shine: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 18,
    borderRadius: 12,
    opacity: 0.7,
  },
});
