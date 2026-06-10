import { StyleSheet, Text, View } from 'react-native';

import type { DistrictUnlockBindingState } from '@/core/progression/districtOperationUnlockBindingTypes';
import { resolveDistrictExpansionStateStyle } from '@/features/progression/utils/districtExpansionTheme';

type DistrictExpansionStatePillProps = {
  label: string;
  state: DistrictUnlockBindingState;
};

export function DistrictExpansionStatePill({ label, state }: DistrictExpansionStatePillProps) {
  const style = resolveDistrictExpansionStateStyle(state);
  return (
    <View style={[styles.pill, { backgroundColor: style.pillBg }]}>
      <Text style={[styles.text, { color: style.pillText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
  },
});
