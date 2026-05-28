import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';

import { DecisionImpactRow } from '@/features/events/components/DecisionImpactRow';
import { DecisionPriorityFitChip } from '@/features/events/components/DecisionPriorityFitChip';
import { DecisionRiskChip } from '@/features/events/components/DecisionRiskChip';
import { DecisionStrategyChip } from '@/features/events/components/DecisionStrategyChip';
import { DecisionTradeoffLine } from '@/features/events/components/DecisionTradeoffLine';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import { selectAuthorityPermissionPreviewForDecision } from '@/core/authority/authorityPermissionPreview';
import type { AuthorityPermissionPreview } from '@/core/authority/authorityPermissionPreview';
import { selectPersonnelImpactPreviewForDecision } from '@/core/personnel/personnelPresentation';
import { selectVehicleImpactPreviewForDecision } from '@/core/vehicles/vehiclePresentation';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { buildDecisionOptionCardPresentation } from '@/features/events/utils/decisionOptionCardIntegration';
import {
  buildDecisionPrepLines,
  getDecisionOptionVariantConfig,
  type DecisionOptionCardVariant,
} from '@/features/events/utils/decisionTradeoffPresentation';
import {
  useGameStore,
  selectPersonnelState,
  selectVehicleStateFromStore,
} from '@/store/useGameStore';
import { decisionOptionCardAllowsPressFeedback } from '@/ui/feedback/pressFeedback';
import { usePressScaleFeedback } from '@/ui/feedback/usePressScaleFeedback';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AuthorityPermissionPreviewRowProps = {
  preview: AuthorityPermissionPreview;
};

function AuthorityPermissionPreviewRow({ preview }: AuthorityPermissionPreviewRowProps) {
  const toneStyle =
    preview.tone === 'active'
      ? styles.authorityPreviewActive
      : preview.tone === 'locked_preview'
        ? styles.authorityPreviewLocked
        : styles.authorityPreviewWatching;

  const iconName =
    preview.tone === 'active'
      ? 'shield-checkmark-outline'
      : preview.tone === 'locked_preview'
        ? 'trending-up-outline'
        : 'eye-outline';

  const iconColor =
    preview.tone === 'active'
      ? colors.primary
      : preview.tone === 'locked_preview'
        ? colors.hubGoldDark
        : colors.secondary;

  return (
    <View style={[styles.authorityPreviewRow, toneStyle]}>
      <Ionicons name={iconName} size={12} color={iconColor} />
      <View style={styles.authorityPreviewTextWrap}>
        <Text style={styles.authorityPreviewTitle} numberOfLines={1}>
          {preview.title}
        </Text>
        <Text style={styles.authorityPreviewLine} numberOfLines={2}>
          {preview.line}
        </Text>
      </View>
    </View>
  );
}

type DecisionOptionCardProps = {
  event: EventCard;
  decision: EventDecision;
  selected: boolean;
  onSelect: () => void;
  affordability?: DecisionAffordabilityCheck;
  variant?: DecisionOptionCardVariant;
  containerStyle?: StyleProp<ViewStyle>;
};

