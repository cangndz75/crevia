import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS,
  DEVICE_TEST_BLOCKER_LINKS,
  EVIDENCE_PRIORITY_MISSING,
  INTERNAL_DEVICE_TEST_BATCH_IDS,
  buildEasInternalBuildChecklistTemplate,
} from './manualLaunchEvidenceConstants';
import type {
  ManualLaunchDeviceTestEvidenceCase,
  ManualLaunchEvidenceAuditResult,
  ManualLaunchEvidenceLogEntry,
  ManualLaunchEvidenceStatusExtended,
  ManualLaunchEvidenceSummary,
} from './manualLaunchEvidenceTypes';
import {
  MANUAL_LAUNCH_BLOCKERS,
  MANUAL_LAUNCH_DEVICE_TEST_MATRIX,
} from './manualLaunchTrackerConstants';
import type { ManualLaunchBlocker } from './manualLaunchTrackerTypes';
import type { ManualLaunchEvidenceType } from './manualLaunchEvidenceTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function entryId(blockerId: string, evidenceType: string): string {
  return `evidence.${blockerId}.${evidenceType}`;
}

function buildBlockerEvidenceLog(blocker: ManualLaunchBlocker): ManualLaunchEvidenceLogEntry[] {
  return blocker.evidenceRequired.map((evidenceType) => ({
    evidenceId: entryId(blocker.id, evidenceType),
    blockerId: blocker.id,
    evidenceType,
    status: 'missing' as const,
    platform:
      evidenceType === 'dashboard_event'
        ? 'dashboard'
        : evidenceType === 'store_console'
          ? 'store_console'
          : 'both',
    fakePassGuard: true as const,
  }));
}

function buildSentrySmokeEvidenceLog(): ManualLaunchEvidenceLogEntry[] {
  return [
    {
      evidenceId: 'evidence.sentry_dashboard_smoke.dashboard_event',
      blockerId: 'sentry_dashboard_smoke_test',
      testCaseId: 'idt.sentry_dashboard_visible',
      evidenceType: 'dashboard_event',
      status: 'missing',
      platform: 'dashboard',
      notes: 'Requires Sentry issue/event id after internal crash smoke.',
      fakePassGuard: true,
    },
    {
      evidenceId: 'evidence.sentry_dashboard_smoke.screenshot',
      blockerId: 'sentry_dashboard_smoke_test',
      testCaseId: 'idt.sentry_dashboard_visible',
      evidenceType: 'screenshot',
      status: 'missing',
      platform: 'dashboard',
      fakePassGuard: true,
    },
    {
      evidenceId: 'evidence.sentry_dashboard_smoke.manual_note',
      blockerId: 'sentry_dashboard_smoke_test',
      evidenceType: 'manual_note',
      status: 'missing',
      platform: 'both',
      notes: 'PII/raw save/event body absence confirmation.',
      fakePassGuard: true,
    },
  ];
}

function buildIapSandboxEvidenceLog(): ManualLaunchEvidenceLogEntry[] {
  const blockers = ['iap_sandbox_purchase_test', 'iap_restore_test'];
  const entries: ManualLaunchEvidenceLogEntry[] = [];
  for (const blockerId of blockers) {
    entries.push(
      {
        evidenceId: `evidence.${blockerId}.purchase_log`,
        blockerId,
        evidenceType: 'purchase_log',
        status: 'missing',
        platform: 'both',
        fakePassGuard: true,
      },
      {
        evidenceId: `evidence.${blockerId}.store_console`,
        blockerId,
        evidenceType: 'store_console',
        status: 'missing',
        platform: 'store_console',
        fakePassGuard: true,
      },
      {
        evidenceId: `evidence.${blockerId}.screenshot`,
        blockerId,
        evidenceType: 'screenshot',
        status: 'missing',
        platform: 'dashboard',
        notes: 'RevenueCat dashboard CustomerInfo screenshot optional.',
        fakePassGuard: true,
      },
    );
  }
  return entries;
}

