import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';

import {
  MAX_POST_PILOT_ACTIVE_EVENTS,
  POST_PILOT_EVENT_FORBIDDEN_WORDS,
  POST_PILOT_FIRST_OPERATION_DAY,
} from './postPilotEventConstants';
import { isPostPilotLightEventLoopEligible } from './postPilotEventEngine';
import {
  buildPostPilotPreviewCtaLabel,
  buildPostPilotScopeStatusLabel,
} from './postPilotOperationPresentation';
import { derivePostPilotScopeStatuses } from './postPilotOperationEngine';
import { normalizePostPilotOperationState } from './postPilotOperationSeed';
import type {
  PostPilotNormalizeContext,
  PostPilotOperationState,
  PostPilotPhase,
} from './postPilotOperationTypes';

export const POST_PILOT_GENERATED_EVENT_ID_PREFIX = 'pp_d';
export const POST_PILOT_EVENT_CONTEXT_TAG = 'Hafif operasyon gündemi';

export const POST_PILOT_UX_FORBIDDEN_WORDS = [
  ...POST_PILOT_EVENT_FORBIDDEN_WORDS,
  'tam ana operasyon açıldı',
  'full mode',
  'rank up',
] as const;

export type PostPilotAgendaBannerChip = {
  id: string;
  label: string;
  tone: 'neutral' | 'primary' | 'accent';
};

export type PostPilotAgendaBannerCta = {
  label: string;
  /** Mevcut expo-router path — yeni route yok. */
  href: string;
  accessibilityLabel: string;
};

export type PostPilotAgendaBannerModel = {
  title: string;
  subtitle: string;
  chips: PostPilotAgendaBannerChip[];
  primaryCta: PostPilotAgendaBannerCta | null;
  secondaryCta: PostPilotAgendaBannerCta;
  activeEventCount: number;
  operationDay: number;
  showMapLink: boolean;
};

export type PostPilotReportCopy = {
  statusTitle: string;
  heroSubtitle: string;
  heroTitle: string;
  impactLabel: string;
};

export type BuildPostPilotAgendaBannerInput = {
  gameState: GameState;
  postPilotOperation?: PostPilotOperationState | unknown;
  activeEvents: EventCard[];
  featuredEventId?: string;
};

function resolveOperationDay(
  postPilot: PostPilotOperationState,
  cityDay: number,
): number {
  if (
    typeof postPilot.operationDay === 'number' &&
    Number.isFinite(postPilot.operationDay)
  ) {
    return Math.max(POST_PILOT_FIRST_OPERATION_DAY, Math.round(postPilot.operationDay));
  }
  if (cityDay >= POST_PILOT_FIRST_OPERATION_DAY) {
    return cityDay;
  }
  return POST_PILOT_FIRST_OPERATION_DAY;
}

function resolveScopeRegionLabel(
  postPilot: PostPilotOperationState,
  context: PostPilotNormalizeContext,
  authorityState: unknown,
  selectedDistrictId: GameState['pilot']['selectedDistrictId'],
): string {
  const scopes = derivePostPilotScopeStatuses({
    postPilotOperation: postPilot,
    pilotStatus: context.pilotStatus,
    authorityState,
  });

  if (scopes.istasyon === 'active' || scopes.istasyon === 'agenda') {
    const status = buildPostPilotScopeStatusLabel(scopes.istasyon);
    return `İstasyon · ${status}`;
  }

  const mapId = mapDistrictFromPilot(selectedDistrictId);
  return getMapDistrictLabel(mapId);
}

export function isPostPilotGeneratedEvent(event: EventCard): boolean {
  return event.id.startsWith(POST_PILOT_GENERATED_EVENT_ID_PREFIX);
}

export function buildPostPilotEventContextLabel(
  event: EventCard,
  phase?: PostPilotPhase,
): string | null {
  if (phase !== 'main_operation_light' && phase !== 'main_operation_full') {
    return null;
  }
  if (!isPostPilotGeneratedEvent(event)) {
    return null;
  }
  if (event.id.includes('_anchor_')) {
    return POST_PILOT_EVENT_CONTEXT_TAG;
  }
  return 'Pilot sonrası saha hazırlığı';
}

export function buildPostPilotEventContextLabelForGameState(
  event: EventCard,
  gameState: GameState,
): string | null {
  if (!isPostPilotLightEventLoopEligible(gameState)) {
    return null;
  }
  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );
  return buildPostPilotEventContextLabel(event, postPilot.phase);
}

