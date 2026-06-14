import type { DailyReport } from '@/core/models/DailyReport';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type {
  DecisionMetricChange,
  DecisionResultSnapshot,
} from '@/features/events/types/decisionResultTypes';

import type {
  DecisionConsequenceSourceInput,
  DecisionConsequenceStrength,
  DecisionConsequenceSurface,
  DecisionConsequenceThread,
  DecisionConsequenceThreadInput,
  DecisionConsequenceTimeScope,
  DecisionConsequenceTone,
  DecisionConsequenceType,
} from './decisionConsequenceThreadTypes';

export const DECISION_CONSEQUENCE_MAX_THREADS = 3;

export const DECISION_CONSEQUENCE_ALLOWED_TYPES: DecisionConsequenceType[] = [
  'resource_pressure',
  'district_memory',
  'social_echo',
  'tomorrow_risk',
  'carry_over',
  'butterfly',
  'city_archive',
  'story_chain',
  'authority_progress',
  'neutral_record',
];

export const DECISION_CONSEQUENCE_ALLOWED_STRENGTHS: DecisionConsequenceStrength[] = [
  'low',
  'medium',
  'high',
];

export const DECISION_CONSEQUENCE_ALLOWED_TIME_SCOPES: DecisionConsequenceTimeScope[] = [
  'immediate',
  'next_day',
  'multi_day',
];

export const DECISION_CONSEQUENCE_ALLOWED_TONES: DecisionConsequenceTone[] = [
  'positive',
  'neutral',
  'warning',
];

const PRIORITY_BY_TYPE: Record<DecisionConsequenceType, number> = {
  carry_over: 10,
  butterfly: 20,
  tomorrow_risk: 30,
  district_memory: 40,
  resource_pressure: 50,
  social_echo: 60,
  authority_progress: 70,
  city_archive: 80,
  story_chain: 85,
  neutral_record: 100,
};

const TITLE_BY_TYPE: Record<DecisionConsequenceType, string> = {
  resource_pressure: 'Kaynak izi',
  district_memory: 'Mahalle hafizasi',
  social_echo: 'Sosyal yankı',
  tomorrow_risk: 'Yarın izi',
  carry_over: 'Dunden kalan etki',
  butterfly: 'Kucuk karar izi',
  city_archive: 'Sehir kaydi',
  story_chain: 'Hikaye izi',
  authority_progress: 'Yetki ilerlemesi',
  neutral_record: 'Karar kaydi',
};

function cleanText(value: string | null | undefined, max = 150): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string | null | undefined): string {
  return cleanText(value, 240).toLocaleLowerCase('tr-TR');
}

function lineLooksWarning(line: string): boolean {
  return /risk|baski|yorgun|kritik|uyar|artti|artabilir|tasindi|zorlan/i.test(line);
}

function lineLooksPositive(line: string): boolean {
  return /sakin|toparlan|guclen|iyiles|dengel|olumlu|koru|azal/i.test(line);
}

function makeSourceIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const trimmed = cleanText(id, 80);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function toneForLine(
  type: DecisionConsequenceType,
  line: string,
  requested?: DecisionConsequenceTone,
): DecisionConsequenceTone {
  if (requested) return requested;
  if (type === 'authority_progress' || lineLooksPositive(line)) return 'positive';
  if (
    type === 'resource_pressure' ||
    type === 'tomorrow_risk' ||
    lineLooksWarning(line)
  ) {
    return 'warning';
  }
  return 'neutral';
}

function strengthForType(
  type: DecisionConsequenceType,
  requested?: DecisionConsequenceStrength,
): DecisionConsequenceStrength {
  if (requested) return requested;
  if (type === 'carry_over' || type === 'butterfly' || type === 'tomorrow_risk') {
    return 'high';
  }
  if (
    type === 'district_memory' ||
    type === 'resource_pressure' ||
    type === 'social_echo' ||
    type === 'story_chain'
  ) {
    return 'medium';
  }
  return 'low';
}

function timeScopeForType(
  type: DecisionConsequenceType,
  requested?: DecisionConsequenceTimeScope,
): DecisionConsequenceTimeScope {
  if (requested) return requested;
  if (type === 'carry_over' || type === 'tomorrow_risk') return 'next_day';
  if (type === 'butterfly' || type === 'story_chain' || type === 'city_archive') {
    return 'multi_day';
  }
  return 'immediate';
}

