import { StyleSheet, View } from 'react-native';

import { HubTopBar } from '@/features/hub/components/HubTopBar';
import { colors } from '@/ui/theme/colors';

/** Üst bar — scroll dışında veya ekranın ilk bloğu. */
export function HubHeader() {
  return (
    <View style={styles.wrapper}>
      <HubTopBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.hubCream,
  },
});
