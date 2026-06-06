import type {
  CreviaContentPackActivationSoftLaunchFindings,
  CreviaContentPackRuntimeActivationReviewResult,
} from './contentPackRuntimeActivationReviewTypes';

export function buildContentPackActivationSoftLaunchFindings(
  result: CreviaContentPackRuntimeActivationReviewResult,
): CreviaContentPackActivationSoftLaunchFindings {
  return { ...result.softLaunchFindings };
}

export function buildContentPackActivationPackTable(
  result: CreviaContentPackRuntimeActivationReviewResult,
): string {
  const rows = result.packSummaries.map((p) => {
    return `| ${p.packId} | ${p.familyCount} | ${p.variantCount} | ${p.auditScore} | ${p.warnCount} | ${p.failCount} | ${p.runtimeLinked} | ${p.activationRecommendation} |`;
  });
  return [
    '| Pack | Families | Variants | Score | WARN | FAIL | Runtime linked | Recommendation |',
    '|------|----------|----------|-------|------|------|----------------|----------------|',
    ...rows,
  ].join('\n');
}

export function buildContentPackActivationAreaTable(
  result: CreviaContentPackRuntimeActivationReviewResult,
): string {
  const rows = result.areaResults.map((a) => {
    return `| ${a.area} | ${a.health} | ${a.message} |`;
  });
  return [
    '| Area | Health | Message |',
    '|------|--------|---------|',
    ...rows,
  ].join('\n');
}

export function buildContentPackActivationV11BacklogList(
  result: CreviaContentPackRuntimeActivationReviewResult,
): string {
  return result.v11Backlog
    .map((b, i) => `${i + 1}. **${b.title}** [${b.priority}] — ${b.description}`)
    .join('\n');
}

export function buildContentPackActivationConsoleSummary(
  result: CreviaContentPackRuntimeActivationReviewResult,
): string {
  const lines = [
    '=== Crevia Content Pack Runtime Activation Review ===',
    `Health: ${result.health}`,
    `Decision: ${result.decision}`,
    `Freeze active: ${result.freezeActive}`,
    `Runtime activation performed: ${result.runtimeActivationPerformed}`,
    `Event generation changed: ${result.eventGenerationChanged}`,
    '',
    '--- Coverage ---',
    `Total families: ${result.totalFamilyCount}`,
    `Total variants: ${result.totalVariantCount}`,
    `Packs: ${result.packSummaries.length}`,
    '',
    '--- Pack summaries ---',
  ];

  for (const p of result.packSummaries) {
    lines.push(
      `  ${p.packId}: families=${p.familyCount} variants=${p.variantCount} score=${p.auditScore} WARN=${p.warnCount} FAIL=${p.failCount} linked=${p.runtimeLinked}`,
    );
  }

  lines.push('');

  if (result.blockers.length > 0) {
    lines.push('--- Blockers ---');
    for (const b of result.blockers) {
      lines.push(`  [BLOCKER] ${b.title}`);
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('--- Warnings ---');
    for (const w of result.warnings.slice(0, 8)) {
      lines.push(`  [WARN] ${w.title}`);
    }
    lines.push('');
  }

  lines.push('--- V1.1 Backlog ---');
  for (const b of result.v11Backlog) {
    lines.push(`  [${b.priority}] ${b.title}`);
  }

  return lines.join('\n');
}

export function buildContentPackActivationReviewMarkdown(
  result: CreviaContentPackRuntimeActivationReviewResult,
): string {
  return [
    '# Crevia Content Pack Runtime Activation Review',
    '',
    '## Amaç',
    '',
    'Mevcut content pack havuzunun runtime activation için hazırlık durumunu değerlendirir.',
    'Bu review hiçbir content pack\'i runtime event generation\'a bağlamaz.',
    'No-New-System Freeze aktifken activation yapılmaz; karar V1.1 backlog\'a taşınır.',
    '',
    `**Health:** ${result.health}`,
    `**Decision:** ${result.decision}`,
    `**Freeze active:** ${result.freezeActive}`,
    `**Docs:** ${result.docsPath}`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total families | ${result.totalFamilyCount} |`,
    `| Total variants | ${result.totalVariantCount} |`,
    `| Pack count | ${result.packSummaries.length} |`,
    `| Blockers | ${result.blockers.length} |`,
    `| Warnings | ${result.warnings.length} |`,
    `| V1.1 backlog items | ${result.v11Backlog.length} |`,
    `| Runtime activation | ${result.runtimeActivationPerformed} |`,
    `| Event generation changed | ${result.eventGenerationChanged} |`,
    '',
    '## Pack readiness',
    '',
    buildContentPackActivationPackTable(result),
    '',
    '## Area results',
    '',
    buildContentPackActivationAreaTable(result),
    '',
    '## V1.1 backlog',
    '',
    buildContentPackActivationV11BacklogList(result),
    '',
    '## Risks',
    '',
    result.risks.length > 0
      ? result.risks.map((r) => `- **[${r.severity}]** ${r.title}: ${r.message}`).join('\n')
      : '_No critical risks outside freeze._',
    '',
    '## Soft launch findings',
    '',
    `- Activation review present: ${result.softLaunchFindings.activationReviewPresent}`,
    `- Runtime activation blocked by freeze: ${result.softLaunchFindings.runtimeActivationBlockedByFreeze}`,
    `- Pack coverage sufficient: ${result.softLaunchFindings.packCoverageSufficient}`,
    `- V1.1 backlog defined: ${result.softLaunchFindings.v11BacklogDefined}`,
    `- Activation not required for soft launch: ${result.softLaunchFindings.activationNotRequiredForSoftLaunch}`,
    '',
  ].join('\n');
}
