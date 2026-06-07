import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  Alert,
  DevSettings,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { triggerDevCrashTest } from '@/core/crashPerformance/crashReporter';
import { PostPilotDevTools } from '@/features/devtools/components/PostPilotDevTools';
import { isPostPilotDevToolsEnabled } from '@/features/devtools/postPilotDevToolsGuard';
import { resetOnboardingForDev } from '@/core/onboarding/onboardingStorage';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type DevToolsModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function DevToolsModal({ visible, title, onClose, children }: DevToolsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <Pressable
          style={modalStyles.backdropTap}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [modalStyles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={modalStyles.scroll}
            contentContainerStyle={modalStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HubDevToolsPanel({
  busy,
  onClose,
  onResetOnboarding,
  onResetAll,
  onPreview,
  onGenerateMicroDecision,
  onGenerateCrisisAction,
}: {
  busy: boolean;
  onClose: () => void;
  onResetOnboarding: () => void;
  onResetAll: () => void;
  onPreview: () => void;
  onGenerateMicroDecision: () => void;
  onGenerateCrisisAction: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Pressable style={[styles.btn, styles.btnPreview]} onPress={onPreview}>
        <Ionicons name="eye-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Ana Operasyon Önizlemesi</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={onResetOnboarding}
        disabled={busy}>
        <Ionicons name="refresh" size={16} color={colors.secondary} />
        <Text style={styles.btnText} numberOfLines={1}>
          {busy ? 'Yenileniyor…' : "Onboarding'i sıfırla"}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnOutline, busy && styles.btnDisabled]}
        onPress={onResetAll}
        disabled={busy}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={[styles.btnText, styles.btnTextDanger]} numberOfLines={1}>
          Onboarding + kayıt sıfırla
        </Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnPreview]}
        onPress={() => {
          onGenerateMicroDecision();
          onClose();
        }}>
        <Ionicons name="flash-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Dev: Canlı Karar Üret</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnPreview]}
        onPress={() => {
          onGenerateCrisisAction();
          onClose();
        }}>
        <Ionicons name="warning-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Dev: Kriz Hamlesi Üret</Text>
      </Pressable>
      {__DEV__ ? (
        <Pressable
          style={[styles.btn, styles.btnOutline]}
          onPress={() => {
            onClose();
            triggerDevCrashTest();
          }}>
          <Ionicons name="bug-outline" size={16} color={colors.danger} />
          <Text style={[styles.btnText, styles.btnTextDanger]}>Dev: Sentry crash test</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Yalnızca geliştirme modunda görünür — onboarding testi için.
 * TEST: Altta iki kısayol butonu; içerik modalda açılır (daha sonra kaldırılacak).
 */
export function HubDevTools() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [postPilotModalOpen, setPostPilotModalOpen] = useState(false);
  const clearSaveAndReset = useGameStore((s) => s.clearSaveAndReset);
  const devGenerateMicroDecision = useGameStore(
    (s) => s.devGenerateMicroDecisionForTesting,
  );
  const devGenerateCrisisAction = useGameStore(
    (s) => s.devGenerateCrisisActionForTesting,
  );
  const showPostPilot = isPostPilotDevToolsEnabled();

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

  const handlePreview = useCallback(() => {
    setDevModalOpen(false);
    router.push('/events/main-operation-preview');
  }, [router]);

  if (!__DEV__) {
    return null;
  }

  return (
    <>
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.bottomBtn, pressed && styles.pressed]}
          onPress={() => setDevModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Geliştirici araçları">
          <Ionicons name="construct-outline" size={15} color={colors.secondary} />
          <Text style={styles.bottomBtnText}>Geliştirici</Text>
        </Pressable>
        {showPostPilot ? (
          <Pressable
            style={({ pressed }) => [styles.bottomBtn, pressed && styles.pressed]}
            onPress={() => setPostPilotModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Post-pilot test araçları">
            <Ionicons name="flash-outline" size={15} color={colors.primary} />
            <Text style={styles.bottomBtnText}>Post-pilot</Text>
          </Pressable>
        ) : null}
      </View>

      <DevToolsModal
        visible={devModalOpen}
        title="Geliştirici"
        onClose={() => setDevModalOpen(false)}>
        <HubDevToolsPanel
          busy={busy}
          onClose={() => setDevModalOpen(false)}
          onResetOnboarding={() => void handleResetOnboarding()}
          onResetAll={handleResetAll}
          onPreview={handlePreview}
          onGenerateMicroDecision={() => devGenerateMicroDecision?.()}
          onGenerateCrisisAction={() => devGenerateCrisisAction?.()}
        />
      </DevToolsModal>

      {showPostPilot ? (
        <DevToolsModal
          visible={postPilotModalOpen}
          title="Post-pilot test"
          onClose={() => setPostPilotModalOpen(false)}>
          <PostPilotDevTools onAction={() => setPostPilotModalOpen(false)} />
        </DevToolsModal>
      ) : null}
    </>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 40, 38, 0.35)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryMuted,
  },
  scroll: {
    minWidth: 0,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
});

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondaryMuted,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
  },
  bottomBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  panel: {
    gap: spacing.sm,
    minWidth: 0,
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
    minWidth: 0,
    flexShrink: 1,
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
    minWidth: 0,
    flexShrink: 1,
  },
  btnTextDanger: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.86,
  },
});
