import type { EventEchoDecisionKind } from '@/core/contentPacks/eventEchoTypes';

import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

import {
  BALANCED_GAP_THRESHOLD,
  DECISION_KIND_SIGNAL,
  DOMINANCE_GAP,
  HIGH_DOMINANCE_SCORE,
  pickTopStyles,
  PLAYER_STYLE_DEFINITIONS,
  scorePlayerStylesFromObservations,
} from './playerStyleRules';
import type {
  PlayerStyleConfidence,
  PlayerStyleId,
  PlayerStyleInput,
  PlayerStyleObservation,
  PlayerStyleObservationSource,
  PlayerStyleProfile,
  PlayerStyleSignalKind,
  PlayerStyleSurface,
} from './playerStyleTypes';

export const TITLE_LIMIT = 28;
export const SHORT_LABEL_LIMIT = 18;
export const SUMMARY_LIMIT = 160;
export const ADVISOR_LINE_LIMIT = 180;
export const STRENGTH_LIMIT = 140;
export const RISK_LIMIT = 140;

let observationCounter = 0;

function nextObservationId(prefix: string): string {
  observationCounter += 1;
  return `pstyle-${prefix}-${observationCounter}`;
}

function clamp(text: string, limit: number): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

export function inferDecisionKindFromText(text: string): EventEchoDecisionKind | null {
  const lower = text.toLowerCase();
  if (
    lower.includes('hızlı') ||
    lower.includes('hemen') ||
    lower.includes('acil') ||
    lower.includes('anında')
  ) {
    return 'fast_response';
  }
  if (
    lower.includes('önley') ||
    lower.includes('yarın') ||
    lower.includes('planla') ||
    lower.includes('erken')
  ) {
    return 'preventive_route';
  }
  if (
    lower.includes('iletişim') ||
    lower.includes('sosyal') ||
    lower.includes('görünürlük') ||
    lower.includes('vatandaş')
  ) {
    return 'communication_first';
  }
  if (
    lower.includes('izle') ||
    lower.includes('gözlem') ||
    lower.includes('bekle') ||
    lower.includes('monitor')
  ) {
    return 'monitor_only';
  }
  if (
    lower.includes('rotasyon') ||
    lower.includes('koru') ||
    lower.includes('bakım') ||
    lower.includes('yorgunluk düş')
  ) {
    return 'resource_heavy';
  }
  if (lower.includes('denge') || lower.includes('dengeli') || lower.includes('paylaş')) {
    return 'balanced_dispatch';
  }
  return null;
}

function observationFromDecisionKind(
  day: number,
  kind: EventEchoDecisionKind,
  source: PlayerStyleObservationSource,
  debugReason: string,
): PlayerStyleObservation {
  const signal = DECISION_KIND_SIGNAL[kind];
  return {
    id: nextObservationId(kind),
    day,
    kind: signal?.kind ?? 'mixed',
    weight: signal?.weight ?? 1.5,
    source,
    decisionKind: kind,
    debugReason,
  };
}

function observationFromSignal(
  day: number,
  kind: PlayerStyleSignalKind,
  weight: number,
  source: PlayerStyleObservationSource,
  debugReason: string,
  domain?: string,
): PlayerStyleObservation {
  return {
    id: nextObservationId(kind),
    day,
    kind,
    weight,
    source,
    domain,
    debugReason,
  };
}

type EventResultLike = NonNullable<PlayerStyleInput['recentResults']>[number];

export type { EventResultLike };

