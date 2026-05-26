import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  ROADMAP_STEPS,
  type RoadmapStep,
  type RoadmapStepState,
} from '@/features/pilot/components/operation-preview/operationPreviewData';
import { GameCard } from '@/ui/components/GameCard';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function nodeStyles(state: RoadmapStepState) {
  switch (state) {
    case 'completed':
      return {
        ring: colors.success,
        fill: colors.success,
        iconColor: colors.textInverse,
        iconName: 'checkmark' as const,
      };
    case 'next':
      return {
        ring: colors.hubGold,
        fill: colors.hubGoldMuted,
        iconColor: colors.hubGoldDark,
        iconName: 'lock-closed' as const,
      };
    case 'goal':
      return {
        ring: colors.primary,
        fill: colors.primaryMuted,
        iconColor: colors.primary,
        iconName: 'lock-closed' as const,
      };
    default:
      return {
        ring: colors.border,
        fill: colors.background,
        iconColor: colors.textSecondary,
        iconName: 'lock-closed' as const,
      };
  }
}

function RoadmapNode({
  step,
  index,
  isLast,
}: {
  step: RoadmapStep;
  index: number;
  isLast: boolean;
}) {
  const palette = nodeStyles(step.state);
  const showPulse = step.state === 'next';

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 70).duration(320).springify().damping(20)}
      style={styles.nodeWrap}>
      <View style={styles.nodeRail}>
        <View
          style={[
            styles.nodeOuter,
            { borderColor: palette.ring },
            showPulse && styles.nodeOuterPulse,
          ]}>
          <View style={[styles.nodeInner, { backgroundColor: palette.fill }]}>
            <Ionicons
              name={step.state === 'completed' ? palette.iconName : step.icon}
              size={step.state === 'completed' ? 20 : 18}
              color={palette.iconColor}
            />
          </View>
        </View>
        {!isLast ? (
          <View style={styles.connectorWrap}>
            {step.state === 'completed' ? (
              <LinearGradient
                colors={[colors.success, colors.hubGold]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.connectorGradient}
              />
            ) : (
              <View style={styles.connectorDashed} />
            )}
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.nodeTitle,
          step.state === 'completed' && styles.nodeTitleActive,
          step.state === 'next' && styles.nodeTitleNext,
        ]}
        numberOfLines={2}>
        {step.title}
      </Text>
      <Text
        style={[
          styles.nodeStatus,
          step.state === 'completed' && styles.nodeStatusDone,
          step.state === 'next' && styles.nodeStatusNext,
          step.state === 'goal' && styles.nodeStatusGoal,
        ]}>
        {step.statusLabel}
      </Text>
    </Animated.View>
  );
}

export function OperationPreviewRoadmap() {
  return (
    <Animated.View entering={FadeInUp.delay(60).duration(300)}>
      <SectionHeader
        title="Açılış Yol Haritası"
        subtitle="Pilot başarıların yeni sistemlerin açılış sırasını belirler."
        icon="trail-sign-outline"
        iconColor={colors.primary}
      />
      <GameCard padding="md" style={[styles.card, shadows.card]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          {ROADMAP_STEPS.map((step, index) => (
            <RoadmapNode
              key={step.id}
              step={step}
              index={index}
              isLast={index === ROADMAP_STEPS.length - 1}
            />
          ))}
        </ScrollView>
        <View style={styles.hintRow}>
          <Ionicons name="sparkles" size={14} color={colors.hubGoldDark} />
          <Text style={styles.hintText}>
            Pilot tamam — sırada şehir haritası var.
          </Text>
        </View>
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: `${colors.primary}22`,
  },
  scroll: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    alignItems: 'flex-start',
  },
  nodeWrap: {
    width: 96,
    marginRight: spacing.xs,
  },
  nodeRail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nodeOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  nodeOuterPulse: {
    shadowColor: colors.hubGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorWrap: {
    width: 44,
    height: 4,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  connectorGradient: {
    height: 3,
    borderRadius: 2,
    flex: 1,
  },
  connectorDashed: {
    height: 0,
    flex: 1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 16,
    minHeight: 32,
  },
  nodeTitleActive: {
    color: colors.textPrimary,
  },
  nodeTitleNext: {
    color: colors.hubGoldDark,
  },
  nodeStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  nodeStatusDone: {
    color: colors.success,
  },
  nodeStatusNext: {
    color: colors.hubGoldDark,
  },
  nodeStatusGoal: {
    color: colors.primary,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.hubGoldDark,
  },
});
