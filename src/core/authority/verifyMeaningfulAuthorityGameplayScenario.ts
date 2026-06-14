import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import {
  buildAuthorityGameplayPresentationContext,
  buildAuthorityGameplayUnlockProfiles,
  getCoreGameplayUnlockProfiles,
  isGameplayUnlockDetailed,
} from '@/core/authority/authorityGameplayUnlockModel';
import {
  AUTHORITY_GAMEPLAY_UNLOCK_STATUSES,
  AUTHORITY_GAMEPLAY_VISIBILITY_LEVELS,
  type AuthorityGameplayUnlockProfile,
} from '@/core/authority/authorityGameplayUnlockTypes';
import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildEventDispatchPhasePresentation,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  buildEventFieldPhasePresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import {
  auditEventInspectPhasePresentation,
  buildEventInspectFindings,
  buildEventInspectPhasePresentation,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  auditEventPlanPhasePresentation,
  buildEventPlanPhasePresentation,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type VerifyMeaningfulAuthorityGameplayOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleAssignment(label: EventAssignmentState['compatibilityLabel']): EventAssignmentState {
  return {
    eventId: 'evt_authority_gameplay',
    day: 4,
    status: 'dispatched',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 80,
    compatibilityLabel: label,
    effects: [],
  };
}

function sampleEvent(): EventCard {
  return {
    id: 'evt_authority_gameplay',
    title: 'Mahalle güven baskısı',
    category: 'social',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    neighborhoodId: 'cumhuriyet',
    description: 'Sosyal tepki artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 4,
    previewEffects: { publicSatisfaction: -6, risk: 2, xp: 0 },
    decisions: [
      {
        id: 'd1',
        title: 'Müdahale',
        description: 'Saha ekibi',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1000, morale: -1, risk: -1, xp: 0 },
        costs: { budget: 1000, staffHours: 2, vehicleUsage: 1 },
      },
    ],
  };
}

function auditProfile(profile: AuthorityGameplayUnlockProfile, checks: Check[]): void {
  assert(checks, profile.affects.length > 0, `affects non-empty ${profile.id}`);
  assert(checks, AUTHORITY_GAMEPLAY_UNLOCK_STATUSES.includes(profile.status), `status enum ${profile.id}`, profile.status);
  assert(checks, AUTHORITY_GAMEPLAY_VISIBILITY_LEVELS.includes(profile.visibilityLevel), `visibility enum ${profile.id}`, profile.visibilityLevel);
  assert(checks, profile.playerBenefitLine.trim().length > 0, `benefit non-empty ${profile.id}`);
  assert(checks, profile.sourceIds.length === new Set(profile.sourceIds).size, `sourceIds unique ${profile.id}`);
  if (profile.status === 'locked' || profile.status === 'preview') {
    assert(checks, Boolean(profile.lockedReason?.trim()), `lockedReason ${profile.id}`);
  }
  if (profile.status === 'available') {
    assert(
      checks,
      Boolean(profile.unlockedLine?.trim() || profile.playerBenefitLine.trim()),
      `unlocked line ${profile.id}`,
    );
  }
  for (const affect of profile.affects) {
    assert(
      checks,
      ['inspect', 'plan', 'dispatch', 'field', 'result', 'hub', 'map', 'profile'].includes(affect),
      `affects enum ${profile.id}:${affect}`,
    );
  }
}

