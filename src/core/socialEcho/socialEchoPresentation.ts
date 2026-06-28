import type {
  SocialDecisionEchoModel,
  SocialEchoContext,
  SocialEchoPresentation,
  SocialEchoPresentationSource,
  SocialEchoPresentationTone,
  SocialEchoSummary,
  SocialEchoSurface,
} from './socialEchoTypes';
import {
  buildSocialDecisionEcho,
  buildSocialEchoContext,
  buildSocialEchoSummary,
} from './socialEchoSelectors';

export type SocialDecisionEchoCardViewModel = {
  title: string;
  mention: string;
  tags: string[];
  iconKey: string;
  tone: SocialDecisionEchoModel['tone'];
  maxLines: number;
  compact: boolean;
  visibility: SocialDecisionEchoModel['visibility'];
};

export function buildSocialDecisionEchoCardModel(
  context: SocialEchoContext,
): SocialDecisionEchoCardViewModel | null {
  const echo = buildSocialDecisionEcho(context);
  if (!echo) return null;
  const compact = echo.visibility === 'compact' || echo.visibility === 'hidden';
  return {
    title: echo.title,
    mention: echo.mention,
    tags: echo.tags.slice(0, 2),
    iconKey: echo.iconKey,
    tone: echo.tone,
    maxLines: echo.maxLines,
    compact,
    visibility: echo.visibility,
  };
}

export function buildSocialPulseEchoLine(context: SocialEchoContext): string | undefined {
  const echo = buildSocialDecisionEcho(context);
  return echo?.mention;
}

export function buildSocialEchoTopicLabel(model: SocialDecisionEchoModel): string {
  if (model.districtLabel) {
    return `${model.districtLabel} · ${model.tags[0] ?? 'Sosyal'}`;
  }
  return model.tags[0] ?? 'Sosyal Nabız';
}

export function buildSocialEchoTagList(model: SocialDecisionEchoModel): string[] {
  return model.tags.slice(0, 2);
}

export function buildSocialEchoDebugSummary(summary: SocialEchoSummary): string {
  const primary = summary.primaryEcho;
  return [
    `echo=${primary?.mention?.slice(0, 48) ?? '-'}`,
    `source=${primary?.source ?? '-'}`,
    `domain=${primary?.domain ?? '-'}`,
    `visibility=${primary?.visibility ?? '-'}`,
    `warnings=${summary.warnings.join(',') || '-'}`,
  ].join(' | ');
}

type CityReactionLike = {
  reactionId?: string;
  eventId?: string;
  districtId?: string;
  districtName?: string;
  tone?: SocialEchoPresentationTone;
  socialEcho?: {
    sourceLabel?: string;
    line?: string;
    tone?: SocialEchoPresentationTone;
  };
};

const SOURCE_TITLE: Record<SocialEchoPresentationSource, string> = {
  citizen: 'Vatandaş yorumu',
  district: 'Mahalle gündemi',
  press: 'Basın notu',
  field: 'Saha geri bildirimi',
  advisor: 'ECE önerisi',
  system: 'Şehir akışı',
};

const SOURCE_ICON: Record<SocialEchoPresentationSource, string> = {
  citizen: 'chatbubble-ellipses-outline',
  district: 'map-outline',
  press: 'newspaper-outline',
  field: 'people-outline',
  advisor: 'sparkles-outline',
  system: 'pulse-outline',
};

