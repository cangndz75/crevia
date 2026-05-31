import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { spacing } from '@/ui/theme/spacing';

export function CreviaLogoHeader() {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.wrap}>
      <CreviaGameLogo width={200} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
});
