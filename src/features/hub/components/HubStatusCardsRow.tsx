import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildVehicleFleetStatus,
  getVehicleFleetToneColors,
} from '@/core/vehicles/vehicleUiHelpers';
import {
  buildHubSocialPulseModel,
  type HubSocialPulseStatusTone,
} from '@/features/social/utils/socialHubModel';
import {
  selectSocialPulseStateFromStore,
  selectVehicleStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubStatusCardsRowProps = {
  hidden?: boolean;
  /** Day 1–2: kartların altında kısa beklenti notu */
  mutedNote?: string;
};

const SOCIAL_TONE: Record<
  HubSocialPulseStatusTone,
  { chipBg: string; chipText: string; chart: string }
> = {
  good: {
    chipBg: colors.successMuted,
    chipText: colors.success,
    chart: colors.success,
  },
  balanced: {
    chipBg: colors.primaryMuted,
    chipText: colors.primary,
    chart: colors.primary,
  },
  caution: {
    chipBg: colors.warningMuted,
    chipText: colors.warning,
    chart: colors.warning,
  },
  crisis: {
    chipBg: colors.dangerMuted,
    chipText: colors.danger,
    chart: colors.danger,
  },
};

function MiniSparkline({ color }: { color: string }) {
  const heights = [0.4, 0.55, 0.45, 0.7, 0.6, 0.85];
  return (
    <View style={sparkStyles.row}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            sparkStyles.bar,
            {
              height: 4 + h * 12,
              backgroundColor: color,
              opacity: 0.35 + h * 0.5,
            },
          ]}
        />
      ))}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 18,
    marginTop: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    maxWidth: 5,
  },
});

function VehicleIconRow({
  availableCount,
  totalCount,
}: {
  availableCount: number;
  totalCount: number;
}) {
  return (
    <View style={fleetIconStyles.row}>
      {Array.from({ length: totalCount }, (_, i) => {
        const isAvailable = i < availableCount;
        return (
          <View
            key={i}
            style={[
              fleetIconStyles.iconWrap,
              !isAvailable && fleetIconStyles.iconUnavailable,
            ]}>
            <Ionicons
              name="bus"
              size={12}
              color={isAvailable ? colors.primary : colors.textSecondary}
            />
          </View>
        );
      })}
    </View>
  );
}

const fleetIconStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnavailable: {
    backgroundColor: colors.backgroundAlt,
    opacity: 0.55,
  },
});

export function HubStatusCardsRow({
  hidden = false,
  mutedNote,
}: HubStatusCardsRowProps) {
  const router = useRouter();
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const social = useMemo(
    () => buildHubSocialPulseModel(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );
  const fleet = useMemo(
    () => buildVehicleFleetStatus(vehicleState),
    [vehicleState],
  );
  const fleetTone = useMemo(
    () => getVehicleFleetToneColors(fleet.statusTone),
    [fleet.statusTone],
  );
  const socialTone = SOCIAL_TONE[social.statusTone];

  if (hidden || fleet.totalCount === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
    <Animated.View entering={FadeIn.duration(240)} style={styles.row}>
      <Pressable
        onPress={() => router.push('/social' as Href)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          shadows.soft,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.kicker}>SOSYAL NABIZ</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{social.score}</Text>
          <View style={[styles.chip, { backgroundColor: socialTone.chipBg }]}>
            <Text style={[styles.chipText, { color: socialTone.chipText }]}>
              {social.statusLabel}
            </Text>
          </View>
        </View>
        <MiniSparkline color={socialTone.chart} />
        <Text style={styles.signal} numberOfLines={2}>
          {social.signalLine}
        </Text>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Detaya Git</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primary} />
        </View>
      </Pressable>

      <View
        accessibilityRole="summary"
        style={[
          styles.card,
          shadows.soft,
          {
            backgroundColor: fleetTone.background,
            borderColor: fleetTone.border,
          },
        ]}>
        <Text style={[styles.kicker, { color: fleetTone.muted }]}>ARAÇ FİLOSU</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.fleetAvailable, { color: fleetTone.text }]}>
            {fleet.availableText}
          </Text>
          <View style={[styles.chip, { backgroundColor: fleetTone.chipBackground }]}>
            <Text style={[styles.chipText, { color: fleetTone.chipText }]}>
              {fleet.statusLabel}
            </Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <Text style={[styles.metric, { color: fleetTone.muted }]}>
            {fleet.workloadText}
          </Text>
          <Text style={[styles.metric, { color: fleetTone.muted }]}>
            {fleet.routeText}
          </Text>
          <Text style={[styles.metric, { color: fleetTone.muted }]}>
            {fleet.maintenanceText}
          </Text>
        </View>
        <VehicleIconRow
          availableCount={fleet.availableCount}
          totalCount={fleet.totalCount}
        />
      </View>
    </Animated.View>
    {mutedNote ? (
      <Text style={styles.mutedNote}>{mutedNote}</Text>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  mutedNote: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    opacity: 0.85,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 2,
  },
  pressed: {
    opacity: 0.92,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  score: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  fleetAvailable: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
    minWidth: 0,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  signal: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 13,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  linkText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  metric: {
    fontSize: 9,
    fontWeight: '600',
  },
});
