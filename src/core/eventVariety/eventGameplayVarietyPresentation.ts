import type { EventCard } from '@/core/models/EventCard';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import type {
  EventInspectFinding,
  EventInspectFindingKind,
  EventInspectFindingPriority,
  EventInspectFindingTone,
} from '@/features/events/utils/eventInspectPhasePresentation';

import {
  buildEventGameplayVarietyProfile,
  resolveEventGameplayPressureDomain,
} from './eventGameplayVarietyModel';
import type {
  BuildEventGameplayVarietyProfileInput,
  EventGameplayPressureDomain,
  EventGameplayPressureKind,
  EventGameplayVarietyProfile,
} from './eventGameplayVarietyTypes';

type VarietyFindingBoost = {
  scoreDelta: number;
  title?: string;
  body?: string;
  kind?: EventInspectFindingKind;
  tone?: EventInspectFindingTone;
  priority?: EventInspectFindingPriority;
};

const PRESSURE_INSPECT_BOOST: Partial<
  Record<EventGameplayPressureKind, VarietyFindingBoost>
> = {
  route_pressure: {
    scoreDelta: 12,
    title: 'Rota süresi kritik',
    body: 'Hızlı çözüm araç baskısını artırabilir.',
    kind: 'route',
    tone: 'warning',
  },
  time_pressure: {
    scoreDelta: 10,
    title: 'Süre baskısı var',
    body: 'Plan seçimi rota süresini doğrudan etkiler.',
    kind: 'route',
    tone: 'warning',
  },
  social_sensitivity: {
    scoreDelta: 12,
    title: 'Sosyal tepki hassas',
    body: 'Güven etkisi plan seçimine duyarlı.',
    kind: 'social',
    tone: 'warning',
    priority: 'high',
  },
  district_trust_pressure: {
    scoreDelta: 8,
    title: 'Mahalle güveni duyarlı',
    body: 'Plan tercihi güven algısını şekillendirebilir.',
    kind: 'district',
    tone: 'neutral',
  },
  vehicle_maintenance_pressure: {
    scoreDelta: 10,
    title: 'Bakım riski var',
    body: 'Aracı zorlamak sonraki görevi etkileyebilir.',
    kind: 'team',
    tone: 'warning',
  },
  team_fatigue_pressure: {
    scoreDelta: 9,
    title: 'Ekip temposu kritik',
    body: 'Yorgunluk plan ve atama seçimlerini etkileyebilir.',
    kind: 'team',
    tone: 'warning',
  },
  container_network_pressure: {
    scoreDelta: 8,
    title: 'Konteyner ağı baskısı',
    body: 'Tek nokta çözümü ağ dengesini korumayabilir.',
    kind: 'resource',
    tone: 'neutral',
  },
  resource_pressure: {
    scoreDelta: 6,
    title: 'Kaynak baskısı oluşabilir',
    body: 'Hızlı çözüm daha fazla kaynak tüketebilir.',
    kind: 'resource',
    tone: 'warning',
  },
};

const DOMAIN_INSPECT_FALLBACK: Partial<
  Record<EventGameplayPressureDomain, VarietyFindingBoost>
> = {
  transport: {
    scoreDelta: 5,
    body: 'Rota ve süre plan tercihine bağlı.',
    kind: 'route',
  },
  social: {
    scoreDelta: 5,
    body: 'Sosyal etki plan seçimine duyarlı.',
    kind: 'social',
  },
  maintenance: {
    scoreDelta: 5,
    body: 'Bakım penceresi korunmalı.',
    kind: 'team',
  },
  container: {
    scoreDelta: 5,
    body: 'Ağ dengesi plan tercihine bağlı.',
    kind: 'resource',
  },
};

export function getEventGameplayVarietyProfile(
  event: EventCard,
  input?: BuildEventGameplayVarietyProfileInput,
): EventGameplayVarietyProfile {
  return buildEventGameplayVarietyProfile(event, input);
}

