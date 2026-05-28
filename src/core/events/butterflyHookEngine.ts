import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { hashSeed } from '@/core/game/createSeededRandom';
import {
  getEventContentProfileById,
  EVENT_CONTENT_PROFILES,
} from './eventContentLibrary';
import type { EventContentCategory, EventDecisionIntent } from './eventContentTypes';
import {
  BUTTERFLY_DECISION_STYLE_INTENT,
  BUTTERFLY_FAVORABLE_INTENTS,
  BUTTERFLY_FOLLOW_UP_PROFILE_BY_TAG,
  BUTTERFLY_HOOK_EXPIRE_AFTER_DUE_DAYS,
  BUTTERFLY_HOOK_MAX_ACTIVE,
  BUTTERFLY_HOOK_MAX_FOLLOW_UP_EVENTS_PER_DAY,
  BUTTERFLY_HOOK_MAX_NEW_PER_DAY,
  BUTTERFLY_HOOK_MAX_PILOT_DAY,
  BUTTERFLY_STRATEGY_HOOK_KIND,
  BUTTERFLY_UNLIKELY_INTENTS,
} from './butterflyHookConstants';
import { buildButterflyHintForDecisionResult } from './butterflyHookPresentation';
import type {
  ButterflyHook,
  ButterflyHookDecisionHint,
  ButterflyHookDecisionInput,
  ButterflyHookGenerationContext,
  ButterflyHookKind,
  ButterflyHookSeverity,
  ButterflyHookSource,
  ButterflyHookState,
} from './butterflyHookTypes';
import { getPilotRhythmPlan } from './pilotRhythmEngine';

