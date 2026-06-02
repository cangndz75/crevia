import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildAssignmentEngineInputFromGameStore,
  buildAssignmentResultSummaryModel,
  getPersonnelAssignmentLabel,
  getResponseApproachLabel,
  getVehicleAssignmentLabel,
} from '@/core/assignments';
import { ASSIGNMENT_COPY } from '@/core/assignments/assignmentConstants';
import type { EventCard } from '@/core/models/EventCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { useGameStore } from '@/store/useGameStore';

type Props = {
  event: EventCard;
};

export function EventFieldAssignmentSummary({ event }: Props) {
  const storeSlice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      operationSignals: s.operationSignals,
      advisorState: s.advisorState,
      dailyOperationsPlan: s.dailyOperationsPlan,
      assignments: s.assignments,
      tutorialState: s.tutorialState,
    })),
  );
  const assignment = useGameStore((s) => s.assignments.assignmentsByEventId[event.id]);

  const summary = useMemo(() => {
    if (!assignment) return null;
    const input = buildAssignmentEngineInputFromGameStore(storeSlice);
    return buildAssignmentResultSummaryModel(input, event, assignment);
  }, [assignment, event, storeSlice]);

  if (!assignment) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {ASSIGNMENT_COPY.fieldSummaryTitle}
      </Text>
      <Text style={styles.row} numberOfLines={1}>
        Ekip: {getPersonnelAssignmentLabel(assignment.personnelType)}
      </Text>
      <Text style={styles.row} numberOfLines={1}>
        Araç: {getVehicleAssignmentLabel(assignment.vehicleType)}
      </Text>
      <Text style={styles.row} numberOfLines={1}>
        Yaklaşım: {getResponseApproachLabel(assignment.approachType)}
      </Text>
      <Text style={styles.compat} numberOfLines={1}>
        {assignment.compatibilityLabel}
      </Text>
      {summary?.lines[0] ? (
        <Text style={styles.effect} numberOfLines={2}>
          {summary.lines[0]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: '#EEF8F5',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
    padding: 12,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
    marginBottom: 2,
  },
  row: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F5C57',
    flexShrink: 1,
  },
  compat: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.teal,
    marginTop: 4,
  },
  effect: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5F7A75',
    marginTop: 2,
    flexShrink: 1,
  },
});
