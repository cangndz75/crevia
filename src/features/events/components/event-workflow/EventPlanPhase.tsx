import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import { playLightImpactHaptic, playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import type { EventCard } from '@/core/models/EventCard';
import { getRiskLevelLabel } from '@/core/content/mockGameData';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventPlanPhasePresentation,
  type EventPlanExpectedImpact,
  type EventPlanStrategyCard,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { buildInspectHeroChips } from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { CreviaMotionView, useCreviaReducedMotion } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  selectedStrategyId: EventPlanStrategyId;
  onSelectStrategy: (strategyId: EventPlanStrategyId) => void;
  onConfirmPlan: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

type PlanlaImpactCard = {
  id: string;
  title: string;
  body: string;
  level: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  inverted?: boolean;
};

const STEP_LABELS = ['Durum', 'Planla', 'Uygula', 'Değerlendir'] as const;

const STRATEGY_ICONS: Record<EventPlanStrategyId, keyof typeof Ionicons.glyphMap> = {
  rapid_response: 'flash-outline',
  balanced_plan: 'scale-outline',
  long_term_fix: 'sparkles-outline',
};

const STRATEGY_COPY: Record<
  EventPlanStrategyId,
  { title: string; description: string; cost: string; duration: string; effect: string }
> = {
  rapid_response: {
    title: 'Hızlı Müdahale',
    description: 'Sahaya hızlı çıkar, ilk riski kısa sürede düşürür.',
    cost: 'Yüksek',
    duration: '1-2 hafta',
    effect: 'Hızlı',
  },
  balanced_plan: {
    title: 'Dengeli Plan',
    description: 'Güven artışı ve kaynak kullanımı dengede kalır.',
    cost: 'Orta',
    duration: '2-4 hafta',
    effect: 'Yüksek',
  },
  long_term_fix: {
    title: 'Kapsamlı Çözüm',
    description: 'Kalıcı iyileştirme sağlar, uygulaması daha yavaştır.',
    cost: 'Yüksek',
    duration: '4-6 hafta',
    effect: 'Kalıcı',
  },
};

const IMPACT_BANDS: Record<EventPlanExpectedImpact['band'], { label: string; value: number }> = {
  low: { label: 'Düşük', value: 36 },
  medium: { label: 'Orta', value: 64 },
  high: { label: 'Yüksek', value: 88 },
};

function cardIndex(strategyId: EventPlanStrategyId): number {
  if (strategyId === 'rapid_response') return 0;
  if (strategyId === 'long_term_fix') return 2;
  return 1;
}

function normalizeCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('light') || lower.includes('aydın')) return 'Aydınlatma Sorunu';
  if (lower.includes('waste') || lower.includes('temizlik')) return 'Temizlik Baskısı';
  if (lower.includes('noise')) return 'Mahalle Gürültüsü';
  return category || 'Operasyon Olayı';
}

function estimateTargetHouseholds(event: EventCard): string {
  const base = Math.max(180, Math.min(480, Math.round(event.urgencyHours * 80)));
  return `${base} hane`;
}

function buildImpactCards(strategy: EventPlanStrategyCard): PlanlaImpactCard[] {
  const impactMap = new Map(strategy.expectedImpact.map((impact) => [impact.id, impact]));
  const trust = impactMap.get('district_trust') ?? impactMap.get('happiness');
  const happiness = impactMap.get('happiness') ?? impactMap.get('district_trust');
  const resource = impactMap.get('resource_cost');

  const trustBand = IMPACT_BANDS[trust?.band ?? 'high'];
  const happinessBand = IMPACT_BANDS[happiness?.band ?? 'high'];
  const resourceBand = IMPACT_BANDS[resource?.band ?? 'low'];
  const resourceValue = 100 - resourceBand.value;
  const resourceLabel = resourceValue >= 60 ? 'Düşük' : resourceValue >= 42 ? 'Orta' : 'Yüksek';

  return [
    {
      id: 'trust',
      title: 'Güven',
      body: 'Gece algısı toparlanır.',
      level: trustBand.label,
      value: trustBand.value,
      icon: 'shield-checkmark-outline',
    },
    {
      id: 'happiness',
      title: 'Memnuniyet',
      body: 'Mahalle tepkisi yumuşar.',
      level: happinessBand.label,
      value: happinessBand.value,
      icon: 'heart-outline',
    },
    {
      id: 'pressure',
      title: 'Kaynak Baskısı',
      body: 'Ekip yükü dengelenir.',
      level: resourceLabel,
      value: resourceValue,
      icon: 'briefcase-outline',
      inverted: true,
    },
  ];
}

