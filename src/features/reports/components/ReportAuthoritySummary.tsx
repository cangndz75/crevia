import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isPositiveAuthorityGainSummary } from '@/core/animations/animationPresentation';
import { useSoftPopAnimation } from '@/core/animations/useSoftPopAnimation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportAuthoritySummaryProps = {
  lines: string[];
  compact?: boolean;
};

export function ReportAuthoritySummary({
  lines,
  compact = false,
}: ReportAuthoritySummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  const visibleLines = lines.slice(0, 2);
  const positiveGain = isPositiveAuthorityGainSummary(lines);
  const { animatedStyle: gainPopStyle } = useSoftPopAnimation(positiveGain);

  return (
    <Animated.View style={[styles.card, compact && styles.cardCompact, gainPopStyle]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="ribbon-outline" size={16} color={colors.secondary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title} numberOfLines={1}>
            Yetki Güveni
          </Text>
          {!compact ? (
            <Text style={styles.hint} numberOfLines={1}>
              Resmi unvan günlük değişmez
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.lines}>
        {visibleLines.map((line, index) => (
          <Text key={`authority-${index}`} style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(91,143,212,0.22)',
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    ...typography.label,
    fontSize: 13,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lines: {
    gap: 4,
  },
  line: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
