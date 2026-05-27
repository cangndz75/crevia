import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildHubContainerDetail,
  getContainerSeverityTone,
} from '@/core/containers/containerUiHelpers';
import { selectHubContainerSignal } from '@/core/containers/containerSelectors';
import { selectContainerState, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubContainerSignalCardProps = {
  /** Day 1 tutorial coach aktifken kartı gizle */
  hidden?: boolean;
  /** Düşük önemde kompakt chip */
  compact?: boolean;
};

const FALLBACK_LABEL = 'Dengeli';
const FALLBACK_DETAIL = 'Atık operasyonu düzenli';

export function HubContainerSignalCard({
  hidden = false,
  compact = false,
}: HubContainerSignalCardProps) {
  const containerState = useGameStore(selectContainerState);

  const signal = useMemo(
    () => selectHubContainerSignal(containerState),
    [containerState],
  );

  const model = useMemo(() => {
    if (signal) {
      return {
        label: signal.label,
        detail: buildHubContainerDetail(signal.neighborhoodId, signal.detail),
        severity: signal.severity,
      };
    }
    return {
      label: FALLBACK_LABEL,
      detail: FALLBACK_DETAIL,
      severity: 'low' as const,
    };
  }, [signal]);

  const tone = useMemo(
    () => getContainerSeverityTone(model.severity),
    [model.severity],
  );

  const useChip = compact || model.severity === 'low';

  if (hidden) {
    return null;
  }

  if (useChip) {
    return (
      <Animated.View entering={FadeIn.duration(220)}>
        <Pressable
          accessibilityRole="summary"
          accessibilityLabel={`Atık operasyonu: ${model.label}. ${model.detail}`}
          style={({ pressed }) => [
            chipStyles.wrap,
            {
              backgroundColor: tone.background,
              borderColor: tone.border,
            },
            pressed && chipStyles.pressed,
          ]}>
          <View style={[chipStyles.icon, { backgroundColor: tone.iconBackground }]}>
            <Ionicons name="trash-outline" size={14} color={tone.iconColor} />
          </View>
          <View style={chipStyles.textCol}>
            <Text style={[chipStyles.kicker, { color: tone.muted }]}>
              Atık Operasyonu
            </Text>
            <Text style={[chipStyles.label, { color: tone.text }]} numberOfLines={1}>
              {model.label}
            </Text>
          </View>
          <Text style={[chipStyles.detail, { color: tone.muted }]} numberOfLines={1}>
            {model.detail}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(260)}>
      <Pressable
        accessibilityRole="summary"
        accessibilityLabel={`Atık operasyonu: ${model.label}. ${model.detail}`}
        style={({ pressed }) => [
          cardStyles.card,
          {
            backgroundColor: tone.background,
            borderColor: tone.border,
          },
          pressed && cardStyles.pressed,
        ]}>
        <View style={[cardStyles.iconWrap, { backgroundColor: tone.iconBackground }]}>
          <Ionicons name="trash" size={18} color={tone.iconColor} />
        </View>
        <View style={cardStyles.body}>
          <Text style={[cardStyles.kicker, { color: tone.muted }]}>Atık Operasyonu</Text>
          <Text style={[cardStyles.label, { color: tone.text }]}>{model.label}</Text>
          <Text style={[cardStyles.detail, { color: tone.muted }]} numberOfLines={2}>
            {model.detail}
          </Text>
        </View>
        <Ionicons name="alert-circle-outline" size={18} color={tone.iconColor} />
      </Pressable>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.92,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flexShrink: 0,
    gap: 1,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  detail: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.94,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detail: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
