import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  DecisionTradeoffChip,
  TradeoffMeterSegment,
} from '@/features/events/utils/decisionTradeoffTypes';

const CHIP_TONE_STYLE: Record<
  DecisionTradeoffChip['tone'],
  { bg: string; text: string; border: string }
> = {
  gain: {
    bg: 'rgba(62, 158, 106, 0.12)',
    text: '#1A7A5C',
    border: 'rgba(62, 158, 106, 0.22)',
  },
  cost: {
    bg: 'rgba(217, 147, 61, 0.12)',
    text: '#B45309',
    border: 'rgba(217, 147, 61, 0.24)',
  },
  risk: {
    bg: 'rgba(220, 90, 90, 0.10)',
    text: '#B42318',
    border: 'rgba(220, 90, 90, 0.20)',
  },
  neutral: {
    bg: 'rgba(11, 107, 97, 0.08)',
    text: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.14)',
  },
};

const METER_DIRECTION: Record<TradeoffMeterSegment['direction'], string> = {
  up: '↑',
  down: '↓',
  steady: '•',
};

type PlanOptionTradeoffStripProps = {
  meter: TradeoffMeterSegment[];
  selected?: boolean;
};

export function PlanOptionTradeoffStrip({ meter, selected = false }: PlanOptionTradeoffStripProps) {
  if (meter.length === 0) return null;

  return (
    <View style={[styles.strip, selected && styles.stripSelected]}>
      {meter.map((segment) => (
        <View key={segment.dimensionId} style={styles.segment}>
          <Text style={styles.segmentLabel} numberOfLines={1}>
            {segment.label}
          </Text>
          <Text
            style={[
              styles.segmentValue,
              segment.direction === 'up' && styles.segmentUp,
              segment.direction === 'down' && styles.segmentDown,
            ]}
            numberOfLines={1}>
            {METER_DIRECTION[segment.direction]}
          </Text>
        </View>
      ))}
    </View>
  );
}

type TradeoffChipRowProps = {
  benefit: DecisionTradeoffChip;
  cost: DecisionTradeoffChip;
};

export function TradeoffChipRow({ benefit, cost }: TradeoffChipRowProps) {
  return (
    <View style={styles.chipRow}>
      <TradeoffChip chip={benefit} />
      <TradeoffChip chip={cost} />
    </View>
  );
}

function TradeoffChip({ chip }: { chip: DecisionTradeoffChip }) {
  const tone = CHIP_TONE_STYLE[chip.tone];
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.chipText, { color: tone.text }]} numberOfLines={1}>
        {chip.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(6, 63, 59, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
    gap: 4,
  },
  stripSelected: {
    backgroundColor: 'rgba(11, 107, 97, 0.10)',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    gap: 1,
  },
  segmentLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  segmentValue: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  segmentUp: {
    color: '#1A7A5C',
  },
  segmentDown: {
    color: '#B45309',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
