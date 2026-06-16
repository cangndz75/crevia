import type { OperationPortfolioItemKind } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';

import type {
  AuthorityGameplayEffectDefinition,
  AuthorityGameplayEffectKind,
  AuthorityGameplayEffectStrength,
} from './authorityGameplayEffectTypes';

export const AUTHORITY_EFFECT_STRENGTH_BONUS: Record<AuthorityGameplayEffectStrength, number> = {
  low: 2,
  medium: 4,
  high: 6,
};

export const AUTHORITY_PORTFOLIO_BONUS_CAP = 8;

type EffectTemplate = {
  permissionId: RankPermissionId;
  domain: AuthorityGameplayEffectDefinition['domain'];
  effectKind: AuthorityGameplayEffectKind;
  effectStrength: AuthorityGameplayEffectStrength;
  explanationLine: string;
  affectedSurfaces: AuthorityGameplayEffectDefinition['affectedSurfaces'];
  portfolioKinds?: OperationPortfolioItemKind[];
};

export const EFFECT_TEMPLATES: readonly EffectTemplate[] = [
  {
    permissionId: 'resource_pressure_summary',
    domain: 'portfolio_priority',
    effectKind: 'improve_priority_score',
    effectStrength: 'medium',
    explanationLine: 'Kaynak baskisi sinyallerinin onceligi netlesir.',
    affectedSurfaces: ['portfolio', 'plan', 'center'],
    portfolioKinds: ['resource_pressure', 'active_operation'],
  },
  {
    permissionId: 'district_trust_preview',
    domain: 'portfolio_priority',
    effectKind: 'improve_priority_score',
    effectStrength: 'medium',
    explanationLine: 'Guven etkili sinyallerin neden onemli oldugu aciklanir.',
    affectedSurfaces: ['portfolio', 'map', 'defer'],
    portfolioKinds: ['social_pressure', 'district_pressure'],
  },
  {
    permissionId: 'assignment_fit_preview',
    domain: 'portfolio_priority',
    effectKind: 'improve_priority_score',
    effectStrength: 'medium',
    explanationLine: 'Aktif operasyon adaylarinin uyumu daha net okunur.',
    affectedSurfaces: ['portfolio', 'map', 'plan'],
    portfolioKinds: ['active_operation', 'route_pressure'],
  },
  {
    permissionId: 'advisor_specialist_notes_preview',
    domain: 'defer_risk',
    effectKind: 'soften_defer_risk',
    effectStrength: 'medium',
    explanationLine: 'Ertelenen operasyonlarin riski daha okunur kalir.',
    affectedSurfaces: ['defer', 'report', 'advisor', 'center'],
    portfolioKinds: ['active_operation', 'risk_signal'],
  },
  {
    permissionId: 'advisor_specialist_notes_preview',
    domain: 'advisor_confidence',
    effectKind: 'improve_recommendation_confidence',
    effectStrength: 'low',
    explanationLine: 'Ece oncelik sinyalini daha net yorumlar.',
    affectedSurfaces: ['advisor', 'center', 'plan'],
  },
  {
    permissionId: 'map_trust_layer',
    domain: 'map_visibility',
    effectKind: 'unlock_inspection',
    effectStrength: 'medium',
    explanationLine: 'Haritada guven baskisi nedenleri incelenebilir.',
    affectedSurfaces: ['map', 'center'],
  },
  {
    permissionId: 'map_resource_layer',
    domain: 'map_actionability',
    effectKind: 'reveal_more_context',
    effectStrength: 'medium',
    explanationLine: 'Kaynak ve rota baskisi haritada daha net okunur.',
    affectedSurfaces: ['map', 'plan'],
    portfolioKinds: ['resource_pressure', 'route_pressure'],
  },
  {
    permissionId: 'district_memory_trace_preview',
    domain: 'district_insight',
    effectKind: 'expose_district_reason',
    effectStrength: 'low',
    explanationLine: 'Bolge izleri plan ve raporda daha net baglanir.',
    affectedSurfaces: ['report', 'portfolio'],
    portfolioKinds: ['memory_trace', 'district_pressure'],
  },
];

export function strengthBonus(strength: AuthorityGameplayEffectStrength): number {
  return AUTHORITY_EFFECT_STRENGTH_BONUS[strength];
}
