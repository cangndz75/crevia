import { StyleSheet, View } from 'react-native';

import { HubStatCards } from '@/features/hub/components/HubStatCards';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubCityPulseSection() {
  return (
    <View style={styles.wrap}>
      <HubStatCards />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
});
