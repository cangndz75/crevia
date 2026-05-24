import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Merkez', icon: 'home-outline', iconFocused: 'home' },
  events: { label: 'Olaylar', icon: 'flash-outline', iconFocused: 'flash' },
  risks: { label: 'Riskler', icon: 'warning-outline', iconFocused: 'warning' },
  progression: {
    label: 'Yetkiler',
    icon: 'ribbon-outline',
    iconFocused: 'ribbon',
  },
  reports: {
    label: 'Rapor',
    icon: 'document-text-outline',
    iconFocused: 'document-text',
  },
};

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

export const ANIMATED_TAB_BAR_HEIGHT = 64;

type TabLayout = { x: number; width: number };

function shouldHideTabBar(state: BottomTabBarProps['state']) {
  const activeRoute = state.routes[state.index];
  if (activeRoute.name !== 'events' || !activeRoute.state) {
    return false;
  }
  const nestedIndex = activeRoute.state.index ?? 0;
  const nestedRoute = activeRoute.state.routes[nestedIndex];
  return nestedRoute?.name === '[id]';
}

export function useAppTabBarHeight() {
  const insets = useSafeAreaInsets();
  return ANIMATED_TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + 16;
}

export function AnimatedTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layouts = useRef<TabLayout[]>([]);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(72);

  const hideBar = shouldHideTabBar(state);

  const moveIndicator = (index: number) => {
    const layout = layouts.current[index];
    if (!layout) return;
    indicatorX.value = withSpring(layout.x, SPRING);
    indicatorW.value = withSpring(layout.width, SPRING);
  };

  useEffect(() => {
    moveIndicator(state.index);
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  if (hideBar) {
    return null;
  }

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none">
      <View style={[styles.pill, shadows.card]}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLayout = (event: LayoutChangeEvent) => {
            const { x, width } = event.nativeEvent.layout;
            layouts.current[index] = { x, width };
            if (focused) {
              moveIndicator(index);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={onLayout}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}>
              <Ionicons
                name={focused ? config.iconFocused : config.icon}
                size={22}
                color={focused ? colors.navIconActive : colors.navIconInactive}
              />
              {focused ? (
                <Animated.Text
                  entering={FadeIn.duration(180)}
                  exiting={FadeOut.duration(120)}
                  style={styles.label}
                  numberOfLines={1}>
                  {config.label}
                </Animated.Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navBarBg,
    borderRadius: radius.xxl,
    height: ANIMATED_TAB_BAR_HEIGHT,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    borderRadius: radius.xl,
    backgroundColor: colors.navIndicator,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: '100%',
    zIndex: 1,
  },
  label: {
    color: colors.navIconActive,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 72,
  },
});