export function DecisionOptionCard({
  event,
  decision,
  selected,
  onSelect,
  affordability,
  variant = 'full',
  containerStyle,
}: DecisionOptionCardProps) {
  const variantConfig = getDecisionOptionVariantConfig(variant);
  const personnelState = useGameStore(selectPersonnelState);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const neighborhoods = useGameStore((s) => s.neighborhoods);
  const resources = useGameStore((s) => s.resources);
  const dailyPriorityKey = useGameStore((s) => s.dailyPriorityState?.selectedKey);
  const fieldDuty = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.fieldDuty : undefined;
  });
  const routePreparation = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.routePreparation : undefined;
  });
  const neighborhoodPatrol = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.neighborhoodPatrol : undefined;
  });

  const insufficient =
    affordability != null && affordability.cost > 0 && !affordability.canAfford;

  const vehiclePreview = useMemo(
    () =>
      insufficient
        ? null
        : selectVehicleImpactPreviewForDecision({
            vehicleState,
            event: {
              id: event.id,
              eventType: event.eventType,
              title: event.title,
              description: event.description,
              category: event.category,
              neighborhoodId: event.neighborhoodId,
              districtIds: event.districtIds,
              tags: event.filterTags,
            },
            decision: {
              id: decision.id,
              title: decision.title,
              description: decision.description,
              style: decision.style,
              decisionStyle: decision.decisionStyle,
              costs: decision.costs,
            },
            day: currentDay,
            routePreparation,
          }),
    [currentDay, decision, event, insufficient, routePreparation, vehicleState],
  );

  const personnelPreview = useMemo(
    () =>
      insufficient
        ? null
        : selectPersonnelImpactPreviewForDecision(
            event,
            decision,
            personnelState,
            currentDay,
            { neighborhoods, resources, fieldDuty, neighborhoodPatrol },
          ),
    [
      currentDay,
      decision,
      event,
      fieldDuty,
      neighborhoodPatrol,
      insufficient,
      neighborhoods,
      personnelState,
      resources,
    ],
  );

  const prepLines = useMemo(
    () =>
      buildDecisionPrepLines({
        fieldDutyLine: personnelPreview?.fieldDutyLine,
        routePreparationLine: vehiclePreview?.routePreparationLine,
        neighborhoodPatrolLine: personnelPreview?.neighborhoodPatrolLine,
      }),
    [
      personnelPreview?.fieldDutyLine,
      personnelPreview?.neighborhoodPatrolLine,
      vehiclePreview?.routePreparationLine,
    ],
  );

  const presentation = useMemo(
    () =>
      buildDecisionOptionCardPresentation({
        event,
        decision,
        variant,
        dailyPriorityKey,
        personnelPreview,
        vehiclePreview,
        affordability,
      }),
    [
      affordability,
      dailyPriorityKey,
      decision,
      event,
      personnelPreview,
      variant,
      vehiclePreview,
    ],
  );

  const authorityPreview = useMemo(
    () =>
      insufficient
        ? null
        : selectAuthorityPermissionPreviewForDecision({
            authorityState,
            decision,
            event,
            day: currentDay,
          }),
    [authorityState, currentDay, decision, event, insufficient],
  );

  const showPriorityChip = presentation.showPriorityChip;
  const allowsPress = decisionOptionCardAllowsPressFeedback(insufficient);
  const { animatedStyle, onPressIn, onPressOut } = usePressScaleFeedback(!allowsPress);

  const handlePress = useCallback(() => {
    if (!allowsPress) return;
    playSelectionHaptic();
    onSelect();
  }, [allowsPress, onSelect]);

  return (
    <View style={containerStyle}>
      <AnimatedPressable
        onPress={allowsPress ? handlePress : undefined}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={!allowsPress}
        style={[
          styles.card,
          variantConfig.compactPadding && styles.cardCompact,
          variant === 'quick' && styles.cardQuick,
          shadows.card,
          selected && !insufficient && styles.cardSelected,
          selected && !insufficient && variant === 'full' && styles.cardSelectedFull,
          insufficient && styles.cardInsufficient,
          animatedStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${decision.title}, ${presentation.tradeoff}`}
        accessibilityState={{ selected, disabled: insufficient }}>
        {insufficient && presentation.unavailableReason ? (
          <View style={styles.unavailableBanner}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.warning} />
            <Text style={styles.unavailableText} numberOfLines={1}>
              {presentation.unavailableReason}
            </Text>
          </View>
        ) : null}

        <View style={styles.topRow}>
          <DecisionStrategyChip
            label={presentation.strategyLabel}
            tone={presentation.strategyTone}
          />
          <View style={styles.topRowRight}>
            {showPriorityChip ? (
              <DecisionPriorityFitChip fit={presentation.priorityFit!} />
            ) : (
              <DecisionRiskChip level={presentation.riskLevel} />
            )}
            {showPriorityChip ? (
              <DecisionRiskChip level={presentation.riskLevel} />
            ) : null}
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text
            style={[styles.title, variantConfig.compactPadding && styles.titleCompact]}
            numberOfLines={variantConfig.titleMaxLines}>
            {decision.title}
          </Text>
          {decision.recommended && !insufficient ? (
            <View style={styles.recommended}>
              <Ionicons name="star" size={10} color={colors.primary} />
            </View>
          ) : null}
        </View>

        <DecisionTradeoffLine
          text={presentation.tradeoff}
          numberOfLines={variantConfig.maxTradeoffLines}
          compact={variantConfig.compactPadding}
        />

        {!insufficient && presentation.primaryImpacts.length > 0 ? (
          <View style={styles.impactBlock}>
            {presentation.primaryImpacts.map((impact) => (
              <DecisionImpactRow key={impact.key} impact={impact} />
            ))}
            {presentation.extraSummary ? (
              <Text style={styles.extraImpacts} numberOfLines={1}>
                {presentation.extraSummary}
              </Text>
            ) : null}
          </View>
        ) : null}

        {presentation.showDetail
          ? prepLines.lines.map((line) => (
              <Text
                key={line}
                style={styles.detailLinePositive}
                numberOfLines={2}>
                {line}
              </Text>
            ))
          : null}

        {presentation.showDetail && prepLines.overflowLine ? (
          <Text style={styles.detailLineMuted} numberOfLines={1}>
            {prepLines.overflowLine}
          </Text>
        ) : null}

        {presentation.showDetail && personnelPreview?.decisionMistakeLine ? (
          <Text style={styles.detailLine} numberOfLines={2}>
            {personnelPreview.decisionMistakeLine}
          </Text>
        ) : null}

        {presentation.showDetail && vehiclePreview?.riskText ? (
          <Text style={styles.detailLineMuted} numberOfLines={2}>
            {vehiclePreview.riskText}
          </Text>
        ) : null}

        {presentation.showDetail && authorityPreview?.visible ? (
          <AuthorityPermissionPreviewRow preview={authorityPreview} />
        ) : null}

        {insufficient && affordability && variant !== 'quick' ? (
          <View style={styles.insufficientMeta}>
            <Text style={styles.insufficientDetail}>
              Maliyet: {affordability.formattedCost}
            </Text>
            <Text style={styles.insufficientDetail}>
              Mevcut: {formatSourceWithLabel(affordability.currentSource)}
            </Text>
          </View>
        ) : null}

        {decision.delayHint && !insufficient && variant === 'full' ? (
          <View style={styles.hint}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={colors.warning}
            />
            <Text style={styles.hintText}>Yarın etkisi olabilir</Text>
          </View>
        ) : null}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 6,
    borderRadius: radius.lg,
  },
  cardQuick: {
    maxHeight: 156,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFFFE',
  },
  cardSelectedFull: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInsufficient: {
    opacity: 0.78,
    borderColor: colors.warningMuted,
    backgroundColor: colors.backgroundAlt,
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  topRowRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
    flexShrink: 1,
    maxWidth: '58%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    color: colors.textPrimary,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  recommended: {
    marginTop: 2,
    backgroundColor: colors.primaryMuted,
    padding: 4,
    borderRadius: radius.sm,
  },
  impactBlock: {
    gap: 6,
    marginTop: 2,
  },
  extraImpacts: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingLeft: 4,
  },
  detailLinePositive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A6B5C',
    lineHeight: 15,
  },
  detailLine: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    lineHeight: 15,
  },
  detailLineMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  authorityPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 1,
  },
  authorityPreviewActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(26,143,138,0.18)',
  },
  authorityPreviewLocked: {
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.22)',
  },
  authorityPreviewWatching: {
    backgroundColor: colors.secondaryMuted,
    borderColor: 'rgba(91,143,212,0.18)',
  },
  authorityPreviewTextWrap: {
    flex: 1,
    gap: 1,
  },
  authorityPreviewTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.15,
  },
  authorityPreviewLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 15,
  },
  insufficientMeta: {
    gap: 2,
    paddingTop: 2,
  },
  insufficientDetail: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
});
