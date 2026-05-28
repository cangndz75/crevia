import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildHubSocialPulseModel,
  type HubSocialPulseStatusTone,
} from '@/features/social/utils/socialHubModel';
import {
  selectSocialPulseStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubSocialPulseShortcutProps = {
  /** Day 1 tutorial coach aktifken kartı gizle */
  hidden?: boolean;
};

const TONE_STYLES: Record<
  HubSocialPulseStatusTone,
  {
    background: string;
    border: string;
    text: string;
    muted: string;
    chipBackground: string;
    chipText: string;
    iconBackground: string;
    iconColor: string;
    cta: string;
  }
> = {
  good: {
    background: '#FAFFFE',
    border: 'rgba(26,143,138,0.22)',
    text: colors.primary,
    muted: colors.textSecondary,
    chipBackground: colors.primaryMuted,
    chipText: colors.primary,
    iconBackground: colors.primaryMuted,
    iconColor: colors.primary,
    cta: colors.primary,
  },
  balanced: {
    background: colors.surface,
    border: 'rgba(59,130,246,0.18)',
    text: colors.primary,
    muted: colors.textSecondary,
    chipBackground: 'rgba(59,130,246,0.1)',
    chipText: colors.primary,
    iconBackground: 'rgba(59,130,246,0.1)',
    iconColor: colors.primary,
    cta: colors.primary,
  },
  caution: {
    background: '#FFFBF4',
    border: 'rgba(245,158,11,0.28)',
    text: '#9A6A12',
    muted: colors.textSecondary,
    chipBackground: colors.warningMuted,
    chipText: colors.warning,
    iconBackground: colors.warningMuted,
    iconColor: colors.warning,
    cta: colors.warning,
  },
  crisis: {
    background: '#FFF8F7',
    border: 'rgba(239,68,68,0.22)',
    text: colors.danger,
    muted: colors.textSecondary,
    chipBackground: colors.dangerMuted,
    chipText: colors.danger,
    iconBackground: colors.dangerMuted,
    iconColor: colors.danger,
    cta: colors.danger,
  },
};

export function HubSocialPulseShortcut({
  hidden = false,
}: HubSocialPulseShortcutProps) {
  const router = useRouter();
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const model = useMemo(
    () => buildHubSocialPulseModel(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );

  const tone = TONE_STYLES[model.statusTone];

  if (hidden) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(240)}>
      <Pressable
        onPress={() => router.push('/social' as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Sosyal Nabız ${model.score}, ${model.statusLabel}. ${model.signalLine}`}
        style={({ pressed }) => [
          styles.card,
          shadows.soft,
          {
            backgroundColor: tone.background,
            borderColor: tone.border,
            minHeight: 44,
          },
          pressed && styles.pressed,
        ]}>
        <View style={styles.textCol}>
          <Text style={styles.kicker}>Sosyal Nabız</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: tone.text }]}>
              {model.score}
            </Text>
            <View
              style={[styles.statusChip, { backgroundColor: tone.chipBackground }]}>
              <Text style={[styles.statusText, { color: tone.chipText }]}>
                {model.statusLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.signal, { color: tone.muted }]} numberOfLines={2}>
            {model.signalLine}
          </Text>
          <Text style={[styles.cta, { color: tone.cta }]}>Detaya Git</Text>
        </View>

        <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
          <Ionicons name="chatbubbles-outline" size={22} color={tone.iconColor} />
          <View style={[styles.pulseDot, { backgroundColor: tone.iconColor }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  score: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  signal: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  cta: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
