import {
  buildContentCoverageMatrix,
  buildDistrictCoverageSummary,
  buildDomainCoverageSummary,
  buildOperationEraCoverageSummary,
  buildRewardRecoveryCoverageSummary,
  getMissingCoverageResults,
  summarizeContentCoverage,
} from './contentCoverageMatrix';
import {
  CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS,
  CONTENT_PRODUCTION_ISSUE_LABELS,
  CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS,
  CONTENT_PRODUCTION_PACK_STATUS_LABELS,
  CONTENT_PRODUCTION_SCORE_THRESHOLDS,
  CONTENT_PRODUCTION_SCORE_WEIGHTS,
} from './contentProductionConstants';
import { findContentDuplicateRisks, summarizeDuplicateRisks } from './contentDuplicateGuard';
import {
  evaluateEchoCompletenessForPack,
  summarizeEchoCompleteness,
} from './contentEchoCompleteness';
import type {
  CreviaContentPackDefinition,
  CreviaContentProductionAuditResult,
  CreviaContentProductionIssue,
  CreviaContentProductionReportModel,
  CreviaContentQualityStatus,
} from './contentProductionTypes';

function containsForbiddenCopy(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function ratioScore(pass: number, total: number): number {
  if (total === 0) return 100;
  return clampScore((pass / total) * 100);
}

export function buildWriterChecklist(): string[] {
  return [
    'Somut sahne var mı?',
    'Mahalle kimliği var mı?',
    'Aktör belli mi?',
    'Gerçek trade-off var mı?',
    'Yarın etkisi var mı?',
    'Ece yorumlayabilir mi?',
    'Haritada görünür mü?',
    'Sosyal Nabız echo var mı?',
    'Rapor echo var mı?',
    'Mobilde kısa mı?',
    'Forbidden copy yok mu?',
    'Operation era veya rank permission bağlantısı var mı?',
  ];
}

export function buildContentProductionStatusLabel(status: CreviaContentQualityStatus): string {
  if (status === 'pass') return 'Uygun';
  if (status === 'warn') return 'İyileştir';
  return 'Kritik';
}

export function buildContentProductionIssueLine(issue: CreviaContentProductionIssue): string {
  const label = CONTENT_PRODUCTION_ISSUE_LABELS[issue.kind] ?? issue.kind;
  return `[${issue.severity.toUpperCase()}] ${label}: ${issue.message}`;
}

export function buildContentPackReleaseReadinessLine(pack: CreviaContentPackDefinition): string {
  const statusLabel = CONTENT_PRODUCTION_PACK_STATUS_LABELS[pack.status];
  return `Paket ${pack.id} · ${statusLabel} · v${pack.version} · runtime=${pack.isRuntimeLinked ? 'linked' : 'foundation-only'}`;
}

export function scoreContentProductionAudit(input: {
  coveragePassRatio: number;
  echoPassRatio: number;
  duplicateSafetyRatio: number;
  copySafetyRatio: number;
  mobileReadabilityRatio: number;
  hasBlocker: boolean;
}): { score: number; status: CreviaContentQualityStatus } {
  if (input.hasBlocker) {
    return { score: 0, status: 'fail' };
  }

  const score = clampScore(
    (input.coveragePassRatio * CONTENT_PRODUCTION_SCORE_WEIGHTS.coverage) / 100 +
      (input.echoPassRatio * CONTENT_PRODUCTION_SCORE_WEIGHTS.echoCompleteness) / 100 +
      (input.duplicateSafetyRatio * CONTENT_PRODUCTION_SCORE_WEIGHTS.duplicateSafety) / 100 +
      (input.copySafetyRatio * CONTENT_PRODUCTION_SCORE_WEIGHTS.copySafety) / 100 +
      (input.mobileReadabilityRatio * CONTENT_PRODUCTION_SCORE_WEIGHTS.mobileReadability) / 100,
  );

  let status: CreviaContentQualityStatus = 'pass';
  if (score < CONTENT_PRODUCTION_SCORE_THRESHOLDS.failBelow) status = 'fail';
  else if (score < CONTENT_PRODUCTION_SCORE_THRESHOLDS.passMin) status = 'warn';

  return { score, status };
}

export function buildContentProductionAuditResult(
  packs: readonly CreviaContentPackDefinition[],
): CreviaContentProductionAuditResult {
  const items = packs.flatMap((pack) => pack.items);
  const coverageResults = buildContentCoverageMatrix(packs);
  const coverageSummary = summarizeContentCoverage(coverageResults);
  const duplicateRisks = findContentDuplicateRisks(items);
  const duplicateSummary = summarizeDuplicateRisks(duplicateRisks);
  const echoCompletenessResults = packs.flatMap((pack) => evaluateEchoCompletenessForPack(pack));
  const echoSummary = summarizeEchoCompleteness(echoCompletenessResults);

  const issues: CreviaContentProductionIssue[] = [];

  for (const result of getMissingCoverageResults(coverageResults)) {
    if (result.status === 'fail') {
      issues.push({
        id: `coverage_fail_${result.dimension}_${result.id}`,
        severity: 'fail',
        kind:
          result.dimension === 'district'
            ? 'missing_district_coverage'
            : result.dimension === 'domain'
              ? 'missing_domain_coverage'
              : result.dimension === 'variant_kind'
                ? 'missing_variant_coverage'
                : result.dimension === 'operation_era'
                  ? 'missing_operation_era_link'
                  : 'missing_echo_surface',
        message: `${result.label} kapsamı minimum altında (${result.count}/${result.minimumCount}).`,
      });
    }
  }

  for (const risk of duplicateRisks.filter((entry) => entry.status !== 'pass')) {
    issues.push({
      id: `duplicate_${risk.itemAId}_${risk.itemBId}`,
      severity: risk.status === 'fail' ? 'fail' : 'warn',
      kind: 'duplicate_risk',
      message: risk.reasonLine,
      itemId: risk.itemAId,
      recommendation: 'Title, domain veya echo farkını netleştir.',
    });
  }

  for (const echo of echoCompletenessResults.filter((entry) => entry.status !== 'pass')) {
    issues.push({
      id: `echo_${echo.itemId}`,
      severity: echo.status === 'fail' ? 'fail' : 'warn',
      kind: 'missing_echo_surface',
      message: echo.reasonLine,
      itemId: echo.itemId,
    });
  }

  let copyBlocker = false;
  for (const item of items) {
    for (const block of item.copyBlocks) {
      if (block.isPlayerFacing && containsForbiddenCopy(block.text)) {
        copyBlocker = true;
        issues.push({
          id: `forbidden_${item.id}_${block.id}`,
          severity: 'blocker',
          kind: 'forbidden_copy',
          message: 'Player-facing yasaklı ifade tespit edildi.',
          itemId: item.id,
        });
      }
      if (block.isPlayerFacing && block.text.length > CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS.body) {
        issues.push({
          id: `mobile_${item.id}_${block.id}`,
          severity: 'warn',
          kind: 'mobile_length_risk',
          message: 'Mobil body uzunluğu önerilen sınırı aşıyor.',
          itemId: item.id,
        });
      }
    }
    if (item.title.length > CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS.title) {
      issues.push({
        id: `mobile_title_${item.id}`,
        severity: 'warn',
        kind: 'mobile_length_risk',
        message: 'Başlık mobil uzunluk sınırını aşıyor.',
        itemId: item.id,
      });
    }
  }

  const coveragePassRatio = ratioScore(
    coverageSummary.pass,
    coverageSummary.pass + coverageSummary.warn + coverageSummary.fail,
  );
  const echoPassRatio = ratioScore(
    echoSummary.pass,
    echoSummary.pass + echoSummary.warn + echoSummary.fail,
  );
  const duplicateSafetyRatio = ratioScore(
    duplicateSummary.pass,
    Math.max(1, duplicateSummary.pass + duplicateSummary.warn + duplicateSummary.fail),
  );
  const copySafetyRatio = copyBlocker ? 0 : 100;
  const mobileIssues = issues.filter((issue) => issue.kind === 'mobile_length_risk').length;
  const mobileReadabilityRatio = clampScore(100 - mobileIssues * 8);

  const scored = scoreContentProductionAudit({
    coveragePassRatio,
    echoPassRatio,
    duplicateSafetyRatio,
    copySafetyRatio,
    mobileReadabilityRatio,
    hasBlocker: copyBlocker,
  });

  const passCount = issues.filter((issue) => issue.severity === 'info').length + coverageSummary.pass;
  const warnCount =
    issues.filter((issue) => issue.severity === 'warn').length + coverageSummary.warn + duplicateSummary.warn;
  const failCount =
    issues.filter((issue) => issue.severity === 'fail').length + coverageSummary.fail + duplicateSummary.fail;
  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;

  const summaryLines = [
    `Content production audit skoru: ${scored.score}/100`,
    `Coverage PASS/WARN/FAIL: ${coverageSummary.pass}/${coverageSummary.warn}/${coverageSummary.fail}`,
    `Echo completeness PASS/WARN/FAIL: ${echoSummary.pass}/${echoSummary.warn}/${echoSummary.fail}`,
    `Duplicate risk WARN/FAIL: ${duplicateSummary.warn}/${duplicateSummary.fail}`,
    ...buildDistrictCoverageSummary(coverageResults).slice(0, 3),
    ...buildRewardRecoveryCoverageSummary(items),
  ];

  return {
    status: scored.status,
    score: scored.score,
    passCount,
    warnCount,
    failCount,
    blockerCount,
    coverageResults,
    duplicateRisks,
    echoCompletenessResults,
    issues,
    summaryLines,
  };
}

export function buildContentProductionSummaryLines(audit: CreviaContentProductionAuditResult): string[] {
  return audit.summaryLines;
}

export function buildContentProductionNextActionLines(
  audit: CreviaContentProductionAuditResult,
): string[] {
  const actions: string[] = [];

  if (audit.blockerCount > 0) {
    actions.push('Player-facing yasaklı ifadeleri temizle.');
  }
  if (audit.failCount > 0) {
    actions.push('Minimum coverage ve echo eksiklerini tamamla.');
  }
  if (audit.duplicateRisks.some((risk) => risk.status === 'warn')) {
    actions.push('Yüksek benzerlikli item çiftlerinde title/domain/echo farkını artır.');
  }
  if (actions.length === 0) {
    actions.push('Foundation pack QA seviyesinde; bir sonraki adım content pack authoring.');
  }

  return actions;
}

export function buildContentProductionReportModel(
  audit: CreviaContentProductionAuditResult,
): CreviaContentProductionReportModel {
  const coverageLines = [
    ...buildDistrictCoverageSummary(audit.coverageResults),
    ...buildDomainCoverageSummary(audit.coverageResults),
    ...buildOperationEraCoverageSummary(audit.coverageResults),
  ];

  return {
    title: 'Crevia Content Production Audit',
    statusLabel: buildContentProductionStatusLabel(audit.status),
    scoreLabel: `${audit.score}/100`,
    summaryLines: buildContentProductionSummaryLines(audit),
    coverageLines,
    issueLines: audit.issues.slice(0, 12).map((issue) => buildContentProductionIssueLine(issue)),
    nextActionLines: buildContentProductionNextActionLines(audit),
  };
}

export function contentProductionCopyContainsForbiddenTerms(copy: string): boolean {
  return containsForbiddenCopy(copy);
}

export function collectContentProductionPlayerFacingCopy(
  packs: readonly CreviaContentPackDefinition[],
): string[] {
  return packs
    .flatMap((pack) => pack.items)
    .flatMap((item) => item.copyBlocks)
    .filter((block) => block.isPlayerFacing)
    .map((block) => block.text);
}
