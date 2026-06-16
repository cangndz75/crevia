import type { OperationPortfolioDeferRisk } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { OperationPortfolioItem } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  AUTHORITY_PORTFOLIO_BONUS_CAP,
  EFFECT_TEMPLATES,
  strengthBonus,
} from './authorityGameplayEffectConstants';
import type {
  AuthorityGameplayEffectDefinition,
  AuthorityGameplayEffectSnapshot,
  BuildAuthorityGameplayEffectSnapshotInput,
} from './authorityGameplayEffectTypes';
import type {
  MapGameplayRuntimeMarkerFeedback,
  MapMarkerPortfolioStatus,
} from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackTypes';

type PortfolioDraftLike = {
  kind: OperationPortfolioItem['kind'];
  hasTrustSource?: boolean;
  hasResourceSource?: boolean;
  hasRouteSource?: boolean;
  hasTomorrowRiskSource?: boolean;
  urgency?: OperationPortfolioItem['urgency'];
  pressureLevel?: OperationPortfolioItem['pressureLevel'];
};

const TEXT_LIMIT = 72;

function clampLine(value: string, max = TEXT_LIMIT): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function buildEffectDefinition(template: (typeof EFFECT_TEMPLATES)[number]): AuthorityGameplayEffectDefinition {
  return {
    id: `authority_effect_${template.permissionId}_${template.effectKind}`,
    domain: template.domain,
    requiredPermissionId: template.permissionId,
    effectKind: template.effectKind,
    effectStrength: template.effectStrength,
    explanationLine: template.explanationLine,
    affectedSurfaces: [...template.affectedSurfaces],
    portfolioKinds: template.portfolioKinds ? [...template.portfolioKinds] : undefined,
    priorityBonus: strengthBonus(template.effectStrength),
  };
}

function buildPortfolioBonusMap(
  effects: AuthorityGameplayEffectDefinition[],
): Partial<Record<OperationPortfolioItem['kind'], number>> {
  const bonusByKind: Partial<Record<OperationPortfolioItem['kind'], number>> = {};

  for (const effect of effects) {
    if (effect.effectKind !== 'improve_priority_score' || !effect.portfolioKinds?.length) continue;
    const bonus = effect.priorityBonus ?? 0;
    for (const kind of effect.portfolioKinds) {
      bonusByKind[kind] = Math.min(
        AUTHORITY_PORTFOLIO_BONUS_CAP,
        (bonusByKind[kind] ?? 0) + bonus,
      );
    }
  }

  return bonusByKind;
}

function pickLine(
  effects: AuthorityGameplayEffectDefinition[],
  domain: AuthorityGameplayEffectDefinition['domain'],
): string | undefined {
  const match = effects.find((effect) => effect.domain === domain);
  return match ? clampLine(match.explanationLine) : undefined;
}

export function buildAuthorityGameplayEffectSnapshot(
  input: BuildAuthorityGameplayEffectSnapshotInput,
): AuthorityGameplayEffectSnapshot {
  const day = Math.max(1, input.day ?? 1);
  const permissionIds = uniqueStrings(input.permissionIds ?? []);
  const permissionSet = new Set(permissionIds);

  if (day <= 1 || day < POST_PILOT_FIRST_OPERATION_DAY) {
    return {
      day,
      mode: 'legacy',
      permissionIds,
      rankId: input.rankId,
      effects: [],
      portfolioPriorityBonusByKind: {},
      mapInspectabilityBoost: false,
      mapExplanationBoost: false,
      deferMitigationAvailable: false,
      sourceIds: [],
    };
  }

  const effects = EFFECT_TEMPLATES.filter((template) => permissionSet.has(template.permissionId)).map(
    buildEffectDefinition,
  );

  const mapInspectabilityBoost = effects.some(
    (effect) =>
      effect.domain === 'map_visibility' || effect.effectKind === 'unlock_inspection',
  );
  const mapExplanationBoost = effects.some(
    (effect) =>
      effect.domain === 'map_actionability' || effect.effectKind === 'reveal_more_context',
  );
  const deferMitigationAvailable = effects.some(
    (effect) => effect.domain === 'defer_risk' || effect.effectKind === 'soften_defer_risk',
  );

  const planningAuthorityLine = effects.some((effect) =>
    effect.affectedSurfaces.includes('plan'),
  )
    ? clampLine('Yetkin sayesinde oncelik ve tradeoff daha net okunuyor.')
    : undefined;

  return {
    day,
    mode: effects.length > 0 ? 'active' : 'legacy',
    permissionIds,
    rankId: input.rankId,
    effects,
    portfolioPriorityBonusByKind: buildPortfolioBonusMap(effects),
    mapInspectabilityBoost,
    mapExplanationBoost,
    deferMitigationAvailable,
    planningAuthorityLine,
    advisorAuthorityLine: pickLine(effects, 'advisor_confidence'),
    mapAuthorityLine: pickLine(effects, 'map_visibility') ?? pickLine(effects, 'map_actionability'),
    portfolioAuthorityLine: pickLine(effects, 'portfolio_priority'),
    sourceIds: uniqueStrings(effects.flatMap((effect) => [effect.id, effect.requiredPermissionId])),
  };
}

