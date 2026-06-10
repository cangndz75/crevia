import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { memo, useContext, useEffect, useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVBAR_BG = require('@/assets/bt1.png');
const MEDALLION = require('@/assets/bt2.png');

/** bt1.png canvas: 2172×724 — pill sits between these rows. */
const NAVBAR_WIDTH = 2172;
const NAVBAR_HEIGHT = 724;
const PILL_TOP = 138;
const PILL_BOTTOM = 574;
const PILL_HEIGHT = PILL_BOTTOM - PILL_TOP + 1;
const BOTTOM_MARGIN = NAVBAR_HEIGHT - PILL_BOTTOM - 1;

type NavItem = {
  routeName: string;
  label: string;
  icon: ImageSourcePropType;
  featured?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { routeName: 'index', label: 'Merkez', icon: require('@/assets/bt8.png') },
  { routeName: 'events', label: 'Operasyon', icon: require('@/assets/bt6.png') },
  {
    routeName: 'risks',
    label: 'Harita',
    icon: require('@/assets/bt5.png'),
    featured: true,
  },
  {
    routeName: 'progression',
    label: 'Başarılar',
    icon: require('@/assets/bt4.png'),
  },
  { routeName: 'reports', label: 'Raporlar', icon: require('@/assets/bt7.png') },
] as const;

const LABEL_ACTIVE = '#F6D36D';
const LABEL_INACTIVE = '#B8A06A';

const TAB_ANIMATION_MS = 150;
const MIN_HIT_SIZE = 44;
const ICON_SLOT_HEIGHT = 32;

export function computeCreviaTabBarContentHeight(screenWidth: number): number {
  return Math.round((screenWidth * PILL_HEIGHT) / NAVBAR_WIDTH);
}

export function computeCreviaTabBarHeight(
  screenWidth: number,
  bottomInset: number,
): number {
  return computeCreviaTabBarContentHeight(screenWidth) + Math.max(bottomInset, 8);
}

/** Fallback when screen width is not yet available. */
export const CREVIA_BOTTOM_TAB_BAR_CONTENT_HEIGHT =
  computeCreviaTabBarContentHeight(390);

export function useAppTabBarHeight() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  return computeCreviaTabBarHeight(screenWidth, insets.bottom);
}

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
};

type BarMetrics = {
  screenWidth: number;
  pillHeight: number;
  imageHeight: number;
  bottomCrop: number;
  bumpOverflow: number;
  normalIconSize: number;
  featuredIconSize: number;
  featuredMedalSize: number;
  featuredLift: number;
  labelFontSize: number;
};

function computeBarMetrics(screenWidth: number): BarMetrics {
  const compact = screenWidth < 360;
  const scale = screenWidth / NAVBAR_WIDTH;
  const pillHeight = Math.round(PILL_HEIGHT * scale);
  const imageHeight = Math.round(NAVBAR_HEIGHT * scale);
  const bottomCrop = Math.round(BOTTOM_MARGIN * scale);
  const bumpOverflow = Math.round(PILL_TOP * scale);

  return {
    screenWidth,
    pillHeight,
    imageHeight,
    bottomCrop,
    bumpOverflow,
    normalIconSize: compact ? 26 : 28,
    featuredIconSize: compact ? 34 : 38,
    featuredMedalSize: compact ? 56 : 62,
    featuredLift: Math.round(bumpOverflow * 0.42),
    labelFontSize: compact ? 10 : 11,
  };
}

type TabBarItemProps = {
  item: NavItem;
  focused: boolean;
  metrics: BarMetrics;
  onPress: () => void;
};

const TabBarItem = memo(function TabBarItem({
  item,
  focused,
  metrics,
  onPress,
}: TabBarItemProps) {
  const { featured, label, icon } = item;
  const scale = useSharedValue(focused ? 1.05 : 1);
  const iconOpacity = useSharedValue(focused ? 1 : 0.72);

  useEffect(() => {
    scale.value = withTiming(focused ? 1.05 : 1, { duration: TAB_ANIMATION_MS });
    iconOpacity.value = withTiming(focused ? 1 : 0.72, {
      duration: TAB_ANIMATION_MS,
    });
  }, [focused, iconOpacity, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: iconOpacity.value,
  }));

  const iconSize = featured ? metrics.featuredIconSize : metrics.normalIconSize;
  const showMedallion = featured && focused;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        featured ? { marginTop: -metrics.featuredLift } : null,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${label} sekmesi`}>
      <View
        style={[
          styles.tabHitArea,
          { minWidth: MIN_HIT_SIZE, minHeight: MIN_HIT_SIZE },
        ]}>
        <Animated.View
          style={[
            styles.iconSlot,
            featured
              ? {
                  width: metrics.featuredMedalSize,
                  height: metrics.featuredMedalSize,
                }
              : { width: ICON_SLOT_HEIGHT + 8, height: ICON_SLOT_HEIGHT },
            animatedIconStyle,
          ]}>
          {showMedallion ? (
            <Image
              source={MEDALLION}
              style={[
                styles.layerImage,
                {
                  width: metrics.featuredMedalSize,
                  height: metrics.featuredMedalSize,
                },
              ]}
              resizeMode="contain"
            />
          ) : null}

          <Image
            source={icon}
            style={{ width: iconSize, height: iconSize }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.label,
            {
              fontSize: metrics.labelFontSize,
              fontWeight: focused ? '800' : '600',
              color: focused ? LABEL_ACTIVE : LABEL_INACTIVE,
            },
          ]}
          numberOfLines={1}>
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
});

export function CreviaBottomTabBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const { width: screenWidth } = useWindowDimensions();
  const metrics = useMemo(() => computeBarMetrics(screenWidth), [screenWidth]);
  const routeIndexByName = useMemo(() => {
    const map = new Map<string, number>();
    state.routes.forEach((route, index) => {
      map.set(route.name, index);
    });
    return map;
  }, [state.routes]);

  if (shouldHideTabBar(state)) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 8);
  const totalHeight = metrics.pillHeight + bottomInset;

  return (
    <View
      style={[styles.root, { height: totalHeight }]}
      onLayout={(event) => {
        onHeightChange?.(event.nativeEvent.layout.height);
      }}>
      <View style={[styles.pillClip, { height: metrics.pillHeight }]}>
        <Image
          source={NAVBAR_BG}
          style={[
            styles.barImage,
            {
              width: metrics.screenWidth,
              height: metrics.imageHeight,
              bottom: -metrics.bottomCrop,
            },
          ]}
          resizeMode="stretch"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      <View
        style={[
          styles.tabsRow,
          {
            height: totalHeight,
            paddingBottom: bottomInset + 6,
          },
        ]}>
          {NAV_ITEMS.map((item) => {
            const routeIndex = routeIndexByName.get(item.routeName);
            if (routeIndex === undefined) {
              return null;
            }

            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;

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
              <TabBarItem
                key={item.routeName}
                item={item}
                focused={focused}
                metrics={metrics}
                onPress={onPress}
              />
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  pillClip: {
    width: '100%',
    overflow: 'hidden',
  },
  barImage: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  tabHitArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerImage: {
    position: 'absolute',
  },
  label: {
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
    maxWidth: 68,
  },
});
