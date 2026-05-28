import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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
import { EventLifecycleBadge } from '@/features/events/components/EventLifecycleBadge';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getEventHeroImage, hubAssets } from '@/features/hub/utils/hubAssets';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatUrgencyRemaining(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}s ${m}dk kaldı`;
  if (h > 0) return `${h}s kaldı`;
  if (m > 0) return `${m}dk kaldı`;
  return 'Acil';
}

export function HubCriticalEventCard() {
  const router = useRouter();

  const presentation = useGameStore(
    useShallow((s) => {
      const slice: LiveFlowStoreSlice = {
        gameState: s.gameState,
        eventPool: s.eventPool,
        decisionHistory: s.decisionHistory,
        lastDecisionResult: s.lastDecisionResult,
        lastDailyReport: s.lastDailyReport,
        dailyPriorityByDay: s.dailyPriorityByDay,
        dailyGoalsByDay: s.dailyGoalsByDay,
        isDay1Tutorial: selectIsDay1TutorialActive(s),
      };
      return selectHubPrimaryEventPresentation(
        buildLiveFlowStoreSliceFromGameStore(slice),
      );
    }),
  );

  const decisionRecord = useGameStore((s) => {
    if (!presentation?.event) return undefined;
    return getDecisionRecordForEvent(
      presentation.event.id,
      s.decisionHistory,
    );
  });

  const ctaScale = useSharedValue(1);
  const ctaAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  if (!presentation) {
    return (
      <Animated.View
        entering={FadeInUp.duration(280)}
        style={[styles.card, styles.emptyCard, shadows.soft]}>
        <HubAssetImage
          source={hubAssets.regionCalm}
          containerStyle={styles.emptyImage}
          contentFit="contain"
        />
        <Text style={styles.emptyTitle}>Bugün kritik olay yok</Text>
        <Text style={styles.emptySub}>Ekip hazır, yeni uyarı beklenmiyor.</Text>
      </Animated.View>
    );
  }

  const { event, lifecycle } = presentation;
  const isResolved = lifecycle.status === 'resolved_today';
  const resolvedPalette = getResolvedCardColors(lifecycle.tone);

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
  const statusLine = event.contextTag || categoryLabel;

  return (
    <Animated.View
      entering={FadeInUp.delay(30).duration(320).springify().damping(20)}
      style={[
        styles.card,
        shadows.card,
        isResolved
          ? {
              borderColor: resolvedPalette.border,
              backgroundColor: resolvedPalette.bg,
            }
          : null,
      ]}>
      <View style={styles.header}>
        {isResolved ? (
          <View
            style={[
              styles.flameBadge,
              { backgroundColor: resolvedPalette.badgeBg },
            ]}>
            <Ionicons name="checkmark" size={14} color={resolvedPalette.badgeText} />
          </View>
        ) : (
          <View style={styles.flameBadge}>
            <Ionicons name="flame" size={14} color="#FFFFFF" />
          </View>
        )}
        <Text
          style={[
            styles.headerText,
            isResolved ? { color: resolvedPalette.badgeText } : null,
          ]}>
          {isResolved ? 'SONUÇLANDI' : 'KRİTİK OLAY'}
        </Text>
        <View style={styles.badgeWrap}>
          <EventLifecycleBadge lifecycle={lifecycle} compact />
        </View>
      </View>

      <Pressable
        onPress={goToEvent}
        style={({ pressed }) => [styles.body, getPressFeedbackStyle({ pressed })]}
        accessibilityRole="button">
        <View style={styles.contentCol}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {neighborhoodLabel}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {statusLine}
            </Text>
          </View>
          {isResolved ? (
            <Text style={styles.resolvedSummary} numberOfLines={2}>
              {lifecycle.summaryText ??
                (decisionRecord
                  ? `${decisionRecord.decisionLabel} uygulandı.`
                  : 'Olay bugün çözüldü. Etkisi gün sonu raporuna yansıyacak.')}
            </Text>
          ) : (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={13} color={colors.warning} />
              <Text style={styles.timerText}>
                {formatUrgencyRemaining(event.urgencyHours)}
              </Text>
            </View>
          )}
        </View>

        {!isResolved ? (
          <View style={styles.imageWrap}>
            <HubAssetImage
              source={getEventHeroImage(event.id, event.category)}
              containerStyle={styles.eventImage}
              style={styles.eventImageInner}
              contentFit="contain"
            />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
        <AnimatedPressable
          onPressIn={() => {
            ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          onPress={goToEvent}
          accessibilityRole="button"
          accessibilityLabel={lifecycle.ctaLabel ?? 'Karar ver'}
          style={[styles.cta, ctaAnim]}>
          {isResolved ? (
            <View
              style={[
                styles.ctaResolved,
                { backgroundColor: resolvedPalette.badgeBg },
              ]}>
              <Text style={[styles.ctaResolvedText, { color: resolvedPalette.badgeText }]}>
                {lifecycle.ctaLabel ?? 'Sonucu Gör'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={resolvedPalette.badgeText} />
            </View>
          ) : (
            <LinearGradient
              colors={[colors.headerTealDark, colors.primary, '#24A89E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}>
              <Text style={styles.ctaText}>{lifecycle.ctaLabel ?? 'Karar Ver'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </LinearGradient>
          )}
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.warning,
    overflow: 'hidden',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
    borderColor: colors.border,
    borderWidth: 1,
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
    width: 72,
    height: 72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  badgeWrap: {
    marginLeft: 'auto',
  },
  flameBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warning,
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'flex-start',
  },
  contentCol: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  resolvedSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  imageWrap: {
    width: 80,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundAlt,
    flexShrink: 0,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageInner: {
    borderRadius: radius.lg,
  },
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  cta: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  ctaResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
  ctaResolvedText: {
    fontSize: 15,
    fontWeight: '800',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
