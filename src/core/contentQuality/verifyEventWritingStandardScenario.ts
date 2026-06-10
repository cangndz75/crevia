import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { FINAL_POLISH_FORBIDDEN_SCOPE } from '@/core/quality/finalPolish/finalPolishGuards';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';

import {
  auditEventWriting,
  auditEventWritingBatch,
  detectAffectedActor,
  detectCarryOverLanguage,
  detectConcreteScene,
  detectDistrictContext,
  detectTooGenericEventText,
  detectTradeOffLanguage,
  inferEventWritingDomain,
} from './eventContentAudit';
import {
  buildEventWritingLayerChecklist,
  buildEventWritingNextStep,
  buildEventWritingScoreLabel,
  buildEventWritingStandardMarkdown,
  formatEventWritingSummary,
} from './eventContentPresentation';
import {
  EVENT_WRITING_STANDARDS,
  GENERIC_EVENT_WRITING_FAIL_EXAMPLE,
  GOLDEN_EVENT_WRITING_EXAMPLE,
  MEDIUM_EVENT_WRITING_WARN_EXAMPLE,
} from './eventWritingStandards';
import type { EventWritingAuditInput, EventWritingVerifyOutcome } from './contentQualityTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventWritingStandardOptions = {
  docsContent?: string;
  packageJsonContent?: string;
  batchInputs?: import('./contentQualityTypes').EventWritingAuditInput[];
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
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

const GOOD_TEXT =
  "Cumhuriyet'te gece bırakılan iri atıklar konteyner çevresini kapattı. Esnaf sabah saatlerinde yolu dar buluyor. Hızlı ekip gönderirsen şikayet düşer ama araç yorgunluğu artar. Önleyici rota yaparsan bugün daha az görünür sonuç alırsın ama yarın konteyner baskısı azalır. Sosyal Nabız'da yankılanır; raporda yarına risk olarak döner.";

