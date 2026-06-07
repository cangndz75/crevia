import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { spacing } from '@/ui/theme/spacing';

type CreviaLogoHeaderProps = {
  compact?: boolean;
  size?: number;
};

export function CreviaLogoHeader({ compact = false, size }: CreviaLogoHeaderProps) {
  const width = size ?? (compact ? 96 : 140);

  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      style={[styles.wrap, compact && styles.wrapCompact]}>
      <CreviaGameLogo width={width} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  wrapCompact: {
    paddingVertical: 0,
  },
});
