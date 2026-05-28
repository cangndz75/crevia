import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { PrimaryDecisionImpact } from '@/features/events/utils/decisionTradeoffPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

const TONE_COLORS = {
  good: colors.success,
  warning: colors.warning,
  risk: '#B42318',
  neutral: colors.textSecondary,
} as const;

type DecisionImpactRowProps = {
  impact: PrimaryDecisionImpact;
};

export function DecisionImpactRow({ impact }: DecisionImpactRowProps) {
  const color = TONE_COLORS[impact.tone];
  const iconName = (impact.iconName ?? 'ellipse-outline') as keyof typeof Ionicons.glyphMap;

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={iconName} size={14} color={color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{impact.label}</Text>
        <Text style={[styles.text, { color }]} numberOfLines={2}>
          {impact.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.25,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