export function EventPlanPhase({
  event,
  bottomPadding,
  selectedStrategyId,
  onSelectStrategy,
  onConfirmPlan,
  phaseHint = null,
  gameDay = 1,
  isDay1LearningEvent = false,
}: EventPlanPhaseProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);

  const authorityGameplayContext = useMemo(
    () =>
      buildAuthorityGameplayPresentationContext({
        authorityState,
        day: gameDay,
        isDay1LearningEvent,
      }),
    [authorityState, gameDay, isDay1LearningEvent],
  );

  const presentation = useMemo(
    () =>
      buildEventPlanPhasePresentation({
        event,
        selectedStrategyId,
        day: gameDay,
        isDay1LearningEvent,
        authorityGameplayContext,
      }),
    [
      authorityGameplayContext,
      event,
      gameDay,
      isDay1LearningEvent,
      selectedStrategyId,
    ],
  );

  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const selectedStrategy =
    presentation.strategies.find((strategy) => strategy.id === presentation.selectedStrategyId) ??
    presentation.strategies[0]!;
  const impactCards = useMemo(() => buildImpactCards(selectedStrategy), [selectedStrategy]);
  const compact = width < 370;

  const handleConfirm = () => {
    playLightImpactHaptic();
    onConfirmPlan();
  };

  return (
    <View style={styles.root} accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top + 8, 18),
            paddingBottom: Math.max(bottomPadding, 134 + Math.max(insets.bottom, 12)),
          },
        ]}>
        <PlanHeader compact={compact} />
        <StepperRouteCard reducedMotion={reducedMotion} />
        <EventSummaryCard
          event={event}
          priorityLabel={getRiskLevelLabel(event.riskLevel)}
          remainingLabel={heroChips.remaining}
        />
        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}
        <MiniScenePreviewCard reducedMotion={reducedMotion} />
        <View style={styles.sectionIntro}>
          <Text style={styles.sectionTitle}>Plan Seçenekleri</Text>
          <Text style={styles.sectionSubtitle}>Mahallen için en uygun planı seç.</Text>
        </View>
        <View style={styles.planList}>
          {presentation.strategies.map((strategy) => (
            <PlanOptionCard
              key={strategy.id}
              strategy={strategy}
              recommended={strategy.id === presentation.recommendedStrategyId}
              reducedMotion={reducedMotion}
              onSelect={() => {
                playSelectionHaptic();
                onSelectStrategy(strategy.id);
              }}
            />
          ))}
        </View>
        <ExpectedImpactSection cards={impactCards} selectedStrategyId={selectedStrategy.id} />
        <AdvisorCommentCard text={presentation.advisorComment.text} reducedMotion={reducedMotion} />
        <SelectedPlanSummaryCard
          event={event}
          selectedStrategy={selectedStrategy}
          categoryLabel={normalizeCategory(event.category)}
          targetLabel={estimateTargetHouseholds(event)}
        />
      </ScrollView>
      <StickyPlanApproveBar
        label={presentation.primaryCta.label === 'Yönlendirmeye Geç' ? 'Planı Onayla' : presentation.primaryCta.label}
        disabled={!presentation.primaryCta.enabled}
        onPress={handleConfirm}
      />
    </View>
  );
}

