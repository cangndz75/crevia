import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  buildPilotThemeViewModel,
  shouldShowPilotThemeOnReport,
} from '@/core/pilotRhythm';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type ReportPilotThemeSummaryProps = {
  day: number;
};

export function ReportPilotThemeSummary({ day }: ReportPilotThemeSummaryProps) {
  const model = useMemo(() => {
    if (!shouldShowPilotThemeOnReport(day)) {
      return null;
    }
    return buildPilotThemeViewModel(day, { isReport: true, compact: day === 1 });
  }, [day]);

  if (!model) {
    return null;
  }

  const isFinal = model.visibility === 'final';

  return (
    <Animated.View
      entering={FadeInUp.delay(60).duration(240).springify().damping(24)}
      style={[styles.card, isFinal && styles.cardFinal]}>
      <Text style={styles.themeLabel} numberOfLines={1}>
        {`Bugünün Teması: ${model.shortTitle}`}
      </Text>
      <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
        {model.summary}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
    minWidth: 0,
  },
  cardFinal: {
    borderColor: 'rgba(15, 143, 134, 0.35)',
    backgroundColor: '#F4FBF8',
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
