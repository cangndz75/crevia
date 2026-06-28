import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';
import { inferDecisionKindFromText } from '@/core/playerStyle/playerStylePresentation';

import type { MemoryImpactChip, ReportReplayStylePattern } from './reportReplayMemoryTypes';

const STYLE_CHIP_LABELS: Record<string, string> = {
  fast_response: 'Hızlı müdahale',
  preventive_route: 'Önleyici plan',
  communication_first: 'Görünür hizmet',
  monitor_only: 'Risk izleme',
  resource_heavy: 'Kaynak koruma',
  balanced_dispatch: 'Dengeli operatör',
};

function countRecentKinds(
  history: StrategyHistoryStateV1['decisionHistory'],
  currentDay: number,
  window = 3,
): Map<string, number> {
  const counts = new Map<string, number>();
  const recent = history.filter((r) => r.day < currentDay).slice(-window * 3);
  const days = new Set(recent.map((r) => r.day));
  const windowDays = [...days].sort((a, b) => b - a).slice(0, window);

  for (const record of recent) {
    if (!windowDays.includes(record.day)) continue;
    const kind =
      record.selectedDecisionKind ??
      inferDecisionKindFromText(record.decisionLabel) ??
      'balanced_dispatch';
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return counts;
}

function buildMainLine(
  dominantKind: string,
  count: number,
  window: number,
): string {
  const label = STYLE_CHIP_LABELS[dominantKind] ?? 'Dengeli operatör';
  if (dominantKind === 'fast_response' && count >= 2) {
    return `Son ${window} günde hızlı müdahale eğilimin güçlendi.`;
  }
  if (dominantKind === 'resource_heavy' && count >= 2) {
    return 'Kaynak koruma kararların bakım riskini düşürdü ama bazı müdahaleleri yavaşlattı.';
  }
  if (dominantKind === 'communication_first' && count >= 2) {
    return 'Mahalle güvenini koruyorsun, fakat ekip yorgunluğu birikiyor.';
  }
  if (dominantKind === 'preventive_route' && count >= 2) {
    return 'Önleyici plan çizgin baskıyı erken yakalıyor; tempo bazen düşüyor.';
  }
  return `${label} çizgisi son günlerde belirginleşti.`;
}

export function buildReportReplayStylePattern(
  strategyHistory: StrategyHistoryStateV1 | null | undefined,
  currentDay: number,
  playerStyleLabel?: string | null,
  avoidLines: string[] = [],
): ReportReplayStylePattern {
  if (currentDay < 3) {
    return { visible: false, mainLine: '', styleChips: [] };
  }

  const history = strategyHistory?.decisionHistory ?? [];
  if (history.length < 2) {
    if (playerStyleLabel && currentDay >= 8) {
      const mainLine = `Yönetim çizgin ${playerStyleLabel.toLowerCase()} eğilimini taşıyor.`;
      if (lineDuplicatesAvoidLines(mainLine, avoidLines)) {
        return { visible: false, mainLine: '', styleChips: [] };
      }
      return {
        visible: true,
        mainLine,
        styleChips: [{ key: 'style', label: playerStyleLabel, tone: 'teal' }],
      };
    }
    return { visible: false, mainLine: '', styleChips: [] };
  }

  const window = currentDay >= 8 ? 3 : 2;
  const counts = countRecentKinds(history, currentDay, window);
  let dominantKind = 'balanced_dispatch';
  let maxCount = 0;
  for (const [kind, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      dominantKind = kind;
    }
  }

  if (maxCount < 2 && currentDay < 8) {
    return { visible: false, mainLine: '', styleChips: [] };
  }

  const mainLine = buildMainLine(dominantKind, maxCount, window);
  if (lineDuplicatesAvoidLines(mainLine, avoidLines)) {
    return { visible: false, mainLine: '', styleChips: [] };
  }

  const styleChips: MemoryImpactChip[] = [];
  const sortedKinds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [kind] of sortedKinds) {
    const label = STYLE_CHIP_LABELS[kind];
    if (label && !lineDuplicatesAvoidLines(label, avoidLines)) {
      styleChips.push({ key: kind, label, tone: kind === 'fast_response' ? 'warning' : 'teal' });
      avoidLines.push(label);
    }
  }

  return {
    visible: true,
    mainLine,
    styleChips: styleChips.slice(0, 2),
  };
}
