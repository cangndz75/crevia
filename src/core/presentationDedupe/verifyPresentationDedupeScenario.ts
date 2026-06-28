import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import {
  buildReportReplayPresentation,
  dedupeReportReplayItems,
} from '@/core/reportReplay/reportReplayPresentation';
import { dedupeMiniCityFeedItems } from '@/features/hub/utils/centerMiniCityFeedPresentation';
import { buildHubEceLine, buildEceMemorySnapshot, isDuplicateEceLine } from '@/core/eceTone/eceTonePresentation';
import { dedupePeriodGoalCopy } from '@/core/periodGoals/periodGoalPresentation';
import { buildDistrictFeedWatchCopy } from '@/core/districtPersonality';
import {
  buildAvoidLines,
  isSameMessage,
  lineDuplicatesAvoidLines,
  normalizePresentationText,
} from './presentationDedupe';
import {
  REPORT_STRATEGIC_COMPACT_INSIGHT_MAX,
  selectVisibleReportStrategicInsights,
} from './reportCompactInsightPresentation';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

export function verifyPresentationDedupeScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(
    checks,
    isSameMessage('Ekip temposu izlenmeli.', 'Ekip temposu  izlenmeli'),
    'trim punctuation duplicate',
    'ok',
  );
  assert(
    checks,
    normalizePresentationText('Ekip temposu izlenmeli') ===
      normalizePresentationText('EKİP TEMPOSU izlenmeli.'),
    'locale-safe normalize',
    'ok',
  );
  assert(
    checks,
    !isSameMessage('Ekip temposu yarına baskı taşıyor.', 'Ekip temposu bakım kuyruğunda takip adayı.'),
    'distinct meaning not exact duplicate',
    'ok',
  );

  const replayAvoid = buildAvoidLines(
    'Yarına hazırlık sinyali izlenmeli.',
    'Bugün dengeli operatör çizgisinde kaldın.',
  );
  const replay = buildReportReplayPresentation({
    day: 5,
    decision: { decisionLabel: 'Dengeli Plan', eventId: 'evt-dedupe' },
    tomorrowPreparationLine: 'Yarına hazırlık sinyali izlenmeli.',
    managementStyleLine: 'Bugün dengeli operatör çizgisinde kaldın.',
    maintenanceActiveCount: 2,
    avoidLines: replayAvoid,
  });
  const replayDup = replay.items.some(
    (item) =>
      lineDuplicatesAvoidLines(item.description, ['Yarına hazırlık sinyali izlenmeli.']) ||
      lineDuplicatesAvoidLines(item.description, ['Bugün dengeli operatör çizgisinde kaldın.']),
  );
  assert(checks, !replayDup, 'report replay avoids insight exact copy', replayDup ? 'duplicate found' : 'ok');

  const strategic = selectVisibleReportStrategicInsights(
    {
      operationalTempoLine: 'Ekip temposu yarına baskı taşıyor.',
      tomorrowPreparationLine: 'Hazırlık sinyali izlenmeli.',
      periodGoalImpactLine: 'Şehir gündemi baskı altında.',
      districtMemoryInsightLine: 'Mahalle hafızası güven izi taşıyor.',
      managementStyleLine: 'Bugünkü yönetim tarzın dengeli kaldı.',
      dominantStrategyNote: 'Strateji notu tekrar etmesin.',
      districtNeglectRecoveryNote: null,
      day8StrategicContentNote: null,
      cityRhythmNote: null,
      cityMemoryNote: null,
      followUpActionHint: null,
      followUpExecutionNote: null,
      positiveComebackNote: null,
    },
    ['Ekip temposu yarına baskı taşıyor.'],
    REPORT_STRATEGIC_COMPACT_INSIGHT_MAX,
  );
  assert(
    checks,
    strategic.size <= REPORT_STRATEGIC_COMPACT_INSIGHT_MAX,
    'report compact insight max limit',
    `${strategic.size}`,
  );
  assert(
    checks,
    !strategic.has('operationalTempo'),
    'report compact insight skips replay duplicate',
    strategic.has('operationalTempo') ? 'shown' : 'hidden',
  );

  const feedCandidates = dedupeMiniCityFeedItems(
    [
      {
        id: 'feed-maint',
        type: 'fieldUpdate',
        title: 'Hazırlık Takibi',
        subtitle: 'Ekip temposu izleniyor.',
        sourceLabel: 'Hazırlık Sinyali',
        tone: 'warning',
        priority: 72,
        dedupeKey: 'maintenance:watch',
      },
      {
        id: 'feed-impact',
        type: 'recentImpact',
        title: "Cumhuriyet'te güven toparlanıyor.",
        subtitle: 'Son müdahale etkili.',
        sourceLabel: 'Son Etki',
        tone: 'positive',
        priority: 100,
        dedupeKey: 'recentImpact:1',
      },
      {
        id: 'feed-social',
        type: 'socialPulse',
        title: 'Sosyal nabız hareketli.',
        subtitle: 'Beklenti artmadan görünür takip gerekebilir.',
        sourceLabel: 'Sosyal Nabız',
        tone: 'mixed',
        priority: 86,
        dedupeKey: 'socialPulse:1',
      },
    ],
    ['Hazırlık Takibi'],
  );
  assert(
    checks,
    feedCandidates.length === 2 &&
      feedCandidates.some((item) => item.id === 'feed-impact') &&
      !feedCandidates.some((item) => item.id === 'feed-maint'),
    'mini feed dedupes hero overlap',
    feedCandidates.map((item) => item.id).join(','),
  );

  const districtFeed = buildDistrictFeedWatchCopy({
    districtName: 'Cumhuriyet',
    day: 5,
    fragile: true,
    outcomeBand: 'warning',
    avoidLines: ["Cumhuriyet'te güven toparlanıyor."],
  });
  assert(
    checks,
    districtFeed?.title !== "Cumhuriyet'te güven toparlanıyor.",
    'district feed copy not exact recent impact title',
    districtFeed?.title ?? 'null',
  );

  const eceMemory = buildEceMemorySnapshot({ day: 5 });
  const eceLine = buildHubEceLine({
    memory: eceMemory,
    context: { day: 5, avoidLines: ['Saha hazırlığını güçlendir.'] },
    seed: 'dedupe-test',
    avoidLines: ['Saha hazırlığını güçlendir.'],
  });
  assert(
    checks,
    Boolean(eceLine) && !isDuplicateEceLine(eceLine, ['Saha hazırlığını güçlendir.']),
    'ece hint avoids surface headline duplicate',
    eceLine ?? 'null',
  );

  assert(
    checks,
    !dedupePeriodGoalCopy('Tamamen farklı satır', ['başka satır']),
    'period goal dedupe allows distinct copy',
    'ok',
  );
  assert(
    checks,
    dedupePeriodGoalCopy('Aynı satır', ['Aynı satır']),
    'period goal dedupe blocks exact copy',
    'ok',
  );

  assert(checks, dedupeReportReplayItems('test', ['test']), 'replay dedupe helper', 'ok');
  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);

  assert(
    checks,
    lineDuplicatesAvoidLines('Hazırlık Takibi', ['Hazırlık Takibi']),
    'maintenance feed overlaps hub signal title',
    'ok',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
