import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  appendCityArchiveEntries,
  makeCityArchiveDuplicateKey,
} from '@/core/cityArchive/cityArchiveEngine';
import { cityArchiveCopyContainsForbidden } from '@/core/cityArchive/cityArchiveState';
import type {
  CityArchiveEntry,
  CityArchiveStoryChainSummary,
  CityArchiveV1State,
} from '@/core/cityArchive/cityArchiveTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  STORY_CHAIN_KIND_START_LABELS,
  STORY_CHAIN_KIND_TO_DOMAIN,
  STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS,
  STORY_CHAIN_PERSISTENT_MAX_AGE_DAYS,
  STORY_CHAIN_PERSISTENT_STEP_ORDER,
  maxActiveChainsForDay,
} from './storyChainPersistentConstants';
import type {
  PersistentStoryChain,
  PersistentStoryChainClosure,
  PersistentStoryChainDayCloseInput,
  PersistentStoryChainSourceSignals,
  PersistentStoryChainState,
  PersistentStoryChainStatus,
  PersistentStoryChainStepKind,
  PersistentStoryChainUpdate,
} from './storyChainPersistentTypes';
import type { CreviaStoryChainKind } from './storyChainTypes';

function cleanLine(text: string, limit = 96): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function copySafe(text: string, fallback: string): string {
  const line = cleanLine(text);
  if (!line || cityArchiveCopyContainsForbidden(line)) return cleanLine(fallback);
  const lower = line.toLocaleLowerCase('tr-TR');
  if (STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS.some((w) => lower.includes(w))) {
    return cleanLine(fallback);
  }
  return line;
}

function districtName(id?: MapDistrictId): string {
  if (!id) return 'Mahalle';
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function makeChainId(kind: CreviaStoryChainKind, districtId?: MapDistrictId, day?: number): string {
  return `psc-${kind}-${districtId ?? 'city'}-${day ?? 0}`;
}

function makeChainDuplicateKey(
  kind: CreviaStoryChainKind,
  districtId?: MapDistrictId,
): string {
  return `${kind}:${districtId ?? 'city'}`;
}

export function extractPersistentStoryChainState(
  archive: CityArchiveV1State | null | undefined,
): PersistentStoryChainState {
  const summary = archive?.storyChainSummary;
  const activeChains = normalizeActiveChains(summary?.activeChains);
  const recentlyClosedChains = normalizeClosures(summary?.recentlyClosedChains);
  return {
    activeChains: activeChains.filter((c) => c.status !== 'closed' && c.status !== 'expired'),
    recentlyClosedChains,
    unresolvedChainKinds: (summary?.unresolvedChainKinds ?? []) as CreviaStoryChainKind[],
    lastUpdatedDay: summary?.lastUpdatedDay ?? archive?.updatedAtDay ?? 1,
    lastResolvedDay: summary?.lastResolvedDay,
    duplicateKeys: summary?.duplicateKeys ?? [],
    summaryLine: summary?.summaryLine,
    sourceSignals: {
      hasCarryOver: false,
      hasDistrictReport: false,
      hasTomorrowRisk: false,
      hasRewardComeback: false,
      hasArchiveWarning: false,
      hasOperationSignals: false,
      hasCrisisWatch: false,
      hasMainOperation: false,
    },
  };
}

function normalizeActiveChains(raw: unknown): PersistentStoryChain[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PersistentStoryChain => {
    return (
      !!item &&
      typeof item === 'object' &&
      typeof (item as PersistentStoryChain).chainId === 'string' &&
      typeof (item as PersistentStoryChain).chainKind === 'string'
    );
  });
}

function normalizeClosures(raw: unknown): PersistentStoryChainClosure[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PersistentStoryChainClosure => {
    return !!item && typeof item === 'object' && typeof (item as PersistentStoryChainClosure).chainId === 'string';
  });
}

function nextStepKind(current: PersistentStoryChainStepKind): PersistentStoryChainStepKind {
  const idx = STORY_CHAIN_PERSISTENT_STEP_ORDER.indexOf(current);
  if (idx < 0 || idx >= STORY_CHAIN_PERSISTENT_STEP_ORDER.length - 1) {
    return 'closure';
  }
  return STORY_CHAIN_PERSISTENT_STEP_ORDER[idx + 1]!;
}

