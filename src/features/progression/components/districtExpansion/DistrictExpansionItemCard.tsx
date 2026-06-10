import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionStatePill } from '@/features/progression/components/districtExpansion/DistrictExpansionStatePill';
import {
  DISTRICT_EXPANSION_THEME,
  resolveDistrictExpansionStateStyle,
} from '@/features/progression/utils/districtExpansionTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionItemCardProps = {
  item: DistrictUnlockBindingItem;
  compact?: boolean;
  onPress?: (item: DistrictUnlockBindingItem) => void;
};

export function DistrictExpansionItemCard({
  item,
  compact = false,
  onPress,
}: DistrictExpansionItemCardProps) {
  const stateStyle = resolveDistrictExpansionStateStyle(item.state);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.statePillLabel}`}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        compact && styles.compact,
        { borderColor: stateStyle.border, backgroundColor: DISTRICT_EXPANSION_THEME.cardBg },
        pressed && onPress ? styles.pressed : null,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: stateStyle.pillBg }]}>
        <Ionicons name="map-outline" size={compact ? 14 : 16} color={stateStyle.pillText} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {!compact ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      ) : null}
      <DistrictExpansionStatePill label={item.statePillLabel} state={item.state} />
      {item.trustLabel ? (
        <Text style={styles.meta} numberOfLines={1}>
          Güven: {item.trustLabel}
        </Text>
      ) : null}
      {item.pressureLabel ? (
        <Text style={styles.pressure} numberOfLines={1}>
          {item.pressureLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    width: 164,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 6,
    flexShrink: 0,
  },
  compact: {
    minWidth: 136,
    width: 148,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
    lineHeight: 15,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 13,
  },
  meta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  pressure: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
});
