import { StyleSheet, Text, View } from 'react-native';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import type { GrowthNextUnlockModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';

type GrowthNextUnlockCardProps = {
  model: GrowthNextUnlockModel;
};

export function GrowthNextUnlockCard({ model }: GrowthNextUnlockCardProps) {
  return (
    <View style={[styles.card, growth.shadow]}>
      <Text style={styles.eyebrow}>Sıradaki Açılım</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.condition}>{model.conditionLabel}</Text>
      <AnimatedProgressBar
        progress={model.progress}
        color={growth.mint}
        trackColor={growth.track}
        height={6}
      />
      <Text style={styles.progressValue}>
        {model.currentLabel} / {model.targetLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: growth.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: growth.borderGold,
    padding: 16,
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: growth.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: growth.text,
  },
  condition: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.mint,
  },
});