export function buildPostPilotAgendaBannerModel(
  input: BuildPostPilotAgendaBannerInput,
): PostPilotAgendaBannerModel {
  const { gameState, activeEvents, featuredEventId } = input;
  const context: PostPilotNormalizeContext = {
    pilotStatus: gameState.pilot.status,
    currentPilotDay: gameState.pilot.currentPilotDay,
  };
  const postPilot = normalizePostPilotOperationState(
    input.postPilotOperation ?? gameState.pilot.postPilotOperation,
    context,
  );
  const operationDay = resolveOperationDay(postPilot, gameState.city.day);
  const activeCount = activeEvents.length;
  const scopeRegion = resolveScopeRegionLabel(
    postPilot,
    context,
    gameState.pilot.authorityState,
    gameState.pilot.selectedDistrictId,
  );

  const eventCountChip =
    activeCount > 0
      ? `${activeCount} gündem olayı`
      : `${MAX_POST_PILOT_ACTIVE_EVENTS} gündem kotası`;

  const chips: PostPilotAgendaBannerChip[] = [
    { id: 'day', label: `Gün ${operationDay}`, tone: 'primary' },
    { id: 'mode', label: 'Hafif operasyon', tone: 'neutral' },
    { id: 'events', label: eventCountChip, tone: 'accent' },
    { id: 'scope', label: scopeRegion, tone: 'neutral' },
  ];

  const subtitle =
    activeCount > 0
      ? 'İstasyon kapsamı gündemde. Hafif operasyon yüküyle saha hazırlığı başladı.'
      : 'Operasyon hazırlığı başladı. Kademeli operasyon gündemi kısa süre içinde hazırlanır.';

  const targetEventId =
    (featuredEventId && activeEvents.some((e) => e.id === featuredEventId)
      ? featuredEventId
      : activeEvents[0]?.id) ?? null;

  const primaryCta: PostPilotAgendaBannerCta | null =
    targetEventId != null
      ? {
          label: 'Gündemi İncele',
          href: `/events/${targetEventId}`,
          accessibilityLabel: 'Gündemi incele',
        }
      : null;

  const secondaryCta: PostPilotAgendaBannerCta = {
    label: 'Haritayı İncele',
    href: '/risks',
    accessibilityLabel: 'Haritayı incele',
  };

  return {
    title: 'Bugünkü Operasyon Gündemi',
    subtitle,
    chips,
    primaryCta,
    secondaryCta,
    activeEventCount: activeCount,
    operationDay,
    showMapLink: true,
  };
}

export function buildPostPilotMapContextLine(
  activeEvents: EventCard[],
  phase?: PostPilotPhase,
): string | null {
  if (
    (phase !== 'main_operation_light' && phase !== 'main_operation_full') ||
    activeEvents.length === 0
  ) {
    return null;
  }
  return 'Gündem olayı — Bugünkü operasyon odağı';
}

export function buildPostPilotMapContextLineForGameState(
  gameState: GameState,
  activeEvents: EventCard[],
): string | null {
  if (!isPostPilotLightEventLoopEligible(gameState)) {
    return null;
  }
  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );
  return buildPostPilotMapContextLine(activeEvents, postPilot.phase);
}

export function buildPostPilotReportCopy(day: number): PostPilotReportCopy {
  return {
    statusTitle: 'Post-pilot operasyon günü',
    heroSubtitle: 'Gündem etkisi bugünkü kararlarla şekillendi.',
    heroTitle: 'Gün Sonu Değerlendirmesi',
    impactLabel: 'Gündem etkisi',
  };
}

export function buildPostPilotPreviewScreenCopyLines(): string[] {
  return [
    'Pilot tamamlandı. Şehir ölçeğinde hafif operasyon gündemi başlıyor.',
    'İstasyon kapsamı gündemde; kademeli operasyon yüküyle saha hazırlığı sürer.',
    'Operasyon Gündemini Başlat sonrası Merkez’de bugünkü gündemi takip edebilirsin.',
  ];
}

export function buildPostPilotPreviewFooterNote(): string {
  return 'Hafif operasyon gündemi başlar; tam ana operasyon değil, kademeli hazırlık sürer.';
}

export function postPilotUxContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of POST_PILOT_UX_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectPostPilotUxPresentationStrings(
  banner: PostPilotAgendaBannerModel,
  extra: string[] = [],
): string[] {
  return [
    banner.title,
    banner.subtitle,
    ...banner.chips.map((c) => c.label),
    banner.primaryCta?.label ?? '',
    banner.secondaryCta.label,
    buildPostPilotPreviewCtaLabel('completed'),
    ...buildPostPilotPreviewScreenCopyLines(),
    buildPostPilotPreviewFooterNote(),
    ...buildPostPilotReportCopy(POST_PILOT_FIRST_OPERATION_DAY).statusTitle,
    ...Object.values(buildPostPilotReportCopy(POST_PILOT_FIRST_OPERATION_DAY)),
    ...extra,
  ].filter(Boolean);
}

/** Event kartlarında overflow guard gerektiren alanlar. */
export const POST_PILOT_EVENT_CARD_LAYOUT_GUARDS = {
  titleNumberOfLines: 2,
  subtitleNumberOfLines: 1,
  contextLabelNumberOfLines: 1,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;
