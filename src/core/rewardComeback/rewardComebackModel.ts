import {
  getNeighborhoodDisplayName,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  REWARD_COMEBACK_DAY1_LINE,
  REWARD_COMEBACK_MOMENT_COPY,
  REWARD_COMEBACK_MOMENT_LABELS,
  resolveRewardComebackMaxMoments,
  resolveRewardComebackVisibility,
} from './rewardComebackConstants';
import {
  isDuplicateRewardComebackLine,
  makeRewardComebackDuplicateKey,
  sanitizeRewardComebackCopy,
} from './rewardComebackPresentation';
import type {
  RewardComebackInput,
  RewardComebackMoment,
  RewardComebackMomentKind,
  RewardComebackMomentPriority,
  RewardComebackMomentSourceKind,
  RewardComebackMomentTone,
  RewardComebackSourceSignals,
  RewardComebackVisibilityModel,
} from './rewardComebackTypes';

let momentCounter = 0;

function nextMomentId(prefix: string): string {
  momentCounter += 1;
  return `rcm-${prefix}-${momentCounter}`;
}

function districtName(id: MapDistrictId | undefined, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  if (!id) return 'şehir';
  return getNeighborhoodDisplayName(id) ?? id;
}

function resolveDistrictId(input: RewardComebackInput): MapDistrictId | undefined {
  const raw =
    input.priorityDistrictId ??
    input.districtReportCard?.districtId ??
    input.contentPackMeta?.districtId ??
    input.decisionImpact?.relatedDistrictId ??
    input.tomorrowRisk?.relatedDistrictId ??
    input.snapshot?.neighborhoodId;
  if (!raw) return undefined;
  return normalizeNeighborhoodId(raw) ?? undefined;
}

function formatCopy(
  kind: RewardComebackMomentKind,
  district: string,
): string {
  return REWARD_COMEBACK_MOMENT_COPY[kind].replace('{district}', district);
}

function createMoment(input: {
  kind: RewardComebackMomentKind;
  tone: RewardComebackMomentTone;
  districtId?: MapDistrictId;
  districtName?: string;
  domain?: string;
  line: string;
  sourceKind: RewardComebackMomentSourceKind;
  priority?: RewardComebackMomentPriority;
  mapReactionKind?: RewardComebackMoment['mapReactionKind'];
  eventId?: string;
  familyId?: string;
  existingLines: string[];
}): RewardComebackMoment | undefined {
  const line = sanitizeRewardComebackCopy(input.line, 'line');
  if (!line || isDuplicateRewardComebackLine(line, input.existingLines)) return undefined;

  const label = REWARD_COMEBACK_MOMENT_LABELS[input.kind];
  const id = input.districtId ?? 'city';

  return {
    id: nextMomentId(input.kind),
    kind: input.kind,
    tone: input.tone,
    districtId: input.districtId,
    districtName: input.districtName,
    domain: input.domain,
    title: sanitizeRewardComebackCopy(label, 'title') ?? label,
    line,
    playerFacingLabel: sanitizeRewardComebackCopy(label, 'label') ?? label,
    eceLine:
      input.kind === 'decision_worked' || input.kind === 'advisor_prediction_confirmed'
        ? sanitizeRewardComebackCopy(
            `Ece dünkü kararın işe yaradığını görüyor; bugün aynı hattı fazla zorlamadan korumak iyi olur.`,
            'ece',
          )
        : undefined,
    socialLine:
      input.kind === 'social_thanks'
        ? sanitizeRewardComebackCopy(line, 'social')
        : sanitizeRewardComebackCopy(
            input.districtName
              ? `${input.districtName}’te ekiplerin görünmesi bugün fark edildi.`
              : line,
            'social',
          ),
    reportLine: sanitizeRewardComebackCopy(
      input.kind === 'container_relief'
        ? `Olumlu iz: Konteyner çevresi bugün daha sakin.`
        : `Olumlu iz: ${line}`,
      'report',
    ),
    mapReactionKind:
      input.mapReactionKind ??
      (input.kind === 'district_recovered' || input.kind === 'comeback_completed'
        ? 'recovery_glow'
        : input.kind === 'trust_improved' || input.kind === 'social_thanks'
          ? 'trust_pulse'
          : undefined),
    priority: input.priority ?? 'medium',
    sourceKind: input.sourceKind,
    duplicateKey: makeRewardComebackDuplicateKey({
      momentKind: input.kind,
      districtId: id,
      domain: input.domain,
      sourceKind: input.sourceKind,
      eventId: input.eventId,
      familyId: input.familyId,
    }),
  };
}

