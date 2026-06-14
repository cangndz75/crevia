import {
  DOMINANT_AXIS_LABELS,
  INTENSITY_LABELS,
  RESOURCE_PRESSURE_DIFFERENTIATION_ACCESSIBILITY_MAX,
  RESOURCE_PRESSURE_DIFFERENTIATION_BADGE_MAX,
  RESOURCE_PRESSURE_DIFFERENTIATION_MAX_CARDS,
  RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX,
  TECHNICAL_ENUM_PATTERN,
} from './resourcePressureDifferentiationConstants';
import type {
  ResourcePressureCostHintCard,
  ResourcePressureDifferentiationProfile,
  ResourcePressureDifferentiationResult,
} from './resourcePressureDifferentiationTypes';

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function badgeForProfile(profile: ResourcePressureDifferentiationProfile): string {
  const axis = DOMINANT_AXIS_LABELS[profile.dominantAxis];
  const label = `${axis} odaklı`;
  return clampLine(label, RESOURCE_PRESSURE_DIFFERENTIATION_BADGE_MAX);
}

function profileToCard(profile: ResourcePressureDifferentiationProfile): ResourcePressureCostHintCard {
  const dominantAxisLabel = DOMINANT_AXIS_LABELS[profile.dominantAxis];
  const intensityLabel = INTENSITY_LABELS[profile.intensity];
  const badgeLabel = badgeForProfile(profile);
  const reasonLine = clampLine(profile.reasonLine, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX);
  const title = clampLine(profile.title, 44);
  const accessibilityLabel = clampLine(
    `${title}. ${dominantAxisLabel} baskısı ${intensityLabel.toLowerCase()}. ${reasonLine}`,
    RESOURCE_PRESSURE_DIFFERENTIATION_ACCESSIBILITY_MAX,
  );

  return {
    id: profile.id,
    title,
    reasonLine,
    dominantAxisLabel,
    intensityLabel,
    badgeLabel,
    accessibilityLabel,
  };
}

function safeLine(line: string | undefined): string | undefined {
  if (!line?.trim()) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return clampLine(line, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX);
}

function joinReasonLines(profiles: ResourcePressureDifferentiationProfile[]): string | undefined {
  const lines = profiles
    .map((profile) => safeLine(profile.reasonLine))
    .filter((line): line is string => Boolean(line));
  if (lines.length === 0) return undefined;
  return clampLine(lines[0], RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX);
}

export function buildResourcePressureCostHintCards(
  result: ResourcePressureDifferentiationResult | null | undefined,
): ResourcePressureCostHintCard[] {
  if (!result?.isActive) return [];
  return result.profiles
    .slice(0, RESOURCE_PRESSURE_DIFFERENTIATION_MAX_CARDS)
    .map(profileToCard);
}

export function buildPrimaryResourcePressureCostHint(
  result: ResourcePressureDifferentiationResult | null | undefined,
): ResourcePressureCostHintCard | undefined {
  if (!result?.primaryProfile || !result.isActive) return undefined;
  return profileToCard(result.primaryProfile);
}

export function buildPortfolioCostReasonLine(
  result: ResourcePressureDifferentiationResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  if (!result?.isActive) return undefined;
  const line = joinReasonLines(
    result.portfolioCostHints.length > 0 ? result.portfolioCostHints : result.profiles.slice(0, 1),
  );
  if (!line) return undefined;
  const normalized = line.toLowerCase();
  if (existingLines.some((entry) => entry.trim().toLowerCase() === normalized)) return undefined;
  return line;
}

export function buildDeferRiskCostReasonLine(
  result: ResourcePressureDifferentiationResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  if (!result?.isActive) return undefined;
  const profile = result.deferRiskCostHints[0] ?? result.primaryProfile;
  const line = safeLine(profile?.opportunityCostLine ?? profile?.reasonLine);
  if (!line) return undefined;
  const normalized = line.toLowerCase();
  if (existingLines.some((entry) => entry.trim().toLowerCase() === normalized)) return undefined;
  return line;
}

export function buildOperationFeedCostReasonLine(
  result: ResourcePressureDifferentiationResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  if (!result?.isActive) return undefined;
  const line = joinReasonLines(
    result.operationFeedCostHints.length > 0
      ? result.operationFeedCostHints
      : result.profiles.filter((profile) => profile.domain === 'route_pressure').slice(0, 1),
  );
  if (!line) return undefined;
  const normalized = line.toLowerCase();
  if (existingLines.some((entry) => entry.trim().toLowerCase() === normalized)) return undefined;
  return line;
}

export function buildReportResourcePressureNote(
  result: ResourcePressureDifferentiationResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  if (!result?.isActive || result.day < 8) return undefined;
  const profile = result.primaryProfile;
  const line = safeLine(
    profile?.cautionLine ??
      profile?.opportunityCostLine ??
      profile?.reasonLine,
  );
  if (!line) return undefined;
  const normalized = line.toLowerCase();
  if (existingLines.some((entry) => entry.trim().toLowerCase() === normalized)) return undefined;
  return line;
}

export function buildEceResourcePressureLine(
  result: ResourcePressureDifferentiationResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  if (!result?.isActive) return undefined;
  const profile = result.primaryProfile;
  if (!profile) return undefined;
  const axis = DOMINANT_AXIS_LABELS[profile.dominantAxis];
  const line = clampLine(
    `${profile.title}: ${axis} ekseninde ${INTENSITY_LABELS[profile.intensity].toLowerCase()} baskı.`,
    RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX,
  );
  const normalized = line.toLowerCase();
  if (existingLines.some((entry) => entry.trim().toLowerCase() === normalized)) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return line;
}

export function enrichPortfolioItemDecisionLine(
  recommendedReason: string | undefined,
  itemKind: string,
  result: ResourcePressureDifferentiationResult | null | undefined,
): string | undefined {
  if (!result?.isActive || !recommendedReason) return recommendedReason;
  const match = result.portfolioCostHints.find((profile) => {
    if (itemKind === 'container_pressure') return profile.domain === 'container_pressure';
    if (itemKind === 'route_pressure') return profile.domain === 'route_pressure';
    if (itemKind === 'social_pressure') return profile.domain === 'social_trust_pressure';
    if (itemKind === 'resource_pressure') return profile.domain === 'general_resource';
    if (itemKind === 'follow_up_candidate') return profile.domain === 'follow_up_pressure';
    if (itemKind === 'risk_signal') return profile.domain === 'risk_signal';
    if (itemKind === 'recovery_opportunity') return profile.domain === 'recovery_opportunity';
    return false;
  });
  const hint = safeLine(match?.reasonLine);
  if (!hint || hint.toLowerCase() === recommendedReason.trim().toLowerCase()) {
    return recommendedReason;
  }
  return clampLine(`${recommendedReason} ${hint}`, RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX);
}

export function collectResourcePressurePresentationLines(
  result: ResourcePressureDifferentiationResult,
): string[] {
  return [
    ...buildResourcePressureCostHintCards(result).map((card) => card.reasonLine),
    buildPortfolioCostReasonLine(result) ?? '',
    buildDeferRiskCostReasonLine(result) ?? '',
    buildOperationFeedCostReasonLine(result) ?? '',
    buildReportResourcePressureNote(result) ?? '',
    buildEceResourcePressureLine(result) ?? '',
  ].filter(Boolean);
}
