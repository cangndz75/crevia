import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { ActiveOperationMapPhase } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { ACTIVE_OPERATION_PHASE_LABELS } from '@/core/mapSignalCopy/mapSignalCopyConstants';
import type { DecisionAppliedEffects, DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import {
  buildMapSocialEcho,
  buildSocialDecisionEcho,
  buildSocialEchoContext,
} from '@/core/socialEcho';
import { buildPostDecisionCityReactionFromRecord } from '@/features/events/utils/postDecisionCityReactionPresentation';

import type {
  MapBottomPanelMetric,
  MapBottomPanelPresentation,
  MapGameplayMarker,
} from './mapGameplayPresentation';

export type MapBottomPanelStatusTone =
  | 'active'
  | 'resolved'
  | 'inspect'
  | 'field'
  | 'urgent'
  | 'opportunity'
  | 'neutral';

export type MapBottomPanelChip = {
  key: string;
  label: string;
  value: string;
  tone: 'risk' | 'status' | 'crew' | 'neutral';
};

export type BuildMapBottomPanelInput = {
  marker: MapGameplayMarker;
  navIndex: number;
  navTotal: number;
  activeOperationCard: ActiveOperationMapCardModel | null;
  activeOperationBinding: ActiveOperationMapBinding | null;
  activeEventCount: number;
  operationalResources: OperationalResourcesState;
  activeEvents?: EventCard[];
  recentDecisionRecord?: DecisionRecord | null;
  gameDay?: number;
};

function countReadyTeams(resources: OperationalResourcesState): number {
  return Object.values(resources.personnelGroups).reduce((acc, group) => {
    if (group.status === 'stable') return acc + 2;
    if (group.status === 'busy') return acc + 1;
    return acc;
  }, 0);
}

function resolveRiskLabel(
  marker: MapGameplayMarker,
  activeOperationCard: ActiveOperationMapCardModel | null,
): string {
  if (activeOperationCard && marker.type === 'active_event') {
    const pressure = activeOperationCard.pressureLine;
    if (pressure?.toLowerCase().includes('yüksek')) return 'Yüksek';
    if (pressure?.toLowerCase().includes('düşük')) return 'Düşük';
  }
  if (marker.severity === 'critical' || marker.severity === 'high') return 'Yüksek';
  if (marker.severity === 'medium') return 'Orta';
  return 'Düşük';
}

function findEventForMarker(
  marker: MapGameplayMarker,
  activeEvents: EventCard[] | undefined,
): EventCard | undefined {
  if (!marker.eventId || !activeEvents?.length) return undefined;
  return activeEvents.find((event) => event.id === marker.eventId);
}

function resolveEventDomain(
  marker: MapGameplayMarker,
  event?: EventCard,
): string {
  if (event?.contextTag?.trim()) return event.contextTag.trim();
  if (event?.contentCategory?.trim()) return event.contentCategory.trim();
  if (event?.category?.trim()) {
    const category = event.category.trim();
    if (category.toLowerCase() === 'social') return 'Sosyal Risk';
    if (category.toLowerCase() === 'operations') return 'Operasyon';
    return category;
  }
  if (marker.type === 'urgent_signal') return 'Acil Sinyal';
  if (marker.type === 'opportunity') return 'Fırsat';
  if (marker.type === 'resolved') return 'Operasyon Sonucu';
  if (marker.type === 'district') return 'Bölge Noktası';
  return 'Saha Operasyonu';
}

function resolveBindingPhase(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null,
): ActiveOperationMapPhase | undefined {
  if (!binding?.eventId || marker.eventId !== binding.eventId) return undefined;
  return binding.phase;
}

function resolveStatusLabel(
  marker: MapGameplayMarker,
  phase: ActiveOperationMapPhase | undefined,
  activeOperationCard: ActiveOperationMapCardModel | null,
): { label: string; tone: MapBottomPanelStatusTone } {
  if (marker.type === 'resolved' || marker.status === 'resolved') {
    return { label: 'Çözüldü', tone: 'resolved' };
  }
  if (marker.type === 'urgent_signal') {
    return { label: 'Acil', tone: 'urgent' };
  }
  if (marker.type === 'opportunity') {
    return { label: 'Fırsat', tone: 'opportunity' };
  }
  if (phase === 'before_inspect' || phase === 'inspecting') {
    return { label: 'İnceleme', tone: 'inspect' };
  }
  if (phase === 'field_active' || phase === 'field_paused' || phase === 'dispatching') {
    return { label: 'Sahada', tone: 'field' };
  }
  if (phase === 'completed' || phase === 'result_trace_available') {
    return { label: 'Çözüldü', tone: 'resolved' };
  }
  if (activeOperationCard?.phaseLabel) {
    const compact = activeOperationCard.phaseLabel.replace('İnceleme öncesi', 'İnceleme');
    return { label: compact.length > 18 ? 'Aktif' : compact, tone: 'active' };
  }
  return { label: 'Aktif', tone: 'active' };
}

function resolveDurumChip(
  marker: MapGameplayMarker,
  phase: ActiveOperationMapPhase | undefined,
): string {
  if (marker.type === 'resolved' || marker.status === 'resolved') return 'Tamamlandı';
  if (phase === 'completed' || phase === 'result_trace_available') return 'Tamamlandı';
  if (phase === 'before_inspect') return 'Bekliyor';
  if (phase === 'inspecting') return 'İnceleniyor';
  if (phase === 'planning' || phase === 'dispatch_ready') return 'Planlanıyor';
  if (phase === 'dispatching' || phase === 'field_active') return 'Sahada';
  if (marker.type === 'urgent_signal') return 'Acil';
  if (marker.type === 'opportunity') return 'Fırsat';
  return 'Aktif';
}

export function resolveMapPanelCtaLabel(params: {
  marker: MapGameplayMarker;
  phase?: ActiveOperationMapPhase;
  bindingMatches: boolean;
  activeOperationCard?: ActiveOperationMapCardModel | null;
}): string {
  const { marker, phase, bindingMatches, activeOperationCard } = params;

  if (marker.type === 'resolved' || marker.status === 'resolved') {
    return 'Sonucu İncele';
  }
  if (marker.type === 'district') {
    return marker.ctaLabel ?? 'Merkeze Git';
  }
  if (marker.type === 'opportunity') {
    return 'Fırsatı Değerlendir';
  }
  if (marker.type === 'urgent_signal') {
    return 'Olayı İncele';
  }

  if (bindingMatches && phase) {
    switch (phase) {
      case 'before_inspect':
        return 'Operasyonu Başlat';
      case 'inspecting':
        return 'Olayı İncele';
      case 'planning':
        return 'Plan Oluştur';
      case 'dispatch_ready':
      case 'dispatching':
        return 'Ekibi Yönlendir';
      case 'field_active':
      case 'field_paused':
        return 'Saha Durumunu Gör';
      case 'completed':
        return 'Sonucu İncele';
      case 'result_trace_available':
        return 'Rapor Detayını Gör';
      default:
        break;
    }
  }

  const cardLabel = activeOperationCard?.ctaLabel?.trim();
  if (cardLabel && cardLabel !== 'Operasyonu Aç') {
    return cardLabel;
  }

  if (marker.eventDetailRoute) {
    return marker.type === 'active_event' ? 'Operasyonu Başlat' : 'Detayı Aç';
  }

  return marker.ctaLabel && marker.ctaLabel !== 'Operasyonu Aç'
    ? marker.ctaLabel
    : 'Detayı Aç';
}

function formatImpactDelta(effects: DecisionAppliedEffects): string | null {
  const parts: string[] = [];
  if (typeof effects.trust === 'number' && effects.trust !== 0) {
    parts.push(`Güven ${effects.trust > 0 ? '+' : ''}${effects.trust}`);
  }
  if (typeof effects.risk === 'number' && effects.risk !== 0) {
    parts.push(`Risk ${effects.risk > 0 ? '+' : ''}${effects.risk}`);
  }
  if (typeof effects.publicSatisfaction === 'number' && effects.publicSatisfaction !== 0) {
    parts.push(
      `Halk ${effects.publicSatisfaction > 0 ? '+' : ''}${effects.publicSatisfaction}`,
    );
  }
  if (parts.length === 0) return null;
  return parts.slice(0, 2).join(' · ');
}

function resolveSummaryLine(params: {
  marker: MapGameplayMarker;
  phase?: ActiveOperationMapPhase;
  event?: EventCard;
  activeOperationCard: ActiveOperationMapCardModel | null;
  activeOperationBinding: ActiveOperationMapBinding | null;
}): string {
  const { marker, phase, event, activeOperationCard, activeOperationBinding } = params;

  if (marker.type === 'resolved' || marker.status === 'resolved') {
    return 'Olay kontrol altında, detaylar sonuç ekranında incelenebilir.';
  }
  if (phase === 'before_inspect' || phase === 'inspecting') {
    return 'İnceleme bekliyor. Önce olay sinyallerini değerlendir.';
  }
  if (phase === 'completed' || phase === 'result_trace_available') {
    return 'Risk düştü. Mahallede beklenti tamamen kapanmadı.';
  }
  if (phase === 'field_active' || phase === 'field_paused') {
    return 'Saha ekibi aktif. Durum değişirse harita sinyali güncellenir.';
  }
  if (activeOperationCard?.mapLine?.trim()) return activeOperationCard.mapLine.trim();
  if (activeOperationBinding?.mapLine?.trim()) return activeOperationBinding.mapLine.trim();
  if (event?.description?.trim()) return event.description.trim();
  if (marker.subtitle?.trim() && marker.subtitle !== 'Operasyon tamamlandı') {
    return marker.subtitle.trim();
  }
  if (marker.type === 'urgent_signal') {
    return 'Acil sinyal yükseldi. Öncelikli inceleme önerilir.';
  }
  if (marker.type === 'opportunity') {
    return 'Toparlanma fırsatı görünüyor. Erken müdahale etkisi artabilir.';
  }
  return 'Aktif operasyon bu bölgede başlıyor.';
}

function resolveContextLine(marker: MapGameplayMarker, event?: EventCard): string {
  const district =
    marker.districtName?.trim() ||
    event?.district?.trim() ||
    'Pilot Bölge';
  const domain = resolveEventDomain(marker, event);
  return `${district} · ${domain}`;
}

function resolveFooterContext(params: {
  marker: MapGameplayMarker;
  phase?: ActiveOperationMapPhase;
  teamsReady: number;
  recentDecisionRecord?: DecisionRecord | null;
  activeOperationCard: ActiveOperationMapCardModel | null;
  activeOperationBinding: ActiveOperationMapBinding | null;
}): { label: string; value: string } {
  const {
    marker,
    phase,
    teamsReady,
    recentDecisionRecord,
    activeOperationCard,
    activeOperationBinding,
  } = params;

  if (marker.type === 'resolved' || marker.status === 'resolved' || phase === 'completed') {
    const delta =
      recentDecisionRecord &&
      (recentDecisionRecord.eventId === marker.eventId ||
        marker.id.includes(recentDecisionRecord.eventId))
        ? formatImpactDelta(recentDecisionRecord.appliedEffects)
        : null;
    return {
      label: 'Son Etki',
      value: delta ?? 'Etki rapora işlendi',
    };
  }

  if (phase === 'result_trace_available') {
    return { label: 'Rapor Bekliyor', value: 'Sonuç kaydedildi' };
  }

  if (phase === 'before_inspect' || phase === 'inspecting') {
    return { label: 'Sıradaki Adım', value: 'İnceleme gerekli' };
  }

  if (phase === 'planning' || phase === 'dispatch_ready') {
    return {
      label: 'Sıradaki Adım',
      value:
        activeOperationBinding?.nextActionLine?.trim() ??
        activeOperationCard?.nextActionLine?.trim() ??
        'Plan hazırlanıyor',
    };
  }

  if (phase === 'field_active' || phase === 'field_paused' || phase === 'dispatching') {
    return { label: 'Hazır', value: `${Math.max(1, teamsReady)} ekip hazır` };
  }

  if (marker.type === 'urgent_signal') {
    return { label: 'Sıradaki Adım', value: 'Acil inceleme' };
  }

  return {
    label: 'Sıradaki Adım',
    value:
      activeOperationCard?.nextActionLine?.trim() ??
      activeOperationBinding?.nextActionLine?.trim() ??
      `${Math.max(1, teamsReady)} ekip hazır`,
  };
}

function markerMatchesDecision(
  marker: MapGameplayMarker,
  record: DecisionRecord | null | undefined,
): boolean {
  if (!record) return false;
  if (marker.eventId && marker.eventId === record.eventId) return true;
  if (marker.id.includes(record.eventId)) return true;
  const markerDistrict = marker.districtName?.trim().toLocaleLowerCase('tr-TR');
  const recordDistrict = (record.neighborhoodName ?? record.neighborhoodId)
    ?.trim()
    .toLocaleLowerCase('tr-TR');
  return Boolean(markerDistrict && recordDistrict && markerDistrict.includes(recordDistrict));
}

function buildMapPanelSocialEcho(params: {
  marker: MapGameplayMarker;
  event?: EventCard;
  recentDecisionRecord?: DecisionRecord | null;
  gameDay?: number;
  summaryLine: string;
  footerValue: string;
}) {
  const { marker, event, recentDecisionRecord, gameDay, summaryLine, footerValue } = params;
  const existingLines = [summaryLine, footerValue, marker.subtitle].filter(Boolean);
  const matchedReaction = markerMatchesDecision(marker, recentDecisionRecord)
    ? buildPostDecisionCityReactionFromRecord({ record: recentDecisionRecord! })
    : null;

  if (matchedReaction) {
    return buildMapSocialEcho({
      cityReaction: matchedReaction,
      day: gameDay ?? recentDecisionRecord?.day,
      excludeMessages: existingLines,
    }) ?? undefined;
  }

  if (!event || (gameDay ?? 1) <= 1) return undefined;

  const echo = buildSocialDecisionEcho(
    buildSocialEchoContext({
      day: gameDay ?? event.day ?? 2,
      currentEvent: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        contentCategory: event.contentCategory,
        category: event.category,
        neighborhoodId: event.neighborhoodId,
        filterTags: event.filterTags,
      },
      districtId: event.neighborhoodId,
      excludeMentions: existingLines,
    }),
  );

  return buildMapSocialEcho({
    echo,
    day: gameDay ?? event.day,
    districtName: marker.districtName ?? event.district,
    eventId: event.id,
    excludeMessages: existingLines,
  }) ?? undefined;
}

