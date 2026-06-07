import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import {
  MAIN_OPERATION_FEEL_COPY,
  MAIN_OPERATION_FEEL_DISTRICT_STATUS_LABELS,
  MAIN_OPERATION_FEEL_FIRST_DAY,
  MAIN_OPERATION_FEEL_FORBIDDEN_WORDS,
  MAIN_OPERATION_FEEL_MAX_HUB_LINES_COMPACT,
  MAIN_OPERATION_FEEL_MAX_HUB_LINES_OPENING,
  MAIN_OPERATION_FEEL_MAX_REPORT_LINES,
  MAIN_OPERATION_FEEL_OPENING_DAY,
} from './mainOperationFeelConstants';
import type {
  MainOperationFeelAccessMode,
  MainOperationFeelInput,
  MainOperationFeelModel,
  MainOperationFeelTone,
} from './mainOperationFeelTypes';

function cleanText(value: string | null | undefined, limit = 160): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function normalizeMainOperationFeelText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mainOperationFeelContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeMainOperationFeelText(text);
  return MAIN_OPERATION_FEEL_FORBIDDEN_WORDS.some((word) =>
    normalized.includes(normalizeMainOperationFeelText(word)),
  );
}

export function isMainOperationFeelDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeMainOperationFeelText(line);
  return existingLines.some((existing) => {
    const other = normalizeMainOperationFeelText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}

function resolveAccessMode(input: MainOperationFeelInput): MainOperationFeelAccessMode {
  if (input.accessMode === 'full') return 'full';
  if (input.accessMode === 'limited') return 'light';
  if (input.postPilotPhase === 'main_operation_full') return 'full';
  if (input.postPilotPhase === 'main_operation_light') return 'light';
  return 'unknown';
}

function resolveTone(input: MainOperationFeelInput, accessMode: MainOperationFeelAccessMode): MainOperationFeelTone {
  if (input.day === MAIN_OPERATION_FEEL_OPENING_DAY) return 'opening';
  if (input.tomorrowRisk?.tone === 'recovery') return 'recovery';
  if (
    input.operationSignals?.overall?.status === 'critical' ||
    input.operationSignals?.overall?.status === 'strained'
  ) {
    return 'watch';
  }
  if (accessMode === 'full' && (input.mainOperationSeason?.currentSeasonDay ?? 0) <= 3) {
    return 'expanding';
  }
  return 'steady';
}

function districtScopeFromSeason(input: MainOperationFeelInput): {
  scopeLine: string;
  priorityDistrictIds: string[];
  visibleDistrictScope: string[];
} {
  const scopes = input.mainOperationSeason?.districtScopes;
  if (!scopes) {
    return {
      scopeLine: MAIN_OPERATION_FEEL_COPY.fallbackScope,
      priorityDistrictIds: [],
      visibleDistrictScope: [],
    };
  }

  const grouped: Record<string, MapDistrictId[]> = {
    active: [],
    agenda: [],
    preview: [],
  };

  for (const scope of Object.values(scopes)) {
    if (scope.status === 'inactive') continue;
    grouped[scope.status]?.push(scope.districtId);
  }

  const parts: string[] = [];
  if (grouped.active.length > 0) {
    const names = grouped.active.slice(0, 3).map((id) => getNeighborhoodDisplayName(id));
    parts.push(`${names.join(' + ')} ${MAIN_OPERATION_FEEL_DISTRICT_STATUS_LABELS.active}`);
  }
  if (grouped.agenda.length > 0) {
    const name = getNeighborhoodDisplayName(grouped.agenda[0]);
    parts.push(`${name} ${MAIN_OPERATION_FEEL_DISTRICT_STATUS_LABELS.agenda}`);
  }
  if (grouped.preview.length > 0) {
    const name = getNeighborhoodDisplayName(grouped.preview[0]);
    parts.push(`${name} ${MAIN_OPERATION_FEEL_DISTRICT_STATUS_LABELS.preview}`);
  }

  const priorityDistrictIds = [
    ...grouped.active,
    ...grouped.agenda,
    ...grouped.preview,
  ].slice(0, 4);

  const visibleDistrictScope = priorityDistrictIds.map((id) => getNeighborhoodDisplayName(id));

  return {
    scopeLine: parts.length > 0 ? parts.join(', ') + '.' : MAIN_OPERATION_FEEL_COPY.fallbackScope,
    priorityDistrictIds,
    visibleDistrictScope,
  };
}

function buildDistrictFocusLine(input: MainOperationFeelInput): string | undefined {
  const priorityId =
    input.operationSignals?.priorityDistrictId ??
    (input.mainOperationSeason?.districtScopes
      ? Object.values(input.mainOperationSeason.districtScopes).find((s) => s.status === 'active')
          ?.districtId
      : undefined);

  if (!priorityId) return undefined;

  const name = getNeighborhoodDisplayName(priorityId);
  const trust = input.districtTrustRuntime?.[priorityId]?.state;
  if (trust === 'fragile' || trust === 'strained') {
    return `Bugün ${name} mahalle güveni ana operasyon odağında.`;
  }
  const memory = input.districtMemoryRuntime?.[priorityId]?.kind;
  if (memory === 'recovery' || memory === 'positive') {
    return `${name} mahalle dengesi bugün toparlanma sinyali veriyor.`;
  }
  return `Bugün ana operasyon ${name} hattında yoğunlaşıyor.`;
}

function buildOperationTempoLine(input: MainOperationFeelInput): string | undefined {
  const signals = input.operationSignals;
  if (!signals) return undefined;

  const parts: string[] = [];
  if (signals.vehicles?.status === 'watch' || signals.vehicles?.status === 'strained') {
    parts.push('rota temposu');
  }
  if (signals.containers?.status === 'watch' || signals.containers?.status === 'strained') {
    parts.push('konteyner baskısı');
  }
  if (signals.personnel?.status === 'watch' || signals.personnel?.status === 'strained') {
    parts.push('ekip yükü');
  }

  if (parts.length === 0) return undefined;
  return `Operasyon temposu ${parts.join(' ve ')} birlikte izleniyor.`;
}

function buildEceLine(
  input: MainOperationFeelInput,
  accessMode: MainOperationFeelAccessMode,
  tone: MainOperationFeelTone,
): string | undefined {
  if (input.cityEchoBinding?.eceLine && !isMainOperationFeelDuplicate(input.cityEchoBinding.eceLine, input.existingLines)) {
    return cleanText(input.cityEchoBinding.eceLine, 120);
  }

  const tempo = buildOperationTempoLine(input);
  if (tempo && (input.operationSignals?.vehicles || input.operationSignals?.containers)) {
    const routeContainer =
      'Ece bugün rota ve konteyner baskısını birlikte izlemeni öneriyor.';
    if (!isMainOperationFeelDuplicate(routeContainer, input.existingLines)) {
      return routeContainer;
    }
  }

  if (tone === 'opening') {
    const opening =
      accessMode === 'full'
        ? 'Pilot sonrası kapsam genişledi. Bugün kararların sadece tek olayı değil, mahalle dengesini de etkiler.'
        : 'Pilot sonrası ana operasyon önizlemesi başladı. Kararların izlenen mahalle dengesine yansır.';
    if (!isMainOperationFeelDuplicate(opening, input.existingLines)) {
      return opening;
    }
  }

  if (accessMode === 'full') {
    return cleanText('Ece bugün çoklu mahalle takibini ve kaynak dengesini birlikte izlemeni öneriyor.', 120);
  }

  return cleanText('Ece bugün sınırlı kapsamdaki mahalle dengesini izlemeni öneriyor.', 120);
}

function buildMapLine(scopeNames: string[], accessMode: MainOperationFeelAccessMode): string {
  if (scopeNames.length === 0) {
    return accessMode === 'full'
      ? 'Bugün ana operasyon geniş mahalle kapsamını birlikte izliyor.'
      : 'Bugün ana operasyon önizlemesi sınırlı mahalle hattını izliyor.';
  }
  const joined =
    scopeNames.length <= 3
      ? scopeNames.join(', ')
      : `${scopeNames.slice(0, 2).join(', ')} ve ${scopeNames[scopeNames.length - 1]}`;
  return `Bugün ana operasyon ${joined} hattını birlikte izliyor.`;
}

function buildReportLine(
  input: MainOperationFeelInput,
  scopeNames: string[],
  accessMode: MainOperationFeelAccessMode,
): string {
  const focus = buildDistrictFocusLine(input);
  const tempo = buildOperationTempoLine(input);

  if (focus && tempo) {
    const line = `${focus.replace(/\.$/, '')}. ${tempo}`;
    if (!mainOperationFeelContainsForbiddenWords(line)) return cleanText(line, 154);
  }

  if (scopeNames.length >= 2) {
    const line = `Bugün ana operasyon ${scopeNames.slice(0, 2).join(' ve ')} hattında yoğunlaştı.${
      tempo ? ` ${tempo}` : ''
    }`;
    if (!mainOperationFeelContainsForbiddenWords(line)) return cleanText(line, 154);
  }

  if (input.tomorrowRisk?.mainLine && !isMainOperationFeelDuplicate(input.tomorrowRisk.mainLine, input.existingLines)) {
    const line = `Ana operasyon kapsamında ${input.tomorrowRisk.mainLine.charAt(0).toLocaleLowerCase('tr-TR')}${input.tomorrowRisk.mainLine.slice(1)}`;
    return cleanText(line, 154);
  }

  return accessMode === 'full'
    ? MAIN_OPERATION_FEEL_COPY.reportScopeFull
    : MAIN_OPERATION_FEEL_COPY.reportScopeLight;
}

function buildHubTitle(tone: MainOperationFeelTone): string {
  return tone === 'opening'
    ? MAIN_OPERATION_FEEL_COPY.hubTitleOpening
    : MAIN_OPERATION_FEEL_COPY.hubTitleCompact;
}

function buildHubSubtitle(
  accessMode: MainOperationFeelAccessMode,
  tone: MainOperationFeelTone,
): string {
  if (tone === 'opening') {
    return accessMode === 'full'
      ? MAIN_OPERATION_FEEL_COPY.hubSubtitleOpeningFull
      : MAIN_OPERATION_FEEL_COPY.hubSubtitleOpeningLight;
  }
  return accessMode === 'full'
    ? MAIN_OPERATION_FEEL_COPY.hubSubtitleCompactFull
    : MAIN_OPERATION_FEEL_COPY.hubSubtitleCompactLight;
}

function buildCityStateLine(accessMode: MainOperationFeelAccessMode, tone: MainOperationFeelTone): string | undefined {
  if (tone !== 'opening') return undefined;
  return accessMode === 'full'
    ? MAIN_OPERATION_FEEL_COPY.cityStateFull
    : MAIN_OPERATION_FEEL_COPY.cityStateLight;
}

function buildContentVarietyScopeLine(input: MainOperationFeelInput): string | undefined {
  const domains = new Set<string>();
  if (input.operationSignals?.vehicles) domains.add('rota');
  if (input.operationSignals?.containers) domains.add('konteyner');
  if (input.operationSignals?.districts) domains.add('mahalle');
  if (input.operationSignals?.personnel) domains.add('ekip');
  if (domains.size < 2) return undefined;
  return `Bugün ${Array.from(domains).slice(0, 3).join(', ')} sinyalleri birlikte izleniyor.`;
}

export function shouldShowMainOperationFeel(input: MainOperationFeelInput): boolean {
  if (input.day < MAIN_OPERATION_FEEL_FIRST_DAY) return false;
  if (input.isPilotCompleted === false) return false;
  if (input.postPilotPhase === 'pilot_only') return false;
  return true;
}

export function buildMainOperationFeelModel(input: MainOperationFeelInput): MainOperationFeelModel {
  const visible = shouldShowMainOperationFeel(input);
  const accessMode = resolveAccessMode(input);
  const tone = resolveTone(input, accessMode);
  const isOpening = tone === 'opening';
  const maxVisibleLines = isOpening
    ? MAIN_OPERATION_FEEL_MAX_HUB_LINES_OPENING
    : MAIN_OPERATION_FEEL_MAX_HUB_LINES_COMPACT;

  if (!visible) {
    return {
      day: input.day,
      isPostPilot: false,
      accessMode: 'unknown',
      title: '',
      subtitle: '',
      scopeLine: '',
      tone: 'steady',
      priorityDistrictIds: [],
      visibleDistrictScope: [],
      shouldShowHubHero: false,
      shouldShowReportSection: false,
      shouldShowMapHint: false,
      maxVisibleLines: 0,
      sourceSignals: [],
      visible: false,
    };
  }

  const sourceSignals: string[] = ['post_pilot'];
  const { scopeLine, priorityDistrictIds, visibleDistrictScope } = districtScopeFromSeason(input);

  if (input.mainOperationSeason) sourceSignals.push('main_operation_season');
  if (input.operationSignals) sourceSignals.push('operation_signals');
  if (input.districtTrustRuntime) sourceSignals.push('district_trust');
  if (input.districtMemoryRuntime) sourceSignals.push('district_memory');
  if (input.tomorrowRisk) sourceSignals.push('tomorrow_risk');
  if (input.contentPackPresentationHint) sourceSignals.push('content_pack_activation');

  const districtFocusLine = buildDistrictFocusLine(input);
  const operationTempoLine = buildOperationTempoLine(input);
  const contentVarietyLine = buildContentVarietyScopeLine(input);

  let resolvedScopeLine = scopeLine;
  if (
    input.contentPackPresentationHint &&
    !isMainOperationFeelDuplicate(input.contentPackPresentationHint, [
      scopeLine,
      ...(input.existingLines ?? []),
    ])
  ) {
    resolvedScopeLine = input.contentPackPresentationHint;
  } else if (
    contentVarietyLine &&
    !isMainOperationFeelDuplicate(contentVarietyLine, [scopeLine, ...(input.existingLines ?? [])])
  ) {
    resolvedScopeLine = `${scopeLine.replace(/\.$/, '')}; ${contentVarietyLine}`;
  }

  const eceLine = buildEceLine(input, accessMode, tone);
  const mapLine = buildMapLine(visibleDistrictScope, accessMode);
  const reportLine = buildReportLine(input, visibleDistrictScope, accessMode);

  const existingForGuard = [
    ...(input.existingLines ?? []),
    input.progressionBridgeScopeLine ?? '',
    input.operationSignalsSummary ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    input.tomorrowRisk?.supportLine ?? '',
    input.cityEchoBinding?.hubLine ?? '',
    input.cityEchoBinding?.reportLine ?? '',
  ].filter(Boolean);

  const shouldShowHubHero =
    !isMainOperationFeelDuplicate(resolvedScopeLine, existingForGuard) ||
    !isMainOperationFeelDuplicate(buildHubSubtitle(accessMode, tone), existingForGuard);

  const filteredReportLine = isMainOperationFeelDuplicate(reportLine, existingForGuard)
    ? undefined
    : reportLine;

  return {
    day: input.day,
    isPostPilot: true,
    accessMode,
    title: buildHubTitle(tone),
    subtitle: buildHubSubtitle(accessMode, tone),
    scopeLine: cleanText(resolvedScopeLine),
    cityStateLine: buildCityStateLine(accessMode, tone),
    districtFocusLine: districtFocusLine && !isMainOperationFeelDuplicate(districtFocusLine, existingForGuard)
      ? cleanText(districtFocusLine)
      : undefined,
    operationTempoLine: operationTempoLine && !isMainOperationFeelDuplicate(operationTempoLine, existingForGuard)
      ? cleanText(operationTempoLine)
      : undefined,
    eceLine: eceLine && !isMainOperationFeelDuplicate(eceLine, existingForGuard) ? eceLine : undefined,
    mapLine,
    reportLine: filteredReportLine,
    primaryCTA: MAIN_OPERATION_FEEL_COPY.hubCta,
    secondaryCTA: accessMode === 'full' ? MAIN_OPERATION_FEEL_COPY.hubCtaSecondary : undefined,
    tone,
    priorityDistrictIds,
    visibleDistrictScope,
    shouldShowHubHero,
    shouldShowReportSection: Boolean(filteredReportLine),
    shouldShowMapHint: input.day >= POST_PILOT_FIRST_OPERATION_DAY,
    maxVisibleLines,
    sourceSignals,
    visible: true,
  };
}

export function buildMainOperationFeelFallbackModel(day: number): MainOperationFeelModel {
  return buildMainOperationFeelModel({
    day,
    isPilotCompleted: true,
    accessMode: 'limited',
    postPilotPhase: 'main_operation_light',
  });
}
