import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildCrisisDeskReportModel } from '@/core/crisis';
import type { DailyReport } from '@/core/models/DailyReport';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type ReportCrisisDeskCardProps = {
  report: DailyReport;
  compact?: boolean;
};

const TONE_BG = {
  positive: 'rgba(15, 143, 134, 0.1)',
  neutral: 'rgba(100, 130, 125, 0.1)',
  warning: 'rgba(245, 230, 200, 0.45)',
  critical: 'rgba(232, 180, 120, 0.35)',
} as const;

export function ReportCrisisDeskCard({
  report,
  compact = false,
}: ReportCrisisDeskCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);

  const model = useMemo(
    () =>
      buildCrisisDeskReportModel(
        gameState,
        monetization,
        crisisState,
        report,
      ),
    [gameState, monetization, crisisState, report],
  );

  if (report.day < 8) {
    return null;
  }
  if (!model || model.lines.length === 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[
          styles.card,
          { backgroundColor: TONE_BG[model.tone] ?? TONE_BG.neutral },
        ]}>
        <Text style={styles.title}>{model.title}</Text>
        {model.lines.map((line) => (
          <Text key={line} style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        ))}
        {model.footerNote ? (
          <Text style={styles.footer} numberOfLines={2}>
            {model.footerNote}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(214, 162, 60, 0.25)',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  line: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
