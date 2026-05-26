import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

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

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={config.label}>
            <Ionicons
              name={focused ? config.iconFocused : config.icon}
              size={22}
              color={focused ? colors.tabActive : colors.tabInactive}
            />
            {focused ? (
              <Text style={[styles.label, styles.labelFocused]} numberOfLines={1}>
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
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  labelFocused: {},
  labelPlaceholder: {
    fontSize: 10,
    height: 12,
  },
});
