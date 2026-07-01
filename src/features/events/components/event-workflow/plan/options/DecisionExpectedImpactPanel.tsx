import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { DecisionExpectedImpactPreview } from '@/features/events/utils/decisionTradeoffTypes';

const TONE_COLOR: Record<
  DecisionExpectedImpactPreview['lines'][number]['tone'],
  string
> = {
  positive: '#1A7A5C',
  negative: '#B42318',
  warning: '#B45309',
  neutral: eventDetail.tealDark,
};

type Props = {
  model: DecisionExpectedImpactPreview;
  selected?: boolean;
  compact?: boolean;
};

export function DecisionExpectedImpactPanel({
  model,
  selected = false,
  compact = false,
}: Props) {
  if (model.visibleCount < 2) return null;

  return (
    <View style={[styles.panel, selected && styles.panelSelected, compact && styles.panelCompact]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.disclaimer} numberOfLines={1}>
          {model.disclaimer}
        </Text>
      </View>

      <View style={styles.grid}>
        {model.lines.map((line) => (
          <View key={line.id} style={styles.line}>
            <Text style={styles.lineLabel} numberOfLines={1}>
              {line.label}
            </Text>
            <Text style={[styles.lineValue, { color: TONE_COLOR[line.tone] }]} numberOfLines={1}>
              {line.valueText}
            </Text>
          </View>
        ))}
      </View>

      {model.sideEffectLine ? (
        <Text style={styles.sideEffect} numberOfLines={2}>
          {model.sideEffectLine}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.14)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  panelSelected: {
    borderColor: 'rgba(11, 107, 97, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  panelCompact: {
    paddingVertical: 6,
  },
  headerRow: {
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.tealDark,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  disclaimer: {
    fontSize: 9,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  line: {
    minWidth: '28%',
    flexGrow: 1,
    gap: 1,
  },
  lineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.15,
  },
  lineValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  sideEffect: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    lineHeight: 14,
  },
});
