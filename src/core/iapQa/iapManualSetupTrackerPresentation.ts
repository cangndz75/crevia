import { IAP_MANUAL_SETUP_TRACKER_AREA_LABELS } from './iapManualSetupTrackerConstants';
import type {
  CreviaIapManualSetupArea,
  CreviaIapManualSetupTrackerResult,
} from './iapManualSetupTrackerTypes';

export function buildIapManualSetupMarkdown(
  result: CreviaIapManualSetupTrackerResult,
): string {
  const sections: string[] = [
    '# IAP Manual Setup Tracker Report',
    '',
    `**Health:** ${result.health}`,
    `**All verified:** ${result.allVerified}`,
    `**RC keys configured:** ${result.revenueCatKeysConfigured}`,
    '',
    '## Product IDs',
    '',
    `- iOS: \`${result.iosProductId}\``,
    `- Android: \`${result.androidProductId}\``,
    `- Entitlement: \`${result.entitlementId}\``,
    `- Offering: \`${result.offeringId}\``,
    '',
    '## Setup Areas',
    '',
  ];

  const areaOrder: CreviaIapManualSetupArea[] = [
    'revenuecat_project',
    'revenuecat_entitlement',
    'revenuecat_offering',
    'app_store_connect_iap',
    'google_play_console_product',
    'eas_build_config',
    'sandbox_test_accounts',
    'manual_verification',
  ];

  for (const area of areaOrder) {
    const label = IAP_MANUAL_SETUP_TRACKER_AREA_LABELS[area];
    const areaItems = result.items.filter((i) => i.area === area);
    sections.push(`### ${label}`);
    sections.push('');
    sections.push('| Item | Status | Platform | Blocker |');
    sections.push('|------|--------|----------|---------|');
    for (const item of areaItems) {
      const icon = item.status === 'verified' ? '✓' : item.status === 'blocked' ? '✗' : '○';
      sections.push(`| ${icon} ${item.title} | ${item.status} | ${item.platform} | ${item.blockerIfMissing ? 'yes' : 'no'} |`);
    }
    sections.push('');
  }

  sections.push('## Blockers');
  sections.push('');
  if (result.blockers.length === 0) {
    sections.push('_No blockers._');
  } else {
    sections.push('| Area | Blocker | Recommendation |');
    sections.push('|------|---------|----------------|');
    for (const b of result.blockers) {
      sections.push(`| ${b.area} | ${b.title} | ${b.recommendation} |`);
    }
  }
  sections.push('');

  sections.push('## Platform Status');
  sections.push('');
  for (const ps of result.platformStatuses) {
    sections.push(
      `- **${ps.platform.toUpperCase()}:** ${ps.status} (${ps.verifiedCount}/${ps.totalItems} verified, ${ps.pendingCount} pending)`,
    );
  }
  sections.push('');

  sections.push('## Next Actions');
  sections.push('');
  for (const action of result.nextActions) {
    sections.push(`1. ${action}`);
  }

  return sections.join('\n');
}

export function buildIapManualSetupConsoleSummary(
  result: CreviaIapManualSetupTrackerResult,
): string {
  const lines = [
    '=== Crevia IAP Manual Setup Tracker ===',
    `Health: ${result.health}`,
    `Areas: ${result.areas.length}`,
    `Items: ${result.items.length}`,
    `RC keys: ${result.revenueCatKeysConfigured}`,
    `Entitlement pending: ${result.entitlementMappingPending}`,
    `Store products pending: ${result.storeProductsPending}`,
    `EAS secrets pending: ${result.easSecretsPending}`,
    `Sandbox testers pending: ${result.sandboxTestersPending}`,
    `Manual verification pending: ${result.manualVerificationPending}`,
    `All verified: ${result.allVerified}`,
    '',
    '--- Platform status ---',
    ...result.platformStatuses.map(
      (ps) =>
        `  ${ps.platform.toUpperCase()}: ${ps.status} — verified=${ps.verifiedCount} configured=${ps.configuredCount} pending=${ps.pendingCount}`,
    ),
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.slice(0, 8).map((b) => `  • ${b.title}`)
      : ['  (none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
  ];
  return lines.join('\n');
}

export function buildIapManualSetupChecklist(
  result: CreviaIapManualSetupTrackerResult,
): string[] {
  return result.items.map((item) => {
    const icon = item.status === 'verified' ? '[✓]' : item.status === 'blocked' ? '[✗]' : '[ ]';
    return `${icon} ${item.id} — ${item.title} (${item.status})`;
  });
}

export function buildIapManualSetupNextActionTable(
  result: CreviaIapManualSetupTrackerResult,
): string {
  if (result.nextActions.length === 0) {
    return '_All setup complete._\n';
  }
  const rows = result.nextActions.map((a, i) => `| ${i + 1} | ${a} |`);
  return `| # | Action |\n|---|--------|\n${rows.join('\n')}\n`;
}

export function buildIapManualSetupBlockerTable(
  result: CreviaIapManualSetupTrackerResult,
): string {
  if (result.blockers.length === 0) {
    return '_No blockers._\n';
  }
  const rows = result.blockers.map(
    (b) => `| ${b.area} | ${b.title} | ${b.message.slice(0, 80)} |`,
  );
  return `| Area | Blocker | Detail |\n|------|---------|--------|\n${rows.join('\n')}\n`;
}
