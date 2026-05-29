import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export function HubPilotOperationPreviewStrip() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/events/main-operation-preview')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Ana operasyon önizlemesini gör">
      <View style={styles.iconWrap}>
        <Ionicons name="layers-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Ana operasyon hazırlığı
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Hafif operasyon gündemine geçmeden önce önizlemeyi incele.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
    minWidth: 0,
  },
  pressed: {
    opacity: 0.94,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
