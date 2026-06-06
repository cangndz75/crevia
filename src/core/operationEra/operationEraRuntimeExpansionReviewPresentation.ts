import type { CreviaOperationEraRuntimeExpansionReviewResult } from './operationEraRuntimeExpansionReviewTypes';

export function buildOperationEraExpansionOptionsTable(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
): string {
  const rows = result.expansionOptions.map((o) => {
    return `| ${o.id} | ${o.title} | ${o.recommendedFor} | ${o.migrationRisk.requiresSaveVersionBump} | ${o.migrationRisk.migrationComplexity} | ${o.migrationRisk.balanceRisk} |`;
  });
  return [
    '| Option | Title | Target | SAVE bump | Migration | Balance risk |',
    '|--------|-------|--------|-----------|-----------|--------------|',
    ...rows,
  ].join('\n');
}

export function buildOperationEraExpansionRiskTable(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
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

export function buildOperationEraTelemetryQuestionList(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
): string {
  return result.telemetryQuestions
    .map((q, i) => `${i + 1}. **${q.question}** — ${q.decisionSignal}`)
    .join('\n');
}

export function buildOperationEraV11BacklogTable(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
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

export function buildOperationEraRuntimeExpansionConsoleSummary(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
): string {
  const lines = [
    '=== Crevia Operation Era Runtime Expansion Review ===',
    `Health: ${result.health}`,
    `Runtime-lite: ${result.runtimeLite}`,
    `isRuntimeLinked: ${result.isRuntimeLinked}`,
    `Preview kinds: ${result.previewKindCount}`,
    `Persist added: ${result.persistAdded}`,
    `Runtime activation performed: ${result.runtimeActivationPerformed}`,
    `Event generation changed: ${result.eventGenerationChanged}`,
    `Event selection changed: ${result.eventSelectionChanged}`,
    `Runtime gameplay changed: ${result.runtimeGameplayChanged}`,
    `Freeze compliant: ${result.freezeCompliant}`,
    '',
    '--- Current behavior ---',
    result.currentBehaviorSummary,
    '',
    '--- Save impact ---',
    `SAVE_VERSION: ${result.saveImpact.currentSaveVersion} (expected ${result.saveImpact.expectedSaveVersion})`,
    `Persist shape changed: ${result.saveImpact.persistShapeChanged}`,
    `Operation era in persist: ${result.saveImpact.operationEraInPersistShape}`,
    `Documented future fields: ${result.saveImpact.documentedFutureFields.join(', ')}`,
    '',
    '--- Expansion options ---',
  ];

  for (const o of result.expansionOptions) {
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
  lines.push(`  expansionReviewPresent: ${sf.expansionReviewPresent}`);
  lines.push(`  runtimeLiteCurrent: ${sf.runtimeLiteCurrent}`);
  lines.push(`  expansionNotRequiredForSoftLaunch: ${sf.expansionNotRequiredForSoftLaunch}`);
  lines.push(`  v11ExpansionBacklogDefined: ${sf.v11ExpansionBacklogDefined}`);
  lines.push(`  saveVersionUnchanged: ${sf.saveVersionUnchanged}`);
  lines.push(`  runtimeActivationNotDone: ${sf.runtimeActivationNotDone}`);

  return lines.join('\n');
}

export function buildOperationEraRuntimeExpansionReviewMarkdown(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
): string {
  const areaRows = result.areaResults.map((a) => `| ${a.area} | ${a.health} | ${a.message} |`);

  return [
    '# Crevia Operation Era Runtime Expansion Review',
    '',
    '## Amaç',
    '',
    'Operation Era Runtime-lite Preview sisteminin gerçek runtime expansion\'a taşınıp taşınmaması gerektiğini review-only değerlendirir. Bu belge persist eklemez, SAVE_VERSION artırmaz, event generation\'a bağlanmaz, content pack activation yapmaz ve runtime gameplay davranışını değiştirmez.',
    '',
    '## Mevcut durum',
    '',
    `- ${result.previewKindCount} preview kind mevcut (route_efficiency_era, container_recovery_era, social_trust_era, crisis_prevention_era, district_development_era, resource_balance_era, visible_service_era, open_operation_career_era).`,
    '- Hub / Report / Profile Day 8+ operation era line bağlı.',
    '- Map için helper-only binding (`buildOperationEraMapLine`).',
    '- `isRuntimeLinked: false` — preview presentation/context layer.',
    '- Content Pack Runtime Activation Review tamamlandı; activation V1.1 backlog.',
    '- Story Chain Persistent Runtime Review tamamlandı; persistence V1.1/V2 backlog.',
    '- District Operation Actions Persistence Review tamamlandı; persist yok.',
    '- Post-launch Telemetry Readiness tamamlandı.',
    '- No-New-System Freeze aktif.',
    `- SAVE_VERSION ${result.saveImpact.currentSaveVersion}.`,
    '',
    '## Runtime-lite preview modeli',
    '',
    result.currentBehaviorSummary,
    '',
    '### Gün bazlı visibility',
    '',
    '| Gün | Visibility | Not |',
    '|-----|------------|-----|',
    '| Day 1-7 | hidden | `OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY = 7` |',
    '| Day 8+ limited | compact | Post-pilot limited mode |',
    '| Day 8+ full | standard / detailed | Post-pilot full mode |',
    '',
    '## Soft launch için neden yeterli',
    '',
    '1. Operation era yalnızca **açık uçlu operasyon hissi** sağlar; gameplay kararını bloklamaz.',
    '2. No-New-System Freeze aktif; persist shape ve event selection değişikliği yasak.',
    '3. Real post-launch telemetry yok; expansion kararı veri sonrası alınmalı.',
    '4. Content pack runtime activation henüz yapılmadı; era depth metadata ile sınırlı.',
    '5. Restart continuity kaybı küçük etkili; preview yeniden derived edilebilir.',
    '',
    '## Expansion seçenekleri',
    '',
    buildOperationEraExpansionOptionsTable(result),
    '',
    '## Save/migration riski',
    '',
    '### Olası future persist alanları (dokümantasyon only — uygulanmadı)',
    '',
    ...result.saveImpact.documentedFutureFields.map((f) => `- \`${f}\``),
    '',
    '**Kural:** Bu patch\'te hiçbiri `gamePersist`\'e eklenmedi. SAVE_VERSION değişmedi. `useGameStore` shape değişmedi.',
    '',
    result.saveImpact.summary,
    '',
    '## Content pack / story chain / event selection dependency',
    '',
    '- **Content pack:** `relatedContentPacks` metadata mevcut; runtime activation V1.1 backlog. Option C öncesi activation gerekir.',
    '- **Story chain:** `buildOperationEraStoryChainBias` helper-only; persistence V1.1/V2 backlog.',
    '- **Event selection:** `buildOperationEraSelectionContextHint` hint-only; event generation değişmedi.',
    '- **Variant bias:** `buildOperationEraVariantBias` helper-only; variant resolver değişmedi.',
    '- **District operation actions:** session-only; era optional action state okur.',
    '',
    '## Telemetry karar soruları',
    '',
    buildOperationEraTelemetryQuestionList(result),
    '',
    '## V1.1 önerisi',
    '',
    result.v11Recommendation,
    '',
    '## V1.1 backlog',
    '',
    buildOperationEraV11BacklogTable(result),
    '',
    '## V2 full runtime notu',
    '',
    'Option D (Full operation era season/runtime engine) event generation, content packs, story chains, district memory, rewards ve season goals ile derin entegrasyon gerektirir. Yüksek risk; soft launch öncesi yasak; V2 backlog.',
    '',
    '## Risk tablosu',
    '',
    buildOperationEraExpansionRiskTable(result),
    '',
    '## Readiness alanları',
    '',
    '| Area | Health | Message |',
    '|------|--------|---------|',
    ...areaRows,
    '',
    '## Yapılmayanlar',
    '',
    '- Persist ekleme',
    '- SAVE_VERSION artırma',
    '- useGameStore / gamePersist shape değiştirme',
    '- Event generation değiştirme',
    '- Event selection behavior değiştirme',
    '- Variant resolver değiştirme',
    '- applyDecision / dayPipeline değiştirme',
    '- Operation era runtime behavior değiştirme',
    '- UI component ekleme',
    '- Analytics event ekleme',
    '- Content pack activation',
    '',
    '## No-New-System Freeze uyumu',
    '',
    `- Freeze compliant: ${result.freezeCompliant}`,
    '- Persist eklenmedi.',
    '- SAVE_VERSION değişmedi.',
    '- Runtime activation yapılmadı.',
    '- Event generation / selection değişmedi.',
    '- Review-only yapıldı.',
    '- V1.1/V2 backlog üretildi.',
  ].join('\n');
}
