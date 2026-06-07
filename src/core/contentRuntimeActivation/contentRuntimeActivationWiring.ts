import type { CityEchoBindingKind } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type {
  DecisionImpactExplanation,
  DecisionImpactExplanationInput,
} from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import { DECISION_IMPACT_EXPLANATION_TITLE } from '@/core/decisionImpactExplanation/decisionImpactExplanationConstants';
import {
  sanitizeDecisionImpactMainLine,
  sanitizeDecisionImpactTomorrowLine,
} from '@/core/decisionImpactExplanation/decisionImpactExplanationPresentation';
import type { EventCard } from '@/core/models/EventCard';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type {
  TomorrowRiskDomain,
  TomorrowRiskInput,
  TomorrowRiskKind,
  TomorrowRiskModel,
} from '@/core/tomorrowRisk/tomorrowRiskTypes';
import { TOMORROW_RISK_CITY_CTA } from '@/core/tomorrowRisk/tomorrowRiskConstants';

import {
  CONTENT_RUNTIME_ACTIVATION_FIRST_DAY,
  CONTENT_RUNTIME_ACTIVATION_FORBIDDEN_WORDS,
  CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS,
} from './contentRuntimeActivationConstants';
import { readContentRuntimeActivationMetaFromEvent } from './contentRuntimeActivationMapper';
import type {
  ContentRuntimeActivationEventMeta,
  ContentRuntimeActivationPackId,
} from './contentRuntimeActivationTypes';

const CRA_EVENT_ID_RE =
  /^cra_(district_pack_one|vehicle_route_pack_one|container_environment_pack_one)_(.+)_d(\d+)$/;

const WIRING_FORBIDDEN_WORDS = [
  ...CONTENT_RUNTIME_ACTIVATION_FORBIDDEN_WORDS,
  'pack',
  'metadata',
  'runtime',
  'activation',
  'variant',
  'candidate',
  'ceza',
  'başarısız oldun',
  'panik',
  'felaket',
  'viral',
  'trend oldu',
] as const;

export type ContentPackEchoSurfaceLines = {
  ece: string;
  social: string;
  report: string;
  hub: string;
  tomorrow?: string;
};