function buildEasBuildEvidenceLog(): ManualLaunchEvidenceLogEntry[] {
  return [
    {
      evidenceId: 'evidence.eas_internal_build.build_log',
      blockerId: 'build.eas_internal',
      evidenceType: 'build_log',
      status: 'missing',
      platform: 'both',
      buildProfile: 'internal',
      fakePassGuard: true,
    },
    {
      evidenceId: 'evidence.eas_internal_build.manual_note',
      evidenceType: 'manual_note',
      status: 'missing',
      platform: 'both',
      notes: 'EAS build id + install method.',
      fakePassGuard: true,
    },
  ];
}

export function buildManualLaunchEvidenceLog(): ManualLaunchEvidenceLogEntry[] {
  const byId = new Map<string, ManualLaunchEvidenceLogEntry>();

  const add = (e: ManualLaunchEvidenceLogEntry) => {
    if (!byId.has(e.evidenceId)) byId.set(e.evidenceId, e);
  };

  for (const blocker of MANUAL_LAUNCH_BLOCKERS) {
    for (const e of buildBlockerEvidenceLog(blocker)) add(e);
  }
  for (const e of buildSentrySmokeEvidenceLog()) add(e);
  for (const e of buildIapSandboxEvidenceLog()) add(e);
  for (const e of buildEasBuildEvidenceLog()) add(e);

  for (const testId of INTERNAL_DEVICE_TEST_BATCH_IDS) {
    const test = MANUAL_LAUNCH_DEVICE_TEST_MATRIX.find((t) => t.id === testId);
    if (!test) continue;
    for (const evidenceType of test.evidenceRequired) {
      add({
        evidenceId: `evidence.${testId}.${evidenceType}`,
        testCaseId: testId,
        evidenceType,
        status: 'missing',
        platform: test.platform === 'android' ? 'android' : test.platform === 'ios' ? 'ios' : 'both',
        fakePassGuard: true,
      });
    }
  }

  return [...byId.values()];
}

export function canCloseBlockerWithEvidence(
  blockerId: string,
  evidenceLog: ManualLaunchEvidenceLogEntry[],
): boolean {
  const rules = BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS[blockerId];
  if (!rules) return false;

  const blockerEvidence = evidenceLog.filter((e) => e.blockerId === blockerId);
  for (const requiredType of rules.requiredVerifiedTypes) {
    const match = blockerEvidence.find(
      (e) => e.evidenceType === requiredType && e.status === 'verified',
    );
    if (!match) return false;
  }
  return true;
}

export function applyEvidenceStatusToBlockers(
  blockers: ManualLaunchBlocker[],
  evidenceLog: ManualLaunchEvidenceLogEntry[],
): ManualLaunchBlocker[] {
  return blockers.map((b) => {
    if (b.fakePassRisk && b.status === 'done') {
      return { ...b, status: 'pending' };
    }
    if (canCloseBlockerWithEvidence(b.id, evidenceLog)) {
      return { ...b, status: 'done' };
    }
    return b;
  });
}

