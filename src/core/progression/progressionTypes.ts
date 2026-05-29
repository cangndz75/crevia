import type { AuthorityRankId } from '@/core/authority/authorityTypes';
import type { BadgeId } from '@/core/badges/badgeTypes';

export type ProgressionUnlockPreviewType =
  | 'neighborhood'
  | 'operation_scope'
  | 'system';

export type ProgressionUnlockPreviewStatus =
  | 'available_preview'
  | 'near'
  | 'locked_preview'
  | 'completed';

export type ProgressionUnlockPreview = {
  id: string;
  type: ProgressionUnlockPreviewType;
  title: string;
  subtitle: string;
  status: ProgressionUnlockPreviewStatus;
  requiredRankId?: AuthorityRankId;
  requiredTrust?: number;
  requiredBadgeId?: BadgeId;
  progressPercent: number;
  reasonLine: string;
};

export type ProgressionBridgeSummary = {
  visible: boolean;
  title: string;
  subtitle: string;
  primaryPreview?: ProgressionUnlockPreview;
  previewItems: ProgressionUnlockPreview[];
  nextActionLine: string;
};

export type BuildProgressionBridgeSummaryInput = {
  authorityState?: unknown;
  badgeState?: unknown;
  currentDay?: number;
  lastPilotScore?: unknown;
  selectedDistrictId?: string | null;
  selectedNeighborhoodId?: string | null;
};
