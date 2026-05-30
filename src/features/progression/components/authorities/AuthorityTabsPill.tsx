import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export type AuthorityTabKey = 'authorities' | 'badges';

type AuthorityTabsPillProps = {
  active: AuthorityTabKey;
  onChange: (tab: AuthorityTabKey) => void;
};

const TABS: {
  key: AuthorityTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'authorities', label: 'Yetkiler', icon: 'shield-checkmark' },
  { key: 'badges', label: 'Rozetler', icon: 'medal-outline' },
];

export function AuthorityTabsPill({ active, onChange }: AuthorityTabsPillProps) {
  const handlePress = (key: AuthorityTabKey) => {
    if (key === active) return;
    playSelectionHaptic();
    onChange(key);
  };

  return (
    <View style={[styles.capsule, shadows.soft]}>
      {TABS.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            style={[styles.tab, selected && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}>
            <Ionicons
              name={tab.icon}
              size={17}
              color={selected ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabLabel, selected && styles.tabLabelActive]}
              numberOfLines={1}>
              {tab.label}
            </Text>
            {selected ? (
              <Animated.View entering={FadeIn.duration(180)} style={styles.activeLine} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    backgroundColor: AUTHORITY_COLLECTION_THEME.cardBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    padding: 4,
    minHeight: 58,
    marginTop: spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    position: 'relative',
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeLine: {
    position: 'absolute',
    bottom: 4,
    width: '72%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
