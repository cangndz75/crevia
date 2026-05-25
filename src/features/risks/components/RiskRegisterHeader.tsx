import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectDay, selectRole, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function RiskRegisterHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showBack = router.canGoBack();
  const day = useGameStore(selectDay);
  const role = useGameStore(selectRole);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Geri">
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titles}>
          <Text style={typography.title}>Risk Defteri</Text>
          <Text style={typography.caption}>
            Gün {day} · Aktif tehditler ve önlemler
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {role}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.85,
  },
  backPlaceholder: {
    width: 40,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  role: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
