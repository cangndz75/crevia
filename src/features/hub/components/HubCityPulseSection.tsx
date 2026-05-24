import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { HubStatCards } from '@/features/hub/components/HubStatCards';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function HubCityPulseSection() {
  const { operationsBrief } = mockGameData;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={typography.eyebrow}>Şehir nabzı</Text>
        <Text style={styles.flair}>{operationsBrief.motto}</Text>
      </View>
      <HubStatCards />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  head: {
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  flair: {
    ...typography.caption,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.primary,
    lineHeight: 17,
    fontWeight: '500',
  },
});
