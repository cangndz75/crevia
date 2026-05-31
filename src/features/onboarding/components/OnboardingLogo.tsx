import { StyleSheet, View } from 'react-native';

import { CreviaGameLogo } from '@/ui/components/CreviaGameLogo';
import { spacing } from '@/ui/theme/spacing';

export function OnboardingLogo() {
  return (
    <View style={styles.wrap}>
      <CreviaGameLogo width={168} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
