import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isPostPilotDevToolsEnabled } from '@/features/devtools/postPilotDevToolsGuard';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type PostPilotDevToolsProps = {
  onAction?: () => void;
};

/**
 * Yalnızca geliştirme modunda — Gün 8 teklif testi kısayolu.
 */
export function PostPilotDevTools({ onAction }: PostPilotDevToolsProps = {}) {
  const router = useRouter();
  const devJumpOffer = useGameStore((s) => s.devJumpToPostPilotOfferForTesting);
  const devJumpLimited = useGameStore((s) => s.devJumpToDay8LimitedForTesting);
  const devJumpFullMain = useGameStore((s) => s.devJumpToFullMainOperationForTesting);
  const devRaiseCrisis = useGameStore((s) => s.devRaiseCrisisRiskForTesting);

  if (!isPostPilotDevToolsEnabled()) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.btn}
        onPress={() => {
          devJumpOffer();
          onAction?.();
          router.push('/post-pilot-offer');
        }}>
        <Ionicons name="flash-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Dev: Gün 8 Teklif Testi</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => {
          devJumpLimited();
          onAction?.();
        }}>
        <Ionicons name="trail-sign-outline" size={16} color={colors.secondary} />
        <Text style={styles.btnText}>Dev: Gün 8 Sınırlı Gündem</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => {
          devJumpFullMain();
          onAction?.();
          router.replace('/');
        }}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Dev: Tam Ana Operasyon</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => {
          devRaiseCrisis();
          onAction?.();
        }}>
        <Ionicons name="warning-outline" size={16} color={colors.hubGoldDark} />
        <Text style={styles.btnText}>Dev: Kriz Riskini Yükselt</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