function PlanHeader({ compact }: { compact: boolean }) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={0} style={styles.header}>
      <View style={styles.headerIconButton}>
        <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
      </View>
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Planla</Text>
        <View style={styles.headerAccent}>
          <View style={styles.headerAccentLine} />
          <Ionicons name="sparkles" size={10} color="#C58B18" />
          <View style={styles.headerAccentLine} />
        </View>
      </View>
      <View style={styles.resourceBadges}>
        <View style={[styles.resourceBadge, styles.resourceBadgeMint]}>
          <Ionicons name="leaf-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.resourceText}>42</Text>
        </View>
        <View style={[styles.resourceBadge, styles.resourceBadgeGold]}>
          <Ionicons name="star-outline" size={13} color="#B77713" />
          <Text style={[styles.resourceText, styles.resourceTextGold]}>8</Text>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function StepperRouteCard({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const activeGlow = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.12]) }],
  }));

  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={1} style={styles.cardWrap}>
      <View style={[styles.routeCard, shadows.soft]}>
        <View style={styles.routeTrack}>
          <View style={styles.routeEndpoint}>
            <Ionicons name="map-outline" size={14} color={eventDetail.teal} />
          </View>
          {STEP_LABELS.map((label, index) => {
            const active = index === 1;
            const done = index === 0;
            return (
              <View key={label} style={styles.routeStep}>
                <View style={styles.nodeLine} />
                {active ? <Animated.View style={[styles.activeNodeGlow, activeGlow]} /> : null}
                <View
                  style={[
                    styles.routeNode,
                    done && styles.routeNodeDone,
                    active && styles.routeNodeActive,
                  ]}>
                  {done ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.routeNodeText,
                        active && styles.routeNodeTextActive,
                      ]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.routeLabel,
                    done && styles.routeLabelDone,
                    active && styles.routeLabelActive,
                  ]}
                  numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
          <View style={[styles.routeEndpoint, styles.flagEndpoint]}>
            <Ionicons name="flag" size={14} color="#B77713" />
          </View>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function EventSummaryCard({
  event,
  priorityLabel,
  remainingLabel,
}: {
  event: EventCard;
  priorityLabel: string;
  remainingLabel: string;
}) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={2} style={styles.cardWrap}>
      <View style={[styles.summaryCard, shadows.soft]}>
        <View style={styles.summaryCrest}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.summaryTextBlock}>
          <Text style={styles.overline}>Olay Özeti</Text>
          <Text style={styles.summaryTitle} numberOfLines={2}>
            {event.title || 'Mahalle Güveni Düşüyor'}
          </Text>
          <Text style={styles.summaryMeta} numberOfLines={1}>
            {event.district || 'Çınar Mahallesi'}
          </Text>
          <Text style={styles.summaryMeta} numberOfLines={1}>
            {normalizeCategory(event.category)}
          </Text>
        </View>
        <View style={styles.summaryBadges}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{priorityLabel}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color={eventDetail.tealDark} />
            <Text style={styles.timeText}>{remainingLabel.replace(' kaldı', '')}</Text>
          </View>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function MiniScenePreviewCard({ reducedMotion }: { reducedMotion: boolean }) {
  const zoom = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    zoom.value = withTiming(1, { duration: 900 });
  }, [reducedMotion, zoom]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(zoom.value, [0, 1], [0.97, 1]) }],
  }));

  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={3} style={styles.cardWrap}>
      <View style={[styles.sceneCard, shadows.card]}>
        <Animated.View style={[styles.sceneCanvas, sceneStyle]}>
          <LinearGradient
            colors={['#23525B', '#123D42', '#F2B66A']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg width="100%" height="100%" viewBox="0 0 330 156">
            <Ellipse cx="168" cy="124" rx="134" ry="22" fill="rgba(9,40,43,0.22)" />
            <Path d="M40 112 L110 76 L195 112 L126 148 Z" fill="#8EC7A9" opacity="0.95" />
            <Path d="M110 76 L252 84 L290 118 L195 112 Z" fill="#C4DCB4" opacity="0.95" />
            <Path d="M126 148 L195 112 L290 118 L222 152 Z" fill="#6BAA88" />
            <Rect x="70" y="54" width="34" height="52" rx="4" fill="#E9D8B6" />
            <Rect x="112" y="42" width="42" height="66" rx="4" fill="#F3E2BE" />
            <Rect x="202" y="58" width="48" height="45" rx="4" fill="#EAD4AA" />
            {[80, 96, 122, 142, 214, 236].map((x) => (
              <Rect key={x} x={x} y={x < 200 ? 64 : 69} width="8" height="8" rx="2" fill="#FFD98A" opacity="0.85" />
            ))}
            <Path d="M58 124 C112 112 178 128 253 110" stroke="#375C55" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.7" />
            {[62, 150, 262].map((x, i) => (
              <G key={x}>
                <Rect x={x} y={76 + i * 6} width="4" height="44" rx="2" fill="#263C3A" />
                <Circle cx={x + 2} cy={75 + i * 6} r="9" fill="#FFD98A" opacity="0.55" />
                <Circle cx={x + 2} cy={75 + i * 6} r="4" fill="#FFE6A7" />
              </G>
            ))}
            <Rect x="164" y="112" width="24" height="13" rx="5" fill="#0B6B61" />
            <Circle cx="171" cy="126" r="3" fill="#1E302F" />
            <Circle cx="183" cy="126" r="3" fill="#1E302F" />
          </Svg>
        </Animated.View>
        <Pressable
          style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}
          onPress={playLightImpactHaptic}
          accessibilityRole="button"
          accessibilityLabel="Önizle">
          <Ionicons name="play" size={12} color={eventDetail.tealDark} />
          <Text style={styles.previewButtonText}>Önizle</Text>
        </Pressable>
      </View>
    </CreviaMotionView>
  );
}

