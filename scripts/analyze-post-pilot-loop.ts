/**
 * Post-pilot hafif operasyon döngüsü denge analizi.
 * Çalıştır: npm run analyze:post-pilot
 */

import { runPostPilotLoopAudit } from '../src/core/postPilot/postPilotLoopAudit';

const audit3 = runPostPilotLoopAudit({ simulatedDays: 3 });
const audit5 = runPostPilotLoopAudit({ simulatedDays: 5 });

function printAudit(label: string, audit: ReturnType<typeof runPostPilotLoopAudit>) {
  // eslint-disable-next-line no-console
  console.log(`\n=== ${label} ===`);
  // eslint-disable-next-line no-console
  console.log(`health: ${audit.health}`);
  // eslint-disable-next-line no-console
  console.log(`dailyEventCounts: ${audit.dailyEventCounts.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(
    `duplicate=${audit.duplicateEventCount} maxExceeded=${audit.maxActiveEventsExceeded} forbidden=${audit.forbiddenWordCount} reportCrash=${audit.reportCrashCount}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `authority+${audit.authorityTrustGainTotal} badges=${audit.earnedBadgeCount}`,
  );
  if (audit.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log('warnings:', audit.warnings);
  }
}

printAudit('3 gün', audit3);
printAudit('5 gün', audit5);

if (audit3.health === 'FAIL') {
  process.exit(1);
}
