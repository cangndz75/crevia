import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  auditCombinedContentPacks,
  auditStage2EventsWithWritingStandard,
  countStage2EventsByDistrict,
  countStage2EventsByDomain,
  countVehicleRouteEvents,
  findStage2DuplicateIdsAgainstStage1,
  findStage2DuplicateTitlesAgainstStage1,
  validateCombinedPackIds,
  validateContentSafetyPackStage2Events,
  validateStage2ForbiddenAndPanic,
  validateStage2PilotDaySafety,
  validateStage2ThemeFit,
} from './contentPackStage2Validation';
import { validateContentPackEvents } from './contentPackValidation';
import {
  buildCombinedPackSummary,
  buildContentSafetyPackStage2Summary,
  buildNextContentPackStep,
  buildOperationDiversityCoverageSummary,
  buildStage2ThemeFitSummary,
} from './contentPackStage2Presentation';
import {
  CONTENT_SAFETY_PACK_STAGE2_EVENT_CARDS,
  mergePilotCatalogWithContentSafetyPacks,
} from './contentPackStage2PilotCatalog';
import { CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS } from './contentPackPilotCatalog';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';
import { OPERATION_DIVERSITY_CONTENT_PACK } from './operationDiversityContentPack';
import { mapContentPackTemplateToEventCard } from './contentPackEventAdapter';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const STAGE1 = NEIGHBORHOOD_CONTAINER_CONTENT_PACK;
const STAGE2 = OPERATION_DIVERSITY_CONTENT_PACK;
const DISTRICTS: MapDistrictId[] = ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'];

export type VerifyContentSafetyPackStage2Outcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditSummary: ReturnType<typeof auditStage2EventsWithWritingStandard>;
  combinedCount: number;
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

function blobHas(text: string, needle: string): boolean {
  return text.toLowerCase().includes(needle.toLowerCase());
}

const VEHICLE_ROUTE_MARKERS = ['araç', 'arac', 'rota', 'bakım', 'bakim', 'gecikme', 'yorgunluk', 'kapasite'];
const PERSONNEL_MARKERS = ['ekip', 'moral', 'rotasyon', 'tempo', 'dayanıklılık', 'dayaniklilik'];
const SOCIAL_MARKERS = ['sosyal', 'vatandaş', 'vatandas', 'görünürlük', 'gorunurluk', 'algı', 'algi', 'mahalle'];
const CRISIS_SAFE_MARKERS = ['henüz kriz', 'henuz kriz', 'önleyici', 'onleyici', 'sinyal', 'birleş', 'birles'];

