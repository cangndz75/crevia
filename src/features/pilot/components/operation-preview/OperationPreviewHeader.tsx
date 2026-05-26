import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type OperationPreviewHeaderProps = {
  onBack: () => void;
  onInfo: () => void;
};

export function OperationPreviewHeader({
  onBack,
  onInfo,
}: OperationPreviewHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        onPress={onBack}
        style={[styles.iconBtn, shadows.soft]}
        accessibilityLabel="Geri"
        hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>Ana Operasyon Önizlemesi</Text>
        <Text style={styles.subtitle}>
          Pilot bölge tamamlandı. Şehir ölçeği yakında açılıyor.
        </Text>
      </View>

      <Pressable
        onPress={onInfo}
        style={[styles.iconBtn, shadows.soft]}
        accessibilityLabel="Bilgi"
        hitSlop={8}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 2,
    gap: 4,
  },
  title: {
    ...typography.subtitle,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
});