function defaultSurfaces(type: DecisionConsequenceType): DecisionConsequenceSurface[] {
  switch (type) {
    case 'carry_over':
    case 'tomorrow_risk':
      return ['report', 'hub', 'ece'];
    case 'butterfly':
    case 'story_chain':
      return ['result', 'report', 'hub', 'archive'];
    case 'city_archive':
      return ['report', 'hub', 'archive'];
    case 'neutral_record':
      return ['result', 'report'];
    default:
      return ['result', 'report', 'hub'];
  }
}

function prefixCausalLine(args: {
  type: DecisionConsequenceType;
  line: string;
  decisionLabel?: string | null;
  sourceDay?: number;
}): string {
  const line = cleanText(args.line);
  if (/^(dünkü|dunkü|bu secim|bu seçim|sectigin|seçtiğin|onceki|önceki|kararin|kararın)/i.test(line)) {
    return line;
  }

  if (args.type === 'neutral_record') {
    return `Bu seçim şehir kaydına işlendi.`;
  }

  if (args.sourceDay && args.sourceDay > 1) {
    return `Dünkü kararın ${line.charAt(0).toLocaleLowerCase('tr-TR')}${line.slice(1)}`;
  }

  if (args.decisionLabel?.trim()) {
    return `Seçtiğin plan ${line.charAt(0).toLocaleLowerCase('tr-TR')}${line.slice(1)}`;
  }

  return `Bu seçim ${line.charAt(0).toLocaleLowerCase('tr-TR')}${line.slice(1)}`;
}

function nextActionForType(
  type: DecisionConsequenceType,
  line: string,
  requested?: string,
): string | undefined {
  const existing = cleanText(requested, 96);
  if (existing) return existing;
  if (type === 'resource_pressure') return 'Yarın ilk olarak kaynak ve atama dengesini kontrol et.';
  if (type === 'district_memory') return 'Yarın bu mahallede güven etkisini izle.';
  if (type === 'social_echo') return 'Yarın sosyal nabzın sakin kalıp kalmadığını kontrol et.';
  if (type === 'tomorrow_risk') return lineLooksWarning(line)
    ? 'Yarın ilk olarak bu risk hattını kontrol et.'
    : 'Yarın bu hattı kısa bir kontrolle aç.';
  if (type === 'carry_over') return 'Yarın ilk olarak dünden kalan etkiyi kontrol et.';
  if (type === 'butterfly') return 'Yarın küçük etkinin büyüyüp büyümediğini izle.';
  return undefined;
}

function buildNeutralFallback(input: DecisionConsequenceThreadInput): DecisionConsequenceSourceInput {
  return {
    id: 'neutral-record',
    type: 'neutral_record',
    line: input.eventTitle?.trim()
      ? `${input.eventTitle.trim()} sonucu kayda alındı.`
      : 'Karar sonucu kayda alındı.',
    sourceLabel: 'Karar kaydı',
    sourceIds: ['neutral-record', input.sourceEventId ?? 'event'],
    strength: 'low',
    timeScope: 'immediate',
    tone: 'neutral',
    visibleIn: ['result', 'report'],
  };
}

