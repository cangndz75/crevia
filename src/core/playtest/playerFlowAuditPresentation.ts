import {
  PLAYER_FLOW_DOCS_PATH,
  PLAYER_FLOW_STAGE_LABELS,
} from './playerFlowAuditConstants';
import {
  detectHighRiskPlayerFlowFindings,
  getPlayerFlowStageLabel,
  getPlayerFlowSurfaceLabel,
} from './playerFlowAuditEngine';
import type {
  PlayerFlowAuditHealth,
  PlayerFlowAuditResult,
  PlayerFlowCheck,
  PlayerFlowManualChecklist,
  PlayerFlowStage,
} from './playerFlowAuditTypes';

export function getPlayerFlowAuditHealth(
  result: PlayerFlowAuditResult,
): PlayerFlowAuditHealth {
  return result.health;
}

export function groupPlayerFlowFindingsByStage(
  result: PlayerFlowAuditResult,
): Partial<Record<PlayerFlowStage, PlayerFlowCheck[]>> {
  const map: Partial<Record<PlayerFlowStage, PlayerFlowCheck[]>> = {};
  for (const finding of result.findings) {
    if (!map[finding.stage]) {
      map[finding.stage] = [];
    }
    map[finding.stage]!.push(finding);
  }
  return map;
}

export function formatPlayerFlowFinding(finding: PlayerFlowCheck): string {
  const stage = getPlayerFlowStageLabel(finding.stage);
  const surface = getPlayerFlowSurfaceLabel(finding.surface);
  const rec = finding.recommendation ? ` → ${finding.recommendation}` : '';
  const notes = finding.notes ? ` (${finding.notes})` : '';
  return `[${finding.status.toUpperCase()}] ${stage} / ${surface}: ${finding.title} — ${finding.question}${notes}${rec}`;
}

export function buildManualChecklistMarkdown(
  checklist: PlayerFlowManualChecklist,
): string {
  const lines = [
    `# ${checklist.title}`,
    '',
    checklist.description,
    '',
    `Dokümantasyon: ${PLAYER_FLOW_DOCS_PATH}`,
    '',
  ];
  let lastStage: PlayerFlowStage | null = null;
  for (const item of checklist.items) {
    if (item.stage !== lastStage) {
      lastStage = item.stage;
      lines.push(`## ${PLAYER_FLOW_STAGE_LABELS[item.stage]}`);
      lines.push('');
    }
    lines.push(`### ${item.id}`);
    lines.push(`- **Yüzey:** ${getPlayerFlowSurfaceLabel(item.surface)}`);
    lines.push(`- **Soru:** ${item.prompt}`);
    lines.push(`- **Beklenen tepki:** ${item.expectedPlayerReaction}`);
    lines.push(`- **Geçti:** ${item.passCriteria}`);
    lines.push(`- **Başarısızlık sinyali:** ${item.failSignal}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function buildPlayerFlowAuditConsoleReport(
  result: PlayerFlowAuditResult,
  allChecks?: PlayerFlowCheck[],
): string {
  const grouped = groupPlayerFlowFindingsByStage(result);
  const pool = allChecks ?? result.findings;
  const topRisk = detectHighRiskPlayerFlowFindings(pool).slice(0, 5);

  const stageSummary = Object.entries(PLAYER_FLOW_STAGE_LABELS)
    .map(([stage, label]) => {
      const items = grouped[stage as PlayerFlowStage] ?? [];
      if (items.length === 0) return null;
      const fails = items.filter((i) => i.status === 'fail').length;
      const warns = items.filter((i) => i.status === 'warn').length;
      return `  ${label}: ${items.length} bulgu (${fails} fail, ${warns} warn)`;
    })
    .filter(Boolean);

  const parts = [
    '=== Crevia Player Flow Audit ===',
    `Health: ${result.health}`,
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount}`,
    `Critical fails: ${result.criticalFailCount}`,
    '',
    'Stage summary:',
    ...(stageSummary.length > 0 ? stageSummary : ['  (no findings)']),
    '',
    'Top risk findings:',
  ];

  if (topRisk.length === 0) {
    parts.push('  (none — automated checks passed or manual-only warns)');
  } else {
    for (const f of topRisk) {
      parts.push(`  ${formatPlayerFlowFinding(f)}`);
    }
  }

  parts.push('');
  parts.push('Recommended next steps:');
  if (result.failCount > 0) {
    parts.push('  1. Fix FAIL items before release playtest.');
    parts.push('  2. Re-run npm run verify:player-flow-audit');
  } else if (result.warnCount > 0) {
    parts.push('  1. Complete manual checklist on real device.');
    parts.push('  2. Log observation form in docs/crevia-player-flow-playtest-checklist.md');
    parts.push('  3. Triage WARN items — human playtest still required.');
  } else {
    parts.push('  1. Run manual playtest checklist for subjective readability.');
    parts.push('  2. Optional: session recording when available.');
  }

  if (result.findings.length > 0 && result.findings.length <= 20) {
    parts.push('');
    parts.push('All findings:');
    for (const f of result.findings) {
      parts.push(formatPlayerFlowFinding(f));
    }
  }

  return parts.join('\n');
}