export function verifyContentSafetyPackStage2Scenario(): VerifyContentSafetyPackStage2Outcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  const validation = validateContentSafetyPackStage2Events(STAGE2);
  const audit = auditStage2EventsWithWritingStandard(STAGE2);
  const combinedAudit = auditCombinedContentPacks(STAGE2);
  const byDistrict = countStage2EventsByDistrict(STAGE2);
  const byDomain = countStage2EventsByDomain(STAGE2);
  const vehicleRouteCount = countVehicleRouteEvents(STAGE2);
  const personnelCount = byDomain.personnel ?? 0;
  const socialCount = byDomain.social ?? 0;
  const crisisCount = byDomain.crisis_adjacent ?? 0;
  const combinedCount = STAGE1.length + STAGE2.length;

  record(assert(checks, STAGE2.length >= 30, `Stage 2 count >= 30 (${STAGE2.length})`, 'Stage 2 yetersiz'));
  record(
    assert(
      checks,
      vehicleRouteCount >= 8,
      `vehicle/route >= 8 (${vehicleRouteCount})`,
      'vehicle/route yetersiz',
    ),
  );
  record(
    assert(
      checks,
      personnelCount >= 8,
      `personnel >= 8 (${personnelCount})`,
      'personnel yetersiz',
    ),
  );
  record(assert(checks, socialCount >= 8, `social >= 8 (${socialCount})`, 'social yetersiz'));
  record(
    assert(
      checks,
      crisisCount >= 6,
      `crisis_adjacent >= 6 (${crisisCount})`,
      'crisis yetersiz',
    ),
  );

  for (const district of DISTRICTS) {
    record(
      assert(
        checks,
        (byDistrict[district] ?? 0) >= 5,
        `${district} >= 5 (${byDistrict[district]})`,
        `${district} yetersiz`,
      ),
    );
  }

  record(
    assert(
      checks,
      findStage2DuplicateIdsAgainstStage1(STAGE1, STAGE2).length === 0,
      'Stage1+2 duplicate id yok',
      'id çakışması',
    ),
  );
  record(
    assert(
      checks,
      findStage2DuplicateTitlesAgainstStage1(STAGE1, STAGE2).length === 0,
      'Stage1+2 duplicate title yok',
      'title çakışması',
    ),
  );
  record(assert(checks, validateCombinedPackIds(STAGE1, STAGE2).ok, 'Combined id/title unique', 'combined dup'));
  record(assert(checks, validation.ok, 'Stage 2 validation ok', validation.errors.join('; ')));

  for (const template of STAGE2) {
    record(assert(checks, !!template.districtId, `${template.id} districtId`, 'district eksik'));
    record(assert(checks, !!template.domain, `${template.id} domain`, 'domain eksik'));
    record(assert(checks, template.sceneText.length > 0, `${template.id} scene`, 'scene eksik'));
    record(assert(checks, template.pressureText.length > 0, `${template.id} pressure`, 'pressure eksik'));
    record(
      assert(checks, template.decisionContextText.length > 0, `${template.id} decision`, 'decision eksik'),
    );
    record(assert(checks, template.shortTermEffectText.length > 0, `${template.id} short`, 'short eksik'));
    record(assert(checks, template.tradeOffText.length > 0, `${template.id} trade`, 'trade eksik'));
    record(assert(checks, template.carryOverText.length > 0, `${template.id} carry`, 'carry eksik'));
    record(assert(checks, template.socialEchoText.length > 0, `${template.id} social`, 'social eksik'));
    record(assert(checks, template.advisorEchoText.length > 0, `${template.id} advisor`, 'advisor eksik'));
    record(assert(checks, template.reportEchoText.length > 0, `${template.id} report`, 'report eksik'));
    record(assert(checks, template.tags.length > 0, `${template.id} tags`, 'tags eksik'));
  }

  record(
    assert(
      checks,
      audit.averageScore >= 82,
      `Stage2 ortalama >= 82 (${audit.averageScore})`,
      `ortalama düşük (${audit.averageScore})`,
    ),
  );
  record(
    assert(
      checks,
      audit.minScore >= 75,
      `Stage2 min >= 75 (${audit.minScore})`,
      `min düşük (${audit.minScore})`,
    ),
  );
  record(
    assert(
      checks,
      audit.results.filter((r) => r.score >= 90).length >= 4,
      `>=4 event skor 90+ (${audit.results.filter((r) => r.score >= 90).length})`,
      'golden sayısı düşük',
    ),
  );

  const vehicleRouteEvents = STAGE2.filter((e) => e.domain === 'vehicle' || e.domain === 'route');
  record(
    assert(
      checks,
      vehicleRouteEvents.every((e) =>
        VEHICLE_ROUTE_MARKERS.some((m) => blobHas(e.sceneText + e.pressureText + e.tradeOffText, m)),
      ),
      'vehicle/route dil işaretleri',
      'vehicle/route dil zayıf',
    ),
  );

  const personnelEvents = STAGE2.filter((e) => e.domain === 'personnel');
  record(
    assert(
      checks,
      personnelEvents.every((e) =>
        PERSONNEL_MARKERS.some((m) => blobHas(e.sceneText + e.pressureText, m)),
      ),
      'personnel dil işaretleri',
      'personnel dil zayıf',
    ),
  );

  const socialEvents = STAGE2.filter((e) => e.domain === 'social');
  record(
    assert(
      checks,
      socialEvents.every((e) =>
        SOCIAL_MARKERS.some((m) =>
          blobHas([e.sceneText, e.pressureText, e.socialEchoText].join(' '), m),
        ),
      ),
      'social dil işaretleri',
      'social dil zayıf',
    ),
  );

  const crisisEvents = STAGE2.filter((e) => e.domain === 'crisis_adjacent');
  record(
    assert(
      checks,
      crisisEvents.every((e) =>
        CRISIS_SAFE_MARKERS.some((m) => blobHas(e.sceneText + e.pressureText, m)),
      ),
      'crisis önleyici/sinyal dili',
      'crisis dil zayıf',
    ),
  );
  record(
    assert(
      checks,
      validateStage2ForbiddenAndPanic(STAGE2).ok,
      'Forbidden/panik dili yok',
      'yasaklı/panik',
    ),
  );

  record(assert(checks, validateStage2PilotDaySafety(STAGE2).ok, 'Day 1 pilot safety', 'day1 risk'));
  record(assert(checks, validateStage2ThemeFit(STAGE2).ok, 'Theme fit', validateStage2ThemeFit(STAGE2).errors.join('; ')));

  record(
    assert(
      checks,
      STAGE2.filter((e) => e.avoidPilotDays?.includes(1)).length === STAGE2.length,
      'Day 1 avoid tüm eventlerde',
      'day1 avoid eksik',
    ),
  );
  record(
    assert(
      checks,
      STAGE2.filter((e) => e.avoidPilotDays?.includes(7)).length >= STAGE2.length - 1,
      'Day 7 avoid yeterli',
      'day7 avoid eksik',
    ),
  );

  record(
    assert(
      checks,
      STAGE2.filter(
        (e) =>
          /yarın|yarin|ertesi gün|ertesi gun|sonraki gün|sonraki gun/i.test(e.carryOverText),
      ).length >= STAGE2.length - 1,
      'Carry-over zaman ifadesi',
      'carry eksik',
    ),
  );
  record(
    assert(
      checks,
      STAGE2.filter((e) => /ama |fakat |ancak |bedel/i.test(e.tradeOffText)).length >=
        STAGE2.length - 1,
      'Trade-off bağlaçları',
      'trade eksik',
    ),
  );

  record(assert(checks, STAGE2.every((e) => e.advisorEchoText.includes('Ece')), 'Advisor Ece', 'ece eksik'));
  record(assert(checks, STAGE2.every((e) => e.socialEchoText.length >= 10), 'Social echo', 'social echo eksik'));
  record(assert(checks, STAGE2.every((e) => e.reportEchoText.length >= 10), 'Report echo', 'report eksik'));

  for (const district of DISTRICTS) {
    const districtEvents = STAGE2.filter((e) => e.districtId === district);
    record(
      assert(
        checks,
        districtEvents.some((e) => e.domain === 'vehicle' || e.domain === 'route' || e.domain === 'personnel'),
        `${district} kaynak event`,
        `${district} kaynak eksik`,
      ),
    );
    record(
      assert(
        checks,
        districtEvents.some((e) => e.domain === 'social' || e.domain === 'personnel'),
        `${district} sosyal/personel`,
        `${district} sosyal eksik`,
      ),
    );
  }

  record(
    assert(
      checks,
      blobHas(
        STAGE2.filter((e) => e.districtId === 'merkez').map((e) => e.sceneText).join(' '),
        'meydan',
      ) ||
        blobHas(
          STAGE2.filter((e) => e.districtId === 'merkez').map((e) => e.sceneText).join(' '),
          'çarşı',
        ),
      'Merkez karakter',
      'Merkez karakter zayıf',
    ),
  );
  record(
    assert(
      checks,
      blobHas(
        STAGE2.filter((e) => e.districtId === 'cumhuriyet').map((e) => e.sceneText).join(' '),
        'apartman',
      ) || blobHas(
        STAGE2.filter((e) => e.districtId === 'cumhuriyet').map((e) => e.sceneText).join(' '),
        'esnaf',
      ),
      'Cumhuriyet karakter',
      'Cumhuriyet zayıf',
    ),
  );
  record(
    assert(
      checks,
      blobHas(
        STAGE2.filter((e) => e.districtId === 'sanayi').map((e) => e.sceneText).join(' '),
        'atölye',
      ) || blobHas(
        STAGE2.filter((e) => e.districtId === 'sanayi').map((e) => e.sceneText).join(' '),
        'ağır',
      ),
      'Sanayi karakter',
      'Sanayi zayıf',
    ),
  );
  record(
    assert(
      checks,
      blobHas(
        STAGE2.filter((e) => e.districtId === 'istasyon').map((e) => e.sceneText).join(' '),
        'geçiş',
      ) || blobHas(
        STAGE2.filter((e) => e.districtId === 'istasyon').map((e) => e.sceneText).join(' '),
        'akşam',
      ),
      'İstasyon karakter',
      'İstasyon zayıf',
    ),
  );
  record(
    assert(
      checks,
      blobHas(
        STAGE2.filter((e) => e.districtId === 'yesilvadi').map((e) => e.sceneText).join(' '),
        'park',
      ) || blobHas(
        STAGE2.filter((e) => e.districtId === 'yesilvadi').map((e) => e.sceneText).join(' '),
        'çevre',
      ),
      'Yeşilvadi karakter',
      'Yeşilvadi zayıf',
    ),
  );

  record(assert(checks, STAGE1.length === 20, `Stage1 count korunuyor (${STAGE1.length})`, 'stage1 bozuldu'));
  record(
    assert(
      checks,
      combinedAudit.stage1.averageScore >= 82,
      `Stage1 ortalama korunuyor (${combinedAudit.stage1.averageScore})`,
      'stage1 skor düştü',
    ),
  );
  record(assert(checks, combinedCount >= 50, `Combined >= 50 (${combinedCount})`, 'combined yetersiz'));

  const combinedDomains = new Set([
    ...STAGE1.map((e) => e.domain),
    ...STAGE2.map((e) => e.domain),
  ]);
  for (const domain of [
    'container',
    'vehicle',
    'route',
    'personnel',
    'social',
    'crisis_adjacent',
  ] as const) {
    record(assert(checks, combinedDomains.has(domain), `Combined domain ${domain}`, 'domain eksik'));
  }

  record(
    assert(
      checks,
      CONTENT_SAFETY_PACK_STAGE2_EVENT_CARDS.length === STAGE2.length,
      'Stage2 EventCard sayısı',
      'card uyumsuz',
    ),
  );
  record(
    assert(
      checks,
      mapContentPackTemplateToEventCard(STAGE2[0]!).id === STAGE2[0]!.id,
      'Adapter stable id',
      'id unstable',
    ),
  );
  record(
    assert(
      checks,
      mergePilotCatalogWithContentSafetyPacks().length >
        CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS.length,
      'Merge Stage1+2',
      'merge başarısız',
    ),
  );

  record(
    assert(
      checks,
      readRepo('src/core/game/ensureDailyEventsForDay.ts').includes(
        'mergePilotCatalogWithContentSafetyPacks',
      ),
      'ensureDailyEvents merge',
      'ensure entegrasyon yok',
    ),
  );
  record(assert(checks, !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('csp2-'), 'postPilot dokunulmadı', 'postPilot değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('contentPacks'), 'applyDecision değişmedi', 'applyDecision değişti'));
  record(assert(checks, SAVE_VERSION === 26, `SAVE_VERSION (${SAVE_VERSION})`, 'SAVE_VERSION değişti'));

  record(
    assert(
      checks,
      buildContentSafetyPackStage2Summary().trim().length > 100,
      'Presentation summary',
      'summary boş',
    ),
  );
  record(assert(checks, buildOperationDiversityCoverageSummary().includes('Personel'), 'Coverage summary', 'coverage eksik'));
  record(assert(checks, buildStage2ThemeFitSummary().includes('Gün 3'), 'Theme fit summary', 'theme eksik'));
  record(assert(checks, buildCombinedPackSummary().includes('Birleşik'), 'Combined summary', 'combined summary eksik'));

  record(assert(checks, readRepo('docs/crevia-content-safety-pack-stage-2.md').includes('Aşama 2'), 'Docs var', 'docs eksik'));
  record(assert(checks, readRepo('package.json').includes('verify:content-safety-pack-stage-2'), 'package script', 'script eksik'));

  const roadmap = getFinalPolishRoadmapItemById('content-safety-pack-stage-2');
  record(assert(checks, roadmap != null, 'Roadmap stage-2', 'roadmap eksik'));
  recordWarn(
    warn(
      checks,
      roadmap?.status === 'completed' || roadmap?.status === 'in_progress',
      'Roadmap status',
      'roadmap planned',
    ),
  );

  record(assert(checks, buildNextContentPackStep().includes('Aşama 3'), 'Next step Aşama 3', 'next step hatalı'));
  record(
    assert(
      checks,
      readRepo('docs/crevia-content-safety-pack-stage-2.md').includes('Runtime integration'),
      'Runtime integration notu',
      'integration notu eksik',
    ),
  );

  const stage1Item = getFinalPolishRoadmapItemById('content-safety-pack-stage-1');
  record(assert(checks, stage1Item?.status === 'completed', 'Stage1 roadmap completed', 'stage1 roadmap'));

  return { ok, warn: hasWarn, checks, auditSummary: audit, combinedCount };
}
