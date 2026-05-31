import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { PostPilotOfferViewModel } from '@/core/monetization/monetizationTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  model: PostPilotOfferViewModel;
};

export function PostPilotOfferHeroCard({ model }: Props) {
  return (
    <LinearGradient
      colors={['#E8F7F2', '#F5F3EA', '#FFFDF8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.badge}>
        <Ionicons name="checkmark-circle" size={14} color={eventDetail.teal} />
        <Text style={styles.badgeText} numberOfLines={1}>
          Pilot tamamlandı
        </Text>
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name="map-outline" size={32} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {model.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {model.subtitle}
      </Text>
      <Text style={styles.heroLine} numberOfLines={2}>
        {model.heroLine}
      </Text>
      <Text style={styles.pilotLine} numberOfLines={2}>
        {model.pilotSummaryLine}
      </Text>
      <Text style={styles.accessLabel} numberOfLines={1}>
        {model.accessLabel}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 8,
    minWidth: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: eventDetail.tealDark,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F5C57',
    flexShrink: 1,
  },
  heroLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5F5B',
    lineHeight: 18,
    flexShrink: 1,
  },
  pilotLine: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B8480',
    lineHeight: 17,
    flexShrink: 1,
  },
  accessLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.teal,
    marginTop: 4,
  },
});
