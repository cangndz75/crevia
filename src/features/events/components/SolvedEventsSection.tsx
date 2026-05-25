import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DecisionRecord } from '@/core/models/DecisionRecord';
import { selectDecisionHistory, useGameStore } from '@/store/useGameStore';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function SolvedDecisionRow({ record }: { record: DecisionRecord }) {
  return (
    <View style={[styles.row, shadows.soft]}>
      <View style={styles.check}>
        <Ionicons name="checkmark" size={18} color={colors.success} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{record.eventTitle}</Text>
        <Text style={styles.decision}>{record.decisionLabel}</Text>
        {record.neighborhoodName ? (
          <Text style={styles.neighborhood}>{record.neighborhoodName}</Text>
        ) : null}
      </View>
      <GameChip label="Çözüldü" tone="success" />
    </View>
  );
}

export function SolvedEventsSection() {
  const history = useGameStore(selectDecisionHistory);

  if (history.length === 0) {
    return null;
  }

  return (
    <View>
      <SectionHeader
        title="Bugün Çözülenler"
        icon="checkmark-done"
        iconColor={colors.success}
      />
      <View style={styles.list}>
        {[...history].reverse().map((record) => (
          <SolvedDecisionRow key={record.id} record={record} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    fontSize: 15,
  },
  decision: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  neighborhood: {
    ...typography.caption,
    fontSize: 12,
  },
});
