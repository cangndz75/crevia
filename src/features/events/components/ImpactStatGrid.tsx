import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  EffectChipData,
  buildEffectChips,
} from '@/features/events/utils/eventPresentation';
import { buildQualitativeEffectChips } from '@/features/events/utils/decisionPresentation';
import { EventDecisionCost, EventDecisionEffect } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type ImpactStatGridProps = {
  effects: EventDecisionEffect;
  costs?: EventDecisionCost;
  /** Karar kartlarında sayısal değer yerine Düşük/Orta/Yüksek gösterir. */
  qualitative?: boolean;
};

const toneStyles = {
  positive: { bg: colors.successMuted, text: colors.success },
  negative: { bg: colors.dangerMuted, text: colors.danger },
  neutral: { bg: colors.background, text: colors.textSecondary },
  xp: { bg: colors.purpleMuted, text: colors.purple },
};

function StatBox({ chip }: { chip: EffectChipData }) {
  const palette = toneStyles[chip.tone];

  return (
    <View style={[styles.box, { backgroundColor: palette.bg }]}>
      <Ionicons name={chip.icon} size={16} color={palette.text} />
      <Text style={styles.boxLabel}>{chip.label}</Text>
      <Text style={[styles.boxValue, { color: palette.text }]}>{chip.value}</Text>
    </View>
  );
}

export function ImpactStatGrid({
  effects,
  costs,
  qualitative = false,
}: ImpactStatGridProps) {
  const chips = qualitative
    ? buildQualitativeEffectChips(effects, costs)
    : buildEffectChips(effects);

  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <StatBox key={chip.key} chip={chip} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  box: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    gap: 4,
  },
  boxLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  boxValue: {
    fontSize: 11,
    fontWeight: '800',
  },
});