function stepLine(
  chain: PersistentStoryChain,
  stepKind: PersistentStoryChainStepKind,
  day: number,
): string {
  const name = districtName(chain.districtId);
  switch (stepKind) {
    case 'trigger':
      return copySafe(
        STORY_CHAIN_KIND_START_LABELS[chain.chainKind],
        `${name} çevresinde devam eden iz başladı.`,
      );
    case 'follow_up':
      return copySafe(
        `Operasyon zinciri: ${name} hattında takip adımı ilerledi.`,
        `${name} takip çizgisi devam ediyor.`,
      );
    case 'pressure_shift':
      return copySafe(
        `${name} hattında baskı kontrollü şekilde izleniyor.`,
        `${name} baskısı hâlâ izleniyor.`,
      );
    case 'recovery_window':
      return copySafe(
        `${name} için toparlanma adımına geçildi.`,
        `${name} toparlanma penceresi açık.`,
      );
    case 'prevention_check':
      return copySafe(
        `${name} hattında önleme kontrolü yapıldı.`,
        `${name} önleme kontrolünde.`,
      );
    case 'closure':
      return copySafe(
        `Operasyon zinciri: ${name} takip çizgisi Gün ${day} kapanış sinyali verdi.`,
        `${name} takip çizgisi kapandı.`,
      );
    default:
      return copySafe(chain.playerVisibleLine, `${name} izleniyor.`);
  }
}

function buildArchiveEntryForStep(
  chain: PersistentStoryChain,
  stepKind: PersistentStoryChainStepKind,
  day: number,
): CityArchiveEntry | null {
  const shortLine = stepLine(chain, stepKind, day);
  const duplicateKey = makeCityArchiveDuplicateKey({
    day,
    kind: 'story_chain_step',
    districtId: chain.districtId,
    eventId: chain.chainId,
    decisionId: stepKind,
    sourceKind: 'storyChain',
  });
  return {
    id: `psc-entry-${chain.chainId}-${stepKind}-${day}`,
    day,
    kind: 'story_chain_step',
    districtId: chain.districtId,
    domain: chain.chainKind,
    eventId: chain.chainId,
    decisionId: stepKind,
    sourceKind: 'storyChain',
    title: chain.playerVisibleTitle,
    shortLine,
    reportLine: chain.reportLine ?? shortLine,
    eceLine: chain.eceLine,
    mapLine: chain.mapLine ?? shortLine,
    isPlayerVisible: day > 1,
    priority: chain.priority === 'high' ? 'high' : 'medium',
    duplicateKey,
    createdFrom: 'storyChain',
    createdAtDay: day,
  };
}

type StartCandidate = {
  kind: CreviaStoryChainKind;
  districtId?: MapDistrictId;
  priority: PersistentStoryChain['priority'];
};

function detectStartCandidates(input: PersistentStoryChainDayCloseInput): StartCandidate[] {
  const day = input.day;
  if (day <= 1) return [];

  const districtId =
    normalizeMapDistrictId(input.districtId ?? input.operationSignals?.priorityDistrictId) ??
    undefined;
  const candidates: StartCandidate[] = [];

  const push = (kind: CreviaStoryChainKind, d?: MapDistrictId, priority: PersistentStoryChain['priority'] = 'medium') => {
    candidates.push({ kind, districtId: d ?? districtId, priority });
  };

  if (input.carryOverUnresolved || input.carryOverLine) {
    push('operation_followup_chain', districtId, 'high');
  }
  if (input.crisisWatch || input.operationSignals?.districts?.status === 'critical') {
    push('crisis_watch_chain', districtId, 'high');
  }
  if (
    input.districtReportIssueKind?.includes('route') ||
    input.operationSignals?.vehicles?.status === 'critical' ||
    input.operationSignals?.vehicles?.status === 'strained'
  ) {
    push('route_pressure_chain', districtId === 'merkez' ? 'sanayi' : districtId, 'high');
  }
  if (input.districtReportIssueKind?.includes('container')) {
    push('container_recovery_chain', districtId === 'sanayi' ? 'cumhuriyet' : districtId, 'medium');
  }
  if (input.districtReportIssueKind?.includes('social') || input.socialResponse) {
    push('social_trust_chain', districtId, 'medium');
  }
  if (input.rewardComebackKind === 'comeback_available') {
    push('district_recovery_chain', districtId, 'high');
  }
  if (
    input.operationSignals?.personnel?.status === 'strained' ||
    input.operationSignals?.personnel?.status === 'critical'
  ) {
    push('resource_fatigue_chain', districtId, 'medium');
  }
  if (day >= POST_PILOT_FIRST_OPERATION_DAY && input.isPostPilot && input.mainOperationFeelLine) {
    push('operation_followup_chain', districtId, 'medium');
  }
  if (input.districtReportIssueKind?.includes('visible')) {
    push('visible_service_chain', districtId ?? 'merkez', 'low');
  }

  return candidates;
}