function collectMoments(input: RewardComebackInput): RewardComebackMoment[] {
  const day = Math.max(1, input.day);
  const existing = input.existingLines ?? [];
  const districtId = resolveDistrictId(input);
  const name = districtName(districtId, input.snapshot?.neighborhoodName);
  const moments: RewardComebackMoment[] = [];
  const guard = [...existing];

  const push = (moment: RewardComebackMoment | undefined) => {
    if (!moment) return;
    moments.push(moment);
    guard.push(moment.line);
  };

  if (day <= 1) {
    const day1 = createMoment({
      kind: 'fallback',
      tone: 'steady',
      line: REWARD_COMEBACK_DAY1_LINE,
      sourceKind: 'fallback',
      priority: 'low',
      existingLines: guard,
    });
    if (day1) push(day1);
    return moments;
  }

  const impact = input.decisionImpact;
  if (
    impact &&
    (impact.kind === 'positive_tradeoff' ||
      impact.kind === 'recovery_signal' ||
      impact.tone === 'positive' ||
      impact.tone === 'recovery')
  ) {
    push(
      createMoment({
        kind: 'decision_worked',
        tone: 'positive',
        districtId,
        districtName: name,
        domain: impact.relatedDomain,
        line: formatCopy('decision_worked', name),
        sourceKind: 'decision_impact',
        priority: 'high',
        eventId: input.eventId ?? undefined,
        existingLines: [...guard, impact.mainLine],
      }),
    );
  }

  if (impact?.kind === 'route_balance' || impact?.relatedDomain === 'route') {
    push(
      createMoment({
        kind: 'route_balanced',
        tone: 'positive',
        districtId,
        districtName: name,
        domain: 'route',
        line: formatCopy('route_balanced', name),
        sourceKind: 'decision_impact',
        existingLines: guard,
      }),
    );
  }

  const reportCard = input.districtReportCard;
  if (
    reportCard &&
    (reportCard.trustBand === 'recovering' ||
      reportCard.trustBand === 'improving' ||
      reportCard.trustBand === 'trusted' ||
      reportCard.dominantIssueKind === 'recovery_momentum')
  ) {
    push(
      createMoment({
        kind: 'district_recovered',
        tone: 'recovery',
        districtId: reportCard.districtId,
        districtName: reportCard.districtName,
        domain: reportCard.dominantIssueKind,
        line: formatCopy('district_recovered', reportCard.districtName),
        sourceKind: 'district_report_card',
        priority: 'high',
        mapReactionKind: 'recovery_glow',
        existingLines: [...guard, reportCard.eceLine ?? '', reportCard.recentEffectLine ?? ''],
      }),
    );
  }

  if (reportCard?.dominantIssueKind === 'crisis_prevention') {
    push(
      createMoment({
        kind: 'risk_prevented',
        tone: 'positive',
        districtId: reportCard.districtId,
        districtName: reportCard.districtName,
        line: REWARD_COMEBACK_MOMENT_COPY.risk_prevented,
        sourceKind: 'district_report_card',
        priority: 'high',
        existingLines: guard,
      }),
    );
  }

  if (impact?.kind === 'container_pressure' && impact.tone === 'recovery') {
    push(
      createMoment({
        kind: 'container_relief',
        tone: 'recovery',
        districtId,
        districtName: name,
        domain: 'container',
        line: REWARD_COMEBACK_MOMENT_COPY.container_relief,
        sourceKind: 'decision_impact',
        existingLines: guard,
      }),
    );
  }

  const signals = input.operationSignals;
  if (
    signals?.vehicles?.status === 'stable' ||
    signals?.vehicles?.status === 'watch' ||
    input.resourceFatigue?.trend === 'improving' ||
    input.resourceFatigue?.state === 'stable'
  ) {
    if (day >= 4) {
      push(
        createMoment({
          kind: 'resource_recovered',
          tone: 'recovery',
          districtId,
          domain: 'vehicle',
          line: REWARD_COMEBACK_MOMENT_COPY.resource_recovered,
          sourceKind: 'operation_signals',
          existingLines: guard,
        }),
      );
    }
  }

  const carry = input.carryOverMemory;
  if (carry?.direction === 'positive_memory') {
    push(
      createMoment({
        kind: 'comeback_completed',
        tone: 'recovery',
        districtId,
        districtName: name,
        domain: carry.domain,
        line: formatCopy('comeback_completed', name),
        sourceKind: 'carry_over',
        priority: 'high',
        mapReactionKind: 'recovery_glow',
        existingLines: [...guard, carry.summary ?? ''],
      }),
    );
  }

  const tomorrow = input.tomorrowRisk;
  const strained =
    reportCard?.trustBand === 'strained' ||
    reportCard?.trustBand === 'watch' ||
    reportCard?.trustBand === 'fragile' ||
    signals?.overall?.status === 'strained';
  if (
    day >= 4 &&
    (tomorrow?.tone === 'watch' ||
      strained ||
      carry?.direction === 'unresolved_from_previous' ||
      carry?.direction === 'warning_memory')
  ) {
    push(
      createMoment({
        kind: 'comeback_available',
        tone: 'opportunity',
        districtId,
        districtName: name,
        line: REWARD_COMEBACK_MOMENT_COPY.comeback_available,
        sourceKind: 'tomorrow_risk',
        priority: 'medium',
        existingLines: [...guard, tomorrow?.mainLine ?? ''],
      }),
    );
  }

  const journal = input.cityJournalEntry;
  if (
    journal &&
    (journal.kind === 'recovery_momentum' ||
      journal.kind === 'social_trust_recovered' ||
      journal.kind === 'route_balanced')
  ) {
    const kind: RewardComebackMomentKind =
      journal.kind === 'route_balanced' ? 'route_balanced' : 'district_recovered';
    push(
      createMoment({
        kind,
        tone: 'recovery',
        districtId: journal.districtId,
        districtName: journal.districtName,
        line: journal.line,
        sourceKind: 'city_journal',
        existingLines: [...guard, journal.line],
      }),
    );
  }

  const echo = input.cityEchoBinding;
  if (echo?.tone === 'recovery' || echo?.tone === 'positive') {
    push(
      createMoment({
        kind: 'social_thanks',
        tone: 'positive',
        districtId,
        districtName: name,
        line: echo.socialLine ?? echo.eceLine ?? REWARD_COMEBACK_MOMENT_COPY.social_thanks,
        sourceKind: 'city_echo',
        mapReactionKind: 'trust_pulse',
        existingLines: [...guard, echo.socialLine ?? '', echo.reportLine ?? '', echo.eceLine ?? ''],
      }),
    );
  }

  const advisor = input.advisorRelationship;
  if (advisor?.predictionState === 'prediction_confirmed') {
    push(
      createMoment({
        kind: 'advisor_prediction_confirmed',
        tone: 'positive',
        districtId,
        districtName: name,
        line: formatCopy('advisor_prediction_confirmed', name),
        sourceKind: 'advisor_relationship',
        priority: 'high',
        existingLines: [...guard, advisor.predictionCorrectionLine ?? '', advisor.mainAdvisorLine],
      }),
    );
  } else if (advisor?.previousDecisionReference?.line && day >= 3) {
    push(
      createMoment({
        kind: 'positive_followup',
        tone: 'steady',
        districtId,
        districtName: advisor.previousDecisionReference.districtName,
        line: REWARD_COMEBACK_MOMENT_COPY.positive_followup,
        sourceKind: 'advisor_relationship',
        existingLines: [...guard, advisor.previousDecisionReference.line],
      }),
    );
  }

  const pack = input.contentPackMeta;
  if (pack && day >= 2) {
    const variant = pack.variantKind?.toLowerCase() ?? '';
    let kind: RewardComebackMomentKind | undefined;
    let tone: RewardComebackMomentTone = 'positive';

    if (variant.includes('reward')) kind = 'reward_event_seen';
    else if (variant.includes('comeback')) {
      kind = day >= 4 ? 'comeback_available' : 'comeback_started';
      tone = 'opportunity';
    } else if (variant.includes('recovery') || variant.includes('improved')) {
      kind = 'district_recovered';
      tone = 'recovery';
    } else if (variant.includes('prevented')) kind = 'risk_prevented';
    else if (variant.includes('positive_followup') || variant.includes('social_trust')) {
      kind = 'positive_followup';
    } else if (variant.includes('resource_recovery')) kind = 'resource_recovered';

    if (kind) {
      const packLine =
        pack.resultEcho ??
        pack.socialEcho ??
        pack.reportEcho ??
        pack.advisorEcho ??
        formatCopy(kind, districtName(normalizeNeighborhoodId(pack.districtId) ?? undefined));
      push(
        createMoment({
          kind,
          tone,
          districtId: normalizeNeighborhoodId(pack.districtId) ?? districtId,
          districtName: districtName(normalizeNeighborhoodId(pack.districtId) ?? undefined),
          domain: pack.domain,
          line: packLine,
          sourceKind: 'content_pack',
          priority: day >= 8 ? 'high' : 'medium',
          familyId: pack.familyId,
          eventId: input.eventId ?? undefined,
          existingLines: guard,
        }),
      );
    }
  }

  if (input.mapReactionKind === 'recovery_glow' || input.mapReactionKind === 'trust_pulse') {
    push(
      createMoment({
        kind: input.mapReactionKind === 'recovery_glow' ? 'district_recovered' : 'trust_improved',
        tone: 'recovery',
        districtId,
        districtName: name,
        line:
          input.mapReactionKind === 'recovery_glow'
            ? `Toparlanma izi: ${name} çevresi sakinleşiyor.`
            : formatCopy('trust_improved', name),
        sourceKind: 'map_reaction',
        mapReactionKind: input.mapReactionKind,
        existingLines: guard,
      }),
    );
  }

  const feel = input.mainOperationFeel;
  if (feel?.tone === 'recovery' || feel?.tone === 'steady') {
    if (day >= 8 && moments.length === 0) {
      push(
        createMoment({
          kind: 'positive_followup',
          tone: 'steady',
          districtId,
          districtName: name,
          line: feel.reportLine ?? feel.eceLine ?? REWARD_COMEBACK_MOMENT_COPY.positive_followup,
          sourceKind: 'main_operation_feel',
          existingLines: [...guard, feel.reportLine ?? '', feel.eceLine ?? ''],
        }),
      );
    }
  }

  return moments;
}

