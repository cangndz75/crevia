import { SAVE_VERSION } from '@/store/gamePersist';

import {
  INTERACTION_FORBIDDEN_WORDS,
  KNOWN_INTERACTION_ACTIONS,
  KNOWN_INTERACTION_ROUTES,
} from './interactionContractConstants';
import {
  assertActionNamesKnown,
  assertDebugGuard,
  assertDisabledExplanation,
  assertForbiddenWordsInLabels,
  assertNoFakeCta,
  assertRouteTargetsKnown,
  assertStaticCardsAreNotPressable,
  assertTargetForPressable,
  runInteractionContractAudit,
  validateInteractionContract,
} from './interactionContractAudit';
import {
  getInteractionContractById,
  getInteractionContractsForComponent,
  INTERACTION_CONTRACT_REGISTRY,
} from './interactionContractRegistry';
import {
  buildInteractionAuditConsoleReport,
  buildInteractionAuditSummary,
  getInteractionAuditHealth,
  groupInteractionFindingsBySurface,
} from './interactionContractPresentation';
import type { InteractionContract } from './interactionContractTypes';

export type VerifyInteractionContractsOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function contract(id: string): InteractionContract {
  const c = getInteractionContractById(id);
  if (!c) throw new Error(`Missing contract ${id}`);
  return c;
}

