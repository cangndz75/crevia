import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { getPilotDayPlan } from '@/core/content/pilotDayPlan';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { pilotDistrictFromMapDistrict } from '@/features/map/data/mapDistrictMapping';

import type { ContentPackEventDomain, ContentPackEventTemplate } from './contentPackTypes';

const PILOT_DISTRICTS_FOR_OPEN: PilotDistrictId[] = [
  'central',
  'cumhuriyet',
  'industrial_market',
];

function resolvePilotDistrictIds(districtId: MapDistrictId): PilotDistrictId[] {
  const mapped = pilotDistrictFromMapDistrict(districtId);
  if (mapped) {
    return [mapped];
  }
  return [...PILOT_DISTRICTS_FOR_OPEN];
}

function buildDescription(template: ContentPackEventTemplate): string {
  return [template.sceneText, template.pressureText, template.decisionContextText]
    .filter(Boolean)
    .join(' ');
}

function resolvePackLabel(template: ContentPackEventTemplate): string {
  return template.id.startsWith('csp2-')
    ? 'Content Safety Pack Aşama 2'
    : 'Content Safety Pack Aşama 1';
}

function resolveCategory(domain: ContentPackEventDomain): string {
  switch (domain) {
    case 'container':
      return 'Konteyner / Temizlik';
    case 'vehicle':
    case 'route':
      return 'Araç / Rota';
    case 'personnel':
      return 'Personel / Ekip';
    case 'social':
      return 'Sosyal Nabız';
    case 'crisis_adjacent':
      return 'Kriz Öncesi Sinyal';
    default:
      return 'Mahalle Operasyonu';
  }
}

function resolveEventType(
  domain: ContentPackEventDomain,
): NonNullable<EventCard['eventType']> {
  switch (domain) {
    case 'container':
      return 'waste';
    case 'vehicle':
    case 'route':
      return 'vehicle';
    case 'personnel':
      return 'staff';
    case 'social':
      return 'social_media';
    case 'crisis_adjacent':
      return 'butterfly';
    default:
      return 'citizen_complaint';
  }
}

function resolveContentCategory(domain: ContentPackEventDomain): string {
  switch (domain) {
    case 'vehicle':
    case 'route':
      return 'vehicle_route';
    case 'personnel':
      return 'staff_morale';
    case 'social':
      return 'social_pulse';
    case 'crisis_adjacent':
      return 'crisis_signal';
    case 'container':
      return 'waste_container';
    default:
      return 'citizen_complaint';
  }
}

function defaultDecisions(template: ContentPackEventTemplate): EventDecision[] {
  const prefix = template.id;
  const hints = template.decisionHints ?? [
    {
      optionKind: 'fast_response' as const,
      label: 'Hızlı Müdahale',
      gain: template.shortTermEffectText,
      tradeOff: template.tradeOffText,
      carryOver: template.carryOverText,
    },
    {
      optionKind: 'preventive_route' as const,
      label: 'Önleyici Plan',
      gain: 'Bugün görünür etki daha düşük kalır.',
      tradeOff: 'Ekip ve araç yükü daha dengeli dağılır.',
      carryOver: template.carryOverText,
    },
    {
      optionKind: 'balanced_dispatch' as const,
      label: 'Dengeli Dağıtım',
      gain: 'Orta tempo ile baskı kontrol altında tutulur.',
      tradeOff: 'Tam çözüm bugün görünmeyebilir.',
      carryOver: 'Yarın aynı noktada tekrar izleme gerekir.',
    },
  ];

  const styles: EventDecision['style'][] = ['bold', 'balanced', 'cautious'];
  const decisionStyles: EventDecision['decisionStyle'][] = ['fast', 'planned', 'partial'];

  return hints.slice(0, 3).map((hint, index) => ({
    id: `${prefix}-${hint.optionKind}`,
    title: hint.label,
    description: hint.gain,
    style: styles[index] ?? 'balanced',
    recommended: index === 0,
    decisionStyle: decisionStyles[index] ?? 'planned',
    contentShortTradeoff: hint.tradeOff,
    contentRiskHint: template.pressureText.slice(0, 120),
    contentPriorityHint: template.tags[0] ?? 'Operasyon',
    effects: {
      publicSatisfaction: index === 0 ? 8 : index === 1 ? 4 : 2,
      budget: index === 0 ? -3200 : -1800,
      morale: index === 0 ? -3 : 1,
      risk: index === 0 ? -8 : -3,
      xp: 10 + index,
    },
  }));
}

/**
 * Content pack şablonunu mevcut EventCard formatına dönüştürür.
 * applyDecision mantığı değişmez; yalnızca metin ve hafif metadata.
 */
export function mapContentPackTemplateToEventCard(
  template: ContentPackEventTemplate,
): EventCard {
  const day = template.preferredPilotDays?.[0] ?? 2;
  const dayPlan = getPilotDayPlan(day);
  const identity = DISTRICT_IDENTITIES[template.districtId];
  const districtIds = resolvePilotDistrictIds(template.districtId);

  const filterTags: EventCard['filterTags'] =
    template.domain === 'crisis_adjacent'
      ? ['crisis']
      : template.intensity === 'high'
        ? ['urgent']
        : undefined;

  return {
    id: template.id,
    title: template.title,
    category: resolveCategory(template.domain),
    riskLevel: template.intensity === 'high' ? 'high' : template.intensity === 'low' ? 'low' : 'medium',
    district: identity?.name ?? template.districtId,
    neighborhoodId: template.districtId,
    description: buildDescription(template),
    contextTag: resolvePackLabel(template),
    urgencyHours: template.intensity === 'high' ? 3 : 5,
    decisions: defaultDecisions(template),
    previewEffects: {
      publicSatisfaction: -4,
      risk: 7,
      xp: 14,
    },
    day,
    theme: dayPlan?.theme,
    districtIds,
    eventType: resolveEventType(template.domain),
    priority: template.domain === 'crisis_adjacent' ? 7 : 6,
    fallback: false,
    filterTags,
    advisorNote: template.advisorEchoText,
    contentFutureHookHint: `${template.reportEchoText} | ${template.carryOverText}`,
    characterMessage: template.socialEchoText,
    contentCategory: resolveContentCategory(template.domain),
  };
}

export function mapContentPackTemplatesToEventCards(
  templates: ContentPackEventTemplate[],
): EventCard[] {
  return templates.map((t) => mapContentPackTemplateToEventCard(t));
}