export function buildDecisionConsequenceThreads(
  input: DecisionConsequenceThreadInput,
): DecisionConsequenceThread[] {
  const rawSources = [...(input.sources ?? [])];
  if (rawSources.length === 0 && input.allowNeutralFallback !== false) {
    rawSources.push(buildNeutralFallback(input));
  }

  const usedThreadIds = new Set<string>();
  const usedSourceIds = new Set<string>();
  const usedLines = new Set<string>();
  const threads: DecisionConsequenceThread[] = [];
  let hasHigh = false;

  const sources = rawSources
    .filter((source) => cleanText(source.line))
    .sort((a, b) => {
      const priority = PRIORITY_BY_TYPE[a.type] - PRIORITY_BY_TYPE[b.type];
      if (priority !== 0) return priority;
      return a.id.localeCompare(b.id);
    });

  for (const source of sources) {
    if (threads.length >= DECISION_CONSEQUENCE_MAX_THREADS) break;
    if (!DECISION_CONSEQUENCE_ALLOWED_TYPES.includes(source.type)) continue;

    const sourceIds = makeSourceIds(source.sourceIds);
    if (sourceIds.length === 0) continue;
    if (sourceIds.some((id) => usedSourceIds.has(id))) continue;

    const normalized = normalizeLine(source.line);
    if (!normalized || usedLines.has(normalized)) continue;

    let strength = strengthForType(source.type, source.strength);
    if (strength === 'high') {
      if (hasHigh) strength = 'medium';
      else hasHigh = true;
    }

    const idBase = cleanText(source.id, 64) || `${source.type}-${threads.length + 1}`;
    const id = usedThreadIds.has(idBase) ? `${idBase}-${threads.length + 1}` : idBase;
    const causalLine = prefixCausalLine({
      type: source.type,
      line: source.line,
      decisionLabel: input.decisionLabel,
      sourceDay: source.sourceDay ?? input.sourceDay,
    });

    const thread: DecisionConsequenceThread = {
      id,
      sourceDecisionId: source.sourceDecisionId ?? input.sourceDecisionId,
      sourceEventId: source.sourceEventId ?? input.sourceEventId,
      sourceDay: source.sourceDay ?? input.sourceDay ?? input.day,
      title: cleanText(source.title, 80) || TITLE_BY_TYPE[source.type],
      summary: cleanText(source.summary ?? source.line, 130),
      consequenceType: source.type,
      strength,
      timeScope: timeScopeForType(source.type, source.timeScope),
      tone: toneForLine(source.type, source.line, source.tone),
      visibleIn: source.visibleIn?.length ? source.visibleIn : defaultSurfaces(source.type),
      causalLine,
      nextActionHint: nextActionForType(source.type, source.line, source.nextActionHint),
      sourceLabel: cleanText(source.sourceLabel, 80),
      sourceIds,
    };

    usedThreadIds.add(thread.id);
    usedLines.add(normalized);
    for (const sourceId of sourceIds) usedSourceIds.add(sourceId);
    threads.push(thread);
  }

  if (threads.length === 0 && input.allowNeutralFallback !== false) {
    return buildDecisionConsequenceThreads({
      ...input,
      sources: [buildNeutralFallback(input)],
      allowNeutralFallback: false,
    });
  }

  return threads;
}

function metric(snapshot: DecisionResultSnapshot, key: DecisionMetricChange['key']): DecisionMetricChange | undefined {
  return snapshot.metricChanges.find((item) => item.key === key);
}

