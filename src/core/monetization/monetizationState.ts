import type { GameState } from '@/core/models/GameState';

import { MAIN_OPERATION_PRODUCT_ID } from './monetizationConstants';
import type {
  MainOperationAccess,
  MonetizationOfferStatus,
  MonetizationState,
  OwnedPack,
} from './monetizationTypes';

const PRODUCT_IDS = [MAIN_OPERATION_PRODUCT_ID] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isAccess(v: unknown): v is MainOperationAccess {
  return (
    v === 'none' ||
    v === 'offer_available' ||
    v === 'limited' ||
    v === 'full'
  );
}

function isOfferStatus(v: unknown): v is MonetizationOfferStatus {
  return (
    v === 'not_available' ||
    v === 'available' ||
    v === 'seen' ||
    v === 'limited_selected' ||
    v === 'mock_purchased'
  );
}

function normalizeOwnedPacks(input: unknown): OwnedPack[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: OwnedPack[] = [];
  for (const item of input) {
    if (!isRecord(item)) continue;
    if (item.productId !== MAIN_OPERATION_PRODUCT_ID) continue;
    if (typeof item.unlockedAtDay !== 'number') continue;
    const source = item.source;
    if (
      source !== 'mock_purchase' &&
      source !== 'restore_placeholder' &&
      source !== 'dev_unlock'
    ) {
      continue;
    }
    if (seen.has(MAIN_OPERATION_PRODUCT_ID)) continue;
    seen.add(MAIN_OPERATION_PRODUCT_ID);
    out.push({
      productId: MAIN_OPERATION_PRODUCT_ID,
      unlockedAtDay: Math.floor(item.unlockedAtDay),
      source,
    });
  }
  return out;
}

export function createInitialMonetizationState(): MonetizationState {
  return {
    mainOperationAccess: 'none',
    offerStatus: 'not_available',
    hasSeenMainOperationOffer: false,
    ownedPacks: [],
  };
}

export function normalizeMonetizationState(input: unknown): MonetizationState {
  if (!isRecord(input)) {
    return createInitialMonetizationState();
  }

  const ownedPacks = normalizeOwnedPacks(input.ownedPacks);
  let mainOperationAccess = isAccess(input.mainOperationAccess)
    ? input.mainOperationAccess
    : 'none';
  let offerStatus = isOfferStatus(input.offerStatus)
    ? input.offerStatus
    : 'not_available';

  if (ownedPacks.length > 0) {
    mainOperationAccess = 'full';
    offerStatus = 'mock_purchased';
  }

  if (mainOperationAccess === 'full' && offerStatus !== 'mock_purchased') {
    offerStatus = 'mock_purchased';
  }

  if (mainOperationAccess === 'limited') {
    offerStatus = 'limited_selected';
  }

  return {
    mainOperationAccess,
    offerStatus,
    hasSeenMainOperationOffer:
      typeof input.hasSeenMainOperationOffer === 'boolean'
        ? input.hasSeenMainOperationOffer
        : false,
    ownedPacks,
    lastOfferShownDay:
      typeof input.lastOfferShownDay === 'number'
        ? Math.floor(input.lastOfferShownDay)
        : undefined,
    selectedLimitedContinueDay:
      typeof input.selectedLimitedContinueDay === 'number'
        ? Math.floor(input.selectedLimitedContinueDay)
        : undefined,
    mockPurchaseCompletedDay:
      typeof input.mockPurchaseCompletedDay === 'number'
        ? Math.floor(input.mockPurchaseCompletedDay)
        : undefined,
    restoreCheckedAtDay:
      typeof input.restoreCheckedAtDay === 'number'
        ? Math.floor(input.restoreCheckedAtDay)
        : undefined,
  };
}

export function isMainOperationPackOwned(state: MonetizationState): boolean {
  return state.ownedPacks.some((p) => p.productId === MAIN_OPERATION_PRODUCT_ID);
}

export function getMainOperationAccess(state: MonetizationState): MainOperationAccess {
  if (isMainOperationPackOwned(state)) {
    return 'full';
  }
  return state.mainOperationAccess;
}

