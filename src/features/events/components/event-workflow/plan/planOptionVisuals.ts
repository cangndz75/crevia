import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

export type PlanOptionVisual = {
  icon: ComponentProps<typeof Ionicons>['name'];
  gradient: readonly [string, string];
  iconColor: string;
  ringColor: string;
  tagline: string;
};

export const PLAN_OPTION_VISUALS: Record<PlanOptionId, PlanOptionVisual> = {
  balanced: {
    icon: 'git-compare-outline',
    gradient: ['#E8F7EF', '#DDF4E8'],
    iconColor: eventDetail.tealDark,
    ringColor: 'rgba(11, 107, 97, 0.18)',
    tagline: 'Dengeli kaynak ve süre',
  },
  fast: {
    icon: 'flash-outline',
    gradient: ['#FFF6E8', '#FFEACC'],
    iconColor: '#B45309',
    ringColor: 'rgba(217, 147, 61, 0.28)',
    tagline: 'Öncelikli hızlı müdahale',
  },
  economy: {
    icon: 'wallet-outline',
    gradient: ['#EDF5F0', '#E2EEE8'],
    iconColor: '#1A7A5C',
    ringColor: 'rgba(26, 122, 92, 0.2)',
    tagline: 'Minimum bütçe odaklı',
  },
};
