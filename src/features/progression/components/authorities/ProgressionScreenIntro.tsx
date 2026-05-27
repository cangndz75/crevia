import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function ProgressionScreenIntro() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.subtitle}>
        Yetkilerini yönet, rozetleri topla, şehrini güçlendir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