export function createDefaultButterflyHookState(): ButterflyHookState {
  return { hooks: [], lastProcessedDay: 0 };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

const VALID_STATUSES = new Set([
  'active',
  'resolved',
  'expired',
  'suppressed',
]);
const VALID_SOURCES = new Set([
  'decision',
  'daily_priority',
  'event_content',
  'system_signal',
]);
const VALID_KINDS = new Set([
  'follow_up_event',
  'report_echo',
  'risk_signal',
  'opportunity_return',
  'permanent_solution_prompt',
]);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high']);

export function normalizeButterflyHookState(raw: unknown): ButterflyHookState {
  if (!isRecord(raw) || !Array.isArray(raw.hooks)) {
    return createDefaultButterflyHookState();
  }
  const hooks: ButterflyHook[] = [];
  for (const item of raw.hooks) {
    if (!isRecord(item)) continue;
    if (typeof item.id !== 'string') continue;
    if (!VALID_STATUSES.has(String(item.status))) continue;
    if (!VALID_SOURCES.has(String(item.source))) continue;
    if (!VALID_KINDS.has(String(item.kind))) continue;
    if (!VALID_SEVERITIES.has(String(item.severity))) continue;
    if (typeof item.createdDay !== 'number') continue;
    if (typeof item.dueDay !== 'number') continue;
    if (typeof item.expiresDay !== 'number') continue;
    if (typeof item.title !== 'string') continue;
    if (typeof item.description !== 'string') continue;
    if (typeof item.triggerTag !== 'string') continue;
    if (typeof item.createdAt !== 'number') continue;
    hooks.push({
      id: item.id,
      source: item.source as ButterflyHook['source'],
      kind: item.kind as ButterflyHookKind,
      status: item.status as ButterflyHook['status'],
      createdDay: item.createdDay,
      dueDay: item.dueDay,
      expiresDay: item.expiresDay,
      sourceEventId:
        typeof item.sourceEventId === 'string' ? item.sourceEventId : undefined,
      sourceEventTitle:
        typeof item.sourceEventTitle === 'string'
          ? item.sourceEventTitle
          : undefined,
      sourceDecisionId:
        typeof item.sourceDecisionId === 'string'
          ? item.sourceDecisionId
          : undefined,
      sourceDecisionTitle:
        typeof item.sourceDecisionTitle === 'string'
          ? item.sourceDecisionTitle
          : undefined,
      neighborhoodId:
        typeof item.neighborhoodId === 'string'
          ? item.neighborhoodId
          : undefined,
      category: typeof item.category === 'string' ? item.category : undefined,
      profileId:
        typeof item.profileId === 'string' ? item.profileId : undefined,
      severity: item.severity as ButterflyHookSeverity,
      title: item.title,
      description: item.description,
      triggerTag: item.triggerTag,
      followUpProfileId:
        typeof item.followUpProfileId === 'string'
          ? item.followUpProfileId
          : undefined,
      preferredCategories: Array.isArray(item.preferredCategories)
        ? item.preferredCategories.filter((c): c is string => typeof c === 'string')
        : undefined,
      preferredPriorityKeys: Array.isArray(item.preferredPriorityKeys)
        ? (item.preferredPriorityKeys.filter(
            (k): k is DailyPriorityKey =>
              k === 'public_relief' ||
              k === 'operation_stability' ||
              k === 'resource_protection',
          ) as DailyPriorityKey[])
        : undefined,
      reportLine:
        typeof item.reportLine === 'string' ? item.reportLine : undefined,
      resultHint:
        typeof item.resultHint === 'string' ? item.resultHint : undefined,
      createdAt: item.createdAt,
      resolvedAt:
        typeof item.resolvedAt === 'number' ? item.resolvedAt : undefined,
    });
  }
  return {
    hooks,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number' ? raw.lastProcessedDay : 0,
  };
}

function countActiveHooks(state: ButterflyHookState): number {
  return state.hooks.filter((h) => h.status === 'active').length;
}

function hooksCreatedOnDay(state: ButterflyHookState, day: number): number {
  return state.hooks.filter((h) => h.createdDay === day).length;
}

function hasDuplicateActiveHook(
  state: ButterflyHookState,
  sourceEventId: string,
  triggerTag: string,
): boolean {
  return state.hooks.some(
    (h) =>
      h.status === 'active' &&
      h.sourceEventId === sourceEventId &&
      h.triggerTag === triggerTag,
  );
}

function deterministicPick(seed: string, options: number): number {
  if (options <= 1) return 0;
  return hashSeed(seed) % options;
}

export function inferDecisionIntent(decision: EventDecision): EventDecisionIntent | null {
  const strategy = decision.contentStrategyLabel?.trim();
  if (strategy === 'Hızlı çözüm') return 'dispatch_team';
  if (strategy === 'Kaynak korur') return 'save_resources';
  if (strategy === 'Kalıcı çözüm') return 'permanent_fix';
  if (strategy === 'Sosyal rahatlama') return 'communicate';
  if (strategy === 'Dengeli plan') return 'coordinate';

  const style = decision.decisionStyle;
  if (style && BUTTERFLY_DECISION_STYLE_INTENT[style]) {
    return BUTTERFLY_DECISION_STYLE_INTENT[style]!;
  }

  const id = decision.id.toLowerCase();
  if (id.includes('fast') || id.includes('dispatch')) return 'dispatch_team';
  if (id.includes('monitor') || id.includes('wait')) return 'monitor';
  if (id.includes('delay') || id.includes('planned')) return 'delay';
  if (id.includes('permanent') || id.includes('capacity')) return 'permanent_fix';
  if (id.includes('inform') || id.includes('communic')) return 'communicate';
  if (id.includes('save') || id.includes('resource')) return 'save_resources';

  return null;
}

export function shouldCreateButterflyHook(input: ButterflyHookDecisionInput): boolean {
  const { day, event, decision, hookState, dailyPriorityKey } = input;

  if (day <= 1) return false;
  if (day > BUTTERFLY_HOOK_MAX_PILOT_DAY) return false;
  if (countActiveHooks(hookState) >= BUTTERFLY_HOOK_MAX_ACTIVE) return false;
  if (hooksCreatedOnDay(hookState, day) >= BUTTERFLY_HOOK_MAX_NEW_PER_DAY) {
    return false;
  }

  const intent = inferDecisionIntent(decision);
  if (intent && BUTTERFLY_UNLIKELY_INTENTS.has(intent)) {
    if (intent !== 'permanent_fix') {
      return false;
    }
    if (deterministicPick(`${event.id}-${decision.id}-perm`, 4) !== 0) {
      return false;
    }
  }

  const futureHint =
    event.contentFutureHookHint?.trim() ??
    (event.contentProfileId
      ? getEventContentProfileById(event.contentProfileId)?.futureHook
          ?.triggerTag
      : undefined);

  if (futureHint) {
    if (
      hasDuplicateActiveHook(hookState, event.id, futureHint)
    ) {
      return false;
    }
    return true;
  }

  if (!intent || !BUTTERFLY_FAVORABLE_INTENTS.has(intent)) {
    if (dailyPriorityKey) {
      return shouldCreatePriorityMismatchHook(input, intent);
    }
    return false;
  }

  const triggerTag = buildTriggerTag(intent, event, decision);
  if (hasDuplicateActiveHook(hookState, event.id, triggerTag)) {
    return false;
  }

  const rollSeed = `${day}-${event.id}-${decision.id}-${intent}`;
  const threshold =
    intent === 'dispatch_team' || intent === 'monitor' || intent === 'delay'
      ? 2
      : 3;
  if (deterministicPick(rollSeed, threshold) !== 0) {
    return false;
  }

  return true;
}

function shouldCreatePriorityMismatchHook(
  input: ButterflyHookDecisionInput,
  intent: EventDecisionIntent | null,
): boolean {
  const { dailyPriorityKey, decision, event, hookState } = input;
  if (!dailyPriorityKey) return false;

  const strategy = decision.contentStrategyLabel ?? '';
  let triggerTag = 'priority_mismatch';
  let should = false;

  if (
    dailyPriorityKey === 'resource_protection' &&
    (strategy === 'Hızlı çözüm' || intent === 'dispatch_team')
  ) {
    triggerTag = 'resource_echo';
    should = true;
  } else if (
    dailyPriorityKey === 'operation_stability' &&
    (intent === 'communicate' || strategy === 'Sosyal rahatlama')
  ) {
    triggerTag = 'stability_echo';
    should = true;
  } else if (
    dailyPriorityKey === 'public_relief' &&
    (intent === 'monitor' || intent === 'delay' || intent === 'save_resources')
  ) {
    triggerTag = 'social_follow';
    should = true;
  }

  if (!should) return false;
  if (hasDuplicateActiveHook(hookState, event.id, triggerTag)) return false;
  return deterministicPick(`${event.id}-${decision.id}-${triggerTag}`, 2) === 0;
}

function buildTriggerTag(
  intent: EventDecisionIntent,
  event: EventCard,
  decision: EventDecision,
): string {
  const category = event.contentCategory ?? event.category;
  return `${intent}_${category}_${decision.id}`.replace(/\s+/g, '_').slice(0, 48);
}

export function inferButterflyHookKind(
  input: ButterflyHookDecisionInput,
): ButterflyHookKind {
  const { event, decision, dailyPriorityKey } = input;
  const intent = inferDecisionIntent(decision);
  const futureProfile = event.contentProfileId
    ? getEventContentProfileById(event.contentProfileId)
    : null;
  const futureHook = futureProfile?.futureHook;

  if (futureHook) {
    if (futureHook.severityShift === 'down') {
      return 'permanent_solution_prompt';
    }
    return 'follow_up_event';
  }

  if (dailyPriorityKey && shouldCreatePriorityMismatchHook(input, intent)) {
    if (dailyPriorityKey === 'public_relief') return 'follow_up_event';
    if (dailyPriorityKey === 'resource_protection') return 'report_echo';
    return 'risk_signal';
  }

  const strategy = decision.contentStrategyLabel?.trim();
  if (strategy && BUTTERFLY_STRATEGY_HOOK_KIND[strategy]) {
    return BUTTERFLY_STRATEGY_HOOK_KIND[strategy]!;
  }

  if (intent === 'dispatch_team' || intent === 'reroute') {
    return 'follow_up_event';
  }
  if (intent === 'monitor' || intent === 'delay' || intent === 'save_resources') {
    return 'report_echo';
  }
  if (intent === 'communicate') return 'risk_signal';
  if (intent === 'permanent_fix') return 'permanent_solution_prompt';

  return 'follow_up_event';
}

export function inferButterflyHookSeverity(
  input: ButterflyHookDecisionInput,
  kind: ButterflyHookKind,
): ButterflyHookSeverity {
  const day = input.day;
  if (day >= BUTTERFLY_HOOK_MAX_PILOT_DAY && kind !== 'report_echo') {
    return 'medium';
  }
  if (kind === 'permanent_solution_prompt') return 'low';
  if (kind === 'report_echo') return 'low';
  if (kind === 'risk_signal') return 'medium';
  if (kind === 'opportunity_return') return 'low';
  return day >= 6 ? 'medium' : 'low';
}

export function inferButterflyHookDueDay(
  input: ButterflyHookDecisionInput,
  kind: ButterflyHookKind,
): number {
  const { day, event, decision } = input;
  const profile = event.contentProfileId
    ? getEventContentProfileById(event.contentProfileId)
    : null;
  const delayDays = profile?.futureHook?.delayDays;
  let offset = 2;
  if (typeof delayDays === 'number' && delayDays > 0) {
    offset = Math.min(2, Math.max(1, delayDays));
  } else {
    offset =
      1 +
      deterministicPick(`${event.id}-${decision.id}-due`, 2);
  }
  if (kind === 'report_echo') {
    offset = Math.min(offset, 1);
  }
  return day + offset;
}

export function buildButterflyHookTexts(input: ButterflyHookDecisionInput): {
  title: string;
  description: string;
  reportLine: string;
  resultHint: string;
} {
  const { event, decision } = input;
  const neighborhood = event.district?.trim() || 'mahalle';
  const intent = inferDecisionIntent(decision);
  const kind = inferButterflyHookKind(input);

  const futureProfile = event.contentProfileId
    ? getEventContentProfileById(event.contentProfileId)
    : null;
  const followTitle =
    futureProfile?.futureHook?.possibleFollowUpTitle ??
    event.contentFutureHookHint;

  if (followTitle) {
    return {
      title: followTitle,
      description: `${neighborhood} hattında önceki kararın yankısı: ${followTitle.toLowerCase()}.`,
      reportLine: `Dünkü karar ${neighborhood}'de ${followTitle.toLowerCase()} sinyalini takipte bıraktı.`,
      resultHint: `Bu karar ${neighborhood}'de kalıcı talebi birkaç gün içinde yeniden gündeme getirebilir.`,
    };
  }

  if (kind === 'follow_up_event') {
    const topic =
      event.contentCategory === 'waste_container'
        ? 'kalıcı kapasite talebi'
        : 'operasyon takibi';
    return {
      title: `${neighborhood}: geri dönen talep`,
      description: `Geçici çözüm rahatlattı; ${topic} izleniyor.`,
      reportLine: `Hızlı çözüm ${neighborhood}'de ${topic}ni takipte bıraktı.`,
      resultHint: `Baskı azaldı ama ${topic} birkaç gün içinde yeniden gündeme gelebilir.`,
    };
  }

  if (kind === 'report_echo') {
    return {
      title: 'Kaynak ve takip yankısı',
      description: 'Bugünkü tercih bütçeyi korudu; izleme sinyali rapora işlendi.',
      reportLine: 'Kaynak koruma tercihi bütçeyi rahatlattı, takip sinyali kaldı.',
      resultHint: 'Takip sinyali oluştu — gün sonu raporunda kısa yankı görebilirsin.',
    };
  }

  if (kind === 'risk_signal') {
    return {
      title: 'Operasyon riski takipte',
      description: 'İletişim öncelikli müdahale riski tam kapatmadı.',
      reportLine: 'Sosyal iletişim riski tam kapatmadı; operasyon takibi sürüyor.',
      resultHint: 'Saha etkisi sınırlı kaldı; risk sinyali birkaç gün içinde geri dönebilir.',
    };
  }

  if (kind === 'permanent_solution_prompt') {
    return {
      title: 'Kalıcı çözüm baskısı hafif',
      description: 'Kalıcı plan seçildiği için ilgili risk yumuşak kapandı.',
      reportLine: 'Kalıcı çözüm seçildiği için ilgili risk bugün büyümeden kapandı.',
      resultHint: 'Kalıcı çözüm tercihi ileride benzer baskıyı daha yumuşak getirebilir.',
    };
  }

  if (intent === 'monitor' || intent === 'delay') {
    return {
      title: 'Ertelenen konu izleniyor',
      description: 'Erteleme kaynak korudu; konu kısa sürede geri dönebilir.',
      reportLine: 'Ertelenen konu bugün mahalle sinyali olarak geri döndü.',
      resultHint: 'Erteleme kaynak korudu; konu yakında yeniden gündeme gelebilir.',
    };
  }

  return {
    title: 'Karar yankısı',
    description: 'Önceki müdahale kısa süreli rahatlama sağladı.',
    reportLine: 'Önceki kararın kısa yankısı bugün rapora yansıdı.',
    resultHint: 'Bu karar ileride tekrar gündeme gelebilir.',
  };
}

export function dedupeButterflyHooks(hooks: ButterflyHook[]): ButterflyHook[] {
  const seen = new Set<string>();
  const out: ButterflyHook[] = [];
  for (const hook of hooks) {
    const key = `${hook.sourceEventId ?? ''}:${hook.triggerTag}:${hook.status}`;
    if (seen.has(key) && hook.status === 'active') continue;
    seen.add(key);
    out.push(hook);
  }
  return out;
}

export function expireOldButterflyHooks(
  state: ButterflyHookState,
  day: number,
): ButterflyHookState {
  const now = Date.now();
  const hooks = state.hooks.map((hook) => {
    if (hook.status !== 'active') return hook;
    if (day > hook.expiresDay) {
      return { ...hook, status: 'expired' as const, resolvedAt: now };
    }
    return hook;
  });
  return {
    hooks: dedupeButterflyHooks(hooks),
    lastProcessedDay: Math.max(state.lastProcessedDay, day),
  };
}

export function activateHooksForDay(
  state: ButterflyHookState,
  day: number,
): ButterflyHook[] {
  return state.hooks.filter(
    (h) => h.status === 'active' && h.dueDay <= day && h.expiresDay >= day,
  );
}

export function selectButterflyHookForEventGeneration(
  context: ButterflyHookGenerationContext,
): ButterflyHook | null {
  const notYetInjected = (h: ButterflyHook) =>
    !context.existingEventIds.some((id) => id.includes(h.id));

  const due = context.hooks
    .filter(
      (h) =>
        h.status === 'active' &&
        h.dueDay === context.day &&
        h.kind === 'follow_up_event' &&
        notYetInjected(h),
    )
    .sort((a, b) => {
      const rank = (s: ButterflyHook['severity']) =>
        s === 'high' ? 3 : s === 'medium' ? 2 : 1;
      return rank(b.severity) - rank(a.severity);
    });

  if (due.length === 0) {
    const reportDue = context.hooks.find(
      (h) =>
        h.status === 'active' &&
        h.dueDay === context.day &&
        h.kind !== 'follow_up_event',
    );
    return reportDue ?? null;
  }

  if (context.isButterflySeedDay) {
    return due[0] ?? null;
  }

  return due[0] ?? null;
}

export function markHookResolvedByEvent(
  state: ButterflyHookState,
  hookId: string,
  day: number,
): ButterflyHookState {
  const now = Date.now();
  return {
    ...state,
    hooks: state.hooks.map((h) =>
      h.id === hookId
        ? { ...h, status: 'resolved', resolvedAt: now }
        : h,
    ),
    lastProcessedDay: Math.max(state.lastProcessedDay, day),
  };
}

export function resolveHookBySourceEvent(
  state: ButterflyHookState,
  sourceEventId: string,
  day: number,
): ButterflyHookState {
  const now = Date.now();
  return {
    ...state,
    hooks: state.hooks.map((h) =>
      h.sourceEventId === sourceEventId && h.status === 'active'
        ? { ...h, status: 'resolved', resolvedAt: now }
        : h,
    ),
    lastProcessedDay: Math.max(state.lastProcessedDay, day),
  };
}

function resolveFollowUpProfileId(
  hook: ButterflyHook,
  eventCategory?: string,
): string | undefined {
  if (hook.followUpProfileId) {
    return hook.followUpProfileId;
  }
  const byTag = BUTTERFLY_FOLLOW_UP_PROFILE_BY_TAG[hook.triggerTag];
  if (byTag) return byTag;
  if (hook.profileId) return hook.profileId;
  const cat = (hook.category ?? eventCategory) as EventContentCategory | undefined;
  const match = EVENT_CONTENT_PROFILES.find(
    (p) =>
      p.category === cat ||
      hook.preferredCategories?.includes(p.category),
  );
  return match?.id;
}

function buildFollowUpEventCard(
  hook: ButterflyHook,
  day: number,
  districtId: string,
): EventCard | null {
  const profileId = resolveFollowUpProfileId(hook);
  const profile = profileId ? getEventContentProfileById(profileId) : null;
  const eventId = `butterfly-hook-${hook.id}-d${day}`;
  const title = hook.title;
  const description = hook.description;
  const neighborhoodId = hook.neighborhoodId;
  const district =
    neighborhoodId === 'sanayi'
      ? 'Sanayi'
      : neighborhoodId === 'cumhuriyet'
        ? 'Cumhuriyet'
        : 'Merkez';

  const baseDecisions =
    profile?.decisionBlueprints?.slice(0, 4).map((bp, i) => ({
      id: `${eventId}-${bp.id}`,
      title: bp.title,
      description: bp.description,
      style: i === 0 ? ('bold' as const) : ('balanced' as const),
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 5,
      },
      contentStrategyLabel: bp.strategyLabel,
    })) ?? [
      {
        id: `${eventId}-review`,
        title: 'Takip müdahalesi planla',
        description: 'Önceki kararın yankısına kontrollü müdahale.',
        style: 'balanced' as const,
        effects: {
          publicSatisfaction: 1,
          budget: -500,
          morale: 0,
          risk: -1,
          xp: 4,
        },
      },
    ];

  return {
    id: eventId,
    title,
    description,
    category: profile?.category ?? hook.category ?? 'operasyon',
    riskLevel: hook.severity === 'high' ? 'high' : 'medium',
    district,
    neighborhoodId,
    contextTag: 'Karar yankısı',
    urgencyHours: 12,
    decisions: baseDecisions,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 5 },
    day,
    eventType: 'butterfly',
    theme: 'butterfly_effect',
    districtIds: [districtId],
    contentProfileId: profile?.id,
    contentCategory: profile?.category,
    contentFutureHookHint: hook.triggerTag,
    butterflyMeta: {
      hookId: hook.id,
      sourceEventId: hook.sourceEventId,
      sourceDecisionTitle: hook.sourceDecisionTitle,
      label: 'Karar Yankısı',
    },
  };
}

