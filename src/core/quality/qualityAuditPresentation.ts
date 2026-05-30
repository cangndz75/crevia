import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  QualityAuditHealth,
  QualityAuditResult,
  QualityAuditSummary,
  QualityWarning,
  StoreActionAuditNote,
} from './architectureAuditTypes';
import { runArchitectureDependencyAudit } from './architectureDependencyAudit';
import { runPerformanceAudit } from './performanceAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export const QUALITY_AUDIT_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
  'full mode',
] as const;

function forbiddenWordMatches(text: string, word: string): boolean {
  const lower = text.toLowerCase();
  if (word === 'xp') {
    return /\bxp\b/.test(lower);
  }
  return lower.includes(word);
}

export function assertNoQualityAuditForbiddenWords(text: string): number {
  return QUALITY_AUDIT_FORBIDDEN_WORDS.filter((word) =>
    forbiddenWordMatches(text, word),
  ).length;
}

function countBySeverity(warnings: QualityWarning[]): QualityAuditSummary {
  const highRiskCount = warnings.filter((w) => w.severity === 'high').length;
  const mediumRiskCount = warnings.filter((w) => w.severity === 'medium').length;
  const lowRiskCount = warnings.filter((w) => w.severity === 'low').length;

  const recommendedNextSteps: string[] = [];
  if (highRiskCount > 0) {
    recommendedNextSteps.push('Yüksek severity uyarılarını soft-launch öncesi gözden geçir.');
  }
  if (mediumRiskCount > 0) {
    recommendedNextSteps.push('Store selector daraltma ve core→features type taşıma planı yap.');
  }
  recommendedNextSteps.push('Verify script’lerini CI’da verify:quality-audit ile çalıştır.');
  recommendedNextSteps.push('Yeni event içeriğini event-authoring standardına göre yaz.');

  return { highRiskCount, mediumRiskCount, lowRiskCount, recommendedNextSteps };
}

function resolveHealth(
  architecture: QualityWarning[],
  performance: QualityWarning[],
  forbiddenImport: QualityWarning[],
  render: QualityWarning[],
): QualityAuditHealth {
  const all = [...architecture, ...performance, ...forbiddenImport, ...render];
  const hasHighFail = all.some(
    (w) =>
      w.severity === 'high' &&
      (w.id === 'icon_registry_ui_import' ||
        w.id === 'post_pilot_ux_ui_import' ||
        w.id === 'animation_endless_pulse' ||
        w.id === 'pulse_endless_risk'),
  );

  const forbiddenInText = collectQualityAuditStrings().reduce(
    (sum, s) => sum + assertNoQualityAuditForbiddenWords(s),
    0,
  );

  if (hasHighFail || forbiddenInText > 0) {
    return 'FAIL';
  }

  const hasMedium = all.some((w) => w.severity === 'medium' || w.severity === 'high');
  return hasMedium ? 'WARN' : 'PASS';
}

export function collectQualityAuditStrings(): string[] {
  const arch = runArchitectureDependencyAudit();
  const perf = runPerformanceAudit();
  const strings: string[] = [
    ...arch.storeActions.flatMap((s) => [s.note, s.recommendedFutureRefactor]),
    ...arch.domainBoundaries.map((d) => d.note),
    ...perf.screens.map((s) => s.recommendation),
  ];
  return strings.filter((s) => s.length > 0);
}

export function runQualityAudit(): QualityAuditResult {
  const arch = runArchitectureDependencyAudit();
  const perf = runPerformanceAudit();

  const forbiddenImportWarnings = arch.warnings.filter(
    (w) =>
      w.id === 'icon_registry_ui_import' ||
      w.id === 'post_pilot_ux_ui_import' ||
      w.id === 'core_features_production_import',
  );

  const architectureWarnings = arch.warnings.filter(
    (w) => !forbiddenImportWarnings.includes(w),
  );

  const performanceWarnings = perf.warnings;
  const renderRiskWarnings = perf.warnings.filter(
    (w) => w.area === 'store' || w.area === 'layout' || w.area === 'performance',
  );

  const allWarnings = [
    ...architectureWarnings,
    ...performanceWarnings,
    ...forbiddenImportWarnings,
    ...renderRiskWarnings,
  ];

  const uniqueWarnings = Array.from(
    new Map(allWarnings.map((w) => [w.id, w])).values(),
  );

  const summary = countBySeverity(uniqueWarnings);
  const health = resolveHealth(
    architectureWarnings,
    performanceWarnings,
    forbiddenImportWarnings,
    renderRiskWarnings,
  );

  return {
    health,
    architectureWarnings,
    performanceWarnings,
    forbiddenImportWarnings,
    renderRiskWarnings: uniqueWarnings.filter((w) =>
      ['store', 'layout', 'performance', 'animation'].includes(w.area),
    ),
    summary,
  };
}