export function buildDecisionConsequenceThreadsFromResult(input: {
  snapshot: DecisionResultSnapshot;
  carryOverSummary?: string | null;
  authorityProgressLine?: string | null;
}): DecisionConsequenceThread[] {
  const { snapshot } = input;
  const sources: DecisionConsequenceSourceInput[] = [];
  const budget = metric(snapshot, 'budget');
  const morale = metric(snapshot, 'personnelMorale');
  const publicSatisfaction = metric(snapshot, 'publicSatisfaction');
  const social = snapshot.subsystemOutcomes.find((item) => item.key === 'social');
  const vehicle = snapshot.subsystemOutcomes.find((item) => item.key === 'vehicle');
  const personnel = snapshot.subsystemOutcomes.find((item) => item.key === 'personnel');

  if (input.carryOverSummary?.trim()) {
    sources.push({
      id: 'carry-over-result',
      type: 'carry_over',
      line: input.carryOverSummary,
      sourceLabel: 'Carry-over',
      sourceIds: ['carry-over-result', snapshot.eventId],
      sourceDay: snapshot.day,
    });
  }

  if (snapshot.butterflyHint?.text) {
    sources.push({
      id: 'butterfly-result',
      type: 'butterfly',
      line: snapshot.butterflyHint.text,
      sourceLabel: 'Butterfly',
      sourceIds: ['butterfly-result', snapshot.eventId],
      title: snapshot.butterflyHint.title,
      tone: snapshot.butterflyHint.tone === 'warning' ? 'warning' : 'neutral',
      sourceDay: snapshot.day,
    });
  }

  const riskyPriority = snapshot.dailyPriorityImpact?.tone === 'risky';
  if (riskyPriority || snapshot.riskLines[0]) {
    sources.push({
      id: 'tomorrow-risk-result',
      type: 'tomorrow_risk',
      line: snapshot.dailyPriorityImpact?.text ?? snapshot.riskLines[0]!,
      sourceLabel: riskyPriority ? 'Günlük öncelik' : 'Risk',
      sourceIds: ['tomorrow-risk-result', riskyPriority ? 'daily-priority' : 'risk-line'],
      tone: riskyPriority ? 'warning' : undefined,
      sourceDay: snapshot.day,
    });
  }

  if (
    (budget && budget.delta < -1500) ||
    (morale && morale.delta < -3) ||
    vehicle?.status === 'warning' ||
    vehicle?.status === 'critical' ||
    personnel?.status === 'warning' ||
    personnel?.status === 'critical'
  ) {
    sources.push({
      id: 'resource-pressure-result',
      type: 'resource_pressure',
      line:
        vehicle?.primaryText ??
        personnel?.primaryText ??
        'kaynak yorgunluğunu yarınki atamada daha önemli hale getirdi.',
      sourceLabel: 'Kaynak',
      sourceIds: ['resource-pressure-result', snapshot.eventId],
      tone: 'warning',
      sourceDay: snapshot.day,
    });
  }

  if (publicSatisfaction && Math.abs(publicSatisfaction.delta) >= 2) {
    sources.push({
      id: 'district-memory-result',
      type: 'district_memory',
      line:
        publicSatisfaction.delta > 0
          ? `${snapshot.neighborhoodName ?? 'mahalle'} güveninde olumlu bir iz bıraktı.`
          : `${snapshot.neighborhoodName ?? 'mahalle'} güveninde izlenmesi gereken bir iz bıraktı.`,
      sourceLabel: snapshot.neighborhoodName ?? 'Mahalle',
      sourceIds: ['district-memory-result', snapshot.neighborhoodId ?? snapshot.eventId],
      tone: publicSatisfaction.delta > 0 ? 'positive' : 'warning',
      sourceDay: snapshot.day,
    });
  }

  if (social && social.status !== 'neutral') {
    sources.push({
      id: 'social-echo-result',
      type: 'social_echo',
      line: social.primaryText,
      sourceLabel: 'Sosyal nabız',
      sourceIds: ['social-echo-result', 'social'],
      tone: social.status === 'good' ? 'positive' : 'warning',
      sourceDay: snapshot.day,
    });
  }

  if (input.authorityProgressLine?.trim()) {
    sources.push({
      id: 'authority-progress-result',
      type: 'authority_progress',
      line: input.authorityProgressLine,
      sourceLabel: 'Yetki',
      sourceIds: ['authority-progress-result', 'authority'],
      tone: 'positive',
      sourceDay: snapshot.day,
    });
  }

  return buildDecisionConsequenceThreads({
    day: snapshot.day,
    sourceDay: snapshot.day,
    sourceDecisionId: snapshot.decisionId,
    sourceEventId: snapshot.eventId,
    decisionLabel: snapshot.decisionTitle,
    eventTitle: snapshot.eventTitle,
    districtName: snapshot.neighborhoodName,
    sources,
  });
}

