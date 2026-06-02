import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  buildAssignmentEngineInputFromGameStore,
  buildAssignmentPanelModel,
  getCompatibilityTone,
} from '@/core/assignments';
import { ASSIGNMENT_COPY } from '@/core/assignments/assignmentConstants';
import {
  DAY1_ASSIGNMENT_COPY,
  shouldUseFirstTenMinutesAssignmentSimpleMode,
} from '@/core/onboarding/firstTenMinutesPresentation';
import { buildEventDomainDispatchFocus } from '@/core/events/eventDomainPresentation';
import {
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueSummaryStrip } from '@/features/resources/components/ResourceFatigueSummaryStrip';
import { buildAssignmentResourceFitLine } from '@/core/operationalResources/operationalResourcePresentation';
import {
  buildAssignmentTeamSpecializationPreviewLine,
} from '@/core/teamSpecialization/teamSpecializationModel';
import { buildAssignmentAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackCreviaEvent } from '@/core/analytics/analyticsRuntime';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { EventCard } from '@/core/models/EventCard';
import { AssignmentEditorModal } from '@/features/events/components/assignment/AssignmentEditorModal';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';

type Props = {
  event: EventCard;
  compactTutorial?: boolean;
};

const TONE_COLORS = {
  positive: { bg: '#E8F7F2', text: '#0F6B64', border: 'rgba(15, 143, 134, 0.25)' },
  neutral: { bg: '#F4F7F6', text: '#4A5F5B', border: 'rgba(100, 130, 125, 0.2)' },
  warning: { bg: '#FFF6E8', text: '#9A6B12', border: 'rgba(214, 162, 60, 0.35)' },
  balanced: { bg: '#F4F7F6', text: '#4A5F5B', border: 'rgba(100, 130, 125, 0.2)' },
} as const;

