import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type AdvisorRecommendationBarProps = {
  text: string;
};

function TrendIcon() {
  return (
    <Svg width={36} height={28} viewBox="0 0 36 28">
      <Path
        d="M4 20 L12 14 L18 18 L32 6"
        stroke={eventDetail.teal}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M26 6 H32 V12"
        stroke={eventDetail.teal}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AdvisorRecommendationBar({ text }: AdvisorRecommendationBarProps) {
  return (
    <LinearGradient
      colors={[eventDetail.mint, '#F8FDF9', eventDetail.card]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.bar}
      accessibilityRole="summary"
      accessibilityLabel={`Danışman önerisi: ${text}`}>
      <View style={styles.iconWrap}>
        <Ionicons name="star" size={18} color={eventDetail.tealDark} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>DANIŞMAN ÖNERİSİ</Text>
        <Text style={styles.body} numberOfLines={4} ellipsizeMode="tail">
          {text}
        </Text>
      </View>
      <TrendIcon />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: eventDetail.tealDark,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: eventDetail.textDark,
    fontWeight: '500',
  },
});