export function isMainOperationOfferAvailable(gameState: GameState): boolean {
  return (
    gameState.pilot.status === 'completed' &&
    gameState.pilot.currentPilotDay >= 7
  );
}

export function canShowPostPilotOffer(
  gameState: GameState,
  state: MonetizationState,
): boolean {
  if (!isMainOperationOfferAvailable(gameState)) {
    return false;
  }
  const access = getMainOperationAccess(state);
  return access === 'offer_available' || access === 'limited';
}

export function markMainOperationOfferSeen(
  state: MonetizationState,
  day: number,
): MonetizationState {
  if (state.hasSeenMainOperationOffer && state.offerStatus === 'seen') {
    return state;
  }
  return {
    ...state,
    hasSeenMainOperationOffer: true,
    offerStatus:
      state.offerStatus === 'mock_purchased' ||
      state.offerStatus === 'limited_selected'
        ? state.offerStatus
        : 'seen',
    mainOperationAccess:
      getMainOperationAccess(state) === 'full'
        ? 'full'
        : getMainOperationAccess(state) === 'limited'
          ? 'limited'
          : 'offer_available',
    lastOfferShownDay: day,
  };
}

export function selectLimitedContinue(
  state: MonetizationState,
  day: number,
): MonetizationState {
  if (getMainOperationAccess(state) === 'full') {
    return state;
  }
  if (
    state.mainOperationAccess === 'limited' &&
    state.offerStatus === 'limited_selected' &&
    state.selectedLimitedContinueDay === day
  ) {
    return state;
  }
  return {
    ...state,
    mainOperationAccess: 'limited',
    offerStatus: 'limited_selected',
    selectedLimitedContinueDay: day,
    ownedPacks: [],
  };
}

export function mockPurchaseMainOperationPack(
  state: MonetizationState,
  day: number,
): MonetizationState {
  if (isMainOperationPackOwned(state) && state.mockPurchaseCompletedDay === day) {
    return state;
  }
  const alreadyOwned = isMainOperationPackOwned(state);
  return {
    ...state,
    mainOperationAccess: 'full',
    offerStatus: 'mock_purchased',
    mockPurchaseCompletedDay: day,
    ownedPacks: alreadyOwned
      ? state.ownedPacks
      : [
          {
            productId: MAIN_OPERATION_PRODUCT_ID,
            unlockedAtDay: day,
            source: 'mock_purchase',
          },
        ],
  };
}

export function devUnlockMainOperationPack(
  state: MonetizationState,
  day: number,
): MonetizationState {
  if (
    isMainOperationPackOwned(state) &&
    state.ownedPacks[0]?.source === 'dev_unlock'
  ) {
    return state;
  }
  return {
    ...state,
    mainOperationAccess: 'full',
    offerStatus: 'mock_purchased',
    mockPurchaseCompletedDay: day,
    ownedPacks: [
      {
        productId: MAIN_OPERATION_PRODUCT_ID,
        unlockedAtDay: day,
        source: 'dev_unlock',
      },
    ],
  };
}

export function restoreMainOperationPlaceholder(
  state: MonetizationState,
  day: number,
): MonetizationState {
  return {
    ...state,
    restoreCheckedAtDay: day,
  };
}

export function syncMonetizationAfterPilotComplete(
  state: MonetizationState,
  day: number,
): MonetizationState {
  if (getMainOperationAccess(state) === 'full') {
    return state;
  }
  if (state.mainOperationAccess === 'limited') {
    return state;
  }
  return {
    ...state,
    mainOperationAccess: 'offer_available',
    offerStatus: state.offerStatus === 'seen' ? 'seen' : 'available',
  };
}

export function syncMonetizationForActivePilot(
  state: MonetizationState,
): MonetizationState {
  if (getMainOperationAccess(state) === 'full') {
    return state;
  }
  if (state.mainOperationAccess === 'limited') {
    return state;
  }
  return {
    ...state,
    mainOperationAccess: 'none',
    offerStatus: 'not_available',
  };
}