function buildDeviceTestEvidence(
  evidenceLog: ManualLaunchEvidenceLogEntry[],
): ManualLaunchDeviceTestEvidenceCase[] {
  return INTERNAL_DEVICE_TEST_BATCH_IDS.map((testCaseId) => {
    const test = MANUAL_LAUNCH_DEVICE_TEST_MATRIX.find((t) => t.id === testCaseId)!;
    const testEvidence = evidenceLog.filter((e) => e.testCaseId === testCaseId);
    const allVerified =
      testEvidence.length > 0 && testEvidence.every((e) => e.status === 'verified');
    const anyAttached = testEvidence.some((e) => e.status === 'attached');
    const evidenceStatus = allVerified
      ? 'verified'
      : anyAttached
        ? 'attached'
        : 'missing';

    const linkedBlockerIds = DEVICE_TEST_BLOCKER_LINKS[testCaseId] ?? [];
    const blocksInternal = [
      'idt.iap_sandbox_purchase',
      'idt.iap_restore_sandbox',
      'idt.sentry_crash_smoke',
      'idt.sentry_dashboard_visible',
      'idt.day1_first_session',
      'idt.day8_pack_origin_event',
    ].includes(testCaseId);

    return {
      testCaseId,
      title: test.title,
      status: allVerified ? 'done' : 'pending',
      evidenceStatus,
      passCriteria: test.passCriteria,
      expectedResult: test.expectedResult,
      blocksInternalDeviceTest: blocksInternal,
      blocksPublicLaunch: ['idt.iap_sandbox_purchase', 'idt.iap_restore_sandbox', 'idt.privacy_store_metadata_check'].includes(
        testCaseId,
      ),
      evidenceRequired: test.evidenceRequired,
      linkedBlockerIds,
    };
  });
}

function buildEvidenceSummary(evidenceLog: ManualLaunchEvidenceLogEntry[]): ManualLaunchEvidenceSummary {
  const missingEvidence = evidenceLog.filter((e) => e.status === 'missing').length;
  const attachedEvidence = evidenceLog.filter((e) => e.status === 'attached').length;
  const verifiedEvidence = evidenceLog.filter((e) => e.status === 'verified').length;
  const rejectedEvidence = evidenceLog.filter((e) => e.status === 'rejected').length;

  const internalDeviceEvidenceStatus: ManualLaunchEvidenceSummary['internalDeviceEvidenceStatus'] =
    verifiedEvidence > 0 ? 'WARN' : 'BLOCKED';
  const publicLaunchEvidenceStatus: ManualLaunchEvidenceSummary['publicLaunchEvidenceStatus'] =
    verifiedEvidence > 0 ? 'WARN' : 'BLOCKED';

  const fakePassGuardActive = evidenceLog
    .filter((e) => e.fakePassGuard)
    .every((e) => e.status !== 'verified' || e.verifiedBy !== undefined);

  return {
    totalEvidenceRequired: evidenceLog.length,
    missingEvidence,
    attachedEvidence,
    verifiedEvidence,
    rejectedEvidence,
    internalDeviceEvidenceStatus:
      missingEvidence === evidenceLog.length ? 'BLOCKED' : internalDeviceEvidenceStatus,
    publicLaunchEvidenceStatus:
      verifiedEvidence === 0 ? 'BLOCKED' : publicLaunchEvidenceStatus,
    highestPriorityMissingEvidence: [...EVIDENCE_PRIORITY_MISSING],
    fakePassGuardActive: verifiedEvidence === 0 && fakePassGuardActive,
  };
}

export function runManualLaunchEvidenceAudit(): ManualLaunchEvidenceAuditResult {
  const easJson = existsSync(join(REPO_ROOT, 'eas.json'));
  const appJson = readRepo('app.json');
  const evidenceLog = buildManualLaunchEvidenceLog();
  const easBuildChecklist = buildEasInternalBuildChecklistTemplate({
    easJson,
    appJson: appJson.length > 0,
    sentryPlugin: appJson.includes('@sentry/react-native'),
  });
  const deviceTestEvidence = buildDeviceTestEvidence(evidenceLog);
  const summary = buildEvidenceSummary(evidenceLog);

  return {
    evidenceLog,
    easBuildChecklist,
    deviceTestEvidence,
    summary,
    blockerCloseRulesEnforced: true,
  };
}

export function evidenceTypeSatisfiesPassRule(
  blockerId: string,
  evidenceType: string,
  status: ManualLaunchEvidenceStatusExtended,
): boolean {
  if (status !== 'verified') return false;
  const rules = BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS[blockerId];
  if (!rules) return false;
  return rules.requiredVerifiedTypes.includes(evidenceType);
}
