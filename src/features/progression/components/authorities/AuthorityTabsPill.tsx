import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { spacing } from '@/ui/theme/spacing';

export type AuthorityTabKey = 'authorities' | 'badges' | 'expansions';

type AuthorityTabsPillProps = {
  active: AuthorityTabKey;
  onChange: (tab: AuthorityTabKey) => void;
};

const TABS: {
  key: AuthorityTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'authorities', label: 'Yetkiler', icon: 'shield-checkmark-outline' },
  { key: 'badges', label: 'Rozetler', icon: 'star-outline' },
  { key: 'expansions', label: 'Açılımlar', icon: 'map-outline' },
];

export function AuthorityTabsPill({ active, onChange }: AuthorityTabsPillProps) {
  const handlePress = (key: AuthorityTabKey) => {
    if (key === active) return;
    playSelectionHaptic();
    onChange(key);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.capsule, growth.shadow]}>
        {TABS.map((tab) => {
          const selected = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab.key)}
              style={[styles.tab, selected ? styles.tabActive : null]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}>
              <Ionicons
                name={tab.icon}
                size={18}
                color={selected ? growth.gold : growth.textMuted}
              />
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    zIndex: 20,
    elevation: 20,
  },
  capsule: {
    flexDirection: 'row',
    backgroundColor: growth.glass,
    borderRadius: growth.radiusTab,
    borderWidth: 1,
    borderColor: growth.border,
    padding: 4,
    minHeight: 52,
    marginTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    minWidth: 0,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: growth.mintMuted,
    borderWidth: 1,
    borderColor: growth.goldBorder,
    ...growth.glowGold,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textMuted,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: growth.gold,
    fontWeight: '800',
  },
});
