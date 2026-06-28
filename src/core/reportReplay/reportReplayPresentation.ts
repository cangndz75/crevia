import type {
  ReportReplayContextInput,
  ReportReplayItem,
  ReportReplayItemType,
  ReportReplayPresentation,
  ReportReplayTone,
} from './reportReplayTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

const MIN_ITEMS = 3;
const MAX_ITEMS = 5;
const MAX_PER_SOURCE = 2;
const DESC_LIMIT = 110;

function clamp(text: string, max = DESC_LIMIT): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function dedupeReportReplayItems(
  line: string,
  avoidLines: string[] = [],
): boolean {
  return lineDuplicatesAvoidLines(line, avoidLines);
}

function acceptItem(
  item: ReportReplayItem | null,
  avoidLines: string[],
  usedKeys: Set<string>,
  sourceCounts: Map<string, number>,
): ReportReplayItem | null {
  if (!item) return null;
  if (usedKeys.has(item.dedupeKey)) return null;
  const sourceCount = sourceCounts.get(item.sourceLabel) ?? 0;
  if (sourceCount >= MAX_PER_SOURCE) return null;
  if (dedupeReportReplayItems(item.title, avoidLines)) return null;
  if (dedupeReportReplayItems(item.description, avoidLines)) return null;
  usedKeys.add(item.dedupeKey);
  sourceCounts.set(item.sourceLabel, sourceCount + 1);
  avoidLines.push(item.title, item.description);
  return item;
}

function timeLabelFor(type: ReportReplayItemType, index: number): string {
  const labels = ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Gece'];
  return labels[Math.min(index, labels.length - 1)];
}

function buildOperationReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const district = input.decision?.neighborhoodName?.trim() || 'şehir merkezinde';
  const eventTitle = input.decision?.eventTitle?.trim();
  const description = eventTitle
    ? clamp(`${district} bölgesinde ${eventTitle.toLowerCase()} sinyali öne çıktı.`)
    : clamp(`${district} bölgesinde ekip temposu ve sosyal tepki sinyali öne çıktı.`);

  return {
    id: `replay-operation-${input.day}`,
    type: 'operation',
    title: 'Gün ilk operasyonla açıldı.',
    description,
    timeLabel: timeLabelFor('operation', 0),
    sourceLabel: 'Operasyon',
    tone: 'strategic',
    icon: 'flash-outline',
    priority: 100,
    dedupeKey: `operation:${input.decision?.eventId ?? input.day}`,
  };
}

function buildDecisionReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const label = input.decision?.decisionLabel?.trim();
  if (!label) return null;

  const lower = label.toLowerCase();
  let description = 'Risk büyütülmeden kaynak temposu korunmaya çalışıldı.';
  if (lower.includes('hızlı') || lower.includes('acil')) {
    description = 'Hızlı müdahale çizgisi tercih edildi.';
  } else if (lower.includes('önley') || lower.includes('plan')) {
    description = 'Önleyici plan ile yük kontrollü tutuldu.';
  } else if (lower.includes('görünür') || lower.includes('sosyal')) {
    description = 'Görünür hizmet vurgusu öne çıktı.';
  }

  return {
    id: `replay-decision-${input.day}`,
    type: 'decision',
    title: clamp(`${label} seçildi.`, 48),
    description: clamp(description),
    timeLabel: timeLabelFor('decision', 1),
    sourceLabel: 'Karar',
    tone: 'neutral',
    icon: 'git-branch-outline',
    priority: 95,
    dedupeKey: `decision:${label}`,
  };
}

function buildFieldReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const summary =
    input.cityReaction?.shortSummary?.trim() ||
    input.cityReaction?.headline?.trim() ||
    'İlk müdahale mahallede görünür etki oluşturdu.';

  return {
    id: `replay-field-${input.day}`,
    type: 'field',
    title: 'Ekip sahaya çıktı.',
    description: clamp(summary),
    timeLabel: timeLabelFor('field', 2),
    sourceLabel: 'Saha',
    tone: input.cityReaction?.tone ?? 'mixed',
    icon: 'walk-outline',
    priority: 88,
    dedupeKey: `field:${input.decision?.eventId ?? input.day}`,
  };
}

function buildCityImpactReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const satisfaction = input.metrics?.publicSatisfaction ?? 58;
  const morale = input.metrics?.staffMorale ?? 58;
  const memoryLine = input.cityReaction?.reportMemoryLine?.trim();
  const echoLine = input.cityEchoLine?.trim() || input.decisionImpactLine?.trim();

  let title = 'Şehir etkisi izlendi.';
  let description =
    input.districtPersonalityCityImpactLine?.trim() ||
    memoryLine ||
    echoLine ||
    'Gün sonu sinyalleri dengeli; kaynak ve güven birlikte takip ediliyor.';
  let tone: ReportReplayTone = 'neutral';

  if (satisfaction >= 62) {
    title = 'Güven toparlanmaya başladı.';
    description =
      input.districtPersonalityCityImpactLine?.trim() ||
      memoryLine ||
      'Sosyal nabız sakinleşti, ancak kaynak baskısı izlenmeli.';
    tone = 'positive';
  } else if (satisfaction < 50 || morale < 48) {
    title = 'Şehir baskı altında kaldı.';
    description =
      input.districtPersonalityCityImpactLine?.trim() ||
      memoryLine ||
      echoLine ||
      'Güven ve kaynak sinyalleri yarın için izlenmeli.';
    tone = 'warning';
  }

  return {
    id: `replay-city-impact-${input.day}`,
    type: 'cityImpact',
    title: clamp(title, 52),
    description: clamp(description),
    timeLabel: timeLabelFor('cityImpact', 3),
    sourceLabel: 'Şehir Etkisi',
    tone,
    icon: 'pulse-outline',
    priority: 82,
    dedupeKey: `cityImpact:${normalizeLine(description).slice(0, 24)}`,
  };
}

function buildSocialEchoReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const line = input.districtPersonalitySocialLine?.trim() || input.socialEchoMessage?.trim() || input.cityReaction?.socialEchoLine?.trim();
  if (!line) return null;

  return {
    id: `replay-social-${input.day}`,
    type: 'socialEcho',
    title: input.socialEchoTitle?.trim() || 'Mahalle müdahaleyi fark etti.',
    description: clamp(line),
    timeLabel: timeLabelFor('socialEcho', 3),
    sourceLabel: 'Sosyal Nabız',
    tone: 'positive',
    icon: 'chatbubbles-outline',
    priority: 70,
    dedupeKey: `socialEcho:${normalizeLine(line).slice(0, 24)}`,
  };
}

function buildMaintenanceReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const count = input.maintenanceActiveCount ?? 0;
  if (count <= 0) return null;

  const critical = (input.maintenanceCriticalCount ?? 0) > 0;
  const description =
    input.maintenanceEconomyReplayLine?.trim() ||
    input.districtPersonalityMaintenanceLine?.trim() ||
    input.maintenanceSummaryLine?.trim() ||
    (critical
      ? 'Kritik hazırlık sinyali bakım kuyruğunda izlenmeye alındı.'
      : 'Ekip temposu bakım kuyruğunda takip adayı olarak kaldı.');

  return {
    id: `replay-maintenance-${input.day}`,
    type: 'maintenance',
    title: 'Hazırlık sinyali yarına taşındı.',
    description: clamp(description),
    timeLabel: timeLabelFor('maintenance', 4),
    sourceLabel: 'Hazırlık',
    tone: critical ? 'critical' : 'warning',
    icon: 'construct-outline',
    priority: 78,
    dedupeKey: `maintenance:${count}:${critical ? 'critical' : 'watch'}`,
    chips: [
      {
        label: 'Takip',
        value: `${count} aday`,
        tone: critical ? 'critical' : 'warning',
      },
    ],
  };
}

function buildPeriodGoalReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const title = input.periodGoalTitle?.trim();
  if (!title || input.day < 2) return null;

  const progress = input.periodGoalProgressLabel?.trim() || 'izleniyor';
  const progressPhrase = progress.toLowerCase().includes('ilerliyor')
    ? progress.toLowerCase()
    : `${progress.toLowerCase()} ilerliyor`;
  const description = clamp(`${title} hedefi ${progressPhrase}.`);

  return {
    id: `replay-period-goal-${input.day}`,
    type: 'periodGoal',
    title: 'Şehir gündemine etki etti.',
    description,
    timeLabel: timeLabelFor('periodGoal', 4),
    sourceLabel: 'Şehir Gündemi',
    tone: progress.includes('Baskı') || progress.includes('Risk') ? 'warning' : 'strategic',
    icon: 'flag-outline',
    priority: 72,
    dedupeKey: `periodGoal:${title}`,
  };
}

function buildPlayerStyleReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const label = input.playerStyleLabel?.trim();
  if (!label || input.day < 2) return null;
  if (input.managementStyleLine?.trim()) return null;

  return {
    id: `replay-player-style-${input.day}`,
    type: 'playerStyle',
    title: 'Yönetici çizgin netleşiyor.',
    description: clamp(`Bugünkü kararların ${label} eğilimini güçlendirdi.`),
    timeLabel: timeLabelFor('playerStyle', 4),
    sourceLabel: 'Yönetici Tarzı',
    tone: 'strategic',
    icon: 'person-outline',
    priority: 65,
    dedupeKey: `playerStyle:${label}`,
  };
}

function buildTomorrowRiskReplayItem(
  input: ReportReplayContextInput,
): ReportReplayItem | null {
  const line =
    input.tomorrowRiskLine?.trim() ||
    input.cityReaction?.nextRiskHint?.trim() ||
    input.tomorrowRiskSupportLine?.trim();
  if (!line) return null;

  return {
    id: `replay-tomorrow-${input.day}`,
    type: 'tomorrowRisk',
    title: 'Yarın için kaynak baskısı izlenmeli.',
    description: clamp(line),
    timeLabel: timeLabelFor('tomorrowRisk', 4),
    sourceLabel: 'Yarın Riski',
    tone: 'warning',
    icon: 'alert-circle-outline',
    priority: 68,
    dedupeKey: `tomorrowRisk:${normalizeLine(line).slice(0, 24)}`,
  };
}

function buildFallbackItems(): ReportReplayItem[] {
  return [
    {
      id: 'replay-fallback-operation',
      type: 'operation',
      title: 'Gün sakin tamamlandı.',
      description:
        'Şehir sinyalleri izleniyor; yeni operasyonlar geldikçe akış burada görünecek.',
      sourceLabel: 'Operasyon',
      tone: 'neutral',
      icon: 'sunny-outline',
      priority: 10,
      dedupeKey: 'fallback:operation',
    },
    {
      id: 'replay-fallback-city',
      type: 'cityImpact',
      title: 'Şehir dengede kaldı.',
      description: 'Günlük operasyon ritmi sakin; yeni kararlar akışı canlandırır.',
      sourceLabel: 'Şehir Etkisi',
      tone: 'neutral',
      icon: 'pulse-outline',
      priority: 9,
      dedupeKey: 'fallback:city',
    },
    {
      id: 'replay-fallback-tomorrow',
      type: 'tomorrowRisk',
      title: 'Yarın için hazırlık izleniyor.',
      description: 'İlk karar, günün bıraktığı sinyallere göre şekillenecek.',
      sourceLabel: 'Yarın Riski',
      tone: 'neutral',
      icon: 'time-outline',
      priority: 8,
      dedupeKey: 'fallback:tomorrow',
    },
  ];
}

