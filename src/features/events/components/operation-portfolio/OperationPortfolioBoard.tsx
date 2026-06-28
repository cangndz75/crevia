import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  chipColors,
  operationPortfolioBoardStyles as styles,
  operationPortfolioPalette,
} from '@/features/events/components/operation-portfolio/operationPortfolioBoardStyles';
import type {
  OperationPortfolioBoardPresentation,
  OperationPortfolioChip,
  OperationPortfolioSlotPresentation,
} from '@/features/events/presentation/operationPortfolio';
import { CenterMotionEnter } from '@/features/hub/components/CenterMotionEnter';

type OperationPortfolioBoardProps = {
  presentation: OperationPortfolioBoardPresentation;
};

function PortfolioChip({ chip }: { chip: OperationPortfolioChip }) {
  const colors = chipColors(chip.tone);
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }]}>
      <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
        {chip.label}
      </Text>
    </View>
  );
}

function SlotCard({
  slot,
  index,
  onPress,
}: {
  slot: OperationPortfolioSlotPresentation;
  index: number;
  onPress: (slot: OperationPortfolioSlotPresentation) => void;
}) {
  const slotStyle =
    slot.emphasis === 'primary'
      ? styles.slotPrimary
      : slot.emphasis === 'secondary'
        ? styles.slotSecondary
        : styles.slotCompact;

  return (
    <CenterMotionEnter index={index + 1} disabled={slot.emphasis !== 'primary'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={slot.accessibilityLabel}
        accessibilityState={{ disabled: !slot.cta.enabled }}
        disabled={!slot.cta.enabled}
        onPress={() => {
          if (!slot.cta.enabled) return;
          if (slot.emphasis === 'primary') playLightImpactHaptic();
          onPress(slot);
        }}
        style={({ pressed }) => [slotStyle, pressed && slot.cta.enabled ? { opacity: 0.92 } : undefined]}>
        <View style={styles.slotHeaderRow}>
          <Text style={styles.slotTitle} numberOfLines={1} ellipsizeMode="tail">
            {slot.operationName}
          </Text>
          <PortfolioChip
            chip={{ id: `${slot.id}_priority`, label: slot.priorityBadge, tone: slot.priorityTone }}
          />
        </View>
        <Text style={styles.slotType} numberOfLines={1} ellipsizeMode="tail">
          {slot.operationTypeLabel}
          {slot.districtLabel ? ` · ${slot.districtLabel}` : ''}
        </Text>
        <View style={styles.badgeRow}>
          <PortfolioChip chip={{ id: `${slot.id}_risk`, label: slot.riskLabel, tone: 'warning' }} />
          {slot.resourceChips.map((chip) => (
            <PortfolioChip key={chip.id} chip={chip} />
          ))}
          {slot.districtSensitivityChip ? <PortfolioChip chip={slot.districtSensitivityChip} /> : null}
          {slot.deferRiskChip ? <PortfolioChip chip={slot.deferRiskChip} /> : null}
        </View>
        <Text style={styles.deferLine} numberOfLines={2} ellipsizeMode="tail">
          {slot.deferRiskLine}
        </Text>
        <View style={styles.slotCta}>
          <Text style={styles.slotCtaText} numberOfLines={1}>
            {slot.cta.label}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={operationPortfolioPalette.teal} />
        </View>
      </Pressable>
    </CenterMotionEnter>
  );
}

export function OperationPortfolioBoard({ presentation }: OperationPortfolioBoardProps) {
  const router = useRouter();

  if (!presentation.isVisible) return null;

  const navigateSlot = (slot: OperationPortfolioSlotPresentation) => {
    if (!slot.cta.route) return;
    router.push(slot.cta.route as Href);
  };

  const navigateHero = () => {
    if (!presentation.hero.cta.enabled || !presentation.hero.cta.route) return;
    playLightImpactHaptic();
    router.push(presentation.hero.cta.route as Href);
  };

  const railRatio = presentation.primarySlot ? 1 : 0.35;

  return (
    <View style={[styles.root, { minWidth: 0 }]} accessibilityRole="summary">
      <LinearGradient
        colors={['#FFFCF5', '#F4F9F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boardSurface}>
        <CenterMotionEnter index={0}>
          <View style={styles.heroBlock}>
            <View style={styles.heroTopRow}>
              <View style={styles.dayPill}>
                <Text style={styles.dayPillText} numberOfLines={1}>
                  {presentation.hero.dayLabel}
                </Text>
              </View>
              <View style={styles.tonePill}>
                <Text style={styles.tonePillText} numberOfLines={1} ellipsizeMode="tail">
                  {presentation.hero.portfolioTone}
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
              {presentation.hero.boardTitle}
            </Text>
            <Text style={styles.heroSummary} numberOfLines={2} ellipsizeMode="tail">
              {presentation.hero.summaryLine}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1} ellipsizeMode="tail">
              {presentation.hero.operationCountLabel}
            </Text>
            <View style={styles.priorityRail}>
              <View style={[styles.priorityRailFill, { width: `${Math.round(railRatio * 100)}%` }]} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={presentation.hero.cta.label}
              disabled={!presentation.hero.cta.enabled}
              onPress={navigateHero}
              style={({ pressed }) => [styles.heroCta, pressed ? { opacity: 0.9 } : undefined]}>
              <Text style={styles.heroCtaText} numberOfLines={1}>
                {presentation.hero.cta.label}
              </Text>
            </Pressable>
          </View>
        </CenterMotionEnter>

        {presentation.primarySlot ? (
          <SlotCard slot={presentation.primarySlot} index={0} onPress={navigateSlot} />
        ) : null}

        {presentation.secondarySlots.map((slot, index) => (
          <SlotCard key={slot.id} slot={slot} index={index + 1} onPress={navigateSlot} />
        ))}

        {presentation.capacity.visible ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Günlük kapasite</Text>
            <View style={styles.capacityRow}>
              <View style={styles.capacityMeterTrack}>
                <View
                  style={[
                    styles.capacityMeterFill,
                    { width: `${Math.round(presentation.capacity.meterRatio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.capacityLabel} numberOfLines={1}>
                {presentation.capacity.meterLabel}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              {presentation.capacity.chips.map((chip) => (
                <PortfolioChip key={chip.id} chip={chip} />
              ))}
            </View>
            <Text style={styles.capacitySummary} numberOfLines={2} ellipsizeMode="tail">
              {presentation.capacity.summaryLine}
            </Text>
          </View>
        ) : null}

        {presentation.conflicts.visible ? (
          <View style={styles.sectionCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.sectionTitle}>Portföy çakışması</Text>
              <View style={styles.conflictBadge}>
                <Text style={styles.conflictBadgeText}>{presentation.conflicts.badgeCount}</Text>
              </View>
            </View>
            {presentation.conflicts.signals.map((signal) => (
              <Text key={signal.id} style={styles.conflictLine} numberOfLines={2} ellipsizeMode="tail">
                {signal.line}
              </Text>
            ))}
          </View>
        ) : null}

        {presentation.suggestedPlan.visible ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{presentation.suggestedPlan.advisorLabel}</Text>
            <Text style={styles.deferLine} numberOfLines={2} ellipsizeMode="tail">
              {presentation.suggestedPlan.recommendationLine}
            </Text>
            <View style={styles.badgeRow}>
              {presentation.suggestedPlan.chips.map((chip) => (
                <PortfolioChip key={chip.id} chip={chip} />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={presentation.suggestedPlan.cta.label}
              disabled={!presentation.suggestedPlan.cta.enabled}
              onPress={() => {
                if (!presentation.suggestedPlan.cta.enabled) return;
                router.push(presentation.suggestedPlan.cta.route as Href);
              }}
              style={styles.slotCta}>
              <Text style={styles.slotCtaText} numberOfLines={1}>
                {presentation.suggestedPlan.cta.label}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {presentation.outcomePreview.visible ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Gün sonu önizlemesi</Text>
            <Text style={styles.deferLine} numberOfLines={2} ellipsizeMode="tail">
              {presentation.outcomePreview.tonePreview}
            </Text>
            <View style={styles.badgeRow}>
              {presentation.outcomePreview.chips.map((chip) => (
                <PortfolioChip key={chip.id} chip={chip} />
              ))}
            </View>
            <View style={styles.balanceTrack}>
              <View
                style={[
                  styles.balanceFill,
                  { width: `${Math.round(presentation.outcomePreview.balanceRatio * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.balanceLabels}>
              <Text style={styles.balanceLabelText} numberOfLines={1}>
                {presentation.outcomePreview.balanceLeftLabel}
              </Text>
              <Text style={styles.balanceLabelText} numberOfLines={1}>
                {presentation.outcomePreview.balanceRightLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {presentation.pendingSignals.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bekleyen sinyaller</Text>
            <View style={styles.pendingRow}>
              {presentation.pendingSignals.map((signal) => (
                <View key={signal.id} style={styles.pendingChip}>
                  <Text style={styles.pendingText} numberOfLines={1} ellipsizeMode="tail">
                    {signal.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
