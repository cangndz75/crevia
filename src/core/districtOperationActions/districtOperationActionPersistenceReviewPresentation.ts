import type { CreviaDistrictOperationActionPersistenceReviewResult } from './districtOperationActionPersistenceReviewTypes';

export function buildDistrictOperationActionPersistenceOptionsTable(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): string {
  const rows = result.persistenceOptions.map((o) => {
    return `| ${o.id} | ${o.title} | ${o.recommendedFor} | ${o.migrationRisk.requiresSaveVersionBump} | ${o.migrationRisk.migrationComplexity} | ${o.migrationRisk.balanceRisk} |`;
  });
  return [
    '| Option | Title | Target | SAVE bump | Migration | Balance risk |',
    '|--------|-------|--------|-----------|-----------|--------------|',
    ...rows,
  ].join('\n');
}

export function buildDistrictOperationActionPersistenceAreaTable(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): string {
  const rows = result.areaResults.map((a) => `| ${a.area} | ${a.health} | ${a.message} |`);
  return [
    '| Area | Health | Message |',
    '|------|--------|---------|',
    ...rows,
  ].join('\n');
}

export function buildDistrictOperationActionTelemetryQuestionsList(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): string {
  return result.telemetryQuestions
    .map((q, i) => `${i + 1}. **${q.question}** — ${q.decisionSignal}`)
    .join('\n');
}

export function buildDistrictOperationActionPersistenceConsoleSummary(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): string {
  const lines = [
    '=== Crevia District Operation Action Persistence Review ===',
    `Health: ${result.health}`,
    `Session-only: ${result.sessionOnly}`,
    `Persist added: ${result.persistAdded}`,
    `Runtime gameplay changed: ${result.runtimeGameplayChanged}`,
    `Freeze compliant: ${result.freezeCompliant}`,
    '',
    '--- Current behavior ---',
    result.currentBehaviorSummary,
    '',
    '--- Save impact ---',
    `SAVE_VERSION: ${result.saveImpact.currentSaveVersion} (expected ${result.saveImpact.expectedSaveVersion})`,
    `Persist shape changed: ${result.saveImpact.persistShapeChanged}`,
    `District action in persist: ${result.saveImpact.districtActionInPersistShape}`,
    '',
    '--- Persistence options ---',
  ];

  for (const o of result.persistenceOptions) {
    lines.push(`  [${o.recommendedFor}] ${o.title}`);
    lines.push(`    ${o.description}`);
  }

  lines.push('');
  lines.push('--- V1.1 recommendation ---');
  lines.push(result.v11Recommendation);
  lines.push('');

  if (result.risks.length > 0) {
    lines.push('--- Risks ---');
    for (const r of result.risks) {
      lines.push(`  [${r.severity.toUpperCase()}] ${r.title}`);
    }
    lines.push('');
  }

  lines.push('--- Telemetry questions ---');
  for (const q of result.telemetryQuestions) {
    lines.push(`  ? ${q.question}`);
  }

  lines.push('');
  lines.push('--- Soft launch findings ---');
  const sf = result.softLaunchFindings;
  lines.push(`  persistenceReviewPresent: ${sf.persistenceReviewPresent}`);
  lines.push(`  sessionOnlyCurrent: ${sf.sessionOnlyCurrent}`);
  lines.push(`  persistNotRequiredForSoftLaunch: ${sf.persistNotRequiredForSoftLaunch}`);
  lines.push(`  v11PersistenceBacklogDefined: ${sf.v11PersistenceBacklogDefined}`);
  lines.push(`  saveVersionUnchanged: ${sf.saveVersionUnchanged}`);

  return lines.join('\n');
}

export function buildDistrictOperationActionPersistenceReviewMarkdown(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): string {
  return [
    '# Crevia District Operation Action Persistence Review',
    '',
    '## Amaç',
    '',
    'District Operation Actions sisteminin kalıcı hale getirilmesi gerekip gerekmediğini review-only değerlendirir.',
    'Bu patch persist eklemez, SAVE_VERSION artırmaz ve runtime gameplay davranışını değiştirmez.',
    '',
    `**Health:** ${result.health}`,
    `**Session-only:** ${result.sessionOnly}`,
    `**Freeze compliant:** ${result.freezeCompliant}`,
    '',
    '## Mevcut durum',
    '',
    result.currentBehaviorSummary,
    '',
    '## Session-only neden seçildi',
    '',
    '- No-New-System Freeze aktif; persist shape değişikliği yasak.',
    '- Action küçük etkili ve optional; günlük max 1 kuralı session store\'da yeterli.',
    '- Real user telemetry yok; persist kararı veri sonrası alınmalı.',
    '- Migration riski soft launch öncesi gereksiz.',
    '',
    '## Soft launch risk',
    '',
    buildDistrictOperationActionPersistenceAreaTable(result),
    '',
    '## Persistence seçenekleri',
    '',
    buildDistrictOperationActionPersistenceOptionsTable(result),
    '',
    '## Migration riski',
    '',
    ...result.migrationRisks.map(
      (m) =>
        `- **${m.optionId}**: complexity=${m.migrationComplexity}, balance=${m.balanceRisk}, SAVE bump=${m.requiresSaveVersionBump} — ${m.summary}`,
    ),
    '',
    '## Telemetry karar soruları',
    '',
    buildDistrictOperationActionTelemetryQuestionsList(result),
    '',
    '## V1.1 önerisi',
    '',
    result.v11Recommendation,
    '',
    '## V1.1 backlog',
    '',
    ...result.v11Backlog.map((b) => `- [${b.priority}] ${b.title}: ${b.description}`),
    '',
    '## Yapılmayanlar',
    '',
    '- Persist ekleme',
    '- SAVE_VERSION artırma',
    '- useGameStore action behavior değiştirme',
    '- dayPipeline / operationSignals effect değiştirme',
    '- UI component ekleme',
    '- Analytics event ekleme',
    '- Runtime gameplay değiştirme',
    '',
    `**Persist eklendi:** ${result.persistAdded}`,
    `**SAVE_VERSION değişti:** ${result.saveImpact.saveVersionChanged}`,
    `**Runtime gameplay değişti:** ${result.runtimeGameplayChanged}`,
  ].join('\n');
}