function buildSourceSignals(input: RewardComebackInput): RewardComebackSourceSignals {
  return {
    hasDecisionImpact: Boolean(input.decisionImpact),
    hasAdvisorRelationship: Boolean(input.advisorRelationship),
    hasCityEcho: Boolean(input.cityEchoBinding),
    hasTomorrowRisk: Boolean(input.tomorrowRisk),
    hasCarryOver: Boolean(input.carryOverMemory?.summary),
    hasDistrictReportCard: Boolean(input.districtReportCard),
    hasCityJournal: Boolean(input.cityJournalEntry),
    hasContentPack: Boolean(input.contentPackMeta),
    hasOperationSignals: Boolean(input.operationSignals),
    hasResourceRecovery:
      input.resourceFatigue?.trend === 'improving' ||
      input.operationSignals?.vehicles?.status === 'stable',
    hasMainOperationFeel: Boolean(input.mainOperationFeel?.visible),
    hasMapReaction: Boolean(input.mapReactionKind),
  };
}

function sortMoments(moments: RewardComebackMoment[]): RewardComebackMoment[] {
  const priorityScore = { high: 3, medium: 2, low: 1 };
  return [...moments].sort(
    (a, b) => priorityScore[b.priority] - priorityScore[a.priority],
  );
}

function composeSurfaceLines(
  primary: RewardComebackMoment | undefined,
  secondary: RewardComebackMoment | undefined,
  day: number,
): Pick<
  RewardComebackVisibilityModel,
  'hubLine' | 'reportLine' | 'socialLine' | 'mapLine' | 'eceLine' | 'journalLine' | 'resultLine'
