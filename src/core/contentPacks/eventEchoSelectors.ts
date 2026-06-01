import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  ADVISOR_ECHO_TEMPLATES,
  REPORT_ECHO_TEMPLATES,
  SOCIAL_ECHO_TEMPLATES,
  TOMORROW_HINT_ECHO_TEMPLATES,
} from './eventEchoCopy';
import type {
  AdvisorEchoTemplate,
  EventEchoBundle,
  EventEchoContext,
  EventEchoDomain,
  EventEchoOutcomeBand,
  EventEchoTemplate,
  EventLikeForEcho,
  ReportEchoTemplate,
  ResultLikeForEcho,
  SocialEchoTemplate,
  TomorrowHintEchoTemplate,
} from './eventEchoTypes';

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

function isDayAllowed(template: EventEchoTemplate, day: number): boolean {
  if (day === 1 && template.forbiddenInDay1) return false;
  if (day === 7 && template.allowInPilotFinal === false) return false;
  if (template.dayRange?.min != null && day < template.dayRange.min) return false;
  if (template.dayRange?.max != null && day > template.dayRange.max) return false;
  return true;
}

function matchesOutcome(template: EventEchoTemplate, band: EventEchoOutcomeBand): boolean {
  return template.outcomeBand.includes(band);
}

function scoreTemplate(
  template: EventEchoTemplate,
  context: EventEchoContext,
): number {
  let score = 0;
  if (template.domain === context.domain) score += 10;
  else if (
    (template.domain === 'vehicle' || template.domain === 'route') &&
    (context.domain === 'vehicle' || context.domain === 'route')
  ) {
    score += 6;
  } else if (template.domain === 'generic_operation') score += 1;

  if (template.districtIds?.length) {
    if (context.districtId && template.districtIds.includes(context.districtId)) {
      score += 8;
    } else {
      return -1;
    }
  }

  if (!matchesOutcome(template, context.outcomeBand)) return -1;
  if (!isDayAllowed(template, context.day)) return -1;

  if (template.tags.includes(context.domain)) score += 1;
  return score;
}

