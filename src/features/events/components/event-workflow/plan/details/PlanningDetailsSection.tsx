import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlanningDetailAccordionItem } from '@/features/events/components/event-workflow/plan/details/PlanningDetailAccordionItem';
import { PlanningDetailHeader } from '@/features/events/components/event-workflow/plan/details/PlanningDetailHeader';
import { planningDetailLayout } from '@/features/events/components/event-workflow/plan/details/planningDetailStyles';
import type { EventCard } from '@/core/models/EventCard';
import type {
  PlanDetail,
  PlanOptionId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  buildPlanningDetailSections,
  getDefaultPlanningDetailSection,
  resolvePlanningDetailSummary,
  type PlanningDetailSectionId,
} from '@/features/events/utils/eventWorkflowPlanDetails';

type PlanningDetailsSectionProps = {
  event: EventCard;
  selectedPlan: PlanDetail;
  selectedPlanId: PlanOptionId;
};

export function PlanningDetailsSection({
  event,
  selectedPlan,
  selectedPlanId,
}: PlanningDetailsSectionProps) {
  const eventIdRef = useRef(event.id);

  const sections = useMemo(
    () => buildPlanningDetailSections(event, selectedPlan, selectedPlanId),
    [event, selectedPlan, selectedPlanId],
  );

  const summary = useMemo(() => resolvePlanningDetailSummary(sections), [sections]);

  const [openSectionId, setOpenSectionId] = useState<PlanningDetailSectionId | null>(() =>
    getDefaultPlanningDetailSection(event, selectedPlanId),
  );

  useEffect(() => {
    if (eventIdRef.current !== event.id) {
      eventIdRef.current = event.id;
      setOpenSectionId(getDefaultPlanningDetailSection(event, selectedPlanId));
    }
  }, [event.id, selectedPlanId]);

  const handlePress = (id: PlanningDetailSectionId) => {
    setOpenSectionId((current) => (current === id ? null : id));
  };

  return (
    <View style={styles.wrap}>
      <PlanningDetailHeader chipLabel={summary.chipLabel} />

      <View style={styles.list}>
        {sections.map((section) => (
          <PlanningDetailAccordionItem
            key={section.id}
            section={section}
            expanded={openSectionId === section.id}
            onPress={() => handlePress(section.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: planningDetailLayout.screenPadding,
    gap: planningDetailLayout.gap,
  },
  list: {
    gap: 8,
  },
});