export function composeMapBottomPanelPresentation(
  input: BuildMapBottomPanelInput,
): MapBottomPanelPresentation {
  const teamsReady = countReadyTeams(input.operationalResources);
  const event = findEventForMarker(input.marker, input.activeEvents);
  const phase = resolveBindingPhase(input.marker, input.activeOperationBinding);
  const bindingMatches = Boolean(
    input.activeOperationBinding?.eventId &&
      input.marker.eventId === input.activeOperationBinding.eventId,
  );
  const status = resolveStatusLabel(
    input.marker,
    phase,
    input.activeOperationCard,
  );
  const riskLabel = resolveRiskLabel(input.marker, input.activeOperationCard);
  const durumLabel = resolveDurumChip(input.marker, phase);
  const contextLine = resolveContextLine(input.marker, event);
  const summaryLine = resolveSummaryLine({
    marker: input.marker,
    phase,
    event,
    activeOperationCard: input.activeOperationCard,
    activeOperationBinding: input.activeOperationBinding,
  });
  const footer = resolveFooterContext({
    marker: input.marker,
    phase,
    teamsReady,
    recentDecisionRecord: input.recentDecisionRecord,
    activeOperationCard: input.activeOperationCard,
    activeOperationBinding: input.activeOperationBinding,
  });
  const socialEcho = buildMapPanelSocialEcho({
    marker: input.marker,
    event,
    recentDecisionRecord: input.recentDecisionRecord,
    gameDay: input.gameDay,
    summaryLine,
    footerValue: footer.value,
  });

  const chips: MapBottomPanelChip[] = [
    { key: 'risk', label: 'Risk', value: riskLabel, tone: 'risk' },
    { key: 'status', label: 'Durum', value: durumLabel, tone: 'status' },
    { key: 'crew', label: 'Ekip', value: `${Math.max(1, teamsReady)} hazır`, tone: 'crew' },
  ];

  const metrics: MapBottomPanelMetric[] = chips.map((chip) => ({
    label: chip.label,
    value: chip.value,
  }));

  const expandedLines = [
    input.activeOperationBinding?.districtLine
      ? `Bölge: ${input.activeOperationBinding.districtLine}`
      : input.marker.districtName
        ? `Bölge: ${input.marker.districtName}`
        : null,
    phase ? `Aşama: ${ACTIVE_OPERATION_PHASE_LABELS[phase] ?? phase}` : null,
    input.activeOperationCard?.pressureLine
      ? `Son sinyal: ${input.activeOperationCard.pressureLine}`
      : input.activeOperationBinding?.pressureLine
        ? `Son sinyal: ${input.activeOperationBinding.pressureLine}`
        : null,
    input.activeOperationCard?.decisionLine ?? null,
  ].filter((line): line is string => Boolean(line));

  const primaryActionLabel = resolveMapPanelCtaLabel({
    marker: input.marker,
    phase,
    bindingMatches,
    activeOperationCard: input.activeOperationCard,
  });

  const navLabel =
    input.navTotal > 1
      ? `Olay ${input.navIndex + 1}/${input.navTotal}`
      : 'Seçili Olay';

  return {
    markerId: input.marker.id,
    navLabel,
    statusLabel: status.label,
    statusTone: status.tone,
    title: input.activeOperationCard?.title ?? input.marker.title,
    contextLine,
    summaryLine,
    socialEcho,
    subtitle: summaryLine,
    districtName: input.marker.districtName ?? input.activeOperationBinding?.districtName,
    chips,
    metrics,
    expandedLines,
    footerContextLabel: footer.label,
    footerContextValue: footer.value,
    primaryActionLabel,
    secondaryActionLabel: 'Katmanı Değiştir',
    primaryRoute:
      input.marker.eventDetailRoute ??
      input.activeOperationBinding?.eventDetailRoute ??
      input.activeOperationCard?.ctaRoute,
  };
}
