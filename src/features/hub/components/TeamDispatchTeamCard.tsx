import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getPersonnelTeamImage } from '@/core/assets/creviaAssetPresentation';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { teamDispatch } from '@/features/hub/theme/teamDispatchTokens';
import type {
  TeamDispatchCardVariant,
  TeamDispatchTeamCardModel,
} from '@/features/hub/utils/teamDispatchPresentation';
import { CreviaAnimatedPressable } from '@/shared/motion';

type TeamDispatchTeamCardProps = {
  model: TeamDispatchTeamCardModel;
  index: number;
  teamName: string;
  onDetails?: () => void;
  onPrimaryAction?: () => void;
};

type VariantTheme = {
  badgeBg: string;
  badgeText: string;
  barPrimary: string;
  barSecondary: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  avatarBadgeBg: string;
  avatarBadgeIcon: string;
};

function getVariantTheme(variant: TeamDispatchCardVariant): VariantTheme {
  if (variant === 'maintenance') {
    return {
      badgeBg: teamDispatch.maintenance.badgeBg,
      badgeText: teamDispatch.maintenance.badgeText,
      barPrimary: teamDispatch.maintenance.bar,
      barSecondary: teamDispatch.maintenance.bar,
      infoBg: teamDispatch.maintenance.infoBg,
      infoBorder: teamDispatch.maintenance.infoBorder,
      infoText: teamDispatch.maintenance.infoText,
      avatarBadgeBg: teamDispatch.maintenance.badgeText,
      avatarBadgeIcon: '#FFFFFF',
    };
  }
  if (variant === 'resting') {
    return {
      badgeBg: teamDispatch.resting.badgeBg,
      badgeText: teamDispatch.resting.badgeText,
      barPrimary: teamDispatch.resting.bar,
      barSecondary: teamDispatch.ready.bar,
      infoBg: teamDispatch.resting.infoBg,
      infoBorder: teamDispatch.resting.infoBorder,
      infoText: teamDispatch.resting.infoText,
      avatarBadgeBg: teamDispatch.gold,
      avatarBadgeIcon: '#FFFFFF',
    };
  }
  return {
    badgeBg: teamDispatch.ready.badgeBg,
    badgeText: teamDispatch.ready.badgeText,
    barPrimary: teamDispatch.ready.bar,
    barSecondary: teamDispatch.ready.bar,
    infoBg: teamDispatch.ready.infoBg,
    infoBorder: teamDispatch.ready.infoBorder,
    infoText: teamDispatch.ready.infoText,
    avatarBadgeBg: teamDispatch.ready.bar,
    avatarBadgeIcon: '#FFFFFF',
  };
}

function AnimatedMetricBar({
  label,
  value,
  tone,
  delayMs,
}: {
  label: string;
  value: number;
  tone: string;
  delayMs: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0) return;
    progress.value = 0;
    progress.value = withTiming(value, { duration: 700 + delayMs });
  }, [delayMs, progress, trackWidth, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: (progress.value / 100) * trackWidth,
  }));

  return (
    <View style={styles.metricCol}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}%</Text>
      </View>
      <View
        style={styles.metricTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={[styles.metricFill, { backgroundColor: tone }, fillStyle]} />
      </View>
    </View>
  );
}

export function TeamDispatchTeamCard({
  model,
  index,
  teamName,
  onDetails,
  onPrimaryAction,
}: TeamDispatchTeamCardProps) {
  const theme = getVariantTheme(model.variant);

  return (
    <Animated.View
      entering={FadeInUp.delay(180 + index * 90).duration(420)}
      style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <HubAssetImage
            source={getPersonnelTeamImage(teamName)}
            containerStyle={styles.avatar}
            contentFit="cover"
          />
          <View style={[styles.avatarBadge, { backgroundColor: theme.avatarBadgeBg }]}>
            <Ionicons
              name={model.avatarBadgeIcon}
              size={10}
              color={theme.avatarBadgeIcon}
            />
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {model.name}
          </Text>
          <View style={styles.roleRow}>
            <Ionicons name={model.roleIcon} size={12} color={teamDispatch.textMuted} />
            <Text style={styles.role} numberOfLines={1}>
              {model.specialistLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: theme.badgeBg }]}>
          <View style={[styles.statusDot, { backgroundColor: theme.badgeText }]} />
          <Text style={[styles.statusText, { color: theme.badgeText }]}>
            {model.statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <AnimatedMetricBar
          label={model.metrics[0].label}
          value={model.metrics[0].value}
          tone={theme.barPrimary}
          delayMs={index * 40}
        />
        <AnimatedMetricBar
          label={model.metrics[1].label}
          value={model.metrics[1].value}
          tone={theme.barSecondary}
          delayMs={80 + index * 40}
        />
      </View>

      <View
        style={[
          styles.infoBox,
          { backgroundColor: theme.infoBg, borderColor: theme.infoBorder },
        ]}>
        <Ionicons name={model.statusIcon} size={14} color={theme.badgeText} />
        <Text style={[styles.infoText, { color: theme.infoText }]} numberOfLines={2}>
          {model.statusMessage}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onDetails}
          style={({ pressed }) => [styles.detailsBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Detaylar">
          <Text style={styles.detailsText}>Detaylar</Text>
        </Pressable>

        {model.variant === 'ready' ? (
          <CreviaAnimatedPressable
            onPress={onPrimaryAction}
            style={styles.assignBtn}
            accessibilityRole="button"
            accessibilityLabel={model.primaryActionLabel}>
            <Text style={styles.assignText}>{model.primaryActionLabel}</Text>
            <View style={styles.assignArrow}>
              <Ionicons name="arrow-forward" size={16} color={teamDispatch.primaryGreen} />
            </View>
          </CreviaAnimatedPressable>
        ) : model.variant === 'resting' ? (
          <Pressable
            onPress={onPrimaryAction}
            style={({ pressed }) => [
              styles.secondaryCta,
              styles.restingCta,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={model.primaryActionLabel}>
            <Ionicons
              name={model.primaryActionIcon}
              size={15}
              color={teamDispatch.resting.ctaText}
            />
            <Text style={styles.restingCtaText}>{model.primaryActionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onPrimaryAction}
            style={({ pressed }) => [
              styles.secondaryCta,
              styles.maintenanceCta,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={model.primaryActionLabel}>
            <Text style={styles.maintenanceCtaText}>{model.primaryActionLabel}</Text>
            <Ionicons name={model.primaryActionIcon} size={15} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: teamDispatch.card,
    borderWidth: 1,
    borderColor: teamDispatch.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1C2838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5F1',
    overflow: 'visible',
    flexShrink: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: teamDispatch.card,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: teamDispatch.textDark,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
    color: teamDispatch.textMuted,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  metricCol: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  metricHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: teamDispatch.textMuted,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '800',
    color: teamDispatch.textDark,
  },
  metricTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEF2F0',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    minWidth: 92,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: teamDispatch.border,
    backgroundColor: teamDispatch.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: teamDispatch.textDark,
  },
  assignBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: teamDispatch.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  assignText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingLeft: 8,
  },
  assignArrow: {
    width: 44,
    height: '100%',
    backgroundColor: teamDispatch.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCta: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  restingCta: {
    backgroundColor: teamDispatch.resting.ctaBg,
    borderWidth: 1,
    borderColor: teamDispatch.resting.ctaBorder,
  },
  restingCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: teamDispatch.resting.ctaText,
    flexShrink: 1,
  },
  maintenanceCta: {
    backgroundColor: teamDispatch.maintenance.ctaBg,
  },
  maintenanceCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: teamDispatch.maintenance.ctaText,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
