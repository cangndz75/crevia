import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export type ProgressionTabKey = 'authorities' | 'badges';

type ProgressionSegmentTabsProps = {
  active: ProgressionTabKey;
  onChange: (tab: ProgressionTabKey) => void;
};

const TABS: {
  key: ProgressionTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'authorities', label: 'Yetkiler', icon: 'shield-checkmark', color: colors.primary },
  { key: 'badges', label: 'Rozetler', icon: 'medal-outline', color: colors.authority },
];

export function ProgressionSegmentTabs({
  active,
  onChange,
}: ProgressionSegmentTabsProps) {
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const tabWidths = useSharedValue<number[]>([0, 0]);

  const activeIndex = active === 'authorities' ? 0 : 1;

  useEffect(() => {
    const widths = tabWidths.value;
    if (widths[0] === 0) return;
    let x = 4;
    for (let i = 0; i < activeIndex; i++) {
      x += widths[i] ?? 0;
    }
    indicatorX.value = withSpring(x, { damping: 20, stiffness: 220 });
    indicatorW.value = withSpring(widths[activeIndex] ?? 0, {
      damping: 20,
      stiffness: 220,
    });
  }, [activeIndex, indicatorW, indicatorX, tabWidths]);

  const activeColor = TABS[activeIndex]?.color ?? colors.primary;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
    borderBottomColor: activeColor,
  }));

  const onTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    const next = [...tabWidths.value];
    next[index] = w;
    tabWidths.value = next;
    if (index === activeIndex) {
      let x = 4;
      for (let i = 0; i < index; i++) x += next[i] ?? 0;
      indicatorX.value = x;
      indicatorW.value = w;
    }
  };

  return (
    <View style={[styles.capsule, shadows.soft]}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {TABS.map((tab, index) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            onLayout={onTabLayout(index)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}>
            <Ionicons
              name={tab.icon}
              size={16}
              color={selected ? tab.color : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                selected && { color: tab.color, fontWeight: '800' },
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
