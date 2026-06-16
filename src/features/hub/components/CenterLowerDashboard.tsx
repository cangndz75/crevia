import { useRouter } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { buildCenterLowerDashboardPresentation } from '@/features/hub/utils/centerLowerDashboardPresentation';
import { CENTER_LOWER_TWO_COLUMN_BREAKPOINT } from '@/features/hub/utils/centerLowerDashboardTokens';

import { ContinueOperationCard } from './ContinueOperationCard';
import { DailyBonusCard } from './DailyBonusCard';
import { SignalStatusCard } from './SignalStatusCard';
import { TaskFlowCard } from './TaskFlowCard';
import { CenterLowerSectionHeader, pushHubRoute } from './centerLowerDashboardShared';

export { ContinueOperationCard } from './ContinueOperationCard';
export { DailyBonusCard } from './DailyBonusCard';
export { SignalStatusCard } from './SignalStatusCard';
export { TaskFlowCard } from './TaskFlowCard';

type CenterLowerDashboardProps = {
  presentation: CenterHomePresentation;
  reducedMotion?: boolean;
};

/** Runtime: presentation.activeTarget, portfolioSurface, dailyReward, operationSignals */
export function CenterLowerDashboard({
  presentation,
  reducedMotion = false,
}: CenterLowerDashboardProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const twoColumn = width >= CENTER_LOWER_TWO_COLUMN_BREAKPOINT;
  const model = buildCenterLowerDashboardPresentation(presentation);

  return (
    <View style={styles.root}>
      <View style={[styles.topGrid, !twoColumn ? styles.topGridStacked : undefined]}>
        <View style={styles.topGridCell}>
          <SignalStatusCard
            title={model.signal.title}
            statusTitle={model.signal.statusTitle}
            statusSubtitle={model.signal.statusSubtitle}
            ctaLabel={model.signal.ctaLabel}
            signalStrength={model.signal.signalStrength}
            authorityLine={model.signal.authorityLine}
            route={model.signal.route}
            reducedMotion={reducedMotion}
          />
        </View>
        <View style={styles.topGridCell}>
          <TaskFlowCard
            steps={model.taskFlow.steps}
            ctaLabel={model.taskFlow.ctaLabel}
            route={model.taskFlow.route}
            reducedMotion={reducedMotion}
          />
        </View>
      </View>

      <DailyBonusCard
        title={model.dailyBonus.title}
        subtitle={model.dailyBonus.subtitle}
        nodes={model.dailyBonus.nodes}
        rewardAmount={model.dailyBonus.rewardAmount}
        currentDay={model.dailyBonus.currentDay}
        reducedMotion={reducedMotion}
      />

      <View style={styles.continueSection}>
        <CenterLowerSectionHeader
          title={model.continueSection.title}
          actionLabel={model.continueSection.actionLabel}
          onActionPress={() => pushHubRoute(router, model.continueSection.actionRoute)}
          reducedMotion={reducedMotion}
        />
        <View style={[styles.operationGrid, !twoColumn ? styles.operationGridStacked : undefined]}>
          {model.continueSection.operations.map((operation) => (
            <ContinueOperationCard
              key={operation.id}
              title={operation.title}
              badge={operation.badge}
              location={operation.location}
              progress={operation.progress}
              variant={operation.variant}
              isLocked={operation.isLocked}
              ctaLabel={operation.ctaLabel}
              route={operation.route}
              reducedMotion={reducedMotion}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
    minWidth: 0,
  },
  topGrid: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  topGridStacked: {
    flexDirection: 'column',
  },
  topGridCell: {
    flex: 1,
    minWidth: 0,
  },
  continueSection: {
    gap: 9,
    minWidth: 0,
  },
  operationGrid: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  operationGridStacked: {
    flexDirection: 'column',
  },
});
