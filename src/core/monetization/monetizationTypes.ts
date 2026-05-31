export type MainOperationAccess =
  | 'none'
  | 'offer_available'
  | 'limited'
  | 'full';

export type MonetizationOfferStatus =
  | 'not_available'
  | 'available'
  | 'seen'
  | 'limited_selected'
  | 'mock_purchased';

export type MonetizationProductId = 'main_operation_season_1';

export type OwnedPack = {
  productId: MonetizationProductId;
  unlockedAtDay: number;
  source: 'mock_purchase' | 'restore_placeholder' | 'dev_unlock';
};

export type MonetizationState = {
  mainOperationAccess: MainOperationAccess;
  offerStatus: MonetizationOfferStatus;
  hasSeenMainOperationOffer: boolean;
  ownedPacks: OwnedPack[];
  lastOfferShownDay?: number;
  selectedLimitedContinueDay?: number;
  mockPurchaseCompletedDay?: number;
  restoreCheckedAtDay?: number;
};

export type MainOperationPackFeatureStatus =
  | 'available_now'
  | 'full_access'
  | 'coming_later';

export type MainOperationPack = {
  productId: MonetizationProductId;
  title: string;
  subtitle: string;
  description: string;
  includedFeatures: Array<{
    id: string;
    title: string;
    description: string;
    status: MainOperationPackFeatureStatus;
  }>;
};

export type PostPilotOfferViewModel = {
  title: string;
  subtitle: string;
  heroLine: string;
  pilotSummaryLine: string;
  featureRows: Array<{
    id: string;
    title: string;
    description: string;
    iconKey: string;
    tone: 'teal' | 'mint' | 'gold' | 'neutral';
  }>;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  restoreLabel: string;
  footerNote: string;
  accessLabel: string;
  showDevNote: boolean;
  devNote?: string;
  isFullAccess: boolean;
  isLimitedAccess: boolean;
  canChooseLimited: boolean;
  canPurchase: boolean;
};

export type PostPilotAccessBadgeModel = {
  label: string;
  tone: 'teal' | 'mint' | 'gold' | 'neutral' | 'warning';
};

export type LimitedContinueWarningModel = {
  title: string;
  lines: string[];
};

export type FullAccessUnlockedModel = {
  title: string;
  lines: string[];
};

export type ReportPilotCompletionCtaModel = {
  title: string;
  route: string;
};

export type MonetizationEngineResult = {
  monetization: MonetizationState;
  gameStatePatch?: import('@/core/models/GameState').GameState;
};
