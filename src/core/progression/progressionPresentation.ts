import { AUTHORITY_RANK_BY_ID } from '@/core/authority/authorityConstants';

import {
  buildAllProgressionUnlockPreviews,
  buildProgressionNextActionLine,
  normalizeProgressionBridgeInput,
  selectPrimaryProgressionPreview,
} from './progressionBridge';
import type {
  BuildProgressionBridgeSummaryInput,
  ProgressionBridgeSummary,
  ProgressionUnlockPreview,
  ProgressionUnlockPreviewStatus,
} from './progressionTypes';

const STATUS_CHIP_LABELS: Record<ProgressionUnlockPreviewStatus, string> = {
  completed: 'Kapsam hazır',
  near: 'Yaklaşıyor',
  locked_preview: 'Önizleme',
  available_preview: 'Değerlendirmede',
};

const BANNED_PRESENTATION_WORDS = ['kilitli', 'premium', 'satın al', 'paywall'];

export function buildProgressionPreviewStatusLabel(
  status: ProgressionUnlockPreviewStatus,
): string {
  return STATUS_CHIP_LABELS[status] ?? 'Önizleme';
}

export function buildProgressionBridgeSummary(
  input: BuildProgressionBridgeSummaryInput = {},
): ProgressionBridgeSummary {
  const { authorityState } = normalizeProgressionBridgeInput(input);
  const previewItems = buildAllProgressionUnlockPreviews(authorityState);
  const primaryPreview = selectPrimaryProgressionPreview(previewItems);

  return {
    visible: previewItems.length > 0,
    title: 'Sıradaki Kapsam',
    subtitle: 'Yetki ve pilot performansın gelecek operasyon alanlarını şekillendirir.',
    primaryPreview,
    previewItems,
    nextActionLine: buildProgressionNextActionLine(primaryPreview, authorityState),
  };
}

export type ProgressionBridgePilotReportLines = {
  scopeLine: string;
  trustLine: string;
};

export function buildProgressionBridgePilotReportLines(
  input: BuildProgressionBridgeSummaryInput = {},
): ProgressionBridgePilotReportLines | null {
  const summary = buildProgressionBridgeSummary(input);
  if (!summary.visible || !summary.primaryPreview) {
    return null;
  }

  const primary = summary.primaryPreview;
  const scopeTitle = primary.title.replace(/ Önizlemesi$/, ' önizlemesi');

  return {
    scopeLine: `Sıradaki kapsam: ${scopeTitle}`,
    trustLine: summary.nextActionLine,
  };
}

export function buildProgressionPreviewRankLabel(
  preview: ProgressionUnlockPreview,
): string {
  if (!preview.requiredRankId) {
    return 'Sonraki yetki';
  }
  return AUTHORITY_RANK_BY_ID[preview.requiredRankId]?.label ?? 'Sonraki yetki';
}

export function collectProgressionPresentationStrings(
  summary: ProgressionBridgeSummary,
): string[] {
  const strings = [
    summary.title,
    summary.subtitle,
    summary.nextActionLine,
    summary.primaryPreview?.title ?? '',
    summary.primaryPreview?.subtitle ?? '',
    summary.primaryPreview?.reasonLine ?? '',
    ...summary.previewItems.flatMap((item) => [
      item.title,
      item.subtitle,
      item.reasonLine,
      buildProgressionPreviewStatusLabel(item.status),
    ]),
  ];
  return strings.filter(Boolean);
}

export function progressionPresentationContainsBannedWords(
  summary: ProgressionBridgeSummary,
): boolean {
  const haystack = collectProgressionPresentationStrings(summary).join(' ').toLowerCase();
  return BANNED_PRESENTATION_WORDS.some((word) => haystack.includes(word));
}