function inferObservationsFromDominantStrategy(
  dominant: DominantStrategyDetectorResult | null | undefined,
  day: number,
): PlayerStyleObservation[] {
  if (!dominant?.isVisible || dominant.pattern === 'none') return [];
  const patternMap: Partial<
    Record<string, { kind: PlayerStyleSignalKind; weight: number }>
  > = {
    rapid_response_overuse: { kind: 'fast_response', weight: 2 },
    preventive_overuse: { kind: 'preventive', weight: 2 },
    balanced_default_overuse: { kind: 'district_balance', weight: 1.8 },
    resource_saving_overuse: { kind: 'resource_saving', weight: 2 },
    public_trust_overfocus: { kind: 'social_priority', weight: 2 },
    crisis_priority_overfocus: { kind: 'crisis_prevention', weight: 2 },
    district_repetition: { kind: 'district_focus', weight: 2.5 },
    route_heavy_repetition: { kind: 'route_continuity', weight: 2.5 },
    inconsistent_switching: { kind: 'mixed', weight: 2 },
  };
  const mapping = patternMap[dominant.pattern];
  if (!mapping) return [];
  return [
    {
      id: `pstyle-dominant-${dominant.pattern}`,
      day,
      kind: mapping.kind,
      weight: mapping.weight,
      source: 'fallback',
      debugReason: `dominant:${dominant.pattern}`,
    },
  ];
}

function inferObservationsFromStrategyHistory(
  strategyHistory: StrategyHistoryStateV1 | null | undefined,
  day: number,
): PlayerStyleObservation[] {
  if (!strategyHistory) return [];
  const observations: PlayerStyleObservation[] = [];
  const recentDecisions = strategyHistory.decisionHistory.filter((r) => r.day <= day).slice(-8);
  const districtCounts = new Map<string, number>();

  for (const record of recentDecisions) {
    if (record.districtId) {
      districtCounts.set(record.districtId, (districtCounts.get(record.districtId) ?? 0) + 1);
    }
    const domainTags = record.domainTags ?? [];
    if (domainTags.includes('vehicle_route') || domainTags.includes('personnel')) {
      observations.push({
        id: `pstyle-strategy-route-${record.id}`,
        day,
        kind: 'route_continuity',
        weight: 1.2,
        source: 'fallback',
        domain: domainTags[0],
        debugReason: 'strategy:route_domain',
      });
    }
  }

  const topDistrict = [...districtCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDistrict && topDistrict[1] >= 3) {
    observations.push({
      id: `pstyle-strategy-district-${topDistrict[0]}`,
      day,
      kind: 'district_focus',
      weight: 1.8,
      source: 'fallback',
      districtId: topDistrict[0],
      debugReason: 'strategy:district_repeat',
    });
  }

  return observations;
}

export function inferObservationFromEventResult(
  resultLike: EventResultLike | undefined,
  day: number,
): PlayerStyleObservation[] {
  if (!resultLike) return [];
  const observations: PlayerStyleObservation[] = [];

  const kind =
    resultLike.selectedDecisionKind ??
    inferDecisionKindFromText(
      `${resultLike.decisionLabel ?? ''} ${resultLike.summaryText ?? ''} ${resultLike.summaryTitle ?? ''}`,
    );

  if (kind) {
    observations.push(observationFromDecisionKind(day, kind, 'event_result', `decision:${kind}`));
  }

  const summary = `${resultLike.summaryText ?? ''} ${resultLike.summaryTitle ?? ''}`.toLowerCase();
  if (summary.includes('yorgun') || summary.includes('bakım riski')) {
    observations.push(
      observationFromSignal(day, 'resource_heavy', 1.5, 'event_result', 'result:fatigue_mention'),
    );
  }
  if (summary.includes('sakin') || summary.includes('önle')) {
    observations.push(
      observationFromSignal(day, 'preventive', 1.2, 'event_result', 'result:preventive_tone'),
    );
  }
  if (summary.includes('sosyal') || summary.includes('şikayet azaldı')) {
    observations.push(
      observationFromSignal(day, 'social_priority', 1.2, 'event_result', 'result:social_tone'),
    );
  }

  return observations;
}

