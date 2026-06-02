import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SeasonEndDetailSheetModel } from '@/core/seasonEnd';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type SeasonEndEvaluationDetailSheetProps = {
  visible: boolean;
  model: SeasonEndDetailSheetModel | undefined;
  onClose: () => void;
};

const TONE_COLORS = {
  positive: '#0F8F86',
  neutral: '#5C7A75',
  warning: '#C9922E',
  critical: '#C45C4A',
} as const;

const TONE_BG = {
  positive: 'rgba(15, 143, 134, 0.1)',
  neutral: 'rgba(100, 130, 125, 0.1)',
  warning: 'rgba(214, 162, 60, 0.15)',
  critical: 'rgba(232, 180, 120, 0.35)',
} as const;

const RATING_LABELS: Record<string, string> = {
  excellent: 'Üst düzey',
  strong: 'Güçlü',
  steady: 'Dengeli',
  strained: 'Zorlayıcı',
  critical: 'Kritik',
};

function iconForKey(iconKey: string): keyof typeof Ionicons.glyphMap {
  switch (iconKey) {
    case 'crisis':
      return 'warning-outline';
    case 'assignment':
      return 'people-outline';
    case 'operational_resources':
      return 'construct-outline';
    case 'district_scope':
      return 'location-outline';
    case 'social_pulse':
      return 'chatbubble-ellipses-outline';
    case 'season_goal':
      return 'flag-outline';
    default:
      return 'pulse-outline';
  }
}

export function SeasonEndEvaluationDetailSheet({
  visible,
  model,
  onClose,
}: SeasonEndEvaluationDetailSheetProps) {
  if (!model) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {model.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {model.subtitle}
              </Text>
              <View
                style={[
                  styles.ratingPill,
                  { backgroundColor: TONE_BG[model.overallRating === 'excellent' || model.overallRating === 'strong' ? 'positive' : model.overallRating === 'steady' ? 'neutral' : 'warning'] },
                ]}>
                <Text style={styles.ratingPillText} numberOfLines={1}>
                  {model.ratingLabel}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={model.closeLabel}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.overallSummary} numberOfLines={2}>
            {model.overallSummary}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {model.categoryEvaluations.map((cat) => (
              <View
                key={cat.category}
                style={[
                  styles.categoryCard,
                  { backgroundColor: TONE_BG[cat.tone] ?? TONE_BG.neutral },
                ]}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={iconForKey(cat.iconKey)}
                    size={18}
                    color={TONE_COLORS[cat.tone]}
                  />
                  <Text style={styles.categoryTitle} numberOfLines={1}>
                    {cat.title}
                  </Text>
                  <Text
                    style={[styles.categoryRating, { color: TONE_COLORS[cat.tone] }]}
                    numberOfLines={1}>
                    {RATING_LABELS[cat.rating] ?? cat.rating}
                  </Text>
                </View>
                <Text style={styles.categorySummary} numberOfLines={2}>
                  {cat.summary}
                </Text>
                {cat.evidenceLines.map((line) => (
                  <Text key={line} style={styles.evidence} numberOfLines={2}>
                    {line}
                  </Text>
                ))}
                <Text style={styles.recommendation} numberOfLines={2}>
                  {cat.recommendationLine}
                </Text>
              </View>
            ))}

            <View style={styles.metricsBlock}>
              <Text style={styles.metricsTitle} numberOfLines={1}>
                Operasyon dönemi özeti
              </Text>
              {model.metricRows.map((row) => (
                <View key={row.id} style={styles.metricRow}>
                  <View style={styles.metricLabelRow}>
                    <Ionicons
                      name={iconForKey(row.iconKey)}
                      size={16}
                      color={TONE_COLORS[row.tone]}
                    />
                    <Text style={styles.metricLabel} numberOfLines={1}>
                      {row.label}
                    </Text>
                    <Text
                      style={[styles.metricValue, { color: TONE_COLORS[row.tone] }]}
                      numberOfLines={1}>
                      {row.valueLabel}
                    </Text>
                  </View>
                  <Text style={styles.metricSummary} numberOfLines={2}>
                    {row.summary}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.advisorCard}>
              <Text style={styles.advisorLabel} numberOfLines={1}>
                Ece
              </Text>
              <Text style={styles.advisorLine} numberOfLines={2}>
                {model.advisorLine}
              </Text>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={model.closeLabel}
            onPress={onClose}
            style={({ pressed }) => [styles.closeCta, pressed && styles.closeCtaPressed]}>
            <Text style={styles.closeCtaText}>{model.closeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#F7F3EB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  closePressed: {
    opacity: 0.7,
  },
  overallSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  scroll: {
    flexGrow: 0,
    minWidth: 0,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryCard: {
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    minWidth: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 0,
  },
  categoryRating: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  categorySummary: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  evidence: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  recommendation: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  metricsBlock: {
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.55)',
    gap: 8,
    minWidth: 0,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricRow: {
    gap: 4,
    minWidth: 0,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  metricSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    paddingLeft: 22,
  },
  advisorCard: {
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 143, 134, 0.08)',
    gap: 4,
    minWidth: 0,
  },
  advisorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F8F86',
  },
  advisorLine: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  closeCta: {
    marginTop: spacing.sm,
    backgroundColor: '#0F8F86',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeCtaPressed: {
    opacity: 0.85,
  },
  closeCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
