import { buildTomorrowHintLine } from '@/core/contentPacks/eventEchoPresentation';
import { buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import type { EventEchoContext, EventEchoDomain } from '@/core/contentPacks/eventEchoTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import {
  inferCarryOverDomainFromEvent,
  inferCarryOverDomainFromEventDomainFocus,
  inferCarryOverDomainFromText,
  inferCarryOverTone,
  pickStrongestMemory,
} from './carryOverMemorySelectors';
import type {
  CarryOverDirection,
  CarryOverDomain,
  CarryOverMemoryInput,
  CarryOverMemoryModel,
  CarryOverMemorySource,
  CarryOverSummary,
  CarryOverSurface,
  CarryOverTone,
} from './carryOverMemoryTypes';

export const TITLE_LIMIT = 32;
export const SUMMARY_LIMIT = 140;

type SurfaceCopy = {
  title: string;
  summary: string;
};

type DomainTemplate = {
  iconKey: string;
  primaryTag: string;
  secondaryTag?: string;
  tone: CarryOverTone;
  hub: SurfaceCopy;
  event_detail: SurfaceCopy;
  plan: SurfaceCopy;
  result: SurfaceCopy;
  report: SurfaceCopy;
};

export const DOMAIN_TEMPLATES: Record<CarryOverDomain, DomainTemplate> = {
  container: {
    iconKey: 'trash-outline',
    primaryTag: 'Konteyner',
    secondaryTag: 'Bugün',
    tone: 'positive',
    hub: {
      title: 'Dünden Kalan Etki',
      summary:
        'Cumhuriyet’te konteyner baskısı azaldı; bugün aynı hattı daha sakin yönetebilirsin.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Konteyner baskısı dünden bugüne daha sakin bir seviyede izleniyor.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Aynı hattı bugün daha dengeli tempo ile yönetmek mümkün.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Bugünkü karar yarın konteyner hattında kısa süreli iz bırakabilir.',
    },
    report: {
      title: 'Yarına Taşınan İz',
      summary: 'Konteyner yoğunluğu yarın sabah planında hafif bir izlenebilir.',
    },
  },
  vehicle_route: {
    iconKey: 'car-outline',
    primaryTag: 'Araç',
    secondaryTag: 'Rota',
    tone: 'warning',
    hub: {
      title: 'Bugüne Taşınan İz',
      summary: 'Dünkü hızlı rota Standart Kamyon’u yordu. Bugün araç yükünü dikkatli dengele.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Dünkü rota araç yükünü artırdı; bugün bakım ve tempo dengesi önemli.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Araç yorgunluğu bugün rota planında dikkatle izlenmeli.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Karar yarın rota bandında araç yorgunluğunu etkileyebilir.',
    },
    report: {
      title: 'Yarına Taşınan İz',
      summary: 'Araç yorgunluğu yarın rota planında izlenmeli.',
    },
  },
  personnel: {
    iconKey: 'people-outline',
    primaryTag: 'Ekip',
    secondaryTag: 'Tempo',
    tone: 'warning',
    hub: {
      title: 'Ekip Temposu İzleniyor',
      summary: 'Aynı ekip üst üste yoğun bölgede çalıştı. Bugün rotasyon daha güvenli olabilir.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Ekip temposu dünden bugüne yüksek; kısa rotasyon rahatlatıcı olabilir.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Personel moral ve tempo bugün plan aşamasında dengelenmeli.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Bugünkü tempo kararın yarın ekip moralinde kısa iz bırakabilir.',
    },
    report: {
      title: 'Sonraki Gün İçin Not',
      summary: 'Ekip temposu yarın vardiya planında izlenmeli.',
    },
  },
  social: {
    iconKey: 'chatbubbles-outline',
    primaryTag: 'Sosyal',
    secondaryTag: 'Güven',
    tone: 'calm',
    hub: {
      title: 'Sosyal Yankı Devam Ediyor',
      summary:
        'Dünkü müdahale şikayeti düşürdü, ancak mahallede görünürlük beklentisi hâlâ yüksek.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Sosyal nabız dünden bugüne daha sakin; görünürlük beklentisi sürüyor.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Vatandaş etkisi bugün plan kararlarında görünür kalabilir.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Bugünkü müdahale yarın sosyal nabızda kısa bir iz bırakabilir.',
    },
    report: {
      title: 'Yarına Taşınan İz',
      summary: 'Sosyal nabız yarın sabah görünürlük beklentisiyle izlenmeli.',
    },
  },
  crisis_adjacent: {
    iconKey: 'pulse-outline',
    primaryTag: 'Risk',
    secondaryTag: 'Önlem',
    tone: 'strategic',
    hub: {
      title: 'Risk Sinyali İzleniyor',
      summary:
        'Dünkü karar riski büyütmedi, fakat aynı mahallede iki sinyal birlikte izlenmeli.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Birleşen risk sinyalleri bugün önleyici karar gerektirebilir.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Kriz eşiğine yakın sinyaller plan aşamasında dikkatle okunmalı.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Bugünkü karar yarın risk bandında kısa bir iz bırakabilir.',
    },
    report: {
      title: 'Yarın Dikkat',
      summary: 'Risk sinyali yarın önleyici karar penceresinde izlenmeli.',
    },
  },
  district_balance: {
    iconKey: 'map-outline',
    primaryTag: 'Denge',
    secondaryTag: 'Mahalle',
    tone: 'strategic',
    hub: {
      title: 'Mahalle Dengesi',
      summary:
        'Merkez hızlı toparlandı; bugün diğer mahallelerde bekleme algısını büyütmemek önemli.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Mahalle dengesi dünden bugüne öncelik gerektiriyor.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Bölgesel denge bugün plan kararlarında görünür kalmalı.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Karar yarın mahalle dengesinde kısa bir iz bırakabilir.',
    },
    report: {
      title: 'Sonraki Gün İçin Not',
      summary: 'Bekleme algısı yarın mahalle önceliğinde izlenmeli.',
    },
  },
  generic_operation: {
    iconKey: 'time-outline',
    primaryTag: 'Operasyon',
    secondaryTag: 'İz',
    tone: 'calm',
    hub: {
      title: 'Önceki Kararın Etkisi',
      summary: 'Dünkü operasyon kararı bugün saha planında hâlâ hissediliyor.',
    },
    event_detail: {
      title: 'Bugüne Taşınan İz',
      summary: 'Dünkü karar bugün operasyon akışında kısa bir iz taşıyor.',
    },
    plan: {
      title: 'Bugüne Taşınan İz',
      summary: 'Önceki günün etkisi bugün plan aşamasında görünür.',
    },
    result: {
      title: 'Yarın Etkisi',
      summary: 'Bugünkü karar yarın operasyon planında kısa bir iz bırakabilir.',
    },
    report: {
      title: 'Yarına Taşınan İz',
      summary: 'Bugünkü operasyon yarın kısa bir iz taşıyabilir.',
    },
  },
};