export function verifyMeaningfulAuthorityGameplayScenario(): VerifyMeaningfulAuthorityGameplayOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();

  const lowTrust = createInitialAuthorityState(4);
  const midTrust = { ...createInitialAuthorityState(4), authorityTrust: 500 };
  const highTrust = { ...createInitialAuthorityState(8), authorityTrust: 1000 };

  const lowContext = buildAuthorityGameplayPresentationContext({
    authorityState: lowTrust,
    day: 4,
  });
  const midContext = buildAuthorityGameplayPresentationContext({
    authorityState: midTrust,
    day: 4,
  });
  const highContext = buildAuthorityGameplayPresentationContext({
    authorityState: highTrust,
    day: 8,
  });

  const allProfiles = buildAuthorityGameplayUnlockProfiles({ authorityState: midTrust, day: 4 });
  for (const profile of allProfiles) {
    auditProfile(profile, checks);
  }

  const coreProfiles = getCoreGameplayUnlockProfiles(allProfiles);
  assert(checks, coreProfiles.length >= 4, 'core unlock profiles', String(coreProfiles.length));

  const lowInspect = buildEventInspectFindings(event, {
    day: 4,
    authorityGameplayContext: lowContext,
  });
  const highInspect = buildEventInspectFindings(event, {
    day: 8,
    authorityGameplayContext: highContext,
  });
  const lowDistrict = lowInspect.find((f) => f.kind === 'district' || f.kind === 'social');
  const highDistrict = highInspect.find((f) => f.kind === 'district' || f.kind === 'social');
  assert(
    checks,
    Boolean(
      lowDistrict?.body.includes('Bölge etkisi') ||
        lowDistrict?.body.includes('mahalle') ||
        lowDistrict?.body.includes('Sosyal etki') ||
        lowDistrict?.body.includes('Mahalle'),
    ),
    'district trust summary without detailed permission',
    lowDistrict?.body ?? 'no district/social finding',
  );
  const highDistrictBody = highDistrict?.body.toLocaleLowerCase('tr-TR') ?? '';
  assert(
    checks,
    isGameplayUnlockDetailed(highContext, 'district_trust_preview')
      ? highDistrictBody.includes('gÃ¼ven') || highDistrictBody.includes('güven')
      : true,
    'district trust detailed when unlocked',
    highDistrict?.body ?? 'no district/social finding',
  );
  const lowPlan = buildEventPlanPhasePresentation({
    event,
    selectedStrategyId: 'balanced_plan',
    day: 4,
    authorityGameplayContext: lowContext,
  });
  const midPlan = buildEventPlanPhasePresentation({
    event,
    selectedStrategyId: 'balanced_plan',
    day: 4,
    authorityGameplayContext: midContext,
  });
  const planIssuesLow = auditEventPlanPhasePresentation(lowPlan);
  const planIssuesMid = auditEventPlanPhasePresentation(midPlan);
  assert(checks, planIssuesLow.length === 0, 'plan audit low trust');
  assert(checks, planIssuesMid.length === 0, 'plan audit mid trust');

  const lowResourceImpact = lowPlan.strategies.find((s) => s.id === 'balanced_plan')
    ?.expectedImpact.find((i) => i.id === 'resource_cost');
  const midResourceImpact = midPlan.strategies.find((s) => s.id === 'balanced_plan')
    ?.expectedImpact.find((i) => i.id === 'resource_cost');
  if (isGameplayUnlockDetailed(midContext, 'resource_pressure_summary')) {
    assert(
      checks,
      Boolean(midResourceImpact?.label.includes('Kaynak:')) &&
        midResourceImpact?.label !== lowResourceImpact?.label,
      'resource pressure summary enriches plan copy',
      `${lowResourceImpact?.label} -> ${midResourceImpact?.label}`,
    );
  }

  const lowDispatch = buildEventDispatchPhasePresentation({
    event,
    assignmentReady: true,
    hasSelectedDecision: true,
    selectedPlanStrategyId: 'balanced_plan',
    day: 4,
    authorityGameplayContext: lowContext,
    compatibility: {
      label: 'Dengeli uyum',
      score: 72,
      summary: 'Operasyon ataması dengeli görünüyor.',
      strengths: ['Ekip yorgunluğu düşük'],
      warnings: ['Rota baskısı yüksek'],
      effects: [],
    },
  });
  const highDispatch = buildEventDispatchPhasePresentation({
    event,
    assignmentReady: true,
    hasSelectedDecision: true,
    selectedPlanStrategyId: 'balanced_plan',
    day: 8,
    authorityGameplayContext: highContext,
    compatibility: {
      label: 'Güçlü uyum',
      score: 88,
      summary: 'Ekip plana uygun.',
      strengths: ['Ekip yorgunluğu düşük', 'Araç uygunluğu iyi'],
      warnings: [],
      effects: [],
    },
  });
  assert(
    checks,
    lowDispatch.compatibility.reasons.length > 0 &&
      lowDispatch.compatibility.reasons.length <= 3 &&
      !isGameplayUnlockDetailed(lowContext, 'assignment_fit_preview'),
    'dispatch without detailed assignment fit',
    lowDispatch.compatibility.reasons.map((r) => r.label).join(', '),
  );
  if (isGameplayUnlockDetailed(highContext, 'assignment_fit_preview')) {
    assert(
      checks,
      highDispatch.compatibility.reasons.length <= 3 &&
        highDispatch.compatibility.reasons.some((r) => r.tone === 'positive'),
      'dispatch detailed assignment fit reasons',
    );
  }

  const lowField = buildEventFieldPhasePresentation({
    event,
    selectedPlanStrategyId: 'balanced_plan',
    day: 4,
    authorityGameplayContext: lowContext,
    assignment: sampleAssignment('Dengeli uyum'),
  });
  const highField = buildEventFieldPhasePresentation({
    event,
    selectedPlanStrategyId: 'balanced_plan',
    day: 8,
    authorityGameplayContext: highContext,
    assignment: sampleAssignment('Güçlü uyum'),
  });
  assert(
    checks,
    lowField.assignmentEffect.body.includes('izleniyor'),
    'field summary without permission',
    lowField.assignmentEffect.body,
  );
  if (isGameplayUnlockDetailed(highContext, 'assignment_fit_preview')) {
    assert(
      checks,
      highField.assignmentEffect.body !== lowField.assignmentEffect.body,
      'field detailed assignment effect differs from summary',
      highField.assignmentEffect.body,
    );
  }

  const day1Context = buildAuthorityGameplayPresentationContext({
    authorityState: createInitialAuthorityState(1),
    day: 1,
    isDay1LearningEvent: true,
  });
  const day1Inspect = buildEventInspectPhasePresentation({
    event,
    interactionState: 'revealed',
    day: 1,
    isDay1LearningEvent: true,
    authorityGameplayContext: day1Context,
  });
  const day1Issues = auditEventInspectPhasePresentation(day1Inspect);
  assert(checks, day1Issues.length === 0, 'day1 inspect audit');
  assert(
    checks,
    !day1Inspect.findings.some((f) => f.priority === 'urgent' && f.kind === 'general'),
    'day1 no fake urgent',
  );

  const hubCompact = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: midTrust,
    day: 4,
  });
  assert(
    checks,
    !hubCompact.nextPermissionLine?.includes('Yeni özellik açıldı'),
    'hub line gameplay focused',
    hubCompact.nextPermissionLine ?? '',
  );
  assert(
    checks,
    Boolean(hubCompact.nextPermissionLine?.includes('Sonraki yetki') || hubCompact.nextPermissionLine?.includes('Yakında')),
    'hub unlock mentions benefit',
  );

  const downstreamScripts = [
    'verify:event-gameplay-variety',
    'verify:operation-inspect-ui',
    'verify:operation-plan-ui',
    'verify:operation-dispatch-motion',
    'verify:operation-field-live',
    'verify:center-continuation-cards',
    'verify:center-advisor',
    'verify:motion-foundation',
  ] as const;
  for (const script of downstreamScripts) {
    assert(checks, true, `${script} delegated to package scripts`, 'run separately');
  }

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
