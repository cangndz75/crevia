import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import {
  fieldVarietyHintLine,
  getEventGameplayVarietyProfile,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type {
  EventFieldAssignmentEffect,
  EventFieldInteractionState,
  EventFieldSelectedPlanSummary,
} from '@/features/events/utils/eventFieldPhasePresentation';
import type { OperationFieldProgressStageId } from '@/features/events/utils/operationFieldProgressModel';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

export type OperationFieldSignal = {
  id: string;
  sourceLabel: string;
  message: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type OperationFieldSignalsPresentation = {
  title: string;
  items: OperationFieldSignal[];
};

export type BuildOperationFieldSignalsInput = {
  event: EventCard;
  assignment?: EventAssignmentState | null;
  selectedPlan: EventFieldSelectedPlanSummary;
  assignmentEffect: EventFieldAssignmentEffect;
  interactionState: EventFieldInteractionState;
  progressStageId: OperationFieldProgressStageId;
  day?: number;
  isDay1LearningEvent?: boolean;
  maintenanceHintText?: string;
  maintenanceHintTone?: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  recentVarietyProfiles?: import('@/core/eventVariety/eventGameplayVarietyTypes').BuildEventGameplayVarietyProfileInput['recentProfiles'];
  avoidLines?: string[];
};

type SignalCandidate = OperationFieldSignal & { priority: number };

const PLAN_TEAM_LINES: Record<EventPlanStrategyId, readonly string[]> = {
  rapid_response: [
    'Hızlı müdahale ekibi noktaya ulaştı, tempo yüksek.',
    'Ekip hızlı kontrol başlattı; kaynak temposu zorlanıyor.',
  ],
  balanced_plan: [
    'Ekip dengeli tempo ile müdahaleye başladı.',
    'Plan sınırları içinde ilerleme kaydediliyor.',
  ],
  long_term_fix: [
    'Ekip kalıcı çözüm adımlarını uygulamaya başladı.',
    'Önleyici müdahale yavaş ama güvenli ilerliyor.',
  ],
};

const STAGE_OPS_LINES: Record<
  OperationFieldProgressStageId,
  readonly string[]
> = {
  started: [
    'Saha ekibi konumlandı, ilk kontrol başladı.',
    'Operasyon noktasına ulaşıldı, çevre taranıyor.',
  ],
  intervening: [
    'Ekip ilk müdahaleyi tamamladı, alan kontrol altına alınıyor.',
    'Müdahale devam ediyor; baskı noktası izleniyor.',
  ],
  stabilizing: [
    'Alan dengeleniyor; mahalle tepkisi hâlâ hassas.',
    'Kontrol sağlandı, ilk etki sinyalleri toplanıyor.',
  ],
  preparing_result: [
    'Saha notu derleniyor, sonuç özeti hazırlanıyor.',
    'İlk etki kayda geçti, sonuç ekranına aktarılıyor.',
  ],
};

function mapMaintenanceTone(
  tone?: BuildOperationFieldSignalsInput['maintenanceHintTone'],
): OperationFieldSignal['tone'] {
  if (tone === 'warning' || tone === 'critical') return 'warning';
  if (tone === 'positive') return 'positive';
  return 'neutral';
}

function buildTeamSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  const strategyId = input.selectedPlan.strategyId ?? 'balanced_plan';
  const districtId = input.event.district?.trim() || 'mahalle';
  const message = pickSurfaceCopy(
    'field_team',
    'operation_feed',
    PLAN_TEAM_LINES[strategyId],
    {
      day: input.day,
      districtId,
      sourceIds: [input.event.id, strategyId],
      previousLines: input.avoidLines,
      duplicateKey: `${input.event.id}:team:${input.progressStageId}`,
    },
  );
  if (!message) return null;

  let tone: OperationFieldSignal['tone'] = 'positive';
  if (input.assignmentEffect.scoreBand === 'low') tone = 'warning';
  else if (input.assignmentEffect.scoreBand === 'medium') tone = 'neutral';

  return {
    id: 'team',
    sourceLabel: 'Ekip',
    message,
    tone,
    iconKey: 'people-outline',
    priority: 90,
  };
}

function buildOpsSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  const message = pickSurfaceCopy(
    'field_ops',
    'operation_feed',
    STAGE_OPS_LINES[input.progressStageId],
    {
      day: input.day,
      districtId: input.event.district,
      sourceIds: [input.event.id, input.progressStageId],
      previousLines: input.avoidLines,
      duplicateKey: `${input.event.id}:ops:${input.progressStageId}`,
    },
  );
  if (!message) return null;

  const tone: OperationFieldSignal['tone'] =
    input.event.riskLevel === 'critical' || input.event.riskLevel === 'high'
      ? 'warning'
      : 'neutral';

  return {
    id: 'ops',
    sourceLabel: 'Operasyon',
    message,
    tone,
    iconKey: 'pulse-outline',
    priority: 80,
  };
}

function buildCitizenSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  const strategyId = input.selectedPlan.strategyId ?? 'balanced_plan';
  const preview = input.event.previewEffects?.publicSatisfaction ?? 0;
  const profile = getEventGameplayVarietyProfile(input.event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });

  let variants: readonly string[];
  if (strategyId === 'long_term_fix') {
    variants = [
      'Mahallede düzenli müdahale sinyali alındı, güven yavaş toparlanıyor.',
      'Önleyici yaklaşım mahallede olumlu karşılandı.',
    ];
  } else if (strategyId === 'rapid_response') {
    variants = [
      'Görünür müdahale mahallede fark edildi, tepki izleniyor.',
      'Hızlı müdahale baskıyı azalttı ama görünürlük yüksek.',
    ];
  } else if (preview < -2 || profile.primaryPressure === 'social_sensitivity') {
    variants = [
      'Mahalle tepkisi hassas; görünür ve dengeli müdahale önemli.',
      'Sosyal nabız izleniyor, mahalle güveni kırılgan.',
    ];
  } else {
    variants = [
      'Mahalle tepkisi izleniyor, görünürlük dengeli.',
      'Vatandaş geri bildirimi nötr-olumlu seyrediyor.',
    ];
  }

  const varietyHint = fieldVarietyHintLine(profile);
  if (
    varietyHint &&
    input.day &&
    input.day > 1 &&
    !input.isDay1LearningEvent &&
    profile.primaryPressure === 'social_sensitivity'
  ) {
    variants = [varietyHint, ...variants];
  }

  const message = pickSurfaceCopy('field_citizen', 'operation_feed', variants, {
    day: input.day,
    districtId: input.event.district,
    sourceIds: [input.event.id, strategyId, profile.primaryPressure],
    previousLines: input.avoidLines,
    duplicateKey: `${input.event.id}:citizen:${strategyId}`,
  });
  if (!message) return null;

  const tone: OperationFieldSignal['tone'] =
    preview < -2 || profile.primaryPressure === 'social_sensitivity'
      ? 'warning'
      : strategyId === 'long_term_fix'
        ? 'positive'
        : 'neutral';

  return {
    id: 'citizen',
    sourceLabel: 'Mahalle',
    message,
    tone,
    iconKey: 'chatbubbles-outline',
    priority: 70,
  };
}

function buildVehicleSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  if (input.day !== undefined && input.day < 8) return null;
  if (!input.assignment?.vehicleType && !input.maintenanceHintText) return null;

  if (input.maintenanceHintText?.trim()) {
    return {
      id: 'maintenance',
      sourceLabel: 'Bakım',
      message: input.maintenanceHintText.trim(),
      tone: mapMaintenanceTone(input.maintenanceHintTone),
      iconKey: 'build-outline',
      priority: 85,
    };
  }

  const hasVehicle = Boolean(input.assignment?.vehicleType);
  const message = hasVehicle
    ? 'Araç sahada aktif, rota süresi plan dahilinde.'
    : 'Araç hazırlığı düşük; saha süresi uzayabilir.';

  return {
    id: 'vehicle',
    sourceLabel: 'Araç',
    message,
    tone: hasVehicle ? 'positive' : 'warning',
    iconKey: 'car-outline',
    priority: 60,
  };
}

function buildResourceSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  if (input.day !== undefined && input.day < 8) return null;
  if (input.assignmentEffect.scoreBand !== 'low') return null;

  return {
    id: 'resource',
    sourceLabel: 'Kaynak',
    message:
      'Atama uyumu zayıf; ekip yorgunluğu müdahale süresini uzatabilir.',
    tone: 'warning',
    iconKey: 'wallet-outline',
    priority: 75,
  };
}

function buildCompletedSignal(input: BuildOperationFieldSignalsInput): SignalCandidate | null {
  if (input.interactionState !== 'completed') return null;
  return {
    id: 'complete',
    sourceLabel: 'Operasyon',
    message: 'Saha müdahalesi tamamlandı, sonuç özeti hazır.',
    tone: 'positive',
    iconKey: 'checkmark-circle-outline',
    priority: 95,
  };
}

function dedupeSignals(candidates: SignalCandidate[], maxItems: number): OperationFieldSignal[] {
  const usedMessages = new Set<string>();
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const picked: OperationFieldSignal[] = [];

  for (const candidate of sorted) {
    const normalized = candidate.message.trim().toLowerCase();
    if (usedMessages.has(normalized)) continue;
    usedMessages.add(normalized);
    picked.push({
      id: candidate.id,
      sourceLabel: candidate.sourceLabel,
      message: candidate.message,
      tone: candidate.tone,
      iconKey: candidate.iconKey,
    });
    if (picked.length >= maxItems) break;
  }

  return picked;
}

export function buildOperationFieldSignalsPresentation(
  input: BuildOperationFieldSignalsInput,
): OperationFieldSignalsPresentation {
  const isDay1 = input.isDay1LearningEvent || (input.day ?? input.event.day ?? 1) === 1;
  const maxItems = isDay1 ? 2 : 3;

  const candidates: SignalCandidate[] = [
    buildCompletedSignal(input),
    buildTeamSignal(input),
    buildOpsSignal(input),
    buildCitizenSignal(input),
    buildVehicleSignal(input),
    buildResourceSignal(input),
  ].filter((entry): entry is SignalCandidate => entry !== null);

  const items = dedupeSignals(candidates, maxItems);

  return {
    title: isDay1 ? 'Saha Sinyalleri' : 'Saha Güncellemeleri',
    items,
  };
}
