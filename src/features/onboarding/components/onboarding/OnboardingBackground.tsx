import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';

import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

export function OnboardingBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[onboardingTokens.background, onboardingTokens.backgroundGradientEnd, '#F5F0FF']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={styles.skyline} width="100%" height={220} viewBox="0 0 390 220" preserveAspectRatio="xMidYMax meet">
        <Ellipse cx={80} cy={180} rx={90} ry={28} fill={onboardingTokens.lavender} opacity={0.12} />
        <Ellipse cx={280} cy={190} rx={110} ry={32} fill={onboardingTokens.blue} opacity={0.1} />
        <Rect x={40} y={120} width={48} height={72} rx={10} fill={onboardingTokens.lavender} opacity={0.14} />
        <Rect x={110} y={95} width={64} height={98} rx={12} fill={onboardingTokens.primary} opacity={0.1} />
        <Rect x={200} y={108} width={52} height={86} rx={10} fill={onboardingTokens.mint} opacity={0.12} />
        <Rect x={280} y={130} width={56} height={64} rx={10} fill={onboardingTokens.blue} opacity={0.11} />
        <Ellipse cx={195} cy={210} rx={170} ry={18} fill="#C8C0F5" opacity={0.2} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  skyline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.85,
  },
});