function clampSocialEchoText(value: string | undefined, max: number): string {
  const cleaned = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function normalizeEchoText(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ') ?? '';
}

function echoTextsDuplicate(left: string | undefined, right: string | undefined): boolean {
  const a = normalizeEchoText(left);
  const b = normalizeEchoText(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const minLength = Math.min(a.length, b.length);
  if (minLength < 24) return false;
  return a.includes(b.slice(0, 24)) || b.includes(a.slice(0, 24));
}

function sourceFromLabel(label: string | undefined): SocialEchoPresentationSource {
  const normalized = normalizeEchoText(label);
  if (/basın|basin|medya|haber/.test(normalized)) return 'press';
  if (/saha|ekip|araç|arac|konteyner|kaynak/.test(normalized)) return 'field';
  if (/mahalle|gündem|gundem|denge/.test(normalized)) return 'district';
  if (/ece|öneri|oneri|danışman|danisman/.test(normalized)) return 'advisor';
  if (/sistem|şehir|sehir|akış|akis/.test(normalized)) return 'system';
  return 'citizen';
}

function sourceFromDecisionEcho(
  echo: SocialDecisionEchoModel,
  surface: SocialEchoSurface,
): SocialEchoPresentationSource {
  if (echo.domain === 'personnel' || echo.domain === 'vehicle_route' || echo.domain === 'container') {
    return 'field';
  }
  if (echo.domain === 'district_balance') return 'district';
  if (echo.sentiment === 'concerned' && (surface === 'report' || surface === 'result')) {
    return 'press';
  }
  if (echo.source === 'fallback') return 'system';
  return 'citizen';
}

function toneFromDecisionEcho(echo: SocialDecisionEchoModel): SocialEchoPresentationTone {
  if (echo.sentiment === 'positive' || echo.sentiment === 'recovery') return 'positive';
  if (echo.sentiment === 'concerned') return 'warning';
  if (echo.sentiment === 'mixed') return 'mixed';
  return 'neutral';
}

function priorityForEcho(tone: SocialEchoPresentationTone, source: SocialEchoPresentationSource): number {
  const toneScore: Record<SocialEchoPresentationTone, number> = {
    critical: 100,
    warning: 88,
    mixed: 72,
    positive: 62,
    neutral: 42,
  };
  const sourceScore: Record<SocialEchoPresentationSource, number> = {
    press: 8,
    field: 7,
    district: 6,
    citizen: 5,
    advisor: 3,
    system: 1,
  };
  return toneScore[tone] + sourceScore[source];
}

function compactToneMessage(
  tone: SocialEchoPresentationTone,
  districtName: string | undefined,
  surface: SocialEchoSurface,
): string {
  const prefix = districtName ? `${districtName} çevresinde ` : '';
  if (surface === 'report') {
    switch (tone) {
      case 'positive':
        return `${prefix}güven toparlandı; sosyal etki gün sonuna işlendi.`;
      case 'mixed':
        return `${prefix}güven toparlandı, ancak beklenti izlenmeli.`;
      case 'warning':
        return `${prefix}sosyal beklenti yükseldi; yarın görünür takip gerekebilir.`;
      case 'critical':
        return `${prefix}basın ve mahalle baskısı belirginleşti.`;
      default:
        return `${prefix}sosyal nabız dengede kaldı.`;
    }
  }
  switch (tone) {
    case 'positive':
      return `${prefix}güven toparlanıyor.`;
    case 'mixed':
      return `${prefix}güven toparlandı, baskı izleniyor.`;
    case 'warning':
      return `${prefix}sosyal beklenti yükseldi.`;
    case 'critical':
      return `${prefix}mahalle baskısı kritik izleme istiyor.`;
    default:
      return `${prefix}sosyal nabız stabil.`;
  }
}

function messageLimitForSurface(surface: SocialEchoSurface): number {
  if (surface === 'report') return 110;
  if (surface === 'result') return 108;
  if (surface === 'map') return 96;
  return 92;
}

function titleForSurface(
  source: SocialEchoPresentationSource,
  surface: SocialEchoSurface,
): string {
  if (surface === 'map') return source === 'district' ? 'Mahalle sesi' : 'Sosyal yankı';
  if (surface === 'report') return 'Bugünün sosyal izi';
  return SOURCE_TITLE[source];
}

function shouldUseCompactMessage(surface: SocialEchoSurface): boolean {
  return surface === 'hub' || surface === 'recentImpact' || surface === 'map' || surface === 'report';
}

function buildSurfaceMessage(input: {
  baseMessage: string;
  tone: SocialEchoPresentationTone;
  districtName?: string;
  surface: SocialEchoSurface;
}): string {
  const raw = shouldUseCompactMessage(input.surface)
    ? compactToneMessage(input.tone, input.districtName, input.surface)
    : input.baseMessage;
  return clampSocialEchoText(raw, messageLimitForSurface(input.surface));
}

function conflictsWithExisting(message: string, existing: readonly string[] | undefined): boolean {
  return (existing ?? []).some((line) => echoTextsDuplicate(message, line));
}

export function buildSocialEchoPresentation(input: {
  echo: SocialDecisionEchoModel | null | undefined;
  surface: SocialEchoSurface;
  day?: number;
  districtName?: string;
  eventId?: string;
  excludeMessages?: readonly string[];
  action?: SocialEchoPresentation['action'];
}): SocialEchoPresentation | null {
  const { echo, surface } = input;
  if (!echo || echo.visibility === 'hidden') return null;
  const source = sourceFromDecisionEcho(echo, surface);
  const tone = toneFromDecisionEcho(echo);
  const districtName = input.districtName ?? echo.districtLabel;
  const message = buildSurfaceMessage({
    baseMessage: echo.mention,
    tone,
    districtName,
    surface,
  });
  if (!message || conflictsWithExisting(message, input.excludeMessages)) return null;
  return {
    id: `${echo.id}-${surface}`,
    source,
    tone,
    title: titleForSurface(source, surface),
    message,
    districtName,
    eventId: input.eventId,
    icon: SOURCE_ICON[source],
    priority: priorityForEcho(tone, source),
    surface,
    ttl: surface === 'result' ? 1 : undefined,
    action: input.action,
  };
}

export function buildPostDecisionSocialEcho(input: {
  cityReaction: CityReactionLike | null | undefined;
  surface: SocialEchoSurface;
  day?: number;
  excludeMessages?: readonly string[];
  action?: SocialEchoPresentation['action'];
}): SocialEchoPresentation | null {
  const { cityReaction, surface } = input;
  const line = cityReaction?.socialEcho?.line?.trim();
  if (!cityReaction || !line) return null;
  const source = sourceFromLabel(cityReaction.socialEcho?.sourceLabel);
  const tone = cityReaction.tone ?? cityReaction.socialEcho?.tone ?? 'neutral';
  const message = buildSurfaceMessage({
    baseMessage: line,
    tone,
    districtName: cityReaction.districtName,
    surface,
  });
  if (!message || conflictsWithExisting(message, input.excludeMessages)) return null;
  return {
    id: `${cityReaction.reactionId ?? cityReaction.eventId ?? 'city-reaction'}-${surface}`,
    source,
    tone,
    title: titleForSurface(source, surface),
    message,
    districtName: cityReaction.districtName,
    eventId: cityReaction.eventId,
    icon: SOURCE_ICON[source],
    priority: priorityForEcho(tone, source),
    surface,
    ttl: surface === 'result' ? 1 : undefined,
    action: input.action,
  };
}

export const buildPostDecisionSocialEchoPresentation = buildPostDecisionSocialEcho;

export function buildHubSocialPulseEcho(input: {
  echo?: SocialDecisionEchoModel | null;
  cityReaction?: CityReactionLike | null;
  day?: number;
  excludeMessages?: readonly string[];
}): SocialEchoPresentation | null {
  return (
    buildPostDecisionSocialEcho({
      cityReaction: input.cityReaction,
      surface: 'hub',
      day: input.day,
      excludeMessages: input.excludeMessages,
    }) ??
    buildSocialEchoPresentation({
      echo: input.echo,
      surface: 'hub',
      day: input.day,
      excludeMessages: input.excludeMessages,
    })
  );
}

export function buildMapSocialEcho(input: {
  echo?: SocialDecisionEchoModel | null;
  cityReaction?: CityReactionLike | null;
  day?: number;
  districtName?: string;
  eventId?: string;
  excludeMessages?: readonly string[];
}): SocialEchoPresentation | null {
  return (
    buildPostDecisionSocialEcho({
      cityReaction: input.cityReaction,
      surface: 'map',
      day: input.day,
      excludeMessages: input.excludeMessages,
    }) ??
    buildSocialEchoPresentation({
      echo: input.echo,
      surface: 'map',
      day: input.day,
      districtName: input.districtName,
      eventId: input.eventId,
      excludeMessages: input.excludeMessages,
    })
  );
}

export function buildReportSocialEcho(input: {
  echo?: SocialDecisionEchoModel | null;
  cityReaction?: CityReactionLike | null;
  day?: number;
  excludeMessages?: readonly string[];
}): SocialEchoPresentation | null {
  return (
    buildPostDecisionSocialEcho({
      cityReaction: input.cityReaction,
      surface: 'report',
      day: input.day,
      excludeMessages: input.excludeMessages,
    }) ??
    buildSocialEchoPresentation({
      echo: input.echo,
      surface: 'report',
      day: input.day,
      excludeMessages: input.excludeMessages,
    })
  );
}

export function buildTransientCityEchoPresentation(input: {
  echo?: SocialDecisionEchoModel | null;
  cityReaction?: CityReactionLike | null;
  surface: SocialEchoSurface;
  day?: number;
  excludeMessages?: readonly string[];
}): SocialEchoPresentation | null {
  return (
    buildPostDecisionSocialEcho({
      cityReaction: input.cityReaction,
      surface: input.surface,
      day: input.day,
      excludeMessages: input.excludeMessages,
    }) ??
    buildSocialEchoPresentation({
      echo: input.echo,
      surface: input.surface,
      day: input.day,
      excludeMessages: input.excludeMessages,
    })
  );
}

export function formatSocialEchoForDocs(): string {
  return [
    '# Dynamic Social Echo',
    '',
    'Deterministik sosyal karar yankısı presentation katmanı.',
    'Result, Hub, Harita ve Rapor yüzeyleri için kompakt organik echo modeli üretir.',
    '',
    '## Kaynak önceliği',
    '1. eventEcho social mention',
    '2. carry-over memory',
    '3. eventDomain socialEchoLine',
    '4. dailyReport / operationSignals',
    '5. domain fallback',
  ].join('\n');
}

export function buildSocialEchoContextFromPulseArgs(args: {
  day: number;
  lastDecisionResult?: SocialEchoContext['eventResult'];
  currentEvent?: SocialEchoContext['currentEvent'];
  eventDomainFocus?: SocialEchoContext['eventDomainFocus'];
  carryOverMemory?: SocialEchoContext['carryOverMemory'];
  dailyReport?: SocialEchoContext['dailyReport'];
  operationSignals?: SocialEchoContext['operationSignals'];
  socialPulseState?: SocialEchoContext['socialPulseState'];
}): SocialEchoContext {
  const resultEchoText = args.lastDecisionResult?.subsystemOutcomes?.find(
    (o) => o.key === 'social',
  )?.primaryText;

  return buildSocialEchoContext({
    day: args.day,
    eventResult: args.lastDecisionResult,
    currentEvent:
      args.currentEvent ??
      (args.lastDecisionResult
        ? {
            id: args.lastDecisionResult.eventId,
            title: args.lastDecisionResult.eventTitle,
            neighborhoodId: args.lastDecisionResult.neighborhoodId,
          }
        : undefined),
    eventDomainFocus: args.eventDomainFocus,
    carryOverMemory: args.carryOverMemory,
    dailyReport: args.dailyReport,
    operationSignals: args.operationSignals,
    socialPulseState: args.socialPulseState,
    resultEchoText,
  });
}

export { buildSocialEchoSummary, buildSocialDecisionEcho, buildSocialEchoContext };
