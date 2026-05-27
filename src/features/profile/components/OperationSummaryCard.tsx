import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type {
  ProfileViewModel,
  TodayStatusLine,
} from '@/features/profile/utils/profileModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type OperationSummaryCardProps = {
  model: ProfileViewModel;
  statusLines?: TodayStatusLine[];
};

type GaugeTone = 'success' | 'blue' | 'risk';

function CommandGauge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: GaugeTone;
}) {
  const palette = {
    success: { fill: colors.success, track: colors.successMuted, text: colors.success },
    blue: { fill: colors.secondary, track: colors.secondaryMuted, text: colors.secondary },
    risk: { fill: colors.warning, track: colors.warningMuted, text: '#C47A20' },
  }[tone];

  return (
    <View style={styles.gauge}>
      <Text style={[styles.gaugeValue, { color: palette.text }]}>%{value}</Text>
      <View style={[styles.gaugeTrack, { backgroundColor: palette.track }]}>
        <View
          style={[
            styles.gaugeFill,
            { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: palette.fill },
          ]}
        />
      </View>
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

function ResourceStat({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.resourceStat}>
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={styles.resourceValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.resourceLabel}>{label}</Text>
    </View>
  );
}

function StatusChip({ line }: { line: TodayStatusLine }) {
  const chipColor =
    line.tone === 'positive'
      ? colors.successMuted
      : line.tone === 'caution'
        ? colors.warningMuted
        : colors.primaryMuted;

  return (
    <View style={[styles.statusChip, { backgroundColor: chipColor }]}>
      <Text style={styles.statusChipText} numberOfLines={1}>
        {line.text}
      </Text>
    </View>
  );
}

export function OperationSummaryCard({
  model,
  statusLines = [],
}: OperationSummaryCardProps) {
  return (
    <View style={[styles.shell, shadows.card]}>
      <LinearGradient
        colors={[colors.headerTealDark, colors.headerTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <Ionicons name="radio-outline" size={16} color={colors.hubGold} />
          <Text style={styles.panelTitle}>Komuta Paneli</Text>
        </View>
        <Text style={styles.panelDay} numberOfLines={1}>
          {model.dayLabel}
        </Text>
      </LinearGradient>

      <View style={styles.panelBody}>
        <View style={styles.gaugeRow}>
          <CommandGauge
            label="Memnuniyet"
            value={model.satisfaction}
            tone="success"
          />
          <CommandGauge label="Moral" value={model.morale} tone="blue" />
          <CommandGauge label="Risk" value={model.risk} tone="risk" />
        </View>

        <View style={styles.resourceRow}>
          <ResourceStat
            icon="wallet"
            value={model.budgetFormatted}
            label="Kaynak"
            accent={colors.hubGoldDark}
          />
          <View style={styles.resourceDivider} />
          <ResourceStat
            icon="flash"
            value={model.totalXp.toLocaleString('tr-TR')}
            label="Toplam XP"
            accent={colors.primary}
          />
          <View style={styles.resourceDivider} />
          <ResourceStat
            icon="checkmark-done"
            value={String(model.solvedEvents)}
            label="Olay"
            accent={colors.success}
          />
        </View>

        {statusLines.length > 0 ? (
          <View style={styles.statusRow}>
            {statusLines.map((line) => (
              <StatusChip key={line.id} line={line} />
            ))}
          </View>
        ) : null}

        <View style={styles.regionBar}>
          <Ionicons name="navigate" size={13} color={colors.primary} />
          <Text style={styles.regionText} numberOfLines={1}>
            {model.region}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.22)',
    backgroundColor: colors.surface,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  panelDay: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
  },
  panelBody: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: '#FAF8F2',
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gauge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 5,
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  resourceStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  resourceValue: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  resourceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resourceDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  regionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  regionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
