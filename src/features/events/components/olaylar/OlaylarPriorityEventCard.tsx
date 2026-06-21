import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventImages } from '@/core/assets/eventScreenAssets';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarPriorityEventView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarPriorityEventCardProps = {
  event: OlaylarPriorityEventView;
  onPress?: () => void;
};

export function OlaylarPriorityEventCard({ event, onPress }: OlaylarPriorityEventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = event.image ?? eventImages.fatiguePressure;

  return (
    <View style={[styles.card, olaylar.shadow]}>
      <View style={styles.accent} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.priorityPill}>
            <Text style={styles.priorityText}>ÖNCELİKLİ OLAY</Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={olaylar.critical} />
            <Text style={styles.timeText}>{event.timeLeft}</Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.thumbWrap}>
            {imageFailed ? (
              <LinearGradient
                colors={['#FFF7F2', '#F3ECE6']}
                style={styles.thumb}
              />
            ) : (
              <Image
                source={imageSource}
                style={styles.thumb}
                contentFit="contain"
                placeholder={eventImages.fatiguePressure}
                transition={0}
                onError={() => setImageFailed(true)}
              />
            )}
          </View>

          <View style={styles.copyCol}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={olaylar.green} />
              <Text style={styles.location} numberOfLines={1}>
                {event.district}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metricsRow}>
            <Text style={styles.metricMuted} numberOfLines={1}>
              {event.affected} etkilenen
            </Text>
            <View style={styles.metricPillRisk}>
              <Text style={styles.metricRisk}>{event.riskDelta}</Text>
            </View>
            <View style={styles.metricPillXp}>
              <Text style={styles.metricXp}>{event.xpDelta}</Text>
            </View>
          </View>

          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Karar Ver">
            <Text style={styles.ctaText}>Karar Ver</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: olaylar.card,
    borderRadius: olaylar.radiusCard,
    borderWidth: 1,
    borderColor: olaylar.border,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: olaylar.critical,
  },
  inner: {
    padding: 13,
    paddingLeft: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityPill: {
    backgroundColor: olaylar.criticalBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: olaylar.critical,
    letterSpacing: 0.4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.critical,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 11,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: olaylar.border,
    backgroundColor: '#FFF7F2',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: olaylar.text,
    letterSpacing: 0,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    fontWeight: '600',
    color: olaylar.textMuted,
    flex: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: olaylar.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  metricMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.textMuted,
    width: '100%',
  },
  metricPillRisk: {
    backgroundColor: olaylar.criticalBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metricRisk: {
    fontSize: 11,
    fontWeight: '700',
    color: olaylar.critical,
  },
  metricPillXp: {
    backgroundColor: olaylar.xpBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metricXp: {
    fontSize: 11,
    fontWeight: '700',
    color: olaylar.xp,
  },
  cta: {
    height: 34,
    borderRadius: 17,
    backgroundColor: olaylar.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
