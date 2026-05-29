import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { isAuthorityRankAtLeast } from '@/core/progression/progressionBridge';
import type { AuthorityState } from '@/core/authority/authorityTypes';

import {
  DEFAULT_PREVIEW_SCOPES,
  POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA,
  POST_PILOT_AUTHORITY_TRUST_YESILVADI_AGENDA,
} from './postPilotOperationConstants';
import type {
  DerivePostPilotScopeStatusesInput,
  PostPilotOperationState,
  PostPilotScopeId,
  ScopeActivationStatus,
} from './postPilotOperationTypes';

function resolveAuthority(input: DerivePostPilotScopeStatusesInput): AuthorityState {
  const day = Math.max(1, input.postPilotOperation.lastUpdatedDay ?? 7);
  return normalizeAuthorityState(input.authorityState, day);
}

function isPromotionCandidate(authority: AuthorityState): boolean {
  return authority.lastEvaluation?.evaluationStatus === 'promotion_candidate';
}

function resolveIstasyonForPreviewSeen(authority: AuthorityState): ScopeActivationStatus {
  if (
    authority.authorityTrust >= POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA ||
    isPromotionCandidate(authority)
  ) {
    return 'agenda';
  }
  return 'preview';
}

function resolveIstasyonForMainOperationLight(
  authority: AuthorityState,
): ScopeActivationStatus {
  if (isAuthorityRankAtLeast(authority.formalRankId, 'operations_responsible')) {
    return 'active';
  }
  if (
    authority.authorityTrust >= POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA ||
    isPromotionCandidate(authority)
  ) {
    return 'agenda';
  }
  return 'preview';
}

function resolveYesilvadiForMainOperationLight(
  authority: AuthorityState,
): ScopeActivationStatus {
  if (authority.authorityTrust >= POST_PILOT_AUTHORITY_TRUST_YESILVADI_AGENDA) {
    return 'agenda';
  }
  return 'preview';
}

function resolveMainOperationScope(
  phase: PostPilotOperationState['phase'],
): ScopeActivationStatus {
  if (phase === 'main_operation_light') {
    return 'agenda';
  }
  return 'preview';
}

export function derivePostPilotScopeStatuses(
  input: DerivePostPilotScopeStatusesInput,
): Record<PostPilotScopeId, ScopeActivationStatus> {
  const { postPilotOperation, pilotStatus } = input;
  const authority = resolveAuthority(input);
  const previewScopes = { ...DEFAULT_PREVIEW_SCOPES };

  if (pilotStatus === 'active' || pilotStatus === 'not_started') {
    return {
      istasyon: 'preview',
      yesilvadi: 'preview',
      main_operation: 'preview',
    };
  }

  switch (postPilotOperation.phase) {
    case 'pilot_only':
    case 'pilot_complete_idle':
      return previewScopes;

    case 'preview_seen':
      return {
        istasyon: resolveIstasyonForPreviewSeen(authority),
        yesilvadi: 'preview',
        main_operation: 'preview',
      };

    case 'main_operation_light':
      return {
        istasyon: resolveIstasyonForMainOperationLight(authority),
        yesilvadi: resolveYesilvadiForMainOperationLight(authority),
        main_operation: resolveMainOperationScope(postPilotOperation.phase),
      };

    case 'main_operation_full':
      return {
        istasyon: resolveIstasyonForMainOperationLight(authority),
        yesilvadi: resolveYesilvadiForMainOperationLight(authority),
        main_operation: 'agenda',
      };

    default:
      return previewScopes;
  }
}

export function applyDerivedScopesToPostPilotState(
  state: PostPilotOperationState,
  input: DerivePostPilotScopeStatusesInput,
): PostPilotOperationState {
  return {
    ...state,
    scopes: derivePostPilotScopeStatuses(input),
  };
}

export function shouldShowPostPilotAgendaBanner(
  pilotStatus: DerivePostPilotScopeStatusesInput['pilotStatus'],
  postPilotOperation: PostPilotOperationState | undefined,
): boolean {
  if (pilotStatus !== 'completed') {
    return false;
  }
  return postPilotOperation?.phase === 'main_operation_light';
}