export function buildReportReplayItems(
  input: ReportReplayContextInput,
): ReportReplayItem[] {
  const avoidLines = [...(input.avoidLines ?? [])];
  if (input.periodGoalImpactLine) avoidLines.push(input.periodGoalImpactLine);
  if (input.managementStyleLine) avoidLines.push(input.managementStyleLine);
  if (input.tomorrowPreparationLine) avoidLines.push(input.tomorrowPreparationLine);
  if (input.cliffhangerLine) avoidLines.push(input.cliffhangerLine);
  if (input.operationalTempoLine) avoidLines.push(input.operationalTempoLine);
  if (input.socialEchoMessage) avoidLines.push(input.socialEchoMessage);
  if (input.cityEchoLine) avoidLines.push(input.cityEchoLine);
  if (input.decisionImpactLine) avoidLines.push(input.decisionImpactLine);
  if (input.cityReaction?.reportMemoryLine) {
    avoidLines.push(input.cityReaction.reportMemoryLine);
  }

  const candidates: ReportReplayItem[] = [
    buildOperationReplayItem(input),
    buildDecisionReplayItem(input),
    buildFieldReplayItem(input),
    buildCityImpactReplayItem(input),
    buildMaintenanceReplayItem(input),
    buildPeriodGoalReplayItem(input),
    buildPlayerStyleReplayItem(input),
    buildSocialEchoReplayItem(input),
    buildTomorrowRiskReplayItem(input),
  ].filter((item): item is ReportReplayItem => Boolean(item));

  return candidates.sort((a, b) => b.priority - a.priority);
}

export function selectReportReplayHighlights(
  candidates: ReportReplayItem[],
  input: ReportReplayContextInput,
): ReportReplayItem[] {
  const avoidLines = [...(input.avoidLines ?? [])];
  const usedKeys = new Set<string>();
  const sourceCounts = new Map<string, number>();
  const selected: ReportReplayItem[] = [];

  const pick = (predicate: (item: ReportReplayItem) => boolean) => {
    for (const item of candidates) {
      if (!predicate(item)) continue;
      const accepted = acceptItem(item, avoidLines, usedKeys, sourceCounts);
      if (accepted) {
        selected.push(accepted);
        return true;
      }
    }
    return false;
  };

  pick((item) => item.type === 'operation' || item.type === 'decision');
  if (!selected.some((item) => item.type === 'decision')) {
    pick((item) => item.type === 'operation');
  }

  pick((item) => item.type === 'field');
  pick((item) => item.type === 'cityImpact');
  pick((item) => item.type === 'maintenance');
  pick((item) => item.type === 'periodGoal' || item.type === 'playerStyle');
  pick((item) => item.type === 'socialEcho' || item.type === 'tomorrowRisk');

  for (const item of candidates) {
    if (selected.length >= MAX_ITEMS) break;
    const accepted = acceptItem(item, avoidLines, usedKeys, sourceCounts);
    if (accepted) selected.push(accepted);
  }

  if (selected.length < MIN_ITEMS) {
    for (const fallback of buildFallbackItems()) {
      if (selected.length >= MIN_ITEMS) break;
      const accepted = acceptItem(fallback, avoidLines, usedKeys, sourceCounts);
      if (accepted) selected.push(accepted);
    }
  }

  return selected.slice(0, MAX_ITEMS).map((item, index) => ({
    ...item,
    timeLabel: item.timeLabel ?? timeLabelFor(item.type, index),
  }));
}

export function buildReportReplayPresentation(
  input: ReportReplayContextInput,
): ReportReplayPresentation {
  const candidates = buildReportReplayItems(input);
  const items = selectReportReplayHighlights(candidates, input);
  const fallback = buildFallbackItems()[0];

  const summary =
    items.length >= 3
      ? `${items.length} adım · kararların şehirde bıraktığı kısa iz`
      : fallback.description;

  return {
    title: 'Gün Akışı',
    subtitle: 'Kararların şehirde bıraktığı kısa iz',
    summary,
    items,
    countLabel: `${items.length} adım`,
    emptyFallback: items.length < MIN_ITEMS ? fallback : undefined,
  };
}
