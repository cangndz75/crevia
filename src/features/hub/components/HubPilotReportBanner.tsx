import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import {
  PILOT_STATUS_LABELS,
  pilotStatusChipTone,
} from '@/features/pilot/utils/pilotFinalPresentation';
import { useGameStore } from '@/store/useGameStore';
import { GameButton } from '@/ui/components/GameButton';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubPilotReportBanner() {
  const router = useRouter();

  const banner = useGameStore(
    useShallow((s) => {
      const { pilot } = s.gameState;
      const ready = canCompletePilot(s.gameState);
      const completed =
        pilot.status === 'completed' && pilot.finalResult != null;
      return {
        ready,
        completed,
        finalResult: pilot.finalResult,
      };
    }),
  );

  if (!banner.ready && !banner.completed) {
    return null;
  }

  const isCompleted = banner.completed && banner.finalResult != null;
  const title = isCompleted ? 'Pilot Bölge Tamamlandı' : 'Pilot Raporu Hazır';
  const body = isCompleted
    ? `${banner.finalResult!.summary} Skor: ${banner.finalResult!.score}/100 · ${PILOT_STATUS_LABELS[banner.finalResult!.status]}`
    : '7 günlük pilot operasyon tamamlandı. Sonuçları görüp ana operasyon kilidini inceleyebilirsin.';
  const buttonTitle = isCompleted ? 'Raporu Tekrar Gör' : 'Raporu Gör';

  return (
    <Animated.View
      entering={FadeInUp.delay(80).duration(360).springify().damping(22)}
      style={[styles.card, shadows.card]}>
      <View style={styles.iconRow}>
        <Animated.View
          entering={ZoomIn.delay(200).duration(300).springify().damping(16)}
          style={styles.iconWrap}>
          <Ionicons
            name={isCompleted ? 'trophy' : 'document-text'}
            size={22}
            color={colors.hubGoldDark}
          />
        </Animated.View>
        {isCompleted && banner.finalResult ? (
          <GameChip
            label={PILOT_STATUS_LABELS[banner.finalResult.status]}
            tone={pilotStatusChipTone(banner.finalResult.status)}
          />
        ) : (
          <GameChip label="Hazır" tone="warning" />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <GameButton
        title={buttonTitle}
        onPress={() => router.push('/events/pilot-final-report')}
        style={styles.btn}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hubGold,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hubGold,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  btn: {
    alignSelf: 'stretch',
  },
});
