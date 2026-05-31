import type {
  IapSandboxQaArea,
  IapSandboxQaAuditResult,
  IapSandboxQaFinding,
} from './iapSandboxQaTypes';

export function groupIapSandboxQaFindingsByArea(
  result: IapSandboxQaAuditResult,
): Record<IapSandboxQaArea, IapSandboxQaFinding[]> {
  const grouped = {} as Record<IapSandboxQaArea, IapSandboxQaFinding[]>;
  for (const finding of result.findings) {
    if (!grouped[finding.area]) {
      grouped[finding.area] = [];
    }
    grouped[finding.area].push(finding);
  }
  return grouped;
}

export function buildIapSandboxQaNextSteps(result: IapSandboxQaAuditResult): string[] {
  const steps: string[] = [];

  if (result.health === 'BLOCKED') {
    steps.push('Remove secret RevenueCat keys from client env immediately.');
    steps.push('Rotate compromised keys in RevenueCat dashboard.');
    return steps;
  }

  if (result.blockerCount > 0 || result.failCount > 0) {
    steps.push('Fix FAIL/BLOCKER findings before sandbox testing.');
  }

  const missingKeys = result.findings.some(
    (f) => f.id === 'env.ios_public_key' || f.id === 'env.android_public_key',
  ) && result.findings.some((f) => f.severity === 'warn' && f.id.includes('public_key'));
  if (missingKeys || result.runtimeMode !== 'revenuecat') {
    steps.push(
      'Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY (public appl_/goog_ only).',
    );
  }

  steps.push('Create store products: crevia.main_operation.season1 (iOS) and crevia_main_operation_season_1 (Android).');
  steps.push('Configure RevenueCat entitlement main_operation_full_access + default offering package.');
  steps.push('Run EAS development build — do not test real IAP in Expo Go.');
  steps.push('iOS: enable In-App Purchase capability after prebuild.');
  steps.push('Android: verify com.android.vending.BILLING in manifest after prebuild.');
  steps.push('Complete sandbox purchase + restore smoke tests on device (docs/crevia-iap-sandbox-qa.md).');
  steps.push('Run npm run verify:iap-sandbox-qa && verify:iap-integration && verify:soft-launch-readiness.');

  if (result.health === 'PASS') {
    steps.unshift('All automatic checks passed — complete remaining manual checklist items.');
  }

  return [...new Set(steps)];
}

export function buildIapSandboxQaConsoleReport(result: IapSandboxQaAuditResult): string {
  const lines: string[] = [];
  lines.push('=== Crevia IAP Sandbox QA Audit ===');
  lines.push(`Health: ${result.health}`);
  lines.push(
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount} | Blocker: ${result.blockerCount}`,
  );
  lines.push(`Runtime mode: ${result.runtimeMode}`);
  lines.push(`Checklist items: ${result.checklist.length}`);
  lines.push('');

  const manualPending = result.findings.filter((f) => f.manual && f.severity === 'warn');
  if (manualPending.length > 0) {
    lines.push('--- Manual pending (sample) ---');
    for (const f of manualPending.slice(0, 12)) {
      lines.push(`  [WARN] ${f.title} — ${f.recommendation}`);
    }
    if (manualPending.length > 12) {
      lines.push(`  ... +${manualPending.length - 12} more manual items`);
    }
    lines.push('');
  }

  const blockers = result.findings.filter((f) => f.severity === 'blocker' || f.severity === 'fail');
  if (blockers.length > 0) {
    lines.push('--- FAIL / BLOCKER ---');
    for (const f of blockers) {
      lines.push(`  [${f.severity.toUpperCase()}] ${f.title}: ${f.message}`);
    }
    lines.push('');
  }

  lines.push('--- Sandbox smoke test order ---');
  lines.push('  1. Configure env public keys + EAS dev build');
  lines.push('  2. RevenueCat offering + store products');
  lines.push('  3. Pilot Day 7 → PostPilot offer → purchase');
  lines.push('  4. Verify full access + analytics events');
  lines.push('  5. Reinstall → Restore CTA');
  lines.push('  6. Dev mock + limited flow regression');
  lines.push('');

  lines.push('--- Next steps ---');
  for (const step of result.nextSteps) {
    lines.push(`  • ${step}`);
  }

  return lines.join('\n');
}

export function buildIapSandboxQaMarkdownChecklist(
  result: IapSandboxQaAuditResult,
): string {
  const lines: string[] = [];
  lines.push('# IAP Sandbox QA — Generated Checklist Snapshot');
  lines.push('');
  lines.push(`Health: **${result.health}** | Runtime: \`${result.runtimeMode}\``);
  lines.push('');

  const grouped = groupIapSandboxQaFindingsByArea(result);
  for (const [area, findings] of Object.entries(grouped)) {
    if (!findings?.length) continue;
    lines.push(`## ${area}`);
    lines.push('');
    for (const item of result.checklist.filter((c) => c.area === area)) {
      const related = findings.find((f) => f.id === item.id || f.id.startsWith(item.id));
      const status = related?.severity ?? 'pending';
      const box = status === 'pass' ? 'x' : ' ';
      lines.push(`- [${box}] **${item.title}** (${item.checkType})`);
      if (item.requiredForSandbox) {
        lines.push(`  - Sandbox: required`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
