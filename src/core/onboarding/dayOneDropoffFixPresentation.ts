import type { DayOneDropoffFixAuditResult } from './dayOneDropoffFixTypes';
import { DAY_ONE_DROPOFF_AUDIT_AREAS } from './dayOneDropoffFixConstants';

export function buildDayOneDropoffFixConsoleSummary(
  result: DayOneDropoffFixAuditResult,
): string {
  const lines = [
    '=== Crevia Day 1 Drop-off Pre-Launch Fix Pass ===',
    `Health: ${result.health}`,
    `Audit areas: ${DAY_ONE_DROPOFF_AUDIT_AREAS.length}`,
    `Findings: ${result.findings.length} (${result.findings.filter((f) => f.severity === 'pass').length} pass, ${result.findings.filter((f) => f.severity === 'warn').length} warn, ${result.findings.filter((f) => f.severity === 'blocker').length} blocker)`,
    '',
    '--- Density ---',
    `Hub max featured: ${result.density.hubMaxFeaturedCards}`,
    `Hub suppressed: ${result.density.hubSuppressedSurfaces.join(', ') || 'none'}`,
    `Result echo lines: ${result.density.resultMaxEchoLines}`,
    `Report system lines: ${result.density.reportMaxSystemLines}`,
    '',
    '--- Copy guard ---',
    `Passed: ${result.copyGuard.passed}`,
    `Scanned: ${result.copyGuard.scannedStringCount} strings`,
    '',
    '--- Fix-only scope ---',
    result.fixOnlyScope.join(', '),
  ];

  const blockers = result.findings.filter((f) => f.severity === 'blocker');
  if (blockers.length > 0) {
    lines.push('', '--- Blockers ---');
    for (const b of blockers) {
      lines.push(`  [BLOCKER] ${b.title}`);
    }
  }

  return lines.join('\n');
}

export function buildDayOneDropoffFixMarkdown(
  result: DayOneDropoffFixAuditResult,
): string {
  const areaRows = DAY_ONE_DROPOFF_AUDIT_AREAS.map((area) => {
    const finding = result.findings.find((f) => f.area === area.id);
    return `| ${area.label} | ${finding?.severity ?? 'n/a'} | ${finding?.title ?? '—'} |`;
  });

  return [
    '# Crevia Day 1 Drop-off Pre-Launch Fix Pass',
    '',
    '## Amaç',
    '',
    'Soft launch öncesi Day 1 ilk 10 dakika akışında friction, metin yoğunluğu, CTA belirsizliği ve erken sistem karmaşasını azaltmak. Gerçek post-launch drop-off verisi yok; bu pass pre-launch risk azaltımıdır.',
    '',
    `**Health:** ${result.health}`,
    `**Docs:** ${result.docsPath}`,
    '',
    '## Day 1 risk alanları',
    '',
    '| Alan | Durum | Bulgu |',
    '|------|-------|-------|',
    ...areaRows,
    '',
    '## Density özeti',
    '',
    `- Hub max featured kart: **${result.density.hubMaxFeaturedCards}**`,
    `- Bastırılan yüzeyler: ${result.density.hubSuppressedSurfaces.join(', ') || '—'}`,
    `- Result echo satırı: **${result.density.resultMaxEchoLines}**`,
    `- Report systems satırı: **${result.density.reportMaxSystemLines}**`,
    `- Gizli advanced sistemler: ${result.density.advancedSystemsHidden.length}`,
    '',
    '## Copy guard',
    '',
    `- Passed: **${result.copyGuard.passed}**`,
    `- Taranan string: ${result.copyGuard.scannedStringCount}`,
    result.copyGuard.violations.length > 0
      ? `- İhlaller: ${result.copyGuard.violations.map((v) => v.term).join(', ')}`
      : '- İhlal yok',
    '',
    '## Fix-only scope',
    '',
    result.fixOnlyScope.map((s) => `- \`${s}\``).join('\n'),
    '',
    '## Real device playtest notları',
    '',
    '- Day 1 Hub: yalnızca Ece + öğrenme timeline + plan CTA görünür olmalı',
    '- Quick prep / operasyon sinyalleri / open-ended kart Day 1 görünmemeli',
    '- İlk olay CTA: Planı Onayla → Kısa Öneri Al → Önerilen Atamayı Onayla',
    '- Rapor: learning mode, systems card max 1 satır',
    '',
    '## Post-launch telemetry karşılaştırması',
    '',
    'Soft launch sonrası `verify:post-launch-telemetry-readiness` Day 1 funnel ile karşılaştır:',
    '- First session funnel: app_open → hub → event → plan → dispatch → result → report',
    '- Day 1 completion funnel drop-off adımları bu pass bulguları ile eşleştirilmeli',
    '',
  ].join('\n');
}
