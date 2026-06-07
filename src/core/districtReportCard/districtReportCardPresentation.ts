import type { DistrictReportCardLiteModel, DistrictReportCardMapPresentation } from './districtReportCardTypes';
import { isDistrictReportCardDuplicate, shouldShowDistrictReportCardLite } from './districtReportCardModel';

export function buildDistrictReportCardMapPresentation(
  model: DistrictReportCardLiteModel | null | undefined,
  existingLines: string[] = [],
): DistrictReportCardMapPresentation | null {
  if (!shouldShowDistrictReportCardLite(model)) return null;

  const guard = [...existingLines];
  const title = `${model!.districtName} Karnesi`;

  let statusChipLabel = model!.trustLabel;
  if (statusChipLabel && isDistrictReportCardDuplicate(statusChipLabel, guard)) {
    statusChipLabel = undefined;
  } else if (statusChipLabel) {
    guard.push(statusChipLabel);
  }

  let primaryLine: string | undefined = model!.dominantIssueLine;
  if (primaryLine && isDistrictReportCardDuplicate(primaryLine, guard)) {
    primaryLine = model!.contentPackLine ?? model!.trustLine;
  }
  if (primaryLine && !isDistrictReportCardDuplicate(primaryLine, guard)) {
    guard.push(primaryLine);
  } else {
    primaryLine = undefined;
  }

  let recentEffectLine: string | undefined = model!.recentEffectLine;
  if (isDistrictReportCardDuplicate(recentEffectLine, guard)) {
    recentEffectLine = undefined;
  } else if (recentEffectLine) {
    guard.push(recentEffectLine);
  }

  let eceLine = model!.eceLine;
  if (isDistrictReportCardDuplicate(eceLine, guard) || eceLine === primaryLine) {
    eceLine = undefined;
  }

  const visibleLineCount = [statusChipLabel, primaryLine, recentEffectLine, eceLine].filter(Boolean).length;

  return {
    title,
    statusChipLabel,
    primaryLine,
    recentEffectLine,
    eceLine,
    visibleLineCount,
  };
}

export function buildDistrictReportCardSummaryForHub(
  model: DistrictReportCardLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!shouldShowDistrictReportCardLite(model)) return null;
  const line = model!.trustLine ?? model!.dominantIssueLine;
  if (!line || isDistrictReportCardDuplicate(line, existingLines)) return null;
  return line;
}

export function buildDistrictReportCardLineForReport(
  model: DistrictReportCardLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!shouldShowDistrictReportCardLite(model) || (model!.day ?? 1) <= 3) return null;
  const line = model!.recentEffectLine ?? model!.dominantIssueLine;
  if (!line || isDistrictReportCardDuplicate(line, existingLines)) return null;
  return line;
}

export function collectDistrictReportCardVisibleLines(
  model: DistrictReportCardLiteModel | null | undefined,
): string[] {
  if (!model) return [];
  return [
    model.trustLabel ?? '',
    model.trustLine ?? '',
    model.dominantIssueLine,
    model.recentEffectLine,
    model.eceLine ?? '',
    model.contentPackLine ?? '',
    model.tomorrowLine ?? '',
  ].filter(Boolean);
}