> {
  if (!primary) return {};

  const hubPrefix = day >= 4 ? 'Dünkü karar işe yaradı: ' : '';
  const resultPrefix =
    primary.tone === 'recovery' || primary.kind === 'comeback_completed'
      ? 'Toparlanma etkisi: '
      : 'Olumlu iz: ';

  return {
    hubLine: sanitizeRewardComebackCopy(
      day <= 3 ? primary.line : `${hubPrefix}${primary.line}`,
      'hub',
    ),
    reportLine: primary.reportLine ?? sanitizeRewardComebackCopy(`Olumlu iz: ${primary.line}`, 'report'),
    socialLine: primary.socialLine,
    mapLine: primary.mapReactionKind
      ? sanitizeRewardComebackCopy(
          primary.mapReactionKind === 'recovery_glow'
            ? `Toparlanma izi: ${primary.districtName ?? 'Mahalle'} çevresi sakinleşiyor.`
            : `Güven nabzı: ${primary.districtName ?? 'Mahalle'} toparlanıyor.`,
          'map',
        )
      : undefined,
    eceLine: primary.eceLine,
    journalLine: sanitizeRewardComebackCopy(
      `Gün ${day}: ${primary.line}`,
      'journal',
    ),
    resultLine: sanitizeRewardComebackCopy(`${resultPrefix}${primary.line}`, 'result'),
  };
}

