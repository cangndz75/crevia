import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayMemoryHero } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

const HERO_GRADIENT = ['#0A5C55', '#0D7A70', '#1A9488'] as const;

const BADGE_TONES = {
  positive: { bg: '#E6F6EA', text: gameUi.colors.mintPositive },
  neutral: { bg: 'rgba(255,255,255,0.18)', text: '#FFFFFF' },
  warning: { bg: '#FFF1D6', text: '#B86E12' },
  teal: { bg: 'rgba(255,255,255,0.18)', text: '#FFFFFF' },
  mixed: { bg: '#E8F2FA', text: '#327EA8' },
};

type Props = {
  model: ReportReplayMemoryHero;
  reducedMotion?: boolean;
};

export function ReportReplayMemoryHero({ model, reducedMotion }: Props) {
  const badgeStyle = BADGE_TONES[model.badgeTone] ?? BADGE_TONES.teal;
  const entering = reducedMotion ? undefined : FadeInUp.delay(20).duration(280).springify().damping(24);

  return (
    <Animated.View entering={entering}>
      <LinearGradient colors={[...HERO_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, shadows.card]}>
        <View style={styles.glowA} pointerEvents="none" />
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {model.subtitle}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {model.summaryLine}
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
          <Ionicons name="layers-outline" size={12} color={badgeStyle.text} />
          <Text style={[styles.badgeText, { color: badgeStyle.text }]} numberOfLines={1}>
            {model.memoryBadge}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
  },
});
