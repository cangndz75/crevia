import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DecisionSubsystemOutcome } from '@/features/events/types/decisionResultTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';

type DecisionSubsystemOutcomeCardProps = {
  outcome: DecisionSubsystemOutcome;
};

const STATUS_STYLES = {
  good: {
    chip: 'İyi',
    chipBg: colors.successMuted,
    chipText: colors.success,
    border: 'rgba(59, 175, 122, 0.25)',
  },
  warning: {
    chip: 'Dikkat',
    chipBg: colors.warningMuted,
    chipText: colors.warning,
    border: 'rgba(232, 155, 46, 0.35)',
  },
  critical: {
    chip: 'Kritik',
    chipBg: colors.dangerMuted,
    chipText: colors.danger,
    border: 'rgba(224, 90, 82, 0.35)',
  },
  neutral: {
    chip: 'Nötr',
    chipBg: colors.backgroundAlt,
    chipText: colors.textSecondary,
    border: colors.border,
  },
} as const;

const DEFAULT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  personnel: 'people-outline',
  container: 'trash-outline',
  vehicle: 'car-outline',
  social: 'chatbubbles-outline',
};

export function DecisionSubsystemOutcomeCard({
  outcome,
}: DecisionSubsystemOutcomeCardProps) {
  const palette = STATUS_STYLES[outcome.status];
  const iconName =
    (outcome.iconName as keyof typeof Ionicons.glyphMap | undefined) ??
    DEFAULT_ICONS[outcome.key] ??
    'ellipse-outline';

  return (
    <View style={[styles.card, { borderColor: palette.border }]}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={18} color={eventDetail.teal} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {outcome.title}
        </Text>
        <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
          <Text style={[styles.chipText, { color: palette.chipText }]}>
            {palette.chip}
          </Text>
        </View>
      </View>
      <Text style={styles.primary} numberOfLines={3}>
        {outcome.primaryText}
      </Text>
      {outcome.secondaryText ? (
        <Text style={styles.secondary} numberOfLines={2}>
          {outcome.secondaryText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    shadowColor: '#063F3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  primary: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
  secondary: {
    fontSize: 11,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 15,
  },
});
