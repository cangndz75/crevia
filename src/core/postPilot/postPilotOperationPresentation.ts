import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { buildProgressionBridgeSummary } from '@/core/progression/progressionPresentation';

import {
  POST_PILOT_FORBIDDEN_WORDS,
  POST_PILOT_PREVIEW_CTA_FALLBACK_LABEL,
  POST_PILOT_PREVIEW_CTA_LABEL,
} from './postPilotOperationConstants';
import { derivePostPilotScopeStatuses } from './postPilotOperationEngine';
import { normalizePostPilotOperationState } from './postPilotOperationSeed';
import type {
  PostPilotNormalizeContext,
  PostPilotOperationState,
  PostPilotPhase,
  PostPilotScopeId,
  ScopeActivationStatus,
} from './postPilotOperationTypes';

export function buildPostPilotPhaseLabel(phase: PostPilotPhase): string {
  switch (phase) {
    case 'pilot_only':
      return 'Pilot devam ediyor';
    case 'pilot_complete_idle':
      return 'Pilot tamamlandı';
    case 'preview_seen':
      return 'Önizleme görüldü';
    case 'main_operation_light':
      return 'Hafif operasyon hazırlığı';
    case 'main_operation_full':
      return 'Ana operasyon genişlemesi';
    default:
      return 'Operasyon hazırlığı';
  }
}

export function buildPostPilotScopeStatusLabel(status: ScopeActivationStatus): string {
  switch (status) {
    case 'agenda':
      return 'Gündemde';
    case 'active':
      return 'Aktif';
    case 'stable':
      return 'Rutin';
    case 'dormant':
      return 'İzleniyor';
    case 'preview':
    default:
      return 'Önizleme';
  }
}

export function buildPostPilotAgendaLines(
  postPilotOperation: PostPilotOperationState | undefined,
  context: PostPilotNormalizeContext,
  authorityState?: unknown,
): { title: string; subtitle: string; istasyonLabel: string } {
  const normalized = normalizePostPilotOperationState(postPilotOperation, context);
  const scopes = derivePostPilotScopeStatuses({
    postPilotOperation: normalized,
    pilotStatus: context.pilotStatus,
    authorityState,
  });

  const istasyonLabel = buildPostPilotScopeStatusLabel(scopes.istasyon);

  if (normalized.phase === 'main_operation_light') {
    if (scopes.istasyon === 'active') {
      return {
        title: 'Hafif operasyon gündemi',
        subtitle: 'İstasyon kapsamı aktif izlemede. Operasyon yükü kademeli artıyor.',
        istasyonLabel,
      };
    }
    if (scopes.istasyon === 'agenda') {
      return {
        title: 'Hafif operasyon gündemi',
        subtitle: 'İstasyon kapsamı gündemde. Pilot sonrası saha hazırlığı sürüyor.',
        istasyonLabel,
      };
    }
    return {
      title: 'Hafif operasyon gündemi',
      subtitle: 'Pilot sonrası saha hazırlığı. Operasyon yükü kademeli artıyor.',
      istasyonLabel,
    };
  }

  return {
    title: 'Ana Operasyon Gündemi',
    subtitle: 'Pilot sonrası operasyon hazırlığı başladı.',
    istasyonLabel,
  };
}

export function buildPostPilotAgendaReadyLine(
  postPilotOperation: PostPilotOperationState | undefined,
  activeEventCount: number,
): string | null {
  if (postPilotOperation?.phase !== 'main_operation_light') {
    return null;
  }
  if (activeEventCount <= 0) {
    return null;
  }
  return 'Bugünkü gündem hazır';
}

export function buildPostPilotPreviewCtaLabel(
  pilotStatus: PostPilotNormalizeContext['pilotStatus'],
): string {
  return pilotStatus === 'completed'
    ? POST_PILOT_PREVIEW_CTA_LABEL
    : POST_PILOT_PREVIEW_CTA_FALLBACK_LABEL;
}

export function buildPostPilotPreviewCopyLines(): string[] {
  return [
    'Ana operasyon hafif hazırlık modunda başlar.',
    'İstasyon gündemi yetki durumuna göre izlenir.',
    'Günlük operasyon yükü kademeli artacak.',
  ];
}

export function buildPostPilotOperationSummary(
  postPilotOperation: unknown,
  context: PostPilotNormalizeContext,
  authorityState?: unknown,
): {
  phase: PostPilotPhase;
  phaseLabel: string;
  scopes: Record<PostPilotScopeId, ScopeActivationStatus>;
  scopeLabels: Record<PostPilotScopeId, string>;
  progressionVisible: boolean;
} {
  const normalized = normalizePostPilotOperationState(postPilotOperation, context);
  const scopes = derivePostPilotScopeStatuses({
    postPilotOperation: normalized,
    pilotStatus: context.pilotStatus,
    authorityState,
  });

  const progression = buildProgressionBridgeSummary({
    authorityState,
    currentDay: normalized.lastUpdatedDay ?? 7,
  });

  return {
    phase: normalized.phase,
    phaseLabel: buildPostPilotPhaseLabel(normalized.phase),
    scopes,
    scopeLabels: {
      istasyon: buildPostPilotScopeStatusLabel(scopes.istasyon),
      yesilvadi: buildPostPilotScopeStatusLabel(scopes.yesilvadi),
      main_operation: buildPostPilotScopeStatusLabel(scopes.main_operation),
    },
    progressionVisible: progression.visible,
  };
}

export function postPilotPresentationContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return POST_PILOT_FORBIDDEN_WORDS.filter((word) => haystack.includes(word));
}

export function collectPostPilotPresentationStrings(
  postPilotOperation: unknown,
  context: PostPilotNormalizeContext,
  authorityState?: unknown,
): string[] {
  const summary = buildPostPilotOperationSummary(
    postPilotOperation,
    context,
    authorityState,
  );
  const agenda = buildPostPilotAgendaLines(
    normalizePostPilotOperationState(postPilotOperation, context),
    context,
    authorityState,
  );

  return [
    buildPostPilotPhaseLabel(summary.phase),
    buildPostPilotPreviewCtaLabel(context.pilotStatus),
    ...buildPostPilotPreviewCopyLines(),
    agenda.title,
    agenda.subtitle,
    summary.scopeLabels.istasyon,
    summary.scopeLabels.yesilvadi,
    summary.scopeLabels.main_operation,
    'Hafif operasyon',
  ].filter(Boolean);
}
