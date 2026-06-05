import type { CreviaPrivacyPolicyReadinessResult } from './privacyPolicyReadinessTypes';
import {
  DATA_SAFETY_DRAFT_DOCS_PATH,
  PRIVACY_POLICY_DRAFT_DOCS_PATH,
} from './privacyPolicyReadinessConstants';

export function buildPrivacyPolicyReadinessConsoleSummary(
  result: CreviaPrivacyPolicyReadinessResult,
): string {
  const lines = [
    '=== Crevia Privacy Policy & Data Safety Readiness ===',
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Policy sections: ${result.sections.length}`,
    `Data categories: ${result.dataCategories.length}`,
    `Third-party processors: ${result.thirdPartyProcessors.length}`,
    `Privacy draft present: ${result.privacyDraftDocsPresent}`,
    `Data safety draft present: ${result.dataSafetyDraftDocsPresent}`,
    `Published URL placeholder: ${result.publishedPrivacyUrlIsPlaceholder}`,
    `Risky wording scan: ${result.riskyWordingScanPassed ? 'PASS' : 'FAIL'}`,
    `Legal review pending: ${result.legalReviewPending}`,
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `  • ${b.title}`)
      : ['  (none for current mode)']),
    '',
    '--- Warnings ---',
    ...(result.warnings.length > 0
      ? result.warnings.slice(0, 8).map((w) => `  • ${w.title}`)
      : ['  (none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
    '',
    `Docs: ${PRIVACY_POLICY_DRAFT_DOCS_PATH} | ${DATA_SAFETY_DRAFT_DOCS_PATH}`,
    'NOTE: Draft only — not legal advice.',
  ];
  return lines.join('\n');
}

export function buildPrivacyPolicyReadinessMarkdown(
  result: CreviaPrivacyPolicyReadinessResult,
): string {
  return [
    '# Privacy Policy Readiness Report',
    '',
    `**Health:** ${result.health} | **Mode:** ${result.mode}`,
    '',
    '## Data categories (sample)',
    '',
    '| Category | Collected | Tracking |',
    '|----------|-----------|----------|',
    ...result.dataCategories.slice(0, 8).map(
      (c) => `| ${c.label} | ${c.collected} | ${c.usedForTracking} |`,
    ),
    '',
    '## App Store privacy draft (sample)',
    '',
    ...result.appStoreAnswers.slice(0, 4).map(
      (a) => `- **${a.dataCategory}:** collected=${a.collected}, manual=${a.needsManualConfirmation}`,
    ),
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `- ${b.title}: ${b.message}`)
      : ['_None for current mode._']),
  ].join('\n');
}
