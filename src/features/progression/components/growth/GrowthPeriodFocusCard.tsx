import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { GrowthPeriodFocusCardPresentation } from '@/core/periodGoals';
import { growth } from '@/features/progression/theme/growthScreenTokens';

type GrowthPeriodFocusCardProps = {
  model: GrowthPeriodFocusCardPresentation;
};

const CHIP_TONE_COLOR: Record<
  GrowthPeriodFocusCardPresentation['evidenceChips'][number]['tone'],
  string
> = {
  positive: growth.mint,
  mixed: growth.gold,
  warning: growth.gold,
  critical: '#D9755D',
  neutral: growth.textSoft,
  strategic: growth.mint,
};

export function GrowthPeriodFocusCard({ model }: GrowthPeriodFocusCardProps) {
  if (model.visibility !== 'visible') return null;

  const progressColor =
    model.progressTone === 'critical'
      ? '#D9755D'
      : model.progressTone === 'warning'
        ? growth.gold
        : model.progressTone === 'positive'
          ? growth.mint
          : growth.textSoft;

  return (
    <LinearGradient
      colors={[growth.cardElevated, growth.cardSolid]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.sectionTitle}>{model.sectionTitle}</Text>
          <Text style={styles.microcopy}>{model.microcopy}</Text>
        </View>
        <View style={[styles.progressPill, { borderColor: `${progressColor}55` }]}>
          <Text style={[styles.progressText, { color: progressColor }]} numberOfLines={1}>
            {model.progressLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.goalTitle} numberOfLines={2}>
        {model.goalTitle}
      </Text>

      <View style={styles.chipRow}>
        {model.evidenceChips.map((chip) => (
          <View
            key={`${chip.label}-${chip.value}`}
            style={[styles.chip, { borderColor: `${CHIP_TONE_COLOR[chip.tone]}44` }]}>
            <Ionicons name="ellipse" size={6} color={CHIP_TONE_COLOR[chip.tone]} />
            <Text style={styles.chipLabel} numberOfLines={1}>
              {chip.label}
            </Text>
            <Text style={[styles.chipValue, { color: CHIP_TONE_COLOR[chip.tone] }]} numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: growth.radiusCard,
    borderWidth: 1,
    borderColor: growth.border,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: growth.text,
    letterSpacing: 0.2,
  },
  microcopy: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: growth.textSoft,
  },
  progressPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  progressText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
  },
  goalTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: growth.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: growth.textSoft,
  },
  chipValue: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
  },
});