function normalizeLine(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function districtLabel(meta: ContentRuntimeActivationEventMeta): string {
  return getNeighborhoodDisplayName(meta.districtId);
}

function domainForPackId(packId: ContentRuntimeActivationPackId): string {
  if (packId === 'vehicle_route_pack_one') return 'route';
  if (packId === 'container_environment_pack_one') return 'container';
  return 'district';
}

function inferDomainFromMeta(meta: ContentRuntimeActivationEventMeta): string {
  const raw = meta.domain.toLocaleLowerCase('tr-TR');
  if (raw.includes('route') || raw.includes('vehicle')) return 'route';
  if (raw.includes('container') || raw.includes('environment')) return 'container';
  if (raw.includes('social')) return 'social';
  if (raw.includes('crisis')) return 'crisis';
  return domainForPackId(meta.packId);
}

export function sanitizePackFacingCopy(text: string, fallback: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;
  const haystack = normalized.toLocaleLowerCase('tr-TR');
  if (WIRING_FORBIDDEN_WORDS.some((word) => haystack.includes(word))) {
    return fallback;
  }
  if (
    haystack.includes('district pack') ||
    haystack.includes('vehicle_route_pack') ||
    haystack.includes('container_environment_pack')
  ) {
    return fallback;
  }
  return normalized;
}

export function isContentPackWiringEligibleDay(day: number): boolean {
  return day >= CONTENT_RUNTIME_ACTIVATION_FIRST_DAY;
}

export function parseContentPackEventId(eventId: string): {
  packId: ContentRuntimeActivationPackId;
  familyId: string;
  day: number;
} | null {
  const match = CRA_EVENT_ID_RE.exec(eventId);
  if (!match) return null;
  return {
    packId: match[1] as ContentRuntimeActivationPackId,
    familyId: match[2],
    day: Number(match[3]),
  };
}

export function buildSyntheticContentPackMeta(args: {
  packId: ContentRuntimeActivationPackId;
  familyId: string;
  districtId?: string;
  variantKind?: string;
}): ContentRuntimeActivationEventMeta {
  const districtId = args.districtId ?? 'merkez';
  const variantKind = args.variantKind ?? 'normal';
  return {
    packId: args.packId,
    familyId: args.familyId,
    variantId: `${args.familyId}_${variantKind}`,
    variantKind,
    domain: domainForPackId(args.packId),
    districtId,
    source: 'content_runtime_activation_lite',
  };
}

export function resolveContentPackMetaForWiring(args: {
  event?: EventCard | null;
  eventId?: string | null;
  districtId?: string | null;
  day?: number;
  eventPool?: EventCard[];
  postPilotCatalog?: EventCard[];
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
}): ContentRuntimeActivationEventMeta | undefined {
  const direct =
    args.contentPackMeta ??
    readContentRuntimeActivationMetaFromEvent(args.event) ??
    undefined;
  if (direct) return direct;

  const eventId = args.eventId ?? args.event?.id;
  if (!eventId) return undefined;

  const lookupCards = mergeContentPackLookupCards(args.eventPool, args.postPilotCatalog);
  const pooled =
    lookupCards.find((card) => card.id === eventId) ??
    (args.event?.id === eventId ? args.event : undefined);
  const pooledMeta = readContentRuntimeActivationMetaFromEvent(pooled);
  if (pooledMeta) return pooledMeta;

  const parsed = parseContentPackEventId(eventId);
  if (!parsed) return undefined;
  if (args.day != null && args.day < CONTENT_RUNTIME_ACTIVATION_FIRST_DAY) return undefined;

  return buildSyntheticContentPackMeta({
    packId: parsed.packId,
    familyId: parsed.familyId,
    districtId: args.districtId ?? args.event?.neighborhoodId ?? undefined,
  });
}

export function mergeContentPackLookupCards(
  eventPool: EventCard[] | undefined,
  postPilotCatalog: EventCard[] | undefined,
): EventCard[] {
  const seen = new Set<string>();
  const merged: EventCard[] = [];
  for (const card of [...(eventPool ?? []), ...(postPilotCatalog ?? [])]) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
}

export function makeContentPackDuplicateKey(
  meta: ContentRuntimeActivationEventMeta,
  surface?: string,
): string {
  return [
    meta.packId,
    meta.familyId,
    meta.variantKind,
    meta.districtId,
    inferDomainFromMeta(meta),
    surface ?? 'all',
  ].join(':');
}

export function isDuplicatePackLine(line: string | undefined, existingLines: string[] = []): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeLine(line);
  return existingLines.some((existing) => {
    const other = normalizeLine(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) return true;
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) return true;
    return false;
  });
}

export function buildPackCityEchoKind(
  meta: ContentRuntimeActivationEventMeta,
): CityEchoBindingKind {
  const variant = meta.variantKind.toLocaleLowerCase('tr-TR');
  if (variant.includes('crisis')) return 'crisis_prevention_echo';
  if (variant.includes('operation_era')) return 'operation_era_echo';

  if (meta.packId === 'vehicle_route_pack_one') {
    if (
      meta.resourceFatigueIntent ||
      meta.vehicleMaintenanceIntent ||
      variant.includes('fatigue') ||
      variant.includes('resource')
    ) {
      return 'vehicle_fatigue_echo';
    }
    return 'route_balance_echo';
  }

  if (meta.packId === 'container_environment_pack_one') {
    if (variant.includes('recovery')) return 'recovery_momentum_echo';
    return 'container_pressure_echo';
  }

  if (meta.districtTrustIntent || variant.includes('trust') || variant.includes('social')) {
    return inferDomainFromMeta(meta) === 'social' ? 'social_trust_echo' : 'district_trust_echo';
  }

  return 'district_trust_echo';
}

