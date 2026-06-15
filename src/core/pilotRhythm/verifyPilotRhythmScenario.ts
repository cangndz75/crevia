import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  getFinalPolishRoadmapItemById,
} from '@/core/quality/finalPolish/finalPolishRoadmap';

import {
  PILOT_THEME_DEFINITIONS,
  PILOT_THEME_FORBIDDEN_WORDS,
} from './pilotRhythmConstants';
import {
  buildPilotThemeAdvisorLine,
  buildPilotThemeEmphasisTags,
  buildPilotThemeHubCardModel,
  buildPilotThemeReportLine,
  buildPilotThemeViewModel,
  getPilotThemeForDay,
  getPilotThemePrimaryDomain,
  shouldShowPilotThemeOnEvent,
  shouldShowPilotThemeOnHub,
  shouldShowPilotThemeOnReport,
} from './pilotRhythmPresentation';
import type { PilotThemeVerifyOutcome } from './pilotRhythmTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const MAX_SUMMARY_LEN = 220;

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

function blobHasForbidden(text: string): string | null {
  const lower = text.toLowerCase();
  return PILOT_THEME_FORBIDDEN_WORDS.find((w) => lower.includes(w)) ?? null;
}

export function verifyPilotThemeRhythmScenario(): PilotThemeVerifyOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const recordWarn = (pass: boolean) => {
    if (!pass) hasWarn = true;
  };

  record(
    assert(
      checks,
      PILOT_THEME_DEFINITIONS.length === 7,
      '7 theme definition var',
      `Beklenen 7, mevcut ${PILOT_THEME_DEFINITIONS.length}`,
    ),
  );

  const ids = PILOT_THEME_DEFINITIONS.map((d) => d.id);
  record(
    assert(
      checks,
      new Set(ids).size === ids.length,
      'Her gün unique id',
      'Duplicate theme id',
    ),
  );

  const domainByDay: Record<number, string> = {
    1: 'first_response',
    2: 'container_pressure',
    3: 'resource_fatigue',
    4: 'social_pulse',
    5: 'district_balance',
    6: 'crisis_signal',
    7: 'pilot_final',
  };

  for (const [dayStr, domain] of Object.entries(domainByDay)) {
    const day = Number(dayStr);
    const theme = getPilotThemeForDay(day);
    record(
      assert(
        checks,
        theme?.domain === domain,
        `Gün ${day} domain ${domain}`,
        `Gün ${day} domain uyumsuz`,
      ),
    );
  }

  const vm1 = buildPilotThemeViewModel(1);
  const vm7 = buildPilotThemeViewModel(7);
  const vm8 = buildPilotThemeViewModel(8);

  record(assert(checks, vm1?.visibility === 'compact', 'Day 1 visibility compact', 'Day 1 compact değil'));
  record(assert(checks, vm7?.visibility === 'final', 'Day 7 visibility final', 'Day 7 final değil'));
  record(assert(checks, vm8 === null, 'Day 8 null/hidden', 'Day 8 null değil'));

  for (const theme of PILOT_THEME_DEFINITIONS) {
    record(
      assert(
        checks,
        theme.title.length > 0 &&
          theme.hubHeadline.length > 0 &&
          theme.hubSummary.length > 0 &&
          theme.advisorHint.length > 0 &&
          theme.reportSummary.length > 0,
        `Gün ${theme.day} metin alanları dolu`,
        `Gün ${theme.day} boş alan`,
      ),
    );
    record(
      assert(
        checks,
        theme.hubSummary.length <= MAX_SUMMARY_LEN,
        `Gün ${theme.day} hubSummary uzunluk OK`,
        `Gün ${theme.day} hubSummary çok uzun`,
      ),
    );
    record(
      assert(
        checks,
        theme.maxVisibleThemeLines <= 2,
        `Gün ${theme.day} maxVisibleThemeLines <= 2`,
        `Gün ${theme.day} maxVisibleThemeLines fazla`,
      ),
    );
    record(
      assert(
        checks,
        theme.emphasisTags.length <= 3,
        `Gün ${theme.day} tags max 3`,
        `Gün ${theme.day} tags fazla`,
      ),
    );
  }

  record(
    assert(
      checks,
      buildPilotThemeViewModel(0) === null && getPilotThemeForDay(-1) === null,
      'buildPilotThemeViewModel null-safe',
      'Bozuk gün null değil',
    ),
  );

  const day1 = getPilotThemeForDay(1)!;
  record(
    assert(
      checks,
      day1.hiddenSignals.some((s) => s.includes('social') || s.includes('crisis')),
      'Day 1 hiddenSignals ileri sistemleri içerir',
      'Day 1 hiddenSignals eksik',
    ),
  );

  record(
    assert(
      checks,
      buildPilotThemeEmphasisTags(2).some((t) => t.toLowerCase().includes('konteyner')),
      'Day 2 emphasisTags container',
      'Day 2 container tag yok',
    ),
  );

  record(
    assert(
      checks,
      buildPilotThemeEmphasisTags(3).some((t) => t.toLowerCase().includes('araç') || t.toLowerCase().includes('ekip')),
      'Day 3 emphasisTags vehicle/personnel',
      'Day 3 kaynak tag yok',
    ),
  );

  record(
    assert(
      checks,
      buildPilotThemeEmphasisTags(4).some((t) => t.toLowerCase().includes('sosyal')),
      'Day 4 emphasisTags social',
      'Day 4 social tag yok',
    ),
  );

  record(
    assert(
      checks,
      buildPilotThemeEmphasisTags(5).some((t) => t.toLowerCase().includes('mahalle')),
      'Day 5 emphasisTags district',
      'Day 5 district tag yok',
    ),
  );

  const day6Blob = [
    getPilotThemeForDay(6)!.hubSummary,
    getPilotThemeForDay(6)!.reportSummary,
    getPilotThemeForDay(6)!.advisorHint,
  ].join(' ');
  record(
    assert(
      checks,
      buildPilotThemeEmphasisTags(6).some((t) => t.toLowerCase().includes('risk') || t.toLowerCase().includes('önlem')),
      'Day 6 emphasisTags crisis sinyal',
      'Day 6 crisis tag yok',
    ),
  );
  record(
    assert(
      checks,
      !/kriz başladı|kriz başlıyor|tam kriz/i.test(day6Blob),
      'Day 6 panik dili yok',
      'Day 6 panik dili var',
    ),
  );

  const day7Blob = [
    getPilotThemeForDay(7)!.hubHeadline,
    getPilotThemeForDay(7)!.hubSummary,
    getPilotThemeForDay(7)!.reportSummary,
  ].join(' ');
  record(
    assert(
      checks,
      /ana operasyon/i.test(day7Blob),
      'Day 7 ana operasyon geçiş dili',
      'Day 7 geçiş dili eksik',
    ),
  );

  const allText = PILOT_THEME_DEFINITIONS.map((d) =>
    [
      d.title,
      d.hubHeadline,
      d.hubSummary,
      d.advisorHint,
      d.reportSummary,
      ...d.emphasisTags,
    ].join(' '),
  ).join(' ');
  const forbiddenHit = blobHasForbidden(allText);
  record(
    assert(
      checks,
      forbiddenHit === null,
      'Forbidden words yok',
      `Forbidden word: ${forbiddenHit}`,
    ),
  );

  record(
    assert(
      checks,
      isCurrentSaveVersion(SAVE_VERSION),
      `SAVE_VERSION değişmedi (${SAVE_VERSION})`,
      'SAVE_VERSION değişti',
    ),
  );

  record(
    assert(
      checks,
      !shouldShowPilotThemeOnHub(8) && getPilotThemeForDay(9) === null,
      'Post-pilot günlere müdahale yok',
      'Post-pilot tema gösterimi',
    ),
  );

  const hubVm = buildPilotThemeHubCardModel(3);
  record(
    assert(
      checks,
      hubVm != null && hubVm.summary.split('\n').length <= 3,
      'Hub view model özet satır sınırı',
      'Hub view model özet fazla',
    ),
  );

  const reportLine = buildPilotThemeReportLine(2);
  record(
    assert(
      checks,
      reportLine != null && reportLine.length > 0,
      'Report view model satır üretir',
      'Report line boş',
    ),
  );

  record(
    assert(
      checks,
      buildPilotThemeViewModel(1)?.emphasisTags.length === 0,
      'Day 1 sade (hub compact tag yok)',
      'Day 1 fazla tag',
    ),
  );

  const roadmapItem = getFinalPolishRoadmapItemById('daily-theme-rhythm');
  record(
    assert(
      checks,
      roadmapItem != null && roadmapItem.group === 'anti_boredom_core',
      'finalPolish daily-theme-rhythm uyumlu',
      'Roadmap madde eksik',
    ),
  );

  const presentationBlob = [
    buildPilotThemeAdvisorLine(4) ?? '',
    buildPilotThemeReportLine(5) ?? '',
    buildPilotThemeHubCardModel(2)?.headline ?? '',
  ].join(' ');
  record(
    assert(
      checks,
      presentationBlob.trim().length > 0,
      'Presentation helper boş string üretmiyor',
      'Boş presentation',
    ),
  );

  const pkg = readRepo('package.json');
  record(
    assert(
      checks,
      pkg.includes('"verify:pilot-rhythm"'),
      'package.json verify:pilot-rhythm',
      'verify script eksik',
    ),
  );

  const docs = readRepo('docs/crevia-pilot-rhythm.md');
  record(
    assert(
      checks,
      docs.includes('Daily Theme Rhythm') || docs.includes('Gün Teması'),
      'docs/crevia-pilot-rhythm.md var',
      'Docs eksik',
    ),
  );

  record(
    assert(
      checks,
      shouldShowPilotThemeOnReport(7) && shouldShowPilotThemeOnEvent(2),
      'Report/Event show guard',
      'Show guard hatalı',
    ),
  );

  record(
    assert(
      checks,
      !shouldShowPilotThemeOnEvent(1),
      'Day 1 event theme gizli',
      'Day 1 event theme açık',
    ),
  );

  record(
    assert(
      checks,
      getPilotThemePrimaryDomain(4) === 'social_pulse',
      'getPilotThemePrimaryDomain',
      'Primary domain hatalı',
    ),
  );

  recordWarn(
    warn(
      checks,
      roadmapItem?.status === 'completed' || roadmapItem?.status === 'in_progress',
      'Roadmap status güncel',
      'Roadmap daily-theme-rhythm hâlâ planned — patch sonrası completed yapılabilir',
    ),
  );

  return { ok, warn: hasWarn, checks };
}
