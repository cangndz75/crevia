import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  OperationPhaseBridgeChipTone,
  OperationPhaseBridgePresentation,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type OperationPhaseBridgeCardProps = {
  bridge: OperationPhaseBridgePresentation;
  reducedMotion?: boolean;
  index?: number;
};

const CHIP_TONE_COLORS: Record<OperationPhaseBridgeChipTone, string> = {
  positive: eventDetail.success,
  mixed: '#C58B18',
  warning: eventDetail.orange,
  critical: '#C44B3F',
  neutral: eventDetail.teal,
};

export function OperationPhaseBridgeCard({
  bridge,
  reducedMotion = false,
  index = 1,
}: OperationPhaseBridgeCardProps) {
  if (!bridge.summary.trim() && bridge.chips.length === 0) return null;

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={index}
      reducedMotion={reducedMotion}
      style={styles.wrap}>
      <View style={[styles.card, shadows.soft]}>
        <Text style={styles.title} numberOfLines={1}>
          {bridge.title}
        </Text>
        {bridge.chips.length > 0 ? (
          <View style={styles.chipRow}>
            {bridge.chips.map((chip) => (
              <View
                key={`${chip.label}-${chip.value}`}
                style={[
                  styles.chip,
                  { borderColor: `${CHIP_TONE_COLORS[chip.tone]}44` },
                ]}>
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {chip.label}
                </Text>
                <Text style={styles.chipValue} numberOfLines={1}>
                  {chip.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {bridge.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {bridge.summary}
          </Text>
        ) : null}
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    marginBottom: 10,
  },
  card: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 10,
    backgroundColor: '#F6F2EA',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  summary: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
});
