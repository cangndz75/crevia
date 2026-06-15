import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';

import {
  ADVISOR_ECHO_TEMPLATES,
  ALL_EVENT_ECHO_TEMPLATES,
  REPORT_ECHO_TEMPLATES,
  SOCIAL_ECHO_TEMPLATES,
  TOMORROW_HINT_ECHO_TEMPLATES,
} from './eventEchoCopy';
import { buildEventEchoSummaryForDocs } from './eventEchoPresentation';
import {
  countEchoTemplatesByDomain,
  countEchoTemplatesBySurface,
  findDuplicateEchoTemplateIds,
  findForbiddenEchoWords,
  findTooLongEchoTexts,
  validateDay1EchoSafety,
  validateEchoCoverageForContentPacks,
  validateEventEchoTemplates,
  validatePilotFinalEchoSafety,
} from './eventEchoValidation';
import type { EventEchoContext, EventEchoDomain } from './eventEchoTypes';
import {
  buildEventEchoBundle,
  buildEchoContextFromEventResult,
  inferEchoDomainFromEvent,
  inferOutcomeBandFromResult,
  isEventEchoSelectionDeterministic,
  selectAdvisorEcho,
} from './eventEchoSelectors';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';
import { OPERATION_DIVERSITY_CONTENT_PACK } from './operationDiversityContentPack';
import { buildNextContentPackStage3Step } from './eventEchoPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const DISTRICTS = ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'] as const;

export type VerifyContentSafetyPackStage3Outcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function countDistrictEcho(districtId: string): number {
  return ALL_EVENT_ECHO_TEMPLATES.filter(
    (t) => t.districtIds?.includes(districtId as (typeof DISTRICTS)[number]),
  ).length;
}

function domainHasAllSurfaces(domain: EventEchoDomain): boolean {
  const surfaces = new Set(
    ALL_EVENT_ECHO_TEMPLATES.filter((t) => t.domain === domain).map((t) => t.surface),
  );
  return (
    surfaces.has('advisor') &&
    surfaces.has('social') &&
    surfaces.has('report')
  );
}

