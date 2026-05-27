import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubSocialSignalCard() {
  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
        <Text style={styles.headerLabel}>Sosyal sinyal</Text>
      </View>
      <Text style={styles.handle}>@cumhuriyet_sakini</Text>
      <Text style={styles.body}>
        Park ışıkları için ekip yönlendirilmiş. Umarız bu kez kalıcı çözülür.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  handle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});
