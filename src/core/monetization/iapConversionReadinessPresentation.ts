import type { CreviaIapConversionReadinessResult, CreviaIapConversionSoftLaunchFindings } from './iapConversionReadinessTypes';

export function buildIapConversionReadinessConsoleSummary(
  result: CreviaIapConversionReadinessResult,
): string {
  const lines: string[] = [];
  lines.push('=== IAP Conversion Readiness ===');
  lines.push(`Health: ${result.health}`);
  lines.push(
    `Checks: ${result.checkedCount} total — ${result.passCount} PASS, ${result.warnCount} WARN, ${result.failCount} FAIL`,
  );
  lines.push('');

  if (result.offerFrictionRisks.length > 0) {
    lines.push('Offer friction risks:');
    for (const risk of result.offerFrictionRisks) {
      lines.push(`  • ${risk}`);
    }
    lines.push('');
  }

  lines.push(`Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`);
  lines.push(`Limited mode playable: ${result.limitedModePlayable ? 'PASS' : 'FAIL'}`);
  lines.push(`Restore CTA present: ${result.restoreCtaPresent ? 'PASS' : 'FAIL'}`);
  lines.push(`Product metadata pending safe: ${result.productMetadataPendingSafe ? 'PASS' : 'FAIL'}`);
  lines.push(`Store metadata consistent: ${result.storeMetadataConsistent ? 'PASS' : 'FAIL'}`);
  lines.push(`Privacy consistent: ${result.privacyConsistent ? 'PASS' : 'FAIL'}`);
  lines.push(`Freeze compliant: ${result.freezeCompliant ? 'PASS' : 'FAIL'}`);
  lines.push('');

  for (const f of result.findings) {
    const tag = f.severity === 'pass' ? 'PASS' : f.severity === 'warn' ? 'WARN' : 'FAIL';
    lines.push(`${tag} [${f.area}] ${f.title}`);
    if (f.severity !== 'pass') {
      lines.push(`     ${f.message}`);
    }
  }

  if (result.nextSteps.length > 0) {
    lines.push('');
    lines.push('Next steps:');
    for (const step of result.nextSteps) {
      lines.push(`  → ${step}`);
    }
  }

  return lines.join('\n');
}

export function buildIapConversionSoftLaunchFindings(
  result: CreviaIapConversionReadinessResult,
): CreviaIapConversionSoftLaunchFindings {
  return {
    readinessPassPresent: result.health !== 'FAIL',
    offerCopyGuardPass: result.copyGuardPassed,
    limitedModePlayable: result.limitedModePlayable,
    restoreCtaPresent: result.restoreCtaPresent,
    productMetadataPendingSafe: result.productMetadataPendingSafe,
    paywallPressureGuardPass: !result.findings.some(
      (f) => f.area === 'paywall_pressure_wording' && f.severity === 'fail',
    ),
  };
}