export type ApplyButterflyHookFollowUpResult = {
  dailyEventSet: DailyEventSet;
  hookState: ButterflyHookState;
  supplementalEvents: EventCard[];
  injected: boolean;
};

export function applyButterflyHookFollowUpToDailySet(params: {
  dailyEventSet: DailyEventSet;
  gameState: GameState;
  day: number;
  districtId: string;
  dailyPriorityKey?: DailyPriorityKey;
}): ApplyButterflyHookFollowUpResult {
  const { dailyEventSet, gameState, day, districtId, dailyPriorityKey } = params;

  if (day <= 1) {
    return {
      dailyEventSet,
      hookState: normalizeButterflyHookState(gameState.pilot.butterflyHookState),
      supplementalEvents: dailyEventSet.supplementalEvents ?? [],
      injected: false,
    };
  }

  let hookState = normalizeButterflyHookState(gameState.pilot.butterflyHookState);
  hookState = expireOldButterflyHooks(hookState, day);

  const rhythmPlan = getPilotRhythmPlan(day);
  const isButterflySeedDay = rhythmPlan?.role === 'butterfly_seed';

  const selected = selectButterflyHookForEventGeneration({
    day,
    hooks: hookState.hooks,
    existingEventIds: dailyEventSet.allEventIds,
    dailyPriorityKey,
    isButterflySeedDay,
  });

  if (!selected || selected.kind !== 'follow_up_event') {
    return {
      dailyEventSet,
      hookState,
      supplementalEvents: dailyEventSet.supplementalEvents ?? [],
      injected: false,
    };
  }

  const followUpCard = buildFollowUpEventCard(selected, day, districtId);
  if (!followUpCard) {
    return {
      dailyEventSet,
      hookState,
      supplementalEvents: dailyEventSet.supplementalEvents ?? [],
      injected: false,
    };
  }

  const alreadyInjected = dailyEventSet.allEventIds.some((id) =>
    id.startsWith(`butterfly-hook-${selected.id}`),
  );
  if (alreadyInjected) {
    return {
      dailyEventSet,
      hookState,
      supplementalEvents: dailyEventSet.supplementalEvents ?? [],
      injected: false,
    };
  }

  const supplemental = [
    ...(dailyEventSet.supplementalEvents ?? []),
    followUpCard,
  ];

  let sideEventIds = [...dailyEventSet.sideEventIds];
  if (sideEventIds.length >= 2) {
    sideEventIds = [followUpCard.id, ...sideEventIds.slice(0, -1)];
  } else if (sideEventIds.length === 1) {
    sideEventIds = [followUpCard.id, sideEventIds[0]!];
  } else {
    sideEventIds = [followUpCard.id];
  }

  const eventRoles = {
    ...dailyEventSet.eventRoles,
    [followUpCard.id]: 'side' as const,
  };
  const eventStatuses = {
    ...dailyEventSet.eventStatuses,
    [followUpCard.id]: 'pending' as const,
  };

  const allEventIds = [
    ...new Set([...dailyEventSet.allEventIds, followUpCard.id]),
  ];

  hookState = {
    ...hookState,
    lastProcessedDay: day,
  };

  return {
    dailyEventSet: {
      ...dailyEventSet,
      sideEventIds,
      supplementalEvents: supplemental,
      allEventIds,
      eventRoles,
      eventStatuses,
    },
    hookState,
    supplementalEvents: supplemental,
    injected: true,
  };
}

