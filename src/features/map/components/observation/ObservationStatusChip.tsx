import { StyleSheet, Text, View } from 'react-native';

import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  label: string;
  tone?: 'active' | 'muted' | 'warning';
};

export function ObservationStatusChip({ label, tone = 'active' }: Props) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'warning' ? styles.chipWarning : undefined,
        tone === 'muted' ? styles.chipMuted : undefined,
      ]}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 44, 42, 0.88)',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  chipWarning: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  chipMuted: {
    borderColor: mapUi.border,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: mapUi.textLight,
    textTransform: 'uppercase',
  },
});
