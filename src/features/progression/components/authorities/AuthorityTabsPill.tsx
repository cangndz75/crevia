import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import { shadows } from '@/ui/theme/shadows';
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
  { key: 'badges', label: 'Rozetler', icon: 'trophy-outline' },
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
      <View style={[styles.capsule, shadows.soft]}>
      {TABS.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}>
            <Ionicons
              name={tab.icon}
              size={18}
              color={selected ? AUTHORITY_COLLECTION_THEME.tealDark : AUTHORITY_COLLECTION_THEME.textSecondary}
            />
            <Text
              style={[styles.tabLabel, selected && styles.tabLabelActive]}
              numberOfLines={1}>
              {tab.label}
            </Text>
            {selected ? <View style={styles.activeLine} /> : null}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 56,
    marginTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: 'relative',
    minWidth: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: AUTHORITY_COLLECTION_THEME.tealDark,
    fontWeight: '800',
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    width: '70%',
    height: 3,
    borderRadius: 2,
    backgroundColor: AUTHORITY_COLLECTION_THEME.tealDark,
  },
});