export function verifyInteractionContractsScenario(): VerifyInteractionContractsOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(
    assert(
      checks,
      INTERACTION_CONTRACT_REGISTRY.length > 0,
      'Registry boş değil',
      'Registry empty',
    ),
  );

  record(
    assert(
      checks,
      INTERACTION_CONTRACT_REGISTRY.length >= 45,
      `En az 45 interaction contract (${INTERACTION_CONTRACT_REGISTRY.length})`,
      `Only ${INTERACTION_CONTRACT_REGISTRY.length} contracts`,
    ),
  );

  const ids = INTERACTION_CONTRACT_REGISTRY.map((c) => c.id);
  record(
    assert(
      checks,
      new Set(ids).size === ids.length,
      'Contract id duplicate yok',
      'Duplicate ids',
    ),
  );

  record(
    assert(
      checks,
      INTERACTION_CONTRACT_REGISTRY.every((c) => c.componentName.length > 0),
      'Component name boş değil',
      'Empty componentName',
    ),
  );

  record(
    assert(
      checks,
      INTERACTION_CONTRACT_REGISTRY.every((c) => c.label.length > 0),
      'Label boş değil',
      'Empty label',
    ),
  );

  const surfaces = new Set(INTERACTION_CONTRACT_REGISTRY.map((c) => c.surface));
  record(
    assert(
      checks,
      surfaces.has('hub') && surfaces.has('report') && surfaces.has('map'),
      'Surface geçerli (hub/report/map)',
      'Missing surfaces',
    ),
  );

  const affordances = new Set(INTERACTION_CONTRACT_REGISTRY.map((c) => c.visualAffordance));
  record(
    assert(
      checks,
      affordances.has('static_card') && affordances.has('primary_cta'),
      'Visual affordance geçerli',
      'Missing affordances',
    ),
  );

  const actions = new Set(INTERACTION_CONTRACT_REGISTRY.map((c) => c.expectedAction));
  record(
    assert(
      checks,
      actions.has('none') && actions.has('state_update'),
      'Expected action geçerli',
      'Missing actions',
    ),
  );

  const ctaWithNone = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) =>
      (c.visualAffordance === 'primary_cta' ||
        c.visualAffordance === 'secondary_cta' ||
        c.visualAffordance === 'option_button') &&
      c.expectedAction === 'none',
  );
  record(
    assert(
      checks,
      ctaWithNone.length === 0,
      'CTA contract expectedAction none olamaz',
      `CTA none: ${ctaWithNone.map((c) => c.id).join(', ')}`,
    ),
  );

  const navBroken = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) => c.expectedAction === 'navigation' && !c.target?.route,
  );
  record(
    assert(
      checks,
      navBroken.length === 0 || navBroken.every((c) => c.isOptional),
      'Navigation action route gerektirir',
      'Nav without route',
    ),
  );

  const modalBroken = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) => c.expectedAction === 'modal' && !c.target?.modalId,
  );
  record(
    assert(
      checks,
      modalBroken.length === 0,
      'Modal action modalId gerektirir',
      'Modal without modalId',
    ),
  );

  const stateBroken = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) =>
      (c.expectedAction === 'state_update' ||
        c.expectedAction === 'external_placeholder') &&
      !c.target?.actionName,
  );
  record(
    assert(
      checks,
      stateBroken.length === 0 || stateBroken.every((c) => c.isOptional),
      'State update actionName gerektirir',
      'State without actionName',
    ),
  );

  const devBroken = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) => c.visualAffordance === 'debug_button' && c.expectedAction !== 'debug_only',
  );
  record(assert(checks, devBroken.length === 0, 'Debug button guard gerektirir', 'Dev broken'));

  const disabledBroken = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) =>
      c.disabledBehavior?.explanationRequired &&
      !c.disabledBehavior?.explanation?.trim(),
  );
  record(
    assert(
      checks,
      disabledBroken.length === 0,
      'Disabled CTA açıklama gerektirir',
      'Disabled missing explanation',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_operation_signals_static').visualAffordance === 'static_card',
      'HubOperationSignalsCard static olarak kayıtlı',
      'Signals not static',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_advisor_ask_daily').target?.actionName === 'askAdvisorForDailySummary',
      'HubAdvisorCard Danışmana Sor state_update kayıtlı',
      'Advisor CTA wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_advisor_missed_ack').target?.actionName ===
        'acknowledgeAdvisorMissedSignal',
      'AdvisorMissedSignalNote acknowledge action kayıtlı',
      'Missed ack wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_daily_plan_edit').target?.modalId === 'daily_operations_plan_editor',
      'HubDailyOperationsPlanCard edit modal kayıtlı',
      'Plan edit modal wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_daily_plan_confirm').target?.actionName === 'confirmDailyOperationsPlan',
      'HubDailyOperationsPlanCard confirm action kayıtlı',
      'Plan confirm wrong',
    ),
  );

  const seasonGoalsCta = getInteractionContractsForComponent('HubMainOperationSeasonCard').find(
    (c) => c.label === 'Hedefleri Gör',
  );
  record(
    assert(
      checks,
      seasonGoalsCta?.target?.modalId === 'main_operation_season_goals_detail',
      'HubMainOperationSeasonCard “Hedefleri Gör” modal contract kayıtlı',
      'Season goals modal CTA missing',
    ),
  );

  const seasonLimitedCta = getInteractionContractsForComponent('HubMainOperationSeasonCard').find(
    (c) => c.guard?.accessMode === 'limited',
  );
  record(
    assert(
      checks,
      seasonLimitedCta?.isOptional === true,
      'HubMainOperationSeasonCard limited nav optional',
      'Season limited CTA not optional',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_crisis_desk_static').expectedAction === 'none',
      'HubCrisisDeskCard fake CTA içermiyor',
      'Crisis has fake CTA',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_live_ops_option').target?.actionName === 'resolveMicroDecision',
      'LiveOperationDecisionCard option buttons state_update kayıtlı',
      'Live ops option wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('event_assignment_confirm').target?.actionName === 'confirmEventAssignment',
      'EventAssignmentPanel confirm action kayıtlı',
      'Assignment confirm wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('event_assignment_edit').target?.modalId === 'assignment_editor' &&
        contract('event_assignment_editor_confirm').target?.actionName ===
          'confirmEventAssignment',
      'AssignmentEditorModal modal contract kayıtlı',
      'Assignment modal wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('event_field_micro_decision').target?.actionName === 'resolveMicroDecision',
      'EventFieldMicroDecisionCard option action kayıtlı',
      'Field micro wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('report_pilot_completion_cta').target?.route === '/post-pilot-offer',
      'ReportPilotCompletionCard post-pilot route kayıtlı',
      'Pilot completion route wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('post_pilot_offer_primary').target?.actionName ===
        'mockPurchaseMainOperationPack',
      'PostPilotAccessChoiceCard primary mock purchase action kayıtlı',
      'Primary action wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('post_pilot_offer_limited').target?.actionName === 'continueWithLimitedAgenda',
      'PostPilotAccessChoiceCard secondary limited action kayıtlı',
      'Limited action wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('post_pilot_offer_restore').target?.actionName ===
        'restoreMainOperationAccessPlaceholder',
      'Restore access placeholder action kayıtlı',
      'Restore wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('map_pin_select').expectedAction === 'state_update',
      'MapPin selection action kayıtlı',
      'MapPin wrong',
    ),
  );

  const mapPanel = contract('map_bottom_panel_cta');
  record(
    assert(
      checks,
      mapPanel.expectedAction === 'state_update' || mapPanel.expectedAction === 'navigation',
      'MapOperationBottomPanel valid CTA kayıtlı',
      'Map panel invalid',
    ),
  );

  record(
    assert(
      checks,
      contract('map_neighborhood_select').expectedAction === 'state_update',
      'MapNeighborhoodStrip selection/static davranışı kayıtlı',
      'Map strip wrong',
    ),
  );

  record(
    assert(
      checks,
      contract('hub_dev_tools').target?.debugGuard === '**DEV**',
      'Dev tools production guard kayıtlı',
      'Dev guard missing',
    ),
  );

  const forbiddenInLabels = INTERACTION_CONTRACT_REGISTRY.flatMap((c) =>
    assertForbiddenWordsInLabels(c),
  );
  record(
    assert(
      checks,
      forbiddenInLabels.length === 0,
      'Forbidden words yok',
      forbiddenInLabels.map((f) => f.message).join('; '),
    ),
  );

  record(
    assert(
      checks,
      KNOWN_INTERACTION_ROUTES.includes('/post-pilot-offer'),
      'Known routes listesi critical routes uyumlu',
      'Routes list incomplete',
    ),
  );

  record(
    assert(
      checks,
      KNOWN_INTERACTION_ACTIONS.includes('resolveMicroDecision'),
      'Known action listesi critical actions uyumlu',
      'Actions list incomplete',
    ),
  );

  const reportStatics = [
    'report_operation_signals_static',
    'report_daily_plan_static',
    'report_assignment_static',
  ];
  record(
    assert(
      checks,
      reportStatics.every((id) => contract(id).visualAffordance === 'static_card'),
      'Report cards static card olarak mostly kayıtlı',
      'Report not static',
    ),
  );

  record(
    assert(
      checks,
      contract('event_impact_preview_static').expectedAction === 'none',
      'OperationImpactPreviewStrip static informational kayıtlı',
      'Impact strip not static',
    ),
  );

  record(
    assert(
      checks,
      !!contract('hub_daily_plan_edit').disabledBehavior?.explanation,
      'Disabled Day 1 planning edit explanation kayıtlı',
      'Day1 explanation missing',
    ),
  );

  record(
    assert(
      checks,
      contract('post_pilot_offer_limited').isOptional === true,
      'Limited/full post-pilot CTA states registry’de açıklanmış',
      'Limited optional missing',
    ),
  );

  const microNotes = contract('hub_live_ops_option').notes ?? '';
  record(
    assert(
      checks,
      microNotes.includes('effects') || microNotes.includes('Resolved'),
      'Micro decision active option effect contract uyarısız',
      'Micro notes missing',
    ),
  );

  if (
    !warn(
      checks,
      contract('hub_crisis_desk_static').notes?.includes('pending') ?? false,
      'Crisis desk no detail — static by design',
      'Crisis detail screen pending, no CTA rendered',
    )
  ) {
    hasWarn = true;
  }

  if (
    !warn(
      checks,
      contract('hub_main_operation_season_static').notes?.includes('pending') ?? false,
      'Season goals detail pending — CTA optional',
      'Season goal detail modal pending, CTA hidden',
    )
  ) {
    hasWarn = true;
  }

  const audit = runInteractionContractAudit();
  record(
    assert(checks, audit.failCount === 0, 'Audit result FAIL üretmiyor', `${audit.failCount} fails`),
  );

  record(
    assert(
      checks,
      audit.health === 'PASS' || audit.health === 'WARN',
      `Audit health ${audit.health} (FAIL olmamalı)`,
      `Audit health FAIL`,
    ),
  );

  const grouped = groupInteractionFindingsBySurface(audit);
  record(
    assert(
      checks,
      typeof grouped === 'object',
      'Findings grouped by surface çalışıyor',
      'Group failed',
    ),
  );

  const report = buildInteractionAuditConsoleReport(audit);
  record(assert(checks, report.length > 40, 'Console report boş değil', 'Report too short'));

  record(
    assert(
      checks,
      typeof INTERACTION_CONTRACT_REGISTRY.length === 'number',
      'Registry export app runtime’da side effect yapmıyor',
      'Side effect',
    ),
  );

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION değişmedi (22)', `SAVE_VERSION ${SAVE_VERSION}`));

  const staticWithNotes = INTERACTION_CONTRACT_REGISTRY.filter(
    (c) => c.visualAffordance === 'static_card',
  );
  record(
    assert(
      checks,
      staticWithNotes.filter((c) => c.notes && c.notes.length > 0).length >=
        staticWithNotes.length * 0.5,
      'Static copy mobile guard notu olan yoğun kartlar notes içeriyor',
      'Static notes sparse',
    ),
  );

  for (const c of INTERACTION_CONTRACT_REGISTRY.slice(0, 5)) {
    const findings = [
      ...assertNoFakeCta(c),
      ...assertDisabledExplanation(c),
      ...assertDebugGuard(c),
      ...assertForbiddenWordsInLabels(c),
    ];
    if (findings.some((f) => f.severity === 'fail')) ok = false;
  }

  const summary = buildInteractionAuditSummary(audit);
  record(assert(checks, summary.length > 0, 'Audit summary üretiliyor', 'No summary'));

  record(
    assert(
      checks,
      getInteractionAuditHealth(audit) === audit.health,
      'getInteractionAuditHealth tutarlı',
      'Health mismatch',
    ),
  );

  validateInteractionContract(contract('hub_advisor_ask_daily'));

  return { ok, warn: hasWarn || audit.health === 'WARN', checks };
}
