import type { EventCard } from '@/core/models/EventCard';
import type {
  OperationPortfolioDeferRisk,
  OperationPortfolioItem,
  OperationPortfolioPressureLevel,
} from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import { getRiskLevelLabel } from '@/core/content/mockGameData';
import type { OperationPhaseKey } from '@/features/events/utils/operationPhaseTransitionPresentation';
import { HUB_PRIMARY_CTA_LABELS } from '@/features/hub/utils/centerHubNextBestActionPresentation';

import type {
  OperationPortfolioChip,
  OperationPortfolioChipTone,
  OperationPortfolioSlotCta,
  OperationPortfolioSlotEmphasis,
  OperationPortfolioSlotPresentation,
  OperationPortfolioTone,
} from './operationPortfolioTypes';

const TEXT_MAX = {
  title: 44,
  line: 88,
  badge: 18,
} as const;

export const OPERATION_PORTFOLIO_SLOT_CTA: Record<
  'inspect' | 'plan' | 'continue' | 'dispatch' | 'field' | 'result',
  string
> = {
  inspect: 'İncele',
  plan: 'Planla',
  continue: 'Devam Et',
  dispatch: 'Yönlendir',
  field: 'Sahaya Geç',
  result: 'Sonucu Gör',
};

const DEFER_RISK_LINES: Record<Exclude<OperationPortfolioDeferRisk, 'none'>, string> = {
  safe_to_watch: 'Bugün izlenebilir; yarın tekrar değerlendir.',
  pressure_may_grow: 'Beklerse baskı yarın büyüyebilir.',
  trust_may_drop: 'Beklerse mahalle sabrı düşer.',
  resource_cost_may_rise: 'Kaynak düşükken başlatılırsa ekip yorgunluğu artabilir.',
  route_may_strain: 'Bakım riski nedeniyle geç müdahale maliyeti büyütebilir.',
  social_reaction_may_grow: 'Sosyal baskı beklerse güçlenebilir.',
  opportunity_may_expire: 'Bugün çözülürse yarınki şikayet baskısı azalır.',
  memory_trace_may_harden: 'Bu iz takip edilmezse kalıcılaşabilir.',
};

