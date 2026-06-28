import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import { DISTRICT_PERSONALITY_BINDING_DEFINITIONS } from './districtPersonalityBindingConstants';
import { deriveDistrictPersonalityKey } from './districtPersonalityBindingModel';
import {
  buildDistrictFeedWatchCopy,
  buildDistrictMemoryReportInsight,
  buildDistrictPersonalityEceHint,
  buildDistrictPersonalityPresentation,
  buildDistrictReactionFlavor,
  buildDistrictReplayFlavorLine,
  dedupeDistrictPersonalityCopy,
} from './districtPersonalityBindingPresentation';
import type { DistrictPersonalityKey } from './districtPersonalityBindingTypes';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

const PERSONALITY_KEYS = Object.keys(
  DISTRICT_PERSONALITY_BINDING_DEFINITIONS,
) as DistrictPersonalityKey[];

export function verifyDistrictPersonalityBindingScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);

  for (const key of PERSONALITY_KEYS) {
    const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[key];
    assert(
      checks,
      Boolean(definition.label && definition.shortTrait),
      `${key} definition copy`,
      definition.label || 'missing',
    );
  }

  const civicFlavor = buildDistrictReactionFlavor({
    districtId: 'cumhuriyet',
    districtName: 'Cumhuriyet',
    outcomeBand: 'positive',
  });
  assert(
    checks,
    civicFlavor.title === DISTRICT_PERSONALITY_BINDING_DEFINITIONS.civic_core.result.positive.title,
    'civic result flavor title',
    civicFlavor.title,
  );

  const marketFlavor = buildDistrictReactionFlavor({
    districtId: 'sanayi',
    districtName: 'Sanayi',
    outcomeBand: 'positive',
  });
  assert(
    checks,
    marketFlavor.title === DISTRICT_PERSONALITY_BINDING_DEFINITIONS.market_pressure.result.positive.title,
    'market result flavor title',
    marketFlavor.title,
  );

  const unknown = buildDistrictPersonalityPresentation({
    districtId: 'unknown-zone',
    districtName: 'Bilinmeyen Bölge',
  });
  assert(
    checks,
    unknown.personalityKey === 'balanced_unknown',
    'unknown district fallback',
    unknown.personalityKey,
  );
  assert(
    checks,
    unknown.label.length > 0 && unknown.shortTrait.length > 0,
    'unknown fallback non-empty',
    unknown.label,
  );

  const civic = deriveDistrictPersonalityKey({
    districtId: 'cumhuriyet',
    districtName: 'Cumhuriyet',
  });
  const sanayi = deriveDistrictPersonalityKey({
    districtId: 'sanayi',
    districtName: 'Sanayi',
  });
  assert(checks, civic === 'civic_core', 'cumhuriyet civic_core', civic);
  assert(checks, sanayi === 'market_pressure', 'sanayi market_pressure', sanayi);

  const reportInsight = buildDistrictMemoryReportInsight({
    districtName: 'Cumhuriyet',
    districtId: 'cumhuriyet',
    day: 5,
    outcomeBand: 'positive',
    avoidLines: [],
  });
  const reportDuplicate = buildDistrictMemoryReportInsight({
    districtName: 'Cumhuriyet',
    districtId: 'cumhuriyet',
    day: 5,
    outcomeBand: 'positive',
    avoidLines: [reportInsight?.line ?? ''],
  });
  assert(
    checks,
    Boolean(reportInsight?.line),
    'report mahalle hafızası line',
    reportInsight?.line?.slice(0, 32) ?? 'empty',
  );
  assert(
    checks,
    reportDuplicate == null,
    'report mahalle hafızası dedupe',
    'ok',
  );

  const replayCity = buildDistrictReplayFlavorLine({
    districtName: 'Sanayi',
    districtId: 'sanayi',
    day: 4,
    replayKind: 'cityImpact',
    avoidLines: [],
  });
  const replayDup = buildDistrictReplayFlavorLine({
    districtName: 'Sanayi',
    districtId: 'sanayi',
    day: 4,
    replayKind: 'cityImpact',
    avoidLines: [replayCity ?? ''],
  });
  assert(checks, Boolean(replayCity), 'replay city flavor', replayCity ?? 'empty');
  assert(checks, replayDup == null, 'replay duplicate guard', 'ok');

  const feed = buildDistrictFeedWatchCopy({
    districtName: 'Cumhuriyet',
    day: 3,
    fragile: true,
    outcomeBand: 'warning',
    avoidLines: [],
  });
  assert(checks, Boolean(feed?.title && feed.subtitle), 'feed district watch copy', feed?.title ?? 'empty');

  const ece = buildDistrictPersonalityEceHint({
    districtName: 'Cumhuriyet',
    day: 4,
    avoidLines: [],
  });
  assert(
    checks,
    Boolean(ece && ece.length <= 118),
    'ece hint max length',
    String(ece?.length ?? 0),
  );

  assert(
    checks,
    dedupeDistrictPersonalityCopy('test', ['test']),
    'dedupe detects exact match',
    'ok',
  );

  const socialDomainOnly = buildDistrictReactionFlavor({
    districtId: 'social-only',
    districtName: 'Sosyal',
    outcomeBand: 'neutral',
  });
  assert(
    checks,
    socialDomainOnly.title.length > 0,
    'neutral flavor non-empty',
    socialDomainOnly.title,
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