function PlanOptionCard({
  strategy,
  recommended,
  reducedMotion,
  onSelect,
}: {
  strategy: EventPlanStrategyCard;
  recommended: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  const copy = STRATEGY_COPY[strategy.id];
  const selected = strategy.isSelected;
  const scale = useSharedValue(selected ? 1.015 : 1);

  useEffect(() => {
    scale.value = withTiming(selected ? 1.015 : 1, { duration: reducedMotion ? 0 : 180 });
  }, [reducedMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [
          styles.planCard,
          shadows.soft,
          selected && styles.planCardSelected,
          pressed && styles.planCardPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${copy.title} planı`}>
        <View style={styles.planHeaderRow}>
          <View style={[styles.planIcon, selected && styles.planIconSelected]}>
            <Ionicons
              name={STRATEGY_ICONS[strategy.id]}
              size={21}
              color={selected ? '#FFFFFF' : eventDetail.teal}
            />
          </View>
          <View style={styles.planTitleBlock}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle} numberOfLines={1}>
                {copy.title}
              </Text>
              {recommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Önerilen</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.planDescription} numberOfLines={2}>
              {copy.description}
            </Text>
          </View>
        </View>
        <View style={styles.planStatRow}>
          <PlanStat label="Maliyet" value={copy.cost} icon="wallet-outline" />
          <PlanStat label="Süre" value={copy.duration} icon="time-outline" />
          <PlanStat label="Etki" value={copy.effect} icon="pulse-outline" />
        </View>
        <View style={styles.planBottomRow}>
          <EffectDots count={selected ? 4 : cardIndex(strategy.id) + 2} />
          <View style={[styles.selectPill, selected && styles.selectPillSelected]}>
            <Text style={[styles.selectPillText, selected && styles.selectPillTextSelected]}>
              {selected ? 'Seçildi' : 'Seç'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PlanStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.planStat}>
      <Ionicons name={icon} size={12} color={eventDetail.textMuted} />
      <Text style={styles.planStatLabel}>{label}</Text>
      <Text style={styles.planStatValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EffectDots({ count }: { count: number }) {
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={[styles.effectDot, index < count && styles.effectDotActive]} />
      ))}
    </View>
  );
}

function ExpectedImpactSection({
  cards,
  selectedStrategyId,
}: {
  cards: PlanlaImpactCard[];
  selectedStrategyId: EventPlanStrategyId;
}) {
  return (
    <CreviaMotionView
      key={selectedStrategyId}
      motionKind="line_appear"
      surface="shared"
      index={0}
      style={styles.cardWrap}>
      <View style={[styles.impactCard, shadows.soft]}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Beklenen Etki</Text>
            <Text style={styles.sectionSubtitle}>Plan değişince etkiler güncellenir.</Text>
          </View>
          <View style={styles.targetBadge}>
            <Ionicons name="locate-outline" size={18} color="#B77713" />
          </View>
        </View>
        <View style={styles.impactGrid}>
          {cards.map((card, index) => (
            <ImpactMiniCard key={card.id} card={card} index={index} />
          ))}
        </View>
      </View>
    </CreviaMotionView>
  );
}

function ImpactMiniCard({ card, index }: { card: PlanlaImpactCard; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(card.value, { duration: 420 + index * 80 });
  }, [card.value, index, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.impactMiniCard}>
      <View style={styles.impactMiniHeader}>
        <View style={styles.impactIcon}>
          <Ionicons name={card.icon} size={15} color={eventDetail.tealDark} />
        </View>
        <Text style={styles.impactLevel}>{card.level}</Text>
      </View>
      <Text style={styles.impactMiniTitle} numberOfLines={1}>
        {card.title}
      </Text>
      <Text style={styles.impactMiniBody} numberOfLines={2}>
        {card.body}
      </Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, card.inverted && styles.progressFillGold, fillStyle]} />
      </View>
    </View>
  );
}

function AdvisorCommentCard({
  text,
  reducedMotion,
}: {
  text: string;
  reducedMotion: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  return (
    <CreviaMotionView motionKind="line_appear" surface="shared" index={1} style={styles.cardWrap}>
      <View style={[styles.advisorCard, shadows.soft]}>
        <LinearGradient colors={['#DDF4E8', '#FFFFFF']} style={styles.advisorAvatar}>
          <Text style={styles.advisorInitial}>E</Text>
        </LinearGradient>
        <View style={styles.advisorCopy}>
          <Text style={styles.advisorName}>Ece</Text>
          <Text style={styles.advisorText} numberOfLines={3}>
            {text}
          </Text>
        </View>
        <Animated.View style={[styles.waveIcon, waveStyle]}>
          <Ionicons name="radio-outline" size={17} color={eventDetail.teal} />
        </Animated.View>
      </View>
    </CreviaMotionView>
  );
}

function SelectedPlanSummaryCard({
  event,
  selectedStrategy,
  categoryLabel,
  targetLabel,
}: {
  event: EventCard;
  selectedStrategy: EventPlanStrategyCard;
  categoryLabel: string;
  targetLabel: string;
}) {
  const copy = STRATEGY_COPY[selectedStrategy.id];

  return (
    <CreviaMotionView motionKind="line_appear" surface="shared" index={2} style={styles.cardWrap}>
      <View style={[styles.selectedSummaryCard, shadows.soft]}>
        <View style={styles.selectedCrest}>
          <Ionicons name={STRATEGY_ICONS[selectedStrategy.id]} size={22} color="#FFFFFF" />
        </View>
        <View style={styles.selectedText}>
          <Text style={styles.sectionTitle}>Seçili Plan Özeti</Text>
          <Text style={styles.selectedLine} numberOfLines={1}>
            {event.district || 'Çınar Mahallesi'}
          </Text>
          <Text style={styles.selectedMuted} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <Text style={styles.selectedMuted} numberOfLines={1}>
            Tahmini Çözüm Süresi: {copy.duration}
          </Text>
          <Text style={styles.selectedMuted} numberOfLines={1}>
            Hedef: {targetLabel}
          </Text>
        </View>
        <MiniSummaryScene />
      </View>
    </CreviaMotionView>
  );
}

function MiniSummaryScene() {
  return (
    <View style={styles.miniSummaryScene}>
      <Svg width="72" height="58" viewBox="0 0 72 58">
        <Path d="M5 42 L31 24 L66 39 L39 55 Z" fill="#DDF4E8" />
        <Rect x="15" y="16" width="12" height="24" rx="2" fill="#E9D4A7" />
        <Rect x="32" y="11" width="16" height="29" rx="2" fill="#F4E4C3" />
        <Path d="M13 45 C25 38 39 45 58 36" stroke="#0B6B61" strokeWidth="4" strokeLinecap="round" fill="none" />
        <Rect x="51" y="23" width="3" height="20" rx="1.5" fill="#2D433F" />
        <Circle cx="52.5" cy="22" r="7" fill="#F0BF5A" opacity="0.55" />
      </Svg>
    </View>
  );
}

function StickyPlanApproveBar({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.stickyCopy}>
        <View style={styles.stickyIcon}>
          <Ionicons name="checkmark-circle-outline" size={17} color={eventDetail.tealDark} />
        </View>
        <View style={styles.stickyTextBlock}>
          <Text style={styles.stickyTitle}>Bu planı onayla</Text>
          <Text style={styles.stickySubtitle} numberOfLines={2}>
            Plan mahalleyle paylaşılacak ve uygulama süreci başlayacak.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.stickyButton,
          disabled && styles.stickyButtonDisabled,
          pressed && !disabled && styles.stickyButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}>
        <Text style={styles.stickyButtonText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    gap: 12,
  },
  cardWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  headerTitleCompact: {
    fontSize: 22,
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerAccentLine: {
    width: 26,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D9A646',
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  resourceBadge: {
    height: 30,
    minWidth: 32,
    borderRadius: 15,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  resourceBadgeMint: {
    backgroundColor: '#DDF4E8',
  },
  resourceBadgeGold: {
    backgroundColor: '#FFF1C9',
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  resourceTextGold: {
    color: '#9E6E0D',
  },
  routeCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    paddingVertical: 13,
    paddingHorizontal: 8,
  },
  routeTrack: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeEndpoint: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
    marginTop: 4,
  },
  flagEndpoint: {
    backgroundColor: '#FFF2CA',
  },
  routeStep: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  nodeLine: {
    position: 'absolute',
    top: 17,
    left: '-48%',
    right: '-48%',
    height: 2,
    backgroundColor: 'rgba(11,107,97,0.14)',
  },
  activeNodeGlow: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11,107,97,0.16)',
  },
  routeNode: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF1EF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeNodeDone: {
    backgroundColor: eventDetail.teal,
  },
  routeNodeActive: {
    backgroundColor: eventDetail.tealDark,
  },
  routeNodeText: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textMuted,
  },
  routeNodeTextActive: {
    color: '#FFFFFF',
  },
  routeLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  routeLabelDone: {
    color: eventDetail.teal,
  },
  routeLabelActive: {
    color: eventDetail.tealDark,
  },
  summaryCard: {
    minHeight: 120,
    borderRadius: eventDetail.cardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryCrest: {
    width: 54,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.tealDark,
  },
  summaryTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  overline: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B77713',
  },
  summaryTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  summaryMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  summaryBadges: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#FFF1C9',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9E6E0D',
  },
  timeBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#DDF4E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  sceneCard: {
    height: 170,
    borderRadius: eventDetail.cardRadius,
    overflow: 'hidden',
    backgroundColor: eventDetail.tealDark,
  },
  sceneCanvas: {
    flex: 1,
  },
  previewButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  previewButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  sectionIntro: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
  planList: {
    gap: 10,
  },
  planCard: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 18,
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(6,63,59,0.08)',
    gap: 11,
  },
  planCardSelected: {
    borderColor: eventDetail.teal,
    backgroundColor: '#FFFCF5',
  },
  planCardPressed: {
    opacity: 0.94,
  },
  planHeaderRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
  },
  planIconSelected: {
    backgroundColor: eventDetail.tealDark,
  },
  planTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  planTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  recommendedBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF1C9',
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9E6E0D',
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  planStatRow: {
    flexDirection: 'row',
    gap: 7,
  },
  planStat: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    backgroundColor: '#F6F2EA',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  planStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  planStatValue: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  planBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 5,
  },
  effectDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#DDE5E0',
  },
  effectDotActive: {
    backgroundColor: eventDetail.teal,
  },
  selectPill: {
    height: 30,
    minWidth: 74,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
    paddingHorizontal: 12,
  },
  selectPillSelected: {
    backgroundColor: eventDetail.tealDark,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  selectPillTextSelected: {
    color: '#FFFFFF',
  },
  impactCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 14,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  targetBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1C9',
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  impactMiniCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    backgroundColor: '#F7F3EA',
    padding: 10,
    gap: 6,
  },
  impactMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  impactIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4E8',
  },
  impactLevel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9E6E0D',
  },
  impactMiniTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  impactMiniBody: {
    minHeight: 30,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E3E4DC',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: eventDetail.teal,
  },
  progressFillGold: {
    backgroundColor: '#D9A646',
  },
  advisorCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  advisorCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  advisorName: {
    fontSize: 14,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  advisorText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  waveIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
  },
  selectedSummaryCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCrest: {
    width: 46,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.tealDark,
  },
  selectedText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedLine: {
    fontSize: 13,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  selectedMuted: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  miniSummaryScene: {
    width: 76,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3EA',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,243,234,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6,63,59,0.08)',
  },
  stickyCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4E8',
  },
  stickyTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  stickyTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  stickySubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  stickyButton: {
    minWidth: 124,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.tealDark,
    paddingHorizontal: 14,
  },
  stickyButtonDisabled: {
    opacity: 0.7,
  },
  stickyButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  stickyButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