function clampText(text: string, limit: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function directionForSurface(surface: CarryOverSurface): CarryOverDirection {
  if (surface === 'hub' || surface === 'event_detail' || surface === 'plan') {
    return 'yesterday_to_today';
  }
  return 'today_to_tomorrow';
}

function templateCopyForSurface(
  template: DomainTemplate,
  surface: CarryOverSurface,
): SurfaceCopy {
  switch (surface) {
    case 'plan':
      return template.plan;
    case 'event_detail':
      return template.event_detail;
    case 'result':
      return template.result;
    case 'report':
      return template.report;
    default:
      return template.hub;
  }
}

function echoDomainToCarryOver(domain: EventEchoDomain): CarryOverDomain {
  switch (domain) {
    case 'container':
      return 'container';
    case 'vehicle':
    case 'route':
      return 'vehicle_route';
    case 'personnel':
      return 'personnel';
    case 'social':
      return 'social';
    case 'crisis_adjacent':
      return 'crisis_adjacent';
    case 'district_balance':
      return 'district_balance';
    default:
      return 'generic_operation';
  }
}

function resolveDomain(input: CarryOverMemoryInput): CarryOverDomain {
  if (input.eventDomainFocus) {
    return inferCarryOverDomainFromEventDomainFocus(input.eventDomainFocus);
  }
  if (input.currentEvent) {
    return inferCarryOverDomainFromEvent(input.currentEvent);
  }
  const reportLine = firstReportLine(input.lastDailyReport) ?? firstReportLine(input.currentDailyReport);
  if (reportLine) {
    return inferCarryOverDomainFromText(reportLine);
  }
  return 'generic_operation';
}

function firstReportLine(report?: DailyReport | null): string | undefined {
  const lines = collectReportLines(report);
  return lines[0];
}

function collectReportLines(report?: DailyReport | null): string[] {
  if (!report) return [];
  const buckets = [
    report.carryOverSummaryLines,
    report.containerSummaryLines,
    report.vehicleSummaryLines,
    report.personnelSummaryLines,
    report.socialSummaryLines,
  ];
  const lines: string[] = [];
  for (const bucket of buckets) {
    if (!bucket) continue;
    for (const line of bucket) {
      if (line?.trim()) lines.push(line.trim());
    }
  }
  return lines.slice(0, 2);
}

function hasRealCarryOverData(input: CarryOverMemoryInput): boolean {
  if (collectReportLines(input.lastDailyReport).length > 0) return true;
  if (collectReportLines(input.currentDailyReport).length > 0) return true;
  if (hasOperationSignalCarryOver(input.operationSignals)) return true;
  if (hasPreviousDayDecisions(input)) return true;
  if (input.eventResult?.summaryText?.trim()) return true;
  return false;
}

function hasOperationSignalCarryOver(signals?: OperationSignalsState | null): boolean {
  if (!signals) return false;
  const domains = [
    signals.containers,
    signals.vehicles,
    signals.personnel,
    signals.districts,
    signals.overall,
  ];
  return domains.some(
    (d) =>
      d.status === 'watch' || d.status === 'strained' || d.status === 'critical',
  );
}

function hasPreviousDayDecisions(input: CarryOverMemoryInput): boolean {
  const prevDay = input.day - 1;
  if (prevDay < 1) return false;
  return (input.recentDecisions ?? []).some((d) => d.day === prevDay);
}

function buildMemoryModel(args: {
  id: string;
  surface: CarryOverSurface;
  domain: CarryOverDomain;
  title: string;
  summary: string;
  source: CarryOverMemorySource;
  day: number;
  direction?: CarryOverDirection;
  tone?: CarryOverTone;
  visible?: boolean;
  maxLines?: number;
  debugReason?: string;
}): CarryOverMemoryModel {
  const template = DOMAIN_TEMPLATES[args.domain];
  const direction = args.direction ?? directionForSurface(args.surface);
  const tone =
    args.tone ??
    inferCarryOverTone({
      text: args.summary,
      direction,
    });

  return {
    id: args.id,
    surface: args.surface,
    direction,
    domain: args.domain,
    tone,
    title: clampText(args.title, TITLE_LIMIT),
    summary: clampText(args.summary, SUMMARY_LIMIT),
    primaryTag: template.primaryTag,
    secondaryTag: template.secondaryTag,
    iconKey: template.iconKey,
    source: args.source,
    visible: args.visible ?? true,
    maxLines: args.maxLines ?? (args.day === 7 ? 1 : 2),
    debugReason: args.debugReason,
  };
}

function memoryFromReportLine(
  line: string,
  surface: CarryOverSurface,
  source: CarryOverMemorySource,
  input: CarryOverMemoryInput,
  domainOverride?: CarryOverDomain,
): CarryOverMemoryModel {
  const domain = domainOverride ?? inferCarryOverDomainFromText(line);
  const template = DOMAIN_TEMPLATES[domain];
  const copy = templateCopyForSurface(template, surface);
  const title =
    surface === 'report'
      ? copy.title
      : surface === 'hub'
        ? copy.title.includes('Dünden') || copy.title.includes('Etki')
          ? copy.title
          : 'Dünden Kalan Etki'
        : copy.title;

  return buildMemoryModel({
    id: `carry-${surface}-${domain}-${source}-${input.day}`,
    surface,
    domain,
    title,
    summary: line,
    source,
    day: input.day,
    tone: inferCarryOverTone({ text: line, direction: directionForSurface(surface) }),
    debugReason: `${source}:report_line`,
  });
}

function memoryFromOperationSignals(
  signals: OperationSignalsState,
  surface: CarryOverSurface,
  input: CarryOverMemoryInput,
): CarryOverMemoryModel | null {
  const ranked: { domain: CarryOverDomain; summary: string; status: string }[] = [
    { domain: 'crisis_adjacent', summary: signals.overall.summary, status: signals.overall.status },
    { domain: 'vehicle_route', summary: signals.vehicles.summary, status: signals.vehicles.status },
    { domain: 'container', summary: signals.containers.summary, status: signals.containers.status },
    { domain: 'personnel', summary: signals.personnel.summary, status: signals.personnel.status },
    { domain: 'district_balance', summary: signals.districts.summary, status: signals.districts.status },
  ];

  const pick = ranked.find(
    (r) =>
      r.summary.trim() &&
      (r.status === 'critical' || r.status === 'strained' || r.status === 'watch'),
  );
  if (!pick) return null;

  return memoryFromReportLine(pick.summary, surface, 'operation_signals', input, pick.domain);
}

function memoryFromDecisions(
  input: CarryOverMemoryInput,
  surface: CarryOverSurface,
): CarryOverMemoryModel | null {
  const prevDay = input.day - 1;
  if (prevDay < 1) return null;
  const decisions = (input.recentDecisions ?? []).filter((d) => d.day === prevDay);
  const last = decisions[decisions.length - 1];
  if (!last) return null;

  const summary = `${last.eventTitle} kararı bugün ${last.neighborhoodName ?? 'sahada'} iz taşıyor.`;
  const domain = inferCarryOverDomainFromText(`${last.eventTitle} ${last.decisionLabel}`);
  return memoryFromReportLine(summary, surface, 'daily_report', input, domain);
}

function normalizeEchoResult(
  eventResult: CarryOverMemoryInput['eventResult'],
): { publicSatisfactionDelta?: number; riskDelta?: number; successLabel?: string; tone?: string } | undefined {
  if (!eventResult) return undefined;
  return {
    successLabel: eventResult.summaryTitle,
    tone: eventResult.resultTone,
  };
}

function isDuplicateWithDomainFocus(
  summary: string,
  focus: CarryOverMemoryInput['eventDomainFocus'],
): boolean {
  if (!focus?.summary?.trim()) return false;
  const a = summary.trim().toLowerCase();
  const b = focus.summary.trim().toLowerCase();
  if (a === b) return true;
  if (a.length >= 24 && b.includes(a.slice(0, 24))) return true;
  if (b.length >= 24 && a.includes(b.slice(0, 24))) return true;
  return false;
}

function applyEventDomainDedupe(
  memory: CarryOverMemoryModel,
  input: CarryOverMemoryInput,
): CarryOverMemoryModel {
  if (!isDuplicateWithDomainFocus(memory.summary, input.eventDomainFocus)) {
    return memory;
  }
  const tag = input.eventDomainFocus?.shortTitle ?? memory.primaryTag;
  return {
    ...memory,
    title: clampText('Bugüne Taşınan İz', TITLE_LIMIT),
    summary: clampText(tag, SUMMARY_LIMIT),
    maxLines: 1,
    secondaryTag: undefined,
    debugReason: `${memory.debugReason ?? 'event'}:domain_dedupe`,
  };
}

export function buildCarryOverFromEchoContext(
  context: EventEchoContext,
  surface: CarryOverSurface,
): CarryOverMemoryModel | null {
  const hint = buildTomorrowHintLine(context);
  if (!hint?.trim()) return null;

  const domain = echoDomainToCarryOver(context.domain);
  const template = DOMAIN_TEMPLATES[domain];
  const copy = templateCopyForSurface(template, surface);
  const title = surface === 'report' || surface === 'result' ? copy.title : copy.title;

  return buildMemoryModel({
    id: `carry-${surface}-${domain}-echo-${context.day}`,
    surface,
    domain,
    title: surface === 'report' ? 'Yarına Taşınan İz' : title,
    summary: hint,
    source: 'event_echo',
    day: context.day,
    direction: directionForSurface(surface),
    debugReason: 'event_echo:tomorrow_hint',
  });
}

export function buildCarryOverFallbackForDay(
  day: number,
  surface: CarryOverSurface,
  domain: CarryOverDomain = 'generic_operation',
): CarryOverMemoryModel | null {
  if (day === 1) return null;
  if (day > 7 && surface === 'hub') return null;

  const template = DOMAIN_TEMPLATES[domain];
  const copy = templateCopyForSurface(template, surface);

  return buildMemoryModel({
    id: `carry-${surface}-${domain}-fallback-${day}`,
    surface,
    domain,
    title: copy.title,
    summary: copy.summary,
    source: 'fallback',
    day,
    tone: template.tone,
    visible: day >= 2 && day <= 7,
    debugReason: 'fallback:template',
  });
}

function collectYesterdayMemories(
  input: CarryOverMemoryInput,
  surface: CarryOverSurface,
): CarryOverMemoryModel[] {
  const memories: CarryOverMemoryModel[] = [];

  for (const line of collectReportLines(input.lastDailyReport)) {
    memories.push(memoryFromReportLine(line, surface, 'daily_report', input));
  }

  if (input.operationSignals) {
    const opMem = memoryFromOperationSignals(input.operationSignals, surface, input);
    if (opMem) memories.push(opMem);
  }

  const decisionMem = memoryFromDecisions(input, surface);
  if (decisionMem) memories.push(decisionMem);

  return memories;
}

function collectTomorrowMemories(input: CarryOverMemoryInput): CarryOverMemoryModel[] {
  const memories: CarryOverMemoryModel[] = [];

  for (const line of collectReportLines(input.currentDailyReport)) {
    memories.push(memoryFromReportLine(line, 'report', 'daily_report', input));
  }

  if (input.currentEvent) {
    const ctx = buildEchoContextFromEventResult({
      event: input.currentEvent,
      day: input.day,
      result: normalizeEchoResult(input.eventResult),
      hasCarryOver: true,
    });
    const echoMem = buildCarryOverFromEchoContext(ctx, 'report');
    if (echoMem) memories.push(echoMem);
  }

  return memories;
}

export function buildHubCarryOverMemory(
  input: CarryOverMemoryInput | null | undefined,
): CarryOverMemoryModel | null {
  if (!input?.day) return null;
  if (input.day === 1) return null;

  const candidates = collectYesterdayMemories(input, 'hub');
  const strongest = pickStrongestMemory(candidates);
  if (strongest) return strongest;

  if (input.day > 7) return null;

  return buildCarryOverFallbackForDay(input.day, 'hub', resolveDomain(input));
}

export function buildEventCarryOverHint(
  input: CarryOverMemoryInput | null | undefined,
): CarryOverMemoryModel | null {
  if (!input?.day) return null;
  if (input.day === 1) return null;

  const surface: CarryOverSurface = 'event_detail';
  const candidates = collectYesterdayMemories(input, surface);
  let memory: CarryOverMemoryModel | null =
    pickStrongestMemory(candidates) ?? null;

  if (!memory && input.day <= 7) {
    memory = buildCarryOverFallbackForDay(
      input.day,
      surface,
      resolveDomain(input),
    );
  }

  if (!memory) return null;

  memory = applyEventDomainDedupe(memory, input);
  return memory;
}

export function buildResultCarryOverMemory(
  input: CarryOverMemoryInput | null | undefined,
): CarryOverMemoryModel | null {
  if (!input?.day) return null;
  if (input.day === 1) return null;

  const resultText = input.eventResult?.summaryText?.trim();
  if (resultText && /yarın|ertesi/i.test(resultText)) {
    return buildMemoryModel({
      id: `carry-result-event_result-${input.day}`,
      surface: 'result',
      domain: resolveDomain(input),
      title: 'Yarın Etkisi',
      summary: resultText,
      source: 'event_result',
      day: input.day,
      direction: 'today_to_tomorrow',
      debugReason: 'event_result:summary',
    });
  }

  if (!input.suppressEchoDuplicate && input.currentEvent) {
    const ctx = buildEchoContextFromEventResult({
      event: input.currentEvent,
      day: input.day,
      result: normalizeEchoResult(input.eventResult),
      hasCarryOver: true,
    });
    const echoMem = buildCarryOverFromEchoContext(ctx, 'result');
    if (echoMem) return echoMem;
  }

  if (input.day > 7) return null;

  return buildCarryOverFallbackForDay(input.day, 'result', resolveDomain(input));
}

export function buildReportCarryOverPreview(
  input: CarryOverMemoryInput | null | undefined,
): CarryOverMemoryModel | null {
  if (!input?.day) return null;
  if (input.day === 1) return null;

  const candidates = collectTomorrowMemories(input);
  const strongest = pickStrongestMemory(candidates);
  if (strongest) {
    return {
      ...strongest,
      title: clampText(
        strongest.title.includes('Yarın') ||
          strongest.title.includes('Sonraki')
          ? strongest.title
          : 'Yarına Taşınan İz',
        TITLE_LIMIT,
      ),
      maxLines: input.day === 7 ? 1 : strongest.maxLines,
    };
  }

  if (input.day > 7) return null;

  return buildCarryOverFallbackForDay(input.day, 'report', resolveDomain(input));
}

export function buildCarryOverMemorySummary(
  input: CarryOverMemoryInput,
): CarryOverSummary {
  const memories: CarryOverMemoryModel[] = [];
  const push = (model: CarryOverMemoryModel | null) => {
    if (model?.visible) memories.push(model);
  };

  push(buildHubCarryOverMemory(input));
  push(buildEventCarryOverHint(input));
  push(buildResultCarryOverMemory(input));
  push(buildReportCarryOverPreview(input));

  const strongestMemory = pickStrongestMemory(memories);

  return {
    hasVisibleMemory: memories.length > 0,
    memories,
    strongestMemory,
    warnings: [],
  };
}

export function formatCarryOverMemoryForDebug(
  model: CarryOverMemoryModel | null | undefined,
): string {
  if (!model) return 'carry-over: null';
  return [
    'carry-over',
    `surface=${model.surface}`,
    `domain=${model.domain}`,
    `source=${model.source}`,
    `visible=${model.visible}`,
    `title=${model.title}`,
    `summary=${model.summary.slice(0, 48)}`,
    model.debugReason ? `reason=${model.debugReason}` : '',
  ]
    .filter(Boolean)
    .join(' | ');
}

function builderForSurface(surface: CarryOverSurface) {
  switch (surface) {
    case 'hub':
      return buildHubCarryOverMemory;
    case 'event_detail':
    case 'plan':
      return buildEventCarryOverHint;
    case 'result':
      return buildResultCarryOverMemory;
    case 'report':
      return buildReportCarryOverPreview;
    default:
      return buildHubCarryOverMemory;
  }
}

export function shouldShowCarryOverMemory(
  day: number,
  surface: CarryOverSurface,
  input: CarryOverMemoryInput,
): boolean {
  if (day === 1) return false;

  const model = builderForSurface(surface)({ ...input, day });
  if (!model?.visible) return false;

  if (day > 7 && surface === 'hub' && model.source === 'fallback') {
    return false;
  }

  if (day > 7 && surface === 'hub') {
    return hasRealCarryOverData({ ...input, day });
  }

  return true;
}
