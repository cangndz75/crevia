import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildMainOperationFeelFromStore,
  buildMainOperationFeelHubPresentation,
} from '@/core/mainOperationFeel';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubMainOperationFeelCardProps = {
  existingLines?: string[];
};

export function HubMainOperationFeelCard({
  existingLines = [],
}: HubMainOperationFeelCardProps) {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const postPilotOperation = useGameStore((s) => s.gameState.pilot.postPilotOperation);

  const presentation = useMemo(() => {
    const model = buildMainOperationFeelFromStore({
      gameState,
      monetization,
      mainOperationSeason,
      operationSignals,
      postPilotOperation: postPilotOperation ?? undefined,
      existingLines,
    });
    return buildMainOperationFeelHubPresentation(model);
  }, [
    existingLines,
    gameState,
    mainOperationSeason,
    monetization,
    operationSignals,
    postPilotOperation,
  ]);

  if (!presentation.visible) {
    return null;
  }

  const handleCta = () => {
    playLightImpactHaptic();
    router.push('/events' as Href);
  };

  const { compact, heroTitle, heroSubtitle, scopeLine, detailLine, ctaLabel } = presentation;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#EEF8F3', '#F5FAF7', '#F7F1E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {heroTitle}
        </Text>
        <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
          {heroSubtitle}
        </Text>
        <Text style={styles.scopeLine} numberOfLines={compact ? 1 : 2}>
          {scopeLine}
        </Text>
        {!compact && detailLine ? (
          <Text style={styles.detailLine} numberOfLines={2}>
            {detailLine}
          </Text>
        ) : null}
        {ctaLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            onPress={handleCta}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaText} numberOfLines={1}>
              {ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.14)',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D3B37',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2A6B64',
    lineHeight: 18,
  },
  scopeLine: {
    fontSize: 13,
    color: '#63706D',
    lineHeight: 18,
  },
  detailLine: {
    fontSize: 12,
    color: '#63706D',
    lineHeight: 17,
  },
  cta: {
    marginTop: 4,
    backgroundColor: '#0D3B37',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#F7FBF8',
    fontSize: 13,
    fontWeight: '600',
  },
});
