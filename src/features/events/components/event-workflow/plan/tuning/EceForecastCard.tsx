import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanTuningPresentation } from '@/features/events/utils/eventPlanTuningPresentation';
import { shadows } from '@/ui/theme/shadows';

type EceForecastCardProps = {
  forecast: EventPlanTuningPresentation['eceForecast'];
  reducedMotion?: boolean;
};

export function EceForecastCard({ forecast, reducedMotion = false }: EceForecastCardProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = 0.4;
    opacity.value = withTiming(1, { duration: 200 });
  }, [forecast.body, opacity, reducedMotion]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[styles.card, shadows.soft]}
      accessibilityRole="text"
      accessibilityLabel={forecast.accessibilityLabel}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={30} color={eventDetail.tealDark} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={12} color={eventDetail.teal} />
            <Text style={styles.title}>{forecast.title}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{forecast.badge}</Text>
          </View>
        </View>
      </View>
      <Animated.Text style={[styles.body, textStyle]} numberOfLines={3}>
        {forecast.body}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.14)',
    backgroundColor: eventDetail.mintSoft,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.10)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 19,
  },
});
