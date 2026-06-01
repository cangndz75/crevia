import { getDistrictIdentity, normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { buildSocialEchoMention } from '@/core/contentPacks/eventEchoPresentation';
import {
  buildEchoContextFromEventResult,
  inferEchoDomainFromEvent,
  inferOutcomeBandFromResult,
} from '@/core/contentPacks/eventEchoSelectors';
import type { EventEchoDomain, EventEchoOutcomeBand } from '@/core/contentPacks/eventEchoTypes';
import { inferCarryOverDomainFromText, inferCarryOverTone } from '@/core/carryOver/carryOverMemorySelectors';
import { inferEventDomainUiFocus } from '@/core/events/eventDomainPresentation';

import type {
  SocialDecisionEchoModel,
  SocialEchoContext,
  SocialEchoDomain,
  SocialEchoSentiment,
  SocialEchoSource,
  SocialEchoSummary,
  SocialEchoTone,
  SocialEchoVisibility,
} from './socialEchoTypes';
import {
  validateSocialEchoForbiddenWords,
  validateSocialEchoNoDuplicateWithCarryOver,
  validateSocialEchoNoDuplicateWithResultEcho,
} from './socialEchoValidation';

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stablePickIndex(seed: string, size: number): number {
  if (size <= 0) return 0;
  return stableHash(seed) % size;
}

function clampMention(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function mapEchoDomainToSocial(domain: EventEchoDomain): SocialEchoDomain {
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

function mapUiFocusToSocial(focus: string): SocialEchoDomain {
  switch (focus) {
    case 'container':
      return 'container';
    case 'vehicle_route':
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

function mapCarryOverDomain(domain?: string): SocialEchoDomain {
  if (!domain) return 'generic_operation';
  if (domain === 'vehicle_route') return 'vehicle_route';
  return mapUiFocusToSocial(domain);
}

export function inferSocialEchoDomain(context: SocialEchoContext): SocialEchoDomain {
  if (context.eventDomainFocus?.focus) {
    return mapUiFocusToSocial(context.eventDomainFocus.focus);
  }
  if (context.carryOverMemory?.domain) {
    return mapCarryOverDomain(context.carryOverMemory.domain);
  }
  if (context.currentEvent) {
    return mapEchoDomainToSocial(inferEchoDomainFromEvent(context.currentEvent));
  }
  if (context.eventResult?.eventTitle) {
    return inferCarryOverDomainFromText(context.eventResult.eventTitle);
  }
  return 'generic_operation';
}

function sentimentFromOutcomeBand(band: EventEchoOutcomeBand | string | undefined): SocialEchoSentiment {
  switch (band) {
    case 'strong_success':
    case 'partial_success':
      return 'positive';
    case 'strained_success':
      return 'mixed';
    case 'weak':
    case 'unresolved':
      return 'concerned';
    default:
      return 'mixed';
  }
}

export function inferSocialEchoSentiment(context: SocialEchoContext): SocialEchoSentiment {
  const tone = context.carryOverMemory?.tone?.toLowerCase();
  if (tone === 'positive') return 'positive';
  if (tone === 'warning') return 'concerned';
  if (context.eventResult?.resultTone === 'positive') return 'positive';
  if (context.eventResult?.resultTone === 'negative') return 'concerned';

  const band =
    (context.outcomeBand as EventEchoOutcomeBand | undefined) ??
    (context.eventResult
      ? inferOutcomeBandFromResult({
          publicSatisfactionDelta: context.eventResult.publicSatisfactionDelta,
          riskDelta: context.eventResult.riskDelta,
          successLabel: context.eventResult.summaryTitle,
          tone: context.eventResult.resultTone,
        })
      : undefined);

  const domain = inferSocialEchoDomain(context);
  if (domain === 'crisis_adjacent') {
    return band === 'strong_success' || band === 'partial_success' ? 'recovery' : 'concerned';
  }
  return sentimentFromOutcomeBand(band);
}

export function buildSocialEchoContext(args: Partial<SocialEchoContext> & { day: number }): SocialEchoContext {
  const event = args.currentEvent ?? (args.eventResult
    ? {
        id: args.eventResult.eventId,
        title: args.eventResult.eventTitle,
        neighborhoodId: args.eventResult.neighborhoodId,
      }
    : null);

  const districtId =
    args.districtId ??
    args.eventResult?.neighborhoodId ??
    (event?.neighborhoodId as string | undefined);

  const resultEchoText =
    args.resultEchoText ??
    args.eventResult?.subsystemOutcomes?.find((o) => o.key === 'social')?.primaryText;

  return {
    day: args.day,
    currentEvent: event ?? undefined,
    eventResult: args.eventResult,
    eventDomainFocus: args.eventDomainFocus,
    carryOverMemory: args.carryOverMemory,
    dailyReport: args.dailyReport,
    operationSignals: args.operationSignals,
    socialPulseState: args.socialPulseState,
    outcomeBand: args.outcomeBand,
    districtId,
    selectedDecisionKind: args.selectedDecisionKind,
    resultEchoText,
    excludeMentions: args.excludeMentions ?? [],
  };
}

export function shouldShowSocialDecisionEcho(day: number, context: SocialEchoContext): boolean {
  if (day > 7 && !context.eventResult && !context.currentEvent) {
    return false;
  }
  const visibility = getSocialEchoVisibility(day, context);
  return visibility !== 'hidden';
}

export function getSocialEchoVisibility(day: number, context: SocialEchoContext): SocialEchoVisibility {
  if (day === 1) return 'hidden';
  if (day > 7 && !context.eventResult?.eventId && !context.currentEvent?.id) {
    return 'hidden';
  }
  if (day === 7) return 'compact';
  if (day === 4) return 'highlighted';
  if (day === 2 && inferSocialEchoDomain(context) === 'container') {
    return 'compact';
  }
  if (day === 6 && inferSocialEchoDomain(context) === 'crisis_adjacent') {
    return 'standard';
  }
  if (inferSocialEchoDomain(context) === 'social') {
    return day >= 4 ? 'highlighted' : 'standard';
  }
  return 'standard';
}

const TITLE_POOL = [
  'Kararın Yankısı',
  'Mahallede Konuşulan',
  'Sosyal Nabızda İz',
  'Bugünkü Tepki',
  'Mahalle Gözlemi',
] as const;

const FALLBACK_BY_DOMAIN: Record<
  SocialEchoDomain,
  Partial<Record<SocialEchoSentiment, string[]>>
> = {
  container: {
    positive: [
      "Cumhuriyet'te yolun açıldığı fark edildi; ekiplerin hızlı gelmesi olumlu konuşuluyor.",
    ],
    mixed: [
      'Konteyner çevresi toparlandı ama aynı aracın tekrar sahaya çıkması dikkat çekiyor.',
    ],
    concerned: [
      'Konteyner hattında bekleme algısı azalmadı; mahalle sabırlı ama izliyor.',
    ],
    recovery: [
      'Konteyner baskısı düşüyor; mahallede toparlanma sinyali konuşuluyor.',
    ],
  },
  vehicle_route: {
    concerned: [
      "İstasyon'da geçiş rahatladı, fakat araçların aynı hatta yorulduğu konuşuluyor.",
    ],
    mixed: [
      'Rota hızlandı; aynı kamyonun üst üste sahada kalması dikkat çekiyor.',
    ],
    positive: [
      'Araç geçişi düzeldi; mahallede gecikme şikayeti azaldığı konuşuluyor.',
    ],
  },
  personnel: {
    mixed: [
      'Ekip hızlı çalıştı; mahallede aynı ekibin üst üste sahada olması fark edildi.',
    ],
    positive: [
      'Ekip temposu olumlu; mahallede düzenli çalışma güven verdi.',
    ],
    concerned: [
      'Ekip yorgunluğu konuşuluyor; rotasyon ihtiyacı fark edildi.',
    ],
  },
  social: {
    positive: [
      "Merkez'de küçük sorun büyümeden açıklama yapılması güven verdi.",
    ],
    neutral: [
      'Mahallede görünür iletişim sakinleşmeyi destekledi.',
    ],
    concerned: [
      'Sosyal nabız hassas; açıklama hızı konuşuluyor.',
    ],
  },
  crisis_adjacent: {
    concerned: [
      "Sanayi'de risk büyümeden izleniyor, ama gecikme olursa konu tekrar açılır.",
    ],
    recovery: [
      'Risk sinyali sakinleşti; önleyici hamle mahallede fark edildi.',
    ],
    mixed: [
      'Birleşen sinyaller izleniyor; panik yok ama dikkat çekiyor.',
    ],
  },
  district_balance: {
    concerned: [
      'Merkez toparlandı; Sanayi tarafında bekleme algısı büyümesin diye gözler yarında.',
    ],
    mixed: [
      'Bir mahallede hız alındı; diğer tarafta adalet algısı konuşuluyor.',
    ],
    positive: [
      'Mahalleler arası denge korunuyor; dağılım adil konuşuluyor.',
    ],
  },
  generic_operation: {
    neutral: [
      'Saha kararı mahallede kısa süreli yankı buldu; nabız izleniyor.',
    ],
    mixed: [
      'Operasyon kararı konuşuldu; etki henüz netleşmedi.',
    ],
    positive: [
      'Günlük operasyon sakin seyrediyor; mahalle tepkisi dengeli.',
    ],
  },
};

function resolveDistrictLabel(context: SocialEchoContext): string | undefined {
  const id = normalizeMapDistrictId(context.districtId ?? '');
  if (!id) {
    return context.eventResult?.neighborhoodName?.trim();
  }
  return getDistrictIdentity(id as MapDistrictId).shortLabel;
}

function pickTitle(context: SocialEchoContext): string {
  const idx = stablePickIndex(`title:${context.day}:${inferSocialEchoDomain(context)}`, TITLE_POOL.length);
  return TITLE_POOL[idx] ?? TITLE_POOL[0]!;
}

function toneForDomain(domain: SocialEchoDomain, sentiment: SocialEchoSentiment): SocialEchoTone {
  if (domain === 'social') return 'coral';
  if (domain === 'vehicle_route') return 'amber';
  if (domain === 'personnel') return 'mint';
  if (domain === 'container') return 'teal';
  if (sentiment === 'concerned') return 'amber';
  if (sentiment === 'positive' || sentiment === 'recovery') return 'teal';
  return 'neutral';
}

function iconForDomain(domain: SocialEchoDomain): string {
  switch (domain) {
    case 'container':
      return 'trash-outline';
    case 'vehicle_route':
      return 'car-outline';
    case 'personnel':
      return 'people-outline';
    case 'social':
      return 'chatbubbles-outline';
    case 'crisis_adjacent':
      return 'pulse-outline';
    case 'district_balance':
      return 'map-outline';
    default:
      return 'pulse-outline';
  }
}

function tagsForModel(domain: SocialEchoDomain, sentiment: SocialEchoSentiment): string[] {
  const tags: string[] = [];
  if (domain === 'container') tags.push('Konteyner');
  if (domain === 'vehicle_route') tags.push('Araç');
  if (domain === 'personnel') tags.push('Ekip');
  if (domain === 'social') tags.push('Sosyal');
  if (domain === 'crisis_adjacent') tags.push('Risk');
  if (domain === 'district_balance') tags.push('Denge');
  if (sentiment === 'positive' || sentiment === 'recovery') tags.push('Olumlu');
  if (sentiment === 'concerned') tags.push('İzleniyor');
  return tags.slice(0, 2);
}

function isDuplicateMention(a: string, b: string): boolean {
  return !validateSocialEchoNoDuplicateWithResultEcho(
    { mention: a } as SocialDecisionEchoModel,
    b,
  );
}

function isExcluded(text: string, context: SocialEchoContext): boolean {
  const exclude = [
    ...(context.excludeMentions ?? []),
    context.resultEchoText,
    context.carryOverMemory?.summary,
  ].filter((x): x is string => Boolean(x?.trim()));
  return exclude.some((e) => isDuplicateMention(text, e));
}

function buildModelFromMention(args: {
  context: SocialEchoContext;
  mention: string;
  source: SocialEchoSource;
  debugReason?: string;
}): SocialDecisionEchoModel | null {
  const { context, mention, source, debugReason } = args;
  const trimmed = clampMention(mention);
  if (!trimmed) return null;
  if (isExcluded(trimmed, context)) return null;
  if (validateSocialEchoForbiddenWords({
    id: 'x',
    title: 't',
    mention: trimmed,
    domain: 'generic_operation',
    sentiment: 'neutral',
    source,
    visibility: 'standard',
    tags: [],
    iconKey: 'pulse-outline',
    tone: 'neutral',
    maxLines: 2,
  }).length > 0) {
    return null;
  }

  const domain = inferSocialEchoDomain(context);
  const sentiment = inferSocialEchoSentiment(context);
  const visibility = getSocialEchoVisibility(context.day, context);
  if (visibility === 'hidden') return null;

  const eventId = context.currentEvent?.id ?? context.eventResult?.eventId ?? 'day';
  const id = `social-echo-${eventId}-${context.day}-${source}-${domain}`;

  return {
    id,
    title: pickTitle(context),
    mention: trimmed,
    districtLabel: resolveDistrictLabel(context),
    domain,
    sentiment,
    source,
    visibility,
    tags: tagsForModel(domain, sentiment),
    iconKey: iconForDomain(domain),
    tone: toneForDomain(domain, sentiment),
    maxLines: 2,
    debugReason,
  };
}

export function selectStableSocialMention(context: SocialEchoContext): string | null {
  if (context.currentEvent) {
    const echoCtx = buildEchoContextFromEventResult({
      event: context.currentEvent,
      day: context.day,
      districtId: normalizeMapDistrictId(context.districtId ?? '') ?? undefined,
      result: context.eventResult
        ? {
            publicSatisfactionDelta: context.eventResult.publicSatisfactionDelta,
            riskDelta: context.eventResult.riskDelta,
            successLabel: context.eventResult.summaryTitle,
            tone: context.eventResult.resultTone,
          }
        : undefined,
      themeDomain: inferSocialEchoDomain(context),
    });
    const mention = buildSocialEchoMention(echoCtx);
    if (mention && !isExcluded(mention, context)) return mention;
  }
  return null;
}

function pickFallbackMention(context: SocialEchoContext): string | null {
  const domain = inferSocialEchoDomain(context);
  const sentiment = inferSocialEchoSentiment(context);
  const pool =
    FALLBACK_BY_DOMAIN[domain][sentiment] ??
    FALLBACK_BY_DOMAIN[domain].mixed ??
    FALLBACK_BY_DOMAIN[domain].neutral ??
    FALLBACK_BY_DOMAIN.generic_operation.neutral ??
  [];
  if (pool.length === 0) return null;
  const seed = `${context.currentEvent?.id ?? context.eventResult?.eventId ?? 'day'}:${context.day}:${domain}:${sentiment}:social-fallback`;
  let idx = stablePickIndex(seed, pool.length);
  for (let i = 0; i < pool.length; i += 1) {
    const candidate = pool[(idx + i) % pool.length]!;
    if (!isExcluded(candidate, context)) return candidate;
  }
  return pool[0] ?? null;
}

export function buildSocialEchoFallback(context: SocialEchoContext): SocialDecisionEchoModel | null {
  const mention = pickFallbackMention(context);
  if (!mention) return null;
  return buildModelFromMention({
    context,
    mention,
    source: 'fallback',
    debugReason: 'generic_fallback',
  });
}

export function buildSocialDecisionEcho(context: SocialEchoContext): SocialDecisionEchoModel | null {
  if (context.day > 7 && !context.currentEvent?.id && !context.eventResult?.eventId) {
    return null;
  }
  if (!shouldShowSocialDecisionEcho(context.day, context)) {
    return null;
  }

  const eventMention = selectStableSocialMention(context);
  if (eventMention) {
    const model = buildModelFromMention({
      context,
      mention: eventMention,
      source: 'event_echo',
      debugReason: 'event_echo_social_mention',
    });
    if (model) return model;
  }

  const carrySummary = context.carryOverMemory?.summary?.trim();
  if (
    carrySummary &&
    validateSocialEchoNoDuplicateWithCarryOver(
      { mention: carrySummary } as SocialDecisionEchoModel,
      context.carryOverMemory,
    ) &&
    !isExcluded(carrySummary, context)
  ) {
    const adapted = clampMention(
      carrySummary.length > 120
        ? `${carrySummary.slice(0, 100).trimEnd()}… mahallede konuşuluyor.`
        : carrySummary,
    );
    const model = buildModelFromMention({
      context,
      mention: adapted,
      source: 'carry_over',
      debugReason: 'carry_over_hint',
    });
    if (model && validateSocialEchoNoDuplicateWithCarryOver(model, context.carryOverMemory)) {
      return model;
    }
  }

  const domainLine = context.eventDomainFocus?.socialEchoLine?.trim();
  if (domainLine && !isExcluded(domainLine, context)) {
    const model = buildModelFromMention({
      context,
      mention: domainLine,
      source: 'event_domain',
      debugReason: 'event_domain_social_echo_line',
    });
    if (model) return model;
  }

  const reportLine =
    context.dailyReport?.socialSummaryLines?.find((l) => l.trim()) ??
    context.dailyReport?.carryOverSummaryLines?.find((l) => l.trim());
  if (reportLine && !isExcluded(reportLine, context)) {
    const model = buildModelFromMention({
      context,
      mention: reportLine,
      source: 'daily_report',
      debugReason: 'daily_report_line',
    });
    if (model) return model;
  }

  const signals = context.operationSignals;
  const signalLine =
    signals?.social?.summary?.trim() ||
    signals?.overall?.summary?.trim() ||
    signals?.vehicles?.summary?.trim() ||
    signals?.containers?.summary?.trim();
  if (signalLine && !isExcluded(signalLine, context)) {
    const model = buildModelFromMention({
      context,
      mention: clampMention(signalLine),
      source: 'operation_signal',
      debugReason: 'operation_signal_summary',
    });
    if (model) return model;
  }

  return buildSocialEchoFallback(context);
}

export function buildSocialEchoSummary(context: SocialEchoContext): SocialEchoSummary {
  const warnings: string[] = [];
  const primary = buildSocialDecisionEcho(context);
  if (primary && context.resultEchoText) {
    if (!validateSocialEchoNoDuplicateWithResultEcho(primary, context.resultEchoText)) {
      warnings.push('duplicate_with_result_echo');
      const fallback = buildSocialEchoFallback({
        ...context,
        excludeMentions: [...(context.excludeMentions ?? []), context.resultEchoText],
      });
      return {
        visibleEchoes: fallback ? [fallback] : [],
        primaryEcho: fallback,
        warnings,
      };
    }
  }
  return {
    visibleEchoes: primary ? [primary] : [],
    primaryEcho: primary,
    warnings,
  };
}

export function isSocialEchoSelectionDeterministic(context: SocialEchoContext): boolean {
  const a = buildSocialDecisionEcho(context);
  const b = buildSocialDecisionEcho(context);
  return a?.mention === b?.mention && a?.source === b?.source;
}

export function inferSocialEchoDomainFromEventLike(
  event: NonNullable<SocialEchoContext['currentEvent']>,
): SocialEchoDomain {
  return mapEchoDomainToSocial(inferEchoDomainFromEvent(event));
}

export function inferSocialEchoDomainFromText(text: string): SocialEchoDomain {
  return mapCarryOverDomain(inferCarryOverDomainFromText(text));
}

export function inferSocialEchoToneFromCarryOver(
  text: string,
  direction?: import('@/core/carryOver/carryOverMemoryTypes').CarryOverDirection,
): SocialEchoSentiment {
  return inferCarryOverTone({ text, direction }) === 'positive' ? 'positive' : 'concerned';
}
