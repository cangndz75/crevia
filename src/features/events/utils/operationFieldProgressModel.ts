import type { EventFieldInteractionState } from '@/features/events/utils/eventFieldPhasePresentation';

export type OperationFieldProgressStageId =
  | 'started'
  | 'intervening'
  | 'stabilizing'
  | 'preparing_result';

export type OperationFieldProgressStageState = 'done' | 'current' | 'next';

export type OperationFieldProgressStage = {
  id: OperationFieldProgressStageId;
  label: string;
  description: string;
  state: OperationFieldProgressStageState;
  iconKey: string;
};

export type OperationFieldProgressModel = {
  title: string;
  stages: OperationFieldProgressStage[];
  currentStageId: OperationFieldProgressStageId;
  progressPercent: number;
  statusLabel: string;
  helperText: string;
};

const STAGE_DEFS: Array<{
  id: OperationFieldProgressStageId;
  label: string;
  description: string;
  iconKey: string;
}> = [
  {
    id: 'started',
    label: 'Başladı',
    description: 'Ekip operasyon noktasına ulaştı.',
    iconKey: 'flag-outline',
  },
  {
    id: 'intervening',
    label: 'Müdahale ediliyor',
    description: 'Seçilen plan sahada uygulanıyor.',
    iconKey: 'construct-outline',
  },
  {
    id: 'stabilizing',
    label: 'Kontrol altına alınıyor',
    description: 'Alan dengeleniyor, ilk etki izleniyor.',
    iconKey: 'shield-checkmark-outline',
  },
  {
    id: 'preparing_result',
    label: 'Sonuç hazırlanıyor',
    description: 'Saha notu ve etki özeti derleniyor.',
    iconKey: 'document-text-outline',
  },
];

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolveCurrentStageIndex(
  interactionState: EventFieldInteractionState,
  timelineStepIndex: number,
): number {
  if (interactionState === 'completed') return STAGE_DEFS.length - 1;
  if (interactionState === 'paused_for_decision') {
    return Math.min(Math.max(1, timelineStepIndex), STAGE_DEFS.length - 2);
  }
  return Math.min(Math.max(0, timelineStepIndex), STAGE_DEFS.length - 2);
}

function resolveStageState(
  stageIndex: number,
  currentIndex: number,
  interactionState: EventFieldInteractionState,
): OperationFieldProgressStageState {
  if (interactionState === 'completed') return 'done';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  if (interactionState === 'paused_for_decision' && stageIndex === currentIndex + 1) {
    return 'next';
  }
  return 'next';
}

function resolveHelperText(
  stageId: OperationFieldProgressStageId,
  interactionState: EventFieldInteractionState,
): string {
  if (interactionState === 'paused_for_decision') {
    return 'Mikro karar bekleniyor · saha akışı duraklatıldı';
  }
  if (interactionState === 'completed') {
    return 'İlk etki alındı · sonucu görüntüleyebilirsin';
  }
  switch (stageId) {
    case 'started':
      return 'Ekip sahada, müdahale başlıyor';
    case 'intervening':
      return 'Plan sahada uygulanıyor';
    case 'stabilizing':
      return 'Mahalle tepkisi ve risk izleniyor';
    case 'preparing_result':
      return 'Sonuç özeti hazırlanıyor';
    default:
      return 'Operasyon ilerliyor';
  }
}

function resolveStatusLabel(
  stageId: OperationFieldProgressStageId,
  interactionState: EventFieldInteractionState,
): string {
  if (interactionState === 'completed') return 'Sonuç hazır';
  if (interactionState === 'paused_for_decision') return 'Karar bekleniyor';
  const stage = STAGE_DEFS.find((entry) => entry.id === stageId);
  return stage?.label ?? 'Sahada';
}

export function buildOperationFieldProgressModel(input: {
  interactionState: EventFieldInteractionState;
  timelineStepIndex: number;
  helperTextOverride?: string;
}): OperationFieldProgressModel {
  const currentIndex = resolveCurrentStageIndex(
    input.interactionState,
    input.timelineStepIndex,
  );
  const currentStageId = STAGE_DEFS[currentIndex]?.id ?? 'started';
  const progressPercent = clampProgress(
    (currentIndex / Math.max(STAGE_DEFS.length - 1, 1)) * 100,
  );

  const stages: OperationFieldProgressStage[] = STAGE_DEFS.map((stage, index) => ({
    ...stage,
    state: resolveStageState(index, currentIndex, input.interactionState),
  }));

  return {
    title: 'Canlı İlerleme',
    stages,
    currentStageId,
    progressPercent,
    statusLabel: resolveStatusLabel(currentStageId, input.interactionState),
    helperText: input.helperTextOverride ?? resolveHelperText(currentStageId, input.interactionState),
  };
}

export function mapTimelineStepToProgressStageId(
  timelineStepIndex: number,
  interactionState: EventFieldInteractionState,
): OperationFieldProgressStageId {
  return buildOperationFieldProgressModel({ interactionState, timelineStepIndex })
    .currentStageId;
}