export function resolveAuthorityPortfolioPriorityBonus(
  draft: PortfolioDraftLike,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): number {
  if (!snapshot || snapshot.mode !== 'active') return 0;

  let bonus = snapshot.portfolioPriorityBonusByKind[draft.kind] ?? 0;

  if (
    draft.kind === 'social_pressure' &&
    draft.hasTrustSource &&
    snapshot.permissionIds.includes('district_trust_preview')
  ) {
    bonus = Math.min(AUTHORITY_PORTFOLIO_BONUS_CAP, bonus + 2);
  }
  if (
    draft.kind === 'resource_pressure' &&
    draft.hasResourceSource &&
    snapshot.permissionIds.includes('resource_pressure_summary')
  ) {
    bonus = Math.min(AUTHORITY_PORTFOLIO_BONUS_CAP, bonus + 2);
  }
  if (
    draft.kind === 'active_operation' &&
    snapshot.permissionIds.includes('assignment_fit_preview')
  ) {
    bonus = Math.min(AUTHORITY_PORTFOLIO_BONUS_CAP, bonus + 2);
  }
  if (
    draft.hasTomorrowRiskSource &&
    snapshot.permissionIds.includes('advisor_specialist_notes_preview')
  ) {
    bonus = Math.min(AUTHORITY_PORTFOLIO_BONUS_CAP, bonus + 2);
  }

  return bonus;
}

export function enrichPortfolioItemWithAuthorityEffect(
  item: OperationPortfolioItem,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): OperationPortfolioItem {
  if (!snapshot || snapshot.mode !== 'active') return item;

  const authorityTeaserLine =
    item.authorityTeaserLine ??
    (item.visibilityLevel === 'teaser'
      ? 'Yetki arttikca bu sinyalin detayi netlesir.'
      : undefined);

  let recommendedReason = item.recommendedReason;
  let selectBenefitLine = item.selectBenefitLine;

  if (
    snapshot.portfolioAuthorityLine &&
    (item.status === 'selected' || item.status === 'available')
  ) {
    selectBenefitLine = clampLine(
      selectBenefitLine
        ? `${selectBenefitLine} ${snapshot.portfolioAuthorityLine}`
        : snapshot.portfolioAuthorityLine,
    );
  }

  if (
    snapshot.effects.some((effect) => effect.effectKind === 'improve_recommendation_confidence') &&
    item.isMapRecommended
  ) {
    recommendedReason = clampLine(
      recommendedReason
        ? `${recommendedReason} Yetki oncelik sinyalini netlestirir.`
        : 'Yetki oncelik sinyalini netlestirir.',
    );
  }

  return {
    ...item,
    recommendedReason,
    selectBenefitLine,
    authorityTeaserLine,
  };
}

const HIGH_DEFER_RISKS = new Set<OperationPortfolioDeferRisk>([
  'trust_may_drop',
  'pressure_may_grow',
  'resource_cost_may_rise',
]);

export function canAuthorityMitigateDeferRisk(
  item: OperationPortfolioItem,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): boolean {
  if (!snapshot?.deferMitigationAvailable) return false;
  if (item.urgency === 'high' && item.pressureLevel === 'high') return false;
  if (item.deferRisk === 'trust_may_drop' && item.pressureLevel === 'high') return false;
  if (item.deferRisk === 'pressure_may_grow' && item.urgency === 'high') return false;
  return true;
}

