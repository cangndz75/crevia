import Ionicons from '@expo/vector-icons/Ionicons';
import { type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CenterNeighborhoodEventsPresentation } from '@/features/hub/utils/centerHubGameplayPresentation';
import { CENTER_COMPACT_BREAKPOINT } from '@/features/hub/utils/centerLayoutTokens';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { CenterHubImageFrame } from '@/features/hub/components/centerHubImageFrame';
import { pushHubRoute } from './centerLowerDashboardShared';

type CenterNeighborhoodEventsStripProps = {
  presentation: CenterNeighborhoodEventsPresentation;
  compact?: boolean;
  reducedMotion?: boolean;
};

function resolveEventImage(imageKey: CenterNeighborhoodEventsPresentation['events'][number]['imageKey']): ImageSource {
  switch (imageKey) {
    case 'park':
    case 'safe':
      return hubAssets.centerSummaryPark;
    case 'hall':
      return hubAssets.day1Plan.heroBuilding;
    case 'market':
    case 'city':
    default:
      return hubAssets.centerSummaryHero;
  }
}

function accentStyle(accent: CenterNeighborhoodEventsPresentation['events'][number]['accent']) {
  switch (accent) {
    case 'purple':
      return styles.cardPurple;
    case 'green':
      return styles.cardGreen;
    case 'sage':
      return styles.cardSage;
    case 'amber':
      return styles.cardAmber;
    default:
      return styles.cardGold;
  }
}

function EventCard({
  event,
  compact,
  reducedMotion,
}: {
  event: CenterNeighborhoodEventsPresentation['events'][number];
  compact: boolean;
  reducedMotion: boolean;
}) {
  const router = useRouter();

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (event.routeKey) pushHubRoute(router, event.routeKey);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.975}
      disabled={!event.routeKey}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. ${event.locationLabel}. ${event.timeLabel}`}
      style={[styles.card, compact && styles.cardCompact, accentStyle(event.accent)]}>
      <View style={styles.imageWrap}>
        <CenterHubImageFrame
          source={resolveEventImage(event.imageKey)}
          style={styles.imageFrame}
          gradientColors={['#132A29', '#0B1919', '#050D0E']}
          vignette={false}
        />
        {event.statusLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {event.statusLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.value} numberOfLines={2}>
          {event.valueLabel ?? event.locationLabel}
        </Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={10} color="#6B7D78" />
          <Text style={styles.time} numberOfLines={1}>
            {event.timeLabel}
          </Text>
        </View>
      </View>
    </CreviaAnimatedPressable>
  );
}

export function CenterNeighborhoodEventsStrip({
  presentation,
  compact = false,
  reducedMotion = false,
}: CenterNeighborhoodEventsStripProps) {
  if (presentation.visibility !== 'visible' || presentation.events.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading} numberOfLines={1}>
        {presentation.title.toUpperCase()}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroller}>
        {presentation.events.map((event) => (
          <EventCard key={event.id} event={event} compact={compact} reducedMotion={reducedMotion} />
        ))}
      </ScrollView>
    </View>
  );
}

export function useCenterNeighborhoodCompact(width: number): boolean {
  return width < CENTER_COMPACT_BREAKPOINT;
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.08)',
    backgroundColor: '#FFFCF5',
    paddingVertical: 12,
    gap: 10,
    overflow: 'hidden',
    shadowColor: 'rgba(15, 60, 52, 0.10)',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heading: {
    paddingHorizontal: 14,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#173D3A',
  },
  scroller: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 112,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardCompact: {
    width: 104,
  },
  cardGold: { borderColor: 'rgba(216,167,46,0.28)' },
  cardGreen: { borderColor: 'rgba(7,86,79,0.16)' },
  cardPurple: { borderColor: 'rgba(135,71,200,0.22)' },
  cardSage: { borderColor: 'rgba(33,133,121,0.22)' },
  cardAmber: { borderColor: 'rgba(216,167,46,0.28)' },
  imageWrap: {
    height: 70,
    overflow: 'hidden',
    backgroundColor: '#0B1919',
  },
  imageFrame: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 6,
    top: 6,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#D8A72E',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0D3F39',
  },
  copy: {
    padding: 8,
    gap: 3,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#173D3A',
  },
  value: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '700',
    color: '#6B7D78',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  time: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6B7D78',
  },
});
