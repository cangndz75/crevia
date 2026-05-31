import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  buildAssignmentEditorModel,
  buildAssignmentEngineInputFromGameStore,
} from '@/core/assignments';
import type {
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from '@/core/assignments/assignmentTypes';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { EventCard } from '@/core/models/EventCard';
import { AssignmentOptionCard } from '@/features/events/components/assignment/AssignmentOptionCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';

type Props = {
  visible: boolean;
  event: EventCard;
  onClose: () => void;
  onConfirmed: () => void;
};

export function AssignmentEditorModal({
  visible,
  event,
  onClose,
  onConfirmed,
}: Props) {
  const storeSlice = useGameStore((s) => ({
    gameState: s.gameState,
    operationSignals: s.operationSignals,
    advisorState: s.advisorState,
    dailyOperationsPlan: s.dailyOperationsPlan,
    assignments: s.assignments,
    tutorialState: s.tutorialState,
  }));
  const assignment = useGameStore((s) => s.assignments.assignmentsByEventId[event.id]);
  const confirmAssignment = useGameStore((s) => s.confirmEventAssignment);

  const [personnel, setPersonnel] = useState<PersonnelAssignmentType>(
    assignment?.personnelType ?? 'balanced_team',
  );
  const [vehicle, setVehicle] = useState<VehicleAssignmentType>(
    assignment?.vehicleType ?? 'standard_truck',
  );
  const [approach, setApproach] = useState<ResponseApproachType>(
    assignment?.approachType ?? 'balanced_response',
  );

  const draftAssignment = useMemo(() => {
    if (!assignment) return undefined;
    return {
      ...assignment,
      personnelType: personnel,
      vehicleType: vehicle,
      approachType: approach,
    };
  }, [assignment, personnel, vehicle, approach]);

  const editorModel = useMemo(() => {
    if (!draftAssignment) return null;
    const input = buildAssignmentEngineInputFromGameStore(storeSlice);
    return buildAssignmentEditorModel(input, event, draftAssignment);
  }, [draftAssignment, event, storeSlice]);

  if (!editorModel || !draftAssignment) {
    return null;
  }

  const handleConfirm = () => {
    playLightImpactHaptic();
    confirmAssignment(event.id, {
      personnelType: personnel,
      vehicleType: vehicle,
      approachType: approach,
    });
    onConfirmed();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title} numberOfLines={1}>
            {editorModel.title}
          </Text>

          {editorModel.strengths.length > 0 ? (
            <View style={styles.hintBoxPositive}>
              {editorModel.strengths.map((line) => (
                <Text key={line} style={styles.hintPositive} numberOfLines={2}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}

          {editorModel.warningLines.length > 0 ? (
            <View style={styles.hintBoxWarning}>
              {editorModel.warningLines.map((line) => (
                <Text key={line} style={styles.hintWarning} numberOfLines={2}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {editorModel.sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {section.title}
                </Text>
                <View style={styles.optionsRow}>
                  {section.options.map((option) => {
                    const selected =
                      (section.key === 'personnel' && option.id === personnel) ||
                      (section.key === 'vehicle' && option.id === vehicle) ||
                      (section.key === 'approach' && option.id === approach);
                    return (
                      <AssignmentOptionCard
                        key={option.id}
                        option={option}
                        selected={selected}
                        onPress={() => {
                          playLightImpactHaptic();
                          if (section.key === 'personnel') {
                            setPersonnel(option.id as PersonnelAssignmentType);
                          } else if (section.key === 'vehicle') {
                            setVehicle(option.id as VehicleAssignmentType);
                          } else {
                            setApproach(option.id as ResponseApproachType);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryBtn,
                getPressFeedbackStyle({ pressed }),
              ]}>
              <Text style={styles.secondaryLabel}>Vazgeç</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.primaryBtn,
                getPressFeedbackStyle({ pressed }),
              ]}>
              <Text style={styles.primaryLabel}>{editorModel.confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 63, 59, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#F5F3EA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.tealDark,
    marginBottom: 10,
  },
  hintBoxPositive: {
    backgroundColor: '#E8F7F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  hintBoxWarning: {
    backgroundColor: '#FFF6E8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  hintPositive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F6B64',
  },
  hintWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A6B12',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  section: {
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.15)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  primaryBtn: {
    flex: 1.4,
    borderRadius: 999,
    backgroundColor: eventDetail.tealDark,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
