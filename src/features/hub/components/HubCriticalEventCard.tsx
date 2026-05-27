import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { formatSourceDelta } from '@/core/economy/economyFormatter';
import type { EventPreviewEffects } from '@/core/models/EventCard';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { deriveCrisisQueue } from '@/features/hub/utils/hubDerived';
import { getEventHeroImage, hubAssets } from '@/features/hub/utils/hubAssets';
import { getCriticalEventQuote } from '@/features/hub/utils/hubPresentation';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EventIllustration({
  eventId,
  category,
}: {
  eventId: string;
  category: string;
}) {
  const image = getEventHeroImage(eventId, category);
  return (
    <View style={illStyles.wrap}>
      <View style={illStyles.glow} />
      <HubAssetImage
        source={image}
        containerStyle={illStyles.frame}
        style={illStyles.image}
        contentFit="contain"
      />
      <View style={illStyles.alertIcon}>
        <Ionicons name="alert-circle" size={10} color="#fff" />
      </View>
    </View>
  );
}

const illStyles = StyleSheet.create({
  wrap: {
    width: 76,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.warningMuted,
    opacity: 0.85,
  },
  frame: {
    width: 70,
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#EDD9A3',
  },
  image: {
    borderRadius: 14,
  },
  alertIcon: {
    position: 'absolute',
    top: -2,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

function ImpactChip({
  label,
  tone,
}: {
  label: string;
  tone: 'positive' | 'negative' | 'warning';
}) {
  const bg =
    tone === 'positive'
      ? colors.successMuted
      : tone === 'negative'
        ? colors.dangerMuted
        : colors.warningMuted;
  const fg =
    tone === 'positive'
      ? colors.success
      : tone === 'negative'
        ? colors.danger
        : colors.warning;
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
      <Text style={[chipStyles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export function HubCriticalEventCard() {
  const router = useRouter();
  const activeEvents = useGameStore(selectActiveEvents);
  const featuredId = useGameStore((s) => s.gameState.featuredEventId);
  const advisorBody = useGameStore((s) => s.gameState.eventAdvisor.body);

  const event = useMemo(() => {
    const featured = activeEvents.find((e) => e.id === featuredId);
    if (featured) return featured;
    const queue = deriveCrisisQueue(activeEvents);
    return queue[0]?.event ?? null;
  }, [activeEvents, featuredId]);

  const ctaScale = useSharedValue(1);
  const ctaAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  if (!event) {
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

  const effects: EventPreviewEffects = event.previewEffects;
  const quote = getCriticalEventQuote(advisorBody);
  const goToEvent = () => router.push(`/events/${event.id}`);

  const hasImpacts =
    effects.publicSatisfaction !== 0 ||
    (effects.budget != null && effects.budget !== 0) ||
    effects.risk !== 0;

  return (
    <Animated.View
      entering={FadeInUp.delay(30).duration(320).springify().damping(20)}
      style={[styles.card, shadows.card]}>
      <Pressable onPress={goToEvent} accessibilityRole="button">
        <LinearGradient
          colors={['#F2C97A', '#E5AD4A', '#D99B3A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.flameBadge}>
              <Ionicons name="flame" size={12} color={colors.hubGoldDark} />
            </View>
            <Text style={styles.headerText}>Günün Kritik Olayı</Text>
          </View>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>Yüksek Öncelik</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable onPress={goToEvent} style={styles.body} accessibilityRole="button">
        <View style={styles.leftCol}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color={colors.hubGoldDark} />
            <Text style={styles.locText} numberOfLines={1}>
              {event.district}
              {event.neighborhoodId ? ` · ${event.neighborhoodId}` : ''}
            </Text>
          </View>

          <View style={styles.quoteWrap}>
            <HubAssetImage
              source={hubAssets.advisorPortrait}
              containerStyle={styles.quoteAvatar}
              contentFit="cover"
            />
            <View style={styles.bubble}>
              <Text style={styles.quoteText} numberOfLines={2}>
                &ldquo;{quote}&rdquo;
              </Text>
            </View>
          </View>

          {hasImpacts && (
            <View style={styles.impactsBlock}>
              <Text style={styles.impactsLabel}>Çözülmezse</Text>
              <View style={styles.impacts}>
                {effects.publicSatisfaction !== 0 && (
                  <ImpactChip
                    label={`${effects.publicSatisfaction > 0 ? '+' : ''}${effects.publicSatisfaction} Memnuniyet`}
                    tone={effects.publicSatisfaction > 0 ? 'positive' : 'negative'}
                  />
                )}
                {effects.budget != null && effects.budget !== 0 && (
                  <ImpactChip
                    label={formatSourceDelta(effects.budget)}
                    tone={effects.budget > 0 ? 'positive' : 'negative'}
                  />
                )}
                {effects.risk !== 0 && (
                  <ImpactChip
                    label={`${effects.risk > 0 ? '+' : ''}${effects.risk} Risk`}
                    tone="warning"
                  />
                )}
              </View>
            </View>
          )}
        </View>

        <EventIllustration eventId={event.id} category={event.category} />
      </Pressable>

      <View style={styles.ctaWrap}>
        <AnimatedPressable
          onPressIn={() => {
            ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          onPress={goToEvent}
          accessibilityRole="button"
          accessibilityLabel="Karar ver"
          style={[styles.cta, ctaAnim]}>
          <LinearGradient
            colors={[colors.headerTealDark, colors.primary, '#24A89E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Karar Ver</Text>
            <Ionicons name="chevron-forward" size={17} color="#fff" />
          </LinearGradient>
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
    borderWidth: 1,
    borderColor: '#E8D9B8',
    overflow: 'hidden',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
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
    width: 72,
    height: 72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  flameBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C3D0A',
    letterSpacing: 0.2,
  },
  priorityBadge: {
    backgroundColor: 'rgba(92, 61, 10, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(92, 61, 10, 0.08)',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5C3D0A',
    letterSpacing: 0.3,
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#FFFCF7',
  },
  leftCol: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  locText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  quoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  quoteAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: 1,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderTopLeftRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteText: {
    fontSize: 10,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 13,
  },
  impactsBlock: {
    marginTop: 2,
    gap: 0,
  },
  impactsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  impacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: '#FFFCF7',
  },
  cta: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