function defaultDecisionMainLine(meta: ContentRuntimeActivationEventMeta): string {
  const area = districtLabel(meta);
  if (meta.packId === 'vehicle_route_pack_one') {
    return `Rota önceliği ${area} hattını rahatlattı, fakat araç yorgunluğu izleme notu bıraktı.`;
  }
  if (meta.packId === 'container_environment_pack_one') {
    return `Konteyner çevresi müdahalesi görünür hizmet etkisini artırdı; çevre baskısı yarın tekrar izlenebilir.`;
  }
  if (meta.districtTrustIntent || meta.variantKind.includes('social')) {
    return `${area} odaklı karar sosyal güveni destekledi; mahalle baskısı yarına izleme notu bıraktı.`;
  }
  return `${area} odaklı karar mahalle dengesini destekledi; görünür hizmet etkisi korunmalı.`;
}

function defaultDecisionTomorrowLine(meta: ContentRuntimeActivationEventMeta): string | undefined {
  const area = districtLabel(meta);
  if (meta.tomorrowPreview?.trim()) {
    return meta.tomorrowPreview;
  }
  if (meta.packId === 'vehicle_route_pack_one') {
    return `Yarın ${area} hattında rota dengesi tekrar izlenebilir.`;
  }
  if (meta.packId === 'container_environment_pack_one') {
    return `${area} konteyner çevresi yarına izleme notu olarak kaldı.`;
  }
  if (inferDomainFromMeta(meta) === 'social') {
    return 'Sosyal nabız olumlu, fakat aynı mahallede hizmet görünürlüğü sürmeli.';
  }
  return `${area}'te güven toparlanıyor; görünür hizmet etkisi korunmalı.`;
}

export function buildDecisionImpactLineFromPackMeta(
  meta?: ContentRuntimeActivationEventMeta,
): string | undefined {
  if (!meta) return undefined;
  const fallback = defaultDecisionMainLine(meta);
  const fromMeta = meta.resultEcho?.trim();
  return sanitizePackFacingCopy(fromMeta ?? fallback, fallback);
}

export function buildTomorrowRiskLineFromPackMeta(
  meta?: ContentRuntimeActivationEventMeta,
): string | undefined {
  if (!meta) return undefined;
  const fallback = defaultDecisionTomorrowLine(meta);
  if (!fallback) return undefined;
  return sanitizePackFacingCopy(fallback, fallback);
}

export function buildCityEchoLineFromPackMeta(
  meta?: ContentRuntimeActivationEventMeta,
  surface: keyof ContentPackEchoSurfaceLines = 'social',
): string | undefined {
  if (!meta) return undefined;
  const lines = buildPackEchoSurfaceLines(meta);
  return lines[surface];
}

export function buildPackEchoSurfaceLines(
  meta: ContentRuntimeActivationEventMeta,
): ContentPackEchoSurfaceLines {
  const area = districtLabel(meta);
  const tomorrow = defaultDecisionTomorrowLine(meta);

  if (meta.packId === 'vehicle_route_pack_one') {
    return {
      ece: sanitizePackFacingCopy(
        meta.advisorEcho ?? '',
        `${area} rotasında rahatlama var; araç yorgunluğunu bugün zorlamadan izlemek daha güvenli.`,
      ),
      social: sanitizePackFacingCopy(
        meta.socialEcho ?? '',
        `${area} tarafında servis akışı bugün biraz daha düzenli hissedildi.`,
      ),
      report: sanitizePackFacingCopy(
        meta.reportEcho ?? '',
        `${area} rota hattında görünür rahatlama oluştu; araç yorgunluğu izleme notu olarak kaldı.`,
      ),
      hub: sanitizePackFacingCopy(
        meta.resultEcho ?? '',
        `Dünkü rota kararı ${area} hattını rahatlattı; araç yorgunluğu bugün izleniyor.`,
      ),
      tomorrow,
    };
  }

  if (meta.packId === 'container_environment_pack_one') {
    return {
      ece: sanitizePackFacingCopy(
        meta.advisorEcho ?? '',
        `${area} konteyner çevresinde müdahale etkisi görünür; çevre baskısı yarına not bırakıyor.`,
      ),
      social: sanitizePackFacingCopy(
        meta.socialEcho ?? '',
        `${area}'te konteyner çevresine yapılan müdahale bugün fark edildi.`,
      ),
      report: sanitizePackFacingCopy(
        meta.reportEcho ?? '',
        `Bugün ana operasyon ${area} konteyner çevresinde görünür hizmet etkisi üretti; çevre baskısı yarına izleme notu bıraktı.`,
      ),
      hub: sanitizePackFacingCopy(
        meta.resultEcho ?? '',
        `${area} konteyner çevresi bugün daha görünür hizmet aldı; kalan baskı izleniyor.`,
      ),
      tomorrow,
    };
  }

  return {
    ece: sanitizePackFacingCopy(
      meta.advisorEcho ?? '',
      `${area} güveni toparlanıyor; yarın aynı etkiyi sakin tempoyla korumak mantıklı.`,
    ),
    social: sanitizePackFacingCopy(
      meta.socialEcho ?? '',
      `${area} çevresinde ekiplerin görünmesi sakin bir toparlanma etkisi yarattı.`,
    ),
    report: sanitizePackFacingCopy(
      meta.reportEcho ?? '',
      `${area} mahalle hattında görünür hizmet etkisi kayda geçti; güven sinyali izleniyor.`,
    ),
    hub: sanitizePackFacingCopy(
      meta.resultEcho ?? '',
      `Dünkü mahalle kararı ${area} çevresinde güveni destekledi; etki bugün izleniyor.`,
    ),
    tomorrow,
  };
}

