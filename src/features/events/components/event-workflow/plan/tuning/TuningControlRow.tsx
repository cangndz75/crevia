import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  PlanTuningValues,
  TuningControlDefinition,
  TuningControlTone,
  TuningLevel,
} from '@/features/events/utils/eventPlanTuningPresentation';

import { TuningSegmentedControl } from './TuningSegmentedControl';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TONE_BUBBLE: Record<TuningControlTone, { bg: string; icon: string }> = {
  teal: { bg: 'rgba(11, 107, 97, 0.10)', icon: eventDetail.teal },
  purple: { bg: 'rgba(120, 86, 180, 0.12)', icon: '#7856B4' },
  amber: { bg: 'rgba(217, 166, 70, 0.14)', icon: '#B45309' },
};

type TuningControlRowProps = {
  control: TuningControlDefinition;
  value: TuningLevel;
  reducedMotion?: boolean;
  onChange: (value: TuningLevel) => void;
};

export function TuningControlRow({
  control,
  value,
  reducedMotion = false,
  onChange,
}: TuningControlRowProps) {
  const bubble = TONE_BUBBLE[control.tone];

  return (
    <View style={styles.row}>
      <View style={styles.topLine}>
        <View style={[styles.iconBubble, { backgroundColor: bubble.bg }]}>
          <Ionicons name={control.icon as IconName} size={16} color={bubble.icon} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{control.title}</Text>
          <Text style={styles.description}>{control.description}</Text>
        </View>
      </View>
      <TuningSegmentedControl
        control={control}
        value={value}
        reducedMotion={reducedMotion}
        onChange={onChange}
      />
    </View>
  );
}

export function tuningValueForControl(
  values: PlanTuningValues,
  key: TuningControlDefinition['key'],
): TuningLevel {
  return values[key];
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 63, 59, 0.06)',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
});
