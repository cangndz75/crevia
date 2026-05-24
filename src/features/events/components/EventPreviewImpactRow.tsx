import { StyleSheet, Text, View } from 'react-native';

import { EventPreviewEffects } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type EventPreviewImpactRowProps = {
  effects: EventPreviewEffects;
};

function ImpactPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'public' | 'risk' | 'xp' | 'budget';
}) {
  const palette = {
    public: { bg: colors.dangerMuted, text: colors.danger },
    risk: { bg: colors.primaryMuted, text: colors.primary },
    xp: { bg: colors.purpleMuted, text: colors.purple },
    budget: { bg: '#FCE8EC', text: colors.danger },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>
        {value} {label}
      </Text>
    </View>
  );
}

export function EventPreviewImpactRow({ effects }: EventPreviewImpactRowProps) {
  const publicPrefix = effects.publicSatisfaction >= 0 ? '+' : '';
  const riskPrefix = effects.risk >= 0 ? '+' : '';
  const budget =
    effects.budget != null
      ? `${effects.budget >= 0 ? '+' : '-'}₺${Math.abs(effects.budget).toLocaleString('tr-TR')}`
      : null;

  return (
    <View style={styles.row}>
      <ImpactPill
        label="Halk"
        value={`${publicPrefix}${effects.publicSatisfaction}`}
        tone="public"
      />
      <ImpactPill
        label="Risk"
        value={`${riskPrefix}${effects.risk}`}
        tone="risk"
      />
      <ImpactPill label="XP" value={`+${effects.xp}`} tone="xp" />
      {budget ? (
        <ImpactPill label="Bütçe" value={budget} tone="budget" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
