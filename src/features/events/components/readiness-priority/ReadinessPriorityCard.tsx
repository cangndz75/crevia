import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { ReadinessPrioritySurfacePresentation } from '@/core/readinessStrategicPriority/readinessStrategicPriorityTypes';
import { CenterMotionEnter } from '@/features/hub/components/CenterMotionEnter';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

const CHIP_TONE: Record<
  ReadinessPrioritySurfacePresentation['chips'][number]['tone'],
  { bg: string; text: string; border: string }
> = {
  positive: {
    bg: 'rgba(62, 158, 106, 0.12)',
    text: '#1A7A5C',
    border: 'rgba(62, 158, 106, 0.22)',
  },
  teal: {
    bg: 'rgba(11, 107, 97, 0.12)',
    text: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.20)',
  },
  neutral: {
    bg: 'rgba(6, 63, 59, 0.06)',
    text: eventDetail.textMuted,
    border: 'rgba(6, 63, 59, 0.10)',
  },
  warning: {
    bg: 'rgba(217, 147, 61, 0.12)',
    text: '#B45309',
    border: 'rgba(217, 147, 61, 0.24)',
  },
  critical: {
    bg: 'rgba(220, 90, 90, 0.10)',
    text: '#B42318',
    border: 'rgba(220, 90, 90, 0.20)',
  },
};

type ReadinessPriorityCardProps = {
  presentation: ReadinessPrioritySurfacePresentation;
  compact?: boolean;
  index?: number;
  reducedMotion?: boolean;
};

export function ReadinessPriorityCard({
  presentation,
  compact = false,
  index = 0,
  reducedMotion = false,
}: ReadinessPriorityCardProps) {
  if (presentation.visibility !== 'visible') return null;

  const heroTone =
    presentation.tone === 'critical'
      ? (['#FFF5F5', '#FFE8E8'] as const)
      : presentation.tone === 'warning'
        ? (['#FFFBF5', '#FFF4E6'] as const)
        : (['#F4FBF9', '#E8F6F2'] as const);

  return (
    <CenterMotionEnter index={index} disabled={reducedMotion}>
      <LinearGradient colors={heroTone} style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.headerRow}>
          <Ionicons
            name={presentation.tone === 'positive' ? 'shield-checkmark-outline' : 'pulse-outline'}
            size={compact ? 14 : 16}
            color={eventDetail.tealDark}
          />
          <Text style={styles.eyebrow}>Bugünün Hazırlık Önceliği</Text>
        </View>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {presentation.hero.title}
        </Text>
        {!compact ? (
          <Text style={styles.description} numberOfLines={2}>
            {presentation.hero.description}
          </Text>
        ) : null}
        <View style={styles.chipRow}>
          {presentation.chips.map((chip) => {
            const tone = CHIP_TONE[chip.tone];
            return (
              <View
                key={chip.id}
                style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.chipText, { color: tone.text }]} numberOfLines={1}>
                  {chip.label}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.ctaHint} numberOfLines={1}>
          {presentation.ctaHint}
        </Text>
      </LinearGradient>
    </CenterMotionEnter>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
    gap: 6,
  },
  cardCompact: {
    padding: 10,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: eventDetail.tealDark,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: eventDetail.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ctaHint: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.tealDark,
    marginTop: 2,
  },
});