function decisionImpactKindFromPack(
  meta: ContentRuntimeActivationEventMeta,
): DecisionImpactExplanation['kind'] {
  if (meta.packId === 'vehicle_route_pack_one') return 'route_balance';
  if (meta.packId === 'container_environment_pack_one') return 'container_pressure';
  if (inferDomainFromMeta(meta) === 'social') return 'social_response';
  return 'district_trust_shift';
}

export function tryBuildDecisionImpactFromPackMeta(
  input: DecisionImpactExplanationInput,
): DecisionImpactExplanation | null {
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (!isContentPackWiringEligibleDay(day)) return null;

  const meta = resolveContentPackMetaForWiring({
    event: input.event,
    eventId: input.snapshot?.eventId,
    districtId: input.snapshot?.neighborhoodId ?? input.event?.neighborhoodId,
    day,
    eventPool: input.eventPool,
    postPilotCatalog: input.postPilotCatalog,
  });
  if (!meta) return null;

  const mainLine = buildDecisionImpactLineFromPackMeta(meta)!;
  const tomorrowLine = buildTomorrowRiskLineFromPackMeta(meta);
  const existing = input.existingLines ?? [];
  const sanitizedTomorrow =
    tomorrowLine && !isDuplicatePackLine(tomorrowLine, [mainLine, ...existing])
      ? sanitizeDecisionImpactTomorrowLine(tomorrowLine)
      : undefined;

  return {
    id: `decision-impact-pack-${day}-${meta.familyId}-${meta.variantKind}`,
    kind: decisionImpactKindFromPack(meta),
    title: DECISION_IMPACT_EXPLANATION_TITLE,
    mainLine: sanitizeDecisionImpactMainLine(mainLine),
    tomorrowLine: sanitizedTomorrow,
    tone: meta.variantKind.includes('recovery') ? 'recovery' : 'watch',
    relatedDomain: inferDomainFromMeta(meta),
    relatedDistrictId: meta.districtId,
    relatedResource:
      meta.packId === 'vehicle_route_pack_one'
        ? 'vehicle'
        : meta.packId === 'container_environment_pack_one'
          ? 'container'
          : undefined,
    confidence: 'high',
    sourceSignals: {
      metricKeys: input.snapshot?.metricChanges.map((metric) => metric.key) ?? [],
      operationSignalDomains: [inferDomainFromMeta(meta)],
      hasCarryOver: Boolean(input.carryOverSummary?.trim()),
      hasResourcePressure: Boolean(meta.resourceFatigueIntent),
      hasDistrictContext: true,
      hasSocialContext: Boolean(meta.districtTrustIntent),
    },
    maxVisibleLines: 3,
    shouldShowInResult: true,
    shouldEchoInReport: !isDuplicatePackLine(mainLine, existing),
    shouldEchoInHub: day > 1,
  };
}

