import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/ui/theme/spacing';

import {
  FILTER_CIRCLE_THEME,
  MENTION_ACCENT,
  MENTION_FILTER_OPTIONS,
  type MentionFilterKey,
} from './mentionUiConstants';

type Props = {
  selected: MentionFilterKey;
  onSelect: (key: MentionFilterKey) => void;
};

function FilterIcon({
  icon,
  color,
}: {
  icon: (typeof MENTION_FILTER_OPTIONS)[number]['icon'];
  color: string;
}) {
  switch (icon) {
    case 'grid':
      return <Ionicons name="grid" size={22} color={color} />;
    case 'warning':
      return <Ionicons name="warning" size={22} color={color} />;
    case 'heart':
      return <Ionicons name="heart" size={22} color={color} />;
    case 'flash':
      return <Ionicons name="flash" size={22} color={color} />;
  }
}

export function MentionCategoryFilter({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {MENTION_FILTER_OPTIONS.map((option) => {
        const isSelected = selected === option.key;
        const theme = FILTER_CIRCLE_THEME[option.key];

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}>
            <View
              style={[
                styles.circle,
                { backgroundColor: theme.bg },
                isSelected && {
                  borderColor: theme.ring ?? MENTION_ACCENT.purple,
                  borderWidth: 2.5,
                },
              ]}>
              <FilterIcon icon={option.icon} color={theme.fg} />
            </View>
            <Text
              style={[
                styles.label,
                isSelected && { color: MENTION_ACCENT.purple, fontWeight: '800' },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  item: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