export function EventAssignmentPanel({ event, compactTutorial = false }: Props) {
  const storeSlice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      monetization: s.monetization,
      operationSignals: s.operationSignals,
      advisorState: s.advisorState,
      dailyOperationsPlan: s.dailyOperationsPlan,
      assignments: s.assignments,
      tutorialState: s.tutorialState,
      operationalResources: s.operationalResources,
    })),
  );
  const assignment = useGameStore((s) => s.assignments.assignmentsByEventId[event.id]);
  const confirmAssignment = useGameStore((s) => s.confirmEventAssignment);
  const assignmentSimpleMode = shouldUseFirstTenMinutesAssignmentSimpleMode(
    storeSlice.gameState,
  );
  const [editorOpen, setEditorOpen] = useState(false);

  const panel = useMemo(() => {
    if (!assignment) return null;
    const input = buildAssignmentEngineInputFromGameStore(storeSlice);
    return buildAssignmentPanelModel(input, event, assignment);
  }, [assignment, event, storeSlice]);

  const resourceFit = useMemo(() => {
    if (!assignment) return null;
    return buildAssignmentResourceFitLine(
      storeSlice.gameState,
      event,
      assignment,
      storeSlice.operationalResources,
    );
  }, [assignment, event, storeSlice]);

  const teamSpecializationLine = useMemo(() => {
    if (!assignment || assignmentSimpleMode) return null;
    const day = storeSlice.gameState.city.day;
    return buildAssignmentTeamSpecializationPreviewLine({
      day,
      assignment,
      operationalResources: storeSlice.operationalResources,
      operationSignals: storeSlice.operationSignals,
      isDispatchPhase: true,
    });
  }, [assignment, assignmentSimpleMode, event, storeSlice]);

  const domainDispatchFocus = useMemo(() => {
    const day = storeSlice.gameState.city.day;
    return buildEventDomainDispatchFocus(event, assignment, day);
  }, [assignment, event, storeSlice.gameState.city.day]);

  const fatigueSummary = useMemo(() => {
    const day = storeSlice.gameState.city.day;
    const domain = inferResourceDomainFromEventFocus(domainDispatchFocus.model.focus);
    return buildResourceFatigueVisualSummary({
      day,
      surface: 'dispatch',
      domain,
      operationalResources: storeSlice.operationalResources,
      operationSignals: {
        dailyFocus: storeSlice.operationSignals.dailyFocus,
        overall: { status: storeSlice.operationSignals.overall.status },
      },
      activeEvent: event,
      eventDomainFocus: domainDispatchFocus.model,
      assignmentState: {
        dominantDomain: assignment?.compatibilityLabel,
      },
    });
  }, [assignment, domainDispatchFocus.model, event, storeSlice]);

  if (!panel || !assignment) {
    return null;
  }

  const compatTone = getCompatibilityTone(assignment.compatibilityLabel);
  const compatStyle = TONE_COLORS[compatTone];

  const handleConfirm = () => {
    playLightImpactHaptic();
    confirmAssignment(event.id);
    trackCreviaEvent(
      'assignment_confirmed',
      buildAssignmentAnalyticsPayload(
        event,
        assignment,
        storeSlice.gameState,
        storeSlice.monetization,
      ),
    );
  };

  const isProcessed = assignment.status === 'processed';
  const canEdit = !compactTutorial && !isProcessed && !assignmentSimpleMode;

  return (
    <View style={[styles.card, compactTutorial && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {panel.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {panel.subtitle}
          </Text>
        </View>
        <View style={[styles.compatBadge, { backgroundColor: compatStyle.bg, borderColor: compatStyle.border }]}>
          <Text style={[styles.compatLabel, { color: compatStyle.text }]} numberOfLines={1}>
            {panel.compatibilityLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.status} numberOfLines={1}>
        {panel.statusLabel}
      </Text>

      {domainDispatchFocus.warningLine &&
      !panel.compatibilitySummary.includes(domainDispatchFocus.warningLine.slice(0, 24)) ? (
        <Text style={styles.domainWarning} numberOfLines={2}>
          {domainDispatchFocus.warningLine}
        </Text>
      ) : null}

      {!assignmentSimpleMode ? (
        <ResourceFatigueSummaryStrip
          summary={fatigueSummary}
          compact={compactTutorial}
          maxItems={2}
        />
      ) : null}

      {panel.rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <Ionicons
            name={
              row.iconKey === 'people'
                ? 'people-outline'
                : row.iconKey === 'car'
                  ? 'car-outline'
                  : 'compass-outline'
            }
            size={16}
            color={eventDetail.teal}
          />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {row.value}
            </Text>
            {!compactTutorial ? (
              <Text style={styles.rowSummary} numberOfLines={2}>
                {row.summary}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      <Text style={styles.compatSummary} numberOfLines={2}>
        {panel.compatibilitySummary}
      </Text>

      {resourceFit?.visible && resourceFit.line ? (
        <Text
          style={[
            styles.resourceFit,
            resourceFit.tone === 'warning' && styles.resourceFitWarning,
          ]}
          numberOfLines={2}>
          {resourceFit.line}
        </Text>
      ) : null}

      {teamSpecializationLine ? (
        <Text style={styles.teamSpecializationLine} numberOfLines={1}>
          {teamSpecializationLine}
        </Text>
      ) : null}

      {assignmentSimpleMode ? (
        <Text style={styles.simpleNote} numberOfLines={2}>
          {DAY1_ASSIGNMENT_COPY.explanation}
        </Text>
      ) : (
        <View style={styles.advisorBox}>
          <Text style={styles.advisorLine} numberOfLines={3}>
            {panel.advisorLine}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {!panel.isConfirmed ? (
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.primaryBtn,
              getPressFeedbackStyle({ pressed }),
            ]}>
            <Text style={styles.primaryLabel} numberOfLines={1}>
              {assignmentSimpleMode
                ? DAY1_ASSIGNMENT_COPY.confirmCta
                : panel.ctaLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.confirmedChip}>
            <Ionicons name="checkmark-circle" size={16} color={eventDetail.teal} />
            <Text style={styles.confirmedText} numberOfLines={1}>
              {ASSIGNMENT_COPY.statusConfirmed}
            </Text>
          </View>
        )}

        {!compactTutorial && canEdit ? (
          <Pressable
            onPress={() => {
              playLightImpactHaptic();
              setEditorOpen(true);
            }}
            style={({ pressed }) => [
              styles.secondaryBtn,
              getPressFeedbackStyle({ pressed }),
            ]}>
            <Text style={styles.secondaryLabel} numberOfLines={1}>
              {panel.editLabel}
            </Text>
          </Pressable>
        ) : null}
        {isProcessed ? (
          <Text style={styles.disabledHint} numberOfLines={2}>
            Saha işlendikten sonra atama düzenlenemez.
          </Text>
        ) : null}
      </View>

      <AssignmentEditorModal
        visible={editorOpen}
        event={event}
        onClose={() => setEditorOpen(false)}
        onConfirmed={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 14,
    gap: 10,
    minWidth: 0,
    shadowColor: '#063F3B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardCompact: {
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F7A75',
    marginTop: 2,
  },
  compatBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '46%',
  },
  compatLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8480',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8480',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  rowSummary: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5F7A75',
    marginTop: 2,
    flexShrink: 1,
  },
  domainWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F6B64',
    flexShrink: 1,
    minWidth: 0,
  },
  compatSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F5C57',
  },
  advisorBox: {
    backgroundColor: '#EEF8F5',
    borderRadius: 12,
    padding: 10,
  },
  advisorLine: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.tealDark,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    minWidth: 0,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: eventDetail.tealDark,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 0,
  },
  primaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.15)',
  },
  secondaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  confirmedChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  confirmedText: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.tealDark,
    flexShrink: 1,
  },
  disabledHint: {
    fontSize: 11,
    lineHeight: 16,
    color: '#6B8480',
    fontStyle: 'italic',
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
  },
  simpleNote: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5F7A75',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  resourceFit: {
    fontSize: 12,
    lineHeight: 17,
    color: '#3F5C57',
    flexShrink: 1,
  },
  resourceFitWarning: {
    color: '#9A6B12',
    fontWeight: '600',
  },
  teamSpecializationLine: {
    fontSize: 11,
    lineHeight: 16,
    color: eventDetail.teal,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
});
