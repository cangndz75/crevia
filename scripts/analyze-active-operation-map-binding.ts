/**
 * Active operation map binding analyzer.
 * Calistir: npm run analyze:active-operation-map-binding
 */

import {
  buildActiveOperationMapBinding,
  buildActiveOperationMapCardModel,
} from '@/core/activeOperationMapBinding';
import type { EventCard } from '@/core/models/EventCard';

const event: EventCard = {
  id: 'analysis_route_pressure',
  title: 'Rota Baskisi',
  category: 'transport',
  riskLevel: 'medium',
  district: 'Merkez',
  neighborhoodId: 'merkez',
  description: 'Saha rotasi yogunlasiyor.',
  contextTag: 'route',
  urgencyHours: 4,
  decisions: [],
  previewEffects: { publicSatisfaction: 1, risk: -1, xp: 30 },
};

let warnCount = 0;

function analyzeDay(day: number) {
  const binding = buildActiveOperationMapBinding({
    day,
    activeEvent: event,
    unlockedPermissionIds:
      day >= 8 ? ['active_task_route', 'district_trust_preview', 'resource_pressure_summary'] : [],
    activeTaskRoute:
      day >= 3
        ? {
            id: 'route:analysis',
            phase: day >= 8 ? 'en_route' : 'dispatch_ready',
            status: 'active',
            healthStatus: 'healthy',
            visibility: {
              mode: 'standard',
              showSteps: true,
              showResourceWarning: false,
              maxSteps: 3,
              showMapHint: true,
            },
            routeModel: {} as never,
            steps: [],
            districtNodes: [],
            resourceNodes: [],
            dispatchLine: 'Sevk hazir.',
            fieldLine: 'Saha aktif.',
            mapLine: 'Rota haritada takip ediliyor.',
            reportLine: 'Rota rapora islenir.',
            statusLine: 'Yolda',
            activeStepIndex: 0,
            visible: true,
            isHintOnly: true,
          }
        : null,
    districtPersonality:
      day >= 8
        ? {
            districtId: 'merkez',
            districtName: 'Merkez',
            archetypeIds: ['balanced_district'],
            primaryArchetypeId: 'balanced_district',
            criteria: [],
            primaryCriterionId: 'route_difficulty',
            secondaryCriterionIds: [],
            gameplayTags: ['route_watch'],
            eventBias: { preferredDomains: ['transport'], pressureHints: ['route_pressure'] },
            strategyBias: {
              rapidResponseRisk: 'medium',
              balancedPlanFit: 'high',
              longTermFixValue: 'medium',
              recommendedCautionLine: 'Dengeyi koru.',
            },
            mapBias: {
              preferredMapRoles: ['route_support'],
              mapSignalLine: 'Merkez rota baskisina duyarlidir.',
            },
            eceToneHint: 'strategic',
            confidence: 'high',
            isFallback: false,
            sourceLabel: 'district',
            sourceIds: ['district:merkez'],
          }
        : null,
    eventGameplayProfile:
      day >= 8
        ? {
            eventId: event.id,
            domain: 'transport',
            primaryPressure: 'route_pressure',
            secondaryPressures: ['resource_pressure'],
            decisionShape: 'fast_vs_costly',
            strategyBias: 'mixed',
            playerFacingLine: 'Rota baskisi plan secimini etkileyebilir.',
            dispatchHintLine: 'Rota baskisi yonlendirme kararini etkileyebilir.',
            planHintLine: 'Plan secimi rota baskisini yumusatabilir.',
            freshnessScore: 80,
            repetitionRisk: 'low',
            sourceIds: ['gameplay:route_pressure'],
            sourceLabel: 'gameplay_variety',
          }
        : null,
    eventDetailRoute: `/events/${event.id}`,
  });
  const card = buildActiveOperationMapCardModel(binding, { day });
  const sourcedLines = [card?.districtLine, card?.routeLine, card?.pressureLine].filter(Boolean);
  const routeClaimWithoutSource = Boolean(card?.routeLine) && !binding.canShowRouteHint;
  const detailedWithoutPermission =
    binding.visibilityLevel === 'detailed' && !(binding.sourceIds.length > 0);

  if (day >= 8 && sourcedLines.length === 0) {
    warnCount += 1;
    console.log(`WARN Day ${day}: strategic sourced line yok`);
  }
  if (routeClaimWithoutSource) {
    warnCount += 1;
    console.log(`WARN Day ${day}: route claim source guard ihlali`);
  }
  if (detailedWithoutPermission && day < 8) {
    warnCount += 1;
    console.log(`WARN Day ${day}: permission disi detailed visibility`);
  }
  if (sourcedLines.length > 2) {
    warnCount += 1;
    console.log(`WARN Day ${day}: supporting line cap asildi (${sourcedLines.length})`);
  }

  console.log(
    JSON.stringify(
      {
        day,
        phase: binding.phase,
        visibility: binding.visibilityLevel,
        actionability: binding.isActionable,
        routeHint: binding.canShowRouteHint,
        districtContext: binding.canShowDistrictContext,
        sourcedLines,
        ctaLabel: card?.ctaLabel,
        ctaRoute: card?.ctaRoute,
      },
      null,
      2,
    ),
  );
}

for (const day of [1, 3, 7, 8, 10]) {
  analyzeDay(day);
}

console.log('');
console.log(warnCount === 0 ? 'Analyzer completed with PASS.' : `Analyzer completed with WARN (${warnCount}).`);
process.exit(warnCount === 0 ? 0 : 0);
