import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, DevSettings, Pressable, StyleSheet, Text, View } from 'react-native';

import { PostPilotDevTools } from '@/features/devtools/components/PostPilotDevTools';
import { resetOnboardingForDev } from '@/core/onboarding/onboardingStorage';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

/**
 * Yalnızca geliştirme modunda görünür — onboarding testi için.
 */
export function HubDevTools() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const clearSaveAndReset = useGameStore((s) => s.clearSaveAndReset);

  const reloadApp = useCallback(() => {
    if (typeof DevSettings.reload === 'function') {
      DevSettings.reload();
      return;
    }
    Alert.alert(
      'Yeniden yükle',
      'Otomatik yenileme desteklenmiyor. Expo menüsünden Reload yapın.',
    );
  }, []);

  const handleResetOnboarding = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await resetOnboardingForDev();
      reloadApp();
    } catch {
      Alert.alert('Hata', 'Onboarding bayrağı sıfırlanamadı.');
      setBusy(false);
    }
  }, [busy, reloadApp]);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      'Tam sıfırlama',
      'Onboarding ve kayıtlı oyun verisi silinecek. Devam?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            try {
              await resetOnboardingForDev();
              await clearSaveAndReset();
              reloadApp();
            } catch {
              Alert.alert('Hata', 'Sıfırlama başarısız.');
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [busy, clearSaveAndReset, reloadApp]);

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Geliştirici</Text>
      <Pressable
        style={[styles.btn, styles.btnPreview]}
        onPress={() => router.push('/events/main-operation-preview')}>
        <Ionicons name="eye-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Ana Operasyon Önizlemesi</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={() => void handleResetOnboarding()}
        disabled={busy}>
        <Ionicons name="refresh" size={16} color={colors.secondary} />
        <Text style={styles.btnText}>
          {busy ? 'Yenileniyor…' : "Onboarding'i sıfırla"}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnOutline, busy && styles.btnDisabled]}
        onPress={handleResetAll}
        disabled={busy}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={[styles.btnText, styles.btnTextDanger]}>
          Onboarding + kayıt sıfırla
        </Text>
      </Pressable>
      <PostPilotDevTools />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondaryMuted,
    borderStyle: 'dashed',
    backgroundColor: colors.secondaryMuted,
    gap: spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutline: {
    backgroundColor: 'transparent',
  },
  btnPreview: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryMuted,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnTextDanger: {
    color: colors.danger,
  },
});
