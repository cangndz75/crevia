import type { GameState } from '@/core/models/GameState';

import {
  ACCESS_LABELS,
  MAIN_OPERATION_PACK,
  MONETIZATION_COPY,
  POST_PILOT_OFFER_ROUTE,
} from './monetizationConstants';
import {
  deriveMonetizationStateFromGameState,
  getPostPilotAccessMode,
  isFullMainOperationAccess,
  shouldRouteToPostPilotOffer,
} from './monetizationEngine';
import { getMainOperationAccess } from './monetizationState';
import type {
  FullAccessUnlockedModel,
  LimitedContinueWarningModel,
  MainOperationAccess,
  MainOperationPack,
  MonetizationState,
  PostPilotAccessBadgeModel,
  PostPilotOfferViewModel,
  ReportPilotCompletionCtaModel,
} from './monetizationTypes';

const FEATURE_ICON_KEYS = [
  'map-outline',
  'calendar-outline',
  'warning-outline',
  'flag-outline',
  'bar-chart-outline',
  'ribbon-outline',
] as const;

const FEATURE_TONES = ['teal', 'mint', 'gold', 'neutral', 'teal', 'mint'] as const;

export function getMainOperationAccessLabel(access: MainOperationAccess): string {
  return ACCESS_LABELS[access];
}

export function getMainOperationOfferSubtitle(gameState: GameState): string {
  const mode = getPostPilotAccessMode(
    gameState,
    deriveMonetizationStateFromGameState(gameState),
  );
  if (mode === 'full') {
    return MONETIZATION_COPY.accessFull;
  }
  if (mode === 'limited') {
    return MONETIZATION_COPY.accessLimited;
  }
  return MONETIZATION_COPY.offerSubtitle;
}

export function buildMainOperationPackModel(_gameState: GameState): MainOperationPack {
  return {
    productId: MAIN_OPERATION_PACK.productId,
    title: MAIN_OPERATION_PACK.title,
    subtitle: MAIN_OPERATION_PACK.subtitle,
    description: MAIN_OPERATION_PACK.description,
    includedFeatures: MAIN_OPERATION_PACK.includedFeatures.map((f) => ({
      ...f,
    })),
  };
}

export function buildPostPilotOfferViewModel(
  gameState: GameState,
  monetization?: MonetizationState,
  options?: { isDev?: boolean },
): PostPilotOfferViewModel {
  const state = deriveMonetizationStateFromGameState(
    gameState,
    monetization,
  );
  const access = getMainOperationAccess(state);
  const isFull = access === 'full';
  const isLimited = access === 'limited';
  const pack = buildMainOperationPackModel(gameState);

  return {
    title: MONETIZATION_COPY.offerTitle,
    subtitle: MONETIZATION_COPY.offerSubtitle,
    heroLine: MONETIZATION_COPY.heroLine,
    pilotSummaryLine: MONETIZATION_COPY.pilotSummaryLine,
    featureRows: pack.includedFeatures.map((f, index) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      iconKey: FEATURE_ICON_KEYS[index % FEATURE_ICON_KEYS.length],
      tone: FEATURE_TONES[index % FEATURE_TONES.length],
    })),
    primaryCtaLabel: MONETIZATION_COPY.primaryCta,
    secondaryCtaLabel: MONETIZATION_COPY.secondaryCta,
    restoreLabel: MONETIZATION_COPY.restoreCta,
    footerNote: MONETIZATION_COPY.playerFooter,
    accessLabel: getMainOperationAccessLabel(access),
    showDevNote: options?.isDev === true,
    devNote: options?.isDev ? MONETIZATION_COPY.devFooterNote : undefined,
    isFullAccess: isFull,
    isLimitedAccess: isLimited,
    canChooseLimited: !isFull,
    canPurchase: !isFull,
  };
}

export function buildPostPilotAccessBadgeModel(
  gameState: GameState,
  monetization?: MonetizationState,
): PostPilotAccessBadgeModel {
  const access = getMainOperationAccess(
    deriveMonetizationStateFromGameState(gameState, monetization),
  );
  const tone =
    access === 'full'
      ? 'gold'
      : access === 'limited'
        ? 'warning'
        : access === 'offer_available'
          ? 'teal'
          : 'neutral';
  return {
    label: getMainOperationAccessLabel(access),
    tone,
  };
}

export function buildLimitedContinueWarningModel(): LimitedContinueWarningModel {
  return {
    title: MONETIZATION_COPY.limitedWarningTitle,
    lines: [MONETIZATION_COPY.limitedWarningLine],
  };
}

export function buildFullAccessUnlockedModel(): FullAccessUnlockedModel {
  return {
    title: MONETIZATION_COPY.fullUnlockedTitle,
    lines: [MONETIZATION_COPY.fullUnlockedLine],
  };
}

export function buildReportPilotCompletionCtaModel(input: {
  gameState: GameState;
  monetization: MonetizationState;
}): ReportPilotCompletionCtaModel {
  const { gameState, monetization } = input;
  const access = getMainOperationAccess(
    deriveMonetizationStateFromGameState(gameState, monetization),
  );

  if (access === 'full' || isFullMainOperationAccess(gameState, monetization)) {
    return {
      title: MONETIZATION_COPY.reportCtaFull,
      route: '/',
    };
  }

  if (access === 'limited') {
    return {
      title: MONETIZATION_COPY.reportCtaLimited,
      route: '/',
    };
  }

  if (shouldRouteToPostPilotOffer(gameState, monetization)) {
    return {
      title: MONETIZATION_COPY.reportCtaOffer,
      route: POST_PILOT_OFFER_ROUTE,
    };
  }

  return {
    title: MONETIZATION_COPY.reportCtaPreview,
    route: '/events/main-operation-preview',
  };
}

export function buildMainOperationPreviewPrimaryCta(input: {
  gameState: GameState;
  monetization: MonetizationState;
}): ReportPilotCompletionCtaModel {
  return buildReportPilotCompletionCtaModel(input);
}

export function collectMonetizationPresentationStrings(
  model: PostPilotOfferViewModel,
): string {
  return [
    model.title,
    model.subtitle,
    model.heroLine,
    model.pilotSummaryLine,
    model.footerNote,
    model.primaryCtaLabel,
    model.secondaryCtaLabel,
    ...model.featureRows.map((r) => `${r.title} ${r.description}`),
  ].join(' ');
}