function clampLine(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function priorityBadge(
  item: OperationPortfolioItem,
  index: number,
  isPrimary: boolean,
): { label: string; tone: OperationPortfolioChipTone } {
  if (isPrimary || index === 0) return { label: 'Öncelik 1', tone: 'gold' };
  if (item.pressureLevel === 'high' || item.urgency === 'high') {
    return { label: 'Kritik', tone: 'amber' };
  }
  if (item.pressureLevel === 'medium') return { label: 'Takipte', tone: 'teal' };
  return { label: 'Sakin', tone: 'sage' };
}

function riskLabelForItem(item: OperationPortfolioItem, event?: EventCard | null): string {
  if (event?.riskLevel) return getRiskLevelLabel(event.riskLevel);
  if (item.pressureLevel === 'high') return 'Yüksek risk';
  if (item.pressureLevel === 'medium') return 'Orta risk';
  return 'Düşük risk';
}

function riskTone(
  item: OperationPortfolioItem,
  event?: EventCard | null,
): OperationPortfolioTone {
  const level = event?.riskLevel;
  if (level === 'critical' || level === 'high' || item.pressureLevel === 'high') {
    return 'critical';
  }
  if (level === 'medium' || item.pressureLevel === 'medium') return 'warning';
  if (item.kind.includes('opportunity')) return 'positive';
  if (item.status === 'locked') return 'locked';
  return 'neutral';
}

function slotTone(
  emphasis: OperationPortfolioSlotEmphasis,
  item: OperationPortfolioItem,
): OperationPortfolioTone {
  if (emphasis === 'primary') {
    if (item.pressureLevel === 'high') return 'critical';
    if (item.kind === 'active_operation') return 'warning';
    return 'neutral';
  }
  if (item.pressureLevel === 'low') return 'neutral';
  return item.pressureLevel === 'high' ? 'warning' : 'neutral';
}

function operationTypeLabel(item: OperationPortfolioItem): string {
  switch (item.kind) {
    case 'active_operation':
      return 'Aktif operasyon';
    case 'risk_signal':
      return 'Risk sinyali';
    case 'district_pressure':
      return 'Mahalle baskısı';
    case 'resource_pressure':
      return 'Kaynak baskısı';
    case 'route_pressure':
      return 'Rota baskısı';
    case 'social_pressure':
      return 'Sosyal baskı';
    case 'container_pressure':
      return 'Konteyner hattı';
    case 'maintenance_warning':
      return 'Bakım uyarısı';
    case 'memory_trace':
      return 'Şehir hafızası';
    case 'recovery_opportunity':
    case 'positive_opportunity':
      return 'Fırsat';
    default:
      return 'Operasyon';
  }
}

function resourceChips(item: OperationPortfolioItem): OperationPortfolioChip[] {
  const chips: OperationPortfolioChip[] = [];
  const cost = item.capacityCost;
  if (cost.team > 0) {
    chips.push({
      id: `${item.id}_team`,
      label: cost.team >= 2 ? 'Ekip yoğun' : 'Ekip',
      tone: cost.team >= 2 ? 'amber' : 'teal',
    });
  }
  if (cost.vehicle > 0) {
    chips.push({
      id: `${item.id}_vehicle`,
      label: cost.vehicle >= 2 ? 'Araç yoğun' : 'Araç',
      tone: cost.vehicle >= 2 ? 'amber' : 'teal',
    });
  }
  if (cost.resource > 0) {
    chips.push({
      id: `${item.id}_resource`,
      label: 'Kaynak',
      tone: 'sage',
    });
  }
  if (chips.length === 0) {
    chips.push({ id: `${item.id}_light`, label: 'Hafif yük', tone: 'sage' });
  }
  return chips.slice(0, 3);
}

function districtSensitivityChip(item: OperationPortfolioItem): OperationPortfolioChip | undefined {
  if (item.capacityCost.social >= 2 || item.kind === 'social_pressure') {
    return { id: `${item.id}_social`, label: 'Sosyal hassas', tone: 'amber' };
  }
  if (item.capacityCost.districtFocus >= 2 || item.kind === 'district_pressure') {
    return { id: `${item.id}_trust`, label: 'Güven kırılgan', tone: 'warning' };
  }
  if (item.districtName) {
    return { id: `${item.id}_district`, label: item.districtName, tone: 'neutral' };
  }
  return undefined;
}

function deferRiskChip(deferRisk: OperationPortfolioDeferRisk): OperationPortfolioChip | undefined {
  if (deferRisk === 'none' || deferRisk === 'safe_to_watch') return undefined;
  const tone: OperationPortfolioChipTone =
    deferRisk === 'trust_may_drop' || deferRisk === 'social_reaction_may_grow'
      ? 'warning'
      : 'amber';
  const shortLabels: Partial<Record<OperationPortfolioDeferRisk, string>> = {
    pressure_may_grow: 'Erteleme riski',
    trust_may_drop: 'Güven riski',
    resource_cost_may_rise: 'Kaynak riski',
    route_may_strain: 'Rota riski',
    social_reaction_may_grow: 'Sosyal risk',
    opportunity_may_expire: 'Fırsat penceresi',
    memory_trace_may_harden: 'Hafıza izi',
  };
  const label = shortLabels[deferRisk];
  if (!label) return undefined;
  return { id: `defer_${deferRisk}`, label, tone };
}

export function resolveDeferRiskLine(item: OperationPortfolioItem): string {
  if (item.deferRiskLine?.trim()) return clampLine(item.deferRiskLine, TEXT_MAX.line);
  if (item.deferRisk !== 'none') {
    return clampLine(DEFER_RISK_LINES[item.deferRisk], TEXT_MAX.line);
  }
  if (item.status === 'deferred') {
    return 'Slot dolu; ertelemek yarın risk taşıyabilir.';
  }
  return 'Bugün ele alınırsa gün yükü dengelenir.';
}

export function resolveEventIdFromItem(item: OperationPortfolioItem): string | undefined {
  if (item.id.startsWith('portfolio_active_operation_')) {
    return item.id.slice('portfolio_active_operation_'.length);
  }
  const fromSource = item.sourceIds.find((id) => !id.startsWith('portfolio_') && !id.includes('day_'));
  return fromSource;
}

function resolveSlotPhase(
  item: OperationPortfolioItem,
  featuredEventId: string | null,
  eventId?: string,
): OperationPhaseKey {
  if (!eventId || featuredEventId !== eventId) return 'inspect';
  return 'inspect';
}

export function resolveSlotCta(
  item: OperationPortfolioItem,
  eventId: string | undefined,
  featuredEventId: string | null,
  isPrimary: boolean,
): OperationPortfolioSlotCta {
  const route = eventId ? `/events/${eventId}` : '/events';
  const phase = resolveSlotPhase(item, featuredEventId, eventId);

  if (item.isMapRecommended && !eventId) {
    return {
      label: 'Haritada Gör',
      route: '/risks',
      enabled: item.isActionable,
      phaseKey: phase,
    };
  }

  if (!item.isActionable) {
    return { label: 'İzle', route, eventId, enabled: false, phaseKey: phase };
  }

  if (isPrimary && featuredEventId && eventId === featuredEventId) {
    return {
      label: HUB_PRIMARY_CTA_LABELS.inspect_operation,
      route,
      eventId,
      enabled: true,
      phaseKey: 'inspect',
    };
  }

  const labelByKind: Partial<Record<OperationPortfolioItem['kind'], string>> = {
    active_operation: OPERATION_PORTFOLIO_SLOT_CTA.inspect,
    recovery_opportunity: OPERATION_PORTFOLIO_SLOT_CTA.plan,
    positive_opportunity: OPERATION_PORTFOLIO_SLOT_CTA.plan,
    maintenance_warning: OPERATION_PORTFOLIO_SLOT_CTA.plan,
  };

  return {
    label: labelByKind[item.kind] ?? OPERATION_PORTFOLIO_SLOT_CTA.inspect,
    route,
    eventId,
    enabled: true,
    phaseKey: phase,
  };
}

export function buildOperationPortfolioSlot(
  item: OperationPortfolioItem,
  index: number,
  emphasis: OperationPortfolioSlotEmphasis,
  options: {
    day: number;
    featuredEventId: string | null;
    activeEvents: EventCard[];
    avoidLines: string[];
  },
): OperationPortfolioSlotPresentation {
  const eventId = resolveEventIdFromItem(item);
  const event = eventId ? options.activeEvents.find((entry) => entry.id === eventId) : undefined;
  const isPrimary = emphasis === 'primary';
  const priority = priorityBadge(item, index, isPrimary);
  const deferLine = resolveDeferRiskLine(item);
  const normalizedDefer = normalizeLine(deferLine);
  const uniqueDefer =
    options.avoidLines.some((line) => normalizeLine(line) === normalizedDefer)
      ? `${deferLine} · ${index + 1}. slot`
      : deferLine;

  const operationName = clampLine(
    event?.title ?? item.title,
    TEXT_MAX.title,
  );
  const districtLabelRaw = item.districtName ?? event?.district;
  const districtLabel = districtLabelRaw
    ? clampLine(districtLabelRaw, TEXT_MAX.badge)
    : undefined;

  const cta = resolveSlotCta(item, eventId, options.featuredEventId, isPrimary);

  return {
    id: item.id,
    emphasis,
    operationName,
    operationTypeLabel: operationTypeLabel(item),
    districtLabel,
    riskLabel: riskLabelForItem(item, event),
    riskTone: riskTone(item, event),
    priorityBadge: priority.label,
    priorityTone: priority.tone,
    resourceChips: resourceChips(item),
    districtSensitivityChip: districtSensitivityChip(item),
    deferRiskLine: uniqueDefer,
    deferRiskChip: deferRiskChip(item.deferRisk),
    cta,
    tone: slotTone(emphasis, item),
    accessibilityLabel: clampLine(
      `${operationName}. ${priority.label}. ${uniqueDefer}. ${cta.label}.`,
      160,
    ),
  };
}

export function pressureLevelScore(level: OperationPortfolioPressureLevel): number {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}