export function inferObservationFromCarryOver(
  carryOver: PlayerStyleInput['carryOverMemory'],
  day: number,
): PlayerStyleObservation[] {
  if (!carryOver?.summary) return [];
  const summary = carryOver.summary.toLowerCase();
  const observations: PlayerStyleObservation[] = [];

  if (summary.includes('yarın') || summary.includes('izlenmeli')) {
    observations.push(
      observationFromSignal(day, 'preventive', 1.5, 'carry_over', 'carry:tomorrow', carryOver.domain),
    );
  }
  if (carryOver.domain === 'vehicle_route' || summary.includes('araç') || summary.includes('rota')) {
    observations.push(
      observationFromSignal(day, 'resource_heavy', 1.3, 'carry_over', 'carry:vehicle', 'vehicle_route'),
    );
  }
  if (carryOver.domain === 'container' && summary.includes('azaldı')) {
    observations.push(
      observationFromSignal(day, 'preventive', 1.2, 'carry_over', 'carry:container_reduced', 'container'),
    );
  }
  if (carryOver.domain === 'social') {
    observations.push(
      observationFromSignal(day, 'social_priority', 1.4, 'carry_over', 'carry:social', 'social'),
    );
  }

  return observations;
}

export function inferObservationFromResourceFatigue(
  fatigue: PlayerStyleInput['resourceFatigue'],
  day: number,
): PlayerStyleObservation[] {
  if (!fatigue?.state) return [];
  const state = fatigue.state.toLowerCase();
  if (state === 'tired' || state === 'maintenance_risk' || state === 'strained') {
    return [
      observationFromSignal(day, 'resource_heavy', 2, 'resource_fatigue', `fatigue:${state}`, fatigue.domain),
      observationFromSignal(day, 'fast_response', 0.8, 'resource_fatigue', 'fatigue:fast_risk', fatigue.domain),
    ];
  }
  if (state === 'stable' || state === 'ready' || state === 'resolved') {
    return [
      observationFromSignal(day, 'resource_saving', 1.8, 'resource_fatigue', `fatigue:${state}`, fatigue.domain),
    ];
  }
  return [];
}

export function inferObservationFromSocialEcho(
  socialEcho: PlayerStyleInput['socialEcho'],
  day: number,
): PlayerStyleObservation[] {
  if (!socialEcho?.mention) return [];
  const mention = socialEcho.mention.toLowerCase();
  const observations: PlayerStyleObservation[] = [];
  if (mention.includes('sosyal') || mention.includes('vatandaş') || mention.includes('güven')) {
    observations.push(
      observationFromSignal(day, 'social_priority', 2, 'social_echo', 'social:mention', socialEcho.domain),
    );
  }
  if (socialEcho.tone === 'positive' || mention.includes('takdir') || mention.includes('sakin')) {
    observations.push(
      observationFromSignal(day, 'social_priority', 1.2, 'social_echo', 'social:positive', socialEcho.domain),
    );
  }
  return observations;
}

export function inferObservationFromMapBeforeAfter(
  mapBeforeAfter: PlayerStyleInput['mapBeforeAfter'],
  day: number,
): PlayerStyleObservation[] {
  if (!mapBeforeAfter?.outcome) return [];
  const outcome = mapBeforeAfter.outcome;
  if (outcome === 'prevented' || outcome === 'improved') {
    if (mapBeforeAfter.domain === 'crisis_adjacent') {
      return [
        observationFromSignal(day, 'crisis_prevention', 2.2, 'map_before_after', 'map:crisis_prevented'),
      ];
    }
    return [
      observationFromSignal(day, 'preventive', 1.5, 'map_before_after', 'map:prevented'),
    ];
  }
  if (outcome === 'carried_over') {
    return [
      observationFromSignal(day, 'preventive', 1, 'map_before_after', 'map:carry_over'),
      observationFromSignal(day, 'resource_heavy', 0.8, 'map_before_after', 'map:carry_fatigue'),
    ];
  }
  if (mapBeforeAfter.domain === 'district_balance') {
    return [
      observationFromSignal(day, 'district_balance', 1.8, 'map_before_after', 'map:district_balance'),
    ];
  }
  return [];
}

export function inferObservationFromEventDomain(
  focus: PlayerStyleInput['eventDomainFocus'],
  day: number,
): PlayerStyleObservation[] {
  if (!focus?.focus) return [];
  const domain = focus.focus;
  if (domain === 'social') {
    return [observationFromSignal(day, 'social_priority', 1.5, 'fallback', 'domain:social', 'social')];
  }
  if (domain === 'crisis_adjacent' || domain === 'crisis') {
    return [
      observationFromSignal(day, 'crisis_prevention', 1.5, 'fallback', 'domain:crisis', 'crisis_adjacent'),
    ];
  }
  if (domain === 'district_balance') {
    return [
      observationFromSignal(day, 'district_balance', 1.5, 'fallback', 'domain:balance', 'district_balance'),
    ];
  }
  if (domain === 'personnel' || domain === 'vehicle_route') {
    return [
      observationFromSignal(day, 'resource_saving', 1, 'fallback', 'domain:resource', domain),
    ];
  }
  return [];
}

