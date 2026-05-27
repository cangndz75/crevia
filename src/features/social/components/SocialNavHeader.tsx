import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  onBack: () => void;
};

export function SocialNavHeader({ onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={onBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Geri dön">
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        <Text style={styles.backLabel}>Geri</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        Sosyal Nabız
      </Text>
      <View style={styles.trailing} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.hubCream,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingRight: spacing.sm,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  trailing: {
    width: 44,
  },
});
