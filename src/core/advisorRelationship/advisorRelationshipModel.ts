import {
  getNeighborhoodDisplayName,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';

import {
  ADVISOR_RELATIONSHIP_DAY_TONE_LINES,
  ADVISOR_RELATIONSHIP_DISTRICT_LINES,
  ADVISOR_RELATIONSHIP_PREDICTION_LINES,
  ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES,
  ADVISOR_RELATIONSHIP_RESOURCE_LINES,
  ADVISOR_RELATIONSHIP_STYLE_LABELS,
  ADVISOR_RELATIONSHIP_STYLE_SOFT_LINES,
  resolveAdvisorRelationshipFamiliarityBand,
  resolveAdvisorRelationshipTrustTone,
  resolveAdvisorRelationshipVisibility,
} from './advisorRelationshipConstants';
import {
  isDuplicateAdvisorRelationshipLine,
  makeAdvisorRelationshipDuplicateKey,
  sanitizeAdvisorRelationshipCopy,
} from './advisorRelationshipPresentation';
import type {
  AdvisorOperationalRelationshipModel,
  AdvisorRelationshipInput,
  AdvisorRelationshipPlayerStyleSignal,
  AdvisorRelationshipPredictionState,
  AdvisorRelationshipPreviousDecisionReference,
  AdvisorRelationshipResourceHabitReference,
  AdvisorRelationshipSourceSignals,
  AdvisorRelationshipStyleKind,
  AdvisorRelationshipDistrictMemoryReference,
} from './advisorRelationshipTypes';

function resolveDistrictId(input: AdvisorRelationshipInput): MapDistrictId | undefined {
  const raw =
    input.priorityDistrictId ??
    input.districtReportCard?.districtId ??
    input.lastDecision?.neighborhoodId ??
    input.decisionImpact?.relatedDistrictId ??
    input.tomorrowRisk?.relatedDistrictId ??
    input.snapshot?.neighborhoodId;
  if (!raw) return undefined;
  return normalizeNeighborhoodId(raw) ?? undefined;
}

function districtName(id: MapDistrictId | undefined, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  if (!id) return 'şehir';
  return getNeighborhoodDisplayName(id) ?? id;
}

function mapPlayerStyleToRelationshipKind(
  styleId: PlayerStyleId | undefined,
): AdvisorRelationshipStyleKind {
  switch (styleId) {
    case 'fast_responder':
      return 'fast_responder';
    case 'public_focused':
      return 'social_trust_focused';
    case 'preventive_planner':
      return 'route_balancer';
    case 'resource_guardian':
      return 'resource_guardian';
    case 'crisis_watcher':
      return 'crisis_watcher';
    case 'balanced_operator':
      return 'balanced_operator';
    default:
      return 'unknown';
  }
}

function inferStyleFromHistory(input: AdvisorRelationshipInput): AdvisorRelationshipStyleKind {
  const history = input.decisionHistory ?? [];
  if (history.length < 2) return 'unknown';

  let fastCount = 0;
  let socialCount = 0;
  let resourceCount = 0;
  let routeCount = 0;

  for (const record of history.slice(-6)) {
    const label = (record.decisionLabel ?? '').toLowerCase();
    if (label.includes('hızlı') || label.includes('acil') || label.includes('hemen')) {
      fastCount += 1;
    }
    if (label.includes('sosyal') || label.includes('görünür') || label.includes('iletişim')) {
      socialCount += 1;
    }
    if (label.includes('koru') || label.includes('kaynak') || label.includes('yorgunluk')) {
      resourceCount += 1;
    }
    if (label.includes('rota') || label.includes('denge') || label.includes('planla')) {
      routeCount += 1;
    }
  }

  const max = Math.max(fastCount, socialCount, resourceCount, routeCount);
  if (max < 2) return 'balanced_operator';
  if (fastCount === max) return 'fast_responder';
  if (socialCount === max) return 'social_trust_focused';
  if (resourceCount === max) return 'resource_guardian';
  if (routeCount === max) return 'route_balancer';
  return 'balanced_operator';
}

function buildPlayerStyleSignal(
  input: AdvisorRelationshipInput,
): AdvisorRelationshipPlayerStyleSignal | undefined {
  if (input.day < 4) return undefined;

  const profile = input.playerStyleProfile;
  const kind = profile?.visible
    ? mapPlayerStyleToRelationshipKind(profile.styleId)
    : inferStyleFromHistory(input);

  if (kind === 'unknown' && input.day < 6) return undefined;

  const label = ADVISOR_RELATIONSHIP_STYLE_LABELS[kind];
  const softLine = ADVISOR_RELATIONSHIP_STYLE_SOFT_LINES[kind];

  return {
    kind,
    label,
    softLine: sanitizeAdvisorRelationshipCopy(softLine, 'supporting') ?? softLine,
  };
}

function buildPreviousDecisionReference(
  input: AdvisorRelationshipInput,
  existingLines: string[],
): AdvisorRelationshipPreviousDecisionReference | undefined {
  if (input.day <= 1) return undefined;

  const last =
    input.lastDecision ??
    (input.decisionHistory ?? []).filter((r) => r.day === input.day - 1).at(-1);
  if (!last) return undefined;

  const districtId = normalizeNeighborhoodId(last.neighborhoodId ?? '') ?? undefined;
  const name = districtName(districtId, last.neighborhoodName);
  const domain = input.decisionImpact?.relatedDomain ?? 'operation';

  let template: string = ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES.generic;
  if (domain === 'route' || last.decisionLabel?.toLowerCase().includes('rota')) {
    template = ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES.route_relief;
  } else if (districtId === 'yesilvadi' || domain.includes('environment')) {
    template = ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES.environmental;
  } else if (districtId === 'cumhuriyet' || domain === 'social') {
    template = ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES.visible_service;
  }

  const rawLine = template.replace('{district}', name);
  const impactLine = input.decisionImpact?.mainLine;
  const journalLine = input.cityJournalEntry?.line;
  const tomorrowLine = input.tomorrowRisk?.mainLine;
  const carryLine = input.carryOverMemory?.summary;

  if (
    isDuplicateAdvisorRelationshipLine(rawLine, [
      ...existingLines,
      impactLine ?? '',
      journalLine ?? '',
      tomorrowLine ?? '',
      carryLine ?? '',
    ])
  ) {
    const altLine = sanitizeAdvisorRelationshipCopy(
      `Ece dünkü ${name} kararının bugünkü plana kısa bir iz bıraktığını not ediyor.`,
      'main',
    );
    if (!altLine || isDuplicateAdvisorRelationshipLine(altLine, existingLines)) return undefined;
    return {
      decisionId: last.decisionId,
      day: last.day,
      districtId,
      districtName: name,
      domain,
      line: altLine,
    };
  }

  const line = sanitizeAdvisorRelationshipCopy(rawLine, 'main');
  if (!line) return undefined;

  return {
    decisionId: last.decisionId,
    day: last.day,
    districtId,
    districtName: name,
    domain,
    line,
  };
}

function buildDistrictMemoryReference(
  input: AdvisorRelationshipInput,
  existingLines: string[],
): AdvisorRelationshipDistrictMemoryReference | undefined {
  if (input.day < 3) return undefined;

  const districtId = resolveDistrictId(input);
  if (!districtId) return undefined;

  const districtLine = ADVISOR_RELATIONSHIP_DISTRICT_LINES[districtId];
  const reportLine = input.districtReportCard?.eceLine;
  const echoLine = input.cityEchoBinding?.eceLine;

  if (isDuplicateAdvisorRelationshipLine(districtLine, [...existingLines, reportLine ?? '', echoLine ?? ''])) {
    const alt = sanitizeAdvisorRelationshipCopy(
      `Ece ${districtName(districtId)} hattında bugünkü karar tarzını mahalle dengesiyle birlikte okumanı öneriyor.`,
      'supporting',
    );
    if (!alt) return undefined;
    return { districtId, districtName: districtName(districtId), line: alt };
  }

  const line = sanitizeAdvisorRelationshipCopy(districtLine, 'supporting');
  if (!line) return undefined;

  return {
    districtId,
    districtName: districtName(districtId),
    line,
  };
}

function buildResourceHabitReference(
  input: AdvisorRelationshipInput,
  existingLines: string[],
): AdvisorRelationshipResourceHabitReference | undefined {
  if (input.day < 4) return undefined;

  const fatigue = input.resourceFatigue;
  const signals = input.operationSignals;
  let resource = 'generic';
  let line: string = ADVISOR_RELATIONSHIP_RESOURCE_LINES.generic;

  if (
    fatigue?.domain === 'vehicle' ||
    fatigue?.state === 'strained' ||
    signals?.vehicles?.status === 'strained' ||
    signals?.vehicles?.status === 'critical'
  ) {
    resource = 'vehicle';
    line = ADVISOR_RELATIONSHIP_RESOURCE_LINES.vehicle;
  } else if (signals?.personnel?.status === 'strained' || signals?.personnel?.status === 'critical') {
    resource = 'personnel';
    line = ADVISOR_RELATIONSHIP_RESOURCE_LINES.personnel;
  } else if (signals?.containers?.status === 'strained' || signals?.containers?.status === 'critical') {
    resource = 'container';
    line = ADVISOR_RELATIONSHIP_RESOURCE_LINES.container;
  } else if (!fatigue && !signals) {
    return undefined;
  }

  const presenceLine = input.cityEchoBinding?.eceLine;
  if (isDuplicateAdvisorRelationshipLine(line, [...existingLines, presenceLine ?? ''])) {
    return undefined;
  }

  const sanitized = sanitizeAdvisorRelationshipCopy(line, 'supporting');
  if (!sanitized) return undefined;

  return { resource, line: sanitized };
}

function resolvePredictionState(input: AdvisorRelationshipInput): AdvisorRelationshipPredictionState {
  const predictions = input.advisorState?.pendingPredictions ?? [];
  if (predictions.length === 0 || input.day < 3) return 'no_prediction';

  const yesterday = predictions.find((p) => p.day === input.day - 1);
  if (!yesterday) return 'still_observing';

  if (yesterday.resolved) return 'prediction_confirmed';
  if (yesterday.predictedStatus === 'strained' && input.operationSignals?.overall?.status === 'stable') {
    return 'prediction_softened';
  }
  if (yesterday.predictedStatus === 'stable' && input.operationSignals?.overall?.status === 'strained') {
    return 'prediction_corrected';
  }
  return 'still_observing';
}

function buildPredictionCorrectionLine(
  state: AdvisorRelationshipPredictionState,
  existingLines: string[],
): string | undefined {
  if (state === 'no_prediction') return undefined;
  const line = ADVISOR_RELATIONSHIP_PREDICTION_LINES[state];
  if (!line || isDuplicateAdvisorRelationshipLine(line, existingLines)) return undefined;
  return sanitizeAdvisorRelationshipCopy(line, 'prediction');
}

function buildDayToneLine(input: AdvisorRelationshipInput): string {
  if (input.isMainOperationFull) {
    return ADVISOR_RELATIONSHIP_DAY_TONE_LINES.main_operation;
  }
  if (input.day <= 1) return ADVISOR_RELATIONSHIP_DAY_TONE_LINES.day1;
  if (input.day <= 3) return ADVISOR_RELATIONSHIP_DAY_TONE_LINES.day2_3;
  if (input.day <= 7) return ADVISOR_RELATIONSHIP_DAY_TONE_LINES.day4_7;
  return ADVISOR_RELATIONSHIP_DAY_TONE_LINES.day8_plus;
}

function buildSourceSignals(input: AdvisorRelationshipInput): AdvisorRelationshipSourceSignals {
  return {
    hasPlayerStyle: Boolean(input.playerStyleProfile?.visible) || (input.decisionHistory?.length ?? 0) >= 3,
    hasPreviousDecision: Boolean(input.lastDecision) || (input.decisionHistory?.length ?? 0) > 0,
    hasDistrictMemory: Boolean(input.districtReportCard || resolveDistrictId(input)),
    hasResourceHabit: Boolean(input.resourceFatigue || input.operationSignals),
    hasPredictionCorrection: (input.advisorState?.pendingPredictions?.length ?? 0) > 0,
    hasDistrictFocus: Boolean(resolveDistrictId(input)),
    hasMainOperation: Boolean(input.isMainOperationFull || input.mainOperationFeel?.visible),
    hasCarryOver: Boolean(input.carryOverMemory?.summary),
    hasDecisionImpact: Boolean(input.decisionImpact?.mainLine),
    hasTomorrowRisk: Boolean(input.tomorrowRisk?.mainLine),
    hasCityJournal: Boolean(input.cityJournalEntry?.line),
  };
}

function composeMainAdvisorLine(
  input: AdvisorRelationshipInput,
  dayTone: string,
  previousRef?: AdvisorRelationshipPreviousDecisionReference,
  styleSignal?: AdvisorRelationshipPlayerStyleSignal,
  predictionLine?: string,
  districtRef?: AdvisorRelationshipDistrictMemoryReference,
): string {
  const existing = input.existingLines ?? [];

  if (input.day <= 1) {
    return sanitizeAdvisorRelationshipCopy(dayTone, 'main') ?? dayTone;
  }

  if (input.day <= 3) {
    if (previousRef?.line && !isDuplicateAdvisorRelationshipLine(previousRef.line, existing)) {
      return previousRef.line;
    }
    return sanitizeAdvisorRelationshipCopy(dayTone, 'main') ?? dayTone;
  }

  if (input.day <= 7) {
    if (styleSignal?.softLine && !isDuplicateAdvisorRelationshipLine(styleSignal.softLine, existing)) {
      return styleSignal.softLine;
    }
    if (previousRef?.line) return previousRef.line;
    return sanitizeAdvisorRelationshipCopy(dayTone, 'main') ?? dayTone;
  }

  if (predictionLine && !isDuplicateAdvisorRelationshipLine(predictionLine, existing)) {
    return predictionLine;
  }
  if (districtRef?.line && !isDuplicateAdvisorRelationshipLine(districtRef.line, existing)) {
    return districtRef.line;
  }
  if (styleSignal?.softLine) return styleSignal.softLine;
  if (previousRef?.line) return previousRef.line;
  return sanitizeAdvisorRelationshipCopy(dayTone, 'main') ?? dayTone;
}

function composeSupportingLine(
  input: AdvisorRelationshipInput,
  mainLine: string,
  resourceRef?: AdvisorRelationshipResourceHabitReference,
  districtRef?: AdvisorRelationshipDistrictMemoryReference,
  predictionLine?: string,
): string | undefined {
  if (input.day < 8) return undefined;
  const existing = [...(input.existingLines ?? []), mainLine];

  if (resourceRef?.line && !isDuplicateAdvisorRelationshipLine(resourceRef.line, existing)) {
    return resourceRef.line;
  }
  if (
    predictionLine &&
    predictionLine !== mainLine &&
    !isDuplicateAdvisorRelationshipLine(predictionLine, existing)
  ) {
    return predictionLine;
  }
  if (districtRef?.line && districtRef.line !== mainLine && !isDuplicateAdvisorRelationshipLine(districtRef.line, existing)) {
    return districtRef.line;
  }
  return undefined;
}

function buildReportLine(
  input: AdvisorRelationshipInput,
  styleSignal?: AdvisorRelationshipPlayerStyleSignal,
  previousRef?: AdvisorRelationshipPreviousDecisionReference,
  resourceRef?: AdvisorRelationshipResourceHabitReference,
): string | undefined {
  if (input.day < 2) return undefined;

  const summary = input.dailyReport?.summaryLines?.join(' ') ?? '';
  const existing = [...(input.existingLines ?? []), summary, input.decisionImpact?.mainLine ?? ''];

  if (input.day >= 8 && styleSignal) {
    const line = sanitizeAdvisorRelationshipCopy(
      `Ece bugün karar tarzının rota baskısını azalttığını, kaynak temposunu ise artırdığını not etti.`,
      'report',
    );
    if (line && !isDuplicateAdvisorRelationshipLine(line, existing)) return line;
  }

  if (previousRef?.line && input.day >= 4) {
    const line = sanitizeAdvisorRelationshipCopy(
      `Ece bugün ${previousRef.districtName} hattındaki dünkü kararının etkisini sakin tempoyla sürdürmeni öneriyor.`,
      'report',
    );
    if (line && !isDuplicateAdvisorRelationshipLine(line, existing)) return line;
  }

  if (resourceRef?.line) {
    const line = sanitizeAdvisorRelationshipCopy(resourceRef.line, 'report');
    if (line && !isDuplicateAdvisorRelationshipLine(line, existing)) return line;
  }

  if (styleSignal && input.day >= 4) {
    const line = sanitizeAdvisorRelationshipCopy(
      `Ece bugünkü karar tarzının ${styleSignal.label.toLowerCase()} çizgisinde ilerlediğini not etti.`,
      'report',
    );
    if (line && !isDuplicateAdvisorRelationshipLine(line, existing)) return line;
  }

  return sanitizeAdvisorRelationshipCopy(
    'Ece bugünkü kararların operasyon ritmine kısa vadeli bir iz bıraktığını not etti.',
    'report',
  );
}

function buildResultLine(
  input: AdvisorRelationshipInput,
  styleSignal?: AdvisorRelationshipPlayerStyleSignal,
): string | undefined {
  if (input.day < 2) return undefined;

  const impact = input.decisionImpact;
  const existing = [
    ...(input.existingLines ?? []),
    impact?.mainLine ?? '',
    input.snapshot?.summaryText ?? '',
  ];

  const tone = input.snapshot?.resultTone ?? impact?.tone;
  const positive = tone === 'positive' || tone === 'recovery';

  const base = positive
    ? 'Ece bu kararın kısa vadeli etkisini olumlu görüyor; yarın araç temposunu da izleyecek.'
    : 'Ece bu kararın kısa vadeli etkisini izlemeye aldı; yarın kaynak temposunu da birlikte okuyacak.';

  if (!isDuplicateAdvisorRelationshipLine(base, existing)) {
    return sanitizeAdvisorRelationshipCopy(base, 'result');
  }

  if (styleSignal) {
    const alt = sanitizeAdvisorRelationshipCopy(
      `Ece bugünkü ${styleSignal.label.toLowerCase()} çizgisinin bu kararda da göründüğünü not ediyor.`,
      'result',
    );
    if (alt && !isDuplicateAdvisorRelationshipLine(alt, existing)) return alt;
  }

  return undefined;
}

export function buildAdvisorOperationalRelationshipModel(
  input: AdvisorRelationshipInput,
): AdvisorOperationalRelationshipModel {
  const day = Math.max(1, input.day);
  const existingLines = input.existingLines ?? [];
  const dayTone = buildDayToneLine(input);
  const styleSignal = buildPlayerStyleSignal({ ...input, day });
  const previousRef = buildPreviousDecisionReference({ ...input, day }, existingLines);
  const districtRef = buildDistrictMemoryReference({ ...input, day }, existingLines);
  const resourceRef = buildResourceHabitReference({ ...input, day }, existingLines);
  const predictionState = resolvePredictionState({ ...input, day });
  const predictionLine = buildPredictionCorrectionLine(predictionState, existingLines);

  const mainAdvisorLine = composeMainAdvisorLine(
    { ...input, day },
    dayTone,
    previousRef,
    styleSignal,
    predictionLine,
    districtRef,
  );

  const supportingLine = composeSupportingLine(
    { ...input, day },
    mainAdvisorLine,
    resourceRef,
    districtRef,
    predictionLine,
  );

  const reportLine = buildReportLine({ ...input, day }, styleSignal, previousRef, resourceRef);
  const resultLine = buildResultLine({ ...input, day }, styleSignal);
  const hubLine = sanitizeAdvisorRelationshipCopy(mainAdvisorLine, 'hub') ?? mainAdvisorLine;

  const districtId = resolveDistrictId(input);
  const duplicateKey = makeAdvisorRelationshipDuplicateKey({
    day,
    styleKind: styleSignal?.kind,
    districtId,
    domain: input.decisionImpact?.relatedDomain ?? input.tomorrowRisk?.relatedDomain,
    sourceKind: previousRef ? 'previous_decision' : styleSignal ? 'player_style' : 'day_tone',
    previousDecisionId: previousRef?.decisionId,
  });

  const maxVisibleLines = day >= 8 ? 2 : day >= 4 ? 2 : 1;

  return {
    day,
    relationshipVisibility: input.isDay1Tutorial ? 'hidden' : resolveAdvisorRelationshipVisibility(day),
    trustTone: resolveAdvisorRelationshipTrustTone(day),
    familiarityBand: resolveAdvisorRelationshipFamiliarityBand(day),
    playerStyleSignal: styleSignal,
    previousDecisionReference: previousRef,
    districtMemoryReference: districtRef,
    resourceHabitReference: resourceRef,
    predictionCorrectionLine: predictionLine,
    predictionState,
    confidenceLine:
      day >= 8
        ? sanitizeAdvisorRelationshipCopy(
            'Ece artık karar çizgini ve mahalle bağlamını birlikte okuyabiliyor.',
            'confidence',
          )
        : undefined,
    mainAdvisorLine,
    supportingLine,
    reportLine,
    hubLine,
    resultLine,
    sourceSignals: buildSourceSignals({ ...input, day }),
    duplicateKey,
    maxVisibleLines,
  };
}

export function buildAdvisorRelationshipDistrictLine(
  districtId: MapDistrictId,
  existingLines: string[] = [],
): string | undefined {
  const line = ADVISOR_RELATIONSHIP_DISTRICT_LINES[districtId];
  if (!line || isDuplicateAdvisorRelationshipLine(line, existingLines)) return undefined;
  return sanitizeAdvisorRelationshipCopy(line, 'supporting');
}

export function buildAdvisorRelationshipStyleLine(
  kind: AdvisorRelationshipStyleKind,
  existingLines: string[] = [],
): string | undefined {
  const line = ADVISOR_RELATIONSHIP_STYLE_SOFT_LINES[kind];
  if (!line || isDuplicateAdvisorRelationshipLine(line, existingLines)) return undefined;
  return sanitizeAdvisorRelationshipCopy(line, 'supporting');
}
