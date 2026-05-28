import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildHubContainerDetail,
  getContainerSeverityTone,
} from '@/core/containers/containerUiHelpers';
import { selectHubContainerSignal } from '@/core/containers/containerSelectors';
import {
  buildVehicleFleetStatus,
  getVehicleFleetToneColors,
} from '@/core/vehicles/vehicleUiHelpers';
import { buildHubSocialPulseModel } from '@/features/social/utils/socialHubModel';
import { usePersonnelTeams } from '@/features/personnel/hooks/usePersonnelTeams';
import {
  selectContainerState,
  selectSocialPulseStateFromStore,
  selectVehicleStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type HubSystemSignalsStripProps = {
  hidden?: boolean;
  showPersonnel?: boolean;
};

function SignalChip({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  borderColor,
  backgroundColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  borderColor: string;
  backgroundColor: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.chipLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.chipValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.chip,
          { borderColor, backgroundColor },
          pressed && styles.chipPressed,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.chip, { borderColor, backgroundColor }]} accessibilityRole="summary">
      {content}
    </View>
  );
}

export function HubSystemSignalsStrip({
  hidden = false,
  showPersonnel = true,
}: HubSystemSignalsStripProps) {
  const router = useRouter();
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const containerState = useGameStore(selectContainerState);
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const teams = usePersonnelTeams();

  const containerChip = useMemo(() => {
    const signal = selectHubContainerSignal(containerState);
    const label = signal?.label ?? 'Dengeli';
    const detail = signal
      ? buildHubContainerDetail(signal.neighborhoodId, signal.detail)
      : 'Operasyon düzenli';
    const severity = signal?.severity ?? 'low';
    const tone = getContainerSeverityTone(severity);
    return { label, detail, tone };
  }, [containerState]);

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

  const personnelSummary = useMemo(() => {
    if (teams.length === 0) return null;
    const strained = teams.filter((t) => t.fatigue >= 71 || t.morale < 40).length;
    const value =
      strained > 0
        ? `${strained} ekip yorgun`
        : `${teams.length} ekip hazır`;
    return value;
  }, [teams]);

  const socialTone =
    social.statusTone === 'crisis'
      ? { bg: colors.dangerMuted, border: colors.danger, text: colors.danger }
      : social.statusTone === 'caution'
        ? { bg: colors.warningMuted, border: colors.warning, text: colors.warning }
        : { bg: colors.primaryMuted, border: colors.primary, text: colors.primary };

  if (hidden || fleet.totalCount === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <Text style={styles.sectionTitle}>Sistem Sinyalleri</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <SignalChip
          icon="trash-outline"
          iconColor={containerChip.tone.iconColor}
          iconBg={containerChip.tone.iconBackground}
          label="Atık"
          value={containerChip.label}
          borderColor={containerChip.tone.border}
          backgroundColor={containerChip.tone.background}
        />
        <SignalChip
          icon="chatbubbles-outline"
          iconColor={socialTone.text}
          iconBg={socialTone.bg}
          label="Sosyal"
          value={`${social.score} · ${social.statusLabel}`}
          borderColor={socialTone.border}
          backgroundColor={socialTone.bg}
          onPress={() => router.push('/social' as Href)}
        />
        <SignalChip
          icon="bus-outline"
          iconColor={fleetTone.text}
          iconBg={fleetTone.chipBackground}
          label="Filo"
          value={fleet.availableText}
          borderColor={fleetTone.border}
          backgroundColor={fleetTone.background}
        />
        {showPersonnel && personnelSummary ? (
          <SignalChip
            icon="people-outline"
            iconColor={colors.purple}
            iconBg={colors.purpleMuted}
            label="Personel"
            value={personnelSummary}
            borderColor={colors.border}
            backgroundColor={colors.surface}
          />
        ) : null}
      </ScrollView>
      <Text style={styles.containerDetail} numberOfLines={1}>
        {containerChip.detail}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  row: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 108,
    maxWidth: 148,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chipPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  containerDetail: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: -2,
  },
});
