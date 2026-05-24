import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getAbilityIcon,
  getAbilityNodeColors,
} from '@/core/utils/abilityPresentation';
import { Ability } from '@/core/models/Ability';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type AbilityNodeCardProps = {
  ability: Ability;
  selected: boolean;
  onPress: () => void;
};

export function AbilityNodeCard({
  ability,
  selected,
  onPress,
}: AbilityNodeCardProps) {
  const palette = getAbilityNodeColors(ability.status, selected);
  const isLocked = ability.status === 'locked';

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !isLocked && styles.pressed,
      ]}>
      <View
        style={[
          styles.node,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
          },
          palette.dashed && styles.dashed,
          selected && styles.selectedGlow,
        ]}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={22} color={palette.icon} />
        ) : (
          <Ionicons
            name={getAbilityIcon(ability.icon)}
            size={24}
            color={palette.icon}
          />
        )}
        {ability.level > 0 ? (
          <View style={[styles.levelDot, { backgroundColor: palette.border }]}>
            <Text style={styles.levelText}>{ability.level}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.label, isLocked && styles.labelLocked]}
        numberOfLines={2}>
        {ability.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 96,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  node: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: {
    borderStyle: 'dashed',
  },
  selectedGlow: {
    shadowColor: colors.abilityGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  levelDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textInverse,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textPrimary,
    lineHeight: 14,
  },
  labelLocked: {
    color: colors.textSecondary,
  },
});
