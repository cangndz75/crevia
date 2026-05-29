import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

type HubPilotReportBannerProps = {
  compact?: boolean;
};

export function HubPilotReportBanner({ compact = false }: HubPilotReportBannerProps) {
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

  if (compact && isCompleted) {
    return (
      <Pressable
        onPress={() => router.push('/events/pilot-final-report')}
        style={({ pressed }) => [
          styles.compactCard,
          pressed && styles.compactPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={buttonTitle}>
        <Ionicons name="document-text-outline" size={16} color={colors.hubGoldDark} />
        <View style={styles.compactCopy}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.compactBody} numberOfLines={1}>
            Raporu Gör
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.hubGoldDark} />
      </Pressable>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(80).duration(360).springify().damping(22)}
      style={[styles.card, compact && styles.cardCompact, shadows.card]}>
      <View style={styles.iconRow}>
        <Animated.View
          entering={ZoomIn.delay(200).duration(300).springify().damping(16)}
          style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
          <Ionicons
            name={isCompleted ? 'trophy' : 'document-text'}
            size={compact ? 18 : 22}
            color={colors.hubGoldDark}
          />
        </Animated.View>
        {!compact && isCompleted && banner.finalResult ? (
          <GameChip
            label={PILOT_STATUS_LABELS[banner.finalResult.status]}
            tone={pilotStatusChipTone(banner.finalResult.status)}
          />
        ) : !compact ? (
          <GameChip label="Hazır" tone="warning" />
        ) : null}
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.body, compact && styles.bodyCompact]} numberOfLines={compact ? 2 : 4}>
        {body}
      </Text>

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
  cardCompact: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(232, 155, 46, 0.25)',
    minWidth: 0,
  },
  compactPressed: {
    opacity: 0.94,
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  compactBody: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.hubGoldDark,
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
  iconWrapCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 15,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bodyCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  btn: {
    alignSelf: 'stretch',
  },
});
