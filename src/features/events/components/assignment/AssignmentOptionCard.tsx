import { StyleSheet, Text, View } from 'react-native';

import type { AssignmentOption } from '@/core/assignments/assignmentTypes';
import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  option: AssignmentOption;
  selected: boolean;
  onPress: () => void;
};

export function AssignmentOptionCard({ option, selected, onPress }: Props) {
  return (
    <CreviaAnimatedPressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={styles.label} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={styles.upside} numberOfLines={2}>
        {option.upside}
      </Text>
      <Text style={styles.tradeoff} numberOfLines={2}>
        {option.tradeoff}
      </Text>
    </CreviaAnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
    backgroundColor: '#F8FBFA',
    padding: 10,
    minWidth: 0,
    flex: 1,
  },
  cardSelected: {
    borderColor: eventDetail.teal,
    backgroundColor: '#E8F7F2',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
    marginBottom: 4,
  },
  upside: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3F5C57',
    flexShrink: 1,
  },
  tradeoff: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B8480',
    marginTop: 4,
    flexShrink: 1,
  },
});
