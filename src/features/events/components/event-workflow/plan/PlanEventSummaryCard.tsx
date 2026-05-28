import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanEventSummaryCardProps = {
  title: string;
  location: string;
  priorityLabel: string;
  remainingLabel: string;
  thumbnail?: ImageSource;
};

export function PlanEventSummaryCard({
  title,
  location,
  priorityLabel,
  remainingLabel,
  thumbnail,
}: PlanEventSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.topRow}>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={eventDetail.teal} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        {thumbnail ? (
          <View style={styles.thumbFrame}>
            <Image
              source={thumbnail}
              style={styles.thumb}
              contentFit="cover"
              accessibilityLabel="Olay görseli"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <View style={[styles.chip, styles.chipPriority]}>
          <Ionicons name="star" size={11} color="#9A5E12" />
          <Text style={[styles.chipText, styles.chipTextPriority]} numberOfLines={1}>
            {priorityLabel}
          </Text>
        </View>
        <View style={[styles.chip, styles.chipTime]}>
          <Ionicons name="time-outline" size={11} color={eventDetail.teal} />
          <Text style={[styles.chipText, styles.chipTextTime]} numberOfLines={1}>
            {remainingLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.35,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  location: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  thumbFrame: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipPriority: {
    backgroundColor: '#F0E6D4',
  },
  chipTime: {
    backgroundColor: eventDetail.mint,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextPriority: {
    color: '#9A5E12',
  },
  chipTextTime: {
    color: eventDetail.tealDark,
  },
});
