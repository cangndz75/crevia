import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type {
  DecisionImpactExplanation,
  DecisionImpactExplanationTone,
} from '@/core/decisionImpactExplanation';

type Props = {
  explanation: DecisionImpactExplanation | null | undefined;
  compact?: boolean;
};

const TONE_ACCENTS: Record<
  DecisionImpactExplanationTone,
  { border: string; bg: string; icon: string; text: string }
> = {
  positive: { border: '#BDEFE7', bg: '#F3FBF7', icon: '#0F8F86', text: '#183B3A' },
  watch: { border: '#E6C879', bg: '#FFF9EA', icon: '#B37A17', text: '#3D4F4C' },
  neutral: { border: 'rgba(20,70,66,0.14)', bg: '#FFFCF5', icon: '#0E5F5B', text: '#3D4F4C' },
  recovery: { border: '#BDEFE7', bg: '#F2FAF8', icon: '#4F9653', text: '#183B3A' },
  risk: { border: '#E8B7A0', bg: '#FFF5EF', icon: '#B45C32', text: '#3D4F4C' },
};

export function EventResultImpactExplanationCard({ explanation, compact = false }: Props) {
  if (!explanation?.shouldShowInResult) return null;

  const accent = TONE_ACCENTS[explanation.tone];
  const mainLineLimit = compact ? 1 : Math.min(explanation.maxVisibleLines, 2);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${explanation.title}. ${explanation.mainLine}`}
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: accent.bg, borderColor: accent.border },
      ]}>
      <View style={styles.header}>
        <Ionicons name="git-branch-outline" size={15} color={accent.icon} />
        <Text style={[styles.title, { color: accent.icon }]} numberOfLines={1}>
          {explanation.title}
        </Text>
      </View>
      <Text
        style={[styles.mainLine, { color: accent.text }]}
        numberOfLines={mainLineLimit}
        ellipsizeMode="tail">
        {explanation.mainLine}
      </Text>
      {explanation.tomorrowLine ? (
        <Text
          style={[styles.tomorrowLine, { color: accent.text }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {explanation.tomorrowLine}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
  },
  mainLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  tomorrowLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    opacity: 0.78,
    flexShrink: 1,
  },
});