function tomorrowRiskKindFromPack(meta: ContentRuntimeActivationEventMeta): TomorrowRiskKind {
  if (meta.packId === 'vehicle_route_pack_one') return 'route_pressure_tomorrow';
  if (meta.packId === 'container_environment_pack_one') return 'container_pressure_tomorrow';
  if (inferDomainFromMeta(meta) === 'social') return 'social_trust_recovery';
  return 'district_trust_watch';
}

function tomorrowRiskDomainFromPack(meta: ContentRuntimeActivationEventMeta): TomorrowRiskDomain {
  if (meta.packId === 'vehicle_route_pack_one') return 'route';
  if (meta.packId === 'container_environment_pack_one') return 'container';
  if (inferDomainFromMeta(meta) === 'social') return 'social';
  return 'district';
}

export function buildTomorrowRiskFromPackMeta(
  input: TomorrowRiskInput,
): TomorrowRiskModel | null {
  if (!isContentPackWiringEligibleDay(input.day)) return null;

  const meta =
    input.contentPackMeta ??
    resolveContentPackMetaForWiring({
      event: input.event,
      eventId: input.eventId ?? input.event?.id,
      districtId:
        input.carryOver?.districtId ??
        input.operationSignals?.priorityDistrictId ??
        input.event?.neighborhoodId,
      day: input.day,
      eventPool: input.eventPool,
      postPilotCatalog: input.postPilotCatalog,
    });
  if (!meta) return null;

  const mainLine = buildTomorrowRiskLineFromPackMeta(meta);
  if (!mainLine) return null;

  const existing = input.existingLines ?? [];
  if (isDuplicatePackLine(mainLine, existing)) return null;

  return {
    id: `tomorrow-risk-pack-${meta.familyId}-${input.day}`,
    kind: tomorrowRiskKindFromPack(meta),
    title: 'Yarın için izleme notu',
    mainLine,
    supportLine: 'Ana operasyon kapsamından gelen sakin bir takip satırı.',
    ctaLine: TOMORROW_RISK_CITY_CTA,
    tone: meta.variantKind.includes('recovery') ? 'recovery' : 'watch',
    priority: 'medium',
    relatedDistrictId: meta.districtId,
    relatedDomain: tomorrowRiskDomainFromPack(meta),
    relatedResource:
      meta.packId === 'vehicle_route_pack_one'
        ? 'vehicle'
        : meta.packId === 'container_environment_pack_one'
          ? 'container'
          : undefined,
    sourceSignals: ['content_pack'],
    shouldShowInReport: input.day > 1,
    shouldShowInHub: input.day >= 8,
    shouldShowAsCompact: true,
    maxVisibleLines: 2,
  };
}

export function buildContentPackEventChipLabel(
  meta: ContentRuntimeActivationEventMeta | undefined,
  day: number,
): string | undefined {
  if (!meta || !isContentPackWiringEligibleDay(day)) return undefined;

  const variant = meta.variantKind.toLocaleLowerCase('tr-TR');
  if (variant.includes('recovery')) {
    return CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.recovery_opportunity;
  }
  if (variant.includes('crisis') || variant.includes('watch')) {
    return 'İzleme notu';
  }
  if (meta.resourceFatigueIntent || variant.includes('resource')) {
    return 'Kaynak dengesi';
  }
  if (meta.districtTrustIntent || variant.includes('social')) {
    return 'Sosyal güven';
  }
  if (variant.includes('operation_era')) {
    return CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.main_operation_scope;
  }

  if (meta.packId === 'vehicle_route_pack_one') {
    return CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.route_pressure;
  }
  if (meta.packId === 'container_environment_pack_one') {
    return CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.container_area;
  }
  return CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS.district_focus;
}

export function buildContentPackReportEchoLine(
  meta: ContentRuntimeActivationEventMeta | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!meta) return undefined;
  const line = buildPackEchoSurfaceLines(meta).report;
  if (isDuplicatePackLine(line, existingLines)) return undefined;
  return line;
}