export function qualityAuditRequiresGameplayOrPersist(): boolean {
  return false;
}

export function buildQualityAuditMarkdown(): string {
  const result = runQualityAudit();
  const arch = runArchitectureDependencyAudit();
  const perf = runPerformanceAudit();

  const storeSection = arch.storeActions
    .map(
      (s: StoreActionAuditNote) =>
        `### ${s.action}\n- Risk: **${s.risk}**\n- Domain sayısı: ${s.domainCount}\n- Not: ${s.note}\n- Öneri: ${s.recommendedFutureRefactor}\n`,
    )
    .join('\n');

  const screenSection = perf.screens
    .map(
      (s) =>
        `| ${s.screen} | ${s.componentCountEstimate} | ${s.conditionalRenderDensity} | ${s.listGridDensity} | ${s.animationUsage} | ${s.risk} |`,
    )
    .join('\n');

  const guardSection = perf.uiGuards
    .map(
      (g) =>
        `| ${g.componentId} | ${g.ok ? 'OK' : 'Eksik'} | ${g.hasNumberOfLines ? '✓' : '–'} | ${g.hasFlexShrink ? '✓' : '–'} | ${g.hasMinWidth ? '✓' : '–'} |`,
    )
    .join('\n');

  return `# Crevia Quality Audit

> Otomatik özet — \`npm run verify:quality-audit\`

## 1. Genel sağlık özeti

**Health:** ${result.health}

| Severity | Adet |
|----------|------|
| High | ${result.summary.highRiskCount} |
| Medium | ${result.summary.mediumRiskCount} |
| Low | ${result.summary.lowRiskCount} |

## 2. Architecture boundary değerlendirmesi

Production core → features import: **${arch.importScan.productionCoreToFeaturesCount}**  
Verify-only core → features import: **${arch.importScan.verifyCoreToFeaturesCount}**  
Icon registry UI import: **${arch.importScan.presentationImportsUi ? 'EVET (FAIL)' : 'hayır'}**  
Post-pilot UX UI import: **${arch.importScan.postPilotUxImportsUi ? 'EVET (FAIL)' : 'hayır'}**

## 3. Store action sorumlulukları

${storeSection}

## 4. Render/performance riskleri

| Ekran | Bileşen tahmini | Koşul yoğunluğu | Liste yoğunluğu | Animasyon | Risk |
|-------|-----------------|-----------------|-----------------|-----------|------|
${screenSection}

## 5. Animation layer değerlendirmesi

- Süreler 300ms altında: **${perf.animationDurationsOk ? 'evet' : 'hayır'}**
- selectedPulse endless: **${perf.selectedPulseEndless ? 'evet (FAIL)' : 'hayır (sınırlı repeat)'}**

## 6. Text overflow guard durumu

| Bileşen | Durum | numberOfLines | flexShrink | minWidth |
|---------|-------|---------------|------------|----------|
${guardSection}

## 7. Verify/analyze script matrisi

Kritik verify script’ler package.json’da tanımlı (verify:quality-audit çalıştırıldığında doğrulanır).

## 8. Kritik riskler

${uniqueHighWarnings(result)}

## 9. Orta vadeli refactor önerileri

${result.summary.recommendedNextSteps.map((s) => `- ${s}`).join('\n')}

## 10. Şimdi yapılmaması gerekenler

- Store rewrite veya endCurrentDay sırasını değiştirme
- Event generation / pilot event template büyük refactor
- SAVE_VERSION / persist şeması değişikliği
- Navigation veya yeni route ekleme
- UI redesign

`;

}

function uniqueHighWarnings(result: QualityAuditResult): string {
  const highs = [
    ...result.architectureWarnings,
    ...result.performanceWarnings,
    ...result.forbiddenImportWarnings,
    ...result.renderRiskWarnings,
  ].filter((w) => w.severity === 'high');
  if (highs.length === 0) {
    return '- Kritik (high) uyarı yok.';
  }
  return highs.map((w) => `- **${w.id}**: ${w.message}`).join('\n');
}

export function qualityAuditDocExists(): boolean {
  return existsSync(join(REPO_ROOT, 'docs', 'crevia-quality-audit.md'));
}

export function readQualityAuditDoc(): string {
  return readFileSync(join(REPO_ROOT, 'docs', 'crevia-quality-audit.md'), 'utf8');
}
