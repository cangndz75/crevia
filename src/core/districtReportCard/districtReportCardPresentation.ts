import { softenRepeatedWatchNoteCopy } from '@/core/releaseCandidatePolish/polishCopyPresentation';

import type {
  DistrictReportCardFullModel,
  DistrictReportCardLiteModel,
  DistrictReportCardMapPresentation,
} from './districtReportCardTypes';
import {
  isDistrictReportCardDuplicate,
  shouldShowDistrictReportCardFull,
  shouldShowDistrictReportCardLite,
} from './districtReportCardModel';

type ReportCardModel = DistrictReportCardFullModel | DistrictReportCardLiteModel;

function isFullModel(model: ReportCardModel): model is DistrictReportCardFullModel {
  return 'recentArchiveEvents' in model;
}

function resolveModel(model: ReportCardModel | null | undefined): DistrictReportCardFullModel | null {
  if (!model) return null;
  if (isFullModel(model)) return model;
  if (!shouldShowDistrictReportCardLite(model)) return null;
  return {
    ...model,
    visibility:
      model.visibility === 'detailed_preview' ? 'full_preview' : model.visibility,
    trustTrend: 'unknown',
    recentArchiveEvents: [],
    publicTone: 'unknown',
    publicToneLine: model.dominantIssueLine,
    playerStyleInDistrict: 'unknown',
    recoveryState: 'unknown',
    resourcePressureState: 'unknown',
    detailLines: [model.dominantIssueLine, model.recentEffectLine].filter(Boolean),
    sourceSignals: {
      ...model.sourceSignals,
      hasCityArchive: false,
      hasArchiveDistrictSummary: false,
      hasArchiveRewardComeback: false,
      hasArchiveEceSummary: false,
    },
    maxVisibleRecentEvents: 0,
    eceDistrictLine: model.eceLine,
  };
}

export function buildDistrictReportCardMapPresentation(
  model: ReportCardModel | null | undefined,
  existingLines: string[] = [],
): DistrictReportCardMapPresentation | null {
  const full = resolveModel(model);
  if (!full || !shouldShowDistrictReportCardFull(full)) return null;

  const guard = [...existingLines];
  const title = `${full.districtName} Karnesi`;

  let statusChipLabel = full.trustLabel;
  if (statusChipLabel && isDistrictReportCardDuplicate(statusChipLabel, guard)) {
    statusChipLabel = undefined;
  } else if (statusChipLabel) {
    guard.push(statusChipLabel);
  }

  let primaryLine: string | undefined = full.dominantIssueLine;
  if (primaryLine && isDistrictReportCardDuplicate(primaryLine, guard)) {
    primaryLine = full.mapLine ?? full.trustLine;
  }
  if (primaryLine && !isDistrictReportCardDuplicate(primaryLine, guard)) {
    guard.push(primaryLine);
  } else {
    primaryLine = undefined;
  }

  let publicToneLine: string | undefined =
    full.day >= 2 ? full.publicToneLine : undefined;
  if (isDistrictReportCardDuplicate(publicToneLine, guard) || publicToneLine === primaryLine) {
    publicToneLine = undefined;
  } else if (publicToneLine) {
    guard.push(publicToneLine);
  }

  let recoveryLine = full.recoveryLine;
  if (isDistrictReportCardDuplicate(recoveryLine, guard) || recoveryLine === primaryLine) {
    recoveryLine = undefined;
  } else if (recoveryLine) {
    guard.push(recoveryLine);
  }

  let recentEffectLine: string | undefined = full.recentEffectLine;
  if (isDistrictReportCardDuplicate(recentEffectLine, guard) || recentEffectLine === primaryLine) {
    recentEffectLine = undefined;
  } else if (recentEffectLine) {
    guard.push(recentEffectLine);
  }

  const recentEvents = full.recentArchiveEvents
    .filter((event) => !isDistrictReportCardDuplicate(event.shortLine, guard))
    .slice(0, full.maxVisibleRecentEvents);

  for (const event of recentEvents) {
    guard.push(event.shortLine);
  }

  let eceLine = full.eceDistrictLine ?? (isFullModel(model!) ? undefined : model?.eceLine);
  if (isDistrictReportCardDuplicate(eceLine, guard) || eceLine === primaryLine) {
    eceLine = undefined;
  }

  const visibleLineCount = [
    statusChipLabel,
    primaryLine,
    publicToneLine,
    recoveryLine,
    recentEffectLine,
    ...recentEvents.map((e) => e.shortLine),
    eceLine,
  ].filter(Boolean).length;

  return {
    title,
    statusChipLabel,
    primaryLine,
    recentEffectLine,
    publicToneLine,
    recoveryLine,
    recentEvents: recentEvents.length > 0 ? recentEvents : undefined,
    eceLine,
    visibleLineCount,
  };
}

export function buildDistrictReportCardSummaryForHub(
  model: ReportCardModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  const full = resolveModel(model);
  if (!full || !shouldShowDistrictReportCardFull(full)) return null;

  const candidates = [
    full.hubLine,
    full.playerStyleLine,
    full.publicToneLine,
    full.trustLine,
    full.dominantIssueLine,
  ].filter(Boolean) as string[];

  for (const line of candidates) {
    if (!isDistrictReportCardDuplicate(line, existingLines)) {
      return softenRepeatedWatchNoteCopy(line, full.day ?? 1);
    }
  }
  return null;
}

export function buildDistrictReportCardLineForReport(
  model: ReportCardModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  const full = resolveModel(model);
  if (!full || !shouldShowDistrictReportCardFull(full) || (full.day ?? 1) <= 3) return null;

  const line =
    full.reportLine ??
    full.recoveryLine ??
    full.recentEffectLine ??
    full.dominantIssueLine;
  if (!line || isDistrictReportCardDuplicate(line, existingLines)) return null;
  return softenRepeatedWatchNoteCopy(line, full.day ?? 1);
}

export function collectDistrictReportCardVisibleLines(
  model: ReportCardModel | null | undefined,
): string[] {
  const full = resolveModel(model);
  if (!full) return [];
  const raw = [
    full.trustLabel ?? '',
    full.trustLine ?? '',
    full.dominantIssueLine,
    full.publicToneLine,
    full.playerStyleLine ?? '',
    full.recoveryLine ?? '',
    full.recentEffectLine,
    full.eceDistrictLine ?? '',
    ...full.recentArchiveEvents.map((e) => e.shortLine),
    full.socialToneLine ?? '',
  ].filter(Boolean);
  const unique: string[] = [];
  for (const line of raw) {
    if (!isDistrictReportCardDuplicate(line, unique)) {
      unique.push(line);
    }
  }
  return unique;
}
