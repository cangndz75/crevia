import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { cardEntranceEntering } from '@/core/animations/animationEntering';
import { CreviaAnimatedPressable } from '@/core/animations/CreviaAnimatedPressable';
import { useShallow } from 'zustand/react/shallow';

import { buildEventCategoryChip } from '@/core/events/eventContentPresentation';
import { getResolvedCardColors } from '@/core/liveFlow/liveFlowPresentation';
import {
  buildLiveFlowStoreSliceFromGameStore,
  selectHubPrimaryEventPresentation,
  type LiveFlowStoreSlice,
} from '@/core/liveFlow/liveFlowSelectors';
import { getDecisionRecordForEvent } from '@/core/liveFlow/eventLifecycleEngine';
import {
  getNeighborhoodIdentityChipLabel,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { eventSeverity } from '@/core/utils/eventPriority';
import { EventLifecycleBadge } from '@/features/events/components/EventLifecycleBadge';
import { PostPilotEventContextChip } from '@/features/events/components/PostPilotEventContextChip';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { getEventHeroImage, hubAssets } from '@/features/hub/utils/hubAssets';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function formatUrgencyRemaining(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}s ${m}dk`;
  if (h > 0) return `${h}s`;
  if (m > 0) return `${m}dk`;
  return 'Acil';
}

export function HubCriticalEventCard() {
  const router = useRouter();

  const flowSlice = useGameStore(
    useShallow(
      (s): LiveFlowStoreSlice => ({
        gameState: s.gameState,
        eventPool: s.eventPool,
        decisionHistory: s.decisionHistory,
        lastDecisionResult: s.lastDecisionResult,
        lastDailyReport: s.lastDailyReport,
        dailyPriorityByDay: s.dailyPriorityByDay,
        dailyGoalsByDay: s.dailyGoalsByDay,
        isDay1Tutorial: selectIsDay1TutorialActive(s),
      }),
    ),
  );

  const presentation = useMemo(
    () =>
      selectHubPrimaryEventPresentation(
        buildLiveFlowStoreSliceFromGameStore(flowSlice),
      ),
    [flowSlice],
  );

  const decisionRecord = useMemo(() => {
    if (!presentation?.event) return undefined;
    return getDecisionRecordForEvent(
      presentation.event.id,
      flowSlice.decisionHistory,
    );
  }, [flowSlice.decisionHistory, presentation]);

  if (!presentation) {
    return (
      <Animated.View
        entering={cardEntranceEntering()}
        style={[styles.card, styles.emptyCard, shadows.soft]}>
        <HubAssetImage
          source={hubAssets.regionCalm}
          containerStyle={styles.emptyImage}
          contentFit="contain"
        />
        <Text style={styles.emptyTitle}>Bugün kritik olay yok</Text>
        <Text style={styles.emptySub} numberOfLines={1}>
          Ekip hazır, yeni uyarı beklenmiyor.
        </Text>
      </Animated.View>
    );
  }

  const { event, lifecycle } = presentation;
  const isResolved = lifecycle.status === 'resolved_today';
  const resolvedPalette = getResolvedCardColors(lifecycle.tone);
  const severity = eventSeverity(event);
  const isHighSeverity = !isResolved && severity >= 4;

  const goToEvent = () => {
    if (isResolved) {
      router.push('/events/decision-result');
      return;
    }
    router.push(`/events/${event.id}`);
  };

  const neighborhoodId = event.neighborhoodId ?? event.district;
  const neighborhoodLabel =
    normalizeNeighborhoodId(neighborhoodId) != null
      ? getNeighborhoodIdentityChipLabel(neighborhoodId)
      : event.district;
  const categoryLabel = buildEventCategoryChip(event);
  const descriptionLine =
    event.description?.trim() ||
    event.contextTag ||
    categoryLabel;

  return (
    <Animated.View
      entering={cardEntranceEntering(30)}
      style={[
        styles.card,
        hubPremiumShadowCard(),
        isResolved
          ? {
              borderColor: resolvedPalette.border,
              backgroundColor: resolvedPalette.bg,
            }
          : isHighSeverity
            ? styles.cardUrgent
            : styles.cardActive,
      ]}>
      {isHighSeverity ? (
        <View style={[styles.accentBar, { backgroundColor: colors.warning }]} />
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isResolved ? (
            <View
              style={[
                styles.flameBadge,
                { backgroundColor: resolvedPalette.badgeBg },
              ]}>
              <Ionicons
                name="checkmark"
                size={13}
                color={resolvedPalette.badgeText}
              />
            </View>
          ) : (
            <View style={styles.flameBadge}>
              <Ionicons name="flame" size={13} color="#FFFFFF" />
            </View>
          )}
          <Text
            style={[
              styles.headerText,
              isResolved ? { color: resolvedPalette.badgeText } : null,
            ]}>
            {isResolved ? 'Sonuçlandı' : 'Kritik Olay'}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          <EventLifecycleBadge lifecycle={lifecycle} compact />
        </View>
      </View>

      <Pressable
        onPress={goToEvent}
        style={({ pressed }) => [styles.body, getPressFeedbackStyle({ pressed })]}
        accessibilityRole="button">
        <View style={styles.contentCol}>
          <PostPilotEventContextChip event={event} />
          <View style={styles.chipRow}>
            <View style={styles.neighborhoodChip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {neighborhoodLabel}
              </Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {isResolved ? (
            <Text style={styles.summary} numberOfLines={1}>
              {lifecycle.summaryText ??
                (decisionRecord
                  ? `${decisionRecord.decisionLabel} uygulandı.`
                  : 'Olay bugün çözüldü.')}
            </Text>
          ) : (
            <>
              <Text style={styles.summary} numberOfLines={1}>
                {descriptionLine}
              </Text>
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={12} color={colors.warning} />
                <Text style={styles.timerText}>
                  {formatUrgencyRemaining(event.urgencyHours)} kaldı
                </Text>
              </View>
            </>
          )}
        </View>

        {!isResolved ? (
          <View style={styles.thumbWrap}>
            <HubAssetImage
              source={getEventHeroImage(event.id, event.category)}
              containerStyle={styles.eventImage}
              contentFit="contain"
            />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
        <CreviaAnimatedPressable
          onPress={goToEvent}
          accessibilityRole="button"
          accessibilityLabel={lifecycle.ctaLabel ?? 'İncele'}
          style={styles.cta}>
          {isResolved ? (
            <View
              style={[
                styles.ctaResolved,
                { backgroundColor: resolvedPalette.badgeBg },
              ]}>
              <Text
                style={[styles.ctaResolvedText, { color: resolvedPalette.badgeText }]}>
                {lifecycle.ctaLabel ?? 'Sonucu Gör'}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={resolvedPalette.badgeText}
              />
            </View>
          ) : (
            <LinearGradient
              colors={[
                HUB_PREMIUM_COLORS.tealCta,
                HUB_PREMIUM_COLORS.tealCtaDark,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}>
              <Text style={styles.ctaText}>
                {lifecycle.ctaLabel ?? 'İncele'}
              </Text>
              <Ionicons name="chevron-forward" size={15} color="#fff" />
            </LinearGradient>
          )}
        </CreviaAnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: HUB_PREMIUM_COLORS.cardWarm,
    borderRadius: HUB_PREMIUM_RADIUS.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardActive: {
    borderColor: HUB_PREMIUM_COLORS.borderGold,
    backgroundColor: HUB_PREMIUM_COLORS.cardGold,
  },
  cardUrgent: {
    borderColor: 'rgba(216, 180, 74, 0.55)',
    backgroundColor: HUB_PREMIUM_COLORS.cardGold,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyImage: {
    width: 64,
    height: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badgeWrap: {
    flexShrink: 0,
  },
  flameBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: HUB_PREMIUM_COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A7B28',
    letterSpacing: 0.3,
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  contentCol: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  neighborhoodChip: {
    maxWidth: '40%',
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    minHeight: 22,
    justifyContent: 'center',
  },
  categoryChip: {
    maxWidth: '40%',
    backgroundColor: 'rgba(29, 78, 137, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    minHeight: 22,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  summary: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: HUB_PREMIUM_COLORS.mint,
    flexShrink: 0,
    ...hubPremiumShadowCard(),
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 0,
  },
  cta: {
    borderRadius: radius.full,
    overflow: 'hidden',
    minHeight: 44,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 47,
  },
  ctaResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    minHeight: 44,
  },
  ctaResolvedText: {
    fontSize: 14,
    fontWeight: '800',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.creamText,
    letterSpacing: -0.2,
  },
});
