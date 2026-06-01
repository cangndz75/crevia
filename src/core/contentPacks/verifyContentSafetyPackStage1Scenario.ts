import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  auditContentPackEventsWithWritingStandard,
  countContentPackByDistrict,
  countContentPackByDomain,
  validateContentPackEvents,
} from './contentPackValidation';
import {
  buildContainerContentCoverageSummary,
  buildContentSafetyPackStage1Summary,
  buildNextContentPackStep,
} from './contentPackPresentation';
import { CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS } from './contentPackPilotCatalog';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const PACK = NEIGHBORHOOD_CONTAINER_CONTENT_PACK;
const DISTRICTS: MapDistrictId[] = ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'];

export type VerifyContentSafetyPackStage1Outcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditSummary: ReturnType<typeof auditContentPackEventsWithWritingStandard>;
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

export function verifyContentSafetyPackStage1Scenario(): VerifyContentSafetyPackStage1Outcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  const validation = validateContentPackEvents(PACK);
  const audit = auditContentPackEventsWithWritingStandard(PACK);
  const byDistrict = countContentPackByDistrict(PACK);
  const byDomain = countContentPackByDomain(PACK);
  const containerCount = PACK.filter((e) => e.domain === 'container').length;

  record(assert(checks, PACK.length >= 15, `Pack event count >= 15 (${PACK.length})`, 'Pack yetersiz'));
  record(
    assert(
      checks,
      PACK.length >= 15,
      `Mahalle özel event >= 15 (${PACK.length})`,
      'Mahalle event yetersiz',
    ),
  );
  record(
    assert(
      checks,
      containerCount >= 10,
      `Container domain >= 10 (${containerCount})`,
      'Container yetersiz',
    ),
  );

  for (const district of DISTRICTS) {
    record(
      assert(
        checks,
        (byDistrict[district] ?? 0) >= 3,
        `${district} count >= 3 (${byDistrict[district]})`,
        `${district} yetersiz`,
      ),
    );
  }

  record(assert(checks, validation.ok, 'Pack validation ok', validation.errors.join('; ')));

  for (const template of PACK) {
    record(assert(checks, !!template.districtId, `${template.id} districtId`, 'districtId eksik'));
    record(assert(checks, !!template.domain, `${template.id} domain`, 'domain eksik'));
    record(assert(checks, template.sceneText.length > 0, `${template.id} sceneText`, 'scene eksik'));
    record(assert(checks, template.pressureText.length > 0, `${template.id} pressureText`, 'pressure eksik'));
    record(
      assert(
        checks,
        template.decisionContextText.length > 0,
        `${template.id} decisionContext`,
        'decision eksik',
      ),
    );
    record(
      assert(
        checks,
        template.shortTermEffectText.length > 0,
        `${template.id} shortTerm`,
        'shortTerm eksik',
      ),
    );
    record(assert(checks, template.tradeOffText.length > 0, `${template.id} tradeOff`, 'tradeOff eksik'));
    record(assert(checks, template.carryOverText.length > 0, `${template.id} carryOver`, 'carry eksik'));
    record(assert(checks, template.socialEchoText.length > 0, `${template.id} social`, 'social eksik'));
    record(assert(checks, template.advisorEchoText.length > 0, `${template.id} advisor`, 'advisor eksik'));
    record(assert(checks, template.reportEchoText.length > 0, `${template.id} report`, 'report eksik'));
    record(assert(checks, template.tags.length > 0, `${template.id} tags`, 'tags eksik'));
  }

  record(
    assert(
      checks,
      audit.averageScore >= 82,
      `Ortalama audit >= 82 (${audit.averageScore})`,
      `Ortalama düşük (${audit.averageScore})`,
    ),
  );
  record(
    assert(
      checks,
      audit.minScore >= 75,
      `Min audit >= 75 (${audit.minScore})`,
      `Min skor düşük (${audit.minScore})`,
    ),
  );

  const cumhuriyet = PACK.find((e) => e.id === 'csp1-cumhuriyet-iri-atik-sikisma')!;
  const sanayi = PACK.find((e) => e.id === 'csp1-sanayi-agir-atik-hatti')!;
  const yesilvadi = PACK.find((e) => e.id === 'csp1-yesilvadi-park-hassasiyet')!;
  const cumAudit = audit.results.find((r) => r.eventId === cumhuriyet.id)!;
  const sanAudit = audit.results.find((r) => r.eventId === sanayi.id)!;
  const yvAudit = audit.results.find((r) => r.eventId === yesilvadi.id)!;

  record(assert(checks, cumAudit.score >= 90, `Cumhuriyet iri atık >= 90 (${cumAudit.score})`, 'Cumhuriyet düşük'));
  record(assert(checks, sanAudit.score >= 90, `Sanayi ağır atık >= 90 (${sanAudit.score})`, 'Sanayi düşük'));
  record(assert(checks, yvAudit.score >= 90, `Yeşilvadi park >= 90 (${yvAudit.score})`, 'Yeşilvadi düşük'));

  const forbiddenBlob = PACK.map((e) => e.title + e.sceneText).join(' ').toLowerCase();
  record(
    assert(
      checks,
      !['premium', 'satın al', 'paywall', 'kilitli'].some((w) => forbiddenBlob.includes(w)),
      'Forbidden words yok',
      'Forbidden kelime var',
    ),
  );

  record(
    assert(
      checks,
      PACK.every((e) => e.avoidPilotDays?.includes(1) !== false || !e.preferredPilotDays?.includes(1)),
      'Day 1 avoid veya preferred dışı',
      'Day 1 riskli event',
    ),
  );

  record(
    assert(
      checks,
      PACK.filter((e) => e.preferredPilotDays?.includes(2) && e.domain === 'container').length >= 3,
      'Gün 2 container uyumlu >= 3',
      'Gün 2 container yetersiz',
    ),
  );

  record(
    assert(
      checks,
      PACK.filter((e) => e.socialEchoText.trim().length >= 12).length >= 10,
      'Sosyal echo metni >= 10 event',
      'Sosyal echo yetersiz',
    ),
  );

  record(assert(checks, PACK.every((e) => e.advisorEchoText.includes('Ece')), 'Advisor echo tüm eventlerde', 'Ece eksik'));
  record(assert(checks, PACK.every((e) => e.reportEchoText.length > 10), 'Report echo tüm eventlerde', 'report eksik'));

  record(
    assert(
      checks,
      PACK.filter(
        (e) =>
          /yarın|yarin|ertesi gün|ertesi gun|sonraki gün|sonraki gun/i.test(e.carryOverText),
      ).length >= PACK.length - 1,
      'Carry-over zaman ifadesi',
      'carry-over ifade eksik',
    ),
  );

  record(
    assert(
      checks,
      PACK.filter((e) => /ama |fakat |ancak |bedel/i.test(e.tradeOffText)).length >= PACK.length - 1,
      'Trade-off bağlaçları',
      'trade-off ifade eksik',
    ),
  );

  for (const district of DISTRICTS) {
    const hasContainer = PACK.some(
      (e) => e.districtId === district && e.domain === 'container',
    );
    record(assert(checks, hasContainer, `${district} en az 1 container`, 'container mahalle eksik'));
  }

  record(
    assert(
      checks,
      PACK.filter((e) => e.districtId === 'merkez').some((e) => blobHas(e.sceneText + e.tags.join(' '), 'meydan') || blobHas(e.sceneText, 'çarşı') || blobHas(e.sceneText, 'belediye')),
      'Merkez karakter işaretleri',
      'Merkez karakter zayıf',
    ),
  );
  record(
    assert(
      checks,
      PACK.filter((e) => e.districtId === 'cumhuriyet').some((e) => blobHas(e.sceneText, 'esnaf') || blobHas(e.sceneText, 'apartman')),
      'Cumhuriyet karakter',
      'Cumhuriyet karakter zayıf',
    ),
  );
  record(
    assert(
      checks,
      PACK.filter((e) => e.districtId === 'sanayi').some((e) => blobHas(e.sceneText, 'atölye') || blobHas(e.sceneText, 'ağır')),
      'Sanayi karakter',
      'Sanayi karakter zayıf',
    ),
  );
  record(
    assert(
      checks,
      PACK.filter((e) => e.districtId === 'istasyon').some((e) => blobHas(e.sceneText, 'geçiş') || blobHas(e.sceneText, 'akşam') || blobHas(e.sceneText, 'durak')),
      'İstasyon karakter',
      'İstasyon karakter zayıf',
    ),
  );
  record(
    assert(
      checks,
      PACK.filter((e) => e.districtId === 'yesilvadi').some((e) => blobHas(e.sceneText, 'park') || blobHas(e.sceneText, 'çevre')),
      'Yeşilvadi karakter',
      'Yeşilvadi karakter zayıf',
    ),
  );

  record(
    assert(
      checks,
      buildContentSafetyPackStage1Summary().trim().length > 100,
      'Presentation summary dolu',
      'Summary boş',
    ),
  );
  record(
    assert(
      checks,
      buildContainerContentCoverageSummary().includes('Konteyner') &&
        containerCount >= 10,
      'Container coverage summary',
      'Coverage summary eksik',
    ),
  );

  const docs = readRepo('docs/crevia-content-safety-pack-stage-1.md');
  record(assert(checks, docs.includes('Aşama 1'), 'Docs mevcut', 'Docs eksik'));
  record(assert(checks, readRepo('package.json').includes('verify:content-safety-pack-stage-1'), 'package.json script', 'script eksik'));

  const roadmap = getFinalPolishRoadmapItemById('content-safety-pack-stage-1');
  record(assert(checks, roadmap != null, 'Roadmap stage-1 var', 'Roadmap eksik'));
  recordWarn(
    warn(
      checks,
      roadmap?.status === 'completed' || roadmap?.status === 'in_progress',
      'Roadmap status güncel',
      'Roadmap planned',
    ),
  );

  record(assert(checks, buildNextContentPackStep().includes('Aşama 2'), 'Next step Aşama 2', 'Next step hatalı'));
  record(assert(checks, SAVE_VERSION === 23, `SAVE_VERSION (${SAVE_VERSION})`, 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/generateDailyEventSet.ts').includes('applyDecision'), 'generateDailyEventSet applyDecision yok', 'n/a'));
  record(
    assert(
      checks,
      readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('mergePilotCatalogWithContentSafetyPack'),
      'Katalog entegrasyonu',
      'entegrasyon yok',
    ),
  );
  record(assert(checks, !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('contentPacks'), 'postPilot engine dokunulmadı', 'postPilot değişti'));
  record(assert(checks, CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS.length === PACK.length, 'EventCard dönüşüm sayısı', 'card sayısı uyumsuz'));
  record(assert(checks, !readRepo('src/core/contentPacks/index.ts').includes('collectEvent'), 'index script-only yok', 'index leak'));

  record(
    assert(
      checks,
      readRepo('docs/crevia-content-safety-pack-stage-1.md').includes('Runtime integration'),
      'Runtime integration notu',
      'integration notu eksik',
    ),
  );

  record(
    assert(
      checks,
      PACK.filter((e) => e.preferredPilotDays?.some((d) => d >= 3 && d <= 6)).length >= 10,
      'Gün 3-6 hazırlık eventleri',
      'Gün 3-6 yetersiz',
    ),
  );

  return { ok, warn: hasWarn, checks, auditSummary: audit };
}