export function inferObservationFromDecisionHistory(
  history: PlayerStyleInput['decisionHistory'],
  day: number,
): PlayerStyleObservation[] {
  if (!history?.length) return [];
  const recent = history.filter((r) => r.day != null && r.day <= day).slice(-5);
  const observations: PlayerStyleObservation[] = [];
  for (const record of recent) {
    const kind = inferDecisionKindFromText(`${record.decisionLabel ?? ''} ${record.eventTitle ?? ''}`);
    if (kind) {
      observations.push(observationFromDecisionKind(day, kind, 'fallback', `history:${kind}`));
    }
  }
  return observations;
}

export function buildPlayerStyleObservations(input: PlayerStyleInput): PlayerStyleObservation[] {
  observationCounter = 0;
  const day = input.day;
  const all: PlayerStyleObservation[] = [];

  for (const result of input.recentResults ?? []) {
    all.push(...inferObservationFromEventResult(result, day));
  }

  all.push(...inferObservationFromCarryOver(input.carryOverMemory, day));
  all.push(...inferObservationFromResourceFatigue(input.resourceFatigue, day));
  all.push(...inferObservationFromSocialEcho(input.socialEcho, day));
  all.push(...inferObservationFromMapBeforeAfter(input.mapBeforeAfter, day));
  all.push(...inferObservationFromEventDomain(input.eventDomainFocus, day));
  all.push(...inferObservationFromDecisionHistory(input.decisionHistory, day));
  all.push(...inferObservationsFromStrategyHistory(input.strategyHistory, day));
  all.push(...inferObservationsFromDominantStrategy(input.dominantStrategy, day));

  for (const report of input.dailyReports ?? []) {
    const summary = report.summary?.toLowerCase() ?? '';
    if (summary.includes('sosyal')) {
      all.push(observationFromSignal(day, 'social_priority', 1, 'daily_report', 'report:social'));
    }
    if (summary.includes('risk') || summary.includes('kriz')) {
      all.push(observationFromSignal(day, 'crisis_prevention', 1, 'daily_report', 'report:crisis'));
    }
  }

  return all;
}

export function scorePlayerStyles(observations: PlayerStyleObservation[]): Record<PlayerStyleId, number> {
  return scorePlayerStylesFromObservations(observations);
}

export function getPlayerStyleConfidence(
  topScore: number,
  observations: PlayerStyleObservation[],
  day: number,
  topGap: number,
): PlayerStyleConfidence {
  if (day <= 1 || observations.length < 2) return 'none';
  if (observations.length <= 3 && topGap < DOMINANCE_GAP) return 'low';
  if (observations.length <= 3) return 'low';
  if (observations.length <= 6 && topScore < HIGH_DOMINANCE_SCORE) return 'medium';
  if (observations.length >= 7 || topScore >= HIGH_DOMINANCE_SCORE) return 'high';
  return 'medium';
}

export function selectPrimaryPlayerStyle(
  scores: Record<PlayerStyleId, number>,
  day: number,
  observations: PlayerStyleObservation[],
): PlayerStyleId {
  if (day <= 1 || observations.length < 2) return 'unknown';

  const { top, second, topScore, secondScore } = pickTopStyles(scores);
  const gap = topScore - secondScore;

  const uniqueKinds = new Set(observations.map((o) => o.kind));
  if (uniqueKinds.size >= 5 && gap < BALANCED_GAP_THRESHOLD) {
    return 'inconsistent_operator';
  }

  if (gap < BALANCED_GAP_THRESHOLD && topScore > 0) {
    return 'balanced_operator';
  }

  if (topScore <= 0) return 'unknown';
  return top;
}

