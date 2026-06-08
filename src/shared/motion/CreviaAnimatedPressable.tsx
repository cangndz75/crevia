import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useCreviaPressMotion } from './useCreviaPressMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CreviaAnimatedPressableProps = PressableProps & {
  disabled?: boolean;
  reducedMotion?: boolean;
  pressScale?: number;
  style?: StyleProp<ViewStyle>;
};

export function CreviaAnimatedPressable({
  disabled = false,
  reducedMotion = false,
  pressScale = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: CreviaAnimatedPressableProps) {
  const press = useCreviaPressMotion({ disabled, reducedMotion, pressScale });

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        press.onPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        press.onPressOut();
        onPressOut?.(event);
      }}
      style={[press.animatedStyle, style]}>
      {children}
    </AnimatedPressable>
  );
}
