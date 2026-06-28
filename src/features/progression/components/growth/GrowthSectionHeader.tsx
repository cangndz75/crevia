import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { growth } from '@/features/progression/theme/growthScreenTokens';

type GrowthSectionHeaderProps = {
  title: string;
  actionLabel?: string;
  countLabel?: string;
  onActionPress?: () => void;
};

export function GrowthSectionHeader({
  title,
  actionLabel,
  countLabel,
  onActionPress,
}: GrowthSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {countLabel ? <Text style={styles.count}>{countLabel}</Text> : null}
      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}>
          <View style={styles.actionRow}>
            <Text style={styles.action}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={14} color={growth.gold} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: growth.text,
    minWidth: 0,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.mint,
    flexShrink: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  action: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.gold,
  },
});