export function buildButterflyHookFromDecision(
  input: ButterflyHookDecisionInput,
): ButterflyHook | null {
  if (!shouldCreateButterflyHook(input)) {
    return null;
  }

  const kind = inferButterflyHookKind(input);
  let dueDay = inferButterflyHookDueDay(input, kind);
  const severity = inferButterflyHookSeverity(input, kind);
  const texts = buildButterflyHookTexts(input);
  const intent = inferDecisionIntent(input.decision);

  const profile = input.event.contentProfileId
    ? getEventContentProfileById(input.event.contentProfileId)
    : null;
  const futureHook = profile?.futureHook;
  const triggerTag =
    futureHook?.triggerTag ??
    input.event.contentFutureHookHint?.trim() ??
    buildTriggerTag(intent ?? 'monitor', input.event, input.decision);

  if (dueDay > BUTTERFLY_HOOK_MAX_PILOT_DAY) {
    if (kind === 'follow_up_event') {
      dueDay = BUTTERFLY_HOOK_MAX_PILOT_DAY;
    } else {
      return null;
    }
  }

  const expiresDay = dueDay + BUTTERFLY_HOOK_EXPIRE_AFTER_DUE_DAYS;
  const source: ButterflyHookSource = futureHook
    ? 'event_content'
    : input.dailyPriorityKey &&
        shouldCreatePriorityMismatchHook(input, intent)
      ? 'daily_priority'
      : 'decision';

  const followUpProfileId =
    BUTTERFLY_FOLLOW_UP_PROFILE_BY_TAG[triggerTag] ??
    input.event.contentProfileId;

  const hook: ButterflyHook = {
    id: `bhook-${input.day}-${input.event.id}-${triggerTag}`.slice(0, 64),
    source,
    kind:
      dueDay > BUTTERFLY_HOOK_MAX_PILOT_DAY && kind === 'follow_up_event'
        ? 'report_echo'
        : kind,
    status: 'active',
    createdDay: input.day,
    dueDay,
    expiresDay,
    sourceEventId: input.event.id,
    sourceEventTitle: input.event.title,
    sourceDecisionId: input.decision.id,
    sourceDecisionTitle: input.decision.title,
    neighborhoodId: input.neighborhoodId ?? input.event.neighborhoodId,
    category: input.event.contentCategory ?? input.event.category,
    profileId: input.event.contentProfileId,
    severity,
    title: texts.title,
    description: texts.description,
    triggerTag,
    followUpProfileId,
    preferredCategories: input.event.contentCategory
      ? [input.event.contentCategory]
      : undefined,
    preferredPriorityKeys: input.dailyPriorityKey
      ? [input.dailyPriorityKey]
      : profile?.preferredPriorityKeys,
    reportLine: texts.reportLine,
    resultHint: texts.resultHint,
    createdAt: Date.now(),
  };

  return hook;
}

export function appendButterflyHook(
  state: ButterflyHookState,
  hook: ButterflyHook,
): ButterflyHookState {
  return {
    hooks: dedupeButterflyHooks([...state.hooks, hook]),
    lastProcessedDay: Math.max(state.lastProcessedDay, hook.createdDay),
  };
}

export function tryRegisterButterflyHookAfterDecision(
  input: ButterflyHookDecisionInput,
): {
  state: ButterflyHookState;
  hook: ButterflyHook | null;
  hint: ButterflyHookDecisionHint | null;
} {
  const hook = buildButterflyHookFromDecision(input);
  if (!hook) {
    return { state: input.hookState, hook: null, hint: null };
  }
  const state = appendButterflyHook(input.hookState, hook);
  return {
    state,
    hook,
    hint: buildButterflyHintForDecisionResult(hook, input.day),
  };
}
