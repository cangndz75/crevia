/**
 * Real Player Flow Audit & Playtest Checklist — Aşama 1 verify.
 * Çalıştır: npm run verify:player-flow-audit
 */

import { buildPlayerFlowAuditScenario, runPlayerFlowAudit } from '../src/core/playtest/playerFlowAuditEngine';
import { buildPlayerFlowAuditConsoleReport } from '../src/core/playtest/playerFlowAuditPresentation';
import { verifyPlayerFlowAuditScenario } from '../src/core/playtest/verifyPlayerFlowAuditScenario';

const meta = verifyPlayerFlowAuditScenario();
const scenario = buildPlayerFlowAuditScenario();
const auditResult = runPlayerFlowAudit();

for (const line of meta.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('\n' + buildPlayerFlowAuditConsoleReport(auditResult, scenario.checks));

if (meta.warn) {
  // eslint-disable-next-line no-console
  console.warn(
    `\nPlayer flow audit verify passed with ${meta.warnCount} meta warning(s). Audit health: ${meta.auditHealth}`,
  );
}

if (!meta.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nPlayer flow audit verify failed (${meta.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPlayer flow audit verify passed.');
