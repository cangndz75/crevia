import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { PlanOptionPicker } from '@/features/events/components/event-workflow/plan/PlanOptionPicker';
import { PlanSummaryCard } from '@/features/events/components/event-workflow/plan/PlanSummaryCard';
import { PlanWorkflowFooter } from '@/features/events/components/event-workflow/plan/PlanWorkflowFooter';
import type { EventCard } from '@/core/models/EventCard';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildPlanDisplayOptions,
  buildPlanSummaryUi,
} from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import {
  buildPlanScreenModel,
  type PlanOptionId,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onConfirmPlan: () => void;
  phaseHint?: string | null;
};

export function EventPlanPhase({
  event,
  bottomPadding,
  onConfirmPlan,
  phaseHint: _phaseHint = null,
}: EventPlanPhaseProps) {
  const insets = useSafeAreaInsets();
  const model = useMemo(() => buildPlanScreenModel(event), [event]);
  const [selectedId, setSelectedId] = useState<PlanOptionId>(model.recommendedOptionId);

  const selectedPlan = model.planByOption[selectedId];
  const displayOptions = useMemo(() => buildPlanDisplayOptions(model), [model]);
  const summaryUi = useMemo(
    () => buildPlanSummaryUi(selectedId, selectedPlan),
    [selectedId, selectedPlan],
  );

  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: bottomPadding },
        ]}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Operasyon Planı
          </Text>
          <View style={styles.guideRow}>
            <Ionicons name="information-circle-outline" size={16} color="#5D706E" />
            <Text style={styles.guideText} numberOfLines={1}>
              Planlama Rehberi
            </Text>
          </View>
        </View>

        <PlanEventSummaryCard
          title={event.title}
          location={event.district}
          priorityLabel={model.priorityLabel}
          remainingLabel={model.remainingLabel}
          thumbnail={thumbnail}
        />

        <PlanOptionPicker
          options={displayOptions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <View style={styles.summaryGap}>
          <PlanSummaryCard
            summary={summaryUi}
            selectedPlanTitle={selectedPlan.title}
            selectedPlanNote={selectedPlan.note}
            selectedPlanId={selectedId}
          />
        </View>
      </ScrollView>

      <PlanWorkflowFooter onPress={onConfirmPlan} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: 12,
    paddingTop: 8,
  },
  summaryGap: {
    marginTop: -2,
  },
  headerRow: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 24,
    fontWeight: '900',
    color: '#123D3A',
    letterSpacing: 0,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  guideText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#123D3A',
  },
});