export function buildPlayerStyleAdvisorLine(profile: PlayerStyleProfile, day: number): string {
  let line = profile.advisorLine;
  if (day === 7 && profile.styleId !== 'unknown' && profile.confidence !== 'none') {
    line = `${line} Pilot tarzın şekilleniyor; kişisel özet yakında daha net görünecek.`;
  }
  return clamp(line, ADVISOR_LINE_LIMIT);
}

export function buildPlayerStyleHubInsight(profile: PlayerStyleProfile): string | null {
  if (!profile.visible) return null;
  if (profile.confidence === 'low') {
    return clamp(`Tarz sinyali: ${profile.shortLabel}`, SHORT_LABEL_LIMIT + 16);
  }
  return clamp(profile.advisorLine, ADVISOR_LINE_LIMIT);
}

export function shouldShowPlayerStyle(
  day: number,
  profile: PlayerStyleProfile,
  surface: PlayerStyleSurface = 'hub',
): boolean {
  if (!profile.visible) return false;
  if (day <= 1) return false;
  if (day > 7 && !profile.observations.length) return false;
  if (profile.styleId === 'unknown' && profile.confidence === 'none') return false;

  if (day === 2) {
    return surface === 'hub' || surface === 'report';
  }
  if (day === 3) {
    return profile.confidence !== 'none';
  }
  return true;
}

export function buildPlayerStyleProfile(input: PlayerStyleInput): PlayerStyleProfile {
  const day = input.day;
  const observations = buildPlayerStyleObservations(input);
  const scores = scorePlayerStyles(observations);
  const { topScore, secondScore } = pickTopStyles(scores);
  const gap = topScore - secondScore;
  const styleId = selectPrimaryPlayerStyle(scores, day, observations);
  const confidence = getPlayerStyleConfidence(topScore, observations, day, gap);
  const def = PLAYER_STYLE_DEFINITIONS[styleId];

  const profile: PlayerStyleProfile = {
    styleId,
    confidence,
    score: topScore,
    title: clamp(def.title, TITLE_LIMIT),
    shortLabel: clamp(def.shortLabel, SHORT_LABEL_LIMIT),
    summary: clamp(def.summary, SUMMARY_LIMIT),
    strengthLine: clamp(def.strengthLine, STRENGTH_LIMIT),
    riskLine: def.riskLine ? clamp(def.riskLine, RISK_LIMIT) : undefined,
    advisorLine: clamp(def.advisorLine, ADVISOR_LINE_LIMIT),
    tags: def.tags.slice(0, 2),
    tone: def.tone,
    visible: day > 1 && (observations.length >= 2 || styleId !== 'unknown'),
    observations,
    debugReason: `style:${styleId} conf:${confidence} obs:${observations.length}`,
  };

  profile.advisorLine = buildPlayerStyleAdvisorLine(profile, day);
  profile.visible = shouldShowPlayerStyle(day, profile, input.surface ?? 'hub');

  return profile;
}

export function formatPlayerStyleDebug(profile: PlayerStyleProfile): string {
  return `${profile.styleId}/${profile.confidence} score=${profile.score} obs=${profile.observations.length} ${profile.debugReason ?? ''}`;
}

export function buildPlayerStyleInputFromRecentDecisions(args: {
  day: number;
  decisionHistory?: PlayerStyleInput['decisionHistory'];
  lastResult?: EventResultLike;
}): PlayerStyleInput {
  const recent = (args.decisionHistory ?? [])
    .filter((r) => r.day != null && r.day <= args.day)
    .slice(-6);

  const recentResults: PlayerStyleInput['recentResults'] = [];
  if (args.lastResult) {
    recentResults.push(args.lastResult);
  }
  for (const record of recent.slice(-3)) {
    const kind = inferDecisionKindFromText(record.decisionLabel ?? '');
    recentResults.push({
      decisionLabel: record.decisionLabel,
      summaryTitle: record.eventTitle,
      selectedDecisionKind: kind ?? undefined,
    });
  }

  return {
    day: args.day,
    decisionHistory: args.decisionHistory,
    recentResults,
  };
}
