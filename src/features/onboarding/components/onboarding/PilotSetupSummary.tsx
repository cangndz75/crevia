import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getDistrictAsset } from '@/features/onboarding/data/onboardingAssets';
import type { OnboardingRoadmapPreview } from '@/features/onboarding/utils/onboardingRoadmapPresentation';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

const DECISION_ICONS = {
  fast: 'flash-outline',
  planned: 'calendar-outline',
  partial: 'chatbubble-ellipses-outline',
} as const;

type PilotSetupSummaryProps = {
  preview: OnboardingRoadmapPreview;
  compact?: boolean;
};

export function PilotSetupSummary({ preview, compact = false }: PilotSetupSummaryProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(40).duration(360)}
      style={[styles.wrap, compact && styles.wrapCompact]}>
      <SetupChip
        compact={compact}
        icon="location-outline"
        label="Pilot bölge"
        value={preview.districtShortLabel}
        trailing={
          <Image
            source={getDistrictAsset(preview.districtId)}
            style={[styles.districtThumb, compact && styles.districtThumbCompact]}
            contentFit="contain"
          />
        }
      />
      <SetupChip
        compact={compact}
        icon={DECISION_ICONS[preview.decisionId]}
        label="İlk kararın"
        value={preview.decisionTitle}
        badge={preview.decisionBadge}
      />
    </Animated.View>
  );
}

function SetupChip({
  compact,
  icon,
  label,
  value,
  badge,
  trailing,
}: {
  compact?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  badge?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={[styles.chip, compact && styles.chipCompact]}>
      <View style={[styles.chipIcon, compact && styles.chipIconCompact]}>
        <Ionicons name={icon} size={compact ? 14 : 16} color={onboardingTokens.primary} />
      </View>
      <View style={styles.chipText}>
        <Text style={[styles.chipLabel, compact && styles.chipLabelCompact]}>{label}</Text>
        <Text
          style={[styles.chipValue, compact && styles.chipValueCompact]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {value}
        </Text>
        {badge ? (
          <View style={styles.chipBadge}>
            <Text style={styles.chipBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  wrapCompact: {
    gap: 6,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: onboardingRadii.md,
    backgroundColor: onboardingTokens.card,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  chipCompact: {
    padding: 8,
    gap: 6,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.lavender,
    flexShrink: 0,
  },
  chipIconCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  chipText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  chipLabelCompact: {
    fontSize: 9,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  chipValueCompact: {
    fontSize: 12,
  },
  chipBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: onboardingTokens.lavender,
  },
  chipBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: onboardingTokens.primary,
  },
  districtThumb: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  districtThumbCompact: {
    width: 32,
    height: 32,
  },
});
