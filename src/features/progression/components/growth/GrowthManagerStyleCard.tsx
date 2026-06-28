import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { PlayerStylePresentationCard } from '@/core/playerStyle/playerStyleTypes';
import { growth } from '@/features/progression/theme/growthScreenTokens';

type GrowthManagerStyleCardProps = {
  model: PlayerStylePresentationCard;
};

const CHIP_TONE_COLOR: Record<
  PlayerStylePresentationCard['evidenceChips'][number]['tone'],
  string
> = {
  positive: growth.mint,
  mixed: growth.gold,
  warning: growth.gold,
  neutral: growth.textSoft,
};

export function GrowthManagerStyleCard({ model }: GrowthManagerStyleCardProps) {
  if (!model.visible) return null;

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
        <View style={styles.confidencePill}>
          <Text style={styles.confidenceText} numberOfLines={1}>
            {model.confidenceLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {model.label}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {model.description}
      </Text>

      <View style={styles.chipRow}>
        {model.evidenceChips.map((chip) => (
          <View key={`${chip.label}-${chip.value}`} style={styles.chip}>
            <Text style={[styles.chipValue, { color: CHIP_TONE_COLOR[chip.tone] }]} numberOfLines={1}>
              {chip.value}
            </Text>
          </View>
        ))}
      </View>

      {model.watchouts[0] ? (
        <View style={styles.watchoutRow}>
          <Ionicons name="alert-circle-outline" size={14} color={growth.gold} />
          <Text style={styles.watchoutText} numberOfLines={2}>
            {model.watchouts[0]}
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: growth.radiusCard,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: growth.borderGold,
    ...growth.shadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: growth.gold,
    letterSpacing: 0.3,
  },
  microcopy: {
    fontSize: 11,
    color: growth.textMuted,
  },
  confidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: growth.radiusChip,
    backgroundColor: growth.goldMuted,
    borderWidth: 1,
    borderColor: growth.goldBorder,
    maxWidth: '42%',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: growth.gold,
    textAlign: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '800',
    color: growth.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: growth.textSoft,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: growth.radiusChip,
    backgroundColor: growth.mintMuted,
    borderWidth: 1,
    borderColor: growth.mintBorder,
    maxWidth: '48%',
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  watchoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
  },
  watchoutText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: growth.textMuted,
  },
});
