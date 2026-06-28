import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import {
  buildReportReplayPresentation,
  dedupeReportReplayItems,
  selectReportReplayHighlights,
  buildReportReplayItems,
} from './reportReplayPresentation';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

export function verifyReportReplayScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const empty = buildReportReplayPresentation({ day: 1 });
  assert(checks, empty.items.length >= 3, 'empty fallback min 3 items', `${empty.items.length}`);
  assert(checks, empty.items.length <= 5, 'max 5 items', `${empty.items.length}`);
  assert(
    checks,
    empty.items.every((item) => item.title.length > 0 && item.description.length > 0),
    'titles and descriptions non-empty',
    'ok',
  );

  const rich = buildReportReplayPresentation({
    day: 5,
    decision: {
      eventTitle: 'Konteyner Baskısı',
      decisionLabel: 'Dengeli Plan',
      neighborhoodName: 'Cumhuriyet',
      eventId: 'evt-1',
    },
    cityReaction: {
      shortSummary: 'İlk müdahale mahallede görünür etki oluşturdu.',
      reportMemoryLine: 'Mahalle hafızasına yeni iz eklendi.',
      tone: 'positive',
    },
    metrics: { publicSatisfaction: 64, staffMorale: 55, budget: 70000 },
    maintenanceActiveCount: 2,
    maintenanceCriticalCount: 0,
    periodGoalTitle: 'Saha Hazırlığını Güçlendir',
    periodGoalProgressLabel: 'Baskı altında',
    periodGoalImpactLine: 'Bugünkü kararlar saha hazırlığı hedefinde baskıyı azalttı.',
    managementStyleLine: 'Bugün dengeli operatör çizgisinde kaldın.',
    tomorrowPreparationLine: 'Yarına hazırlık sinyali izlenmeli.',
    tomorrowRiskLine: 'Ekip temposu yeni günün ilk kararında belirleyici olabilir.',
    cliffhangerLine: 'Yarın ilk hamle kaynak dengesini belirleyebilir.',
    socialEchoMessage: 'Görünür hizmet güven algısına olumlu yansıdı.',
  });

  assert(checks, rich.items.length >= 3 && rich.items.length <= 5, 'rich context 3-5 items', `${rich.items.length}`);
  assert(
    checks,
    rich.items.some((item) => item.type === 'operation' || item.type === 'decision'),
    'rich has operation/decision',
    rich.items.map((i) => i.type).join(','),
  );
  assert(
    checks,
    !rich.items.some((item) => item.description.includes('Dashboard güncellendi')),
    'no banned copy',
    'ok',
  );

  const dup = dedupeReportReplayItems('Yarına hazırlık sinyali izlenmeli.', [
    'Yarına hazırlık sinyali izlenmeli.',
  ]);
  assert(checks, dup, 'duplicate dedupe works', 'ok');

  const candidates = buildReportReplayItems({
    day: 4,
    decision: { decisionLabel: 'Hızlı Müdahale', eventId: 'e2' },
    periodGoalImpactLine: 'Şehir gündemine etki etti.',
    periodGoalTitle: 'Kaynak Baskısını Dengele',
    periodGoalProgressLabel: 'İlerliyor',
  });
  const selected = selectReportReplayHighlights(candidates, {
    day: 4,
    periodGoalImpactLine: 'Şehir gündemine etki etti.',
  });
  const periodDup = selected.find((item) => item.type === 'periodGoal');
  assert(
    checks,
    !periodDup || !periodDup.description.includes('Şehir gündemine etki etti'),
    'period goal not duplicate insight',
    periodDup?.description ?? 'hidden',
  );

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`);
  assert(checks, rich.title === 'Gün Akışı', 'section title', rich.title);

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
