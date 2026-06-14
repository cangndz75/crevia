import type { EventCard } from '@/core/models/EventCard';
import type { EventGameplayVarietyProfile } from '@/core/eventVariety/eventGameplayVarietyTypes';
import type {
  EventDispatchCompatibilityReason,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import type {
  EventFieldAssignmentEffect,
} from '@/features/events/utils/eventFieldPhasePresentation';
import type {
  EventInspectFinding,
} from '@/features/events/utils/eventInspectPhasePresentation';
import type {
  EventPlanExpectedImpact,
  EventPlanStrategyCard,
} from '@/features/events/utils/eventPlanPhasePresentation';

import {
  getGameplayVisibility,
  isGameplayUnlockDetailed,
} from './authorityGameplayUnlockModel';
import type {
  AuthorityGameplayPresentationContext,
  AuthorityGameplayUnlockId,
  AuthorityGameplayUnlockProfile,
} from './authorityGameplayUnlockTypes';

export function buildGameplayFocusedNextUnlockLine(
  profile: AuthorityGameplayUnlockProfile,
): string {
  if (profile.status === 'available') {
    return profile.unlockedLine ?? profile.playerBenefitLine;
  }
  return `Sonraki yetki: ${profile.canSeeLine} görebileceksin.`;
}

export function buildGameplayFocusedHubUnlockLine(
  profile: AuthorityGameplayUnlockProfile,
): string {
  if (profile.status === 'preview') {
    return `Yakında: ${profile.canSeeLine}`;
  }
  if (profile.status === 'available') {
    return profile.unlockedLine ?? profile.playerBenefitLine;
  }
  return `Sonraki yetki: ${profile.title} — ${profile.canSeeLine}`;
}

export function buildAuthorityGameplayShowcaseCopy(profile: AuthorityGameplayUnlockProfile): {
  canSee: string;
  betterDecision: string;
  affectedPhase: string;
  unlockCondition: string;
} {
  return {
    canSee: `Görebilirsin: ${profile.canSeeLine}`,
    betterDecision: `Daha iyi karar verirsin: ${profile.betterDecisionLine}`,
    affectedPhase: `Etkilediği faz: ${profile.affectedPhaseLine}`,
    unlockCondition: `Açılma koşulu: ${profile.unlockConditionLine}`,
  };
}

function visibilityAtLeast(
  level: ReturnType<typeof getGameplayVisibility>,
  minimum: 'summary' | 'detailed',
): boolean {
  if (minimum === 'detailed') return level === 'detailed';
  return level === 'summary' || level === 'detailed' || level === 'teaser';
}

export function applyAuthorityToInspectFindings(
  findings: EventInspectFinding[],
  event: EventCard,
  context: AuthorityGameplayPresentationContext | undefined,
  varietyProfile?: EventGameplayVarietyProfile,
): EventInspectFinding[] {
  if (!context || findings.length === 0) return findings;

  const districtLevel = getGameplayVisibility(context, 'district_trust_preview');
  const tomorrowLevel = getGameplayVisibility(context, 'tomorrow_risk_preview');
  const resourceLevel = getGameplayVisibility(context, 'resource_pressure_summary');

  return findings.map((finding) => {
    if (finding.kind === 'district' || finding.kind === 'social') {
      if (isGameplayUnlockDetailed(context, 'district_trust_preview')) {
        return {
          ...finding,
          title: finding.kind === 'social' ? 'Sosyal tepki hassas' : 'Mahalle güveni duyarlı',
          body: 'Güven düşükse kalıcı plan daha güvenli olabilir; sosyal tepki plan seçimine bağlı.',
          sourceIds: [...finding.sourceIds, 'authority:district_trust_preview'].filter(
            (id, i, arr) => arr.indexOf(id) === i,
          ),
        };
      }
      if (visibilityAtLeast(districtLevel, 'summary')) {
        return {
          ...finding,
          body:
            finding.kind === 'social'
              ? 'Sosyal etki izleniyor; plan tercihi mahalle algısını etkileyebilir.'
              : 'Bölge etkisi var; plan tercihi mahalle algısını etkileyebilir.',
        };
      }
    }

    if (finding.kind === 'risk' || finding.kind === 'opportunity') {
      if (isGameplayUnlockDetailed(context, 'tomorrow_risk_preview')) {
        const tomorrowHint =
          varietyProfile?.primaryPressure === 'route_pressure'
            ? 'Bu seçim yarın rota baskısına dönebilir.'
            : varietyProfile?.primaryPressure === 'social_sensitivity'
              ? 'Bu tercih yarın sosyal baskıyı sakinleştirebilir veya taşıyabilir.'
              : varietyProfile?.primaryPressure === 'resource_pressure'
                ? 'Bu tercih yarın kaynak baskısına dönebilir.'
                : 'Bu seçim yarın rota, kaynak veya sosyal baskıya dönebilir.';
        return {
          ...finding,
          body: tomorrowHint,
          sourceIds: [...finding.sourceIds, 'authority:tomorrow_risk_preview'].filter(
            (id, i, arr) => arr.indexOf(id) === i,
          ),
        };
      }
      if (visibilityAtLeast(tomorrowLevel, 'summary') && finding.kind === 'risk') {
        return {
          ...finding,
          body: 'Yarın etkisi izlenir; plan tercihi sonraki günü şekillendirebilir.',
        };
      }
    }

    if (finding.kind === 'resource') {
      if (isGameplayUnlockDetailed(context, 'resource_pressure_summary')) {
        const detail =
          varietyProfile?.primaryPressure === 'vehicle_maintenance_pressure'
            ? 'Araç baskısı yüksek; hızlı müdahale sonraki görevi zorlayabilir.'
            : varietyProfile?.primaryPressure === 'team_fatigue_pressure'
              ? 'Personel yorgunluğu plan ve atamayı etkileyebilir.'
              : varietyProfile?.primaryPressure === 'container_network_pressure'
                ? 'Konteyner ağı baskısı kaynak dağılımını etkileyebilir.'
                : 'Kaynak baskısı plan seçiminde ayrışır.';
        return {
          ...finding,
          body: detail,
          sourceIds: [...finding.sourceIds, 'authority:resource_pressure_summary'].filter(
            (id, i, arr) => arr.indexOf(id) === i,
          ),
        };
      }
      if (visibilityAtLeast(resourceLevel, 'summary')) {
        return {
          ...finding,
          body: 'Kaynak baskısı izleniyor; hızlı çözüm daha fazla kaynak tüketebilir.',
        };
      }
    }

    return finding;
  });
}

function enrichPlanImpactLabel(
  impact: EventPlanExpectedImpact,
  detailed: boolean,
  varietyProfile?: EventGameplayVarietyProfile,
): EventPlanExpectedImpact {
  if (!detailed) {
    if (impact.id === 'resource_cost') {
      return { ...impact, label: 'Kaynak' };
    }
    if (impact.id === 'tomorrow_risk') {
      return { ...impact, label: 'Yarın etkisi' };
    }
    return impact;
  }

  if (impact.id === 'resource_cost') {
    const label =
      varietyProfile?.primaryPressure === 'vehicle_maintenance_pressure'
        ? 'Kaynak: araç baskısı'
        : varietyProfile?.primaryPressure === 'team_fatigue_pressure'
          ? 'Kaynak: personel yorgunluğu'
          : varietyProfile?.primaryPressure === 'container_network_pressure'
            ? 'Kaynak: konteyner ağı'
            : 'Kaynak: operasyon baskısı';
    return { ...impact, label };
  }

  if (impact.id === 'tomorrow_risk') {
    const label =
      varietyProfile?.primaryPressure === 'route_pressure'
        ? 'Yarın riski: rota baskısı'
        : varietyProfile?.primaryPressure === 'social_sensitivity'
          ? 'Yarın riski: sosyal tepki'
          : varietyProfile?.primaryPressure === 'resource_pressure'
            ? 'Yarın riski: kaynak baskısı'
            : 'Yarın riski: izleniyor';
    return { ...impact, label };
  }

  return impact;
}

export function applyAuthorityToPlanStrategies(
  strategies: EventPlanStrategyCard[],
  context: AuthorityGameplayPresentationContext | undefined,
  varietyProfile?: EventGameplayVarietyProfile,
): EventPlanStrategyCard[] {
  if (!context) return strategies;

  const resourceDetailed = isGameplayUnlockDetailed(context, 'resource_pressure_summary');
  const tomorrowDetailed = isGameplayUnlockDetailed(context, 'tomorrow_risk_preview');
  const resourceSummary = visibilityAtLeast(
    getGameplayVisibility(context, 'resource_pressure_summary'),
    'summary',
  );
  const tomorrowSummary = visibilityAtLeast(
    getGameplayVisibility(context, 'tomorrow_risk_preview'),
    'summary',
  );

  if (!resourceSummary && !tomorrowSummary && !resourceDetailed && !tomorrowDetailed) {
    return strategies;
  }

  return strategies.map((strategy) => ({
    ...strategy,
    expectedImpact: strategy.expectedImpact.map((impact) => {
      let next = impact;
      if (impact.id === 'resource_cost' && (resourceDetailed || resourceSummary)) {
        next = enrichPlanImpactLabel(impact, resourceDetailed, varietyProfile);
      }
      if (impact.id === 'tomorrow_risk' && (tomorrowDetailed || tomorrowSummary)) {
        next = enrichPlanImpactLabel(impact, tomorrowDetailed, varietyProfile);
      }
      return next;
    }),
    tradeoffs: strategy.tradeoffs.map((tradeoff) => {
      if (tradeoff.id === 'resource' && resourceDetailed) {
        const valueText =
          varietyProfile?.primaryPressure === 'vehicle_maintenance_pressure'
            ? 'Araç baskısı'
            : varietyProfile?.primaryPressure === 'team_fatigue_pressure'
              ? 'Personel yorgunluğu'
              : tradeoff.valueText;
        return { ...tradeoff, valueText };
      }
      return tradeoff;
    }),
  }));
}

export function applyAuthorityToDispatchReasons(
  reasons: EventDispatchCompatibilityReason[],
  context: AuthorityGameplayPresentationContext | undefined,
  compatWarnings?: string[],
  compatStrengths?: string[],
): EventDispatchCompatibilityReason[] {
  if (!context) return reasons;

  if (!isGameplayUnlockDetailed(context, 'assignment_fit_preview')) {
    const generic: EventDispatchCompatibilityReason[] = [];
    if (reasons.length === 0) {
      generic.push({
        id: 'authority-generic-fit',
        label: 'Uyum izleniyor',
        tone: 'neutral',
        iconKey: 'ellipse-outline',
      });
    } else {
      for (const reason of reasons.slice(0, 2)) {
        generic.push({
          ...reason,
          label:
            reason.tone === 'warning'
              ? 'Atama dengesi kontrol ediliyor'
              : 'Uyum izleniyor',
        });
      }
    }
    return generic.slice(0, 3);
  }

  const detailed: EventDispatchCompatibilityReason[] = [];

  for (const strength of compatStrengths ?? []) {
    if (detailed.length >= 3) break;
    detailed.push({
      id: `authority-strength-${detailed.length}`,
      label: strength.length > 40 ? `${strength.slice(0, 38)}…` : strength,
      tone: 'positive',
      iconKey: 'checkmark-circle-outline',
    });
  }

  for (const warning of compatWarnings ?? []) {
    if (detailed.length >= 3) break;
    const label = warning.toLowerCase().includes('yorgun')
      ? 'Ekip yorgunluğu düşük değil'
      : warning.toLowerCase().includes('araç')
        ? 'Araç uygunluğu sınırlı'
        : warning.toLowerCase().includes('rota')
          ? 'Rota baskısı yüksek'
          : warning.length > 40
            ? `${warning.slice(0, 38)}…`
            : warning;
    detailed.push({
      id: `authority-warning-${detailed.length}`,
      label,
      tone: 'warning',
      iconKey: 'alert-circle-outline',
    });
  }

  if (detailed.length === 0) {
    for (const reason of reasons) {
      if (detailed.length >= 3) break;
      detailed.push(reason);
    }
  }

  if (detailed.length === 0) {
    detailed.push({
      id: 'authority-fit-positive',
      label: 'Planla uyumlu ekip',
      tone: 'positive',
      iconKey: 'people-outline',
    });
  }

  return detailed.slice(0, 3);
}

export function applyAuthorityToFieldAssignmentEffect(
  effect: EventFieldAssignmentEffect,
  context: AuthorityGameplayPresentationContext | undefined,
): EventFieldAssignmentEffect {
  if (!context) return effect;

  if (!isGameplayUnlockDetailed(context, 'assignment_fit_preview')) {
    return {
      ...effect,
      body: 'Saha akışı izleniyor.',
    };
  }

  if (effect.scoreBand === 'high') {
    return {
      ...effect,
      body: 'Ekip yorgunluğu sahada düşük riskle ilerliyor.',
    };
  }
  if (effect.scoreBand === 'low') {
    return {
      ...effect,
      body: 'Ekip yorgunluğu sahada hissediliyor; rota stabilitesi izleniyor.',
    };
  }
  if (effect.scoreBand === 'medium') {
    return {
      ...effect,
      body: 'Araç baskısı izleniyor; rota stabil.',
    };
  }

  return effect;
}

export function findNextGameplayUnlockProfile(
  profiles: AuthorityGameplayUnlockProfile[],
): AuthorityGameplayUnlockProfile | undefined {
  return profiles.find(
    (profile) =>
      profile.status === 'preview' &&
      (profile.id === 'assignment_fit_preview' ||
        profile.id === 'district_trust_preview' ||
        profile.id === 'resource_pressure_summary' ||
        profile.id === 'tomorrow_risk_preview'),
  );
}

export function getAuthorityGameplayUnlockById(
  profiles: AuthorityGameplayUnlockProfile[],
  id: AuthorityGameplayUnlockId,
): AuthorityGameplayUnlockProfile | undefined {
  return profiles.find((profile) => profile.id === id);
}
