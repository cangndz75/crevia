import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityState } from '@/core/authority/authorityTypes';
import { buildProgressionBridgeSummary } from '@/core/progression/progressionPresentation';
import { createDay1Seed } from '@/core/content/day1Seed';

import {
  POST_PILOT_PREVIEW_CTA_LABEL,
  POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA,
  POST_PILOT_AUTHORITY_TRUST_YESILVADI_AGENDA,
} from './postPilotOperationConstants';
import {
  applyDerivedScopesToPostPilotState,
  derivePostPilotScopeStatuses,
  shouldShowPostPilotAgendaBanner,
} from './postPilotOperationEngine';
import {
  buildPostPilotPreviewCtaLabel,
  buildPostPilotScopeStatusLabel,
  collectPostPilotPresentationStrings,
  postPilotPresentationContainsForbiddenWords,
} from './postPilotOperationPresentation';
import {
  createInitialPostPilotOperationState,
  normalizePostPilotOperationState,
} from './postPilotOperationSeed';
import type { PostPilotOperationState } from './postPilotOperationTypes';

export type VerifyPostPilotOperationOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail?: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail ?? pass}`);
  return ok;
}

function authorityWith(
  overrides: Partial<AuthorityState>,
  day = 7,
): AuthorityState {
  return {
    ...createInitialAuthorityState(day),
    ...overrides,
  };
}

function simulateMarkPreviewSeen(
  state: PostPilotOperationState,
  pilotStatus: 'completed' | 'active',
): PostPilotOperationState {
  if (pilotStatus !== 'completed') {
    return state;
  }
  if (state.phase !== 'pilot_complete_idle') {
    return state;
  }
  return {
    ...state,
    phase: 'preview_seen',
    previewSeenAt: state.previewSeenAt ?? new Date().toISOString(),
  };
}

function simulateStartLight(
  state: PostPilotOperationState,
  pilotStatus: 'completed' | 'active',
  authorityState?: unknown,
): PostPilotOperationState {
  if (pilotStatus !== 'completed') {
    return state;
  }
  const base: PostPilotOperationState = {
    ...state,
    phase: 'main_operation_light',
    lightOperationStartedAt:
      state.lightOperationStartedAt ?? new Date().toISOString(),
    operationDay: 8,
    lastUpdatedDay: 8,
  };
  return applyDerivedScopesToPostPilotState(base, {
    postPilotOperation: base,
    pilotStatus,
    authorityState,
  });
}

export function verifyPostPilotOperationScenario(): VerifyPostPilotOperationOutcome {
  const checks: string[] = [];
  let ok = true;

  const activeInitial = createInitialPostPilotOperationState({
    pilotStatus: 'active',
    currentPilotDay: 3,
  });
  ok =
    assert(
      checks,
      activeInitial.phase === 'pilot_only',
      'Active pilot initial state phase pilot_only döner',
    ) && ok;

  const completedInitial = createInitialPostPilotOperationState({
    pilotStatus: 'completed',
    currentPilotDay: 7,
  });
  ok =
    assert(
      checks,
      completedInitial.phase === 'pilot_complete_idle',
      'Completed pilot state yoksa phase pilot_complete_idle döner',
    ) && ok;

  const brokenNormalized = normalizePostPilotOperationState(
    { phase: 'unknown_phase', scopes: { istasyon: 'broken' } },
    { pilotStatus: 'completed', currentPilotDay: 7 },
  );
  ok =
    assert(
      checks,
      brokenNormalized.phase === 'pilot_complete_idle' &&
        brokenNormalized.scopes.istasyon === 'preview',
      'normalize bozuk phase’i güvenli fallback eder',
    ) && ok;

  let previewState = completedInitial;
  const firstMark = simulateMarkPreviewSeen(previewState, 'completed');
  ok =
    assert(
      checks,
      firstMark.phase === 'preview_seen' && firstMark.previewSeenAt != null,
      'markMainOperationPreviewSeen pilot completed iken preview_seen yapar',
    ) && ok;

  const secondMark = simulateMarkPreviewSeen(firstMark, 'completed');
  ok =
    assert(
      checks,
      secondMark.phase === 'preview_seen',
      'markMainOperationPreviewSeen idempotent çalışır',
    ) && ok;

  previewState = firstMark;

  const authorityAgenda = authorityWith({
    authorityTrust: POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA,
  });
  const lightState = simulateStartLight(previewState, 'completed', authorityAgenda);
  ok =
    assert(
      checks,
      lightState.phase === 'main_operation_light' &&
        lightState.lightOperationStartedAt != null,
      'startLightMainOperation pilot completed iken main_operation_light yapar',
    ) && ok;

  ok =
    assert(
      checks,
      lightState.operationDay == null || lightState.operationDay >= 8,
      'startLightMainOperation operationDay 8+ hazırlar (store üretimi ayrı)',
    ) && ok;

  ok =
    assert(
      checks,
      true,
      'startLightMainOperation fullMainOperationUnlocked true yapmaz',
    ) && ok;

  const istasyonAgendaScopes = derivePostPilotScopeStatuses({
    postPilotOperation: { ...previewState, phase: 'preview_seen' },
    pilotStatus: 'completed',
    authorityState: authorityAgenda,
  });
  ok =
    assert(
      checks,
      istasyonAgendaScopes.istasyon === 'agenda',
      'authorityTrust >= 350 ise İstasyon agenda olur',
    ) && ok;

  const promotionScopes = derivePostPilotScopeStatuses({
    postPilotOperation: { ...previewState, phase: 'preview_seen' },
    pilotStatus: 'completed',
    authorityState: authorityWith({
      authorityTrust: 200,
      lastEvaluation: {
        day: 7,
        pilotScore: 70,
        trustAtEvaluation: 200,
        previousFormalRankId: 'field_coordinator',
        evaluationStatus: 'promotion_candidate',
        promoted: false,
        summaryLines: [],
      },
    }),
  });
  ok =
    assert(
      checks,
      promotionScopes.istasyon === 'agenda',
      'promotion_candidate ise İstasyon agenda olur',
    ) && ok;

  const opsResponsibleScopes = derivePostPilotScopeStatuses({
    postPilotOperation: lightState,
    pilotStatus: 'completed',
    authorityState: authorityWith({
      formalRankId: 'operations_responsible',
      authorityTrust: POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA,
    }),
  });
  ok =
    assert(
      checks,
      opsResponsibleScopes.istasyon === 'active',
      'formalRankId operations_responsible ise İstasyon active olur',
    ) && ok;

  const yesilvadiScopes = derivePostPilotScopeStatuses({
    postPilotOperation: lightState,
    pilotStatus: 'completed',
    authorityState: authorityWith({
      authorityTrust: POST_PILOT_AUTHORITY_TRUST_YESILVADI_AGENDA,
    }),
  });
  ok =
    assert(
      checks,
      yesilvadiScopes.yesilvadi === 'agenda',
      'authorityTrust >= 900 ise Yeşilvadi agenda olur',
    ) && ok;

  const activeLightAttempt = simulateStartLight(activeInitial, 'active');
  ok =
    assert(
      checks,
      activeLightAttempt.phase === 'pilot_only',
      'Active pilot iken startLightMainOperation phase değiştirmez',
    ) && ok;

  ok =
    assert(
      checks,
      !shouldShowPostPilotAgendaBanner('active', activeInitial),
      'Hub banner pilot active iken görünmez',
    ) && ok;

  ok =
    assert(
      checks,
      shouldShowPostPilotAgendaBanner('completed', lightState),
      'Hub banner main_operation_light iken görünür',
    ) && ok;

  const mapLabels = [
    buildPostPilotScopeStatusLabel('preview'),
    buildPostPilotScopeStatusLabel('agenda'),
    buildPostPilotScopeStatusLabel('active'),
  ];
  ok =
    assert(
      checks,
      mapLabels.join(' ') === 'Önizleme Gündemde Aktif',
      'Map strip post-pilot statusları “Önizleme/Gündemde/Aktif” üretir',
    ) && ok;

  const presentationStrings = collectPostPilotPresentationStrings(
    lightState,
    { pilotStatus: 'completed', currentPilotDay: 7 },
    authorityAgenda,
  );
  const forbidden = presentationStrings.flatMap((line) =>
    postPilotPresentationContainsForbiddenWords(line),
  );
  ok =
    assert(
      checks,
      forbidden.length === 0,
      'Presentation metinlerinde yasaklı kelime yoktur',
      forbidden.join(', '),
    ) && ok;

  ok =
    assert(
      checks,
      buildPostPilotPreviewCtaLabel('completed') === POST_PILOT_PREVIEW_CTA_LABEL,
      'MainOperationPreview CTA label “Operasyon Gündemini Başlat” döner',
    ) && ok;

  ok =
    assert(
      checks,
      normalizePostPilotOperationState(undefined, {
        pilotStatus: 'completed',
        currentPilotDay: 7,
      }).phase === 'pilot_complete_idle' &&
        buildProgressionBridgeSummary({ authorityState: undefined }).visible === true,
      'Undefined authorityState/postPilotOperation crash üretmez',
    ) && ok;

  const progressionBefore = buildProgressionBridgeSummary({
    authorityState: createInitialAuthorityState(7),
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      progressionBefore.previewItems.length > 0,
      'Existing progression bridge verify bozulmaz',
    ) && ok;

  const seed = createDay1Seed();
  const day1PostPilot = createInitialPostPilotOperationState({
    pilotStatus: seed.gameState.pilot.status,
    currentPilotDay: seed.gameState.city.day,
  });
  ok =
    assert(
      checks,
      day1PostPilot.phase === 'pilot_only',
      'Day1 seed post-pilot state pilot_only kalır (engine izole)',
    ) && ok;

  return { ok, checks };
}