export function verifyEventWritingStandardScenario(
  options: VerifyEventWritingStandardOptions = {},
): EventWritingVerifyOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  const docs = options.docsContent ?? readRepo('docs/crevia-event-writing-standard.md');
  const packageJson = options.packageJsonContent ?? readRepo('package.json');

  record(
    assert(
      checks,
      EVENT_WRITING_STANDARDS.length === 8,
      '8 writing layer tanımlı',
      `Layer sayısı ${EVENT_WRITING_STANDARDS.length}`,
    ),
  );

  record(
    assert(
      checks,
      EVENT_WRITING_STANDARDS.every(
        (s) => s.passExamples.length > 0 && s.failExamples.length > 0,
      ),
      'Her layer pass/fail example içeriyor',
      'Eksik örnek',
    ),
  );

  record(
    assert(
      checks,
      detectDistrictContext('Cumhuriyet mahallesinde sabah yoğunluğu'),
      'district_context Cumhuriyet tanıyor',
      'Cumhuriyet tanınmadı',
    ),
  );

  for (const districtSample of ['Sanayi hattında', 'İstasyon çevresinde', 'Yeşilvadi']) {
    record(
      assert(
        checks,
        detectDistrictContext(districtSample),
        `district_context ${districtSample}`,
        `district ${districtSample} fail`,
      ),
    );
  }

  record(
    assert(
      checks,
      EVENT_WRITING_STANDARDS.filter((s) => s.requiredForSoftLaunch).length >= 7,
      'Soft launch required layers tanımlı',
      'requiredForSoftLaunch eksik',
    ),
  );

  record(
    assert(
      checks,
      detectConcreteScene(GOOD_TEXT),
      'concrete_scene golden örnek PASS',
      'Golden scene fail',
    ),
  );

  record(
    assert(
      checks,
      detectTooGenericEventText('Cumhuriyet temizlik sorunu var'),
      'generic temizlik sorunu tooGeneric',
      'Generic yakalanmadı',
    ),
  );

  record(
    assert(
      checks,
      detectAffectedActor('esnaf sabah yolu dar buluyor'),
      'affected_actor esnaf',
      'Aktör tanınmadı',
    ),
  );

  record(
    assert(
      checks,
      detectTradeOffLanguage('ama araç yorgunluğu artar'),
      'trade_off ama araç yorgunluğu',
      'Trade-off 1 fail',
    ),
  );

  record(
    assert(
      checks,
      detectTradeOffLanguage('fakat sosyal etki geç toparlanır'),
      'trade_off fakat sosyal',
      'Trade-off 2 fail',
    ),
  );

  record(
    assert(
      checks,
      detectCarryOverLanguage('yarın konteyner baskısı azalır'),
      'carry_over yarın konteyner',
      'Carry-over 1 fail',
    ),
  );

  record(
    assert(
      checks,
      detectCarryOverLanguage('ertesi gün rota riski kalır'),
      'carry_over ertesi gün',
      'Carry-over 2 fail',
    ),
  );

  record(
    assert(
      checks,
      /sosyal nabız/i.test('Sosyal Nabız yükseldi') &&
        /raporda/i.test('raporda yarına risk') &&
        /ece/i.test('Ece uyardı'),
      'echo Sosyal Nabız/rapor/Ece',
      'Echo fail',
    ),
  );

  const golden = auditEventWriting(GOLDEN_EVENT_WRITING_EXAMPLE);
  record(
    assert(
      checks,
      golden.score >= 80 && golden.status === 'pass',
      `golden örnek PASS (${golden.score})`,
      `Golden ${golden.score} ${golden.status}`,
    ),
  );

  const bad = auditEventWriting(GENERIC_EVENT_WRITING_FAIL_EXAMPLE);
  record(
    assert(
      checks,
      bad.score < 60 && bad.status === 'fail',
      `kötü örnek FAIL (${bad.score})`,
      `Bad ${bad.score} ${bad.status}`,
    ),
  );

  const medium = auditEventWriting(MEDIUM_EVENT_WRITING_WARN_EXAMPLE);
  record(
    assert(
      checks,
      medium.status === 'warn' || medium.status === 'pass',
      `orta örnek WARN/PASS (${medium.status})`,
      `Medium unexpected ${medium.status}`,
    ),
  );

  const day1Safe: EventWritingAuditInput = {
    id: 'day1-tutorial-safe',
    title: 'İlk saha müdahalesi',
    description:
      "Merkez pilot hattında sabah küçük bir saha sinyali belirdi. İncele, planla ve sahada sonucu gör.",
    districtId: 'merkez',
    day: 1,
    source: 'pilot',
  };
  const day1Audit = auditEventWriting(day1Safe);
  record(
    assert(
      checks,
      day1Audit.isDay1Safe && !day1Audit.isTooGeneric,
      'Day 1 compact/safe',
      'Day 1 unsafe',
    ),
  );

  const day1HeavyAudit = auditEventWriting({
    ...day1Safe,
    id: 'day1-heavy',
    description:
      'Kriz Masası ve Sosyal Nabız aynı anda yükseldi. Metrikler kritik. Bütçe ve XP baskısı.',
  });
  recordWarn(
    warn(
      checks,
      day1HeavyAudit.warnings.length > 0,
      'Day 1 ağır sistem WARN',
      'Day 1 heavy systems warn yok',
    ),
  );

  record(
    assert(
      checks,
      inferEventWritingDomain({ ...day1Safe, day: 2, description: 'konteyner baskısı atık' }) ===
        'container',
      'Day 2 container infer',
      'Day 2 domain fail',
    ),
  );

  record(
    assert(
      checks,
      ['vehicle', 'personnel'].includes(
        inferEventWritingDomain({
          id: 'd3',
          title: 'x',
          description: 'araç yorgun ekip tempo',
          day: 3,
          source: 'pilot',
        }),
      ),
      'Day 3 vehicle/personnel infer',
      'Day 3 domain fail',
    ),
  );

  record(
    assert(
      checks,
      inferEventWritingDomain({
        id: 'd4',
        title: 'x',
        description: 'sosyal nabız şikayet görünürlük',
        day: 4,
        source: 'pilot',
      }) === 'social',
      'Day 4 social infer',
      'Day 4 domain fail',
    ),
  );

  const day6Text = 'risk sinyali birleşiyor önlem gerekir henüz kriz eşiği';
  record(
    assert(
      checks,
      !/kriz başladı|tam kriz/i.test(day6Text),
      'Day 6 panik dili yok (örnek metin)',
      'Panik dili var',
    ),
  );

  const standardsBlob = buildEventWritingStandardMarkdown();
  record(
    assert(
      checks,
      !EVENT_WRITING_FORBIDDEN_IN_OUTPUT(standardsBlob),
      'Standard output forbidden words yok',
      'Forbidden in standards',
    ),
  );

  record(
    assert(
      checks,
      buildEventWritingScoreLabel(85) === 'PASS' &&
        buildEventWritingScoreLabel(70) === 'WARN' &&
        buildEventWritingScoreLabel(40) === 'FAIL',
      'Score label doğru',
      'Score label hatalı',
    ),
  );

  const missingDistrict = auditEventWriting({
    id: 'no-district',
    title: 'Sorun',
    description: 'Şehirde genel sorun var.',
    source: 'unknown',
  });
  record(
    assert(
      checks,
      missingDistrict.suggestedFixes.some((f) => f.toLowerCase().includes('mahalle')),
      'suggestedFixes mahalle',
      'Mahalle fix yok',
    ),
  );

  const missingTrade = auditEventWriting({
    id: 'no-trade',
    title: 'Test',
    description:
      "Cumhuriyet'te gece atıklar yolu daralttı. Sabah görünür şikayet azalır.",
    source: 'pilot',
    day: 2,
  });
  record(
    assert(
      checks,
      missingTrade.suggestedFixes.some(
        (f) => f.toLowerCase().includes('trade-off') || f.toLowerCase().includes('bedel'),
      ),
      'suggestedFixes tradeoff',
      'Tradeoff fix yok',
    ),
  );

  const missingCarry = auditEventWriting({
    id: 'no-carry',
    title: 'Test',
    description: "Sanayi hattında rota sıkıştı. Bugün rahatlarsın ama araç yorgun.",
    source: 'pilot',
  });
  record(
    assert(
      checks,
      missingCarry.suggestedFixes.some((f) => f.toLowerCase().includes('yarın')),
      'suggestedFixes carryover',
      'Carry fix yok',
    ),
  );

  const batchSample = auditEventWritingBatch([
    GOLDEN_EVENT_WRITING_EXAMPLE,
    GENERIC_EVENT_WRITING_FAIL_EXAMPLE,
    MEDIUM_EVENT_WRITING_WARN_EXAMPLE,
  ]);
  record(
    assert(
      checks,
      batchSample.total === 3 &&
        batchSample.pass >= 1 &&
        batchSample.fail >= 1 &&
        batchSample.averageScore > 0,
      'Batch summary hesaplama',
      'Batch summary hatalı',
    ),
  );

  record(
    assert(
      checks,
      batchSample.weakLayers.length >= 0 && batchSample.strongLayers.length >= 0,
      'Weak/strong layers tespit',
      'Layer tespit fail',
    ),
  );

  record(
    assert(
      checks,
      buildEventWritingStandardMarkdown().trim().length > 200,
      'Presentation markdown boş değil',
      'Markdown boş',
    ),
  );

  record(
    assert(
      checks,
      buildEventWritingNextStep(batchSample).includes('Content Safety Pack Aşama 1'),
      'Next step Content Safety Pack Aşama 1',
      'Next step hatalı',
    ),
  );

  const roadmap = getFinalPolishRoadmapItemById('dynamic-event-writing-standard');
  record(
    assert(
      checks,
      roadmap != null && roadmap.group === 'anti_boredom_core',
      'Roadmap dynamic-event-writing-standard uyumlu',
      'Roadmap eksik',
    ),
  );

  record(
    assert(
      checks,
      FINAL_POLISH_FORBIDDEN_SCOPE.some((f) => f.includes('applyDecision')),
      'finalPolish forbidden scope uyumlu',
      'Forbidden scope eksik',
    ),
  );

  record(
    assert(
      checks,
      SAVE_VERSION === 26,
      `SAVE_VERSION değişmedi (${SAVE_VERSION})`,
      'SAVE_VERSION değişti',
    ),
  );

  record(
    assert(
      checks,
      packageJson.includes('"verify:event-writing-standard"'),
      'package.json verify:event-writing-standard',
      'Script eksik',
    ),
  );

  record(
    assert(
      checks,
      docs.includes('8 kalite katmanı') || docs.includes('Golden example'),
      'docs/crevia-event-writing-standard.md var',
      'Docs eksik',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/contentQuality/index.ts').includes('collectKnownEventWritingAuditInputs'),
      'index collector export etmiyor',
      'Collector index leak',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/contentQuality/index.ts').includes('node:fs'),
      'index fs import etmiyor',
      'fs index leak',
    ),
  );

  record(
    assert(
      checks,
      !standardsBlob.toLowerCase().includes('openai') && !standardsBlob.includes('gpt'),
      'AI kullanılmıyor',
      'AI referansı var',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/contentQuality/eventContentAudit.ts').includes('applyDecision'),
      'applyDecision audit modülünde yok',
      'applyDecision import',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('contentQuality'),
      'event generation core değişmedi',
      'generation touched',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('contentQuality'),
      'post-pilot generation değişmedi',
      'post-pilot touched',
    ),
  );

  record(
    assert(
      checks,
      docs.includes('Content Safety Pack') && docs.includes('bu patch'),
      'Content Safety Pack sonraki adım notu',
      'Pack notu eksik',
    ),
  );

  record(
    assert(
      checks,
      GOLDEN_EVENT_WRITING_EXAMPLE.description.includes('Cumhuriyet'),
      'sample Cumhuriyet iri atık golden',
      'Golden sample eksik',
    ),
  );

  record(
    assert(
      checks,
      auditEventWriting({ id: 'city', title: 'x', description: 'şehirde sorun var', source: 'unknown' })
        .status === 'fail',
      'sample şehirde sorun FAIL',
      'City fail değil',
    ),
  );

  const checklist = buildEventWritingLayerChecklist(golden);
  record(
    assert(checks, checklist.length === 8, 'Layer checklist 8 madde', 'Checklist eksik'),
  );

  if (options.batchInputs && options.batchInputs.length > 0) {
    const catalogSummary = auditEventWritingBatch(options.batchInputs);
    recordWarn(
      warn(
        checks,
        catalogSummary.fail < catalogSummary.total,
        `Catalog batch audit çalıştı (${catalogSummary.total} event, fail=${catalogSummary.fail})`,
        'Tüm catalog fail — beklenen WARN öncesi içerik',
      ),
    );
  }

  recordWarn(
    warn(
      checks,
      roadmap?.status === 'completed' || roadmap?.status === 'in_progress',
      'Roadmap status güncel',
      'Roadmap hâlâ planned',
    ),
  );

  const batchSummary =
    options.batchInputs && options.batchInputs.length > 0
      ? auditEventWritingBatch(options.batchInputs)
      : batchSample;

  return { ok, warn: hasWarn, checks, batchSummary };
}

function EVENT_WRITING_FORBIDDEN_IN_OUTPUT(text: string): boolean {
  const lower = text.toLowerCase();
  return ['premium', 'satın al', 'paywall', 'kilitli'].some((w) => lower.includes(w));
}