export function buildRewardComebackVisibilityModel(
  input: RewardComebackInput,
): RewardComebackVisibilityModel {
  const day = Math.max(1, input.day);
  const maxVisibleMoments = resolveRewardComebackMaxMoments(day, input.isMainOperationFull);
  const allMoments = sortMoments(collectMoments(input));
  const moments = allMoments.slice(0, maxVisibleMoments);
  const primaryMoment = moments[0];
  const secondaryMoment = moments[1];
  const surfaces = composeSurfaceLines(primaryMoment, secondaryMoment, day);

  const visibility = input.isDay1Tutorial
    ? 'hidden'
    : resolveRewardComebackVisibility(day, input.isMainOperationFull);

  const duplicateKey = makeRewardComebackDuplicateKey({
    momentKind: primaryMoment?.kind ?? 'fallback',
    districtId: primaryMoment?.districtId,
    domain: primaryMoment?.domain,
    sourceKind: primaryMoment?.sourceKind,
    eventId: input.eventId ?? undefined,
    familyId: input.contentPackMeta?.familyId,
  });

  return {
    day,
    visibility,
    moments,
    primaryMoment,
    ...surfaces,
    sourceSignals: buildSourceSignals(input),
    duplicateKey,
    maxVisibleMoments,
  };
}

export function buildRewardComebackMomentForKind(
  kind: RewardComebackMomentKind,
  district: string = 'şehir',
  existingLines: string[] = [],
): RewardComebackMoment | undefined {
  return createMoment({
    kind,
    tone: kind.includes('comeback') ? 'opportunity' : 'positive',
    districtName: district,
    line: formatCopy(kind, district),
    sourceKind: 'fallback',
    existingLines,
  });
}
