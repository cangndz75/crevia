import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { buildDistrictMemoryRuntimeSnapshot, getDistrictMemoryDistrictSnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeModel';
import { buildDistrictOperationsRuntimeSnapshot, getDistrictOperationRuntimeDistrictSnapshot } from '@/core/districtOperationsRuntime/districtOperationsRuntimeModel';
import { buildDistrictTrustRuntimeSnapshot, getDistrictTrustDistrictSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import { getDistrictTrustRuntimeBandDefinition } from '@/core/districtTrustRuntime/districtTrustRuntimeConstants';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  DISTRICT_REPORT_CARD_LITE_BAND_STATUS_TONE,
  DISTRICT_REPORT_CARD_LITE_DISTRICT_IDENTITY_HINTS,
  DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
  DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS,
  DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS,
  DISTRICT_REPORT_CARD_LITE_MAX_COPY_LENGTH,
  DISTRICT_REPORT_CARD_LITE_MAX_VISIBLE_LINES,
  DISTRICT_REPORT_CARD_LITE_TRUST_LABELS,
} from './districtReportCardConstants';
import {
  buildEceDistrictLineFromArchive,
  buildRecentEventsFromArchive,
  collectArchiveGuardLines,
  inferPlayerStyleInDistrict,
  inferPublicTone,
  inferRecoveryState,
  inferResourcePressureState,
  inferTrustTrend,
  mapLiteVisibilityToFull,
  maxRecentEventsForDay,
} from './districtReportCardArchiveModel';
import {
  DISTRICT_REPORT_CARD_PLAYER_STYLE_LINES,
  DISTRICT_REPORT_CARD_PUBLIC_TONE_LINES,
  DISTRICT_REPORT_CARD_RECOVERY_LINES,
} from './districtReportCardConstants';
import type {
  DistrictReportCardDominantIssueKind,
  DistrictReportCardFullInput,
  DistrictReportCardFullModel,
  DistrictReportCardFullSourceSignals,
  DistrictReportCardLiteInput,
  DistrictReportCardLiteModel,
  DistrictReportCardLitePriority,
  DistrictReportCardLiteSourceSignals,
  DistrictReportCardLiteVisibility,
  DistrictReportCardRecentEffectKind,
  DistrictReportPlayerStyleKind,
  DistrictReportPublicTone,
  DistrictReportRecoveryState,
} from './districtReportCardTypes';

function cleanText(value: string | null | undefined, limit = DISTRICT_REPORT_CARD_LITE_MAX_COPY_LENGTH): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function normalizeDistrictReportCardText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function districtReportCardContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeDistrictReportCardText(text);
  return DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS.some((word) => normalized.includes(word));
}

