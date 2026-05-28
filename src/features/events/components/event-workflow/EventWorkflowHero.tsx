import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type EventWorkflowHeroProps = {
  title: string;
  location: string;
  priorityLabel: string;
  remainingLabel: string;
  heroImage: ImageSource;
};

export function EventWorkflowHero({
  title,
  location,
  priorityLabel,
  remainingLabel,
  heroImage,
}: EventWorkflowHeroProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.contentRow}>
        <View style={styles.left}>
          <Text style={styles.title} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={eventDetail.teal} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        <View style={styles.heroFrame}>
          <Image
            source={heroImage}
            style={styles.heroImage}
            contentFit="cover"
            accessibilityLabel="Mahalle görseli"
          />
        </View>
      </View>

      <View style={styles.chipsCol}>
        <View style={[styles.chip, styles.chipPriority]}>
          <Ionicons name="star" size={12} color="#9A5E12" />
          <Text style={[styles.chipText, styles.chipTextPriority]} numberOfLines={1}>
            {priorityLabel}
          </Text>
        </View>
        <View style={[styles.chip, styles.chipTime]}>
          <Ionicons name="time-outline" size={12} color={eventDetail.teal} />
          <Text style={[styles.chipText, styles.chipTextTime]} numberOfLines={1}>
            {remainingLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  location: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  chipsCol: {
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipPriority: {
    backgroundColor: '#F0E6D4',
  },
  chipTime: {
    backgroundColor: eventDetail.mint,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextPriority: {
    color: '#9A5E12',
  },
  chipTextTime: {
    color: eventDetail.tealDark,
  },
  heroFrame: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
});
