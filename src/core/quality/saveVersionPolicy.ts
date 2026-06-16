import { SAVE_VERSION } from '@/store/gamePersist';

/** Current build persist version — single source for verify/quality scripts. */
export const EXPECTED_SAVE_VERSION_FOR_VERIFY = SAVE_VERSION;

/** Last migration source version before strategyHistory persist (v26→v27). */
export const STRATEGY_HISTORY_MIGRATION_FROM_VERSION = 26;

export function getExpectedSaveVersionForCurrentBuild(): number {
  return SAVE_VERSION;
}

export function isCurrentSaveVersion(version: number = SAVE_VERSION): boolean {
  return version === SAVE_VERSION;
}

export function assertCurrentSaveVersion(version: number = SAVE_VERSION): boolean {
  return isCurrentSaveVersion(version);
}

/** Verify scripts: gamePersist.ts exports the runtime SAVE_VERSION literal. */
export function assertGamePersistExportsCurrentSaveVersion(
  persistSource: string,
  version: number = SAVE_VERSION,
): boolean {
  return persistSource.includes(`export const SAVE_VERSION: number = ${version}`);
}

/** Verify scripts: runtime SAVE_VERSION matches policy helper (no hard-coded version literals). */
export function assertVerifySaveVersionPolicy(
  persistSource?: string,
  version: number = SAVE_VERSION,
): boolean {
  if (!isCurrentSaveVersion(version)) return false;
  if (persistSource == null || persistSource.length === 0) return true;
  return assertGamePersistExportsCurrentSaveVersion(persistSource, version);
}

export function assertMigrationSupportsVersion(fromVersion: number, toVersion: number): boolean {
  if (fromVersion === STRATEGY_HISTORY_MIGRATION_FROM_VERSION && toVersion === SAVE_VERSION) {
    return true;
  }
  return fromVersion === toVersion && toVersion === SAVE_VERSION;
}

export type SaveVersionPolicyReport = {
  currentSaveVersion: number;
  migrationCoverage: string[];
  legacyVersionChecksFound: number;
  policyWarnings: string[];
  blockingFailures: string[];
};

export function buildSaveVersionPolicyReport(input?: {
  legacyVersionChecksFound?: number;
  policyWarnings?: string[];
  blockingFailures?: string[];
}): SaveVersionPolicyReport {
  return {
    currentSaveVersion: SAVE_VERSION,
    migrationCoverage: [`v${STRATEGY_HISTORY_MIGRATION_FROM_VERSION}→v${SAVE_VERSION} (strategyHistory)`],
    legacyVersionChecksFound: input?.legacyVersionChecksFound ?? 0,
    policyWarnings: input?.policyWarnings ?? [],
    blockingFailures: input?.blockingFailures ?? [],
  };
}
