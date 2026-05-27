import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

function TabBarIcon({
  focused,
  icon,
  iconFocused,
  accent = false,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
}) {
  const activeColor = accent ? colors.hubGoldDark : colors.tabActive;
  const inactiveColor = colors.tabInactive;
  const scale = useSharedValue(focused ? 1.08 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, {
      damping: 14,
      stiffness: 220,
    });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <AnimatedIcon
        name={focused ? iconFocused : icon}
        size={22}
        color={focused ? activeColor : inactiveColor}
      />
    </Animated.View>
  );
}

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Merkez', icon: 'home-outline', iconFocused: 'home' },
  events: { label: 'Operasyon', icon: 'flash-outline', iconFocused: 'flash' },
  risks: { label: 'Harita', icon: 'map-outline', iconFocused: 'map' },
  progression: {
    label: 'Başarılar',
    icon: 'trophy-outline',
    iconFocused: 'trophy',
  },
  reports: {
    label: 'Raporlar',
    icon: 'bar-chart-outline',
    iconFocused: 'bar-chart',
  },
};

export const ANIMATED_TAB_BAR_HEIGHT = 60;

function shouldHideTabBar(state: BottomTabBarProps['state']) {
  const activeRoute = state.routes[state.index];
  if (
    activeRoute.name === 'profile' ||
    activeRoute.name === 'leaderboard' ||
    activeRoute.name === 'social'
  ) {
    return true;
  }
  if (activeRoute.name !== 'events' || !activeRoute.state) {
    return false;
  }
  const nestedIndex = activeRoute.state.index ?? 0;
  const nestedRoute = activeRoute.state.routes[nestedIndex];
  return nestedRoute?.name === '[id]';
}

export function useAppTabBarHeight() {
  const insets = useSafeAreaInsets();
  return ANIMATED_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);
}

export function AnimatedTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  if (shouldHideTabBar(state)) {
    return null;
  }

  return (
    <View
      style={[
        styles.bar,
        shadows.soft,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
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

        const isEventsTab = route.name === 'events';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.tab, focused && isEventsTab && styles.tabEventsActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={config.label}>
            <TabBarIcon
              focused={focused}
              icon={config.icon}
              iconFocused={config.iconFocused}
              accent={isEventsTab}
            />
            {focused && isEventsTab ? <View style={styles.activeDot} /> : null}
            {focused ? (
              <Text
                style={[
                  styles.label,
                  isEventsTab ? styles.labelEventsFocused : styles.labelFocused,
                ]}
                numberOfLines={1}>
                {config.label}
              </Text>
            ) : (
              <Text style={styles.labelPlaceholder} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    paddingTop: 8,
    minHeight: ANIMATED_TAB_BAR_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  tabEventsActive: {
    backgroundColor: colors.navIndicator,
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.hubGold,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  labelFocused: {
    color: colors.tabActive,
  },
  labelEventsFocused: {
    color: colors.hubGoldDark,
  },
  labelPlaceholder: {
    fontSize: 10,
    height: 12,
  },
});
