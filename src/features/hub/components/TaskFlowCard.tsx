import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedPressable } from '@/shared/motion';
import type { TaskFlowStep } from '@/features/hub/utils/centerLowerDashboardPresentation';
import {
  centerLowerPalette,
  centerLowerPanelShadow,
} from '@/features/hub/utils/centerLowerDashboardTokens';

import { pushHubRoute } from './centerLowerDashboardShared';

export type TaskFlowCardProps = {
  steps: TaskFlowStep[];
  ctaLabel?: string;
  route?: string;
  reducedMotion?: boolean;
  onPress?: () => void;
};

export function TaskFlowCard({
  steps,
  ctaLabel = 'Tüm görevleri gör',
  route = '/events',
  reducedMotion,
  onPress,
}: TaskFlowCardProps) {
  const router = useRouter();
  const handlePress = onPress ?? (() => pushHubRoute(router, route));

  return (
    <LinearGradient
      colors={[centerLowerPalette.tealPanel, centerLowerPalette.tealDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topCard}>
      <View style={styles.cardGlowGold} />
      <Text style={styles.cardEyebrow} numberOfLines={1}>
        GÖREV AKIŞI
      </Text>
      <View style={styles.taskList}>
        {steps.map((step, index) => {
          const completed = step.state === 'completed';
          const active = step.state === 'active';
          const locked = step.state === 'locked';
          return (
            <View key={step.id} style={styles.taskRow}>
              <View style={styles.taskRail}>
                <View
                  style={[
                    styles.taskBadge,
                    completed ? styles.taskBadgeCompleted : undefined,
                    active ? styles.taskBadgeActive : undefined,
                    locked ? styles.taskBadgeLocked : undefined,
                  ]}>
                  <Text style={styles.taskBadgeText}>{index + 1}</Text>
                </View>
                {index < steps.length - 1 ? <View style={styles.taskConnector} /> : null}
              </View>
              <View style={styles.taskCopy}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {step.title}
                </Text>
                <Text style={styles.taskSubtitle} numberOfLines={1}>
                  {step.subtitle}
                </Text>
              </View>
              <Ionicons
                name={completed ? 'checkmark-circle' : locked ? 'lock-closed' : 'chevron-forward'}
                size={16}
                color={
                  completed
                    ? centerLowerPalette.mint
                    : locked
                      ? centerLowerPalette.goldSoft
                      : centerLowerPalette.gold
                }
              />
            </View>
          );
        })}
      </View>
      <CreviaAnimatedPressable
        onPress={handlePress}
        reducedMotion={reducedMotion}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        style={styles.taskCta}>
        <Text style={styles.taskCtaText} numberOfLines={1}>
          {ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={centerLowerPalette.tealDeep} />
      </CreviaAnimatedPressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topCard: {
    minHeight: 224,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: centerLowerPalette.borderGold,
    padding: 12,
    overflow: 'hidden',
    ...centerLowerPanelShadow,
  },
  cardGlowGold: {
    position: 'absolute',
    right: -20,
    top: -18,
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: 'rgba(245,227,175,0.13)',
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: centerLowerPalette.goldSoft,
  },
  taskList: {
    gap: 7,
    marginTop: 10,
  },
  taskRow: {
    minHeight: 41,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  taskRail: {
    width: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  taskBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: centerLowerPalette.borderTeal,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  taskBadgeCompleted: {
    backgroundColor: 'rgba(157,242,210,0.20)',
    borderColor: 'rgba(157,242,210,0.34)',
  },
  taskBadgeActive: {
    backgroundColor: centerLowerPalette.goldSoft,
    borderColor: centerLowerPalette.gold,
  },
  taskBadgeLocked: {
    opacity: 0.72,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.tealDeep,
  },
  taskConnector: {
    width: 1,
    flex: 1,
    marginTop: 2,
    backgroundColor: 'rgba(157,242,210,0.22)',
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  taskTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: centerLowerPalette.textLight,
  },
  taskSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: centerLowerPalette.mutedLight,
  },
  taskCta: {
    minHeight: 30,
    borderRadius: 999,
    marginTop: 'auto',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: centerLowerPalette.goldSoft,
  },
  taskCtaText: {
    fontSize: 10,
    fontWeight: '900',
    color: centerLowerPalette.tealDeep,
  },
});
