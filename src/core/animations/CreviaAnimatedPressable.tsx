import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from './usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CreviaAnimatedPressableProps = PressableProps & {
  disabled?: boolean;
  reduceMotion?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CreviaAnimatedPressable({
  disabled = false,
  reduceMotion = false,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: CreviaAnimatedPressableProps) {
  const press = usePressScale({ disabled, reduceMotion });

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
