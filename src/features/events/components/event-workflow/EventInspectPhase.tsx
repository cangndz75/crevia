import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { EvidenceMetricsRow } from '@/features/events/components/event-workflow/EvidenceMetricsRow';
import { EventWorkflowFooter } from '@/features/events/components/event-workflow/EventWorkflowFooter';
import { EventWorkflowHero } from '@/features/events/components/event-workflow/EventWorkflowHero';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { MainFindingsCard } from '@/features/events/components/event-workflow/MainFindingsCard';
import { SignalSummaryCard } from '@/features/events/components/event-workflow/SignalSummaryCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventCard } from '@/core/models/EventCard';
import {
  getInspectFindingsScene,
  getInspectNeighborhoodHero,
} from '@/features/events/utils/eventWorkflowAssets';
import { WORKFLOW_CTA_LABELS } from '@/core/ux/uxFlowPresentation';
import {
  INSPECT_HINT_TEXT,
  buildEvidenceMetrics,
  buildInspectHeroChips,
  buildSignalSummary,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPresentation';

type EventInspectPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onOpenPlanning: () => void;
};

/** Sinyal Özeti ile Ana Bulgular arası: sectionGap (16) − 4 = 12 */
const SIGNAL_TO_FINDINGS_GAP = eventDetail.sectionGap - 4;

export function EventInspectPhase({
  event,
  bottomPadding,
  onOpenPlanning,
}: EventInspectPhaseProps) {
  const signalSummary = useMemo(() => buildSignalSummary(event), [event]);
  const evidenceMetrics = useMemo(() => buildEvidenceMetrics(event), [event]);
  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const heroImage = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );
  const findingsScene = useMemo(() => getInspectFindingsScene(), []);

  const handleDetailsPress = () => {
    Alert.alert(
      'Ana Bulgular',
      'Mahalle güveni son 4 haftada belirgin şekilde azaldı. Şikayetler güvenlik ve gece aydınlatması etrafında yoğunlaşıyor.',
      [{ text: 'Tamam' }],
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}>
        <EventWorkflowHero
          title={event.title}
          location={event.district}
          priorityLabel={heroChips.priority}
          remainingLabel={heroChips.remaining}
          heroImage={heroImage}
        />

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="inspect" />
        </View>

        <SignalSummaryCard items={signalSummary} />

        <View style={styles.findingsGap}>
          <MainFindingsCard
            sceneImage={findingsScene}
            onDetailsPress={handleDetailsPress}
          />
        </View>

        <View style={styles.metricsGap}>
          <EvidenceMetricsRow metrics={evidenceMetrics} />
        </View>
      </ScrollView>

      <EventWorkflowFooter
        hint={INSPECT_HINT_TEXT}
        ctaLabel={WORKFLOW_CTA_LABELS.inspect}
        onPress={onOpenPlanning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: eventDetail.sectionGap,
    paddingTop: 4,
  },
  stepperGap: {
    marginTop: -4,
  },
  findingsGap: {
    marginTop: SIGNAL_TO_FINDINGS_GAP - eventDetail.sectionGap,
  },
  metricsGap: {
    marginTop: -2,
  },
});
