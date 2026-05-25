import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/ui/theme/colors';

export function BriefingSkyline() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height={100} viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice">
        <Path
          d="M0 80 L30 55 L55 70 L90 40 L120 65 L160 35 L200 60 L240 30 L280 55 L320 25 L360 50 L400 35 L400 100 L0 100 Z"
          fill={`${colors.primary}12`}
        />
        <Rect x={40} y={48} width={18} height={52} rx={2} fill={`${colors.primary}18`} />
        <Rect x={120} y={38} width={24} height={62} rx={2} fill={`${colors.primary}15`} />
        <Rect x={200} y={42} width={20} height={58} rx={2} fill={`${colors.primary}18`} />
        <Rect x={300} y={32} width={28} height={68} rx={2} fill={`${colors.primary}12`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
});