export function applyVarietyBoostToInspectFinding(
  finding: EventInspectFinding,
  profile: EventGameplayVarietyProfile,
): EventInspectFinding {
  const boost = PRESSURE_INSPECT_BOOST[profile.primaryPressure];
  if (!boost) return finding;

  const kindMatches =
    !boost.kind ||
    finding.kind === boost.kind ||
    (profile.domain === 'transport' && finding.kind === 'route') ||
    (profile.domain === 'social' && finding.kind === 'social');

  if (!kindMatches) return finding;

  return {
    ...finding,
    title: boost.title ?? finding.title,
    body: boost.body ?? finding.body,
    tone: boost.tone ?? finding.tone,
    priority: boost.priority ?? finding.priority,
    sourceIds: [...finding.sourceIds, `variety:${profile.primaryPressure}`].filter(
      (id, idx, arr) => arr.indexOf(id) === idx,
    ),
  };
}

export function varietyInspectFindingScoreBoost(
  finding: EventInspectFinding,
  profile: EventGameplayVarietyProfile,
): number {
  const boost = PRESSURE_INSPECT_BOOST[profile.primaryPressure];
  if (!boost) {
    const domainBoost = DOMAIN_INSPECT_FALLBACK[profile.domain];
    return domainBoost?.scoreDelta ?? 0;
  }

  if (boost.kind && finding.kind !== boost.kind) {
    return DOMAIN_INSPECT_FALLBACK[profile.domain]?.scoreDelta ?? 0;
  }

  return boost.scoreDelta;
}

export function enrichInspectFindingsWithVariety(
  findings: EventInspectFinding[],
  event: EventCard,
  input?: BuildEventGameplayVarietyProfileInput,
): EventInspectFinding[] {
  const profile = getEventGameplayVarietyProfile(event, input);
  if (profile.primaryPressure === 'calm_standard') {
    return findings;
  }

  return findings.map((finding) => applyVarietyBoostToInspectFinding(finding, profile));
}

export function planStrategyVarietyNote(
  strategyId: EventPlanStrategyId,
  profile: EventGameplayVarietyProfile,
): string | null {
  if (profile.primaryPressure === 'calm_standard') return null;

  switch (profile.domain) {
    case 'transport':
      if (strategyId === 'rapid_response' && profile.primaryPressure === 'route_pressure') {
        return 'Hızlı müdahale rotayı kısaltır; kaynak uyarısı olabilir.';
      }
      if (strategyId === 'long_term_fix') {
        return 'Kalıcı plan yarın riskini azaltabilir; bugün daha yavaş.';
      }
      break;
    case 'social':
      if (strategyId === 'balanced_plan') {
        return 'Dengeli plan sosyal tepkiyi kontrol etmeye uygun.';
      }
      if (strategyId === 'rapid_response') {
        return 'Hızlı müdahale kısa vadede tepkiyi azaltır; kaynak maliyeti olabilir.';
      }
      break;
    case 'maintenance':
      if (strategyId === 'rapid_response') {
        return 'Hızlı müdahale yorgunluk uyarısı alır.';
      }
      if (strategyId === 'long_term_fix' || strategyId === 'balanced_plan') {
        return 'Bakım riskini azaltmaya daha uygun görünür.';
      }
      break;
    case 'container':
    case 'environment':
      if (strategyId === 'long_term_fix') {
        return 'Kalıcı plan ağ baskısını düşürmeye yönelik.';
      }
      break;
    case 'logistics':
      if (strategyId === 'rapid_response') {
        return 'Geniş kapsam için hızlı müdahale kaynak dağıtır.';
      }
      if (strategyId === 'long_term_fix') {
        return 'Odaklı derin müdahale kritik noktaya yönelir.';
      }
      break;
    default:
      break;
  }

  return null;
}

export function dispatchVarietyHintLine(profile: EventGameplayVarietyProfile): string | null {
  if (profile.primaryPressure === 'calm_standard') return null;
  return profile.dispatchHintLine ?? null;
}

export function fieldVarietyHintLine(profile: EventGameplayVarietyProfile): string | null {
  if (profile.primaryPressure === 'calm_standard') return null;
  return profile.fieldHintLine ?? null;
}

export function planRecommendedStrategyFromVariety(
  profile: EventGameplayVarietyProfile,
): EventPlanStrategyId | null {
  if (profile.strategyBias === 'none') return null;
  if (profile.strategyBias === 'mixed') return null;
  return profile.strategyBias;
}

export { resolveEventGameplayPressureDomain };