export function buildDecisionConsequenceThreadsFromReport(
  report: DailyReport,
): DecisionConsequenceThread[] {
  const sources: DecisionConsequenceSourceInput[] = [];
  const firstCarry = report.carryOverSummaryLines?.find((line) => line.trim());
  const firstButterfly = report.butterflySummaryLines?.find((line) => line.trim());
  const firstWarning = report.warnings?.find((line) => line.trim());
  const firstResource = [
    ...(report.vehicleSummaryLines ?? []),
    ...(report.personnelSummaryLines ?? []),
    ...(report.containerSummaryLines ?? []),
  ].find((line) => /yarın|devam|baski|baskı|yorgun|risk|zorlan/i.test(line));
  const firstSocial = report.socialSummaryLines?.find((line) => line.trim());
  const firstAuthority = [
    ...(report.authoritySummaryLines ?? []),
    ...(report.badgeSummaryLines ?? []),
  ].find((line) => line.trim());
  const firstArchive = report.summaryLines?.find((line) => line.trim());

  if (firstCarry) {
    sources.push({
      id: 'report-carry-over',
      type: 'carry_over',
      line: firstCarry,
      sourceLabel: 'Carry-over',
      sourceIds: ['report-carry-over'],
      sourceDay: report.day,
    });
  }
  if (firstButterfly) {
    sources.push({
      id: 'report-butterfly',
      type: 'butterfly',
      line: firstButterfly,
      sourceLabel: 'Butterfly',
      sourceIds: ['report-butterfly'],
      sourceDay: report.day,
    });
  }
  if (firstWarning) {
    sources.push({
      id: 'report-tomorrow-risk',
      type: 'tomorrow_risk',
      line: firstWarning,
      sourceLabel: 'Rapor uyarısı',
      sourceIds: ['report-warning'],
      tone: 'warning',
      sourceDay: report.day,
    });
  }
  if (firstResource) {
    sources.push({
      id: 'report-resource-pressure',
      type: 'resource_pressure',
      line: firstResource,
      sourceLabel: 'Kaynak',
      sourceIds: ['report-resource'],
      sourceDay: report.day,
    });
  }
  if (firstSocial) {
    sources.push({
      id: 'report-social-echo',
      type: 'social_echo',
      line: firstSocial,
      sourceLabel: 'Sosyal nabız',
      sourceIds: ['report-social'],
      sourceDay: report.day,
    });
  }
  if (firstAuthority) {
    sources.push({
      id: 'report-authority-progress',
      type: 'authority_progress',
      line: firstAuthority,
      sourceLabel: 'İlerleme',
      sourceIds: ['report-authority'],
      sourceDay: report.day,
    });
  }
  if (firstArchive) {
    sources.push({
      id: 'report-city-archive',
      type: 'city_archive',
      line: firstArchive,
      sourceLabel: 'Şehir kaydı',
      sourceIds: ['report-archive'],
      strength: 'low',
      sourceDay: report.day,
    });
  }

  return buildDecisionConsequenceThreads({
    day: report.day,
    sourceDay: report.day,
    eventTitle: report.title,
    sources,
  });
}

export function buildDecisionConsequenceThreadsFromHub(input: {
  day: number;
  impactLine?: string | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  districtLine?: string | null;
  storyLine?: string | null;
  cityJournalLine?: string | null;
}): DecisionConsequenceThread[] {
  const sources: DecisionConsequenceSourceInput[] = [];

  if (input.impactLine?.trim()) {
    sources.push({
      id: 'hub-carry-over',
      type: 'carry_over',
      line: input.impactLine,
      sourceLabel: 'Karar hafızası',
      sourceIds: ['hub-impact'],
      sourceDay: Math.max(1, input.day - 1),
    });
  }
  if (input.tomorrowRisk?.mainLine?.trim() && input.tomorrowRisk.sourceSignals.some((source) => source !== 'fallback')) {
    sources.push({
      id: 'hub-tomorrow-risk',
      type: 'tomorrow_risk',
      line: input.tomorrowRisk.mainLine,
      sourceLabel: 'Yarın riski',
      sourceIds: [input.tomorrowRisk.id, 'hub-tomorrow-risk'],
      tone: input.tomorrowRisk.priority === 'high' || input.tomorrowRisk.tone === 'risk' ? 'warning' : undefined,
      strength: input.tomorrowRisk.priority === 'high' ? 'high' : 'medium',
      sourceDay: Math.max(1, input.day - 1),
    });
  }
  if (input.districtLine?.trim()) {
    sources.push({
      id: 'hub-district-memory',
      type: 'district_memory',
      line: input.districtLine,
      sourceLabel: 'Mahalle raporu',
      sourceIds: ['hub-district-report'],
      sourceDay: Math.max(1, input.day - 1),
    });
  }
  if (input.storyLine?.trim()) {
    sources.push({
      id: 'hub-story-chain',
      type: 'story_chain',
      line: input.storyLine,
      sourceLabel: 'Hikaye zinciri',
      sourceIds: ['hub-story-chain'],
      sourceDay: Math.max(1, input.day - 1),
    });
  }
  if (input.cityJournalLine?.trim()) {
    sources.push({
      id: 'hub-city-archive',
      type: 'city_archive',
      line: input.cityJournalLine,
      sourceLabel: 'Şehir günlüğü',
      sourceIds: ['hub-city-journal'],
      strength: 'low',
      sourceDay: Math.max(1, input.day - 1),
    });
  }

  return buildDecisionConsequenceThreads({
    day: input.day,
    sourceDay: Math.max(1, input.day - 1),
    sources,
    allowNeutralFallback: input.day > 1,
  });
}
