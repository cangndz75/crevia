import type {
  SoftLaunchCoreAuditArea,
  SoftLaunchCorePreLaunchPass,
  SoftLaunchCoreResult,
} from './softLaunchCoreCompletenessTypes';

function formatPass(pass: SoftLaunchCorePreLaunchPass): string {
  return `- ${pass.priority.toUpperCase()} - ${pass.name}: ${pass.reason}`;
}

function formatArea(area: SoftLaunchCoreAuditArea): string {
  return [
    `### ${area.title}`,
    `- status: ${area.status}`,
    `- severity: ${area.severity}`,
    `- timing: ${area.recommendedTiming}`,
    `- implementation required before soft launch: ${area.isImplementationRequiredBeforeSoftLaunch ? 'yes' : 'no'}`,
    `- summary: ${area.summary}`,
    `- player risk: ${area.playerRisk}`,
    `- recommended action: ${area.recommendedAction}`,
    `- suggested prompt: ${area.suggestedPromptName}`,
    `- related systems: ${area.relatedSystems.join(', ')}`,
    `- evidence: ${area.evidence.join(' | ')}`,
  ].join('\n');
}

export function buildSoftLaunchCoreCompletenessConsoleSummary(
  result: SoftLaunchCoreResult,
): string {
  const must = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'must');
  const should = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'should');
  const optional = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'optional');

  return [
    'Crevia Soft Launch Core Completeness Audit - Stage 1',
    `overallHealth=${result.overallHealth}`,
    `softLaunchCoreDecision=${result.softLaunchCoreDecision}`,
    `internalDeviceTestDecision=${result.internalDeviceTestDecision}`,
    `areas=${result.auditAreas.length}`,
    `must=${must.length} should=${should.length} optional=${optional.length}`,
    `launchBlockers=${result.launchBlockers.length}`,
    '',
    'Net decision:',
    ...result.netDecision.map((line) => `- ${line}`),
    '',
    'Recommended next prompts:',
    ...result.recommendedNextPrompts.map((prompt) => `- ${prompt}`),
  ].join('\n');
}

export function buildSoftLaunchCoreCompletenessMarkdown(
  result: SoftLaunchCoreResult,
): string {
  const must = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'must');
  const should = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'should');
  const optional = result.mandatoryPreSoftLaunchPasses.filter((p) => p.priority === 'optional');

  return [
    '# Crevia Soft Launch Core Completeness Audit',
    '',
    '## Amaç',
    'Soft launch öncesi Crevia teknik temelinin oyuncuya tam oyun hissi verip vermediğini denetler.',
    '',
    '## Bu audit release readiness değildir',
    'Bu çalışma store, IAP ve metadata blockerlarını farkında tutar; ana odağı oyuncu hissi, karar etkisi, şehir hafızası, Day 8+ ana operasyon hissi ve yüzeyler arası yankıdır.',
    '',
    '## Oyuncu hissi odakları',
    '- Oyuncu karar verdiğinde şehir tepki veriyor mu?',
    '- Ece bunu fark ediyor mu?',
    '- Sosyal Nabız ve rapor aynı olayı tutarlı yankılıyor mu?',
    '- Yarın bu karara göre anlam kazanıyor mu?',
    '- Day 8+ ana operasyon boşalmış değil, genişlemiş hissettiriyor mu?',
    '',
    '## Audit alanları',
    ...result.auditAreas.map((area) => `- ${area.id}: ${area.title} (${area.status})`),
    '',
    '## Bulgular',
    ...result.auditAreas.map(formatArea),
    '',
    '## Soft launch öncesi must/should/optional işler',
    '### Must',
    ...(must.length > 0 ? must.map(formatPass) : ['- Yok']),
    '',
    '### Should',
    ...(should.length > 0 ? should.map(formatPass) : ['- Yok']),
    '',
    '### Optional',
    ...(optional.length > 0 ? optional.map(formatPass) : ['- Yok']),
    '',
    "## V1.1'e bırakılan işler",
    ...result.deferredV11Systems.map((item) => `- ${item}`),
    '',
    "## V2'ye bırakılan işler",
    ...result.deferredV2Systems.map((item) => `- ${item}`),
    '',
    "## Launch blocker'ları",
    ...result.launchBlockers.map((item) => `- ${item}`),
    '',
    '## Net karar',
    ...result.netDecision.map((item) => `- ${item}`),
    `- overallHealth: ${result.overallHealth}`,
    `- softLaunchCoreDecision: ${result.softLaunchCoreDecision}`,
    `- internalDeviceTestDecision: ${result.internalDeviceTestDecision}`,
    '',
    '## Sıradaki önerilen prompt',
    result.recommendedNextPrompts[0] ?? 'Decision Impact Explanation Pass',
    '',
    '## Non-goals confirmed',
    ...result.nonGoalsConfirmed.map((item) => `- ${item}`),
  ].join('\n');
}