export function verifyContentSafetyPackStage3Scenario(): VerifyContentSafetyPackStage3Outcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  const validation = validateEventEchoTemplates();
  const bySurface = countEchoTemplatesBySurface();
  const byDomain = countEchoTemplatesByDomain();
  const vehicleRoute = (byDomain.vehicle ?? 0) + (byDomain.route ?? 0);

  record(assert(checks, ADVISOR_ECHO_TEMPLATES.length >= 50, `advisor >= 50 (${ADVISOR_ECHO_TEMPLATES.length})`, 'advisor yetersiz'));
  record(assert(checks, SOCIAL_ECHO_TEMPLATES.length >= 60, `social >= 60 (${SOCIAL_ECHO_TEMPLATES.length})`, 'social yetersiz'));
  record(assert(checks, REPORT_ECHO_TEMPLATES.length >= 60, `report >= 60 (${REPORT_ECHO_TEMPLATES.length})`, 'report yetersiz'));
  record(
    assert(
      checks,
      TOMORROW_HINT_ECHO_TEMPLATES.length >= 30,
      `tomorrow >= 30 (${TOMORROW_HINT_ECHO_TEMPLATES.length})`,
      'tomorrow yetersiz',
    ),
  );
  record(
    assert(
      checks,
      ALL_EVENT_ECHO_TEMPLATES.length >= 200,
      `total >= 200 (${ALL_EVENT_ECHO_TEMPLATES.length})`,
      'total yetersiz',
    ),
  );

  record(assert(checks, (byDomain.container ?? 0) >= 30, `container >= 30 (${byDomain.container})`, 'container'));
  record(assert(checks, vehicleRoute >= 30, `vehicle/route >= 30 (${vehicleRoute})`, 'vehicle/route'));
  record(assert(checks, (byDomain.personnel ?? 0) >= 25, `personnel >= 25 (${byDomain.personnel})`, 'personnel'));
  record(assert(checks, (byDomain.social ?? 0) >= 30, `social domain >= 30 (${byDomain.social})`, 'social domain'));
  record(
    assert(
      checks,
      (byDomain.crisis_adjacent ?? 0) >= 25,
      `crisis >= 25 (${byDomain.crisis_adjacent})`,
      'crisis',
    ),
  );
  record(
    assert(
      checks,
      (byDomain.district_balance ?? 0) >= 20,
      `district_balance >= 20 (${byDomain.district_balance})`,
      'district_balance',
    ),
  );
  const pilotGeneric =
    (byDomain.pilot_learning ?? 0) + (byDomain.pilot_final ?? 0) + (byDomain.generic_operation ?? 0);
  record(assert(checks, pilotGeneric >= 20, `pilot/generic >= 20 (${pilotGeneric})`, 'pilot/generic'));

  for (const domain of [
    'container',
    'vehicle',
    'route',
    'personnel',
    'social',
    'crisis_adjacent',
  ] as EventEchoDomain[]) {
    record(assert(checks, domainHasAllSurfaces(domain), `${domain} tüm yüzeyler`, `${domain} yüzey eksik`));
  }

  record(assert(checks, findDuplicateEchoTemplateIds().length === 0, 'duplicate id yok', 'dup id'));
  record(assert(checks, findForbiddenEchoWords().length === 0, 'forbidden yok', 'forbidden'));
  record(assert(checks, validation.ok, 'validation ok', validation.errors.join('; ')));

  const longTexts = findTooLongEchoTexts();
  recordWarn(
    warn(
      checks,
      longTexts.length <= 15,
      'Uzun metin WARN eşiği',
      `uzun metin: ${longTexts.length}`,
    ),
  );

  record(assert(checks, validateDay1EchoSafety().ok, 'Day1 safety', 'day1'));
  record(assert(checks, validatePilotFinalEchoSafety().ok, 'Day7 safety', 'day7'));

  const baseCtx: EventEchoContext = {
    day: 3,
    domain: 'container',
    outcomeBand: 'mixed',
    eventId: 'test-event',
    districtId: 'cumhuriyet',
  };
  record(assert(checks, isEventEchoSelectionDeterministic(baseCtx), 'deterministic selection', 'non-deterministic'));

  const ctxVehicle: EventEchoContext = {
    day: 3,
    domain: 'vehicle',
    outcomeBand: 'strained_success',
    eventId: 'evt-vehicle-1',
    districtId: 'sanayi',
  };
  const b1 = buildEventEchoBundle(baseCtx);
  const b2 = buildEventEchoBundle(ctxVehicle);
  record(
    assert(
      checks,
      b1.advisorLine !== b2.advisorLine,
      'farklı context farklı bundle',
      'selection aynı',
    ),
  );

  record(assert(checks, !!b1.advisorLine && !!b1.socialMention && !!b1.reportLine, 'bundle dolu', 'bundle eksik'));
  const texts = [b1.advisorLine, b1.socialMention, b1.reportLine, b1.tomorrowHint].filter(Boolean);
  record(assert(checks, new Set(texts).size === texts.length, 'bundle duplicate yok', 'bundle dup'));

  const day1Ctx: EventEchoContext = { ...baseCtx, day: 1 };
  const day1Advisor = selectAdvisorEcho(day1Ctx);
  record(
    assert(
      checks,
      !day1Advisor || day1Advisor.forbiddenInDay1 !== true,
      'Day1 unsafe advisor seçilmez',
      'day1 unsafe',
    ),
  );

  record(
    assert(
      checks,
      inferEchoDomainFromEvent({ id: 'csp1-cumhuriyet-iri-atik', contentCategory: 'waste_container' }) ===
        'container',
      'infer container',
      'infer container fail',
    ),
  );
  record(
    assert(
      checks,
      inferEchoDomainFromEvent({ id: 'csp2-istasyon-aksam-rota', contentCategory: 'vehicle_route' }) ===
        'vehicle',
      'infer vehicle',
      'infer vehicle fail',
    ),
  );
  record(
    assert(
      checks,
      inferEchoDomainFromEvent({ id: 'csp2-cumhuriyet-ekip', contentCategory: 'staff_morale' }) ===
        'personnel',
      'infer personnel',
      'infer personnel fail',
    ),
  );
  record(
    assert(
      checks,
      inferEchoDomainFromEvent({
        id: 'csp2-sanayi-risk',
        filterTags: ['crisis'],
        contentCategory: 'crisis_signal',
      }) === 'crisis_adjacent',
      'infer crisis',
      'infer crisis fail',
    ),
  );

  record(
    assert(
      checks,
      inferOutcomeBandFromResult({ publicSatisfactionDelta: 10, riskDelta: -8 }) === 'strong_success',
      'infer strong_success',
      'strong fail',
    ),
  );
  record(
    assert(
      checks,
      inferOutcomeBandFromResult({ publicSatisfactionDelta: -6, riskDelta: 5 }) === 'weak' ||
        inferOutcomeBandFromResult({ publicSatisfactionDelta: -6, riskDelta: 5 }) === 'mixed',
      'infer weak/mixed',
      'weak fail',
    ),
  );

  for (const d of DISTRICTS) {
    record(assert(checks, countDistrictEcho(d) >= 8, `${d} echo >= 8 (${countDistrictEcho(d)})`, `${d} düşük`));
  }

  record(
    assert(
      checks,
      validateEchoCoverageForContentPacks(
        NEIGHBORHOOD_CONTAINER_CONTENT_PACK,
        OPERATION_DIVERSITY_CONTENT_PACK,
      ).ok,
      'stage1/2 coverage',
      'coverage fail',
    ),
  );

  const golden = NEIGHBORHOOD_CONTAINER_CONTENT_PACK.find(
    (e) => e.id === 'csp1-cumhuriyet-iri-atik-sikisma',
  )!;
  const goldenBundle = buildEventEchoBundle(
    buildEchoContextFromEventResult({
      event: { id: golden.id, contentCategory: golden.domain, neighborhoodId: golden.districtId },
      day: 2,
      districtId: golden.districtId,
      hasCarryOver: true,
    }),
  );
  record(assert(checks, !!goldenBundle.advisorLine, 'golden advisor', 'golden advisor'));
  record(assert(checks, !!goldenBundle.socialMention, 'golden social', 'golden social'));
  record(assert(checks, !!goldenBundle.reportLine, 'golden report', 'golden report'));

  record(assert(checks, !readRepo('src/core/contentPacks/eventEchoSelectors.ts').includes('Math.random'), 'no Math.random', 'random'));
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), `SAVE_VERSION (${SAVE_VERSION})`, 'SAVE_VERSION'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('eventEcho'), 'applyDecision', 'applyDecision'));
  record(assert(checks, !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('eventEchoCopy'), 'postPilot', 'postPilot'));
  record(assert(checks, buildEventEchoSummaryForDocs().length > 80, 'presentation summary', 'summary'));
  record(assert(checks, readRepo('docs/crevia-content-safety-pack-stage-3.md').includes('Aşama 3'), 'docs', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:content-safety-pack-stage-3'), 'script', 'script'));

  const roadmap = getFinalPolishRoadmapItemById('content-safety-pack-stage-3');
  record(assert(checks, roadmap != null, 'roadmap', 'roadmap'));
  recordWarn(
    warn(checks, roadmap?.status === 'completed' || roadmap?.status === 'in_progress', 'roadmap status', 'planned'),
  );
  record(
    assert(
      checks,
      buildNextContentPackStage3Step().includes('Event Domain UI') ||
        readRepo('docs/crevia-content-safety-pack-stage-3.md').includes('Event Domain UI'),
      'next step UI prioritization',
      'next step',
    ),
  );

  record(assert(checks, (bySurface.advisor ?? 0) >= 50, 'surface advisor', 'surface advisor'));
  record(assert(checks, (bySurface.social ?? 0) >= 60, 'surface social', 'surface social'));
  record(assert(checks, (bySurface.report ?? 0) >= 60, 'surface report', 'surface report'));
  record(assert(checks, (bySurface.tomorrow_hint ?? 0) >= 30, 'surface tomorrow', 'surface tomorrow'));

  const sampleDomains: EventEchoDomain[] = [
    'container',
    'vehicle',
    'personnel',
    'social',
    'crisis_adjacent',
    'district_balance',
  ];
  for (const domain of sampleDomains) {
    const bundle = buildEventEchoBundle({
      day: domain === 'crisis_adjacent' ? 6 : 3,
      domain,
      outcomeBand: 'mixed',
      eventId: `sample-${domain}`,
    });
    record(assert(checks, !!bundle.advisorLine, `sample ${domain} advisor`, `${domain} advisor`));
  }

  record(
    assert(
      checks,
      readRepo('src/features/reports/presentation/reportScreenPresentation.ts').includes('buildTomorrowHintLine'),
      'report tomorrow fallback entegrasyon',
      'report entegrasyon yok',
    ),
  );

  const crisisTexts = ALL_EVENT_ECHO_TEMPLATES.filter((t) => t.domain === 'crisis_adjacent').map((t) =>
    t.text.toLowerCase(),
  );
  record(
    assert(
      checks,
      crisisTexts.every((t) => !t.includes('kriz başladı')),
      'crisis panik dili yok',
      'panik dili',
    ),
  );

  const advisorPushy = ADVISOR_ECHO_TEMPLATES.filter((t) =>
    ['en iyi seçenek', 'bunu yap'].some((p) => t.text.toLowerCase().includes(p)),
  );
  record(assert(checks, advisorPushy.length === 0, 'advisor dayatmacı dil yok', 'pushy'));

  record(
    assert(
      checks,
      ADVISOR_ECHO_TEMPLATES.filter((t) => t.text.length <= 180).length >=
        ADVISOR_ECHO_TEMPLATES.length - 5,
      'advisor length çoğunluk ok',
      'advisor uzun',
    ),
  );
  record(
    assert(
      checks,
      SOCIAL_ECHO_TEMPLATES.filter((t) => t.text.length <= 140).length >=
        SOCIAL_ECHO_TEMPLATES.length - 5,
      'social length çoğunluk ok',
      'social uzun',
    ),
  );
  record(
    assert(
      checks,
      REPORT_ECHO_TEMPLATES.filter((t) => t.text.length <= 160).length >=
        REPORT_ECHO_TEMPLATES.length - 5,
      'report length çoğunluk ok',
      'report uzun',
    ),
  );

  record(
    assert(
      checks,
      NEIGHBORHOOD_CONTAINER_CONTENT_PACK.length === 20,
      'stage1 korunuyor',
      'stage1 bozuldu',
    ),
  );
  record(
    assert(
      checks,
      OPERATION_DIVERSITY_CONTENT_PACK.length >= 30,
      'stage2 korunuyor',
      'stage2 bozuldu',
    ),
  );

  for (const t of ADVISOR_ECHO_TEMPLATES) {
    record(assert(checks, t.text.length > 0, `${t.id} advisor text`, 'boş'));
    record(assert(checks, t.advisorRole === 'ece', `${t.id} ece role`, 'role'));
  }
  for (const t of SOCIAL_ECHO_TEMPLATES) {
    record(assert(checks, t.text.length > 0, `${t.id} social text`, 'boş'));
    record(assert(checks, !!t.sentiment, `${t.id} sentiment`, 'sentiment'));
  }
  for (const t of REPORT_ECHO_TEMPLATES) {
    record(assert(checks, t.text.length > 0, `${t.id} report text`, 'boş'));
    record(assert(checks, !!t.reportSection, `${t.id} section`, 'section'));
  }
  for (const t of TOMORROW_HINT_ECHO_TEMPLATES) {
    record(assert(checks, t.text.length > 0, `${t.id} tomorrow text`, 'boş'));
  }

  const outcomeBands: EventEchoContext['outcomeBand'][] = [
    'strong_success',
    'partial_success',
    'mixed',
    'weak',
  ];
  for (const band of outcomeBands) {
    record(
      assert(
        checks,
        !!selectAdvisorEcho({ ...baseCtx, outcomeBand: band }),
        `outcome ${band} advisor`,
        `outcome ${band}`,
      ),
    );
  }

  record(
    assert(
      checks,
      !readRepo('src/core/game/dayPipeline.ts').includes('eventEcho'),
      'dayPipeline dokunulmadı',
      'dayPipeline',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('eventEchoCopy'),
      'generation dokunulmadı',
      'generation',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/core/contentPacks/index.ts').includes('buildEventEchoBundle'),
      'index export',
      'index',
    ),
  );

  return { ok, warn: hasWarn, checks };
}
