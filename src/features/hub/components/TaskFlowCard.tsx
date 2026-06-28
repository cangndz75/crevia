import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedPressable } from '@/shared/motion';
import type { TaskFlowStep } from '@/features/hub/utils/centerLowerDashboardPresentation';
import {
  centerLowerPalette,
  centerLowerPanelShadow,
} from '@/features/hub/utils/centerLowerDashboardTokens';

import { pushHubRoute } from './centerLowerDashboardShared';

type IconName = keyof typeof Ionicons.glyphMap;

export type TaskFlowCardProps = {
  steps: TaskFlowStep[];
  ctaLabel?: string;
  route?: string;
  reducedMotion?: boolean;
  onPress?: () => void;
};

const stepIcons: IconName[] = ['flag-outline', 'locate-outline', 'trophy-outline'];

function resolveStepIcon(index: number, state: TaskFlowStep['state']): IconName {
  if (state === 'locked') return 'lock-closed-outline';
  return stepIcons[index] ?? 'ellipse-outline';
}

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
    <View style={styles.card}>
      <Text style={styles.eyebrow} numberOfLines={1}>
        DÖNEM YOLU
      </Text>

      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const completed = step.state === 'completed';
          const active = step.state === 'active';
          const locked = step.state === 'locked';

          return (
            <View
              key={step.id}
              style={[
                styles.stepCol,
                completed ? styles.stepColCompleted : undefined,
                active ? styles.stepColActive : undefined,
              ]}>
              <View style={styles.stepTop}>
                {index > 0 ? <View style={styles.connectorLeft} /> : <View style={styles.connectorSpacer} />}
                <View
                  style={[
                    styles.stepBadge,
                    completed ? styles.stepBadgeCompleted : undefined,
                    active ? styles.stepBadgeActive : undefined,
                    locked ? styles.stepBadgeLocked : undefined,
                  ]}>
                  <Text
                    style={[
                      styles.stepBadgeText,
                      completed ? styles.stepBadgeTextLight : undefined,
                    ]}>
                    {index + 1}
                  </Text>
                </View>
                {index < steps.length - 1 ? <View style={styles.connectorRight} /> : <View style={styles.connectorSpacer} />}
              </View>

              <Ionicons
                name={resolveStepIcon(index, step.state)}
                size={16}
                color={
                  completed
                    ? centerLowerPalette.tealPanel
                    : active
                      ? centerLowerPalette.gold
                      : centerLowerPalette.mutedDark
                }
                style={styles.stepIcon}
              />

              <Text style={styles.stepTitle} numberOfLines={1}>
                {step.title}
              </Text>
              <Text style={styles.stepSubtitle} numberOfLines={2}>
                {step.subtitle}
              </Text>
              {active ? (
                <Text style={styles.stepReward} numberOfLines={1}>
                  Yeni yetki rozeti açılır
                </Text>
              ) : null}
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
        style={styles.cta}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={centerLowerPalette.tealPanel} />
      </CreviaAnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.12)',
    backgroundColor: '#FFFCF5',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
    ...centerLowerPanelShadow,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: centerLowerPalette.tealPanel,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  stepCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  stepColCompleted: {
    opacity: 0.72,
  },
  stepColActive: {
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(216, 167, 46, 0.24)',
  },
  stepTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  connectorSpacer: {
    flex: 1,
  },
  connectorLeft: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(7, 86, 79, 0.14)',
    marginRight: 2,
  },
  connectorRight: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(216, 167, 46, 0.22)',
    marginLeft: 2,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.16)',
    backgroundColor: '#FFFFFF',
  },
  stepBadgeCompleted: {
    backgroundColor: centerLowerPalette.tealPanel,
    borderColor: centerLowerPalette.tealPanel,
  },
  stepBadgeActive: {
    backgroundColor: centerLowerPalette.goldSoft,
    borderColor: centerLowerPalette.gold,
  },
  stepBadgeLocked: {
    backgroundColor: '#F2F4F3',
    borderColor: 'rgba(7, 86, 79, 0.1)',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#173D3A',
  },
  stepBadgeTextLight: {
    color: '#FFFFFF',
  },
  stepIcon: {
    marginTop: 2,
  },
  stepTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: '#173D3A',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: centerLowerPalette.mutedDark,
    textAlign: 'center',
    minHeight: 24,
  },
  stepReward: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    color: centerLowerPalette.tealPanel,
    textAlign: 'center',
  },
  cta: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(7, 86, 79, 0.14)',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: centerLowerPalette.tealPanel,
  },
});
