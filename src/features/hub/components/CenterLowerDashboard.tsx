import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { isCenterModuleRenderable } from '@/features/hub/utils/centerHomePresentation';
import { CENTER_COMPACT_BREAKPOINT } from '@/features/hub/utils/centerLayoutTokens';

import { CenterDailyRewardMiniStrip } from './CenterDailyRewardMiniStrip';
import { CenterNeighborhoodEventsStrip } from './CenterNeighborhoodEventsStrip';
import { CenterQuickActionsTiles } from './CenterQuickActionsTiles';
import { CenterStrategicPulseCompactCard } from './CenterStrategicPulseCompactCard';
import { HubActiveTaskCardStack } from './HubActiveTaskCardStack';

export { ContinueOperationCard } from './ContinueOperationCard';
export { DailyBonusCard } from './DailyBonusCard';
export { SignalStatusCard } from './SignalStatusCard';
export { TaskFlowCard } from './TaskFlowCard';

type CenterLowerDashboardProps = {
  presentation: CenterHomePresentation;
  reducedMotion?: boolean;
};

/** Alt merkez bölümü — HubReferenceHome ana kompozisyonu kullanır; export uyumluluğu için tutulur. */
export function CenterLowerDashboard({
  presentation,
  reducedMotion = false,
}: CenterLowerDashboardProps) {
  const { width } = useWindowDimensions();
  const compact = width < CENTER_COMPACT_BREAKPOINT;
  const hasActiveTarget = isCenterModuleRenderable(presentation.activeTarget.visibility);

  return (
    <View style={styles.root}>
      {hasActiveTarget ? null : (
        <HubActiveTaskCardStack
          activeTarget={presentation.activeTarget}
          visibility={presentation.activeTarget.visibility}
          reducedMotion={reducedMotion}
        />
      )}

      <CenterStrategicPulseCompactCard
        presentation={presentation.strategicPulse}
        compact={compact}
        reducedMotion={reducedMotion}
      />

      {presentation.neighborhoodEvents.visibility === 'visible' ? (
        <CenterNeighborhoodEventsStrip
          presentation={presentation.neighborhoodEvents}
          compact={compact}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {presentation.quickCommands.visibility === 'visible' ? (
        <CenterQuickActionsTiles
          presentation={presentation.quickCommands}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {presentation.hubGameplay.dailyRewardMini && !compact ? (
        <CenterDailyRewardMiniStrip reward={presentation.hubGameplay.dailyRewardMini} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
    minWidth: 0,
  },
});
