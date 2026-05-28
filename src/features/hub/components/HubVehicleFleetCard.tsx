import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { selectRecommendedVehicleFleetActions } from '@/core/vehicles/vehicleManualActions';
import type { VehicleFleetActionRecommendationTone } from '@/core/vehicles/vehicleTypes';
import {
  buildVehicleFleetStatus,
  getVehicleFleetToneColors,
} from '@/core/vehicles/vehicleUiHelpers';
import {
  selectDay,
  selectVehicleStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubVehicleFleetCardProps = {
  /** Day 1 tutorial coach aktifken kartı gizle */
  hidden?: boolean;
};

const ACTION_TONE_COLORS: Record<
  VehicleFleetActionRecommendationTone,
  { background: string; text: string; border: string }
> = {
  neutral: {
    background: 'rgba(59, 130, 246, 0.12)',
    text: colors.primary,
    border: 'rgba(59, 130, 246, 0.28)',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.14)',
    text: '#B45309',
    border: 'rgba(245, 158, 11, 0.32)',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.12)',
    text: colors.danger,
    border: 'rgba(239, 68, 68, 0.28)',
  },
  good: {
    background: 'rgba(16, 185, 129, 0.12)',
    text: colors.success,
    border: 'rgba(16, 185, 129, 0.28)',
  },
};

export function HubVehicleFleetCard({ hidden = false }: HubVehicleFleetCardProps) {
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const day = useGameStore(selectDay);
  const applyVehicleFleetActionFromHub = useGameStore(
    (s) => s.applyVehicleFleetActionFromHub,
  );

  const model = useMemo(
    () => buildVehicleFleetStatus(vehicleState),
    [vehicleState],
  );

  const tone = useMemo(
    () => getVehicleFleetToneColors(model.statusTone),
    [model.statusTone],
  );

  const recommendations = useMemo(
    () => selectRecommendedVehicleFleetActions(vehicleState, day),
    [vehicleState, day],
  );

  const runFleetAction = useCallback(
    (rec: (typeof recommendations)[number]) => {
      const result = applyVehicleFleetActionFromHub(rec.type, rec.vehicleId);
      Alert.alert(
        result.success ? 'Filo' : 'İşlem yapılamadı',
        result.message || `${rec.vehicleName} için işlem tamamlandı.`,
        [{ text: 'Tamam' }],
      );
    },
    [applyVehicleFleetActionFromHub],
  );

  if (hidden || model.totalCount === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(240)}>
      <View
        accessibilityRole="summary"
        accessibilityLabel={`${model.title}: ${model.availableText}. ${model.summaryText}`}
        style={[
          styles.card,
          shadows.soft,
          {
            backgroundColor: tone.background,
            borderColor: tone.border,
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
              <Ionicons name="car-outline" size={16} color={tone.iconColor} />
            </View>
            <Text style={[styles.title, { color: tone.text }]}>{model.title}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: tone.chipBackground }]}>
            <Text style={[styles.chipText, { color: tone.chipText }]}>
              {model.statusLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.availableLine, { color: tone.text }]}>
          {model.availableText}
        </Text>

        <View style={styles.metricsRow}>
          <Text style={[styles.metric, { color: tone.muted }]} numberOfLines={1}>
            {model.workloadText}
          </Text>
          <View style={[styles.metricDot, { backgroundColor: tone.border }]} />
          <Text style={[styles.metric, { color: tone.muted }]} numberOfLines={1}>
            {model.routeText}
          </Text>
          <View style={[styles.metricDot, { backgroundColor: tone.border }]} />
          <Text style={[styles.metric, { color: tone.muted }]} numberOfLines={1}>
            {model.maintenanceText}
          </Text>
        </View>

        <Text style={[styles.summary, { color: tone.muted }]} numberOfLines={2}>
          {model.summaryText}
        </Text>

        {recommendations.length > 0 ? (
          <View style={styles.actionsWrap}>
            {recommendations.map((rec) => {
              const actionTone = ACTION_TONE_COLORS[rec.tone];
              return (
                <Pressable
                  key={`${rec.type}-${rec.vehicleId}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${rec.label}: ${rec.description}`}
                  onPress={() => runFleetAction(rec)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: actionTone.background,
                      borderColor: actionTone.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text style={[styles.actionLabel, { color: actionTone.text }]}>
                    {rec.label}
                  </Text>
                  <Text
                    style={[styles.actionHint, { color: tone.muted }]}
                    numberOfLines={1}>
                    {rec.vehicleName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  availableLine: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metric: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  summary: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionHint: {
    fontSize: 10,
    fontWeight: '600',
  },
});
