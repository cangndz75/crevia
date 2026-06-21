import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionStatePill } from '@/features/progression/components/districtExpansion/DistrictExpansionStatePill';
import {
  DISTRICT_EXPANSION_THEME,
  resolveDistrictExpansionStateStyle,
} from '@/features/progression/utils/districtExpansionTheme';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionItemCardProps = {
  item: DistrictUnlockBindingItem;
  compact?: boolean;
  grid?: boolean;
  onPress?: (item: DistrictUnlockBindingItem) => void;
};

export function DistrictExpansionItemCard({
  item,
  compact = false,
  grid = false,
  onPress,
}: DistrictExpansionItemCardProps) {
  const stateStyle = resolveDistrictExpansionStateStyle(item.state);
  const isActive = item.state === 'active';

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.statePillLabel}`}
      style={({ pressed }) => [
        styles.card,
        grid && styles.cardGrid,
        compact && !grid && styles.compact,
        shadows.soft,
        {
          borderColor: stateStyle.border,
          backgroundColor: '#FFFEFA',
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      {isActive ? (
        <View style={styles.statusCorner}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={[styles.iconWrap, { backgroundColor: '#F0F2F0' }]}>
        <Ionicons
          name={item.state === 'locked' ? 'lock-closed-outline' : 'map-outline'}
          size={compact ? 16 : 18}
          color="#8A9094"
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.subtitle} numberOfLines={2}>
        {item.subtitle}
      </Text>

      <DistrictExpansionStatePill label={item.statePillLabel} state={item.state} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    width: 164,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
    flexShrink: 0,
    position: 'relative',
  },
  cardGrid: {
    width: '48%',
    minWidth: 0,
    flexGrow: 1,
    flexBasis: '47%',
  },
  compact: {
    minWidth: 136,
    width: 148,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  statusCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2D6A6A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 15,
  },
});
