import type { CreviaStoryChainPersistentRuntimeReviewResult } from './storyChainPersistentRuntimeReviewTypes';

export function buildStoryChainPersistenceOptionsTable(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
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

export function buildStoryChainPersistenceRiskTable(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): string {
  const rows = result.risks.map((r) => {
    return `| ${r.id} | ${r.severity} | ${r.title} | ${r.message.slice(0, 80)} |`;
  });
  return [
    '| ID | Severity | Title | Message |',
    '|----|----------|-------|---------|',
    ...rows,
  ].join('\n');
}

export function buildStoryChainTelemetryQuestionList(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): string {
  return result.telemetryQuestions
    .map((q, i) => `${i + 1}. **${q.question}** — ${q.decisionSignal}`)
    .join('\n');
}

export function buildStoryChainV11BacklogTable(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): string {
  const rows = result.v11Backlog.map((b) => {
    return `| ${b.id} | ${b.priority} | ${b.title} | ${b.description.slice(0, 80)} |`;
  });
  return [
    '| ID | Priority | Title | Description |',
    '|----|----------|-------|-------------|',
    ...rows,
  ].join('\n');
}

export function buildStoryChainPersistentRuntimeConsoleSummary(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): string {
  const lines = [
    '=== Crevia Story Chain Persistent Runtime Review ===',
    `Health: ${result.health}`,
    `Presentation-only: ${result.presentationOnly}`,
    `isRuntimeLinked: ${result.isRuntimeLinked}`,
    `Persist added: ${result.persistAdded}`,
    `Runtime activation performed: ${result.runtimeActivationPerformed}`,
    `Event generation changed: ${result.eventGenerationChanged}`,
    `Runtime gameplay changed: ${result.runtimeGameplayChanged}`,
    `Freeze compliant: ${result.freezeCompliant}`,
    '',
    '--- Current behavior ---',
    result.currentBehaviorSummary,
    '',
    '--- Save impact ---',
    `SAVE_VERSION: ${result.saveImpact.currentSaveVersion} (expected ${result.saveImpact.expectedSaveVersion})`,
    `Persist shape changed: ${result.saveImpact.persistShapeChanged}`,
    `Story chain in persist: ${result.saveImpact.storyChainInPersistShape}`,
    `Documented future fields: ${result.saveImpact.documentedFutureFields.join(', ')}`,
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
  lines.push(`  presentationOnlyCurrent: ${sf.presentationOnlyCurrent}`);
  lines.push(`  persistNotRequiredForSoftLaunch: ${sf.persistNotRequiredForSoftLaunch}`);
  lines.push(`  v11PersistenceBacklogDefined: ${sf.v11PersistenceBacklogDefined}`);
  lines.push(`  saveVersionUnchanged: ${sf.saveVersionUnchanged}`);
  lines.push(`  runtimeActivationNotDone: ${sf.runtimeActivationNotDone}`);

  return lines.join('\n');
}

export function buildStoryChainPersistentRuntimeReviewMarkdown(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): string {
  const areaRows = result.areaResults.map((a) => `| ${a.area} | ${a.health} | ${a.message} |`);

  return [
    '# Crevia Story Chain Persistent Runtime Review',
    '',
    '## Amaç',
    '',
    'Mini Story Chain sisteminin kalıcı runtime\'a taşınıp taşınmaması gerektiğini review-only değerlendirir.',
    'Bu patch persist eklemez, SAVE_VERSION artırmaz, event generation\'a bağlanmaz ve runtime gameplay davranışını değiştirmez.',
    '',
    `**Health:** ${result.health}`,
    `**Presentation-only:** ${result.presentationOnly}`,
    `**isRuntimeLinked:** ${result.isRuntimeLinked}`,
    `**Freeze compliant:** ${result.freezeCompliant}`,
    '',
    '## Mevcut durum',
    '',
    result.currentBehaviorSummary,
    '',
    '## Presentation-only hint modeli',
    '',
    '- Story chain hint\'leri `buildStoryChainRuntimeHintModel` ile derived üretilir.',
    '- Trust/memory/carry-over/operation signals snapshot\'larından okunur.',
    '- Hub/Map/Result/Report yüzeylerinde max 1 satır; Advisor helper-only.',
    '- Duplicate suppression carry-over, memory ve mevcut echo satırlarına karşı aktif.',
    '- Day 1: hidden | Day 2-3: subtle (sinyal varsa) | Day 4-7: compact | Day 8+: detailed.',
    '',
    '## Soft launch için neden yeterli',
    '',
    '- Chain sistemi yalnızca "hissedilen bağlam" sağlar; gameplay kararını bloklamaz.',
    '- No-New-System Freeze aktif; persist shape değişikliği yasak.',
    '- Real post-launch telemetry yok; persist kararı veri sonrası alınmalı.',
    '- Content pack runtime activation henüz yapılmadı; full continuation sınırlı.',
    '- Restart continuity kaybı küçük etkili; hint\'ler yeniden derived edilebilir.',
    '',
    '## Review alanları',
    '',
    '| Area | Health | Message |',
    '|------|--------|---------|',
    ...areaRows,
    '',
    '## Persistence seçenekleri',
    '',
    buildStoryChainPersistenceOptionsTable(result),
    '',
    '## Save/migration riski',
    '',
    buildStoryChainPersistenceRiskTable(result),
    '',
    '### Olası future persist alanları (dokümantasyon only — uygulanmadı)',
    '',
    ...result.saveImpact.documentedFutureFields.map((f) => `- \`${f}\``),
    '',
    '## Telemetry karar soruları',
    '',
    buildStoryChainTelemetryQuestionList(result),
    '',
    '## V1.1 önerisi',
    '',
    result.v11Recommendation,
    '',
    '## V1.1 backlog',
    '',
    buildStoryChainV11BacklogTable(result),
    '',
    '## V2 full runtime notu',
    '',
    'Option D (Full story chain runtime engine) event selection, content pack activation, freshness guard ve district memory ile derin entegrasyon gerektirir. Soft launch öncesi yasak. Content Pack Runtime Activation kararından önce yapılmamalı. V2 backlog.',
    '',
    '## Yapılmayanlar',
    '',
    '- Persist ekleme',
    '- SAVE_VERSION artırma',
    '- useGameStore / gamePersist shape değiştirme',
    '- Event generation değiştirme',
    '- applyDecision / dayPipeline değiştirme',
    '- Story chain resolver runtime behavior değiştirme',
    '- UI component ekleme',
    '- Analytics event ekleme',
    '- Runtime activation',
    '',
    `**Persist eklendi:** ${result.persistAdded}`,
    `**SAVE_VERSION değişti:** ${result.saveImpact.saveVersionChanged}`,
    `**Runtime gameplay değişti:** ${result.runtimeGameplayChanged}`,
    `**Runtime activation yapıldı:** ${result.runtimeActivationPerformed}`,
  ].join('\n');
}