function canStartChain(
  state: PersistentStoryChainState,
  candidate: StartCandidate,
  day: number,
): boolean {
  const dup = makeChainDuplicateKey(candidate.kind, candidate.districtId);
  if (state.duplicateKeys.includes(dup)) return false;

  const recentStart = [...state.activeChains, ...state.recentlyClosedChains].find(
    (c) =>
      c.chainKind === candidate.kind &&
      c.districtId === candidate.districtId &&
      'startedDay' in c &&
      day - (c as PersistentStoryChain).startedDay <= 2,
  );
  if (recentStart) return false;

  const sameIssue = state.activeChains.some(
    (c) =>
      c.chainKind === candidate.kind &&
      c.districtId === candidate.districtId &&
      c.status !== 'closed' &&
      c.status !== 'expired',
  );
  if (sameIssue) return false;

  return state.activeChains.length < maxActiveChainsForDay(day);
}

function createChain(candidate: StartCandidate, day: number): PersistentStoryChain {
  const districtId = candidate.districtId;
  const chainId = makeChainId(candidate.kind, districtId, day);
  const line = stepLine(
    {
      chainId,
      chainKind: candidate.kind,
      districtId,
      domain: STORY_CHAIN_KIND_TO_DOMAIN[candidate.kind],
      currentStepIndex: 0,
      currentStepKind: 'trigger',
      status: 'active',
      startedDay: day,
      lastAdvancedDay: day,
      relatedEventIds: [],
      relatedDecisionIds: [],
      archiveEntryIds: [],
      priority: candidate.priority,
      duplicateKey: makeChainDuplicateKey(candidate.kind, districtId),
      playerVisibleTitle: 'Operasyon zinciri',
      playerVisibleLine: STORY_CHAIN_KIND_START_LABELS[candidate.kind],
    },
    'trigger',
    day,
  );
  return {
    chainId,
    chainKind: candidate.kind,
    districtId,
    domain: STORY_CHAIN_KIND_TO_DOMAIN[candidate.kind],
    currentStepIndex: 0,
    currentStepKind: 'trigger',
    status: 'active',
    startedDay: day,
    lastAdvancedDay: day,
    relatedEventIds: [],
    relatedDecisionIds: [],
    archiveEntryIds: [],
    priority: candidate.priority,
    duplicateKey: makeChainDuplicateKey(candidate.kind, districtId),
    playerVisibleTitle: 'Operasyon zinciri',
    playerVisibleLine: line,
    hubLine: copySafe(`Devam eden iz: ${districtName(districtId)} ${line.charAt(0).toLowerCase()}${line.slice(1)}`, line),
    reportLine: copySafe(`Operasyon zinciri: ${line}`, line),
    eceLine: copySafe(
      `Ece, ${districtName(districtId)} hattının tek günlük değil çok günlük toparlanma çizgisi olduğunu not ediyor.`,
      `Ece, ${districtName(districtId)} takip çizgisini izlemeni öneriyor.`,
    ),
    mapLine: line,
  };
}

function positiveClosureKind(input: PersistentStoryChainDayCloseInput): PersistentStoryChainClosure['closureKind'] {
  if (input.crisisPrevented) return 'prevented';
  if (input.trustRecovering || input.containerRelief || input.routeBalanced) return 'resolved';
  if (input.trustImproving || input.tomorrowRiskSoftened) return 'softened';
  return 'stabilized';
}

