import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import {
  PLAN_OPTION_VISUALS,
  type PlanOptionVisual,
} from '@/features/events/components/event-workflow/plan/planOptionVisuals';
import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';

type PlanOptionVisualProps = {
  planId: PlanOptionId;
  size?: 'md' | 'lg';
  selected?: boolean;
  visual?: PlanOptionVisual;
};

export function PlanOptionVisualBlock({
  planId,
  size = 'md',
  selected = false,
  visual = PLAN_OPTION_VISUALS[planId],
}: PlanOptionVisualProps) {
  const dim = size === 'lg' ? 64 : 52;
  const iconSize = size === 'lg' ? 28 : 24;

  return (
    <View
      style={[
        styles.ring,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderColor: selected ? visual.iconColor : visual.ringColor,
        },
        selected && styles.ringSelected,
      ]}>
      <LinearGradient
        colors={[...visual.gradient]}
        style={[styles.gradient, { width: dim - 6, height: dim - 6, borderRadius: (dim - 6) / 2 }]}>
        <Ionicons name={visual.icon} size={iconSize} color={visual.iconColor} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ringSelected: {
    shadowColor: '#063F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
