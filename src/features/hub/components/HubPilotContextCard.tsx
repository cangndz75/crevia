import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { getDistrictProfile } from '@/core/content/districtProfiles';
import { getCurrentPilotDayPlan } from '@/core/game/getCurrentPilotDayPlan';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import {
  PILOT_DAY_THEME_LABELS,
  PILOT_STATUS_CHIP_LABELS,
  pilotStatusChipTone,
} from '@/features/pilot/utils/pilotDayPresentation';
import { useGameStore } from '@/store/useGameStore';
import { GameChip } from '@/ui/components/GameChip';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const MAX_PILOT_DAYS = 7;

export function HubPilotContextCard() {
  const pilotSlice = useGameStore(
    useShallow((s) => ({
      pilot: s.gameState.pilot,
    })),
  );

  const { district, dayPlan } = useMemo(() => {
    const id: PilotDistrictId =
      pilotSlice.pilot.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;
    return {
      district: getDistrictProfile(id),
      dayPlan: getCurrentPilotDayPlan(pilotSlice.pilot),
    };
  }, [pilotSlice.pilot]);

  const dayNumber = pilotSlice.pilot.currentPilotDay;
  const themeLabel = dayPlan
    ? PILOT_DAY_THEME_LABELS[dayPlan.theme]
    : '—';
  const districtName = district?.name ?? 'Pilot Bölge';
  const dayTitle = dayPlan?.title ?? 'Pilot haftası';
  const dayGoal = dayPlan?.goal ?? 'Gün planı yükleniyor…';

  return (
    <Animated.View
      entering={FadeInUp.duration(340).springify().damping(22)}
      style={[styles.card, shadows.card]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="navigate" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Pilot Bölge</Text>
            <Text style={styles.districtName} numberOfLines={2}>
              {districtName}
            </Text>
          </View>
        </View>
        <GameChip
          label={PILOT_STATUS_CHIP_LABELS[pilotSlice.pilot.status]}
          tone={pilotStatusChipTone(pilotSlice.pilot.status)}
        />
      </View>

      <View style={styles.dayRow}>
        <Text style={styles.dayLabel}>
          Gün {dayNumber}/{MAX_PILOT_DAYS}
        </Text>
        <Text style={styles.themePill}>{themeLabel}</Text>
      </View>

      <ProgressBar
        progress={dayNumber / MAX_PILOT_DAYS}
        color={colors.primary}
        trackColor={colors.hubGoldTrack}
        height={6}
      />

      <View style={styles.planBlock}>
        <Text style={styles.planTitle}>{dayTitle}</Text>
        <Text style={styles.planGoal} numberOfLines={3}>
          {dayGoal}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  districtName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  themePill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  planBlock: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planGoal: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