export function buildAuthorityDeferMitigationLine(
  item: OperationPortfolioItem,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): string | undefined {
  if (!canAuthorityMitigateDeferRisk(item, snapshot)) return undefined;

  if (item.deferRisk === 'safe_to_watch' || item.status === 'watch_only') {
    return clampLine('Yetki avantaji: yarin ilk slotta toparlanabilir.');
  }
  if (!HIGH_DEFER_RISKS.has(item.deferRisk)) {
    return clampLine('Yetki avantaji: erteleme nedeni daha net okunuyor.');
  }
  if (item.deferRisk === 'route_may_strain' || item.kind === 'route_pressure') {
    return clampLine('Yetki avantaji: rota baskisi yarin ilk kontrolde okunur.');
  }
  return clampLine('Yetki avantaji: risk tamamen silinmez ama daha net izlenir.');
}

export function applyAuthorityToMapMarkerFeedback(
  marker: MapGameplayRuntimeMarkerFeedback,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
  item?: OperationPortfolioItem,
): MapGameplayRuntimeMarkerFeedback {
  if (!snapshot || snapshot.mode !== 'active') return marker;

  const deferredLike =
    marker.status === 'deferred' ||
    marker.status === 'blocked_by_capacity' ||
    marker.status === 'watch';

  let next: MapGameplayRuntimeMarkerFeedback = { ...marker };

  if (deferredLike && snapshot.mapInspectabilityBoost) {
    next = {
      ...next,
      isInspectable: true,
      isActionable: false,
      isStartable: false,
      ctaLabel:
        marker.status === 'blocked_by_capacity'
          ? 'Kapasiteyi kontrol et'
          : 'Erteleme etkisini gor',
      explanationLine: clampLine(
        `${next.explanationLine} ${snapshot.mapAuthorityLine ?? 'Yetki nedeni daha net okunuyor.'}`,
      ),
      riskLine: item?.deferRiskLine ? clampLine(item.deferRiskLine) : next.riskLine,
      sourceIds: uniqueStrings([...next.sourceIds, 'authority_map_inspection']),
    };
  } else if (
    (marker.status === 'recommended' || marker.status === 'today_focus') &&
    snapshot.mapExplanationBoost
  ) {
    next = {
      ...next,
      explanationLine: clampLine(
        `${next.explanationLine} ${snapshot.mapAuthorityLine ?? 'Yetki bolge baskisini netlestirir.'}`,
      ),
      sourceIds: uniqueStrings([...next.sourceIds, 'authority_map_context']),
    };
  } else if (marker.status === 'watch' && snapshot.mapInspectabilityBoost) {
    next = {
      ...next,
      isInspectable: true,
      ctaLabel: 'Bolge baskisini incele',
      explanationLine: clampLine(
        `${next.explanationLine} Yetki arttikca neden netlesir.`,
      ),
      sourceIds: uniqueStrings([...next.sourceIds, 'authority_map_watch']),
    };
  }

  if (
    deferredLike &&
    snapshot.deferMitigationAvailable &&
    item &&
    canAuthorityMitigateDeferRisk(item, snapshot)
  ) {
    const mitigation = buildAuthorityDeferMitigationLine(item, snapshot);
    if (mitigation) {
      next = {
        ...next,
        deferLine: mitigation,
        explanationLine: clampLine(`${next.explanationLine} ${mitigation}`),
      };
    }
  }

  return next;
}

export function authorityCtaForStatus(
  status: MapMarkerPortfolioStatus,
  snapshot?: AuthorityGameplayEffectSnapshot | null,
): string | undefined {
  if (!snapshot || snapshot.mode !== 'active') return undefined;
  if (status === 'deferred' || status === 'blocked_by_capacity') {
    return snapshot.mapInspectabilityBoost ? 'Erteleme etkisini gor' : undefined;
  }
  if (status === 'watch' && snapshot.mapInspectabilityBoost) {
    return 'Bolge baskisini incele';
  }
  if (status === 'recommended' && snapshot.mapExplanationBoost) {
    return 'Risk nedenini gor';
  }
  return undefined;
}
