import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { EventEffectChips } from '@/features/events/components/decision-center/EventEffectChips';
import { EventThumbnail } from '@/features/events/components/decision-center/EventThumbnail';
import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import {
  buildPremiumPreviewChips,
  deriveAffectedPopulation,
} from '@/features/events/utils/eventUiHelpers';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import type { EventCard } from '@/core/models/EventCard';
import { shadows } from '@/ui/theme/shadows';

type PriorityEventCardProps = {
  event: EventCard;
};

export function PriorityEventCard({ event }: PriorityEventCardProps) {
  const router = useRouter();
  const effectChips = buildPremiumPreviewChips(event.previewEffects, 3, event);
  const affected = deriveAffectedPopulation(event);
  const riskLabel = getRiskLevelLabel(event.riskLevel);

  const openDecision = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify().damping(22)}
      style={[styles.card, shadows.card]}>
      <View style={styles.riskStripe} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityLabel}>ÖNCELİKLİ OLAY</Text>
          </View>
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>{riskLabel.toUpperCase()} RİSK</Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <EventThumbnail event={event} size={108} />

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={eventsScreen.teal} />
              <Text style={styles.location} numberOfLines={1}>
                {event.district}
              </Text>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={eventsScreen.critical} />
                <Text style={styles.metaUrgent}>
                  {formatUrgencyLabel(event.urgencyHours)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={eventsScreen.textMuted} />
                <Text style={styles.metaMuted}>{affected} etkilenen</Text>
              </View>
            </View>

            <EventEffectChips chips={effectChips} />

            <View style={styles.ctaRow}>
              <Pressable
                onPress={openDecision}
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                accessibilityRole="button"
                accessibilityLabel="Karar ver">
                <LinearGradient
                  colors={[eventsScreen.tealDark, eventsScreen.teal]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>Karar Ver</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: eventsScreen.card,
    borderRadius: eventsScreen.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: eventsScreen.border,
  },
  riskStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: eventsScreen.critical,
    zIndex: 2,
  },
  inner: {
    paddingLeft: 12,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityBadge: {
    backgroundColor: eventsScreen.criticalMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: eventsScreen.critical,
  },
  riskBadge: {
    backgroundColor: eventsScreen.criticalMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: eventsScreen.critical,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: eventsScreen.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: eventsScreen.textMuted,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: eventsScreen.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaUrgent: {
    fontSize: 11,
    fontWeight: '700',
    color: eventsScreen.critical,
  },
  metaMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: eventsScreen.textMuted,
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cta: {
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  ctaPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minWidth: 132,
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
