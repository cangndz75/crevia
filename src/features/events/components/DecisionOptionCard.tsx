import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { DecisionEffectPills } from '@/features/events/components/DecisionEffectPills';
import { ImpactStatGrid } from '@/features/events/components/ImpactStatGrid';
import {
  buildBonusPotentialPills,
  buildDecisionEffectPills,
} from '@/features/events/utils/eventDecisionPresentation';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import { selectPersonnelImpactPreviewForDecision } from '@/core/personnel/personnelPresentation';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { useGameStore, selectPersonnelState } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type DecisionOptionCardProps = {
  event: EventCard;
  decision: EventDecision;
  selected: boolean;
  onSelect: () => void;
  affordability?: DecisionAffordabilityCheck;
};

export function DecisionOptionCard({
  event,
  decision,
  selected,
  onSelect,
  affordability,
}: DecisionOptionCardProps) {
  const personnelState = useGameStore(selectPersonnelState);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const neighborhoods = useGameStore(useShallow((s) => s.neighborhoods));
  const resources = useGameStore((s) => s.resources);

  const personnelPreview = useMemo(
    () =>
      selectPersonnelImpactPreviewForDecision(
        event,
        decision,
        personnelState,
        currentDay,
        { neighborhoods, resources },
      ),
    [currentDay, decision.id, event.id, neighborhoods, personnelState, resources],
  );

  const effectPills = buildDecisionEffectPills(decision.effects, decision.costs);
  const bonusPills = buildBonusPotentialPills(decision.districtBonusFlags);
  const insufficient =
    affordability != null && affordability.cost > 0 && !affordability.canAfford;

  return (
    <Pressable
      onPress={insufficient ? undefined : onSelect}
      disabled={insufficient}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        selected && !insufficient && styles.cardSelected,
        insufficient && styles.cardInsufficient,
        pressed && !insufficient && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: insufficient }}>
      <View style={styles.header}>
        <Text style={styles.title}>{decision.title}</Text>
        {decision.recommended ? (
          <View style={styles.recommended}>
            <Ionicons name="star" size={10} color={colors.primary} />
            <Text style={styles.recommendedText}>ÖNERİLEN</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.description}>{decision.description}</Text>

      {effectPills.length > 0 ? (
        <View style={styles.pillSection}>
          <Text style={styles.pillSectionLabel}>Tahmini etkiler</Text>
          <DecisionEffectPills pills={effectPills} />
        </View>
      ) : (
        <ImpactStatGrid
          effects={decision.effects}
          costs={decision.costs}
          qualitative
        />
      )}

      {bonusPills.length > 0 ? (
        <View style={styles.pillSection}>
          <Text style={styles.pillSectionLabel}>Bonus potansiyeli</Text>
          <DecisionEffectPills pills={bonusPills} />
        </View>
      ) : null}

      {personnelPreview.decisionLine ? (
        <View
          style={[
            styles.personnelPreview,
            personnelPreview.riskLevel === 'high' && styles.personnelPreviewRisk,
          ]}>
          <Text
            style={[
              styles.personnelPreviewText,
              personnelPreview.isLowImpact && styles.personnelPreviewMuted,
            ]}>
            {personnelPreview.decisionLine}
          </Text>
          {personnelPreview.decisionRiskLine ? (
            <Text style={styles.personnelPreviewRiskText}>
              {personnelPreview.decisionRiskLine}
            </Text>
          ) : null}
          {personnelPreview.decisionMistakeLine ? (
            <Text style={styles.personnelPreviewMistakeLine}>
              {personnelPreview.decisionMistakeLine}
            </Text>
          ) : null}
          {personnelPreview.mistakeRiskText ? (
            <Text style={styles.personnelPreviewMistakeDetail}>
              {personnelPreview.mistakeRiskText}
            </Text>
          ) : null}
          {personnelPreview.competencyText ? (
            <Text style={styles.personnelPreviewCompetency}>
              {personnelPreview.competencyText}
            </Text>
          ) : null}
        </View>
      ) : null}

      {insufficient && affordability ? (
        <View style={styles.insufficientWrap}>
          <View style={styles.insufficientPill}>
            <Ionicons
              name="alert-circle-outline"
              size={12}
              color={colors.warning}
            />
            <Text style={styles.insufficientTitle}>Kaynak yetersiz</Text>
          </View>
          <Text style={styles.insufficientDetail}>
            Maliyet: {affordability.formattedCost}
          </Text>
          <Text style={styles.insufficientDetail}>
            Mevcut: {formatSourceWithLabel(affordability.currentSource)}
          </Text>
          <Text style={styles.insufficientMissing}>
            Eksik: {affordability.formattedMissingSource} Kaynak
          </Text>
        </View>
      ) : null}

      {decision.delayHint && !insufficient ? (
        <View style={styles.hint}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.warning}
          />
          <Text style={styles.hintText}>Yarın etkisi olabilir</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFFFE',
  },
  cardInsufficient: {
    opacity: 0.72,
    borderColor: colors.warningMuted,
    backgroundColor: colors.backgroundAlt,
  },
  pressed: {
    opacity: 0.96,
  },
  insufficientWrap: {
    gap: 4,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  insufficientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  insufficientTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  insufficientDetail: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  insufficientMissing: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
    fontSize: 17,
  },
  recommended: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.primary,
  },
  description: {
    ...typography.caption,
    lineHeight: 20,
  },
  pillSection: {
    gap: spacing.xs,
  },
  pillSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  personnelPreview: {
    gap: 3,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  personnelPreviewRisk: {
    borderTopColor: colors.warningMuted,
  },
  personnelPreviewText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  personnelPreviewMuted: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  personnelPreviewRiskText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.warning,
  },
  personnelPreviewMistakeLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.warning,
  },
  personnelPreviewMistakeDetail: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  personnelPreviewCompetency: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -spacing.xs,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
});
