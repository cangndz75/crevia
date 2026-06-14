import {
  FOLLOW_UP_ACCESSIBILITY_MAX,
  FOLLOW_UP_BENEFIT_LINE_MAX,
  FOLLOW_UP_BADGE_LABELS,
  FOLLOW_UP_COST_LABELS,
  FOLLOW_UP_IMPACT_LABELS,
  FOLLOW_UP_LINE_MAX,
  FOLLOW_UP_MAX_ACTIONS,
} from './followUpActionConstants';
import type {
  FollowUpActionCardModel,
  FollowUpActionResult,
} from './followUpActionTypes';

const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function resolveTone(
  action: FollowUpActionResult['actions'][number],
): FollowUpActionCardModel['tone'] {
  if (action.visibilityLevel === 'teaser' && !action.isActionable) return 'locked';
  if (action.kind === 'support_recovery' || action.impactBand === 'high') return 'positive';
  if (action.riskLine || action.kind === 'rebalance_resource') return 'cautious';
  return 'neutral';
}

function buildCardModel(action: FollowUpActionResult['actions'][number]): FollowUpActionCardModel {
  const line = clampLine(action.line, FOLLOW_UP_LINE_MAX);
  const benefitLine = clampLine(action.benefitLine, FOLLOW_UP_BENEFIT_LINE_MAX);
  const riskLine = action.riskLine ? clampLine(action.riskLine, FOLLOW_UP_LINE_MAX) : undefined;
  const badgeLabel = FOLLOW_UP_BADGE_LABELS[action.kind];
  const costLabel = FOLLOW_UP_COST_LABELS[action.costBand];
  const impactLabel = FOLLOW_UP_IMPACT_LABELS[action.impactBand];
  const districtPart = action.districtName ? ` ${action.districtName}.` : '';

  return {
    id: action.id,
    title: action.title,
    line,
    benefitLine,
    riskLine,
    badgeLabel,
    costLabel,
    impactLabel,
    districtName: action.districtName,
    tone: resolveTone(action),
    isActionable: action.isActionable,
    accessibilityLabel: clampLine(
      `${action.title}.${districtPart} ${line}. ${benefitLine}. Maliyet: ${costLabel}. Etki: ${impactLabel}.`,
      FOLLOW_UP_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildFollowUpActionCardModels(
  result: FollowUpActionResult | null | undefined,
): FollowUpActionCardModel[] {
  if (!result || result.actions.length === 0) return [];
  return result.actions
    .slice(0, FOLLOW_UP_MAX_ACTIONS)
    .map(buildCardModel)
    .filter((card) => !TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.line} ${card.benefitLine}`));
}

export function buildPrimaryFollowUpActionCard(
  result: FollowUpActionResult | null | undefined,
): FollowUpActionCardModel | null {
  const primary = result?.primaryAction;
  if (!primary) return null;
  const card = buildCardModel(primary);
  if (TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.line} ${card.benefitLine}`)) return null;
  return card;
}

export function buildEceFollowUpActionLine(
  result: FollowUpActionResult | null | undefined,
): string | undefined {
  const primary = result?.primaryAction;
  if (!primary || primary.isFallback) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(primary.line)) return undefined;
  const district = primary.districtName ? `${primary.districtName}: ` : '';
  return clampLine(`${district}${primary.line}`, FOLLOW_UP_LINE_MAX);
}

export function buildReportFollowUpActionHint(
  result: FollowUpActionResult | null | undefined,
): string | undefined {
  const primary = result?.primaryAction;
  if (!primary || primary.isFallback) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(primary.benefitLine)) return undefined;
  const hint = `${primary.title}. ${primary.benefitLine}`;
  return clampLine(hint, FOLLOW_UP_BENEFIT_LINE_MAX);
}