function selectFromPool<T extends EventEchoTemplate>(
  pool: T[],
  context: EventEchoContext,
  surfaceSalt: string,
  excludeTexts: string[],
): T | null {
  const ranked = pool
    .map((t) => ({ t, score: scoreTemplate(t, context) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    const fallback = pool.filter(
      (t) =>
        t.domain === 'generic_operation' &&
        matchesOutcome(t, context.outcomeBand) &&
        isDayAllowed(t, context.day),
    );
    if (fallback.length === 0) return null;
    const idx = stablePickIndex(
      `${context.eventId ?? 'evt'}:${context.day}:${surfaceSalt}:generic`,
      fallback.length,
    );
    return fallback[idx] ?? null;
  }

  const topScore = ranked[0]!.score;
  const top = ranked.filter((x) => x.score >= topScore - 2);
  const seed = `${context.eventId ?? 'evt'}:${context.day}:${context.domain}:${context.outcomeBand}:${surfaceSalt}`;
  let idx = stablePickIndex(seed, top.length);
  for (let attempt = 0; attempt < top.length; attempt += 1) {
    const candidate = top[(idx + attempt) % top.length]!.t;
    if (!excludeTexts.includes(candidate.text)) {
      return candidate as T;
    }
  }
  return top[0]!.t as T;
}

export function inferEchoDomainFromEvent(event: EventLikeForEcho): EventEchoDomain {
  const cat = `${event.contentCategory ?? ''} ${event.eventType ?? ''} ${event.category ?? ''}`.toLowerCase();
  const id = (event.id ?? '').toLowerCase();

  if (id.includes('csp1') || cat.includes('container') || cat.includes('waste')) {
    return 'container';
  }
  if (cat.includes('vehicle_route') || cat.includes('vehicle') || id.includes('arac')) {
    return 'vehicle';
  }
  if (cat.includes('route') || id.includes('rota')) {
    return 'route';
  }
  if (cat.includes('staff') || cat.includes('personnel') || id.includes('ekip')) {
    return 'personnel';
  }
  if (cat.includes('social') || cat.includes('social_media') || id.includes('sosyal')) {
    return 'social';
  }
  if (
    cat.includes('crisis') ||
    id.includes('sinyal') ||
    id.includes('risk') ||
    event.filterTags?.includes('crisis')
  ) {
    return 'crisis_adjacent';
  }
  if (id.includes('denge') || cat.includes('district')) {
    return 'district_balance';
  }
  if (id.includes('final') || event.eventType === 'final') {
    return 'pilot_final';
  }
  return 'generic_operation';
}

export function inferOutcomeBandFromResult(result: ResultLikeForEcho): EventEchoOutcomeBand {
  const sat = result.publicSatisfactionDelta ?? 0;
  const risk = result.riskDelta ?? 0;
  const label = (result.successLabel ?? result.tone ?? '').toLowerCase();

  if (label.includes('zayıf') || label.includes('weak') || sat < -5) return 'weak';
  if (label.includes('çözül') || label.includes('unresolved')) return 'unresolved';
  if (sat >= 8 && risk <= -5) return 'strong_success';
  if (sat >= 4 && risk <= 0) return 'partial_success';
  if (sat >= 0 && risk > 3) return 'strained_success';
  if (sat < 0 && risk > 0) return 'mixed';
  return 'mixed';
}

export function buildEchoContextFromEventResult(args: {
  event: EventLikeForEcho;
  day: number;
  districtId?: MapDistrictId;
  result?: ResultLikeForEcho;
  selectedDecisionKind?: EventEchoContext['selectedDecisionKind'];
  hasCarryOver?: boolean;
  themeDomain?: string;
}): EventEchoContext {
  const domain = inferEchoDomainFromEvent(args.event);
  const neighborhood = args.districtId ?? (args.event.neighborhoodId as MapDistrictId | undefined);

  return {
    eventId: args.event.id,
    day: args.day,
    districtId: neighborhood,
    domain,
    outcomeBand: args.result ? inferOutcomeBandFromResult(args.result) : 'mixed',
    selectedDecisionKind: args.selectedDecisionKind,
    hasCarryOver: args.hasCarryOver ?? false,
    themeDomain: args.themeDomain,
    resourcePressure: domain === 'vehicle' || domain === 'route' ? 'medium' : 'low',
    socialPressure: domain === 'social' ? 'high' : 'low',
    crisisPressure: domain === 'crisis_adjacent' ? 'high' : 'low',
  };
}

export function selectAdvisorEcho(context: EventEchoContext): AdvisorEchoTemplate | null {
  return selectFromPool(ADVISOR_ECHO_TEMPLATES, context, 'advisor', []);
}

export function selectSocialEcho(
  context: EventEchoContext,
  excludeTexts: string[] = [],
): SocialEchoTemplate | null {
  return selectFromPool(SOCIAL_ECHO_TEMPLATES, context, 'social', excludeTexts);
}

export function selectReportEcho(
  context: EventEchoContext,
  excludeTexts: string[] = [],
): ReportEchoTemplate | null {
  return selectFromPool(REPORT_ECHO_TEMPLATES, context, 'report', excludeTexts);
}

export function selectTomorrowHintEcho(
  context: EventEchoContext,
  excludeTexts: string[] = [],
): TomorrowHintEchoTemplate | null {
  return selectFromPool(TOMORROW_HINT_ECHO_TEMPLATES, context, 'tomorrow', excludeTexts);
}

export function buildEventEchoBundle(context: EventEchoContext): EventEchoBundle {
  const advisor = selectAdvisorEcho(context);
  const used: string[] = [];
  if (advisor?.text) used.push(advisor.text);

  const social = selectSocialEcho(context, used);
  if (social?.text) used.push(social.text);

  const report = selectReportEcho(context, used);
  if (report?.text) used.push(report.text);

  const tomorrow = selectTomorrowHintEcho(context, used);

  const tags = new Set<string>([
    context.domain,
    context.outcomeBand,
    `day-${context.day}`,
  ]);
  if (context.districtId) tags.add(context.districtId);
  if (advisor) tags.add('advisor');
  if (social) tags.add('social');
  if (report) tags.add('report');
  if (tomorrow) tags.add('tomorrow');

  return {
    advisorLine: advisor?.text,
    socialMention: social?.text,
    reportLine: report?.text,
    tomorrowHint: tomorrow?.text,
    tags: [...tags],
  };
}

/** Deterministic selection — aynı context aynı bundle. */
export function isEventEchoSelectionDeterministic(
  context: EventEchoContext,
): boolean {
  const a = buildEventEchoBundle(context);
  const b = buildEventEchoBundle(context);
  return (
    a.advisorLine === b.advisorLine &&
    a.socialMention === b.socialMention &&
    a.reportLine === b.reportLine &&
    a.tomorrowHint === b.tomorrowHint
  );
}