function shouldAdvanceToClosure(
  chain: PersistentStoryChain,
  input: PersistentStoryChainDayCloseInput,
): boolean {
  if (input.trustRecovering || input.containerRelief || input.routeBalanced || input.resourceRecovered) {
    return true;
  }
  if (input.crisisPrevented && chain.chainKind === 'crisis_watch_chain') return true;
  if (input.rewardComebackKind === 'comeback_completed') return true;
  if (input.socialResponse && chain.chainKind === 'social_trust_chain') return true;
  return false;
}

function advanceChainOnce(
  chain: PersistentStoryChain,
  input: PersistentStoryChainDayCloseInput,
): { chain: PersistentStoryChain; closed?: PersistentStoryChainClosure } | null {
  if (chain.lastAdvancedDay >= input.day) return null;
  if (chain.status === 'closed' || chain.status === 'expired') return null;

  const age = input.day - chain.startedDay;
  if (age > STORY_CHAIN_PERSISTENT_MAX_AGE_DAYS) {
    const closure: PersistentStoryChainClosure = {
      chainId: chain.chainId,
      chainKind: chain.chainKind,
      districtId: chain.districtId,
      closedDay: input.day,
      closureKind: 'expired_soft',
      summaryLine: copySafe(
        `${districtName(chain.districtId)} takip çizgisi kontrollü şekilde yumuşadı.`,
        'Takip çizgisi yumuşadı.',
      ),
    };
    return {
      chain: { ...chain, status: 'expired', lastAdvancedDay: input.day, currentStepKind: 'closure' },
      closed: closure,
    };
  }

  if (shouldAdvanceToClosure(chain, input)) {
    const line = stepLine(chain, 'closure', input.day);
    const closure: PersistentStoryChainClosure = {
      chainId: chain.chainId,
      chainKind: chain.chainKind,
      districtId: chain.districtId,
      closedDay: input.day,
      closureKind: positiveClosureKind(input),
      summaryLine: line,
    };
    return {
      chain: {
        ...chain,
        status: 'closed',
        currentStepKind: 'closure',
        currentStepIndex: STORY_CHAIN_PERSISTENT_STEP_ORDER.length - 1,
        lastAdvancedDay: input.day,
        playerVisibleLine: line,
        hubLine: copySafe(`Devam eden iz: ${line}`, line),
        reportLine: copySafe(`Operasyon zinciri: ${line}`, line),
      },
      closed: closure,
    };
  }

  let nextKind = nextStepKind(chain.currentStepKind);
  if (chain.currentStepKind === 'follow_up') {
    nextKind = input.tomorrowRiskSoftened ? 'recovery_window' : 'pressure_shift';
  }
  if (chain.currentStepKind === 'recovery_window' && !shouldAdvanceToClosure(chain, input)) {
    return {
      chain: {
        ...chain,
        status: 'waiting',
        lastAdvancedDay: input.day,
      },
    };
  }

  const line = stepLine(chain, nextKind, input.day);
  const nextIndex = STORY_CHAIN_PERSISTENT_STEP_ORDER.indexOf(nextKind);
  return {
    chain: {
      ...chain,
      currentStepKind: nextKind,
      currentStepIndex: nextIndex >= 0 ? nextIndex : chain.currentStepIndex + 1,
      status: nextKind === 'closure' ? 'ready_to_close' : 'active',
      lastAdvancedDay: input.day,
      playerVisibleLine: line,
      hubLine: copySafe(`Devam eden iz: ${line}`, line),
      reportLine: copySafe(`Operasyon zinciri: ${line}`, line),
      mapLine: line,
    },
  };
}

