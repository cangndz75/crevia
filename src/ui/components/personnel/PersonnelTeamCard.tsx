import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { PersonnelTeamCardView } from '@/core/personnel/personnelTypes';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type PersonnelTeamCardProps = {
  team: PersonnelTeamCardView;
  variant?: 'default' | 'compact';
  style?: ViewStyle;
  onRestPress?: () => void;
  restDisabled?: boolean;
};

function CompactMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.compactMetric}>
      <Text style={styles.compactMetricLabel}>{label}</Text>
      <View style={styles.compactTrack}>
        <View style={[styles.compactFill, { width: `${value}%`, backgroundColor: tone }]} />
      </View>
      <Text style={styles.compactMetricValue}>{value}</Text>
    </View>
  );
}

export function PersonnelTeamCard({
  team,
  variant = 'default',
  style,
  onRestPress,
  restDisabled = false,
}: PersonnelTeamCardProps) {
  const isHighFatigue = team.fatigue >= 71;
  const isLowMorale = team.morale < 40;
  const isOnRestPlan = team.restModeLabel != null;

  const fatigueTone = isHighFatigue
    ? colors.warning
    : team.fatigue >= 51
      ? colors.hubGoldDark
      : colors.secondary;
  const moraleTone = isLowMorale
    ? colors.warning
    : team.morale >= 60
      ? colors.success
      : colors.textSecondary;

  const primaryWarning = team.warningLabels[0];

  if (variant === 'compact') {
    return (
      <GameCard
        padding="md"
        style={[
          styles.compactCard,
          isHighFatigue && styles.compactCardWarn,
          isOnRestPlan && styles.compactCardResting,
          style,
        ]}>
        <View style={styles.compactHeader}>
          <View style={styles.compactTitleBlock}>
            <Text style={styles.compactName} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={styles.compactRole} numberOfLines={1}>
              {team.roleLabel}
            </Text>
          </View>
          <GameChip
            label={team.statusLabel}
            tone={
              isHighFatigue
                ? 'warning'
                : team.restModeLabel === 'Bugün tam dinlenmede'
                  ? 'neutral'
                  : 'purple'
            }
          />
        </View>

        <View style={styles.compactMetricsRow}>
          <CompactMetric label="Yorg." value={team.fatigue} tone={fatigueTone} />
          <CompactMetric label="Moral" value={team.morale} tone={moraleTone} />
        </View>

        {team.supportTag ? (
          <Text style={styles.supportTag}>{team.supportTag}</Text>
        ) : null}

        {primaryWarning ? (
          <Text style={styles.compactWarning} numberOfLines={2}>
            {primaryWarning}
          </Text>
        ) : null}

        {isLowMorale ? (
          <View style={styles.moraleHintRow}>
            <Ionicons name="alert-circle-outline" size={12} color={colors.warning} />
            <Text style={styles.moraleHint}>Moral düşük</Text>
          </View>
        ) : null}

        {onRestPress && !isOnRestPlan ? (
          <Pressable
            onPress={onRestPress}
            disabled={restDisabled}
            style={({ pressed }) => [
              styles.restBtn,
              pressed && styles.restBtnPressed,
              restDisabled && styles.restBtnDisabled,
            ]}>
            <Ionicons name="moon-outline" size={14} color={colors.secondary} />
            <Text style={styles.restBtnText}>Dinlendir</Text>
          </Pressable>
        ) : isOnRestPlan ? (
          <Text style={styles.restingLabel}>{team.restModeLabel}</Text>
        ) : null}
      </GameCard>
    );
  }

  return (
    <GameCard padding="md" style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={typography.subtitle}>{team.name}</Text>
          <Text style={typography.caption}>{team.roleLabel}</Text>
        </View>
        <GameChip label={team.statusLabel} tone="neutral" />
      </View>

      <MetricBar label="Yorgunluk" value={team.fatigue} tone={fatigueTone} />
      <MetricBar label="Moral" value={team.morale} tone={moraleTone} />

      <Text style={[typography.caption, styles.band]}>
        {team.fatigueBandLabel} · Bugün {team.todayWorkedHours.toFixed(0)} saat
      </Text>
      <Text style={[typography.body, styles.readiness]}>{team.readinessText}</Text>

      {team.warningLabels.length > 0 ? (
        <View style={styles.warnings}>
          {team.warningLabels.slice(0, 2).map((warning) => (
            <Text key={warning} style={[typography.caption, styles.warning]}>
              {warning}
            </Text>
          ))}
        </View>
      ) : null}
    </GameCard>
  );
}

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={typography.caption}>{value}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <View
          style={[
            styles.metricFill,
            { width: `${value}%`, backgroundColor: tone },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  metricRow: {
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  band: {
    color: colors.textSecondary,
  },
  readiness: {
    color: colors.textPrimary,
  },
  warnings: {
    gap: 2,
  },
  warning: {
    color: colors.warning,
  },
  compactCard: {
    width: 248,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCardWarn: {
    borderColor: colors.warningMuted,
    backgroundColor: colors.surface,
  },
  compactCardResting: {
    opacity: 0.92,
    borderColor: colors.border,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  compactTitleBlock: {
    flex: 1,
    gap: 2,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  compactRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactMetricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  compactMetric: {
    flex: 1,
    gap: 3,
  },
  compactMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactTrack: {
    height: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  compactFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  compactMetricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  compactWarning: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.warning,
  },
  supportTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  moraleHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moraleHint: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  restBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  restBtnPressed: {
    opacity: 0.85,
  },
  restBtnDisabled: {
    opacity: 0.5,
  },
  restBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  restingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
