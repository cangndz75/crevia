import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { CenterStatusCard } from '@/features/hub/components/CenterStatusCard';
import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { isCenterModuleRenderable } from '@/features/hub/utils/centerHomePresentation';
import { buildCenterLowerDashboardPresentation } from '@/features/hub/utils/centerLowerDashboardPresentation';

import { DailyBonusCard } from './DailyBonusCard';
import { HubActiveTaskCardStack } from './HubActiveTaskCardStack';
import { SignalStatusCard } from './SignalStatusCard';
import { TaskFlowCard } from './TaskFlowCard';

export { ContinueOperationCard } from './ContinueOperationCard';
export { DailyBonusCard } from './DailyBonusCard';
export { SignalStatusCard } from './SignalStatusCard';
export { TaskFlowCard } from './TaskFlowCard';

type CenterLowerDashboardProps = {
  presentation: CenterHomePresentation;
  reducedMotion?: boolean;
};

/** Merkez alt bölüm: ana görev, sinyal + merkez durumu, görev akışı, günlük seri. */
export function CenterLowerDashboard({
  presentation,
  reducedMotion = false,
}: CenterLowerDashboardProps) {
  const { width } = useWindowDimensions();
  const compactStatusCards = width < 420;
  const model = buildCenterLowerDashboardPresentation(presentation);

  return (
    <View style={styles.root}>
      {isCenterModuleRenderable(presentation.activeTarget.visibility) ? (
        <HubActiveTaskCardStack
          activeTarget={presentation.activeTarget}
          visibility={presentation.activeTarget.visibility}
          reducedMotion={reducedMotion}
        />
      ) : null}

      <View style={styles.statusRow}>
        <View style={styles.statusCell}>
          <SignalStatusCard
            title={model.signal.title}
            statusTitle={model.signal.statusTitle}
            statusSubtitle={model.signal.statusSubtitle}
            ctaLabel={model.signal.ctaLabel}
            signalStrength={model.signal.signalStrength}
            authorityLine={model.signal.authorityLine}
            route={model.signal.route}
            compact={compactStatusCards}
            reducedMotion={reducedMotion}
          />
        </View>
        <View style={styles.statusCell}>
          <CenterStatusCard
            title={model.merkezStatus.title}
            statusTitle={model.merkezStatus.statusTitle}
            statusSubtitle={model.merkezStatus.statusSubtitle}
            ctaLabel={model.merkezStatus.ctaLabel}
            route={model.merkezStatus.route}
            compact={compactStatusCards}
            reducedMotion={reducedMotion}
          />
        </View>
      </View>

      <TaskFlowCard
        steps={model.taskFlow.steps}
        ctaLabel={model.taskFlow.ctaLabel}
        route={model.taskFlow.route}
        reducedMotion={reducedMotion}
      />

      <DailyBonusCard
        title={model.dailyBonus.title}
        subtitle={model.dailyBonus.subtitle}
        nodes={model.dailyBonus.nodes}
        rewardAmount={model.dailyBonus.rewardAmount}
        currentDay={model.dailyBonus.currentDay}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    minWidth: 0,
  },
  statusCell: {
    flex: 1,
    minWidth: 0,
  },
});