export function buildPersistentStoryChainUpdate(
  archive: CityArchiveV1State,
  input: PersistentStoryChainDayCloseInput,
): PersistentStoryChainUpdate {
  const day = input.day;
  let state = extractPersistentStoryChainState(archive);
  const newArchiveEntries: CityArchiveEntry[] = [];
  const nextActive: PersistentStoryChain[] = [];
  const nextClosed = [...state.recentlyClosedChains].slice(-8);

  state = {
    ...state,
    sourceSignals: {
      hasCarryOver: Boolean(input.carryOverLine),
      hasDistrictReport: Boolean(input.districtReportIssueKind),
      hasTomorrowRisk: Boolean(input.tomorrowRiskLine),
      hasRewardComeback: Boolean(input.rewardComebackLine),
      hasArchiveWarning: archive.entries.some(
        (e) => e.day >= day - 1 && (e.kind === 'resource_pressure' || e.kind === 'district_shift'),
      ),
      hasOperationSignals: Boolean(input.operationSignals),
      hasCrisisWatch: Boolean(input.crisisWatch),
      hasMainOperation: Boolean(input.mainOperationFeelLine),
    },
  };

  for (const chain of state.activeChains) {
    const result = advanceChainOnce(chain, input);
    if (!result) {
      nextActive.push(chain);
      continue;
    }
    const entry = buildArchiveEntryForStep(result.chain, result.chain.currentStepKind, day);
    if (entry) newArchiveEntries.push(entry);
    if (result.closed) {
      nextClosed.push(result.closed);
      if (entry) result.closed.archiveEntryId = entry.id;
    } else {
      nextActive.push(result.chain);
    }
  }

  if (day > 1) {
    const candidates = detectStartCandidates(input);
    for (const candidate of candidates) {
      if (!canStartChain({ ...state, activeChains: nextActive }, candidate, day)) continue;
      const chain = createChain(candidate, day);
      const entry = buildArchiveEntryForStep(chain, 'trigger', day);
      if (entry) newArchiveEntries.push(entry);
      nextActive.push(chain);
      state.duplicateKeys = [...state.duplicateKeys, chain.duplicateKey];
      if (nextActive.length >= maxActiveChainsForDay(day)) break;
    }
  }

  const unresolvedChainKinds = [
    ...new Set(
      nextActive
        .filter((c) => c.status === 'active' || c.status === 'waiting')
        .map((c) => c.chainKind),
    ),
  ];

  const primary = nextActive.find((c) => c.status === 'active' || c.status === 'waiting');
  const summaryLine = primary?.hubLine ?? primary?.playerVisibleLine;

  const lastResolvedDay =
    nextClosed.some((c) => c.closedDay === day) ? day : state.lastResolvedDay;

  return {
    state: {
      activeChains: nextActive.filter((c) => c.status !== 'closed' && c.status !== 'expired'),
      recentlyClosedChains: nextClosed,
      unresolvedChainKinds,
      lastUpdatedDay: day,
      lastResolvedDay,
      duplicateKeys: state.duplicateKeys,
      summaryLine,
      sourceSignals: state.sourceSignals,
    },
    newArchiveEntries,
  };
}

export function applyPersistentStoryChainUpdate(
  archive: CityArchiveV1State,
  update: PersistentStoryChainUpdate,
): CityArchiveV1State {
  let next = archive;
  if (update.newArchiveEntries.length > 0) {
    next = appendCityArchiveEntries(next, update.newArchiveEntries, {
      day: update.state.lastUpdatedDay,
      skipDuplicate: true,
    });
  }

  const storyChainSummary: CityArchiveStoryChainSummary = {
    ...next.storyChainSummary,
    activeChainIds: update.state.activeChains.map((c) => c.chainId),
    unresolvedChainKinds: update.state.unresolvedChainKinds,
    lastUpdatedDay: update.state.lastUpdatedDay,
    lastClosureDay: update.state.recentlyClosedChains.at(-1)?.closedDay,
    lastResolvedDay: update.state.lastResolvedDay,
    duplicateKeys: update.state.duplicateKeys,
    summaryLine: update.state.summaryLine,
    activeChains: update.state.activeChains,
    recentlyClosedChains: update.state.recentlyClosedChains,
  };

  return {
    ...next,
    updatedAtDay: Math.max(next.updatedAtDay, update.state.lastUpdatedDay),
    storyChainSummary,
  };
}

export function buildPersistentStoryChainUpdateFromArchive(
  archive: CityArchiveV1State,
  input: PersistentStoryChainDayCloseInput,
): PersistentStoryChainUpdate {
  return buildPersistentStoryChainUpdate(archive, input);
}

export function applyPersistentStoryChainOnDayClose(
  archive: CityArchiveV1State,
  input: PersistentStoryChainDayCloseInput,
): CityArchiveV1State {
  const update = buildPersistentStoryChainUpdate(archive, input);
  return applyPersistentStoryChainUpdate(archive, update);
}