export function isDistrictReportCardDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeDistrictReportCardText(line);
  return existingLines.some((existing) => {
    const other = normalizeDistrictReportCardText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}

function sanitizeCopy(text: string, fallback: string): string {
  const cleaned = cleanText(text);
  if (!cleaned || districtReportCardContainsForbiddenWords(cleaned)) {
    return cleanText(fallback);
  }
  return cleaned;
}

function resolveDistrictId(input: DistrictReportCardLiteInput): MapDistrictId | null {
  const raw =
    input.districtId ??
    input.operationSignals?.priorityDistrictId ??
    input.activeEvent?.neighborhoodId ??
    null;
  if (!raw) return null;
  return normalizeMapDistrictId(raw) ?? null;
}

function isPostPilot(input: DistrictReportCardLiteInput): boolean {
  return (
    input.isPostPilot === true ||
    input.isPilotCompleted === true ||
    (input.day ?? 1) >= POST_PILOT_FIRST_OPERATION_DAY
  );
}

export function buildDistrictReportCardLiteVisibility(
  input: DistrictReportCardLiteInput = {},
): DistrictReportCardLiteVisibility {
  const day = input.day ?? 1;

  if (day <= 1) {
    return 'compact';
  }

  if (day <= 3) {
    return 'compact';
  }

  if (day <= 7) {
    return 'standard';
  }

  if (isPostPilot(input) && input.accessMode === 'full') {
    return 'detailed_preview';
  }

  if (isPostPilot(input)) {
    return 'standard';
  }

  return 'standard';
}

function signalContext(input: DistrictReportCardLiteInput, districtId: MapDistrictId) {
  return {
    day: input.day,
    focusDistrictId: districtId,
    crisisState: input.crisisState,
    operationSignals: input.operationSignals ?? undefined,
    resourceFatigue: input.resourceFatigue,
    socialPulse: input.socialPulse ?? undefined,
  };
}

function signalStatusWeight(status?: string): number {
  if (status === 'critical') return 4;
  if (status === 'strained') return 3;
  if (status === 'watch') return 2;
  return 0;
}

type IssueCandidate = {
  kind: DistrictReportCardDominantIssueKind;
  priority: number;
  line: string;
  source: string;
};

function packMetaForDistrict(input: DistrictReportCardLiteInput, districtId: MapDistrictId) {
  const direct =
    input.contentPackMeta ??
    resolveContentPackMetaForWiring({
      event: input.activeEvent,
      contentPackMeta: input.contentPackMeta,
      districtId,
      day: input.day,
    });

  if (direct?.districtId === districtId) return direct;

  for (const event of input.recentEvents ?? []) {
    const meta = resolveContentPackMetaForWiring({
      event,
      districtId: event.neighborhoodId,
      day: input.day,
    });
    if (meta?.districtId === districtId) return meta;
  }

  return direct?.districtId === districtId ? direct : undefined;
}

function issueFromPackMeta(
  meta: NonNullable<ReturnType<typeof packMetaForDistrict>>,
  districtName: string,
): IssueCandidate {
  if (meta.packId === 'vehicle_route_pack_one') {
    return {
      kind: 'route_pressure',
      priority: 90,
      line: `${districtName}'de rota baskısı bugün öne çıkıyor.`,
      source: 'content_pack',
    };
  }
  if (meta.packId === 'container_environment_pack_one') {
    return {
      kind: 'container_pressure',
      priority: 90,
      line: `${districtName}'te konteyner çevresi izleme notunda.`,
      source: 'content_pack',
    };
  }
  return {
    kind: meta.districtTrustIntent ? 'social_trust' : 'district_trust',
    priority: 88,
    line: `${districtName}'de mahalle odağı sakin toparlanma çizgisinde.`,
    source: 'content_pack',
  };
}

function selectDominantIssue(
  input: DistrictReportCardLiteInput,
  districtId: MapDistrictId,
  districtName: string,
  trustBand?: string,
  memoryKind?: string,
): IssueCandidate {
  const identity = DISTRICT_REPORT_CARD_LITE_DISTRICT_IDENTITY_HINTS[districtId];
  const candidates: IssueCandidate[] = [];

  const carry = input.carryOverMemory;
  if (carry?.visible !== false && carry?.summary) {
    const carryDistrictMatch =
      !carry.districtLabel ||
      carry.districtLabel.toLocaleLowerCase('tr-TR').includes(districtName.toLocaleLowerCase('tr-TR')) ||
      carry.districtLabel.toLocaleLowerCase('tr-TR').includes(districtId);
    if (carryDistrictMatch) {
      candidates.push({
        kind: 'operation_scope',
        priority: 100,
        line: carry.summary,
        source: 'carry_over',
      });
    }
  }

  const packMeta = packMetaForDistrict(input, districtId);
  if (packMeta) {
    candidates.push(issueFromPackMeta(packMeta, districtName));
  }

  if (
    memoryKind &&
    ['repeated_pressure', 'unresolved_carry_over', 'crisis_watch'].includes(memoryKind)
  ) {
    candidates.push({
      kind: 'recovery_momentum',
      priority: 75,
      line: `${districtName} çevresinde tekrar eden baskı izleniyor.`,
      source: 'memory',
    });
  }

  if (trustBand === 'fragile' || trustBand === 'strained' || trustBand === 'watch') {
    candidates.push({
      kind: trustBand === 'fragile' ? 'social_trust' : 'district_trust',
      priority: trustBand === 'fragile' ? 70 : 65,
      line: `${districtName} güveni ${trustBand === 'watch' ? 'izleme notunda' : 'dikkatle izleniyor'}.`,
      source: 'trust',
    });
  }

  const signals = input.operationSignals;
  if (signals) {
    const ranked = [
      { kind: 'route_pressure' as const, signal: signals.vehicles, line: `${districtName} hattında rota baskısı izleniyor.` },
      { kind: 'container_pressure' as const, signal: signals.containers, line: `${districtName} çevresinde konteyner baskısı izleniyor.` },
      { kind: 'personnel_fatigue' as const, signal: signals.personnel, line: `${districtName} tarafında personel yorgunluğu izleniyor.` },
      { kind: 'vehicle_fatigue' as const, signal: signals.vehicles, line: `${districtName} rotasında araç yorgunluğu izleniyor.` },
      { kind: 'district_trust' as const, signal: signals.districts, line: `${districtName} mahalle dengesi izleniyor.` },
    ].sort((a, b) => signalStatusWeight(b.signal?.status) - signalStatusWeight(a.signal?.status));

    const pick = ranked.find((item) => signalStatusWeight(item.signal?.status) >= 2);
    if (pick) {
      candidates.push({
        kind: pick.kind,
        priority: 55 + signalStatusWeight(pick.signal?.status) * 5,
        line: pick.line,
        source: 'operation_signals',
      });
    }
  }

  const resourceBlob = JSON.stringify(input.resourceFatigue ?? '').toLocaleLowerCase('tr-TR');
  if (resourceBlob.includes('tired') || resourceBlob.includes('fatigue') || resourceBlob.includes('yorgun')) {
    const vehicleHeavy = resourceBlob.includes('vehicle') || resourceBlob.includes('truck') || resourceBlob.includes('arac');
    candidates.push({
      kind: vehicleHeavy ? 'vehicle_fatigue' : 'personnel_fatigue',
      priority: 50,
      line: vehicleHeavy
        ? `${districtName} rotasında kaynak temposu izleniyor.`
        : `${districtName} tarafında ekip temposu izleniyor.`,
      source: 'resource_fatigue',
    });
  }

  const socialTrend = input.socialPulse?.trend;
  if (socialTrend === 'recovering' || socialTrend === 'positive') {
    candidates.push({
      kind: 'recovery_momentum',
      priority: 45,
      line: `${districtName} çevresinde sosyal nabız toparlanma sinyali veriyor.`,
      source: 'social_pulse',
    });
  }

  candidates.push({
    kind: identity?.fallbackIssue ?? 'stable_identity',
    priority: 10,
    line: identity?.identityLine ?? DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
    source: 'district_identity',
  });

  return candidates.sort((a, b) => b.priority - a.priority)[0]!;
}

function buildRecentEffectLine(
  input: DistrictReportCardLiteInput,
  districtId: MapDistrictId,
  districtName: string,
  issue: IssueCandidate,
): { kind: DistrictReportCardRecentEffectKind; line: string } {
  if (issue.source === 'carry_over') {
    return { kind: 'carry_over', line: issue.line };
  }

  if (issue.source === 'content_pack') {
    return {
      kind: 'content_pack',
      line: sanitizeCopy(
        input.cityEcho?.reportLine ?? issue.line,
        `${districtName} çevresinde ana operasyon etkisi bugün fark edildi.`,
      ),
    };
  }

  const ctx = signalContext(input, districtId);
  const memorySnapshot = buildDistrictMemoryRuntimeSnapshot({
    ...ctx,
    trustSnapshot: buildDistrictTrustRuntimeSnapshot(ctx),
  });
  const memory = getDistrictMemoryDistrictSnapshot(memorySnapshot, districtId);
  if (memory?.reasonLine && !memory.isFallback) {
    return {
      kind: 'memory_pressure',
      line: sanitizeCopy(memory.reasonLine, `${districtName} çevresinde son kararların etkisi izleniyor.`),
    };
  }

  if (input.cityEcho?.hubLine) {
    return {
      kind: 'decision_echo',
      line: sanitizeCopy(input.cityEcho.hubLine, `${districtName} çevresinde son kararların etkisi izleniyor.`),
    };
  }

  return {
    kind: 'fallback',
    line: sanitizeCopy(
      `${districtName} çevresinde son kararların görünür etkisi izleniyor.`,
      DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
    ),
  };
}

function buildEceLine(
  input: DistrictReportCardLiteInput,
  districtId: MapDistrictId,
  districtName: string,
  issue: IssueCandidate,
  trustBand?: string,
): string {
  const identity = DISTRICT_REPORT_CARD_LITE_DISTRICT_IDENTITY_HINTS[districtId];
  const ctx = signalContext(input, districtId);
  const trustDef = trustBand ? getDistrictTrustRuntimeBandDefinition(trustBand as never) : null;

  if (issue.kind === 'route_pressure' || issue.kind === 'vehicle_fatigue') {
    return sanitizeCopy(
      `Ece bu mahallede rota ve kaynak dengesini birlikte izlemeni öneriyor.`,
      identity?.eceFallback ?? `Ece, ${districtName} için operasyon dengesini izlemeni öneriyor.`,
    );
  }

  if (issue.kind === 'container_pressure' || issue.kind === 'environmental_care') {
    return sanitizeCopy(
      `Ece, ${districtName}'te çevre baskısının tekrar gündeme gelebileceğini not ediyor.`,
      identity?.eceFallback ?? `Ece, ${districtName} için çevre dengesini izlemeni öneriyor.`,
    );
  }

  if (trustDef?.advisorCopyIntent) {
    return sanitizeCopy(
      `Ece, ${districtName}'te ${trustDef.advisorCopyIntent.charAt(0).toLowerCase()}${trustDef.advisorCopyIntent.slice(1)}`,
      identity?.eceFallback ?? `Ece, ${districtName} için dengeli adımları öneriyor.`,
    );
  }

  if (input.cityEcho?.eceLine) {
    return sanitizeCopy(input.cityEcho.eceLine, identity?.eceFallback ?? `Ece, ${districtName} için operasyon dengesini izlemeni öneriyor.`);
  }

  const opsSnapshot = buildDistrictOperationsRuntimeSnapshot({
    ...ctx,
    trustSnapshot: buildDistrictTrustRuntimeSnapshot(ctx),
    memorySnapshot: buildDistrictMemoryRuntimeSnapshot({
      ...ctx,
      trustSnapshot: buildDistrictTrustRuntimeSnapshot(ctx),
    }),
  });
  const ops = getDistrictOperationRuntimeDistrictSnapshot(opsSnapshot, districtId);
  if (ops?.primary?.advisorLine) {
    return sanitizeCopy(`Ece ${ops.primary.advisorLine}`, identity?.eceFallback ?? `Ece, ${districtName} için operasyon dengesini izlemeni öneriyor.`);
  }

  return sanitizeCopy(identity?.eceFallback ?? `Ece, ${districtName} için operasyon dengesini izlemeni öneriyor.`, DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE);
}

function maxLinesForVisibility(visibility: DistrictReportCardLiteVisibility): number {
  if (visibility === 'compact') return 2;
  if (visibility === 'standard') return 3;
  if (visibility === 'detailed_preview') return DISTRICT_REPORT_CARD_LITE_MAX_VISIBLE_LINES;
  return 0;
}

export function buildDistrictReportCardLiteModel(
  input: DistrictReportCardLiteInput = {},
): DistrictReportCardLiteModel | null {
  const districtId = resolveDistrictId(input);
  if (!districtId) return null;

  const day = input.day ?? 1;
  const visibility = buildDistrictReportCardLiteVisibility(input);
  const districtName =
    getNeighborhoodDisplayName(districtId) ||
    DISTRICT_IDENTITIES[districtId]?.name ||
    districtId;

  const ctx = signalContext(input, districtId);
  const trustSnapshot = buildDistrictTrustRuntimeSnapshot(ctx);
  const trust = getDistrictTrustDistrictSnapshot(trustSnapshot, districtId);
  const memorySnapshot = buildDistrictMemoryRuntimeSnapshot({ ...ctx, trustSnapshot });
  const memory = getDistrictMemoryDistrictSnapshot(memorySnapshot, districtId);
  const opsSnapshot = buildDistrictOperationsRuntimeSnapshot({ ...ctx, trustSnapshot, memorySnapshot });
  const ops = getDistrictOperationRuntimeDistrictSnapshot(opsSnapshot, districtId);

  const trustBand = trust?.band;
  const trustLabel =
    day <= 1
      ? undefined
      : trustBand
        ? DISTRICT_REPORT_CARD_LITE_TRUST_LABELS[trustBand]
        : undefined;
  const trustLine =
    day <= 1
      ? sanitizeCopy(
          DISTRICT_IDENTITIES[districtId]?.eventContextLine ?? `${districtName} saha bölgesi.`,
          `${districtName} saha bölgesi.`,
        )
      : trust?.reasonLine
        ? sanitizeCopy(trust.reasonLine, `${districtName} güveni izleniyor.`)
        : trustLabel;

  const issue = selectDominantIssue(
    input,
    districtId,
    districtName,
    trustBand,
    memory?.primaryKind,
  );

  const recent = buildRecentEffectLine(input, districtId, districtName, issue);
  const packMeta = packMetaForDistrict(input, districtId);

  const existing = [
    ...(input.existingLines ?? []),
    ...(input.mapIntelligenceLines ?? []),
    input.mainOperationScopeHintLine ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    input.cityEcho?.socialLine ?? '',
    input.cityEcho?.reportLine ?? '',
  ].filter(Boolean);

  let dominantIssueLine = sanitizeCopy(issue.line, DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE);
  if (isDistrictReportCardDuplicate(dominantIssueLine, existing)) {
    dominantIssueLine = sanitizeCopy(
      `${DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS[issue.kind]} ${districtName} çevresinde izleniyor.`,
      DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
    );
  }

  let recentEffectLine = recent.line;
  if (isDistrictReportCardDuplicate(recentEffectLine, [...existing, dominantIssueLine])) {
    recentEffectLine = sanitizeCopy(
      `${districtName} çevresinde son kararların etkisi sakin izleniyor.`,
      DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
    );
  }

  let eceLine = buildEceLine(input, districtId, districtName, issue, trustBand);
  if (isDistrictReportCardDuplicate(eceLine, [...existing, dominantIssueLine, recentEffectLine])) {
    eceLine = sanitizeCopy(
      `Ece, ${districtName} için dengeli operasyon adımlarını öneriyor.`,
      DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE,
    );
  }

  const contentPackLine =
    packMeta && day >= POST_PILOT_FIRST_OPERATION_DAY && issue.source === 'content_pack'
      ? sanitizeCopy(issue.line, `${districtName} ana operasyon odağında.`)
      : undefined;

  let tomorrowLine = input.tomorrowRisk?.mainLine;
  if (tomorrowLine && isDistrictReportCardDuplicate(tomorrowLine, [...existing, dominantIssueLine, recentEffectLine, eceLine])) {
    tomorrowLine = undefined;
  }

  const sourceSignals: DistrictReportCardLiteSourceSignals = {
    hasTrustRuntime: Boolean(trust && !trust.isFallback),
    hasMemoryRuntime: Boolean(memory && !memory.isFallback),
    hasOperationsRuntime: Boolean(ops && !ops.isFallback),
    hasCarryOver: Boolean(input.carryOverMemory?.summary),
    hasContentPack: Boolean(packMeta),
    hasTomorrowRisk: Boolean(input.tomorrowRisk?.mainLine),
    hasCityEcho: Boolean(input.cityEcho),
    hasOperationSignals: Boolean(input.operationSignals),
    hasResourceFatigue: Boolean(input.resourceFatigue),
    hasSocialPulse: Boolean(input.socialPulse),
  };

  const statusTone = trustBand
    ? DISTRICT_REPORT_CARD_LITE_BAND_STATUS_TONE[trustBand]
    : issue.kind === 'recovery_momentum'
      ? 'recovering'
      : 'stable';

  const priority: DistrictReportCardLitePriority =
    issue.priority >= 90 ? 'high' : issue.priority >= 60 ? 'medium' : 'low';

  const visible =
    visibility !== 'hidden' &&
    Boolean(districtId) &&
    (day > 1 || Boolean(trustLine));

  return {
    districtId,
    districtName,
    day,
    visible,
    visibility,
    trustBand,
    trustLabel,
    trustLine: trustLine ? cleanText(trustLine) : undefined,
    dominantIssueKind: issue.kind,
    dominantIssueLabel: DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS[issue.kind],
    dominantIssueLine,
    recentEffectKind: recent.kind,
    recentEffectLine,
    eceLine: day <= 1 ? undefined : eceLine,
    socialToneLine:
      day >= 4 && input.cityEcho?.socialLine && !isDistrictReportCardDuplicate(input.cityEcho.socialLine, existing)
        ? cleanText(input.cityEcho.socialLine)
        : undefined,
    operationLine: ops?.primary?.mapLine ? cleanText(ops.primary.mapLine) : undefined,
    memoryLine: memory?.reasonLine ? cleanText(memory.reasonLine) : undefined,
    contentPackLine: contentPackLine || undefined,
    tomorrowLine: tomorrowLine ? cleanText(tomorrowLine) : undefined,
    statusTone,
    priority,
    sourceSignals,
    maxVisibleLines: maxLinesForVisibility(visibility),
    duplicateKey: [districtId, issue.kind, issue.source, packMeta?.familyId ?? 'none'].join(':'),
  };
}

export function shouldShowDistrictReportCardLite(
  model: DistrictReportCardLiteModel | null | undefined,
): boolean {
  return Boolean(model?.visible && model.districtName);
}

export function shouldShowDistrictReportCardFull(
  model: DistrictReportCardFullModel | null | undefined,
): boolean {
  return Boolean(model?.visible && model.districtName);
}

function buildPublicToneLine(
  tone: DistrictReportPublicTone,
  districtName: string,
  existing: string[],
): string {
  const base = DISTRICT_REPORT_CARD_PUBLIC_TONE_LINES[tone];
  const localized =
    tone === 'watchful' || tone === 'strained'
      ? `${districtName} çevresinde ${base.charAt(0).toLowerCase()}${base.slice(1)}`
      : base;
  const line = sanitizeCopy(localized, DISTRICT_REPORT_CARD_PUBLIC_TONE_LINES.unknown);
  if (isDistrictReportCardDuplicate(line, existing)) {
    return sanitizeCopy(DISTRICT_REPORT_CARD_PUBLIC_TONE_LINES.calm, DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE);
  }
  return line;
}

function buildPlayerStyleLine(
  style: DistrictReportPlayerStyleKind,
  existing: string[],
): string | undefined {
  const line = sanitizeCopy(
    DISTRICT_REPORT_CARD_PLAYER_STYLE_LINES[style],
    DISTRICT_REPORT_CARD_PLAYER_STYLE_LINES.unknown,
  );
  if (isDistrictReportCardDuplicate(line, existing)) return undefined;
  return line;
}

function buildRecoveryLine(
  state: DistrictReportRecoveryState,
  existing: string[],
): string | undefined {
  const line = sanitizeCopy(
    DISTRICT_REPORT_CARD_RECOVERY_LINES[state],
    DISTRICT_REPORT_CARD_RECOVERY_LINES.unknown,
  );
  if (isDistrictReportCardDuplicate(line, existing)) return undefined;
  return line;
}

export function buildDistrictReportCardFullModel(
  input: DistrictReportCardFullInput = {},
): DistrictReportCardFullModel | null {
  const lite = buildDistrictReportCardLiteModel(input);
  if (!lite) return null;

  const day = lite.day;
  const maxVisibleRecentEvents = maxRecentEventsForDay(day);
  const archive = input.cityArchive;
  const guard = collectArchiveGuardLines(input);

  const recentArchiveEvents = buildRecentEventsFromArchive(
    archive,
    lite.districtId,
    maxVisibleRecentEvents,
  );

  const trustTrend = inferTrustTrend(archive, lite.districtId);
  const resourcePressureState = inferResourcePressureState(archive, lite.districtId, lite);

  const carryResolved =
    input.carryOverMemory?.visible === false ||
    input.carryOverMemory?.summary?.toLocaleLowerCase('tr-TR').includes('toparlan');

  const publicTone = inferPublicTone({
    archive,
    districtId: lite.districtId,
    trustBand: lite.trustBand,
    socialPulseTrend: input.socialPulse?.trend,
    carryOverResolved: carryResolved,
    hasCrisisWatch: lite.dominantIssueKind === 'crisis_prevention',
    resourcePressure: resourcePressureState,
  });

  const playerStyleInDistrict = inferPlayerStyleInDistrict({
    archive,
    districtId: lite.districtId,
    advisorStyle: archive?.playerStyleSummary?.dominantStyle ?? null,
  });

  const recoveryState = inferRecoveryState({
    archive,
    districtId: lite.districtId,
    trustBand: lite.trustBand,
    tomorrowRiskSoftened: input.tomorrowRisk?.shouldShowAsCompact === true,
    carryOverResolved: carryResolved,
    rewardComebackLine: input.rewardComebackLine,
  });

  let guardLines = [...guard];
  let publicToneLine = day <= 1 ? sanitizeCopy(lite.trustLine ?? lite.dominantIssueLine, DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE) : buildPublicToneLine(publicTone, lite.districtName, guardLines);
  guardLines.push(publicToneLine);

  const playerStyleLine =
    day >= 4 ? buildPlayerStyleLine(playerStyleInDistrict, guardLines) : undefined;
  if (playerStyleLine) guardLines.push(playerStyleLine);

  const recoveryLine =
    day >= 3 && recoveryState !== 'unknown'
      ? buildRecoveryLine(recoveryState, guardLines)
      : undefined;
  if (recoveryLine) guardLines.push(recoveryLine);

  const eceDistrictLine =
    day <= 1
      ? undefined
      : buildEceDistrictLineFromArchive({
          archive,
          districtId: lite.districtId,
          districtName: lite.districtName,
          dominantIssueKind: lite.dominantIssueKind,
          publicTone,
          playerStyle: playerStyleInDistrict,
          liteEceLine: lite.eceLine,
          existingLines: guardLines,
        });

  if (eceDistrictLine) guardLines.push(eceDistrictLine);

  let dominantIssueLine = lite.dominantIssueLine;
  const archiveDominant = recentArchiveEvents.find((e) => e.tone === 'warning');
  if (archiveDominant && day >= 4 && !isDistrictReportCardDuplicate(archiveDominant.shortLine, guardLines)) {
    dominantIssueLine = sanitizeCopy(
      archiveDominant.shortLine,
      lite.dominantIssueLine,
    );
  }
  guardLines.push(dominantIssueLine);

  const recentEffectLine =
    recentArchiveEvents[0]?.shortLine && !isDistrictReportCardDuplicate(recentArchiveEvents[0].shortLine, guardLines)
      ? sanitizeCopy(recentArchiveEvents[0].shortLine, lite.recentEffectLine)
      : lite.recentEffectLine;

  const mapLine = sanitizeCopy(
    recentArchiveEvents.find((e) => e.tone !== 'neutral')?.shortLine ??
      dominantIssueLine ??
      publicToneLine,
    lite.dominantIssueLine,
  );

  const hubLine = sanitizeCopy(
    playerStyleLine ?? publicToneLine ?? lite.trustLine ?? dominantIssueLine,
    lite.dominantIssueLine,
  );

  const reportLine =
    day <= 3
      ? undefined
      : sanitizeCopy(
          recoveryLine ?? recentEffectLine ?? dominantIssueLine,
          lite.recentEffectLine,
        );

  const detailLines = [
    publicToneLine,
    playerStyleLine ?? '',
    recoveryLine ?? '',
    ...recentArchiveEvents.map((e) => e.shortLine),
    eceDistrictLine ?? '',
  ].filter((line) => Boolean(line) && !isDistrictReportCardDuplicate(line, guard));

  const sourceSignals: DistrictReportCardFullSourceSignals = {
    ...lite.sourceSignals,
    hasCityArchive: Boolean(Array.isArray(archive?.entries) && archive.entries.length > 0),
    hasArchiveDistrictSummary: Boolean(archive?.districtSummaries?.[lite.districtId]),
    hasArchiveRewardComeback: Boolean(archive?.rewardComebackSummary?.recentComebackEntryIds?.length),
    hasArchiveEceSummary: Boolean(archive?.eceRelationshipSummary?.lastUpdatedDay),
  };

  return {
    districtId: lite.districtId,
    districtName: lite.districtName,
    day,
    visible: lite.visible,
    visibility: mapLiteVisibilityToFull(lite.visibility),
    trustBand: lite.trustBand,
    trustTrend,
    trustLabel: lite.trustLabel,
    trustLine: lite.trustLine,
    dominantIssueKind: lite.dominantIssueKind,
    dominantIssueLabel: lite.dominantIssueLabel,
    dominantIssueLine,
    recentArchiveEvents,
    publicTone,
    publicToneLine,
    playerStyleInDistrict,
    playerStyleLine,
    recoveryState,
    recoveryLine,
    resourcePressureState,
    eceDistrictLine,
    socialToneLine: lite.socialToneLine,
    mapLine: isDistrictReportCardDuplicate(mapLine, guard) ? undefined : mapLine,
    hubLine: isDistrictReportCardDuplicate(hubLine, guard) ? lite.trustLine : hubLine,
    reportLine:
      reportLine && !isDistrictReportCardDuplicate(reportLine, guard) ? reportLine : undefined,
    detailLines,
    sourceSignals,
    duplicateKey: [lite.duplicateKey, archive ? 'archive' : 'lite', publicTone, playerStyleInDistrict].join(':'),
    maxVisibleRecentEvents,
    recentEffectLine,
    recentEffectKind: lite.recentEffectKind,
    statusTone: lite.statusTone,
    priority: lite.priority,
    maxVisibleLines: lite.maxVisibleLines,
    eceLine: eceDistrictLine ?? lite.eceLine,
  };
}
