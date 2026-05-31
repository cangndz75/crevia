import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MicroDecisionCardModel } from '@/core/microDecisions/microDecisionTypes';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { spacing } from '@/ui/theme/spacing';

const TONE_STYLES = {
  positive: {
    border: 'rgba(15, 143, 134, 0.35)',
    bg: 'rgba(232, 250, 247, 0.95)',
    accent: '#0F8F86',
  },
  neutral: {
    border: 'rgba(100, 130, 125, 0.28)',
    bg: 'rgba(255, 252, 245, 0.98)',
    accent: '#5E726E',
  },
  warning: {
    border: 'rgba(214, 162, 60, 0.4)',
    bg: 'rgba(255, 250, 243, 0.98)',
    accent: '#B8860B',
  },
  critical: {
    border: 'rgba(200, 90, 70, 0.35)',
    bg: 'rgba(255, 247, 245, 0.98)',
    accent: '#C45A46',
  },
} as const;

type LiveOperationDecisionCardProps = {
  model: MicroDecisionCardModel;
  onSelectOption: (optionId: string) => void;
  resolvedLabel?: string;
};

function rowIcon(name: string): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'people':
      return 'people-outline';
    case 'car':
      return 'car-outline';
    case 'trash':
      return 'trash-outline';
    case 'location':
      return 'location-outline';
    case 'alert-circle':
      return 'alert-circle-outline';
    default:
      return 'pulse-outline';
  }
}

export function LiveOperationDecisionCard({
  model,
  onSelectOption,
  resolvedLabel,
}: LiveOperationDecisionCardProps) {
  const toneStyle = TONE_STYLES[model.tone];

  return (
    <View
      style={[
        styles.card,
        hubPremiumShadowCard(),
        { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
      ]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${toneStyle.accent}18` }]}>
          <Ionicons name={rowIcon(model.iconKey)} size={18} color={toneStyle.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: toneStyle.accent }]} numberOfLines={1}>
            {model.typeLabel}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {model.title}
          </Text>
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={3}>
        {model.summary}
      </Text>
      <Text style={styles.reason} numberOfLines={2}>
        {model.reasonLine}
      </Text>
      {model.advisorLine ? (
        <Text style={styles.advisor} numberOfLines={3}>
          {model.advisorLine}
        </Text>
      ) : null}

      {resolvedLabel ? (
        <View style={styles.resolvedPill}>
          <Text style={styles.resolvedText} numberOfLines={1}>
            {resolvedLabel}
          </Text>
        </View>
      ) : (
        <View style={styles.options}>
          {model.optionRows.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionBtn,
                pressed ? styles.optionPressed : null,
              ]}
              onPress={() => onSelectOption(option.id)}
              accessibilityRole="button"
              accessibilityLabel={option.label}>
              <Text style={styles.optionLabel} numberOfLines={1}>
                {option.label}
              </Text>
              {!model.compact && option.description ? (
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.footer} numberOfLines={2}>
        {model.footerNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  summary: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  reason: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  advisor: {
    fontSize: 12,
    color: '#0F8F86',
    lineHeight: 17,
    backgroundColor: 'rgba(15, 143, 134, 0.08)',
    padding: spacing.sm,
    borderRadius: HUB_PREMIUM_RADIUS.pill,
  },
  options: {
    gap: spacing.xs,
  },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: HUB_PREMIUM_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 0,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  optionDesc: {
    fontSize: 11,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 2,
  },
  footer: {
    fontSize: 11,
    color: HUB_PREMIUM_COLORS.textMuted,
  },
  resolvedPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: HUB_PREMIUM_RADIUS.pill,
  },
  resolvedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F8F86',
  },
});
