import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { MapOperationPanelModel } from '../utils/mapUiPresentation';

type Props = {
  model: MapOperationPanelModel;
  onPressCta?: () => void;
};

const RISK_COLORS = {
  teal: colors.primary,
  gold: colors.hubGoldDark,
  warn: colors.warning,
  danger: colors.danger,
} as const;

export function MapOperationBottomPanel({ model, onPressCta }: Props) {
  if (!model.visible) {
    return null;
  }

  return (
    <View style={[styles.panel, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            Seçili bölge özeti
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {model.districtLabel}
          </Text>
          {model.characterLine ? (
            <Text style={styles.character} numberOfLines={2}>
              {model.characterLine}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.riskPill,
            { borderColor: `${RISK_COLORS[model.riskTone]}44` },
          ]}>
          <Text
            style={[styles.riskText, { color: RISK_COLORS[model.riskTone] }]}
            numberOfLines={1}>
            {model.riskLabel}
          </Text>
        </View>
      </View>

      {model.sahaNote ? (
        <View style={styles.noteRow}>
          <Ionicons name="document-text-outline" size={13} color={colors.primary} />
          <Text style={styles.noteText} numberOfLines={2}>
            Saha notu: {model.sahaNote}
          </Text>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        {model.metrics.map((metric) => (
          <View key={metric.key} style={styles.metricCell}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {metric.value}
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              {metric.label}
            </Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.cta} onPress={onPressCta}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {model.ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  character: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  riskPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.background,
    maxWidth: '38%',
    flexShrink: 1,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '800',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.headerTealDark,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
