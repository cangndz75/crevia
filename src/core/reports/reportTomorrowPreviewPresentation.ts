import { inferCarryOverDomainFromText } from '@/core/carryOver/carryOverMemorySelectors';
import { buildTomorrowHintLine } from '@/core/contentPacks/eventEchoPresentation';
import { buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import type { EventEchoDomain } from '@/core/contentPacks/eventEchoTypes';
import { getPilotThemeForDay } from '@/core/pilotRhythm/pilotRhythmPresentation';

import {
  normalizeReportTomorrowPreviewText,
} from './reportTomorrowPreviewValidation';
import type {
  ReportTomorrowPreviewDomain,
  ReportTomorrowPreviewInput,
  ReportTomorrowPreviewModel,
  ReportTomorrowPreviewSource,
  ReportTomorrowPreviewSummary,
  ReportTomorrowPreviewTone,
  ReportTomorrowPreviewVisibility,
} from './reportTomorrowPreviewTypes';
import { REPORT_TOMORROW_PREVIEW_SOURCES } from './reportTomorrowPreviewTypes';

export const TITLE_LIMIT = 32;
export const SUMMARY_LIMIT = 150;

type DomainTemplate = {
  title: string;
  summary: string;
  iconKey: string;
  primaryTag: string;
  secondaryTag?: string;
  tone: ReportTomorrowPreviewTone;
};

export const DOMAIN_TEMPLATES: Record<ReportTomorrowPreviewDomain, DomainTemplate> = {
  container: {
    title: 'Yarın Dikkat',
    summary:
      'Konteyner baskısı bugün azaldıysa bile aynı hattın yarın tekrar dolmaması için rota dengesi izlenmeli.',
    iconKey: 'trash-outline',
    primaryTag: 'Konteyner',
    secondaryTag: 'Yarın',
    tone: 'positive',
  },
  vehicle_route: {
    title: 'Yarın Rota Notu',
    summary:
      'Bugünkü hızlı müdahale araç yükünü artırdıysa yarın rota planında aynı hattı tekrar zorlamamak önemli.',
    iconKey: 'car-outline',
    primaryTag: 'Araç',
    secondaryTag: 'Rota',
    tone: 'warning',
  },
  personnel: {
    title: 'Ekip Temposu',
    summary:
      'Bugün hızlı sonuç veren ekip yarın daha dengeli atamayla desteklenmeli.',
    iconKey: 'people-outline',
    primaryTag: 'Ekip',
    secondaryTag: 'Tempo',
    tone: 'warning',
  },
  social: {
    title: 'Sosyal Nabız Notu',
    summary:
      'Bugünkü görünür müdahale sosyal baskıyı sakinleştirdi; yarın saha sonucu görünür kalmalı.',
    iconKey: 'chatbubbles-outline',
    primaryTag: 'Sosyal',
    secondaryTag: 'Güven',
    tone: 'calm',
  },
  crisis_adjacent: {
    title: 'Risk Sinyali',
    summary:
      'Bugün risk büyümeden tutuldu; yarın aynı mahallede iki sinyal birleşirse erken müdahale önemli.',
    iconKey: 'pulse-outline',
    primaryTag: 'Risk',
    secondaryTag: 'Önlem',
    tone: 'strategic',
  },
  district_balance: {
    title: 'Mahalle Dengesi',
    summary:
      'Bugün bir mahalle rahatladıysa yarın bekleme algısı oluşan bölgeler izlenmeli.',
    iconKey: 'map-outline',
    primaryTag: 'Denge',
    secondaryTag: 'Mahalle',
    tone: 'strategic',
  },
  generic_operation: {
    title: 'Yarın İçin Not',
    summary:
      'Bugünkü kararın etkisi yarın kaynak ve mahalle dengesiyle birlikte izlenmeli.',
    iconKey: 'time-outline',
    primaryTag: 'Operasyon',
    secondaryTag: 'Yarın',
    tone: 'calm',
  },
};

function clampText(text: string, limit: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function echoDomainToPreview(domain: EventEchoDomain | string | undefined): ReportTomorrowPreviewDomain {
  switch (domain) {
    case 'container':
      return 'container';
    case 'vehicle':
    case 'route':
    case 'vehicle_route':
      return 'vehicle_route';
    case 'personnel':
      return 'personnel';
    case 'social':
      return 'social';
    case 'crisis_adjacent':
    case 'crisis':
      return 'crisis_adjacent';
    case 'district_balance':
      return 'district_balance';
    default:
      return 'generic_operation';
  }
}

function resolveVisibility(day: number): ReportTomorrowPreviewVisibility {
  if (day === 1) return 'hidden';
  if (day === 7) return 'final_safe';
  if (day >= 2 && day <= 3) return 'compact';
  return 'standard';
}

function collectReportLines(report?: ReportTomorrowPreviewInput['currentReport']): string[] {
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

function buildModel(args: {
  id: string;
  domain: ReportTomorrowPreviewDomain;
  summary: string;
  source: ReportTomorrowPreviewSource;
  day: number;
  titleOverride?: string;
  toneOverride?: ReportTomorrowPreviewTone;
  debugReason?: string;
}): ReportTomorrowPreviewModel {
  const template = DOMAIN_TEMPLATES[args.domain];
  const visibility = resolveVisibility(args.day);
  const maxLines = args.day === 7 ? 1 : visibility === 'compact' ? 2 : 2;

  return {
    id: args.id,
    title: clampText(args.titleOverride ?? template.title, TITLE_LIMIT),
    summary: clampText(args.summary, SUMMARY_LIMIT),
    domain: args.domain,
    tone: args.toneOverride ?? template.tone,
    source: args.source,
    visibility,
    primaryTag: template.primaryTag,
    secondaryTag: template.secondaryTag,
    iconKey: template.iconKey,
    maxLines,
    debugReason: args.debugReason,
  };
}

export function inferReportTomorrowDomain(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewDomain {
  if (input.carryOverMemory?.domain) {
    return echoDomainToPreview(input.carryOverMemory.domain);
  }
  if (input.eventDomainFocus?.focus) {
    return echoDomainToPreview(input.eventDomainFocus.focus);
  }
  if (input.socialEcho?.domain) {
    return echoDomainToPreview(input.socialEcho.domain);
  }
  const line = collectReportLines(input.currentReport)[0];
  if (line) return echoDomainToPreview(inferCarryOverDomainFromText(line));
  if (input.lastEventResult?.summaryText) {
    return echoDomainToPreview(inferCarryOverDomainFromText(input.lastEventResult.summaryText));
  }
  return 'generic_operation';
}

export function inferReportTomorrowTone(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewTone {
  const domain = inferReportTomorrowDomain(input);
  return DOMAIN_TEMPLATES[domain].tone;
}

export function suppressTomorrowPreviewDuplicate(
  preview: ReportTomorrowPreviewModel | null,
  existingLines: string[],
): ReportTomorrowPreviewModel | null {
  if (!preview) return null;
  const normalized = normalizeReportTomorrowPreviewText(preview.summary);
  for (const line of existingLines) {
    const other = normalizeReportTomorrowPreviewText(line);
    if (!other) continue;
    if (normalized === other) return null;
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) return null;
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) return null;
  }
  return preview;
}

function candidateFromCarryOver(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const memory = input.carryOverMemory;
  if (!memory?.summary?.trim() || memory.visible === false) return null;

  const domain = echoDomainToPreview(memory.domain ?? inferCarryOverDomainFromText(memory.summary));
  return buildModel({
    id: `tomorrow-carry-${input.day}`,
    domain,
    summary: memory.summary,
    source: 'carry_over',
    day: input.day,
    debugReason: 'carry_over:memory',
  });
}

function candidateFromEventEcho(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  let hint = input.eventEchoBundle?.tomorrowHint?.trim();

  if (!hint && input.lastEventResult?.eventId) {
    hint = buildTomorrowHintLine({
      day: input.day,
      domain: inferReportTomorrowDomain(input) as EventEchoDomain,
      outcomeBand: 'mixed',
      eventId: input.lastEventResult.eventId,
    });
  }

  if (!hint?.trim()) return null;

  const domain = inferReportTomorrowDomain(input);
  return buildModel({
    id: `tomorrow-echo-${input.day}`,
    domain,
    summary: hint,
    source: 'event_echo',
    day: input.day,
    debugReason: 'event_echo:tomorrow_hint',
  });
}

function candidateFromEventDomain(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const line = input.eventDomainFocus?.reportEchoLine?.trim();
  if (!line) return null;
  const domain = echoDomainToPreview(input.eventDomainFocus?.focus ?? inferCarryOverDomainFromText(line));
  return buildModel({
    id: `tomorrow-domain-${input.day}`,
    domain,
    summary: line,
    source: 'event_domain',
    day: input.day,
    debugReason: 'event_domain:report_echo',
  });
}

function candidateFromSocialEcho(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const mention = input.socialEcho?.mention?.trim();
  if (!mention || input.socialEcho?.visible === false) return null;
  const domain = echoDomainToPreview(input.socialEcho?.domain ?? 'social');
  return buildModel({
    id: `tomorrow-social-${input.day}`,
    domain,
    summary: mention,
    source: 'dynamic_social_echo',
    day: input.day,
    debugReason: 'dynamic_social_echo:mention',
  });
}

function candidateFromDailyReport(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const line = collectReportLines(input.currentReport)[0];
  if (!line) return null;
  const domain = echoDomainToPreview(inferCarryOverDomainFromText(line));
  return buildModel({
    id: `tomorrow-report-${input.day}`,
    domain,
    summary: line,
    source: 'daily_report',
    day: input.day,
    debugReason: 'daily_report:line',
  });
}

function candidateFromOperationSignals(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const signals = input.operationSignals;
  if (!signals) return null;

  const ranked: { domain: ReportTomorrowPreviewDomain; summary: string; status?: string }[] = [
    { domain: 'crisis_adjacent', summary: signals.overall?.summary ?? '', status: signals.overall?.status },
    { domain: 'vehicle_route', summary: signals.vehicles?.summary ?? '', status: signals.vehicles?.status },
    { domain: 'container', summary: signals.containers?.summary ?? '', status: signals.containers?.status },
    { domain: 'personnel', summary: signals.personnel?.summary ?? '', status: signals.personnel?.status },
    { domain: 'district_balance', summary: signals.districts?.summary ?? '', status: signals.districts?.status },
  ];

  const pick = ranked.find(
    (r) =>
      r.summary.trim() &&
      (r.status === 'critical' || r.status === 'strained' || r.status === 'watch'),
  );
  if (!pick) return null;

  return buildModel({
    id: `tomorrow-signal-${input.day}`,
    domain: pick.domain,
    summary: pick.summary,
    source: 'operation_signal',
    day: input.day,
    debugReason: 'operation_signal:watch',
  });
}

function candidateFromPilotTheme(input: ReportTomorrowPreviewInput): ReportTomorrowPreviewModel | null {
  const theme =
    input.pilotTheme ??
    (() => {
      const next = getPilotThemeForDay(input.day + 1);
      if (!next) return null;
      return {
        reportSummary: next.reportSummary,
        emphasisTags: next.emphasisTags,
        domain: next.domain,
      };
    })();
  const summary = theme?.reportSummary?.trim();
  if (!summary) return null;

  const domain = echoDomainToPreview(theme?.domain ?? inferCarryOverDomainFromText(summary));
  return buildModel({
    id: `tomorrow-theme-${input.day}`,
    domain,
    summary,
    source: 'pilot_theme',
    day: input.day,
    debugReason: 'pilot_theme:next_day',
  });
}

export function buildReportTomorrowFallback(
  day: number,
  domain: ReportTomorrowPreviewDomain = 'generic_operation',
): ReportTomorrowPreviewModel | null {
  if (day === 1) return null;
  if (day > 7) return null;

  const template = DOMAIN_TEMPLATES[domain];
  return buildModel({
    id: `tomorrow-fallback-${day}-${domain}`,
    domain,
    summary: template.summary,
    source: 'fallback',
    day,
    titleOverride: template.title,
    toneOverride: template.tone,
    debugReason: 'fallback:template',
  });
}

type SourceBuilder = {
  source: ReportTomorrowPreviewSource;
  build: (input: ReportTomorrowPreviewInput) => ReportTomorrowPreviewModel | null;
};

const SOURCE_BUILDERS: SourceBuilder[] = [
  { source: 'carry_over', build: candidateFromCarryOver },
  { source: 'event_echo', build: candidateFromEventEcho },
  { source: 'event_domain', build: candidateFromEventDomain },
  { source: 'dynamic_social_echo', build: candidateFromSocialEcho },
  { source: 'daily_report', build: candidateFromDailyReport },
  { source: 'operation_signal', build: candidateFromOperationSignals },
  { source: 'pilot_theme', build: candidateFromPilotTheme },
];

function hasRealTomorrowData(input: ReportTomorrowPreviewInput): boolean {
  if (input.carryOverMemory?.summary?.trim()) return true;
  if (input.eventEchoBundle?.tomorrowHint?.trim()) return true;
  if (input.eventDomainFocus?.reportEchoLine?.trim()) return true;
  if (input.socialEcho?.mention?.trim()) return true;
  if (collectReportLines(input.currentReport).length > 0) return true;
  if (input.lastEventResult?.summaryText?.trim()) return true;
  if (input.operationSignals) {
    const statuses = [
      input.operationSignals.overall?.status,
      input.operationSignals.vehicles?.status,
      input.operationSignals.containers?.status,
      input.operationSignals.personnel?.status,
      input.operationSignals.districts?.status,
    ];
    if (statuses.some((s) => s === 'watch' || s === 'strained' || s === 'critical')) {
      return true;
    }
  }
  return false;
}

export function buildReportTomorrowPreview(
  input: ReportTomorrowPreviewInput,
): ReportTomorrowPreviewModel | null {
  if (!input.day || input.day === 1) return null;

  const existingLines = input.existingLines ?? [];
  const domain = inferReportTomorrowDomain(input);

  for (const { build } of SOURCE_BUILDERS) {
    const candidate = build(input);
    const deduped = suppressTomorrowPreviewDuplicate(candidate, existingLines);
    if (deduped) return deduped;
  }

  if (input.day > 7 && !hasRealTomorrowData(input)) {
    return null;
  }

  return suppressTomorrowPreviewDuplicate(
    buildReportTomorrowFallback(input.day, domain),
    existingLines,
  );
}

export function buildReportTomorrowPreviewSummary(
  input: ReportTomorrowPreviewInput,
): ReportTomorrowPreviewSummary {
  const warnings: string[] = [];
  const preview = buildReportTomorrowPreview(input);
  if (!preview && input.day > 1 && input.day <= 7) {
    warnings.push('no_preview_built');
  }
  return {
    preview: preview ?? undefined,
    warnings,
    sourceOrder: [...REPORT_TOMORROW_PREVIEW_SOURCES],
  };
}

export function shouldShowReportTomorrowPreview(
  day: number,
  input: ReportTomorrowPreviewInput,
): boolean {
  if (day === 1) return false;
  const preview = buildReportTomorrowPreview(input);
  if (!preview) return false;
  if (preview.visibility === 'hidden') return false;
  if (day > 7 && preview.source === 'fallback') return false;
  return true;
}

export function formatReportTomorrowPreviewForDebug(
  model: ReportTomorrowPreviewModel | null | undefined,
): string {
  if (!model) return 'tomorrow-preview: null';
  return [
    'tomorrow-preview',
    `domain=${model.domain}`,
    `source=${model.source}`,
    `visibility=${model.visibility}`,
    `title=${model.title}`,
    `summary=${model.summary.slice(0, 48)}`,
    model.debugReason ? `reason=${model.debugReason}` : '',
  ]
    .filter(Boolean)
    .join(' | ');
}

export function buildReportTomorrowPreviewFromEchoContext(args: {
  day: number;
  event: { id: string; title?: string; contentCategory?: string; neighborhoodId?: string };
  result?: { summaryTitle?: string; resultTone?: string };
}): ReportTomorrowPreviewModel | null {
  const ctx = buildEchoContextFromEventResult({
    event: args.event,
    day: args.day,
    result: args.result
      ? {
          successLabel: args.result.summaryTitle,
          tone: args.result.resultTone,
        }
      : undefined,
    hasCarryOver: true,
  });
  const hint = buildTomorrowHintLine(ctx);
  if (!hint) return null;
  return buildModel({
    id: `tomorrow-echo-ctx-${args.day}`,
    domain: echoDomainToPreview(ctx.domain),
    summary: hint,
    source: 'event_echo',
    day: args.day,
    debugReason: 'event_echo:context',
  });
}

export function isReportTomorrowPreviewDuplicateOf(
  preview: ReportTomorrowPreviewModel | null | undefined,
  otherSummary: string | null | undefined,
): boolean {
  if (!preview?.summary || !otherSummary?.trim()) return false;
  return suppressTomorrowPreviewDuplicate(preview, [otherSummary]) == null;
}
