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
  headline?: 'priority' | 'decision';
};

export function OlaylarPriorityEventCard({
  event,
  onPress,
  headline = 'decision',
}: OlaylarPriorityEventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = event.image ?? eventImages.fatiguePressure;
  const headlineText =
    headline === 'decision' ? 'KARAR BEKLEYEN OLAY' : 'ÖNCELİKLİ OLAY';

  return (
    <View style={[styles.card, olaylar.shadow]}>
      <View style={styles.accent} />
      <View style={styles.glow} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.priorityPill}>
            <Text style={styles.priorityText}>{headlineText}</Text>
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
                colors={[olaylar.mapFallbackTop, olaylar.mapFallbackBottom]}
                style={styles.thumb}
              />
            ) : (
              <Image
                source={imageSource}
                style={styles.thumb}
                contentFit="cover"
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
              <Ionicons name="location" size={13} color={olaylar.teal} />
              <Text style={styles.location} numberOfLines={1}>
                {event.district}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Etkilenen</Text>
            <Text style={styles.metricValue}>{event.affected}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Risk</Text>
            <Text style={[styles.metricValue, styles.metricRisk]}>{event.riskDelta}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Ödül</Text>
            <Text style={[styles.metricValue, styles.metricXp]}>{event.xpDelta}</Text>
          </View>
        </View>

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel="Karar Ver">
          <LinearGradient
            colors={['#F0C14B', '#D8A72E', '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}>
            <Text style={styles.ctaText}>KARAR VER</Text>
            <Ionicons name="chevron-forward" size={16} color="#1A1205" />
          </LinearGradient>
        </Pressable>
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
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  inner: {
    padding: 14,
    paddingLeft: 16,
    gap: 12,
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
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: olaylar.critical,
    letterSpacing: 0.5,
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
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: olaylar.border,
    backgroundColor: olaylar.mapFallbackTop,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: olaylar.text,
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
    color: olaylar.textSoft,
    flex: 1,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: olaylar.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: olaylar.text,
  },
  metricRisk: {
    color: olaylar.critical,
  },
  metricXp: {
    color: olaylar.xp,
  },
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  ctaPressed: {
    opacity: 0.94,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1205',
    letterSpacing: 0.4,
  },
});
