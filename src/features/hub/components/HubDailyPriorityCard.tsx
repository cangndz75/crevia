import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAILY_PRIORITY_CHOICES } from '@/core/dailyPriority/dailyPriorityConstants';
import {
  getDailyPriorityChoice,
  getDailyPriorityStatusLabel,
  getDailyPriorityToneColors,
  getLatestPriorityImpactText,
  buildDay1TutorialPriorityLine,
} from '@/core/dailyPriority/dailyPriorityPresentation';
import { isDailyPrioritySelectionRequired } from '@/core/dailyPriority/dailyPrioritySelectors';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubDailyPriorityCard() {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const priorityState = useGameStore((s) => s.dailyPriorityState);
  const isDay1 = useGameStore(selectIsDay1TutorialActive);
  const selectDailyPriority = useGameStore((s) => s.selectDailyPriority);

  const needsSelection = isDailyPrioritySelectionRequired(
    priorityState,
    currentDay,
    isDay1,
  );

  if (isDay1) {
    if (!priorityState?.selectedKey) {
      return null;
    }
    return (
      <View style={[styles.card, styles.cardCompact, shadows.soft]}>
        <Text style={styles.sectionLabel}>Günün Önceliği</Text>
        <Text style={styles.day1Line}>{buildDay1TutorialPriorityLine()}</Text>
      </View>
    );
  }

  if (needsSelection) {
    return (
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.title}>Bugünkü Önceliğin</Text>
        <Text style={styles.subtitle}>Bugün hangi dengeyi öne alacaksın?</Text>
        <View style={styles.choiceList}>
          {DAILY_PRIORITY_CHOICES.map((choice) => (
            <PriorityChoiceRow
              key={choice.key}
              choiceKey={choice.key}
              title={choice.title}
              promise={choice.promiseText}
              tradeoff={choice.tradeoffText}
              iconName={choice.iconName}
              visualTone={choice.visualTone}
              onSelect={() => selectDailyPriority(choice.key)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (!priorityState?.selectedKey) {
    return null;
  }

  const tone = getDailyPriorityToneColors(priorityState.selectedKey);
  const latest = getLatestPriorityImpactText(priorityState);

  return (
    <View style={[styles.card, styles.cardCompact, shadows.soft]}>
      <View style={styles.activeHeader}>
        <Text style={styles.title}>Günün Önceliği</Text>
        <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusChipText, { color: tone.text }]}>
            {getDailyPriorityStatusLabel(priorityState.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.activeTitle}>
        {getDailyPriorityChoice(priorityState.selectedKey).title}
      </Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${priorityState.progressPercent}%`,
                backgroundColor: tone.text,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>%{priorityState.progressPercent}</Text>
      </View>
      {latest ? (
        <Text style={styles.impactLine} numberOfLines={2}>
          {latest}
        </Text>
      ) : null}
      <Text style={styles.linkedNote}>Hedeflerle bağlantılı</Text>
    </View>
  );
}

function PriorityChoiceRow({
  choiceKey,
  title,
  promise,
  tradeoff,
  iconName,
  visualTone,
  onSelect,
}: {
  choiceKey: DailyPriorityKey;
  title: string;
  promise: string;
  tradeoff: string;
  iconName: string;
  visualTone: 'green' | 'blue' | 'amber';
  onSelect: () => void;
}) {
  const tone = getDailyPriorityToneColors(choiceKey);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.choiceRow,
        { borderColor: tone.border, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={[styles.choiceIcon, { backgroundColor: tone.bg }]}>
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={18}
          color={tone.text}
        />
      </View>
      <View style={styles.choiceBody}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choicePromise} numberOfLines={1}>
          {promise}
        </Text>
        <Text style={styles.choiceTradeoff} numberOfLines={1}>
          {tradeoff}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompact: {
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  day1Line: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  choiceList: {
    gap: spacing.xs,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 76,
    maxHeight: 88,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt,
  },
  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  choicePromise: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  choiceTradeoff: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
  impactLine: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  linkedNote: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
